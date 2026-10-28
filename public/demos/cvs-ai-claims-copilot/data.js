/* Claims Review Copilot: synthetic example data only. No real members, providers, or PHI. */
(function () {
  'use strict';
  var TODAY = '2026-10-28';

  // Small seeded random so the demo looks the same on every load.
  var seed = 20261028;
  function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
  function pick(a) { return a[Math.floor(rnd() * a.length)]; }
  function between(a, b) { return Math.round(a + rnd() * (b - a)); }
  function addDays(iso, n) { var d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

  var REC = {
    pay: { label: 'Pay', tone: 'good', note: 'All checks pass. Human confirms and releases.' },
    adjust: { label: 'Pay with adjustment', tone: 'info', note: 'Pay the claim, with a coding edit applied to one line.' },
    info: { label: 'Request info', tone: 'warn', note: 'Something is missing. Ask the provider or member before deciding.' },
    clinical: { label: 'Send to clinician', tone: 'clin', note: 'Medical judgment needed. A licensed clinician decides. AI does not deny.' },
    integrity: { label: 'Integrity review', tone: 'pi', note: 'Pattern looks unusual. An investigator looks before payment. A flag is a lead, not a finding.' }
  };

  var SCEN = [
    {
      key: 'auth-match', rec: 'pay', pend: 'Prior auth not linked',
      lines: [['70553', 'MRI brain, with and without contrast', 1, 2140]],
      dx: 'G43.909 Migraine, unspecified', pos: 'Outpatient imaging center',
      why: 'The claim pended because no prior auth was linked. The copilot found an approved auth for the same member, code, and date range in the auth system under a typo in the provider ID.',
      evidence: [
        ['Auth record', 'Auth PA-SYN-55120 approved for 70553, 1 unit, valid Oct 1 to Dec 31.'],
        ['Provider match', 'NPI on claim and auth differ by one digit. Tax ID, name, and address match.'],
        ['Eligibility', 'Member active on date of service. No other coverage on file.']
      ],
      policy: ['EX-210 Prior Auth Linking (synthetic example policy)', 'If an approved auth matches member, code, units, and dates, link it and process. Fix provider ID typos only when tax ID, name, and address all match.'],
      conf: [0.9, 0.97], risk: [4, 12]
    },
    {
      key: 'ncci', rec: 'adjust', pend: 'Coding edit hit',
      lines: [['99214', 'Office visit, established patient, moderate', 1, 210], ['97110', 'Therapeutic exercise, each 15 min', 2, 180], ['97140', 'Manual therapy, each 15 min', 1, 95]],
      dx: 'M54.50 Low back pain, unspecified', pos: 'Physician office',
      why: 'Two lines on the same date may bundle under a coding edit. The note does not show a separate, distinct service, so a modifier is not supported.',
      evidence: [
        ['Coding edit', 'Line pair 97140 with 97110 needs a distinct service modifier when billed together. None present.'],
        ['Clinical note', 'Visit note lists one 30 minute therapy block. No separate body area named.'],
        ['History', 'Provider billed the same pair with modifier 59 on 3 of the last 20 claims.']
      ],
      policy: ['CMS NCCI Procedure to Procedure edits (public reference)', 'Code pairs that are usually done together are paid as one unless the record supports a distinct service.'],
      policyUrl: 'https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-ncci-edits',
      conf: [0.78, 0.9], risk: [18, 35]
    },
    {
      key: 'cob', rec: 'info', pend: 'Other coverage suspected',
      lines: [['93306', 'Echocardiogram, complete', 1, 1650]],
      dx: 'I50.9 Heart failure, unspecified', pos: 'Hospital outpatient',
      why: 'A spouse plan may be primary. The coordination of benefits file is 14 months old. Paying now could mean a recovery later.',
      evidence: [
        ['COB file', 'Last COB update: Aug 2025. Spouse employer plan listed, status unknown.'],
        ['Claim', 'No primary payer EOB attached.'],
        ['Member contact', 'No COB survey reply on file.']
      ],
      policy: ['EX-118 Coordination of Benefits (synthetic example policy)', 'If COB info is older than 12 months and another plan may be primary, request a COB update before paying. Pay the undisputed part when the law requires it.'],
      conf: [0.72, 0.86], risk: [10, 22]
    },
    {
      key: 'med-nec', rec: 'clinical', pend: 'Medical necessity review',
      lines: [['27447', 'Total knee replacement', 1, 38200]],
      dx: 'M17.11 Primary osteoarthritis, right knee', pos: 'Inpatient hospital',
      why: 'The request needs a medical judgment. The record shows some but not all of the usual criteria. The copilot found the gaps and drafted questions. A clinician decides.',
      evidence: [
        ['Imaging', 'X-ray report notes severe joint space narrowing. Found in attached records.'],
        ['Conservative care', 'PT notes cover 6 weeks. Policy example asks for 12 weeks or a documented reason.'],
        ['Function', 'Pain score and walking limits are documented.']
      ],
      policy: ['EX-402 Joint Replacement (synthetic example policy)', 'Medical necessity calls are made only by a licensed clinician. AI may summarize the record and list missing items. It may not deny.'],
      conf: [0.55, 0.7], risk: [45, 72]
    },
    {
      key: 'dup', rec: 'integrity', pend: 'Possible duplicate',
      lines: [['E0601', 'CPAP device', 1, 1180]],
      dx: 'G47.33 Obstructive sleep apnea', pos: 'Home',
      why: 'A near match claim was paid 9 days ago for the same member and device. Different claim number and slightly different billed amount.',
      evidence: [
        ['Prior claim', 'CLM-SYN-3381, same member, same code, DOS 2 days apart, paid Oct 19.'],
        ['Supplier', 'Same supplier tax ID. Second claim from a different billing office.'],
        ['Rental rules', 'Device is a capped rental item. A second purchase line is unusual.']
      ],
      policy: ['EX-330 Duplicate Claim Review (synthetic example policy)', 'Hold suspected duplicates for an investigator. Release within the prompt pay window if the claim is a valid, separate service.'],
      conf: [0.8, 0.93], risk: [8, 20]
    },
    {
      key: 'elig', rec: 'info', pend: 'Eligibility gap',
      lines: [['99285', 'Emergency visit, high severity', 1, 2980]],
      dx: 'R07.9 Chest pain, unspecified', pos: 'Emergency room',
      why: 'The member had a retro change in coverage. Eligibility on the date of service is not clear from the file.',
      evidence: [
        ['Eligibility', 'Retro update received Oct 20 moves term date from Sep 30 to Oct 31.'],
        ['Emergency rule', 'Emergency visit. Prudent layperson rules apply if covered.'],
        ['Employer feed', 'Group file confirms active through Oct 31. Sync pending.']
      ],
      policy: ['EX-101 Eligibility Updates (synthetic example policy)', 'When a retro update confirms coverage, reprocess. Do not deny emergency care for a sync lag.'],
      conf: [0.82, 0.92], risk: [20, 38]
    },
    {
      key: 'nsa', rec: 'adjust', pend: 'Out of network, surprise bill rules',
      lines: [['00790', 'Anesthesia, upper abdomen surgery', 1, 4600]],
      dx: 'K80.20 Gallstones without obstruction', pos: 'In network hospital',
      why: 'Out of network anesthesia at an in network hospital. Surprise billing protections apply, so the member pays in network cost share.',
      evidence: [
        ['Network', 'Facility in network. Anesthesia group out of network.'],
        ['Member cost share', 'Must match in network amount under federal surprise billing rules.'],
        ['Payment', 'Initial payment amount set by plan method. Provider may dispute through the federal process.']
      ],
      policy: ['No Surprises Act protections (public reference)', 'Members get in network cost sharing for certain out of network care at in network facilities.'],
      policyUrl: 'https://www.cms.gov/nosurprises',
      conf: [0.83, 0.94], risk: [25, 45]
    },
    {
      key: 'units', rec: 'integrity', pend: 'Unusual units',
      lines: [['J1745', 'Infliximab injection, 10 mg', 90, 14400]],
      dx: 'K50.90 Crohn disease, unspecified', pos: 'Physician office',
      why: 'Units billed are about 2.2 times the typical dose for the weight on file. Could be a units error or a weight update.',
      evidence: [
        ['Dose check', 'Weight on file 62 kg. Typical dose range points to about 30 to 40 units.'],
        ['Provider history', 'Same practice billed 40 units for this member in each of the last 3 infusions.'],
        ['Possible cause', 'Units field may hold mg instead of 10 mg units.']
      ],
      policy: ['EX-344 Drug Units Review (synthetic example policy)', 'When units exceed a dose range, contact the provider to confirm. Do not deny for a units typo. Correct and pay.'],
      conf: [0.74, 0.88], risk: [12, 26]
    }
  ];

  var PROVIDERS = ['Riverbend Imaging (example)', 'Maple Street Ortho (example)', 'Harborview Cardiology (example)', 'Northfield Therapy Group (example)', 'Lakeside Medical Supply (example)', 'Summit Anesthesia Partners (example)', 'Cedar Valley Infusion (example)', 'Union General Hospital (example)', 'Prairie Family Practice (example)'];
  var LOBS = ['Commercial', 'Commercial', 'Medicare Advantage', 'Medicare Advantage', 'Medicaid'];
  var STATES = ['NY', 'NY', 'TX', 'PA', 'FL', 'OH', 'AZ', 'NJ'];
  var AGE = ['18 to 34', '35 to 49', '50 to 64', '65 to 74', '75 plus'];
  var FIRST = ['A.', 'B.', 'C.', 'D.', 'E.', 'F.', 'G.', 'H.', 'J.', 'K.', 'L.', 'M.', 'N.', 'P.', 'R.', 'S.', 'T.', 'V.'];
  var LAST = ['Sample', 'Testcase', 'Demo', 'Example', 'Synthetic'];

  var claims = [];
  for (var i = 0; i < 40; i++) {
    var s = SCEN[i % SCEN.length];
    if (i >= 8) s = SCEN[Math.floor(rnd() * SCEN.length)];
    var lob = pick(LOBS);
    if (s.key === 'dup' && lob === 'Commercial' && rnd() > 0.5) lob = 'Medicare Advantage';
    var age = lob === 'Medicare Advantage' ? pick(['65 to 74', '75 plus', '65 to 74']) : pick(AGE.slice(0, 3));
    var received = addDays(TODAY, -between(2, 27));
    var billed = 0;
    var lines = s.lines.map(function (l) {
      var amt = Math.round(l[3] * (0.9 + rnd() * 0.25));
      billed += amt;
      return { code: l[0], desc: l[1], units: l[2], billed: amt };
    });
    var conf = Math.round((s.conf[0] + rnd() * (s.conf[1] - s.conf[0])) * 100) / 100;
    claims.push({
      id: 'CLM-SYN-' + (40210 + i * 7),
      member: pick(FIRST) + ' ' + pick(LAST),
      memberId: 'M-SYN-' + between(100000, 999999),
      age: age,
      lob: lob,
      state: pick(STATES),
      provider: s.key === 'dup' ? 'Lakeside Medical Supply (example)' : (s.key === 'units' ? 'Cedar Valley Infusion (example)' : pick(PROVIDERS)),
      received: received,
      channel: rnd() > 0.15 ? 'Electronic' : 'Paper',
      scenario: s.key,
      pend: s.pend,
      rec: s.rec,
      conf: conf,
      appealRisk: between(s.risk[0], s.risk[1]),
      dx: s.dx,
      pos: s.pos,
      lines: lines,
      billed: billed,
      why: s.why,
      evidence: s.evidence,
      policy: s.policy,
      policyUrl: s.policyUrl || '',
      status: 'Open'
    });
  }
  // Featured claim for the demo script.
  claims[3].member = 'R. Sample'; claims[3].lob = 'Medicare Advantage'; claims[3].age = '65 to 74'; claims[3].state = 'NY'; claims[3].received = addDays(TODAY, -21); claims[3].appealRisk = 64; claims[3].conf = 0.62;

  var denialMix = [
    { reason: 'Other or unclear reason', share: 31, clear: false },
    { reason: 'Administrative (missing info, duplicate, eligibility)', share: 27, clear: true },
    { reason: 'Coding edit', share: 14, clear: true },
    { reason: 'No prior auth or referral', share: 11, clear: true },
    { reason: 'Coordination of benefits', share: 8, clear: true },
    { reason: 'Medical necessity (clinician decided)', share: 6, clear: true },
    { reason: 'Out of network', share: 3, clear: true }
  ];

  var anomalies = [
    { id: 'PI-701', type: 'Possible duplicates', provider: 'Lakeside Medical Supply (example)', claims: 14, dollars: 16520, score: 0.91, stage: 'Pre-pay hold', detail: '14 pairs of claims with same member, device, and dates within 3 days. Sent from two billing offices.', next: 'Investigator confirms. Release valid claims inside the prompt pay window.' },
    { id: 'PI-702', type: 'Units outlier', provider: 'Cedar Valley Infusion (example)', claims: 6, dollars: 41800, score: 0.84, stage: 'Provider outreach', detail: 'Drug units about 2 times the expected dose range on 6 claims. Pattern fits a units field error.', next: 'Call the practice. Correct units and pay. No penalty for a fixed typo.' },
    { id: 'PI-703', type: 'Time impossible', provider: 'Northfield Therapy Group (example)', claims: 22, dollars: 9350, score: 0.77, stage: 'Post-pay review', detail: 'One therapist billed 26 timed hours on 3 single days. Could be a rendering provider mix up.', next: 'Request schedule records. Check rendering NPI on each claim.' },
    { id: 'PI-704', type: 'Unbundling pattern', provider: 'Prairie Family Practice (example)', claims: 31, dollars: 5120, score: 0.68, stage: 'Education first', detail: 'Distinct service modifier used on 41% of visits vs 6% for peers in the same specialty and region.', next: 'Send a coding tip sheet. Re-check in 60 days.' },
    { id: 'PI-705', type: 'Upcoding drift', provider: 'Union General Hospital (example)', claims: 118, dollars: 63300, score: 0.61, stage: 'Watch', detail: 'Share of top level ER visits rose from 22% to 39% in 6 months. Case mix also rose, so this may be real.', next: 'Pull a 30 claim sample for coder review before any action.' }
  ];

  var evalData = {
    goldenSet: 1200,
    prod: { name: 'Model v2.3 (live)', agreement: 0.912, unsafe: 0, falsePay: 0.021, calib: 0.034, override: 0.087, latency: 1.4 },
    cand: { name: 'Model v2.4 (candidate)', agreement: 0.934, unsafe: 0, falsePay: 0.018, calib: 0.029, override: 0.071, latency: 1.1 },
    slices: [
      { slice: 'Commercial', n: 520, prod: 0.118, cand: 0.112 },
      { slice: 'Medicare Advantage', n: 410, prod: 0.124, cand: 0.121 },
      { slice: 'Medicaid', n: 270, prod: 0.131, cand: 0.172 },
      { slice: 'Age 65 plus', n: 430, prod: 0.122, cand: 0.119 },
      { slice: 'Rural ZIP', n: 190, prod: 0.127, cand: 0.134 },
      { slice: 'Spanish language preference', n: 140, prod: 0.129, cand: 0.141 },
      { slice: 'Paper claims', n: 160, prod: 0.141, cand: 0.149 }
    ],
    overallInfoRate: { prod: 0.123, cand: 0.126 },
    sliceGap: 0.03,
    history: [
      { v: 'v2.0', date: 'Jun 2026', agreement: 0.861, override: 0.142, shipped: true },
      { v: 'v2.1', date: 'Jul 2026', agreement: 0.884, override: 0.118, shipped: true },
      { v: 'v2.2', date: 'Aug 2026', agreement: 0.879, override: 0.121, shipped: false, note: 'Blocked: false pay rate went up on DME claims.' },
      { v: 'v2.3', date: 'Sep 2026', agreement: 0.912, override: 0.087, shipped: true },
      { v: 'v2.4', date: 'Oct 2026', agreement: 0.934, override: 0.071, shipped: null }
    ],
    overrideReasons: [
      ['Copilot missed a document in the attachments', 34],
      ['Policy changed and copilot used old version', 21],
      ['Reviewer had member context (call notes)', 18],
      ['Copilot was right, reviewer preferred caution', 15],
      ['Other', 12]
    ]
  };

  var pulse = {
    weeks: ['Sep 7', 'Sep 14', 'Sep 21', 'Sep 28', 'Oct 5', 'Oct 12', 'Oct 19', 'Oct 26'],
    pended: [18400, 17950, 17200, 16100, 15300, 14650, 13900, 13250],
    aht: [14.2, 13.9, 13.1, 12.4, 11.8, 11.2, 10.9, 10.6],
    adoption: [22, 31, 40, 48, 55, 61, 66, 70],
    kpis: [
      { k: 'Pended claims in queue', v: '13,250', d: '-28% in 8 weeks', good: true },
      { k: 'Avg handle time, pilot desks', v: '10.6 min', d: 'was 14.2 min', good: true },
      { k: 'Paid within prompt pay window', v: '97.8%', d: 'goal 99%', good: null },
      { k: 'Reviewer agreement with copilot', v: '91.3%', d: 'override rate 8.7%', good: true },
      { k: 'AI only denials', v: '0', d: 'by design, always 0', good: true },
      { k: 'Decisions overturned on appeal', v: '1.9%', d: 'was 2.6%', good: true }
    ]
  };

  var sources = [
    { id: 'kff', stat: '19%', label: 'of in-network claims were denied by HealthCare.gov plans in 2024', more: '36% of in-network denials were coded "Other", 25% administrative, only 5% lack of medical necessity. Fewer than 1% of denials were appealed.', org: 'KFF', url: 'https://www.kff.org/patient-consumer-protections/claims-denials-and-appeals-in-aca-marketplace-plans-in-2024/', view: 'denials', help: 'Specific, plain reasons on every adverse action. Track "Other" down to near zero.' },
    { id: 'oig', stat: '18%', label: 'of Medicare Advantage payment denials met Medicare and plan billing rules (OIG sample)', more: 'HHS OIG found many of these came from human error or system issues in claims processing. This is the case for AI that catches errors before they reach a provider.', org: 'HHS Office of Inspector General, 2022', url: 'https://oig.hhs.gov/reports/all/2022/some-medicare-advantage-organization-denials-of-prior-authorization-requests-raise-concerns-about-beneficiary-access-to-medically-necessary-care/', view: 'queue', help: 'Copilot finds the matching auth, eligibility fix, or record before a wrong denial goes out.' },
    { id: 'aetna', stat: '20%+', label: 'faster processing for complex, manual review claims with Aetna Claims Assist Manager', more: 'Aetna announced the second generation of its agentic claims advisor in May 2026, part of a $20 billion multi year CVS Health digital investment.', org: 'CVS Health newsroom, May 26, 2026', url: 'https://www.cvshealth.com/news/innovation/aetna-reduces-claims-processing-time-by-more-than-20-percent-with-ai-to-improve-care-experience.html', view: 'pulse', help: 'This concept shows how a squad could keep pushing handle time down while proving quality.' },
    { id: 'cert', stat: '$28.83B', label: 'in Medicare fee for service improper payments, FY 2025 (6.55% rate)', more: 'Durable medical equipment had the highest rate at 24.12%. CMS notes improper payments are not a measure of fraud. Many come from missing documentation.', org: 'CMS CERT program', url: 'https://www.cms.gov/data-research/monitoring-programs/improper-payment-measurement-programs/comprehensive-error-rate-testing-cert', view: 'integrity', help: 'Pre-pay checks on high error areas like DME and units, with education before penalties.' },
    { id: 'partc', stat: '6.09%', label: 'Medicare Advantage (Part C) improper payment rate, FY 2025 ($23.67B)', more: 'Medicaid was 6.12% ($37.39B), and 77.17% of Medicaid improper payments came from insufficient documentation.', org: 'CMS FY 2025 Improper Payments Fact Sheet', url: 'https://www.cms.gov/newsroom/fact-sheets/fiscal-year-2025-improper-payments-fact-sheet', view: 'integrity', help: 'Ask for the right document early, so the claim is right the first time.' },
    { id: 'caqh', stat: '$18.7B', label: 'yearly medical savings left if remaining manual and partly electronic transactions were automated', more: 'Only 24% of medical attachments were fully electronic in the 2025 CAQH Index, down from 32%. Claim status inquiry was 81%.', org: 'CAQH Index 2025', url: 'https://index.caqh.org/hubfs/Index/CAQH_IndexReport_2025_Executive%20Report_v6.pdf', view: 'pulse', help: 'Read attachments for the reviewer and point to the exact page that matters.' },
    { id: 'experian', stat: '41%', label: 'of providers say 10% or more of their claims are denied', more: 'This share has grown every year since the first survey in 2022. 54% say claim errors are rising. Survey of 250 provider finance and billing leaders.', org: 'Experian Health, State of Claims 2025', url: 'https://www.businesswire.com/news/home/20250922969006/en/Experian-Healths-3rd-Annual-State-of-Claims-Survey-Finds-Denials-Still-on-the-Rise-Amid-Escalating-Challenges', view: 'denials', help: 'Predict which decisions are likely to be appealed and overturned, and give them a second look first.' },
    { id: 'cms57', stat: '72 hrs / 7 days', label: 'prior auth decision limits for impacted payers under CMS-0057-F, from 2026', more: 'Payers must give a specific reason for prior auth denials and post metrics publicly. Prior Authorization API due January 1, 2027.', org: 'CMS fact sheet, CMS-0057-F', url: 'https://www.cms.gov/newsroom/fact-sheets/cms-interoperability-prior-authorization-final-rule-cms-0057-f', view: 'denials', help: 'Clocks and reason quality checks built into the reviewer flow.' },
    { id: 'nyprompt', stat: '30 / 45 days', label: 'New York prompt pay limits for undisputed electronic and paper claims', more: 'If liability is unclear, the plan must pay any undisputed part and explain or ask for info within 30 days. Late payment can add interest.', org: 'NY Insurance Law 3224-a; NY DFS opinion', url: 'https://www.nysenate.gov/legislation/laws/ISC/3224-A', view: 'queue', help: 'Every pended claim shows its prompt pay clock, so the oldest risky claims rise to the top.' },
    { id: 'sb1120', stat: 'Human decides', label: 'California SB 1120: AI may not deny, delay, or modify care for medical necessity', more: 'A licensed clinician must decide. Lawsuits over algorithm based denials (for example Kisting-Leung v. Cigna, Estate of Lokken v. UnitedHealth) are ongoing and the claims are not proven. Trust is the product.', org: 'California Legislature; Georgetown Health Care Litigation Tracker', url: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB1120', url2: 'https://litigationtracker.law.georgetown.edu/litigation/kisting-leung-et-al-v-cigna-corporation-et-al/', view: 'claim', help: 'No AI only denials. Clinician route for any medical judgment. Every decision has a human name on it.' },
    { id: 'bias', stat: '17.7% to 46.5%', label: 'share of Black patients flagged for extra care if a biased cost label were fixed (study example)', more: 'A widely used health algorithm used cost as a stand in for need and under-served Black patients. Slices matter.', org: 'Obermeyer et al., Science, 2019', url: 'https://www.science.org/doi/10.1126/science.aax2342', view: 'eval', help: 'Fairness slices are a ship gate, not a report. A model that drifts on Medicaid does not ship.' },
    { id: 'nhcaa', stat: 'About 3%', label: 'of US health spending lost to fraud, a conservative industry estimate', more: 'NHCAA says some government and law enforcement estimates run as high as 10%. This is an estimate, not a measured rate.', org: 'National Health Care Anti-Fraud Association', url: 'https://www.nhcaa.org/tools-insights/about-health-care-fraud/the-challenge-of-health-care-fraud/', view: 'integrity', help: 'Flags are leads. Investigators decide, and good providers get paid on time.' }
  ];

  window.CRC = { TODAY: TODAY, REC: REC, claims: claims, denialMix: denialMix, anomalies: anomalies, evalData: evalData, pulse: pulse, sources: sources };
})();
