/* Synthetic Halcyon Robotics expenses. Not a Navan product. */
window.NAVAN_DATA = {
  company: "Halcyon Robotics",
  policyName: "Halcyon Robotics T&E Policy v4",
  admin: "Renata Silva",
  controller: "Marcus Bell",
  policy: [
    { id: "P-2.1", text: "Receipt required over $75." },
    { id: "P-3.1", text: "Travel dinner up to $85 per person including tax and tip." },
    { id: "P-3.2", text: "Tips over 20% of the pre-tax bill are not reimbursed." },
    { id: "P-3.4", text: "Alcohol only at client meals with a named client attendee." },
    { id: "P-4.1", text: "Hotels up to $325 a night in NYC, SF, Boston, $225 elsewhere." },
    { id: "P-4.3", text: "Weekend spend needs a business reason unless inside an approved trip." },
    { id: "P-5.2", text: "Software must be bought through IT." },
    { id: "P-6.1", text: "Same merchant, amount, and date twice is a duplicate." },
    { id: "P-7.1", text: "Meals or gifts for a government official need Compliance approval first.", humanOnly: true },
    { id: "P-8.1", text: "Receipts that look altered or generated go to Finance review.", humanOnly: true }
  ],
  rules: [
    { id: "P-2.1", reviewed: 410, agreed: 408, bar: 0.95, threshold: 0.90, humanOnly: false },
    { id: "P-3.2", reviewed: 220, agreed: 214, bar: 0.95, threshold: 0.90, humanOnly: false, bands: [
      { min: 0.50, max: 0.89, reviewed: 40, agreed: 35 },
      { min: 0.90, max: 1.00, reviewed: 180, agreed: 179 }
    ] },
    { id: "P-3.4", reviewed: 96, agreed: 71, bar: 0.95, threshold: 0.90, humanOnly: false, bands: [
      { min: 0.50, max: 0.69, reviewed: 30, agreed: 15 },
      { min: 0.70, max: 0.89, reviewed: 41, agreed: 32 },
      { min: 0.90, max: 1.00, reviewed: 25, agreed: 24 }
    ] },
    { id: "P-4.1", reviewed: 180, agreed: 177, bar: 0.95, threshold: 0.90, humanOnly: false },
    { id: "P-4.3", reviewed: 140, agreed: 113, bar: 0.95, threshold: 0.90, humanOnly: false, bands: [
      { min: 0.50, max: 0.59, reviewed: 18, agreed: 11 },
      { min: 0.60, max: 0.69, reviewed: 22, agreed: 14 },
      { min: 0.70, max: 0.79, reviewed: 30, agreed: 24 },
      { min: 0.80, max: 0.89, reviewed: 40, agreed: 36 },
      { min: 0.90, max: 1.00, reviewed: 30, agreed: 28 }
    ] },
    { id: "P-5.2", reviewed: 64, agreed: 62, bar: 0.95, threshold: 0.90, humanOnly: false },
    { id: "P-6.1", reviewed: 88, agreed: 87, bar: 0.95, threshold: 0.95, humanOnly: false },
    { id: "P-7.1", reviewed: 0, agreed: 0, bar: 0.95, threshold: 0.90, humanOnly: true },
    { id: "P-8.1", reviewed: 0, agreed: 0, bar: 0.95, threshold: 0.90, humanOnly: true },
    { id: "GL-MEAL", name: "GL meals and airfare", reviewed: 1200, agreed: 1188, bar: 0.97, threshold: 0.90, humanOnly: false, text: "Meals code to GL 6110 and airfare codes to GL 6120 when the merchant is clear." },
    { id: "GL-EQUIP", name: "GL supplies vs equipment", reviewed: 75, agreed: 58, bar: 0.97, threshold: 0.90, humanOnly: false, text: "A purchase that could be supplies (GL 6400) or equipment (GL 1500) needs a person when the rule is not sure." }
  ],
  transactions: [
    {
      id: "T-1001", employee: "Theo Park", shortName: "T. Park", merchant: "Ember and Oak", detail: "3 people",
      amount: 233.09, ruleId: "P-3.2", confidence: 0.97, verdict: "auto-acted", verdictLabel: "Auto-acted: fix requested",
      gl: "6110 Meals", receiptField: "Tip",
      finding: "The tip of $48.00 is 28% of the $170.00 subtotal. Policy 3.2 caps tips at 20% ($34.00), so $14.00 is not reimbursed. The 3.1 dinner cap is not hit ($233.09 for 3 people is under $255.00).",
      receipt: [
        "EMBER AND OAK",
        "Dinner, 3 guests",
        "Subtotal        170.00",
        "Tax              15.09",
        { text: "Tip              48.00", used: true },
        "Total           233.09"
      ],
      phone: "Your dinner at Ember and Oak was flagged. Policy 3.2: Tips over 20% of the pre-tax bill are not reimbursed. Your tip was $48.00 on $170.00 (28%). We will reimburse $219.09 of $233.09."
    },
    {
      id: "T-1002", employee: "Ines Moreau", shortName: "I. Moreau", merchant: "Harborline Hotel Boston", detail: "2 nights",
      amount: 778.00, ruleId: "P-4.1", confidence: 0.99, verdict: "auto-acted", verdictLabel: "Auto-acted: $128 over cap",
      gl: "6140 Lodging", receiptField: "Nightly rate",
      finding: "The nightly rate is $389.00 in Boston. Policy 4.1 caps Boston at $325 a night, so two nights are $128.00 over the cap.",
      receipt: [
        "HARBORLINE HOTEL",
        "City: Boston",
        "Nights: 2",
        { text: "Nightly rate    389.00", used: true },
        "Total           778.00"
      ]
    },
    {
      id: "T-1003", employee: "Kwame Asante", shortName: "K. Asante", merchant: "Copperleaf Wine Bar", detail: "with J. Ruiz (client)",
      amount: 96.40, ruleId: "P-3.4", confidence: 0.71, verdict: "needs-review", verdictLabel: "Needs review",
      gl: "6110 Meals", receiptField: "Wine", clientAttendee: true,
      finding: "The receipt lists wine and a guest line for J. Ruiz (client). Policy 3.4 allows alcohol only at a client meal with a named client. The alcohol rule is 74.0% precise, so a person still reviews it.",
      receipt: [
        "COPPERLEAF WINE BAR",
        "Guest: J. Ruiz (client)",
        { text: "Wine, house red  42.00", used: true },
        "Food             54.40",
        "Total            96.40"
      ]
    },
    {
      id: "T-1004", employee: "Sam Okafor", shortName: "S. Okafor", merchant: "City Ride", detail: "Saturday, inside trip TR-882",
      amount: 64.20, ruleId: "P-4.3", confidence: 0.88, verdict: "needs-review", verdictLabel: "Needs review",
      gl: "6150 Ground", receiptField: "Date",
      finding: "This Saturday rideshare is inside approved trip TR-882. Policy 4.3 still needs a business reason for weekend spend unless the trip clearly covers it, and confidence is under the threshold.",
      receipt: [
        "CITY RIDE",
        { text: "Date: Saturday", used: true },
        "Trip: TR-882",
        "Amount           64.20",
        "Business reason: (blank)"
      ]
    },
    {
      id: "T-1005", employee: "Lena Fischer", shortName: "L. Fischer", merchant: "Draftly Pro", detail: "annual plan",
      amount: 240.00, ruleId: "P-5.2", confidence: 0.93, verdict: "auto-acted", verdictLabel: "Auto-acted: fix requested",
      gl: "6320 Software", receiptField: "Channel",
      finding: "Draftly Pro annual is $240.00 and was bought on a card. Policy 5.2 says software must be bought through IT.",
      receipt: [
        "DRAFTLY PRO",
        "Plan: Annual",
        "Amount          240.00",
        "Buyer: L. Fischer",
        { text: "Channel: card, not IT portal", used: true }
      ]
    },
    {
      id: "T-1006", employee: "Theo Park", shortName: "T. Park", merchant: "Bluebird Cafe", detail: "same as T-0977",
      amount: 38.50, ruleId: "P-6.1", confidence: 0.99, verdict: "auto-acted", verdictLabel: "Auto-acted: held",
      gl: "6110 Meals", receiptField: "Amount and date",
      finding: "Bluebird Cafe $38.50 on this date already posted as T-0977. Policy 6.1 treats the same merchant, amount, and date as a duplicate.",
      receipt: [
        "BLUEBIRD CAFE",
        "Date: Oct 2, 2026",
        { text: "Amount           38.50", used: true },
        "Prior hit: T-0977",
        "Same merchant, amount, and date"
      ]
    },
    {
      id: "T-1007", employee: "Ines Moreau", shortName: "I. Moreau", merchant: "Rideshare", detail: "no receipt",
      amount: 142.00, ruleId: "P-2.1", confidence: 1.00, verdict: "auto-acted", verdictLabel: "Auto-acted: receipt requested",
      gl: "6150 Ground", receiptField: "Receipt",
      finding: "This rideshare is $142.00 and has no receipt. Policy 2.1 requires a receipt on any expense over $75.",
      receipt: [
        "RIDESHARE",
        "Amount          142.00",
        { text: "Receipt: missing", used: true }
      ]
    },
    {
      id: "T-1008", employee: "Ray Duarte", shortName: "R. Duarte", merchant: "Lantern House", detail: "city water deputy director",
      amount: 186.00, ruleId: "P-7.1", confidence: 0.90, verdict: "needs-review", verdictLabel: "Needs review (Human only)",
      humanOnly: true, gl: "6110 Meals", receiptField: "Guest",
      finding: "The guest is a city water deputy director. Policy 7.1 says meals for a government official need Compliance approval first. This rule is Human only.",
      receipt: [
        "LANTERN HOUSE",
        { text: "Guest: city water deputy director", used: true },
        "Amount          186.00",
        "Compliance approval: none"
      ]
    },
    {
      id: "T-1009", employee: "Sam Okafor", shortName: "S. Okafor", merchant: "Greenline Deli", detail: "lunch",
      amount: 24.10, ruleId: "GL-MEAL", confidence: 0.98, verdict: "auto-approved", verdictLabel: "Auto-approved, GL 6110",
      gl: "6110 Meals", receiptField: "Amount", noPolicyFlag: true,
      finding: "No policy flag. The meals coding rule assigns GL 6110. Confidence is 0.98 and the coding rule clears the bar.",
      receipt: [
        "GREENLINE DELI",
        { text: "Amount           24.10", used: true },
        "Suggested GL: 6110 Meals"
      ]
    },
    {
      id: "T-1010", employee: "Kwame Asante", shortName: "K. Asante", merchant: "Skyward Air", detail: "flight",
      amount: 412.00, ruleId: "GL-MEAL", confidence: 0.99, verdict: "auto-approved", verdictLabel: "Auto-approved, GL 6120",
      gl: "6120 Airfare", receiptField: "Amount", noPolicyFlag: true,
      finding: "No policy flag. The airfare coding rule assigns GL 6120. Confidence is 0.99 and the coding rule clears the bar.",
      receipt: [
        "SKYWARD AIR",
        { text: "Amount          412.00", used: true },
        "Suggested GL: 6120 Airfare"
      ]
    },
    {
      id: "T-1011", employee: "Lena Fischer", shortName: "L. Fischer", merchant: "Quillmart", detail: "chair",
      amount: 486.00, ruleId: "GL-EQUIP", confidence: 0.62, verdict: "needs-review", verdictLabel: "Needs review: 6400 Supplies or 1500 Equipment",
      gl: "6400 Supplies or 1500 Equipment", receiptField: "Item",
      finding: "A $486.00 chair could be GL 6400 Supplies or GL 1500 Equipment. The supplies versus equipment rule is 77.3% precise, under the 97% bar.",
      receipt: [
        "QUILLMART",
        { text: "Item: chair", used: true },
        "Amount          486.00",
        "GL guess: 6400 or 1500"
      ]
    },
    {
      id: "T-1012", employee: "Theo Park", shortName: "T. Park", merchant: "Lumen Bistro", detail: "receipt looks generated",
      amount: 118.00, ruleId: "P-8.1", confidence: 0.84, verdict: "needs-review", verdictLabel: "Needs review (Human only)",
      humanOnly: true, gl: "6110 Meals", receiptField: "Image check",
      finding: "The receipt image looks generated. Policy 8.1 sends altered or generated receipts to Finance review. This rule is Human only.",
      receipt: [
        "LUMEN BISTRO",
        "Amount          118.00",
        { text: "Image check: looks generated", used: true }
      ]
    }
  ],
  evals: [
    { id: "EV-001", source: "seed", rule: "P-2.1", expected: "Flag", must: true, by: "Seed", summary: "Rideshare $142 with no receipt." },
    { id: "EV-002", source: "seed", rule: "P-3.1", expected: "Approve", must: false, by: "Seed", summary: "Dinner at $70 per person. Under $85 and under $95." },
    { id: "EV-003", source: "seed", rule: "P-3.2", expected: "Flag", must: true, by: "Seed", summary: "Tip is 28% of the pre-tax bill." },
    { id: "EV-004", source: "seed", rule: "P-3.2", expected: "Approve", must: false, by: "Seed", summary: "Tip is 18% of the pre-tax bill." },
    { id: "EV-005", source: "seed", rule: "P-3.1", expected: "Flag", must: false, by: "Seed", summary: "Dinner at $110 per person. Over $85 and over $95." },
    { id: "EV-006", source: "seed", rule: "P-3.4", expected: "Flag", must: true, by: "Seed", summary: "Team dinner with wine and no client.", clientAttendee: false },
    { id: "EV-007", source: "seed", rule: "P-4.1", expected: "Flag", must: true, by: "Seed", summary: "Boston hotel at $400 a night." },
    { id: "EV-008", source: "seed", rule: "P-4.1", expected: "Approve", must: false, by: "Seed", summary: "Boston hotel at $300 a night." },
    { id: "EV-009", source: "seed", rule: "P-4.3", expected: "Flag", must: true, by: "Seed", summary: "Weekend spend outside a trip, with no business reason." },
    { id: "EV-010", source: "seed", rule: "P-5.2", expected: "Flag", must: true, by: "Seed", summary: "Software bought on a card, not through IT." },
    { id: "EV-011", source: "seed", rule: "P-6.1", expected: "Flag", must: true, by: "Seed", summary: "Same merchant, amount, and date as an earlier expense." },
    { id: "EV-012", source: "seed", rule: "P-7.1", expected: "Flag", must: true, by: "Seed", summary: "Meal with a government official and no Compliance approval." },
    { id: "EV-013", source: "seed", rule: "P-8.1", expected: "Flag", must: true, by: "Seed", summary: "Receipt looks generated." },
    { id: "EV-014", source: "seed", rule: "GL-EQUIP", expected: "Needs review", must: false, by: "Seed", summary: "Chair that could be supplies or equipment." }
  ],
  changes: [
    {
      id: "C-12",
      title: "Policy edit",
      detail: "P-3.1 dinner cap would move from $85 to $95 per person. Simulated. Cases under both caps still approve. Cases over both caps still flag."
    },
    {
      id: "C-13",
      title: "Model update (simulated)",
      detail: "Better at spotting alcohol, but it ignores attendee type. Any P-3.4 case with a client attendee and expected Approve fails. Last run: Oct 6, passed 14 of 14."
    }
  ],
  seedLog: [
    { at: "Oct 7, 2026, 8:00 AM", actor: "Engine", line: "P-3.2", text: "Auto-acted on T-1001. Asked for a tip fix." },
    { at: "Oct 7, 2026, 8:01 AM", actor: "Engine", line: "P-4.1", text: "Auto-acted on T-1002. Hotel is $128.00 over the Boston cap." },
    { at: "Oct 7, 2026, 8:02 AM", actor: "Engine", line: "P-5.2", text: "Auto-acted on T-1005. Asked for an IT purchase." },
    { at: "Oct 7, 2026, 8:03 AM", actor: "Engine", line: "P-6.1", text: "Auto-acted on T-1006. Held the duplicate." },
    { at: "Oct 7, 2026, 8:04 AM", actor: "Engine", line: "P-2.1", text: "Auto-acted on T-1007. Asked for a receipt." },
    { at: "Oct 7, 2026, 8:05 AM", actor: "Engine", line: "GL-MEAL", text: "Auto-approved T-1009 to GL 6110." },
    { at: "Oct 7, 2026, 8:06 AM", actor: "Engine", line: "GL-MEAL", text: "Auto-approved T-1010 to GL 6120." },
    { at: "Oct 7, 2026, 8:07 AM", actor: "Engine", line: "P-3.4", text: "Sent T-1003 to Needs review. 90-day precision is 74.0%, under the 95% bar." },
    { at: "Oct 7, 2026, 8:08 AM", actor: "Engine", line: "P-4.3", text: "Sent T-1004 to Needs review. 90-day precision is 80.7%, under the 95% bar." },
    { at: "Oct 7, 2026, 8:09 AM", actor: "Engine", line: "P-7.1", text: "Sent T-1008 to a person. Rule is Human only." },
    { at: "Oct 7, 2026, 8:10 AM", actor: "Engine", line: "GL-EQUIP", text: "Sent T-1011 to Needs review. Precision is 77.3%, under the 97% bar." },
    { at: "Oct 7, 2026, 8:11 AM", actor: "Engine", line: "P-8.1", text: "Sent T-1012 to Finance review. Rule is Human only." }
  ]
};
