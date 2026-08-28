---
title: "Case study"
hook: "The rubric problem, the question it asks instead, and the partial ship call."
project: "calibration"
order: 0
source: "Calibration Harness/Artifacts/Case-Study-One-Pager.md"
---
# Case Study: Rubric Lens

**Role:** Product. Problem framing, core concepts, the decision to print no accuracy number, evaluation design, ship call.
**Status:** Built and run end to end against a real provider on 2026-08-27. The machine half works. The half the product actually rests on has never been run by a human, and one part of it cannot do its job as built.
**Built from:** 300 machine-generated customer support conversations, two AI models from unrelated makers reached through one service and named exactly rather than by nickname, a de-identifier that runs entirely on the local machine and never sends anything to a model, and 61 automatic checks.


## The person this is for

A product manager owns an AI support agent. What "good" means is her call, and it lives in a document with about eight bullets in it: stay grounded in the retrieved documents, never invent a policy, match the customer's situation in tone, escalate when the case is above the agent's authority, never repeat sensitive personal data, close with a clear next step.

She wants those bullets scored automatically. To know whether an AI model can score them, the standard answer is: label a few hundred conversations by hand and check the model against them. She does not have that dataset, and building one is the thing her team says it cannot afford.

Why the obvious fixes fail:

- **Label a golden dataset.** Weeks of somebody's time up front, and production keeps producing cases the dataset has never seen, so it has to be maintained forever. The maintenance, not the first build, is what teams say breaks them.
- **Just write the judge prompt and read the score.** A score cannot tell her whether the model is wrong or her question was vague. Those two have opposite remedies, and she needs to know which one she has.
- **Buy an evaluation platform.** Labelling happens in one tool, judges in another, de-identification in a third, and agreement statistics in a spreadsheet. The pain she reports is not that any one step is hard. It is that they are in four places.


## The idea

Almost every evaluation tool asks: how accurate is the judge? Answering that requires labels.

This asks a different question, and it needs none: **is this check answerable at all?**

- Ask the same question in two honest rephrasings and see whether the answers agree. Two honest phrasings of a clear question agree. Two honest phrasings of a muddy one do not.
- Ask it three times at the same settings and see whether it agrees with itself.
- Count how often it fires at all.

Those three numbers say most of what a labelled dataset would have said about whether a check is worth automating, and they cost nothing but model calls. A check that fails them does not need a better model. It needs to be rewritten, which is something the product manager can do in ten seconds and nobody else can do at all.

<pre class="mermaid">
flowchart LR
  rub["Her rubric, in prose"] --&gt; dec["Split into about six yes-or-no questions"]
  dec --&gt; two["Write each question two honest ways"]
  two --&gt; judge["Ask each way, three times, on all 300 conversations"]
  judge --&gt; tab["Coverage table: how often it fires, how often it agrees with itself, how often the two phrasings agree"]
  tab --&gt; call["One of five calls per question"]
  call --&gt; rw["Questions that fail get rewritten and re-measured automatically"]
</pre>


## The four product decisions

1. **Score the individual check, never the rubric as a whole.** One verdict on "was this reply good?" tells you it was wrong without telling you which of the six sub-questions was the vague one, and a rewrite has nothing to aim at.

2. **Two phrasings of one question, not two different models.** This is the decision I would defend hardest. Both cost the same. When two models disagree, the remedy is "change the model or accept it," and the product manager chose neither model and cannot change either. When two phrasings of her own question disagree, the remedy is "rewrite the question," which is hers to do. The diagnosis is only worth having if it comes with an action she can take.

3. **Print no accuracy number, ever, and make that structural.** Fifteen hours of hand labelling narrows an accuracy estimate to roughly plus or minus 8 points. Letting the human read the model's cited evidence before deciding shifts the centre of that estimate by around 19 points, and nothing in the system measures that shift. At a 3% firing rate, most of a human's "yes" labels are themselves mistakes. Spending fifteen hours to tighten the smaller error around an unmeasured larger one is the trap. So the part of the tool that writes the report has no access to the human's answers at all: it receives counts, never verdicts, and an automatic check reads the code to confirm it contains no way to divide one by the other. (These figures come from the design review that killed the earlier, certifying version of this product. They are not measurements from this project.)

4. **The human arbitrates, never labels.** Reading a raw multi-step conversation cold takes 3 to 8 minutes and produces a decision she gets wrong perhaps one time in ten. Choosing between two written rationales, with the relevant passages already pulled out for her, takes 60 to 90 seconds and she is far more reliable at it. The expensive half of labelling is finding the relevant passages, and the machine has already done that for free.


## What was built and run

One command takes a folder of production conversations and a rubric written in prose, and produces a table, a set of automatic rewrites, a local page where the person answers twelve questions against a clock, a shareable report, and one exported judge per check that names its exact model, its settings, and its aggregation rule.

It ran end to end on 2026-08-27: 300 conversations, a rubric split by the model into six checks, each check phrased two ways, each phrasing asked three times, with a model from a second maker breaking ties. 61 automatic checks pass.


## Results

The six checks, as measured:

| Check | Fires on | Agrees with itself | Two phrasings agree | Best recall reachable | Call |
|---|---:|---:|---:|---:|---|
| Grounded in the retrieved documents | 0% | 98% | 100% | 0.00 | Too rare to measure |
| Never invents a policy | 0% | 100% | 100% | 0.00 | Too rare to measure |
| Empathetic tone | 90% | 81% | 95% | 0.99 | No ambiguity found |
| Follows the escalation policy | 4% | 95% | 99% | 0.30 | Too rare to measure |
| Handles personal data safely | 16% | 35% | 63% | 0.68 | Ambiguous, rewrite proposed |
| Closes with clear next steps | 2% | 97% | 98% | 0.22 | Too rare to measure |

The tool then rewrote the five failing checks by itself and re-measured them on the same 300 conversations. **Not one of the five landed anywhere useful.** Three went from firing on 0% of conversations to firing on 99 or 100% of them, and the tool stamped all three with the strongest verdict it prints.

That is the finding. A check that fires on everything carries exactly as little information as one that fires on nothing, and the logic deciding the verdict had a floor and no ceiling.


## Six defects, and what they cost

| # | Defect | Consequence |
|---|---|---|
| 1 | Format detection sends every line-per-record export to the general-purpose reader | Two of the four supported export formats fail through the one command the product is, though both readers work correctly when called by name |
| 2 | The phrase "no ambiguity found across 300 traces" is a fixed sentence with the number written into it | Run it on 50 conversations and the same page says "50" at the top and "across 300" in every verdict. The tool's own documented remedy for hitting provider rate limits is to drop to 200 |
| 3 | The verdict logic has a floor on how rarely a check may fire and no ceiling | Three rewrites traded an unmeasurable 0% for an unmeasurable 100% and were called a pass |
| 4 | The de-identifier captured a leading "as" into company names | The same company became two different companies. Five organisations produced ten placeholders, so the one property that justifies typed placeholders, keeping references to the same entity linked, does not hold for organisations |
| 5 | On the four hidden honesty checks, both rationales argue for the same verdict | There is no keystroke that says "the ensemble is wrong here," which is the exact thing those four items exist to catch |
| 6 | The key meaning "neither, the question itself is wrong" is counted and nothing else | Rewrites are generated before the queue opens, so the highest-information keystroke in the design reaches nothing |

None of these was found by reading the report. Defect 1 came from loading each bundled export through the one command instead of through its own reader. Defect 2 came from running the tool at a size other than the default. Defect 3 came from reading the second row of the table and asking what a check firing on every conversation can distinguish. Defect 4 came from printing the placeholder table instead of the placeholder count. Defects 5 and 6 came from following one keystroke through to its consequence.


## The decision

**Ship the coverage table to one design partner. Do not ship the arbitration queue. Do not describe this as a thirty-minute product.**

The table is the part that works and the part that is genuinely new, and the project's own plan said to put exactly that in front of one real customer before building anything else. That gate was skipped: everything got built.

The queue does not ship because the one job its four hidden items exist to do cannot be done through the screen as built. The thirty minutes is not claimed because nothing in the system records a clock or a cost.


## Four results that contradicted my own arguments

Reported as such, because a project where every premise survives was not really tested.

1. **I called the rewrite engine the highest-leverage operation in the product.** It produced five rewrites and none was usable. Three swapped one unmeasurable extreme for the other.
2. **I put the hard rules in code rather than in documentation, on the grounds that documentation erodes.** The rule that broke is the one that was easiest to satisfy literally: a fixed sentence with the number 300 inside it. Enforcing a rule as a string constant satisfies its letter and can invert its meaning.
3. **I designed the four hidden honesty checks as the only defence against the failure mode I named as the product's real hole.** The screen I designed gives the person no way to express the disagreement those items exist to capture.
4. **The plan estimated about 7,800 model requests and $80 to $150 per run.** The built system issues about 23,400 on this shape of run, three times the estimate, and the estimate was inconsistent with the plan's own definitions: comparing two phrasings requires asking both on every conversation, not only on the ones where the first answer was split.


## What this project established

- **A way to triage quality checks with no labelled data at all**, and a defensible argument for why the number it refuses to print is the right number to refuse.
- **A design discipline that mostly held under test.** Five of six rules written before the build survived the build. The one that failed, failed in an instructive way.
- **A distinction worth carrying into other work:** asking whether a question is answerable is cheaper, more actionable, and more honest than asking whether a model answered it correctly.
