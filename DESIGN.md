# Design

Recorded from the built site on 2026-08-27, updated on 2026-08-28 when a fifth project joined it and received its own evidence ink. Ground truth is `src/styles/house.css`;
where this file and the stylesheet disagree, the stylesheet is right.

## The one idea

**Every colour on this site is a measurement.** A field takes its ink from what the
evidence says. A shape appears only when it stands for a number in a committed
artifact. There is no decorative colour, no decorative shape, and no decorative
motion anywhere in the system.

This is the Alan Fletcher method rather than Fletcher's motifs: find the one true
idea, make it a picture, and let it be funny because it is true. The structural
grammar (full-bleed hairline-ruled bands, split panels with the seam left visible,
display type at poster scale, pill controls) comes from tolans.com.

What it refuses: the dark-glass AI-portfolio hero with gradient and blur, which is
what this site was before, and its predictable opposite, cream paper with a
high-contrast serif and a terracotta accent.

## The six inks

This mapping is binding. It is the reason colour is allowed on the page at all.

| Token | Value | Means | Text on it |
|---|---|---|---|
| `--vermilion` / `--vermilion-deep` | `#e2361a` / `#b32809` | a gate that was missed | `--paper`, 5.65:1 |
| `--chrome` / `--chrome-deep` | `#f2b200` / `#6b5000` | a result that will not hold still | `--ink`, 9.60:1 |
| `--cobalt` / `--cobalt-deep` | `#1b3fd8` / `#1834b4` | a decision that was taken | `--paper`, 8.33:1 |
| `--viridian` / `--viridian-deep` | `#0f8a5f` / `#0b6a49` | held, by construction | `--paper`, 5.74:1 |
| `--violet` / `--violet-deep` | `#b648b7` / `#6e276f` | a diagnosis that diverged | `--paper`, 8.35:1 |
| `--ink` (as a field) | `#171613` | a measurement that could not be made | `--paper`, 15.9:1 |

The sixth is the absence of colour, and it is used that way on purpose: Rubric
Triage's headline result is that four of its six checks fire too rarely to measure
at all, so its field has no ink to take.

Bright weights cut shapes and set large type. Deep weights are the only ones that
carry body text. Each project is assigned an ink in `src/lib/site.ts` via `ink` and
`inkMeans`, keyed to the character of its finding, never to its subject:

- Prior Auth → vermilion. Met-precision missed the 0.95 bar by 1.1 points.
- 10-K Risk → chrome. Identical inputs produce different alerts run to run.
- NDA Triage → cobalt. A kill decision, taken on evidence.
- Rubric Lens → ink. Most of what it set out to measure could not be measured.
- Reasoning Atlas → violet. Four of five expected right-answer, wrong-reason diagnoses diverged from the recorded grader's labels.

The homepage reads them in that order, so the five fields run vermilion, chrome,
cobalt, ink, violet. Because `ink` now carries a meaning, no other band may take it as a
field: the closing statement on the homepage gave it up and sits on paper.

**Never tint text with `opacity` on a colour field.** That is how secondary text
quietly drops under AA here; vermilion in particular has almost no headroom.
Secondary text is distinguished by size, case, and tracking instead.

## Ground and structure

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f2efe3` | the ground, everywhere |
| `--paper-sunk` | `#e8e4d4` | evidence wells, second-level nav, mermaid nodes |
| `--paper-edge` | `#dbd6c3` | table row rules |
| `--ink` | `#171613` | type and heavy rules |
| `--ink-soft` | `#5a574c` | secondary text on paper, 6.28:1 |
| `--rule` | `#d5d0be` | every hairline |

The page is a stack of full-bleed `.band` elements divided by 1px rules. `--wrap`
is `78rem`, `--measure` is `38rem`, `--gut` is `clamp(1.15rem, 4vw, 2.75rem)`.

`.split` divides a band into two halves with the seam visible. It is capped at
`--wrap` and centred so its content sits on the same left margin as every other
band; do not remove that cap, or the page grows two competing left edges.

`[data-field="<ink>"]` drenches a whole band. Colour owns regions, never edges.

## Type

**Archivo Variable** (`wdth` 62–125, `wght` 100–900) for everything, self-hosted via
`@fontsource-variable/archivo/wdth.css`. It is the closest free face to GT America,
which is what tolans.com uses; the width axis is the point, not a nicety.

- `.display` runs `wdth 112 / wght 830`, tracking `-0.04em`, leading `0.9`.
  `.display-xl` peaks at `9.5rem`, which is deliberate poster scale, not an
  oversight against a 6rem guideline.
- Body is `1.0625rem / 1.62`. Long-form prose is capped at `--measure`.
- Headings run `wdth 108 / wght 750`.

**Chivo Mono Variable** for measured numbers only, never as a costume for
"technical". `.num` for inline figures, `.figure` for the poster-scale ones.
`.label` is mono, uppercase, tracked — set as a standalone marker, never as a kicker
stacked above a heading. There are no eyebrows in this system.

## Components

- `.plate` — paper on paper: 1px edge, no shadow. Nothing in this world glows.
- `.pill` — 999px, 1px ink border, mono uppercase, 44px minimum. The only rounded
  thing on the site.
- `.well` — the evidence layer. Flat, `--paper-sunk`, 2px ink rule under the header
  row. Never animated, never tinted for mood, never made friendlier than the
  numbers are.
- `.mark.missed` / `.mark.held` — measurement tokens at identical weight. A missed
  gate is not styled as an error.
- `.catalog` / `.entry-grid` / `.brief` — packed grids with `gap:1px` over a
  `--rule` background, so the seams draw themselves.
- `.poster-frame` — holds the five project posters.

## The five marks, and the homepage order

`ProjectMark.astro` draws each project's evaluation signature as a glyph small
enough to sit together in the hero: configurations against a fixed gate, three
repeat passes, splice fixtures, check firing rates on the entropy curve, and grader
routes from expected to actual diagnoses. They
use the same measurement apparatus and committed artifacts as the full posters,
so a mark is never a logo. They draw in `currentColor`, so a tile inverts to that
project's own field colour on hover or focus.

The landing page is a Persuade surface, so each mark is followed by one short
sentence explaining what the product does, then one proof line naming its strongest
demonstrated capability. Metrics stay in the case study, where their denominators
and release gates are visible. The complete case study carries the verdict and the
inconvenient evidence. This is sequence, not omission: product first on the index,
measurement in the record one click away.

Every tile uses the same internal rows: a fixed optical stage for the mark, a
reserved title row, a short description, and the proof line pinned to the bottom.
The marks share a `132 × 92` drawing canvas but not identical visible bounds, so
each kind receives a small optical scale correction. Explanatory captions do not
live inside the marks; the description below owns that work.

One decision worth keeping: the gate mark plots the **Wilson lower bound**, not
the point estimate. The point estimate puts the out-of-distribution row past the
rule, which at glyph size reads as a pass when it is not one; the lower bound is
the quantity the release rule actually tests and every configuration falls short
on it.

The homepage order is deliberate and was arrived at by fixing a real problem: the
first screen used to be type on empty paper with three text bands before any
colour, which is a drop-off page. It now runs hero (sentence, gate rule, proof and
inventory, then a full-width contact sheet of five equal marks), work intro, the five
colour fields, how-I-work, background, close. Colour and pictures land in the
first two viewports, and the bio sits after the work rather than before it.

The five-mark sheet is never a two-column grid. Five equal things need five equal
cells on a wide surface; putting four in a square and stretching the fifth across
the row turns one project into an accidental hero and leaves dead space beside the
sheet. Below 900px, every mark becomes a compact horizontal row in the same source
order, preserving equal weight without manufacturing an empty sixth cell.

## Icons and pipelines

`Icon.astro` is the house icon set: one 24-unit grid, 1.6 stroke, butt caps, mitre
joins, no fills and no rounded corners, so a glyph reads as the same cut world as
everything else. Every glyph stands for a real stage in a real pipeline. There are
no ornamental icons, and none is borrowed from a library.

Resume, LinkedIn, and GitHub links use recognizable glyphs redrawn on that same
24-unit grid and house stroke. They always sit beside visible link text, so the
brand shape reinforces the destination rather than becoming its accessible name.

`Pipeline.astro` draws a project's actual stages as a hairline-seamed row, one cell
per stage, with a short ink tick on each seam for the flow. Each cell says what the
stage does and, where it matters, what it refuses to do. Cells are focusable and
invert to ink on hover or focus. Stage data lives in `PIPELINES` in `site.ts`, and
the column count follows the stage count. At 1000px it goes two up and drops the
seam ticks, because a row break would connect nothing; below 560px it stacks and
the tick turns to run downward.

## The five posters

Each project's finding, drawn, with every shape read from committed JSON at build
time (Rule 2 governs figures and graphics alike).

- **`PaGates.astro`** — met-precision with Wilson intervals against the 0.95 gate.
  The gate is a 4px ink rule drawn heavier than any datum. Intervals extend from
  their point estimate; the rule does not move.
- **`StabilityDots.astro`** — three overlapping circles are three identical passes
  (vermilion / chrome / cobalt, `mix-blend-mode: multiply` for overprint). Each
  square is a flagged passage, placed in its true Venn region. Boeing's centre is
  empty; Consolidated Edison is printed beside it at the same size as the control.
- **`NdaSweep.astro`** — 24 splice fixtures as cells; 7 are cut apertures. The
  product proves clauses are absent, so the holes are the subject.
- **`CoverageBand.astro`** — binary entropy plotted against firing rate, so the
  backdrop is arithmetic rather than a threshold anyone picked. Squares are the six
  checks as written; arcs are what the tool's own rewrite engine did to them, and
  three sweep the full width from one zero to the other. Arc lift scales with the
  distance travelled, so a check that barely moved draws a short hop.
- **`GraderPaths.astro`** — each committed fixture runs from its expected diagnosis
  to the grader's actual diagnosis. The route and result are read from the first
  recorded grader run, so the four misroutes and one catch remain visible as data.

Pass colours are consistent site-wide: pass one vermilion, pass two chrome, pass
three cobalt, including in the 10-K instability demo's chips.

## Motion

One authored gesture: **paper travels along one axis and stops flat.** Nothing
fades in place, nothing floats, nothing bounces. `--cut` is
`cubic-bezier(.16, 1, .3, 1)`; durations `--t1/2/3` are 180/420/760ms.

Content is visible by default. An inline head script sets `data-motion="on"` only
when motion is welcome, and the observer in `Base.astro` sets `data-armed` on each
target immediately before observing it. Hiding is gated on `[data-armed]`, so a
script that never runs leaves a readable page rather than a blank one. Do not move
the hide rule back onto the bare class.

`prefers-reduced-motion: reduce` forces final state with `!important`.

## Accessibility floor, verified

Every text node on all 10 page types was measured with alpha composited down to the
opaque ground: **0 failures** against 4.5:1 body / 3:1 large. Focus rings are cobalt
on paper and paper on colour fields. Targets are 44px. Selection, caret, and
scrollbars are themed from the palette. Pages print to ink on white.

## Where the numbers come from

`scripts/sync.mjs` copies every build input from the source projects; nothing here
is hand-edited. A project may set `root` when it lives outside this repo's parent
directory, and `report: null` when it publishes its evidence inside its artifacts
rather than as a separate eval report (`hasReport: false` on the project record then
drops the Evidence nav item and the record grid's report cell).

Rubric Lens's per-check diagnostics come from its six pinned-judge JSON exports.
Its corpus size and its rewrite outcomes exist only inside that run's own
`report.html`, so `site.ts` parses them out of that committed artifact at build
time. That is still Rule 2: read from a committed run, never typed.

## The demos

`public/demos/prior-auth/`, `public/demos/nda-triage/` and the Astro-rendered
`/demos/10k-risk/` all carry this world. The two vanilla demos get their faces from
`public/demos/house-demo.css`, which is the only file in `public/demos/` that sync
does not overwrite.

**Never hand-edit anything else under `public/demos/`.** Those files are copied
from the source project repos on every `npm run sync`, and an edit made there is
destroyed silently on the next run. The retheme therefore lives in
`rethemeDemoCss()` in `scripts/sync.mjs` and is reapplied on every copy: the
`:root` block is swapped for the house tokens, dark hex values are detected by
luminance and mapped (background to paper, text to ink) rather than by a list that
always misses one, shadows and blurs and gradients are stripped, radii go to 0
except pills, and links take ink with a vermilion underline. `npm run sync:check`
reports drift and must stay clean.

## Standing rules

1. A number is read from a committed artifact at build time or it does not appear.
   This governs graphics too: no shape without a datum.
2. A colour means one of the six things above, or it is not used.
3. Nothing is glass, blurred, gradient, or shadowed.
4. No kickers or eyebrows above headings.
5. No em dashes in copy.
6. A missed gate is reported at the same visual weight as one that held.
