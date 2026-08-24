# Eval Plan — Pre-Registration

**Registered:** 2026-08-15
**Status:** Committed before the first eval run.

This document fixes the metrics, gates, and hypotheses **before any results exist**.
Results are reported against this plan regardless of outcome. If a gate is missed, the
finding is that the system missed the gate — the gate does not move.

Terminology follows [CONTEXT.md](./CONTEXT.md). Architectural commitments are in
[docs/adr/](./docs/adr/).

---

## 1. What is being evaluated

A provider-facing agent that reads a patient's clinical documentation, retrieves the
governing Policy's Criteria Set, and produces a per-Criterion Determination with Source
Spans plus a drafted PA Request.

**Service:** knee arthroplasty, single service line.
**Corpus:** 6 Policies (5 commercial Payers + Medicare LCD), 20 Cases.
**Primary unit of measurement: the Determination, not the Case.** The six authored Criteria
Sets contain **122 Criteria, mean 20.3 per Policy** (range 13–30), so 20 Cases yield roughly
**400 Determinations**, supporting a 95% CI of about **±4.5pp**. Case-level rates (n = 20,
CI ≈ ±22pp) are not reported as headline figures.

**Corpus freeze date: 2026-08-15.** Every Policy is recorded with its retrieval date and
effective date. One Policy (KPWA-TKA) is future-dated to 2026-10-01 — published and current,
but not yet operative — which is why the freeze date is stated explicitly rather than assumed.

---

## 2. Gates

Gates are pass/fail. **No utility metric can offset a failed gate.** This is a deliberate
rejection of a composite weighted score: a composite lets good utility buy off a safety
failure, which is the wrong structure for a clinical document a physician signs.

| Gate | Threshold | Rationale |
|---|---|---|
| **`met`-precision** | ≥ 0.95, **lower Wilson bound > 0.90** | A false `met` sends an unsupported PA to the Payer under a clinician's name |
| **Grounded-citation rate** | **= 1.00** | Span existence is a deterministic check (Tier 0). There is no defensible reason to ever emit a fabricated citation |

**Why 0.95 and not 0.99:** at n ≈ 160 Determinations we cannot *resolve* a difference above
roughly 0.98. A 0.99 target would be unmeasurable theater. The threshold is set to what the
sample size can actually distinguish, and is stated in terms of its lower bound so the claim
matches the evidence.

**Why exactly 1.00 on citations:** this gate is enforced by string matching, not hoped for
from a model. A gate held at 100% by construction is a stronger claim than 99.2% by
observation.

---

## 3. Metric definitions

Fixed now so they cannot be redefined after seeing results.

**`met`-precision** — of all Determinations the agent returned as `met`, the fraction the
Golden Label also marks `met`. Denominator: agent-returned `met`.

**`met`-recall** — of all Criteria the Golden Label marks `met`, the fraction the agent
returned as `met`.

**Grounded-citation rate** — of all Source Spans emitted, the fraction present byte-for-byte
in the input documentation at their stated offsets.

**Entailment catch-rate** — of all (Assertion, Source Span) pairs the Golden Label marks
unsupported, the fraction the Entailment Cascade rejects.

**Retrieval-induced false `non-determinable` rate** — of Determinations returned as
`non-determinable` under retrieval, the fraction whose supporting evidence *was* present in
the chart but not retrieved. Measurable because the Seed Spec knows which Criteria are
genuinely present. Denominator: retrieval-mode `non-determinable` Determinations.

**Criteria precision / recall (Stage 1)** — extracted Criteria Set against the authored
Criteria Set, matched by semantic equivalence, adjudicated by a Judge that does not see
which set is which.

**Satisfaction-structure accuracy (Stage 1)** — extracted Satisfaction Expression against
the authored expression. Reported **separately** from criteria precision/recall: the agent
can extract every Criterion correctly and still misread the logic binding them.

**Check Type routing precision / recall (Stage 1)** — classification of Criteria as
`deterministic` vs `inferential`. **Precision on `deterministic` is reported separately from
recall**, because the errors are asymmetric: over-classification routes clinical inference
to a comparison operator and produces confident wrong Determinations, threatening the
`met`-precision gate; under-classification merely spends money unnecessarily.

**Routing cost delta** — cost per Case with deterministic routing enabled vs. all-inferential,
paired with the accuracy difference between them.

**Propagation delta** — Stage 2 accuracy on golden Criteria Sets minus Stage 2 accuracy on
extracted Criteria Sets.

**Judge–physician agreement** — Judge met/not-met against HealthBench's physician-labeled
triples (29,511 triples, 60,896 judgements, 186 physicians; verified 2026-08-15).

**Physician–physician agreement (the ceiling)** — measured directly from the same file:
**78.1% raw agreement, κ ≈ 0.38** over 33,435 pairwise comparisons. Two physicians shown the
same response and criterion disagree roughly one time in five.

> **M8.1 is never reported without the ceiling.** Judge-physician agreement alone is
> uninterpretable — a judge at ~78% is *at* the human ceiling, not failing. Required format:
> judge-vs-physician, physician-vs-physician (78.1%), and chance (64.5%), together.
>
> MedHELM's published **92.8–94.7%** exceeds the human-human ceiling measured here and
> therefore cannot be agreement with individual physicians; it is presumably measured against
> adjudicated or consensus labels. **It is not a like-for-like target and will not be
> presented as one** — a correction to this plan's original framing.

**Abstention profile** — rate of `non-determinable`, and the fraction of those correct.

**Cost per Case / p95 latency per Case** — measured per configuration.

All rates are reported with a **Wilson 95% interval and an explicit denominator**.

---

## 4. Hypotheses

Registered in advance. Each is falsifiable and will be reported as confirmed or not.

**H1 — Full context beats retrieval on `met`-recall by > 5pp.**
Rationale: retrieval cannot cite what it did not surface.
*Failure to confirm is itself informative* — it would suggest lost-in-the-middle effects
offset the recall advantage on charts of this length.

**H2 — Escalating the lowest-confidence 15% of entailment pairs to Tier 2 recovers > 75%
of the catch-rate of all-LLM checking, at < 25% of its cost.**
Rationale: clinical inference concentrates in a small, identifiable low-confidence tail.

**H3 — Stage 1 error propagates sub-linearly: propagation delta < Stage 1 criteria error.**
Rationale: some extraction misses fall on Criteria the chart could not have satisfied
anyway.

**H4 — `met`-precision is higher on clean and deficient strata than on borderline, by a
margin exceeding the CI.**
Rationale: borderline Cases are constructed to be genuinely ambiguous. If this does *not*
hold, the stratification failed and the corpus is easier than intended.

**H6 — Identical documentation yields different Determinations under Policies that differ on
a criterion's strictness.**
Specifically: a Case seeded with 6–10 weeks of documented failed conservative therapy should
yield `met` or `non-determinable` on the conservative-therapy Criterion under L39911, whose
3-month period is explicitly non-binding ("usually"), and `unmet` under a commercial Policy
imposing a hard duration threshold.
Rationale: this is the sharpest available test that the system reads Policy rather than
pattern-matching a fixed rubric. **A system that returns the same Determination under both
has failed regardless of its accuracy score**, because it is not reading the policy at all.

**H5 — Routing deterministic Criteria away from the model reduces cost per Case by > 15%
with no accuracy loss exceeding the CI.**
Rationale: threshold Criteria (BMI, age) are a meaningful share of a knee arthroplasty
Criteria Set, and a comparison operator is both cheaper and more reliable than a model on
them. *Failure to confirm would mean either that deterministic Criteria are rarer than
expected, or that their structured operands are too often missing from the record — both
worth reporting.*

---

## 5. Experimental design

**Corpus split.** 20 Cases, stratum-balanced with borderline deliberately over-weighted:
≥ 6 clean, ≥ 6 deficient, ≥ 6 borderline. An eval set that is deliberately hard is a better
artifact than a representative one; this is intentional and is stated in the report.

**Held-out Patient** — exercises Stage 2 against Criteria Sets already in the index.

**Held-out Policy** — 2 of 6 Policies excluded from the index, exercising Stage 1
end-to-end. **Reported with n = 2 stated explicitly, as an observation, never as a rate.**

**Out-of-distribution slice** — 5 real MTSamples orthopedic notes, labeled per
`REQUIREMENTS.md` §7. In-distribution and OOD accuracy are reported **separately**. Any
divergence between them is a headline finding, not a footnote.

**Configurations swept:** {full context, retrieval} × {golden Criteria Sets, extracted
Criteria Sets}, plus an entailment escalation-threshold sweep.

**Model roles are fixed now:** the generator is the system under test; the Judge is a
different model and never the generator; Entailment Tier 1 is MiniCheck-FT5 running
locally; the two real-note Labelers are drawn from different model families.

---

## 6. Reporting commitments

1. **All registered hypotheses are reported**, confirmed or not.
2. **Failed configurations are reported** — prompts that produced confident false `met`
   calls, chunking strategies that broke temporal reasoning. The iteration log is part of
   the deliverable, not a private artifact.
3. **Gates are reported before utility metrics.**
4. **No metric is redefined after results are seen.** Any deviation from this plan is
   recorded as a dated amendment below, with its reason, rather than by editing the
   original text.
5. **Benchmark validity is published** — the corpus-wide maximum n-gram overlap between
   Criterion statements and their supporting Source Spans, evidencing that no Criterion is
   satisfiable by lexical match alone.

---

## 7. Limitations, stated up front

These are published in the report itself, not surfaced only under questioning.

- **Golden Labels are model-generated.** Synthetic Cases are seeded, so their labels are
  true by construction (ADR-0002); real-note labels are dual-blind model labels with author
  adjudication. **No label in this project is clinician-validated.** The only
  physician-grounded measurement is Judge calibration against HealthBench.
- **Public Policies substitute for InterQual and MCG.** Most commercial prior auth is
  adjudicated against proprietary licensed criteria. Public payer policies and Medicare
  LCD/NCD are a legitimate but not equivalent stand-in. **Verified directly during corpus
  assembly:** UnitedHealthcare's published commercial knee policy contains zero
  medical-necessity criteria and defers wholly to InterQual, which is why UHC could not be
  included at all.
- **The Policy corpus is not fully independent.** KPWA-TKA and PREMERA-7.01.550 share an
  identical typographical error and an identically ordered list of alternative diagnoses,
  indicating a common upstream source. Held-out-Policy generalization is therefore measured
  against policies that are not guaranteed to be independent of the indexed ones.
- **One Policy is future-dated.** KPWA-TKA takes effect 2026-10-01, after the corpus freeze
  date of 2026-08-15.
- **Held-out Policy rests on n = 2.**
- **Single service line.** No claim of generalization beyond knee arthroplasty.
- **Synthetic patients.** Synthea's osteoarthritis module models no imaging and no
  corticosteroid injections, so those Criteria are supplied by the Seed Spec rather than
  the generator.
- **No runtime path for uncached Policies** (ADR-0003).
- **External anchor:** CHI-Bench reports best-agent performance of **28.0%** on policy-dense
  healthcare workflows, dropping to 3.8% in single-session execution. Numbers here cover a
  far narrower slice and are not comparable to it directly; it is cited to situate the
  difficulty of the general problem.

---

## 8. Amendments

**2026-08-15 — extended before first run.** Added Satisfaction-structure accuracy, Check
Type routing precision/recall, and Routing cost delta to §3, and H5 to §4. Reason: the
requirements pass established that a Criteria Set carries a Satisfaction Expression and a
per-Criterion Check Type (see `CONTEXT.md`), both of which are Stage 1 outputs and therefore
scoreable. **No eval run had occurred at the time of this amendment**, so no result
influenced it.

**2026-08-15 — H6 added, before first run.** Authoring the first Criteria Set (L39911)
established that its 3-month conservative-therapy period is explicitly non-binding
("usually"), while commercial Policies generally impose hard thresholds. H6 pre-registers the
cross-Policy divergence this predicts. Also fixed: the borderline Sampling Stratum is seeded
at **6–10 weeks** of documented therapy, the band where L39911 genuinely does not settle the
answer. **No eval run had occurred**; this follows from reading policy text, not results.

**2026-08-15 — corpus assembled; denominator and held-out pair fixed, before first run.**

1. **Denominator corrected.** The six authored Criteria Sets contain **122 Criteria (mean
   20.3, range 13–30)**, not the ~8 per Policy assumed at registration. Expected
   Determinations rise from ~160 to ~400 and the CI tightens from ±7pp to ~±4.5pp. The
   `met`-precision gate stays at **≥ 0.95 with lower bound > 0.90** — the tighter CI makes it
   harder to pass, not easier, so the threshold is not relaxed.
2. **Held-out Policies pre-registered by seeded draw.** `random.Random(20260815).sample(...)`
   over the six slots → **held out: P1 (Medicare L39911) and P6**. Drawn *before* any
   commercial policy was read, so the pair cannot have been chosen for being easy.
3. **Two payer substitutions**, each forced and each recorded in the policy's `policy.md`:
   - **UnitedHealthcare → Premera Blue Cross 7.01.550.** UHC's commercial *Surgery of the
     Knee* policy contains **no medical-necessity criteria at all**; it delegates entirely to
     proprietary `InterQual® CP: Procedures: Total Joint Replacement (TJR), Knee`. Its
     Medicare Advantage policy delegates likewise. This is direct empirical support for the
     InterQual/MCG limitation in §7 — it is now a verified observation, not a caveat.
   - **Anthem → Kaiser Permanente WA; Humana → Providence Health Plan MP418.** Anthem's
     CG-SURG-54 is not publicly retrievable; Humana's only knee policy is Medicare Advantage
     behind a session-gated portal. Slot identities preserved so the draw remains valid.
4. **New limitation discovered — corpus independence is imperfect.** KPWA-TKA and
   PREMERA-7.01.550 share an identical `"Hemophilic arthroplasty"` typo and list the same four
   alternative diagnoses in the same order, indicating a shared upstream source. Held-out-policy
   results must be read with this in mind and it is added to §7.

**No eval run had occurred at the time of this amendment**; all changes follow from reading
policy text.

*Any further deviation is appended here with a date and reason, rather than by editing the
text above.*
