/* Sample data only. Practices, NPs, payers, and dollars are made up. */
window.DUET_DATA = {
  today: "Thu Oct 8, 2026",
  advisor: "Maya Chen",
  rule: "A practice may book an insured patient for a payer only if: (1) enrollment is approved with an effective date on or before the visit, (2) the payer ID is mapped in the EHR and clearinghouse, (3) the fee schedule is loaded, and (4) the rendering NP is linked to the group. Otherwise the slot shows \"Book as self-pay or wait\" with the reason. Launch Assist never submits a payer application, never attests for the NP, and never sends anything without an advisor's approval.",
  stages: ["Business setup", "Enrollment", "EHR and billing", "Go-live readiness", "Live"],
  statuses: ["On track", "At risk", "Blocked", "Live"],
  playbook: [
    { stage: "Business setup", days: "14 days" },
    { stage: "Credentialing and payer enrollment", days: "75 days" },
    { stage: "EHR and billing setup", days: "21 days, runs in parallel" },
    { stage: "Go-live readiness", days: "7 days" }
  ],
  practices: [
    {
      id: "birchwood",
      name: "Birchwood Family Health",
      town: "Concord, NH",
      owner: "Rosa Delgado, FNP-C",
      stage: "Enrollment",
      stageLabel: "Enrollment, day 51 of 75",
      daysText: "51 of 75 days",
      signed: "Aug 4, 2026",
      dayCount: "Day 65",
      targetFirst: "Nov 2",
      story: "Signed Aug 4, 2026. Target first patient is Nov 2, which is day 90. Today is Oct 8, day 65."
    },
    {
      id: "saltmarsh",
      name: "Saltmarsh Primary Care",
      town: "Gloucester, MA",
      owner: "Elena Vasquez, FNP-C",
      stage: "EHR and billing",
      stageLabel: "EHR and billing setup, day 12 of 21",
      daysText: "12 of 21 days",
      status: "On track",
      statusDetail: "On track",
      firstPatient: "Oct 27",
      firstNote: "Target Oct 27",
      blocker: "None",
      story: "EHR and billing setup is on day 12 of 21. The sample payers for this practice are approved. Next work is loading fee schedules. First patient is Oct 27.",
      steps: [
        { name: "Payer enrollment", owner: "Payer", status: "Done", note: "Sample payers approved." },
        { name: "EHR and clearinghouse IDs", owner: "Duet billing", status: "Done", note: "Mapped." },
        { name: "Fee schedules", owner: "Duet billing", status: "In progress", note: "Due before Oct 27." }
      ]
    },
    {
      id: "ridgeview",
      name: "Ridgeview NP Clinic",
      town: "Waterbury, CT",
      owner: "Andre Williams, NP",
      stage: "Enrollment",
      stageLabel: "Enrollment, day 60 of 75",
      daysText: "60 of 75 days",
      status: "At risk",
      statusDetail: "Malpractice name mismatch",
      firstPatient: "Dec 1",
      firstNote: "Slipped from the first target",
      blocker: "Malpractice name mismatch",
      story: "Enrollment is at risk because the malpractice policy uses a prior last name. Payers paused the file. Projected first patient is Dec 1 if the corrected policy is back this month.",
      steps: [
        { name: "Malpractice policy name", owner: "NP", status: "At risk", note: "Policy name does not match the NPI." },
        { name: "Payer enrollment", owner: "Payer", status: "Paused", note: "Waiting on the corrected policy." },
        { name: "CAQH attestation", owner: "NP", status: "Done", note: "Current." }
      ]
    },
    {
      id: "lakeside",
      name: "Lakeside Family Care",
      town: "Hamburg, NY",
      owner: "Priya Shah, FNP-C",
      stage: "Business setup",
      stageLabel: "Business setup, day 6 of 14",
      daysText: "6 of 14 days",
      status: "On track",
      statusDetail: "On track",
      firstPatient: "Jan 12",
      firstNote: "Target Jan 12",
      blocker: "None",
      story: "Business setup is on day 6 of 14. The EIN application is in progress. First patient is Jan 12.",
      steps: [
        { name: "Entity paperwork", owner: "NP", status: "In progress", note: "EIN application filed." },
        { name: "Group NPI", owner: "NP", status: "Not started", note: "Starts after the EIN." },
        { name: "Practice advisor intro", owner: "Advisor", status: "Done", note: "Kickoff complete." }
      ]
    },
    {
      id: "cedar",
      name: "Cedar Lane Health",
      town: "Manchester, NH",
      owner: "Helen Cho, FNP-C",
      stage: "Go-live readiness",
      stageLabel: "Go-live readiness, day 3 of 7",
      daysText: "3 of 7 days",
      status: "On track",
      statusDetail: "On track",
      firstPatient: "Oct 20",
      firstNote: "Target Oct 20",
      blocker: "None",
      story: "Go-live readiness is on day 3 of 7. Opening hours are set. First patient is Oct 20.",
      steps: [
        { name: "Payer gates", owner: "Advisor", status: "Done", note: "Sample payers pass the 4 gates." },
        { name: "Opening hours", owner: "NP", status: "Done", note: "Hours confirmed." },
        { name: "Website", owner: "Advisor", status: "Done", note: "Published." }
      ]
    },
    {
      id: "maple",
      name: "Maple Street Wellness",
      town: "Worcester, MA",
      owner: "Chris Alvarez, NP",
      stage: "Enrollment",
      stageLabel: "Enrollment, day 44 of 75",
      daysText: "44 of 75 days",
      status: "Blocked",
      statusDetail: "Group address mismatch",
      firstPatient: "Unknown",
      firstNote: "No date until the address is fixed",
      blocker: "Group address mismatch",
      story: "Enrollment is blocked. The group NPI address does not match the lease, so payers will not review the file. The first patient date is unknown until the address is fixed.",
      steps: [
        { name: "Group address on the NPI", owner: "NP", status: "Blocked", note: "Does not match the lease." },
        { name: "Payer enrollment", owner: "Payer", status: "Not started", note: "Payers will not open the file." },
        { name: "CAQH profile", owner: "NP", status: "Done", note: "Profile exists, review has not started." }
      ]
    },
    {
      id: "pine",
      name: "Pine Hollow Family Practice",
      town: "Keene, NH",
      owner: "Samira Haddad, FNP-C",
      stage: "Live",
      stageLabel: "Live, day 23",
      daysText: "23 of 90 days",
      status: "Live",
      statusDetail: "Panel 96 of 300",
      firstPatient: "Sep 15",
      firstNote: "Live Sep 15",
      blocker: "None",
      panel: "96 of 300",
      story: "Live since Sep 15, day 23 of the first 90 days. Panel is 96 of 300.",
      steps: [
        { name: "First patient", owner: "NP", status: "Done", note: "Seen Sep 15." },
        { name: "Panel", owner: "Advisor", status: "Live", note: "96 of 300." },
        { name: "Annual wellness visits", owner: "NP", status: "Live", note: "Visits are being booked." }
      ]
    },
    {
      id: "river",
      name: "Riverbend Primary Care",
      town: "Nashua, NH",
      owner: "Owen Blake, NP",
      stage: "Live",
      stageLabel: "Live, day 58",
      daysText: "58 of 90 days",
      status: "Live",
      statusDetail: "Panel 212 of 300",
      firstPatient: "Aug 11",
      firstNote: "Live Aug 11",
      blocker: "None",
      panel: "212 of 300",
      story: "Live since Aug 11, day 58 of the first 90 days. Panel is 212 of 300.",
      steps: [
        { name: "First patient", owner: "NP", status: "Done", note: "Seen Aug 11." },
        { name: "Panel", owner: "Advisor", status: "Live", note: "212 of 300." },
        { name: "Annual wellness visits", owner: "NP", status: "Live", note: "Visits are being booked." }
      ]
    }
  ],
  suggestions: [
    {
      id: "s1",
      source: "Harbor portal note, Oct 2: CAQH attestation expired 09/30/2026. Application on hold.",
      suggest: "Ask Rosa to re-attest CAQH today.",
      draft: "Hi Rosa, Harbor paused your enrollment because your CAQH attestation expired Sep 30. It takes about 10 minutes. Can you re-attest by Oct 10? Here is the link.",
      effect: "Keeps Harbor at Nov 14."
    },
    {
      id: "s2",
      source: "Playbook rule: open on approved payers.",
      suggest: "Open Nov 2 for Medicare, Pinecrest, and self-pay. Book Harbor members from Nov 14.",
      draft: "Plan note: Open Birchwood on Nov 2 for Medicare (simulated), Pinecrest Health Plan, and self-pay. Book Harbor Community Plan members starting Nov 14. The Nov 2 date is the first visit for approved payers, not the date every payer is live.",
      effect: "First patient back to Nov 2. Full payer go-live Nov 14."
    },
    {
      id: "s3",
      source: "Pinecrest approval letter, Sep 28.",
      suggest: "Ask Duet billing to load the Pinecrest fee schedule by Oct 20.",
      draft: "Internal note for Duet billing: Pinecrest Health Plan approved Birchwood Family Health on Sep 28, effective Nov 1. Please load the Pinecrest fee schedule by Oct 20 so gate 3 is clear for the Nov 2 opening.",
      effect: "Clears gate 3 for Pinecrest."
    }
  ],
  tasks: [
    { id: "caqh", name: "Re-attest CAQH", due: "Due Oct 10", detail: "Harbor paused enrollment because the attestation expired Sep 30. This takes about 10 minutes." },
    { id: "website", name: "Approve website draft", due: "This week", detail: "Maya left a website draft for Birchwood. Approve it or send a note." },
    { id: "gbp", name: "Claim Google Business Profile", due: "This week", detail: "Claim the listing for Birchwood Family Health in Concord, NH." },
    { id: "hours", name: "Pick the Nov 2 opening hours", due: "This week", detail: "Choose the hours for the Nov 2 opening, including self-pay slots." }
  ],
  channels: [
    { name: "Google Business Profile and reviews", spend: "$150", patients: "118", each: "$1.27", payback: "0.04" },
    { name: "Directory listing \"CareFinder\"", spend: "$1,800", patients: "64", each: "$28.13", payback: "0.80" },
    { name: "Paid search", spend: "$4,200", patients: "70", each: "$60.00", payback: "1.71" },
    { name: "Community referral (pharmacy, school nurse)", spend: "$600", patients: "52", each: "$11.54", payback: "0.33" },
    { name: "Payer roster outreach", spend: "$900", patients: "95", each: "$9.47", payback: "0.27" }
  ],
  metrics: {
    timeToLaunch: "104 days",
    timeTarget: "90 days",
    spread: "48 to 131 days",
    autoNow: "9 of 42 (21%)",
    autoWith: "15 of 42 (36%)",
    pulse: "4.1 of 5"
  },
  seedLog: [
    {
      time: "Oct 2, 2026",
      actor: "Launch file",
      action: "Harbor portal note added",
      detail: "CAQH attestation expired 09/30/2026. Application on hold."
    },
    {
      time: "Aug 4, 2026",
      actor: "Maya Chen",
      action: "Signed agreement",
      detail: "Birchwood Family Health, Concord, NH. Owner Rosa Delgado, FNP-C."
    }
  ]
};
