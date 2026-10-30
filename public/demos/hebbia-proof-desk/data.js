/* Proof Desk. Concept prototype by Amitesh Dwivedi. All companies, firms, and numbers in the app views are example data. */
window.PD = (function () {
  var COLS = [
    { k: 'fac', label: 'Facility', q: 'What is the size and type of the term loan and revolver?' },
    { k: 'mat', label: 'Maturity', q: 'When does the term loan mature?' },
    { k: 'lev', label: 'Max net leverage', q: 'What is the current maximum net leverage covenant, after all amendments?' },
    { k: 'addb', label: 'EBITDA add back cap', q: 'Is there a cap on cost savings and synergy add backs?' },
    { k: 'incr', label: 'Incremental free and clear', q: 'What is the free and clear incremental debt capacity?' },
    { k: 'jcrew', label: 'J.Crew blocker', q: 'Does the agreement block transfers of material IP to unrestricted subsidiaries?' },
    { k: 'chg', label: 'Change vs last review', q: 'What changed since the Q3 review? Compare to the prior Matrix.' },
    { k: 'risk', label: 'Flag for IC', q: 'Based on the columns above, rate the credit for an IC second look.' }
  ];
  // name, sector, fac, mat, lev, addb, incr, jcrew, chg, risk
  var R = [
    ['Harbor Lane Foods', 'Packaged food', '$385M TLB, $50M RCF', 'Mar 2030', '6.00x through Q2 2027', '20% of EBITDA', 'Greater of $60M and 75% EBITDA', 'Yes', 'Amendment No. 3 loosened leverage by 0.50x', 'High'],
    ['Pinecrest Dental Partners', 'Dental services', '$290M TLB, $40M RCF', 'Nov 2029', '6.75x', 'Capped at 25%', 'Greater of $45M and 100% EBITDA', 'Yes', 'No change', 'Medium'],
    ['Ridgeview Software Holdings', 'Vertical software', '$640M TLB, $75M RCF', 'Jun 2031', '7.50x', '30% of EBITDA', 'Greater of $120M and 100% EBITDA', 'Yes', 'No change', 'Low'],
    ['Copperline Industrial Services', 'Industrial services', '$210M TLB, $30M RCF', 'Aug 2029', '5.75x', '20% of EBITDA', 'Greater of $35M and 60% EBITDA', 'Not found', 'No change', 'Medium'],
    ['Bluewater Logistics Group', 'Freight brokerage', '$455M TLB, $60M RCF', 'Feb 2030', '6.25x', '25% of EBITDA', 'Greater of $70M and 80% EBITDA', 'Yes', 'Q3 EBITDA down 11% vs plan', 'High'],
    ['Summit Vet Holdings', 'Veterinary clinics', '$330M TLB, $45M RCF', 'Oct 2030', '6.50x', '25% of EBITDA', 'Greater of $50M and 100% EBITDA', 'Yes', 'No change', 'Low'],
    ['Northgate Insurance Brokers', 'Insurance brokerage', '$720M TLB, $90M RCF', 'Jan 2031', '7.25x', '35% of EBITDA', 'Greater of $140M and 100% EBITDA', 'No', 'Delayed draw term loan added', 'Medium'],
    ['Clearpath Behavioral Health', 'Behavioral health', '$260M TLB, $35M RCF', 'May 2029', '5.50x', '15% of EBITDA', 'Greater of $30M and 50% EBITDA', 'Yes', 'No change', 'Low'],
    ['Atlas Fire and Safety', 'Fire protection', '$415M TLB, $55M RCF', 'Dec 2030', '6.25x', '25% of EBITDA', 'Greater of $65M and 85% EBITDA', 'Yes', 'No change', 'Low'],
    ['Meridian Lab Services', 'Testing labs', '$185M TLB, $25M RCF', 'Jul 2029', '5.25x', '20% of EBITDA', 'Greater of $25M and 50% EBITDA', 'Yes', 'No change', 'Low'],
    ['Oakmont Specialty Chemicals', 'Specialty chemicals', '$510M TLB, $70M RCF', 'Sep 2030', '5.75x', '20% of EBITDA', 'Greater of $80M and 75% EBITDA', 'Yes', 'Amendment No. 1 added 2 equity cure rights', 'Medium'],
    ['Juniper Home Services', 'HVAC and plumbing', '$345M TLB, $50M RCF', 'Apr 2030', '6.50x', 'Uncapped', 'Greater of $55M and 100% EBITDA', 'No', 'No change', 'Medium'],
    ['Tidewater Marine Parts', 'Marine aftermarket', '$150M TLB, $20M RCF', 'Mar 2029', '5.00x', '15% of EBITDA', 'Greater of $20M and 50% EBITDA', 'Yes', 'No change', 'Low'],
    ['Granite Peak Education', 'K-12 services', '$275M TLB, $35M RCF', 'Jun 2030', '6.00x', '25% of EBITDA', 'Greater of $40M and 75% EBITDA', 'Yes', 'No change', 'Low'],
    ['Larkspur Data Centers', 'Data infrastructure', '$880M TLB, $100M RCF', 'Feb 2031', '7.00x', '30% of EBITDA', 'Greater of $150M and 100% EBITDA', 'Yes', 'No change', 'Low'],
    ['Silverline Payments', 'Payments software', '$395M TLB, $45M RCF', 'Nov 2030', '6.75x', '25% of EBITDA', 'Greater of $60M and 100% EBITDA', 'Yes', 'No change', 'Medium']
  ];
  var PAGE = { fac: 1, mat: 46, lev: 118, addb: 22, incr: 71, jcrew: 104, chg: 0, risk: 0 };
  var SEC = { fac: 'Section 2.01 Commitments', mat: 'Definition of "Term Loan Maturity Date"', lev: 'Section 7.11 Financial Covenant', addb: 'Definition of "Consolidated EBITDA", clause (a)(viii)', incr: 'Section 2.14 Incremental Facilities', jcrew: 'Section 7.02(n) Investments', chg: 'Prior Matrix: Q3 Covenant Review', risk: 'Derived from columns in this row' };
  function quoteFor(k, v) {
    if (k === 'fac') return 'The Term Lenders severally agree to make Term Loans in an aggregate principal amount of ' + v.split(' TLB')[0] + ' and the Revolving Lenders agree to make Revolving Loans up to the Revolving Commitments...';
    if (k === 'mat') return '"Term Loan Maturity Date" means the date that is seven years after the Closing Date, which is ' + v + '.';
    if (k === 'lev') return 'The Borrower shall not permit the Consolidated Net Leverage Ratio as of the last day of any Test Period to exceed ' + v.split(' ')[0] + ' to 1.00.';
    if (k === 'addb') return v === 'Uncapped' ? '...cost savings, operating expense reductions and synergies projected by the Borrower in good faith to result from actions taken...' : '...provided that the aggregate amount added back pursuant to this clause (viii) shall not exceed ' + v.replace(' of EBITDA', '') + ' of Consolidated EBITDA for such period...';
    if (k === 'incr') return 'The Borrower may request Incremental Facilities in an aggregate amount not to exceed the ' + v.toLowerCase() + ' for the most recently ended Test Period...';
    if (k === 'jcrew') return v === 'Yes' ? 'No Loan Party shall transfer, or permit to be transferred, ownership of any Material Intellectual Property to any Unrestricted Subsidiary.' : v === 'No' ? 'Section 7.02(n) permits Investments in Unrestricted Subsidiaries up to the Available Amount. No IP transfer limit found.' : '';
    if (k === 'chg') return v === 'No change' ? 'Values match the Q3 Covenant Review Matrix for this row.' : v + '.';
    if (k === 'risk') return 'Rule: High if leverage room under 0.5x or covenant loosened this quarter. Medium if add backs uncapped, no J.Crew blocker, or a term changed.';
    return '';
  }
  var rows = R.map(function (r, i) {
    var id = 'D' + String(i + 1).padStart(2, '0');
    var cells = {};
    COLS.forEach(function (c, j) {
      var v = r[2 + j];
      var conf = 0.9 + ((i * 7 + j * 3) % 9) / 100;
      cells[c.k] = { v: v, conf: conf, status: 'ok', src: { doc: c.k === 'chg' ? 'Q3 Covenant Review (Matrix)' : 'Credit Agreement', page: PAGE[c.k] ? PAGE[c.k] + (i % 5) : null, sec: SEC[c.k], quote: quoteFor(c.k, v) } };
    });
    return { id: id, name: r[0], sector: r[1], docs: 3 + (i % 3), pages: 240 + (i * 37) % 210, cells: cells };
  });
  // hand made edge cases for the demo path
  rows[0].cells.lev = { v: '5.50x', conf: 0.72, status: 'conflict', src: { doc: 'Credit Agreement', page: 112, sec: 'Section 7.11 Financial Covenant', quote: 'The Borrower shall not permit the Consolidated Net Leverage Ratio as of the last day of any Test Period to exceed <mark>5.50</mark> to 1.00.' }, alt: { v: '6.00x through Q2 2027', doc: 'Amendment No. 3 (Sep 18, 2026)', page: 4, sec: 'Section 2(c) Amendments to Section 7.11', quote: 'Section 7.11 is amended by replacing "5.50 to 1.00" with "<mark>6.00 to 1.00</mark> for each Test Period ending on or before June 30, 2027".' }, note: 'Two documents disagree. The amendment is newer and should win.' };
  rows[1].cells.addb = { v: 'Uncapped', conf: 0.61, status: 'low', src: { doc: 'Credit Agreement (scanned PDF)', page: 88, sec: 'Definition of "Consolidated EBITDA", clause (a)(viii)', quote: '...cost savings, operating expense reductions and synergies ... <mark>[text unclear in scan]</mark> ... shall not exceed 2S% of Consolidated EBITDA...' }, alt: { v: 'Capped at 25%', doc: 'Conformed copy (Exhibit A to Amendment No. 1)', page: 22, sec: 'Definition of "Consolidated EBITDA", clause (a)(viii)', quote: '...provided that the aggregate amount added back pursuant to this clause (viii) shall not exceed <mark>25%</mark> of Consolidated EBITDA for such period (calculated before giving effect to such add backs).' }, note: 'OCR read "2S%" on a scanned page. A clean conformed copy exists.' };
  rows[3].cells.jcrew = { v: 'Not found', conf: 0.94, status: 'missing', src: { doc: '3 documents searched', page: null, sec: 'Section 7.02 Investments, Section 7.05 Dispositions', quote: 'No language limiting transfers of Material Intellectual Property to Unrestricted Subsidiaries was found. Matrix did not guess.' }, note: 'Correct "not found" is a good answer. Ask the deal team.' };

  var memo = {
    title: 'Q4 Covenant Review: Direct Lending Fund III',
    to: 'Investment Committee', from: 'Credit team (draft by Matrix, reviewer: you)', date: 'Oct 29, 2026',
    paras: [
      ['h', 'Summary'],
      ['p', 'We reviewed {c1}. Two credits need a second look this quarter: Harbor Lane Foods and Bluewater Logistics Group.'],
      ['h', 'Credits to watch'],
      ['p', 'Harbor Lane Foods: {c2}. Leverage was 5.31x at Q3, so room under the covenant is thin. {c10}.'],
      ['p', 'Bluewater Logistics Group: {c3}. Covenant is 6.25x and leverage was 5.92x at Q3.'],
      ['p', 'Pinecrest Dental Partners: {c4}. This matters because add backs can inflate reported EBITDA.'],
      ['h', 'Documents and protections'],
      ['p', '{c5}. For Copperline Industrial Services, {c9}. {c6}.'],
      ['p', '{c7}. Ridgeview Software Holdings has the widest room to add debt: {c8}.'],
      ['h', 'Next steps'],
      ['p', 'Ask the Harbor Lane deal team for the Q4 compliance certificate early. Ask Copperline counsel to confirm IP protections.']
    ],
    claims: {
      c1: { text: '16 credit agreements and 3 amendments across the Fund III book', status: 'ok', row: null, col: 'chg', why: 'Counted from the 16 rows and the documents attached to each.' },
      c2: { text: 'max net leverage covenant is 5.50x', status: 'conflict', row: 'D01', col: 'lev', fix: 'max net leverage covenant is 6.00x through Q2 2027 (Amendment No. 3 raised it from 5.50x)', reason: 'Stale source (amendment missed)' },
      c3: { text: 'Q3 EBITDA came in 11% below plan', status: 'ok', row: 'D05', col: 'chg' },
      c4: { text: 'cost savings add backs are uncapped', status: 'low', row: 'D02', col: 'addb', fix: 'cost savings add backs are capped at 25% of EBITDA', reason: 'Wrong number (OCR)' },
      c5: { text: '13 of 16 credits block IP transfers to unrestricted subsidiaries (a J.Crew blocker)', status: 'ok', row: null, col: 'jcrew', why: '13 Yes, 2 No (Northgate, Juniper), 1 Not found (Copperline).' },
      c6: { text: 'Sector peers average about 5.0x max leverage', status: 'unsupported', row: null, col: null, fix: 'Analyst view, not sourced: sector peers may run tighter covenants. To confirm with market data.', reason: 'Unsupported claim' },
      c7: { text: 'Oakmont Specialty Chemicals added 2 equity cure rights in Amendment No. 1', status: 'ok', row: 'D11', col: 'chg' },
      c8: { text: 'the greater of $120M and 100% of EBITDA', status: 'ok', row: 'D03', col: 'incr' },
      c9: { text: 'no IP transfer blocker was found in the 3 documents provided', status: 'ok', row: 'D04', col: 'jcrew' },
      c10: { text: 'Amendment No. 3 was signed Sep 18, 2026', status: 'ok', row: 'D01', col: 'chg' }
    }
  };

  var EDIT_REASONS = ['Wrong number', 'Stale source (amendment missed)', 'Wrong number (OCR)', 'Wrong source page', 'Unsupported claim', 'Missing context', 'Tone or house style'];

  var weeks = ['Aug 10', 'Aug 17', 'Aug 24', 'Aug 31', 'Sep 7', 'Sep 14', 'Sep 21', 'Sep 28', 'Oct 5', 'Oct 12', 'Oct 19', 'Oct 26'];
  var pulse = {
    weeks: weeks,
    approved: [42, 51, 58, 96, 131, 160, 188, 214, 246, 279, 301, 338],
    noEdit: [38, 39, 41, 40, 44, 47, 49, 52, 55, 57, 60, 62],
    signoff: [74, 71, 69, 66, 58, 51, 47, 44, 40, 37, 35, 33],
    wau: [180, 186, 192, 240, 285, 318, 344, 371, 402, 431, 455, 482],
    kpis: [
      { k: 'Verified deliverables per active analyst, week', v: '0.70', d: 'Up from 0.23 in Aug', good: true },
      { k: 'Sent with an unsupported number', v: '0', d: 'Guardrail. Must stay 0.', good: true },
      { k: 'Approved with no edits', v: '62%', d: 'Up 24 pts since launch', good: true },
      { k: 'Median time to sign off', v: '33 min', d: 'Was 74 min in Aug', good: true },
      { k: 'Citation precision', v: '98.4%', d: 'Cite supports the claim', good: true },
      { k: 'Cost per deliverable', v: '$1.84', d: 'Up 9% with deeper checks', good: false }
    ],
    editReasons: [['Stale source (amendment missed)', 29], ['Tone or house style', 24], ['Wrong number (OCR)', 14], ['Missing context', 13], ['Unsupported claim', 11], ['Wrong source page', 9]]
  };

  var evals = {
    suites: [
      { name: 'Covenant extraction', n: 240, owner: 'Private credit' },
      { name: 'Public comps table', n: 180, owner: 'Banking coverage' },
      { name: 'CIM screen to one pager', n: 120, owner: 'Private equity' },
      { name: 'Earnings call deltas', n: 150, owner: 'Public equities' }
    ],
    live: { name: 'Checker v1.6 (live)', exact: 0.931, cite: 0.981, support: 0.962, abstain: 0.88, p50: 41, cost: 1.69 },
    cand: { name: 'Checker v1.7 (candidate)', exact: 0.947, cite: 0.986, support: 0.978, abstain: 0.91, p50: 44, cost: 1.84 },
    fixed: { name: 'Checker v1.7.1 (candidate)', exact: 0.951, cite: 0.987, support: 0.981, abstain: 0.91, p50: 45, cost: 1.86 },
    slices: [
      { s: 'Amended agreements', n: 64, live: 0.902, cand: 0.861, fixed: 0.934 },
      { s: 'Scanned PDFs', n: 48, live: 0.874, cand: 0.889, fixed: 0.893 },
      { s: 'Non USD filings', n: 40, live: 0.918, cand: 0.931, fixed: 0.932 },
      { s: 'Docs over 300 pages', n: 72, live: 0.915, cand: 0.926, fixed: 0.929 },
      { s: 'Earnings transcripts', n: 150, live: 0.947, cand: 0.958, fixed: 0.958 }
    ],
    history: [
      { v: 'v1.4', d: 'Aug 12', exact: 0.902, res: 'Shipped' },
      { v: 'v1.5', d: 'Sep 2', exact: 0.917, res: 'Shipped' },
      { v: 'v1.6a', d: 'Sep 23', exact: 0.928, res: 'Blocked' },
      { v: 'v1.6', d: 'Oct 1', exact: 0.931, res: 'Shipped' }
    ]
  };

  var accounts = [
    { a: 'Private credit firm A', seg: 'Private credit', seats: 85, wau: 0.81, del: 61, noEdit: 0.66, health: 'Strong', note: 'Uses covenant review every quarter end' },
    { a: 'Multi strategy fund B', seg: 'Hedge fund', seats: 140, wau: 0.64, del: 74, noEdit: 0.58, health: 'Strong', note: 'Wants house style decks' },
    { a: 'Coverage bank C', seg: 'Investment bank', seats: 220, wau: 0.38, del: 52, noEdit: 0.49, health: 'At risk', note: 'Comps numbers edited often' },
    { a: 'Asset manager D', seg: 'Long only', seats: 60, wau: 0.72, del: 33, noEdit: 0.69, health: 'Strong', note: 'Earnings deltas to PMs by 8am' },
    { a: 'Growth equity E', seg: 'Private equity', seats: 35, wau: 0.46, del: 14, noEdit: 0.55, health: 'Watch', note: 'CIM screens need sector terms' },
    { a: 'Law firm F', seg: 'Legal', seats: 120, wau: 0.52, del: 41, noEdit: 0.63, health: 'Watch', note: 'Needs SharePoint folder sync' },
    { a: 'Private credit firm G', seg: 'Private credit', seats: 40, wau: 0.85, del: 37, noEdit: 0.71, health: 'Strong', note: 'Asked for amendment timeline view' },
    { a: 'Pension H', seg: 'Allocator', seats: 25, wau: 0.31, del: 6, noEdit: 0.5, health: 'At risk', note: 'Champion left in Sep' }
  ];
  var themes = [
    ['Show me which amendment changed a number', 31],
    ['SharePoint and Drive folders should sync, not upload', 22],
    ['Numbers in the deck drift from the grid after edits', 18],
    ['Memos should match our house style', 15],
    ['Slow on agreements over 400 pages', 12]
  ];

  var sources = [
    { stat: '81%', label: 'GPT-4 Turbo with a shared retrieval setup got wrong or refused 81% of basic questions on public filings.', more: 'FinanceBench (Patronus AI, 2023). Given the right pages, the same model got 85% right. Finding the right evidence is the hard part.', org: 'FinanceBench, arXiv 2311.11944', url: 'https://arxiv.org/abs/2311.11944', view: 'matrix', help: 'Every cell shows the page and quote it came from, and conflicts between documents are flagged instead of hidden.' },
    { stat: '67.85%', label: 'Best score on Vals AI Finance Agent v2.1 as of Oct 29, 2026.', more: 'The benchmark tests entry level analyst tasks on public company filings. Even the top model misses about 1 in 3.', org: 'Vals AI Finance Agent leaderboard', url: 'https://www.vals.ai/benchmarks/fabv2-1', view: 'evals', help: 'Customer tasks become eval suites with acceptance criteria. A release ships only if it passes every slice.' },
    { stat: 'Verify', label: 'Reviewers say outputs still need to be checked against source files.', more: 'A tool directory review lists "Output Reliability: Answers still need manual verification" as a top con. Reddit users in r/private_equity complained about wrong numbers when pulling comps (opinions, not measured).', org: 'AI Tools Directory review', url: 'https://aitoolsdirectory.com/tool/hebbia', url2: 'https://www.reddit.com/r/private_equity/comments/1e16mn4/is_hebbia_any_good/', url2label: 'Reddit thread', view: 'memo', help: 'Proof Desk makes checking fast: only flagged claims need a human, and each one opens to the exact quote.' },
    { stat: 'Grid to memo', label: 'Users had to pick the columns, then export answers into a memo, deck, or email by hand.', more: 'Business Insider (Aug 26, 2026) on Matrix 2.0. Rivals now ship grids too: Rogo, Harvey Vault, and Legora Tabular Review.', org: 'Business Insider', url: 'https://www.businessinsider.com/hebbia-update-matrix-ai-software-wall-street-2026-8', view: 'memo', help: 'Every number in the memo stays linked to its cell. If a cell changes, the memo claim changes or gets flagged.' },
    { stat: 'Sign off', label: 'Matrix 2.0 puts a checkpoint before each next step, and lets you see where every number came from.', more: 'Hebbia launch post (Aug 26, 2026). Matrix now drafts memos, decks, models, and emails. This prototype imagines what that checkpoint could look like at scale.', org: 'Hebbia blog: Introducing Matrix 2.0', url: 'https://www.hebbia.com/blog/introducing-matrix-2-0', view: 'memo', help: 'The approve button stays locked until every flagged claim is fixed, removed, or marked as opinion.' },
    { stat: '40%', label: 'Junior bankers spend up to 40% of their week on manual tasks.', more: 'FactSet research (Dec 2025). 60% of senior bankers say juniors spend a lot of time on data gathering. Better tools could free up to 10 hours a week.', org: 'FactSet Insight', url: 'https://insight.factset.com/research-backed-tech-insights-to-unlock-junior-banker-productivity', view: 'pulse', help: 'Pulse tracks time to sign off and verified deliverables per analyst, not just usage.' },
    { stat: 'SharePoint', label: 'Users asked for better links to where their files live.', more: 'G2 review quoted by Airframe: "we are unable to connect Hebbia to SharePoint and therefore we have to upload folders individually." Others found it hard to stay organized across many projects.', org: 'Airframe analysis of public reviews', url: 'https://www.airframe.ai/product/hebbia/analysis', view: 'adoption', help: 'Feedback themes from customer teams are tagged and counted, so integration asks compete fairly with model work.' },
    { stat: '6x', label: 'OHA reports 6x ROI and review times cut by up to 75%.', more: 'Hebbia customer story (vendor source). OHA tied licenses to steady use and measured ROI as it added use cases.', org: 'Hebbia customer story: OHA', url: 'https://www.hebbia.com/customers/oha', view: 'adoption', help: 'Launch and adoption view tracks seats used, deliverables, and no edit rates per account, so value is proven, not assumed.' },
    { stat: '5x', label: 'Daily active users grew 5x in Q3 2026, and gross revenue retention was over 95%.', more: 'Hebbia company post on LinkedIn about Q3 2026, alongside the Max, Matrix 2.0, and API and MCP launches.', org: 'Hebbia on LinkedIn', url: 'https://www.linkedin.com/posts/hebbia_our-strongest-quarter-yet-alongside-the-activity-7518700487274061825-OwRv', view: 'plan', help: 'More users means more deliverables sent outside the firm. Trust has to scale with usage.' }
  ];

  return { TODAY: '2026-10-29', COLS: COLS, rows: rows, memo: memo, EDIT_REASONS: EDIT_REASONS, pulse: pulse, evals: evals, accounts: accounts, themes: themes, sources: sources };
})();
