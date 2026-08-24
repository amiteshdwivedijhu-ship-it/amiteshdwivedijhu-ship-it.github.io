---
title: "Eval report"
project: "nda-triage"
source: "NDA Risk Extractor /docs/eval-report.md"
---
# Eval Report – NDA Triage

Deliverable 1 (PLAN.md). Every number below is traceable to a file under
`runs/` or `data/gold/`, cited inline. No LLM-as-judge anywhere (ADR-0001).
The ContractNLI test split (123 docs) was never touched – every measurement is
on the dev split (61 docs), which is why phase E still has something to settle.
Total inference spend: $21.83 of a $50 ceiling (`runs/cost-ledger.jsonl`).

## 1. Headline: absence detection on real NDAs

The product lives or dies on whether the Absence Detector can prove that an
expected Clause Type or Carve-out is *missing* from a real NDA. Gold is
ContractNLI's native, expert-annotated `NotMentioned` label – in-domain, no
hand-labelling (`docs/mapping-table.md`).

Shipped configuration (Gemini 3.7 Flash, Search Budget 5, prompt v5), 40-doc
stratified dev slice: absence precision 0.983, absence recall 0.792 (57/72),
1 false absence
(`runs/phase-d/sweep.json`, level 5).

The error asymmetry is the point, and the eval is built around it
(ProblemStatement.md). The two ways to be wrong about absence:

- **Missed absence (false negative, hits recall):** a genuinely missing
  Carve-out goes undetected. This is the catastrophic direction – it is the
  failure that lets a document sail toward auto-approval looking clean, and the
  user will not notice until it matters. The eval therefore weights recall
  above precision, and the kill criteria (`PLAN.md`) are all false-negative
  statements.
- **False absence (false positive, hits precision):** declaring absent
  something that is present. Merely annoying – it flags a clean NDA for a human
  who clears it in seconds. Precision stays ≥0.979 at every budget
  (`runs/phase-d/sweep.json`).

Two qualifiers on the headline. First, budget-exhausted runs are
excluded from the denominator – their verdicts are incomplete, not wrong – so
the gold-absent denominator grows with coverage (60 → 72 → 73 across budgets
3/5/8; `runs/phase-d/SWEEP-NOTES.md`). Second, the phase-B development
measurement (10 docs, Haiku 4.5, budget 3) was stronger – precision 1.000,
recall 0.824 (14/17), zero false absence (`runs/phase-b/anthropic__claude-haiku-4.5/v5.json`)
– but ten documents is an iteration signal, not a headline; the 40-doc slice
number is the one to quote.

The extraction prompt arc that precedes it, for the record: macro F1 on dev-15
climbed 0.647 → 0.680 → 0.747 → 0.931 → 0.981 across prompt versions v1–v5,
with Span verification failures driven from 38/143 returned to 0 by v3's
verification-and-repair loop (`runs/phase-a/anthropic__claude-haiku-4.5/v1.json`
… `v5.json`).

## 2. The kill-criterion finding, stated plainly

No tested model tier clears the unacceptable-tier false-negative bar, so per
PLAN.md the product is not shippable at any autonomy setting at these price
points.

The kill criterion: any false negative on an unacceptable-tier Clause Type
(Non-Compete/Non-Solicit rider, IP Assignment) → not shippable. Splice Fixtures
test it directly – real NDA bodies with a CUAD rider or IP-assignment clause of
known type spliced in, ground truth by construction, 24 spliced fixtures plus 6
controls (`runs/phase-f/report.json`, `runs/phase-f/report-midprice.json`):

| Model | Splice hits (of 24) | Kill-criterion misses | Control false positives |
|---|---|---|---|
| Gemini 3.7 Flash | 17 | **7** | 0 |
| Haiku 4.5 | 15 | **9** | 1 |
| Sonnet 5 | 21 | **3** | 0 |

The misses are not edge-case weather: extraction does not find
non-compete riders and IP assignments that are present in the document
(`type_level_fn` dominates; one `wrong_span` each for Haiku and Sonnet). The
Planted Evidence Probes are worse for the agent: 0/10 passed at Search
Budget 5 – in 6 of 10 the agent reported the planted clause *found* without
making the tool call that could reach it (right answer, no search – exactly the
failure mode the probes exist to decide); in the other 4 it never found it
(`runs/phase-f/report.json`, `probes.per_probe`). Zero fabricated Spans on the
probes, and zero control false positives on the primary model, so the failure
is recall and search discipline, not hallucination.

The one countervailing signal is Opus 5, which was clean on what it touched – absence
precision 1.000, recall 0.880, zero false absence, zero fabricated Spans – but
on a 15/40-document partial sweep stopped by the spend cap, and it is priced
out of the final run at ~$52 with the OpenRouter fee
(`runs/phase-c/summary.json`, `composite`; `BUDGET.md`). PLAN.md pre-commits to
exactly this report: if the only model clearing the bar is the one we cannot
afford, the finding is "not shippable at this cost target."

## 3. The model mix, and its defence

The bake-off ran five models across three providers on both scored stages
(extraction: 61 dev docs; absence: 40-doc slice, budget 3)
(`runs/phase-c/summary.json`). Two gaps, on the record: GPT-5.6 Sol Pro's
extraction batch stalled provider-side 3h+ and was forfeited at the spend cap
(the report holds only a 1-doc smoke that failed to parse), and Opus 5's
absence sweep stopped at 15/40 docs. Their numbers are partial and say so.

Extraction macro F1 (scored Clause Types): Flash 0.866, Haiku 0.872, Sonnet
0.891 – a 4-point spread for a 3x price spread, all batchable. Absence recall:
Flash 0.783, Haiku 0.783, Sonnet 0.789, GPT-5.6 0.784 – statistically
indistinguishable at budget 3, at prices from $0.0087 to $0.1225 per doc.
Process discipline is where the models separate: INV-2
(resolve-defined-term) compliance is 0.15 for Flash, 0.125 Haiku, 0.425 Sonnet,
0.65 GPT-5.6 (`runs/phase-c/summary.json`, `absence.*.invariant_pass_rates`).

If the kill criterion *were* met, the mix the evidence supports:

- **Extraction: Sonnet 5 (batched).** Best macro F1 (0.891), best fixture
  recall (21/24), 2 repaired spans in 606 returned, $0.0225/doc. Flash is the
  cost play but carries the worst splice hit rate (17/24).
- **Absence Detector: Gemini 3.7 Flash at Search Budget 5.** The sweep's core
  answer is that at $0.0096/doc Flash reaches recall within noise of models costing
  4–14x more, and 95% EXHAUSTIVE termination (`runs/phase-d/sweep.json`). What
  money cannot fix at any budget is Flash's INV-2 discipline (§4). Sonnet is
  the fallback if a human-in-the-loop rollout shows missed defined-term
  resolution biting in practice.
- **Shadow Judge: Opus 5, batched.** This stage is not scored against gold –
  it is a product surface, not a prediction – so the spend buys the strongest
  reading comprehension at batch prices, $0.0535/doc
  (`runs/phase-g/report.json`: $3.2618 / 61 docs).

Mutuality, the one self-labelled Clause Type: binary accuracy against the dev
gold is Flash 1.000, Sonnet 1.000, Haiku 0.902; exact-direction Sonnet 0.967
(`runs/phase-g/mutuality-scores.json`). Flash's 61/61 is partially circular –
the annotator judged Flash's own chosen Spans – documented in
`docs/mutuality-gold.md` and again in §7.

What phase E would settle. Everything above is dev-split evidence. The
untouched test split (123 docs), scored exactly once with the chosen mix, would
answer: does the absence recall hold out-of-iteration, does the kill criterion
also fail on *natural* unacceptable-tier clauses, and is
the Opus trend real at full coverage. Until the kill criterion clears on dev,
phase E is not worth its ~$8.65 (§6) – the state of the project is that
the routing layer is ready and the perception layer is not.

## 4. Search Budget: the dial, swept

![Search Budget tradeoff](/assets/nda-triage/search-budget-tradeoff.png)

Swept on Gemini 3.7 Flash, not on whichever model wins – the dial's *shape* is
what is being characterised (PLAN.md). Budgets 3/5/8 over the same 40-doc slice
(`runs/phase-d/sweep.json`, `runs/phase-d/SWEEP-NOTES.md`):

| Metric | budget 3 | budget 5 | budget 8 |
|---|---|---|---|
| absence recall | 0.783 (47/60) | 0.792 (57/72) | 0.808 (59/73) |
| absence precision | 0.979 | 0.983 | 0.983 |
| false-absence count | 1 | 1 | 1 |
| BUDGET_EXHAUSTED runs | 11/40 | 2/40 | 1/40 |
| INV-2 compliance | 0.15 | 0.225 | 0.175 |
| fabricated Spans | 1 | 1 | 1 |
| cost per doc | $0.0087 | $0.0096 | $0.0125 |
| p95 latency per doc | 15.9 s | 20.3 s | 36.4 s |

Recall is nearly flat; completeness is what the dial buys. The residual
misses are judgment, not depth – `term_survival` and `legally_compelled` miss
identically at every level (`runs/phase-d/SWEEP-NOTES.md`). The knee is in the
autonomy curve: BUDGET_EXHAUSTED blocks auto-approval, so budget 3 makes 11/40
documents autonomy-ineligible on completeness grounds alone; budget 5 cuts that
to 2/40 for +10% cost, while budget 8 buys one more EXHAUSTIVE document for
+30% cost and +80% p95. Decision: Search Budget 5.

INV-2 hypothesis: refuted. Phase B found resolve-defined-term compliance
near-unsatisfiable at budget 3 (0.10 on Haiku). More budget does not buy
compliance: 0.15 → 0.225 → 0.175, flat within noise – Flash sees defined terms
in tool results and declines to resolve them regardless of steps remaining.
Compliance is buyable with model choice (GPT-5.6 0.65, Sonnet 0.425 at budget
3), not with steps (`runs/phase-d/SWEEP-NOTES.md`). Fabrication is likewise
budget-invariant: exactly one fabricated Span at every level, the same
near-verbatim mis-quote on doc 406, caught by Span verification each time.

## 5. Auto-approve rate per Deal Context cell

Computed by Factorial Replay over the cached pipeline stages – extraction once,
then the deterministic Playbook replayed over all 144 Deal Context cells at $0
(`scripts/auto_approve_rate.py`; output `runs/report/auto-approve-rate.json`).
Autonomy-eligible cells: 81/144 – anything with data_class SOURCE_CODE or
counterparty_type COMPETITOR is declared ineligible in advance, however clean
the document reads (`docs/playbook.md`).

<pre class="mermaid">
flowchart LR
  cache["Cached pipeline stages"] --&gt; replay["Factorial Replay"]
  cells["Deal Context cells"] --&gt; replay
  replay --&gt; pb["Playbook Rules"]
  pb --&gt; gate["Shadow Judge gate"]
  gate --&gt; rate["Auto-approve rate"]
</pre>

The Shadow Judge gate dominates everything. The judge (Opus 5, batched) is
non-silent on 61/61 dev docs – mean 14.1 Unmodeled Risks per document, 862
total, one fabricated Span (doc 488) (`runs/phase-g/report.json`). Since a
non-silent judge blocks auto-approval, the auto-approve rate under full
pipeline rules is 0 – measured, not assumed: 0/3,240 eligible cell-document
pairs on the 40-doc slice and 0/4,941 on the 61-doc sensitivity variant
(`runs/report/auto-approve-rate.json`, variants `judge_gate_active_40doc`,
`sensitivity_61doc_fill_judge_gate_active`). As prompted, the judge vetoes all
autonomy; a v2 prompt that separates signal from fourteen-per-doc verbosity is
future work (§7).

Removing the judge gate isolates the Playbook + Absence Detector contribution –
the primary variant (40-doc slice, budget-5 absence, gate removed):

- 27 of 3,240 eligible cell-document pairs auto-approve: 0.83%. Exactly one
  document of 40 (doc 610 – a mutual, 18-month-Term, four-Carve-out,
  Delaware-law NDA) auto-approves, and only in the 9 DISCLOSER cells (27 pairs
  = 9 cells × 3 bargaining-power levels).
- The Playbook itself is the gate, not the agent: of the 3,240 pairs, 3,186
  (98.3%) are blocked by a non-acceptable Tier, 27 by the Termination State,
  and zero have Absence Findings or stage integrity as the sole blocker
  (`runs/report/auto-approve-rate.json`, `blocker_decomposition`).
- **Bargaining-power invariance:** the AUTO_APPROVE pattern within every
  (our_role, data_class, counterparty_type) triple is
  identical across the three bargaining-power cells – 0 invariance breaks across all
  variants. Tiers never move with bargaining power; only routing and the plan do
  (`docs/playbook.md`, verified in `runs/report/auto-approve-rate.json`).
- Search Budget changes which documents qualify. The budget-3 variant also
  yields 27 pairs, but on a *different document* (547 instead of 610): 610 was
  budget-exhausted at budget 3, and 547 budget-exhausted at budget 5. The
  dial's autonomy effect is which documents are eligible at all, consistent
  with §4.

| Cell (excluding bargaining power; DISCLOSER only) | auto-approve rate |
|---|---|
| discloser / general_business / customer, partner, vendor | 1/40 each |
| discloser / technical / customer, partner, vendor | 1/40 each |
| discloser / customer_data / customer, partner, vendor | 1/40 each |
| all other 18 eligible cells (recipient, mutual) | 0/40 |

Sensitivity variant, clearly labelled: extending to all 61 dev docs with the 21
un-searched documents treated as EXHAUSTIVE-with-no-findings yields 27/4,941
(0.55%) – the filled-in documents add zero auto-approvals, so the rate only
dilutes. Those documents were never actually searched; treat this variant as an
upper-bound sanity check, not a measurement. And the whole table sits on Flash
extractions, which fail the kill criterion (§2) – these rates describe the
routing layer's behavior, not a shipping autonomy claim.

## 6. Cost

Per-phase ledger breakdown, summed from the `phase` tags in
`runs/cost-ledger.jsonl` (ledger-estimated, including the `:batch` 50%
discount):

| Phase | Contents | Spend |
|---|---|---|
| A – extraction test development | `phase-a-extract` (incl. free-model plumbing) | $0.8385 |
| B – absence agent dev | `phase-b-absence` + `phase-b-cachecheck` | $2.0965 |
| C – five-model bake-off | `bakeoff-extract` + `bakeoff-absence` + `bakeoff-probe` | $12.5541 |
| D – Search Budget sweep | `sweep-budget-5` + `sweep-budget-8` (+ `sweep-plumbing`, $0) | $0.8850 |
| F – fixtures, probes, spot-check | `fixtures-extract*` (Flash/Haiku/Sonnet) + `fixtures-probes` + `pipeline-*` | $1.3893 |
| G – Shadow Judge + mutuality | `shadow-judge` + `dev-shadow` | $3.2634 |
| Reconciliation | `reconcile-openrouter` (billed vs. estimated drift, all phases) | $0.8061 |
| Smoke | free models | $0.0000 |
| **Total** | | **$21.8329 of $50.00 (43.7%)** |

Cost per document per stage, measured: extraction Flash $0.0072 (ran sync –
Gemini's batch endpoint fails provider-side with `response_format` set; the
lost 50% discount on the cheapest model is ~$0.10, `runs/phase-c/summary.json`);
absence Flash at budget 5 $0.0096 (`runs/phase-d/sweep.json`); Shadow Judge
Opus 5 batched $0.0535 (`runs/phase-g/report.json`). **Phase E projection:**
123 test docs × ($0.0072 + $0.0096 + $0.0535) ≈ $8.65, inside the planned
$6.30–$14.30 (`BUDGET.md`), leaving the project at ~$30.48 if run. Headroom is
$28.17 – the ceiling was never the binding constraint; the kill criterion is.

## 7. Limitations, on the record

- The Mapping Table is lossy. 7 of ContractNLI's 17 hypotheses do not map
  and are discarded on the record; `publicly_known` has no hypothesis at all,
  so recall for that Carve-out cannot be measured from ContractNLI; three
  documented cases (customer non-solicits vs. nda-18, bare durations vs.
  nda-16/19/20, compelled disclosure without a notice duty vs. nda-8) score
  correct behavior as errors (`docs/mapping-table.md`).
- Mutuality gold is self-labelled and agent-assisted – single annotator, no
  inter-annotator agreement, and the annotator read Spans selected by Flash, so
  Flash's 1.000 binary accuracy is partially circular. Sonnet (0.967 exact) and
  Haiku (0.902) are unaffected (`docs/mutuality-gold.md`).
- Bake-off gaps. GPT-5.6 Sol Pro extraction: forfeited batch, 1-doc smoke
  only, macro F1 null. Opus 5 extraction: 1 doc. Opus 5 absence: 15/40 docs.
  The composite's `clears_bars_on_partial_coverage` flag for Opus is a trend,
  not a result (`runs/phase-c/summary.json`, `gaps_and_deviations`).
- Shadow-Judge verbosity. 14.1 Unmodeled Risks per doc is a firehose, not a
  filter; with the judge non-silent on 61/61 docs the autonomy gate is
  dead-on-arrival as prompted. A v2 prompt (severity threshold, dedup against
  Playbook-covered clauses) is future work – the current prompt is a recall
  instrument, and it priced itself at 2.4x the planning figure
  (`runs/phase-g/report.json`, `coverage_note`).
- Absence recall denominators exclude budget-exhausted runs (11/40 at
  budget 3, 2/40 at 5, 1/40 at 8). Their verdicts are incomplete, not wrong –
  but the headline recall is therefore conditioned on the agent finishing, and
  the denominator grows across levels (60 → 72 → 73)
  (`runs/phase-d/SWEEP-NOTES.md`).
- Splice Fixtures are constructed, not natural. CUAD clauses come from
  non-NDA contracts; splicing gives ground truth by construction at the cost of
  naturalness, and the fixtures test insertion resilience rather than
  frequency. The test split is where natural unacceptable-tier clauses would be
  scored – once, at the end (PLAN.md).

## Reproduce

```
uv run python scripts/auto_approve_rate.py   # $0 – cache reads + deterministic replay
```

All other artifacts were produced by their phase scripts under `scripts/`;
this report adds no paid inference.
