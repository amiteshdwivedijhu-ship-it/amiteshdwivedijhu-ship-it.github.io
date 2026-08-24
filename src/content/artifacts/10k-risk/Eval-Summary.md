---
title: "Eval summary"
hook: "Twenty filings, and controls assigned by measurement rather than by hypothesis."
project: "10k-risk"
order: 3
source: "10K Risk Extractor/Artifacts/Eval-Summary.md"
---
# Eval Summary: 10-K Risk Extractor

Every number here comes from one set of results, recorded once and never rerun, so every figure traces back to the same evidence. Every model response was stored, so the numbers reproduce without a single new model call and without spending anything.

Four terms carry the argument. A **Risk Factor** is one risk as the company wrote it. A **Risk Claim** is one assertion pulled out of a Risk Factor, tied to the exact sentences it came from, and Claims are what get compared across years. The **newly-disclosed flag** is the system's judgment that a risk appears this year and did not appear last year, and it is the output an analyst would act on. A **negative control** is a filing where we already know almost nothing changed, so any risk called new there is wrong without a human having to check.


## 1. Headline

> On 20 filings and 3,216 extracted risk claims: zero fabricated citations, because the output format makes a fake one impossible to write. 98.2% of claims genuinely supported by the sentences they point to. Zero false alarms on both filings where the right answer was "nothing new." 94.9% of claims still recognized after a bank reorganized its risk section.
>
> Run the same filing three times, though, and the lists of newly disclosed risks agree 0.92 on one company and 0.10 on another. On Boeing, not one flagged sentence survived all three passes. That is disqualifying for alerting.

Accuracy said ship. Stability said do not ship. The rest of this document is about why the second one wins.


## 2. What was measured

| | |
|---|---|
| Companies / filings | 10 / 20 (FY2024 to FY2025) |
| Filings passing all six checks on where the risk section starts and ends | 20 of 20, 6 of 6 each |
| Sentences extracted / citations landing in the wrong place | 10,074 / 0 |
| Risk Factors identified | 691 (15 to 74 per filing) |
| Risk Claims extracted | 3,216 |
| Cost to run all 20 filings | $9.41 |


## 3. Results

Ordered by how much each rests on somebody's opinion: counting and rule checks first, then the ones that needed a judgment about the right answer. The metric design note explains why that ordering is the honest one.

| What was measured | Result | Read as |
|---|---|---|
| Citations the system made up | 0, impossible by design | A property of the format, not luck |
| Citations pointing outside the risk they belong to | 0 of 3,216 | Pass |
| Records missing a required part | 0 of 3,216 | Pass |
| Claims genuinely supported by the sentences they point to, judged by an unrelated AI model | 98.2% | Pass |
| Risks wrongly called new on filings where nothing changed | 0% | Pass, after three fixes |
| Claims still recognized after a bank merged two risk sections | 94.9% (JPM, 414 claims) | Pass, validates the design |
| Share of the risk section reachable from a claim | 76.5% | Reported, not a gate |
| Agreement between two independent AI graders | kappa = 0.867 | Weak evidence, see below |
| Do two graders built on the same model share blind spots? | -0.019 | No detectable effect |
| Memo Mode / Screening Mode coverage | 97.7% / 100% | Negative result, see section 6 |
| **Run the same filing three times: how much do the lists of newly disclosed risks agree?** | **0.10 to 0.92 by company** | **FAIL. This is the headline.** |
| Frontier model vs cheap model | 3 to 7 times the cost, no measurable quality gain | Route to the cheap model |

kappa is an agreement score that subtracts out the agreement two graders would reach by coin flip.


## 4. The stability failure, in detail

Same filings, same instructions, nothing changed. Each pass had to ask the model fresh rather than reuse a stored answer.

| Company | Claims found on each of three runs | Sentences flagged as newly disclosed at some point | Still flagged after all three |
|---|---|---:|---:|
| Boeing | 198, 193, 198 | 10 | 0 |
| Pulte | 189, 194, 194 | 3 | 1 |
| Edison International (negative control) | 93, 97, 91 | 8 | 7 |

Boeing scores 0.10. Runs one and two shared not one single item: every risk the first pass called new, the second did not, and the reverse. Edison International scores 0.92, and that row keeps the finding honest. The method is not rigged to fail. Where the system has something real to find, it finds the same things every time. Where it is making marginal calls, it makes different ones on Tuesday.

**Why it happens.** Claim counts move between runs on filings that did not change: 189 to 194 on one, 193 to 198 on another. The step that breaks a risk section into individual claims is itself a restructurer. Break two years apart independently and the pieces do not line up the same way twice, and a boundary that shifted looks exactly like a risk that appeared.

Comparing claim by claim was chosen because it survives restructuring, and it does survive the company's: JPMorgan proved that at 94.9%. What was not accounted for is that our own step restructures too. That could not have been reasoned out in advance. It took a filing where the expected answer was "nothing changed."

<pre class="mermaid">
flowchart LR
  prior["Last year's filing"] --&gt; dec1["Break into individual claims"]
  current["This year's filing"] --&gt; dec2["Break into individual claims"]
  dec1 --&gt; diff["Compare claim by claim"]
  dec2 --&gt; diff
  diff --&gt; drift["Boundaries that shifted look like new risk"]
  drift --&gt; alert["Newly-disclosed flag changes between runs"]
</pre>


## 5. Cost and model choice

Where the money goes

| Step | Model requests | Cost | Share |
|---|---:|---:|---:|
| Deciding what changed | 814 | $6.56 | 41.7% |
| Sorting claims into categories | 757 | $4.59 | 33.2% |
| Breaking the section into claims | 770 | $2.89 | 25.1% |

This corrects my own estimate by about double. I predicted deciding what changed would be roughly 80% of spend. Measured: 41.7%. The error was assuming one model request per unit of work. Reviewing six claims in a single request collapsed the counts my estimate rested on, and the routing decision that followed from the 80% figure was aimed at the wrong step.

Frontier vs cheap, per step

| Step | Cheap model, per request | Frontier model, per request | Ratio |
|---|---:|---:|---|
| Breaking the section into claims | $0.0035 | $0.0252 | 7.2x |
| Sorting claims into categories | $0.0059 | $0.0181 | 3.1x |
| Deciding what changed | $0.0081 | $0.0529 | 6.5x |

The extra money buys nothing measurable. Both models flagged the same genuine AI-related disclosures on both negative controls, and neither raised a false alarm. On the only quality check here that does not grade a model against itself, the frontier model is indistinguishable from the cheap one. The routing policy is in the tradeoff memo.


## 6. Three results that contradict my own arguments

Reported as such, because a project where every hypothesis lands is a project that was not really tested.

1. I expected two graders built on the same underlying model to share blind spots, and built a whole section of the evaluation to expose it. Measured gap: -0.019. Undetectable. My objection to grading without humans is not supported by the evidence.
2. My cost estimate was wrong by roughly half. Predicted 80% of spend in the step that decides what changed. Measured 41.7%.
3. The two modes are not two products. Screening Mode, for an analyst filtering many companies, and Memo Mode, for output going into a client document, came out 2.3 points of coverage apart. Letting the system decline to answer when evidence is thin was supposed to be what separated them. On these filings it does not carry that weight.


## 7. What broke, and how it was found

| # | Defect | Found by |
|---|---|---|
| 1 | The step that decides what changed rejected valid matches unless two claims happened to be written at the same level of detail | An unchanged filing reporting new risks 7.3% of the time |
| 2 | The comparison step inherited whatever last year's breakdown into claims had missed | The residue left after fixing #1 |
| 3 | 8.7% of claims silently dropped when the model returned fewer items than asked for | Record counts that would not reconcile |
| 4 | An automatic check rejected the exact answer the instructions had asked for | A retry pass recovering only 5 of 17 |
| 5 | A rule blocking matches across section boundaries hid true matches for a bank | The bank filing's 73% boundary rate |

Three of these were invisible in the output. Numbers 3 and 4 produced results that looked entirely plausible while claims were quietly missing. Number 5 produced confident false positives.

None of the five was found by reading samples. Every one was found by arithmetic that failed to reconcile: record counts, retry yields, boundary rates.

The filings where nothing changed found defects that no example of the system working could have exposed. The one filing where something definitely did change, a bank merging two risk sections, found defects that no unchanged filing could. Both were necessary. Neither alone was sufficient.


## 8. Where this evaluation is weak

Stated here, not surfaced only under questioning.

- The reference answers used for grading come from a panel of AI models, with no human settling disagreements.
- Accuracy per risk category has too little data behind it to be conclusive, so no number is reported.
- One measurement, the frontier arm of a cost curve, could not be completed. It is marked "not measured" rather than estimated.
- 10 companies is a small set, and 9 of the 10 recycled most of their risk section. Filings chosen to expect almost no change cannot exercise a mechanism built for genuine ambiguity.
- There is no evidence linking a newly disclosed risk to any later outcome.
