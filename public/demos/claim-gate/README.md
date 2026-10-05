# Claim Gate

A clickable follow-up check for one synthetic wealth note. Built as interview practice for Seismic's Senior Product Manager, Financial Services AI seat.

This is not a Seismic product. Seismic did not make it and does not endorse it. The firm, the client, the fund, and the approved files are fake.

## Open it locally

No install and no server are required.

1. Open `index.html` in a browser (Chrome, Safari, or Firefox).
2. Or, from this folder, run `python3 -m http.server 8080` and visit `http://127.0.0.1:8080`.

## What to click (about 90 seconds)

1. Stay on Advisor. Read the three lines. Two have approved-content chips. The results line has a missing-citation warning. The fund line still needs a disclosure.
2. Tap Add disclosure, or Flip claim.
3. Switch to Compliance. Tap Block this claim on the results line.
4. Switch back to Advisor. Tap Replace with approved line (or Remove claim).
5. Send turns on. Tap Send. Nothing is emailed.
6. Read the audit log. Tap Export audit if you want the text file.
7. Reset demo clears this browser's saved choices.

Choices are stored in localStorage under `claim-gate-demo-v1`.

## Phone

The layout is one column, built for a 375px wide screen. The page itself should not scroll sideways. Buttons are at least 44px tall. Body text is at least 16px. There is no popup layer.

## Files

- `index.html` opens the app
- `styles.css` layout and color
- `app.js` the two modes and the audit
- `data.js` synthetic claims and the send rule

## Suggested Pages path

If this is added to the portfolio site later, copy these files to:

`public/demos/claim-gate/`

Placeholder URL (not deployed by this task):

https://amiteshdwivedijhu-ship-it.github.io/demos/claim-gate/

Goal brief: `../Goal - Seismic.md`
