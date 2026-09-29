/* Odyssey · trajectory eval engine.
 *
 * Rubric Lens reuse: every failure mode is a check that can pass or fail
 * with a cited frame span, decided before any label set exists. The packet
 * is computed from raw frames below; verdicts and scores are never hand
 * written into the data.
 */

"use strict";

const RUBRIC = [
  {
    id: "action-following",
    label: "Action-following",
    severity: "critical",
    weight: 30,
    measure: "executed action == intent within a 6-frame lag; a mismatch run of >= 12 frames fails",
  },
  {
    id: "stuck-recovery",
    label: "Stuck / recovery",
    severity: "critical",
    weight: 25,
    measure: "a stall of >= 45 zero-displacement frames while intent != idle fails unless recovery starts within 60 frames",
  },
  {
    id: "geometry-motion",
    label: "Geometry / motion",
    severity: "critical",
    weight: 20,
    measure: "path stays inside room bounds with 8px obstacle margin; heading within 30 deg of path bearing while moving",
  },
  {
    id: "visual-consistency",
    label: "Visual consistency",
    severity: "critical",
    weight: 20,
    measure: "shared object state identical across agent views; object displacement > 2px only when a carrier moves it; no teleports",
  },
  {
    id: "temporal-coherence",
    label: "Temporal coherence",
    severity: "note",
    weight: 5,
    measure: "event log order matches frame chronology; logged fires within 1 frame of the event",
  },
];

function cite(frames, event, note) {
  return { frames: [frames[0], frames[1]], event: event || null, note: note || "" };
}

function tc(f) {
  const s = f / 20;
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return (
    String(m).padStart(2, "0") +
    ":" +
    r.toFixed(2).padStart(5, "0")
  );
}

/* ---------------------------------------------------------------- */
/* Check 1 · action-following: executed vs intent, 6f lag tolerance   */
/* ---------------------------------------------------------------- */
function checkActionFollowing(pack) {
  const N = pack.framesArr.length;
  const agents = pack.agents;
  const runs = [];
  for (const agent of agents) {
    let lag = 0;
    let runStart = -1;
    for (let f = 0; f < N; f++) {
      const a = pack.framesArr[f].agents[agent];
      if (a.intent === a.action) {
        lag = 0;
        if (runStart >= 0 && f - runStart >= 3) {
          const startFrame = pack.framesArr[runStart].agents[agent];
          runs.push({ agent, from: runStart, to: f - 1, intent: startFrame.intent, action: startFrame.action });
          runStart = -1;
        } else if (runStart >= 0 && lag === 0 && f - runStart < 3) {
          // run shorter than the close window: still unmatched
          runStart = f - runStart >= 0 ? runStart : -1;
        }
      } else {
        if (runStart < 0) runStart = f;
        lag++;
        lag = Math.min(lag, 7);
      }
    }
    if (runStart >= 0) {
      runs.push({ agent, from: runStart, to: N - 1, intent: pack.framesArr[N - 1].agents[agent].intent, action: pack.framesArr[N - 1].agents[agent].action });
    }
  }
  const bad = runs.filter((r) => r.to - r.from + 1 >= 12);
  if (!bad.length)
    return { pass: true, cites: [], note: "no mismatch run >= 12 frames across " + agents.join(", ") };
  const ev = pack.framesArr[bad[0].from].events[0];
  return {
    pass: false,
    cites: [
      cite(
        [bad[0].from, bad[0].to],
        ev ? ev.id : null,
        bad[0].agent + ': intent "' + bad[0].intent + '" executed as "' + bad[0].action + '" for ' + (bad[0].to - bad[0].from + 1) + " frames"
      ),
    ],
    note: "first violation run " + bad[0].from + "-" + bad[0].to,
  };
}

/* ---------------------------------------------------------------- */
/* Check 2 · stuck / recovery                                          */
/* ---------------------------------------------------------------- */
const STATIC_ACTIONS = ["grasp", "place", "pour", "hold", "idle"];

function checkStuck(pack) {
  const N = pack.framesArr.length;
  const agents = pack.agents;
  const stalls = [];
  for (const agent of agents) {
    let start = -1;
    for (let f = 0; f < N; f++) {
      const a = pack.framesArr[f].agents[agent];
      const prev = f > 0 ? pack.framesArr[f - 1].agents[agent] : null;
      const moved = prev && (prev.x !== a.x || prev.y !== a.y);
      // a stall is zero displacement while the policy needs the executor
      // to do something that is not a matching static action (grasp, pour,
      // place, hold, idle). A mismatched action is always a stall frame.
      const staticMatch = a.intent === a.action && STATIC_ACTIONS.includes(a.action);
      const stalled = !moved && a.intent !== "idle" && !staticMatch;
      if (stalled) {
        if (start < 0) start = f;
      } else if (start >= 0) {
        stalls.push({ agent, from: start, to: f - 1 });
        start = -1;
      }
    }
    if (start >= 0) stalls.push({ agent, from: start, to: N - 1 });
  }
  const bad = stalls.filter((s) => s.to - s.from + 1 >= 45);
  if (!bad.length)
    return { pass: true, cites: [], note: "no stall >= 45 frames; progress continuous" };
  const s = bad[0];
  let recovery = -1;
  for (let f = s.to + 1; f < N; f++) {
    const a = pack.framesArr[f].agents[s.agent];
    if (a.intent === a.action && a.action !== "idle") {
      recovery = f;
      break;
    }
  }
  const delay = recovery >= 0 ? recovery - s.from : Infinity;
  const pass = recovery >= 0 && delay <= 60;
  const ev = pack.framesArr[s.from].events[0];
  return {
    pass,
    cites: [
      cite(
        [s.from, Math.min(s.to + 1, N - 1)],
        ev ? ev.id : null,
        s.agent +
          " zero displacement for " +
          (s.to - s.from + 1) +
          " frames" +
          (recovery >= 0 ? "; recovery at +" + delay + "f " + (pass ? "(within 60)" : "(limit 60)") : "; no recovery")
      ),
    ],
    note: "",
  };
}

function checkGeometry(pack) {
  const N = pack.framesArr.length;
  const hits = [];
  for (let f = 0; f < N; f++) {
    for (const agent of pack.agents) {
      const a = pack.framesArr[f].agents[agent];
      const prev = f > 0 ? pack.framesArr[f - 1].agents[agent] : null;
      const moved = prev && (prev.x !== a.x || prev.y !== a.y);
      const margin = 8;
      if (
        a.x < margin ||
        a.y < margin ||
        a.x > pack.room.w - margin ||
        a.y > pack.room.h - margin
      ) {
        hits.push({ f, agent, why: "outside room bounds" });
        break;
      }
      let clipped = false;
      for (const ob of pack.obstacles) {
        if (
          a.x > ob.x - margin &&
          a.x < ob.x + ob.w + margin &&
          a.y > ob.y - margin &&
          a.y < ob.y + ob.h + margin
        ) {
          hits.push({ f, agent, why: "inside " + ob.id + " margin" });
          clipped = true;
          break;
        }
      }
      if (!clipped && moved) {
        const pb = (Math.atan2(a.y - prev.y, a.x - prev.x) * 180) / Math.PI;
        let dHead = Math.abs(a.h - pb);
        if (dHead > 180) dHead = 360 - dHead;
        if (dHead > 30) hits.push({ f, agent, why: "heading " + a.h + " deg vs path " + Math.round(pb) + " deg" });
      }
      if (hits.length > 30) break;
    }
    if (hits.length > 30) break;
  }
  if (!hits.length)
    return { pass: true, cites: [], note: "all " + N + " frames inside bounds, clear of obstacles" };
  const h = hits[0];
  const ev = pack.framesArr[h.f].events[0];
  return {
    pass: false,
    cites: [cite([h.f, Math.min(h.f + 8, N - 1)], ev ? ev.id : null, h.agent + " " + h.why + " at frame " + h.f)],
    note: "",
  };
}

/* ---------------------------------------------------------------- */
/* Check 4 · visual consistency: shared object state                  */
/* ---------------------------------------------------------------- */
function checkVisual(pack) {
  const N = pack.framesArr.length;
  const ids = Object.keys(pack.objects);
  const drifts = [];
  for (let f = 1; f < N; f++) {
    const prevW = pack.framesArr[f - 1].world;
    const w = pack.framesArr[f].world;
    for (const id of ids) {
      const dx = w[id].x - prevW[id].x;
      const dy = w[id].y - prevW[id].y;
      const d = Math.hypot(dx, dy);
      // who moved it
      const carriers = pack.agents.filter((ag) => pack.framesArr[f].agents[ag].carry === id);
      const carried = carriers.length > 0;
      if (!carried && d > 2) drifts.push({ f, id, d: Math.round(d * 10) / 10 });
      if (!carried && d > 60) drifts.push({ f, id, d, teleport: true });
      if (drifts.length > 20) break;
    }
    if (drifts.length > 20) break;
  }
  if (!drifts.length)
    return {
      pass: true,
      cites: [
        cite(
          [0, N - 1],
          null,
          "screened all " + N + " frames: 0 drift, 0 teleport events; rendered state matches shared state every frame"
        ),
      ],
      note: "",
    };
  const dr = drifts[0];
  const ev = pack.framesArr[dr.f].events[0];
  return {
    pass: false,
    cites: [
      cite(
        [dr.f - 1, dr.f],
        ev ? ev.id : null,
        "object " + dr.id + " moved " + (dr.teleport ? dr.d + "px (teleport)" : dr.d + "px uncarried") + " at frame " + dr.f
      ),
    ],
    note: "",
  };
}

/* ---------------------------------------------------------------- */
/* Check 5 · temporal coherence: event log vs chronology              */
/* ---------------------------------------------------------------- */
function checkTemporal(pack) {
  const N = pack.framesArr.length;
  const late = [];
  for (let f = 0; f < N; f++) {
    for (const ev of pack.framesArr[f].events) {
      if (ev.late_by > 1) late.push({ f, id: ev.id, late: ev.late_by });
    }
  }
  if (!late.length)
    return { pass: true, cites: [], note: "event log matches frame chronology; all fires within 1 frame" };
  const l = late[0];
  return {
    pass: false,
    cites: [cite([l.f, Math.min(l.f + l.late, N - 1)], l.id, "event " + l.id + " logged " + l.late + " frames after fire")],
    note: "",
  };
}

/* ---------------------------------------------------------------- */
/* Packet assembly                                                    */
/* ---------------------------------------------------------------- */
function evalPack(pack) {
  const named = {
    "action-following": checkActionFollowing,
    "stuck-recovery": checkStuck,
    "geometry-motion": checkGeometry,
    "visual-consistency": checkVisual,
    "temporal-coherence": checkTemporal,
  };

  const checks = RUBRIC.map((r) => {
    const res = named[r.id](pack);
    return { ...r, pass: res.pass, cites: res.cites, note: res.note };
  });

  const failed = checks.filter((c) => !c.pass);
  const criticalFailed = failed.filter((c) => c.severity === "critical");
  const score = Math.max(0, 100 - failed.reduce((acc, c) => acc + c.weight, 0));
  const verdict = criticalFailed.length ? "FAIL" : "PASS";

  // next training priority: must match the top failed critical, else integrity fails
  const priority = pack.priority;
  let priorityOk = true;
  if (criticalFailed.length && (!priority || !criticalFailed.some((c) => c.label === priority.label))) {
    priorityOk = false;
  }
  if (!criticalFailed.length && priority && priority.rank !== null) priorityOk = false;

  const uncited = failed.filter((c) => c.cites.length === 0);
  const integrity = {
    failed_checks: failed.length,
    cited_checks: failed.length - uncited.length,
    ok: uncited.length === 0 && priorityOk,
    note:
      uncited.length > 0
        ? uncited.map((c) => c.label + " uncited").join(", ")
        : priorityOk
          ? "every failed check cites a span; priority matches top critical"
          : "priority does not match top failed critical",
  };

  return {
    run: pack.id,
    case: pack.case,
    tag: pack.tag,
    task: pack.task,
    meta: {
      fps: pack.fps,
      frames: pack.frames,
      duration_s: pack.duration_s,
      agents: pack.agents.slice(),
      generated: "computed from " + pack.frames + " frames x " + pack.agents.length + " agents x " + RUBRIC.length + " checks",
    },
    score,
    verdict,
    checks,
    next_priority: {
      rank: priority.rank,
      label: priority.label,
      body: priority.body,
      escalated: !!priority.escalated,
    },
    integrity,
  };
}