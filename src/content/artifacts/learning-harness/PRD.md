---
title: "PRD"
hook: "A map-first learning system that tests reasoning at the edge where a principle stops holding."
project: "learning-harness"
order: 1
source: "Learning Harness/Artifacts/PRD.md"
---
# PRD: Reasoning Atlas

**Owner:** Amitesh Dwivedi (Product)
**Status:** Prototype built and measured. Slice 1 runs end to end at localhost. Not released to any learner. See the launch decision memo.
**Last updated:** 2026-08-28


## 1. One line

Turn a model's drafting and grading into reliable learning of complex, interlocking topics: a map of principles with boundaries, cases aimed at those boundaries, and a diagnosis that locates exactly where a learner's reasoning broke.


## 2. The problem

An AI agent harness turns a model's raw reasoning into reliable multi-step work. Reasoning Atlas is the same idea aimed at a person: turn a model's raw reasoning into reliable learning. Complex topics fail learners through one chain, not four separate problems:

1. You never form the map of how a topic's ideas connect.
2. So you have no way to tell where your understanding is thin.
3. So you do not know what to revisit.
4. So the path to competence is slow.

The map is the root. The design targets the root and treats everything downstream as a consequence.

Why existing tools do not solve it:

- **Quiz apps test recognition and never build a map.** Multiple choice leaks hints through its distractors, and a streak of questions leaves no structure behind. Silver/wrong-answer feedback is a verdict on the answer, never a location in the learner's reasoning.
- **The authoring half is the missing half.** The evidence lives on this machine: a `tutor` skill that quizzes a learner over an Obsidian `StudyVault` was installed and never used, because the `StudyVault` never got written. No one carves a topic into a reviewable structure by hand.

The gap is not another way to ask questions. It is a system that drafts the map for the learner, lets the learner correct it, and grades the learner's chain of reasoning rather than the final answer.


## 3. Who this is for

Primary user
- One learner who needs to become genuinely good at one hard, multi-concept topic through recurring practice, on their own machine, with no account, no sync, and no shared-state machinery.

The design is exercised against three subjects with deliberately different stakes for grading:
- **Financial accounting** — an external answer key exists, so the grader can be checked.
- **Investing** — no answer key and never will be; the standard is the reasoning chain.
- **Lacanian psychoanalysis** — the softest case; the "key" is the text itself.

Deliberately designed against
- **Gamified drilling.** No hearts, XP, leagues, streak anxiety, or mastery percentages. Progress is an evidence record, not a score.
- **Grading final answers.** A right answer reached by reasoning that does not generalize is the false-confidence trap. The grading of the reasoning chain is the only thing that catches it.


## 4. What we build

The vocabulary. Six ideas carry the product. The full glossary with rejected synonyms lives in `CONTEXT.md`.

- **Topic** — the subject, typed by the learner.
- **Purpose** — the learner's goal and constraints; every generated case is shaped by it, and it stays revisable.
- **Node** — one item of subject truth: a concept, a principle, or a procedure. Slice 1 generates cases only for principles.
- **Principle** — a rule together with the edge where it stops holding. The atomic unit of the system: statement, domain, boundary, characteristic error, presupposes, confused-with, provenance.
- **Case** — a situation in which naively applying the rule yields the wrong answer because a boundary condition is active and not announced. Stored with a hidden key: active boundary, assumptions to surface, principle to invoke, tempting wrong answer.
- **Diagnosis** — the grader's verdict from a closed seven-class taxonomy, every claim backed by a verbatim span of the learner's text.

The learning loop, step by step.

1. **Purpose interview.** Topic, action-oriented goal, context. Stored, revisable mid-course.
2. **Outline.** One cheap model call turns topic + purpose into an area list; the learner picks where to begin.
3. **Deep draft.** The chosen area is drafted into nodes, a few per model call so a bad batch is retryable alone. A node with no boundary or characteristic error is flagged for review and never enters the map complete.
4. **Map review.** Before any case runs, the learner reads the principles and their edges and fixes what is wrong. Review-flagged and incomplete entries are ordered before ready ones.
5. **Cold case.** A case is generated at a principle's boundary: shaped by purpose, never the same surface twice, distance dialed by the learner's last showing at the boundary. The rule is hidden.
6. **Reasoning and probe.** Free-text answer, then up to three follow-ups about reasoning left implicit. The probes are not hints and never mention the boundary.
7. **Grade and reveal.** The grader compares the extracted reasoning chain against the key on three independent axes — decision, principle invoked, boundary noticed — and returns exactly one class. Then, and only then, is the rule revealed.
8. **Transfer or redirect.** A failure yields a new case at the same boundary with a completely different surface. `foundation_missing` drops the learner to the presupposed node — the one mid-session jump.

<pre class="mermaid">
flowchart LR
  p["Purpose"] --&gt; o["Outline into areas"]
  o --&gt; d["Deep-draft one area"]
  d --&gt; r["Review and correct the map"]
  r --&gt; c["Case at a boundary, cold"]
  c --&gt; q["Probe what was left implicit"]
  q --&gt; g["Diagnose: one class, quoted spans"]
  g --&gt; rev["Reveal the rule and its boundary"]
  rev --&gt; w{"How did it go?"}
  w --&gt;|"Failed"| t["Transfer case — same boundary, new surface"]
  w --&gt;|"Foundation missing"| red["Redirect to the presupposed node"]
  w --&gt;|"Sound"| n["Next ready principle"]
</pre>

## 5. Product decisions worth defending

**The boundary is the load-bearing unit.** The case engine reads a principle's boundary to know where to aim; the grader reads presupposes to trace a failure; the grader reads confused-with to name the neighbouring rule. Delete the map and the system stops working — the test of whether a structure is real. In a design where the graph is only something you look at, the graph is documentation.

**One principle with a boundary, one case at a time, case before rule.** This is the productive-failure design: the learner meets the boundary cold, and the reveal lands on top of a worked mind. After the reveal, a transfer case at the same boundary with a different surface tests whether the rule generalizes — not whether you remember the sentence you were just told.

**Free text with a jury of probes; never multiple choice.** A structured form tells the learner that assumptions exist — a hint they did not earn. The probe stage recovers the missing reasoning without revealing the boundary.

**A closed taxonomy with mandatory verbatim citations.** The grader cannot free-write a class that merely sounds insightful, and cannot make a claim it cannot quote. A diagnosis with no quoted span is rejected by the schema itself. These two mechanisms exist because a fluent wrong diagnosis is worse than no diagnosis: LLM graders are agreeable by default.

**`key_disputed` sleeps in the taxonomy.** The same model writes the case and its key. If it misreads the boundary, both are wrong in the same direction, and the grader would otherwise confidently mark a correct answer wrong — the worst failure this product can produce. The taxonomy therefore lets the grader say "the learner is right, the key is wrong" and flags the node for review, and the learner's state does not take the hit. This is also what makes the product usable on Lacan, where the key is soft.

**Learner state is recency facts.** Statement and boundary confidences record the verdict of the most recent graded case at the node — never a cumulative percentage. One clean case can promote both axes to sound; that is the definition under recency semantics, documented in ADR-0001 (`docs/adr/0001-confidence-is-a-recency-fact.md`). `foundation_missing` and `wrong_rule` soften only what they touch; the transition table itself is in the code, not a floating product decision.

**The grader version is pinned into every session record.** The grader is the risky component, so improving it means replaying an improved grader against past answers. The session log is append-only by design and versioned, which turns every future grader change from a guess into a rerun.

**The review step is priced honestly.** The drafts come from a model and may be wrong — the learner corrects the map as part of learning. This is the price of the case-law architecture over a purely reactive one; the alternative (reactive correction only) cannot aim at boundaries the learner never stumbles into.

## 6. What this is not

- **Not a quiz app.** No multiple choice, no score, no "incorrect", no case that reveals the rule before grading.
- **Not a scheduler, chart, or curriculum.** Spacing, interleaving, the interactive map, and source anchoring are later slices, deferred until there is history to tune them against. Slice 1 generates cases only for principles; `concept` and `procedure` stay in the schema but are not exercised.
- **Not a knowledge library.** The map is drafted per learner per purpose and then corrected by the learner. The "empty library" cold start is solved by drafting first and correcting after — not by shipping a corpus.
- **Not a mastery scoreboard.** Confidence axes are recency facts; "Sound" means "the latest graded case held," and the UI is forbidden from implying more.

## 7. Slice 1 and the honest characterization

**Stack:** TypeScript. Vite + React, SQLite for the four stores (purpose, map, learner state, append-only sessions), Anthropic SDK with Zod validation on every model response. Local-first, single user, runs at localhost.

**In slice 1:** purpose interview; scoped outline; deep-draft an area; review and correct; case, probe, diagnose, reveal; learner state; session log with the grader version recorded; a grader calibration harness (dev only), executed over a committed set of hand-written cases.

**Out:** graph visualization, scheduling, multiple topics at once, source anchoring, and `concept`/`procedure` case shapes.

Slice 1 is honestly a text app. The graph is not in it. What it buys is the answer to the question that decides the rest of the project:

> Does the grader locate failures, or does it merely sound like it does?

## 8. Success metrics

Ship gates (must pass on every candidate release; a single failure blocks)
- Recall on `right_answer_wrong_reason` over the calibration set — the headline metric, the one a quiz app cannot produce.
- The whole closed-taxonomy contract: a `foundation_missing` always carries a redirect node id; every non-sound class carries quoted spans; every response parses to exactly one class.
- Readiness gate: a principle is eligible only when every presupposed node is statement-sound; review-flagged and incomplete entries never generate cases; one case attempt never produces two session records.
- The full learner workflow passes the end-to-end suite: purpose → outline → draft → review → case → probe → diagnosis → transfer / redirect / advance → exhaustion.

Quality metrics (reported, not gates)
- Full confusion matrix of the calibration set — the location of the miss is a product defect even when the class is right.
- Transfer-case result after the reveal; the only place the product's core claim is tested.
- Draft quality: how many reviewed nodes come back corrected by the learner across a map.

Business metrics (not yet measured)
- Cost per case; time-to-first-case; the share of diagnosed sessions that resolve with a reveal the learner reports they did not expect.

## 9. Requirements that are not features

- **Latency:** the heavy step is the one-time area draft ("about a minute", stated in the UI); a case is four model calls with short texts; every async surface has loading copy and a retry that preserves the learner's typed input.
- **Cost:** one expensing operation per area; everything else is short calls; the budget transport exists so calibration runs cost pennies.
- **Do no harm:** no scores, no public failure, negative feedback located in the reasoning chain and never aimed at the person, and no claim of mastery that recency state does not mean.
- **Reproducibility:** the suite is 127/127 green; the QA pass is recorded in `docs/qa/`; every calibration case is a committed fixture with a known-correct expected class.

## 10. Open questions

- **Has the grader ever graded a real learner in the app?** No. The 2026-08-27 QA pass never completed a live session end to end (area drafting blocked during the run), so every diagnosis so far comes from the calibration fixtures — the QA version of the proof. The first real sessions will supply transfer/redirect data nobody has seen yet.
- **Which readiness defects are still live?** The readiness gate and rejection of review-flagged principles are fixed in `src/server/session/selectNode.ts` (comments reference QA-001/QA-002). The remaining P1s — idempotent diagnosis (QA-003), non-principle nodes counting as ready (QA-004), stale node accumulation on purpose revision (QA-013), and the indefinite draft block (QA-017) — are open.
- **What number on transfer-pass rate counts as "the reveal works"?** No bar is pre-registered. A pre-registered bar is the next calibration (i.e., the second one worth running).