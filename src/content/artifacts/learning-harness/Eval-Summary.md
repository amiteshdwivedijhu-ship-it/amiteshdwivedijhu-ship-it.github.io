---
title: "Eval summary"
hook: "The committed grader run, the full confusion record, the QA findings, and what remains unmeasured."
project: "learning-harness"
order: 3
source: "Learning Harness/Artifacts/Eval-Summary.md"
---
# Eval Summary: Reasoning Atlas

Every number here comes from recorded evidence: the automated suite (127/127 green), the 2026-08-27 QA pass (17 confirmed defects, 6 P1), and the first recorded grader calibration run (2026-08-28, one run, 15 fixtures, committed report in `calibration/results/`). Nothing is estimated where it could be measured, and the two things that are *not* measured — transfer pass-rate and the official-tier grader — are labelled exactly that, because the whole project's honesty depends on the distinction.

Four terms carry the argument. A **Principle** is a rule together with the edge where it stops holding. A **Case** is a situation in which naively applying that rule gives the wrong answer because a boundary is active and unannounced. A **Diagnosis** is the grader's verdict from a closed seven-class taxonomy. The **calibration set** is a committed stack of 15 hand-written attempts with known-correct diagnoses — the instrument that grades the grader.


## 1. Headline

> The machine chain works: 127/127 suite green, a full workflow QA pass, and a calibration run recorded on 2026-08-28. The QA walk found 17 defects — 6 P1 — and the live web snapshot shows why the shared flywheel can be broken by the drafts' own latency (QA-017) and the gates' own softness (QA-002), fixed only for two of six P1s before this eval was written.
>
> The breeze: the grader — the one component that decides whether the architecture beats a quiz app — scored **11/15 accuracy and 0.20 recall on `right_answer_wrong_reason`** on its first recorded run. On the budget transport that was chosen for this run, the grader finds the learner who is right for the wrong reason once in five attempts, and > The second finding: the grader — the one component that decides whether the architecture beats a quiz app — scored **11/15 accuracy and 0.20 recall on `right_answer_wrong_reason`** on its first recorded run. On the budget transport chosen for this run, the grader finds the learner who is right for the wrong reason once in five attempts, and mislabels the other three, sending one down each of `wrong_rule`, `execution_slip`, and `foundation_missing`, while a fifth verdict is rejected outright by validation..

Restated: the machine's strongest mechanism — the false-confidence trap — is exactly the class the first calibrated grader misses. That is why the launch memo says: no learner-facing release until the pinned grader's own run is recorded.

## 2. What was measured, and how

| | |
|---|---|
| Automated suite (vitest) | 127/127 passing |
| QA workflow pass | 2026-08-27. Deterministic replay of the full journey (purpose → outline → draft → review → case → probe → diagnosis → transfer → redirect → exhaustion), alternate-path replays, a read-only pass on the real database, and a live Brave walk at desktop and 390 × 844 with an accessibility-tree read |
| Defects confirmed | 17, of which 6 P1 and 11 P2, plus 3 accessibility observations |
| P1 status at this eval | QA-001 (review-flagged node cased) and QA-002 (readiness gate preference) fixed in `selectNode.ts`; QA-003 (session duplication), QA-004 (Ready lies about eligible nodes), QA-013 (stale nodes on revision), QA-017 (draft hang) still open |
| Calibration set | 15 fixtures, 5 : 3 : 2 : 2 : 1 : 1 : 1 across `right_answer_wrong_reason` : `foundation_missing` : `key_disputed` : `sound` : `missed_boundary` : `wrong_rule` : `execution_slip` |
| Calibration run | 2026-08-28, budget transport (`z-ai/glm-5.3-flash`, `grader-v4+z-ai-glm-5-3-flash`), 15 fixtures, wall time ~16 minutes (961 s) |
| Recorded live state | 6 purposes, 6 maps, 91 nodes; **0 sessions and 0 learner states** — no completed learner session anywhere |

## 3. The calibration run: what it says, per fixture

Ordered exactly as run. PASS means the grader returned the expected class; the two codes after the dash are expected-in, got-out.

| Fixture | Expected | Got | Verdict |
|---|---|---|---|
| Right straight-line method, wrong month count | execution_slip | execution_slip | PASS |
| Capitalises all research under a matching banner | wrong_rule | wrong_rule | PASS |
| Tests depreciation policy; capitalisation itself missing | foundation_missing | foundation_missing | PASS |
| Books the deposit interest, but only once it is credited | right_answer_wrong_reason | wrong_rule | FAIL |
| Spreads the machine's cost, but thinks repayments are depreciation | right_answer_wrong_reason | (verdict rejected by validation) | FAIL — recorded as error |
| Key claims consignment stock on delivery; a sound answer excludes it | key_disputed | key_disputed | PASS |
| Tests cost of sales, but inventory-as-asset is missing | foundation_missing | foundation_missing | PASS |
| Key demands expensing the repair; a sound answer capitalises it | key_disputed | key_disputed | PASS |
| Clean bad-debt allowance estimate | sound | sound | PASS |
| Right rent figure, justified by cleared-payment timing | right_answer_wrong_reason | execution_slip | FAIL |
| Books the revenue despite doubtful collection | missed_boundary | missed_boundary | PASS |
| Tests revenue timing, but accrual itself is missing | foundation_missing | foundation_missing | PASS |
| Declines revenue, but for the wrong reason | right_answer_wrong_reason | foundation_missing | FAIL |
| Defers subscription revenue, worried about refunds | right_answer_wrong_reason | right_answer_wrong_reason | PASS |
| Clean foreign-currency translation answer | sound | sound | PASS |

**Reported totals:** accuracy 11/15; recall on `right_answer_wrong_reason` **0.20** (1 of 5).

## 4. The failure, in detail — and what it means in the product

Four of the five non-passing results are the grader reaching for a different class; the fifth is a verdict rejected by validation. The confusion, per fixture:

| True class | Got instead | Cost in the product |
|---|---|---|
| right_answer_wrong_reason | wrong_rule | The learner is sent to a *neighbour* the grader believes they invoked — the wrong location, and a transfer at the wrong boundary |
| right_answer_wrong_reason | execution_slip | The learner is told the reasoning held and only the mechanics slipped — the exact false-positive this class exists to kill |
| right_answer_wrong_reason | foundation_missing | The learner is rerouted downward to a foundation that is actually solid — a wasted redirect |
| right_answer_wrong_reason | verdict rejected (validation) | The runner records the error as `sound` (its error path); the mandate "no citation, no finding" fired at the right moment |

The failure mode is narrow and precise: **the budget grader does not believe `right_answer_wrong_reason` exists.** Every other class in the set passed — foundation_missing (3/3), key_disputed (2/2), both sound fixtures, the missed_boundary, the wrong_rule, the execution_slip — and the five rawr learners were diverted sideways: three down neighbouring classes and one rejected by validation. For a budget transport that is a compatibility finding, not a catastrophe — but it is exactly the class of error the architecture was built to detect before a learner receives a friendly wrong mark.

**Reproducibility note from the two recorded attempts:** the same budget transport graded two fixtures *differently* on the recorded run (biotech-rnd and depreciation) versus the first attempt that timed out — the second verdict differed by a class on at least two fixtures. That variance is measured by two runs, not zero: verdict instability is itself a metric of the grader's readiness, and it is reported here rather than hidden by rerunning until the summary looks cleaner.

## 5. What the suite and QA say — the second pillar

The 127/127 suite is the tier-one floor: schema contracts, the readiness gate, transition table, draft validation, and route-level behaviour over a disposable store. The QA pass then walked the actual app and found the state that the fixtures do not produce:

- The real database at QA time carried a mixed area (10 principles + 5 concept nodes) and an all-concept area — the exact content shape that breaks the "Ready means it can case" contract (QA-004).
- A retryable diagnosis duplicating the session record (QA-003) means session counts are not truthful until fixed.
- Purpose revision keeps old and new nodes side by side (QA-013); an unchanged purpose update re-regenerates the outline (QA-016).
- The draft step, expected "about a minute", held a live run for over three minutes with no error, no timeout, no recovery (QA-017) — which is why the QA's own live walk ended before any *learner* ever reached a diagnosis.

Those are all defects of the *honesty of state*, i.e. the exact property the product is selling.

## 6. Cost and latency

- The full 15-fixture calibration took **961 s wall** on the budget transport (~64 s per grade call, including two retries on the rejected verdict). That is development cost, not product cost.
- Product-side latency is dominated by the area draft — measured only as "> 3 min with no timeout" (QA-017); every case costs four short model calls; no per-case spend has been metered because no live session completed.
- The transport difference is deliberate and recorded: `grader-v4+z-ai-glm-5-3-flash` vs the pinned `grader-v4` (claude-opus-5). The official tier's run is the pending measurement; this run is the baseline and the cheaper baseline's performance.

## 7. Where this evaluation is weak — stated here, not under questioning

- **Fifteen fixtures, one voice, one subject.** All fifteen are accounting cases written (mostly) in one voice; the grader may be calibrated to that voice, not to the class.
- **The run records verdicts, not raw model transport.** No fixture-level response bodies are stored for re-grading — the run file holds expected/actual only. Cheaper than the 10-K discipline, and weaker for it.
- **The pinned grader has never been calibrated.** The recorded number belongs to the budget transport; the decision-relevant number (claude-opus-5) is still missing — the next run's output, not this one.
- **No real-learner verdict exists.** zero sessions, zero learner state. The grader has still never graded a human being.
- **Stability question prec).#** Two attempts differed on at least one fixture; three identical "clean" attempts are not recorded. This is exactly the 10-K's stability trap, unmeasured here so far.
- **Cost/latency of the real loop: unmeasured.**

## 8. What would move the needle next

1. **Record the official tier's calibration run on the same fixtures** and report the two baseline side by side — the budget tier's placement is the reference, not a verdict on the grader.
2. **Add a stability arm**: three identical runs (cheap tier), report agreement like 10-K does — before the release gate.
3. **Fix the four open P1s** (QA-003, QA-004, QA-013, QA-017) and re-run the QA pass that closes the divergence; the eval summary's headline once those pass may legitimately say "ready to pilot".
4. **Get one real session** — the first learner verdict is the missing dataset; QA-017 is the only blocker between the current code and that datum.