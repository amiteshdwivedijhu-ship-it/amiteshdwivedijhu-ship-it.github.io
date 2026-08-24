---
title: "Tradeoff memo"
hook: "Frontier against routed model, priced per corpus run."
project: "10k-risk"
order: 4
source: "10K Risk Extractor/Artifacts/Tradeoff-Memo.md"
---
# Tradeoff Memo: 10-K Risk Extractor

**The question this answers:** where do we spend quality, cost, latency, safety, and reliability budget, and what do we give up in return?

Every tradeoff below is decided from a measured number rather than from intuition. Where a number does not exist, the memo says so.

Two terms recur. A **Risk Claim** is one assertion pulled out of a company's risk section, tied to the exact sentences it came from. The **newly-disclosed flag** is the system's judgment that a risk appears this year and did not appear last year.


## 1. Model choice: cheap model everywhere

**Decision:** run all three model steps on the cheap model. The three steps are breaking the risk section into individual claims, sorting each claim into a category, and deciding whether each claim is genuinely new.

<pre class="mermaid">
flowchart LR
  filing["A company's annual report"] --&gt; dec["Break the risk section into claims"]
  dec --&gt; cls["Sort each claim into a category"]
  cls --&gt; adj["Decide what changed since last year"]
  adj --&gt; out["Claims, each tied to its own source sentences"]
  cheap["Cheap model"] -.-&gt; dec
  cheap -.-&gt; cls
  cheap -.-&gt; adj
</pre>

Evidence

| | Frontier | Cheap |
|---|---|---|
| Claims found in the same 6 filings | 1,354 | 1,500 (9.7% more) |
| Share of claims called newly disclosed | 2.0% | 2.2% |
| False alarms on filings known to contain no new risks | 0 | 0 |
| Cost to run those filings | $27.49 | $19.46 |

Reasoning
- Cost is not the reason. At 3 to 7 times the price, the frontier model produced no measurable improvement in the metric that decides whether the product ships.
- The only measurable difference is how finely each model cuts a filing into claims, and nothing we measured can say which cut is right. Settling it would take a person labeling every claim by hand, which the panel of AI graders cannot supply.

What we give up
- The comparison rests on filings where we already know nothing new was disclosed, so a model reporting new risks there is wrong without anyone having to check. That test is honest but coarse. A finer one might separate the two models.
- The recommendation is conditional. The cheap model is adequate for this task, with this 48-category filing system, under these instructions. Change any of those and run the comparison again rather than trusting this one.

It cost $27.49 to learn the $27.49 was unnecessary. That is the correct outcome of a cost comparison. Asserting that the frontier model is better for the hard reasoning step would have sounded more sophisticated and been wrong.


## 2. What the model comparison revealed

The frontier and cheap models are not equally far apart at every step, and the reason is mechanical.

| Step | Ratio | Against the 5x difference in list price |
|---|---:|---|
| Break the section into claims | 7.2x | Worse than list |
| Sort each claim into a category | 3.1x | **Better** than list |
| Decide what changed | 6.5x | Worse than list |

- Sorting into categories is the one step where the frontier model is penalized less than list pricing implies. Its input is a 4,600-token instruction manual (a token is the unit of text a model reads, and the basis for billing) that never changes, so the provider serves it from cache at a tenth of the price, and its output is a single category label.
- The other two steps come out worse than list because the frontier model does extra internal reasoning by default and that reasoning is billed as output. Breaking sections into claims alone generated 239k output tokens.

The gap between a frontier model and a cheap one is wider than sticker prices suggest when the model writes fresh text. It narrows when most of the input is unchanged material served cheaply from cache.

**Implication:** a blanket cheap-model policy gets the sorting step wrong for almost no saving. The right policy is derived step by step from the measured curve, not from a single verdict about which model is better.


## 3. Latency vs cost: latency is nearly free here

**Decision:** optimize entirely for cost. Accept the delay of processing in batches.

Reasoning
- Most companies close their books on December 31, so filings pile up in February and March. Peak load is roughly 5 to 8 times the quiet months.
- No analyst needs a year-over-year risk comparison in under a second. They need it before their sector review.
- So: cheap model first, heavy reuse of instructions the provider can serve from cache, and requests grouped together (six claims per request when deciding what changed, one request per Risk Factor when sorting).

What we give up
- Nothing a user would notice.
- A cost model that ignores the February spike will be wrong, so peak capacity is planned separately from the average.


## 4. Quality vs traceability: traceability wins, always

**Decision:** never produce a single overall risk score.

Reasoning
- A score would be easier to sell and easier to chart.
- It also strips out the traceability that makes the output safe to act on, which is the specific failure of the incumbent terminals this is positioned against.
- Every record traces to exact sentences in the filing. That traceability is the product.

What we give up
- A simpler pitch and an easier demo.
- Some buyers want the score and will not buy this.


## 5. Safety: making one failure impossible rather than rare

**Decision:** the system points at sentences by number and never writes out quoted text.

Reasoning
- The risk section is split into numbered sentences before any model sees it.
- A made-up citation cannot be represented in the output at all, because the only thing the system can name is a sentence that already exists in the filing. Zero fabricated citations is a property of the design, not a metric that happened to come back clean.

What this does not solve, and how it is covered
- A model can cite a real sentence and still attach a claim that sentence does not support.
- A separate model family checks whether each cited sentence supports its claim. It supports 98.2% of them.
- The remaining 1.8% are all the same failure, the step that breaks sections into claims overreaching its source: hardening "may" into "will," adding "exclusive," widening "elemental cadmium" into "all materials." None of them invents a risk. That is an instructions problem in one step and the cheapest remaining quality win.


## 6. Reliability vs cost: the trade we would put in front of the user

**The problem:** run the same filing through the system three times and the lists of newly disclosed risks agree 0.92 on one company and 0.10 on another.

This is the number that overrules the rest of this memo. Every accuracy measure passed. Stability was the only measure taken by running the same thing twice and comparing, and it is the one that says the alerting product does not work. Accuracy was the convenient measure. Stability was the useful one.

Options considered

| Option | Cost | Effect | Verdict |
|---|---|---|---|
| Ship as is | 1x | An alert that vanishes on the next run | Rejected |
| Report confidence instead of a yes or no. Run three passes, show only claims flagged by all three | 3x | Turns an unstable yes or no into a stable, smaller, honest one | **Preferred** |
| Fix the drift at its source. Break both years into claims in one pass, so the boundaries are chosen once | Roughly 1x | Removes the mechanism instead of compensating for it | Try first |
| Keep rewriting the instructions for the step that decides what changed | Low | Fitting noise on 20 filings | **Rejected** |

Why the last one is rejected on evidence: the errors that remain sit on pairs of claims whose text similarity looks about the same as pairs the system already ruled out correctly. The step that finds candidate matches from last year is doing its job. The final decision is a genuinely hard call on pairs scoring 0.72 to 0.82, on a scale where 1.0 means identical wording. That is a limit on judgment, not a limit on instructions.

The 3x cost is a trade to put in front of a user, not one to settle quietly. "Three passes, only the risks all three agree on, three times the price" is a product option. Shipping a yes-or-no flag that changes between runs without telling anyone is not.


## 7. Precision vs coverage: two modes, two bars

- Memo Mode, whose output goes into a client document, is scored on precision (how many of its claims are right) and coverage (how many of the real risks it catches) together, because precision on its own is trivially gamed by declining to answer.
- Screening Mode, for an analyst filtering many companies, is scored on how few real changes it misses, guarded by how many risks it wrongly calls new on filings where nothing changed.

**Measured:** the modes came out 2.3 points of coverage apart (100% vs 97.7%). Declining to answer suppresses 0.47% of claims. The check on whether a cited sentence supports its claim suppresses 1.8%, four times as much.

**Change we would make:** make that support check the primary bar for Memo Mode and declining to answer the secondary one. An unsupported claim in a client memo is a liability. An uncertain match is only uncertain. The original design named the wrong mechanism.


## 8. Summary of positions

| Axis | Position | Basis |
|---|---|---|
| Model quality | Cheap model, every step, re-checked whenever the task changes | Measured curve, no quality gain at 3 to 7x |
| Cost | $9.41 to run 20 filings, requests grouped and instructions cached | Measured |
| Latency | Batch only, no real-time path | Seasonal, deadline-driven work |
| Safety | Fabrication made structurally impossible, support for each claim checked by an unrelated model family | 0 of 3,216 and 98.2% |
| Reliability | Not shippable for alerting today | Agreement across runs of 0.10 to 0.92 |
| Traceability | Non-negotiable, no overall score | The product thesis |
