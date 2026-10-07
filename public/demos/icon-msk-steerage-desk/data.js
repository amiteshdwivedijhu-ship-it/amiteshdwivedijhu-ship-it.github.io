/* Synthetic members and providers. Initials only. No PHI. */
(function () {
  const PLAN_A = "Lakeshore Health Plan";
  const PLAN_B = "Granite State Medicare Advantage";

  function member(partial) {
    return Object.assign({
      planName: partial.plan === "Plan A" ? PLAN_A : PLAN_B,
      status: "Open"
    }, partial);
  }

  const members = [
    member({
      id: "M-014", initials: "R.K.", ageBand: "60-64", plan: "Plan A", risk: 0.82,
      costBand: "$8,000 to $12,000",
      dataAgeDays: 6, claimsThrough: "2026-10-01",
      reasons: [
        { text: "Knee MRI ordered", claimRef: "CL-88213", date: "2026-09-29" },
        { text: "Ortho consult at high-cost hospital", claimRef: "CL-88240", date: "2026-10-01" }
      ],
      timeline: [
        { date: "2026-09-12", text: "Primary care visit for knee pain", claimRef: "CL-87990" },
        { date: "2026-09-29", text: "Knee MRI ordered", claimRef: "CL-88213" },
        { date: "2026-10-01", text: "Ortho consult at high-cost hospital", claimRef: "CL-88240" },
        { date: "2026-10-02", text: "PT eval scheduled, then missed", claimRef: "CL-88255" }
      ],
      referral: { type: "Ortho surgeon", provider: "Riverside Hospital Ortho (fake)", score: 2, cost: 14500 }
    }),
    member({
      id: "M-002", initials: "A.J.", ageBand: "55-59", plan: "Plan A", risk: 0.79,
      costBand: "$4,000 to $7,000", dataAgeDays: 4, claimsThrough: "2026-10-03",
      reasons: [
        { text: "3 missed PT visits", claimRef: "CL-87011", date: "2026-09-20" },
        { text: "Knee MRI ordered", claimRef: "CL-87102", date: "2026-09-28" }
      ],
      timeline: [
        { date: "2026-09-08", text: "Primary care visit for knee stiffness", claimRef: "CL-86940" },
        { date: "2026-09-20", text: "Third missed PT visit", claimRef: "CL-87011" },
        { date: "2026-09-28", text: "Knee MRI ordered", claimRef: "CL-87102" }
      ],
      referral: { type: "PT", provider: "QuickMove PT (fake)", score: 2, cost: 3900 }
    }),
    member({
      id: "M-008", initials: "S.P.", ageBand: "65-69", plan: "Plan A", risk: 0.76,
      costBand: "$5,000 to $9,000", dataAgeDays: 8, claimsThrough: "2026-09-29",
      reasons: [
        { text: "Shoulder MRI ordered", claimRef: "CL-86440", date: "2026-09-22" },
        { text: "Opioid fill", claimRef: "CL-86510", date: "2026-09-25" }
      ],
      timeline: [
        { date: "2026-09-02", text: "Primary care visit for shoulder pain", claimRef: "CL-86110" },
        { date: "2026-09-22", text: "Shoulder MRI ordered", claimRef: "CL-86440" },
        { date: "2026-09-25", text: "Opioid fill", claimRef: "CL-86510" }
      ],
      referral: { type: "Imaging", provider: "Riverside Imaging (fake)", score: 2, cost: 9800 }
    }),
    member({
      id: "M-011", initials: "L.M.", ageBand: "50-54", plan: "Plan B", risk: 0.74,
      costBand: "$6,000 to $10,000", dataAgeDays: 8, claimsThrough: "2026-09-29",
      reasons: [
        { text: "Ortho consult at high-cost hospital", claimRef: "CL-86002", date: "2026-09-18" },
        { text: "Hip replacement consult", claimRef: "CL-86088", date: "2026-09-27" }
      ],
      timeline: [
        { date: "2026-09-04", text: "Primary care visit for hip pain", claimRef: "CL-85810" },
        { date: "2026-09-18", text: "Ortho consult at high-cost hospital", claimRef: "CL-86002" },
        { date: "2026-09-27", text: "Hip replacement consult", claimRef: "CL-86088" }
      ],
      referral: { type: "Ortho surgeon", provider: "Metro Bone and Joint (fake)", score: 3, cost: 11200 }
    }),
    member({
      id: "M-015", initials: "C.D.", ageBand: "70-74", plan: "Plan A", risk: 0.71,
      costBand: "$7,000 to $11,000", dataAgeDays: 5, claimsThrough: "2026-10-02",
      reasons: [{ text: "Spine injection series", claimRef: "CL-87720", date: "2026-09-30" }],
      timeline: [
        { date: "2026-09-11", text: "Primary care visit for back pain", claimRef: "CL-87400" },
        { date: "2026-09-30", text: "Spine injection series ordered", claimRef: "CL-87720" }
      ],
      referral: { type: "Ortho surgeon", provider: "Riverside Hospital Ortho (fake)", score: 2, cost: 14500 }
    }),
    member({
      id: "M-018", initials: "N.V.", ageBand: "45-49", plan: "Plan A", risk: 0.68,
      costBand: "$3,000 to $5,000", dataAgeDays: 3, claimsThrough: "2026-10-04",
      reasons: [{ text: "3 missed PT visits", claimRef: "CL-88100", date: "2026-10-03" }],
      timeline: [
        { date: "2026-09-15", text: "PT plan started", claimRef: "CL-87660" },
        { date: "2026-10-03", text: "Third missed PT visit", claimRef: "CL-88100" }
      ],
      referral: { type: "PT", provider: "QuickMove PT (fake)", score: 2, cost: 3900 }
    }),
    member({
      id: "M-019", initials: "H.T.", ageBand: "60-64", plan: "Plan B", risk: 0.66,
      costBand: "$4,000 to $8,000", dataAgeDays: 5, claimsThrough: "2026-10-02",
      reasons: [{ text: "Repeat ER visit for back pain", claimRef: "CL-88310", date: "2026-10-02" }],
      timeline: [
        { date: "2026-09-21", text: "ER visit for back pain", claimRef: "CL-87910" },
        { date: "2026-10-02", text: "Repeat ER visit for back pain", claimRef: "CL-88310" }
      ],
      referral: { type: "Imaging", provider: "Riverside Imaging (fake)", score: 2, cost: 9800 }
    }),
    member({
      id: "M-021", initials: "B.W.", ageBand: "55-59", plan: "Plan A", risk: 0.63,
      costBand: "$6,000 to $9,000", dataAgeDays: 9, claimsThrough: "2026-09-28",
      reasons: [{ text: "Knee MRI ordered", claimRef: "CL-86880", date: "2026-09-26" }],
      timeline: [
        { date: "2026-09-09", text: "Primary care visit", claimRef: "CL-86610" },
        { date: "2026-09-26", text: "Knee MRI ordered", claimRef: "CL-86880" }
      ],
      referral: { type: "Ortho surgeon", provider: "Metro Bone and Joint (fake)", score: 3, cost: 11200 }
    }),
    member({
      id: "M-022", initials: "F.G.", ageBand: "40-44", plan: "Plan A", risk: 0.61,
      costBand: "$2,000 to $4,000", dataAgeDays: 2, claimsThrough: "2026-10-05",
      reasons: [{ text: "3 missed PT visits", claimRef: "CL-88420", date: "2026-10-04" }],
      timeline: [
        { date: "2026-09-18", text: "PT plan started", claimRef: "CL-87840" },
        { date: "2026-10-04", text: "Third missed PT visit", claimRef: "CL-88420" }
      ],
      referral: { type: "PT", provider: "Cedar PT and Rehab (fake)", score: 3, cost: 4600 }
    }),
    member({
      id: "M-023", initials: "Y.S.", ageBand: "65-69", plan: "Plan B", risk: 0.58,
      costBand: "$4,000 to $7,000", dataAgeDays: 10, claimsThrough: "2026-09-27",
      reasons: [{ text: "Shoulder MRI ordered", claimRef: "CL-85990", date: "2026-09-24" }],
      timeline: [
        { date: "2026-09-06", text: "Primary care visit", claimRef: "CL-85540" },
        { date: "2026-09-24", text: "Shoulder MRI ordered", claimRef: "CL-85990" }
      ],
      referral: { type: "Imaging", provider: "Oak Street Imaging (fake)", score: 4, cost: 5100 }
    }),
    member({
      id: "M-024", initials: "K.L.", ageBand: "50-54", plan: "Plan A", risk: 0.55,
      costBand: "$5,000 to $8,000", dataAgeDays: 7, claimsThrough: "2026-09-30",
      reasons: [{ text: "Opioid fill", claimRef: "CL-87220", date: "2026-09-29" }],
      timeline: [
        { date: "2026-09-14", text: "Ortho follow up", claimRef: "CL-87040" },
        { date: "2026-09-29", text: "Opioid fill", claimRef: "CL-87220" }
      ],
      referral: { type: "Ortho surgeon", provider: "Harbor Joint Clinic (fake)", score: 4, cost: 7100 }
    }),
    member({
      id: "M-025", initials: "P.N.", ageBand: "60-64", plan: "Plan A", risk: 0.52,
      costBand: "$2,000 to $4,000", dataAgeDays: 6, claimsThrough: "2026-10-01",
      reasons: [{ text: "3 missed PT visits", claimRef: "CL-87330", date: "2026-09-30" }],
      timeline: [
        { date: "2026-09-10", text: "PT eval", claimRef: "CL-86770" },
        { date: "2026-09-30", text: "Third missed PT visit", claimRef: "CL-87330" }
      ],
      referral: { type: "PT", provider: "Summit PT Studio (fake)", score: 4, cost: 4200 }
    }),
    member({
      id: "M-026", initials: "D.A.", ageBand: "35-39", plan: "Plan A", risk: 0.48,
      costBand: "$3,000 to $6,000", dataAgeDays: 11, claimsThrough: "2026-09-26",
      reasons: [{ text: "Knee MRI ordered", claimRef: "CL-86221", date: "2026-09-19" }],
      timeline: [
        { date: "2026-09-05", text: "Primary care visit", claimRef: "CL-85900" },
        { date: "2026-09-19", text: "Knee MRI ordered", claimRef: "CL-86221" }
      ],
      referral: { type: "Imaging", provider: "Clearview Imaging Center (fake)", score: 5, cost: 4400 }
    }),
    member({
      id: "M-027", initials: "I.C.", ageBand: "70-74", plan: "Plan B", risk: 0.46,
      costBand: "$6,000 to $9,000", dataAgeDays: 12, claimsThrough: "2026-09-25",
      reasons: [{ text: "Hip replacement consult", claimRef: "CL-85770", date: "2026-09-16" }],
      timeline: [
        { date: "2026-08-30", text: "Primary care visit", claimRef: "CL-85120" },
        { date: "2026-09-16", text: "Hip replacement consult", claimRef: "CL-85770" }
      ],
      referral: { type: "Ortho surgeon", provider: "Valley Ortho Partners (fake)", score: 5, cost: 6800 }
    }),
    member({
      id: "M-028", initials: "O.E.", ageBand: "55-59", plan: "Plan A", risk: 0.44,
      costBand: "$2,000 to $4,000", dataAgeDays: 4, claimsThrough: "2026-10-03",
      reasons: [{ text: "3 missed PT visits", claimRef: "CL-88002", date: "2026-10-01" }],
      timeline: [
        { date: "2026-09-17", text: "PT plan started", claimRef: "CL-87601" },
        { date: "2026-10-01", text: "Third missed PT visit", claimRef: "CL-88002" }
      ],
      referral: { type: "PT", provider: "Lakeside PT Collective (fake)", score: 5, cost: 3800 }
    }),
    member({
      id: "M-029", initials: "U.H.", ageBand: "45-49", plan: "Plan A", risk: 0.41,
      costBand: "$3,000 to $5,000", dataAgeDays: 9, claimsThrough: "2026-09-28",
      reasons: [{ text: "Shoulder MRI ordered", claimRef: "CL-86950", date: "2026-09-23" }],
      timeline: [
        { date: "2026-09-07", text: "Primary care visit", claimRef: "CL-86480" },
        { date: "2026-09-23", text: "Shoulder MRI ordered", claimRef: "CL-86950" }
      ],
      referral: { type: "Imaging", provider: "Oak Street Imaging (fake)", score: 4, cost: 5100 }
    }),
    member({
      id: "M-030", initials: "Z.Q.", ageBand: "60-64", plan: "Plan B", risk: 0.39,
      costBand: "$4,000 to $7,000", dataAgeDays: 9, claimsThrough: "2026-09-28",
      reasons: [{ text: "Ortho consult at high-cost hospital", claimRef: "CL-86660", date: "2026-09-21" }],
      timeline: [
        { date: "2026-09-03", text: "Primary care visit", claimRef: "CL-86070" },
        { date: "2026-09-21", text: "Ortho consult at high-cost hospital", claimRef: "CL-86660" }
      ],
      referral: { type: "Ortho surgeon", provider: "Northside Ortho Group (fake)", score: 5, cost: 6200 }
    }),
    member({
      id: "M-031", initials: "E.B.", ageBand: "50-54", plan: "Plan A", risk: 0.36,
      costBand: "$1,500 to $3,000", dataAgeDays: 6, claimsThrough: "2026-10-01",
      reasons: [{ text: "3 missed PT visits", claimRef: "CL-87490", date: "2026-09-29" }],
      timeline: [
        { date: "2026-09-13", text: "PT eval", claimRef: "CL-87140" },
        { date: "2026-09-29", text: "Third missed PT visit", claimRef: "CL-87490" }
      ],
      referral: { type: "PT", provider: "Summit PT Studio (fake)", score: 4, cost: 4200 }
    }),
    member({
      id: "M-032", initials: "J.F.", ageBand: "65-69", plan: "Plan A", risk: 0.33,
      costBand: "$2,000 to $4,000", dataAgeDays: 14, claimsThrough: "2026-09-23",
      reasons: [{ text: "Repeat ER visit for back pain", claimRef: "CL-86330", date: "2026-09-20" }],
      timeline: [
        { date: "2026-09-01", text: "ER visit for back pain", claimRef: "CL-85880" },
        { date: "2026-09-20", text: "Repeat ER visit for back pain", claimRef: "CL-86330" }
      ],
      referral: { type: "Imaging", provider: "Clearview Imaging Center (fake)", score: 5, cost: 4400 }
    }),
    member({
      id: "M-003", initials: "T.R.", ageBand: "60-64", plan: "Plan B", risk: 0.91,
      costBand: "$9,000 to $14,000", dataAgeDays: 41, claimsThrough: "2026-08-27",
      reasons: [
        { text: "Knee MRI ordered", claimRef: "CL-84010", date: "2026-08-20" },
        { text: "Ortho consult at high-cost hospital", claimRef: "CL-84102", date: "2026-08-26" }
      ],
      timeline: [
        { date: "2026-08-08", text: "Primary care visit", claimRef: "CL-83800" },
        { date: "2026-08-20", text: "Knee MRI ordered", claimRef: "CL-84010" },
        { date: "2026-08-26", text: "Ortho consult at high-cost hospital", claimRef: "CL-84102" }
      ],
      referral: { type: "Ortho surgeon", provider: "Riverside Hospital Ortho (fake)", score: 2, cost: 14500 }
    }),
    member({
      id: "M-005", initials: "W.M.", ageBand: "55-59", plan: "Plan B", risk: 0.88,
      costBand: "$4,000 to $8,000", dataAgeDays: 41, claimsThrough: "2026-08-27",
      reasons: [{ text: "3 missed PT visits", claimRef: "CL-83940", date: "2026-08-22" }],
      timeline: [
        { date: "2026-08-04", text: "PT plan started", claimRef: "CL-83610" },
        { date: "2026-08-22", text: "Third missed PT visit", claimRef: "CL-83940" }
      ],
      referral: { type: "PT", provider: "QuickMove PT (fake)", score: 2, cost: 3900 }
    }),
    member({
      id: "M-007", initials: "G.S.", ageBand: "70-74", plan: "Plan B", risk: 0.85,
      costBand: "$5,000 to $9,000", dataAgeDays: 41, claimsThrough: "2026-08-27",
      reasons: [{ text: "Shoulder MRI ordered", claimRef: "CL-83770", date: "2026-08-18" }],
      timeline: [
        { date: "2026-08-02", text: "Primary care visit", claimRef: "CL-83440" },
        { date: "2026-08-18", text: "Shoulder MRI ordered", claimRef: "CL-83770" }
      ],
      referral: { type: "Imaging", provider: "Riverside Imaging (fake)", score: 2, cost: 9800 }
    }),
    member({
      id: "M-009", initials: "C.H.", ageBand: "50-54", plan: "Plan B", risk: 0.8,
      costBand: "$7,000 to $12,000", dataAgeDays: 41, claimsThrough: "2026-08-27",
      reasons: [{ text: "Hip replacement consult", claimRef: "CL-83660", date: "2026-08-15" }],
      timeline: [
        { date: "2026-07-28", text: "Primary care visit", claimRef: "CL-83010" },
        { date: "2026-08-15", text: "Hip replacement consult", claimRef: "CL-83660" }
      ],
      referral: { type: "Ortho surgeon", provider: "Metro Bone and Joint (fake)", score: 3, cost: 11200 }
    }),
    member({
      id: "M-012", initials: "A.P.", ageBand: "65-69", plan: "Plan B", risk: 0.77,
      costBand: "$3,000 to $6,000", dataAgeDays: 41, claimsThrough: "2026-08-27",
      reasons: [{ text: "Opioid fill", claimRef: "CL-83550", date: "2026-08-12" }],
      timeline: [
        { date: "2026-08-01", text: "Ortho follow up", claimRef: "CL-83320" },
        { date: "2026-08-12", text: "Opioid fill", claimRef: "CL-83550" }
      ],
      referral: { type: "PT", provider: "Cedar PT and Rehab (fake)", score: 3, cost: 4600 }
    }),
    member({
      id: "M-016", initials: "N.D.", ageBand: "45-49", plan: "Plan B", risk: 0.73,
      costBand: "$4,000 to $7,000", dataAgeDays: 41, claimsThrough: "2026-08-27",
      reasons: [{ text: "Repeat ER visit for back pain", claimRef: "CL-83480", date: "2026-08-09" }],
      timeline: [
        { date: "2026-07-22", text: "ER visit for back pain", claimRef: "CL-82940" },
        { date: "2026-08-09", text: "Repeat ER visit for back pain", claimRef: "CL-83480" }
      ],
      referral: { type: "Imaging", provider: "Riverside Imaging (fake)", score: 2, cost: 9800 }
    })
  ];

  const providers = [
    { id: "p1", name: "Riverside Hospital Ortho (fake)", type: "Ortho surgeon", score: 2, cost: 14500, miles: 2, opening: "12 days" },
    { id: "p2", name: "Northside Ortho Group (fake)", type: "Ortho surgeon", score: 5, cost: 6200, miles: 4, opening: "3 days" },
    { id: "p3", name: "Harbor Joint Clinic (fake)", type: "Ortho surgeon", score: 4, cost: 7100, miles: 6, opening: "5 days" },
    { id: "p4", name: "Metro Bone and Joint (fake)", type: "Ortho surgeon", score: 3, cost: 11200, miles: 3, opening: "2 days" },
    { id: "p5", name: "Valley Ortho Partners (fake)", type: "Ortho surgeon", score: 5, cost: 6800, miles: 11, opening: "8 days" },
    { id: "p6", name: "Lakeside PT Collective (fake)", type: "PT", score: 5, cost: 3800, miles: 2, opening: "1 day" },
    { id: "p7", name: "Summit PT Studio (fake)", type: "PT", score: 4, cost: 4200, miles: 5, opening: "4 days" },
    { id: "p8", name: "QuickMove PT (fake)", type: "PT", score: 2, cost: 3900, miles: 1, opening: "2 days" },
    { id: "p9", name: "Cedar PT and Rehab (fake)", type: "PT", score: 3, cost: 4600, miles: 4, opening: "3 days" },
    { id: "p10", name: "Clearview Imaging Center (fake)", type: "Imaging", score: 5, cost: 4400, miles: 3, opening: "2 days" },
    { id: "p11", name: "Riverside Imaging (fake)", type: "Imaging", score: 2, cost: 9800, miles: 2, opening: "1 day" },
    { id: "p12", name: "Oak Street Imaging (fake)", type: "Imaging", score: 4, cost: 5100, miles: 7, opening: "6 days" }
  ];

  window.ICON_DATA = {
    coordinator: "Tasha (Care Coordinator)",
    plans: {
      "Plan A": {
        name: PLAN_A,
        flagged: 40,
        reached: 22,
        steered: 13,
        savings: "$180K to $240K",
        feeds: [
          { name: "Claims", text: "Claims 6 days old" },
          { name: "Eligibility", text: "Eligibility 2 days old" },
          { name: "Provider scores", text: "Provider scores 9 days old" }
        ],
        gap: ""
      },
      "Plan B": {
        name: PLAN_B,
        flagged: 28,
        reached: 9,
        steered: 4,
        savings: "$40K to $70K",
        feeds: [
          { name: "Claims", text: "Claims feed 41 days behind" },
          { name: "Eligibility", text: "Eligibility 4 days old" },
          { name: "Provider scores", text: "Provider scores 9 days old" }
        ],
        gap: "Claims feed 41 days behind: 6 members flagged late."
      }
    },
    roadmapSeed: {
      problem: "Granite State Medicare Advantage claims are 41 days behind, so 6 members were flagged late.",
      commitment: "Weekly high-risk MSK outreach for Granite State Medicare Advantage",
      metric: "Claims lag in days",
      acceptance: "Claims lag stays under 14 days for 4 weeks",
      owner: "Data team",
      dependencies: "Plan B daily file delivery and the eligibility cross-check",
      column: "Now"
    },
    members: members,
    providers: providers
  };
})();
