# Proof Desk (concept prototype, example data)

Independent concept prototype by Amitesh Dwivedi for a job conversation about the Product Manager role at Hebbia (NYC or SF).
Not a Hebbia product. Not affiliated with or endorsed by Hebbia. No Hebbia logos, no Hebbia or customer data. All borrowers, firms, accounts, and metrics in the app views are example data. Public numbers on the "Problems we solve" page link to their sources.

## What it is
A sign off layer for AI drafted finance work. Matrix 2.0 now carries a run from a grid to a memo, deck, or email. Proof Desk links each claim in the memo to its cell and its page, flags what a human must check (sources disagree, low confidence, no source), locks approval until those are handled, and turns every edit into an eval case. A new checker version ships only through an eval gate with slices, then a staged rollout.

North star: verified deliverables approved per active analyst per week. Guardrail: 0 unsupported numbers sent.

## Views
- Pulse: hero with demo path, 6 KPIs, approvals and time to sign off trends, no edit rate, edit reasons, value calculator.
- Matrix run: 16 example credit agreements x 8 columns. Filters. Source panel with page and quote. A conflict between a credit agreement and a newer amendment, a low confidence OCR read, and a correct "not found".
- Deliverable check: IC memo with 10 linked claims. Checkpoint with 3 flagged claims, fix options, edit reasons, sign off, audit trail.
- Quality bar and evals: 4 customer task suites, live vs candidate, 6 gate checks, slices, fix and rerun, 10% rollout sign off, acceptance criteria, release history.
- Launch and adoption: rollout stages, deliverable funnel, feedback themes, 8 example accounts with health, launch checklist.
- Problems we solve: 9 cited cards.
- Roadmap and plan: north star, guardrails, 30 and 90 day plan, scored backlog (value, commercial, effort, op cost), risks, about the builder.

## 90 second path
Pulse, Matrix run (Needs a look), open Harbor Lane leverage and use the amendment, Deliverable check (fix #4 and #6, approve), Evals (blocked on amended agreements, fix, start 10% rollout), Launch and adoption.

## Run
`python3 -m http.server` in this folder, or open index.html. No build step, no network calls, no API keys. State lives in localStorage. Reset demo is in the menu.

## Deploy (not done)
Copy this folder to `public/demos/hebbia-proof-desk/`. All URLs are relative. Page is noindex.

## Design
Styled with a token layer (`tokens.css`) matched to Hebbia's public CSS so it fits the product family. Sources and gaps are in DESIGN-TOKENS.md. Fonts are free stand ins bundled in fonts/ (Inter and Instrument Serif, both OFL). No Hebbia logo, wordmark, or font files.
