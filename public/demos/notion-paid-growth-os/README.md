# Growth Loop Console (prototype, sample data)

Independent prototype by Ami for a job conversation about the AI Product Manager, Growth Marketing role at Notion.
Not a Notion product. Not affiliated with or endorsed by Notion Labs, Inc. No Notion logo. All spend, users, tests, ads, and agents are sample data.

## What it is
A paid growth decision console. It turns geo, cohort, creative, and spend signals into tests, judges tests on cost per activated workspace with a W4 retention guardrail, keeps agent-written ads behind a creative quality bar, gates agent instruction changes with a replay against past human calls, and only moves more paid spend into the program when 6 checks pass.

## Views
- Pulse: KPIs, ranked "Needs you" list, agent activity, channels judged on quality.
- Signals: geo by channel heatmap (4 metrics), cell funnel, draft a test from a signal, persona cohort quality, hourly spend vs signups for LinkedIn EMEA.
- Tests: filter by stage, hypothesis, sample size calculator, experiment QA, 90% CI results by metric and segment, agent vs decision rule, decision with required reason.
- Creative bar: ad previews, rubric scores that update as you type, approve or pause, grader vs brand reviewer kappa.
- Agents: 8 agents with autonomy levels, Evaluator scorecard, proposed instruction changes with a replay gate.
- Budget gate: share slider, forecast, guardrails, Strat Fin sign-off, 6 checks, graduate, memo and CSV downloads.

## 90-second path
Pulse, kill E-102 (cheap signups, weak retention), decide E-101 and E-105, fix live ad C-03, add a 15% daily cap to Budget pacer v8 and promote, then graduate to 40% with ChatGPT ads kept in the test budget.

## Run
Open index.html, or `python3 -m http.server` in this folder. No build step, no network calls, state in localStorage (Reset demo clears it).

## Deploy (not done)
Copy this folder to `public/demos/notion-paid-growth-os/` in the portfolio repo. Unlisted, `noindex`.
