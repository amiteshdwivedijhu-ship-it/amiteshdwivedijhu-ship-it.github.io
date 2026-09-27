// Voice Conversation Quality Harness engine.
// Deterministic by construction: every gate is a count, a duration,
// or a normalized string comparison, computed from the annotated transcript.
// No LLM judge, no thresholds set after the run: the rubric lives in gates.js.
//
// The engine also emits release markers (spoke-over, ASR miss, readback)
// so the UI can put timestamp pins on the waveform and link them to turns.

function norm(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fmtT(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const d = Math.floor((ms % 1000) / 100);
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0") + "." + d;
}

function p95(values) {
  if (!values.length) return 0;
  const s = values.slice().sort((a, b) => a - b);
  return s[Math.max(0, Math.ceil(0.95 * s.length) - 1)];
}

const ACK_CUE = /(sorry|go ahead|pardon|excuse me|you were saying|my apologies|apologies)/i;
const REC_CUE = /\b(confirm|spell|read back|double[- ]?check|make sure|verify|let me get this right)\b/i;

function runSuite(suite, GATES) {
  const turns = suite.turns;
  const byId = {};
  turns.forEach((x) => (byId[x.id] = x));

  // 1. Latency budget: p95 agent response gap (caller turn end -> agent turn start).
  const gaps = [];
  const gapAgentTurn = {};
  for (let i = 0; i < turns.length; i++) {
    const cur = turns[i];
    if (cur.speaker !== "agent") continue;
    const prev = turns[i - 1];
    if (prev && prev.speaker === "caller") {
      gaps.push(cur.tStart - prev.tEnd);
      gapAgentTurn[gaps[gaps.length - 1]] = cur.id;
    }
  }
  const p = p95(gaps);
  const maxGap = gaps.length ? Math.max.apply(null, gaps) : 0;
  const gLat = GATES.latency;
  const latency = {
    id: "latency",
    label: gLat.label,
    pass: p <= gLat.budget,
    measuredText: "p95 " + p + " ms",
    budgetText: gLat.budgetText,
    verdict: p <= gLat.budget
      ? "p95 " + p + " ms stays inside the " + gLat.budget + " ms budget across " + gaps.length + " agent turns."
      : "p95 " + p + " ms exceeds the " + gLat.budget + " ms budget.",
    evidence: [
      { text: gaps.length + " caller-to-agent gaps measured", time: null, turnId: null },
      { text: "worst gap " + maxGap + " ms before " + gapAgentTurn[maxGap], time: gapAgentTurn[maxGap] ? byId[gapAgentTurn[maxGap]].tStart : null, turnId: gapAgentTurn[maxGap] },
    ],
  };

  // 2. Interruption handling: mishandled barge-ins.
  // Mishandled = agent spoke more than the yield budget past the caller's start,
  // or the agent's next turn never acknowledged the interruption.
  const gInt = GATES.interruption;
  const mishandled = [];
  for (const c of turns) {
    if (c.speaker !== "caller" || !c.bargeIn) continue;
    const ov = turns.find((x) => x.speaker === "agent" && x.tStart <= c.tStart && c.tStart < x.tEnd);
    if (!ov) continue;
    const continuedMs = ov.tEnd - c.tStart;
    let ackTurn = null;
    for (let j = turns.indexOf(ov) + 1; j < turns.length; j++) {
      if (turns[j].speaker === "agent") { ackTurn = turns[j]; break; }
    }
    const acked = ackTurn ? ACK_CUE.test(ackTurn.text) : false;
    if (continuedMs > gInt.yieldMs || !acked) {
      mishandled.push({ turn: c, overlap: ov, continuedMs: continuedMs, ackTurn: ackTurn, acked: acked });
    }
  }
  const interruption = {
    id: "interruption",
    label: gInt.label,
    pass: mishandled.length === 0,
    measuredText: mishandled.length + " mishandled",
    budgetText: gInt.budgetText,
    verdict: mishandled.length === 0
      ? "Every barge-in was yielded within " + gInt.yieldMs + " ms and acknowledged."
      : mishandled.length + " of " + mishandled.length + " barge-in" + (mishandled.length > 1 ? "s" : "") + " mishandled, hard budget is 0.",
    evidence: mishandled.map((m) => ({
      text: m.turn.id + " overlapped " + m.overlap.id + "; agent spoke " + m.continuedMs + " ms past the caller's start and " + (m.acked ? "acknowledged" : "did not yield (next turn " + (m.ackTurn ? m.ackTurn.id : "none") + ")"),
      time: m.turn.tStart,
      turnId: m.turn.id,
    })),
  };

  // 3. ASR / entity readback: intended vs hypothesis on critical entities only.
  const misses = [];
  const hits = [];
  for (const turn of turns) {
    for (const e of turn.entities || []) {
      const rec = { field: e.field, intended: e.intended, hypothesis: e.hypothesis, time: turn.tStart, turnId: turn.id };
      if (norm(e.intended) === norm(e.hypothesis)) hits.push(rec);
      else misses.push(rec);
    }
  }
  const total = hits.length + misses.length;
  const asr = {
    id: "asr_entity",
    label: GATES.asr_entity.label,
    pass: misses.length === 0,
    measuredText: hits.length + " / " + total + " read back",
    budgetText: GATES.asr_entity.budgetText,
    verdict: misses.length === 0
      ? "All " + total + " critical entities matched the intended reference."
      : misses.length + " critical entit" + (misses.length > 1 ? "ies" : "y") + " misread; the agent will act on the wrong value.",
    evidence: hits.map((h) => ({ text: h.field + " read back correctly", time: h.time, turnId: h.turnId }))
      .concat(misses.map((m) => ({ text: m.field + ": intended \"" + m.intended + "\", heard \"" + m.hypothesis + "\"", time: m.time, turnId: m.turnId }))),
  };

  // 4. Recovery: after an ASR misunderstanding, a readback prompt must appear
  // within the next N agent turns. Repeating the wrong value is not recovery.
  const gRec = GATES.recovery;
  let recovery;
  let recoveryPromptTurn = null;
  let windowEnd = null;
  if (misses.length === 0) {
    recovery = {
      id: "recovery",
      label: gRec.label,
      pass: true,
      measuredText: "nothing to recover",
      budgetText: gRec.budgetText,
      verdict: "No misunderstanding this run; nothing to recover, gate passes.",
      evidence: [{ text: "no ASR entity miss, no recovery required", time: null, turnId: null }],
    };
  } else {
    const trigTurn = byId[misses[0].turnId];
    const agentTurnsAfter = turns.filter((x) => x.speaker === "agent" && x.tStart > trigTurn.tEnd);
    const windowTurnsArr = agentTurnsAfter.slice(0, gRec.windowTurns);
    const found = windowTurnsArr.find((x) => REC_CUE.test(x.text));
    windowEnd = windowTurnsArr.length ? windowTurnsArr[windowTurnsArr.length - 1] : trigTurn;
    recoveryPromptTurn = found;
    recovery = {
      id: "recovery",
      label: gRec.label,
      pass: !!found,
      measuredText: found ? "prompt at " + fmtT(found.tStart) : "no prompt",
      budgetText: gRec.budgetText,
      verdict: found
        ? "Readback prompt present " + gRec.windowTurns + " agent turns after the mishear."
        : "No readback cue in the " + gRec.windowTurns + " agent turns after the mishear (checked " + windowTurnsArr.map((x) => x.id).join(", ") + ").",
      evidence: [{ text: "ASR miss trigger on " + trigTurn.id, time: trigTurn.tStart, turnId: trigTurn.id }]
        .concat(found
          ? [{ text: "readback prompt on " + found.id + ": \"" + found.text + "\"", time: found.tStart, turnId: found.id }]
          : [{ text: "no readback cue in " + gRec.windowTurns + " agent turns after the mishear; call closed or filed without verification", time: windowEnd.tStart, turnId: windowEnd.id }]),
    };
  }

  const gates = [latency, interruption, asr, recovery];
  const red = gates.filter((g) => !g.pass);
  const decision = red.length ? "BLOCK" : "SHIP";

  const facts = {
    latency: latency.pass
      ? "p95 response " + p + " ms stays within the " + gLat.budget + " ms budget"
      : "p95 response " + p + " ms breaks the " + gLat.budget + " ms budget",
    interruption: interruption.pass
      ? "no mishandled barge-ins"
      : "agent spoke over the caller at " + fmtT(mishandled[0].turn.tStart),
    asr_entity: asr.pass
      ? hits.length + "/" + total + " critical entities read back correctly"
      : misses[0].field + " misread at " + fmtT(misses[0].time) + " (heard \"" + misses[0].hypothesis + "\")",
    recovery: recovery.pass
      ? (recoveryPromptTurn ? "readback prompt at " + fmtT(recoveryPromptTurn.tStart) : "no misunderstanding to recover")
      : "no readback prompt within " + gRec.windowTurns + " agent turns of the mishear",
  };
  const reason = decision === "SHIP"
    ? "SHIP: all " + gates.length + " gates passed. " + facts.latency + ", " + facts.interruption + ", " + facts.asr_entity + ", " + facts.recovery + "."
    : "BLOCK: " + red.length + " hard gate" + (red.length > 1 ? "s" : "") + " broken. " + red.map((g) => facts[g.id]).join("; ") + ".";

  const markers = [];
  for (const m of mishandled) {
    markers.push({ kind: "interruption", time: m.turn.tStart, turnId: m.turn.id, label: "spoke over caller" });
  }
  for (const m of misses) {
    markers.push({ kind: "asr", time: m.time, turnId: m.turnId, label: m.field + " misheard" });
  }
  if (recoveryPromptTurn) {
    markers.push({ kind: "recovery", time: recoveryPromptTurn.tStart, turnId: recoveryPromptTurn.id, label: "readback prompt" });
  } else if (misses.length) {
    markers.push({ kind: "recovery-miss", time: windowEnd.tStart, turnId: windowEnd.id, label: "no readback prompt" });
  }
  markers.sort((a, b) => a.time - b.time);

  return {
    suiteId: suite.id,
    decision: decision,
    reason: reason,
    gates: gates,
    markers: markers,
    durationMs: turns[turns.length - 1].tEnd,
    turnCount: turns.length,
  };
}

if (typeof window !== "undefined") {
  window.HARNESS = { runSuite: runSuite, fmtT: fmtT, p95: p95 };
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { runSuite: runSuite, fmtT: fmtT, p95: p95 };
}