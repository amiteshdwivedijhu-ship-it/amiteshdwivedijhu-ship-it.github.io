---
title: "Readme"
hook: "How to run it."
project: "10k-risk"
order: 6
source: "10K Risk Extractor/Artifacts/README.md"
---
# 10-K Risk Extractor

Every US public company files an annual report with a risk factors section: 20 to 50 pages of everything that could go wrong, written by lawyers, and mostly copied from last year. An analyst covering 30 to 80 companies cannot re-read all of it and cannot tell at a glance which few sentences are new.

This project is a working prototype that takes that section apart into individual claims, each tied to the exact sentences it came from, and marks which ones did not appear last year. It then grades itself against criteria written before any results existed.

## Read in this order

| Document | What it is | Read it for |
|---|---|---|
| [Case study](Case-Study-One-Pager.md) | The whole project on one page | Start here |
| [PRD](PRD.md) | What we build and for whom | The problem, the users, the core concepts, what is out of scope |
| [Metric design](Metric-Design.md) | Why these measurements and not others | How to tell a useful metric from a convenient one |
| [Eval summary](Eval-Summary.md) | A two-page read of the results | What was measured, and what failed |
| [Tradeoff memo](Tradeoff-Memo.md) | Quality, cost, speed, safety, reliability | Where the budget goes, and what each choice gives up |
| [Launch decision memo](Launch-Decision-Memo.md) | Ship or do not ship | The criteria written in advance, and the call |

## How to read the numbers

Every figure in these documents comes from one benchmark run, recorded once and never rerun. Every model response was stored, so the numbers can be checked again without re-running a model or spending anything. Which filings served as the controls was decided by plain text comparison across the filings, not by my guess about which companies recycle the most. My guess was wrong, and had I gone with it the false-alarm test would have run against the wrong companies.

## One line about this project

Zero invented quotations, 98.2% of claims supported by the sentence they cite, no false alarms on either filing where nothing had changed, and a run-to-run agreement number bad enough that I would not ship the alerting product.
