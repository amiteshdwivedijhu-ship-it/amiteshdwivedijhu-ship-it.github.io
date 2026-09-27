/* Stuut Collections prototype: synthetic chase packs.
   Public demo data only: no live ERP, no real customer PII, no real dialing. */
var STUUT_CASES = [
  {
    id: 'A',
    title: 'Happy path: promise to pay confirmed on voice',
    account: {
      name: 'Gearline Manufacturing Co.',
      id: 'CUST-0142',
      arRep: 'Alex Chen',
      apContact: 'Priya Sharma (AP)',
      phone: '(555) 014-2231'
    },
    invoice: {
      number: 'INV-1042',
      date: '2026-09-02',
      dueDate: '2026-09-16',
      terms: 'Net 14',
      total: 12480.00,
      paid: 0.00
    },
    asOf: '2026-09-30',
    channels: [
      { type: 'email', id: 'em-1', direction: 'out', date: '2026-09-24',
        subject: 'Invoice INV-1042 · payment reminder',
        body: 'Hi Priya,\n\nThis is a reminder that invoice INV-1042 for $12,480.00 from Gearline Manufacturing Co. is now past due (Net 14, due Sep 16). Please let us know when we can expect payment.\n\nStuut Collections' },
      { type: 'voice', id: 'vc-1', direction: 'out', date: '2026-09-30', time: '10:04 AM', duration: '2:14',
        label: 'AI voice call',
        turns: [
          { speaker: 'Alex (Stuut AI)', time: '00:00',
            text: 'Hi Priya, this is Alex from Stuut Collections calling about invoice 1042 for $12,480. We show it as 14 days past due. When can we expect payment?' },
          { speaker: 'Priya (AP)', time: '00:41',
            text: 'Hi Alex, thanks for calling. Yes, we have the invoice. Accounts payable will wire the full payment this Friday.' },
          { speaker: 'Alex (Stuut AI)', time: '00:58',
            text: 'Let me confirm: a wire for the full $12,480 out on Friday, October 2nd. Correct?' },
          { speaker: 'Priya (AP)', time: '01:06',
            text: "That's right, the wire goes out Friday the 2nd." }
        ] }
    ],
    remittance: null,
    expected: {
      promise: 'active',
      payBy: '2026-10-02',
      followUp: '2026-10-05',
      escalate: false,
      confidence: 0.97
    }
  },

  {
    id: 'B',
    title: 'Broken promise: emailed commitment missed, voice dodge',
    account: {
      name: 'Northwind Paper & Packaging',
      id: 'CUST-0219',
      arRep: 'Alex Chen',
      apContact: 'Marcus Webb (AP lead)',
      phone: '(555) 021-9944'
    },
    invoice: {
      number: 'INV-2087',
      date: '2026-08-09',
      dueDate: '2026-09-08',
      terms: 'Net 30',
      total: 6840.50,
      paid: 0.00
    },
    asOf: '2026-09-25',
    channels: [
      { type: 'email', id: 'em-1', direction: 'in', date: '2026-09-18',
        subject: 'Re: Payment for INV-2087',
        from: 'Marcus Webb <mwebb@northwind.example>',
        body: 'Hi Alex,\n\nThanks for the follow-up. Yes, we have invoice INV-2087 on our list. We will get the payment out Monday. Our AP team is on it, thank you for your patience.\n\nMarcus Webb, AP Lead' },
      { type: 'voice', id: 'vc-1', direction: 'out', date: '2026-09-25', time: '09:12 AM', duration: '1:38',
        label: 'AI voice call',
        turns: [
          { speaker: 'Alex (Stuut AI)', time: '00:00',
            text: "Hi Marcus, this is Alex from Stuut Collections about invoice 2087 for $6,840.50, now 17 days past due. Your email of September 18th said payment would go out Monday. We don't show receipt. When will payment land?" },
          { speaker: 'Marcus (AP)', time: '00:24',
            text: "Yeah, I know we said Monday. Finance is still reviewing it, I can't commit to a date right now, I'll have someone look into it." },
          { speaker: 'Alex (Stuut AI)', time: '00:52',
            text: "Understood. So no confirmed payment date today. I'll flag this for our team to follow up with your AP directly." }
        ] }
    ],
    remittance: null,
    expected: {
      promise: 'broken',
      escalate: true,
      actionHasCall: true,
      actionHasTerms: true,
      confidence: 0.90
    }
  },

  {
    id: 'C',
    title: 'Short-pay: remittance conflicts with invoice, SKU dispute',
    account: {
      name: 'Harborline Logistics',
      id: 'CUST-0308',
      arRep: 'Alex Chen',
      apContact: 'Dana Kwan (AP)',
      phone: '(555) 030-7712'
    },
    invoice: {
      number: 'INV-3319',
      date: '2026-09-01',
      dueDate: '2026-09-15',
      terms: 'Net 14',
      total: 100000.00,
      paid: 0.00
    },
    asOf: '2026-09-28',
    channels: [
      { type: 'email', id: 'em-1', direction: 'out', date: '2026-09-17',
        subject: 'Invoice INV-3319 · payment reminder',
        body: 'Hi Dana,\n\nReminder: invoice INV-3319 for $100,000.00 is now past due (Net 14, due Sep 15). Please let us know when we can expect payment.\n\nStuut Collections' },
      { type: 'email', id: 'em-2', direction: 'in', date: '2026-09-22',
        subject: 'Re: Invoice INV-3319',
        from: 'Dana Kwan <dkwan@harborline.example>',
        body: 'Hi Alex,\n\nWe received the invoice, but we have a question on line item 3 pricing. Our buyer is reviewing. We expect to remit once that is resolved.\n\nDana Kwan, AP' },
      { type: 'voice', id: 'vc-1', direction: 'out', date: '2026-09-25', time: '11:03 AM', duration: '1:52',
        label: 'AI voice call',
        turns: [
          { speaker: 'Alex (Stuut AI)', time: '00:00',
            text: 'Hi Dana, this is Alex from Stuut Collections about invoice 3319 for $100,000. We understand there is a question on line 3. Until it is resolved, what can we expect?' },
          { speaker: 'Dana (AP)', time: '00:22',
            text: 'We are going to pay the undisputed amount today; the SKU-4471 line is wrong, we asked for a credit memo. The rest stays on hold.' },
          { speaker: 'Alex (Stuut AI)', time: '00:41',
            text: 'Understood. We will track the partial remittance and a dispute note for SKU-4471.' }
        ] },
      { type: 'remittance', id: 'rmt-1', direction: 'in', date: '2026-09-27',
        bank: 'ACH · Bank of America · ending 8812', amount: 82400.16,
        note: 'ACH payment of $82,400.16 for INV-3319. Balance withheld pending resolution of disputed line item 3 (SKU 4471): contracted unit price $82.40, invoiced $100.00 per unit. Credit memo 5000-CC-1187 requested Sep 20.' }
    ],
    remittance: null,
    expected: {
      promise: 'none',
      shortPay: true,
      amountShort: 17599.84,
      escalate: true,
      dispute: true,
      confidence: 0.95
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STUUT_CASES: STUUT_CASES };
}