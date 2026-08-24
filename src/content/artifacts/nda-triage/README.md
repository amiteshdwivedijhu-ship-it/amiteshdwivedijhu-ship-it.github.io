---
title: "Readme"
hook: "How to run it."
project: "nda-triage"
order: 6
source: "NDA Risk Extractor /Artifacts/README.md"
---
# NDA Triage

A system that reads an inbound non-disclosure agreement, compares it against the company's own written positions, and decides who, if anyone, has to read it. It routes attention. It does not rewrite contracts.

**It was measured, and it was not approved for launch.** No model tested clears the bar on the failure that matters, which is missing a clause severe enough to be unacceptable. Three kill criteria were written down before any measurement was taken, and one of them was breached outright.

## Read in this order

| Document | What it is | Read it for |
|---|---|---|
| [Case study](Case-Study-One-Pager.md) | The whole project on one page | Start here. The problem, the decisions, the results, the call |
| [Product requirements](PRD.md) | What was being built and for whom | The problem, the users, the core concepts, the scope boundaries, why the two ways of being wrong are not equally bad |
| [Metric design](Metric-Design.md) | Why these measurements and not others | Why absence is the headline, why no model is ever allowed to grade another model here, the planted test cases, and honest denominators |
| [Evaluation summary](Eval-Summary.md) | A two-page digest of the results | What was measured, what failed, and what it cost |
| [Tradeoff memo](Tradeoff-Memo.md) | Quality, cost, latency, safety, reliability | How deep the agent should search, the five-model comparison, and why each stage uses a different model |
| [Launch decision memo](Launch-Decision-Memo.md) | Ship or do not ship | The kill criteria written in advance, the call, what gets killed, and what held up |

## How to read the numbers in these documents

- Everything reported comes from the 61-document development set. The 123-document test set was kept locked away as an honest final exam and was never touched.
- Every figure traces to a recorded run and to a running log of spend that cannot be edited after the fact. Nothing here is an estimate unless it is labeled as a projection.
- Spending was capped at $50 before the work started. The project used $21.83 of it, and the cap was never what stopped anything.
- The evaluation rests on three choices made and written down in advance: no model ever grades another model's output; the company's positions run as fixed rules rather than living in a model's instructions; and the system judges six clause categories chosen for what they test, rather than the seventeen a public research collection happens to offer.
- The correct answers come from public expert-annotated contract collections, so nothing was hand-labeled by the author. Mapping those labels onto this product's six clause categories loses some of them, and the metric design note names exactly which ones and what that costs.

## The one-line version

On real NDAs, 0.983 of its absence claims are correct and it finds 0.792 of the clauses that really are missing: right 98.3% of the time when it flags something, catching 79.2% of what is genuinely gone. It still does not ship: no model tested clears the bar on missing an unacceptable clause, 0 of 10 tests that hide the evidence where the agent must go look were passed, and 6 of those 10 failures were right answers the agent reached without ever looking.
