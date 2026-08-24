---
title: "Metric design"
hook: "Why met-precision is gated and recall is only reported."
project: "prior-auth"
order: 2
source: "Prior Auth Agent/Artifacts/Metric-Design.md"
---
# Metric Design: Prior Auth Agent

**Purpose:** show how the measures were chosen, what each one is protecting against, and which ones I do not trust.

Every measure and every bar was written down before the run, and none was redefined after the results were seen.

The system's job is to answer, for each criterion in a payer's coverage policy, whether the patient's chart satisfies it. Three answers are allowed, and they are the payer's own words: **met** (the chart shows the criterion is satisfied), **unmet** (the chart shows it is not), **non-determinable** (the chart is silent, so no honest answer is available).

The dangerous failure is a single one. The system says met when the chart does not show it, and that claim goes to a payer inside a document a physician has signed. Every measure below exists because of that sentence.


## 1. The three rules

**Rule 1: gates before everything else.** Two measures are gates. A gate is pass or fail, it is reported first, and no other number offsets it. A system that answers 96% of questions correctly and sends unsupported clinical claims to a payer is not 96% good.

**Rule 2: if a gate fails, the finding is that the system missed the gate.** The gate does not move. This was written down before the run so that the temptation to soften it afterward had nowhere to go.

**Rule 3: every rate carries its denominator and its honest range.** The honest range is where the true value could sit given how few cases were measured. A rate without a denominator is a marketing number.


## 2. Choosing what to count

The unit is the determination, meaning one answer about one criterion for one patient. It is not the case.

- 20 patient cases against 6 policies produce 402 determinations on the synthetic corpus.
- If the case were the unit, a case with 25 criteria and a case with 8 criteria would count the same.
- The criteria list for a policy is kept as a flat checklist, never nested, so that one criterion produces exactly one determination. That keeps the denominator unambiguous. There is never a question about what counts as one answer.

<pre class="mermaid">
flowchart LR
  policy["Payer coverage policy"] --&gt; criteria["Flat checklist of criteria"]
  case["Patient case"] --&gt; chart["Patient chart"]
  criteria --&gt; criterion["One criterion"]
  criterion --&gt; det["One determination: met, unmet, or non-determinable"]
  chart --&gt; det
</pre>

This decision sits upstream of every number in the results, and it is the kind of thing that is very hard to change later.


## 3. The two gates, and why those two

### Gate one: met precision at 0.95, with a worst case above 0.90

Met precision asks: of all the criteria the system called met, how many really are met?

**What it protects against:** the system asserting a criterion is satisfied when the chart does not show it. In deployment that is an unsupported clinical claim sent to a payer under a physician's signature.

**Why report the worst case:** a headline number on a small sample can look good by luck. Requiring the lower bound to clear 0.90 forces the corpus to be large enough to support the claim.

**Result: FAIL on every configuration.** Best was 0.939, with the true value somewhere in [0.879, 0.970]. It misses on both halves of the bar. In that configuration, 7 of 114 criteria called met are not met according to the reference answer, which is the correct answer recorded in advance.

The real-notes row fails differently and must not be read as a quality result. It answered 10 of 10 correctly, but 10 cases cannot put a lower bound above 0.90 no matter how many are right. The row therefore fails on resolution despite having no observed errors. The gate was defined by its lower bound, so that result remains a failure.

### Gate two: grounded citation at exactly 1.00

Grounded citation asks: does every chart sentence the system quotes as evidence actually exist in that chart, word for word?

**What it protects against:** a quotation that is not in the record. Invented evidence inside a medical document.

**Why 1.00 and not 0.99:** there is no acceptable rate of invented evidence in a document a physician signs. An all-or-nothing bar also has a second property: it turns silent bugs into loud ones.

**Result: PASS at 1.000 on all six configurations, by construction.** The scoring step goes and finds every quoted sentence in the original chart itself and discards anything it cannot locate. The system cannot invent a quotation, because a quotation it invented would not be there to find.

The gate earned its keep immediately. When the system read only retrieved excerpts of a chart, it counted sentence positions inside the excerpt while labeling them with the whole document, so every citation in that mode pointed at the wrong place. The first scoring pass read grounded citation at 0.000 (0 of 187). The 127 automatic checks in the project only exercised the whole-chart path, so this one was never tripped. An all-or-nothing bar turned a silent bookkeeping bug into an unmissable zero.


## 4. Six predictions, registered before the run

All six are reported, whether they confirmed or not.

| | Prediction | Result |
|---|---|---|
| H1 | Reading the whole chart beats reading excerpts on how many met criteria get found, by more than 5 points | NOT CONFIRMED (4.46 points) |
| H2 | Escalating only the least confident 15% recovers over 75% of what an all-large-model check catches, at under 25% of the cost | CONFIRMED, weakly |
| H3 | Mistakes made pulling criteria out of the policy do not multiply downstream | CONFIRMED |
| H4 | Met precision is better on clean and clearly deficient cases than on borderline ones | NOT CONFIRMED |
| H5 | Sending plain comparisons to arithmetic cuts cost by more than 15% with no accuracy loss beyond the range | CONFIRMED |
| H6 | The same evidence gets different answers under policies of different strictness | CONFIRMED |

Two of six did not confirm. Both were registered as informative either way.


## 5. The most useful finding: H2 was registered on the wrong measure

H2 confirmed on the terms it was stated on. That is the problem.

**What was registered:** how much of what a large model catches a cheap checker can catch first, at a fraction of the cost.

**What happened:** the catch rate is about 99% at zero cost, so the 75% recovery bar was close to unfalsifiable on this corpus.

**What that measure was hiding:**

| Kind of claim-and-citation pair | Pairs | Cheap local checker | Large model |
|---|---|---|---|
| Citation is genuinely correct | 72 | **0.333** | 0.903 |
| Planted near-miss, built to look right and be wrong | 20 | 0.950 | 1.000 |
| Citation belongs to a different criterion | 112 | 0.991 | 0.991 |

The cheap checker rejects two-thirds of correct citations. It scores well on catching bad ones mainly because it rejects nearly everything. On this clinical text it is close to a machine that always says no, and the aggregate number hides that completely.

**The lesson:** catch rate was the convenient measure. How often the checker wrongly rejects a genuine citation was the useful one, and it is the one that decides whether a human can use the output at all.


## 6. What the wrong measure cost, at real scale

The checker was then wired into its actual job, as the last check before a request leaves the system, across 100 requests:

| Quantity | Value |
|---|---|
| Clinical claims checked | 555 |
| Rejected by the cheap checker | 314 |
| Of those rejections, the reference answer says met | **280 of 314 (89.2%)** |
| Claims still marked unsupported after the full check | **326 of 555 (58.7%)** |
| Requests carrying a review-required banner | **100 of 100** |

The check as configured flags every single request for human review, which is operationally identical to having no check at all.

Worse, escalation is keyed on how unsure the cheap model is, and the cheap model rejects correct citations confidently. The doubtful cases that get a second look are not the cases that need one. The design assumed errors would look uncertain. They did not.

The same finding arrives independently from the other side, in the quality scores an independent grader gave the finished requests:

| What was scored | Mean, out of 5 |
|---|---|
| Completeness | 5.00 |
| **Usefulness of the evidence cited** | **2.56** |
| Naming the gaps and how to close them | 4.21 |
| Professional form | 4.96 |
| Overall | 3.26 |

Structure and tone are at ceiling. Evidence usefulness is dragged down to 2.56 almost entirely by correct citations being stripped out as unsupported. Two measurements, one cause.


## 7. Never report a grader score without its human ceiling

The grader that scores finished requests was itself calibrated against a public set of medical questions carrying physician-written answers: 200 sampled question-and-answer triples, 412 comparisons of the grader against a physician.

| Comparison | Agreement | Sample |
|---|---|---|
| Grader against a physician | 75.0% [70.6%, 78.9%] | 412 |
| **Physician against another physician (the ceiling)** | **78.1%** | 33,435 |
| Chance | 63.5% | |

Reading 75.0% on its own would be misleading in both directions.

- It sounds low until you know that two physicians only agree with each other 78.1% of the time.
- On the 153 triples where both physicians agreed, which is the only subset with an unambiguous right answer, the grader agrees 82.4% of the time.
- The remaining 47 triples have no single right answer to agree with.

A published benchmark number is deliberately not treated as a target here. MedHELM reports 92.8% to 94.7% on comparable grading. That is above the physician-to-physician ceiling measured directly from this same source, so it cannot be agreement with individual physicians. Treating it as a like-for-like goal would mean asking the grader to beat the physicians it is being compared against.


## 8. Proving the test cannot be gamed

Across the whole corpus, the longest run of identical consecutive words shared between a criterion and the chart sentence that satisfies it is four words.

- No criterion in this corpus can be answered by matching text.
- A four-word overlap is an unavoidable clinical noun phrase like "right knee joint narrowing", not a restatement.
- Durations are never stated directly anywhere. They are recoverable only by subtracting dates from events that sit in separate documents.

This was enforced case by case as the corpus was built, and any case that violated it was regenerated.


## 9. The measurement I would put first next time

Synthetic corpus against real notes, side by side, never averaged together.

| Measure | Synthetic corpus (criteria verified by hand) | Real notes (criteria verified by hand) |
|---|---|---|
| Determinations answered correctly | 0.958 [0.933, 0.973] | **0.820** [0.733, 0.883] |
| How often it declines to answer | 1.2% | 16.0% |
| Of those refusals, how many were right | 0 of 5 | **87.5%** |

- Accuracy drops 13.8 points on real dictated notes, with ranges that do not overlap. Whatever the synthetic corpus measures, it measures it about 14 points too generously.
- The refusal flip is the more interesting half. On real notes the system declines to answer 16% of the time and is right to decline 87.5% of those times. On the synthetic corpus it declines 1.2% of the time and is right 0 out of 5.
- That contrast is an artifact of the corpus, not a change in behavior. Only 2 of 402 synthetic reference answers are non-determinable, so there is almost nothing there to correctly decline.
- The synthetic corpus under-represents genuine non-determinability, and that is its single largest gap.


## 10. Measures I do not trust, and why

- **Agreement between the two labelers, 0.982 on a scale where 1.0 is perfect.** This is a limitation showing up as a number, not a quality signal. Both labelers came from the same model family. They are separate instances, not separate families, so errors they share cannot surface as disagreement. For scale, two physicians on the public medical benchmark agree at about 0.38. A score of 0.98 on terse dictated notes is far more likely to mean shared blind spots than shared correctness.
- **Held-out policy performance.** Two observations, disagreeing by 20 points of precision. Two observations are not a rate.
- **Cost.** H2 and H5 count model calls, not dollars, tokens, or wait time. It is a proxy and it is labeled as one.
- **Every label except one.** No label in this project is validated by a clinician. The synthetic labels are true by construction, because each patient was generated from a written specification that states the answer. The five real-note labels are model labels that I adjudicated myself. The only physician-grounded measurement in the entire project is the grader calibration in section 7.
