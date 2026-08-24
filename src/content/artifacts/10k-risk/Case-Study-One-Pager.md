---
title: "Case study"
hook: "The analyst problem, system design, benchmark, and recommendation."
project: "10k-risk"
order: 0
source: "10K Risk Extractor/Artifacts/Case-Study-One-Pager.md"
---
# Case Study: 10-K Risk Extractor

**Role:** Product. Problem framing, core concepts, evaluation design, metric selection, ship decision.
**Status:** built and measured as a prototype.
**Built from:** the SEC's public filings database, two unrelated families of AI models, a way of measuring how close two sentences are in meaning that runs on our own machines, and one benchmark run recorded once and never rerun.


## The problem

An equity analyst covers 30 to 80 companies. Each files an annual report containing a risk factors section: everything the company says could go wrong. Lawyers write it to defend against lawsuits, it runs 20 to 50 pages, and most of it is copied from last year. Two or three things in it are genuinely new, and those are what the analyst needs. Nobody re-reads 40 pages times 60 companies.

Why the obvious fixes fail:

- **Keyword search.** A risk restated in new words looks new. A new risk in familiar words looks old.
- **Word-by-word comparison.** A lawyer splitting one section into two is a formatting change. It gets reported as a change in risk.
- **A vendor risk score.** A number with nothing behind it to check. Traceability is why an analyst can act on the answer, and a score removes it.

## What I built

A prototype that takes the risk factors section apart into individual claims, tags each with a category, attaches the sentences it came from, and marks which claims did not appear last year. Alongside it, a scoring system that grades the output against criteria written in advance.

- 20 filings, 10 companies, 3,216 risk claims
- 48 risk categories in 9 broader families, which decide which of last year's claims each new claim gets compared against
- Cost to run the whole set of filings: $9.41

<pre class="mermaid">
flowchart LR
  filing["Risk factors section of the filing"] --&gt; extract["Break it into individual claims"]
  cats["48 risk categories"] --&gt; tag["Sort each claim into a category"]
  extract --&gt;|"Claims with their source sentences attached"| tag
  tag --&gt; diff["Mark what is new since last year"]
  diff --&gt; evalh["Grade the output"]
</pre>

## The four product decisions

1. **Compare claims, not sections.** A Risk Factor is one risk as the company wrote it, and it is what gives an answer its provenance. A Claim is a single assertion pulled out of one, and it is the unit compared across years. Comparing sections calls reformatting a new risk. Comparing claims survived JPMorgan merging two risk sections, 94.9% of its claims still recognized afterward.
2. **Citations cannot be faked.** The filing is split into numbered sentences before any model reads it, and the model can only point at sentence numbers. Inventing a quotation is not something the system is able to do. Zero fabricated citations is a design property, not a lucky run.
3. **Intensity is broken into parts, never judged whole.** Ask a model "did this risk intensify?" and it answers confidently every time, and the answers are noise. Instead it reports specific observations, each pointing at its own sentence: a maybe became a will, a number was added, the scope widened.
4. **No aggregate risk score, ever.** A score strips traceability, which is the whole value.

## Results

| Question | Answer |
|---|---|
| Quotations the system invented | 0, and inventing one is structurally impossible |
| Claims citing a sentence from a different risk factor | 0 of 3,216 |
| Claims supported by the quoted sentence, judged by a second AI model from an unrelated family | 98.2% |
| False alarms on filings where we knew in advance nothing had changed | 0% |
| Claims still recognized after a bank merged two risk sections | 94.9% |
| **Run the same filing three times: how much do the three lists of newly disclosed risks agree?** | **0.10 to 0.92 depending on the company. This build fails here** |
| Expensive model against cheap model | 3 to 7 times the cost, no measurable gain in quality |

## The decision

I would not ship the alerting product on these numbers. Run the same filing three times, changing nothing, and the set of newly disclosed risks ranges from 92% agreement down to zero consensus on Boeing: not one flagged passage survived all three passes. An alert that vanishes is worse than no alert.

Five of six kill criteria, all written before the run, passed. The one that tripped decides the flagship use case.

## Three results that contradicted my own arguments

Reported as such, because a project where every hypothesis lands was not really tested.

- I argued that AI graders from the extractor's own model family would share its blind spots, and built a whole section of the evaluation to expose that. Measured gap: -0.019, undetectable.
- I predicted the step that decides whether a claim is new would be about 80% of the spend. Measured: 41.7%. Reviewing six claims per request collapsed the call counts my estimate rested on, so the cost decision that followed was aimed at the wrong stage.
- I argued that the option to decline answering was what made Screening Mode (fast filtering across many companies) and Memo Mode (output bound for a client document) two different products. They came out 2.3 coverage points apart. That is not two products.

## How I found the defects

Five defects. Three were invisible in the output: two produced plausible-looking results with claims quietly missing, one produced confident false positives.

None was found by reading samples. All were found by arithmetic that failed to reconcile: record counts, retry yields, boundary rates. Filings where we knew nothing had changed found what no positive example could, and the one filing where we knew something had changed found what no negative example could.

## What this project established

- **A measurement approach:** metrics sorted by what they depend on, from those needing no human judgment up to those needing real-world outcomes, and reported in that order. Every gameable metric is paired with one that goes the other way.
- **Cost and quality:** a measured curve across two model families and three stages, with a model choice for each stage.
- **Benchmark construction:** no benchmark existed, so I assembled the filings, categories, controls, and pass bars.

## What I would defend

- Run-to-run agreement controls the recommendation because average accuracy cannot reveal an alert that changes between identical runs.
- Models emit sentence IDs instead of quotations, which makes a fabricated quote impossible to represent. A separate model family then checks whether each cited sentence supports its claim.
- Five of six criteria passed. The failed stability criterion still decides the alerting use case.
