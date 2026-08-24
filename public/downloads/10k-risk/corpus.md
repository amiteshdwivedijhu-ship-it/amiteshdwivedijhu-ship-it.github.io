# Corpus Proposal

**Fiscal year pair:** FY2024 → FY2025 (filed early 2025 and early 2026 respectively).

Chosen over FY2023→FY2024 because it is the most recent complete pair, so the prototype
reads as current, and because trade-policy and AI-disclosure churn through 2025 gives a
strong material-change signal to detect. FY2023 remains available as a third year for any
issuer where a longer view is useful.

---

## Control roles are screened, not asserted

Control assignment must not be a guess. Before the corpus is locked, run a deterministic
lexical screen over every candidate:

1. Extract Item 1A for FY2024 and FY2025 (the Q7 parser, with its assertions).
2. Normalize: lowercase, collapse whitespace, strip punctuation.
3. Compute 5-gram shingle Jaccard similarity between the two years.

Then assign roles from the observed distribution, not from a fixed threshold:

- **Negative controls** — the 2 highest-overlap issuers. Expected pipeline output: near-zero
  new Risk Claims. This is the false-positive test and the single most important result in
  the eval.
- **Positive controls** — the 3 lowest-overlap issuers. Before running the pipeline, read
  the diff by hand and write down what actually changed. That written expectation is the
  independent ground truth the pipeline is checked against.
- **Remainder** — fill out sector, format, and fiscal-calendar diversity.

No LLM is involved. The screen is reproducible, costs nothing, and makes corpus
construction defensible rather than cherry-picked.

---

## Screen results (run 2026-08-16)

All 20 filings extracted cleanly — 6/6 boundary assertions passing on every one.

| Ticker | Jaccard | Retained | FY2024 words | FY2025 words | Role |
|---|---:|---:|---:|---:|---|
| PLD | 0.933 | 0.973 | 8,003 | 8,117 | **negative control** |
| ED | 0.849 | 0.957 | 3,312 | 3,588 | **negative control** |
| RSG | 0.845 | 0.910 | 8,913 | 8,780 | remainder |
| CRWD | 0.844 | 0.939 | 24,991 | 26,530 | remainder |
| PG | 0.821 | 0.894 | 5,547 | 5,479 | remainder |
| FSLR | 0.796 | 0.919 | 16,857 | 18,271 | remainder |
| MRNA | 0.698 | 0.828 | 27,665 | 28,082 | remainder |
| NVDA | 0.686 | 0.828 | 15,976 | 16,494 | **positive control** |
| BA | 0.680 | 0.803 | 8,460 | 8,278 | **positive control** |
| JPM | 0.306 | 0.428 | 18,880 | 15,467 | **positive control** |

### The screen overruled the hypotheses, which is why it exists

The predicted recyclers were PG and RSG. Neither made the top two. **PLD** — slated purely
as a taxonomy stress test — turned out to be the most recycled issuer in the corpus at
0.933, and **ED** took the second slot. Meanwhile MRNA, FSLR and CRWD, all predicted as
high-churn, landed mid-pack. Had control roles been assigned from the slate rationale, the
false-positive test would have run against the wrong two issuers.

### JPM: verified as a genuine restructure

Jaccard of 0.306 with an 18% word-count drop is the kind of outlier that is usually a
parsing bug, so it was checked before being trusted. It is real: JPMorgan merged separate
**Regulatory** and **Legal** sections into a single **Legal and Regulatory** section and
consolidated the prose.

That makes JPM the most valuable filing in the corpus. It is exactly the restructure case
that motivated diffing at Risk Claim level rather than Risk Factor level: a factor-level
diff sees two sections disappear and one appear, and reports a risk profile change that is
really an editing decision. **Claim-level diffing should show most of these claims
persisting across the merge. If it does not, the central design decision is wrong** — and
that is a far sharper test than any aggregate precision number.

---

## Candidate slate

### Expected high churn — positive control candidates

| Issuer | Ticker | FYE | Sector | Hypothesis |
|---|---|---|---|---|
| NVIDIA | NVDA | Jan | Semiconductors | Export-control regime and customer-concentration language churn heavily |
| CrowdStrike | CRWD | Jan | Cybersecurity | The 2024 global outage should surface as new incident-and-liability language |
| Boeing | BA | Dec | Aerospace/Industrial | Ongoing production, regulatory, and labor disclosure churn |
| Moderna | MRNA | Dec | Biotech | Post-COVID revenue decline and pipeline restructuring |
| First Solar | FSLR | Dec | Energy/Solar | Trade policy, tariffs, and incentive-regime changes |

### Expected heavy recycling — negative control candidates

| Issuer | Ticker | FYE | Sector | Hypothesis |
|---|---|---|---|---|
| Procter & Gamble | PG | Jun | Consumer staples | Mature, stable business; risk language expected near-verbatim |
| Republic Services | RSG | Dec | Waste/Industrial | Highly stable regulated operations |
| Consolidated Edison | ED | Dec | Regulated utility | Rate-regulated; risk profile changes slowly by design |

### Format and taxonomy stress

| Issuer | Ticker | FYE | Sector | Purpose |
|---|---|---|---|---|
| JPMorgan Chase | JPM | Dec | Banking | Very long, deeply nested Item 1A — the hardest parsing target in the slate, and forces financial-sector Categories |
| Prologis | PLD | Dec | REIT | Real-estate Categories no other issuer will exercise; tests taxonomy breadth |

---

## What this slate covers, and what it doesn't

**Covered:**
- 8 sectors across tech, financials, healthcare, energy, industrials, staples, utilities, real estate
- 3 non-December fiscal year ends (NVDA, CRWD, PG) — exercises fiscal-year handling and
  the filing-calendar logic, which a December-only corpus would leave untested
- Item 1A length spanning roughly an order of magnitude (JPM at one end, RSG/ED at the other)
- 5 high-churn and 3 low-churn candidates, so the screen has range to pick from

**Not covered — stated as a limitation:**
- **All ten are large accelerated filers.** Filer-size diversity was traded for
  verifiability: smaller reporting companies vary enormously in Item 1A quality and may
  omit the section entirely, and naming a specific small-cap without having read its
  filings would be a guess at the foundation of the corpus.
- **Recommended fix:** screen ~15 randomly sampled Russell 2000 issuers with the same
  lexical screen, and add the 2 that produce clean, non-empty Item 1A extractions in both
  years. Empirical selection, no guessing. Treat as a stretch goal after the core ten run.
