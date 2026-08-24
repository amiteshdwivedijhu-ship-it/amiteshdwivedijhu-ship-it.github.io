---
title: "Launch decision"
hook: "Why the stability number outranks the accuracy numbers."
project: "10k-risk"
order: 5
source: "10K Risk Extractor/Artifacts/Launch-Decision-Memo.md"
---
# Launch Decision Memo: 10-K Risk Extractor

**Decision:** do not ship the alerting product on these numbers. Ship a narrower product, or fix run-to-run consistency first.

**Date:** 2026-08-22
**Basis:** one benchmark run, recorded once and never rerun. 20 filings, 3,216 risk claims. Every kill criterion below was written down before the run produced a number.


## 1. The call

The product marks a risk as newly disclosed when it judges that the risk appears in this year's filing and did not appear last year. That judgment is what an analyst acts on, and it is what fails here.

| Product surface | Decision | Why |
|---|---|---|
| Alerting an analyst when a company discloses a new risk | **No ship** | Run the same filing three times and the lists of newly disclosed risks agree anywhere from 0.10 to 0.92 by company |
| Structured extraction with every claim tied to its source sentences | **Ship** | Every metric that needs no human judgment passes |
| An aggregate risk score | **Never build** | Strips the traceability that is the product |
| Two modes: Screening for fast filtering, Memo for client documents | **Kill as specified** | The two are 2.3 coverage points apart |
| The newly-disclosed flag sold on its own | **Hold** | No evidence that it predicts anything |


## 2. Kill criteria, written before the run and reported against

| Criterion | The bar, and what failing it would mean | Result |
|---|---|---|
| Quotations the system invented | Near zero, otherwise not shippable at all | Structurally impossible. PASS |
| False alarms on filings where nothing changed | A high rate makes Screening Mode unusable | 0% on both. PASS |
| Claims in Memo Mode the quoted sentence does not support | Near zero | Hidden by design. 1.8% across all filings. PASS |
| Accuracy inside a single category falling below a junior analyst's | The categories are wrong, not the model | Not testable. Too few examples per category |
| Two independent AI graders failing to agree | The task itself is under-specified, so fix the instructions first | Agreement score of 0.848, on a scale that already corrects for the agreement two graders would reach by luck. PASS |
| **Run the same filing three times: how much do the three lists of newly disclosed risks agree?** | An alert that vanishes is worse than no alert | **Tripped. 0.10 to 0.92, and zero consensus on Boeing** |

One criterion out of six tripped. It is the one that decides the flagship use case.


## 3. Why one failed criterion outweighs five passes

- The accuracy numbers and the consistency number disagree about whether this ships.
- A system can be well calibrated on average and useless in practice. Only running it repeatedly on the same input reveals that.
- For an alerting product the failure mode is not "sometimes wrong." It is "the same filing gives a different answer on Tuesday." No usefulness metric offsets that. An analyst stops trusting an alert stream the first time a flag disappears.


## 4. What would change the decision

In the order I would try them.

**1. Fix the drift at its source. Try first, roughly no added cost.**
- On an unchanged filing, the number of claims pulled out varies from 189 to 194. That wobble upstream is what propagates into false change downstream.
- Break both years into claims in one pass, so the boundaries between claims are chosen once instead of independently for each year.
- This removes the mechanism rather than compensating for it later.

**2. Report confidence instead of a yes or no. Three times the cost, ship it as a user-facing option.**
- Run the filing three times and surface only the risks flagged by all three passes.
- Consistency tracks signal strength: genuinely distinct changes are found by every pass, marginal judgment calls by roughly one pass in three.
- This converts an unstable yes-or-no answer into a stable, smaller, honest one.

**3. Stop reporting tiny sets as percentages.**
- With 1 to 3 new claims out of about 190, a per-company false-alarm percentage is close to meaningless.
- The right unit is the individual finding, not the rate.

**What I would not do:** rewrite the instructions given to the step that decides what changed. The remaining errors sit on genuinely hard pairs of claims, scoring 0.72 to 0.82 for similarity on a scale where 1.0 means identical, and the step that finds candidate matches is already doing its job on them. That is a limit on judgment, not on instructions, and working on it would be fitting noise on 20 filings.

<pre class="mermaid">
flowchart TD
  trip["The consistency criterion failed"] --&gt; fix1["Break both years into claims in one pass"]
  fix1 --&gt; fix2["Report confidence, not a yes or no"]
  fix2 --&gt; fix3["Stop reporting tiny sets as percentages"]
  fix3 --&gt; revisit["Revisit the ship decision"]
</pre>


## 5. What we kill

**The two-mode product, as specified.**
- Screening and Memo differ by 2.3 points of coverage. That is not two products, and shipping it as two would be marketing rather than engineering.
- Either the system declines to answer far more often, and that has to be shown to be correct restraint rather than noise, or the two modes collapse into one view with a filter that hides claims the quoted sentence does not support. The data currently supports the second.

**The newly-disclosed flag as a standalone output.**
- The filings where nothing changed say the flag is right. Correctness is not the issue.
- Nothing in this project links a newly disclosed risk to any later outcome, so there is no evidence it says anything about what happens next.
- Until that evidence exists, sell this on analyst time saved, not on foresight it has not demonstrated.


## 6. What held up and should be kept

- **The two-level model: a Risk Factor is one risk as the company wrote it, and a Claim is a single assertion inside it.** 94.9% of JPMorgan's 414 claims were still correctly recognized after the bank merged two of its top-level risk sections.
- **Citations by sentence number.** 0 invented quotations in 3,216 claims, by construction rather than by luck.
- **Intensity broken into named observations.** The automatic consistency checks demoted every intensity flag with no evidence pointing at it, instead of shipping it.


## 7. Risks if we ship anyway

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| An analyst acts on a flag that disappears on the next run | High | Loss of trust, hard to recover | Do not ship alerting until consistency is fixed |
| Output is used as investment advice | Medium | Legal exposure | Explicit scope boundary in the product copy, no score, no recommendation |
| Users read the newly-disclosed flag as a prediction | Medium | Overreliance | Position it on time saved, not foresight |
| Retail investors adopt it | Low, because of pricing | Highest harm when the model is wrong | Priced and packaged for professional users |


## 8. The honest summary

- Four defects found, three of them invisible in the output. Every one was caught by arithmetic that failed to reconcile, not by reading samples.
- The filings where we knew in advance nothing had changed found what no positive example could. The one filing where we knew something had changed found what no negative example could. Both were necessary and neither was sufficient.
- One result contradicts a premise I argued for. I objected to grading with no human in the loop, on the grounds that AI graders from the extractor's own model family would share its blind spots. The measured gap is -0.019, indistinguishable from zero. My objection is not supported by the evidence, which is what measuring it was for.
