---
title: "Eval summary"
hook: "Six checks over 300 conversations, each phrased two ways and asked three times."
project: "calibration"
order: 3
source: "Calibration Harness/Artifacts/Eval-Summary.md"
---
# Eval Summary: Rubric Lens

A two-page read of what was run, what it found, and what it could not find.

**Scope of every number below.** One end-to-end run on 2026-08-27 against a real provider, plus 61 automatic checks and a set of local measurements that need no provider at all. **The conversations were machine-generated for this project, not drawn from production.** That means every firing rate in the table is a property of the material, not a finding about any real support agent. What is being evaluated here is the tool, not a customer's rubric.

Three terms. A **criterion** is one yes-or-no question a conversation is judged against. A **rendering** is one machine-facing phrasing of that question, and every criterion gets two. A **conflict** is one disagreement shown to the human, with the cited passages and two unlabelled rationales.


## 1. Headline

> The machine half runs end to end. 300 conversations read, a rubric split into six checks by the model, each check phrased two ways, each phrasing asked three times, with a second model from a different maker settling splits. A coverage table, five automatic rewrites re-measured on the same conversations, a twelve-item queue, a report, and six exports, all from one command. 61 automatic checks pass.
>
> None of the five rewrites landed anywhere usable, and three of them traded a check that fired on 0% of conversations for one that fired on 99 or 100%, which the tool called a success. The strongest verdict the tool prints is a fixed sentence containing the number 300, so at any other size the report contradicts itself. And the human half, which is what the product is, has never been run by a human.

The machine part was the part I expected to be uncertain. It works. The parts I was confident about are the ones that broke.


## 2. What was run

| | |
|---|---|
| Conversations | 300, machine-generated, 1,190 steps in total |
| Checks | 6, produced by the model from the rubric prose at run time |
| Phrasings per check | 2 |
| Samples per phrasing | 3, at temperature 0.7 |
| Judge | qwen/qwen3.8-flash, named exactly, never by a nickname that could point somewhere else later |
| Tie-breaker | z-ai/glm-5.3-flash, a different maker, so its mistakes are less likely to be the same mistakes |
| Aggregation | Strict majority; splits settled by the tie-breaker |
| Comparison of raw against stripped conversations | 100 conversations, judged both ways |
| Automatic rewrites generated and re-measured | 5 |
| Human answers in the queue | 0. The twelve items were answered by the non-interactive mode, which picks deterministically |
| Model requests issued | About 23,400, derived from the run shape. Not metered by the tool |
| Cost and wall clock | Not measured. Nothing in the tool records either |


## 3. The coverage table, as measured

| Check | Fires on | Agrees with itself | Two phrasings agree | Movement when data is stripped | Best reachable recall | Call |
|---|---:|---:|---:|---:|---:|---|
| Grounded in the retrieved documents | 0% | 98% | 100% | +0 points | 0.00 | Too rare |
| Never invents a policy | 0% | 100% | 100% | +0 points | 0.00 | Too rare |
| Empathetic tone | 90% | 81% | 95% | +1 point | 0.99 | No ambiguity found |
| Follows the escalation policy | 4% | 95% | 99% | +0 points | 0.30 | Too rare |
| Handles personal data safely | 16% | 35% | 63% | +1 point | 0.68 | Ambiguous, rewrite proposed |
| Closes with clear next steps | 2% | 97% | 98% | +0 points | 0.22 | Too rare |

Read the first two rows carefully. A check that fires on nothing has a self-agreement of 98 to 100%, because the model agrees with itself perfectly about a question whose answer is always no. High consistency on a check that never fires is not evidence of anything.

Only one row is diagnostically interesting on its own terms: personal data handling agrees with itself on 35% of conversations and the two phrasings agree on 63%. That is what a genuinely ambiguous question looks like, and it is the one case where the product's central claim did what it was built to do.

One line in the report from this run has to be read with care. It says one of the four hidden honesty items was overturned. Nobody overturned anything: the queue was answered by the deterministic non-interactive mode, so that line records which key that mode happened to press. It is not a finding about the models, and it is the clearest illustration of why nothing computed from twelve items is allowed to be reported as a rate.

Highest overlap between checks: empathetic tone and personal data handling come out true together on 34% of conversations. Every other pair is at 3% or below, which follows from four of the six almost never firing.


## 4. The rewrites, which are the part that failed

Any check firing below 10% or with phrasings agreeing below 70% gets rewritten by the model and re-measured on the same 300 conversations.

| Rewrite of | Fires on | Agrees with itself | Two phrasings agree | Best reachable recall | Call |
|---|---:|---:|---:|---:|---|
| Grounded in the retrieved documents | 100% | 98% | 100% | 1.00 | No ambiguity found |
| Never invents a policy | 99% | 87% | 99% | 1.00 | No ambiguity found |
| Follows the escalation policy | 0% | 97% | 100% | 0.00 | Too rare |
| Handles personal data safely | 12% | 44% | 70% | 0.61 | Ambiguous |
| Closes with clear next steps | 99% | 90% | 99% | 1.00 | No ambiguity found |

**Five rewrites, zero usable results.**

Three of them inverted the question, which is a faithful rewrite: "is every claim supported by the retrieved documents" became "does the reply make any claim that is not supported," and on this material the answer went from never to always. The rewrite is not wrong. The verdict on it is. A check that is true of every conversation separates nothing from nothing, and the logic assigning verdicts checks only whether a check fires too rarely. There is no upper bound.

One rewrite stayed at 0%. One moved personal data handling from 16% firing and 63% phrasing-agreement to 12% and 70%, which is not an improvement worth the model calls.

I called this engine the highest-leverage operation in the product. On its first real outing it produced nothing usable and mislabelled three of its own outputs as successes.


## 5. The rules written before the build, and how they held

Six rules were written down before any code existed, on the grounds that these are the disciplines most likely to erode.

| Rule | Result |
|---|---|
| No percentage may be computed from the twelve human answers, and it must be structurally impossible | **Holds.** The report writer receives counts and never verdicts, has no access to the arbitration machinery, and an automatic check reads its source to confirm both |
| The strongest verdict reads "no ambiguity found across N traces," never "verified" or "correct" | **Holds as written and breaks as intended.** It is a fixed sentence containing the number 300. See section 6 |
| De-identification never calls a hosted model | **Holds.** Local rules only, and an automatic check asserts the module imports nothing that can reach a network |
| Placeholders are typed, numbered and stable, so references to the same entity stay linked | **Partly.** Typed and numbered, yes. Linked, not for organisations. See section 6 |
| The countdown is wall-clock and nothing extends it | **Holds.** The deadline is set once when the session opens and is never written again anywhere in the system |
| Every export names its exact model, sample count, temperature and aggregation rule | **Holds.** All six exports carry all four |

Five of six. The one that failed is the one that was easiest to satisfy literally.


## 6. Six defects, and how each was found

| # | Defect | Found by |
|---|---|---|
| 1 | Format detection sends every line-per-record export to the general-purpose reader, so two of the four supported formats fail through the one command the product is | Loading each bundled export through the command a user would type, rather than through its own reader. Both readers work when called by name, returning 60 and 50 conversations. Every automatic check calls them by name, so all of them pass |
| 2 | The strongest verdict is a fixed sentence containing the number 300 | Running the tool on 50 conversations. The top of the page says "50 traces" and every verdict on the same page says "across 300 traces" |
| 3 | The verdict logic has a floor on how rarely a check may fire and no ceiling | Reading the rewrite rows and asking what a check true of every conversation can distinguish |
| 4 | The de-identifier captured a leading "as" into company names, so one company became two | Printing the placeholder table rather than the count. 34 entities recorded; five organisations produced ten placeholders; two entries were not entities at all |
| 5 | On the four hidden honesty items both rationales argue for the same verdict, so no keystroke says "the ensemble is wrong" | Following one keystroke from the screen through to what the report does with it |
| 6 | The key meaning "neither, the question itself is wrong" is counted and reaches nothing | The same trace. Rewrites are generated before the queue opens |

Not one of these was visible in the report the tool produced. Defects 1 and 2 are invisible precisely because every automatic check passes: the checks test each reader by name and the tool at its default size, and those are the two conditions under which both defects disappear.


## 7. What could not be measured, and is therefore not claimed

- **Whether one arbitration takes 90 seconds.** The thirty-minute budget is built on it. No human has done one. It is the first thing to measure with a real user and nothing else in the design matters more.
- **Whether the four hidden honesty items catch anything.** As built they cannot, so this is not merely unmeasured, it is unmeasurable without a design change.
- **Cost and wall clock.** The plan estimated about 7,800 model requests at $80 to $150. The built shape issues about 23,400: 10,800 for the main pass, 3,600 for the raw-against-stripped comparison, 9,000 for re-measuring five rewrites. The plan's estimate assumed the second phrasing ran only where the first produced a split, which contradicts the plan's own definition of phrasing-agreement, since comparing two phrasings requires asking both on every conversation. So the estimate was wrong by roughly three times before any code was written, and the real figure remains unmeasured because nothing meters spend.
- **Anything about a real rubric on real traffic.** The material was generated for this project. Four of six checks firing at 4% or below is a fact about that material.


## 8. Where this evaluation is weakest

- **The corpus is synthetic**, so no firing rate here transfers to anything.
- **The judge is a cheap model.** No comparison against a stronger one was run, so nothing here says whether a better model would change any verdict.
- **One run.** Nothing was repeated, so none of these numbers has a stability figure behind it. Given that measuring stability under repetition is exactly what this product does for its users, not doing it for itself is a gap I would close first.
- **The human half is untested end to end.** The queue was answered by the non-interactive mode. Every number about the human is an estimate carried over from the design review.
