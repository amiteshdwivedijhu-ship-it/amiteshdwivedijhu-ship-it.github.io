---
title: "Launch decision"
hook: "The ship call, made against my own system."
project: "prior-auth"
order: 6
source: "Prior Auth Agent/Artifacts/Launch-Decision-Memo.md"
---
# Launch Decision Memo: Prior Auth Agent

**Decision:** do not ship. The gate that decides whether this is a product was missed on every configuration, and the safety control built to catch what that gate misses flags 100% of requests.

**Date:** 2026-08-22
**Basis:** one frozen benchmark run. Run date 2026-08-16, corpus freeze 2026-08-15. 20 cases against 6 policies, 402 determinations on fictional charts, 100 drafted requests, 555 clinical assertions checked before output. Every gate and every prediction was written down before the run and could not be edited afterward.


## 0. What is being decided, and what the words mean

The product drafts a prior authorization request: the document a practice sends a payer to prove a patient meets the coverage criteria for a knee replacement. It gives a verdict on each criterion, using the payer's own vocabulary. **Met** means the chart shows the criterion is satisfied. **Unmet** means the chart shows it is not. **Non-determinable** means the chart is silent, so no honest answer is available.

The failure that matters is a criterion asserted as met when the chart does not show it, in a document a physician signs. So the gate that decides everything is **met-precision**: of all the criteria the system declared met, what share really were met. The bracketed ranges below are the honest range the true value could sit in, given how few cases were measured.


## 1. The call

| Product surface | Decision | Why |
|---|---|---|
| A prior auth request drafted for a physician to sign | **No ship** | met-precision is 0.939 [0.879, 0.970]. The bar was 0.95, with the honest worst case still above 0.90. Missed on all six configurations |
| The evidence check that runs before anything leaves the system | **No ship as configured** | Review-required banner on 100 of 100 requests. 89.2% of what the cheap first-pass checker rejects are citations the recorded correct answer calls met |
| Reading a policy into a criteria checklist, sold on its own | **No ship** | Exact matches against a hand-verified checklist: precision 0.670, recall 0.772, against a 0.90 expectation registered in advance |
| Gap finder: name the documentation that is missing | **Hold. Best narrow candidate** | 42 of 47 named gaps (89.4%) name documentation that would settle the criterion, 0 wrong. But no bar was ever registered for this surface |
| Sending plain factual comparisons to arithmetic instead of the model | **Keep** | 23.6% fewer model calls with overlapping accuracy ranges. This is plumbing, not a product |
| Any prediction that a request will be approved | **Never build** | The system states what the record supports. Predicting a payer's decision invites reliance the evidence cannot carry |
| Anything outside knee arthroplasty | **No claim, either way** | One service line was measured. There is no evidence in either direction |


## 2. Gates and predictions, written before the run and reported against

The two gates

| Gate | Bar | Result |
|---|---|---|
| met-precision: of the criteria called met, how many really were | 0.95 or higher, and the honest worst case still above 0.90 | **FAIL on all six configurations.** Best is 0.939 [0.879, 0.970], n = 114. Missed on both halves of the bar |
| Grounded citation: every quoted sentence exists in the chart | Exactly 1.00 | PASS at 1.000 on all six configurations, by construction |

Both gates were measured on the same six configurations, and they came out opposite. Every configuration passed the citation gate. Every configuration missed the precision gate. One of the two gates failed, and it is the one that decides whether this is a product.

The six predictions

| | Prediction, written before the run | Result |
|---|---|---|
| 1 | Giving the model the whole chart beats giving it only the most relevant excerpts, by more than 5 points, on how many genuinely met criteria it finds | **NOT CONFIRMED.** 4.46 points |
| 2 | Sending only the least confident 15% of cases to the large model recovers over 75% of what an all-large-model check would catch, at under 25% of the cost | CONFIRMED, on a metric that turned out to be the wrong one |
| 3 | Errors in reading the policy hurt the final answers less than proportionally | CONFIRMED. Accuracy falls 0.0274 against an upstream error rate of 0.228 |
| 4 | met-precision is higher on clean and clearly deficient cases than on borderline ones, by a margin larger than the measurement range | **NOT CONFIRMED.** 8.1 points, ranges overlap, n = 24 borderline |
| 5 | Sending plain comparisons to arithmetic cuts cost by over 15% with no accuracy loss beyond the measurement range | CONFIRMED. 23.6% |
| 6 | The same evidence gets different verdicts under a strict policy and a loose one | CONFIRMED, with an over-commitment caveat |

Expectations registered in advance that were missed, but were not gates

| Expectation | Bar | Result |
|---|---|---|
| Reading a policy into a criteria checklist | 0.90 registered expectation | 0.670 precision and 0.772 recall on exact matches |
| Correctly telling a plain comparison from a judgment call, registered in advance as the dangerous direction | Calling judgment calls plain comparisons threatens the precision gate | 0.800. Five criteria wrongly called plain comparisons. The dangerous direction happened |

<pre class="mermaid">
flowchart TD
  run["One frozen benchmark run"] --&gt; gates["Two bars, both fixed before the run"]
  gates --&gt; citation["Does every quoted sentence exist in the chart?"]
  gates --&gt; precision["Of the criteria called met, how many really were?"]
  citation --&gt;|"Passes on all six configurations"| norship
  precision --&gt;|"Missed on all six configurations"| norship["Decision: no ship"]
  norship --&gt; fix["Fix the mechanism behind the miss"]
  fix --&gt; remeasure["Measure again before any retry"]
</pre>


## 3. Why a missed gate is not offset by good numbers elsewhere

Plenty of numbers look good. None of them changes the call.

| Good number | Why it does not help |
|---|---|
| Determination accuracy 0.958 [0.933, 0.973] on fictional charts with a hand-verified criteria checklist, and 0.930 with a checklist the system pulled itself | An average across met, unmet, and non-determinable. The gate is about one error type in one direction |
| Grounded citation 1.000 | Proves the quoted sentence exists. It does not prove the sentence supports the claim |
| Request completeness 5.00 and professional form 4.96 out of 5 | Structure and tone at the ceiling. Use of evidence is 2.56 |
| 23.6% fewer model calls | Cost savings on a system that cannot ship are worth nothing |

The reasoning behind that structure:

- A single weighted overall score was rejected before the run, deliberately. A composite lets good usefulness numbers buy off a safety failure. That is the wrong shape for a clinical document a physician signs.
- The failure is "a criterion is asserted as met when the chart does not show it," in a signed document, sent to a payer.
- At the best configuration, 7 of 114 determinations returned as met are not met according to the recorded correct answer. Across 100 requests the system emitted 555 clinical assertions. This is not a rounding error at volume.
- The bar was set at 0.95 rather than 0.99 because a corpus this size cannot tell the difference between 0.98 and 1.00. It was set to what the evidence can actually distinguish, so missing it is a real miss and not a stretch target.
- The finding is that the system missed the gate. The gate does not move. That rule was written before the run so the temptation to soften it after seeing results had nowhere to go.


## 4. What would change the decision

In the order I would try them.

**1. The cheap first-pass checker stops rejecting on its own authority, and the large model sees everything it doubts (try first)**

- On correct citations the cheap checker scores 0.333. The large model scores 0.903 on the same pairs.
- Run over full requests, 280 of 314 cheap-tier rejections (89.2%) are citations the recorded correct answer calls met.
- The large model upholds 92.7% of the uncertain cases it already receives, which is direct evidence the rejections are wrong.
- Today only 165 of 555 assertions (29.7%) reach the large model in the full system. (The 13.7% escalation rate quoted for prediction 2 comes from the standalone 204-pair set, a different population.) Sending everything the cheap checker doubts raises cost. That is the correct trade, because the alternative is a human reviewing 100% of every request by hand.
- This is a mechanism fix, not a tuning exercise, which is why it goes first.

**2. Measure met-precision again once the evidence check works**

- A check that can be trusted when it rejects something is also the mechanism that could raise met-precision, because a rejected assertion should pull its determination down.
- The pattern already exists in the system: a met determination left with no locatable quotation is downgraded to non-determinable.
- This is untested and is stated as a hypothesis, not a claim. It is worth measuring before any prompt work.

**3. Fix the over-commitment defect**

- Under Medicare's non-binding "usually 3 months" wording, the system returned met on both cases where the recorded correct answer says non-determinable.
- It read the non-binding language correctly, then treated "the policy does not forbid this" as "the record demonstrates this."
- The rule to add is narrow: non-binding policy language cannot license a met on its own.
- Cheap, and it targets exactly the error class the missed gate is made of.

**4. Rebuild the corpus so it contains genuine ambiguity**

- Only 2 of 402 correct answers on the fictional charts are non-determinable. Whether the system declines to answer well is effectively unmeasurable there.
- On fictional charts the agent declines 1.2% of the time and is right 0 out of 5. On real dictated notes it declines 16.0% of the time and is right 87.5% of those times.
- That contrast is an artifact of the corpus. The fictional charts under-represent genuine non-determinability, and that is their largest single gap.

**5. Fix what the policy reader gets wrong, not how much it misses**

- Counting near-matches lifts precision from 0.670 to 0.846 and recall from 0.772 to 0.975.
- So it almost always finds the right subject matter and gets the threshold, the qualifier, or the scope wrong.
- On a prior auth criterion the threshold is the whole decision. That is why a near-match does not count as a match, and it is where the work should go.

**6. Get clinician labels, or stop quoting accuracy numbers externally**

- No correct answer in this project was validated by a clinician, except the grader calibration.
- Two labelers from the same model family agree at 0.982. Two physicians on a public physician-answered benchmark agree at about 0.381.
- Agreement of 0.98 on terse dictated notes is far more likely to mean shared blind spots than shared correctness.

**What I would not do: tune the prompt to chase the gate.**

- The miss is 7 errors out of 114 at the best configuration, on 402 determinations from one service line.
- Prediction 4 says the borderline cases are 8.1 points worse, but 24 determinations cannot resolve an 8-point difference.
- There are two named mechanisms sitting upstream of the gate: a mis-calibrated evidence check, and five criteria wrongly treated as plain comparisons. Mechanisms get fixed before prompts. Prompt work here would be fitting noise.


## 5. What we kill

**The three-step evidence check as specified, with escalation keyed on confidence.**

- Checking in cheap-then-expensive steps can work. This design failed because escalation depended on the cheap model's confidence, and nobody first measured whether that confidence tracked correctness.
- It does not. The cheap model rejects correct citations confidently, so those cases are never escalated.
- Either the trigger changes so the cheap checker never rejects on its own, or the step goes.

**Catch rate as the headline measure of the evidence check.**

- Catch rate is about 99% at no model cost, which made the registered 75% recovery bar close to impossible to fail on this corpus.
- The rate at which genuine citations are wrongly rejected replaces it. Under the cheap checker alone that rate is 0.667.
- The convenient metric said the design worked. The useful metric said it was undeployable.

**Any number that averages fictional charts together with real notes.**

- With the criteria checklist verified by hand in both cases, 0.958 on fictional charts versus 0.820 on real notes, with non-overlapping ranges. An average would hide a 13.8-point drop.

**The phrase "working prototype."**

- The model's answers were recorded once and are replayed, so a run reproduces exactly and for free. Every safeguard genuinely runs on every replay, but nothing here calls a live model.
- The work produced a scoring system that grades the four-step process against known correct answers, an offline demo that runs it end to end, and 127 automatic checks on the system's behavior. The evidence supports calling it a measured prototype. It does not support calling it a deployed system.


## 6. What held up and should be kept

- **Evidence verified by the system rather than requested from the model.** 1.000 on all six configurations. It earned its keep immediately: it read 0.000 (0 of 187) and exposed a bookkeeping error that pointed every excerpt-mode citation at the wrong place in the chart.
- **Non-determinable as a first-class answer.** The one labeling disagreement in the entire real-note slice turned on whether a silent record licenses an unmet. It was settled as non-determinable, which is exactly the harm that answer type exists to prevent.
- **Biasing the plain-comparison test toward judgment.** It found every genuine plain comparison, 1.000, and of the criteria it called plain comparisons, 0.800 really were. The bias made the five mistakes a visible failure instead of a silent one.
- **The flat criteria checklist.** One criterion produces exactly one determination, which keeps the denominator unambiguous under every way the results are sliced.
- **The corpus admission rule: at most 4 identical words shared between a criterion and the chart sentence that proves it.** No criterion here can be satisfied by matching text. It is the rule that makes every other number mean something.
- **The grader reported with its human ceiling.** It agrees with physicians 75.0% [70.6%, 78.9%] of the time, against physicians agreeing with each other 78.1% of the time, and 82.4% on the 153 cases where both physicians agreed with each other.


## 7. Risks if we ship anyway

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| An unsupported met reaches a payer under a physician's signature | High. 7 of 114 at the best configuration | Compliance exposure for the practice, audit and reversal risk for the patient | Do not ship until the precision gate passes |
| Reviewers learn to click past the review-required banner | High. It fires on 100 of 100 requests | The primary oversight control stops working, so the gate protects nobody | Fix the cheap checker before shipping the gate at all |
| Real charts behave worse than the corpus | High. 0.820 on five real notes against 0.958 on fictional ones, both with a hand-verified criteria checklist | Every published number overstates deployed quality by roughly 14 points | Never quote fictional-chart numbers as deployed performance |
| Non-binding policy wording read as permission | Observed on both relevant case pairs | A quieter version of the false met | Open defect. No control today |
| A judgment call answered by arithmetic | Medium. 0.800 precision, five criteria | Confident wrong verdict on a criterion that needed judgment | Fix the five, keep the bias toward judgment |
| Users read the output as a prediction of approval | Medium | Reliance the evidence cannot carry | The system never claims approval. Keep that boundary in product copy |
| Someone extends it to a second service line | Low today | No evidence in either direction | No claim of generalization, and rebuild the corpus before any extension |


## 8. The honest summary

- Two gates, measured on the same six configurations. One passed on all six, by construction. One failed on all six.
- The most useful result in the project was prediction 2, not a gate. It confirmed, and saying why the confirmation is worthless is more valuable than the confirmation. Catch rate was the convenient measure. Wrongly rejecting genuine citations was the useful one, and the two pointed in opposite directions.
- Two of six predictions did not confirm and one confirmed on the wrong measure. That is the honest yield of registering six in advance.
- Three defects. None was found by reading output. All three surfaced as arithmetic that failed to reconcile: a gate reading 0.000, a record naming a check that never ran, and 612 of 832 pairs failing because a start date and a discharge date establish a duration jointly and neither does alone.
- That third defect was found twice, independently, in two different places. The first full-system measurement was discarded because of it.
- The five-note real-chart slice is too small for a conclusion, but the warning it produced still changed the recommendation.
- Two of the three technical safety controls are failing. The one that works does so by construction rather than by observation. The system does not ship.
