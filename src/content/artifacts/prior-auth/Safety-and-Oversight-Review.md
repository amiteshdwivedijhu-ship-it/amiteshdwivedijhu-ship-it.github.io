---
title: "Safety and oversight"
hook: "Six hazards, and the human in the loop each one requires."
project: "prior-auth"
order: 5
source: "Prior Auth Agent/Artifacts/Safety-and-Oversight-Review.md"
---
# Safety and Oversight Review: Prior Auth Agent

**Purpose:** name the ways this system can cause harm, say what stops each one, and identify the controls that are not working.

**Scope note:** this is a prototype built on synthetic and public data. It is not deployed and no real patient is affected. The review is written as though one were, because that is the only useful way to write one.

The system answers, for each criterion in a payer's coverage policy, whether the patient's chart satisfies it. Three answers are allowed, and the words are the payer's own: **met** (the chart shows the criterion is satisfied), **unmet** (the chart shows it is not), **non-determinable** (the chart is silent, so no honest answer is available).


## 1. Who can be harmed

| Party | How |
|---|---|
| The patient | A denial caused by a weak or wrong request delays care |
| The patient | A request that overstates the record sets up a later audit or a reversal of coverage |
| The physician | Signs a document containing a claim the chart does not support |
| The practice | Submits unsupported claims at volume, which is a compliance exposure |
| The payer | Receives requests that misstate the record |

The physician is the one who carries the risk of the model's mistake. Everything below follows from that.


## 2. The harm model, ranked

*Hazards are numbered HZ1 to HZ6. They are not the same thing as the six predictions numbered H1 to H6 in the evaluation documents, which are a separate and unrelated numbering.*

### HZ1. Claiming a criterion is satisfied when the chart does not show it

- **Severity:** highest. This is an unsupported clinical claim inside a signed document. It is the failure this entire project is organized around.
- **Control:** a hard gate. Of every criterion the system calls met, at least 0.95 must really be met, and because the sample is small, the honest worst case must still sit above 0.90.
- **Status: FAILING.** The best measured value is 0.939, with the true value somewhere in [0.879, 0.970]. In that configuration, 7 of 114 criteria called met are wrong against the reference answer, which is the correct answer recorded in advance.
- **Decision:** the gate does not move. The system does not ship on these numbers.

### HZ2. Invented evidence: quoting a chart sentence that is not in the chart

- **Severity:** highest. Fabricated evidence inside a medical document.
- **Control:** enforced automatically, not by asking the model to behave. The scoring step finds every quoted sentence in the original chart itself. Anything it cannot locate word for word is thrown away, and a met determination left with no surviving quotation is downgraded to non-determinable. The system cannot invent a quotation, because an invented quotation would not be there to find.
- **Status: PASSING at 1.000 on all six configurations, by construction.**
- **Evidence the control is real:** it caught a bug that made every citation in excerpt-reading mode point at the wrong place. The gate read 0.000 and the bug could not be missed.

### HZ3. Silence read as denial: a chart that says nothing treated as a chart that says no

- **Severity:** high. This is how a patient gets an unmet for something nobody happened to write down.
- **Control:** non-determinable is a real answer with equal standing, not a fallback for when the system gives up.
- **Status: working, and tested by a genuine disagreement.** The single labeling conflict in the entire real-notes slice turned on exactly this: does an unremarkable functional exam license an unmet? It was settled as non-determinable. Preserved gait and range of motion on one exam do not rule out pain interfering with daily activities, and the note never addresses daily activities. On real notes the system declines to answer 16% of the time and is right to decline 87.5% of those times.

### HZ4. Over-commitment: reading "the policy does not forbid this" as "the record shows this"

- **Severity:** medium to high. It is a quieter version of HZ1.
- **Observed:** under Medicare's non-binding "usually 3 months" wording, the system returned met where the reference answer says non-determinable. It read the non-binding language correctly and then took one step past the evidence.
- **Control:** none specific today. This is an open defect.

### HZ5. Clinical judgment answered by arithmetic

- **Severity:** medium to high. A criterion that needs a clinician's reasoning gets settled by a subtraction.
- **Control:** the step that sorts criteria into plain comparisons and judgment calls is deliberately biased toward judgment. Sorting a judgment call into arithmetic is unsafe. Sorting arithmetic into the model is only wasteful.
- **Status: partially failing.** It found every criterion that genuinely is plain arithmetic, 1.000 of them, but 5 judgment calls were sorted into arithmetic anyway, so only 0.800 of what it sent to arithmetic belonged there. That was named as the dangerous direction before the run, and it is the direction that happened.

### HZ6. A warning that fires on everything

- **Severity:** medium, and badly underrated.
- **Observed:** the check that runs before a request leaves the system marked 58.7% of clinical claims as unsupported and put a review-required banner on 100 of 100 requests. 89.2% of the cheap first-pass rejections were of citations that the reference answer considers valid.
- **Why this is a safety failure and not an annoyance:** a warning that fires on everything carries no information. Nothing in it separates the request that needs attention from the 99 that do not. Reviewers learn to click past it, and once they do, the banner protects nobody. It is operationally identical to having no check at all, with the added cost that it looks like protection.
- **Fix:** the cheap first pass either stays silent when it wants to reject, or it is replaced, and the large model sees every claim it would have rejected.


## 3. The oversight model

A physician signs every request. That is the primary control and it is not optional.

Four supporting controls make that review real rather than ceremonial:

- Every met determination shows the verbatim chart text it rests on, not a paraphrase. The reviewer checks the evidence, not the system's summary of it.
- Every gap is named, along with the documentation that would close it. Measured: 42 of 47 of these hints (89.4%) name documentation that would actually resolve the criterion, 5 partial, 0 wrong.
- Flagged claims stay in the document, marked, under a banner naming how many there are. They are never silently removed, so a reviewer sees what the system doubted.
- The overall yes or no follows the policy's own rule for combining criteria, so a reviewer can check both the reasoning and the verdict.

**What breaks this model:** flagging everything. See HZ6. The oversight design is sound and the current configuration of the check destroys it.

<pre class="mermaid">
flowchart TD
  draft["Drafted request"] --&gt; gate["Every claim checked against the chart sentence it cites"]
  gate --&gt; flagged["Doubted claims kept in the document and marked"]
  flagged --&gt; evidence["Verbatim chart text shown for every claim"]
  evidence --&gt; gaps["Missing documentation named, with what would close it"]
  gaps --&gt; physician["Physician reads and reviews"]
  physician --&gt;|"Signs"| send["Signed request goes to the payer"]
</pre>


## 4. Protecting patient data

No real patient identifying information exists anywhere in this project. That is a design property, not a promise, and here is what enforces it.

- The main corpus is fictional patients, generated by a tool that produces realistic but entirely invented medical records. Each one is built from a written specification, so the correct answer for every criterion is known without anybody labeling anything.
- The small slice of real dictated notes comes from a public collection of physician dictations with patient details already removed at the source.
- Even so, the text of those notes is never stored by this project. What is kept is the note's position in that public collection, its length in characters, and a fingerprint: a short code that changes if even one character changes. That is enough to fetch the same note again later and prove it is the same note. It is not enough to reconstruct a single word of it.
- The working demo runs with nothing leaving the machine. No account credentials, no outbound calls, no network.

The reasoning is simple. A project that never holds real patient text cannot leak real patient text, and no amount of careful handling beats not having it.


## 5. Scope boundaries that are safety boundaries

- The system never claims a request will be approved. It states what the record supports. Predicting a payer's decision would invite people to rely on it in a way the evidence cannot carry.
- No autonomous submission. A physician signs.
- No patient-facing output. Nothing here is written for a patient to read.
- One service line only, knee arthroplasty. No claim of generalization, and nobody should extend it to a new service line without measuring again from scratch.


## 6. What I do not know, and would need before deployment

- **Whether any of this holds under clinician labels.** No label in this project is validated by a clinician, except the grader calibration. Every accuracy number rests on labels that were generated by a model or fixed by construction.
- **Whether the labeling agreement number means anything.** The two labelers agree at 0.982, on a scale where 1.0 is perfect. They come from the same model family. Two physicians on a public medical benchmark agree at about 0.38. A score of 0.98 on terse dictated notes almost certainly measures shared blind spots rather than shared correctness.
- **Whether real charts behave like these charts.** Accuracy drops 13.8 points on five real notes, from 0.958 on the synthetic corpus with hand-verified criteria to 0.820. Five notes are too few for a conclusion, but enough to raise a warning.
- **Whether anything generalizes past one procedure.** No evidence in either direction.
- **What a real reviewer does with the output.** No usability testing, no measurement of how long review takes, no measurement of whether reviewers catch the errors the system makes.


## 7. Summary

| Control | Status |
|---|---|
| Citations must exist in the chart, enforced automatically | Working |
| Precision gate on met determinations | **Failing on every configuration** |
| Non-determinable as a real answer | Working, and validated by a genuine disagreement |
| Bias against settling judgment calls with arithmetic | Partially failing, 0.800 of what went to arithmetic belonged there |
| Claim check before output | **Failing, flags 100% of requests** |
| Physician sign-off | Sound in design, undermined by the check above |
| Gaps named with what would close them | Working, 89.4% |
| No patient identifying information, no approval claims, no autonomous send | Holding |

Two of the three technical safety controls are failing, and the one that works does so by construction rather than by observation. The system does not ship.
