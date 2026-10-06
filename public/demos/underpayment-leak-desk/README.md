# Underpayment Leak Desk (static prototype)

Interview practice prototype for a Translucent Product Lead (Revenue Intelligence) conversation.
Not affiliated with Translucent. Not a Translucent product. Synthetic data only: "Harbor Valley Health" and the payers
(Northstar Health Plan, Keystone Care, Bluewater Mutual) are made up. No real patients, claims, or payer contracts.

**Problem it solves:** it is the step between "the agent found a payer underpayment" and "a dollar the CFO trusts". Only a human approval turns a flagged gap into a CFO-confirmed dollar.

## Run
Open `index.html` in any browser. No build step, no network, no live model. State saves in localStorage. "Reset demo" returns the seed state.

Files: `index.html`, `styles.css`, `app.js` (logic), `data.js` (13 synthetic claim lines, $38,400 total gap).

## What is on the page
- Agent control surface strip: Revenue Cycle agent (live) and Labor Expense agent (coming soon, no logic).
- Leak summary: total gap found ($38,400), open gap, CFO-confirmed dollars (starts at $0), gap by root cause, and one small "agent hit rate" line (approved / human-reviewed).
- Case list sorted by dollars, payer filter, status chips (New, Needs review, Approved, Not a leak, Sent back). Table scrolls inside its own box.
- Case detail as an inline panel (no drawer): expected vs paid vs gap, contract rate, remit reason in plain words, agent root cause, agent note, confidence, contract clause. Actions: Approve recovery, Not a leak, Send back to agent (note required), Reopen.
- Approve is locked with visible text when the clause is missing. Fix: link a clause id, or send back.
- Autonomy rule card plus a threshold selector ($250 / $500 / $1,000 / $3,000) that shows how many open cases need human review.
- Weekly CFO digest preview (inline, nothing is sent): confirmed dollars by payer.

## Autonomy rule (as shown in the UI)
- Agent alone: flag a gap, group by root cause, mark Not a leak when the gap fully matches a patient responsibility line.
- Human must approve: gap of $500 or more, confidence under 85%, or missing clause. Only approved cases add to CFO-confirmed dollars. The agent never approves dollars.
- Send back needs a note. The case returns as Needs review with the note shown.

## 90-second walkthrough
1. **0 to 15s.** "Your homepage shows a Revenue Cycle agent scanning. The JD says this seat proves dollars a CFO will sign. This is the step between a finding and a signed dollar." Point at Leak summary: $38,400 gap found, $0 CFO-confirmed.
2. **15 to 35s.** Open the top case, `HVH-NS-10871`. "Northstar paid $6,120 against a $10,330 contract rate. The agent says it paid on last year's fee schedule, 92% confidence, and here is the clause."
3. **35 to 50s.** Tap Approve recovery. CFO-confirmed jumps to $4,210. "Over $500, so a human owns it."
4. **50 to 65s.** Open `HVH-BW-31002` (Bluewater, no clause). Approve is locked with a visible reason. Type a note and tap Send back to agent. It shows Needs review plus Sent back, with the note.
5. **65 to 80s.** Open `HVH-NS-11090` ($380 ER visit). The agent already marked it Not a leak by itself: the gap matches the patient deductible line. "That is the one thing it can do alone."
6. **80 to 90s.** Point at the autonomy rule card and the agent hit rate line. Ask: "Where do you draw the line today between what the agent closes alone and what a revenue cycle lead must sign?"

Off the happy path: change the threshold to see cases move between New and Needs review, filter by payer, link a clause id to unlock Approve, reopen a decided case, or hit Reset demo.

## Checked
- At 375px: one column, no body horizontal scroll, all controls at least 44px tall, body text 16px, no overlays.
- No page errors, no network requests (checked in headless Chrome).
- No em dashes or en dashes in any file.
