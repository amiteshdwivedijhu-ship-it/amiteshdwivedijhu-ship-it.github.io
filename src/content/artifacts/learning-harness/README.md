---
title: "Readme"
hook: "How the prototype, evidence, and documents fit together."
project: "learning-harness"
order: 6
source: "Learning Harness/Artifacts/README.md"
---
# Reasoning Atlas

An AI agent harness turns a model's raw reasoning into reliable multi-step work. Reasoning Atlas is the same idea aimed at a person: turn a model's raw reasoning into reliable learning of one hard, interlocking topic. The unit of the system is a **principle with a boundary** — the rule, the edge where it stops holding, and the case aimed at that edge. The learner meets a case cold, reasons in free text, gets probed, gets a diagnosis that quotes their own words, and only then sees the rule.

This prototype runs entirely at localhost. Nothing ships to a learner until the gates in the launch memo close.

## Read in this order

| Document | What it is | Read it for |
|---|---|---|
| [Case study](Case-Study-One-Pager.md) | The whole project on one page | Start here |
| [PRD](PRD.md) | What we build and for whom | The problem, the vocabulary, the loop, slice 1 scope |
| [Metric design](Metric-Design.md) | Why these measurements and not others | Recall on `right_answer_wrong_reason` — the one number a quiz app cannot produce |
| [Eval summary](Eval-Summary.md) | The recorded evidence | The 95/95 suite, the 17-defect QA pass, and the first recorded calibration run |
| [Tradeoff memo](Tradeoff-Memo.md) | Quality, cost, honesty, reliability | The single-family grader trade, the transfer-case spend, the honesty gates |
| [Launch decision memo](Launch-Decision-Memo.md) | Ship or do not ship | The pre-written criteria, the recorded baseline, and the call — do not ship yet |

## How to read the numbers

- **The summary's grader number is one recorded run:** 2026-08-28, 15 fixtures, budget transport (`z-ai/glm-5.3-flash`), report stored at `calibration/results/2026-08-28-budget-glm-5-3-flash.json`. It is a baseline about the process, not a verdict on the pinned grader (`grader-v4`, claude-opus-5) — that run is the pending measurement and the one the launch gate waits on.
- **The QA numbers are one recorded pass:** 2026-08-27, deterministic replay plus live browser walk, 17 defects logged at `docs/qa/2026-08-27-ui-workflow-qa.md`. QA-001/QA-002 fixed since; QA-003/004/013/017 open.
- **The suite is automated and green:** 95/95 vitest tests.
- The live database holds 6 purposes, 6 maps, 91 nodes, and **zero sessions** — real-learner verdicts are the missing dataset, and QA-017 is the blocker.

## One line about this project

A drafting-and-grading harness that catches the learner who is right for the wrong reason — built, measured, and told no: the first recorded grader baseline found that trap only 1 in 5 times on the budget transport, four P1 gates still let the system misdescribe its own state, and the decision is to keep the harness local until both are fixed and the first real learner runs.

_Sources for every claim: `docs/qa/`, `docs/adr/`, `docs/superpowers/specs/`, `calibration/cases/`, `calibration/results/`, the test suite, and the live SQLite stores._