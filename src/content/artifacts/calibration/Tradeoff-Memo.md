---
title: "Tradeoff memo"
hook: "Two phrasings against two models, and why the phrasing pair wins."
project: "calibration"
order: 4
source: "Calibration Harness/Artifacts/Tradeoff-Memo.md"
---
# Tradeoff Memo: Rubric Lens

**The question this memo answers:** where does this product spend quality, cost, time, safety and reliability, and what does it give up in exchange?

Most of the trades here are unusual in one way: the scarce resource is not money or compute, it is **one product manager's attention for thirty minutes, once.** Every decision below is ultimately about whether something is worth a minute of hers.

Two terms recur. A **criterion** is one yes-or-no question a conversation is judged against. A **rendering** is one machine-facing phrasing of it, and every criterion gets two.


## 1. The trade the whole product is: certainty against reach

**Decision:** print no accuracy figure at all, and make printing one structurally impossible.

The reasoning is priced rather than asserted.

| What fifteen hours of hand labelling buys | What it does not fix |
|---|---|
| An accuracy estimate good to about plus or minus 8 points | A centre displaced by roughly 19 points, because the human read the model's evidence before deciding, and nothing measures the displacement |
| Thirty-seven hours gets to plus or minus 5 | Nor the fact that at a 3% firing rate most of a human's "yes" labels are themselves wrong |

Narrowing the smaller error around an unmeasured larger one is not caution, it is theatre. The variance was never the problem.

**What we give up, knowingly.** Any customer whose release process blocks on an evaluation score. That is a real, named, paying segment, and this product cannot serve it. Telling them "no ambiguity found across 300 conversations" instead of "91% precise" is a worse sentence to sell and a better sentence to have said.

**What it buys.** No labelled dataset, so the entry cost drops from weeks to one sitting, which is the entire product.

(The figures above come from the design review that killed the certifying version. They are inputs to a decision, not measurements from this project.)


## 2. Two phrasings against two models: identical cost, different action

**Decision:** spend the second half of the judging budget on a second phrasing of the same question rather than on a second model.

<pre class="mermaid">
flowchart LR
  q["One check, written by the product manager"] --&gt; a["Phrasing A"]
  q --&gt; b["Phrasing B"]
  a --&gt; j1["Asked three times"]
  b --&gt; j2["Asked three times"]
  j1 --&gt; d{"Do they agree?"}
  j2 --&gt; d
  d --&gt;|"yes"| ok["The question is well posed"]
  d --&gt;|"no"| fix["Rewrite the question. She can do this in ten seconds"]
</pre>

**Reasoning.** Both options cost the same. The difference is entirely in where the finding routes. Two models disagreeing tells her to change the model or accept the ceiling, and she chose neither model and can change neither. Two phrasings of her own question disagreeing tells her to rewrite her question, which is hers to do and nobody else's.

**What we give up.** Any read on whether a different model would do better. That question is genuinely interesting and it is not actionable by the one person in the room, so it does not get her budget.

**What survives of the second model.** It settles split answers, drawn from a different maker so its mistakes are less likely to be the same mistakes. That is a narrower job than judging and it removes the need for a second account, which was a setup cliff at the point in the product where people give up.


## 3. Speed against completeness: the eight-minute rule

**Decision:** the table has to be readable at minute eight, and nothing is allowed to push past it.

**Reasoning.** The product is that she gets the table before she gets bored. If provider rate limits threaten that, the remedies in order are: fewer conversations, fewer samples on checks already agreeing with themselves, and grouping several checks into one request for stable checks only.

**What we give up.** Statistical room. Three hundred conversations at a 10% firing rate gives a firing estimate good to about plus or minus 3.4 points. That is more than enough to separate workable from hopeless, which is the only decision it feeds, and nowhere near enough for anything else. Since nothing else is claimed, this costs nothing real.

**Unverified.** Nothing in the tool records wall clock, so whether the eight minutes holds at this scale is not known.


## 4. Cost: the estimate was wrong by three times before any code existed

**The plan:** about 7,800 model requests, $80 to $150 per run.
**The built shape:** about 23,400 requests on a run of 300 conversations with five rewrites.

| Stage | Requests | Why |
|---|---:|---|
| The main pass | 10,800 | 300 conversations, 6 checks, 2 phrasings, 3 samples |
| Raw against stripped | 3,600 | 100 conversations judged both ways, 6 checks, 3 samples |
| Re-measuring the rewrites | 9,000 | 5 rewrites, 300 conversations, 2 phrasings, 3 samples |

The error is instructive rather than arithmetic. The plan assumed the second phrasing would run only where the first produced a split answer. But agreement between phrasings is defined as the share of conversations where both phrasings agree, and you cannot compute that without asking both on every conversation. **The estimate contradicted the definition it was estimating.** It was wrong before anyone wrote a line of code, and it stayed wrong because nothing meters spend.

**What I would do.** Meter it, and reuse the main pass for the raw arm of the raw-against-stripped comparison, which currently re-asks 1,800 questions that were already asked with the same phrasing. Fresh samples are defensible; paying for them without noticing is not.


## 5. Safety: making one failure impossible instead of rare

**Decision:** de-identification runs entirely on the local machine, by rules, and never calls a hosted model.

**Reasoning.** Its whole purpose is keeping personal data away from hosted models. Sending the data to a hosted model to find the personal data defeats the purpose completely. An automatic check asserts that the module cannot reach a network at all, so this is a property of the design rather than a habit anyone has to maintain.

**Decision:** placeholders are typed and numbered, so the same person stays the same person.

**Reasoning.** Blacking everything out uniformly destroys the thread that most checks depend on. "Did the reply address the customer by name and then leak their account number" is unanswerable once both are the same black box.

**What this does not solve, and what it cost.** Rule-based de-identification is imperfect, which the report states to the user rather than implying away. On this run it was worse than imperfect in a specific way: a leading "as" was captured into company names, so "as Acme Insurance" and "Acme Insurance" became two different companies. Five organisations produced ten placeholders. The property that justifies the whole typed-placeholder design does not hold for organisations.

The comparison of raw against stripped conversations did not catch this, and it was not built to. It measures how far verdicts move, and on this material no check turned on which company it was, so the verdicts did not move. A measurement that comes back clean because nothing depended on the broken thing is not evidence that the thing works.


## 6. Reliability: the one part where the product does not take its own advice

The product's central claim to its users is that measuring the same thing twice and comparing the answers is the cheapest way to learn whether a measurement means anything.

This project ran once.

There is no second run, so no number in the report has a stability figure behind it. Everything the tool says about self-agreement and phrasing-agreement is a measure of the model's consistency on this material, and nothing measures the tool's consistency about that. That is the same mistake the product exists to prevent, made one level up, and I would close it before anything else on the cost side.


## 7. The human's minutes: where the real budget goes

| What she spends it on | Minutes | Why it earns them |
|---|---:|---|
| Pointing at data, pasting the rubric | 3 | Unavoidable |
| Confirming about six checks | 3 | The one step where the question itself can be wrong, and everything downstream assumes it is right |
| Reading the table | 4 | This is the product. If she leaves here, she still has it |
| Twelve disagreements at about 90 seconds each | 18 | Where her signal per minute is highest |

**The trade inside the twelve.** Eight are genuine disagreements, where the information is. Four are hidden honesty items drawn from conversations where everything agreed, and they exist solely to catch the models being confidently and identically wrong. Four of her twelve minutes are spent on items that will usually confirm what the machine already said. That is the price of being able to detect the one failure that would otherwise ship silently.

**And as built, those four minutes buy nothing.** On a consensus item, both rationales argue the same verdict, so there is no way to say the ensemble is wrong. The only key counted as an overturn means "the question itself is wrong," which is a different statement. Until the screen changes, the four honesty items are four minutes of her thirty spent on a defence that cannot fire.

**The number this all rests on.** Ninety seconds per disagreement. It has never been observed. If it is really three minutes, twelve items do not fit and the thirty-minute product does not exist.


## 8. Summary of positions

| Axis | Position | Basis |
|---|---|---|
| Certainty | No accuracy figure, enforced structurally rather than by policy | Priced: the bias is larger than the variance and is not identified |
| Diagnosis | Two phrasings, not two models | Same cost, and only one of them routes to an action she can take |
| Speed | Table readable at minute eight, everything else yields to that | The product is that she reads it before she loses interest |
| Cost | Unmetered, and the plan's estimate was wrong by three times | Derived from the run shape; the plan contradicted its own definition |
| Safety | De-identification cannot reach a network, by construction | Enforced and checked automatically |
| Personal data quality | Typed placeholders, and organisation references are currently broken | Measured directly: five organisations, ten placeholders |
| Reliability | One run, no repetition | The gap I would close first, because it is the product's own advice |
| Human budget | Twenty-eight minutes, of which four currently buy nothing | Measured design, unmeasured assumption |
