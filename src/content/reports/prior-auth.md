---
title: "Eval report"
project: "prior-auth"
source: "Prior Auth Agent/REPORT.md"
---
# Results – Prior Auth Agent

**Run date:** 2026-08-16 · **Corpus freeze:** 2026-08-15
**Pre-registration:** [View pre-registration source ↓](/downloads/prior-auth/EVAL-PLAN.md). No metric was redefined after results were seen.

Every number below comes from an artifact under `runs/`. Rates carry a Wilson 95%
interval and an explicit denominator (C6.3). The primary unit is the
Determination. Across 20 Cases and 6 Policies, the corpus contains 402 in-distribution
Determinations.

> Scope of this run – read before the results. All four product stages were
> exercised. Criteria Extraction (S1) and Case Evaluation (S2) are measured on
> Determinations and their Source Spans (§1–§3). The Entailment Cascade running as the
> pre-output gate (S3) and the composed PA Request (S4) are measured in situ on the 100
> committed in-distribution outputs (§4). What this run does not cover: the
> out-of-distribution slice was scored through S2 only, and the model boundary is a
> recorded response rather than a live API client. Both are stated plainly in §8.
>
> This report describes one frozen benchmark run, measured in two passes on the same
> day. Every number here reflects the final state of that run; §11 records what changed
> between the passes and why.


## 1. Gates

Gates are pass/fail and are reported before any utility metric. No utility metric
offsets a failed gate (C6.2).

| Configuration | `met`-precision | Wilson 95% | n | Gate | Grounded citation | n | Gate |
|---|---|---|---|---|---|---|---|
| fc-golden | 0.939 | [0.879, 0.970] | 114 | **FAIL** | 1.000 | 200 | **PASS** |
| fc-extracted | 0.938 | [0.877, 0.969] | 112 | **FAIL** | 1.000 | 203 | **PASS** |
| retr-golden | 0.903 | [0.834, 0.945] | 113 | **FAIL** | 1.000 | 224 | **PASS** |
| retr-extracted | 0.922 | [0.853, 0.960] | 102 | **FAIL** | 1.000 | 197 | **PASS** |
| fc-golden-norouting | 0.939 | [0.879, 0.970] | 114 | **FAIL** | 1.000 | 194 | **PASS** |
| ood-fc-golden *(scored separately, C6.5)* | 1.000 | [0.722, 1.000] | 10 | **FAIL** | 1.000 | 131 | **PASS** |

Source: `runs/scorecards/_summary.json`.

### `met`-precision: missed, on every configuration

The gate is ≥ 0.95 with a lower Wilson bound > 0.90. The best configuration
reaches 0.939 [0.879, 0.970]. It misses on both clauses: the point estimate is
below 0.95 and the lower bound is below 0.90.

The finding is that the system missed the gate. The gate does not move
(EVAL-PLAN §2). Concretely: at `fc-golden`, 7 of 114 Determinations returned `met`
are not `met` in the Golden Label. In deployment each one is an unsupported clinical
claim sent to a Payer under a physician's signature – which is the specific harm the
gate exists to prevent.

The OOD row is a different kind of failure and must not be read as a quality
result. Its point estimate is 1.000 (10/10) but n = 10 cannot produce a lower bound
above 0.90 no matter how many are correct. That row fails for lack of statistical
resolution, not for observed errors. It is reported as a failure because the gate is
defined by its lower bound, so the row remains a failure.

### Grounded citation: passes at 1.00, by construction

All six configurations return exactly 1.000. This holds by construction, not by
observation: `CaseEvaluator` re-locates every span in the input and computes the
offsets itself, dropping any span it cannot find byte-for-byte, and downgrading a
`met` left with no span to `non-determinable` (C2.2, C2.4). The contract suite
enforces this on every commit without invoking a model.

> A real bug was found here and fixed during this run.
> In retrieval mode the evaluator resolved span offsets against the *retrieved
> passage* while labelling them with the whole *document's* id. Every retrieval-mode
> citation therefore pointed at the wrong offsets, and the first scoring pass showed
> grounded-citation 0.000 (0/187) for `retr-golden`. The contract tests only
> covered full context, so C2.2 was never exercised on the retrieval path. The fix
> (`priorauth/case_evaluator.py`, `source_documents`) resolves spans against the
> original documents while the model still sees only the passages. This is the gate
> doing its job: a 100%-or-nothing threshold turned a silent coordinate bug into an
> unmissable zero.



## 2. Hypotheses

All six registered hypotheses are reported, confirmed or not.
Source: `runs/scorecards/_hypotheses.json`, `runs/entailment/sweep.json`.

| | Hypothesis | Result |
|---|---|---|
| H1 | Full context beats retrieval on `met`-recall by > 5pp | **NOT CONFIRMED** |
| H2 | Escalating the lowest-confidence ~15% recovers > 75% of all-LLM catch-rate at < 25% cost | **CONFIRMED** (weakly – see below) |
| H3 | Stage 1 error propagates sub-linearly | **CONFIRMED** |
| H4 | `met`-precision higher on clean/deficient than borderline, by a margin exceeding the CI | **NOT CONFIRMED** |
| H5 | Deterministic routing cuts cost > 15% with no accuracy loss exceeding the CI | **CONFIRMED** |
| H6 | Identical evidence yields different Determinations under Policies of differing strictness | **CONFIRMED** |

### H1 – NOT CONFIRMED (4.46pp, threshold was 5pp)

| Arm | `met`-recall | Wilson 95% | n |
|---|---|---|---|
| Full context (`fc-golden`) | 0.955 | [0.900, 0.981] | 112 |
| Retrieval (`retr-golden`) | 0.911 | [0.843, 0.951] | 112 |

Delta 4.46pp, just under the registered 5pp, and the intervals overlap
substantially. Full context is directionally ahead on every arm, but at this sample
size the corpus cannot distinguish a 4.5pp gap from noise.

EVAL-PLAN §4 registered that failing to confirm would itself be informative. The
retrieval-attribution split (C6.4) says why the gap is small: of 21 `non-determinable`
Determinations under `retr-golden`, the scoring system attributes 15 to genuine
documentation gaps and only 6 to retrieval misses. Retrieval at k=5 is surfacing
most of what matters on charts this short. The recall advantage of full context is
real but bounded, because there is not much for retrieval to miss.

### H2 – CONFIRMED, and the confirmation is weak

204 pairs (72 supported, 132 unsupported), built by construction from the corpus.
Cost proxy is Tier-2 LLM adjudication calls.

| Threshold | Escalated | LLM calls | Catch-rate | Wilson 95% | Recovery | Cost | False-rejection |
|---|---|---|---|---|---|---|---|
| 0.00 (Tier 1 only) | 0.0% | 0 | 0.985 | [0.946, 0.996] | 99.2% | 0% | **0.667** |
| 0.15 | 1.5% | 3 | 0.985 | [0.946, 0.996] | 99.2% | 1.5% | 0.667 |
| 0.30 | 4.9% | 10 | 0.985 | [0.946, 0.996] | 99.2% | 4.9% | 0.639 |
| **0.50** | **13.7%** | **28** | **0.992** | [0.958, 0.999] | **100.0%** | **13.7%** | 0.583 |
| 0.70 | 30.4% | 62 | 1.000 | [0.972, 1.000] | 100.8% | 30.4% | 0.431 |
| *all-LLM baseline* | 100% | 204 | 0.992 | [0.958, 0.999] | – | 100% | **0.097** |

At threshold 0.50 the cascade escalates 13.7% of pairs, recovers 100% of the all-LLM
catch-rate, and spends 13.7% of the cost. H2 is confirmed on its registered terms.

*(This 13.7% is the escalation rate on the 204-pair standalone set. In situ the same
threshold escalates 29.7% of Assertions – a different population, not a different
result. §4.)*

But H2 was registered on the wrong metric. Catch-rate is ~99% at *zero* LLM cost,
so the 75% recovery bar was
close to unfalsifiable on this corpus. What escalation actually buys is a fall in
false rejections of genuine citations, and there the cascade is poor:

| Pair kind | n | Tier 1 (MiniCheck) accuracy | Tier 2 (LLM) accuracy |
|---|---|---|---|
| positive (correct citation) | 72 | **0.333** | 0.903 |
| distractor (planted near-miss) | 20 | 0.950 | 1.000 |
| cross-criterion | 112 | 0.991 | 0.991 |

MiniCheck rejects two-thirds of correct citations. It scores well on catch-rate
mainly because it rejects nearly everything; on this clinical text it is close to a
constant-reject classifier, and the aggregate hides that. A production cascade
running Tier 1 alone would flag most valid citations for human review. This is a
failed configuration and is reported as one (EVAL-PLAN §6.2). §4 measures what that
failure costs once the cascade runs in its designed position.

> Construction note. An earlier build of the pair set paired every span of a
> multi-span `met` Criterion against the full Criterion text and labelled each
> `supported`. That is wrong: a PT start date and a discharge date establish a
> duration *jointly*, and neither does alone. It produced a 77% false-rejection rate
> that was an artifact of the labels, not the checker. The 40 multi-span Criteria are
> now excluded and recorded in `runs/entailment/pairs.json`; only Criteria whose
> Golden Label cites exactly one span become positives.

### H3 – CONFIRMED

| | Determination accuracy | Wilson 95% | n |
|---|---|---|---|
| Golden Criteria Sets | 0.958 | [0.933, 0.973] | 402 |
| Extracted Criteria Sets | 0.930 | [0.901, 0.951] | 402 |

Propagation delta = 0.0274. Stage-1 criteria recall error on the four indexed
Policies is 0.228. The delta is an order of magnitude smaller than the upstream
error, so Stage-1 error propagates strongly sub-linearly – as registered, because many
missed Criteria fall on conditions the chart could not have satisfied anyway.

The id-map consumed downstream carries both `equivalent` and `partial` Judge matches,
while M1.1 precision/recall count `equivalent` only. Dropping partial matches from the id-map
would score a slightly-mis-thresholded extracted Criterion as an *uncovered* Criterion
and inflate this delta by construction. Both counts are in `runs/m1/metrics.json`.

### H4 – NOT CONFIRMED

| Stratum | `met`-precision | Wilson 95% | n |
|---|---|---|---|
| clean | 0.955 | [0.849, 0.987] | 44 |
| deficient | 0.957 | [0.855, 0.988] | 46 |
| borderline | **0.875** | [0.690, 0.957] | 24 |
| clean + deficient pooled | 0.956 | [0.891, 0.983] | 90 |

The direction is exactly as predicted – borderline is 8.1pp worse – but the intervals
overlap heavily, and H4 was registered as requiring "a margin exceeding the CI". By
its own stated standard it is not confirmed.

This is a sample-size result, not evidence the stratification failed: 24 borderline
Determinations returned `met` cannot resolve an 8pp difference. Reading the overlap as
"the corpus is not actually harder" would be over-reading it in the other direction.

### H5 – CONFIRMED

| Arm | Model calls | Calls per Case | Determination accuracy | Wilson 95% |
|---|---|---|---|---|
| Routing on (`fc-golden`) | 307 | 15.35 | 0.958 | [0.933, 0.973] |
| Routing off (`fc-golden-norouting`) | 402 | 20.10 | 0.948 | [0.921, 0.966] |

23.6% fewer model calls, above the 15% bar, with accuracy intervals overlapping –
routing is in fact marginally *more* accurate, since a comparison operator does not
mis-read a BMI. The two arms replay identical generator responses with routing toggled,
so the comparison isolates routing and nothing else.

### H6 – CONFIRMED, with a caveat that matters

The sharpest test that the system reads Policy rather than pattern-matching a rubric.
Both pairs carry documented conservative therapy in the 6–10 week band.

| Pair | Commercial Policy | Returned | Golden | Medicare L39911 | Returned | Golden | Diverged |
|---|---|---|---|---|---|---|---|
| 1 | C004 · AETNA A06 (≥12 weeks, binding) | `unmet` | `unmet` | C017 · K08 ("usually" 3 months, non-binding) | `met` | `non-determinable` | ✅ |
| 2 | C012 · CIGNA G10 (3 months, binding) | `unmet` | `unmet` | C018 · K08 | `met` | `non-determinable` | ✅ |

Both pairs diverge, in the predicted direction. The same evidence is `unmet` under a
hard commercial threshold and not-`unmet` under Medicare's non-binding wording. The
system is reading the policy.

**The caveat:** on the Medicare side it returned `met` where the Golden Label says
`non-determinable`. It read the non-binding "usually" correctly and then over-committed,
treating "the policy does not forbid this" as "the record demonstrates this". H6 tests
divergence and divergence is confirmed; but the divergence lands one step past where
the evidence supports, which is the same over-confidence visible in the abstention
profile below.



## 3. Stage 1 – Criteria Extraction (M1)

Six Policies, adjudicated by a blind Judge that received the extracted and authored
Criteria Sets as anonymous sets A and B, with per-Policy orientation set by a seeded
coin flip (seed 20260815) and criteria shuffled and re-identified. The Judge was
never told which set was which, and the key lives in `runs/m1/keys/`, which no Judge
read. Source: `runs/m1/metrics.json`.

### Indexed Policies (n = 4: AETNA-0660, CIGNA-CMM-311, KPWA-TKA, PREMERA-7.01.550)

| Metric | Value | Wilson 95% | n |
|---|---|---|---|
| M1.1 criteria precision (`equivalent` only) | 0.670 | [0.569, 0.758] | 91 |
| M1.1 criteria recall (`equivalent` only) | 0.772 | [0.668, 0.851] | 79 |
| M1.3 atomicity rate | 0.945 | [0.878, 0.976] | 91 |
| M1.4 `deterministic` precision | 0.800 | [0.609, 0.911] | 25 |
| M1.4 `deterministic` recall | 1.000 | [0.839, 1.000] | 20 |

M1.1 falls well short of the registered ≥ 0.90 expectation. Counting `partial`
matches as well lifts precision to 0.846 (77/91) and recall to 0.975 (77/79) –
so the extractor almost always finds the right *subject matter* and frequently gets the
threshold, qualifier or scope wrong. On a prior-auth criterion that difference is the
whole decision, which is why `partial` is not counted as a match. The gap between
0.975 and 0.772 recall is precisely the population of Criteria the extractor identified
but mis-specified. Per-Policy precision ranges from 0.471 (PREMERA) to 0.839
(Providence).

M1.4's asymmetry behaves as designed and as feared. Recall on `deterministic` is
perfect, but precision is 0.800 – the extractor over-classified 5 Criteria as
deterministic (`A13`, `E01`, `E07`, `D06`, `D07`). EVAL-PLAN §3 registered exactly this
as the dangerous direction: over-classification routes clinical inference to a
comparison operator and threatens the `met`-precision gate, while
under-classification merely wastes money. The failed gate in §1 and this number should
be read together.

### M1.2 – Satisfaction-structure accuracy, reported separately from M1.1

| Measure | Indexed (4) | All (6) |
|---|---|---|
| Exact match, strict | 0/4 | 0/6 |
| Exact match over matched Criteria only | **3/4** | **4/6** |
| Leaf-pair relation agreement | 1.000 [0.995, 1.000], n = 723 | – |

Strict exact match is 0/6 only because every extracted expression carries extra leaves
for Criteria the Judge could not match – an error M1.1 precision already charges. After
pruning those, 4 of 6 Policies reproduce the authored boolean structure exactly
(AETNA, CIGNA, KPWA, L39911), and pairwise leaf relations agree perfectly on the four
indexed Policies. The two failures are PREMERA (2 golden leaves never extracted) and
Providence (genuine structural divergence, 0.897 relation agreement over 435 pairs).

Comparison normalises argument order and AND/OR associativity, neither of which is
semantic. AT_LEAST counts are compared exactly.

### M1.5 – Held-out Policies: an observation at n = 2, never a rate

The held-out pair was fixed by seeded draw *before* any commercial policy was read
(DATA-ACQUISITION §1).

| Policy | Extracted | Golden | Precision | Recall | `deterministic` precision | Structure |
|---|---|---|---|---|---|---|
| L39911 (Medicare) | 14 | 13 | 0.643 | 0.692 | 1.000 (n=5) | reproduced |
| PROVIDENCE-MP418 | 31 | 30 | 0.839 | 0.867 | 0.750 (n=4) | diverged |

n = 2. These are two observations, not a rate, and they disagree with each other by
20 points of precision. Nothing about held-out generalisation can be concluded from
them, and the corpus-independence limitation below applies directly.



## 4. Stages 3–4 – the pre-output gate and the PA Request, in situ

S3 is measured twice: standalone on 204 constructed pairs (H2, §2), and here in its
designed role as the gate that checks every Assertion in a drafted PA Request before it
leaves the system. The standalone result predicted a failure; in situ it has a
measurable blast radius.

### How the gate is wired

`priorauth/pipeline.py` wires S3 into S4: every run output passes through
`EntailmentCascade.check_set` as the pre-output gate before the PA Request is
composed. 100 of 100 in-distribution outputs carry a schema-valid
`pa_request` and `entailment_results` (`runs/outputs/<config>/<case>.json`).
C3.4 fires for real: flagged Assertions remain present and unmodified, each
marked `[UNGROUNDED]`, under a review-required banner naming the count. The
contract suite covers the wiring (`tests/test_s34_pipeline.py`, 127 tests green)
and the CLI replays it end to end (`priorauth evaluate --case C017`).

<pre class="mermaid">
flowchart TD
  a["Assertion with cited spans"] --&gt; t0["Tier 0: span exists"]
  t0 --&gt;|"span found"| t1["Tier 1: MiniCheck"]
  t0 --&gt;|"span missing"| flag["Marked UNGROUNDED"]
  t1 --&gt;|"uncertain"| t2["Tier 2: LLM adjudication"]
  t1 --&gt;|"rejected"| flag
  t2 --&gt;|"unsupported"| flag
  t2 --&gt;|"supported"| ok["Cleared for PA Request"]
</pre>

A design error was caught while wiring the gate, and the first in-situ pass was
discarded. Checking each (Assertion, Source Span) pair in isolation reproduced
the exact artifact §2's construction note documents: a PT start date and a
discharge date establish a duration *jointly*, so per-span checking of multi-span
Criteria failed 612 of 832 pairs. The gate judges each Assertion against its
full cited span set (Tier 0 per span, Tiers 1–2 on the concatenated evidence).
This is the same correction the pair-set construction needed, discovered
independently by wiring the cascade into its designed role.

### In-situ gate results at the H2 operating point (threshold 0.5)

Source: `runs/pa-gate/summary.json`, `assertions.json`, `tier1.json`,
`tier2-verdicts/`.

| Quantity | Value |
|---|---|
| Clinical Assertions gated | 555 (across 100 runs) |
| (Assertion, span) results | 832 |
| Escalated to Tier 2 | 165 of 555 Assertions (29.7%) |
| Tier 2 verdicts | 153 supported, 12 unsupported |
| Tier 1 decided, of which rejected | 390 decided, **314 rejected** |
| – of those rejections, Golden Label says `met` | **280 of 314 (89.2%)** |
| Ungrounded Assertions after the full cascade | **326 of 555 (58.7%)** |
| Runs carrying a review-required banner | **100 of 100** |

The headline is the failure §2 predicted, now at production scale. MiniCheck
rejects two-thirds of correct citations *confidently* (decisiveness ≥ 0.5),
so confidence-based escalation never sees
them. Tier 2 confirms the rejections are wrong: it upholds 92.7% of the
uncertain tail it does receive. The cascade as configured flags every single PA
Request for human review, which is operationally equivalent to having no gate.
This confirms the §2 failed-configuration finding in situ, and it now has a
measurable blast radius: 58.7% of emitted Assertions, of which 87.7% (286/326)
cite evidence the Golden Label considers sufficient.

A defensible production configuration follows directly: MiniCheck's confident
rejections cannot be trusted on this text, so Tier 1 should abstain on rejection
(or be replaced) and Tier 2 should see everything Tier 1 rejects. That change is
recorded here as a recommendation; the measured configuration is the registered
one.

### M4.1 – PA Request quality (S8, rubric in `runs/m4/m41-rubric.md`)

n = 100 PA Requests, scored by fresh Judge instances (blind, C8.1/C8.2), four
dimensions plus overall, 1–5. Source: `runs/m4/m41.json`.

| Dimension | Mean | Distribution (1/2/3/4/5) |
|---|---|---|
| Completeness | 5.00 | 0/0/0/0/100 |
| Evidence use | **2.56** | 2/51/36/11/0 |
| Gap guidance | 4.21 | 1/8/11/29/51 |
| Professional form | 4.96 | 0/0/0/4/96 |
| Overall | 3.26 | 0/6/63/30/1 |

The Judges' notes converge on one cause: the `[UNGROUNDED]` flags. Structure,
completeness, and tone are at ceiling (the builder is template-composed, so C4.1–
C4.4 hold by construction); evidence usability is dragged to 2.56 almost entirely
by the gate's false rejections. M4.1 and the in-situ gate result are the same
finding seen from two sides.

### M4.2 – Resolution-guidance quality

Of the 47 `non-determinable` Determinations carrying a resolution hint, the Judge
finds 42 (89.4% [0.774, 0.954]) name documentation that would resolve the
Criterion, 5 partial, 0 wrong. Source: `runs/m4/m42.json`. The five partials name
evidence that settles one arm of a disjunctive Criterion or one component of a
compound one – the M1.3 atomicity gap surfacing downstream.


## 5. Out-of-distribution slice (M7.1, C6.5)

Five real MTSamples orthopedic notes, deduplicated by transcription hash, scored
against AETNA-0660's golden Criteria Set. In-distribution and OOD are never pooled.
Note text is not in this repository; `runs/ood/manifest.json` records row indices,
lengths and SHA-256 digests so a re-fetch can be verified.

### Inter-labeler agreement (M7.1)

Cohen's κ = 0.982, raw agreement 0.990 over 100 Determinations; 1 conflict in
100. Four of five notes were labelled `dual_labeled_agreed`; C102 is `adjudicated`.

This κ should not be read as a quality signal – it is the limitation showing up as a
number. C7.1 requires Labelers from different model families. Only one family was
available, so the two Labelers are independent *instances*: separate contexts, neither
given the other's output or any reference answer. Correlated same-family errors cannot
surface as disagreement, so κ = 0.982 is an optimistic estimate. For scale, two
*physicians* on HealthBench agree at κ ≈ 0.38 (§6). A κ of 0.98 between two labelers on
terse dictated notes is far more likely to indicate shared blind spots than shared
correctness. `runs/ood/labeling.json` records `c7_1_different_families: false`.

The single conflict (C102 · A01) turned on whether an unremarkable functional exam
licenses `unmet`. It was adjudicated to `non-determinable`: preserved gait and range of
motion on one exam do not exclude pain interfering with ADLs, and the note never
addresses ADLs. Reading a silent record as affirmative absence is the failure mode
`non-determinable` exists to prevent. Rationale: `runs/ood/adjudications.json`.

### OOD accuracy, scored separately

| Metric | Value | Wilson 95% | n |
|---|---|---|---|
| `met`-precision | 1.000 | [0.722, 1.000] | 10 |
| Grounded citation | 1.000 | [0.972, 1.000] | 131 |
| Determination accuracy | **0.820** | [0.733, 0.883] | 100 |
| `met`-recall | 0.909 | [0.623, 0.984] | 11 |
| Abstention rate | 0.160 | [0.101, 0.244] | 100 |
| – of which correct | **0.875** | [0.640, 0.965] | 16 |

The divergence is the headline finding, as EVAL-PLAN §5 required. Determination
accuracy drops from 0.958 in-distribution to 0.820 on real notes – a 13.8pp fall,
with non-overlapping intervals ([0.933, 0.973] vs [0.733, 0.883]). Whatever the
synthetic corpus measures, it measures it about 14 points too generously.

The abstention profile inverts in the opposite direction. On real notes the agent
abstains 16% of the time and is right to
abstain 87.5% of those times. In-distribution it abstains 1.2% of the time and is
right 0 out of 5. That contrast is a corpus artifact, not a behaviour change: only
2 of 402 in-distribution golden Determinations are `non-determinable`, so
in-distribution there is almost nothing to abstain correctly *about* and M2.7 is
effectively unmeasurable there. Real notes are ambiguous in ways the Seed Spec pipeline
does not generate, and the agent handles that ambiguity well. The synthetic corpus
under-represents genuine non-determinability, and that is its largest single gap.



## 6. Judge calibration (M8.1, M8.2) – never reported without its ceiling

n = 200 triples sampled with seed 20260816 from HealthBench's OSS meta-eval
(29,511 triples, 60,896 physician judgements, 186 physicians), yielding 412
judge-versus-physician comparisons. Ceiling and chance were recomputed from the file by
this run, not quoted. Source: `runs/m8/m81.json`.

```
judge vs. physician      : 75.0%   [70.6%, 78.9%]   (n = 412)
physician vs. physician  : 78.1%                    (n = 33,435)   <- ceiling
chance                   : 63.5%
```

Within the 200-triple sample the physician-physician ceiling is 76.8% (n = 224),
and file-wide physician κ is 0.381 against the Judge's 0.315.

The Judge is at the human ceiling, not below it. A 3.1-point gap to a ceiling of
78.1% is within the range where two physicians disagree with each other one time in
five. On the 153 triples where both physicians agreed – the only subset with an
unambiguous reference answer – the Judge agrees 82.4% [75.5%, 87.6%]. The remaining
47 triples have no single right answer to agree with.

MedHELM's published 92.8–94.7% is not presented as a target here. It exceeds the
human-human ceiling measured directly from this file, so it cannot be agreement with
individual physicians; it is presumably measured against adjudicated or consensus
labels. Treating it as a like-for-like goal would mean asking the Judge to beat the
physicians it is being compared to (EVAL-PLAN §3).


### M8.2 – PA-specific Judge agreement (measured against model-generated labels)

Reported separately from M8.1 as registered. The labels here are
model-generated (seeded by construction, ADR-0002); no clinician validation is
claimed. Source: `runs/m8/m82.json`.

| Slice | Agreement | Wilson 95% | n |
|---|---|---|---|
| Standalone pair set | 0.961 | [0.925, 0.980] | 204 |
| – positive | 0.903 | [0.813, 0.952] | 72 |
| – distractor | 1.000 | [0.839, 1.000] | 20 |
| – cross-criterion | 0.991 | [0.951, 0.998] | 112 |
| In-situ gate (escalated tail) | 0.964 | [0.923, 0.983] | 165 |

97 verdicts in `runs/entailment/tier2-verdicts/` reference the superseded pre-fix
pair build and are excluded from the standalone slice.


## 7. Benchmark validity (M5.1)

Corpus-wide maximum n-gram overlap between a Criterion statement and its supporting
Source Span: 4 (`corpus/cases/*/admission.json`). Threshold for admission was
enforced per Case, with regeneration on failure (C5.2).

No Criterion in this corpus is satisfiable by lexical match alone. A four-token
overlap is the length of an unavoidable clinical noun phrase ("right knee joint
narrowing"), not a restatement. Combined with C5.5 – durations are never stated and are
recoverable only from dated events across separate documents – a system cannot score
here by string matching.



## 8. Pipeline coverage – what this run does not cover

Stated plainly, because a reader could otherwise finish §1–§7 believing every claim was
measured on every slice; it was not.

### The out-of-distribution slice stops at S2

The five real MTSamples notes were scored for Determinations and Source Spans only. No
PA Request was composed for them and the pre-output gate did not run on them, because
their text may not be committed to this repository (`corpus/ood-notes/README.md`) and
the enriched outputs live only in the scratchpad. Every in-situ number in §4 –
the 555 gated Assertions, the 100-of-100 banner rate, M4.1, M4.2 – describes the 100
committed in-distribution outputs and nothing else. The one measurement that most
needs a real-note answer, whether the gate behaves differently on dictated text, is the
one this run cannot give.

### There is no live model client

There is no model client anywhere in `priorauth/` or `evals/` – no `anthropic`,
`openai`, or HTTP call of any kind. Every model call in this project was made by a
subagent writing a JSON file to disk, which the runners replay through the real seams
via `RecordedModel`.

This means the guards are genuine – span resolution, coercion, the `met` downgrade,
deterministic routing and the pre-output gate all execute on every replayed
Determination – but the model boundary is a file drop, not an API. What this repository
supports is eight implemented seams, 127 contract tests, a scoring system that
measured all four stages, and a CLI that replays the full pipeline offline (§10). The
model boundary is a recorded file rather than a live API, so the evidence supports an
offline measured prototype. CONTEXT.md defines the scoring system as the primary deliverable.

### M8.2 has no clinician-validated reference

M8.2 (§6) is measured against model-generated labels, seeded by construction
(ADR-0002). It says the Judge agrees with the labeling pipeline; it does not say either
one is clinically correct. M8.1 remains the only physician-grounded measurement in the
project.


## 9. Limitations

Published here, not surfaced only under questioning.

- The registered cascade configuration is undeployable as measured. In situ the
  gate flags 100 of 100 requests and 89.2% of Tier-1 rejections cite evidence the
  Golden Label calls `met`. A gate that fires on everything is operationally the same
  as no gate (§4).
- The out-of-distribution slice stops at S2. No PA Request was composed and the
  gate did not run on the five real notes, so every in-situ number in §4 describes the
  in-distribution corpus only.
- There is no live model client. Model calls were subagent file drops replayed
  through the real seams via `RecordedModel`. The guards execute on every replay, but
  the model boundary is a file, not an API. Full detail in §8.
- Single model family. The generator, both Labelers, the M1 adjudication Judge, the
  M8.1 Judge and entailment Tier 2 all come from one model family. Isolation is
  instance-level only: separate contexts, no shared state, and no instance received
  a Golden Label, Seed Spec or another instance's output. It is *not* family-level
  independence. C7.1 and the EVAL-PLAN §5 commitment to different-family Labelers are
  not satisfied, and κ = 0.982 is the visible consequence. C3.2 and C8.2 (checker
  and Judge are not the drafter) hold at instance level.
- No label in this project is clinician-validated. Synthetic labels are true by
  construction from Seed Specs (ADR-0002); the five real-note labels are model labels
  with author adjudication. The only physician-grounded measurement in the project is
  M8.1.
- Held-out Policy rests on n = 2, and the two observations disagree by 20 points of
  precision.
- The Policy corpus is not fully independent. KPWA-TKA and PREMERA-7.01.550 share an
  identical `"Hemophilic arthroplasty"` typo and list the same four alternative
  diagnoses in the same order, indicating a common upstream source. Held-out-Policy
  generalisation is measured against policies not guaranteed independent of the indexed
  ones.
- One Policy is future-dated. KPWA-TKA takes effect 2026-10-01, after the
  2026-08-15 corpus freeze. It is published and current but not yet operative.
- Synthea gaps. Synthea's osteoarthritis module models no imaging and no
  corticosteroid injections, so those Criteria are supplied by the Seed Spec rather
  than the patient generator.
- The synthetic corpus under-represents `non-determinable` – 2 of 402
  Determinations – so the abstention profile (M2.7) is only meaningfully measurable on
  the OOD slice.
- Public Policies substitute for InterQual and MCG. Verified during corpus assembly:
  UnitedHealthcare's published commercial knee policy contains zero medical-necessity
  criteria and defers wholly to InterQual, which is why UHC could not be included.
- Single service line. Knee arthroplasty only. No claim of generalisation beyond it.
- Entailment pairs are constructed, not annotated. Negatives are planted distractors
  and cross-criterion spans from the same Case; a cross-criterion span could in
  principle happen to support its target, which would understate the false-rejection
  rate. Spans shared between the two Criteria are excluded to limit this.
- Cost is a proxy. H2 counts Tier-2 calls and H5 counts model calls. Neither is
  priced, and neither includes token volume or latency.
- External anchor. CHI-Bench reports best-agent performance of 28.0% on
  policy-dense healthcare workflows, dropping to 3.8% in single-session execution. The
  slice measured here is far narrower and the numbers are not directly comparable; it
  is cited to situate the difficulty of the general problem.



## 10. Running it

### The entrypoint

`pyproject.toml` declares `priorauth` as a console script; `priorauth/__main__.py`
implements three commands:

- `priorauth list` – the 20 Cases and 5 configurations;
- `priorauth evaluate --case C017 --config fc-golden [--json]` – replays the
  recorded generator responses through `CaseEvaluator`, runs the pre-output gate
  (Tier 0 live, Tier 1/2 from the pa-gate cache), composes the PA Request, and
  validates the output against the run-output schema, all offline;
- `priorauth serve [--port N]` – serves the web prototype from `web/`.

The model boundary is still a recorded response rather than a live API client;
what changed is that the full pipeline – evaluation, gate, composition – is now
invocable as one command and the guards execute on every invocation.

### Web prototype

`web/` holds a static prototype (`evals/build_web_data.py` → `web/data.json`)
implementing the intended flow: pick a patient profile (20 synthetic personas),
confirm the governing Payer Policy and the service (knee arthroplasty), and
inspect the generated PA Request – per-Criterion Determinations with verbatim
Source Spans, each span's gate verdict and deciding tier, the satisfaction
rollup, gaps with resolution guidance, and the review-required banner when the
gate flags Assertions. It fronts the recorded `fc-golden` runs; the five
MTSamples OOD notes are excluded by construction, since their text may not be
committed (`corpus/ood-notes/README.md`).


## 11. Changelog – what this run changed in the product

This run was measured in two passes on 2026-08-16. The first covered S1 and S2; the
second wired S3 into S4 and measured the gate in situ, M4.1, M4.2 and M8.2. The
scorecards in §1–§2 are unchanged across both passes: enrichment adds fields, and
re-running `evals/score_runs.py` on the enriched outputs reproduces the committed
scorecards byte-for-byte.

Four defects were found and fixed: three that bear on the launch decision, plus one
limited to the scorer. None was found by reading output. Each surfaced as
arithmetic that failed to reconcile.

1. Retrieval-mode span offsets (product). The grounded-citation gate read
   0.000 (0/187) on `retr-golden` because spans were numbered from the retrieved
   passage but labelled with the document's id. Full account in §1 – it is the clearest
   case in the project of a 100%-or-nothing gate turning a silent bug into an
   unmissable zero.
2. `check_used` under routing-off (product). With deterministic routing disabled, a
   Criterion classified `deterministic` was still recorded as
   `check_used: deterministic` while the model was invoked, violating the run-output
   schema's C2.5 clause. `check_used` now names the check actually performed.
3. Scorer document-id collision. `priorauth/scorer.py` resolved Source
   Spans against a flat `document_id` map, but document ids (`PT note`, `radiology
   report`) repeat across Cases with different text. The scorer now prefers a
   `(case_id, document_id)` key and falls back to the bare id.
4. Multi-span Criteria checked one span at a time (design, §4). Checking each
   (Assertion, Source Span) pair in isolation failed 612 of 832 pairs. A PT start
   date and a discharge date establish a duration *jointly*, and neither does alone.
   The first in-situ pass was discarded and the gate now judges each Assertion against
   its full cited span set. This is the same correction the standalone pair set needed
   (§2's construction note), discovered independently by wiring the cascade into its
   designed role – which is the strongest evidence in this project that a component
   measured in isolation is not the same component measured in its real position.

Contract suite. 121 tests at the end of the first pass, 127 after the S3+S4
wiring added `tests/test_s34_pipeline.py`. Green throughout
(`.venv/bin/python -m pytest tests/`).
