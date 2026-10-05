# Refine Lane

A clickable labeling desk for three synthetic medical requests. Built as interview practice for Centaur's Technical Product Manager, Labeling Tools seat.

This is not a Centaur product. Centaur did not make it and does not endorse it. The cases, counts, and disagreement rates are fake. There is no real patient data.

## Open it locally

No install and no server are required.

1. Open `index.html` in a browser (Chrome, Safari, or Firefox).
2. Or, from this folder, run `python3 -m http.server 8080` and visit `http://127.0.0.1:8080`.

## What to click (about 90 seconds)

1. Read the three requests. Each shows demand, the current tool gap, and a disagreement rate.
2. Tap Prototype next on Chest X-ray lesion polygon.
3. Read the AI draft. The lower edge is marked bad on purpose.
4. Tap Accept to gold. It stays off while that edge remains.
5. Tap Edit edge. The extra edge clears and the audit records the edit.
6. Tap Accept to gold. Nothing is uploaded.
7. Read the audit. Tap Export audit if you want `refine-lane-audit.txt`.
8. Optional: open Pathology report NER or Discharge summary ICD mapping. Edit span moves a bad highlight. Reject sends the case back and locks gold until you tap Clear reject.
9. Reset demo clears this browser's saved choices.

Choices are stored in localStorage under `refine-lane-demo-v1`.

## Phone

The layout is one column, built for a 375px wide screen. The page itself should not scroll sideways. Buttons are at least 44px tall. Body text is at least 16px. There is no popup layer.

## Files

- `index.html` opens the app
- `styles.css` layout and color
- `app.js` the desk, refine actions, ship check, and audit
- `data.js` synthetic requests and case copy

## Suggested Pages path

If this is added to the portfolio site later, copy these files to:

`public/demos/refine-lane/`

Placeholder URL (not deployed by this task):

https://amiteshdwivedijhu-ship-it.github.io/demos/refine-lane/

Goal brief: `../Goal - Centaur.md`
