# Policy Audit Gate

A working prototype for a synthetic company, Halcyon Robotics. Finance can see the written policy line on every flag, see which rules have earned the right to auto-act, and turn an admin override into a test. A policy edit or model update ships in this sample only when the must-pass tests pass. Nothing here calls a live model. Every finding is precomputed and labeled simulated.

This is not a Navan product. It does not use a Navan logo. People, receipts, and amounts are synthetic.

## How to open

Open `index.html` in a browser. No build step and no install. Progress is stored in localStorage. Reset demo restores the seed.

## 90-second path

1. Open the queue. 12 expenses. 7 were handled automatically. 5 need review. Every flag cites a policy line.
2. Open T-1001. Read Policy 3.2, the highlighted tip line, and the five checks. They pass, so the engine asked for a fix.
3. Open T-1003. It is in review because the alcohol rule is 74% precise. Override it: expected Approve, reason "Named client attendee, allowed by 3.4." Eval case EV-015 appears at the top of the Eval set.
4. Open Gates. Select the weekend rule P-4.3. At threshold 0.90 the precision is 93.3% on 30 cases, under the 95% bar, so a person keeps reviewing it.
5. Open Change check. C-13 shows its Oct 6 pass (14 of 14). Run it again. It is blocked because the new case EV-015 fails.
6. Open the phone card. Theo Park sees the same policy line and the exact dollar cut.

## Auto-act rule

The engine auto-acts only when all five are true:

1. The flag cites a policy line ID, quotes the line, and names the receipt field it used.
2. Precision on cases at or above the rule threshold meets the bar (default 95%).
3. That precision rests on at least 30 admin-reviewed cases.
4. The flag confidence meets the rule threshold.
5. The rule is not Human only.

Otherwise the expense goes to Needs review and the screen names the failed check. A change ships only when every must-pass eval case passes and no passing rule drops below its bar. Every override needs a reason and becomes an eval case. Sign-off needs a different person than the admin running the check. This prototype records the sign-off and does not publish the change.
