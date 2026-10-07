# Card Fit Landing

A working prototype of a paid-traffic card page. A shopper picks a synthetic ad keyword, answers a few questions, and sees fake cards ranked by estimated net yearly value. Each card shows the math, why it fits, and when it is a poor fit. A PM view sets variants and reads a synthetic A/B result. Payout cannot reorder cards outside a 10% value band. A variant cannot ship if a guardrail gets worse.

This is not a NerdWallet product. Cards, issuers, payouts, and traffic are synthetic. This is not financial advice. No issuer site is opened.

## How to open

Open `index.html` in a browser. No build step. Reset demo clears this browser's saved answers.

## 90-second path

1. Pick the keyword "no annual fee travel card" from a search ad.
2. Keep or edit the 3 questions. The sample spend is $1,500 a month, with $300 travel and $250 dining.
3. In "For this search", Atlas is first at $270 net. Summit is second at about $217, with a poor-fit line about the $95 fee. Pine has a higher cash value in the full list, and the 10% rule keeps payout from moving Summit above Atlas.
4. Open the PM view. Variant B is the intent-matched page. Rank by payout only is blocked.
5. Open the A/B readout. ROAS moves from 1.10 to 1.40 and bounce is down. Ship is allowed.
6. Turn on the bad variant. Ship stays blocked because bounce and complaints get worse.

## Value math

Miles are worth 1 cent in this demo. Summit on the sample spend earns about $312 before the $95 fee, so the net is about $217. Atlas earns $270 with no fee.
