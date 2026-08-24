---
title: "Launch decision"
hook: "The kill decision, and the bar no model tier cleared."
project: "nda-triage"
order: 5
source: "NDA Risk Extractor /Artifacts/Launch-Decision-Memo.md"
---
# Launch Decision Memo: NDA Triage

**Decision: NO SHIP, at any autonomy setting, at these price points.**

**Date:** 2026-08-23
**Basis:** the 61-document development set only. Total model spend $21.83 of a $50 ceiling. Every kill criterion below was written down before any measurement was taken.


## 1. The call

| Product surface | Decision | Why |
|---|---|---|
| Automatic approval, in eligible deal situations | **No ship** | The decisive kill criterion was breached. 3 to 9 misses on 24 real NDAs with an unacceptable clause deliberately inserted, depending on the model |
| Flag and escalate, with a human reading every document | **No ship yet** | The same reading stage feeds it. A missed rider routes the document as clean, and the reviewer is given no reason to look |
| The Playbook rules and the routing layer | **Keep** | Mechanical, automatically checked, 0 cases where bargaining power moved a severity rating, and never the sole reason a document was blocked |
| Absence Detector at Search Budget 5 | **Keep, but it cannot ship alone** | 0.983 / 0.792: when it says a clause is missing it is right 98.3% of the time, and it finds 79.2% of the ones that really are missing. Good, and irrelevant while the reading stage walks past riders |
| Shadow Judge, as currently instructed | **Kill** | It had something to say about all 61 documents. It vetoes all autonomy and it is the most expensive stage |
| The final scored run on the untouched 123-document test set | **Do not run** | About $8.65, affordable, and it would only confirm a failure at higher resolution |
| Opus 5 as the shipped model | **Not available** | About $52 once the service fee is included, over a $50 ceiling |

The routing layer is ready. The reading stage is not.

## 2. Kill criteria, written in advance and reported against

| Criterion | Bar set in advance | Result |
|---|---|---|
| Missing a clause severe enough to be rated unacceptable | Not shippable at any autonomy setting | **Breached.** Flash 7 misses, Haiku 9, Sonnet 3, on 24 planted clauses |
| Absence coverage materially below a paralegal's | Unsafe in a way users will not notice | **Not testable.** No paralegal baseline exists anywhere. Measured coverage is 0.792 |
| A quoted passage that does not appear in the document | Top-severity defect | **Breached, and contained.** 1 invented quotation at every Search Budget, the same one every time, caught and discarded by an automatic check on every run. 0 on the hidden-evidence tests |

One criterion out of three was breached outright, and it is the one written to be decisive. Its wording was "not shippable at any autonomy setting," chosen in advance precisely so that a good absence number could not be used later to talk it down.

A quotation was invented. It never reached a user, because the check that catches it is mechanical and it discarded the quotation every single time. That is a design property working, not a criterion passing.

## 3. Why one failed criterion outweighs everything that passed

Plenty passed:

- Absence claims correct 0.983 of the time and 0.792 of real absences found, with 1 false absence
- Reading accuracy up to 0.891, an overall score balancing missed clauses against invented ones, with 0 unreadable outputs across three models
- 0 false alarms on the untouched control documents for the primary model
- 0 cases where bargaining power moved a severity rating, across every variant
- Cost at 43.7% of the ceiling

None of it matters, for four specific reasons:

- **The kill criterion covers the failure the user cannot see.** A missed non-compete rider does not make the output look wrong. It makes the output look clean.
- **The user and the risk-bearer are the same person.** The lawyer who trusts a clean routing decision is the lawyer who signed it.
- **Absence quality does not compensate for a missed clause.** They are different provisions. Proving that a carve-out is missing does nothing about an intellectual property assignment sitting in section 9 that the reading stage walked straight past.
- **A flag-only rollout does not fix it either.** If the reading stage misses the rider, the rules never see an unacceptable clause, so the document routes as low-risk. The human is reading, but nothing has told them where to look.

## 4. The hidden-evidence result, and why it is not a footnote

A planted evidence probe is a test where the answer is deliberately placed somewhere the agent has to go and look, inside an exhibit or behind a term defined elsewhere. If the agent never went there, it could not have read the clause.

**0 of 10 passed at Search Budget 5.**

| Outcome | Count |
|---|---|
| Reported the clause found, **without ever making the search that could reach it** | 6 |
| Never found it | 4 |
| Invented quotations | 0 |

Those six are right answers. The clause was there. The agent said it was there. Any metric that scores answers calls that a pass.

They are still failures:

- The agent answered from its general knowledge of how NDAs read, not from this document.
- On the next NDA, where the exhibit says something different, the identical behavior produces a confident wrong answer, and nothing in the output distinguishes it from the lucky one.
- A system that reaches the right answer without looking has not been tested. The test turned out to be answerable without it.

This is also the concrete reason the evaluation refuses to let a model grade our output. A model reading only the final answer would have scored those six as passes, and this memo would have said ship.

## 5. The Opus 5 complication

Opus 5 is the one signal pointing the other way, and it is not enough.

What it did well, on the absence stage:

| Measurement | Opus 5 |
|---|---|
| Share of its absence claims that were correct | 1.000 |
| Share of real absences it found | 0.880 |
| False absences | 0 |
| Invented quotations | 0 |

Why it cannot carry the decision:

- **Partial coverage.** The absence run stopped at 15 of 40 documents when the spend cap hit. Its reading-stage arm covers 1 document. Its "clears the bars" flag is a trend, not a result, and it is labeled that way everywhere it appears.
- **It was never run on the planted clauses.** That is where the kill criterion actually lives. Opus 5 was clean on what it touched, and it did not touch the thing that failed.
- **It is priced out.** The full run lands at about $52 once the 5.5% service fee is included, over the $50 ceiling. It was in the comparison to be reported, not to be shipped, and the plan said so in advance.
- **$0.1548 per document on absence, against Flash's $0.0087,** on a stage where four other models produced the same coverage.

The plan committed in advance to exactly this report: if the only model clearing the bar is the one we cannot afford, the finding is "not shippable at this cost target," stated plainly.

## 6. Why the final scored run is not worth doing

That run would score the untouched 123-document test set, once, with the chosen mix of models.

| | |
|---|---|
| Projected cost | about $8.65 |
| Planned range | $6.30 to $14.30 |
| Headroom available | $28.17 |
| Affordable? | Yes |
| Running it? | No |

What it would settle:

- Does absence coverage hold up outside the set we have been iterating on?
- Does the kill criterion also fail on naturally occurring unacceptable clauses?
- Is the Opus 5 trend real at full coverage?

Why those questions can wait:

- The test set can be scored honestly only once. Spending it now buys a higher-resolution picture of a system that has already failed its decisive criterion.
- The right time to spend it is when the development evidence says the chosen mix works. Then it is a confirmation. Today it would be a post-mortem.
- Nothing in that run can undo the breached kill criterion. It can only tell us whether the failure rate is worse or better on natural documents.

The ceiling was never the binding constraint. $28.17 is still on the table. The constraint is that there is nothing worth buying with it yet.

## 7. What we kill

**The Shadow Judge, as currently instructed.**

- It had something to say about all 61 development documents. On average 14.1 unmodeled risks per document, 862 in total, and 1 invented quotation.
- A judge that is never silent blocks automatic approval, so with every rule in force the measured auto-approve rate is 0 of 3,240 eligible document-and-deal combinations, and 0 of 4,941 on the wider 61-document variant.
- It is the most expensive stage at $0.0535 per document, and it came in at 2.4 times its planning figure.

It is mis-specified. The current instructions produce a wide net, and a wide net is being used as a gate. At 14.1 findings per document it is a firehose, not a filter, and it is doing exactly what a wide net does.

The fix is rewriting the judge's instructions, not buying a better model: give it a severity threshold, and make it stop repeating risks the Playbook rules already cover. Until that exists, the judge's veto is dead on arrival and every autonomy number has to be reported twice, with and without it.

## 8. What held up and should be kept

The routing layer. This is the part of the system that worked.

| Evidence | Number |
|---|---|
| Combinations blocked because a clause was rated worse than acceptable | 3,186 of 3,240 (98.3%) |
| Combinations blocked because the agent ran out of search steps | 27 |
| Combinations blocked by the Absence Detector or by a stage failure alone | **0** |
| Cases where bargaining power moved a severity rating, all variants | **0** |
| Deal situations declared eligible for automatic approval in advance | 81 of 144 |

What that means:

- **The Playbook is the gate, not the agent.** The rules did the discriminating, exactly as designed. The agent never became the sole reason a document was blocked.
- **Bargaining power never moved a severity rating.** The auto-approve pattern is identical across all three values, verified rather than asserted. That was the product's central claim about how risk relates to a deal, and it holds.
- **Autonomy scoped by the deal held its shape.** Ineligible situations stayed ineligible. No clean-looking document talked its way into one.
- **Fixed rules paid off in attribution.** Every failure in this memo is attributable to a named stage. Not one of them is "something in the system was wrong somewhere."

<pre class="mermaid">
flowchart LR
  nda["Inbound NDA"] --&gt; ext["Read the document and pull out the clauses"]
  nda --&gt; abs["Absence Detector: prove what is missing"]
  ext --&gt; pb["Playbook: rate each clause against our written position"]
  abs --&gt; pb
  pb --&gt; rd["Who has to read this: auto-approve, flag, or escalate"]
  judge["Shadow Judge"] --&gt;|"never overrides"| rd
</pre>

**Also held up:** the automatic check that every quoted sentence appears in the source document (it caught the same invented quotation on every run), the loop that re-asks the model when a quotation does not check out (38 unverifiable quotations out of 143 down to 0 by the third version of the instructions), and the running log of spend, which kept costs observable and kept the $50 ceiling from ever being crossed.

## 9. What would change the decision

In the order I would try them.

**1. Fix the reading stage on the unacceptable tier.** Highest value, unknown cost.

- The misses are whole clauses, not misquoted ones. The reading stage does not find the provision at all. Only one wrong-quotation error each for Haiku and Sonnet.
- Sonnet 5 already gets 21 of 24. The gap between 21 and 24 is the entire launch decision.
- Try a dedicated second pass for the two Clause Types that carry the unacceptable rating before reaching for a bigger model on everything. The kill criterion covers two clause types out of six, and a targeted pass is cheaper than upgrading every document.

**2. Fix the "right answer, no search" behavior.** This is an instructions problem, not a capability problem.

- 6 of 10 hidden-evidence tests failed by answering without going to look.
- More search steps do not fix it. Compliance with the defined-terms rule is flat at 0.15, 0.225, 0.175 across Search Budgets 3, 5 and 8.
- Model choice does move it: Sonnet 0.425, GPT-5.6 0.65 at Search Budget 3. But the first thing to try is making the search a required part of a valid answer rather than a suggestion.

**3. Rewrite the Shadow Judge's instructions.**

- A severity threshold, plus suppression of risks the Playbook rules already cover.
- Until it can be silent on a clean document, no autonomy number means anything.

**4. Then, and only then, score the test set.** Once. With the chosen mix. About $8.65 against $28.17 of headroom.

**What I would not do: raise the Search Budget.** The sweep already answered that. Coverage moves 2.5 points across the range 3 to 8, the remaining misses are judgment rather than depth, and two clauses (how long confidentiality survives after the agreement ends, and the carve-out for disclosure a court or regulator compels) miss identically at every level. More steps is the expensive way to not fix this.

## 10. Risks if we ship anyway

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| A smuggled non-compete rider is auto-approved | High. 3 to 9 misses on 24 planted cases | The company is bound by a business restriction it never agreed to review | Do not ship autonomy until the kill criterion clears |
| A flagged document reads as low-risk and the reviewer skims it | High | The same failure, one human step later | Do not ship the flag surface on this reading stage either |
| Users read a routing call as legal advice | Medium | Regulatory exposure | An explicit scope boundary in the product copy. Route, never advise |
| Users read "the agent finished" as a confidence score | Medium | Over-trust in an incomplete run | It is a completeness signal. Label it as one in the interface, and keep it blocking |
| The Shadow Judge ships as a filter | Medium | 14.1 findings per document trains users to ignore it | Kill the current instructions rather than tune a threshold in the interface |

## 11. The honest summary

- Three kill criteria were written before any measurement. One was breached outright. One is not testable, because it names a paralegal baseline that nobody has ever measured. One was breached in a way the design already contains.
- **The evaluation's best number and the evaluation's decision disagree.** Absence recall of 0.792 with precision of 0.983 is a respectable result. It does not ship the product, because the failure that decides shipping sits in a different stage.
- **The cheapest measurement found the most expensive problem.** The planted-clause round cost $1.3893 in total, and it is what stopped the launch. The $12.5541 model comparison mostly established that four of five models are indistinguishable on the headline number.
- **One hypothesis was refuted cleanly.** More search steps were supposed to buy compliance with the defined-terms rule. They do not, at all. Compliance is buyable with model choice and not with steps, which is a purchasing decision the sweep was never designed to produce.
- **The spend ceiling was never the binding constraint.** $28.17 of $50 is unspent. A kill criterion is what stops the project, and that is the correct thing to be stopped by.
