/* Sample data only. Clinicians, facilities, and documents are made up. */
(function () {
  function row(id, name, status, extra) {
    const item = {
      id: id,
      name: name,
      shortName: name,
      n: 0,
      status: status,
      ruleId: "List",
      rule: "Required on this facility list.",
      approvedBy: status === "Approved" ? "Carla Mendes" : "",
      file: "",
      precheck: null,
      missingReason: "",
      waitReason: "",
      expiresBeforeEnd: false,
      dateUnreadable: false,
      nameMismatch: false,
      nameChangeLinked: false
    };
    return Object.assign(item, extra || {});
  }

  function nums(items) {
    items.forEach((item, i) => { item.n = i + 1; });
    return items;
  }

  const dana = nums([
    row("license", "RN license (AZ or compact)", "Approved", {
      shortName: "RN license",
      ruleId: "MV-1",
      rule: "License must be Arizona or a compact license, and valid through Jan 23, 2027.",
      file: "az-compact-license.pdf",
      precheck: {
        field: "License type and expiration",
        read: "Compact license, exp Mar 31, 2028",
        result: "Pass",
        confidence: 99,
        reason: "Valid through the assignment end date."
      }
    }),
    row("bls", "BLS (AHA)", "Pending", {
      shortName: "BLS",
      ruleId: "MV-3",
      rule: "Every card and cert must be valid through the assignment end date (Jan 23, 2027).",
      file: "bls-card.jpg",
      expiresBeforeEnd: true,
      precheck: {
        field: "Expiration date",
        read: "12/31/2026",
        result: "Flag",
        confidence: 96,
        reason: "Expires 12/31/2026, before end 01/23/2027 (MV-3)."
      }
    }),
    row("acls", "ACLS (AHA)", "Approved", {
      shortName: "ACLS",
      ruleId: "MV-3",
      rule: "Every card and cert must be valid through the assignment end date (Jan 23, 2027).",
      file: "acls-card.pdf",
      precheck: {
        field: "Expiration date",
        read: "Jun 30, 2027",
        result: "Pass",
        confidence: 98,
        reason: "Valid through Jan 23, 2027."
      }
    }),
    row("tb", "TB, QuantiFERON within 12 months", "Pending", {
      shortName: "TB",
      ruleId: "MV-4",
      rule: "QuantiFERON result must be within 12 months of the start date, and the result date must be readable.",
      file: "tb-result.jpg",
      dateUnreadable: true,
      precheck: {
        field: "Result date",
        read: "Unreadable",
        result: "Flag",
        confidence: 41,
        reason: "Blurry image. Result date could not be read."
      }
    }),
    row("flu", "Flu vaccine, 2026-27 season", "Missing", {
      shortName: "Flu",
      ruleId: "MV-5",
      rule: "Flu record must be for the 2026-27 season.",
      missingReason: "No file uploaded."
    }),
    row("physical", "Physical within 12 months", "Approved", {
      shortName: "Physical",
      ruleId: "MV-6",
      rule: "Physical exam must be dated within 12 months of the start.",
      file: "physical-jul14.pdf",
      precheck: {
        field: "Exam date",
        read: "Jul 14, 2026",
        result: "Pass",
        confidence: 97,
        reason: "Within 12 months of Oct 26, 2026."
      }
    }),
    row("drug", "10-panel drug screen within 30 days of start", "In progress", {
      shortName: "Drug screen",
      ruleId: "MV-8",
      rule: "10-panel drug screen must be within 30 days of the start date.",
      waitReason: "Lab visit Oct 14. The result is not in yet.",
      precheck: {
        field: "Lab visit",
        read: "Scheduled Oct 14",
        result: "Waiting",
        confidence: null,
        reason: "No result image to read."
      }
    }),
    row("bg", "Background check, 7-year county", "In progress", {
      shortName: "Background",
      ruleId: "MV-9",
      rule: "7-year county background check must be on file before submit.",
      waitReason: "Vendor ETA Oct 13. The report is not in yet.",
      precheck: {
        field: "Vendor ETA",
        read: "Oct 13",
        result: "Waiting",
        confidence: null,
        reason: "No report to read."
      }
    }),
    row("skills", "Med-Surg skills checklist", "Approved", {
      shortName: "Skills checklist",
      ruleId: "MV-10",
      rule: "Skills checklist must be dated and complete.",
      file: "skills-sep20.pdf",
      precheck: {
        field: "Checklist date",
        read: "Sep 20, 2026",
        result: "Pass",
        confidence: 95,
        reason: "Checklist is dated and on file."
      }
    }),
    row("hepb", "Hep B titer or declination", "Pending", {
      shortName: "Hep B",
      ruleId: "MV-7",
      rule: "The name on the document must match the profile, unless a name-change document is linked.",
      file: "hepb-titer.pdf",
      nameMismatch: true,
      nameChangeLinked: true,
      nameOnFile: "Dana Whitfield-Ruiz",
      profileName: "Dana Whitfield",
      linkedDoc: "marriage-certificate.pdf",
      precheck: {
        field: "Name on the document",
        read: "Dana Whitfield-Ruiz",
        result: "Flag",
        confidence: 88,
        reason: "Name does not match profile Dana Whitfield. Marriage certificate is on file."
      }
    })
  ]);

  window.AYA_DATA = {
    today: "Thu Oct 8, 2026",
    specialist: "Carla Mendes",
    recruiter: "Brian Foster",
    rule: "The pre-check can flag and draft, but only a named specialist can set an item to Approved. An item cannot be approved if it expires before the assignment end date, the name does not match the profile without a linked name-change document, or the date is unreadable. Submit to facility stays locked until every required item is Approved, with the reasons listed. Nothing is sent to a clinician or facility without a person's approval.",
    statuses: ["On track", "At risk", "Will miss start", "Ready to submit", "Submitted"],
    weeks: ["Oct 19", "Oct 26", "Nov 2", "Nov 9"],
    nudgeDraft: "Hi Dana, 3 items left for your Oct 26 start at Mesa Verde. 1) Your BLS card ends Dec 31, before your Jan 23 end date. Please renew and upload the new card. 2) Your TB result photo is blurry. Please upload a clear photo or PDF. 3) Please upload your 2026-27 flu shot record. If you can, send these by Wed Oct 14 so we can send your packet by Oct 19. Carla",
    headsDraft: "Dana is At risk for Oct 26. 3 items due Oct 14. Drug screen Oct 14, background ETA Oct 13. I will update you Oct 15.",
    uploads: {
      bls: [
        { id: "bls-new", label: "Sample: new BLS card, exp Jun 30, 2028" },
        { id: "bls-old", label: "Sample: same BLS card, exp Dec 31, 2026" }
      ],
      tb: [
        { id: "tb-clear", label: "Sample: clear TB result, dated Sep 2, 2026" },
        { id: "tb-blur", label: "Sample: blurry TB photo" }
      ],
      flu: [
        { id: "flu-ok", label: "Sample: flu shot record, 2026-27 season, Sep 28, 2026" }
      ]
    },
    rejectPresets: ["Expires mid-assignment", "Blurry or cut off", "Wrong document", "Name mismatch"],
    bounce: [
      { name: "Blurry or cut off", pct: 34 },
      { name: "Expires mid-assignment", pct: 27 },
      { name: "Name mismatch", pct: 14 },
      { name: "Wrong document type", pct: 13 },
      { name: "Missing signature", pct: 12 }
    ],
    packets: [
      {
        id: "dana",
        clinician: "Dana Whitfield",
        credential: "RN",
        role: "Med-Surg and Tele",
        facility: "Mesa Verde Regional Medical Center",
        place: "Phoenix, AZ",
        start: "Oct 26, 2026",
        startShort: "Oct 26",
        week: "Oct 26",
        end: "Jan 23, 2027",
        weeksLong: "13 weeks",
        signed: "Oct 5, 2026",
        deadline: "Mon Oct 19",
        listName: "MVR Travel Compliance v3",
        baseStatus: "At risk",
        submitted: false,
        items: dana
      },
      {
        id: "marcus",
        clinician: "Marcus Lee",
        credential: "RN",
        role: "ICU",
        facility: "Lakeshore General",
        place: "",
        start: "Oct 19, 2026",
        startShort: "Oct 19",
        week: "Oct 19",
        baseStatus: "On track",
        submitted: false,
        items: nums([
          row("lic", "RN license", "Approved", { shortName: "RN license" }),
          row("bls", "BLS", "Approved", { shortName: "BLS" }),
          row("acls", "ACLS", "Approved", { shortName: "ACLS" }),
          row("tb", "TB", "Approved", { shortName: "TB" }),
          row("flu", "Flu vaccine", "Approved", { shortName: "Flu" }),
          row("phys", "Physical", "Approved", { shortName: "Physical" }),
          row("skills", "Skills checklist", "Approved", { shortName: "Skills checklist" }),
          row("hepb", "Hep B", "Approved", { shortName: "Hep B" }),
          row("fit", "Fit test", "Approved", { shortName: "Fit test" }),
          row("drug", "Drug screen", "In progress", { shortName: "Drug screen", waitReason: "Lab visit Oct 16. The result is not in yet." }),
          row("bg", "Background check", "In progress", { shortName: "Background", waitReason: "Vendor ETA Oct 15. The report is not in yet." })
        ])
      },
      {
        id: "priya",
        clinician: "Priya Natarajan",
        credential: "RT",
        role: "Respiratory therapy",
        facility: "Cascade Valley Hospital",
        place: "",
        start: "Oct 19, 2026",
        startShort: "Oct 19",
        week: "Oct 19",
        baseStatus: "Will miss start",
        submitted: false,
        items: nums([
          row("lic", "RT license (WA)", "In progress", {
            shortName: "WA license",
            waitReason: "In board review. Estimated release Oct 23, which is after the Oct 19 start.",
            precheck: {
              field: "Board status",
              read: "In review, est. Oct 23",
              result: "Flag",
              confidence: 90,
              reason: "Estimated release is after the start date."
            }
          }),
          row("bls", "BLS", "Approved", { shortName: "BLS" }),
          row("acls", "ACLS", "Approved", { shortName: "ACLS" }),
          row("tb", "TB", "Approved", { shortName: "TB" }),
          row("flu", "Flu vaccine", "Approved", { shortName: "Flu" }),
          row("phys", "Physical", "Approved", { shortName: "Physical" }),
          row("skills", "Skills checklist", "Approved", { shortName: "Skills checklist" }),
          row("drug", "Drug screen", "In progress", { shortName: "Drug screen", waitReason: "Lab visit Oct 15. The result is not in yet." }),
          row("bg", "Background check", "In progress", { shortName: "Background", waitReason: "Vendor ETA Oct 16. The report is not in yet." })
        ])
      },
      {
        id: "jordan",
        clinician: "Jordan Ames",
        credential: "RN",
        role: "ED",
        facility: "Bayside Medical Center",
        place: "",
        start: "Oct 26, 2026",
        startShort: "Oct 26",
        week: "Oct 26",
        baseStatus: "Ready to submit",
        submitted: false,
        items: nums([
          "RN license", "BLS", "ACLS", "TB", "Flu vaccine", "Physical", "Drug screen", "Background check", "Skills checklist", "Hep B"
        ].map((name, i) => row("j" + (i + 1), name, "Approved", { shortName: name })))
      },
      {
        id: "keisha",
        clinician: "Keisha Brown",
        credential: "CST",
        role: "Surgical tech",
        facility: "Summit Ridge Health",
        place: "",
        start: "Nov 2, 2026",
        startShort: "Nov 2",
        week: "Nov 2",
        baseStatus: "On track",
        submitted: false,
        items: nums([
          row("lic", "CST certification", "Approved", { shortName: "CST certification" }),
          row("bls", "BLS", "Approved", { shortName: "BLS" }),
          row("tb", "TB", "Approved", { shortName: "TB" }),
          row("phys", "Physical", "Approved", { shortName: "Physical" }),
          row("skills", "Skills checklist", "Approved", { shortName: "Skills checklist" }),
          row("flu", "Flu vaccine", "Missing", { shortName: "Flu", missingReason: "No file uploaded." }),
          row("hepb", "Hep B", "Missing", { shortName: "Hep B", missingReason: "No file uploaded." }),
          row("drug", "Drug screen", "In progress", { shortName: "Drug screen", waitReason: "Lab visit Oct 20. The result is not in yet." }),
          row("bg", "Background check", "In progress", { shortName: "Background", waitReason: "Vendor ETA Oct 18. The report is not in yet." })
        ])
      },
      {
        id: "luis",
        clinician: "Luis Ortega",
        credential: "RN",
        role: "L&D",
        facility: "Pinewood Women's Hospital",
        place: "",
        start: "Nov 2, 2026",
        startShort: "Nov 2",
        week: "Nov 2",
        baseStatus: "At risk",
        submitted: false,
        items: nums([
          row("lic", "RN license", "Approved", { shortName: "RN license" }),
          row("bls", "BLS", "Approved", { shortName: "BLS" }),
          row("acls", "ACLS", "Approved", { shortName: "ACLS" }),
          row("nrp", "NRP card", "Missing", { shortName: "NRP", missingReason: "NRP card is missing." }),
          row("tb", "TB", "Approved", { shortName: "TB" }),
          row("phys", "Physical", "Approved", { shortName: "Physical" }),
          row("hepb", "Hep B", "Approved", { shortName: "Hep B" }),
          row("fit", "Fit test", "Approved", { shortName: "Fit test" }),
          row("flu", "Flu vaccine", "Missing", { shortName: "Flu", missingReason: "No file uploaded." }),
          row("skills", "Skills checklist", "Missing", { shortName: "Skills checklist", missingReason: "No file uploaded." }),
          row("drug", "Drug screen", "In progress", { shortName: "Drug screen", waitReason: "Lab visit Oct 22. The result is not in yet." }),
          row("bg", "Background check", "In progress", { shortName: "Background", waitReason: "Vendor ETA Oct 21. The report is not in yet." })
        ])
      },
      {
        id: "hannah",
        clinician: "Hannah Cole",
        credential: "PT",
        role: "Physical therapy",
        facility: "Riverside Rehab",
        place: "",
        start: "Oct 26, 2026",
        startShort: "Oct 26",
        week: "Oct 26",
        baseStatus: "Submitted",
        submitted: true,
        items: nums([
          "PT license", "BLS", "TB", "Flu vaccine", "Physical", "Drug screen", "Background check", "Skills checklist"
        ].map((name, i) => row("h" + (i + 1), name, "Approved", { shortName: name })))
      },
      {
        id: "tom",
        clinician: "Tom Nguyen",
        credential: "RN",
        role: "PCU",
        facility: "Mesa Verde Regional Medical Center",
        place: "",
        start: "Nov 9, 2026",
        startShort: "Nov 9",
        week: "Nov 9",
        baseStatus: "On track",
        submitted: false,
        items: nums([
          row("lic", "RN license", "Approved", { shortName: "RN license" }),
          row("bls", "BLS", "Approved", { shortName: "BLS" }),
          row("phys", "Physical", "Approved", { shortName: "Physical" }),
          row("acls", "ACLS", "Missing", { shortName: "ACLS", missingReason: "No file uploaded." }),
          row("tb", "TB", "Missing", { shortName: "TB", missingReason: "No file uploaded." }),
          row("flu", "Flu vaccine", "Missing", { shortName: "Flu", missingReason: "No file uploaded." }),
          row("skills", "Skills checklist", "Missing", { shortName: "Skills checklist", missingReason: "No file uploaded." }),
          row("hepb", "Hep B", "Missing", { shortName: "Hep B", missingReason: "No file uploaded." }),
          row("drug", "Drug screen", "In progress", { shortName: "Drug screen", waitReason: "Not scheduled yet." }),
          row("bg", "Background check", "In progress", { shortName: "Background", waitReason: "Not ordered yet." })
        ])
      },
      {
        id: "grace",
        clinician: "Grace Kim",
        credential: "CT Tech",
        role: "CT",
        facility: "Northfield Imaging",
        place: "",
        start: "Oct 19, 2026",
        startShort: "Oct 19",
        week: "Oct 19",
        baseStatus: "At risk",
        submitted: false,
        items: nums([
          row("lic", "CT certification", "Approved", { shortName: "CT certification" }),
          row("bls", "BLS", "Approved", { shortName: "BLS" }),
          row("tb", "TB", "Approved", { shortName: "TB" }),
          row("phys", "Physical", "Approved", { shortName: "Physical" }),
          row("skills", "Skills checklist", "Approved", { shortName: "Skills checklist" }),
          row("drug", "Drug screen", "Approved", { shortName: "Drug screen" }),
          row("bg", "Background check", "Approved", { shortName: "Background" }),
          row("flu", "Flu vaccine", "Pending", {
            shortName: "Flu",
            file: "flu-record.pdf",
            precheck: {
              field: "Record",
              read: "File is on the packet and has not been decided",
              result: "Waiting",
              confidence: 70,
              reason: "Flu record is pending specialist review."
            }
          })
        ])
      },
      {
        id: "samuel",
        clinician: "Samuel Ortiz",
        credential: "RN",
        role: "Tele",
        facility: "Lakeshore General",
        place: "",
        start: "Nov 9, 2026",
        startShort: "Nov 9",
        week: "Nov 9",
        baseStatus: "On track",
        submitted: false,
        items: nums([
          row("lic", "RN license", "Approved", { shortName: "RN license" }),
          row("bls", "BLS", "Approved", { shortName: "BLS" }),
          row("acls", "ACLS", "Missing", { shortName: "ACLS", missingReason: "No file uploaded." }),
          row("tb", "TB", "Missing", { shortName: "TB", missingReason: "No file uploaded." }),
          row("flu", "Flu vaccine", "Missing", { shortName: "Flu", missingReason: "No file uploaded." }),
          row("phys", "Physical", "Missing", { shortName: "Physical", missingReason: "No file uploaded." }),
          row("skills", "Skills checklist", "Missing", { shortName: "Skills checklist", missingReason: "No file uploaded." }),
          row("hepb", "Hep B", "Missing", { shortName: "Hep B", missingReason: "No file uploaded." }),
          row("fit", "Fit test", "Missing", { shortName: "Fit test", missingReason: "No file uploaded." }),
          row("drug", "Drug screen", "In progress", { shortName: "Drug screen", waitReason: "Not scheduled yet." }),
          row("bg", "Background check", "In progress", { shortName: "Background", waitReason: "Not ordered yet." })
        ])
      }
    ],
    seedLog: [
      { time: "Oct 7, 2026, 2:08 PM", actor: "Pre-check", item: "Hep B titer or declination", before: "Missing", after: "Pending", reason: "Flag: name Dana Whitfield-Ruiz vs profile Dana Whitfield. Marriage certificate on file. Confidence 88." },
      { time: "Oct 7, 2026, 2:06 PM", actor: "Pre-check", item: "TB, QuantiFERON within 12 months", before: "Missing", after: "Pending", reason: "Flag: result date unreadable, blurry image. Confidence 41." },
      { time: "Oct 7, 2026, 2:05 PM", actor: "Pre-check", item: "BLS (AHA)", before: "Missing", after: "Pending", reason: "Flag: expires 12/31/2026, before end 01/23/2027 (MV-3). Confidence 96." },
      { time: "Oct 6, 2026, 9:31 AM", actor: "Carla Mendes", item: "Med-Surg skills checklist", before: "Pending", after: "Approved", reason: "Dated Sep 20, 2026. The pre-check did not approve this." },
      { time: "Oct 6, 2026, 9:24 AM", actor: "Carla Mendes", item: "Physical within 12 months", before: "Pending", after: "Approved", reason: "Dated Jul 14, 2026. The pre-check did not approve this." },
      { time: "Oct 6, 2026, 9:18 AM", actor: "Carla Mendes", item: "ACLS (AHA)", before: "Pending", after: "Approved", reason: "Exp Jun 30, 2027. The pre-check did not approve this." },
      { time: "Oct 6, 2026, 9:10 AM", actor: "Carla Mendes", item: "RN license (AZ or compact)", before: "Pending", after: "Approved", reason: "Compact license, exp Mar 31, 2028. The pre-check did not approve this." }
    ]
  };
})();
