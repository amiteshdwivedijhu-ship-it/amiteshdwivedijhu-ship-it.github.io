---
title: "Launch decision"
hook: "Ship the table, hold the queue, and drop the thirty-minute claim."
project: "calibration"
order: 5
source: "Calibration Harness/Artifacts/Launch-Decision-Memo.md"
---
# Launch Decision Memo: Rubric Lens

**Decision:** ship the coverage table to one design partner. Do not ship the arbitration queue. Do not describe this as a thirty-minute product.

**Date:** 2026-08-27
**Basis:** one end-to-end run against a real provider, 61 automatic checks, and a set of local measurements. The conversations were machine-generated for this project. Every rule below was written down before the build.


## 1. The call

| Product surface | Decision | Why |
|---|---|---|
| The coverage table: which checks are measurable, computed with no labelled data | **Ship to one design partner** | It works, it is the genuinely new thing, and the project's own plan said to gate everything else on it |
| The automatic rewrite engine | **Do not ship the verdicts** | Five rewrites, none usable, and three were labelled successes when they had become as unmeasurable as what they replaced |
| The twelve-item arbitration queue | **Do not ship** | The four hidden honesty items cannot do the one job they exist for, through the screen as designed |
| "Thirty minutes, once" as a claim | **Do not make it** | Nothing in the tool records a clock, and the number the whole budget rests on has never been observed |
| Any accuracy or precision figure | **Never build** | Section 4. This is the decision the whole product descends from and it should not be revisited |
| Reading what teams already export | **Fix before any demo** | Two of the four supported formats fail through the one command a user types |


## 2. The rules written before the build, reported against

Six rules, written on the grounds that they were the disciplines most likely to erode under pressure.

| Rule | The bar, and what failing it would mean | Result |
|---|---|---|
| No percentage may be computed from the twelve human answers | Twelve items are not a sample of anything. If a rate can be computed from them, someone eventually will, and the product's central honesty claim collapses | **Holds.** The report writer is handed counts, never verdicts, cannot reach the arbitration machinery, and an automatic check reads its source to confirm both |
| The strongest verdict reads "no ambiguity found across N traces," never "verified" or "correct" | The wording is the honesty. "Verified" is a claim the evidence cannot support | **Holds as written. Broken as intended.** It is a fixed sentence containing the number 300 |
| De-identification never calls a hosted model | Sending the data to a hosted model to find the personal data defeats the entire purpose | **Holds.** Local rules only, and an automatic check asserts the module cannot reach a network |
| Placeholders are typed, numbered and stable, so references to the same entity stay linked | A uniform blackout destroys the thread most checks depend on | **Partly.** Typed and numbered, yes. For organisations, not linked |
| The countdown is wall-clock and nothing extends it | If anything can extend the session, "one sitting" is not a constraint, it is an aspiration | **Holds.** The deadline is set once at the start and never written again |
| Every export names its exact model, sample count, temperature and aggregation rule | A number attached to a nickname that can silently point at a different model is not a measurement | **Holds.** All six exports carry all four |

Five of six. And there were three acceptance conditions written alongside them: that every automatic check passes, that the tool runs end to end against a real provider producing the table, the report and the exports, and that no code path can compute a percentage from the human's answers. All three are met.

By the letter, this project passed. The rest of this memo is why that is not enough to ship the thing the product actually is.


## 3. Why five passes do not carry the decision

**The rule that broke, broke in the most instructive way available.** It was the easiest of the six to enforce, and it was enforced as a fixed sentence with the number 300 written into it. Run the tool on 50 conversations and the top of the page says "50 traces" while every verdict on that same page says "across 300 traces." The tool's own documented remedy for hitting provider rate limits is to drop to 200 conversations, so the documented remedy produces a false report.

The lesson generalises past this defect. **A rule enforced as a literal satisfies its own automatic check and can invert its meaning.** Every check in the project passes, and it passes because every check runs the tool at the size the literal was written for.

**The defect that matters most is not on the list at all.** The design names its real hole plainly: three samples and two phrasings can be wrong for the same reason, and a check that is consistently misread looks exactly like a check that is correctly understood. The stated defence is four hidden honesty items, drawn from conversations where everything agreed and mixed unmarked into the twelve.

On such an item, both rationales shown to the human argue for the same verdict, because both phrasings agreed. There is no keystroke that means "you are both wrong." The only key counted as an overturn means "the question itself is wrong," which is a different statement about a different thing.

So the single defence against the failure mode the design calls its real hole cannot detect that failure. That is not a coding defect. I designed the screen and the counting rule, and they do not do what the document next to them says they do.

**And the highest-information key reaches nothing.** Pressing "neither, the question is wrong" was supposed to route straight to the rewrite engine. Rewrites are generated and re-measured before the queue opens, so the key is counted and nothing follows from it.


## 4. What we never build

**An accuracy figure with a confidence interval.**

- Fifteen hours of hand labelling narrows the estimate to about plus or minus 8 points; thirty-seven hours gets to plus or minus 5.
- Letting the human read the model's cited evidence first moves the centre of that estimate by roughly 19 points, and nothing in the system measures the displacement.
- At a 3% firing rate, most of a human's "yes" labels are themselves wrong.

Spending fifteen hours to narrow the smaller error around an unmeasured larger one is the trap this product exists to avoid. The cost is a real, named customer segment: anyone gating a release on an evaluation score cannot be served, and pretending otherwise means shipping them a confidently wrong number.

(These figures come from the design review that killed the certifying version, not from this project's measurements.)


## 5. What would change the decision

In the order I would do them.

**1. Give the honesty items their own screen. This is the blocker.**
On a consensus item the useful question is not "which of these two rationales is better," it is "is this verdict wrong." Until that screen exists, four of the human's twelve minutes buy nothing, and the product's stated defence against its stated main risk does not exist.

**2. Put a ceiling on the firing rate, symmetric with the floor.**
A check firing on 99% of conversations is as unmeasurable as one firing on 1%, and today the tool congratulates the first. Three of five rewrites were mislabelled on this run alone.

**3. Derive the verdict sentence from the actual count, and add a check that runs the tool at a size other than the default.**
Both defects that survived all 61 checks survived because every check runs at the default.

**4. Fix format detection, and check the path a user actually takes.**
Each reader works when called by name. The command routes every line-per-record file to the general-purpose reader, so two of four supported formats fail. Every reader has its own passing check, and none covers the command.

**5. Then measure the ninety seconds with one real product manager.**
This is the number the entire thirty-minute design rests on, and the only success metric the plan named was whether a real person finishes twelve items in one sitting. Nothing above is worth doing if that number is three minutes instead of ninety seconds.

<pre class="mermaid">
flowchart TD
  a["Honesty items get a screen that can express disagreement"] --&gt; b["Firing rate gets a ceiling as well as a floor"]
  b --&gt; c["Verdict sentence derived from the real count, and a check at a non-default size"]
  c --&gt; d["Format detection fixed, and the command itself checked"]
  d --&gt; e["One real product manager, twelve items, measure the clock"]
  e --&gt; f["Revisit the ship decision"]
</pre>


## 6. What held up and should be kept

- **Refusing the accuracy number, and enforcing the refusal structurally.** The report writer cannot compute a rate from the human's answers even by accident. This is the design decision I would defend hardest and the one most likely to be argued away by whoever wants the number next.
- **Two phrasings rather than two models.** It costs the same and it is the only version of the diagnosis that comes with an action the buyer can take. On the one genuinely ambiguous check in the run, it did exactly what it was designed to do: 35% self-agreement, 63% agreement between phrasings, correctly called ambiguous.
- **De-identification that cannot reach a network.** A whole class of failure removed by construction rather than by discipline.
- **Exports that pin the exact model.** Cheap, and it is the difference between a measurement and a number.
- **Deleting the word "round" from the design.** Roughly 60% of the previous version's complexity descended from that one noun: cadences, frozen windows, control arms, a maintained corpus. The customer's stated problem is bandwidth, and a product with a fortnightly cadence charges rent in the one currency she says she does not have.


## 7. Risks if we ship the whole thing anyway

| Risk | Likelihood | Impact | What stops it |
|---|---|---|---|
| A team automates a check the tool called clean while the models were consistently misreading it | Medium, and unmeasured | High. It is the failure the whole design names as its main risk | Fix the honesty screen. Nothing else touches this |
| A report claims "across 300 traces" on a run of 200 | High, since 200 is the documented remedy for rate limits | The one sentence in the product whose exact wording is the honesty becomes false | Derive it from the count |
| A team ships a rewritten check that fires on every conversation | High. Three of five did it in this run | The check passes forever and detects nothing | Add the ceiling |
| A first-time user's export fails at the first command | High for two of four formats | Attrition at the highest-attrition moment in the product | Fix detection |
| The buyer reads "no ambiguity found" as "verified" | Medium | Overreliance | Keep the wording, and never soften it |


## 8. The honest summary

Six defects found. Not one was visible in the report the tool produced, and not one was caught by the 61 automatic checks, because those checks call each reader by name and run the tool at its default size, which are precisely the two conditions under which the two most serious defects disappear.

Three of the four findings that hurt most were failures of my own design rather than of the code: an estimate that contradicted its own definition and was wrong by three times, a rule enforced as a literal string that inverted its meaning, and a defence against the design's named main risk that cannot fire through the screen I drew for it.

The machine half of this product works and was the part I expected to be uncertain. The human half is what the product is, no human has run it, and one part of it cannot do its job as built. That is the whole decision.
