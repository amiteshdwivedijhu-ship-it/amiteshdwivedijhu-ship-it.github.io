/* Care Team Admin Desk — deterministic synthetic seed.
   Every name is a label (Patient A, Provider 07, Clinic North, Payer North).
   No real PHI, IDs, or NPIs. The browser snapshots this seed into localStorage
   on first visit; Reset restores it. */

"use strict";

const DAY = 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/* Scenario templates: synthetic documents + payer criteria.           */
/* Every "met" claim cites a verbatim passage from a bundled document. */
/* "can't tell" has no passage — "no passage found" is a real answer.  */
/* ------------------------------------------------------------------ */

const SCENARIOS = {
  cardiac: {
    service: "Cardiac PET/CT with stress",
    type: "imaging",
    docs: [
      {
        id: "order fax",
        label: "Order fax",
        text: "=== Order fax — Clinic North ===\n2026-10-01 09:04 received\nOrdering: Provider 07, Cardiology\nPatient: [Patient label]\nService: Cardiac PET/CT with stress\nDiagnosis: exertional chest pain, suspected ischemia\nIndication: recurrent exertional chest pain; symptoms limit stair climbing\nNotes: clinical correlation requested; stress imaging chosen over exercise ECG due to baseline LBBB\n",
      },
      {
        id: "chart note",
        label: "Chart note (2026-09-12)",
        text: "=== Progress note — Clinic North ===\n2026-09-12: Cardiology follow-up.\nCreatinine 1.0 mg/dL, eGFR 74 mL/min (drawn 2026-09-12).\nBP 128/82, HR 72. Reports chest pressure with exertion, improved with rest.\nLBBB noted on resting ECG. Plan: stress imaging with PET/CT.\n",
      },
    ],
    criteria: [
      { id: "c1", text: "Documented diagnosis of suspected ischemia", state: "met", doc: "order fax", passage: "Diagnosis: exertional chest pain, suspected ischemia" },
      { id: "c2", text: "Stress test result within the last 12 months available", state: "can't tell", doc: null, passage: null, gap: "Prior stress test result not in the fax or chart note. Order references a prior test but no result passage was found." },
      { id: "c3", text: "Renal function documented within 90 days (for contrast)", state: "met", doc: "chart note", passage: "Creatinine 1.0 mg/dL, eGFR 74 mL/min (drawn 2026-09-12)" },
      { id: "c4", text: "Ordering provider is cardiology or cardiology note on file", state: "met", doc: "order fax", passage: "Ordering: Provider 07, Cardiology" },
    ],
    addendum: {
      doc: "chart addendum",
      label: "Chart addendum (2026-09-28)",
      text: "=== Chart addendum — Clinic North ===\n2026-09-28: Prior stress test result located. 2026-08-04: Bruce protocol, 11 min 20 s, no chest pain, no ECG changes, Duke score +7 (low risk).\n",
      fix: { c: "c2", passage: "Prior stress test result located. 2026-08-04: Bruce protocol, 11 min 20 s, no ECG changes, Duke score +7 (low risk)" },
    },
  },
  mriSpine: {
    service: "MRI lumbar spine without contrast",
    type: "imaging",
    docs: [
      {
        id: "order fax",
        label: "Order fax",
        text: "=== Order fax — Clinic North ===\n2026-10-01 08:40 received\nOrdering: Provider 03, Orthopedics\nPatient: [Patient label]\nService: MRI lumbar spine without contrast\nDiagnosis: lumbar radiculopathy\nIndication: 8 weeks of radiating leg pain below the knee\n",
      },
      {
        id: "chart note",
        label: "Chart note (2026-09-30)",
        text: "=== Progress note — Clinic North ===\n2026-09-30: Straight leg raise positive right, L5 distribution numbness.\nFailed 6 weeks of physical therapy and NSAIDs.\n",
      },
    ],
    criteria: [
      { id: "c1", text: "Radicular symptoms documented beyond 6 weeks", state: "met", doc: "chart note", passage: "8 weeks of radiating leg pain below the knee" },
      { id: "c2", text: "Conservative therapy trial documented before imaging", state: "met", doc: "chart note", passage: "Failed 6 weeks of physical therapy and NSAIDs" },
      { id: "c3", text: "No red flags (fever, weight loss, saddle anesthesia) documented", state: "can't tell", doc: null, passage: null, gap: "Neither fax nor note documents red-flag screening. Policy requires a documented screen for oncology/red-flag symptoms." },
      { id: "c4", text: "Neurological findings on exam documented", state: "met", doc: "chart note", passage: "Straight leg raise positive right, L5 distribution numbness" },
    ],
    addendum: null,
  },
  ctChest: {
    service: "CT chest with contrast",
    type: "imaging",
    docs: [
      {
        id: "order fax",
        label: "Order fax",
        text: "=== Order fax — Clinic East ===\n2026-09-30 15:22 received\nOrdering: Provider 11, Pulmonology\nPatient: [Patient label]\nService: CT chest with IV contrast\nDiagnosis: persistent cough, lung nodule follow-up\nIndication: 3 mm nodule stable since 2025-11; re-evaluation per guidelines\n",
      },
      {
        id: "chart note",
        label: "Chart note (2026-09-28)",
        text: "=== Progress note — Clinic East ===\n2026-09-28: 3 mm right upper lobe nodule, stable on prior CT (2025-11-14).\nRecommended repeat CT in 12 months per Fleischner criteria.\nSmoking history: 28 pack-years. No fevers, no hemoptysis.\nCreatinine 0.9 mg/dL, eGFR 82 mL/min (drawn 2026-09-28).\n",
      },
    ],
    criteria: [
      { id: "c1", text: "Prior imaging report available for comparison", state: "met", doc: "chart note", passage: "stable on prior CT (2025-11-14)" },
      { id: "c2", text: "Indication matches a documented surveillance interval", state: "met", doc: "chart note", passage: "Recommended repeat CT in 12 months per Fleischner criteria" },
      { id: "c3", text: "Contrast allergy status documented", state: "can't tell", doc: null, passage: null, gap: "No allergy screen found in fax or note; contrast is ordered with IV." },
      { id: "c4", text: "Renal function within 90 days documented (for contrast)", state: "met", doc: "chart note", passage: "Creatinine 0.9 mg/dL, eGFR 82 mL/min (drawn 2026-09-28)" },
    ],
    addendum: null,
  },
  echo: {
    service: "Echocardiogram with strain imaging",
    type: "imaging",
    docs: [
      {
        id: "order fax",
        label: "Order fax",
        text: "=== Order fax — Clinic North ===\n2026-10-02 10:10 received\nOrdering: Provider 07, Cardiology\nPatient: [Patient label]\nService: Echo with strain imaging\nDiagnosis: heart failure with preserved EF\nIndication: reassess diastolic function after medication change\n",
      },
      {
        id: "chart note",
        label: "Chart note (2026-09-20)",
        text: "=== Progress note — Clinic North ===\n2026-09-20: HFpEF, NYHA II. Changed from metoprolol to carvedilol.\nPrior echo (2026-03-11): EF 60%, Grade II diastolic dysfunction.\n",
      },
    ],
    criteria: [
      { id: "c1", text: "Heart failure diagnosis documented", state: "met", doc: "chart note", passage: "HFpEF, NYHA II" },
      { id: "c2", text: "Prior echo within 12 months available for comparison", state: "met", doc: "chart note", passage: "Prior echo (2026-03-11): EF 60%, Grade II diastolic dysfunction" },
      { id: "c3", text: "Clinical change since prior study documented", state: "met", doc: "chart note", passage: "Changed from metoprolol to carvedilol" },
      { id: "c4", text: "Strain imaging justification documented", state: "can't tell", doc: null, passage: null, gap: "No passage explains why strain imaging is needed over standard echo." },
    ],
    addendum: null,
  },
  colonoscopy: {
    service: "Screening colonoscopy",
    type: "procedure",
    docs: [
      {
        id: "order fax",
        label: "Order fax",
        text: "=== Order fax — Clinic South ===\n2026-10-01 11:03 received\nOrdering: Provider 22, Gastroenterology\nPatient: [Patient label]\nService: Screening colonoscopy\nDiagnosis: average risk screening\nIndication: age-appropriate screening; no prior colonoscopy on record\n",
      },
      {
        id: "chart note",
        label: "Chart note (2026-09-25)",
        text: "=== Progress note — Clinic South ===\n2026-09-25: Wellness visit. Age 51, average risk.\nNo family history of colorectal cancer. No GI symptoms.\n",
      },
    ],
    criteria: [
      { id: "c1", text: "Age within screening guideline range", state: "met", doc: "chart note", passage: "Age 51, average risk" },
      { id: "c2", text: "No family history of colorectal cancer documented", state: "met", doc: "chart note", passage: "No family history of colorectal cancer" },
      { id: "c3", text: "No prior colonoscopy within the covered interval", state: "can't tell", doc: null, passage: null, gap: "Fax states no prior colonoscopy on record, but no external claims history is attached for confirmation." },
      { id: "c4", text: "Established primary care relationship documented", state: "met", doc: "chart note", passage: "Wellness visit" },
    ],
    addendum: null,
  },
  kneeScope: {
    service: "Knee arthroscopy",
    type: "procedure",
    docs: [
      {
        id: "order fax",
        label: "Order fax",
        text: "=== Order fax — Clinic West ===\n2026-09-29 09:44 received\nOrdering: Provider 15, Orthopedics\nPatient: [Patient label]\nService: Knee arthroscopy, right\nDiagnosis: meniscal tear\nIndication: mechanical catching with locking episodes\n",
      },
      {
        id: "chart note",
        label: "Chart note (2026-09-26)",
        text: "=== Progress note — Clinic West ===\n2026-09-26: Right knee MRI 2026-09-10: medial meniscus tear.\nCatching and locking episodes reported. 8 weeks of PT without improvement.\n",
      },
    ],
    criteria: [
      { id: "c1", text: "MRI documenting meniscal tear available", state: "met", doc: "chart note", passage: "Right knee MRI 2026-09-10: medial meniscus tear" },
      { id: "c2", text: "Mechanical symptoms documented", state: "met", doc: "chart note", passage: "Catching and locking episodes reported" },
      { id: "c3", text: "Conservative therapy attempted and failed", state: "met", doc: "chart note", passage: "8 weeks of PT without improvement" },
      { id: "c4", text: "Weight-bearing imaging consistent with findings", state: "can't tell", doc: null, passage: null, gap: "Standing radiographs not present in the faxed packet; policy requires weight-bearing films." },
    ],
    addendum: null,
  },
  glp1: {
    service: "GLP-1 (semaglutide) 1 mg weekly",
    type: "drug",
    docs: [
      {
        id: "order fax",
        label: "Order fax",
        text: "=== Order fax — Clinic South ===\n2026-10-02 09:31 received\nOrdering: Provider 23, Endocrinology\nPatient: [Patient label]\nService: GLP-1 (semaglutide) 1 mg weekly\nDiagnosis: type 2 diabetes, overweight\nIndication: add-on therapy; A1c above goal on metformin\n",
      },
      {
        id: "chart note",
        label: "Chart note (2026-09-18)",
        text: "=== Progress note — Clinic South ===\n2026-09-18: A1c 8.1% on metformin 1000 mg BID. BMI 31.4.\nDiet and exercise counseling documented at every visit this year.\n",
      },
    ],
    criteria: [
      { id: "c1", text: "Type 2 diabetes diagnosis documented", state: "met", doc: "order fax", passage: "Diagnosis: type 2 diabetes, overweight" },
      { id: "c2", text: "Metformin trial documented before add-on therapy", state: "met", doc: "chart note", passage: "A1c 8.1% on metformin 1000 mg BID" },
      { id: "c3", text: "A1c above goal documented within 90 days", state: "met", doc: "chart note", passage: "A1c 8.1%" },
      { id: "c4", text: "Contraindication screen (personal/family MEN2, medullary thyroid cancer) documented", state: "can't tell", doc: null, passage: null, gap: "No MEN2/family thyroid history screen found in the packet." },
    ],
    addendum: null,
  },
  biologic: {
    service: "Infliximab infusion (biologic)",
    type: "drug",
    docs: [
      {
        id: "order fax",
        label: "Order fax",
        text: "=== Order fax — Clinic East ===\n2026-09-29 13:12 received\nOrdering: Provider 18, Gastroenterology\nPatient: [Patient label]\nService: Infliximab infusion\nDiagnosis: Crohn's disease, moderate\nIndication: inadequate response to two prior therapies\n",
      },
      {
        id: "chart note",
        label: "Chart note (2026-09-22)",
        text: "=== Progress note — Clinic East ===\n2026-09-22: Crohn's ileocolitis. Failed mesalamine and 6-MP.\nCurrent: prednisone taper. Active inflammation on colonoscopy 2026-09-05.\nTB screen negative 2026-09-03 (QuantiFERON).\n",
      },
    ],
    criteria: [
      { id: "c1", text: "Crohn's disease diagnosis documented", state: "met", doc: "chart note", passage: "Crohn's ileocolitis" },
      { id: "c2", text: "Failure or intolerance of two prior therapies documented", state: "met", doc: "chart note", passage: "Failed mesalamine and 6-MP" },
      { id: "c3", text: "Active disease confirmed by endoscopy or imaging", state: "met", doc: "chart note", passage: "Active inflammation on colonoscopy 2026-09-05" },
      { id: "c4", text: "TB screen completed before biologic start", state: "met", doc: "chart note", passage: "TB screen negative 2026-09-03 (QuantiFERON)" },
    ],
    addendum: null,
  },
};

/* ------------------------------------------------------------------ */
/* PA case scripts: which scenario, which status, which criterion the  */
/* record cannot support. Deterministic — no randomness in names.      */
/* ------------------------------------------------------------------ */

const PA_SCRIPTS = [
  // id, patient, clinic, payer, provider, scenario, status
  ["PA-1001", "Patient A", "Clinic North", "Payer North", "Provider 07", "cardiac", "approved"],
  ["PA-1002", "Patient B", "Clinic North", "Payer North", "Provider 03", "mriSpine", "submitted"],
  ["PA-1003", "Patient C", "Clinic North", "Payer North", "Provider 07", "cardiac", "review"],
  ["PA-1004", "Patient D", "Clinic North", "Payer Blue", "Provider 07", "echo", "ready"],
  ["PA-1005", "Patient E", "Clinic East", "Payer Blue", "Provider 11", "ctChest", "ingested"],
  ["PA-1006", "Patient F", "Clinic North", "Payer West", "Provider 07", "cardiac", "approved"],
  ["PA-1007", "Patient G", "Clinic South", "Payer Sun", "Provider 22", "colonoscopy", "review"],
  ["PA-1008", "Patient H", "Clinic North", "Payer North", "Provider 03", "mriSpine", "pending"],
  ["PA-1009", "Patient I", "Clinic West", "Payer Blue", "Provider 15", "kneeScope", "approved"],
  ["PA-1010", "Patient J", "Clinic South", "Payer Sun", "Provider 23", "glp1", "ready"],
  ["PA-1011", "Patient K", "Clinic East", "Payer North", "Provider 18", "biologic", "retry"],
  ["PA-1012", "Patient L", "Clinic North", "Payer West", "Provider 07", "cardiac", "review"],
  ["PA-1013", "Patient M", "Clinic North", "Payer North", "Provider 03", "mriSpine", "approved"],
  ["PA-1014", "Patient N", "Clinic East", "Payer Blue", "Provider 11", "ctChest", "submitted"],
  ["PA-1015", "Patient O", "Clinic North", "Payer North", "Provider 07", "echo", "pending"],
  ["PA-1016", "Patient P", "Clinic South", "Payer Sun", "Provider 22", "colonoscopy", "approved"],
  ["PA-1017", "Patient Q", "Clinic North", "Payer North", "Provider 07", "cardiac", "ingested"],
  ["PA-1018", "Patient R", "Clinic West", "Payer Blue", "Provider 15", "kneeScope", "submitted"],
  ["PA-1019", "Patient S", "Clinic South", "Payer Sun", "Provider 23", "glp1", "denied"],
  ["PA-1020", "Patient T", "Clinic North", "Payer North", "Provider 03", "mriSpine", "ready"],
  ["PA-1021", "Patient U", "Clinic East", "Payer North", "Provider 18", "biologic", "pending"],
  ["PA-1022", "Patient V", "Clinic North", "Payer Blue", "Provider 07", "echo", "approved"],
  ["PA-1023", "Patient W", "Clinic North", "Payer North", "Provider 07", "cardiac", "submitted"],
  ["PA-1024", "Patient X", "Clinic South", "Payer Sun", "Provider 22", "colonoscopy", "ingested"],
  ["PA-1025", "Patient Y", "Clinic East", "Payer Blue", "Provider 11", "ctChest", "denied"],
  ["PA-1026", "Patient Z", "Clinic North", "Payer West", "Provider 07", "cardiac", "ready"],
];

const PA_SPECIAL = {
  "PA-1003": {
    reasons: ["Prior test result not in record — criterion cannot be confirmed"],
    owner: "Clinic North staff",
    addendum: true,
  },
  "PA-1004": {
    note: "Strain imaging requested for early detection of subclinical dysfunction in the HFpEF cohort.",
    fix: { c: "c4", passage: "Strain imaging requested for early detection of subclinical dysfunction in the HFpEF cohort" },
  },
  "PA-1007": {
    reasons: ["Policy mismatch: screening interval cannot be confirmed", "No external claims history attached"],
    owner: "Ops partner",
  },
  "PA-1010": {
    note: "Contraindication screen negative: no personal or family history of MEN2 or medullary thyroid carcinoma.",
    fix: { c: "c4", passage: "Contraindication screen negative: no personal or family history of MEN2 or medullary thyroid carcinoma" },
  },
  "PA-1011": {
    reasons: ["Portal error: submission failed twice at Payer North portal"],
    owner: "Ops partner",
    portalError: { at: "2026-10-02T17:05", code: "504 gateway timeout", attempts: 2 },
  },
  "PA-1012": {
    reasons: ["Prior test result not in record — criterion cannot be confirmed"],
    owner: "Clinic North staff",
  },
  "PA-1020": {
    note: "Red-flag screen negative: no fever, no weight loss, no saddle anesthesia.",
    fix: { c: "c3", passage: "Red-flag screen negative: no fever, no weight loss, no saddle anesthesia" },
  },
  "PA-1026": {
    note: "Prior stress test result on file: 2026-08-04 Bruce protocol, 11 min 20 s, no ECG changes, Duke score +7 (low risk).",
    fix: { c: "c2", passage: "2026-08-04 Bruce protocol, 11 min 20 s, no ECG changes, Duke score +7 (low risk)" },
  },
};

const NONROUTINE_POOL = [
  "Prior test result not in record — criterion cannot be confirmed",
  "Policy mismatch: prior trial not documented",
  "Missing note: current medication list",
  "Ambiguous fax: CPT code unclear",
];

const ROUTINE_OWNER = "Agent";
const DENIAL_REASONS = {
  "PA-1019": "Not medically necessary: no documented contraindication screen for prescribed class before trial of alternatives.",
  "PA-1025": "Not medically necessary: surveillance interval not supported by the most recent guideline version cited by the payer.",
};

/* ------------------------------------------------------------------ */
/* Referral scripts                                                    */
/* ------------------------------------------------------------------ */

const REF_SCRIPTS = [
  // id, patient, clinic, payer, from, specialty, needed, urgency, status, extra
  ["RF-2001", "Patient D", "Clinic North", "Payer Blue", "Provider 12 — Family Medicine", "Cardiology", "Cardiology consult — arrhythmia evaluation", "Routine", "ingested", {}],
  ["RF-2002", "Patient E", "Clinic East", "Payer North", "Provider 13 — Family Medicine", "Orthopedics", "Shoulder consult — rotator cuff concern", "Routine", "scheduled", { specialist: "Specialist 4 — Orthopedics", slot: "2026-10-14 09:30" }],
  ["RF-2003", "Patient G", "Clinic South", "Payer Sun", "Provider 21 — Internal Medicine", "Dermatology", "Lesion evaluation — suspected melanoma", "Urgent", "eligibility", {}],
  ["RF-2004", "Patient M", "Clinic North", "Payer North", "Provider 12 — Family Medicine", "Cardiology", "Cardiology consult — murmur follow-up", "Routine", "matched", { specialist: "Specialist 2 — Cardiology", slot: "2026-10-13 14:00" }],
  ["RF-2005", "Patient Q", "Clinic North", "Payer Blue", "Provider 14 — Family Medicine", "Neurology", "Headache consult — migraine with new pattern", "Routine", "review", { reasons: ["Fax quality: insurance ID unreadable on page 2"] }],
  ["RF-2006", "Patient T", "Clinic South", "Payer Sun", "Provider 25 — Internal Medicine", "Endocrinology", "Thyroid nodule evaluation", "Routine", "ingested", {}],
  ["RF-2007", "Patient W", "Clinic West", "Payer Blue", "Provider 16 — Family Medicine", "Orthopedics", "Hip pain consult — suspected labral tear", "Routine", "eligibility", {}],
  ["RF-2008", "Patient X", "Clinic North", "Payer North", "Provider 12 — Family Medicine", "Dermatology", "Psoriasis — new biologic consideration", "Routine", "matched", { specialist: "Specialist 6 — Dermatology", slot: "2026-10-15 11:00" }],
  ["RF-2009", "Patient Z", "Clinic East", "Payer West", "Provider 13 — Family Medicine", "Neurology", "Dizziness consult — vertigo evaluation", "Routine", "scheduled", { specialist: "Specialist 8 — Neurology", slot: "2026-10-16 10:15" }],
];

const REF_DOC = {
  id: "referral fax",
  label: "Referral fax",
  text: "=== Referral fax ===\nReceived via inbound fax\nReferring: [FROM]\nPatient: [Patient label]\nSpecialty needed: [SPECIALTY]\nReason: [NEEDED]\nUrgency: [URGENCY]\nInsurance: [PAYER] — member ID: LBL-[ID]\nAttachments: 2 (chart summary, recent labs)\n",
};

/* ------------------------------------------------------------------ */
/* Rollout seed data (all synthetic)                                   */
/* ------------------------------------------------------------------ */

const ROLLOUT_SEED = {
  practices: [
    {
      id: "north", name: "Clinic North", stage: "Live", note: "Cardiology-first practice. PA and referrals both live.",
      metrics: {
        pa: { baseline: { taskMin: 41, clicks: 46, errorPct: 6.2 }, current: { taskMin: 9.4, clicks: 11, errorPct: 2.8 } },
        referral: { baseline: { taskMin: 55, clicks: 61, errorPct: 7.5 }, current: { taskMin: 12.8, clicks: 14, errorPct: 3.1 } },
      },
    },
    {
      id: "east", name: "Clinic East", stage: "Pilot", note: "Referrals in pilot; PA onboarding next.",
      metrics: {
        pa: { baseline: { taskMin: 38, clicks: 43, errorPct: 5.4 }, current: null },
        referral: { baseline: { taskMin: 49, clicks: 57, errorPct: 6.8 }, current: { taskMin: 15.2, clicks: 17, errorPct: 3.6 } },
      },
    },
    {
      id: "south", name: "Clinic South", stage: "Planned", note: "Baseline metrics collection under way — the Map phase.",
      metrics: {
        pa: { baseline: { taskMin: 44, clicks: 51, errorPct: 7.1 }, current: null },
        referral: { baseline: { taskMin: 52, clicks: 59, errorPct: 6.5 }, current: null },
      },
    },
  ],
  productVsCustom: {
    standard: [
      "Auto-submit for routine cases — one rule for every practice",
      "Human review queue for non-routine work — one queue across all workflows",
      "Audit log of every AI and human action — built-in traceability",
      "Retry and escalation rules for portal failures",
      "Three-state evidence answers: met / not met / can't tell",
    ],
    custom: [
      "Clinic North cardiology fax templates and note attachments",
      "Payer North portal retry window and credential handling",
      "Referral urgency tiers for Clinic East schedulers",
    ],
  },
  baselineByWorkflow: {
    pa: { name: "Prior authorization", baseline: { taskMin: 41, clicks: 46, errorPct: 6.2 } },
    referral: { name: "Referral processing", baseline: { taskMin: 55, clicks: 61, errorPct: 7.5 } },
  },
};

/* ------------------------------------------------------------------ */
/* One-page specs for Planned workflows                                */
/* ------------------------------------------------------------------ */

const SPECS = {
  eligibility: {
    wf: "Eligibility verification",
    stage: "Planned",
    summary: "Verify member eligibility and benefits before a service is scheduled, so eligibility denials never reach the patient.",
    why: "Referral cases already run an eligibility check inside the same shell; this workflow promotes that check to its own worklist with volume, coverage detail, and plan-specific rules.",
    reuse: [
      "Same case shell, review queue, and audit log as PA and referrals",
      "Payer connection layer built for the PA portal",
      "Three-state evidence answers reused for plan rules (covered / not covered / can't tell)",
    ],
    custom: ["Per-payer benefit summary templates", "Clinic South self-pay screening flow"],
    questions: [
      "Do plan rule lookups count as routine automation or do they need the review gate?",
      "What does the practice staff need to see when coverage is partial?",
    ],
    milestone: "Pilot at Clinic North on referral eligibility first; then a standalone worklist at Clinic East.",
  },
  denials: {
    wf: "Denials",
    stage: "Planned",
    summary: "Catch denials the day they arrive, classify the reason, and start an appeal with the clinical record already attached.",
    why: "Denied cases already land here in the prototype. The Expand team would turn that event stream into a workflow instead of an exception.",
    reuse: [
      "Denied status and denial reasons already written to the audit log",
      "Criterion citations reused as appeal evidence — every claim already carries its source passage",
      "Review queue ownership rules reused for appeal assignment",
    ],
    custom: ["Payer North appeal letter templates", "Practice-specific appeal deadlines per payer"],
    draftOutline: [
      "Stage 1 — Detect: payer response parsed, denial reason classified (clinical / administrative / missing info)",
      "Stage 2 — Triage: clinical denials to staff, administrative denials to ops partner, auto-fix the fixable ones",
      "Stage 3 — Appeal: draft appeal assembled from cited criteria, human review before send, deadline tracked",
      "Stage 4 — Learn: denial reasons roll into the rollout view so the Expand team sees patterns",
    ],
    questions: [
      "Which denial reasons are auto-fixable vs human-owned on day one?",
      "Do appeals share the PA submission channel or use a separate payer endpoint?",
    ],
    milestone: "Pilot: appeals for Payer North only; measure appeal turnaround vs baseline.",
  },
};

/* ------------------------------------------------------------------ */
/* Builders                                                            */
/* ------------------------------------------------------------------ */

function buildPaCase(script, idx) {
  const [id, patient, clinic, payer, provider, scenId, status] = script;
  const scen = SCENARIOS[scenId];
  const special = PA_SPECIAL[id] || {};
  const hours = Math.floor((idx * 7) % 96) + 4; // 4..99h ago, deterministic
  const t0 = Date.now() - hours * 3600 * 1000;

  const docs = scen.docs.map((d) => ({
    id: d.id,
    label: d.label,
    text: d.text.replace("[Patient label]", patient) + (special.note && d.id === "chart note" ? "\n" + special.note : ""),
  }));
  if (special.addendum) {
    docs.push({ id: scen.addendum.doc, label: scen.addendum.label, text: scen.addendum.text.replace("[Patient label]", patient), attached: false });
  }

  const criteria = scen.criteria.map((c) => {
    const base = {
      id: c.id,
      text: c.text,
      state: c.state,
      doc: c.doc,
      passage: c.passage,
      gap: c.gap || null,
    };
    if (special.fix && special.fix.c === c.id) {
      base.state = "met";
      base.doc = "chart note";
      base.passage = special.fix.passage;
      base.gap = null;
    }
    return base;
  });

  const routine = ["submitted", "pending", "approved", "ready"].includes(status);
  const reasons = special.reasons || (routine ? [] : [NONROUTINE_POOL[idx % NONROUTINE_POOL.length]]);
  const owner = special.owner || (routine ? null : "Clinic North staff");

  const history = [];
  history.push({ t: fmt(t0), actor: "Agent", action: "Fax ingested", detail: `Order fax received; ${criteria.length} fields extracted, ${criteria.length - 1} attached to passages.` });
  if (routine && (status === "submitted" || status === "pending" || status === "approved")) {
    history.push({ t: fmt(t0 + 26 * 60000), actor: "Agent", action: "Draft completed", detail: "All criteria supported by cited passages. Routine case." });
    history.push({ t: fmt(t0 + 34 * 60000), actor: "Agent", action: "Auto-submitted (simulated)", detail: "Submitted to " + payer + " portal — routine, all criteria met." });
    history.push({ t: fmt(t0 + (status === "approved" ? 5 : status === "pending" ? 20 : 2) * 3600000), actor: payer, action: status === "approved" ? "Payer response: Approved (synthetic)" : status === "pending" ? "Awaiting payer response" : "Awaiting payer response", detail: "" });
  } else if (routine && status === "ready") {
    history.push({ t: fmt(t0 + 26 * 60000), actor: "Agent", action: "Draft completed", detail: "All criteria supported by cited passages. Ready to submit." });
  } else if (status === "ingested" || status === "ready") {
    history.push({ t: fmt(t0 + 26 * 60000), actor: "Agent", action: "Draft completed", detail: "Draft assembled; " + criteria.filter((c) => c.state === "met").length + " criteria met, " + criteria.filter((c) => c.state !== "met").length + " flagged." });
  } else if (status === "review") {
    history.push({ t: fmt(t0 + 20 * 60000), actor: "Agent", action: "Draft completed", detail: "Draft assembled; non-routine blocker found." });
    history.push({ t: fmt(t0 + 22 * 60000), actor: "Agent", action: "Held for human review", detail: reasons.join("; ") + " — owner: " + owner + "." });
  } else if (status === "retry") {
    history.push({ t: fmt(t0 + 26 * 60000), actor: "Agent", action: "Draft completed", detail: "Routine case, all criteria met." });
    history.push({ t: fmt(t0 + 30 * 60000), actor: "Agent", action: "Auto-submitted (simulated)", detail: "Submitted to " + payer + " portal." });
    history.push({ t: fmt(special.portalError.at), actor: payer + " portal", action: "Submission failed — " + special.portalError.code, detail: "Attempt " + special.portalError.attempts + " of 2. Auto-retry scheduled. Ops partner notified." });
  } else if (status === "denied") {
    history.push({ t: fmt(t0 + 26 * 60000), actor: "Agent", action: "Draft completed", detail: "Routine case, all criteria met." });
    history.push({ t: fmt(t0 + 32 * 60000), actor: "Agent", action: "Auto-submitted (simulated)", detail: "Submitted to " + payer + " portal." });
    history.push({ t: fmt(t0 + 30 * 3600000), actor: payer, action: "Payer response: Denied (synthetic)", detail: DENIAL_REASONS[id] || "Denied — reason on file." });
  }

  return {
    wf: "pa",
    id, patient, clinic, payer, provider, service: scen.service, serviceType: scen.type,
    status, routine, reasons, owner,
    docs, criteria, addendum: special.addendum ? true : false,
    history,
    minutes: 6 + (idx % 9),            // synthetic task minutes when touched this session
    clicks: 8 + (idx % 7),             // synthetic clicks per case
    portalError: special.portalError || null,
    failures: status === "retry" ? 2 : 0,
    submittedAt: ["submitted", "pending", "approved", "denied", "retry"].includes(status) ? fmt(t0 + 34 * 60000) : null,
  };
}

function buildRefCase(script, idx) {
  const [id, patient, clinic, payer, from, specialty, needed, urgency, status, extra] = script;
  const t0 = Date.now() - (4 + idx * 6) * 3600 * 1000;
  const fax = REF_DOC.text
    .replace("[FROM]", from).replace("[Patient label]", patient)
    .replace("[SPECIALTY]", specialty).replace("[NEEDED]", needed)
    .replace("[URGENCY]", urgency).replace("[PAYER]", payer)
    .replace("[ID]", 2001 + idx);

  const isReview = status === "review";
  const reasons = extra.reasons || [];
  const owner = isReview ? (reasons.length ? "Ops partner" : null) : null;

  const history = [];
  history.push({ t: fmt(t0), actor: "Agent", action: "Referral fax ingested", detail: "Fields extracted: patient, referring provider, specialty, urgency, insurance." });
  if (isReview) {
    history.push({ t: fmt(t0 + 900000), actor: "Agent", action: "Held for human review", detail: reasons.join("; ") + " — owner: " + owner + "." });
  }
  if (status === "eligibility" || status === "matched" || status === "scheduled") {
    history.push({ t: fmt(t0 + 1.2 * 3600000), actor: "Agent", action: "Eligibility check complete", detail: payer + " — member active, cardiology in network (synthetic response)." });
  }
  if (status === "matched" || status === "scheduled") {
    history.push({ t: fmt(t0 + 1.6 * 3600000), actor: "Agent", action: "Specialist matched", detail: extra.specialist + " — best match by specialty, distance, and next availability." });
  }
  if (status === "scheduled") {
    history.push({ t: fmt(t0 + 1.9 * 3600000), actor: "Agent", action: "Scheduling requested", detail: extra.slot + " requested via scheduler portal (simulated)." + (idx % 2 ? "" : " Practice scheduler confirms by phone.") });
  }

  return {
    wf: "referral",
    id, patient, clinic, payer, from, specialty, needed, urgency,
    status, reasons, owner, fax,
    eligibility: status === "eligibility" && idx % 2 ? null : status === "matched" || status === "scheduled" ? { state: "verified", detail: payer + " — member active, " + specialty + " in network. Deductible $1,500 (synthetic)." } : null,
    matches: status === "matched" || status === "scheduled"
      ? [
          { specialist: extra.specialist, score: 0.94, reason: "Specialty match, 4.1 mi, next slot " + extra.slot.replace(" ", " at ") + "." },
          { specialist: "Specialist 9 — " + specialty, score: 0.81, reason: "Specialty match, 9.8 mi, next slot later." },
        ]
      : null,
    chosenSpecialist: status === "matched" || status === "scheduled" ? extra.specialist : null,
    requestedSlot: status === "scheduled" ? extra.slot : null,
    history,
    minutes: 8 + (idx % 7),
    clicks: 9 + (idx % 6),
  };
}

function fmt(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes());
}

function buildSeed() {
  const paCases = PA_SCRIPTS.map(buildPaCase);
  const refCases = REF_SCRIPTS.map(buildRefCase);
  return {
    v: 1,
    paCases,
    refCases,
    session: { clicks: 0, processed: 0, errors: 0, startedAt: fmt(Date.now()) },
    demo: { portalDown: false, lastSubmittedId: null, lastDeniedId: null },
    startedAt: fmt(Date.now()),
  };
}

/* Global seed export used on first load and reset. */
function freshSeed() {
  return buildSeed();
}