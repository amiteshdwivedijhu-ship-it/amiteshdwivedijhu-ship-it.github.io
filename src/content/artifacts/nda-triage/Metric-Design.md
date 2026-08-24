---
title: "Metric design"
hook: "Absence is the metric, and why recall outranks precision here."
project: "nda-triage"
order: 2
source: "NDA Risk Extractor /Artifacts/Metric-Design.md"
---
# Metric Design: NDA Triage

**Purpose:** show how each metric was chosen, what it protects against, what it cannot catch, and which ones I do not trust.

The rule that shaped every choice below: a metric that needs a right answer nobody has written down is not a metric. It is an opinion with a decimal point.

Two words that recur. **Precision** is how often a call the system makes turns out to be correct. **Recall** is what share of the things that were really there the system actually caught. Most products can trade one against the other. This one cannot, and section 1 is why.


## 1. The one metric the product lives or dies on

The system's job is to decide who, if anyone, has to read an inbound NDA. There are two ways it can be wrong, and they land on completely different people.

- A wrong quotation is visible. The finding points at sentences in the document, the reviewer reads them, and the error is obvious in seconds.
- A missing carve-out is invisible. There is nothing on the page to look at. The document reads clean, it routes clean, and nobody notices until the day it matters.

So the headline number is not overall accuracy. It is: of the clauses and carve-outs that are genuinely missing from a document, how many did we prove missing?

**Shipped configuration, 40-document sample drawn to cover the range, Gemini 3.7 Flash at a Search Budget of 5 steps:**

| What was measured | Result |
|---|---|
| Share of genuinely missing items proved missing | 0.792 (57 of 72) |
| Share of "this is missing" calls that were correct | 0.983 |
| Clauses wrongly declared missing | 1 |

Everything else in this document is supporting evidence for that number, or a guard against it being gamed.

<pre class="mermaid">
flowchart LR
  nda["A real NDA"] --&gt; agent["The agent that proves clauses missing"]
  agent --&gt; traj["Its verdict, plus the record of every step it took"]
  traj --&gt; gold["Compared against expert labels published with the dataset"]
  traj --&gt; splice["Tested against NDAs with a hostile clause planted in them"]
  traj --&gt; probe["Tested against evidence hidden where it has to go and look"]
  traj --&gt; inv["Checked against the process rules it was required to follow"]
</pre>


## 2. Use right answers that already exist, so nothing gets hand-labeled

This is the decision that made the whole evaluation affordable and kept it from being circular.

ContractNLI is a public collection of real contracts that researchers use as shared test material. It ships an expert-annotated label for exactly the thing this product is about: for each of 607 real NDAs, which obligations the document does not address at all.

| Property | Why it matters |
|---|---|
| Annotated by experts | Nobody on this project decided what counts as missing |
| Real NDAs, not adjacent contracts | It is the same kind of document the product sees |
| Free, and licensed for reuse | No annotation budget, no annotation schedule |
| Already divided into 423 training, 61 development, 123 final-exam documents | The discipline of holding a set back is inherited, not invented by me and therefore not bendable by me |

The alternative was to hand-label absent clauses on a few dozen documents. That would have been one annotator, no second opinion, and a set of right answers written by the same person who wrote the instructions the model follows. The measurement would have been about me, not about the model.

**What borrowing someone else's labels costs.** Their annotators judged each NDA against 17 statements. Ours is a different set of six clause types, so the mapping between the two loses information, and the loss is documented rather than smoothed over.

- 7 of the 17 statements do not map to anything we extract. They are discarded on the record.
- The carve-out for information that is already public has no matching statement at all, so accuracy on that carve-out cannot be measured from this source.
- Three documented cases score correct behavior as an error: customer non-solicits on one document, bare durations on three others, and compelled disclosure without a notice duty on one more.

That third bullet is the honest one. Some of the reported misses are the mapping being wrong, not the agent. Naming which three is better than quietly correcting them.


## 3. No model grades another model's work, anywhere in this evaluation

Recorded in writing before any measurement was taken.

The agent that proves clauses missing does open-ended work. Nobody has written down the correct sequence of steps for an NDA. The obvious move, and the industry default, is to have a second model read the agent's work and grade it against a rubric. We refused.

**Why refusing is not laziness:**

| The obvious move | The specific problem with it here |
|---|---|
| Have a model grade the agent's work | A grader is trustworthy when you can measure how often it agrees with a known right answer. The entire reason to reach for a grader is that this right answer does not exist. Its accuracy would be unmeasured, and every process number would rest on it. |
| Accept that the grader is roughly right | The grader would likely come from the same model family as the agent it is grading. An agent that skips checking the exhibits, and a grader that does not think to check whether the exhibits were checked, fail together and silently. |
| Assume there is no other way to measure process | There is. "Right answer, no search" is caught exactly by a planted evidence probe. "Did not look up a term the contract defines" is caught exactly by a process rule. Both are settled by looking at what the agent did, with no model involved. |

**What it buys:** every process number in this evaluation has nothing unmeasured underneath it. That matters most because the number sitting on top is the rate at which the product misses things, which is the one place this project can least afford a soft foundation.

**What it costs, stated plainly:**

- Automatic process rules only catch failures we anticipated and wrote down. A model grader might have flagged one we did not think of.
- Every new rule is a change to the checking code, not a line added to a prompt. The process evaluation grows slowly.
- We accept a narrower net we trust over a wider net of unknown strength.

**One thing this does not constrain:** the Shadow Judge, the second agent that reads the contract for risk the company's rules do not model. It judges the contract, not our output, and a human reads what it says. Different thing, confusingly similar name, so it is worth saying twice.


## 4. Planted-clause tests: the right answer is known because we put it there

The problem: the only public labels for non-compete riders and IP assignments come from a collection of licensing and distribution agreements, not NDAs. Scoring NDA extraction against labels drawn from a different kind of contract measures the wrong thing.

The fix: take a real NDA, splice a clause of known type into its body, and you have a document that looks and reads like an NDA and whose right answer you already know.

| | |
|---|---|
| Planted test cases built | 30 |
| Non-compete or non-solicit clauses planted | 12 |
| IP assignment clauses planted | 12 |
| Clean controls with nothing planted | 6 |
| Planted documents scored | 24 |

**Why this is a good metric:**

- No labeling. The answer is known because we chose it.
- It tests exactly the risk the product exists to catch: a hostile rider smuggled into an otherwise ordinary NDA.
- The 6 clean controls are the guard. If the hit rate went up because extraction started calling every clause a rider, the controls would light up. On the primary model they did not: 0 false alarms.

**Why it is not a perfect metric:**

- The documents are constructed, not natural. Splicing buys a known right answer and pays for it in realism.
- It tests whether a planted clause can be found, not how often one appears. It says nothing about how frequently a real inbound NDA carries a rider.
- Naturally occurring unacceptable clauses would be scored on the final-exam set, once, at the end. That has not happened.


## 5. Planted evidence probes: measuring the search, not the answer

This is the metric I would defend hardest, because it is the one that scores a correct answer as a failure.

A planted evidence probe is a planted test case built so the clause can only be reached by genuinely going and looking: it sits inside an exhibit, or behind a term the contract defines somewhere else. The agent has to perform a lookup to read it. If no lookup happened, the agent cannot have read the clause, and the record shows that plainly.

Result at a Search Budget of 5 steps: 0 of 10 probes passed.

| Outcome | Count | What it means |
|---|---|---|
| Reported the clause **found**, without ever performing the lookup that could reach it | 6 | Right answer. No search. **This is the failure the probes exist to decide.** |
| Never found it at all | 4 | An ordinary miss |
| Invented a quotation | 0 | The agent is not making things up |

Why 6 of 10 is the sharpest number in this report.

- On any metric that reads only the final answer, those six are correct. The clause is there, the agent said it was there, the label agrees.
- On the metric that matters, they are the worst kind of failure. The agent guessed from what NDAs usually say and got lucky. On the next document, where the exhibit says something different, the identical behavior produces a confident wrong answer, and nothing in the output tells the two apart.
- A right answer reached without looking is not evidence that the system works. It is evidence that the test was answerable without the system.

This is also the concrete case that justifies refusing a model grader. A grader reading the final answer would score those six as passes. Checking whether the lookup happened scores them as failures, correctly, for free.


## 6. Process rules: measuring how the work was done, with no labels at all

A process rule is a property the agent's record of its own work must hold, checkable automatically from the document and the steps taken. No labeled example of a "good" run exists anywhere, and none is needed.

Four rules are checked. Three of them hold everywhere. One does not.

| Process rule | Compliance at budget 5 |
|---|---|
| The other three rules | 1.0 |
| **The defined-terms rule** | **0.225** |

### What the defined-terms rule is

Contracts redefine ordinary words. An NDA will say that "Confidential Information" means something specific, and that definition may sit three pages away from the clause that uses it, or in an exhibit. The word on the page and the meaning in the contract are not the same thing.

The rule: when the agent runs into a term the contract defines, it must go and read that definition before it reasons about the clause containing it. Reasoning about "Confidential Information" using the everyday meaning of those two words, when the contract has redefined them, produces an answer that is about English rather than about this agreement. It can be confidently, invisibly wrong.

It is checkable without any labels, because both halves are facts about what happened. Did a defined term appear in what the agent read? Did the agent then go and look it up? Nothing about the quality of the answer enters into it.

### Why this measure earned its place

A measure that ranks the options the same way an existing measure already does adds nothing. This one ranks them differently from every quality number in the project, which is the whole reason it is worth its cost.

Four models were tested. On the question the product exists to answer, they are the same system: recall between 0.783 and 0.789. Nothing in the answers separates them.

| Model, at budget 3 | Defined-terms rule compliance |
|---|---|
| Haiku 4.5 | 0.125 |
| Gemini 3.7 Flash | 0.15 |
| Sonnet 5 | 0.425 |
| GPT-5.6 Sol Pro | 0.65 |

On how they work, they run from 0.125 to 0.65. That is a 5x spread hiding underneath answers that look identical, and no measure of answer accuracy would ever have surfaced it. It is a purchasing decision that only exists because this was measured.

### It also refuted the hypothesis it was built to test

Hypothesis: the agent skips looking up defined terms because it is running out of steps. Give it more steps and compliance should rise.

| Search Budget | Defined-terms rule compliance |
|---|---|
| 3 | 0.15 |
| 5 | 0.225 |
| 8 | 0.175 |

Refuted. Flat within noise. Flash meets defined terms in its search results and declines to look them up regardless of how many steps it has left. The behavior is a property of the model, not of the budget.


## 7. Denominator honesty

Runs where the agent hit its step cap before finishing are left out of the accuracy denominators. Those runs did not conclude "not present." They concluded "I did not finish."

The consequence, stated here so nobody has to go looking for it:

| | budget 3 | budget 5 | budget 8 |
|---|---|---|---|
| Documents where the agent ran out of steps | 11 of 40 | 2 of 40 | 1 of 40 |
| Genuinely missing items counted in the denominator | 60 | 72 | 73 |
| Share of them proved missing | 0.783 | 0.792 | 0.808 |

The denominator grows with coverage. Recall at budget 8 is computed over more items than recall at budget 3, so the three numbers are not straight substitutes for each other.

Why exclude those runs at all:

- A run that stopped early has not made a claim about the document.
- Scoring it as a miss punishes the agent for a cap we chose.
- Scoring it as a hit is obviously worse.

Why the exclusion is safe here:

- Documents where the agent ran out of steps are blocked from automatic approval anyway, on completeness grounds. They cannot leak into the dangerous path.
- The exclusion is reported next to every accuracy number, not in a footnote.
- The headline is therefore conditioned on the agent finishing, and that condition is part of the claim.


## 8. Guard metrics

Every primary metric is paired with something pulling the other way, so that gaming the first one shows up in the second.

| Primary metric | How you could game it | The guard |
|---|---|---|
| Share of missing items found | Declare everything missing | The share of "missing" calls that were correct (0.983), and the count wrongly declared missing (1) |
| Planted clause hit rate | Call every clause a rider | 6 clean controls with nothing planted (0 false alarms on the primary model) |
| Probe pass rate | Answer from what NDAs usually say | The probe **is** the guard. It only passes if the lookup happened. |
| Any answer-accuracy number | Skip the work and get lucky | The process rules, checked against the record of what the agent did |
| Cost per document | Cut the Search Budget | The count of documents where the agent ran out of steps, which blocks autonomy |
| Auto-approve rate | Loosen the rules | 81 of 144 deal combinations declared ineligible in advance |


## 9. Metrics that are deliberately not scored

**Tiers and routing decisions.** The company's playbook is executed as code, so a tier is by definition whatever the rule says it is. There is no "playbook accuracy" to measure. These get automatic checks, not right answers, and that was recorded in writing before the measurements were taken.

That is also what lets the playbook be genuinely conditional and compounding. A three-way interaction rule applied identically across 123 documents is what code is good at and models are not.

**The Shadow Judge.** It is a product surface, not a prediction. Its output goes to a human. There is nothing to score it against, and no attempt is made to invent something.


## 10. Metrics I do not trust

- **Mutuality accuracy.** It is the one clause type whose right answers this project wrote itself. Single annotator, no second opinion, and the annotator was reading passages that Flash had selected. Flash's 1.000 is partly circular for that reason. Sonnet's 0.967 on exact direction and Haiku's 0.902 are unaffected.
- **Opus 5's missing-clause numbers.** Precision 1.000, recall 0.880, nothing wrongly declared missing, no invented quotations. All of it on 15 of 40 documents, before the spend cap stopped the sweep. That is a trend, not a result, and it is labeled as one everywhere it appears.
- **GPT-5.6 Sol Pro's extraction accuracy.** Null. The bulk job stalled on the provider's side for over three hours and was abandoned at the spend cap. Marked "not measured" rather than estimated.
- **The 10-document early measurement** (precision 1.000, recall 0.824, nothing wrongly declared missing). Stronger than the headline, and correctly not the headline. Ten documents is a signal for iterating.


## 11. What I would change

- Measure what a paralegal actually catches. One of the three kill criteria is "recall materially below a paralegal's" and no such number exists. As written, that criterion cannot be failed.
- Split the defined-terms rule by whether looking the term up would have changed the verdict. Today a skipped lookup counts against the agent even on terms that did not matter. That split is what would settle whether 0.225 is a real quality problem or an over-strict rule.
- Build probes for the other failure direction. Every probe today tests "found it without looking." None tests "looked, and still missed something the search should have caught."
- Report accuracy per carve-out as the primary view. The aggregate hides the fact that the clause on whether confidentiality survives the agreement, and the carve-out for disclosure a court or regulator forces, are missed identically at every Search Budget while everything else improves. The aggregate says the dial works. The per-clause view says the dial is fixing coverage and the remaining misses are judgment.
