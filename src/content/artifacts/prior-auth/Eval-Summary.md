---
title: "Eval summary"
hook: "The corpus, the strata, and what each configuration was allowed to see."
project: "prior-auth"
order: 3
source: "Prior Auth Agent/Artifacts/Eval-Summary.md"
---
# Eval Summary: Prior Auth Agent

A two-page read of the full results.

**Run date:** 2026-08-16. **Corpus freeze:** 2026-08-15. Every number below comes from a saved record of that one frozen run, and no measure was redefined after the results were seen.

**What is counted:** one determination, the system's answer about one policy criterion for one patient. 20 synthetic cases against 6 payer policies give 402 determinations. Each answer is one of three words, and they are the payer's own: **met** (the chart shows the criterion is satisfied), **unmet** (the chart shows it is not), **non-determinable** (the chart is silent, so no honest answer is available).

Everything here is built to catch a criterion claimed as met when the chart does not show it. That unsupported claim would appear in a document a physician signs and a payer reads.


## 1. Gates first

Two measures were named gates before the run. A gate is pass or fail, and no other result offsets it.

**Met precision:** of all the criteria the system called met, how many really are met? The bar was 0.95, and the honest worst case (the bracketed range, where the true value could sit given how few cases were measured) also had to stay above 0.90.

**Grounded citation:** does every chart sentence quoted as evidence actually exist in that chart, word for word? The bar is all of them, 1.00.

| What the system was given | Met precision | Honest range | Determinations | Gate | Grounded citation | Gate |
|---|---|---|---|---|---|---|
| Whole chart, criteria list verified by hand | 0.939 | [0.879, 0.970] | 114 | **FAIL** | 1.000 | PASS |
| Whole chart, criteria list pulled by the system | 0.938 | [0.877, 0.969] | 112 | **FAIL** | 1.000 | PASS |
| Only the retrieved excerpts, criteria verified by hand | 0.903 | [0.834, 0.945] | 113 | **FAIL** | 1.000 | PASS |
| Only the retrieved excerpts, criteria pulled by the system | 0.922 | [0.853, 0.960] | 102 | **FAIL** | 1.000 | PASS |
| Whole chart, criteria verified by hand, arithmetic shortcut switched off | 0.939 | [0.879, 0.970] | 114 | **FAIL** | 1.000 | PASS |
| The real dictated notes (scored separately) | 1.000 | [0.722, 1.000] | 10 | **FAIL** | 1.000 | PASS |

The met precision gate failed on every configuration. The best result, 0.939, misses on both halves of the bar. There, 7 of 114 criteria the system called met are not met according to the reference answer, which is the correct answer recorded in advance: seven unsupported clinical claims, in signed documents. The finding is that the system missed the gate. The gate does not move.

The real-notes row fails for a different reason and must not be read as a quality result. Only 10 determinations were available, and 10 cases cannot put a worst case above 0.90 no matter how many are right. That is a failure of resolution, not an observed error, and it is labeled as one.

Grounded citation passes at 1.000 everywhere, by construction: the scoring step finds every quoted sentence in the original chart itself and throws away anything it cannot locate. The system cannot invent a quotation, because an invented quotation would not be there to find.

That gate earned its keep on the first pass. Reading only retrieved excerpts, the system counted sentence positions inside the excerpt while labeling them with the whole document, so every citation in that mode pointed at the wrong place. Grounded citation read 0.000 (0 of 187). An all-or-nothing bar turned a silent bookkeeping bug into an unmissable zero.


## 2. Six predictions, written down before the run

| | Prediction | Result |
|---|---|---|
| H1 | Reading the whole chart beats reading excerpts on how many met criteria get found, by more than 5 points | **NOT CONFIRMED** (4.46 points) |
| H2 | A cheap checker first, escalating only the doubtful cases, catches most of what a large model catches at a fraction of the cost | **CONFIRMED, and the confirmation is worthless** |
| H3 | Mistakes made pulling criteria out of the policy do not multiply downstream | **CONFIRMED** |
| H4 | Met precision is better on clean and clearly deficient cases than on borderline ones | **NOT CONFIRMED** |
| H5 | Sending plain comparisons to arithmetic instead of the model cuts cost by more than 15% with no accuracy loss | **CONFIRMED** |
| H6 | The same evidence gets different answers under a strict policy and a loose one | **CONFIRMED** |

**H1, not confirmed.** Reading the whole chart is ahead on every arm, but by 4.46 points against a bar of 5, and a corpus this size cannot tell a 4.5-point gap from noise. Of 21 non-determinable answers under excerpt reading, 15 are genuine holes in the documentation and only 6 are passages the excerpt step missed. On charts this short there is not much to miss.

**H3, confirmed.** With the criteria list verified by hand the system answered 0.958 of determinations correctly; with the list it pulled itself, 0.930. The damage is 0.0274 against an upstream miss rate of 0.228, an order of magnitude smaller than itself, because many of the criteria the extractor misses are ones the chart could not have satisfied anyway.

**H4, not confirmed.** Borderline cases are 8.1 points worse, exactly the predicted direction, but only 24 borderline determinations exist and their range overlaps everything else heavily. This is a sample-size result, not evidence that borderline cases are easy.

**H5, confirmed.** Sending plain comparisons (is the recorded BMI over the cutoff) to arithmetic cut model calls 23.6%, 307 instead of 402, with accuracy ranges overlapping. Arithmetic is marginally more accurate, because a subtraction does not misread a BMI.

**H6, confirmed, with a caveat that matters.** Two pairs of cases carry identical documented conservative therapy in the 6 to 10 week range. Under a commercial policy with a binding 12-week threshold the system returns unmet. Under Medicare's non-binding "usually 3 months" it does not. It is reading the policy, not pattern-matching a rubric. The caveat: on the Medicare side it returned met where the reference answer says non-determinable, reading the non-binding wording correctly and then over-committing, treating "the policy does not forbid this" as "the record demonstrates this."


## 3. The headline failure: the pre-output safety check is undeployable as built

Before any request leaves the system, every clinical claim is checked against the chart sentence it cites: does that sentence support the claim, or does it merely look related? The check runs cheap first, using a small model that runs locally at no cost, and escalates only what it is unsure about to a large model. H2 confirmed on its registered terms, but the detail below overturns the apparent win.

| Kind of claim-and-citation pair | Pairs | Cheap local checker | Large model |
|---|---|---|---|
| Citation is genuinely correct | 72 | **0.333** | 0.903 |
| Planted near-miss, built to look right and be wrong | 20 | 0.950 | 1.000 |
| Citation belongs to a different criterion | 112 | 0.991 | 0.991 |

The cheap checker rejects two-thirds of correct citations. It scores well on catching bad ones mainly because it rejects nearly everything. Wired into its real job, across 100 requests carrying 555 clinical claims:

| Quantity | Value |
|---|---|
| Claims rejected by the cheap checker | 314 |
| Of those, the reference answer says met | **280 of 314 (89.2%)** |
| Claims still marked unsupported after the full check | **326 of 555 (58.7%)** |
| Requests carrying a review-required banner | **100 of 100** |

Every single request is flagged for human review, which is operationally identical to having no check at all.

The escalation design fails for a second, separate reason. It escalates what the cheap model is unsure about, and the cheap model rejects correct citations confidently, so those cases never escalate. The design assumed errors would look uncertain. They do not. The large model upholds 92.7% of the doubtful tail it does receive, which is direct evidence that the rejections are wrong.

**The fix:** the cheap checker cannot be trusted to reject on this kind of text. It should stay silent when it wants to reject, or be replaced, and the large model should see everything it rejects. That is recorded as a recommendation. The configuration reported here stays the one that was registered.


## 4. What happened on real notes

Five real dictated orthopedic notes, scored separately and never averaged in with the synthetic corpus.

| Measure | Synthetic corpus (criteria verified by hand) | Real notes (criteria verified by hand) |
|---|---|---|
| Determinations answered correctly | 0.958 [0.933, 0.973] | **0.820** [0.733, 0.883] |
| How often it declines to answer | 1.2% | 16.0% |
| Of those refusals, how many were right | 0 of 5 | 87.5% |

- A 13.8-point drop, with ranges that do not overlap. Whatever the synthetic corpus measures, it measures about 14 points too generously.
- The refusal flip is the more useful half. On real notes the system declines often and is right to decline 87.5% of the time.
- That contrast is an artifact of the corpus, not a change in behavior. Only 2 of 402 synthetic reference answers are non-determinable, so there is almost nothing there to correctly decline. That under-representation is the corpus's single largest gap.


## 5. Pulling the criteria out of the policy

Six policies. The system's criteria list and the hand-verified one went to an independent grader as unlabeled set A and set B, with which was which fixed by a coin flip decided in advance and the criteria shuffled. The grader was never told which list came from the system.

<pre class="mermaid">
flowchart LR
  authored["Criteria list verified by hand"] --&gt; pair["Presented as unlabeled set A and set B"]
  extracted["Criteria list pulled by the system"] --&gt; pair
  pair --&gt; flip["Order fixed by a coin flip decided in advance, criteria shuffled"]
  flip --&gt; judge["Independent grader compares them"]
  judge --&gt; verdict["Do the two lists say the same thing?"]
</pre>

| Measure | Value | n |
|---|---|---|
| Of the criteria the system pulled, how many exactly match a real one | 0.670 | 91 |
| Of the real criteria, how many the system found exactly | 0.772 | 79 |
| Criteria stating exactly one condition, not two bundled together | 0.945 | 91 |
| Criteria correctly sorted as plain arithmetic | 0.800 | 25 |
| Of criteria that really are plain arithmetic, how many were sorted that way | 1.000 | 20 |

This falls well short of the 0.90 expected in writing beforehand, and the shape of the miss is the finding. Counting near-misses as matches lifts the two numbers to 0.846 and 0.975, so the extractor almost always finds the right subject matter and then gets the threshold, the qualifier, or the scope wrong. On a prior authorization criterion the threshold is the entire decision, which is why a near-miss does not count.

The sorting step behaves exactly as feared. It found every criterion that genuinely is plain arithmetic, but 5 that need clinical judgment were sorted into arithmetic anyway. That direction was named as the dangerous one before the run: it sends clinical judgment to a subtraction and threatens the precision gate. The failed gate and this number should be read together.


## 6. Proving the test cannot be gamed

Across the whole corpus, the longest run of identical consecutive words shared between a criterion and the chart sentence that satisfies it is four words. No criterion here can be answered by matching text. Durations are never stated anywhere; they are recoverable only by subtracting dates from events sitting in separate documents. Nothing on this corpus can be scored by pattern matching.


## 7. Limitations, published rather than admitted under questioning

- One model family throughout. The chart generator, both labelers, both graders, and the large-model checker all come from it. They are separate instances, not separate families, so they can share blind spots. The agreement score of 0.982 between labelers is that limitation showing up as a number.
- No label in this project is validated by a clinician, except the grader calibration, which is the only physician-grounded measurement anywhere in the work.
- The held-out policy result rests on 2 observations, and they disagree by 20 points of precision.
- The policy corpus is not fully independent. Two policies share an identical typo and list the same four alternative diagnoses in the same order, pointing to a common source upstream.
- One policy takes effect after the corpus freeze date. Published and current, but not yet operative.
- The fictional patient generator models no imaging and no corticosteroid injections for osteoarthritis, so those criteria come from the written case specification instead.
- Public policies stand in for InterQual and MCG, the proprietary criteria sets many payers actually use. One major payer's published knee policy contains no medical-necessity criteria at all and defers entirely to InterQual, which is why it could not be included.
- One service line only, knee arthroplasty. No claim of generalization.
- Cost is a proxy. Model calls were counted, not dollars, tokens, or wait time.
- The claim-and-citation pairs used to test the checker were constructed, not annotated by hand. A citation borrowed from a different criterion could happen to support its target, which would understate how often the checker wrongly rejects.


## 8. Defects the measurement found and the product fixed

1. **Citations pointing at the wrong place.** In excerpt mode, sentence positions were counted inside the excerpt but labeled with the whole document. Caught by the grounded citation gate reading 0.000.
2. **The system misreporting how it answered a criterion.** With the arithmetic shortcut switched off, a criterion was recorded as settled by arithmetic when the model had in fact been asked. The record now names the check that actually ran.
3. **Evidence checked one sentence at a time when it takes two.** A physical therapy start date and a discharge date establish a duration jointly, and neither does alone. Sentence-by-sentence checking failed 612 of 832 pairs. The check now judges each claim against every sentence it cites, together.

None of the three was found by reading output. All three were found by arithmetic that refused to reconcile. The third was found twice, independently, in two places, and the first full-scale measurement pass was thrown away because of it.
