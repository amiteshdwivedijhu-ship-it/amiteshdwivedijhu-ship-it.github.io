---
title: "Metric design"
hook: "Why recall on right-answer-wrong-reason controls the decision, and why accuracy can hide the failure."
project: "learning-harness"
order: 2
source: "Learning Harness/Artifacts/Metric-Design.md"
---
# Metric Design: Reasoning Atlas

**Purpose:** show how the metrics were chosen, why each one is hard to game, and which ones I do not trust.

Four terms carry the argument. A **Principle** is a node of subject truth: a rule together with the edge where it stops holding. A **Case** is a situation in which naively applying the rule gives the wrong answer because a boundary condition is active and not announced. A **Diagnosis** is the grader's verdict from a closed seven-class taxonomy. The **calibration set** is a committed stack of hand-written attempts, each with a known-correct diagnosis — the instrument that grades the grader.


## 1. The rule I used: sort every metric by how much it rests on

Every metric sits in one of three tiers, and the tiers are reported in that order — the same rule as the 10-K extraction project. A figure that came out of counting is a different kind of object from one that came out of an opinion, even when both are printed to two decimals.

1. **Needs no human judgment.** Counting, schema checks, and rule enforcement. Closed taxonomy, required quoted spans, required redirect ids. No one's opinion enters, so nothing circular gets in. These carry the weight.
2. **Rests on judgment.** Somebody, or some model, decided what the right answer was. The grader's verdicts against the calibration set live here. The number is only as good as the judge and inherits every blind spot.
3. **Rests on outcomes.** What did the learner do next — did a transfer case at the same boundary succeed? None of this is measured yet, and the documents say so explicitly.

<pre class="mermaid">
flowchart TD
  m["A metric"] --&gt; q{"What does it rest on?"}
  q --&gt;|"counting and rules"| t1["Needs no human judgment. These carry the weight"]
  q --&gt;|"a model's opinion"| t2["Rests on judgment. Only as good as the grader"]
  q --&gt;|"what the learner did next"| t3["Rests on outcomes. Not measured yet"]
</pre>


## 2. Tier one: metrics that need no human judgment

| What it asks | Design answer | Why it cannot be gamed |
|---|---|---|
| Can a diagnosis ship with no evidence? | No | The schema rejects any non-`sound` class without quoted spans, and requires every claim to cite the learner's verbatim text. |
| Can the grader refuse to classify? | No | The class list is closed (`z.enum`). There is no "unsure" bucket. A failed parse retries once and then fails loudly — it is never silently defaulted to `sound`. |
| Can a `foundation_missing` lack a redirect? | No | The schema requires a `redirectNodeId` drawn from the node's own `presupposes`. |
| Can a case come from a node that is not ready? | No | The selector draws only from `principle` nodes, excludes every review-flagged node, and requires every presupposed node's statement confidence to be `sound`. That gate is unit-tested; QA-002 caught it being treated as a preference. |
| Can one case attempt record two sessions? | **Not enforced today** | QA-003 confirmed a retry appends a second session record. It is an open P1 gate. Reporting the gap is itself part of the design. |
| Is learner state purely mechanical? | Yes | The transition table maps each class to exactly which axis softens, and ADR-0001 pins the semantics ("confidence is a recency fact") so the table cannot drift into a wish. |
| Can a draft enter the map incomplete? | No | A drafted node with no boundary or characteristic error is held for completion in review, never stored as a ready entry. |

These are the load-bearing checks. Most of them hold today; one (idempotent session records) does not, and it is reported at full weight rather than being footnoted, because it inflates the only tier-one count that feeds the outcome story.


## 3. Calibration: the grader's measurement, and its known weakness

The grader's verdicts are judged against hand-written fixtures: 15 attempts, each with a known-correct class, weighted toward the classes that decide whether the system works.

| Expected class | Count |
|---|---|
| `right_answer_wrong_reason` | 5 |
| `foundation_missing` | 3 |
| `key_disputed` | 2 |
| `sound` | 2 |
| `missed_boundary` | 1 |
| `wrong_rule` | 1 |
| `execution_slip` | 1 |

Why the weight is where it is:
- `right_answer_wrong_reason` is the false-confidence trap — the learner who lands the right decision by reasoning that does not generalize, and must not be told "correct."
- `foundation_missing` is the break one level down — the grader must send the learner *downward* instead of diagnosing the surface answer.
- `key_disputed` is the case-key honesty test — the key is deliberately wrong, and the correct output is a review flag on the node, never a wrong mark on the learner.

**The known weakness, stated up front:** the expected labels were written by the same hands that wrote the app, about one subject (accounting — the only one of the three target subjects with an external answer key), in essentially one voice. All fifteen fixtures are accounting cases. A grader systematically wrong in the same direction will pass. This is a floor, not a certificate.

What I do not trust even at 15/15: the standard error on 15 samples is huge, and one mislabeled fixture shifts the whole sweep line. The calibration set is a floor test, not an accuracy certificate.

**How the run is recorded:** every fixture is a committed JSON with the answer and expected class inside; the report prints the pass/fail per fixture, the grader version, accuracy, and recall on the headline class. The same report is written verbatim into the eval summary. No rerun, no re-roll. "Not to know what the measurement would be before running it" is the same discipline as the other portfolio projects.

## 4. Why the headline is a recall number on `right_answer_wrong_reason`, not an accuracy number

Accuracy is the friendly number. It counts the two easy `sound` fixtures as hard as the five trap fixtures, and 10/15 hides which ten. Recall on the one class is the number that decides whether the case-law architecture has an advantage over a quiz app.

The mechanism is the false positive on teaching:

- The five trap fixtures are learners who landed the right number by a fragile route — booking the repayment as depreciation, recognizing revenue at signature, treating the payment date as the earning date.
- A grader that calls those `sound` is worse than a grader that misses a boundary elsewhere. The learner walks away confident with a rule that does not generalize; both confidence axes go `sound`; the node enters the ready queue with misinformation; nobody knows.
- Accuracy cannot see the difference. Nothing in "10 of 15 right" says whether the wrong five include all five traps.

So the report carries one headline number — recall on `right_answer_wrong_reason` — and the full 7×7 confusion matrix next to it. The off-diagonal entries are product defects even when the class is right: a `foundation_missing` answered as `wrong_rule` still recorded as a miss, it sends the learner to a neighbouring rule instead of down to the foundation.

## 5. Guard metrics: the ones that stop gaming

| Primary metric | How you could game it | The metric that catches you |
|---|---|---|
| Grader accuracy | Always return `sound` | Recall on `right_answer_wrong_reason`: 0 of 5. The headline fails |
| Grader accuracy | Always return `foundation_missing` | 12 of 15 are wrong, and the schema requires a `redirectNodeId` naming a presupposed node — something the class cannot fabricate |
| Grader accuracy | Always return `key_disputed` | 13 of 15 wrong and the product consequence is dramatic: every node review-flagged, the map never leaves review |
| Fixture recall on the trap class | Memorize the fixture voice | A second, independent fixture voice in the next pass; the graders read the set cold; the same run is never used to tune the grader |
| Count of sessions being measured | Duplicate attempts on retry | Idempotency gate (QA-003). Until it lands, session counts are not tier-one data |

One more guard is structural, not numeric: **the grader cannot decline.** There is no "could not judge" escape hatch, because a grader that declines on hard cases would look conservative and be useless — the same trick the 10-K grader stopped playing only when its instructions were rebuilt. When the grader cannot commit, it must fail loudly, and a fired parse shows up in the run log, not in an average.

## 6. The controls that actually found defects

**A known-pass workflow, replayed.** The deterministic end-to-end replay of the canonical journey — purpose, outline, draft, review, case, probe, diagnose, transfer/redirect/advance, exhaustion — is what exposed the idempotency defect: the same payload submitted twice produced two session records.

**A known-null state, seeded.** The QA pass deliberately exercised the alternate paths — zero probes and blank probe responses are accepted, purpose lookup errors become blank form, retry after failed generation loses the transfer/redirect target, an unchanged purpose regenerates the outline. These are negative controls: each is a "should never happen" that the run confirmed happening.

**The real database, read-only.** QA read the persisted state without writing. That read found areas in production data that the fixtures never produce — a mixed area (10 principles + 5 concept nodes) and a pure concept area — which is the exact pollution that makes the "Ready means it can case" contract fail (QA-004). The fixture suite passes on fixtures; the real data is what reveals the fixture suite was missing.

## 7. Metrics I could not report, and why

- **The grader against real learners.** Zero sessions exist in the live store (`sessions` and learner state are empty tables). Every diagnosis so far is fixture-based. The live run that would have been the first real pass blocked at area drafting (QA-017) and never reached a diagnosis.
- **Transfer pass rate** — whether the learner's next solve at the same boundary lands after the reveal. This is the actual proof the reveal works, and it is unmeasurable until learners complete sessions, which has not happened.
- **Cost per case.** Four model calls per case, plus an area draft, probes, and transfers — the true spend was never metered because no session completed in the live run. The one measured latency fact is the area draft exceeding its promise ("about a minute" stretched past three minutes in the live run, QA-017).
- **No learner-facing outcome metric at all**, by design: confidence is recorded as `untested / soft / sound` — recency facts — and the product is forbidden from converting them into a percentage.

## 8. What I would change next time

1. **Pre-register the pass/fail bar before the calibration run.** The calibration run should have had a decision rule written before it was run. Without one, the only honest position is "measured, evaluated against no prior." That discipline comes next.
2. **Build a second answer voice in the fixtures.** Fifteen answers written by one hand in one voice let the grader learn the voice. The next revision adds an independent voice.
3. **Report the confusion matrix everywhere, not just the accuracy.** The matrix is where the product defects live; the accuracy is where they hide.
4. **Fix the session idempotency gate before more grader work.** A tier-one metric that can be inflated by a retry is disqualifying for the number it feeds; the fix is bounded and testable.
5. **Add a transfer-case fixture.** No known-answer fixture for "learner correct after second attempt" exists. That is the single most important unknown outcome, currently unbuilt.