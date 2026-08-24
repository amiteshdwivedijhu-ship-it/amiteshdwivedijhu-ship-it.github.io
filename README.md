# Amitesh Dwivedi's AI Product Portfolio

This is the source for my portfolio website and three working AI product case studies:

- **Prior Auth Agent:** checks a patient record against payer policy and drafts an
  evidence-cited authorization request.
- **10-K Risk Extractor:** turns Item 1A prose into source-cited risk claims that can
  be compared across fiscal years.
- **NDA Triage:** compares inbound NDAs with a review playbook and searches for
  expected clauses that are missing.

Each case study includes the product decisions, a recorded prototype, and the
evaluation artifacts behind the reported numbers.

## Run locally

Requires Node.js 20 or later.

```sh
npm install
npm run dev
```

`npm run dev` first syncs the latest demos and artifacts from the three neighboring
project folders, then starts the Astro development server.

## Validate a production build

```sh
npm run sync:check
npm run build
npm run preview
```

## How content is organized

```text
src/pages/       homepage, resume, project pages, and reports
src/components/  shared interface components
src/content/     synced case-study artifacts and resume content
src/data/        synced evaluation results used to render scorecards
public/demos/    offline product demos
public/assets/   screenshots and site imagery
scripts/sync.mjs source-to-portfolio synchronization
```

The synced project content is committed on purpose so the website can build without
access to the source folders. Dependencies, generated builds, local environment files,
and credentials are excluded from Git.
