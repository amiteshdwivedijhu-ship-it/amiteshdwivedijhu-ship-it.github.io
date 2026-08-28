---
title: "Tradeoff memo"
hook: "Where the product spends quality, latency, teaching-integrity, and reliability budget."
project: "learning-harness"
order: 4
source: "Learning Harness/Artifacts/Tradeoff-Memo.md"
---
# Tradeoff Memo: Reasoning Atlas

**The question this answers:** where do we spend quality, cost, latency, teaching-integrity, and reliability budget, and what do we give up in return?

Every decision below is grounded in a measured fact or an explicit "not known yet." Where a number exists, it came from the 2026-08-27 QA pass, the test suite (127/127), or the calibration run — and each says so.

Two terms recur. A **Case** is a situation in which naively applying a rule gives the wrong answer because a boundary is active and unannounced. A **Diagnosis** is the grader's verdict, one class from the closed seven-class taxonomy, every claim backed by a verbatim span of the learner's text.


## 1. Model choice: one model does everything, and the risk sits in the same family

**Decision:** the same model family drafts the map, writes the cases, and grades the learner. The grader stays pinned to the k strongest configuration (effort "xhigh", a fixed version string recorded on every session); the budget transport exists for draft, case, and calibration work where the risk is lower.

<pre class="mermaid">
flowchart LR
  map["Draft area nodes"] --&gt; case["Write cases at boundaries"]
  case --&gt; judge["Grade the reasoning"]
  same["Same model family"] -.-&gt; map
  same -.-&gt; case
  same -.-&gt; judge
  flag["Review flags + calibration set"] -.-&gt; judge
</pre>

Evidence and reasoning
- The QA/test suite and calibration fixtures are the external cross-check. The 10-K project showed two unrelated model families agreeing (kappa 0.87) and a shared-bias measurement of -0.019 — but it also built that check because the grader itself was the product there. Here the grader's verdict feeds *learning state*, which is private and has no external answer key for most subjects. So the same-family risk is managed by *mechanism*, not by a second family: the closed taxonomy, the mandatory quoted spans, the `key_disputed` class, and the review-flag loop.
- A second family was rejected as a cross-check: two models agreeing on a wrong key reads as validation and buys nothing — the wrongness is in the key, not the fluency. That is the failure `key_disputed` and the review step exist to catch.

What we give up
- Independent corroboration on a soft-key subject. The calibration set is the only external arc, and only accounting fixtures can check it. Accepted for slice 1; the design refund is that soft-key subjects (investing, Lacan) are exactly where the system must say "the learner is right, the key needs review" — and that is why `key_disputed` was built before any of them were tested.

## 2. Grader quality vs cost: quality is the only place the budget is not a choice

**Decision:** the grading call is the one call not negotiable on budget. It runs the pinned grader at full effort; the draft and case calls run on whatever tier is sitting data-quality-tested (the calibration transport exists so cheap graders can be measured before being used).

Evidence

- The main risk is acceptance: a fluent wrong diagnosis is worse than no diagnosis. The graders are agreeable by default. The per-fixture calibration reports both the class agreement and the source recall — a cheap grader that cannot run the same family's reasoning is caught there.
- Measured to date: one run on a budget transport was executed for this memo (the calibration set, 15 fixtures) — allow the numbers to live in the eval summary and the launch memo.

What we give up

- Latency. The cheapest transport any punctuality would give is not used for the grader. The alternative — a snappier grader running on a flash model — would trade the system's central claim for a faster spinner, and is rejected.

## 3. Cost of a session: the transfer case doubles every failure, by design

**Decision:** every failed diagnosis spends a second case at the same boundary — a *transfer case*, with a completely different surface. And every `foundation_missing` spends a redirect into the presupposed node. This is the single biggest per-session cost in the system, and it is spent where the binary offers nothing.

Reasoning

- The reveal is the product's only teaching moment. "Look, the learner clearly saw the boundary in a new situation" — if the learner solves the transfer, the reveal generalized; if they fail, it did not. Kill the transfer and you save money, and you lose the system's only outcome signal.
- The four-call budget per case stands: outline (once per purpose), draft (once per area), case, probes, diagnosis. Purpose shapes every case, so nothing can be cached across learners, not even for the same topic.

What we give up

- A low-cost free tier. Each hour of learning spends four to eight model calls. The product is not cost-competitive with flashcards, and it is not meant to be: the spend buys the map, the grading of reasoning, and the transfer signal. The measured numbers for actual cost/case do not exist yet — no session has run to completion in the live app (QA-017 blocked it).

## 4. Structure vs. fluency in grading: the closed taxonomy and the quoted-evidence rule

**Decision:** the grader commits to exactly one class from seven, and every claim must quote the learner's verbatim text. Any class other than `sound` without spans, or a `foundation_missing` without a named presupposed node, is rejected by schema.

Reasoning

- An open-form judgment ("the answer is partially correct, they seem to get the idea") is what an agreeable grader naturally ships. A closed commit is what a grading decision can be checked.
- The span rule is what makes the diagnosis checkable by a person: the learner can verify "this is where I'm wrong" — the evidence is a real sentence they wrote.

What we give up
- Nuance in the reported verdict. Real cases do not always decompose into the seven classes; when they do not, the run fails (loudly, and retries once) rather than improvising. A richer taxonomy is a later product — invented before the first real session would violate calibration discipline.

## 5. Reliability vs. feature completeness: the readiness gates are the product, fix them first

**Decision:** quality gating silences whole workflows until they are sound. The QA pass (2026-08-27) confirmed 6 P1 and 11 P2 defects; of those, the ones that block honest learning are the gates:

| Defect | What it is | Status |
|---|---|---|
| QA-002 | "Foundations sound" treated as a preference, not the gate that makes a principle ready | Fixed in `selectNode.ts` before this memo |
| QA-001 | A review-flagged principle still eligible for another case | Fixed in `selectNode.ts` |
| QA-003 | Retrying a diagnosis duplicates the session record | Open |
| QA-004 | Non-principle nodes labeled Ready but unable to produce cases | Open |
| QA-013 | Purpose revision keeps stale nodes alongside the new draft | Open |
| QA-017 | Area drafting blocks past "about a minute" with no timeout or recovery | Open |

The 17-defect list is the reliability budget for slice 1. All of them are small, and all degrade trust; the six P1s are the insurance that the served states are *truthful* (a recency fact is only honest if the state machine controls registration). Until QA-003 is fixed, session counts are not tier-one data, and until QA-017 is fixed, no live learner can complete a session — the actual product cannot be run.

What we give up

- The demo is not a demo. The deterministic replay passes the whole journey with the fixture paths, but a public prototype on this suite would front-prompt QA-017 to every first run. This is the launching: no public release until the gates are airtight; the suite is the release note.

## 6. Speed vs. safety in "about a minute": honest loading, no fake progress

**Decision:** every async surface shows a truthful state and a recovery action; the one measured latency fact is the area draft. The QA pass observed the draft UI stay disabled past three minutes while the copy promised "about a minute," no error, no retry, no cancel.

Evidence: QA-017 — the browser console was clean, no warning, and the database never recorded a completed draft. A slow-out has no honest fix except to time out and offer recovery; the product never did.

What we give up: fast drafts; the "instant area" claim. The deep draft is one batched model call per area with `effort: high`; making it snappy would mean shaping the map without the effort, which removes the boundary quality slice 1 needs.

## 7. Privacy vs. calibration intelligence: local data stays local

**Decision:** the store is a local single-user SQLite; no account, no sync, no telemetry. In exchange, learning data is not what powers improvements.

Reasoning:

- The four stores are purpose, map, learner, sessions — all local, all versioned. This is what "drafted for your purpose" means: the same topic yields different cases for a reading purpose than for a bookkeeping purpose, and the learner's own data is the only data in the product.
- Multi-learner calibration would need an opt-in export; nothing sends data anywhere today. A learner's reasoning and their diagnosis history are the most sensitive thing this system holds, and it holds them on disk.

**What we give up**
- Any remote-learning analytics, retention curves, or "average learner" features; benchmark numbers come from the fixtures, not from real learners. Intentional: there is not yet a single completed session, so there is nothing to analyze tonight, and there never needs to be unless the product decides to.

## 8. Summary of positions

| Axis | Position | Basis |
|---|---|---|
| Model | Single family; case-grader same-family bias managed by mechanism, not by a second model | `key_disputed`, closed taxonomy, mandatory spans, review cadence |
| Grader | Pinned, full-effort, version-stringed; budget transport measures—not substitutes | Calibration run + per-fixture report discipline |
| Session cost | Four calls minimum; transfer and foundational-cases double the expensive ones intentionally | The transfer case is the only outcome signal |
| Truthfulness of state | Readiness gates are the product; any P1 on a gate blocks release | QA-001…QA-017; gates fixed in `selectNode.ts` |
| Course content | No content library, never packaged; maps live per learner per purpose | Cold-start reasoning; the `StudyVault` evidence |
| Reliability | The suite (127/127) and the QA pass are the release note; a logged failure to parse is data, not an excuse | QA run, 2026-08-27 |
| Cost | Unmeasured until a full session runs; listed honestly as such | QA-017 blocked the first live session |
| Data | Everything local, append-only, no telemetry | Product shape: purpose-only maps, single user |