---
title: "Metric design"
hook: "Why it never emits an aggregate risk score."
project: "10k-risk"
order: 2
source: "10K Risk Extractor/Artifacts/Metric-Design.md"
---
# Metric Design: 10-K Risk Extractor

**Purpose:** show how the metrics were chosen, why each one is hard to game, and which ones I do not trust.

A **Risk Factor** is one risk as the company wrote it. A **Risk Claim** is one assertion pulled out of a Risk Factor, tied to the exact sentences it came from, and Claims are what get compared across years. The **newly-disclosed flag** is the system's judgment that a risk appears this year and did not appear last year.


## 1. The rule I used: sort every metric by how much it rests on

Every metric was sorted into one of three tiers, and the tiers are reported in that order.

1. **Needs no human judgment.** Counting, arithmetic, and rule checks. No one's opinion enters, so nothing circular can get in. These carry the weight.
2. **Rests on judgment.** Somebody, or some model, had to decide what the right answer was. The number is only as good as that judge, and inherits every one of the judge's blind spots.
3. **Rests on outcomes.** Did the flag matter later? This project does not measure that, and says so directly.

The ordering is the point. Before deciding how much to believe a number, a reader needs to know how much that number rests on. A figure that came out of counting is a different kind of object from one that came out of an opinion, even when both are printed to three decimals.

<pre class="mermaid">
flowchart TD
  m["A metric"] --&gt; q{"What does it rest on?"}
  q --&gt;|"counting and rules"| t1["Needs no human judgment. These carry the weight"]
  q --&gt;|"someone's opinion"| t2["Rests on judgment. Only as good as the judge"]
  q --&gt;|"what happened next"| t3["Rests on outcomes. Not built yet"]
</pre>

Most evaluation write-ups lead with the middle tier, because it produces bigger, friendlier numbers.


## 2. Tier one: metrics that need no human judgment

| What it asks | Result | Why it cannot be gamed |
|---|---|---|
| Can a citation be made up? | No, by design | The system points at sentences by number and never writes out quoted text, so a citation to a sentence that does not exist cannot be expressed. |
| Does every sentence still point at its own text? | 0 errors out of 10,074 | Each sentence's recorded position must resolve back to that sentence. If it does not, the filing is dropped rather than patched. |
| Do any citations point outside the risk they belong to? | 0 out of 3,216 | Rejected before a Claim is built, and before it costs anything to sort. |
| Is every record complete? | 0 violations out of 3,216 | Automatic checks reject a claim that says a risk intensified without pointing at the evidence, a claim marked as having no match that still carries a prior-year match, and any claim with no citation. |
| How much of the risk section is reachable from a claim? | 76.5% (3,850 of 5,033 sentences) | Pure counting. Range was 56.9% to 84.6% by company. |
| How many risks get wrongly called new on a filing where nothing changed? | 0% | Two companies that reused 93% and 85% of last year's text word for word. Any flag is presumed wrong until a person checks it. |
| Run the same filing twice: how much do the two lists of newly disclosed risks agree? | 0.10 to 0.92 by company | The system measured against itself, each run starting cold with no memory of the last. This is the one it fails. |

Zero fabricated citations comes from the shape of the output; it is not a clean result the system earned. The next question is whether the cited sentence supports the claim attached to it.


## 3. Tier two: metrics that rest on judgment, and their known weakness

The reference answers come from a panel of AI models with no human settling the disagreements. Stated up front, not buried in a footnote.

The problem: if the grader and the extractor are built on the same underlying model, their agreement measures a shared bias rather than correctness.

How that was measured rather than hand-waved at:
- The panel deliberately includes one grader from the same family as the extractor.
- Agreement is reported twice, with that grader and without it.
- The gap between the two numbers is a direct estimate of the shared-bias effect.

**Result:** (kappa is a standard agreement score that subtracts out the agreement two graders would reach by coin flip)
- Agreement across unrelated model families: kappa = 0.867
- Agreement including the same-family grader: kappa = 0.848
- Gap: -0.019

This argues against my own design. I built that part of the evaluation because I expected a real shared-bias effect. At this sample size it is not detectable.

Whether a claim is supported by the sentence it cites belongs in this tier too, and it is checked by a different model family than the one that wrote the claims: 98.2% supported.


## 4. Why the headline is a stability number and not an accuracy number

This is the metric-design decision I would defend hardest.

Accuracy was the convenient metric. It needs one run, it produces large friendly percentages, and every one of them passed. Stability was the useful one. It needs nothing but the same filing run three times, it produces one uncomfortable number, and it is the one that decides whether the product works.

The two disagreed about whether to ship. Accuracy said yes. Stability said no. Stability wins, because a system can be well calibrated on average and useless in practice, and accuracy cannot see the difference. Measuring the same thing twice and comparing the answers is what exposed that.

Run the same two filings three times with nothing changed:

| Company | Agreement on the set of newly disclosed risks |
|---|---|
| Edison International | 0.92 |
| Boeing | 0.10, and zero three-way consensus. Not one flagged sentence survived all three passes, and runs one and two shared not a single item between them. |

For an alerting product that is disqualifying. An alert that vanishes on the next run is worse than no alert.

The pattern underneath is useful: stability tracks signal strength. Real, distinct changes are found by every pass, which is why Edison International sits at 0.92. Marginal judgment calls are found by roughly one pass in three. A product that says "newly disclosed" for both is lying about the second.


## 5. Guard metrics: the ones that stop gaming

Every primary metric is paired with a second that pushes the opposite way, so cheating the first shows up immediately in the second.

| Primary metric | How you could game it | The metric that catches you |
|---|---|---|
| Memo Mode precision | Decline to answer on everything | Coverage (97.7%) |
| Screening Mode recall | Flag everything | Risks wrongly called new on unchanged filings (0%) |
| Number of claims extracted | Split every sentence into its own claim | One assertion per claim, and whether its cited sentence supports it |
| Any accuracy number | Get lucky once | Agreement across three runs |

The rate at which the system declines to answer is reported on its own too, because both extremes are invisible from accuracy alone. Near zero means the split into two modes does not really exist. Very high means Memo Mode covers nothing.

In the first version, the step that decides what changed declined to answer zero times in 193 decisions. It was confidently wrong instead, which is worse. Rewriting its instructions raised declines from 0 to 3 and cut false positives in half at the same time. The two moved together, which says the cases it had been resolving confidently were exactly the ones it should have been unsure about.


## 6. Controls: the part that found the real defects

**Filings where nothing changed (the false-alarm test)**
- Two companies whose risk section is 93% and 85% word for word identical to last year's.
- Expected result: almost nothing flagged.
- Getting to 0% took three fixes. False alarms went 7.3%, then 3.6%, then 0%.
- None of those three failures was visible from any example of the system working correctly.
- The four claims that did get flagged were all genuine: each company's first substantive disclosure about AI, confirmed by counting AI mentions in the source text separately from the system itself (PLD went from 0 to 4, ED from 1 to 10).

**A filing where something definitely did change (the missed-change test)**
- JPMorgan merged two top-level risk sections. 94.9% of its 414 claims were still correctly recognized.
- That single case is what justified comparing claim by claim instead of section by section.
- It also found three defects the unchanged filings could not, including a gap in the rules governing which risk categories may be applied together, one that only a bank's filing would expose.

Both kinds of control were necessary and neither alone was sufficient. The unchanged filings found defects no example of the system working could have exposed, and the changed one found defects no unchanged filing could.

**One more design note:** which companies played which control role was decided by a plain text comparison across the filings, not by my hypothesis. I predicted the recyclers would be PG and RSG. Neither made the top two. Had the roles come from the hypothesis, the false-alarm test would have run against the wrong companies.


## 7. Metrics I could not report, and why

- **Accuracy per risk category.** Random sampling gave a median of 2 claims per category and not one category with 10 or more. Too little to support a rate anyone should trust, so no number is reported. The fix is to sample up to 30 per category, which reaches a trustworthy sample size at about half the labeling effort.
- **The frontier arm of one cost measurement.** Model credit ran out partway through. Marked "not measured" rather than estimated. An estimate sitting in a slot reserved for a measurement is the exact failure this report format exists to prevent.
- **Whether any of this predicts anything.** No evidence that a newly disclosed risk carries information about what happens next. Not built, and the product should not be sold on it.


## 8. What I would change next time

- Make support for the claim the primary bar for Memo Mode, and declining to answer the secondary one. The support check suppresses 1.8% of claims against declining's 0.47%, four times as much, and for a better reason: an unsupported claim in a client memo is a liability, while an uncertain match is only uncertain.
- Sample the grading panel's work by category rather than at random. The point is to find weak category definitions, not to cover whatever happens to be common.
- Stop reporting tiny sets as rates. With 1 to 3 new claims out of roughly 190, a per-company percentage is close to meaningless. The right unit is the finding.
