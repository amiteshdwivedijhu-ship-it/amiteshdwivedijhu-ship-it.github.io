---
title: "Tradeoff memo"
hook: "Search budget against false negatives, priced against a fifty dollar ceiling."
project: "nda-triage"
order: 4
source: "NDA Risk Extractor /Artifacts/Tradeoff-Memo.md"
---
# Tradeoff Memo: NDA Triage

**Question this memo answers:** where do we spend on quality, cost, speed, safety and reliability, and what do we give up in return?

Every position below comes from a measured number. Where a number does not exist, the memo says so.

Terms used throughout, defined once. **Recall** is the share of the genuinely missing clauses the system actually proved missing. **Precision** is how often a "this clause is missing" call turns out to be correct. **Extraction accuracy** is a single score that balances the two ways reading a document can go wrong: missing a clause that is there, and reporting one that is not.


## 1. The Search Budget dial

The agent that proves clauses missing does not work to a fixed recipe. It searches, follows what it finds, and stops when it is satisfied. The Search Budget is the cap on how many search steps it may take on one document. That single number is the product's main dial for cost, speed and quality at once, and it was swept at 3, 5 and 8 over the same 40 documents.

Swept on Gemini 3.7 Flash, not on the best model. Two reasons: the shape of the dial is what needed characterizing, and the live question was whether a much cheaper model can buy back its quality gap with more searching. Sweeping the cheap model is also cheaper.

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
| Total cost of running this level | $0.3491 | $0.3839 | $0.5011 |

Decision: Search Budget 5.

The reason is not the accuracy column.

- Accuracy moves 2.5 points across the entire sweep. That is not what you buy the steps for.
- Completeness is what the dial buys. An agent that ran out of steps has not finished checking the document, so it cannot auto-approve anything. At budget 3, more than a quarter of documents are ineligible for automation purely because the agent ran out of room, whatever the document actually says.
- Budget 3 to 5: 9 documents recovered for 10% more cost and 4 more seconds in the slow case.
- Budget 5 to 8: one more document for 30% more cost and an 80% worse slow case.
- Budget 8 also exposed a fault that does not appear lower down. On 7 documents Flash returned a verdict with its reasoning section empty. The system re-asked and recovered every one, but on one document the re-asks consumed steps 3 through 6. At a tighter budget, that document would have run out.

**What we give up at 5:** 1.6 points of accuracy and one finished document, both of which sit inside the noise of a 40-document sample.

**What the dial cannot fix at any level:**

- The misses that remain are judgment, not depth. The clause on whether confidentiality keeps running after the agreement ends, and the carve-out that lets you disclose when a court or regulator forces you to, are missed identically at every level.
- Invention does not scale with steps. Exactly one invented quotation at every level, and it is the same near-verbatim mis-quote on document 406 every time. The automatic check that every quotation appears word for word in the source catches and discards it every time.


## 2. Model quality against price: the quality spread is small and the price spread is not

Five models, three model makers, both scored stages.

Reading the document (61 development documents)

| Model | Extraction accuracy | Quotations returned | Quotations that needed repair | Cost per document |
|---|---|---|---|---|
| Gemini 3.7 Flash | 0.866 | 548 | 0 | $0.0072 |
| Haiku 4.5 | 0.872 | 611 | 126 | $0.0052 |
| Sonnet 5 | 0.891 | 606 | 2 | $0.0225 |

Four points of accuracy separate them, against roughly a 3x price spread. All three can be sent in bulk at half price.

Proving clauses missing (40-document sample, budget 3)

| Model | Share of missing items found | Cost per document |
|---|---|---|
| Gemini 3.7 Flash | 0.783 | $0.0087 |
| Haiku 4.5 | 0.783 | $0.0310 |
| Sonnet 5 | 0.789 | $0.0375 |
| GPT-5.6 Sol Pro | 0.784 | $0.1225 |

Indistinguishable, across a 14x price spread. Whatever the expensive models are better at, it is not answering the question of what is missing from an NDA.

**Position:** do not pay for recall on missing clauses. It is not for sale at these tiers. Pay for the two things that did separate the models: finding planted hostile clauses, and process discipline.


## 3. Different model per stage, not one model everywhere

If the kill criterion were met, this is the mix the evidence supports. Three stages, three different answers.

| Stage | Model | Why | Cost per document |
|---|---|---|---|
| **Reading the document** | Sonnet 5, sent in bulk | Best extraction accuracy (0.891), best hit rate on planted hostile clauses (21 of 24), only 2 quotations needing repair out of 606 returned | $0.0225 |
| **Proving clauses missing** | Gemini 3.7 Flash, budget 5 | Recall within noise of models costing 4x to 14x more, and it finishes its search on 95% of documents | $0.0096 |
| **Shadow Judge** | Opus 5, sent in bulk | Not scored against anything. It is a product surface, so the spend buys reading comprehension at bulk prices | $0.0535 |

<pre class="mermaid">
flowchart LR
  nda["Inbound NDA"] --&gt; ext["Read the clauses: Sonnet"]
  ext --&gt; abs["Prove what is missing: Flash"]
  abs --&gt; judge["Shadow Judge: Opus"]
  abs --&gt; play["Fixed company rules decide the routing"]
  judge --&gt; play
</pre>

**Why using one model everywhere is wrong here:**

- One cheap model everywhere puts Flash's 17-of-24 hit rate on planted hostile clauses into the reading stage, which is the stage the kill criterion lives in. Reading on Flash is $0.0072 against Sonnet's $0.0225, and that gap is the worst place in the whole system to economize.
- One expensive model everywhere pays Sonnet prices on the missing-clause stage for recall Flash already matches, and pays full price for it, because that stage cannot be sent in bulk at all. Each step's instructions contain the previous step's results, which do not exist until the previous step has run.
- Bulk pricing reaches the reading stage and the Shadow Judge, and nothing else. So the model choice on the agent is decided at full price, which is exactly why Flash matters on that stage and bulk discounts do not.

**Where the money went:** the Shadow Judge, at $0.0535 per document, is by a wide margin the most expensive stage, it came in at 2.4x its planning figure, and it is the one stage not scored against anything.

**What we give up:** three model integrations instead of one, three sets of model behavior to maintain, and three vendors to watch. Accepted, because the alternative is paying frontier prices on a stage that does not reward them, or cheap prices on the stage that decides whether the product ships.


## 4. The defined-terms rule: buyable with model choice, not with steps

This is the sharpest tradeoff finding in the project, and it started life as a hypothesis that turned out to be wrong.

**The rule.** Contracts redefine ordinary words. An NDA declares that "Confidential Information" means something specific, and that definition can sit pages away from the clause using it. The rule is that when the agent runs into a term the contract defines, it must go and read that definition before reasoning about the clause that contains it. Skip the lookup and the agent is reasoning about plain English rather than about this agreement, which is a way to be confidently wrong with nothing on the page to show it. Compliance is checkable automatically: the term either appeared and was looked up, or it appeared and was not.

**The hypothesis:** the agent skips the lookup because it is running out of steps. Buy more steps, buy compliance.

| Search Budget | Defined-terms rule compliance |
|---|---|
| 3 | 0.15 |
| 5 | 0.225 |
| 8 | 0.175 |

Refuted. Flat within noise. Flash meets defined terms in its search results and declines to look them up regardless of how many steps it has left.

**What does move it:**

| Model, at budget 3 | Defined-terms rule compliance |
|---|---|
| Haiku 4.5 | 0.125 |
| Gemini 3.7 Flash | 0.15 |
| Sonnet 5 | 0.425 |
| GPT-5.6 Sol Pro | 0.65 |

**The same failure appears elsewhere:**

- Those four models produce recall between 0.783 and 0.789. Judged on answers they are the same system. Judged on how they work they run from 0.125 to 0.65.
- That is why this measure earned its cost. A measure that ranks the options the same way an existing measure already does tells you nothing new. This one ranked them differently from every quality number in the project, so it carries information no answer-accuracy score contains, and it is the only reason the model-mix decision below exists at all.
- Process quality and answer quality are separate purchases. Money spent on the Search Budget buys completeness. Money spent on the model buys discipline. They are not substitutes, and the sweep proved it rather than assuming it.
- If a rollout with humans reviewing every document showed skipped definitions actually biting, the fix is Sonnet on the missing-clause stage, not a bigger budget. That is a 4x cost increase on that stage and it is the right lever.

**What we do not know:** whether 0.225 compliance is a real quality problem. The rule counts a skipped lookup even when reading the definition would not have changed the verdict. Splitting the measure that way is what would settle whether this is worth 4x.


## 5. Speed

**Position:** speed is a first-class requirement here, unlike most document AI.

- NDAs arrive continuously and unpredictably. Every one is blocking somebody's deal.
- A 30-second answer changes behavior. A 30-minute answer gets bypassed, and the NDA gets signed without the tool.
- So the system cannot run overnight in bulk only, and the missing-clause agent cannot run in bulk anyway.

**Measured at the shipped setting:** half of documents finish in 11.1 seconds or less, and 19 in 20 finish within 20.3 seconds, on the missing-clause stage.

**What we gave up to hold that:** budget 8's one extra finished document. It costs 80% on the slow case, pushing it to 36.4 seconds. That is on the wrong side of the line between a user who waits and a user who leaves.

**Where bulk pricing is still used:** the reading stage and the Shadow Judge, both at half price. Running the agent in waves, sending every document's step 1 together, then every document's step 2, is possible and was rejected as cost-neutral. The 50% bulk discount almost exactly cancels the roughly 70% saving lost by giving up the discount for reusing the same instructions across calls, and it buys a scheduler plus hours of delay per iteration.


## 6. Safety

Four positions, in the order they matter.

1. Automation is scoped by the deal, not by a confidence score.

- 81 of 144 deal combinations are eligible. Anything where the information being shared is source code, or the other party is a competitor, is ineligible in advance, however clean the document reads.
- A score would let a clean-looking document into a situation where nothing should ever be automatic. A combination declared ineligible cannot be talked into it by a good-looking extraction.
- This is the product's core safety position, and it costs coverage on purpose.

2. Every finding carries the exact sentences it came from, and those sentences are checked against the document.

- The check is code, not a model. A quotation that does not appear in the document is thrown away.
- Result: 1 invented quotation in the missing-clause sweep at every budget level, caught every time. 0 on the planted evidence probes. The Shadow Judge produced 1 across 61 documents.
- The reading stage went from 38 unverifiable quotations out of 143 returned down to 0, once the third version of its instructions added a step that re-asks and repairs.

3. Confidence is a completeness signal, never a probability.

- The agent reports whether it searched everything it meant to or ran out of steps.
- Running out of steps blocks automatic approval regardless of what was found.
- We never emit an invented confidence number, because there is nothing to calibrate it against.

4. No model ever grades our own output.

- A grader would be impossible to check here, because the right answers it would need are exactly the right answers we do not have.
- It would likely come from the same model family as the agent, so their blind spots would cancel out silently.
- The failure we care about is decidable without one. The planted evidence probes caught 6 cases of "right answer, no lookup" that any grader reading only the final answer would have scored as passes.

**What this does not cover:** a clause that is bad in a way the company's rules do not model is invisible to those rules. The Shadow Judge exists for exactly that gap, and as currently written it is not usable. See section 8.


## 7. Reliability

| Property | Measured | Read as |
|---|---|---|
| Unreadable answers from the reading stage | 0 of 61 on Flash, Haiku and Sonnet | Fine |
| Quotations still unverifiable after repair | 3 of 548 (Flash), 12 of 611 (Haiku), 5 of 606 (Sonnet) | Fine |
| Haiku repair rate | 126 of 611 quotations needed repair | The repair step is load-bearing, not decorative |
| Documents where the agent ran out of steps at budget 5 | 2 of 40 | Fine |
| Provider stability | 3 transient timeouts at budget 8, all recovered on one retry | Watch it |
| Verdicts returned with the reasoning section empty, at budget 8 | 7 documents, all recovered by re-asking | A reason not to run budget 8 |
| GPT-5.6 bulk reading job | Stalled on the provider's side for over 3 hours, abandoned | Sending work in bulk across providers is not dependable |

**Position:** the retry and repair machinery is doing real work and should be treated as part of the product, not as scaffolding. The one number that would have looked clean without it is Haiku's quotation verification rate, and 126 repairs are what stand behind it.


## 8. What we would kill on cost and quality grounds

**The Shadow Judge, as currently written.**

- It has something to say on 61 of 61 development documents. Mean 14.1 findings per document, 862 in total.
- A judge that is never silent blocks automatic approval, so the measured auto-approve rate with every rule in force is 0 out of 3,240 eligible pairs.
- It is also the most expensive stage at $0.0535 per document, 2.4x its planning figure.
- It is an instrument built to catch everything, being used as a filter. A second version with a severity threshold, and with findings that duplicate what the company's rules already cover removed, is the fix. It is future work.

**Not the routing layer.** With the judge's veto removed, the breakdown of what blocked what shows 3,186 of 3,240 pairs (98.3%) blocked because some clause was not acceptable, 27 blocked because the agent had not finished searching, and zero blocked by a missing-clause finding or a stage failure alone. The company's rules are doing the gating they were designed to do.


## 9. The spend ceiling was never the constraint

| | |
|---|---|
| Ceiling | $50.00 |
| Spent | $21.8329 (43.7%) |
| Headroom | $28.17 |
| Projected cost of the final scored run on the untouched exam set | about $8.65 |
| Where that would land the project | about $30.48 |

The final run is affordable. It is not being run.

The binding constraint is the kill criterion. Scoring the held-back documents once, at the end, is worth $8.65 when the development evidence says the chosen mix works. It is not worth $8.65 to confirm a failure at higher resolution. The reasoning is in the launch decision memo.

Cost of learning all this: $21.83. The five-model bake-off alone was $12.5541, more than half the spend, and its main output is the finding that four of five models are indistinguishable on the headline metric. That is the correct outcome of a cost curve. Asserting that the frontier model is better at the hard reasoning stage would have sounded better and been wrong.


## 10. Summary of positions

| Axis | Position | Basis |
|---|---|---|
| Search Budget | 5. Buy completeness, not accuracy | Documents that ran out of steps fall from 11/40 to 2/40 for 10% more cost |
| Model quality | Per stage, never one model everywhere | 4 points of extraction accuracy separate the models; recall on missing clauses does not separate them at all |
| Process discipline | Buy it with model choice, not with steps | Defined-terms compliance is flat across budgets, and 5x wider across models |
| Cost | Reading $0.0072, missing clauses $0.0096, judge $0.0535 per document | Measured from the spend log, not estimated |
| Speed | 19 in 20 documents inside 20.3 s, and 36.4 s is too slow | NDAs block deals |
| Safety | Automation scoped by the deal, every quotation checked in code, no model grading our own output | 81 of 144 combinations eligible, 1 invented quotation caught on every run |
| Reliability | Retry and repair are part of the product | 126 quotation repairs on Haiku, 3 gateway timeouts at budget 8 |
| Shipping | Not shippable at any autonomy setting | 3 to 9 misses on 24 planted hostile clauses |
