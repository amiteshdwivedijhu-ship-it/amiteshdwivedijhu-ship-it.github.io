# Condition Clear Desk

A working prototype for one sample mortgage file. The condition board shows who owns each item, an agent or a person. Open a condition and the decision trace shows the document excerpt, the fields, the guideline line, the confidence, and the plain reason. A processor can accept, override, or escalate. An override recalculates income, debt to income, and the large deposit limit, reopens anything it touches, and can become a regression case. The rollout gate pauses the live agent when a must-pass case fails.

All lender, borrower, loan, and guide data is sample data. Harborline Home Loans is not a real lender. This is not a Vesta product. It does not use Vesta code or logos. Nothing is sent over the network.

## How to open

Open `index.html` in a browser. No build step and no install. The page stores progress in localStorage. Use Reset demo to restore the seed.

## 90 second path

1. Open the condition board. There are 8 conditions. 5 were cleared by agents. Clear to close is locked.
2. Open C-03. The trace shows the VOE page 2 overtime lines, HL-UW 4.3.1, confidence 71, and the note that the agent did not compare 2026 year to date.
3. Override overtime to 640 under HL-UW 4.3.2. Income becomes $9,960. DTI becomes 44.2%. The deposit limit becomes $4,980. C-05 reopens because $5,000 is now over that limit. RC-12 is added as a must-pass case.
4. At phone width, open the C-05 escalation card. Tap Request letter of explanation. Mark as sent (demo) does not send anything.
5. Open the rollout gate. Variable income is paused because live v1.4 fails RC-12. v1.5 passes 12 of 12 and Request promote is available. Then open the audit log.

## Phone

At about 375px wide, columns stack. Buttons, tabs, and chips are at least 44px tall. The page body does not scroll sideways. Wide tables scroll inside their own box.
