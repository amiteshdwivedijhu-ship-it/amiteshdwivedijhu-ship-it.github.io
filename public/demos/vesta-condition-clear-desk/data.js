/* Sample loan file for the Condition Clear Desk. All names, dollars, and guide lines are fake. */
window.VESTA_DATA = {
  lender: "Harborline Home Loans",
  loan: {
    id: "HL-26-10871",
    purpose: "Purchase",
    product: "Conventional 30 year fixed",
    amount: 412000,
    borrowers: "Jordan and Casey Rivera",
    lock: "Oct 21, 2026",
    noteDate: "Oct 16, 2026"
  },
  people: {
    processor: "Tasha Green",
    underwriter: "Ben Okafor",
    admin: "Lena Park"
  },
  roles: [
    { id: "tasha", name: "Tasha Green", job: "processor" },
    { id: "ben", name: "Ben Okafor", job: "underwriter" },
    { id: "lena", name: "Lena Park", job: "agent admin" }
  ],
  debts: {
    housing: 3390,
    auto: 585,
    student: 310,
    cards: 120,
    total: 4405
  },
  income: {
    jordanAnnual: 74400,
    jordanMonthly: 6200,
    caseyRate: 18,
    caseyHours: 40,
    caseyBase: 3120,
    ot2024: 15600,
    ot2025: 12720,
    ot2026ytd: 5120,
    ot2026months: 8,
    ytdMonthly: 640,
    agentOt: 1180
  },
  deposit: {
    irs: 6200,
    irsDate: "Aug 14, 2026",
    irsLine: "IRS TREAS 310 TAX REF",
    zelle: 5000,
    zelleDate: "Sep 2, 2026",
    zelleLine: "ZELLE FROM M RIVERA"
  },
  guidelines: {
    "HL-UW 3.1.4": "A verbal VOE must be within 10 business days of the note date.",
    "HL-UW 4.3.1": "Overtime is usable when the file shows a 24 month history.",
    "HL-UW 4.3.2": "If overtime is declining, use the lower year to date average.",
    "HL-UW 5.2.1": "Any non-payroll deposit over 50% of monthly qualifying income must be sourced.",
    "HL-UW 5.2.3": "An IRS refund is sourced by the statement line.",
    "HL-UW 7.1.2": "Dwelling coverage must be at least the loan amount.",
    "HL-UW 8.4.1": "The appraiser must comment on comps over 1 mile."
  },
  tasks: [
    {
      id: "doc",
      name: "Doc review",
      agent: "Doc Review Agent",
      version: "",
      level: "Auto",
      threshold: 90,
      loanTypes: ["Purchase", "Refi"],
      share: ""
    },
    {
      id: "salary",
      name: "Base salary",
      agent: "Income Agent",
      version: "v1.4",
      level: "Auto",
      threshold: 90,
      loanTypes: ["Purchase", "Refi"],
      share: ""
    },
    {
      id: "variable",
      name: "Variable income",
      agent: "Income Agent",
      version: "v1.4",
      level: "Auto on a share",
      threshold: 85,
      loanTypes: ["Refi"],
      share: "25% of refi loans, 10% audit sample"
    },
    {
      id: "asset",
      name: "Large deposits",
      agent: "Asset Agent",
      version: "v2.1",
      level: "Auto",
      threshold: 85,
      loanTypes: ["Purchase", "Refi"],
      share: ""
    },
    {
      id: "appraisal",
      name: "Appraisal comments",
      agent: "Condition Agent",
      version: "v1.2",
      level: "Person approves",
      threshold: 90,
      loanTypes: [],
      share: ""
    },
    {
      id: "closing",
      name: "Closing package",
      agent: "Closing Review Agent",
      version: "v0.9",
      level: "Shadow",
      threshold: 95,
      loanTypes: [],
      share: ""
    }
  ],
  ladder: ["Shadow", "Person approves", "Auto on a share", "Auto"],
  reasons: [
    "Overtime is declining",
    "Use the 2026 year to date average",
    "Other"
  ],
  loeDraft: "Hello Jordan and Casey Rivera. We need a letter that explains the $5,000 Zelle deposit on Sep 2, 2026. Please write who sent the money and why. This is a sample draft on this page. Nothing is sent.",
  conditions: [
    {
      id: "C-01",
      title: "Verbal VOE, Jordan",
      task: "doc",
      confidence: 97,
      rule: "HL-UW 3.1.4",
      action: "Cleared. Verbal VOE on Oct 7, 2026. Note date Oct 16, 2026.",
      reasoning: [
        "The verbal VOE for Jordan Rivera is dated Oct 7, 2026.",
        "The note date is Oct 16, 2026. That is 7 business days, which is inside the 10 business day line in HL-UW 3.1.4."
      ],
      change: "A VOE older than 10 business days before the note date would fail this rule.",
      doc: {
        name: "Verbal VOE worksheet",
        page: "Page 1",
        excerpt: "Verbal verification of employment. Borrower Jordan Rivera. Employer: North County Schools. Completed Oct 7, 2026. Note date on the loan is Oct 16, 2026. Employment confirmed as active."
      },
      fields: [
        { field: "borrower", value: "Jordan Rivera", used: "Yes" },
        { field: "voe_date", value: "Oct 7, 2026", used: "Yes" },
        { field: "note_date", value: "Oct 16, 2026", used: "Yes" },
        { field: "business_days", value: "7", used: "Yes" }
      ]
    },
    {
      id: "C-02",
      title: "Salary, Jordan",
      task: "salary",
      confidence: 95,
      rule: "HL-UW 4.3.1",
      action: "Cleared. Base salary $6,200 a month.",
      reasoning: [
        "The Sep 12, 2026 paystub shows $6,200 a month.",
        "The 2025 W-2 shows $74,400 for the year, which is the same $6,200 a month.",
        "The two documents agree, so base salary is cleared. The income task recorded the call under HL-UW 4.3.1 with confidence 95."
      ],
      change: "If the paystub and the W-2 showed different monthly pay, a person would review the gap.",
      doc: {
        name: "Paystub and 2025 W-2",
        page: "Paystub page 1",
        excerpt: "Paystub dated Sep 12, 2026. Employee Jordan Rivera. Annual salary $74,400. Current monthly salary $6,200. The 2025 W-2 wages are $74,400."
      },
      fields: [
        { field: "annual_salary", value: "$74,400", used: "Yes" },
        { field: "monthly_salary", value: "$6,200", used: "Yes" },
        { field: "w2_2025", value: "$74,400", used: "Yes" },
        { field: "paystub_date", value: "Sep 12, 2026", used: "Yes" }
      ]
    },
    {
      id: "C-03",
      title: "Overtime, Casey",
      task: "variable",
      confidence: 71,
      rule: "HL-UW 4.3.1",
      action: "Recommends $1,180 a month. Did not use 2026 year to date.",
      reasoning: [
        "VOE page 2 shows overtime of $15,600 in 2024 and $12,720 in 2025.",
        "I averaged them to $1,180 a month under HL-UW 4.3.1.",
        "I did not compare to 2026 year to date."
      ],
      change: "If 2026 overtime is lower, HL-UW 4.3.2 applies.",
      doc: {
        name: "Written VOE, Casey Rivera",
        page: "Page 2",
        excerpt: "Written verification of employment, page 2. Borrower Casey Rivera. Base pay $18.00 per hour, 40 hours a week. Overtime paid: 2024 $15,600. 2025 $12,720. 2026 through Aug 31 $5,120."
      },
      fields: [
        { field: "base_rate", value: "$18.00", used: "Yes" },
        { field: "base_hours", value: "40 a week", used: "Yes" },
        { field: "ot_2024", value: "$15,600", used: "Yes" },
        { field: "ot_2025", value: "$12,720", used: "Yes" },
        { field: "ot_2026_ytd", value: "$5,120", used: "No" },
        { field: "ytd_monthly", value: "$640", used: "No" },
        { field: "averaged_monthly", value: "$1,180", used: "Yes" }
      ]
    },
    {
      id: "C-04",
      title: "$6,200 deposit Aug 14",
      task: "asset",
      confidence: 93,
      rule: "HL-UW 5.2.3",
      action: "Cleared. Statement line is IRS TREAS 310 TAX REF.",
      reasoning: [
        "The Aug 14 line reads IRS TREAS 310 TAX REF for $6,200.",
        "HL-UW 5.2.3 says an IRS refund is sourced by the statement line.",
        "No other document disagrees with that line."
      ],
      change: "A deposit with no IRS wording would need a source under HL-UW 5.2.1.",
      doc: {
        name: "Harborline Community Bank statement",
        page: "August page 2",
        excerpt: "Harborline Community Bank statement. Aug 14, 2026. Deposit $6,200. Description: IRS TREAS 310 TAX REF."
      },
      fields: [
        { field: "date", value: "Aug 14, 2026", used: "Yes" },
        { field: "amount", value: "$6,200", used: "Yes" },
        { field: "description", value: "IRS TREAS 310 TAX REF", used: "Yes" }
      ]
    },
    {
      id: "C-05",
      title: "$5,000 Zelle Sep 2",
      task: "asset",
      confidence: 90,
      rule: "HL-UW 5.2.1",
      action: "Not required. $5,000 is under the $5,250 limit.",
      reasoning: [
        "The Sep 2 Zelle deposit is $5,000.",
        "Monthly qualifying income is $10,500, so the sourcing limit is $5,250.",
        "$5,000 is under that limit, so HL-UW 5.2.1 does not require a source."
      ],
      change: "If qualifying income drops and the limit falls under $5,000, this deposit must be sourced.",
      doc: {
        name: "Harborline Community Bank statement",
        page: "September page 1",
        excerpt: "Harborline Community Bank statement. Sep 2, 2026. Deposit $5,000. Description: ZELLE FROM M RIVERA. This line is not payroll."
      },
      fields: [
        { field: "date", value: "Sep 2, 2026", used: "Yes" },
        { field: "amount", value: "$5,000", used: "Yes" },
        { field: "description", value: "ZELLE FROM M RIVERA", used: "Yes" },
        { field: "payroll", value: "No", used: "Yes" }
      ]
    },
    {
      id: "C-06",
      title: "Hazard insurance",
      task: "doc",
      confidence: 92,
      rule: "HL-UW 7.1.2",
      action: "Cleared. Dwelling coverage $430,000.",
      reasoning: [
        "The hazard policy lists dwelling coverage of $430,000.",
        "The loan amount is $412,000.",
        "Coverage is at least the loan amount, so HL-UW 7.1.2 is met."
      ],
      change: "Coverage under $412,000 would fail this rule.",
      doc: {
        name: "Hazard policy declarations",
        page: "Page 1",
        excerpt: "Harborline Mutual hazard policy. Named insured Jordan Rivera and Casey Rivera. Dwelling coverage $430,000. Loan amount listed on the declarations is $412,000."
      },
      fields: [
        { field: "dwelling_coverage", value: "$430,000", used: "Yes" },
        { field: "loan_amount", value: "$412,000", used: "Yes" }
      ]
    },
    {
      id: "C-07",
      title: "Appraisal comp distance",
      task: "appraisal",
      confidence: 82,
      rule: "HL-UW 8.4.1",
      action: "Recommends clear. Comp 2 is 1.4 miles and has a short comment.",
      reasoning: [
        "Comp 2 is 1.4 miles from the subject.",
        "HL-UW 8.4.1 says the appraiser must comment on comps over 1 mile. The report has a short comment.",
        "Confidence is 82, under the 90 line, so this was not cleared alone."
      ],
      change: "A clearer comment that names the distance and why the comp still fits would raise confidence.",
      doc: {
        name: "Appraisal report",
        page: "Sales grid, page 4",
        excerpt: "Appraisal report, sales comparison. Comp 2 is 1.4 miles northeast. Appraiser comment: Comp 2 is over 1 mile because closer sales are newer builds. A distance adjustment was applied."
      },
      fields: [
        { field: "comp", value: "Comp 2", used: "Yes" },
        { field: "distance_miles", value: "1.4", used: "Yes" },
        { field: "comment_present", value: "Yes, short", used: "Yes" }
      ]
    },
    {
      id: "C-08",
      title: "Closing package",
      task: "closing",
      confidence: null,
      rule: "",
      action: "Open. Waits on C-03, C-05, and C-07.",
      reasoning: [
        "The closing package stays open until overtime, the Sep 2 deposit, and the appraisal comment are finished.",
        "The closing agent does not clear a package while those items are open.",
        "An agent also does not clear this package alone. The task is set to Shadow."
      ],
      change: "When C-03, C-05, and C-07 are cleared by the rule or by a named person, a person can clear this package.",
      doc: {
        name: "Closing package checklist",
        page: "Page 1",
        excerpt: "Closing package checklist. File HL-26-10871. Still open: overtime income, the Sep 2 deposit, and the appraisal distance comment. Package not released."
      },
      fields: [
        { field: "file", value: "HL-26-10871", used: "Yes" },
        { field: "waits_on", value: "C-03, C-05, C-07", used: "Yes" },
        { field: "released", value: "No", used: "Yes" }
      ]
    }
  ],
  cases: [
    {
      id: "RC-01",
      family: "Income",
      title: "W-2 and paystub match",
      mustPass: true,
      input: "2025 W-2 wages $74,400. Sep 12 paystub monthly pay $6,200.",
      agent: "$6,200 a month",
      correct: "$6,200 a month",
      rule: "HL-UW 4.3.1"
    },
    {
      id: "RC-02",
      family: "Income",
      title: "Hourly base pay",
      mustPass: false,
      input: "$18.00 an hour and 40 hours a week. No bonus.",
      agent: "$3,120 a month",
      correct: "$3,120 a month",
      rule: "HL-UW 4.3.1"
    },
    {
      id: "RC-03",
      family: "Income",
      title: "Flat overtime uses 24 months",
      mustPass: true,
      input: "Overtime $9,600 in 2024 and $9,600 in 2025. 2026 year to date is the same pace.",
      agent: "$800 a month",
      correct: "$800 a month",
      rule: "HL-UW 4.3.1"
    },
    {
      id: "RC-04",
      family: "Income",
      title: "Bonus with two even years",
      mustPass: false,
      input: "Bonus $2,400 in 2024 and $2,400 in 2025.",
      agent: "$200 a month",
      correct: "$200 a month",
      rule: "HL-UW 4.3.1"
    },
    {
      id: "RC-05",
      family: "Income",
      title: "Second job base only",
      mustPass: false,
      input: "Second job $15 an hour, 10 hours a week, no overtime.",
      agent: "$650 a month",
      correct: "$650 a month",
      rule: "HL-UW 4.3.1"
    },
    {
      id: "RC-06",
      family: "Income",
      title: "New salary on the latest stub",
      mustPass: false,
      input: "Older stub $5,000 a month. Latest stub $5,400 a month. W-2 is the prior year.",
      agent: "$5,400 a month",
      correct: "$5,400 a month",
      rule: "HL-UW 4.3.1"
    },
    {
      id: "RC-07",
      family: "Asset",
      title: "IRS refund line",
      mustPass: true,
      input: "Statement line IRS TREAS 310 TAX REF for $6,200.",
      agent: "Sourced by the statement line",
      correct: "Sourced by the statement line",
      rule: "HL-UW 5.2.3"
    },
    {
      id: "RC-08",
      family: "Asset",
      title: "Small Zelle under the limit",
      mustPass: false,
      input: "$400 Zelle. Monthly income $10,500. Limit $5,250.",
      agent: "Source not required",
      correct: "Source not required",
      rule: "HL-UW 5.2.1"
    },
    {
      id: "RC-09",
      family: "Asset",
      title: "Large cash deposit",
      mustPass: false,
      input: "$8,000 cash deposit. Monthly income $10,500. Limit $5,250.",
      agent: "Must be sourced",
      correct: "Must be sourced",
      rule: "HL-UW 5.2.1"
    },
    {
      id: "RC-10",
      family: "Condition",
      title: "Verbal VOE timing",
      mustPass: true,
      input: "VOE Oct 7, 2026. Note date Oct 16, 2026.",
      agent: "Within 10 business days",
      correct: "Within 10 business days",
      rule: "HL-UW 3.1.4"
    },
    {
      id: "RC-11",
      family: "Condition",
      title: "Comp inside 1 mile",
      mustPass: false,
      input: "Comp 1 is 0.6 miles. No distance comment.",
      agent: "Comment not required",
      correct: "Comment not required",
      rule: "HL-UW 8.4.1"
    }
  ],
  seedLog: [
    {
      at: "Oct 8, 2026, 8:05 AM",
      actor: "Doc Review Agent",
      sources: "Verbal VOE worksheet, page 1. Fields voe_date, note_date. HL-UW 3.1.4.",
      before: "C-01 Open",
      after: "C-01 Cleared by the agent. 7 business days."
    },
    {
      at: "Oct 8, 2026, 8:07 AM",
      actor: "Income Agent v1.4",
      sources: "Paystub Sep 12, 2026 and 2025 W-2. Fields monthly_salary, w2_2025. HL-UW 4.3.1.",
      before: "C-02 Open",
      after: "C-02 Cleared by the agent at $6,200 a month."
    },
    {
      at: "Oct 8, 2026, 8:08 AM",
      actor: "Income Agent v1.4",
      sources: "Written VOE page 2. Fields ot_2024 and ot_2025. Field ot_2026_ytd not used. HL-UW 4.3.1.",
      before: "C-03 Open",
      after: "C-03 Needs review. Recommended $1,180. Confidence 71."
    },
    {
      at: "Oct 8, 2026, 8:12 AM",
      actor: "Asset Agent v2.1",
      sources: "Bank statement August page 2. Field description IRS TREAS 310 TAX REF. HL-UW 5.2.3.",
      before: "C-04 Open",
      after: "C-04 Cleared by the agent. IRS refund sourced by the line."
    },
    {
      at: "Oct 8, 2026, 8:13 AM",
      actor: "Asset Agent v2.1",
      sources: "Bank statement September page 1. Zelle $5,000. Limit $5,250. HL-UW 5.2.1.",
      before: "C-05 Open",
      after: "C-05 Cleared by the agent. Source not required."
    },
    {
      at: "Oct 8, 2026, 8:16 AM",
      actor: "Doc Review Agent",
      sources: "Hazard declarations page 1. Dwelling $430,000. Loan $412,000. HL-UW 7.1.2.",
      before: "C-06 Open",
      after: "C-06 Cleared by the agent."
    },
    {
      at: "Oct 8, 2026, 8:20 AM",
      actor: "Condition Agent v1.2",
      sources: "Appraisal sales grid page 4. Comp 2 at 1.4 miles. HL-UW 8.4.1.",
      before: "C-07 Open",
      after: "C-07 Needs review. Recommended clear. Confidence 82."
    },
    {
      at: "Oct 8, 2026, 8:22 AM",
      actor: "Closing Review Agent v0.9",
      sources: "Closing checklist page 1. Open items C-03, C-05, C-07.",
      before: "C-08 not started",
      after: "C-08 Open. Waiting on C-03, C-05, and C-07."
    }
  ]
};
