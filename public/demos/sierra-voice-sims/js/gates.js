// Voice quality harness: the four hard gates, written down before any run.
// Rubric Lens reuse: each check is a yes/no with an objective measurement
// (a count, a duration, or a normalized string comparison), so every
// verdict is computable from the trace and the bar cannot move mid-run.
// No LLM judge anywhere: if a check cannot be reduced to a measurement,
// it does not ship as a gate.

const GATES = {
  latency: {
    id: "latency",
    label: "Latency budget",
    measure: "p95 agent response gap",
    unit: "ms",
    budget: 800,
    budgetText: "<= 800 ms budget",
    comparator: "p95 <= budget",
    why: "The time from the end of a caller turn to the start of the agent's next turn, collected across the call. The p95 must stay inside the budget so the agent feels responsive, never rushy.",
  },
  interruption: {
    id: "interruption",
    label: "Interruption handling",
    measure: "mishandled barge-ins",
    unit: "count",
    budget: 0,
    budgetText: "0 mishandled (hard gate)",
    comparator: "count <= 0",
    yieldMs: 400,
    why: "A barge-in is a caller turn that starts while the agent is still speaking. It is mishandled when the agent speaks more than the yield budget past the caller's start, or never acknowledges the interruption on its next turn. Callers should not have to repeat themselves.",
  },
  asr_entity: {
    id: "asr_entity",
    label: "ASR / entity readback",
    measure: "critical entities read back correctly",
    unit: "n / N",
    budgetText: "100% (hard gate)",
    comparator: "every critical entity must match",
    why: "Speech-to-text hypotheses are compared to the intended reference for critical fields only: account identifiers, emails, dates, amounts. A miss on any critical entity fails the gate, because the agent will act on the wrong value.",
  },
  recovery: {
    id: "recovery",
    label: "Recovery",
    measure: "readback prompt after misunderstanding",
    unit: "present / absent",
    budgetText: "prompt required (hard gate)",
    comparator: "recovery cue in next 3 agent turns",
    recoveryCues: /(confirm|spell|read back|double[- ]?check|make sure|verify|let me get this right|sorry[,.?!]? (let me|i want))/i,
    windowTurns: 3,
    why: "After a detected or corrected misunderstanding (an ASR miss, or a caller correction), the agent must ask the caller to verify the corrected value before acting on it. Repeating the wrong value, or closing without confirmation, is not recovery.",
  },
};

if (typeof window !== "undefined") {
  window.GATES = GATES;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { GATES };
}