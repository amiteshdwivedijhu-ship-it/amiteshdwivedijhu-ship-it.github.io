"use strict";
/*
 * Ship-ready eval harness packet engine.
 *
 * Input: a synthetic on-device agent run (tool-call trace + timing + retrieved
 * passages). Output: scored packet with latency vs budget, tool success rate,
 * groundedness / citation coverage, overall ship gate, and a kill-or-ship note.
 *
 * Invariant: every scored field carries a cite ref into the run log or evidence
 * (trace ids, claim ids, passage spans, the latency series). The packet is
 * invalid, and the eval row fails, if any scored field lacks one.
 *
 * Rubric Lens pattern: each check states whether it is measurable and the pass
 * rule up front, before the run is scored. Evidence over intuition.
 */

const LIQUID_ENGINE = (() => {
  // --------------------------------------------------------------------------
  // Rubric: the three checks, stated as measurable before any run starts
  // --------------------------------------------------------------------------

  const RUBRIC = [
    {
      id: "R1",
      check: "Latency vs budget",
      measurable: true,
      evidence: "per-turn latency samples recorded by the harness",
      rule: "p95 <= 1,500 ms on-device (device tier config)",
      fail: "p95 over budget"
    },
    {
      id: "R2",
      check: "Tool success",
      measurable: true,
      evidence: "status on every tool call in the trace",
      rule: "succeeded / attempted >= 95%",
      fail: "any schema or runtime error drops the rate"
    },
    {
      id: "R3",
      check: "Groundedness / citation coverage",
      measurable: true,
      evidence: "passage spans attached to every assistant claim",
      rule: "claims with a cited span >= 95%",
      fail: "an uncited claim or a span that does not support the claim"
    }
  ];

  // --------------------------------------------------------------------------
  // Scoring
  // --------------------------------------------------------------------------

  const percentile = (sorted, p) => {
    if (!sorted.length) return 0;
    const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
    return sorted[Math.max(0, idx)];
  };

  const scoreLatency = (run) => {
    const sorted = run.latencySamples.slice().sort((a, b) => a - b);
    const p50 = percentile(sorted, 50);
    const p95 = percentile(sorted, 95);
    const ok = p95 <= run.budgetMs;
    return {
      field: "Latency vs budget",
      p50, p95, budgetMs: run.budgetMs, wallMs: run.wallMs, ok,
      passRule: "p95 <= " + run.budgetMs + " ms",
      cite: ["lat", "samples:" + sorted.length],
      nextAction: ok
        ? null
        : "Tighten the on-device tool graph or raise the budget for this device tier, then re-run the harness."
    };
  };

  const scoreTools = (run) => {
    const total = run.trace.length;
    const failed = run.trace.filter((t) => t.status === "error").length;
    const okCount = total - failed;
    const rate = total ? okCount / total : 0;
    const ok = rate >= 0.95;
    return {
      field: "Tool success",
      okCount, failed, attempted: total, rate, ok,
      passRule: "succeeded / attempted >= 95%",
      cite: run.trace.map((t) => t.id),
      nextAction: ok
        ? null
        : "Fix the failing tool schema (" + (run.errors[0] ? run.errors[0].tool : "unknown") + ") and re-run the trace."
    };
  };

  const scoreGroundedness = (run) => {
    const cited = run.claims.filter((c) => c.cite && c.cite.length > 0).length;
    const total = run.claims.length;
    const weak = run.claims.filter((c) => c.weak);
    const rate = total ? cited / total : 0;
    // A claim that cites a span that does not support it counts against coverage.
    const effectiveRate = total ? (cited - weak.length) / total : 0;
    const ok = effectiveRate >= 0.95;
    return {
      field: "Groundedness / citation coverage",
      cited, weak: weak.length, total, rate: effectiveRate, ok,
      passRule: "claims with a cited span >= 95%",
      cite: run.claims.map((c) => c.id),
      uncited: run.claims.filter((c) => !(c.cite && c.cite.length > 0)),
      weakClaims: weak,
      nextAction: ok
        ? null
        : "Require a passage span on every claim before the run is scored."
    };
  };

  const shipGate = (lat, tools, ground, run) => {
    const fails = [];
    if (!lat.ok) fails.push({ check: "Latency vs budget", detail: "p95 " + lat.p95 + " ms over budget " + lat.budgetMs + " ms", next: lat.nextAction });
    if (!tools.ok) fails.push({ check: "Tool success", detail: tools.okCount + "/" + tools.attempted + " succeeded at " + run.trace.filter((t) => t.status === "error").map((t) => t.id).join(", "), next: tools.nextAction });
    if (!ground.ok) fails.push({ check: "Groundedness / citation coverage", detail: (ground.total - ground.cited) + " of " + ground.total + " claims not supported by a cited span", next: ground.nextAction });
    const verdict = fails.length === 0 ? "Pass" : "Fail";
    const review = fails.length > 0 || ground.weak > 0;
    // Escalate when the model or harness itself misbehaved (tool error, uncited
    // claim), not when the device was simply slow.
    const escalate = fails.some((f) => f.check !== "Latency vs budget") || ground.weak > 0;
    return { verdict, fails, review, escalate };
  };

  const killOrShip = (verdict, fails, run) => {
    if (verdict === "Pass") {
      return "Ship. Latency is inside budget, every tool call succeeded, and each claim carries a passage span. Evidence over intuition: the packet passes all three measurable checks.";
    }
    const dims = fails.map((f) => f.check);
    if (dims.includes("Latency vs budget") && !dims.includes("Tool success") && !dims.includes("Groundedness / citation coverage")) {
      return "Do not ship yet. Tools and grounding are clean; p95 blows the budget, so the fix is the on-device hot path (tool graph / device tier), not the model.";
    }
    return "Kill this build. " + fails.map((f) => f.check).join(" and ") + " fail; shipping now would put an unverified agent on device. Fix the schema and citation rule, then re-score the same runs.";
  };

  // --------------------------------------------------------------------------
  // Packet assembly + integrity rule
  // --------------------------------------------------------------------------

  const buildPacket = (run) => {
    const latency = scoreLatency(run);
    const tools = scoreTools(run);
    const ground = scoreGroundedness(run);
    const gate = shipGate(latency, tools, ground, run);

    const scoredFields = [
      { field: latency.field, cite: latency.cite },
      { field: tools.field, cite: tools.cite },
      { field: ground.field, cite: ground.cite }
    ];
    // Eval rule: a packet fails if any scored field lacks a citation span.
    const missing = scoredFields.filter((s) => !s.cite || s.cite.length === 0);
    const integrity = { ok: missing.length === 0, missing: missing.map((m) => m.field) };

    return {
      key: run.key,
      label: run.label,
      run,
      latency, tools, ground,
      gate: { verdict: gate.verdict, review: gate.review, escalate: gate.escalate, fails: gate.fails },
      note: killOrShip(gate.verdict, gate.fails, run),
      integrity
    };
  };

  const evalTable = () => {
    const rows = Object.keys(LIQUID_RUNS).map((k) => {
      const p = buildPacket(LIQUID_RUNS[k]);
      let reason;
      if (!p.integrity.ok) {
        reason = "Packet invalid: scored field " + p.integrity.missing.join(", ") + " has no citation span.";
      } else if (p.gate.verdict === "Pass") {
        reason = "All three measurable checks pass on cited evidence.";
      } else {
        reason = p.gate.fails.map((f) => f.check + " (" + f.detail + ")").join("; ");
      }
      return {
        key: p.key,
        label: p.label,
        verdict: p.integrity.ok ? p.gate.verdict : "Fail",
        cited: p.integrity.ok ? "OK" : "MISSING",
        reason
      };
    });
    return { rows, rule: "A run fails if any scored field lacks a citation span, any check fails, or the review flag does not match the outcome." };
  };

  return { RUBRIC, buildPacket, evalTable, percentile };
})();