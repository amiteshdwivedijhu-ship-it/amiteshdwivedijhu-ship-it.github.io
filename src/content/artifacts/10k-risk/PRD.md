---
title: "PRD"
hook: "Claims as the unit of comparison, factors as the unit of provenance."
project: "10k-risk"
order: 1
source: "10K Risk Extractor/Artifacts/PRD.md"
---
# PRD: 10-K Risk Extractor

**Owner:** Amitesh Dwivedi (Product)
**Status:** Prototype built and measured. Not approved for the alerting use case. See the launch decision memo.
**Last updated:** 2026-08-22


## 1. One line

Turn the risk factors section of a company's annual report into structured, tagged, source-cited records, so an analyst can see what changed since last year instead of re-reading 40 pages.


## 2. The problem

Every US public company files an annual report, and inside it is a section listing everything the company says could go wrong. It is the single most information-dense part of the filing and the least readable.

- It runs 20 to 50 pages per filing. The full annual report can pass 100,000 words.
- Lawyers write it as litigation defense, so everything conceivable gets disclosed and the two or three real changes are buried.
- Most of it is copied word for word from last year. The signal is in what changed, not in the text.
- No two companies organize it the same way. There is no required set of categories, so the same exposure appears under different headings at different companies.

Why the tools an analyst already has do not solve it:

- **Keyword search** misses paraphrase. A risk restated in new words looks new.
- **Word-by-word document comparison** reports a lawyer's reformatting as a change in risk.
- **Terminal vendors sell a risk score.** A score removes the traceability that makes the output safe to act on. The analyst cannot check it, so the analyst cannot use it in a client memo.


## 3. Who this is for

Primary users
- Buy-side and sell-side equity analysts covering 30 to 80 companies
- Credit analysts and commercial lenders watching for early deterioration
- Directors-and-officers and insurance underwriters pricing self-disclosed exposure

Secondary users
- Corporate development and competitive intelligence teams
- Third-party and supply chain risk teams
- Compliance teams benchmarking their own disclosure before filing

Users we deliberately design against
- **Retail investors.** High volume, near zero willingness to pay, and the highest harm if the model is wrong.
- **Litigators.** They need total precision on one filing, not comparison across many. That is a different product.


## 4. What we build

The vocabulary. Five ideas carry the whole product.

- **Risk Factor:** one risk as the company wrote it. It owns the exact quoted passage and its position in the section.
- **Risk Claim:** one assertion pulled out of a Risk Factor, carrying a category tag. This is the unit compared across years.
- **Category:** one of 48 specific tags. Every Claim gets exactly one.
- **Parent Category:** one of 9 broader groups. It also decides which pool of last year's claims a given Claim is compared against.
- **Intensity Signal:** a named, checkable observation that a risk got stronger or weaker, each tied to its own quoted passage.

How it works, step by step.

1. Fetch the filing from the SEC's free public filings database and store a permanent copy.
2. Isolate the risk factors section. Six checks on where the section starts and ends must all pass, or the filing is dropped rather than guessed at.
3. Split the section into numbered sentences before any model sees it.
4. Separate out the individual Risk Factors and capture the company's own headings.
5. Break each Factor into Claims and tag each Claim with a category.
6. Pull last year's candidate claims from the same Parent Category.
7. Decide, for each Claim against last year: same, intensified, weakened, no match found, or decline to answer.
8. Show the results with error rates visible on the page and no aggregate score.

<pre class="mermaid">
flowchart LR
  f["Filing from the SEC database"] --&gt; i["Isolate the risk factors section"]
  i --&gt; s["Split into numbered sentences"]
  s --&gt; seg["Separate the individual risk factors"]
  seg --&gt; c["Break into claims and tag each one"]
  c --&gt; r["Pull last year's candidates in the same group"]
  r --&gt; a["Decide what changed since last year"]
  a --&gt; o["Show results with error rates visible"]
</pre>


## 5. Product decisions worth defending

**Claims are the unit of comparison. Factors are the unit of provenance.**
- When a company splits one risk factor into two, comparing at the factor level calls it a new risk. It is a formatting change.
- Comparing at the claim level survived JPMorgan merging two of its top-level risk sections. 94.9% of its 414 claims were correctly still recognized.

**Citations cannot be faked, by design.**
- The model names sentences by number and never reproduces text, so a made-up citation cannot even be expressed in the output.
- A real citation can still be attached to an unsupported claim. A model from a different family therefore checks whether the quoted sentence backs the claim.

**Intensity is broken into parts, never judged as a whole.**
- We never ask "did this intensify?" That question bundles unrelated things together and gets a confident answer every time.
- Instead the system reports named observations: a conditional became an actual, a number was added, certainty was raised, scope was widened. Intensity is derived from those.

**The system contains the damage from miscategorization.**
- Last year's candidates are drawn only from the same broad group, so a wrong specific tag still puts a Claim in roughly the right pool.
- Groups that are easily confused (supply chain and geopolitical, for a company dependent on a Taiwanese chip plant) are linked, and both are searched.
- Without this, one wobble in categorization makes a recycled risk unreachable, and the system calls it new.

**No aggregate risk score, ever.**
- A score strips traceability. That is the exact failure of the incumbents this is positioned against.


## 6. What this is not

- **Not a summarizer.** Summarizing destroys the comparability that creates the value.
- **Not a risk predictor.** We extract disclosed risk. Forecasting is a separate claim with far weaker evidence behind it.
- **Not investment advice.** This is a liability boundary, not a capability boundary.


## 7. Two modes, two acceptance bars

Screening Mode is for an analyst filtering many companies fast. Memo Mode is for output that goes into a client document.

| | Screening Mode | Memo Mode |
|---|---|---|
| Who it is for | An analyst filtering many companies | Output going into a client document |
| When the system declines to answer | Shown as an unverified possibility | Hidden |
| Claims the quoted sentence does not support | Shown and flagged | Hidden |
| Metric that decides success | How few genuinely new claims it misses | How few of its claims are wrong |
| Metric that stops it being gamed | False alarms on filings where nothing changed | How much of the real material it still covers |

Coverage is the guard that stops Memo Mode from buying perfect precision by saying almost nothing.

**Measured result:** the two modes came out 2.3 points of coverage apart (100% against 97.7%). That is not two products. The launch decision memo says what we do about it.


## 8. Success metrics

Ship gates (must pass)
- Quotations the system invented: near zero
- Claims citing a sentence from outside their own Risk Factor: near zero
- Records that break the required structure: none
- False alarms on filings where nothing changed: low enough that Screening Mode is usable
- Run the same filing twice: the two lists of newly disclosed risks must agree closely enough that an alert does not vanish on the next run

Quality metrics (reported, not gates)
- How much of the risk factors section is reachable from at least one Claim
- How often the quoted sentence actually supports the claim attached to it
- Agreement between two independent AI graders, reported both with and without a grader drawn from the extractor's own model family
- Accuracy within each category

Business metrics (not yet measured)
- Analyst minutes saved per filing
- Share of flagged changes an analyst marks as worth reading
- Cost per filing at peak season


## 9. Requirements that are not features

- **Speed:** batch is fine. Filings cluster in February and March because most companies close their books on December 31. Peak load is roughly 5 to 8 times the quiet period. Nothing here needs an answer in under a second.
- **Cost:** send each step to the cheapest model that can handle it, and reuse stored results instead of re-running. The whole 20-filing set ran for $9.41.
- **Reproducibility:** one benchmark run, recorded once, produces every published number. Every model response is stored, so anyone can reproduce the numbers without re-running a model or spending anything.
- **Data:** all public. The SEC's filings database is free, needs no license, and has no gatekeeper. No personal or health data anywhere in the system.


## 10. Open questions

- Does a newly disclosed risk tell you anything about what happens next? Nothing in this project links a flag to a later outcome, so the newly-disclosed flag should be sold on time saved, not on foresight.
- Would breaking both years into claims in a single pass remove the drift that drives the stability failure?
- Does the two-mode split matter on a set of filings chosen for ambiguity rather than one where nine of ten companies recycled almost everything?
