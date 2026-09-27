// Voice Quality Harness, CI form. Mirrors the Sierra Voice Sims gating story:
// run a suite, fail the release when a hard gate breaks, exit non-zero so a
// pipeline stops the build.
//
//   node cli.js            -> run every suite, print the scorecard
//   node cli.js <suiteId>  -> run one suite (exit 1 on BLOCK, 0 on SHIP)
//
// The "honest dual signal" invariant is asserted here in code: the recovery
// variant must turn interruption and recovery green while the ASR entity
// miss stays red. If a future change hides the ASR miss, CI fails.

const { GATES } = require("./js/gates.js");
const { SUITES } = require("./js/data.js");
const { runSuite, fmtT } = require("./js/harness.js");

function scorecard(r) {
  const pad = (s, n) => String(s).padEnd(n);
  const lines = [];
  lines.push("  " + r.suiteId + "  [" + r.decision + "]  " + r.durationMs + " ms call");
  for (const g of r.gates) {
    lines.push("    " + (g.pass ? "PASS" : "FAIL") + "  " + pad(g.label, 26) + " " + pad(g.measuredText, 18) + " | " + g.budgetText);
    for (const e of g.evidence) {
      if (e.time !== null) {
        lines.push("        evidence  " + fmtT(e.time) + "  " + e.text);
      }
    }
  }
  lines.push("  release: " + r.reason);
  return lines.join("\n");
}

let failures = 0;

if (process.argv.length > 2) {
  const id = process.argv[2];
  const suite = SUITES.find((s) => s.id === id);
  if (!suite) {
    console.error("unknown suite: " + id + ". Known: " + SUITES.map((s) => s.id).join(", "));
    process.exit(2);
  }
  const r = runSuite(suite, GATES);
  console.log(scorecard(r));
  process.exit(r.decision === "SHIP" ? 0 : 1);
}

console.log("Voice Quality Harness: synthetic call scores across " + SUITES.length + " suites");
console.log("All gates deterministic; rubric in js/gates.js is set before any run.\n");
for (const suite of SUITES) {
  const r = runSuite(suite, GATES);
  console.log(scorecard(r) + "\n");
  if (r.decision !== suite.expectedDecision) {
    console.error("MISMATCH: " + suite.id + " expected " + suite.expectedDecision + " but engine said " + r.decision);
    failures++;
  }
}

const variant = SUITES.find((s) => s.id === "noisy-with-recovery");
const base = SUITES.find((s) => s.id === "noisy-interrupted-misheard-email");
if (variant && base) {
  const rV = runSuite(variant, GATES);
  const rB = runSuite(base, GATES);
  const byId = (r, id) => r.gates.find((g) => g.id === id);
  const vInterruption = byId(rV, "interruption").pass;
  const vRecovery = byId(rV, "recovery").pass;
  const vAsr = byId(rV, "asr_entity").pass;
  const bAsr = byId(rB, "asr_entity").pass;
  const honest = vInterruption && vRecovery && !vAsr && vAsr === bAsr;
  console.log("Honest dual signal check: recovery behavior fixes interruption + recovery, ASR miss stays red -> " + (honest ? "PASS" : "FAIL"));
  if (!honest) failures++;
}

console.log(failures === 0 ? "ALL SUITES MATCH EXPECTED DECISIONS" : failures + " CHECK(S) FAILED");
process.exitCode = failures === 0 ? 0 : 1;