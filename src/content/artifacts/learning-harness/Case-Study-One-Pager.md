---
title: "Case study"
hook: "The learning problem, the boundary-first loop, the recorded baseline, and the no-release call."
project: "learning-harness"
order: 0
source: "Learning Harness/Artifacts/Case-Study-One-Pager.md"
---
# Case Study: Reasoning Atlas

**Role:** Product. Problem framing, core concepts, the grading design, the validation strategy, the ship decision.
**Status:** slice 1 prototype built and measured, end to end, at localhost. Not released to any learner. See the launch decision memo.
**Built from:** an agent-harness idea aimed at a person, a local-first React + SQLite loop, one pinned grader, a committed 15-fixture calibration set, and a QA pass that documented 17 confirmed defects — 6 of them P1.


## The problem

An AI agent harness turns a model's raw reasoning into reliable multi-step work. Reasoning Atlas is the same idea aimed at a person: turn a model's raw reasoning into reliable *learning* of a complex, interlocking topic. The failure it attacks is one chain, not four separate problems:

1. You never form the map of how the topic's ideas connect.
2. So you cannot tell where your understanding is thin.
3. So you do not know what to revisit.
4. So the path to competence is slow.

The map is the root, and the map is where the design must be load-bearing. The evidence that quiz tools do not reach the map sat on this machine: a `tutor` skill that quizzes a learner over an Obsidian `StudyVault` was installed and went unused, because no `StudyVault` ever got written. Nobody carves a topic into a reviewable structure by hand. If the map is going to exist, the system has to draft it and the learner has to correct it.

Why the obvious fixes fail:

- **Multiple choice leaks recognition.** The distractors hint at the answer, and recognition is not recall. Hints the learner did not earn teach nothing.
- **Grading final answers feeds false confidence.** The learner who lands the right number by fragile reasoning ("the machine costs exactly what the finance company takes from us each year") gets told they are correct, and a rule that does not generalize is promoted to `sound` on both axes. Only grading the *chain* catches that.
- **Spaced repetition without a map** schedules reviews of questions, never repairs of structure. You can revisit the same question forever and still not know what sits underneath it.

## What I built

A local-first prototype that drafts a topic into a map of principles with boundaries, has the learner verify the map, then runs a learning loop whose atomic unit is the boundary.

- Purpose → outline → deep-draft one area → the learner reviews and corrects the entries before any case runs.
- A **case** is a situation in which naively applying the rule gives the wrong answer because a boundary is active and unannounced. The learner sees the situation cold; the rule is hidden; the answer is free text.
- The app probes what the learner left implicit, the grader returns one class from a **closed seven-class taxonomy** with quoted evidence, and only then is the rule revealed.
- A failure costs a **transfer case**: same boundary, completely different surface. A break one level down triggers the only mid-session jump, a **redirect** to the presupposed node.
- Learner state is stored as **recency facts** (`untested` / `soft` / `sound` per statement and per boundary axis); the session log is **append-only with the grader version** pinned, so grader improvements are replayable, not guessed.

<pre class="mermaid">
flowchart LR
  p["Purpose"] --&gt; o["Outline"] --&gt; d["Deep-draft an area"]
  d --&gt; r["Learner reviews the map"]
  r --&gt; c["Cold case at a boundary"]
  c --&gt; q["Probe what was implicit"]
  q --&gt; g["Diagnose: closed class + quoted spans"]
  g --&gt; v["Reveal the rule and its edge"]
  v --&gt; w{"Outcome?"}
  w --&gt;|"failed"| x["Transfer case — same edge, new surface"]
  w --&gt;|"foundation missing"| down["Redirect down to the presupposed node"]
  w --&gt;|"sound"| n["Next ready principle"]
</pre>

## The five product decisions

1. **A principle with a boundary is the atomic unit, because everything reads it.** The case engine reads the boundary to aim; the grader reads `presupposes` to localize a failure downward; the grader reads `confusedWith` to name the neighbouring rule the learner reached for. Delete the map and the system stops working — the test of whether a structure is real. A graph that is only looked at is documentation; here the graph is the mechanics.
2. **Draft first, correct after.** The map is an AI-drafted proposal the learner reviews before touching a case. Reacting to a wrong map is cheaper than building a right one, and the cold start that killed the `StudyVault` disappears.
3. **Case before rule, and free prose with probes — never multiple choice.** Productive failure: the learner meets the boundary cold, and the reveal lands on a worked mind. The transfer case after the reveal tests whether the rule generalized, not whether you remember the sentence you were just told.
4. **The grader cannot quietly agree.** The class list is closed, every claim must quote the learner's verbatim text, a `foundation_missing` must name a presupposed node, and a failed parse is loud. A fluent wrong diagnosis is worse than no diagnosis, and LLM graders agree by default — the mechanisms exist because of that, not in spite of it.
5. **Recency is not mastery.** One clean case can promote both axes to `sound`; one failure softens only the axis it broke — documented in ADR-0001. That semantics is what makes the "foundations sound" readiness gate coherent, and it is what the UI is forbidden from re-labeling as a percentage.

## Results

| Question | Answer |
|---|---|
| End-to-end automated suite | 127/127 tests pass |
| QA workflow pass (2026-08-27) | The full journey exercised: purpose → outline → draft → review → case → probe → diagnosis → transfer → redirect → exhaustion, plus validation, retries, revision, persistence, mobile, a11y |
| Defects confirmed in that pass | 17: 6 P1, 11 P2, plus 3 accessibility observations |
| Readiness defects | QA-001 (review-flagged node still cased) and QA-002 (foundations-gate ignored) **fixed** in `selectNode.ts`; QA-003 (retry duplicates the session), QA-004 (non-principle nodes labeled Ready), QA-013 (stale nodes after purpose revision), QA-017 (draft hangs past "about a minute") open |
| Grader calibration set | 15 committed fixtures with known-correct diagnoses, weighted to `right_answer_wrong_reason` (5), `foundation_missing` (3), `key_disputed` (2) |
| The calibration run | Recorded once on the budget transport on 2026-08-28 — full numbers in the eval summary |
| Live persisted state | 6 purposes, 6 topic maps, 91 nodes, no completed learner session |
| Real learners | 0. The QA live run could not complete a session; the live draft step hung (QA-017) |

## The decision

Do not release the slice to a single learner until the readiness gates are airtight and the grader's calibration bar is evaluated against a recorded run.

The QA pass showed the system's honest weakness is not the learning design — which is the strongest part — it is the *truthfulness of the served state*. The live draft hung for over three minutes with no timeout or recovery (QA-017); retries could double-record a session (QA-003); the map labeled concept nodes Ready while it could not case them (QA-004); revision kept stale and new nodes side by side (QA-013). Until the gates close, "foundations sound" and "Ready" are claims about the map that can be false. A system whose core claim is the truthfulness of these states cannot ship with its gates open.

Separately: the grader — the system's only decisive component — has never graded a real learner. Every diagnosis so far is a fixture. The first real session is the next data point the whole project moves on, and QA-017 is what prevents it from being taken.

## Three results that contradicted my own arguments

Reported as such, because a project where every hypothesis lands was not really tested.

1. **I argued the review step would be the friction point.** It is not; the draft step is. The live UI copy said "about a minute" and the draft ran past three minutes with the UI disabled, no error, no recovery — the run therefore never reached the parts of the system whose correctness I had rehearsed. My estimate of where the friction lives was wrong at the first measurement.
2. **I treated the fixture suite as the stress instrument.** The real database was the sharper one. A read-only inspection found mixed areas the fixtures never produce — 10 principles + 5 concept nodes in one real area — the exact content shape that makes the "Ready" label lie (QA-004). The fixture suite passes; the real data caught what the fixtures could not exercise.
3. **I believed the readiness gate would hold, so the selector treated it as a preference.** The QA showed the selector drafting from a foundation-untested downstream node whenever it was the only candidate — the designed behavior if the gate is a preference; a contradiction of the product by its own selector. The fix removed the fallback.

## What this project established

- A product spec whose vocabulary is not negotiable and maps 1:1 to the machinery: a node without a boundary cannot case, "foundations sound" is defined as the gate, "sound" is defined as the last verdict.
- A measurement instrument for the grader — 15 committed fixtures with known answers, reporting a class-matrix, not an estimate.
- Proof of the false-confidence trap as a class: right_answer_wrong_reason is the head metric because it is a quiz app's maximum.

## What I would defend

- The boundary unit: every field of the node is load-bearing for some read; nothing decorative.
- Recency semantics: it is what lets "sound," "soft," and "untested" be honest one-verdict facts instead of soft mastery claims.
- Append-only version-pinned sessions: future grader improvements are replayable.