---
title: "Launch decision"
hook: "Keep the harness local until the grader and the truthful-state gates earn release."
project: "learning-harness"
order: 5
source: "Learning Harness/Artifacts/Launch-Decision-Memo.md"
---
# Launch Decision Memo: Reasoning Atlas

**Decision:** do not release the slice to any learner on the current evidence. Keep the harness local and the gates closed: fix the open P1s, record the pinned grader's calibration run against a pre-registered bar, and take one real session — then build.

**Date:** 2026-08-28
**Basis:** the recorded evidence set: the automated suite 127/127 green; the 2026-08-27 QA pass confirming 17 defects (6 P1, 11 P2); and the first recorded grader calibration run of 2026-08-28, committed to `calibration/results/`.


## 1. The call

| Product surface | Decision | Why |
|---|---|---|
| Release to real learners | **Do not ship** | The grader's readiness run scores 0.20 recall on the class that justifies the architecture, and four open P1 gates still let the system serve false states |
| The product design (map, principle + boundary, closed taxonomy, recency) | **Keep** | The suite is green, the tier-one contracts hold, and the failure surface is the fixable part, not a wrong bet |
| The grader's verdicts | **Hold** | On the recorded baseline it marks a wrong-route learner `sound`-adjacent; the mislabeling is the worst failure this product can produce |
| The "about a minute" drafting promise | **Kill until fixed** | QA-017: a live draft ran past three minutes with no timeout, no error, no recovery |
| The QA fix list | **Becomes the release criteria** | QA-001 and QA-002 are fixed; QA-003, QA-004, QA-013, QA-017 are open and each blocks a truthful state |
| The budget transport as the official measurement | **Kill** | It scored 11/15 and flipped classes between attempts; it is a baseline probe, not the publication face |

## 2. Kill criteria, written before this run, reported against

The criteria were written before the evaluation, in the spec (`docs/superpowers/specs/2026-08-25-learning-harness-design.md`), ADR-0001, and the PRD's ship gates.

| Criterion | The bar | Result (2026-08-28) |
|---|---|---|
| The grader localizes failures, not just right/wrong | Recall on `right_answer_wrong_reason` is the headline class | **Tripped on the recorded baseline: 0.20 (1 of 5)**. Every other class passed |
| One case attempt, one session record | A retry must never duplicate | **Tripped (QA-003)**, P1, open |
| "Ready" means ready | Every Ready node must be able to produce a case | **Tripped (QA-004)**, P1, open |
| The foundations gate is the gate | A principle is eligible only when every presupposed node is statement-sound | **Tripped at QA time (QA-002), fixed** in `selectNode.ts` |
| Review-flagged content never cases | A disputed node leaves the ready set | **Tripped at QA time (QA-001), fixed** in `selectNode.ts` |
| Revision never mixes scopes | Purpose revision replaces or reconciles the area | **Tripped (QA-013)**, P1, open |
| The app fails loud and recovers | Every async surface has a timeout and a retry that preserves input | **Tripped (QA-017)**, P1, open |

Of the seven: two tripped then fixed, four tripped and open, one held. The survivors are all the same family — truthfulness of the state the learner is served.

## 3. Why the grader's recall controls release

The system's only advantage over a quiz app is the false-confidence trap. The calibration set embeds it five times: a learner who reaches the right number by reasoning that does not generalize, and whose correct verdict is `right_answer_wrong_reason`. The recorded budget baseline got it once in five.

Where the others went:

- one down `wrong_rule` — taught a neighbouring rule that was not the one they invoked;
- one down `execution_slip` — told their reasoning "held" and the mechanics slipped: the exact lie the class exists to prevent;
- one down `foundation_missing` — a redirect to a foundation that is actually solid, a wasted trip;
- one was rejected by the schema's validation — which is the guard working, and the only row that behaved as designed.

For the learner the first three are silent: a `sound` on a fragile route promotes both axes and the map's ready set, and the trap is re-encoded as a correct answer. That is not a bug in one fixture; it is the core contract, observed on the instrument.

**Stated at the same weight:** this number comes from the budget transport (`z-ai/glm-5.3-flash`), which the user chose for this run. The pinned grader (`claude-opus-5`, `grader-v4`) has not been calibrated. The result is a baseline and a fact about the process — "record a run" — not a verdict on the pinned grader. If the pinned run passes its bar, the decision moves; that is the point of recording before release.

## 4. What would change the decision, in order

1. **Record the pinned grader's calibration on the same 15 fixtures**, with a recall bar pre-registered before the run (this memo's criterion is that the bar exist before the numbers do).
2. **Close the four open P1s**: QA-003 (idempotency), QA-004 (ready-category), QA-013 (revision scope), QA-017 (draft timeout/recovery). Rerun the 2026-08-27 QA pass to re-verify the full list.
3. **Add the stability arm**: three identical runs on the cheapest tier, pairwise agreement recorded. Two attempts have already differed — `biotech-rnd` and `depreciation` flipped class or verdict between the first attempt and the recorded run. Verdict instability is a grader-readiness metric on its own.
4. **Take one real session.** The live DB holds zero sessions. QA-017 is the only blocker between this code and that first datum.

## Kept and killed

**Keep:**
- The architecture: map-first, boundary as the load-bearing unit, closed taxonomy with mandatory spans, recency-state semantics (ADR-0001).
- The `key_disputed` refusal and the schema guard — the recorded run's only rejected verdict was the schema protecting a claim from an ungrounded `wrong_rule`.
- The append-only, version-pinned session log — the only instrument on which a future grader change is a replay instead of a guess.

**Kill:**
- The "about a minute" drafting promise while QA-017 is open.
- The budget tier's output as the report-grade measurement. Its value is as the baseline it recorded.

## 5. Risks if we release anyway

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| A fragile-route learner graded `sound` or `execution_slip` | High (3 of 5 on the recorded baseline) | The exact false confidence the product exists to prevent | Gated release on the pinned-grader run |
| Ready nodes that cannot case | Confirmed live (QA-004) | The learner sat right in front of an area that cannot continue | QA-004 must land first |
| Draft hangs, timeout never fires | Confirmed live (QA-017) | The first session simply never starts | Timeout + recovery is the fix |
| Retry duplicates the session count | High (QA-003) | Eval numbers silently inflated; learner sees two histories | Unique-attempt constraint |

## 8. The honest summary

- The recorded measurement is better than the result: it located the failures in the two places they live — the grader's calibration on the class that defines the architecture, and the P1 gates that let the state lie.
- The design's discipline worked. The evidence could have been invented; it was measured, twice, including a rejection that protected the learner from a fabricated claim.
- The decision today is "no release": the grader has not yet earned the burden of telling a learner they are wrong, and the code has not yet earned the burden of telling them they are right.