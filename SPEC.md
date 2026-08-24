# Portfolio Site — Build Spec

**Status:** approved in grilling session, 2026-08-23. Build has not started.
**Owner:** Amitesh Dwivedi
**One-line goal:** get hired as an AI PM, with a site that reads as art and not as a consulting deck.

---

## 0. The governing idea

The site is itself an eval report. Every claim carries its evidence, and failures are
reported at the same fidelity as wins. The visual system is severe — warm paper, one ink,
one alarm colour — so that the writing is the only soft thing in the room.

Two rules follow, and everything else in this spec is downstream of them.

**Rule 1 — the A/B split.** *A* governs frame, voice, and hierarchy: zero apology, zero
hedging, no "I'm still learning," every page opens with what was built and what it proves.
*B* governs the evidence layer: tables report what was measured, `PASS` and `FAIL` both,
unedited. A `FAIL` is a measurement token, not a confession. The word "failure" never
appears at site level.

**Rule 2 — no second implementation to drift.** Borrowed from `riskx/render.py`. No
measured number is ever typed into HTML. Every figure on the site is read at build time
from `runs/scorecards/*.json` or `data/benchmark/*.json`. If a number cannot be sourced
from a committed artifact, it does not appear.

---

## 1. Decisions locked

| # | Decision | Choice |
|---|---|---|
| 1 | Tone | A governs frame/voice; B governs evidence layer |
| 2 | Failure depth | One click down — homepage cards affirmative, gates tables on project pages |
| 3 | Project shape | Argument on top (~700 w), all artifacts published beneath with one-line hooks |
| 4 | Demos | All three; 10-K gets the instability demo; shared `house.css`; embedded as subpages |
| 5 | Personality | Voice primary, people-at-the-end secondary; nothing decorative; personal hobby copy removed from the hero |
| 6 | Experience | Short work block on the intro page only; Ellipsis named |
| 7 | Stack | Astro → Cloudflare Pages; separate `portfolio/` repo; project repos public later |

Explicitly rejected: pencil marginalia, paper texture, gradient heroes, an Experience page,
Ellipsis as a fourth project card, a Writing section in v1, curating artifacts down to three.

---

## 2. Page inventory

```
/                                     intro
/projects/prior-auth                  case study
/projects/prior-auth/report           eval report (5.7k w)
/projects/prior-auth/<artifact>       8 artifacts
/projects/10k-risk                    case study
/projects/10k-risk/report             eval report (8.9k w)
/projects/10k-risk/<artifact>         7 artifacts
/projects/nda-triage                  case study
/projects/nda-triage/report           eval report (2.5k w)
/projects/nda-triage/<artifact>       7 artifacts
/demos/prior-auth/                    static replay demo
/demos/10k-risk/                      instability demo (to be built)
/demos/nda-triage/                    static replay demo
```

No nav item for Writing. No Experience page. No blog.

---

## 3. The intro page

Content, in order:

1. **`Hi, I'm Amitesh. I build AI products.`**
2. **Work block** — short, factual, names Ellipsis:

   > I build agentic AI products. At Ellipsis Health I took a clinical voice care-management
   > platform from zero to production across 10+ enterprise accounts — Aetna, Duke, Highmark — and
   > founded the agent evaluation function: the quality gate for every clinical agent at Ellipsis.
   >
   > The three projects below are the same craft in the open — public data, published policies,
   > and the evidence attached.

3. The intro moves directly from the work block to the project cards.
4. **Three project cards** — affirmative only. Name, one line of what it is, one measured
   scale figure. No `FAIL` on this page.
5. **Links** — resume, LinkedIn, GitHub (once repos are public).

`think → write → build` maps to the site's own structure (tradeoff memos → artifact rail →
demos). Do not state this mapping on the page; let it be true rather than announced.

---

## 4. Project page template

Built from each project's existing `Case-Study-One-Pager.md`. Target ~700 words.

1. **Headline** — what it is, what it proves. Affirmative.
2. **Problem** — including one short passage naming *who is at the end of the pipeline*.
   This is where the warmth lives. See §5.
3. **What I built** — architecture in four or five lines, plus corpus scale.
4. **Decisions worth defending** — 3–5, each one sentence.
5. **Results table** — generated from JSON. `PASS` and `FAIL` both, unedited.
6. **The finding** — stated flatly, in the voice of someone who owns the standard.
7. **Artifact rail** — every artifact linked, each with a one-line hook saying *what it proves*.
8. **Demo link.**

### 4.1 People at the end of the pipeline

One passage per project, no more:

- **Prior Auth** — the patient whose imaging sits behind a fax machine.
- **NDA Triage** — the lawyer with forty NDAs in the queue and no way to know which one hides
  an IP assignment.
- **10-K** — the analyst facing 691 risk factors to find the two that changed.

---

## 5. Voice

The register already exists in the repos and is the model for all site prose:

> "A silent chart is not a negative chart."
> "The finding is that the system missed the gate. The gate does not move."

Short declarative sentences. Tables stay cold and exact; the sentences around them carry the
person. Never hedge a measured result, and never apologise for one.

**Banned everywhere:** "unfortunately", "I'm still learning", "something to improve",
"this didn't quite work out", "a great learning experience", and any sentence whose subject
is the author's inadequacy.

**Correct form**, for reference — same fact, no apology:

> The system returns `met` correctly 93.9% of the time. The gate is 95%. It does not ship.
> Seven unsupported claims per 114 is seven letters going to a payer under a physician's
> signature — which is the harm the gate exists to prevent. The gate was set before the run
> and was not moved after it.

---

## 6. The three projects

### 6.1 Prior Auth Agent

Four-stage agent: extract criteria → evaluate case → gate citations → compose request.
20 synthetic Synthea cases × 6 real published payer policies = **402 in-distribution
determinations**. 5 real dictated orthopedic notes held out. 555 clinical assertions gated
before output. 127 contract tests.

| Measure | Result |
|---|---|
| `met`-precision (gate ≥0.95, lower Wilson bound >0.90) | **0.939 [0.879, 0.970], n=114 — FAIL on all six configurations** |
| Grounded citation (gate = 1.00) | **1.000 on all six**, by construction |
| Determination accuracy, authored criteria | 0.958 [0.933, 0.973], n=402 |
| Determination accuracy, extracted criteria | 0.930 [0.901, 0.951], n=402 |
| Determination accuracy, real dictated notes | 0.820 [0.733, 0.883], n=100 |
| Requests carrying a review-required banner | 100 of 100 |

**The finding:** the gate was missed by 1.1pp and was not moved.

Source of truth: `runs/scorecards/_summary.json`, `_hypotheses.json`.
Artifacts (8): PRD, Metric-Design, Eval-Summary, Tradeoff-Memo, Launch-Decision-Memo,
Safety-and-Oversight-Review, Case-Study-One-Pager, README.

### 6.2 10-K Risk Extractor

Extracts Risk Factors from Item 1A, decomposes to Risk Claims, tags against a 48-category
taxonomy, diffs against the prior year. 10 issuers, 20 filings, FY2024→FY2025, 10,074
sentences, 691 Risk Factors, 3,216 Risk Claims, $9.41 per corpus run.

| Measure | Result |
|---|---|
| Fabricated citations | **0, by construction** — models emit sentence ids, never text |
| Sentence offset errors | 0 / 10,074 |
| Citations outside their Risk Factor | 0 / 3,216 |
| Schema violations | 0 / 3,216 |
| Claims supported by cited text | 98.2% |
| False-new rate on negative controls | **0%** (driven 7.3% → 3.6% → 0%) |
| `is_new` stability across 3 passes | **0.10 – 0.92 by issuer** |

**The finding:** the accuracy numbers and the stability number disagree about whether this
is shippable, and the stability number is the one to believe.

Source of truth: `data/benchmark/*.json`.
Artifacts (7): PRD, Metric-Design, Eval-Summary, Tradeoff-Memo, Launch-Decision-Memo,
Case-Study-One-Pager, README. No Safety review — appropriate; this is the SEC-filings one.

### 6.3 NDA Triage

Compares inbound NDAs against a company Playbook to decide who, if anyone, needs to read
them. ContractNLI dev split (61 docs); the 123-doc test split was never touched. No
LLM-as-judge anywhere (ADR-0001). Total inference spend **$21.83 of a $50 ceiling**.

| Measure | Result |
|---|---|
| Absence precision (40-doc stratified dev slice) | 0.983 |
| Absence recall | 0.792 (57/72), 1 false absence |
| Extraction macro F1, prompt v1 → v5 | 0.647 → 0.981 |
| Span verification failures | 38/143 → **0** at v3 |

**The finding:** no tested model tier clears the unacceptable-tier false-negative bar, so
per `PLAN.md` the product is not shippable at any autonomy setting at these price points.
A kill decision, made on evidence, against the author's own product.

Source of truth: `runs/phase-d/sweep.json`, `runs/phase-f/report*.json`, `runs/cost-ledger.jsonl`.
Artifacts (7): PRD, Metric-Design, Eval-Summary, Tradeoff-Memo, Launch-Decision-Memo,
Case-Study-One-Pager, README.

---

## 7. Demos

All three are static replay — no API keys, no server, no spend at view time.

### 7.1 Prior Auth (exists)
`web/` — vanilla HTML/JS over a 328KB recorded-run `data.json`. Palette lives in one
`:root` block. **Work: swap in `house.css`.**

### 7.2 NDA Triage (exists)
`demo/` — vanilla HTML/JS over 6 documents, ~260KB. Same pattern.
**Work: swap in `house.css`.**

### 7.3 10-K Instability Demo (to be built)

The one new build. Shows one issuer's Item 1A with the *same pipeline run three times, side
by side*, highlights flickering between passes.

**Feasibility is proven, not assumed.** All three stability passes replay from
`data/cache/llm.sqlite` at **zero API cost** — verified 2026-08-23 by running
`riskx.stability.measure` with a deliberately invalid `ANTHROPIC_API_KEY`. It completed and
reproduced `stability.json` exactly. Salts are deterministic (`stability-0/1/2`) and the
cache key is a pure content hash, so replay is a cache hit by construction.

Per-passage data recovered:

| Issuer | Claims per pass | Ever flagged | **Survives all 3** | Pairwise Jaccard |
|---|---|---|---|---|
| ED (control) | 93 / 97 / 91 | 8 | 7 | 0.875 / 1.00 / 0.875 |
| PLD | 189 / 194 / 194 | 3 | 1 | 0.50 / 0.33 / 0.67 |
| **BA** | 198 / 193 / 198 | 10 | **0** | **0.00 / 0.00 / 0.29** |

Boeing is the hero case: ten passages flagged as newly-disclosed risk across three identical
runs, **not one survives all three**, and runs 1 and 2 share nothing at all. Sentence text is
available (293 parsed sentences for BA), so the demo shows real prose, not ids.

**Build steps:**
1. Extraction script (~30 lines, mostly written during the feasibility probe) → emits
   `flagged` sets per pass, `ever_flagged`, `always_flagged`, and sentence text to JSON.
2. Three-column viewer, highlights per pass, a `0 of 10 survived` counter.
3. A line on the page noting the run replays deterministically from cache — i.e. anyone can
   reproduce it.

Ship ED or PLD as the contrast case so the reviewer sees the method is not rigged: on ED it
is stable (7 of 8), on Boeing it collapses.

**Estimate: half a day.** Cheaper than a standard demo, because the data generation is done.

---

## 8. Technical

**Stack:** Astro. Markdown content collections render the 21 artifacts from their existing
`.md` files — those files stay the source of truth and are edited in place. JSON imported at
build time feeds every results table (Rule 2). Zero JS shipped by default. The three vanilla
demos live in `public/demos/<project>/` and run untouched.

**Hosting:** Cloudflare Pages, git-push deploys. Netlify is an acceptable substitute.

**Domain:** `amiteshdwivedi.com` (to buy).

**Repo:** a separate `portfolio/` repo. A `sync` script copies only *built* demo assets —
HTML/CSS/JS and generated JSON — into `public/demos/`. The three source projects stay where
they are and become public repos later.

**Hygiene — corrected 2026-08-23 after inspecting the actual files.** All three projects
already ship a `.gitignore`, and 10-K's is deliberately the opposite of what this spec
first claimed. It excludes **189 MB** that is refetchable or locally regenerable
(`data/cache/raw` 94 MB, `data/cache/meta` 33 MB, `embeddings.npz` 62 MB) and **commits
14.5 MB on purpose** — `data/cache/parsed` (5.1 MB), `llm.sqlite` (9.4 MB) and
`data/benchmark` (32 KB) — with the rationale written into the file: it is what lets a
reviewer re-run the eval with no API key and no spend. That committed `llm.sqlite` is
exactly what makes the §7.3 instability demo reproducible by anyone. **Do not ignore it.**

One real conflict was found and fixed: NDA's `.gitignore` excluded all of `runs/`, but §6.3
cites `runs/phase-d/sweep.json`, `runs/phase-f/report*.json` and `runs/cost-ledger.jsonl` as
build-time source of truth. Under Rule 2 those numbers cannot be hand-typed, so the files
must be committed. `runs/` is 8.6 MB (7.6 MB of it JSON) — comparable to what 10-K already
commits — and is now tracked. Prior Auth needed no change; its `runs/` (6.3 MB, scorecards
40 KB) was never ignored.

Still correct: every project has a `.venv` and all three already ignore it.

### 8.1 Visual system

Seeded from `10K Risk Extractor/docs/site/index.html`, which already ships the house style:

```
--bg   #fbfaf8      warm paper
--fg   #1d1c1a      one ink
--muted #6b6864
--line #e4e0d9
--accent #8a4a2b    the single alarm colour
```

Serif body (`ui-serif, Georgia`), `max-width: 47rem`. Monospace **only** for measured
numbers. Dark-mode tokens already defined in that file — carry them over. All three demos
adopt this via one shared `house.css`.

---

## 9. Build order

1. ~~`git init` + `.gitignore`~~ **DONE 2026-08-23.** `portfolio/` repo initialized on
   `main` with a `.gitignore`; NDA's ignore rule corrected so its eval outputs are tracked.
2. Astro skeleton, `house.css`, intro page.
3. Prior Auth project page + artifact rail + JSON-fed results table. Proves the template.
4. Remaining two project pages.
5. Retheme the two existing demos.
6. Build the 10-K instability demo.
7. Domain + Cloudflare Pages deploy.
8. Update the resume's Portfolio link — it currently points at the old Notion page and must
   point here before the resume goes anywhere.

---

## 10. Open items

- Domain not yet purchased.
- Project repos to be published on GitHub after launch; site links to them once live.
- Writing section deferred until there are 2–3 pieces worth standing behind. An empty nav
  item leading to one post is worse than no nav item.
