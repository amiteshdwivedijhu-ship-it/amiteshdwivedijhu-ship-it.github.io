/* Synthetic customer, vendors, and invoices. Not a Ramp product. */
window.RAMP_DATA = {
  customer: "Larkspur Foods",
  people: {
    ap: "Dana Ortiz",
    requester: "Jordan Lee",
    approver: "Priya Nair"
  },
  policySeed: { pct: 2, dollars: 50, apName: "Dana Ortiz", controllerName: "Priya Nair" },
  invoices: [
    {
      id: "INV-88341",
      vendor: "Northbay Packaging",
      po: "PO-2207",
      issue: "Price variance",
      age: 3,
      atRisk: 30,
      goods: true,
      duplicate: false,
      requester: "",
      citePo: "PO-2207 line 2",
      citeReceipt: "R-5531 line 1",
      citeInvoice: "INV-88341 line 2",
      explanation: "INV-88341 line 2 bills 120 cases at $4.10. PO-2207 line 2 is 120 cases at $3.85, and contract C-114 section 3 holds that price until March 2027. Receipt R-5531 line 1 shows 120 cases received. The gap is $0.25 a case, $30 total, and it is above the 2% tolerance. Suggested fix: short-pay to the PO price and request a credit memo.",
      seedReceipt: { confirmed: true, by: "dock", qty: 120, note: "Dock logged R-5531." },
      columns: {
        po: [{ line: "PO-2207 line 2", item: "12x9 mailers", qty: "120 cases", money: "$3.85", flag: "" }],
        receipt: [{ line: "R-5531 line 1", item: "12x9 mailers", qty: "120 cases", money: "Received", flag: "" }],
        invoice: [{ line: "INV-88341 line 2", item: "12x9 mailers", qty: "120 cases", money: "$4.10", flag: "price" }]
      },
      pricePct: (4.10 - 3.85) / 3.85 * 100,
      priceDollars: 30,
      qtyOver: false,
      vendorNote: "Hello Northbay Packaging. Invoice INV-88341 bills 120 cases of 12x9 mailers at $4.10. PO-2207 line 2 and contract C-114 section 3 set the price at $3.85 until March 2027. Please issue a credit memo for $30.00. We will short-pay to the PO price.",
      fixes: [
        { id: "short-credit", label: "Short-pay to PO price and request a credit memo", impact: "Pay $462.00 instead of $492.00. Request a $30.00 credit memo.", amount: 30, outside: true, next: "AP pays the PO price. The vendor note stays a draft until you mark it sent." },
        { id: "short", label: "Short-pay to PO price", impact: "Pay $462.00. The $30.00 gap stays with the vendor.", amount: 30, outside: true, next: "AP pays the PO price. No vendor note is required to pay." },
        { id: "credit", label: "Request credit memo", impact: "Ask for $30.00 back. The invoice is not matched until you also short-pay or accept it.", amount: 30, outside: true, resolves: false, next: "Open the vendor note. The invoice stays open until a pay decision is approved." },
        { id: "accept", label: "Accept variance with approval", impact: "Pay the extra $30.00.", amount: 30, outside: true, next: "AP pays the invoice price after the named approver signs." },
        { id: "ask", label: "Ask requester to confirm receipt", impact: "No dollar change. Receipt R-5531 is already on file.", amount: 0, outside: false, resolves: false, next: "The receipt is already confirmed by the dock." }
      ]
    },
    {
      id: "INV-88342",
      vendor: "Cobalt Lab Supply",
      po: "PO-2211",
      issue: "Over-billed qty",
      age: 5,
      atRisk: 180,
      goods: true,
      duplicate: false,
      requester: "",
      citePo: "PO-2211 line 1",
      citeReceipt: "R-5540 line 1",
      citeInvoice: "INV-88342 line 1",
      explanation: "INV-88342 line 1 bills 50 boxes of gloves at $18.00. PO-2211 line 1 ordered 40 boxes at $18.00. Receipt R-5540 line 1 shows 40 boxes. The extra 10 boxes are $180.00. Quantity over-billing is never auto-accepted.",
      seedReceipt: { confirmed: true, by: "dock", qty: 40, note: "Dock counted 40 boxes." },
      columns: {
        po: [{ line: "PO-2211 line 1", item: "Nitrile gloves", qty: "40 boxes", money: "$18.00", flag: "" }],
        receipt: [{ line: "R-5540 line 1", item: "Nitrile gloves", qty: "40 boxes", money: "Received", flag: "" }],
        invoice: [{ line: "INV-88342 line 1", item: "Nitrile gloves", qty: "50 boxes", money: "$18.00", flag: "qty" }]
      },
      pricePct: 0,
      priceDollars: 0,
      qtyOver: true,
      vendorNote: "Hello Cobalt Lab Supply. INV-88342 line 1 bills 50 boxes. PO-2211 line 1 and receipt R-5540 line 1 show 40 boxes. Please credit 10 boxes at $18.00, $180.00 total.",
      fixes: [
        { id: "short", label: "Short-pay to receipt quantity", impact: "Pay $720.00 for 40 boxes. Hold $180.00.", amount: 180, outside: true, next: "AP pays the received quantity." },
        { id: "credit", label: "Request credit memo", impact: "Ask for a $180.00 credit. Pay decision still needs an approval.", amount: 180, outside: true, resolves: false, next: "Draft the vendor note. The bill stays open until short-pay is approved." },
        { id: "accept", label: "Accept variance with approval", impact: "Pay all 50 boxes, $900.00.", amount: 180, outside: true, next: "AP pays the invoice quantity after approval." }
      ]
    },
    {
      id: "INV-88343",
      vendor: "Tallgrass IT",
      po: "PO-2215",
      issue: "Not received",
      age: 2,
      atRisk: 7440,
      goods: true,
      duplicate: false,
      requester: "Jordan Lee",
      citePo: "PO-2215 line 1",
      citeReceipt: "No receipt line",
      citeInvoice: "INV-88343 line 1",
      explanation: "INV-88343 line 1 bills 6 laptops at $1,240.00, $7,440.00 total. PO-2215 line 1 matches that quantity and price. No receipt line is logged. The requester is Jordan Lee.",
      seedReceipt: { confirmed: false, by: "", qty: null, note: "" },
      columns: {
        po: [{ line: "PO-2215 line 1", item: "Laptop", qty: "6", money: "$1,240.00", flag: "" }],
        receipt: [{ line: "No receipt line", item: "Laptop", qty: "0 logged", money: "Not received", flag: "qty" }],
        invoice: [{ line: "INV-88343 line 1", item: "Laptop", qty: "6", money: "$1,240.00", flag: "" }]
      },
      unit: 1240,
      ordered: 6,
      pricePct: 0,
      priceDollars: 0,
      qtyOver: false,
      vendorNote: "Hello Tallgrass IT. We are confirming receipt of the 6 laptops on PO-2215 before payment. This note is a draft.",
      fixes: [
        { id: "pay-received", label: "Short-pay to the quantity received", impact: "Pay only the laptops Jordan confirms.", amount: 4960, outside: true, dynamic: true, next: "Controller approval is required because the payment is over $500." },
        { id: "ask", label: "Ask requester to confirm receipt", impact: "Send Jordan Lee a one-tap check on the phone.", amount: 0, outside: false, resolves: false, next: "The invoice waits until Jordan answers." }
      ]
    },
    {
      id: "INV-88344",
      vendor: "Fenwick Linen",
      po: "PO-2190",
      issue: "Possible duplicate",
      age: 8,
      atRisk: 2315,
      goods: true,
      duplicate: true,
      requester: "",
      citePo: "PO-2190 line 1",
      citeReceipt: "R-5402 line 1",
      citeInvoice: "INV-88344 line 1",
      explanation: "INV-88344 line 1 is $2,315.00 on the same date and for the same linen service as INV-88290 last month. PO-2190 line 1 and receipt R-5402 line 1 match this bill. A duplicate flag is open, so it cannot be paid yet.",
      seedReceipt: { confirmed: true, by: "dock", qty: 1, note: "Service receipt on file." },
      columns: {
        po: [{ line: "PO-2190 line 1", item: "Linen service", qty: "1", money: "$2,315.00", flag: "" }],
        receipt: [{ line: "R-5402 line 1", item: "Linen service", qty: "1", money: "Received", flag: "" }],
        invoice: [{ line: "INV-88344 line 1", item: "Linen service", qty: "1", money: "$2,315.00", flag: "dup" }]
      },
      pricePct: 0,
      priceDollars: 0,
      qtyOver: false,
      vendorNote: "Hello Fenwick Linen. INV-88344 matches INV-88290 in amount and date. Please confirm this is not a second bill.",
      fixes: [
        { id: "not-dup", label: "Not a duplicate, approve to pay", impact: "Clear the flag and pay $2,315.00.", amount: 2315, outside: true, clearsDuplicate: true, next: "Priya Nair must approve. The requester cannot clear this." },
        { id: "hold-dup", label: "Hold as possible duplicate", impact: "Pay nothing. Keep the flag open.", amount: 2315, outside: true, resolves: false, next: "The bill stays blocked while the flag is open." },
        { id: "confirm-dup", label: "Confirm duplicate, do not pay", impact: "Close the flag and do not pay.", amount: 2315, outside: true, reject: true, next: "The bill will not move to Ready to pay." }
      ]
    },
    {
      id: "INV-88345",
      vendor: "Orchard Fleet Services",
      po: "",
      issue: "Missing PO",
      age: 4,
      atRisk: 640,
      goods: false,
      duplicate: false,
      requester: "Jordan Lee",
      citePo: "no PO line",
      citeReceipt: "no receipt line required",
      citeInvoice: "INV-88345 line 1",
      explanation: "INV-88345 line 1 is a $640.00 service bill with no PO line. There is no receipt line required because this is not goods. It cannot be paid until an approver accepts it without a PO.",
      seedReceipt: { confirmed: true, by: "not required", qty: 1, note: "Service bill. No goods receipt." },
      columns: {
        po: [{ line: "No PO line", item: "Fleet service", qty: "1", money: "Missing", flag: "po" }],
        receipt: [{ line: "No receipt line required", item: "Fleet service", qty: "n/a", money: "Service", flag: "" }],
        invoice: [{ line: "INV-88345 line 1", item: "Fleet service", qty: "1", money: "$640.00", flag: "" }]
      },
      pricePct: 0,
      priceDollars: 0,
      qtyOver: false,
      vendorNote: "Hello Orchard Fleet Services. We are matching INV-88345 to an internal approval because no PO line was on the bill.",
      fixes: [
        { id: "no-po", label: "Accept and pay without a PO", impact: "Pay $640.00 without a purchase order.", amount: 640, outside: true, next: "Priya Nair must approve payments over $500." },
        { id: "hold", label: "Hold as possible duplicate", impact: "Do not pay yet.", amount: 0, outside: false, resolves: false, next: "The bill stays in Needs fix." }
      ]
    },
    {
      id: "INV-88346",
      vendor: "Marlow Office Co",
      po: "PO-2219",
      issue: "Matched",
      age: 1,
      atRisk: 0,
      goods: true,
      duplicate: false,
      requester: "",
      citePo: "PO-2219 line 1",
      citeReceipt: "R-5566 line 1",
      citeInvoice: "INV-88346 line 1",
      explanation: "INV-88346 line 1 is paper at $12.10 versus PO-2219 line 1 at $12.00, about 0.8%, inside a 2% tolerance. Receipt R-5566 line 1 shows the goods received. Lines 2 and 3 match exactly. Policy auto-accepted this bill.",
      seedReceipt: { confirmed: true, by: "dock", qty: 20, note: "Dock received the office order." },
      columns: {
        po: [
          { line: "PO-2219 line 1", item: "Paper", qty: "20", money: "$12.00", flag: "" },
          { line: "PO-2219 line 2", item: "Pens", qty: "10", money: "$3.00", flag: "" },
          { line: "PO-2219 line 3", item: "Folders", qty: "5", money: "$8.00", flag: "" }
        ],
        receipt: [
          { line: "R-5566 line 1", item: "Paper", qty: "20", money: "Received", flag: "" },
          { line: "R-5566 line 2", item: "Pens", qty: "10", money: "Received", flag: "" },
          { line: "R-5566 line 3", item: "Folders", qty: "5", money: "Received", flag: "" }
        ],
        invoice: [
          { line: "INV-88346 line 1", item: "Paper", qty: "20", money: "$12.10", flag: "" },
          { line: "INV-88346 line 2", item: "Pens", qty: "10", money: "$3.00", flag: "" },
          { line: "INV-88346 line 3", item: "Folders", qty: "5", money: "$8.00", flag: "" }
        ]
      },
      pricePct: 0.833,
      priceDollars: 2,
      qtyOver: false,
      vendorNote: "",
      fixes: []
    }
  ]
};
