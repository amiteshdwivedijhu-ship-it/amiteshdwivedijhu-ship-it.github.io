---
title: "Readme"
hook: "How to run it."
project: "prior-auth"
order: 7
source: "Prior Auth Agent/Artifacts/README.md"
---
# Prior Auth Agent

A patient needs a knee replacement. The insurer will not schedule it without proof that this patient meets its coverage criteria. Those criteria sit in a PDF on the payer's website. The proof, if it exists, is scattered across the chart. Someone in the practice has to connect the two, one criterion at a time, while the patient waits.

This project built an agent that does that connecting and drafts the request a physician signs, then measured whether it can be trusted to. The answer was no. These seven documents are the reasoning and the evidence.

## Read in this order

| Document | What it is | Read it for |
|---|---|---|
| [Case Study](Case-Study-One-Pager.md) | The whole project on one page | Start here |
| [PRD](PRD.md) | Product requirements | The problem, the users, the core vocabulary, the scope boundaries, the success measures |
| [Metric Design](Metric-Design.md) | Why these measures and not others | How the bars were chosen, and which numbers I do not trust |
| [Eval Summary](Eval-Summary.md) | A two-page digest of the results | What was measured, what passed, what failed |
| [Tradeoff Memo](Tradeoff-Memo.md) | Quality, cost, speed, safety, reliability | The positions taken, each one tied to a measured number |
| [Safety and Oversight Review](Safety-and-Oversight-Review.md) | The harm model and the controls | Who gets hurt, what stops it, which controls are failing |
| [Launch Decision Memo](Launch-Decision-Memo.md) | Ship or do not ship | The bars, the call, and what would change it |

## How to read the numbers

Every bar, every prediction, and every measure definition was fixed before the run and could not be edited afterward. Nothing was redefined once results were in.

Each criterion gets one of three answers, in the payer's own words. **Met** means the chart shows the criterion is satisfied. **Unmet** means the chart shows it is not. **Non-determinable** means the chart is silent, so no honest answer is available.

## The result in one paragraph

Every quoted sentence the system offers as evidence genuinely exists in the chart: 1.000 on all six test configurations, by construction rather than by luck. Determination accuracy on fictional charts is 0.958 when the criteria checklist was verified by hand and 0.930 when the system pulled the checklist itself. But the gate that decides whether this is a product, how often a criterion called met really was met, missed its bar of 0.95 on all six configurations, best result 0.939 [0.879, 0.970]. The safety control built to catch what that gate misses flagged 100 of 100 requests, which is operationally the same as having no gate. The call is no ship.
