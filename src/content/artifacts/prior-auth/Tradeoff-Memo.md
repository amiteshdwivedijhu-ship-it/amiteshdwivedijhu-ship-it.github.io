---
title: "Tradeoff memo"
hook: "Cheap tier against frontier, and what the routing decision cost in recall."
project: "prior-auth"
order: 4
source: "Prior Auth Agent/Artifacts/Tradeoff-Memo.md"
---
# Tradeoff Memo: Prior Auth Agent

**The question this memo answers:** where does this product spend quality, cost, speed, safety, and reliability, and what does it give up in exchange?

Healthcare changes the shape of every trade here. The system's core output is an answer for each criterion in a payer's coverage policy: **met** (the chart shows the criterion is satisfied), **unmet** (the chart shows it is not), or **non-determinable** (the chart is silent, so no honest answer is available). The cost of wrongly saying met is not a poor user experience. It is an unsupported clinical claim sent to a payer inside a document a physician has signed.


## 1. Safety against usability: the trade this project got wrong, measured

**The design.** Before a request leaves the system, every clinical claim in it is checked against the chart sentence it cites. The question being asked is narrow: does that sentence genuinely support the claim, or does it merely look related? The check runs in three steps, cheapest first.

<pre class="mermaid">
flowchart TD
  assertion["A clinical claim, with the chart sentence it cites"] --&gt; t0["Step 1: is that sentence really in the chart, word for word?"]
  t0 --&gt; t1["Step 2: a small model running locally, at no cost, judges whether the sentence supports the claim"]
  t1 --&gt;|"confident"| decision["Accept the claim, or mark it unsupported"]
  t1 --&gt;|"unsure"| t2["Step 3: send the doubtful ones to a large model for a second look"]
  t2 --&gt; decision
</pre>

**The intent.** Catch unsupported claims without paying for a large model on every claim.

**What happened.**

| | Value |
|---|---|
| Claims rejected by the small local model | 314 of 390 it decided |
| Of those, the reference answer says met | 280 (89.2%) |
| Claims still marked unsupported after all three steps | 326 of 555 (58.7%) |
| Requests carrying a review-required banner | 100 of 100 |

The reference answer is the correct answer, recorded in advance. So 89.2% of the small model's rejections were rejections of citations that were right.

**The lesson.** A safety check that flags everything is unusable, and people route around it. A banner that appears on every request carries no information. Reviewers learn to click past it, and then it protects nobody. Operationally it is the same as having no check at all.

**Confidence-based escalation failed.** The design escalates cases the small model is unsure about. The small model rejects correct citations confidently, so those cases never escalate. Confidence is a useful trigger only when it tracks correctness, and that relationship was never measured.

**The corrected design.** The small model either stays silent when it wants to reject, or it is replaced, and the large model sees every claim it would have rejected. That costs more, and it is the correct trade, because the alternative is 100% human review of every request.


## 2. Cost against accuracy: send the simple checks to arithmetic

**Decision.** Sort each criterion into one of two kinds. Some are a plain factual comparison against structured data, such as whether a recorded BMI exceeds a cutoff. Others need clinical judgment over written notes. The plain comparisons go to arithmetic instead of the model, and that is where the savings come from.

**Measured.**

| Arm | Model calls | Calls per case | Determinations answered correctly |
|---|---|---|---|
| Simple checks sent to arithmetic | 307 | 15.35 | 0.958 [0.933, 0.973] |
| Every check sent to the model | 402 | 20.10 | 0.948 [0.921, 0.966] |

Both arms are the hand-verified-criteria configuration, and the bracketed range is where the true value could sit given how few cases were measured.

- 23.6% fewer model calls, against a bar of 15%.
- The ranges overlap, and arithmetic is marginally more accurate, because a subtraction does not misread a BMI.
- Both arms replayed identical recorded model answers with only the sorting switched, so the comparison isolates the sorting and nothing else.

**The asymmetry that makes this safe.**

- The sorting step is deliberately biased toward calling a criterion a judgment call.
- Sorting a judgment call into arithmetic sends clinical reasoning to a subtraction. That is unsafe.
- Sorting arithmetic into the model merely wastes money.
- Measured: the sorting step caught every criterion that genuinely is plain arithmetic, and wrongly sorted five judgment calls into arithmetic. That is the dangerous direction. It was named as the dangerous direction in advance, before any results existed, and the missed precision gate should be read next to it.


## 3. Reading the whole chart against reading excerpts

**Decision.** Give the model the whole chart, on charts of this size. The alternative is to fetch only the passages that look most relevant, here the five best, which is cheaper on long documents but risks missing the one passage that matters.

**Measured.**

| Arm | Met criteria correctly found | Honest range |
|---|---|---|
| Whole chart | 0.955 | [0.900, 0.981] |
| Only the five best excerpts | 0.911 | [0.843, 0.951] |

The measure here is the share of criteria the chart genuinely satisfies that the system correctly calls met.

- The gap is 4.46 points, just under the 5-point bar registered in advance. Not confirmed.
- The detail explains why the gap is small. Of 21 non-determinable answers under excerpt reading, 15 are genuine holes in the documentation and only 6 are passages the excerpt step failed to surface. On charts this short, excerpts surface most of what matters.

**What this means for the product.**

- Excerpt fetching is not the lever here. Chart length is not the bottleneck at this service line.
- That conclusion is scoped to knee arthroplasty charts. On a 400-page oncology chart the trade would have to be measured again, not assumed.


## 4. Precision against recall: which error do we prefer?

Both errors are real. They are not symmetric.

| Error | What it causes | How it is treated |
|---|---|---|
| Saying met when the chart does not show it | An unsupported clinical claim goes to a payer under a physician's signature | Hard gate at 0.95, with the worst case above 0.90 |
| Saying unmet, or missing a criterion entirely | The request is weaker than the record supports, so a patient may face an avoidable denial | Reported, not gated |
| Saying unmet because the chart is silent | The system treats absence of evidence as evidence of absence | Prevented by making non-determinable a real answer, not a fallback |

Precision is gated. Recall is only reported. That asymmetry is deliberate. A weak request can be strengthened by a human before it goes out. A confident false claim leaves the building.

The system's actual failure direction is over-commitment. Under Medicare's non-binding "usually 3 months" wording it returned met where the reference answer says non-determinable. It read "the policy does not forbid this" as "the record demonstrates this." That is the same over-confidence visible in how rarely it declines to answer on charts that resemble what it was built on: 1.2% of the time, and right to decline 0 times out of 5.


## 5. Synthetic patients against real notes

**Decision.** Build the test corpus from synthetic patients, and hold back a small slice of real dictated notes to measure how much the synthetic corpus flatters the system.

**Why synthetic at all.**

- Real charts are protected health information, legally restricted patient data. There is no version of this project that uses them.
- Each synthetic patient is generated from a written specification, so the correct answer for every criterion is known by construction. That removes labeling error from the main corpus entirely.

**What it costs, measured.**

| Measure | Synthetic (criteria verified by hand) | Real notes (criteria verified by hand) |
|---|---|---|
| Determinations answered correctly | 0.958 | 0.820 |
| How often it declines to answer | 1.2% | 16.0% |
| Of those refusals, how many were right | 0 of 5 | 87.5% |

- A 13.8-point drop, with ranges that do not overlap.
- Only 2 of 402 synthetic answers are non-determinable, so the synthetic corpus cannot measure the quality of declining to answer at all.
- Any synthetic benchmark should be reported with a real-data slice beside it, or its number should not be trusted. The five-note slice is tiny and it still changed the conclusion.


## 6. Building fast against building evidence that holds

Two places where the faster option was rejected.

**Which policies to hold out was fixed by a random draw before any commercial policy was read.** The choice was locked in advance and could not be nudged after seeing results. Slower, and it makes the held-out result mean something. It also produced an uncomfortable two observations that disagree by 20 points of precision, which is reported as two observations rather than dressed up as a rate.

**No criterion may share more than four consecutive identical words with the chart sentence that satisfies it,** enforced as cases entered the corpus, with regeneration on failure. This costs corpus-building time and it guarantees that no criterion can be answered by matching wording. Without it, every accuracy number in the results would be worth less.


## 7. Where the honest gaps are

- Cost is a proxy. Model calls were counted, not dollars, tokens, or wait time. Nothing here is a real unit-economics model.
- Speed was never measured. For a batch workflow where staff prepare requests ahead of a submission deadline that is a defensible omission, but it is an omission.
- One model family throughout. The writer, both labelers, both graders, and the checking model all come from the same family. They run as separate instances, but they share the same underlying technology and may share the same blind spots.
- The model's answers were recorded once and replayed, so the same run can be reproduced exactly and for free. Every safeguard genuinely runs on every replay, but this is a measured test setup, not a deployed system.


## 8. Summary of positions

| Axis | Position | Basis |
|---|---|---|
| Safety | Refuse any citation that is not in the chart, enforced automatically rather than by asking the model nicely | Grounded citation 1.000, by construction |
| Safety | The three-step claim check, as configured, cannot be deployed | 89.2% of the small model's rejections are wrong |
| Cost | Send plain comparisons to arithmetic | 23.6% fewer model calls, no accuracy loss |
| Cost | When unsure, treat a criterion as a judgment call | Getting that wrong the other way is unsafe, this way it is only wasteful |
| Quality | Whole chart by default at this service line | 4.46 point edge, and excerpts miss only 6 of 21 gaps |
| Precision against recall | Gate precision, report recall | A weak request is fixable, a false claim is not |
| Data | Synthetic corpus with a real-note holdout, never averaged together | 13.8 point accuracy drop on real notes |
| Speed | Not measured, batch workflow | Stated as a gap |
