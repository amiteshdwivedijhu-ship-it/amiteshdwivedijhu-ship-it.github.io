# Chart Lane

Synthetic clickable prototype for a Flagler Health product conversation. It is a prior auth and plan check lane that sits next to a clinic chart.

Not affiliated with Flagler Health. Not a real clinic. All patients, payers, and dollars are fake.

## Open it

No build step and no server are required.

1. Unzip this folder.
2. Double click `index.html`, or serve the folder with any static host.

Phone check: narrow the window to about 375px wide. The chart stacks above the lane. Buttons stay at least 44px tall. The page should not scroll sideways.

## 90 second path

1. Morning: open Patient A (right knee injection).
2. Chart: read the note and the routing slip.
3. Plan check: the plan is active, and an auth is still required. Deductible left is "can't tell."
4. Packet: pick 6 weeks and Mar 18. Those match the chart sources. A wrong pick shows a warning.
5. Sign: choose Coordinator 02, check the box, and send. The send stays in the browser.
6. Pulse: tap "Demo: payer says yes." Patient A becomes clear to treat, and the at risk dollars drop.

Then try Patient C (member id does not match), Patient K (payer link is down), and Patient F (payer sent the auth back).

Use Reset demo to restore the morning.

## Deploy later

Copy this folder to the portfolio repo as `demos/chart-lane/`.

Suggested URL:

https://amiteshdwivedijhu-ship-it.github.io/demos/chart-lane/

GitHub Pages will serve `index.html` from that folder. Do not rename the three files. They link to each other by relative path.
