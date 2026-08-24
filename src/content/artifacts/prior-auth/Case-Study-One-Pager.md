---
title: "Case study"
hook: "The workflow, safety bar, measured results, and recommendation."
project: "prior-auth"
order: 0
source: "Prior Auth Agent/Artifacts/Case-Study-One-Pager.md"
---
# Case Study: Prior Auth Agent

**Role:** Product. Problem framing, core concepts, evaluation design, gate selection, ship decision.
**Status:** Built and measured as a prototype. The decision was not to ship.
**Built from:** six real published payer policies, fictional patient charts from a generator that makes realistic records of people who do not exist, a public collection of real dictated medical notes with patient details removed, a public set of physician-answered medical questions (used to check the grader), and 127 automatic checks on the system's own behavior.


## The problem, in one person's day

A patient needs a knee replacement. Before it can be scheduled, the insurer wants proof that this patient meets its coverage criteria: how many weeks of conservative therapy were tried, what the imaging showed, whether pain interferes with daily activities. Those criteria sit in a PDF on the payer's website. The proof, if it exists, is scattered across the chart. Someone in the practice has to connect the two, one criterion at a time. The patient waits on that.

Every payer writes its own criteria, and Medicare writes different ones again. The same evidence can be enough under one policy and short under another, and the difference is often a single word: "must" versus "usually." Denials are frequently about missing documentation, not missing care.


## Why the obvious solution fails

The obvious solution is to hand the chart and the policy to a language model and let it write the request. What makes that insufficient is the shape of the mistake it makes. The dangerous output is not a badly written letter. It is a sentence asserting that a criterion is satisfied when the chart does not show it, in a document a physician signs and a payer reads.

So the product question is not "can a model draft this." It is "can a model be stopped from claiming more than the record supports, and can that be proven with numbers."


## What I built

Four steps, and a scoring system that grades them.

<pre class="mermaid">
flowchart LR
  criteria["Step 1: pull the criteria out of the payer's policy"] --&gt; evaluate["Step 2: decide each criterion against the chart"]
  evaluate --&gt; gate["Step 3: check every quoted passage before anything leaves"]
  gate --&gt; compose["Step 4: draft the request a physician signs"]
  compose --&gt; grader["Scoring system grades the result"]
</pre>

Each criterion gets one of three answers, in the payer's own words: **met** (the chart shows the criterion is satisfied), **unmet** (the chart shows it is not), and **non-determinable** (the chart is silent, so no honest answer is available).

Measured over:

- 20 fictional patient cases against 6 policies, giving 402 determinations in the main corpus
- 5 real dictated orthopedic notes, held out and never averaged into the fictional-chart numbers
- 100 drafted requests carrying 555 clinical assertions, every one checked before output
- 204 hand-built passage-and-claim pairs with known right answers, and a grader calibrated against 412 comparisons between its judgments and physicians'


## The product decisions worth defending

1. **Non-determinable is a first-class answer, not a failure.** A silent chart is not a negative chart. The single labeling disagreement in the whole real-note slice turned on exactly this, and was settled as non-determinable.
2. **Evidence is verified by the system, not requested from the model.** The scoring step goes back to the chart and finds the quoted sentence itself. Anything it cannot find word for word is discarded, and a met determination left with no surviving quotation is downgraded to non-determinable. The system can only point at sentences that exist in the chart, so it is not able to invent a quotation. The result is 1.000 by construction, not by luck.
3. **Precision is gated, recall is only reported.** A request weaker than the record supports can be strengthened by a human. A confident false claim leaves the building.
4. **Deciding which criteria need judgment is biased toward judgment.** Calling a criterion a plain factual comparison ("is the patient over 18") when it really needs clinical judgment sends that judgment to arithmetic, which is unsafe. Erring the other way only wastes money.
5. **The system never claims approval.** It states what the record supports. Predicting a payer's decision invites reliance the evidence cannot carry.


## Results

Two measures were gated, meaning pass-or-fail bars were fixed before the run. **met-precision** asks: of the criteria the system declared met, what share really were met. **Grounded citation** asks whether every quoted passage genuinely exists in the chart. Bracketed ranges are the honest range the true value could sit in, given how few cases were measured.

| | |
|---|---|
| **met-precision (bar: 0.95, with the honest worst case still above 0.90)** | **0.939 [0.879, 0.970], n = 114. FAIL on all six configurations** |
| Grounded citation (bar: exactly 1.00) | 1.000 on all six configurations, by construction |
| Determination accuracy, fictional charts, criteria list verified by hand | 0.958 [0.933, 0.973], n = 402 |
| Determination accuracy, fictional charts, criteria list pulled by the system | 0.930 [0.901, 0.951], n = 402 |
| Determination accuracy, real dictated notes, criteria list verified by hand | 0.820 [0.733, 0.883], n = 100 |
| **Requests carrying a review-required banner** | **100 of 100** |
| Correct citations thrown out by the cheap first-pass checker | 280 of 314 (89.2%) |
| Sending plain factual comparisons to arithmetic instead of the model | 23.6% fewer model calls, accuracy ranges overlap |
| Criteria pulled from a policy that exactly match the hand-verified list | 0.670, n = 91 |
| Named gaps where the suggested document would genuinely settle the criterion | 42 of 47 (89.4%), 0 wrong |
| Longest run of identical words shared by a criterion and the chart sentence proving it | 4 words |

The two gates were measured on the same six configurations and came out opposite. Grounded citation passed in all six. met-precision failed in all six, including the best.


## The decision

**No ship.** The reasoning is in the launch decision memo.

At the best configuration (whole chart given to the model, criteria list verified by hand), 7 of 114 determinations returned as met are not met according to the answer recorded as correct. In deployment each of those is an unsupported clinical claim under a physician's signature.

The safety control built to catch what the gate misses put a review-required banner on 100 of 100 requests, which is operationally the same as having no gate.

The rule written alongside the bar was: if a bar is missed, the finding is that the system missed the bar. The bar does not move.


## Results that contradicted my own predictions

Reported as such, because a project where every prediction lands was not really tested.

- **Prediction 1, not confirmed.** I predicted that giving the model the whole chart would beat giving it only the most relevant excerpts by more than 5 points on how many genuinely met criteria it finds. Measured gap: 4.46 points, with overlapping ranges. Why the gap is small: of 21 non-determinable results in the excerpts-only setting, 15 are genuine documentation gaps and only 6 are excerpts that missed the right passage. On charts this short there is not much to miss.
- **Prediction 4, not confirmed.** I predicted met-precision would be higher on clean and clearly deficient cases than on borderline ones, by a margin larger than the measurement range. The direction was right (borderline is 8.1 points worse) but 24 borderline determinations cannot resolve an 8-point difference. Reading the overlap as "the corpus is not actually harder" would be over-reading it the other way.
- **Prediction 2 confirmed, on a metric that turned out to be the wrong one.** This is the most useful finding in the project. The cheap checker catches about 99% of bad citations at no model cost, so the 75% bar registered for it was close to impossible to fail. What that hid: the cheap checker scores 0.333 on correct citations against the large model's 0.903. It scores well on catching bad citations mainly because it rejects nearly everything.
- **Escalation was designed around confidence, and that assumption was wrong too.** It assumed mistakes would look uncertain, so only the least confident cases went for a second opinion. The cheap checker rejects correct citations confidently, so those cases were never escalated.


## How I found the defects

Three defects. None was found by reading output. All three surfaced as arithmetic that failed to reconcile.

1. **Quotations pointing at the wrong place.** Reading only selected excerpts of a chart, the system counted positions from the start of the excerpt but labeled them as positions in the whole document. The all-or-nothing citation check read 0.000 (0 of 187) and turned a silent bookkeeping error into an unmissable zero.
2. **The system's record of its own work disagreed with what it did.** A criterion was recorded as settled by simple arithmetic when the model had in fact been asked. Caught by an automatic consistency check, not by an eye.
3. **Evidence that only works in pairs was checked one sentence at a time.** A physical therapy start date and a discharge date establish a duration jointly, and neither does alone. Sentence-by-sentence checking failed 612 of 832 pairs. Found twice, independently, in two places, and the first full-system measurement was discarded because of it.

Two measurements pointed at one cause from opposite sides: the citation check flagged 58.7% of assertions, and the grader scoring the drafted request rated its use of evidence 2.56 out of 5 while rating completeness 5.00 and professional form 4.96. Structure at the ceiling, evidence usability on the floor.


## What this project established

- **A measurement approach:** two bars fixed before the run under the rule that a missed bar does not move, six predictions registered in advance and all reported, every rate carrying an honest range and a stated denominator, and a grader never reported without its human ceiling (75.0% against a physician-to-physician ceiling of 78.1%).
- **Tradeoffs made explicit:** safety against usability measured rather than argued (a gate that flags everything is unusable), cost against accuracy (23.6% fewer calls, overlapping accuracy), and fictional data against real data (a 13.8-point drop on a five-note holdout).
- **Benchmark construction:** no benchmark existed. I built the test corpus, criteria checklists, combination rules, control conditions, overlap rule, and acceptance bars.
- **Implementation detail:** the core vocabulary, flat checklist, locatable-quotation requirement, and step-by-step diagnosis of the citation checker are all documented.


## What I would defend

- Catch rate read 99%, while the rate at which genuine citations were wrongly rejected read 0.667. The second metric revealed that the safety check was unusable.
- Verbatim span lookup prevents fabricated evidence. The evaluation also checks whether the citation checker is rejecting everything, which this one was.
- The safety bar names a specific harm and stays fixed when the system misses it.
- A four-word overlap ceiling was enforced when each case was admitted, and cases that broke it were regenerated. Durations can be recovered only from dated events in separate documents, so matching text cannot solve the benchmark.
- Every labeler, grader, and checker came from one model family. Their 0.982 agreement, compared with about 0.381 between two physicians, is a limitation rather than a quality signal.
