# Status Call Console

Static prototype for the Adonis Product Manager, Agents goal. Synthetic data only. Not an Adonis product.

## Open locally

From this folder:

```
python3 -m http.server 8765
```

Then open http://127.0.0.1:8765

You can also double-click index.html. The page does not fetch JSON. It only loads styles.css and app.js.

## 90 second path

1. On the worklist, open CLM-18442 (Jordan Hale, Northline Health Plan).
2. Start status call.
3. When the IVR asks for the member ID prefix, choose Take over.
4. Choose the line that says the prefix is HBR.
5. Confirm writeback.
6. On review, apply the flow fix. Phone coverage moves from 64% to 81%.

Reset demo puts the session back to the start. The app stores progress in localStorage.

Other paths worth clicking: Let it stop (no writeback), map the prefix before the call (no stall), This read is wrong (accuracy drops, no writeback), CLM-18820 where the 277 and an older phone note disagree, and Lumen Workers Fund which has no call flow yet. On a live call, Simulate tool timeout shows an error and a retry.

## Phone

The layout is built for about 375px wide: one column, 44px tap targets, 16px body text, no page-level horizontal scroll. Check the 90 second path on a phone width before you publish.

## Deploy to GitHub Pages

Copy this folder into the portfolio repo at:

```
demos/status-call-console/
```

If GitHub Pages serves the repo root, the URL will be:

https://amiteshdwivedijhu-ship-it.github.io/demos/status-call-console/

If Pages serves a docs folder instead, use docs/demos/status-call-console/. There is no build step.
