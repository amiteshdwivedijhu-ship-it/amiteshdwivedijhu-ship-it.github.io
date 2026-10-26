/* Sample data only. Not real Notion data. Not affiliated with Notion Labs, Inc. */
(function () {
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var r = rng(20261026);

  var CHANNELS = [
    { id: 'meta', name: 'Meta', short: 'Meta' },
    { id: 'linkedin', name: 'LinkedIn', short: 'LinkedIn' },
    { id: 'google', name: 'Google Search', short: 'Google' },
    { id: 'chatgpt', name: 'ChatGPT ads', short: 'ChatGPT' }
  ];
  var GEOS = [
    { id: 'US', name: 'United States', region: 'AMER' }, { id: 'CA', name: 'Canada', region: 'AMER' },
    { id: 'BR', name: 'Brazil', region: 'AMER' }, { id: 'UK', name: 'United Kingdom', region: 'EMEA' },
    { id: 'DE', name: 'Germany', region: 'EMEA' }, { id: 'FR', name: 'France', region: 'EMEA' },
    { id: 'IN', name: 'India', region: 'APAC' }, { id: 'JP', name: 'Japan', region: 'APAC' },
    { id: 'KR', name: 'South Korea', region: 'APAC' }, { id: 'AU', name: 'Australia', region: 'APAC' }
  ];
  var PERSONAS = ['Startup founder', 'Eng team lead', 'Marketing team', 'Ops and PM', 'Student'];

  // base weekly spend per channel (sample, USD) and geo weights
  var chBase = { meta: 150000, linkedin: 120000, google: 125000, chatgpt: 25000 };
  var geoW = { US: 0.36, CA: 0.06, BR: 0.05, UK: 0.11, DE: 0.08, FR: 0.06, IN: 0.07, JP: 0.09, KR: 0.05, AU: 0.07 };
  var chCps = { meta: 9.5, linkedin: 31, google: 14, chatgpt: 12 }; // cost per signup
  var chAct = { meta: 0.27, linkedin: 0.41, google: 0.36, chatgpt: 0.44 }; // activation rate D7
  var chW4 = { meta: 0.52, linkedin: 0.63, google: 0.6, chatgpt: 0.66 }; // W4 retention of activated
  var cells = [];
  CHANNELS.forEach(function (c) {
    GEOS.forEach(function (g) {
      var spend = Math.round(chBase[c.id] * geoW[g.id] * (0.85 + r() * 0.3));
      var cps = chCps[c.id] * (0.8 + r() * 0.4) * ({ IN: 0.45, BR: 0.6, JP: 1.2, KR: 1.05 }[g.id] || 1);
      var act = chAct[c.id] * (0.88 + r() * 0.24);
      var w4 = chW4[c.id] * (0.9 + r() * 0.2);
      var flag = null;
      if (c.id === 'meta' && g.id === 'JP') { act *= 0.55; flag = 'Low activation: signups skip setup'; }
      if (c.id === 'linkedin' && (g.id === 'UK' || g.id === 'DE' || g.id === 'FR')) { cps *= 1.28; flag = 'After-hours spend with no signups'; }
      if (c.id === 'meta' && g.id === 'IN') { w4 *= 0.7; flag = 'Cheap signups, weak W4 retention'; }
      if (c.id === 'chatgpt' && g.id === 'US') { act *= 1.12; flag = 'High intent, small budget'; }
      var signups = Math.round(spend / cps);
      var activated = Math.round(signups * act);
      var retained = Math.round(activated * w4);
      var paid = Math.round(retained * (0.07 + r() * 0.05) * (c.id === 'linkedin' ? 1.6 : 1));
      cells.push({ ch: c.id, geo: g.id, spend: spend, signups: signups, activated: activated, retained: retained, paid: paid, flag: flag });
    });
  });

  // persona cohort quality (activation, W4) by channel
  var personaRows = PERSONAS.map(function (p, i) {
    var row = { persona: p };
    CHANNELS.forEach(function (c) {
      var a = chAct[c.id] * [1.05, 1.18, 0.98, 1.08, 0.72][i] * (0.92 + r() * 0.16);
      var w = chW4[c.id] * [1.0, 1.08, 0.97, 1.04, 0.74][i] * (0.92 + r() * 0.16);
      row[c.id] = { act: a, w4: w };
    });
    return row;
  });

  // hourly spend vs signups, LinkedIn EMEA, local time (sample week average)
  var hourly = [];
  for (var h = 0; h < 24; h++) {
    var work = h >= 8 && h <= 18;
    var spend = work ? 1500 + r() * 500 : 700 + r() * 300;
    var sign = work ? Math.round(45 + r() * 22) : (h >= 19 && h <= 21 ? Math.round(6 + r() * 5) : Math.round(r() * 2));
    hourly.push({ h: h, spend: Math.round(spend), signups: sign });
  }

  var experiments = [
    { id: 'E-101', title: 'LinkedIn EMEA: run ads only in local work hours', ch: 'linkedin', geo: 'UK, DE, FR', persona: 'Eng team lead', owner: 'Daypart agent', stage: 'read', day: 14, days: 14, budget: 4200,
      hypothesis: 'If LinkedIn EMEA ads run only 08:00 to 19:00 local time, cost per activated workspace drops at least 10% with no loss in W4 retention, because after-hours spend brings almost no signups.',
      baseline: { rate: 0.41, traffic: 1400 }, mde: 0.1,
      qa: [['Audience overlap with other live tests under 10%', true, '3% overlap'], ['Holdout cell set and clean', true, '20% of ad sets held back'], ['Signup and activation events firing', true, 'Events match warehouse within 2%'], ['Budget cap set', true, '$4,200 per day'], ['Creative passes quality bar', true, '6 of 6 variants pass']],
      result: { cpa: [-14, -22, -6], cps: [-11, -18, -4], act: [2, -3, 7], w4: [1, -3, 5], segs: [['UK', -17, -27, -7], ['DE', -12, -24, 0], ['FR', -11, -25, 3]] },
      agentRec: 'scale', agentWhy: 'Cost per activated workspace down 14% (90% CI -22% to -6%). Retention flat.' },
    { id: 'E-102', title: 'Meta: 3% lookalike of paid users vs 1% lookalike', ch: 'meta', geo: 'US, CA, AU', persona: 'Startup founder', owner: 'Hypothesis agent', stage: 'read', day: 14, days: 14, budget: 6800,
      hypothesis: 'A wider 3% lookalike of paid workspaces finds more founders at a lower cost per signup without hurting downstream quality.',
      baseline: { rate: 0.27, traffic: 5200 }, mde: 0.08,
      qa: [['Audience overlap with other live tests under 10%', true, '6% overlap'], ['Holdout cell set and clean', true, '1% lookalike is control'], ['Signup and activation events firing', true, 'OK'], ['Budget cap set', true, '$6,800 per day'], ['Creative passes quality bar', true, 'Same creative in both arms']],
      result: { cpa: [6, -2, 14], cps: [-21, -27, -15], act: [-18, -24, -12], w4: [-9, -14, -4], segs: [['US', 4, -6, 14], ['CA', 9, -5, 23], ['AU', 8, -6, 22]] },
      agentRec: 'scale', agentWhy: 'Cost per signup down 21%. Recommends moving 30% of founder budget to the 3% lookalike.' },
    { id: 'E-103', title: 'Google Search: "AI meeting notes" intent keywords', ch: 'google', geo: 'US, UK', persona: 'Ops and PM', owner: 'Ami (sample PM)', stage: 'live', day: 11, days: 14, budget: 3100,
      hypothesis: 'People searching for AI meeting notes tools activate faster when they land on a meeting notes template, so cost per activated workspace drops 10%.',
      baseline: { rate: 0.36, traffic: 2100 }, mde: 0.1,
      qa: [['Audience overlap with other live tests under 10%', true, 'Keyword sets do not overlap'], ['Holdout cell set and clean', true, 'Geo split by DMA'], ['Signup and activation events firing', true, 'OK'], ['Budget cap set', true, '$3,100 per day'], ['Creative passes quality bar', true, '4 of 4 pass']],
      result: { cpa: [-9, -19, 2], cps: [-6, -14, 3], act: [5, -2, 12], w4: [2, -4, 8], segs: [] }, agentRec: 'extend', agentWhy: 'Not enough data yet. 3 days left.' },
    { id: 'E-104', title: 'ChatGPT ads: student template creative in APAC', ch: 'chatgpt', geo: 'IN, JP, KR, AU', persona: 'Student', owner: 'Hypothesis agent', stage: 'live', day: 6, days: 14, budget: 1200,
      hypothesis: 'Students asking ChatGPT for study planners convert well on a ready-made template page.',
      baseline: { rate: 0.44, traffic: 600 }, mde: 0.15,
      qa: [['Audience overlap with other live tests under 10%', true, 'New channel'], ['Holdout cell set and clean', true, 'Prompt topics split'], ['Signup and activation events firing', true, 'OK'], ['Budget cap set', true, '$1,200 per day'], ['Creative passes quality bar', true, '3 of 3 pass']],
      result: { cpa: [-4, -30, 22], cps: [-8, -25, 9], act: [3, -9, 15], w4: [0, -12, 12], segs: [] }, agentRec: 'extend', agentWhy: 'Day 6 of 14.' },
    { id: 'E-105', title: 'Meta: founder UGC video vs product demo video', ch: 'meta', geo: 'US, CA, JP', persona: 'Startup founder', owner: 'Creative agent', stage: 'read', day: 14, days: 14, budget: 5400,
      hypothesis: 'Short founder-told videos beat screen-recorded product demos on cost per activated workspace.',
      baseline: { rate: 0.27, traffic: 4100 }, mde: 0.08,
      qa: [['Audience overlap with other live tests under 10%', true, '4% overlap'], ['Holdout cell set and clean', true, 'Demo video is control'], ['Signup and activation events firing', true, 'OK'], ['Budget cap set', true, '$5,400 per day'], ['Creative passes quality bar', true, 'All variants pass']],
      result: { cpa: [-7, -13, -1], cps: [-9, -15, -3], act: [2, -3, 7], w4: [0, -4, 4], segs: [['US', -15, -22, -8], ['CA', -12, -24, 0], ['JP', 19, 6, 32]] },
      agentRec: 'scale', agentWhy: 'Overall cost per activated workspace down 7%.' },
    { id: 'E-106', title: 'Ad persona to template preselect on signup', ch: 'meta', geo: 'All', persona: 'All', owner: 'Growth PM (sample)', stage: 'decided', day: 14, days: 14, budget: 0,
      hypothesis: 'Passing the ad persona into onboarding and preselecting a matching template lifts D7 activation.',
      baseline: { rate: 0.32, traffic: 9000 }, mde: 0.05,
      qa: [['Audience overlap with other live tests under 10%', true, 'Onboarding test, all paid traffic'], ['Holdout cell set and clean', true, '50/50'], ['Signup and activation events firing', true, 'OK'], ['Budget cap set', true, 'No media spend'], ['Creative passes quality bar', true, 'N/A']],
      result: { cpa: [-10, -14, -6], cps: [0, -2, 2], act: [11, 7, 15], w4: [3, 0, 6], segs: [] }, agentRec: 'scale', agentWhy: 'Activation up 11%.',
      decision: { type: 'scale', reason: 'Clear win on activation with retention flat. Growth PM owns rollout.', by: 'Growth PM (sample)', at: 'Oct 19, 2026' } },
    { id: 'E-107', title: 'LinkedIn: Custom Agents message for eng managers', ch: 'linkedin', geo: 'UK, DE', persona: 'Eng team lead', owner: 'Hypothesis agent', stage: 'qa', day: 0, days: 14, budget: 2600,
      hypothesis: 'Eng managers respond to a "hand off status reports to an agent" message more than a generic docs message.',
      baseline: { rate: 0.41, traffic: 900 }, mde: 0.12,
      qa: [['Audience overlap with other live tests under 10%', false, '34% overlap with E-101 ad sets'], ['Holdout cell set and clean', true, 'OK'], ['Signup and activation events firing', true, 'OK'], ['Budget cap set', true, '$2,600 per day'], ['Creative passes quality bar', false, '1 of 4 variants fails Claims']],
      result: null, agentRec: null, agentWhy: '' },
    { id: 'E-108', title: 'Geo holdout: pause Meta in AU for 3 weeks', ch: 'meta', geo: 'AU', persona: 'All', owner: 'Hypothesis agent', stage: 'proposed', day: 0, days: 21, budget: 0,
      hypothesis: 'Pausing Meta in Australia for 3 weeks shows how many Meta signups would have come anyway, so we can trust platform-reported results.',
      baseline: { rate: 0.27, traffic: 1600 }, mde: 0.1, qa: [], result: null, agentRec: null, agentWhy: '' },
    { id: 'E-109', title: 'Google: exclude existing workspace emails from bidding', ch: 'google', geo: 'All', persona: 'All', owner: 'Hypothesis agent', stage: 'proposed', day: 0, days: 14, budget: 0,
      hypothesis: 'About 1 in 9 brand search clicks come from people who already have a workspace. Excluding them cuts waste.',
      baseline: { rate: 0.36, traffic: 3000 }, mde: 0.06, qa: [], result: null, agentRec: null, agentWhy: '' },
    { id: 'E-110', title: 'JP: local creative with calendar angle', ch: 'meta', geo: 'JP', persona: 'Ops and PM', owner: 'Creative agent', stage: 'proposed', day: 0, days: 14, budget: 0,
      hypothesis: 'Japanese creative written by a native reviewer, about meetings and calendars, fixes low Meta JP activation.',
      baseline: { rate: 0.15, traffic: 800 }, mde: 0.2, qa: [], result: null, agentRec: null, agentWhy: '' },
    { id: 'E-099', title: 'Google: broad match AI keywords', ch: 'google', geo: 'US', persona: 'All', owner: 'Ami (sample PM)', stage: 'decided', day: 14, days: 14, budget: 0,
      hypothesis: 'Broad match on AI keywords finds new intent.', baseline: { rate: 0.36, traffic: 2000 }, mde: 0.1, qa: [],
      result: { cpa: [18, 8, 28], cps: [4, -3, 11], act: [-12, -18, -6], w4: [-2, -7, 3], segs: [] }, agentRec: 'kill', agentWhy: 'Cost per activated up 18%.',
      decision: { type: 'kill', reason: 'Broad match pulled in low-intent "free AI" searches. Activation fell 12%.', by: 'Ami (sample PM)', at: 'Oct 16, 2026' } }
  ];

  var creatives = [
    { id: 'C-01', persona: 'Eng team lead', ch: 'linkedin', lang: 'en', status: 'live', headline: 'Let an agent write the Monday status report', body: 'Custom Agents pull updates from your team docs and draft the weekly report. You review and send.' },
    { id: 'C-02', persona: 'Startup founder', ch: 'meta', lang: 'en', status: 'live', headline: 'Your whole company in one workspace', body: 'Docs, projects, and meeting notes in one place. AI answers questions with links to the source.' },
    { id: 'C-03', persona: 'Startup founder', ch: 'meta', lang: 'en', status: 'live', headline: '10x your team overnight!', body: 'The ultimate AI workspace will supercharge your startup and skyrocket productivity. Unleash your team today!' },
    { id: 'C-04', persona: 'Marketing team', ch: 'meta', lang: 'en', status: 'live', headline: 'Plan campaigns where the work happens', body: 'Briefs, calendars, and launch checklists in one place. Ask AI for a first draft of the brief.' },
    { id: 'C-05', persona: 'Ops and PM', ch: 'google', lang: 'en', status: 'live', headline: 'AI meeting notes, no bot', body: 'Notes and action items written for you. Linked to your project tracker.' },
    { id: 'C-06', persona: 'Student', ch: 'chatgpt', lang: 'en', status: 'live', headline: 'A study planner that plans with you', body: 'Start from a free template. Track classes, notes, and due dates.' },
    { id: 'C-07', persona: 'Eng team lead', ch: 'linkedin', lang: 'en', status: 'draft', headline: 'Better than Confluence for engineering teams that want to move fast', body: 'Switch today and see why teams leave Confluence behind.' },
    { id: 'C-08', persona: 'Ops and PM', ch: 'meta', lang: 'ja', status: 'draft', mt: true, headline: '会議をもっと速くしなさい', body: 'AIがあなたのノートを取ります。今すぐ始めなさい。' },
    { id: 'C-09', persona: 'Ops and PM', ch: 'meta', lang: 'ja', status: 'draft', headline: '会議メモは、AIにおまかせ', body: '議事録とタスクを自動でまとめ、プロジェクトにリンクします。' },
    { id: 'C-10', persona: 'Marketing team', ch: 'linkedin', lang: 'en', status: 'draft', headline: 'Cut 87% of busywork from every launch', body: 'Agents handle the checklists so your team can focus on the story.' },
    { id: 'C-11', persona: 'Startup founder', ch: 'google', lang: 'en', status: 'draft', headline: 'Docs, wikis, and projects', body: 'One workspace for your startup. Free to start.' },
    { id: 'C-12', persona: 'Student', ch: 'meta', lang: 'en', status: 'draft', headline: 'Notes that find themselves', body: 'Ask a question and get the answer from your own class notes, with a link to the page.' }
  ];

  var graderKappa = [
    ['Claims are true and sourced', 0.88, 0.89], ['Brand voice: calm, plain, no hype', 0.71, 0.78], ['Clear and specific', 0.76, 0.77],
    ['Fits channel limits', 0.97, 0.97], ['No competitor or legal risk', 0.92, 0.93], ['Reads native in ja-JP', 0.66, 0.52]
  ];

  var agents = [
    { id: 'A-1', name: 'Creative duplicator', job: 'Copies approved ads into matching ad sets across geos and personas through platform APIs.', autonomy: 'Act', model: 'Small', runs: 42, actions: 318, helped: 0.94, version: 'v5', target: 'Hours saved, error rate' },
    { id: 'A-2', name: 'Budget pacer', job: 'Moves daily budget between ad sets based on cost per activated workspace.', autonomy: 'Act', model: 'Large', runs: 28, actions: 61, helped: 0.69, version: 'v7', target: 'Cost per activated workspace',
      pending: { version: 'v8', by: 'Evaluator', note: 'v7 waited too long to cut fatigued Meta ad sets. v8 reacts after 2 days instead of 4.',
        diff: ['- Cut budget after 4 days of rising cost per activated', '+ Cut budget after 2 days of rising cost per activated', '+ Shift saved budget to the top 3 ad sets by quality-adjusted cost'],
        replay: { agree: 0.91, base: 0.86, violations: ['Oct 14: would move +38% of Meta budget into JP in one day', 'Oct 21: would move +27% of LinkedIn budget into UK in one day'] } } },
    { id: 'A-3', name: 'Daypart agent', job: 'Turns ad sets on and off by local work hours where the platform does not support it.', autonomy: 'Act', model: 'Small', runs: 168, actions: 1344, helped: 0.88, version: 'v3', target: 'Spend with zero signups' },
    { id: 'A-4', name: 'Spend watcher', job: 'Checks spend hourly and flags ad sets with spend but no signups.', autonomy: 'Suggest', model: 'Small', runs: 168, actions: 37, helped: 0.81, version: 'v4', target: 'Wasted spend caught' },
    { id: 'A-5', name: 'Hypothesis agent', job: 'Reads geo, cohort, creative, and spend signals and drafts test ideas with sample sizes.', autonomy: 'Suggest', model: 'Large', runs: 7, actions: 9, helped: 0.56, version: 'v2', target: 'Share of ideas that win' },
    { id: 'A-6', name: 'Experiment QA', job: 'Checks overlap, holdouts, tracking, caps, and creative before a test goes live.', autonomy: 'Act with approval', model: 'Small', runs: 11, actions: 11, helped: 1.0, version: 'v3', target: 'Broken tests caught' },
    { id: 'A-7', name: 'Creative grader', job: 'Scores every ad against the brand quality bar before it can go live.', autonomy: 'Act with approval', model: 'Large', runs: 54, actions: 54, helped: 0.9, version: 'v4', target: 'Agreement with brand reviewers',
      pending: { version: 'v5', by: 'Evaluator', note: 'New rubric examples for brand voice. Better on English, worse on Japanese.', diff: ['+ 40 new brand voice examples (en)', '- 12 ja-JP examples removed by mistake'],
        replay: { agree: 0.84, base: 0.82, violations: ['ja-JP kappa drops 0.66 to 0.52 (max drop 0.05)'] } } },
    { id: 'A-8', name: 'Evaluator', job: 'Grades other agents every week on whether their changes helped, then proposes instruction changes.', autonomy: 'Suggest', model: 'Large', runs: 1, actions: 2, helped: null, version: 'v2', target: 'Agent outcomes' }
  ];

  var feed = [
    ['09:12', 'Daypart agent', 'Paused 46 LinkedIn EMEA ad sets at 19:00 local time.'],
    ['08:40', 'Spend watcher', 'Flagged Meta JP: $3,180 spent yesterday, 14 activated workspaces.'],
    ['08:05', 'Evaluator', 'Proposed Budget pacer v8 and Creative grader v5.'],
    ['07:30', 'Creative grader', 'Blocked C-07: names a competitor.'],
    ['Yesterday', 'Creative duplicator', 'Copied 3 approved founder ads into 112 ad sets in 6 geos.'],
    ['Yesterday', 'Hypothesis agent', 'Drafted E-108, E-109, E-110.']
  ];

  window.SAMPLE = { CHANNELS: CHANNELS, GEOS: GEOS, PERSONAS: PERSONAS, cells: cells, personaRows: personaRows, hourly: hourly,
    experiments: experiments, creatives: creatives, graderKappa: graderKappa, agents: agents, feed: feed,
    totalPaidWeekly: 420000, programShare: 0.18 };
})();
