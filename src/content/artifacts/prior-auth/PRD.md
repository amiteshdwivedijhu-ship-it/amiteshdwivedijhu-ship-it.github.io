---
title: "PRD"
hook: "What the agent is for, what it refuses to do, and why non-determinable is a first-class answer."
project: "prior-auth"
order: 1
source: "Prior Auth Agent/Artifacts/PRD.md"
---
# PRD: Prior Auth Agent

**Owner:** Amitesh Dwivedi (Product)
**Status:** Prototype built and measured. The gate that decides whether this is a product was missed on every configuration. See the launch decision memo.
**Last updated:** 2026-08-22


## 1. One line

A provider-facing agent that reads a patient's chart, reads the payer's coverage policy, decides which criteria the record actually supports, and drafts an evidence-cited prior authorization request that a physician signs.


## 2. The problem

A patient needs a knee replacement. The insurer will not schedule it without proof that this patient meets its coverage criteria: how many weeks of conservative therapy were tried, what the imaging showed, whether pain interferes with daily activities. Those criteria live in a PDF on the payer's website. The proof, if it exists, is scattered across the chart. Someone in the practice has to connect the two, one criterion at a time, while the patient waits.

- Every payer writes its own criteria. Medicare writes different ones again.
- The same evidence can be enough under one policy and short under another, and the difference is often one word ("must" versus "usually").
- Denials are frequently about missing documentation, not missing care.

The obvious build is to hand both documents to a language model and let it write. The failure mode to design against is not "the model wrote a bad letter." It is "the model claimed a criterion was met when the chart does not show it," under a physician's signature, sent to a payer. Everything below follows from that one sentence.


## 3. Who this is for

- **Users:** prior auth staff, medical assistants, and the physician who signs the request
- **Buyers:** provider groups, health systems, specialty practices with high prior auth volume
- **Not the user:** the payer. This is provider-facing, and that shapes every default
- **Not the user:** the patient. No patient-facing output at all


## 4. Scope

In scope

- One service line: knee arthroplasty
- Six real published policies: Aetna, Cigna, Kaiser Permanente WA, Premera, Medicare L39911, Providence
- Fictional patient charts generated from written specifications, plus a small held-out slice of real dictated notes
- Output: a structured, evidence-cited prior authorization request with a verdict on each criterion

Out of scope

- Any claim that a request will be approved. The system states evidence, never outcomes
- Autonomous submission. A physician signs
- Real patient identifying information. Everything is fictional or public
- Generalization beyond knee arthroplasty. No claim is made


## 5. The vocabulary

Five ideas do all the work. Getting these right is upstream of every number in the evaluation.

- **Policy:** one published document stating when a payer covers a service.
- **Criterion:** one individually checkable condition inside a policy. This is the atomic unit the system reasons about.
- **Criteria checklist:** the flat list of criteria for one policy and service, each with its own identifier.
- **Combining rule:** how the criteria add up to a yes or no, for example "A and B, plus at least two of C through F." Held beside the checklist rather than folded into it, and scored on its own.
- **Determination:** the verdict on one criterion. One of three answers, using the payer's own vocabulary. **Met** means the chart shows the criterion is satisfied. **Unmet** means the chart shows it is not. **Non-determinable** means the chart is silent, so no honest answer is available.

Two supporting ideas:

- **Supporting quotation:** the exact chart sentence a determination points to, recorded with its position so it can be checked against the original.
- **Check type:** whether a criterion is a plain factual comparison ("is the patient over 18") or needs clinical judgment over written notes.

The checklist is flat by design. One criterion produces exactly one determination, so there is never a question about what counts as one answer.


## 6. Product decisions worth defending

**Non-determinable is a first-class answer, not a failure.**

- A silent chart is not a negative chart. Reading absence as "unmet" is a real harm to a patient.
- The one labeling disagreement in the whole held-out real-note slice turned on exactly this, and it was settled as non-determinable.

**Check type is biased toward needing judgment.**

- Treating a criterion as a plain comparison when it actually needs clinical judgment sends that judgment to arithmetic. That is unsafe.
- Erring the other way merely wastes money.
- Measured: it found every criterion that genuinely was a plain comparison, a perfect 1.000. But of the criteria it called plain comparisons, only 0.800 really were: five judgment calls were sent to arithmetic. That is the dangerous direction, and it was named as the dangerous direction before the run.

**Evidence is verified by the system, not requested from the model.**

- The scoring step goes back to the original chart text and finds the quoted sentence itself, rather than trusting the model's word for it.
- Any quotation it cannot find word for word is discarded.
- A met determination left with no surviving quotation is downgraded to non-determinable.
- The system can only point at sentences that exist in the chart, so it is not able to invent a quotation. Result: this measure reads 1.000 on all six configurations, by construction.

**Gaps are stated, never omitted.**

- When a criterion is non-determinable, the output names the documentation that would settle it.
- Measured: 42 of 47 named gaps (89.4%) name documentation that would genuinely settle the criterion. 5 partial, 0 wrong.

**The system never claims approval.**

- The output states what the record supports. It does not predict a payer's decision.


## 7. How it works, end to end

1. The user picks a patient.
2. The user confirms the payer policy and the service.
3. **Step 1, read the policy:** turn the policy document into a flat criteria checklist plus the rule for combining them.
4. **Step 2, read the chart:** decide met, unmet, or non-determinable for each criterion, with a quoted chart sentence behind every met.
5. **Step 3, check the evidence:** before anything leaves the system, confirm that each quoted sentence genuinely supports the claim made about it, rather than merely sounding related. This happens in three steps: first, confirm the quoted sentence actually exists in the chart; second, a small model running on ordinary hardware, at no cost per check; third, for the cases the small model is unsure about, a large language model kept separate from the one that drafted the claim, so the checker cannot repeat the drafter's mistake.
6. **Step 4, draft the request:** compose it with the verdict on each criterion, the verbatim quotations, the combined result, the named gaps, and a review-required banner if anything was flagged.

<pre class="mermaid">
flowchart LR
  policy["Payer's published policy"] --&gt; s1["Step 1: read the policy into a criteria checklist"]
  chart["Patient chart"] --&gt; s2
  s1 --&gt; s2["Step 2: decide each criterion against the chart"]
  s2 --&gt; t0["Check 1: the quoted sentence exists in the chart"]
  t0 --&gt; t1["Check 2: small model, no cost per check"]
  t1 --&gt; t2["Check 3: independent large model for unsure cases"]
  t2 --&gt; s4["Step 4: draft the request"]
  s4 --&gt; md["Physician review and signature"]
</pre>


## 8. Success metrics

Gates, meaning pass-or-fail bars reported before any usefulness metric.

| Gate | Bar | Why this bar |
|---|---|---|
| met-precision: of the criteria called met, how many really were | 0.95 or higher, and the honest worst case given the sample size still above 0.90 | Each error is an unsupported clinical claim sent to a payer under a physician's signature |
| Grounded citation: every quoted sentence exists in the chart | Exactly 1.00 | A citation that does not exist in the chart is not a partial failure |

Usefulness metrics

- Determination accuracy, reported separately for fictional charts and real notes, never averaged together
- met-recall: how many genuinely met criteria the system finds, since missed criteria mean unnecessary denials
- How often the system declines to answer, and how often declining was right
- How well the criteria checklist pulled from a policy matches one verified by hand
- Cost, counted as model calls per case

Reporting rules, set before the run

- Every rate carries an honest range and a stated denominator
- No usefulness metric offsets a missed gate
- If a gate is missed, the finding is that the system missed the gate. The gate does not move


## 9. Non-functional requirements

- **Privacy:** no real patient identifying information anywhere. The real-note text is never stored, only its position in the source, its length, and a fingerprint that changes if a single character changes, so the same source can be re-fetched and verified without the text ever being kept.
- **Reproducibility:** the model's answers were recorded once and are replayed, so the same run reproduces exactly and for free. Nothing calls out to a live model and nothing leaves the machine.
- **Auditability:** every number in the evaluation traces back to a saved record of the run that produced it.
- **Oversight:** a physician signs every request. See the safety and oversight review.


## 10. Open questions

- Can the small on-device checker be replaced or reconfigured so it stops rejecting correct citations?
- Does the fictional corpus need rebuilding to contain genuine ambiguity? Only 2 of 402 correct answers are non-determinable, so there is almost nothing to abstain correctly about.
- Would a second model family change the labeling agreement number, which is currently suspiciously high?
- Does anything here generalize past knee arthroplasty?
