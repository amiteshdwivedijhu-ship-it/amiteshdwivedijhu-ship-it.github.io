# Match Exception Desk

A working prototype for a synthetic customer, Larkspur Foods. When an invoice does not match its PO or receipt, a sample agent explains the gap with line citations and proposes a fix. The requester can confirm a receipt on a phone. A bill can move to Ready to pay only when the checks pass. The agent never pays a bill and never contacts a vendor without a human click.

This is not a Ramp product. It does not use Ramp code or a Ramp logo. Vendors, invoices, and people are synthetic. Nothing is emailed and nothing is synced to an ERP.

## How to open

Open `index.html` in a browser. No build step. Progress is stored in localStorage. Reset demo restores the seed.

## 90-second path

1. Open the inbox. Point at $10,605 at risk across 5 exceptions.
2. Open INV-88341. Read the agent explanation and the line citations. Pick Short-pay to PO price and request a credit memo.
3. Open INV-88343 (laptops not received). Send the receipt prompt. Open the phone card. Tap Received some and enter 4.
4. Ready to pay stays locked because the $4,960 payment needs Priya Nair. Approve as Priya.
5. Open the audit trail. The bill shows Ready to sync to ERP (simulated NetSuite).

## Ready to pay rule

An invoice can move to Ready to pay only when all are true:

1. Every line is matched within tolerance, or its exception has an approved fix.
2. Any fix over $500 or outside tolerance has a named approver who is not the requester.
3. The agent explanation cites the PO line, receipt line, and invoice line it used.
4. Goods lines have a receipt confirmed by the requester or the dock.
5. No duplicate-invoice flag is open.

Raise the price tolerance to 7% to auto-accept INV-88341. Quantity over-billing is never auto-accepted.
