---
title: "PRD"
hook: "Triage, not review: who needs to read this NDA, and who does not."
project: "nda-triage"
order: 1
source: "NDA Risk Extractor /Artifacts/PRD.md"
---
# PRD: NDA Triage

**Owner:** Amitesh Dwivedi (Product)
**Status:** Built and measured on the 61-document development set. Not approved for launch at any autonomy setting. See the launch decision memo.
**Last updated:** 2026-08-23


## 1. One line

Compare an inbound NDA against the company's own written positions and decide who, if anyone, has to read it.


## 2. The problem

A mid-size company signs hundreds of non-disclosure agreements a year and one in-house lawyer reviews most of them. Every one of those documents is blocking somebody. Sales wants it signed today because it gates a first meeting. NDAs are the highest volume and lowest status contract in the building, and nobody's career advances by reading one carefully.

So they get skimmed, or rubber stamped, or they sit for a week while somebody escalates.

**Why the existing tools do not solve it.** Each obvious approach fails for a specific reason, not a vague one.

- Searching for dangerous words misses paraphrase. The same duty gets drafted a hundred ways.
- Comparing against our template flags formatting, not risk.
- A risk score strips out the traceability that makes an answer safe to act on. The reviewer cannot approve a number. She can approve a sentence.
- Risk is not a property of a clause. The same term is fine in one deal and unacceptable in another. A tool that does not take the deal itself as an input is guessing.

**And the hardest part is absence.** A missing carve-out is more dangerous than a harsh clause, because there is nothing on the page to look at. It is exactly what searching cannot find. You cannot search for a sentence that is not there.


## 3. Who this is for

**Primary users**

- In-house counsel who are the single reviewer for hundreds of inbound NDAs a year
- Legal operations leaders who own cycle time and cost per contract
- Contract managers and paralegals who do first-pass review without authority to approve deviations

**Secondary users**

- Sales and business development, the internal customer waiting on a signature
- Procurement, handling inbound vendor NDAs at volume

**Users we deliberately design against**

- Outside counsel. They bill for this review. Automating it cuts their revenue.
- Individuals signing employment NDAs. A real need, but giving legal guidance to consumers is regulated practice, so it is the wrong first market.

**Who carries the risk**

The company that signs a bad NDA, and the lawyer who approved it. The user and the risk-bearer are the same person. That is why a human approver is not negotiable here, and why adoption depends on trust rather than on accuracy alone.


## 4. This is a routing product, not a redlining product

| | Routing product (this) | Redlining product (not this) |
|---|---|---|
| Question it answers | Who needs to read this? | What should this say instead? |
| Output | Auto-approve, flag, or escalate | Proposed contract language |
| Unit of value | Reviewer attention saved | Draft text produced |
| Failure that matters | A bad NDA routed as clean | Awkward wording |
| Who approves | Always a human | Always a human |

We do produce a Negotiation Plan that names the deviations worth fighting for. We do not write the replacement clause. Drafting is a different product with a different liability profile.


## 5. The core concepts

Eight ideas carry the whole product. Each one exists because collapsing it into another one would hide a failure.

| Concept | What it is | Why it exists on its own |
|---|---|---|
| **Clause Type** | One of six provision categories the system reads and rates: mutuality, how long confidentiality runs after the agreement ends, the definition of confidential information, non-compete and non-solicit riders, intellectual property assignment, and governing law | Six chosen for what they test, not for coverage. Each one exercises a different severity rating |
| **Carve-out** | An exclusion from the confidentiality definition: information already public, independently developed, rightfully received from someone else, or disclosed because a court or regulator compelled it | Carve-outs are where absence bites. The definition is judged by which of the four are there |
| **The quoted passage** | The exact sentences in the NDA that a finding points to | Every finding carries one or it is a fabrication. This is what makes an answer checkable |
| **Playbook** | The company's written position on each Clause Type, conditional on the deal, compounding when several clauses go wrong at once | Not a lookup table. It runs as fixed rules, so a severity rating is a definition rather than a prediction |
| **Deal Context** | The four facts about the deal that are not in the document: which side we are on, what kind of information is being shared, who the other party is, and how much bargaining power we have | Supplied at intake, never guessed from the document |
| **Tier** | The severity rating for one Clause Type: acceptable, negotiable, or unacceptable | Set by our side, the information type, and the counterparty. **Never moved by bargaining power.** A bad clause is bad whether or not we can win the fight |
| **Absence Finding** | A determination that an expected Clause Type or Carve-out is missing | Produced by a dedicated pass, never as a leftover of the reading stage. Absence is not "nothing came back" |
| **Shadow Judge** | An agent that reads the NDA alongside the rules and reports risks the Playbook does not model | Covers what the rules do not. It judges the contract, never our own output, and it never overrides a routing call |

Two more fall out of the model:

- **Routing Decision:** auto-approve, flag, or escalate. A function of the severity ratings plus bargaining power. It is not a risk score.
- **Termination State:** how the Absence Detector stopped. Either it searched everything it meant to and finished, or it hit its cap on search steps first. Hitting the cap means the document was not fully checked, and that blocks automatic approval whatever was found. This is a completeness signal, not a confidence number.


## 6. What gets built

<pre class="mermaid">
flowchart LR
  ingest["Take in the document"] --&gt; extract["Read it and pull out the six clauses (model)"]
  extract --&gt; normalize["Tidy the answers into consistent form"]
  normalize --&gt; tier["Rate each clause: acceptable, negotiable, unacceptable"]
  extract --&gt; absence["Absence Detector: prove what is missing (agent)"]
  extract --&gt; shadow["Shadow Judge: risks the rules do not model (agent)"]
  absence --&gt;|"what is missing"| route["Decide who has to read it"]
  shadow --&gt;|"unmodeled risk"| route
  tier --&gt; route
  route --&gt; plan["Build the Negotiation Plan"]
  plan --&gt; decision["Auto-approve, flag, or escalate"]
</pre>

Everything from tidying-up onward is fixed rules. The system uses an open-ended agent exactly twice, and only where the task genuinely is open-ended.

- **Proving a clause absent** takes an unknown number of steps. You have to look up what the defined terms mean, follow cross-references, check the exhibits, and only then conclude that nothing in the document satisfies the requirement. That cannot be done in a fixed number of steps.
- **"What is wrong here that our Playbook does not model"** is open-ended by definition.
- Everything else is rule application and stays in code.

Deal Context has four variables and 144 combinations. The reading stage does not depend on the deal, so a document is read once and the rules are then replayed over all 144 combinations at zero additional model cost. That is why testing how the product behaves across every deal situation is the cheapest measurement in the entire evaluation.


## 7. Product decisions worth defending

**Judgment lives in fixed rules, not in the model's instructions.**

- With the Playbook running as rules, a wrong routing call is provably one of three things: the reading, the tidying-up, or the rule. With the Playbook living in the model's instructions it is unattributable, and every debugging conversation becomes an argument.
- The compounding rules apply a three-way interaction identically to every document. Code is reliable at that. Models are not.
- If the rules are mechanical, there is no such thing as "playbook accuracy" to measure. Severity ratings get automatic checks, not hand-labeled correct answers. Only the reading and tidying-up stages need ground truth, and public contract collections already supply exactly that. The project needed no hand-labeling at all.

**Autonomy is scoped by the deal, not by a score.**

- Automatic approval is permitted only in deal situations declared eligible in advance. 81 of 144 qualify.
- Any deal involving source code, or a counterparty who is a competitor, is ineligible in advance, however clean the document reads.
- A confidence threshold would let a clean-looking document into a situation where nothing should ever be automatic. Declaring the situation off-limits is a stronger safety position than scoring the document, because a document can look better than it is and a declared rule cannot be talked around.

**Bargaining power never changes a severity rating.**

- It feeds the routing call and the Negotiation Plan only.
- A clause we cannot afford to fight is still a bad clause. Folding bargaining power into the rating would hide the deviation instead of conceding it on purpose.
- Measured, not asserted: the auto-approve pattern is identical across all three bargaining-power values, with 0 violations of that rule across every variant tested.

**Absence is a separate pass with its own agent.**

- The reading stage returning nothing for a clause is evidence about the reading stage, not about the document.
- The Absence Detector goes and searches, and it reports whether it actually finished.

**Six Clause Types, not the seventeen the public dataset offers.**

- The public collection's seventeen categories contain no non-compete rider, no intellectual property assignment, no governing law, and no mutuality.
- Those are exactly the clauses that carry the unacceptable rating, and the unacceptable rating is where the kill criterion lives.
- Adopting the researchers' categories would have produced better-looking numbers about a problem we did not choose to solve.

**No model grades another model's output anywhere in the evaluation.**

- The Shadow Judge is a product feature. It reads the contract and its output goes to a human. That is a different thing.
- What we refuse is scoring our own agent with a model. See the metric design note for the reasoning and for what that refusal costs us.


## 8. The error asymmetry

There are two ways to be wrong about absence, and they are not equally bad.

| Failure | What it is | Cost | What it shows up in |
|---|---|---|---|
| **Missed absence** | A genuinely missing carve-out goes undetected | Catastrophic. The document sails toward approval looking clean and nobody notices until it matters | How many real absences we find |
| **False absence** | We declare something missing that is present | Annoying. A clean NDA gets flagged and a human clears it in seconds | How often our absence claims are right |

Consequences for the design:

- The evaluation weights finding real absences above avoiding false alarms. All three kill criteria are statements about the failure we would not see.
- False alarms are still reported and still guarded. The share of our absence claims that were correct stayed at or above 0.979 at every Search Budget, so we never bought coverage by flagging everything.
- A false alarm is cheap to recover from in production. A reviewer clears it. Nobody recovers a missed rider.


## 9. What this is not

- **Not legal advice.** A regulatory boundary with real teeth, not a disclaimer to bolt on later.
- **Not autonomous signature.** The product routes. A human approves.
- **Not a universal risk score.** Risk is definable only relative to a specific set of company positions and a specific deal.
- **Not a redlining tool.** We name what to fight for. We do not draft it.
- **Not a document store.** It sits in the intake path, before the contract management system rather than inside it.


## 10. Success metrics

**Ship gates, written down before any measurement**

| Gate | Bar |
|---|---|
| Missing a clause severe enough to be rated unacceptable | Any single instance means not shippable at any autonomy setting |
| Share of genuinely missing clauses we catch | Must not sit materially below a paralegal's |
| A quoted passage that does not appear in the document | Any single instance is a top-severity defect |

**Quality metrics, reported but not gates**

- How often our absence claims are correct, and the count of false ones
- Reading accuracy per Clause Type
- Hit rate on real NDAs with an unacceptable clause deliberately inserted
- Pass rate on tests where the answer is hidden somewhere the agent must go look, which measures search discipline rather than answer correctness
- Compliance with the four process rules the agent was required to follow while working
- How the Absence Detector stopped, which is what actually gates autonomy
- Auto-approve rate per deal situation

**Cost and latency**

- Cost per document per stage, taken from a running log of actual spend rather than an estimate
- Typical and worst-case time per document on the Absence Detector

**Not measured yet**

- Reviewer minutes saved per NDA
- Share of flagged NDAs a lawyer agrees needed reading
- Cycle time from intake to signature


## 11. Non-functional requirements

- **Latency is a first-class requirement.** NDAs arrive continuously and every one blocks a deal. A 30-second answer changes behavior. A 30-minute answer gets bypassed and the document is signed without the tool. At the chosen Search Budget, 19 documents in 20 finish the absence pass within 20.3 seconds.
- **Cost.** Total model spend across the whole evaluation was $21.83 against a $50 ceiling.
- **Reproducibility.** The same model is used every time, and every call is written to a running log of spend that cannot be edited after the fact. The auto-approve analysis re-runs from already-saved outputs at $0.
- **Data.** ContractNLI (607 real NDAs, openly licensed) and CUAD. Both public. No personal data.


## 12. Open questions

- Does absence coverage hold up on the untouched 123-document test set, out of the loop we have been iterating in? Nothing here answers that yet.
- Does the kill criterion fail on naturally occurring unacceptable clauses, or only on inserted ones? Planted clauses test whether the system can be fooled by insertion, not how often riders actually appear.
- Can the Shadow Judge be made useful? At 14.1 findings per document it behaves as a wide net, not a filter, and it vetoes every automatic approval.
- Is the defined-terms rule a real quality problem, or a rule stricter than the task needs? Model choice buys compliance; more search steps do not. Only a supervised rollout with humans in the loop would show whether skipped definitions cause harm.
- What is a paralegal's absence recall? One kill criterion references it and no measurement of it exists anywhere.
