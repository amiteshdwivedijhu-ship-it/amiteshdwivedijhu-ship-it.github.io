# Backup Care Plan Designer

A working prototype for a synthetic hospital group, Northwind Health Systems. Set days, copays, care types, and eligibility. The page updates use, employer cost, and ROI, then checks whether each metro can fill the demand. The employee phone card shows what one person would see when they book.

This is not a Care.com product. The employer, providers, prices, and assumptions are synthetic.

## How to open

Open `index.html` in a browser. No build step. Reset demo restores the seed plan.

## 90-second path

1. Open Northwind. 8,000 employees sit in Dallas, Atlanta, Phoenix, Chicago, and a small remote group.
2. Pick the Plus tier. Cost, use, and ROI update.
3. The supply check flags Phoenix at about 81%. Ready to quote stays locked.
4. Add 2 partner centers in Phoenix. Fill rate goes to about 92% and the lock clears if the budget and eligibility checks still pass.
5. Open the employee phone view and book center care.
6. Open the quote summary. Every ROI assumption is listed.

## Ready to quote rule

Ready to quote stays locked until fill rate is at least 90% in every metro with 5% or more of headcount (or that metro has a ramp note), every ROI assumption is on screen, cost is within budget, and eligibility rules do not conflict.
