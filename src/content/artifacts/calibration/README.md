---
title: "Readme"
hook: "How to run it."
project: "calibration"
order: 6
source: "Calibration Harness/Artifacts/README.md"
---
# Rubric Lens

A product manager owns what "good" means for an AI feature. Her definition lives in a document with about eight bullets in it. To find out whether an AI model can score those bullets automatically, the standard answer is to hand-label a few hundred conversations first, and that dataset is exactly what her team says it cannot afford to build or maintain.

This project takes a different question. Instead of asking how accurate a judge is, which needs labels, it asks whether each check is answerable at all, which does not. Ask the same question two honest ways and see whether the answers agree. Ask it three times and see whether it agrees with itself. Count how often it fires. Those numbers say most of what a labelled dataset would have said about whether a check is worth automating, and they cost nothing but model calls.

**It was built, it was run end to end against a real provider, and it is not approved for launch.** The half that reads conversations and produces the table works. The half the product actually is, eighteen minutes of one person's attention, has never been run by a person, and one part of it cannot do its job as designed.

## Read in this order

| Document | What it is | Read it for |
|---|---|---|
| [Case study](Case-Study-One-Pager.md) | The whole project on one page | Start here. The problem, the four decisions, the results, the call |
| [PRD](PRD.md) | What was being built and for whom | The problem, the user, the vocabulary, why the product refuses to print an accuracy number |
| [Metric design](Metric-Design.md) | Why these measurements and not others | How you measure a question instead of an answer, and where that method is blind |
| [Eval summary](Eval-Summary.md) | Two pages of results | What ran, what the six checks measured, and the six defects |
| [Tradeoff memo](Tradeoff-Memo.md) | Quality, cost, speed, safety, reliability | Where the budget goes, including the budget that matters: one person's thirty minutes |
| [Launch decision](Launch-Decision-Memo.md) | Ship or do not ship | The rules written before the build, and the call |

## How to read the numbers

Every figure comes from one run on 2026-08-27 against a real provider, plus 61 automatic checks and a set of measurements that need no provider at all. **The conversations were machine-generated for this project, so every firing rate in the table is a property of that material and not a finding about any real support agent.** What is being evaluated here is the tool.

Cost and wall clock are absent because nothing in the tool records them. That is reported as a gap rather than filled with an estimate.

## One line about this project

Five of six rules written before the build survived it, the tool ran end to end and produced everything it promised, and it still should not ship: the rewrite engine mislabelled three of its own five outputs as successes, the one sentence whose exact wording carries the product's honesty becomes false at any size but the default, and the four hidden checks that were supposed to be the only defence against the failure this design names as its main risk cannot express that failure through the screen I drew for them.
