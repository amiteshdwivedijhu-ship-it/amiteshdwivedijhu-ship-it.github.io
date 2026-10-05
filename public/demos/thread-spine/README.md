# Thread Spine

A clickable servicing console for one auto loan across SMS, voice, and chat. Built as interview practice for Salient's Lead Product Manager, AI Agents seat.

This is not a Salient product. Salient did not make it and does not endorse it. The lender, borrowers, balances, and quotes are fake.

## Open it locally

No install and no server are required.

1. Open `index.html` in a browser (Chrome, Safari, or Firefox).
2. Or, from this folder, run `python3 -m http.server 8080` and visit `http://127.0.0.1:8080`.

## What to click

1. On the desk, open Jordan Hale.
2. Press "Step through the story" to move from SMS to voice.
3. Open the Next turn tab.
4. Leave "Never discuss legal action without a human handoff" on. Press "Play next turn".
5. Open the Handoff tab and read the packet.
6. Go back to Next turn, turn that guardrail off, and play the same line again.
7. Try "Text me the payoff" and "Put me on the $90 plan".
8. Use "Simulate payoff tool timeout" to see a failed tool with no made-up number.
9. Open Go-live for the workflow catalog and the day 22 of 28 bar.
10. Press Reset demo to clear this browser's saved choices.

Choices are stored in localStorage in this browser only.

## Phone

The layout is built for a 375px wide screen. Columns stack. The page itself should not scroll sideways. Tool JSON scrolls inside its own box. Buttons are at least 44px tall. Body text is at least 16px. There is no popup layer.

## Suggested Pages path

If this is added to the portfolio site later, use:

`demos/thread-spine/`

Placeholder URL (not deployed by this task):

https://amiteshdwivedijhu-ship-it.github.io/demos/thread-spine/
