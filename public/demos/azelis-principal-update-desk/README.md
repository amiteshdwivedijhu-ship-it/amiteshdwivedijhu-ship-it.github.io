# Principal Update Desk

A working prototype for a specialty ingredients distributor. A supplier notice is turned into structured fields, each one pointing at a line in the notice. The desk shows which synthetic customers are affected, suggests a selling price that holds margin, and drafts a sales alert and customer notes. The product manager approves them. Nothing is emailed.

This is not an Azelis product. Suppliers, products, customers, and prices are synthetic. The parser is a demo rule, not a live model.

## How to open

Open `index.html` in a browser. No build step. Reset demo restores the three seed notices.

## 90-second path

1. Open N-301, the Verano price increase. Show the parsed fields and tap a citation to highlight the source line.
2. Open the impact map. Four customers buy VX-MCC. Halden is contract-locked.
3. Open the price calculator. Brightwater's suggested price holds about a 21% margin.
4. Open N-302. The alternatives screen shows KP-240 and the pharma change control note.
5. Approve the price math, the sales alert, and customer notes. A note stays locked until the four checks pass, then it can be marked Ready.
6. Open the rollout tracker for days to the effective date. N-303 is overdue until someone is told.

## Ready rule

A customer note can be marked Ready only when the product codes and effective date match the notice and cite a line, contract-locked customers are flagged for commercial review, a pharma alternative carries a change control note, and the product manager has approved the price math. Mark as sent (demo) only updates the tracker.
