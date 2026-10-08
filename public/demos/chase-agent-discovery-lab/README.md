# Agent Discovery Lab

A working prototype for a product manager planning how people find a servicing assistant, when a proactive nudge may send, and when the customer reaches a person. The planning screens sit next to a phone preview of a made-up app called Sample Bank. Funnel numbers, trust numbers, and rollout calls are synthetic and labeled Synthetic. Replies are precomputed in data.js. Nothing is sent.

This is not a JPMorgan Chase product. The phone preview does not use that name, logo, or brand look. There is no operator console and no agent-side screen. Handoff appears as rules, as metrics, and as one customer screen.

## How to open

Open `index.html` in a browser. No build step and no install. Progress is stored in localStorage. Reset demo restores the seed.

## 90-second path

1. Open Entry points. On a strange charge, 13% start the assistant. In the search bar, 5% start. Raise E2 from 25% to 50%. The funnel and the phone preview update.
2. Open the simulator on Maya R. (C-01). N1 sends on Oct 2. N3 is suppressed on Oct 3 because of the weekly cap.
3. Open the phone preview. Read the nudge card, open Why am I seeing this?, file the dispute in three taps, and use Talk to a person.
4. Open Ana P. (C-03). The card decline sends at 11:40pm because it is time-critical. The promo is blocked because she has no marketing consent.
5. Open Scale decisions. E2 scales. N5 rolls back because opt-outs and complaints broke the guardrail, even though first use grew.
6. Turn N6 on. Synthetic returned within 30 days rises from 1,802 to 2,188.

## Nudge rule

A proactive nudge is sent only when all five are true:

1. The customer has consent for that channel. Feature promotion also needs marketing consent and a Comms approval tag.
2. Caps are not hit. The seed cap is 1 assistant nudge per 7 days and 3 per 30 days across all rules.
3. It is not quiet hours (9pm to 8am local) unless the rule is time-critical servicing.
4. No suppression applies: opted out of tips, a complaint in the last 30 days, an open fraud case, or a task already done.
5. The message has Why am I seeing this? and a one-tap Stop tips like this.

An entry point or nudge moves to the next rollout step only when every trust guardrail passes on at least 1,000 exposures. A guardrail fail means Hold or Roll back, whatever the growth numbers say. Talk to a person is always one tap away in chat.
