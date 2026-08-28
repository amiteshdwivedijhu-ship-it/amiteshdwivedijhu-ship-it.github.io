---
title: "Metric design"
hook: "Why it prints no accuracy number, and why that is enforced in code."
project: "calibration"
order: 2
source: "Calibration Harness/Artifacts/Metric-Design.md"
---
# Metric Design: Rubric Lens

**Purpose:** show how each measurement was chosen, what it protects against, what it cannot see, and which ones I do not trust.

The rule that shaped every choice: **this product measures the question, not the answer.** Every other evaluation tool asks how accurate a judge is, which requires knowing the right answers. This one asks whether a question is answerable at all, which does not. That single move is what lets the whole thing run with no labelled data.

Three words recur. A **criterion** is one yes-or-no question a conversation can be judged against. A **rendering** is one machine-facing phrasing of that question, and every criterion gets two. A **verdict** is one model's answer on one conversation for one criterion.


## 1. The measurement that does not exist, and why removing it was a correction

The obvious product prints a precision figure with a confidence interval. This one refuses, and the refusal is the load-bearing decision everything else descends from.

Price both errors instead of one.

- Roughly fifteen hours of hand labelling narrows an accuracy estimate to about plus or minus 8 points. Getting to plus or minus 5 costs around thirty-seven hours.
- Showing the human the model's cited evidence before she decides moves the **centre** of that estimate by roughly 19 points, plus about 4 more from tuning the prompt to one person's labels over repeated sittings.
- At a 3% firing rate, most of a human's "yes" labels are themselves wrong, because the rare true cases are swamped by her own error on the common false ones.

So the certifying design spends fifteen hours narrowing an interval to plus or minus 8 **around a centre displaced by about 20 points, where the displacement is not identified by anything the system measures.** The variance was the smaller error the whole time. A design review priced the variance three times and never priced the bias.

(Those three figures come from that design review, not from this project's own measurement. They are the reason the number was removed, and they are stated here as the inputs to a decision rather than as findings.)

**How the refusal is enforced.** Not by a guideline, because guidelines about not printing a number lose to the first person who wants the number. The part of the tool that writes the report is handed counts and never verdicts: how many of the twelve items were answered, how many hidden honesty items were overturned. There is no function in it that can divide one by the other, and an automatic check reads its source to confirm it never reaches into the arbitration machinery and never formats a percentage except from a table row. Twelve items are not a sample of anything, and nothing computed from them generalises.

**The wording is part of the measurement.** The strongest verdict the tool prints reads "no ambiguity found across 300 traces." Never "verified." Never "correct." The first is a statement about what was looked for and not found. The second two are claims the evidence does not support. Section 6 is about what happened to that sentence.


## 2. The six things that are measured, all with zero human labels

| Measurement | What it asks | Why it is hard to fool |
|---|---|---|
| **Firing rate** | On what share of conversations does this check come out true? | Pure counting over 300 conversations. Reported as a model estimate, labelled as such, and it feeds exactly one decision: workable or hopeless |
| **Agreement with itself** | Ask the same phrasing three times at the same settings. How often do all three agree? | Nothing here compares the model to a right answer, so there is no right answer to game. Low agreement means the question is vague, not that the model is weak |
| **Agreement between phrasings** | Ask the same question two honest ways. How often do the answers match? | The single most valuable number in the product, because its failure has a fix rather than a shrug |
| **Movement when personal data is removed** | Judge 100 conversations both raw and stripped. How far do the verdicts move? | A check that turns on who somebody is will move, and its judgeable content is exactly what de-identification deletes |
| **Best reachable recall** | Given how often this fires and how often a human errs, what is the highest recall any perfect judge could demonstrate? | Arithmetic. Free, and it kills an unwinnable promise at minute eight |
| **Overlap between checks** | Which pairs come out true on the same conversations? | Two checks agreeing on 91% of conversations are one check in two hats, and saying so shrinks the rubric before anyone spends a minute |

The ordering matters. The first three are counting. The fourth is a comparison of two counts. The fifth is arithmetic on the first. None of them asks anyone what the right answer was. That is the whole trick, and it is also the whole limitation, which section 5 states plainly.


## 3. Why agreement between phrasings is the headline

Ask a clear question two honest ways and you get the same answer. Ask a muddy one two honest ways and you do not. That is nearly the entire diagnostic content of a labelled dataset, for the specific decision of whether a check is worth automating, at none of the cost.

What makes it a product decision rather than a clever measurement is where its failure routes.

| The disagreement | What it means | What the product manager can do about it |
|---|---|---|
| Two different models disagree | These models read the question differently | Nothing. She chose neither model and can change neither |
| Two phrasings of her question disagree | Her question is not well posed | Rewrite it. Ten seconds, and only she can |

Both cost the same to measure. The earlier design measured the first. Choosing the second is the difference between a diagnosis and a diagnosis with a treatment.


## 4. The measurement that kills promises early

Given a base rate and a human error rate, the best recall a perfect judge could demonstrate against that human is fixed arithmetic. At a human per-item error rate of 8%:

| How often the check fires | 50% | 20% | 10% | 5% | 3% |
|---|---|---|---|---|---|
| Best reachable recall | 0.92 | 0.74 | 0.56 | 0.37 | 0.26 |

Precision does not have this problem, because its ceiling does not depend on how often the thing happens. Recall does. So a check on something that occurs three times in a hundred cannot support a recall claim at any labelling budget, and the tool says so at minute eight rather than letting a team discover it in week five.

This is stated as a limit on what is knowable, not as a measurement of the judge. That distinction is the honest one and it is easy to lose.


## 5. Where these measurements are weak, stated here rather than under questioning

**The whole method is blind to a mistake the models make consistently.** Three samples and two phrasings can be wrong for the same reason: a shared misreading of the question. That check then gets 95% self-agreement, 95% phrasing-agreement, and the strongest verdict the tool prints, with nothing contradicting it. Every number in section 2 is a measure of consistency, and a consistent error looks exactly like a correct answer.

The design's answer is four hidden honesty items mixed into the twelve, drawn from conversations where every sample and both phrasings agreed, shuffled in and never marked. If the human overturns the ensemble on one of those, that single observation outranks two hundred ordinary labels, because it means the models are confidently and systematically misreading the question rather than merely being uncertain.

Its power is limited and the limit is known: an error occurring half the time is caught reliably, one occurring a fifth of the time unreliably, one occurring a twentieth of the time not at all.

**And as built, that defence does not work.** On an item where both phrasings agreed, both rationales presented to the human argue for the same verdict. There is no keystroke that says "you are both wrong." The only key that gets counted as an overturn is the one meaning "the question itself is wrong," which is a different statement. The single defence against the failure mode I named as the product's real hole cannot detect that failure through the screen I designed. This is the most serious finding in the project and it is a design error, not a coding one.

**The firing rate is a model estimate, not a measured one.** Deliberately. It feeds one decision, workable or hopeless, where a few points of model error changes nothing. Spending the human's minutes to firm up a number whose only job is triage would be the old design's mistake in miniature. It is labelled as an estimate everywhere it appears.

**Movement under de-identification measures verdict movement, not de-identification quality.** On the live run it read zero or one point on all six checks, which says the verdicts were stable. It does not say the de-identifier was correct, and section 6 shows that it was not.

**There is no measure of what the tool missed.** If her rubric omits the failure that actually matters, every check in it can be clean and the product will say so.


## 6. What the measurements caught in the built system

Five findings, none of them from reading the report.

**The strongest verdict became false at any size other than the default.** The rule said the verdict must read "no ambiguity found across 300 traces." It was enforced as a fixed sentence with the number written into it. Run the tool on 50 conversations and the top of the page correctly says 50 while every verdict on it says 300. The tool's own documented remedy for provider rate limits is to drop to 200 conversations, which means the documented remedy produces a false report. **A rule enforced as a literal string satisfies its own automatic check and can invert its meaning.** That is the lesson worth carrying, and it was found by running the tool at a size other than the one it was written for.

**The verdict logic has a floor and no ceiling.** A check firing on fewer than 10% of conversations is correctly called too rare. A check firing on 100% is called a success. Both carry the same amount of information, which is none. This was found by reading the rewrite rows and asking what a check that is true of every conversation could ever distinguish.

**The de-identifier broke the one property that justifies typed placeholders.** Across the 300 conversations it recorded 34 distinct entities. Five of those "organisations" were the same five companies counted twice, because a leading "as" was captured into the name: "as Acme Insurance" and "Acme Insurance" became two different companies to every downstream reader. Two further entries were not entities at all. This was found by printing the placeholder table instead of the placeholder count, and the count alone looked entirely reasonable.

**Two of the four supported formats fail through the one command the product is.** Each reader works correctly when called by name, and there is an automatic check for each. Format detection routes every line-per-record file to the general-purpose reader, which cannot parse the other two. No automatic check covers the path a user actually takes, so all of them pass.

**The most informative key in the design reaches nothing.** Rewrites are generated and re-measured before the queue opens, so pressing "neither, the question is wrong" is counted and has no further consequence.


## 7. What I would change

- **Put a ceiling on the firing rate, symmetric with the floor.** A check firing above roughly 90% is as unmeasurable as one below 10, and the tool should say so in the same words.
- **Give the honesty items their own screen.** On a consensus item, the useful question is not "which of these two rationales is better," it is "is this verdict wrong." That needs a different question on the screen, and without it the four items cost four of the human's twelve minutes and return nothing.
- **Derive the verdict sentence from the actual count.** And add a check that runs the tool at a size other than the default, because every check that mattered here passed at the default.
- **Measure the ninety seconds before anything else.** It is the number the entire thirty-minute design rests on, it has never been observed, and if it is wrong the constraint is wrong.
- **Meter spend and wall clock.** They are the two figures a buyer will ask for first and the two the tool cannot currently supply.
