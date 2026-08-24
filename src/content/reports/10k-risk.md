---
title: "Eval report"
project: "10k-risk"
source: "10K Risk Extractor/docs/eval-report.md"
---
# Evaluation Report

Status: measured, with one gap stated as a gap. Every number below comes from a run
over the committed corpus. One measurement – the frontier arm of the cost curve – could not
be completed because the API credit balance was exhausted mid-benchmark. It is marked not
measured rather than estimated, because an estimate in a slot reserved for a measurement
is the specific failure this report format exists to prevent.


## 0. Headline

> On 20 filings and 3,216 extracted risk claims: zero fabricated citations by
> construction, 98.2% of claims supported by the text they cite, 0% false-positive rate on
> both negative controls, and 94.9% of claims correctly persisting through a bank's
> restructuring of its risk-factor sections. But run-to-run stability of the headline
> `is_new` output ranges from 0.92 down to 0.10 depending on the issuer – on Boeing, not one
> flagged passage survived all three passes. That is disqualifying for alerting, and it is
> the finding this report exists to surface.

Getting there took five fixes, three of which were invisible in the output and surfaced only
because a count failed to reconcile. The false-positive rate on the negative controls went
7.3% → 3.6% → 0%, and the last of those fixes was structural rather than promptable.

The accuracy numbers and the stability number disagree about whether this is shippable,
and the stability number is the one to believe. A pipeline can be simultaneously
well-calibrated on average and useless in practice, and only the second measurement reveals
it. §5, §6 and §10 are the sections worth reading.

What this eval cannot tell you, stated before the numbers: reference labels come from
an LLM panel with no human adjudication. Where a labeler and the extractor share a
model family, agreement measures shared bias rather than correctness. Section 4 quantifies
that effect instead of waving at it, and Section 2 – the metrics that need no labels at
all – is where the weight of the evidence sits.


## 1. What was measured, on what

| | |
|---|---|
| Issuers | 10 |
| Fiscal years | FY2024 → FY2025 |
| Filings | 20 |
| Item 1A boundary assertions passing | **20/20**, 6/6 assertions each |
| Sentences extracted | **10,074** |
| Sentence offset errors | **0 / 10,074** |
| Risk Factors segmented | **691** (15–74 per filing) |
| Issuer section headings captured | **56** |
| Risk Claims extracted | **3,216** |
| Corpus run cost (routed model) | **$9.41** |

Corpus construction, control assignment, and the deterministic screen that produced them:
[View corpus source ↓](/downloads/10k-risk/corpus.md).

<pre class="mermaid">
flowchart LR
  filing["Item 1A Filing"] --&gt; seg["Segmentation"]
  seg --&gt;|"Risk Factors"| decompose["Decompose"]
  decompose --&gt;|"Risk Claims"| classify["Classify"]
  classify --&gt; adjudicate["Adjudicate"]
  adjudicate --&gt; diff["Year-over-Year Diff"]
</pre>

### Control roles were assigned by measurement, not by hypothesis

Negative controls (PLD, ED) and positive controls (NVDA, BA, JPM) came
from a 5-gram lexical screen over the corpus, not from the slate rationale. This mattered:
the predicted recyclers were PG and RSG, and neither made the top two. PLD – slated as
a taxonomy stress test – turned out to be the most recycled issuer at 0.933 Jaccard. Had
roles been assigned from the hypothesis, the false-positive test would have run against the
wrong issuers.


## 2. Metrics that need no labels

These carry the weight, precisely because no judgment enters them. Nothing here is
circular, and nothing depends on the panel.

| Metric | Result | Why it is uncircular |
|---|---|---|
| Span integrity | **by construction** | Models emit sentence *ids*, never quoted text. A fabricated citation cannot be represented. |
| Sentence offset resolution | **0 errors / 10,074** | Each Sentence's offsets re-resolve to its own text. Verified on every parse; a failure drops the filing. |
| **Citations outside their Risk Factor** | **0 / 3,216** | Rejected before a Claim is built – and before it costs a classification call. Held across the entire corpus, on both the frontier and the cheap model. |
| Schema validity | **0 violations / 3,216** | Pydantic validators reject `INTENSIFIED` without an Intensity Signal, `UNMATCHED` carrying a prior claim, and Claims with no citation. |
| Item 1A coverage | **76.5%** (3,850 / 5,033) | Share of Sentences reachable from at least one Claim. Range 56.9% (FSLR) – 84.6% (MRNA). |
| **`is_new` stability across 3 runs** | **0.10 – 0.92 by issuer** | The pipeline measured against itself, cache bypassed by salt. **This is the criterion the build fails** – see §5. |
| **False-new rate on negative controls** | **0%** | PLD 1/196 and ED 6/93, every flag verified as a genuine AI disclosure. See §6. |


## 3. Metrics that need judgment

Everything in this section inherits the labeling caveat in §0.

### Per-Category agreement – under-powered, and reported as such

The plan was per-Category precision, never a single aggregate. The sample cannot support
it, and publishing the numbers anyway would be the worse choice:

| | |
|---|---|
| Categories represented | 40 of 48 |
| Claims with complete panel coverage | 125 |
| Claims per Category | min 1, **median 2**, max 9 |
| Categories with n ≥ 10 | **0** |
| Categories with n ≥ 5 | 11 |

A Category with n = 2 yields an "agreement rate" of 0%, 50%, or 100% and means nothing. The
only Category with n ≥ 8 is `manufacturing_capacity` (n = 9, 78% unanimous, 67% matching the
pipeline), and one Category is not a finding.

The arithmetic was predictable and I should have caught it before sampling. A 200-claim
random sample spread across 48 Categories averages 4 per Category before attrition; the
design needed ~30 per Category to say anything.

Stratified sampling fixes this. Random sampling to reach n = 30 on the *median*
Category would need roughly 3,000 labelled Claims across three providers, and the rare
Categories would still be thin. Sampling *up to* 30 Claims per Category instead reaches the
same statistical power at roughly 1,400 labels and gives even
coverage across the taxonomy rather than concentrating on whichever Categories happen to be
common. Since the whole point of per-Category agreement is to find the Categories whose
*definitions* are weak, over-sampling the common ones measures the wrong thing.

**What can be said:** corpus-level agreement is κ = 0.848 (§4), which is high, and it is a
property of the taxonomy as a whole rather than of any Category in it.

### Entailment – 98.2%

The share of Claims actually supported by the Sentences they cite, checked by GPT-4.1, a
different model family than the extractor. Distinct from span integrity: a Claim can cite
a real sentence and still assert something it never said, and that is the failure that
reaches a memo looking impeccably sourced.

All 3,218 Claims were checked; none went unverified.

| Issuer | Rate | | Issuer | Rate |
|---|---:|---|---|---:|
| CRWD | 99.3% | | RSG | 98.5% |
| PG | 99.2% | | MRNA | 98.3% |
| FSLR | 98.9% | | BA | 97.9% |
| NVDA | 98.8% | | JPM | 96.4% |
| PLD | 98.5% | | **ED** | **92.5%** |
| | | | **Overall** | **98.2%** |

1.8% of Claims assert something their cited text does not support – and span-existence
checking would have caught none of them, because every one of those citations is real. This
is the number Q15 predicted would be the actual hallucination surface once fabricated spans
were made structurally impossible.

The failures are specific and legible, which is what makes them fixable:

| Verifier's finding | Failure type |
|---|---|
| *"'Exclusive' contract is added; source only states 'contract'"* | unstated specific |
| *"Claim says all materials are regulated as hazardous; source only states elemental cadmium"* | scope inflation |
| *"'May also experience' is hypothetical, but the claim asserts a definite expectation"* | modality hardened |
| *"Claim says 'materially impact'; source omits 'materially'"* | severity added |
| *"Source only mentions reputational harm, not the causes"* | causation invented |

Every one is the decomposer over-reaching slightly beyond its source – adding a qualifier,
hardening a hedge, widening a scope. None is an invented risk, which puts the fix in the decomposition prompt, not in retrieval
or adjudication.

ED at 92.5% is the outlier, and it is the smallest filing in the corpus (93 Claims), so
seven unsupported Claims move it four points below the next issuer. Same denominator
sensitivity as §6.

> One caveat on the verifier itself. At least one rationale was incoherent – *"'May
> limit' is weaker than 'may limit'"* compares a string to itself. The verifier has its own
> error rate, unmeasured here, and 98.2% should be read as an estimate with an unknown band
> rather than a precise figure.

### Intensity Signals

Not measured. Agreement per signal kind (conditional actualized, quantification, modal
certainty, scope, mitigation) needs its own panel pass over intensity judgments, and it hits
the same sampling problem as per-Category agreement, harder: the corpus contains 97
intensified and 20 weakened Claims out of 3,216 – 3.6% – spread across five signal kinds.
Even labelling every one of them gives ~23 per kind before the panel disagrees about
anything.

The Q6 prediction – that decomposed signals agree better than a single "did this intensify?"
judgment – therefore remains untested. It is the most falsifiable claim in the design
and the one this build did not get to, which is worth stating plainly rather than leaving
implied.

What the corpus does show is that the decomposition constrains the model: 8 of JPM's 10
intensity outcomes and 6 of PLD's 7 carried at least one named signal, and the schema
demoted the rest to `same` rather than allowing an unevidenced intensity flag. That is the
mechanism working as designed, but it is not the same as showing the signals are reliable.


## 4. How much of the agreement is shared bias?

The panel is three models: two from families different to the extractor, and one
deliberately from the same family. Agreement is reported both ways.

Panel: GPT-5.6 Luna, Gemini 3.7 Flash, and Claude Sonnet 5 – the last sharing a
family with the Claude Haiku 4.5 extractor. Sample of 200 Claims; n = 125 after Gemini
lost 3 batches to provider overload (see the fault-tolerance note below).

| | Fleiss κ | Unanimous |
|---|---:|---:|
| Including the same-family labeler | 0.848 | 80.0% |
| Cross-family labelers only | 0.867 | 87.2% |
| **Gap** | **−0.019** | |

Pairwise: GPT↔Gemini 0.868, GPT↔Sonnet 0.843, Gemini↔Sonnet 0.834.

### The result argues against my own concern

I designed §4 expecting the same-family labeler to *inflate* agreement – that was the
premise of the Q4 objection to zero-human labeling. The measured gap is −0.019: agreement
is fractionally *lower* with the same-family member included, and the difference is
indistinguishable from zero at n = 125.

So no correlated-error effect is detectable here. Two honest readings, and I cannot
separate them with this data:

1. Family-level correlation is genuinely weak for this task. Category assignment against an
   explicit rubric with INCLUDES/EXCLUDES notes may leave little room for family-specific
   bias – the rubric does the work, not the model's priors.
2. The effect exists but is smaller than the noise at n = 125. A −0.019 gap is well inside
   what this sample can resolve.

Either way, the appropriate conclusion is that the circularity objection is not supported
by the evidence available, not that it has been refuted. Reporting a result that weakens
my own stated concern is the point of measuring it rather than asserting it.

Overall κ ≈ 0.85 is high by conventional benchmarks, which is itself evidence the taxonomy
definitions are doing real work – a vague rubric produces raters who disagree.

### The panel survived a provider outage, by design

Gemini returned 503s mid-run and the first attempt destroyed the whole phase, discarding
labels the other two providers had already produced. A three-member panel whose statistics
can be wiped by one member's outage is three single points of failure, not a panel.

Rebuilt with per-batch retries and backoff, per-member failure counts, and statistics
computed over contributing members only. Gemini still lost 3 of 8 batches on the rerun;
the sample narrowed from 200 to 125 Claims with complete coverage, which shrinks precision
without biasing it – the surviving Claims are not selected by anything correlated with
their difficulty.


## 5. Stability

Accuracy and stability are different failure axes. An analyst who gets an alert on Monday
that has vanished by Tuesday stops opening the alerts, whatever the precision figure says.

This is the criterion the build fails. Three passes per issuer, each with a distinct
cache salt so the calls are genuinely re-made, compared over Sentences rather than
Claims – Claim ids are positional and Claim text is model-generated, so comparing those
would measure paraphrase rather than stability, while Sentence ids come from a
deterministic splitter and are identical across every run.

| Issuer | Claims per run | New per run | Mean Jaccard | Consensus |
|---|---|---|---|---|
| ED | 93, 97, 91 | 5, 8, 6 | **0.917** | **88%** |
| PLD | 189, 194, 194 | 1, 2, 3 | 0.500 | 33% |
| BA | 198, 193, 198 | 3, 1, 4 | **0.095** | **0%** |

On Boeing, not one flagged passage survived all three runs. Run the pipeline three times
against the same pair of filings and it reports a different set of new risks each time. No
precision figure repairs that, and it is disqualifying for the alerting use case the product
is aimed at.

### The pattern in the failure is more useful than the failure

Stability tracks signal strength, not issuer, size, or filing length:

- ED is stable (0.917 / 88%) because its change is real and distinct – a first-time AI
  risk factor, verified against source text in §6. Every run finds it.
- BA and PLD are unstable because their flags are marginal judgment calls on
  mid-similarity pairs *and* their `is_new` sets are tiny. When a run flags 1, 2, or 3
  Claims out of ~190, one different decision halves the Jaccard.

So the pipeline is reliable exactly where the finding matters and unreliable at the margin.
That is a usable property – but only if it is reported rather than averaged into a single
number, which is the argument for confidence tiering in §10 rather than a bare `is_new`
boolean.

The upstream cause is decomposition drift. The same PLD filing yields 189–194 Claims
across runs (~2.5% variance). A Claim that exists in one pass and not another cannot match
anything, so it becomes a candidate for `is_new` – the small wobble upstream is amplified
into a large one in the headline output. It is the same mechanism §6 identified as the cause
of the original false positives, showing up here as instability instead.

Note on the obvious mitigation. "Set temperature to 0" is the reflex answer and it is
not available: sampling parameters are rejected outright on the current models. Stability
here is a measured property, not a configured one.

Cost of this measurement: $5.43 across three issuers.


## 6. Controls

### Negative controls – the false-positive test

| Issuer | YoY overlap | Claims | Flagged new | True positives | **False-new rate** |
|---|---|---|---|---|---|
| PLD | 0.933 | 196 | 1 | 1 (AI disclosure) | **0%** |
| ED | 0.849 | 93 | 6 | 6 (all one AI risk factor) | **0%** |

Both negative controls pass. On filings that are 93% and 85% lexically identical to the
prior year, the pipeline surfaced seven claims in total, and all seven were real – each
issuer's first substantive AI risk disclosure. Verified independently of the pipeline by
counting AI mentions in the source text: PLD FY2024 0 → FY2025 4; ED FY2024 1
(inside an unrelated cyber sentence) → FY2025 12, including a dedicated AI risk factor
that ED's decomposition split into six Claims.

That is also the "why now" thesis showing up in the data rather than in the pitch: rising
AI-related disclosure is exactly the kind of delta this is built to catch.

> A correction worth recording. ED was first reported at 3 new of 87 Claims. Both
> figures were wrong – they predate the silent-drop fix, so the numerator *and* the
> denominator were short. The corrected 6 of 93 is a higher count and the same 0% false-new
> verdict. A rate computed over survivors of a lossy stage is not a rate, and the direction
> of the error is not predictable in advance.

#### False-new *rate* is denominator-sensitive, which the corpus makes obvious

Ranking every issuer by new-claim rate puts the two negative controls at opposite ends:

| Issuer | New / Claims | Rate | Role |
|---|---|---|---|
| PLD | 1 / 196 | 0.5% | **negative control** |
| FSLR | 2 / 270 | 0.7% | |
| PG | 1 / 125 | 0.8% | |
| RSG | 2 / 205 | 1.0% | |
| BA | 3 / 188 | 1.6% | positive control |
| JPM | 9 / 414 | 2.2% | positive control |
| CRWD | 18 / 580 | 3.1% | |
| NVDA | 14 / 402 | 3.5% | positive control |
| MRNA | 30 / 743 | 4.0% | |
| **ED** | **6 / 93** | **6.5%** | **negative control** |

ED has the corpus's *highest* new-claim rate and a 0% false-positive rate. Its Item 1A
is the smallest in the corpus at 93 Claims, so one genuine new risk factor decomposed into
six Claims dominates the ratio.

Two consequences worth stating. A rate alone cannot be used as a quality gate – a small
filing with one real addition looks worse than a large filing with several false ones, so
absolute counts must be reported beside it. And the lexical screen and the claim-level
rate disagree for ED, with both correct: the screen measures text overlap (0.849, second
most recycled), the rate measures new Claims per Claim. ED recycled nearly all its text and
appended one substantial new factor. Those are different questions, and only reading both
gives the right answer.

#### It took three attempts, and the failures are the useful part

| Version | Flagged new | False-new rate | Claims lost | What changed |
|---|---|---|---|---|
| v1 | 14 / 193 | 7.3% | – | – |
| v2 | 7 / 195 | 3.6% | – | adjudicator contract rewritten |
| v3 | 1 / 196 | **0%** | 17 (8.7%) | prior-year source text added as evidence |
| v4 | 1 / 196 | 0% | 12 (6.1%) | unresolved decisions retried, then abstained |
| v5 | 1 / 196 | **0%** | **0** | source-text matches accepted by the validator |

#### The fix measured something that was previously invisible

With the evidence basis recorded, PLD's 196 Claims resolve as:

| Match basis | Count | Share |
|---|---|---|
| Prior-year **Claim** | 176 | 89.8% |
| Prior-year **source text** | **19** | **9.7%** |
| Unmatched (genuinely new) | 1 | 0.5% |

Those 19 are the decomposer's recall gap, counted. Each is a disclosure present in the
FY2024 filing that FY2024's decomposition failed to turn into a Claim – and under the
original design every one of them would have been reported as a new risk. It says roughly
one in ten disclosures is missed by extraction – a far more useful statement about the
pipeline than any aggregate precision figure, and not measurable at all until the evidence
basis became explicit.

An extractor that reports a
dozen new risks for an issuer who changed almost nothing is unusable in Screening Mode
regardless of how well it does on the positive cases – and no positive example would
reveal it.

#### v1 failed, and the diagnosis is the interesting part

The first run flagged 14 new risks for an issuer whose Item 1A is 93.3% lexically
identical year over year. The flagged claims were plainly false – *"has elected not to
carry earthquake insurance for its assets in Japan"*, *"subject to changes in regulatory
and environmental requirements, taxes, tariffs"*. A REIT does not newly disclose those.

Retrieval and adjudication have different fixes, so the first step was finding out which
had failed:

| Diagnostic | Result | Reading |
|---|---|---|
| Median global-best similarity, all current Claims | **0.959** | every Claim has a near-identical prior twin |
| 5th percentile | 0.796 | even the tail has a strong twin |
| Claims whose Candidate Pool missed the global best | 17 / 195, mean gap 0.013 | Parent blocking is not hiding matches |
| Claims with an empty pool | **0** | nothing was unreachable |

Retrieval was fine. Adjudication was the failure. The adjudicator was being handed a
0.95-similarity candidate and still returning `unmatched`, and its own rationales said why:

> *"No prior candidate specifically addresses…"* · *"Current claim focuses narrowly
> on…"* · *"no prior candidate isolates…"*

It was demanding a granularity-matched twin. Where the prior year's decomposition
bundled foreclosure risk into a broader debt claim and the current year isolated it, the
adjudicator concluded nothing matched – and reported a recycled risk as new.

#### The root cause is a hole in the design reasoning, not a bug

Claim-level diffing was chosen over factor-level precisely because it survives
restructuring. It does survive the issuer's restructuring. What was not accounted for
is that the decomposer is itself a restructurer: the two fiscal years are decomposed
independently, so the same disclosure is routinely carved into different pieces, and an
adjudicator that matches on claim boundaries mistakes that artifact for a change in risk.

This is the cost of the two-level model, and it did not show up in any positive example –
only the negative control exposed it. That is the entire argument for having one.

**Fix 1 (v2):** the adjudicator's contract now states that the two years were split
independently, that a current Claim which is a narrower slice of a broader prior Claim is
`same` rather than `unmatched`, and that `unmatched` is reserved for an exposure the prior
year does not disclose *at all*. This halved the error.

#### The last third of the error was structural, not promptable

What survived v2 exposed a deeper problem. *"Has elected not to carry earthquake insurance
for its assets in Japan"* was flagged new at similarity 0.582 – PLD discloses that every
year. No candidate matched it because FY2024's decomposer never emitted a Claim for it.

Matching current Claims against prior *Claims* inherits the prior year's decomposition
recall. Anything last year's decomposer missed looks new this year, permanently, and no
amount of prompt work fixes it because the evidence is genuinely absent from the candidate
set.

**Fix 2 (v3):** adjudication now also sees the prior year's source Sentences, retrieved
by similarity without Parent blocking – Sentences carry no Category, and the question they
answer ("was this disclosed at all?") is not category-scoped. The question asked of the
adjudicator changed from *"did we extract a Claim for this before?"* to *"did the company
disclose this before?"*, which is the question that was always meant. The filing's text
contains the disclosure whether or not the decomposer caught it.

#### A third defect, found by the arithmetic not the output

Between v2 and v3 the record count moved 195 → 179 while decomposition was cached and
unchanged. 17 of 196 Claims (8.7%) were being silently dropped when the adjudicator's
batch response was missing an entry or pointed at a candidate index that did not exist.

Dropping them loses the Claim from the output entirely: a genuinely new risk among them
would never surface, and every rate is quietly computed against a smaller denominator.
Unresolved decisions now become Abstentions, which is what they are – surfaced in
Screening Mode, suppressed in Memo Mode – and are counted separately from judgment
abstentions, because a rising count there is the adjudicator being careful while a rising
count here is a pipeline defect. Current rate: 17 / 196 technical abstentions, tracked
as an open defect.

#### And a contradiction introduced by the fix itself

Retrying the 17 unresolved decisions individually recovered only 5. Twelve failed again
even when asked alone, which meant they were not batching artifacts – and the reason was a
contradiction created by Fix 2.

The v3 prompt tells the adjudicator that a `same` verdict may rest on prior-year source
text when no candidate Claim matches. The result validator then rejected exactly that
answer, because a matched outcome required a valid candidate index, and the schema
required a `prior_claim_id`. The model was instructed to do something the type system
forbade, and every time it complied its answer was thrown away and counted as a failure.

Fixed by making the evidence basis explicit rather than implied: an Adjudication now
records `matched_via` as either `claim` or `source_text`, and a source-text match legitimately
carries no `prior_claim_id`. The share of matches resting on source text is reported,
because a high source-text share is a measurement of the decomposer's recall gap – it
counts the disclosures present in the filing that extraction failed to turn into Claims.

**A fourth signal from the same runs:** `abstain` was returned zero times by judgment
across 193 decisions at v1. Tracked in §8.

### Positive controls – read by hand before the pipeline ran

| Issuer | Change identified independently, before running | Surfaced? |
|---|---|---|
| JPM | Merged *Regulatory* and *Legal* into one section; Item 1A down 18% | **yes** – 94.9% persistence, see below |
| CRWD | The July 2024 outage | **yes** – 6 of 18 new Claims name it directly |
| NVDA | 2025 export-control regime | **yes** – 4 of 14 new Claims are the AI Diffusion rule |
| BA | Spirit divestiture, new exchangeable notes | **yes** – both, and only 2 new Claims total |

Each was checked against the source text the same way as the negative controls, counting
term frequency in Item 1A independently of the pipeline:

| Issuer | Term | FY2024 | FY2025 | |
|---|---|---:|---:|---|
| CRWD | "July 19" | **0** | **32** | new |
| CRWD | "Incident" | 7 | 43 | grew 6× |
| NVDA | "AI Diffusion" | **0** | **12** | new |
| NVDA | "Blackwell" | **0** | **2** | new |
| NVDA | "export control" | 25 | 33 | grew |
| BA | exchangeable notes | **0** | **4** | new |

CRWD's 18 new Claims include the outage and its commercial consequences: competitors approaching its customers, subscription incentives it agreed
to offer, and lengthened sales cycles. The pipeline surfaced the *business effects* an
analyst would want, including the downstream business effects.

NVDA's are dated and specific – *"On January 15, 2025, the USG published the 'AI
Diffusion' IFR in the Federal Register"*, the three-tier country split, Blackwell licensing
requirements, and a Chinese regulatory investigation into its export-control compliance.

BA produced only 2 new Claims from 188 – the Spirit divestiture service obligations and
$230m of exchangeable notes. A low count on a genuine positive control is the right
behaviour: Boeing's FY2025 risk profile did not change much, and the screen agreed (0.680
overlap, third-highest churn, driven by rewording rather than new exposure).

### JPM: the design decision holds

This was the sharpest test in the corpus. JPMorgan merged two top-level sections, which is
exactly the case that motivated diffing at Risk Claim level rather than Risk Factor level:
a factor-level diff sees two sections vanish and one appear, and reports a risk-profile
change that is really an editing decision.

| Outcome | Count | Share |
|---|---|---|
| **same** | **393** | **94.9%** |
| intensified | 6 | 1.4% |
| weakened | 2 | 0.5% |
| unmatched (new) | 9 | 2.2% |
| abstain | 4 | 1.0% |

94.9% of Claims persisted across the section merge. Factor-level diffing would have
reported dozens of disappearances and appearances from an editing decision alone. Q2's
central choice is corroborated by the case it was designed for.

### And the positive control found four defects the negative controls could not

Hand-checking the 10 new flags against the source text – the same verification used on the
negative controls – gives a mixed result, which is more useful than a clean one:

| Term | FY2024 | FY2025 | Verdict |
|---|---|---|---|
| private credit | 0 | 1 | genuinely new |
| AI | 8 | 23 | grew substantially; the specific claims are plausibly new |
| collateral | 20 | 21 | **present both years – false positive** |
| hostilities | 9 | 8 | **present both years – false positive** |

Diagnosing where each false flag came from, by comparing each Claim's best prior twin
*anywhere* against the best twin *inside its blocked pool*:

- 3 of 10 had their true twin hidden by Parent blocking. The clearest: a holding-company
  funding-dependence Claim whose twin sat at 0.917 similarity in an unreachable Parent,
  while the best reachable candidate was 0.728.
- The remaining flags had `global ≈ blocked`, meaning the adjudicator saw the best available
  candidate and still called it new. Those are judgment errors or genuine novelty, not
  retrieval failures.

The blocking gaps were specific and are now closed. The adjacency map linked `financial`
only to `macro_geopolitical`. It did not link `financial` to `legal_regulatory` – for a bank,
capital requirements and litigation reserves are both – nor to `operational`, where a
holding company's dependence on its subsidiaries for funding lands. Both pairs were added
from measured failures rather than intuition, which is the difference between a taxonomy
defended by data and one defended by taste.

| After widening adjacency | Before | After |
|---|---|---|
| Claims on a blocking boundary | 304 (73%) | **221 (53%)** |
| Matches needing source-text fallback | 30 | **23** |
| Persistence (`same`) | 94.4% | **94.9%** |
| Flagged new | 10 | 9 |

Both specifically-diagnosed claims – holding-company funding and derivatives disputes –
resolved correctly to `same`. The count fell only 10 → 9 because widening the pools also
changed which candidates other Claims saw, and one different false flag surfaced.

Roughly four false positives remain. Their best
prior twin *anywhere* is no better than the best twin *inside* the pool, so retrieval did
its job and the adjudicator judged wrong on mid-similarity pairs (0.72–0.82). That is a
judgment limit, not a plumbing bug, and no further adjacency widening addresses it. On a
heavily-restructured filing that is ~1% of 414 Claims – the corpus's worst case, against
0% on both negative controls.

JPM's boundary rate being the corpus's highest is also consistent with §9: JPM is the one
issuer that uses no section headings at all, so its Claims sit least comfortably in a
taxonomy anchored to how other issuers group theirs.

### What the corpus actually contained

Every new Claim the pipeline surfaced on a negative control was an AI disclosure, which
prompted a direct check of the source text across all ten issuers – independently of the
pipeline, by counting AI-related mentions in Item 1A:

| Issuer | FY2024 | FY2025 | Δ | |
|---|---:|---:|---:|---|
| NVDA | 48 | 65 | +17 | |
| CRWD | 24 | 38 | +14 | grew |
| BA | 1 | 1 | 0 | |
| MRNA | 11 | 25 | +14 | grew |
| FSLR | 19 | 19 | 0 | |
| PG | 6 | 7 | +1 | |
| RSG | 0 | 7 | +7 | **first disclosure** |
| ED | 1 | 12 | +11 | grew |
| JPM | 11 | 23 | +12 | grew |
| PLD | 0 | 4 | +4 | **first disclosure** |
| **Total** | **121** | **201** | **+66%** | 8/10 issuers rising, 2 first-time |

AI-related risk disclosure rose 66% across the corpus in one fiscal year, and two
issuers disclosed it for the first time. That is the "why now" premise appearing as
measured data rather than as a market claim – and it is what the negative controls
independently surfaced without being told to look for it.

It is also the cleanest available demonstration of the product's value: on two
filings that were 93% and 85% textually unchanged, the delta the pipeline extracted was
precisely this, and nothing else.


## 7. Cost and quality across models

Every stage runs twice over the identical corpus – once frontier, once cheap – so the
routing policy is derived from a measured curve rather than asserted from intuition.

The frontier arm is now complete: six stratified filings on Opus 5 against the same
filings on Haiku 4.5, 1,354 vs 1,500 Claims from identical input.

### Measured: where the money actually goes

| Stage | Calls | Input tokens | Output | Cost | $/call | **Share** |
|---|---:|---:|---:|---:|---:|---:|
| Adjudicate | 814 | 5.18M | 275k | $6.56 | $0.0081 | **41.7%** |
| Classify | 757 | 2.90M | 338k | $4.59 | $0.0061 | **33.2%** |
| Decompose | 770 | 1.08M | 362k | $2.89 | $0.0038 | **25.1%** |

### This corrects my own cost model, by roughly double

Q8 asserted adjudication would be ~80% of pipeline spend, reasoning from ~1,000
adjudications per company-year at k=5 against ~40 decompositions. Measured: 41.7%, and
the three stages are far more balanced than predicted.

The error was assuming one call per unit of work. Batching adjudication six Claims at a time
and classification per Risk Factor collapsed the call counts the estimate rested on – 814
adjudication calls for the corpus, not the ~10,000 the original reasoning implied. The
routing decision that followed from the 80% figure was therefore aimed at the wrong stage.

### Frontier vs cheap, per stage – the completed curve

| Stage | Haiku 4.5 $/call | Opus 5 $/call | **Ratio** | vs list price (5×) |
|---|---:|---:|---:|---|
| Decompose | $0.0035 | $0.0252 | **7.2×** | worse than list |
| Classify | $0.0059 | $0.0181 | **3.1×** | **better** than list |
| Adjudicate | $0.0081 | $0.0529 | **6.5×** | worse than list |
| **Pipeline total** | **$19.46** | **$27.49** | | |

The stages are not equally price-sensitive, and the reason is mechanical. Classification
is the one stage where the frontier model is *less* penalised than list pricing implies,
because its input is a ~4,600-token taxonomy rubric served from the prompt cache at 0.1×
and its output is a category id. Decomposition and adjudication are worse than list because
Opus 5 runs adaptive thinking by default, and thinking tokens bill as output – decomposition
alone generated 239k output tokens.

The model comparison shows that the frontier/cheap gap is
wider than the sticker prices suggest wherever output is generative, and narrower wherever a
cached prefix dominates the input.

### What the extra money buys: nothing measurable

| | Opus 5 | Haiku 4.5 |
|---|---|---|
| Claims from the same 6 filings | 1,354 | 1,500 (**+9.7%**) |
| New-claim rate | 2.0% | 2.2% |
| **False positives on negative controls** | **0** | **0** |
| Flags on PLD / ED | 2 / 6 | 1 / 6 |
| Cost | $27.49 | $19.46 |

Both models flagged the same genuine AI disclosures on both negative controls, and neither
produced a false positive. On the one uncircular quality measure this eval has, the
frontier model is indistinguishable from the cheap one.

The single measurable difference is decomposition granularity: Opus 5 produces 9.7% fewer
Claims from identical text. Whether that is Opus being appropriately conservative or Haiku
being appropriately thorough is not decidable from this eval – it needs per-Claim labels,
and §3 explains why the panel sample cannot supply them.

### The routing policy that falls out

Route every stage to Haiku 4.5. At 3–7× the price, the frontier model produced no
measurable improvement in the metric that decides whether the product ships.

Two honest qualifications. The comparison rests on negative-control false-new rate, which
is uncircular but coarse; a finer measure might separate them. And this is a *conditional*
recommendation: the cheap model is adequate for this task, at this taxonomy, with this
prompt, and the right response to changing any of those is to re-run this curve rather
than to trust it.

**What this exercise cost:** $27.49 to learn that the $27.49 was unnecessary. That
is the correct outcome of a cost/quality curve, and it is only available by measuring –
asserting "the frontier model is better for the hard reasoning stage" would have sounded
more sophisticated and been wrong.


## 8. Two modes, two acceptance bars

Reporting one number for both is the mistake. Memo Mode's precision is gameable by
abstaining on everything, which is why Coverage is reported beside it.

| | Screening Mode | Memo Mode |
|---|---|---|
| Abstentions | surfaced as unverified possibles | suppressed |
| Unentailed Claims | surfaced, flagged | suppressed |
| Primary metric | recall of genuinely new Claims | precision |
| Guard metric | false-new rate on negative controls | **Coverage** |
| **Coverage** | **100%** | **97.7%** |

### The two modes are 2.3 percentage points apart, and that is a negative result

Corpus-wide, judgment abstentions are 15 of 3,216 Claims – 0.47%. Adding suppression of
unentailed Claims (1.8%) puts Memo Mode's coverage at 97.7% against Screening Mode's
100%.

Verified end-to-end on ED, the corpus's hardest case for this metric: 93 records, 93 visible
in Screening Mode, 87 in Memo Mode – 93.5% Coverage, tracking its 92.5% entailment rate.
(Until entailment was wired into the records rather than run as a separate phase, Memo Mode
reported 0% Coverage because nothing had been checked.
An integration gap that produced a plausible-looking number, which is the same failure shape
as §6's silent drops.)

A 2.3-point difference is not two products. Q9 argued abstention was the mechanism that
made Screening and Memo genuinely different, and on this corpus it does not carry that
weight: an analyst switching modes would see almost the same table.

Three readings, and the honest answer is that the design has not been tested rather than
that it has failed:

1. The adjudicator is under-abstaining. v1 abstained zero times out of 193 and was
   confidently wrong; fixing its contract raised abstentions and cut false positives
   together. That correlation suggests the current 0.47% may still be too low, not that
   uncertainty is genuinely rare.
2. The corpus is too easy for the distinction to matter. Nine of ten issuers recycled
   most of their Item 1A, so most decisions are unambiguous. The mode split would matter
   most on filings the corpus does not contain – heavy restructures, first-time filers,
   spin-offs.
3. Entailment, not abstention, may be the real Memo Mode gate. It suppresses 1.8% of
   Claims against abstention's 0.47% – nearly four times as much, and for a more defensible
   reason: an unsupported claim in a client memo is a liability, whereas an uncertain match
   is merely uncertain.

**What I would change:** make entailment the primary Memo gate and abstention secondary,
which inverts Q9's assumption. And test the split on a corpus chosen for ambiguity rather
than for recycling, since a control set built to expect ≈zero change cannot exercise a
mechanism that exists to handle genuine ambiguity.

### The abstention rate is itself a finding

At v1 the adjudicator returned `abstain` zero times in 193 decisions. Since abstention
is the sole mechanism separating the two modes, they were at that point the same product
with two names – Screening Mode and Memo Mode would have shown identical output.

The v1 adjudicator was not uncertain about anything; it was confidently wrong, which is the
worse failure. Rewriting its contract to describe the decomposition-artifact problem (§6)
raised abstentions from 0 to 3 while halving false positives, so the two effects moved
together: the cases it had been resolving as confident `unmatched` were exactly the ones it
should have been unsure about.

**Interpreting the abstention rate:** near-zero means the mode split does not exist. Very
high means Memo Mode has no Coverage and is useless. Neither extreme is visible from an
accuracy number alone, which is why it is reported here rather than folded into precision.


## 9. Does the taxonomy hold up?

The 9 Parent Categories were anchored to how issuers actually organize Item 1A rather than
invented. The corpus can check that, because segmentation captures each issuer's own
section headings.

**Result from the 10-issuer corpus:**

- 7 of 9 Parents are corroborated by observed issuer groupings – operational, financial,
  market, legal/regulatory, technology/cyber, macro/geopolitical, governance/securities.
- 2 are never exercised as issuer groupings: human capital and climate/environment.
  They appear as claims but not as top-level structure in this corpus.
- **1 candidate for elevation**: Intellectual Property is a leaf under legal/regulatory
  here, but CRWD, MRNA and RSG each give it its own top-level grouping.
- JPM uses no groupings at all – its Risk Factors are directly captioned, which is why
  Parent Categories cannot be read off the filing and have to be assigned.

Per-Category panel agreement (§3) is the other half of this: a Category the panel cannot
agree on is a definition failure, not a model failure, and the fix belongs in the
taxonomy rather than in a prompt. Categories below the agreement bar are candidates for
merging in v2.


## 10. Kill criteria – and which ones this build tripped

Stated before the run, and not moved after it.

| Criterion | Bar | Result |
|---|---|---|
| Fabricated citations | near-zero, else not shippable | **structurally impossible** |
| False-new rate on negative controls | high rate ⇒ Screening Mode unusable | **0% (PLD, ED)** |
| Unentailed Claims in Memo Mode | near-zero | **passed by construction** – Memo Mode suppresses them; 1.8% corpus-wide |
| Per-Category precision below a junior analyst's | taxonomy is wrong, not the model | **not testable** – sample under-powered (§3) |
| Inter-labeler agreement below the interpretability bar | task under-specified; fix the rubric first | **passed** – κ = 0.848 corpus-wide |
| **Run-to-run stability of `is_new`** | an alert that vanishes is worse than no alert | **TRIPPED – 0.10 to 0.92 by issuer; 0% consensus on BA** |

### The criterion that tripped, and what I would do about it

Stability is the one bar this build fails, and it fails it badly enough that I would not
ship the alerting product on these numbers. The honest options, in the order I would try
them:

Report confidence, not a boolean. The failure is not uniform – §5 shows stability
tracking signal strength, with distinct real changes (ED's AI disclosure) found by every
pass and marginal judgment calls found by roughly one in three. A product that says "newly
disclosed" for both is lying about the second. Running three passes and reporting only
claims flagged by all three converts an unstable boolean into a stable, smaller, honest
one – at 3x cost, which is the trade to put in front of a user rather than resolve silently.

Attack decomposition drift at the source. Claim counts vary 189–194 on an unchanged
filing, and that upstream wobble is what propagates. Decomposing both years in a single call
so boundaries are chosen once, rather than independently per year, would remove the
mechanism rather than compensate for it downstream.

Stop reporting tiny sets as rates. With 1–3 new Claims out of ~190, Jaccard is a brutal
metric and a per-issuer "false-new rate" is close to meaningless. The right unit is the
finding, not the percentage.

**What I would not do:** tune the adjudicator prompt further. §6 established that the
remaining errors have `global ≈ blocked` similarity, meaning retrieval is doing its job and
the adjudicator is being asked to make a genuinely hard call on 0.72–0.82 pairs. That is a
judgment limit, and prompt work on it would be fitting noise on 20 filings.

### What tripped, before the remaining numbers land

Four defects were caught by measurement rather than by reading output, and each is recorded
where it happened. Listing them here because the pattern matters more than any one of them:

| # | Defect | Found by |
|---|---|---|
| 1 | Adjudicator demanded granularity-matched twins | negative control failing at 7.3% |
| 2 | Matching inherited the prior year's decomposition recall | the residue after fixing #1 |
| 3 | 8.7% of Claims silently dropped when a batch response came back short | record counts not reconciling |
| 4 | Validator rejected the very answer the prompt asked for | a retry pass recovering only 5 of 17 |
| 5 | Parent blocking hid true twins for a bank | positive control's 73% boundary rate |

Three of these were invisible in the output. #3 and #4 produced plausible-looking
results with claims quietly missing; #5 produced confident false positives. Only arithmetic
that failed to reconcile – record counts, retry yields, boundary rates – surfaced them.

And #2 is a hole in the design reasoning, not a bug. Q2 chose Claim-level diffing
because it survives restructuring. It does survive the *issuer's* restructuring – JPM proved
that at 94.9%. What was not accounted for is that the decomposer is itself a restructurer,
and independently decomposing two years produces boundary drift that looks identical to
change. That could not have been reasoned out in advance; it needed a control that expected
zero.

### What I would change

Make entailment the primary Memo Mode gate, not abstention. Q9 built the mode split on
abstention. Abstention suppresses 0.47% of Claims; entailment suppresses 1.8% – four times
as much, for a better reason. An unsupported claim in a client memo is a liability; an
uncertain match is merely uncertain. The design named the wrong mechanism.

Fix decomposition, not adjudication, for the entailment failures. All 1.8% are the
decomposer over-reaching its source – hardening "may" to "will", adding "exclusive",
widening "elemental cadmium" to "all materials". None invents a risk. That is a
decomposition-prompt problem and the cheapest remaining quality win.

Stratify the panel sample by Category. Random sampling gave a median of 2 Claims per
Category and zero Categories with n ≥ 10. Sampling up to 30 per Category reaches usable
power at roughly half the labels, and covers the taxonomy evenly instead of concentrating on
whatever is common – which matters because the point is to find the *weak definitions*.

Re-derive the routing policy from the measured curve, not the estimate. Decomposition is
10× more expensive on the frontier model; classification is 1.7×. A uniform cheap-model
policy gets classification wrong for almost no saving.

### What I would kill

The two-mode product, as currently specified. Screening and Memo differ by 2.3 points of
coverage, too little to support separate products. Shipping it as two would be marketing rather than
engineering. Either the adjudicator abstains far more (and that must be shown to be
*correct* abstention, not noise), or the modes collapse into one view with an entailment
filter – which is what the data currently supports.

The `is_new` field as a standalone output. The negative controls support its accuracy, but
§11's outcome-linked validation is unbuilt, so there
is no evidence that a newly disclosed risk carries information about what happens next. Until
that exists, this should be sold on the analyst time it saves, not on foresight it has not
demonstrated.

### What held up

The three design decisions that survived contact with data are the two-level Factor/Claim
model (94.9% persistence through JPM's section merge), structural citation ids (0 fabricated
citations in 3,216 Claims, by construction rather than by luck), and decomposed Intensity
Signals (the schema demoted every unevidenced intensity flag rather than shipping it).

### The honest summary

Four defects, three of them invisible in the output. Every one was caught by arithmetic
that failed to reconcile – record counts, retry yields, boundary rates – not by reading
samples. The negative controls found what no positive example could; the positive control
found what no negative example could. Both were necessary and neither was sufficient.

And one result contradicts the premise I argued for. I objected to zero-human labelling
on correlated-error grounds. The measured gap is −0.019, indistinguishable from zero. The
objection is not supported by the evidence available – which is what measuring it was for.


## 11. What this does not do

Outcome-linked validation is designed but not built. Testing whether `is_new` flags
precede subsequently disclosed events needs an event dataset and a multi-year horizon, and
a thin version would be worse than none. The methodology is specified below as the next
eval to run; specifying an eval you did not run is a different claim from running a weak
one, and the difference is stated rather than blurred.

### The methodology, and why it is the hardest claim in the project

Everything measured above asks whether extraction is *faithful to the filing*. This asks
something categorically different: whether a newly disclosed risk carries information about
what happens next. Faithfulness can be checked against the document. This cannot – it
requires the world.

The claim under test. Item 1A is drafted for litigation defense, so issuers add language
when counsel believes exposure has become real enough to warrant disclosure. If that is
true, a first-time disclosure should precede the materialisation of that exposure more often
than chance. If it is false, `is_new` is an accurate record of a drafting decision and
nothing more – still useful, but a smaller claim than the product implies.

Design.

1. Population. Extend the corpus backwards to FY2018–FY2025 for a few hundred issuers.
   Eight years gives seven diff pairs per issuer and enough first-time disclosures per
   Category to estimate anything.
2. Exposure. A Category's first `unmatched` Claim for an issuer, with the fiscal year it
   appeared. Subsequent years are not re-counted – the hypothesis is about onset.
3. Outcome, defined per Category before looking at anything. This is the load-bearing
   step, because a vague outcome makes the test unfalsifiable. Examples: `cybersecurity_incident`
   → a subsequent 8-K Item 1.05 filing; `litigation_and_claims` → a new material legal
   proceeding in Item 3; `goodwill_and_impairment` → a subsequent impairment charge;
   `liquidity_and_capital_access` → a covenant waiver or going-concern paragraph. Each is
   independently observable from later filings, which keeps the pipeline out of its own
   ground truth.
4. Comparison. Rate of the outcome within 24 months following a first disclosure,
   against the base rate for issuers in the same Category and sector who made no such
   disclosure. Reported as a rate difference with a confidence interval – never as a single
   headline number.

**Three confounds that would sink a naive version:**

- Sector clustering. Disclosure waves move sector-wide (the 66% AI rise above is exactly
  this shape). Without matching on sector and year, sector risk is measured, not the signal.
- Reverse causality. Counsel often adds language *because* something already happened
  and has not yet surfaced elsewhere. That is post-diction dressed as prediction. Requires
  excluding outcomes already observable at filing date.
- Correlated disclosure. Issuers who add one risk factor tend to add several. Per-Category
  results must be adjusted for how much an issuer expanded Item 1A overall.

Kill criterion, stated in advance. If the rate difference is not distinguishable from
zero once sector and year are matched, the honest conclusion is that `is_new` measures
disclosure behaviour rather than forward risk – and the product should be sold on the time
it saves an analyst, not on foresight it does not have. That result would be worth
publishing, because the claim it retires is one this category of tool routinely makes
without evidence.

Why it is out of scope here. It needs an event dataset that does not exist as a
download, seven additional diff years per issuer, and a population large enough for
per-Category base rates – hundreds of issuer-years against this build's ten. A version built
on twenty filings would produce a number with a confidence interval wide enough to include
every conclusion, which is worse than no number because it looks like evidence.

Also out of scope by decision: 10-Q intra-year Item 1A updates, Excel and alerting
integrations, and any claim about behaviour at 5,000-registrant scale.
