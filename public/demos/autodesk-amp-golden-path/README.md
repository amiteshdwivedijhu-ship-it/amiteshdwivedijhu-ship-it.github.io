# AMP Golden Path Deploy Console

A static concept prototype of a Golden Path inside Autodesk Machine Learning Platform (AMP). An ML practitioner takes one finished experiment to a watched inference endpoint without leaving the console.

The sample experiment is `exp-fusion-sketch-assist-0412`, a fine-tuned LLM that writes sketch constraint hints for a Fusion-style feature.

All data is fake. This is not an Autodesk product.

## Run it

Open `index.html` in a browser. No build step and no server are required.

Or serve the folder:

```bash
python3 -m http.server 8741
```

Then open `http://127.0.0.1:8741`.

Paths are relative, so the same files work on GitHub Pages under `demos/autodesk-amp-golden-path/`.

## 90-second walkthrough

Read this aloud. Do the clicks in brackets. Stay on Happy path until the script says to switch.

**0:00.** "This is the Golden Path Deploy Console inside AMP. The experiment is exp-fusion-sketch-assist-0412. It is a fine-tuned LLM that writes sketch constraint hints for a Fusion-style feature. AMP already trains models at scale. The gap is the last mile: from a good run to a safe, watched endpoint a product team can call."

**0:18.** [Run checks] "I run checks. Six gates: eval set attached, pass rate at or above 90 percent, p95 under 800 milliseconds, error rate under 1 percent, model card complete, and guardrail scan passed. All six pass, and the artifact is packaged."

**0:32.** [Deploy canary] "I deploy a canary. Endpoint ep-sketch-assist-v4 takes 5 percent of traffic. v3, the last good version, keeps the rest."

**0:42.** [25%] then [100%] "I move the canary to 25 percent, then to 100 percent. It is still a canary until I promote."

**0:50.** [Promote] "I promote. The Monitor step goes Live. The SLO cards stay inside the limits: p95 under 800 milliseconds, error rate under 1 percent."

**1:00.** [Hand off to product team] "I hand off to the Fusion Sketch product team. The card has the endpoint URL, the model card, the SLOs, the owner, and the on-call channel. That is the downstream hand-off."

**1:12.** [Fail path] then [Run checks] "Same experiment, fail path. p95 is 1,240 milliseconds. The limit is 800. Promote is blocked. The fix is one line: turn on response streaming or switch to the g5.2xlarge profile, then run checks again."

**1:24.** [Apply fix] then [Run checks] "I apply the fix and run checks again. The gate passes and Promote unlocks."

**1:32.** [Deploy canary] then [Rollback] "If the canary looks wrong, I roll back. Traffic returns to v3 and the path log records it."

**1:40.** Point at Before / After. "Today that last mile is 5 tools and 14 steps, about 3 to 5 days. This path is 1 place and 5 steps, about 20 minutes. Time saved is 3 to 5 days. Steps removed: 9. Gates make safe the default, including the LLM checks: eval set, guardrails, latency, and cost."

If you are over time, stop after Promote on the happy path and show the fail-path block. The Before / After panel is the measure.

## What is on the screen

- Five steps: Validate, Package, Deploy (canary), Monitor, Hand off.
- Six gates, a canary control at 5, 25, 50, and 100 percent, and four SLO cards with sparklines.
- Model card drawer from View model card.
- Scenario toggle: Happy path and Fail path. Switching resets the flow.
- Buttons: Run checks, Deploy canary, Promote, Rollback, Hand off to product team, Apply fix.

## Keyboard

- Tab to the buttons. Focus rings use the AMP blue.
- Arrow keys move between Happy path and Fail path.
- Escape closes the model card, the user menu, and the mobile nav.

## Files

- `index.html` page structure
- `styles.css` Weave-style dark gray theme
- `app.js` fake data and the path state
- `artifacts/` desktop and 375px screenshots

## Note

Concept prototype by Ami. Not an Autodesk product. All data is fake.
