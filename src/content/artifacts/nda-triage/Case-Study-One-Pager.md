---
title: "Case study"
hook: "The legal workflow, product rules, evaluation, and recommendation."
project: "nda-triage"
order: 0
source: "NDA Risk Extractor /Artifacts/Case-Study-One-Pager.md"
---
# Case Study: NDA Triage

**Role:** Product. Problem framing, the core concepts, evaluation design, metric selection, ship decision.
**Built from:** two public collections of real contracts that researchers use as shared test material (ContractNLI and CUAD), five models from three makers reached through one service locked so the same model is used every time, and an uneditable running log of every dollar spent.
**Spend:** $21.83 of a $50 ceiling.


## The person this is for

A mid-size company signs hundreds of inbound non-disclosure agreements a year. One in-house lawyer reviews most of them. Every one is blocking a deal, and not one will ever advance her career. So the pile gets skimmed, or waved through, or it sits for a week while a salesperson escalates.

She also carries the risk. If a bad NDA gets signed, it is her signature on the approval. The user and the risk-bearer are the same person, which is why this product can never be allowed to decide alone.

## Why the obvious fixes fail

- **Search for dangerous words.** The same obligation gets drafted a hundred different ways. Paraphrase defeats it.
- **Compare against our template.** That flags formatting differences, not risk.
- **Give the document a risk score.** A number with no sentence behind it cannot be checked by the lawyer who has to stand behind it. She cannot act on 7.4.
- **Judge the clause on its own merits.** Risk is not a property of a clause. The same term is fine when we are receiving information from a vendor and unacceptable when we are handing source code to a competitor. A tool that does not take the deal itself as an input is guessing.

And the hardest part is not the bad clause that is present. It is the protective clause that is missing. A missing carve-out is more dangerous than a harsh one, because there is nothing on the page to look at. You cannot search for a sentence that is not there.

## What was built

A system that decides who, if anyone, has to read this NDA. It routes attention. It does not rewrite contracts.

- Read the document and pull out six Clause Types, each carrying the exact sentences it came from, then apply the Playbook: the company's written position on each clause, conditional on four facts about the deal and compounding when several clauses go wrong at once.
- A dedicated agent, the Absence Detector, goes looking for what is missing and has to prove it, searching to whatever depth the document demands, up to a Search Budget: a cap on how many search steps it may take on one document.
- A second agent, the Shadow Judge, reports risks the Playbook does not model. It never overrides the routing call.
- Output: auto-approve, flag, or escalate, plus a Negotiation Plan split into what to fight for and what to concede.

<pre class="mermaid">
flowchart LR
  nda["Inbound NDA"] --&gt; ext["Pull out the six clauses, with the sentences they came from"]
  nda --&gt; abs["Absence Detector: prove what is missing"]
  ext --&gt; pb["Playbook: rate each clause against our written position"]
  abs --&gt; pb
  pb --&gt; rd["Who has to read this: auto-approve, flag, or escalate"]
  judge["Shadow Judge: risks our rules do not model"] --&gt; rd
  rd --&gt; plan["Negotiation Plan"]
</pre>

## Product decisions worth defending

1. **Judgment lives in fixed rules, not in the model's instructions.** The rules are mechanical, so the same document and the same deal always produce the same answer. A wrong routing call is therefore provably one of three things: the reading, the tidying-up, or the rule itself. It also makes a clause rating a definition rather than a prediction, so it can be checked automatically instead of against expensive hand-labeled examples. That single choice dissolved the labeling problem for the whole project.
2. **Autonomy is scoped by the deal, not by a confidence number.** 81 of the 144 possible deal situations are declared eligible for automatic approval in advance. A deal involving source code, or a counterparty who is a competitor, is never auto-approved however clean the document reads. A confidence threshold would let a nice-looking document talk its way into a situation where nothing should be automatic.
3. **Bargaining power never changes a clause rating.** A bad clause is bad whether or not we can win the fight over it. Bargaining power feeds only the routing call and the Negotiation Plan, so a deviation we cannot afford to contest gets conceded on purpose instead of quietly reclassified as acceptable.
4. **Absence gets its own pass and its own agent.** The reading stage finding nothing is evidence about the reading stage, not about the document.
5. **No model is ever used to grade another model's output.** A grader like that could not be validated, because the correct answers it would need are exactly the ones we do not have. Process is checked with mechanical rules and planted test cases instead.

## Results

| Measurement | Result |
|---|---|
| Absence detection (Flash, Search Budget 5, 40 documents) | 0.983 / 0.792 (57 of 72), 1 false absence. Right 98.3% of the time when it says a clause is missing, and it finds 79.2% of the ones that really are |
| Clause reading accuracy (Flash / Haiku / Sonnet) | 0.866 / 0.872 / 0.891, balancing the two ways it can be wrong: missing a real clause, and flagging one that is not there |
| **Planted-clause tests missed on the unacceptable tier (of 24)** | **Flash 7, Haiku 9, Sonnet 3. This is where it fails** |
| **Planted evidence probes passed** | **0 of 10. Six were right answers reached without ever looking** |
| Search Budget 3 to 8: quality against completeness | Recall 0.783 to 0.808. Documents that ran out of search steps: 11 of 40 down to 1 of 40 |
| Auto-approve rate, with every rule in force | 0 of 3,240 eligible document-and-deal combinations. The Shadow Judge vetoes everything |
| Auto-approve rate, with the judge's veto removed | 27 of 3,240 (0.83%), one document out of 40 |
| Blocked by the Absence Detector alone | 0 combinations. The Playbook is the gate, not the agent |
| Total spend | $21.83 of $50 |

## The decision

**No ship, at any autonomy setting, at these price points.**

No model tested clears the bar on the failure that matters: missing a clause severe enough to be rated unacceptable. The planted-clause tests insert a non-compete rider or an intellectual property assignment of a known type into a real NDA, so the right answer is known before the system sees it. The best model tested missed 3 of 24. The cheapest missed 9.

Three kill criteria were written down before any measurement was taken. One was breached outright, and it is the one written to be decisive. Opus 5 was the only model clean on what it touched, and it touched 15 of 40 documents before the spend cap stopped it, was never run on the planted clauses at all, and prices out at about $52 against a $50 ceiling. The plan committed in advance to exactly that report: if the only model clearing the bar is the one we cannot afford, the finding is "not shippable at this cost target."

The held-out test set, 123 documents kept locked away as an honest final exam, was never touched. Scoring it would cost about $8.65 against $28.17 of remaining budget. It is not being run, because it can only confirm a failure at higher resolution.

## Results that contradicted my own hypotheses

Reported as such, because a project where every hypothesis lands is a project that was not really tested.

- **More search steps were supposed to buy discipline. They buy none.** The agent was required to look up any term the contract defines before reasoning about it. I assumed it skipped that because it ran out of steps. Across Search Budgets 3, 5 and 8, compliance ran 0.15, 0.225, 0.175. Flat within noise. What moves it is the model: 0.125 on Haiku up to 0.65 on GPT-5.6. Discipline is a decision about which model to hire, not a knob on how long it may work.
- **The Search Budget was supposed to be a quality dial. It is a completeness dial.** How many missing clauses the system catches moves 2.5 points across the entire sweep. Documents that ran out of search steps collapse from 11 of 40 to 1 of 40. The knee is in the autonomy curve, not the quality curve.
- **More money was supposed to buy better absence detection. It buys nothing measurable.** Four models spanning $0.0087 to $0.1225 per document produced recall of 0.783 to 0.789. What separates them is process discipline, which no answer-accuracy metric would have surfaced.
- **The Shadow Judge was supposed to be the safety net. It is the thing that vetoes the product.** It had something to say about all 61 documents, 14.1 findings each, so with every rule in force the measured auto-approve rate is 0.
- **The spend ceiling was supposed to be the constraint. It was not.** 43.7% of it was used. A kill criterion is what stopped the project.

## How I found the defects

| What it found | The instrument | Cost |
|---|---|---|
| The reading stage does not find planted riders and intellectual property assignments | 24 real NDAs with a hostile clause deliberately inserted, plus 6 untouched controls | $1.3893 for the round |
| The agent answers without searching, 6 times in 10 | 10 planted evidence probes: the answer is hidden where the agent must go look, so answering without looking is detectable | In the same round |
| Model choice drove discipline more than search budget | An automatic check on whether defined terms were looked up, across three Search Budget levels | $0.8850 |
| One systematic paraphrase slip on document 406 | An automatic check, every run, that every quoted sentence appears in the source document | $0 |
| The judge's veto blocks every automatic approval | Replaying the rules over all 144 deal situations against already-saved outputs | $0 |

None of it was found by reading output. The missed planted clauses look like clean documents. The six probe failures look like correct answers. The judge veto only appears when you replay the rules over every deal situation and count.

The $1.3893 planted-clause round stopped the launch. The five-model comparison cost $12.5541, more than half of total spend, and found four of five models indistinguishable on the headline number.

Six untouched control documents produced 0 false alarms on the primary model. That rules out the possibility that the system found more riders by calling everything a rider.
