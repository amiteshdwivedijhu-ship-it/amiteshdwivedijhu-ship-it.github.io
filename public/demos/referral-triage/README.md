# Referral Triage

A clickable fax referral desk for synthetic hospital paperwork. Built as interview practice for Luminai's Senior Product Manager, Applied AI seat.

This is not a Luminai product. Luminai did not make it and does not endorse it. The faxes, names, and accuracy rates are fake. There is no real patient data.

## Open it locally

No install and no server are required.

1. Open `index.html` in a browser (Chrome, Safari, or Firefox).
2. Or, from this folder, run `python3 -m http.server 8080` and visit `http://127.0.0.1:8080`.

## What to click (about 90 seconds)

1. Open FX-204 Cardiology consult (marked as the happy path).
2. Read the fax facsimile. AI says this is a referral at 96% confidence.
3. Scan extracted fields. Urgency is low-confidence on purpose (model said Urgent; fax says Routine).
4. Tap Edit field on Urgency. The value becomes Routine.
5. Tap Lock case. The scorecard updates. Nothing is written to a real EMR.
6. Read the auto-fill rule on the scorecard. Urgency still fails the 90% batch bar.
7. Optional: open FX-191 or FX-168 to practice Send to human on other low-confidence fields.
8. Reset demo clears this browser's saved choices.

Choices are stored in localStorage under `referral-triage-demo-v1`.

## Phone

The layout is one column, built for a 375px wide screen. The page itself should not scroll sideways. Buttons are at least 44px tall. Body text is at least 16px. There is no popup layer.

## Files

- `index.html` opens the app
- `styles.css` layout and color
- `app.js` the queue, extraction actions, lock, and scorecard
- `data.js` synthetic faxes and batch accuracy seeds

## Suggested Pages path

If this is added to the portfolio site later, copy these files to:

`public/demos/referral-triage/`

Placeholder URL (not deployed by this task):

https://amiteshdwivedijhu-ship-it.github.io/demos/referral-triage/

Goal brief: `../Goal - Luminai.md`
