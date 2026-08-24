---
title: "Eval summary"
hook: "Dev split only, with the test split held back to the very end."
project: "nda-triage"
order: 3
source: "NDA Risk Extractor /Artifacts/Eval-Summary.md"
---
# Eval Summary: NDA Triage

A two-page read of what was measured, what failed, and what it cost.

**Scope of every number below:** the 61 NDAs set aside for development. The 123-document final exam set, held back so it stays an honest last test, was never touched. Total model spend: $21.83 of a $50 ceiling.

Three terms, defined once and then used normally:

- A **Clause Type** is one of the six kinds of provision the system reads and judges. A **Tier** is the company's standing verdict on one of them in one deal: acceptable, negotiable, or unacceptable.
- A **kill criterion** is a bar written down before any measurement, with the consequence stated in advance, so that a good result elsewhere cannot argue it away later.
- A **planted-clause test** is a real NDA with a hostile clause of known type dropped into its body. The right answer is known because we put the clause there.


## 1. Headline

> No tested model tier clears the bar on missed unacceptable-tier clauses. Per the kill criteria written in advance, the product is not shippable at any autonomy setting at these price points.
>
> Planted-clause tests put a non-compete rider or an intellectual property assignment of known type into a real NDA body. The best model tested, Sonnet 5, missed 3 of them. The cheapest, Haiku 4.5, missed 9. Every one of those misses is exactly the failure the kill criterion names: a clause the company would never sign, sitting in the document, unseen.
>
> The numbers on proving clauses missing are respectable. The finding is that the part of the system that reads the document does not reliably see the clauses that would stop a document from being approved.


## 2. The kill-criterion failure

24 spliced documents plus 6 clean controls with nothing inserted. The right answer is known by construction.

| Model | Planted clauses found (of 24) | Planted clauses missed | Clean controls wrongly flagged |
|---|---|---|---|
| Gemini 3.7 Flash | 17 | **7** | 0 |
| Haiku 4.5 | 15 | **9** | 1 |
| Sonnet 5 | 21 | **3** | 0 |

- The misses are not edge cases. The system does not find non-compete riders and IP assignments that are sitting in the document.
- Almost every miss is the whole clause going unseen, not a mis-quote. Only one wrong-passage error each for Haiku and Sonnet.
- Zero false alarms on the clean controls for the primary model. The failure is that it misses things, not that it flags too much.

The planted evidence probes are worse. A probe is a planted test case built so the answer is hidden somewhere the agent has to go and look, inside an exhibit or behind a term defined elsewhere. If the agent never performs the lookup, it could not have read the clause, and that is detectable. At a Search Budget of 5 steps, 0 of 10 probes passed.

| Outcome | Count |
|---|---|
| Reported the clause found **without ever performing the lookup** that could reach it | 6 |
| Never found it | 4 |
| Invented a quotation | 0 |

Six right answers with no search. That is the exact failure the probes exist to detect, and it is why scoring only the final answer would have called this a pass.


## 3. Proving clauses missing, the headline metric

The right answers here were not written by anyone on this project. ContractNLI is a public collection of real NDAs that researchers use as shared test material, and expert annotators have already marked, for each document, which obligations it does not address at all. That existing label is the ground truth. Nothing was hand-labeled.

Two accuracy terms, used throughout. **Precision** is how often a "this clause is missing" call turns out to be correct. **Recall** is what share of the genuinely missing items the system actually proved missing. The second one is the one that can hurt somebody.

**Shipped configuration (Gemini 3.7 Flash, Search Budget 5, fifth version of the extraction instructions), 40-document sample drawn to cover the range:**

| What was measured | Result |
|---|---|
| Share of "this clause is missing" calls that were correct | 0.983 |
| Share of genuinely missing items proved missing | 0.792 (57 of 72) |
| Clauses wrongly declared missing | 1 |

Two qualifiers, stated up front rather than buried:

- Runs where the agent ran out of its allowed search steps are left out of the denominator. Those runs did not say "not present." They said "I did not finish." Because more steps means more documents finish, the denominator grows with the budget: 60, then 72, then 73 across budgets 3, 5 and 8.
- An earlier development measurement looked stronger (10 documents, Haiku 4.5, budget 3: precision 1.000, recall 0.824, nothing wrongly declared missing). Ten documents is a signal for iterating, not a headline. The 40-document number is the one to quote.

**How the extraction instructions improved.** Overall extraction accuracy across five successive versions, measured on 15 development documents: 0.647, 0.680, 0.747, 0.931, 0.981. That score balances the two ways extraction can be wrong, missing a real clause and flagging one that is not there. Separately, quotations that could not be found word for word in the source document fell from 38 of 143 returned down to 0, once version 3 added a step that re-asks for the passage and repairs it.


## 4. The model bake-off

Five models, three model makers, both scored stages. Extraction on 61 development documents, missing-clause detection on the 40-document sample at budget 3.

| Model | Extraction accuracy | Share of missing items found | Missing-clause cost per document | Defined-terms rule compliance |
|---|---|---|---|---|
| Gemini 3.7 Flash | 0.866 | 0.783 | $0.0087 | 0.15 |
| Haiku 4.5 | 0.872 | 0.783 | $0.0310 | 0.125 |
| Sonnet 5 | 0.891 | 0.789 | $0.0375 | 0.425 |
| GPT-5.6 Sol Pro | not measured | 0.784 | $0.1225 | 0.65 |
| Opus 5 | 1 document only | 0.880 (15 of 40 documents) | $0.1548 | not comparable |

The last column is compliance with the rule that when the agent runs into a term the contract defines, it has to go read that definition before reasoning about it.

**What the table says:**

- Four points of extraction accuracy separate the models, against a 3x price spread.
- On finding missing clauses, four models at prices from $0.0087 to $0.1225 per document are indistinguishable from each other.
- Process discipline is where the models actually separate. Compliance with the defined-terms rule runs from 0.125 to 0.65, a 5x spread, on models whose answers are the same.

**Two gaps, on the record.** GPT-5.6 Sol Pro's bulk extraction job stalled on the provider's side for over three hours and was abandoned at the spend cap, leaving a single-document check that came back unreadable. Opus 5's missing-clause sweep stopped at 15 of 40 documents. Both are labeled partial everywhere they appear.

Mutuality, the one Clause Type whose right answers this project labeled itself: correct on whether the NDA is mutual, Flash 1.000, Sonnet 1.000, Haiku 0.902; correct on the exact direction, Sonnet 0.967. Flash's 61 of 61 is partly circular, because the annotator was reading passages Flash had selected.


## 5. The Search Budget sweep

The Search Budget is the cap on how many search steps the agent may take on one document. Swept at 3, 5 and 8 on Gemini 3.7 Flash, over the same 40 documents. The shape of the dial is what was being characterized, not the winning model's numbers.

| Measure | budget 3 | budget 5 | budget 8 |
|---|---|---|---|
| Share of missing items proved missing | 0.783 (47/60) | 0.792 (57/72) | 0.808 (59/73) |
| Share of "missing" calls that were correct | 0.979 | 0.983 | 0.983 |
| Clauses wrongly declared missing | 1 | 1 | 1 |
| Documents where the agent ran out of steps | 11/40 | 2/40 | 1/40 |
| Documents where the agent finished its search | 72% | 95% | 98% |
| Defined-terms rule compliance | 0.15 | 0.225 | 0.175 |
| Invented quotations | 1 | 1 | 1 |
| Cost per document | $0.0087 | $0.0096 | $0.0125 |
| Typical time per document | 10.7 s | 11.1 s | 12.3 s |
| Slow case, 19 documents in 20 finish faster than this | 15.9 s | 20.3 s | 36.4 s |

Accuracy is nearly flat. Completeness is what the dial buys.

- The misses that remain are judgment, not depth. The clause on whether confidentiality keeps running after the agreement ends, and the carve-out that lets you disclose when a court or regulator forces you to, are missed identically at every level.
- The bend in the curve is in autonomy, not accuracy. An agent that ran out of steps cannot auto-approve anything, so budget 3 makes 11 of 40 documents ineligible on completeness grounds alone, whatever the document says.
- Budget 5 cuts that to 2 of 40 for 10% more cost. Budget 8 buys one further finished document for 30% more cost and an 80% worse slow case.

Decision: Search Budget 5.

**Two hypotheses this table refuted:**

1. More budget buys compliance with the defined-terms rule. It does not. 0.15, 0.225, 0.175 is flat within noise. Flash meets defined terms in its search results and declines to look them up regardless of how many steps it has left.
2. Invented quotations scale with steps. They do not. Exactly one at every level, and it is the same one every time: a near-verbatim mis-quote on document 406, caught and discarded on every run by the automatic check that every quotation must appear word for word in the source.


## 6. Auto-approve rate

Deal Context is the set of facts about the deal that are not in the NDA: which side we are on, what kind of information is being shared, who the other party is, and how much bargaining power we have. Four variables produce 144 combinations. Because the company's rules run as code and the extraction does not depend on the deal, all 144 can be replayed over saved extractions at zero cost.

<pre class="mermaid">
flowchart LR
  nda["Inbound NDA"] --&gt; ext["Read the six clause types out of the document"]
  ext --&gt; abs["Prove which expected clauses are missing"]
  abs --&gt; judge["Shadow Judge: risk the rules do not model"]
  abs --&gt; play["Fixed company rules set each clause's tier"]
  judge --&gt; play
  play --&gt; route["Routing decision: approve, flag, or escalate"]
</pre>

Combinations eligible for automatic approval: 81 of 144. Anything where the information being shared is source code, or the other party is a competitor, is declared ineligible in advance, however clean the document reads.

With every rule in force, the auto-approve rate is 0.

- The Shadow Judge, the second agent that reads the contract for risk the fixed rules do not cover, has something to say on 61 of 61 development documents. It averages 14.1 findings per document, 862 in total, with one invented quotation.
- A judge that is never silent blocks auto-approval, so nothing gets through: 0 of 3,240 eligible document-and-deal pairs on the 40-document sample, and 0 of 4,941 on the 61-document variant.
- This is measured, not assumed.

**Remove the judge's veto and the routing layer becomes visible:**

| Finding | Number |
|---|---|
| Pairs auto-approved | 27 of 3,240 (0.83%) |
| Documents auto-approved | 1 of 40 (document 610: mutual, 18-month term, four carve-outs, Delaware law) |
| Blocked because some clause was not acceptable | 3,186 (98.3%) |
| Blocked because the agent had not finished searching | 27 |
| Blocked by a missing-clause finding, or a stage failure, and nothing else | **0** |
| Cases where bargaining power changed a clause's tier | **0** across all variants |

**Three things this table settles:**

- The company's rules are the gate, not the agent. A missing-clause finding was never the sole reason anything was blocked.
- Bargaining power never moves a tier. The replay produced the same auto-approve pattern at all three levels.
- Search Budget changes document identity. Budget 3 also yields 27 approved pairs, but on document 547 instead of 610.


## 7. Cost

| Phase | Contents | Spend |
|---|---|---|
| A | Building the clause extraction step | $0.8385 |
| B | Building the missing-clause agent | $2.0965 |
| C | Five-model bake-off | $12.5541 |
| D | Search Budget sweep | $0.8850 |
| F | Planted test cases, evidence probes, spot checks | $1.3893 |
| G | Shadow Judge and mutuality | $3.2634 |
| Reconciliation | Gap between billed and estimated cost | $0.8061 |
| Smoke | Free models | $0.0000 |
| **Total** | | **$21.8329 of $50.00 (43.7%)** |

Measured cost per document per stage: extraction on Flash $0.0072, missing-clause detection on Flash at budget 5 $0.0096, Shadow Judge on Opus 5 sent in bulk $0.0535.

**The projected final run:** 123 final-exam documents across those three stages is about $8.65, inside the planned $6.30 to $14.30. Headroom remaining is $28.17.

The ceiling was never the binding constraint. The kill criterion is.


## 8. Where this evaluation is weak

Stated here, not surfaced only under questioning.

- The mapping from the public dataset's labels to our six Clause Types loses information. Annotators judged each NDA against 17 statements; 7 of those do not map to anything we extract and are discarded on the record. The carve-out for information that is already public has no matching statement at all, so accuracy on it cannot be measured. Three documented cases score correct behavior as an error.
- The mutuality answers are self-labeled and agent-assisted. One annotator, no second opinion, and the passages were chosen by Flash.
- Two arms of the bake-off are partial. GPT-5.6's extraction result is null. Opus 5's extraction is one document and its missing-clause sweep is 15 of 40. Its "clears the bars on partial coverage" flag is a trend, not a result.
- The Shadow Judge is a firehose. 14.1 findings per document, never silent on any document. The autonomy gate is dead on arrival as written, and the stage priced itself at 2.4x its planning figure.
- The missing-clause denominators exclude runs that ran out of steps. The headline is conditioned on the agent finishing.
- Planted-clause tests are constructed, not natural. They test whether an inserted clause can be found, not how often one appears. The inserted clauses come from a public collection of non-NDA contracts.
- Everything here is development-set evidence. Nothing has been scored outside the loop it was tuned in.
