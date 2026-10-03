/* Access Lane — seed data. Every record is synthetic: patients, providers,
   clinics, payers, drugs, programs, pharmacies, numbers, and chart passages
   are fabricated for this prototype. No real PHI, no real identifiers. */

"use strict";

/* Deterministic pseudo-random so seed content is stable across reloads. */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PAYERS = [
  {
    id: "payer-north",
    name: "Payer North",
    planName: "Gold PPO (synthetic)",
    benefitType: "pharmacy",
    paRequired: true,
    stepTherapy: true,
    policy: {
      id: "PN-AD-12",
      title: "Biologics for Atopic Dermatitis — Payer North policy PN-AD-12 (synthetic)",
    },
  },
  {
    id: "payer-meridian",
    name: "Payer Meridian",
    planName: "Select HMO (synthetic)",
    benefitType: "pharmacy",
    paRequired: true,
    stepTherapy: true,
    policy: { id: "PM-PS-04", title: "Biologics for Psoriasis — Payer Meridian policy PM-PS-04 (synthetic)" },
  },
  {
    id: "payer-summit",
    name: "Payer Summit",
    planName: "Premier PPO (synthetic)",
    benefitType: "medical",
    paRequired: true,
    stepTherapy: false,
    policy: { id: "PS-IBD-09", title: "Biologics for IBD — Payer Summit policy PS-IBD-09 (synthetic)" },
  },
  {
    id: "payer-cascade",
    name: "Payer Cascade",
    planName: "Value HMO (synthetic)",
    benefitType: "pharmacy",
    paRequired: true,
    stepTherapy: true,
    policy: { id: "PC-AD-02", title: "Biologics for Atopic Dermatitis — Payer Cascade policy PC-AD-02 (synthetic)" },
  },
  {
    id: "payer-bay",
    name: "Payer Bay",
    planName: "Local PPO (synthetic)",
    benefitType: "medical",
    paRequired: true,
    stepTherapy: false,
    policy: { id: "PB-RA-07", title: "Biologics for RA — Payer Bay policy PB-RA-07 (synthetic)" },
  },
];

const PROGRAMS = [
  {
    id: "prog-copay",
    name: "CarePath Copay Card",
    kind: "copay card",
    programName: "manufacturer savings program (synthetic)",
    eligibility: "Commercial specialty drug claim, no income test. Matches deductible and out-of-pocket up to $12,000 per year (synthetic).",
    matched: true,
    reason: "Plan has a deductible and high out-of-pocket remaining; drug is a covered specialty medication on the formulary.",
    limit: "$12,000 (synthetic)",
  },
  {
    id: "prog-bridge",
    name: "AccessNow Bridge Program",
    kind: "bridge program",
    programName: "manufacturer bridge program (synthetic)",
    eligibility: "Coverage gap, prior authorization pending, or new-start delay; up to 90 days of medication free while coverage is sorted out (synthetic).",
    matched: false,
    reason: "Only offered while coverage is paused or eligibility is pending.",
    limit: "90 days (synthetic)",
  },
  {
    id: "prog-manuf",
    name: "NorthBridge Patient Assistance",
    kind: "manufacturer assistance",
    programName: "manufacturer patient assistance program (synthetic)",
    eligibility: "Household income at or below 400% of the federal poverty level; enrolled patients only (synthetic).",
    matched: false,
    reason: "Income documentation not yet collected for this patient.",
    limit: "400% FPL (synthetic)",
  },
  {
    id: "prog-foundation",
    name: "WellSpring Foundation Grant",
    kind: "foundation grant",
    programName: "independent foundation (synthetic)",
    eligibility: "Diagnosis-specific fund; household income at or below 500% FPL; fund open enrollment (synthetic).",
    matched: false,
    reason: "No open fund matches this diagnosis this month.",
    limit: "500% FPL (synthetic)",
  },
];

const PHARMACIES = [
  {
    id: "phx-preferred",
    name: "Payer North Preferred Specialty Pharmacy",
    kind: "payer preferred",
    inNetwork: true,
    delivery: "2–3 day delivery (synthetic)",
    note: "Payer-preferred specialty pharmacy; copay card applies at this pharmacy.",
  },
  {
    id: "phx-local",
    name: "CarePlus Pharmacy — Main St (patient's local pharmacy)",
    kind: "patient's pharmacy",
    inNetwork: true,
    delivery: "Next-day pickup (synthetic)",
    note: "Patient's usual pharmacy; in-network for this plan.",
  },
];

/* Chart documents for the hero case. Passages are cited verbatim by the PA
   draft and the appeal packet — the citation pattern: every drafted claim
   carries the source passage it came from. */
const HERO_DOCS = [
  {
    id: "doc-consult",
    title: "Dermatology consult (2026-09-28)",
    passages: [
      { id: "p1", text: "Diagnosis: moderate-to-severe atopic dermatitis, confirmed by dermatology. BSA 28%." },
      { id: "p2", text: "Baseline EASI score 21.4 documented today." },
      { id: "p3", text: "History: failed topical therapy — no improvement after 6 weeks of twice-daily triamcinolone 0.1% cream." },
      { id: "p4", text: "No contraindications to biologic therapy identified; no active infection; vaccination status current." },
    ],
  },
  {
    id: "doc-progress",
    title: "Clinic progress note (2026-10-02)",
    passages: [
      { id: "p5", text: "Topical therapy dates confirmed: triamcinolone 0.1% cream twice daily from 2026-08-18 to 2026-09-29; treated body surface did not improve." },
    ],
  },
];

/* Payer North criteria for the hero case. Each criterion: met / not met /
   can't tell, plus the cited chart passage it came from, or no passage found. */
const HERO_CRITERIA = [
  {
    id: "A-1",
    text: "Diagnosis of moderate-to-severe atopic dermatitis established by a dermatologist.",
    det: "met",
    citation: { doc: "doc-consult", passageId: "p1" },
  },
  {
    id: "A-2",
    text: "Documented trial of medium- or high-potency topical corticosteroid for at least 2 weeks.",
    det: "cant-tell",
    citation: null,
    note: "The record shows the topical failed, but the dates of the trial are missing.",
    resolution: {
      kind: "add-dates",
      label: "Add dates from chart note",
      citation: { doc: "doc-progress", passageId: "p5" },
      logText: "added the failed topical therapy dates (2026-08-18 → 2026-09-29) from the clinic progress note",
    },
  },
  {
    id: "A-3",
    text: "Inadequate response or intolerance to topical therapy.",
    det: "met",
    citation: { doc: "doc-consult", passageId: "p3" },
  },
  {
    id: "A-4",
    text: "Baseline severity score (EASI or equivalent) of 16 or greater documented.",
    det: "met",
    citation: { doc: "doc-consult", passageId: "p2" },
  },
  {
    id: "A-5",
    text: "No contraindications to biologic therapy in the record.",
    det: "met",
    citation: { doc: "doc-consult", passageId: "p4" },
  },
];

/* The appeal packet for a step-therapy denial. Answers the stated reason
   point by point, each point carrying its citations. */
const HERO_APPEAL = {
  denial: {
    reason: "Step therapy not met",
    summary: "Payer North denied the prior authorization for Biologic B for Patient A. Stated reason: step therapy not met — the record did not document the required topical corticosteroid trial dates.",
    letterExcerpt: "\u201cThe requested medication does not meet the step therapy requirement of policy PN-AD-12. The clinical record does not document a trial of topical therapy for the required duration.\u201d — Payer North denial letter (synthetic)",
  },
  points: [
    {
      id: "R-1",
      title: "The required topical trial is documented and complete.",
      body: "Triamcinolone 0.1% cream was used twice daily for 6 weeks (2026-08-18 through 2026-09-29), which exceeds the 2-week requirement in policy PN-AD-12. The treated body surface did not improve.",
      citations: [{ doc: "doc-progress", passageId: "p5" }, { doc: "doc-consult", passageId: "p3" }],
    },
    {
      id: "R-2",
      title: "Disease severity meets the policy threshold.",
      body: "Baseline EASI of 21.4 exceeds the 16-point threshold required by the policy, with 28% body surface area involvement.",
      citations: [{ doc: "doc-consult", passageId: "p2" }, { doc: "doc-consult", passageId: "p1" }],
    },
    {
      id: "R-3",
      title: "The prescription was written for the Food and Drug Administration–approved indication.",
      body: "Biologic B is prescribed for moderate-to-severe atopic dermatitis, the diagnosis confirmed by dermatology.",
      citations: [{ doc: "doc-consult", passageId: "p1" }],
    },
  ],
};

const CLINICS = ["Clinic North", "Clinic South", "Clinic East", "Clinic West"];
const PROVIDERS = ["Provider 01", "Provider 02", "Provider 03", "Provider 04", "Provider 05", "Provider 06", "Provider 07", "Provider 08", "Provider 09"];

const DRUGS = [
  { name: "Biologic B", cls: "anti-IL-13 · atopic dermatitis" },
  { name: "BIO-1207", cls: "anti-IL-4/13 · atopic dermatitis" },
  { name: "BIO-3311", cls: "anti-IL-17 · psoriasis" },
  { name: "BIO-1844", cls: "anti-IL-23 · psoriasis" },
  { name: "BIO-2088", cls: "anti-TNF · Crohn's disease" },
  { name: "BIO-0955", cls: "anti-integrin · ulcerative colitis" },
  { name: "BIO-4410", cls: "anti-IL-5 · severe asthma" },
  { name: "BIO-7733", cls: "anti-IL-6 · rheumatoid arthritis" },
  { name: "BIO-5290", cls: "anti-BAFF · lupus nephritis" },
  { name: "BIO-3012", cls: "anti-IL-31 · prurigo nodularis" },
];

const DISEASES = [
  "atopic dermatitis", "atopic dermatitis", "psoriasis", "psoriasis", "Crohn's disease",
  "ulcerative colitis", "severe asthma", "rheumatoid arthritis", "lupus nephritis", "prurigo nodularis",
];

const RND = mulberry32(20261003);

function pick(arr, rnd) { return arr[Math.floor(rnd() * arr.length)]; }

/* Build a generic synthetic case with a given stage. Stages describe where
   the case sits on the journey rail; content outside the hero/alternate cases
   is generated so lists look like a real working day. */
function genCase(n, stage, opts) {
  const rnd = mulberry32(1000 + n * 7);
  const drug = pick(DRUGS, rnd);
  const disease = pick(DISEASES, rnd);
  const payer = pick(PAYERS, rnd);
  const clinic = pick(CLINICS, rnd);
  const prescriber = pick(PROVIDERS, rnd);
  const hoursAgo = Math.round(2 + rnd() * 96);
  const idx = 1060 + n;
  const c = {
    id: "C-" + idx,
    patient: "Patient " + String.fromCharCode(65 + n),
    clinic, prescriber, payerId: payer.id,
    drug: { name: drug.name, cls: drug.cls, disease },
    createdAt: Date.now() - hoursAgo * 3600e3,
    journey: {},
    benefits: null, pa: null, appeal: null, assistance: null, pharmacy: null, onTherapy: null,
    log: [],
  };
  /* generic criteria from the payer policy (four criteria, synthetic) */
  const genericCriteria = () => [
    { id: "B-1", text: `Diagnosis of ${disease} established by a specialist.`, det: "met", citation: null },
    { id: "B-2", text: "Documented trial of standard therapy for this indication.", det: "met", citation: null },
    { id: "B-3", text: "Severity or disease activity documented at baseline.", det: "met", citation: null },
    { id: "B-4", text: "No contraindications in the record.", det: "met", citation: null },
  ];
  const log = (actor, text, minAgo) => c.log.push({ at: Date.now() - minAgo * 60e3, actor, text });

  switch (stage) {
    case "new-order": {
      c.journey = { order: "done", benefits: "working", priorAuth: "pending", appeal: "skipped", assistance: "pending", pharmacy: "pending", onTherapy: "pending" };
      c.benefits = { status: "pending", lastVerified: null };
      log("Agent", "Prescription received from EMR (fax simulation). Order routed to Access Lane.", 4);
      log("Agent", "Eligibility check started against " + payer.name + ".", 2);
      return c;
    }
    case "benefits-verified": {
      c.journey = { order: "done", benefits: "done", priorAuth: "working", appeal: "skipped", assistance: "pending", pharmacy: "pending", onTherapy: "pending" };
      c.benefits = mkBenefits(payer, { verified: true, costHigh: rnd() > 0.5 });
      log("Agent", "Eligibility check completed against " + payer.name + " — plan active.", 30);
      log("Agent", "PA required, step therapy flag " + (payer.stepTherapy ? "set" : "not set") + " per plan document.", 30);
      log("Agent", "Prior authorization draft started from " + payer.policy.id + ".", 28);
      return c;
    }
    case "pa-draft": {
      c.journey = { order: "done", benefits: "done", priorAuth: "needs-input", appeal: "skipped", assistance: "pending", pharmacy: "pending", onTherapy: "pending" };
      c.benefits = mkBenefits(payer, { verified: true, costHigh: true });
      c.pa = {
        status: "draft", policyId: payer.policy.id, policyTitle: payer.policy.title,
        criteria: genericCriteria(), note: "Draft complete. Two criteria were confirmed by staff this morning.",
      };
      c.pa.criteria[1].det = "cant-tell";
      c.pa.criteria[1].resolution = { kind: "confirm", label: "Confirm from record review", logText: "confirmed from the chart that the trial dates are not documented; proceeding on the record" };
      log("Agent", "Prior authorization draft generated from " + payer.policy.id + ".", 26);
      log("Agent", "Criterion B-2 marked can't tell — trial dates not found in the chart.", 26);
      log("Staff 03 (RN)", "Confirmed B-2 as undocumented; safe to proceed on record.", 20);
      return c;
    }
    case "pa-submitted": {
      c.journey = { order: "done", benefits: "done", priorAuth: "working", appeal: "skipped", assistance: "pending", pharmacy: "pending", onTherapy: "pending" };
      c.benefits = mkBenefits(payer, { verified: true, costHigh: true });
      c.pa = {
        status: "submitted", policyId: payer.policy.id, policyTitle: payer.policy.title,
        criteria: genericCriteria(), submittedAt: Date.now() - 180 * 3600e3, followUpDays: 4,
      };
      log("Agent", "Prior authorization draft generated from " + payer.policy.id + ".", 200);
      log("Staff 02 (MA)", "Reviewed draft and submitted under " + prescriber + "'s signature (simulated).", 180);
      log("Agent", "Submission acknowledged by " + payer.name + " portal. Turnaround clock started.", 180);
      return c;
    }
    case "portal-error": {
      c.journey = { order: "done", benefits: "blocked", priorAuth: "pending", appeal: "skipped", assistance: "pending", pharmacy: "pending", onTherapy: "pending" };
      c.benefits = {
        status: "error", lastVerified: null, error: {
          what: payer.name + " provider portal returned repeated timeouts on the eligibility check.",
          system: "Automatic retry scheduled in 18 minutes. The eligibility result, when it arrives, will be verified before it is shown.",
          person: "No action needed now. Retry manually from this screen if the case is urgent for the patient.",
          retryAt: Date.now() + 18 * 60e3,
        },
      };
      log("Agent", "Eligibility check against " + payer.name + " failed — portal timeout.", 45);
      log("Agent", "Retry scheduled automatically in 18 minutes.", 42);
      return c;
    }
    case "denied-appeal-draft": {
      c.journey = { order: "done", benefits: "done", priorAuth: "done", appeal: "needs-input", assistance: "pending", pharmacy: "pending", onTherapy: "pending" };
      c.benefits = mkBenefits(payer, { verified: true, costHigh: true });
      c.pa = { status: "denied", policyId: payer.policy.id, policyTitle: payer.policy.title, criteria: genericCriteria(), deniedReason: "Step therapy not met" };
      c.appeal = {
        status: "draft",
        denial: {
          reason: "Step therapy not met",
          summary: payer.name + " denied the prior authorization for " + drug.name + ". Stated reason: the medical necessity criteria were not met.",
          letterExcerpt: "\u201cThe request does not meet medical necessity criteria. The clinical record does not document the required trial of standard therapy.\u201d — " + payer.name + " denial letter (synthetic)",
        },
        points: [
          { id: "R-1", title: "Standard therapy was trialed and failed.", body: "The patient's chart documents a trial of standard therapy for " + disease + " with no improvement, which the denial did not account for.", citations: [] },
          { id: "R-2", title: "Severity is documented at baseline.", body: "Baseline severity scoring is present in the chart and meets the policy threshold.", citations: [] },
        ],
        followUpDate: null,
      };
      log("Agent", "PA denial received from " + payer.name + " (reason: step therapy not met).", 34);
      log("Agent", "Denial letter read; appeal packet drafted point by point against the stated reason.", 32);
      log("Agent", "Appeal packet flagged review-required — goes out under " + prescriber + "'s signature.", 32);
      return c;
    }
    case "appeal-submitted": {
      c.journey = { order: "done", benefits: "done", priorAuth: "done", appeal: "working", assistance: "pending", pharmacy: "pending", onTherapy: "pending" };
      c.benefits = mkBenefits(payer, { verified: true, costHigh: true });
      c.pa = { status: "denied", policyId: payer.policy.id, policyTitle: payer.policy.title, criteria: genericCriteria(), deniedReason: "Step therapy not met" };
      c.appeal = { status: "submitted", denial: { reason: "Step therapy not met", summary: "Denied for step therapy.", letterExcerpt: "Denial letter (synthetic)." }, points: [], submittedAt: Date.now() - 26 * 3600e3, followUpDate: Date.now() + 11 * 86400e3 };
      log("Agent", "PA denial received from " + payer.name + ".", 30);
      log("Staff 01 (Care Coordinator)", "Approved the agent-drafted appeal; submitted to " + payer.name + " (simulated).", 26);
      log("Agent", "Appeal acknowledged. Follow-up date set for review in 12 days.", 26);
      return c;
    }
    case "appeal-approved": {
      c.journey = { order: "done", benefits: "done", priorAuth: "done", appeal: "done", assistance: "working", pharmacy: "pending", onTherapy: "pending" };
      c.benefits = mkBenefits(payer, { verified: true, costHigh: true });
      c.pa = { status: "denied", policyId: payer.policy.id, policyTitle: payer.policy.title, criteria: genericCriteria(), deniedReason: "Step therapy not met" };
      c.appeal = { status: "approved", denial: { reason: "Step therapy not met", summary: "Denied, appealed, overturned.", letterExcerpt: "Denial and appeal correspondence (synthetic)." }, points: [], approvedAt: Date.now() - 52 * 3600e3 };
      c.assistance = {
        status: "matching",
        programs: [{ programId: "prog-copay", matched: true }, { programId: "prog-manuf", matched: false }],
      };
      log("Agent", "Appeal decision received: approved. PA coverage confirmed.", 52);
      log("Agent", "Financial assistance matching complete: copay card matched.", 50);
      return c;
    }
    case "assistance-enrolled": {
      c.journey = { order: "done", benefits: "done", priorAuth: "done", appeal: "skipped", assistance: "done", pharmacy: "working", onTherapy: "pending" };
      c.benefits = mkBenefits(payer, { verified: true, costHigh: true, enrolled: true });
      c.pa = { status: "approved", policyId: payer.policy.id, policyTitle: payer.policy.title, criteria: genericCriteria(), approvedAt: Date.now() - 96 * 3600e3 };
      c.assistance = {
        status: "enrolled",
        programs: [{ programId: "prog-copay", matched: true }, { programId: "prog-manuf", matched: false }],
        consents: [{ programId: "prog-copay", by: "Staff 02 (MA)", at: Date.now() - 60 * 3600e3 }],
      };
      c.pharmacy = { status: "evaluating", candidateIds: ["phx-preferred", "phx-local"] };
      log("Agent", "PA approved by " + payer.name + ".", 96);
      log("Agent", "Copay card matched (CarePath).", 62);
      log("Staff 02 (MA)", "Confirmed patient consent and enrolled in CarePath Copay Card.", 60);
      log("Agent", "Estimated patient cost updated — see Benefits.", 60);
      log("Agent", "Pharmacy routing evaluated 2 pharmacies.", 20);
      return c;
    }
    case "pharmacy-routed": {
      c.journey = { order: "done", benefits: "done", priorAuth: "done", appeal: "skipped", assistance: "done", pharmacy: "working", onTherapy: "pending" };
      c.benefits = mkBenefits(payer, { verified: true, costHigh: true, enrolled: true });
      c.pa = { status: "approved", policyId: payer.policy.id, policyTitle: payer.policy.title, criteria: genericCriteria(), approvedAt: Date.now() - 110 * 3600e3 };
      c.assistance = { status: "enrolled", programs: [{ programId: "prog-copay", matched: true }], consents: [{ programId: "prog-copay", by: "Staff 01 (Care Coordinator)", at: Date.now() - 80 * 3600e3 }] };
      c.pharmacy = { status: "routed", candidateIds: ["phx-preferred", "phx-local"], chosenId: "phx-preferred", chosenAt: Date.now() - 30 * 3600e3 };
      log("Agent", "Rx routed to " + PHARMACIES[0].name + ".", 30);
      log("Agent", "eRx handoff queued (simulated) — dispense expected within 2 days.", 30);
      return c;
    }
    case "on-therapy": {
      const startedAgo = 3 + Math.round(rnd() * 20);
      c.journey = { order: "done", benefits: "done", priorAuth: "done", appeal: "skipped", assistance: "done", pharmacy: "done", onTherapy: "done" };
      c.benefits = mkBenefits(payer, { verified: true, costHigh: true, enrolled: true });
      c.pa = { status: "approved", policyId: payer.policy.id, policyTitle: payer.policy.title, criteria: genericCriteria(), approvedAt: Date.now() - (startedAgo + 6) * 86400e3 };
      c.assistance = { status: "enrolled", programs: [{ programId: "prog-copay", matched: true }], consents: [{ programId: "prog-copay", by: "Staff 01 (Care Coordinator)", at: Date.now() - (startedAgo + 4) * 86400e3 }] };
      c.pharmacy = { status: "done", candidateIds: ["phx-preferred", "phx-local"], chosenId: "phx-preferred", chosenAt: Date.now() - (startedAgo + 2) * 86400e3 };
      c.onTherapy = { startedAt: Date.now() - startedAgo * 86400e3, firstFill: "shipped", refillDate: Date.now() + 24 * 86400e3 };
      log("Agent", "First fill shipped by specialty pharmacy.", startedAgo * 1440 - 800);
      log("Agent", "Patient marked on therapy. Refill reminder set for 24 days out.", startedAgo * 1440 - 700);
      return c;
    }
  }
  return c;
}

/* Synthetic benefits payload for a payer. Every value carries its source. */
function mkBenefits(payer, { verified, costHigh, enrolled }) {
  const deductibleLeft = costHigh ? 4200 : 1350;
  const oopLeft = costHigh ? 8000 : 2900;
  const estCoPay = costHigh ? 950 : 210;
  return {
    status: "verified",
    lastVerified: Date.now() - 30 * 60e3,
    plan: { name: payer.planName, active: true },
    benefitType: payer.benefitType,
    paRequired: payer.paRequired,
    stepTherapy: payer.stepTherapy,
    deductibleLeft,
    oopLeft,
    estPatientCost: estCoPay,
    estPatientCostAfterHelp: enrolled && costHigh ? 45 : null,
    estimateNote: "Estimated patient cost before assistance. Copay card drops it to the card's savings-card level when enrolled (synthetic).",
    sources: {
      plan: "eligibility check · simulated",
      doc: "plan document · simulated",
      call: "call note · simulated",
    },
  };
}

/* Hero case: Patient A, Clinic North, Provider 07, Biologic B. */
function heroCase() {
  const c = {
    id: "C-1042",
    patient: "Patient A",
    clinic: "Clinic North",
    prescriber: "Provider 07",
    payerId: "payer-north",
    drug: { name: "Biologic B", cls: "anti-IL-13 · atopic dermatitis", disease: "atopic dermatitis" },
    createdAt: Date.now() - 38 * 60e3,
    hero: true,
    journey: { order: "done", benefits: "working", priorAuth: "pending", appeal: "skipped", assistance: "pending", pharmacy: "pending", onTherapy: "pending" },
    benefits: { status: "pending" },
    pa: null, appeal: null, assistance: null, pharmacy: null, onTherapy: null,
    log: [
      { at: Date.now() - 38 * 60e3, actor: "Agent", text: "Prescription received from EMR (fax simulation) for Biologic B. New order opened as case C-1042." },
      { at: Date.now() - 36 * 60e3, actor: "Agent", text: "Chat note attached; chart pulled for Patient A at Clinic North." },
      { at: Date.now() - 34 * 60e3, actor: "Agent", text: "Eligibility check started against Payer North." },
    ],
  };
  return c;
}

/* Coverage-gap case: benefits show an inactive plan; bridge option appears. */
function gapCase() {
  const c = {
    id: "C-1051",
    patient: "Patient F",
    clinic: "Clinic East",
    prescriber: "Provider 04",
    payerId: "payer-cascade",
    drug: { name: "BIO-1207", cls: "anti-IL-4/13 · atopic dermatitis", disease: "atopic dermatitis" },
    createdAt: Date.now() - 5 * 3600e3,
    gap: true,
    journey: { order: "done", benefits: "needs-input", priorAuth: "pending", appeal: "skipped", assistance: "working", pharmacy: "pending", onTherapy: "pending" },
    benefits: {
      status: "inactive",
      lastVerified: Date.now() - 60 * 60e3,
      plan: { name: "Value HMO (synthetic)", active: false, note: "Eligibility check returned: plan inactive — member not found on the effective date. The practice should confirm current coverage with the patient." },
      benefitType: "pharmacy", paRequired: true, stepTherapy: true,
      deductibleLeft: null, oopLeft: null, estPatientCost: null,
      sources: { plan: "eligibility check · simulated", doc: "plan document · simulated", call: "call note · simulated" },
    },
    pa: null, appeal: null,
    assistance: {
      status: "pending-eligibility",
      programs: [{ programId: "prog-bridge", matched: true }, { programId: "prog-copay", matched: false }],
      note: "Bridge program offered while coverage is confirmed. Enrollment is held until eligibility is confirmed (synthetic).",
    },
    pharmacy: null, onTherapy: null,
    log: [
      { at: Date.now() - 5 * 3600e3, actor: "Agent", text: "Order received for BIO-1207 (atopic dermatitis)." },
      { at: Date.now() - 4.6 * 3600e3, actor: "Agent", text: "Eligibility check returned: Payer Cascade plan inactive on the effective date." },
      { at: Date.now() - 4.5 * 3600e3, actor: "Agent", text: "Case set to needs input — practice to confirm current insurance with the patient." },
      { at: Date.now() - 4.4 * 3600e3, actor: "Agent", text: "Bridge program matched while coverage is sorted out; enrollment pending eligibility." },
    ],
  };
  return c;
}

/* Seeded case mix: 30 cases across every stage of the journey. */
function seedCases() {
  const list = [];
  list.push(heroCase());                       /* C-1042: happy path, starts at order */
  list.push(gapCase());                        /* C-1051: alternate 2, coverage gap */
  list.push(genCase(3, "new-order"));
  list.push(genCase(4, "new-order"));
  list.push(genCase(5, "new-order"));
  list.push(genCase(6, "benefits-verified"));
  list.push(genCase(7, "benefits-verified"));
  list.push(genCase(8, "benefits-verified"));
  list.push(genCase(9, "pa-draft"));
  list.push(genCase(10, "pa-draft"));
  list.push(genCase(11, "portal-error"));      /* error state */
  list.push(genCase(12, "pa-submitted"));
  list.push(genCase(13, "pa-submitted"));
  list.push(genCase(14, "pa-submitted"));
  list.push(genCase(15, "pa-submitted"));
  list.push(genCase(16, "pa-submitted"));
  list.push(genCase(17, "denied-appeal-draft"));   /* appeal awaiting human gate */
  list.push(genCase(18, "denied-appeal-draft"));
  list.push(genCase(19, "appeal-submitted"));
  list.push(genCase(20, "appeal-submitted"));
  list.push(genCase(21, "appeal-approved"));
  list.push(genCase(22, "assistance-enrolled"));
  list.push(genCase(23, "assistance-enrolled"));
  list.push(genCase(24, "pharmacy-routed"));
  list.push(genCase(25, "pharmacy-routed"));
  list.push(genCase(26, "on-therapy"));
  list.push(genCase(27, "on-therapy"));
  list.push(genCase(28, "on-therapy"));
  list.push(genCase(29, "on-therapy"));
  list.push(genCase(30, "on-therapy"));
  return list;
}

/* Warm up the hero case's PA draft + appeal content so live actions mutate a
   full object. Attached when the demo loads; the app keeps its own working
   copy in state. */
function heroPaDraft() {
  return {
    status: "draft",
    policyId: "PN-AD-12",
    policyTitle: "Biologics for Atopic Dermatitis — Payer North policy PN-AD-12 (synthetic)",
    reviewRequired: true,
    criteria: HERO_CRITERIA.map((c) => ({ ...c, citation: c.citation ? { ...c.citation } : null, resolution: c.resolution ? { ...c.resolution, citation: c.resolution.citation ? { ...c.resolution.citation } : null } : null, confirmedBy: null, resolved: false })),
    openItems: HERO_CRITERIA.filter((c) => c.det === "cant-tell").map((c) => c.id),
    payerNote: "Payer North preference: step-therapy history must be shown as dated chart excerpts. Surfaced requirement posted to the draft (synthetic).",
    submittedAt: null, statusDetail: null,
  };
}

const SEED = {
  payers: PAYERS,
  programs: PROGRAMS,
  pharmacies: PHARMACIES,
  heroDocs: HERO_DOCS,
  heroAppeal: HERO_APPEAL,
  heroCriteriaTemplate: HERO_CRITERIA,
  cases: seedCases(),
  updatedAt: Date.now(),
};

if (typeof module !== "undefined" && module.exports) module.exports = SEED;
