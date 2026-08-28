---
title: "PRD"
hook: "Triage the check, not the answer: is this question answerable at all?"
project: "calibration"
order: 1
source: "Calibration Harness/Artifacts/PRD.md"
---
# PRD: Rubric Lens

**Owner:** Amitesh Dwivedi (Product)
**Status:** Built and run end to end against a real provider. Approved for one narrow surface only. The arbitration queue is not approved. See the launch decision memo.
**Last updated:** 2026-08-27


## 1. One line

Tell a product manager which of her quality checks an AI judge can actually measure, which are too vague or too rare to bother with, and rewrite the vague ones, in one sitting, with no labelled data.


## 2. The problem

A team ships an AI feature. Someone owns what "good" means for it, and that someone is usually a product manager rather than an engineer. Her definition lives in a document: stay grounded in the retrieved sources, never promise a policy we do not offer, match the tone to the situation, escalate when the case is above the agent's authority, never repeat sensitive customer data, close with a clear next step.

She wants those scored automatically on production traffic. The standard route is to hand-label a few hundred conversations, then check an AI judge against those labels. Four things go wrong with that:

- **The first build is expensive and the maintenance is worse.** Production keeps producing situations the labelled set has never seen. The set goes stale, and keeping it fresh is a permanent tax on the exact team that said it had no bandwidth.
- **The work is scattered across four tools.** Labelling in one platform, judges in another, de-identification somewhere else, and agreement statistics in a spreadsheet. Every handoff is a place where the definition of the check quietly changes.
- **The judge's score is diagnostically mute.** If it disagrees with a human, that could mean the model is weak or that the question was ambiguous. Those two have opposite remedies and the score cannot tell them apart.
- **Some checks are unmeasurable at any budget, and nobody finds out until week five.** A check that fires on 3% of traffic cannot support a usable recall number no matter how much labelling is bought. That is arithmetic, it is free to compute, and nobody computes it.

The last point is the wedge. Most of the money in evaluation is spent measuring how well a judge answers questions, and some of those questions cannot be answered by anyone.


## 3. Who this is for

**Primary user: the Rubric Author.** The person who owns what "good" means. A product manager, not an engineer. She is the only human in the whole design, and every minute of her time is treated as the scarce resource it is.

Also served
- Applied AI and evaluation engineers who currently maintain a labelled set by hand and would rather not.
- Small AI teams choosing what to automate first, who need to know which checks are winnable before they spend on any of them.

Deliberately designed against
- **Anyone who needs a number to gate a release.** If a release process blocks on an evaluation score, this tool cannot supply that score, and section 6 explains why supplying one would be dishonest rather than merely hard.
- **Teams that already have a large, well-maintained labelled dataset.** They should measure accuracy directly. This product exists for the case where that dataset does not exist.


## 4. The vocabulary

Six words carry the product. They are chosen to be narrow, and the narrowness is the point.

- **Trace:** one saved record of the AI doing its job for one customer, start to finish, as an ordered list of addressable steps.
- **Criterion:** one yes-or-no question a trace can be judged against. The atomic unit. Everything is measured per criterion, never per rubric.
- **Rendering:** one machine-facing phrasing of a criterion. Every criterion gets two, and they are faithful rephrasings of each other.
- **Verdict:** one model's answer on one trace for one criterion, with its reasoning and the exact steps it points at as evidence. All samples are kept; nothing is averaged away early.
- **Conflict:** one disagreement presented to the human, with the cited steps and two unlabelled rationales.
- **Pinned judge:** the exported result. The criterion, both phrasings, the exact model identifier, how many samples, the temperature, and the aggregation rule. A number attached to a nickname that can silently point at a different model next month is not a measurement.


## 5. How it works

<pre class="mermaid">
flowchart TD
  a["Production conversations, in whatever format the team already exports"] --&gt; b["Strip personal data on this machine, never by sending it to a model"]
  c["Her rubric, in prose"] --&gt; d["Split into about six yes-or-no questions, which she confirms"]
  d --&gt; e["Write each question two honest ways"]
  b --&gt; f["Ask every question, both ways, three times, on all 300 conversations"]
  e --&gt; f
  f --&gt; g["A second model from a different maker settles split answers"]
  g --&gt; h["Coverage table: one row per question"]
  h --&gt; i["Questions that fail get rewritten automatically and re-measured on the same conversations"]
  h --&gt; j["Twelve disagreements go to her, one per screen, against a clock"]
  i --&gt; k["Shareable report, and one exported judge per question"]
  j --&gt; k
</pre>

The table is finished and readable before she answers a single question. If she walked away at that point she would still have the product.


## 6. Product decisions worth defending

**The criterion is the unit, not the rubric.**
- One verdict on "was this reply good?" is diagnostically mute. It says the reply was wrong without saying which of six sub-questions was the ambiguous one, and a rewrite has nothing to aim at.
- Every measurement in the product is only meaningful about one question at a time.

**Two phrasings, not two models.**
- Both cost the same. The difference is what the disagreement tells you to do.
- Two models disagreeing routes to "change the model, or accept the ceiling." The product manager chose neither model and cannot change either, so both are exits, not actions.
- Two phrasings of her own question disagreeing routes to "rewrite the question," which takes her ten seconds and which nobody else in the company can do.
- A second model still earns a narrower job: settling split answers, drawn from a different maker so its mistakes are less likely to be the same mistakes.

**The product prints no accuracy figure, and that is enforced in code.**
- Roughly fifteen hours of hand labelling buys an accuracy estimate good to about plus or minus 8 points, and getting to plus or minus 5 costs around thirty-seven hours.
- Letting the human read the model's cited evidence before she decides moves the centre of that estimate by roughly 19 points, and nothing in the system measures how far.
- At a 3% firing rate, most of a human's "yes" labels are themselves errors.
- So the certifying version of this product spends fifteen hours narrowing the smaller error around an unmeasured larger one. Removing the number is a correction, not a compromise.
- The part of the tool that writes the report is given counts and never verdicts, so there is no code path that could compute a rate from the human's twelve answers even by accident. An automatic check reads the code to confirm it.
- (The three figures above come from the design review that killed the certifying version. They are not measurements from this project.)

**The human arbitrates. She never labels.**

| What she could be asked to do | Time each | How often she gets it wrong |
|---|---|---|
| Read a raw multi-step conversation cold and label it | 3 to 8 minutes | Roughly 8 to 15% |
| Choose between two written rationales, with the relevant passages already pulled out | 60 to 90 seconds | Much lower |

- The expensive half of labelling is finding the relevant passages. The machine has already done that.
- Spending her minutes on cold labelling buys her worst signal at her highest price.
- One of the five keys means "neither of these, the question itself is the problem." That is the thing a rubric author most often wants to say, and no labelling interface lets anyone say it.

**A check that cannot fire often enough is reported as unmeasurable, with the arithmetic shown.**
- Given a human who errs on 8% of items, the best recall any perfect judge could demonstrate depends entirely on how often the thing being checked actually happens.

| How often the check fires | 50% | 20% | 10% | 5% | 3% |
|---|---|---|---|---|---|
| Best recall reachable | 0.92 | 0.74 | 0.56 | 0.37 | 0.26 |

- This costs nothing to compute and it kills a promise at minute eight instead of week five. Precision does not have this problem. Recall does.

**De-identification runs on the local machine and is never a model call.**
- Its entire purpose is keeping personal data away from hosted models, so sending the data to a hosted model to find the personal data defeats it.
- Placeholders are typed and numbered, so the same person stays the same person across the conversation. A uniform blackout destroys exactly the thread most checks depend on.


## 7. What this is not

- **Not a judge-quality certifier.** It does not tell you the judge is 91% accurate, and section 6 is why.
- **Not a serving product.** It exports a pinned judge to run wherever the team already runs things. Serving is the one part of the scattered workflow teams already own.
- **Not a monitoring product.** One snapshot. "Is it getting better?" is answered by running it again.
- **Not a labelling tool.** If the answer to a screen is "I need to read the whole conversation," the design has already failed.


## 8. Success criteria

Rules that had to hold in the built system, written before the build

1. No percentage may be computed from the twelve human answers, and this must be structurally impossible rather than merely discouraged.
2. The strongest verdict must read "no ambiguity found across N traces," never "verified" or "correct."
3. De-identification never calls a hosted model.
4. Placeholders are typed, numbered, and stable, so references to the same entity stay linked.
5. The countdown is wall-clock. Nothing may extend the session.
6. Every export names its exact model, sample count, temperature, and aggregation rule.

How they held is in the launch decision memo. Five held. The second one held as written and broke as intended, and that is the most interesting result in the project.

Reported, not gated
- How often each check fires, how often it agrees with itself, how often the two phrasings agree, how far verdicts move when personal data is removed, the best recall reachable, and which pairs of checks are really one check in two hats.

Not measured, and named as such
- Whether one arbitration really takes 90 seconds. This is the load-bearing number in the entire design and no human has done it.
- What a run costs and how long it takes. Nothing meters either.
- Whether a real product manager finishes twelve items in one sitting, which was supposed to be the only success metric that mattered.


## 9. Requirements that are not features

- **One sitting.** Thirty minutes, once. A feature that needs a second sitting is not a smaller feature, it is a different product, and it does not ship. The stated customer problem is bandwidth, and a fortnightly cadence charges rent in the one currency the buyer says she does not have.
- **First useful output at minute eight.** The table has to arrive before she gets bored. Provider rate limits are the real engineering risk here, and the remedies in order are fewer conversations, fewer samples on checks already agreeing with themselves, and grouping questions into one request for stable checks only.
- **No accounts, no database, no login.** The queue is a local page and a state file.
- **Reads what teams already export.** Four formats, because the stated pain is scatter and the entry cost has to be near zero.


## 10. Open questions

- **Is 90 seconds right?** Everything in the thirty-minute budget rests on it, and it has never been observed.
- **What does a run actually cost?** The plan said $80 to $150 across about 7,800 model requests. The built shape issues about 23,400. The estimate was inconsistent with the plan's own definitions, and the real figure is unmeasured because nothing records spend.
- **Can the honesty check be made to work at all?** On an item where every sample and both phrasings agreed, both rationales argue the same verdict, so the screen offers no way to say the ensemble is wrong. Either those items need a different screen or the defence does not exist.
- **Does a check firing on 99% of traffic differ from one firing on 1%?** For measurement purposes it does not, and the product currently treats the first as a success.
