# Claims Review Copilot (concept prototype, synthetic data)

Concept prototype by Ami Dwivedi for a job conversation about the Product Manager, AI Healthcare Claims role at CVS Health.
Not a CVS Health or Aetna product. Not affiliated with or endorsed by CVS Health. No logos. All members, providers, claims, and metrics in the app views are synthetic. Public research numbers on the "Problems we solve" page link to their sources.

## What it is
An AI decision support console for claims processors and payment integrity teams. The copilot triages pended claims, explains its advice with evidence and a policy citation, and a human makes every decision. The AI never denies. Medical necessity calls go to a licensed clinician. Model changes ship only through an eval gate with fairness slices.

## Views
- Pulse: KPIs, pended inventory and handle time trends, adoption, ROI calculator.
- Work queue: 40 synthetic pended claims with copilot advice, confidence, prompt pay clock, appeal risk. Filter, search, sort. Cards on mobile.
- Claim detail: recommendation, "what would change my mind", evidence, policy cite, lines, prompt pay clock, appeal risk, decision panel with override reasons, provider notice preview, audit trail. Admin denials need a specific reason. Medical necessity denials are blocked.
- Denials and appeals: reason mix before and after, reason quality checker, second look list, CMS-0057-F prior auth clocks.
- Payment integrity: 5 leads with signal strength, next step, confirm or clear. Rules of the road.
- Model quality gate: live vs candidate, 6 gate checks, fairness slices, fix and rerun, sign off to shadow mode, override reasons, release history, how the harness works.
- Problems we solve: 12 cited research cards.
- Squad plan: north star, guardrails, 30 and 90 day plan, starter backlog, risks.

## 90 second path
Pulse, Work queue (sort by clock), open CLM-SYN-40231 and try to deny it (blocked), send to clinician, Denials (rewrite a vague reason), Payment integrity (clear a lead), Model quality gate (blocked on Medicaid slice, fix, sign off).

## Run
`python3 -m http.server` in this folder, or open index.html. No build step, no network calls, no API keys. State lives in localStorage. Reset demo is in the menu.

## Deploy (not done)
Copy this folder to `public/demos/cvs-ai-claims-copilot/`. All URLs are relative. Page is `noindex`.
