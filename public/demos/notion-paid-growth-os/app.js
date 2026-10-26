/* Growth Loop Console. Independent prototype by Ami. Sample data only.
   Not a Notion product. Not affiliated with or endorsed by Notion Labs, Inc. No network calls. */
(function () {
  'use strict';
  var S = window.SAMPLE;
  var KEY = 'glc-state-v1';
  var VIEWS = [
    ['pulse', 'Pulse'], ['signals', 'Signals'], ['tests', 'Tests'], ['creative', 'Creative bar'], ['agents', 'Agents'], ['graduate', 'Budget gate']
  ];
  var CH = {}; S.CHANNELS.forEach(function (c) { CH[c.id] = c; });

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function seed() {
    return { experiments: clone(S.experiments), creatives: clone(S.creatives), agents: clone(S.agents), log: [],
      pacerCap: false, graderJaKeep: false, approval: 25000, share: 18, keepChatgpt: false, fin: { name: '', note: '', ok: false },
      graduated: null, ui: { metric: 'cpa', cell: 'meta|JP', stage: 'all', exp: 'E-102', cfilter: 'all', cr: 'C-03', agent: 'A-2', pmetric: 'act', edit: null, decide: {}, guide: -1 } };
  }
  var st;
  try { st = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch (e) { st = seed(); }
  if (!st.ui) st = seed();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  // helpers
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n, d) { return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  function kfmt(n) { return n >= 1000 ? '$' + (n / 1000).toFixed(n >= 100000 ? 0 : 1) + 'K' : money(n); }
  function num(n) { return Number(n).toLocaleString('en-US'); }
  function pct(x, d) { return (x * 100).toFixed(d == null ? 0 : d) + '%'; }
  function sgn(n) { return (n > 0 ? '+' : '') + n + '%'; }
  function exp(id) { return st.experiments.filter(function (e) { return e.id === id; })[0]; }
  function cre(id) { return st.creatives.filter(function (c) { return c.id === id; })[0]; }
  function agent(id) { return st.agents.filter(function (a) { return a.id === id; })[0]; }
  function now() { var d = new Date(); return 'Oct 26, 2026 ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function log(what, why) { st.log.unshift({ at: now(), what: what, why: why || '' }); }
  var toastT;
  function toast(msg) {
    var t = document.querySelector('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 2600);
  }
  function download(name, text, type) {
    var b = new Blob([text], { type: type || 'text/plain' }); var u = URL.createObjectURL(b);
    var a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 500);
  }

  // totals
  function totals(filter) {
    var t = { spend: 0, signups: 0, activated: 0, retained: 0, paid: 0 };
    S.cells.forEach(function (c) { if (!filter || filter(c)) { t.spend += c.spend; t.signups += c.signups; t.activated += c.activated; t.retained += c.retained; t.paid += c.paid; } });
    t.cps = t.spend / t.signups; t.act = t.activated / t.signups; t.cpa = t.spend / t.activated; t.w4 = t.retained / t.activated; t.qcpa = t.spend / t.retained;
    return t;
  }
  var ALL = totals();
  var deadShare = S.hourly.reduce(function (a, h) { return a + (h.signups < 3 ? h.spend : 0); }, 0) / S.hourly.reduce(function (a, h) { return a + h.spend; }, 0);
  var afterHoursWaste = deadShare * totals(function (c) { return c.ch === 'linkedin' && (c.geo === 'UK' || c.geo === 'DE' || c.geo === 'FR'); }).spend;

  // decision rule
  function rule(e) {
    if (!e.result) return null;
    var r = e.result, c = r.cpa, w = r.w4;
    if (w[0] <= -3) return { type: 'kill', why: 'W4 retention guardrail breached (' + sgn(w[0]) + ', limit -3%). Cheaper signups that do not stay are not a win.' };
    var segs = r.segs || [];
    var good = segs.filter(function (s) { return s[3] < 0; }), bad = segs.filter(function (s) { return s[2] > 0; });
    if (good.length && bad.length) return { type: 'segment', why: 'Works in ' + good.map(function (s) { return s[0]; }).join(', ') + ', hurts in ' + bad.map(function (s) { return s[0]; }).join(', ') + '. Scale only where it wins.' };
    if (c[2] < 0) return { type: 'scale', why: 'Cost per activated workspace ' + sgn(c[0]) + ' with the 90% CI fully below zero (' + sgn(c[1]) + ' to ' + sgn(c[2]) + '). Retention guardrail holds.' };
    if (c[1] > 0) return { type: 'kill', why: 'Cost per activated workspace is worse (' + sgn(c[0]) + ', CI ' + sgn(c[1]) + ' to ' + sgn(c[2]) + ').' };
    return { type: 'extend', why: 'CI still crosses zero (' + sgn(c[1]) + ' to ' + sgn(c[2]) + '). ' + (e.day < e.days ? (e.days - e.day) + ' days left in the plan.' : 'Extend 7 days or stop.') };
  }
  var DLAB = { scale: 'Scale', kill: 'Kill', extend: 'Extend', segment: 'Scale by segment' };
  var DCOL = { scale: 'green', kill: 'red', extend: 'yellow', segment: 'blue' };
  var STG = { proposed: ['Proposed', 'purple'], qa: ['In QA', 'yellow'], live: ['Live', 'blue'], read: ['Ready to decide', 'red'], decided: ['Decided', 'green'] };

  // creative grader (rule-based stand-in for an LLM grader)
  var HYPE = ['revolutionary', 'game-changer', 'game changer', 'supercharge', 'unleash', 'skyrocket', 'overnight', 'ultimate', 'insane', 'magic', 'best-in-class', 'world-class', 'never before'];
  var COMP = ['confluence', 'asana', 'clickup', 'coda', 'monday.com', 'google docs', 'microsoft', 'evernote', 'jira'];
  var CONCRETE = ['doc', 'note', 'agent', 'template', 'project', 'report', 'calendar', 'meeting', 'wiki', 'task', 'brief', 'checklist', 'planner', 'answer', 'source', '議事録', 'メモ', 'タスク', 'プロジェクト'];
  var LIM = { linkedin: [70, 150], meta: [40, 125], google: [30, 90], chatgpt: [40, 90] };
  function grade(c) {
    var t = (c.headline + ' ' + c.body), low = t.toLowerCase(), out = [];
    var cm = t.match(/\b\d+(\.\d+)?\s?x\b/i) || t.match(/\d+\s?%/) || t.match(/guarantee\w*/i);
    out.push({ k: 'Claims are true and sourced', s: cm ? 25 : 96, why: cm ? 'Claim with no source: "' + cm[0] + '"' : 'No unsupported numbers' });
    var hits = HYPE.filter(function (w) { return low.indexOf(w) > -1; }).length + (t.match(/!/g) || []).length;
    var imper = c.lang === 'ja' && /しなさい/.test(t);
    var v = Math.max(0, 96 - hits * 22 - (imper ? 50 : 0));
    out.push({ k: 'Brand voice: calm, plain, no hype', s: v, why: hits ? hits + ' hype words or "!" found' : (imper ? 'Commanding tone in Japanese' : 'Calm and plain') });
    var conc = CONCRETE.some(function (w) { return low.indexOf(w) > -1; });
    var sents = c.body.split(/[.!?。]/).filter(function (x) { return x.trim(); });
    var avg = sents.length ? c.body.split(/\s+/).length / sents.length : 0;
    var cl = (conc ? 94 : 58) - (avg > 22 ? 20 : 0);
    out.push({ k: 'Clear and specific', s: cl, why: conc ? 'Names a real thing the product does' : 'No concrete feature or outcome' });
    var lim = LIM[c.ch] || [60, 125], over = c.headline.length > lim[0] || c.body.length > lim[1];
    out.push({ k: 'Fits channel limits', s: over ? 40 : 98, why: 'Headline ' + c.headline.length + '/' + lim[0] + ', body ' + c.body.length + '/' + lim[1] });
    var comp = COMP.filter(function (w) { return low.indexOf(w) > -1; });
    out.push({ k: 'No competitor or legal risk', s: comp.length ? 0 : 100, why: comp.length ? 'Names a competitor: ' + comp.join(', ') : 'Clean' });
    if (c.lang !== 'en') { var bad = c.mt || imper; out.push({ k: 'Reads native in ja-JP', s: bad ? 35 : 92, why: bad ? 'Reads like machine translation' : 'Native reviewer style' }); }
    var pass = out.every(function (o) { return o.s >= 70; });
    return { items: out, pass: pass, score: Math.round(out.reduce(function (a, o) { return a + o.s; }, 0) / out.length) };
  }

  // agents replay
  function replay(a) {
    if (!a.pending) return null;
    var r = clone(a.pending.replay);
    if (a.id === 'A-2' && st.pacerCap) { r.violations = []; r.agree = 0.9; }
    if (a.id === 'A-7' && st.graderJaKeep) { r.violations = []; }
    r.pass = r.violations.length === 0 && r.agree >= r.base;
    return r;
  }

  // graduation checks
  function checks() {
    var share = st.share;
    var waiting = st.experiments.filter(function (e) { return e.stage === 'read'; });
    var badLive = st.creatives.filter(function (c) { return c.status === 'live' && !grade(c).pass; });
    var openAct = st.agents.filter(function (a) { var r = replay(a); return a.autonomy === 'Act' && a.pending && !r.pass; });
    var needHold = share > 30;
    var chs = ['meta', 'linkedin', 'google'].concat(st.keepChatgpt ? [] : ['chatgpt']);
    var noHold = needHold ? chs.filter(function (c) { return c === 'chatgpt'; }) : [];
    return [
      { id: 'dec', name: 'Every finished test has a decision', ok: waiting.length === 0, detail: waiting.length ? waiting.length + ' waiting: ' + waiting.map(function (e) { return e.id; }).join(', ') : 'No test is waiting', go: '#/tests' },
      { id: 'cre', name: 'No live ad fails the creative quality bar', ok: badLive.length === 0, detail: badLive.length ? badLive.map(function (c) { return c.id + ' "' + c.headline + '"'; }).join('; ') : 'All live ads pass', go: '#/creative' },
      { id: 'agt', name: 'Act-level agents pass their replay gate', ok: openAct.length === 0, detail: openAct.length ? openAct.map(function (a) { return a.name + ' ' + a.pending.version + ' fails replay'; }).join('; ') : 'No failing change on an Act-level agent', go: '#/agents' },
      { id: 'grd', name: 'Guardrails: daily shift cap and human approval', ok: st.pacerCap && st.approval <= 10000, detail: (st.pacerCap ? 'Daily shift cap 15% set' : 'No daily shift cap on Budget pacer') + '. Human approval over ' + money(st.approval) + ' per day' + (st.approval > 10000 ? ' (needs $10,000 or less)' : ''), go: null },
      { id: 'inc', name: 'Every managed channel has a geo holdout read', ok: noHold.length === 0, detail: !needHold ? 'Not needed at 30% or less' : (noHold.length ? 'ChatGPT ads has no holdout yet (E-108 style test needed)' : 'Meta, LinkedIn, Google have holdout reads' + (st.keepChatgpt ? '. ChatGPT ads stays in the test budget' : '')), go: null },
      { id: 'fin', name: 'Strat Fin signs off on the forecast', ok: st.fin.ok, detail: st.fin.ok ? 'Signed by ' + st.fin.name : 'Not signed yet', go: null }
    ];
  }

  // ---------- views ----------
  function kpi(l, v, d, meter) { return '<div class="kpi"><div class="l">' + l + '</div><div class="v">' + v + '</div>' + (d ? '<div class="d">' + d + '</div>' : '') + (meter != null ? '<div class="meter" aria-hidden="true"><i style="width:' + meter + '%"></i></div>' : '') + '</div>'; }

  function alerts() {
    var a = [];
    var waiting = st.experiments.filter(function (e) { return e.stage === 'read'; });
    if (waiting.length) a.push(['red', waiting.length + ' tests are ready to decide', 'E-102 looks cheap per signup but its users do not stay. The agent wants to scale it.', '#/tests/E-102', 'Decide']);
    var badLive = st.creatives.filter(function (c) { return c.status === 'live' && !grade(c).pass; });
    if (badLive.length) a.push(['red', badLive.length + ' live ad fails the quality bar', '"' + badLive[0].headline + '" makes a 10x claim with hype words.', '#/creative/' + badLive[0].id, 'Fix']);
    var p = agent('A-2'); if (p.pending && !replay(p).pass) a.push(['red', 'Budget pacer v8 fails its replay gate', 'It would move up to 38% of a platform budget in one day.', '#/agents/A-2', 'Review']);
    a.push(['yellow', 'LinkedIn EMEA spends after hours with almost no signups', 'About ' + kfmt(afterHoursWaste) + ' a week goes to hours with 0 to 2 signups. E-101 tested a fix.', '#/signals', 'See']);
    a.push(['yellow', 'Meta JP activation is about half of other geos', 'Signups skip setup. E-110 proposes native Japanese creative.', '#/signals', 'See']);
    if (!st.keepChatgpt) a.push(['yellow', 'ChatGPT ads has no geo holdout yet', 'Needed before it moves out of the test budget.', '#/graduate', 'Plan']);
    if (st.graduated) a.unshift(['green', 'Program graduated to ' + st.graduated.share + '% of paid spend', 'Signed off ' + st.graduated.at + '.', '#/graduate', 'Open']);
    return a;
  }

  function vPulse() {
    var share = st.graduated ? st.graduated.share : 18;
    var waiting = st.experiments.filter(function (e) { return e.stage === 'read'; }).length;
    var live = st.experiments.filter(function (e) { return e.stage === 'live'; }).length;
    var rows = S.CHANNELS.map(function (c) { var t = totals(function (x) { return x.ch === c.id; }); return [c, t]; });
    var minQ = Math.min.apply(null, rows.map(function (r) { return r[1].qcpa; }));
    var al = alerts();
    return '<div class="head"><div><h1>Pulse</h1><p>Week of Oct 19 to Oct 25, 2026. Paid growth across Meta, LinkedIn, Google, and ChatGPT ads, judged on users who activate and stay, not just signups.</p></div>' +
      '<div class="row"><button class="btn dark" data-act="guide-start">Start 90-second walkthrough</button></div></div>' +
      '<div class="kpis">' +
      kpi('Paid spend (week)', kfmt(ALL.spend), num(ALL.signups) + ' signups') +
      kpi('Cost per signup', money(ALL.cps, 2), 'Easy to game') +
      kpi('Cost per activated workspace', money(ALL.cpa, 2), pct(ALL.act) + ' of signups activate by day 7') +
      kpi('Cost per retained workspace', money(ALL.qcpa, 2), pct(ALL.w4) + ' still active in week 4') +
      kpi('Program share of paid spend', share + '%', 'Goal: majority by year end', share / 0.7) +
      kpi('Tests', live + ' live', waiting + ' ready to decide') +
      '</div>' +
      '<div class="grid split2"><div class="card"><h3>Needs you</h3><p class="sub">Ranked by money at risk. Each item opens the place to fix it.</p>' +
      al.map(function (x, i) { return '<div class="alert"><div class="rank ' + x[0] + '">' + (i + 1) + '</div><div class="grow"><div><b>' + esc(x[1]) + '</b></div><div class="m">' + esc(x[2]) + '</div></div><a class="btn sm" href="' + x[3] + '">' + x[4] + '</a></div>'; }).join('') +
      '</div><div class="card"><h3>Agent activity</h3><p class="sub">Last 24 hours. Agents do the work. People make the calls.</p><ul class="feed">' +
      S.feed.map(function (f) { return '<li><span class="tm">' + f[0] + '</span><span><b>' + esc(f[1]) + '</b>. ' + esc(f[2]) + '</span></li>'; }).join('') + '</ul></div></div>' +
      '<div class="card mt16"><h3>Channels, judged on quality</h3><p class="sub">The cheapest signup is not the cheapest good user. Sort by the last column.</p><div class="scroll"><table><thead><tr><th>Channel</th><th class="n">Spend</th><th class="n">Signups</th><th class="n">Cost per signup</th><th class="n">Activation</th><th class="n">Cost per activated</th><th class="n">W4 retained</th><th class="n">Cost per retained</th></tr></thead><tbody>' +
      rows.map(function (r) { var t = r[1]; return '<tr><td><b>' + r[0].name + '</b></td><td class="n">' + kfmt(t.spend) + '</td><td class="n">' + num(t.signups) + '</td><td class="n">' + money(t.cps, 2) + '</td><td class="n">' + pct(t.act) + '</td><td class="n">' + money(t.cpa, 2) + '</td><td class="n">' + pct(t.w4) + '</td><td class="n"><b>' + money(t.qcpa, 2) + '</b> ' + (t.qcpa === minQ ? '<span class="pill green">Best</span>' : '') + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>';
  }

  var METRICS = { cpa: ['Cost per activated', function (t) { return t.cpa; }, function (v) { return money(v, 0); }, true], act: ['Activation rate', function (t) { return t.act; }, function (v) { return pct(v); }, false], w4: ['W4 retention', function (t) { return t.w4; }, function (v) { return pct(v); }, false], spend: ['Spend', function (t) { return t.spend; }, function (v) { return kfmt(v); }, null] };
  function cellT(c) { return { spend: c.spend, cpa: c.spend / c.activated, act: c.activated / c.signups, w4: c.retained / c.activated, cps: c.spend / c.signups }; }
  function vSignals() {
    var m = METRICS[st.ui.metric];
    var vals = S.cells.map(function (c) { return m[1](cellT(c)); });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    function color(v) {
      var x = (v - lo) / ((hi - lo) || 1); if (m[3] === true) x = 1 - x; if (m[3] === null) return 'rgba(35,131,226,' + (0.08 + x * 0.4).toFixed(2) + ')';
      return x > 0.5 ? 'rgba(63,125,88,' + (0.08 + (x - 0.5) * 0.6).toFixed(2) + ')' : 'rgba(196,65,59,' + (0.08 + (0.5 - x) * 0.6).toFixed(2) + ')';
    }
    var sel = st.ui.cell.split('|');
    var cell = S.cells.filter(function (c) { return c.ch === sel[0] && c.geo === sel[1]; })[0];
    var ct = cellT(cell);
    var hm = '<div class="scroll hm"><table><thead><tr><th>Geo</th>' + S.CHANNELS.map(function (c) { return '<th class="n">' + c.short + '</th>'; }).join('') + '</tr></thead><tbody>' +
      S.GEOS.map(function (g) {
        return '<tr><td><b>' + g.id + '</b> <span class="muted">' + g.region + '</span></td>' + S.CHANNELS.map(function (c) {
          var x = S.cells.filter(function (y) { return y.ch === c.id && y.geo === g.id; })[0]; var v = m[1](cellT(x));
          var on = st.ui.cell === c.id + '|' + g.id;
          return '<td class="cell"><button class="cellbtn" style="background:' + color(v) + '" data-act="cell" data-v="' + c.id + '|' + g.id + '" aria-pressed="' + on + '" aria-label="' + c.name + ' ' + g.name + ' ' + m[0] + ' ' + m[2](v) + '">' + m[2](v) + (x.flag ? '<small>Flag</small>' : '') + '</button></td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
    var exists = st.experiments.some(function (e) { return e.fromCell === st.ui.cell; });
    var detail = '<div class="card" id="cell-detail"><h3>' + CH[cell.ch].name + ' in ' + S.GEOS.filter(function (g) { return g.id === cell.geo; })[0].name + '</h3>' +
      (cell.flag ? '<div class="callout yellow">' + esc(cell.flag) + '</div>' : '<div class="callout">No flag on this cell this week.</div>') +
      '<div class="facts"><div class="fact"><div class="l">Spend</div><div class="v">' + kfmt(cell.spend) + '</div></div><div class="fact"><div class="l">Cost per signup</div><div class="v">' + money(ct.cps, 2) + '</div></div><div class="fact"><div class="l">Activation</div><div class="v">' + pct(ct.act) + '</div></div><div class="fact"><div class="l">W4 retained</div><div class="v">' + pct(ct.w4) + '</div></div></div>' +
      '<div class="section"><h4>Funnel</h4>' + [['Signups', cell.signups], ['Activated by day 7', cell.activated], ['Active in week 4', cell.retained], ['Paid by day 30', cell.paid]].map(function (f) { return '<div class="score"><div><div class="row" style="justify-content:space-between"><span>' + f[0] + '</span><span class="num">' + num(f[1]) + '</span></div><div class="meter"><i style="width:' + Math.max(2, f[1] / cell.signups * 100) + '%"></i></div></div><span class="num muted">' + pct(f[1] / cell.signups) + '</span></div>'; }).join('') + '</div>' +
      '<div class="row mt12">' + (exists ? '<a class="btn" href="#/tests">Test drafted. Open Tests</a>' : '<button class="btn primary" data-act="draft-test">Draft a test from this signal</button>') + '</div></div>';
    var pm = st.ui.pmetric;
    var coh = '<div class="card mt16"><h3>Cohort quality by persona</h3><p class="sub">Which audiences become real teams. Use this to aim creative and onboarding.</p><div class="chips" role="group" aria-label="Cohort metric"><button class="chip" data-act="pmetric" data-v="act" aria-pressed="' + (pm === 'act') + '">Activation by day 7</button><button class="chip" data-act="pmetric" data-v="w4" aria-pressed="' + (pm === 'w4') + '">W4 retention</button></div><div class="scroll"><table><thead><tr><th>Persona</th>' + S.CHANNELS.map(function (c) { return '<th class="n">' + c.short + '</th>'; }).join('') + '</tr></thead><tbody>' +
      S.personaRows.map(function (r) { return '<tr><td><b>' + r.persona + '</b></td>' + S.CHANNELS.map(function (c) { var v = r[c.id][pm]; var bad = pm === 'act' ? v < 0.25 : v < 0.45; return '<td class="n">' + pct(v) + (bad ? ' <span class="pill red">Low</span>' : '') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div></div>';
    // hourly chart
    var W = 1000, H = 220, maxS = Math.max.apply(null, S.hourly.map(function (h) { return h.spend; })), maxG = Math.max.apply(null, S.hourly.map(function (h) { return h.signups; }));
    var bw = W / 24;
    var bars = S.hourly.map(function (h, i) { var bh = h.spend / maxS * (H - 30); var dead = h.signups < 3; return '<rect x="' + (i * bw + 3) + '" y="' + (H - 20 - bh) + '" width="' + (bw - 6) + '" height="' + bh + '" rx="3" fill="' + (dead ? '#e8b4b1' : '#b9d6f2') + '"/>'; }).join('');
    var line = S.hourly.map(function (h, i) { return (i ? 'L' : 'M') + (i * bw + bw / 2).toFixed(1) + ' ' + (H - 20 - h.signups / maxG * (H - 40)).toFixed(1); }).join(' ');
    var labels = [0, 6, 12, 18, 23].map(function (h) { return '<text x="' + (h * bw + bw / 2) + '" y="' + (H - 4) + '" font-size="12" text-anchor="middle" fill="#787774">' + String(h).padStart(2, '0') + ':00</text>'; }).join('');
    var chart = '<div class="card mt16"><h3>Spend vs signups by hour, LinkedIn EMEA</h3><p class="sub">Local time, average day. Red bars are hours with 0 to 2 signups. The platform has no dayparting, so an agent does it.</p>' +
      '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Hourly spend and signups chart">' + bars + '<path d="' + line + '" fill="none" stroke="#191919" stroke-width="2"/>' + labels + '</svg>' +
      '<div class="legend"><span><i style="background:#b9d6f2"></i>Spend, hour with signups</span><span><i style="background:#e8b4b1"></i>Spend, hour with 0 to 2 signups</span><span><i style="background:#191919"></i>Signups</span></div>' +
      '<div class="callout mt12">About <b>' + kfmt(afterHoursWaste) + ' a week</b> goes to dead hours. <a href="#/tests/E-101">E-101</a> tested running ads only in local work hours.</div></div>';
    return '<div class="head"><div><h1>Signals</h1><p>Geo, channel, cohort, and spend signals in one place. Tap a cell to see the funnel and turn a signal into a test.</p></div></div>' +
      '<div class="chips" role="group" aria-label="Heatmap metric">' + Object.keys(METRICS).map(function (k) { return '<button class="chip" data-act="metric" data-v="' + k + '" aria-pressed="' + (st.ui.metric === k) + '">' + METRICS[k][0] + '</button>'; }).join('') + '</div>' +
      '<div class="grid split2"><div class="card"><h3>' + m[0] + ' by geo and channel</h3><p class="sub">' + (m[3] === null ? 'Darker means more spend.' : 'Green is better, red is worse, compared with all cells.') + ' "Flag" marks a cell an agent flagged.</p>' + hm + '</div>' + detail + '</div>' + coh + chart;
  }

  // ---------- Tests ----------
  function power(p, mde, traffic) {
    var z = 1.6449 + 0.8416, d = p * mde; var n = Math.ceil(z * z * 2 * p * (1 - p) / (d * d));
    return { n: n, days: Math.ceil(2 * n / Math.max(1, traffic)) };
  }
  function ciRow(label, sub, v, costLike) {
    var D = 35; function x(n) { return ((Math.max(-D, Math.min(D, n)) + D) / (2 * D) * 100).toFixed(1); }
    var good = costLike ? v[2] < 0 : v[1] > 0, bad = costLike ? v[1] > 0 : v[2] < 0;
    var col = good ? '#3f7d58' : bad ? '#c4413b' : '#a5a29c';
    return '<div class="ci"><div class="lab">' + label + '<small>' + sub + '</small></div><div class="track" aria-hidden="true"><div class="zero" style="left:50%"></div><div class="rng" style="left:' + x(v[1]) + '%;width:' + (x(v[2]) - x(v[1])) + '%;background:' + col + '"></div><div class="pt" style="left:' + x(v[0]) + '%"></div></div><div class="val"><b>' + sgn(v[0]) + '</b> <span class="muted">' + v[1] + ' to ' + v[2] + '</span></div></div>';
  }
  function vTests() {
    var f = st.ui.stage;
    var list = st.experiments.filter(function (e) { return f === 'all' || e.stage === f; });
    var order = { read: 0, qa: 1, proposed: 2, live: 3, decided: 4 };
    list.sort(function (a, b) { return order[a.stage] - order[b.stage]; });
    var counts = {}; st.experiments.forEach(function (e) { counts[e.stage] = (counts[e.stage] || 0) + 1; });
    var e = exp(st.ui.exp) || list[0];
    var chips = '<div class="chips" role="group" aria-label="Filter tests"><button class="chip" data-act="stage" data-v="all" aria-pressed="' + (f === 'all') + '">All ' + st.experiments.length + '</button>' +
      ['read', 'qa', 'proposed', 'live', 'decided'].map(function (k) { return '<button class="chip" data-act="stage" data-v="' + k + '" aria-pressed="' + (f === k) + '">' + STG[k][0] + ' ' + (counts[k] || 0) + '</button>'; }).join('') + '</div>';
    var items = list.length ? list.map(function (x) {
      var eff = x.result ? 'Cost per activated ' + sgn(x.result.cpa[0]) : (x.stage === 'live' ? 'Day ' + x.day + ' of ' + x.days : 'No data yet');
      return '<button class="item" data-act="exp" data-v="' + x.id + '" aria-pressed="' + (e && x.id === e.id) + '"><div class="grow"><div class="row" style="justify-content:space-between"><span class="m num">' + x.id + ' · ' + CH[x.ch].short + ' · ' + esc(x.geo) + '</span><span class="pill ' + STG[x.stage][1] + '">' + STG[x.stage][0] + '</span></div><div class="t">' + esc(x.title) + '</div><div class="m">' + eff + ' · ' + esc(x.owner) + '</div></div></button>';
    }).join('') : '<div class="empty">No tests in this stage.</div>';
    return '<div class="head"><div><h1>Tests</h1><p>From signal to hypothesis to test to a clear kill or scale call. Agents draft and run. The decision rule and a person decide.</p></div></div>' + chips +
      '<div class="grid split"><div class="list">' + items + '</div>' + (e ? testDetail(e) : '<div class="empty">Pick a test.</div>') + '</div>';
  }
  function testDetail(e) {
    var pw = power(e.baseline.rate, e.mde, e.baseline.traffic);
    var h = '<div class="card" id="detail"><div class="row" style="justify-content:space-between"><span class="m muted num">' + e.id + ' · ' + esc(e.owner) + '</span><span class="pill ' + STG[e.stage][1] + '">' + STG[e.stage][0] + '</span></div><h2 class="mt8">' + esc(e.title) + '</h2>' +
      '<p class="mt8">' + esc(e.hypothesis) + '</p>' +
      '<div class="facts"><div class="fact"><div class="l">Channel</div><div class="v">' + CH[e.ch].name + '</div></div><div class="fact"><div class="l">Geo</div><div class="v">' + esc(e.geo) + '</div></div><div class="fact"><div class="l">Persona</div><div class="v">' + esc(e.persona) + '</div></div><div class="fact"><div class="l">Budget</div><div class="v">' + (e.budget ? money(e.budget) + '/day' : 'None') + '</div></div></div>' +
      '<div class="callout blue"><b>Primary metric:</b> cost per activated workspace. <b>Guardrails:</b> W4 retention no worse than -3%, every ad passes the creative bar.</div>';
    // power
    h += '<div class="section"><h4>Sample size</h4><div class="grid g3"><div><label class="f" for="pw-rate">Baseline activation</label><input class="inp num" id="pw-rate" type="number" step="0.01" min="0.05" max="0.9" value="' + e.baseline.rate + '" data-in="pw" data-k="rate"></div><div><label class="f" for="pw-mde">Smallest lift to detect</label><input class="inp num" id="pw-mde" type="number" step="0.01" min="0.02" max="0.5" value="' + e.mde + '" data-in="pw" data-k="mde"></div><div><label class="f" for="pw-tr">Signups per day in test</label><input class="inp num" id="pw-tr" type="number" step="50" min="50" value="' + e.baseline.traffic + '" data-in="pw" data-k="traffic"></div></div>' +
      '<p class="mt8" id="pw-out">' + powerText(pw, e) + '</p></div>';
    // QA
    if (e.qa && e.qa.length) {
      h += '<div class="section"><h4>Experiment QA</h4><ul class="checks">' + e.qa.map(function (q, i) {
        return '<li><span class="pill ' + (q[1] ? 'green">Pass' : 'red">Fail') + '</span><div class="grow"><div>' + esc(q[0]) + '</div><div class="m">' + esc(q[2]) + '</div></div>' +
          (!q[1] && e.stage === 'qa' ? '<button class="btn sm" data-act="fix-qa" data-v="' + i + '">' + (i === 0 ? 'Exclude E-101 ad sets' : 'Swap failing variant') + '</button>' : '') + '</li>';
      }).join('') + '</ul></div>';
    }
    if (e.stage === 'proposed') h += '<div class="row mt12"><button class="btn primary" data-act="run-qa">Run experiment QA</button><button class="btn" data-act="discard">Discard idea</button></div>';
    if (e.stage === 'qa') { var ok = e.qa.every(function (q) { return q[1]; }); h += '<div class="row mt12"><button class="btn primary" data-act="launch" ' + (ok ? '' : 'disabled') + '>Launch test</button>' + (ok ? '' : '<span class="hint">Fix the failed checks first.</span>') + '</div>'; }
    // results
    if (e.result) {
      var r = e.result;
      h += '<div class="section"><h4>Results, 90% confidence intervals</h4>' +
        ciRow('Cost per signup', 'lower is better', r.cps, true) + ciRow('Activation by day 7', 'higher is better', r.act, false) + ciRow('W4 retention', 'guardrail', r.w4, false) + ciRow('<b>Cost per activated</b>', 'primary, lower is better', r.cpa, true) +
        (r.segs && r.segs.length ? '<div class="mt12 hint">Cost per activated by segment</div>' + r.segs.map(function (s) { return ciRow(s[0], 'segment', [s[1], s[2], s[3]], true); }).join('') : '') + '</div>';
      var rr = rule(e);
      var mism = e.agentRec && rr && e.agentRec !== rr.type;
      h += '<div class="section"><h4>Recommendation</h4><div class="grid g2"><div class="callout"><div class="hint">Agent says</div><b>' + DLAB[e.agentRec] + '</b><div class="m">' + esc(e.agentWhy) + '</div></div><div class="callout ' + DCOL[rr.type] + '"><div class="hint">Decision rule says</div><b>' + DLAB[rr.type] + '</b><div>' + esc(rr.why) + '</div></div></div>' +
        (mism ? '<div class="callout red mt8"><b>They disagree.</b> The agent judged on a number the rule does not trust alone. Logged for the Evaluator so the agent learns.</div>' : '') + '</div>';
    } else if (e.stage === 'live') {
      h += '<div class="section"><div class="callout">Collecting data. Day ' + e.day + ' of ' + e.days + '. No peeking decisions before day ' + e.days + '.</div></div>';
    }
    // decision
    if (e.decision) {
      h += '<div class="section"><h4>Decision</h4><div class="callout ' + DCOL[e.decision.type] + '"><b>' + DLAB[e.decision.type] + '</b> by ' + esc(e.decision.by) + ', ' + esc(e.decision.at) + '<div>' + esc(e.decision.reason) + '</div></div></div>';
    } else if (e.stage === 'read' || (e.stage === 'live' && e.result)) {
      var d = st.ui.decide[e.id] || {}; var rr2 = rule(e);
      h += '<div class="section" id="decide"><h4>Your call</h4><div class="seg" role="group" aria-label="Decision">' + ['scale', 'kill', 'extend', 'segment'].map(function (k) { return '<button data-act="dtype" data-v="' + k + '" aria-pressed="' + (d.type === k) + '">' + DLAB[k] + (rr2 && rr2.type === k ? ' (rule)' : '') + '</button>'; }).join('') + '</div>' +
        '<label class="f mt12" for="dreason">Reason (required, goes in the decision log)</label><textarea class="inp" id="dreason" data-in="reason" placeholder="Say what the data shows and what happens next.">' + esc(d.reason || '') + '</textarea>' +
        '<div class="row mt8"><button class="btn primary" data-act="decide">Save decision</button><button class="btn ghost" data-act="use-rule">Use rule wording</button></div><div class="err" id="derr" aria-live="polite"></div></div>';
    }
    return h + '</div>';
  }
  function powerText(pw, e) { return 'About <b class="num">' + num(pw.n) + '</b> signups per arm, so <b class="num">' + pw.days + ' days</b> at this traffic. ' + (pw.days > e.days ? '<span class="pill red">Longer than the ' + e.days + '-day plan</span>' : '<span class="pill green">Fits the ' + e.days + '-day plan</span>'); }

  // ---------- Creative ----------
  function adPreview(c) {
    return '<div class="ad"><div class="adh"><i></i>Sample ad · ' + CH[c.ch].name + ' · ' + c.lang + '-' + (c.lang === 'ja' ? 'JP' : 'US') + '</div><div class="art">Sample creative image</div><div class="copy"><b>' + esc(c.headline) + '</b><p>' + esc(c.body) + '</p></div></div>';
  }
  function scoreBox(g) {
    return g.items.map(function (o) { return '<div class="score"><div><div class="row" style="justify-content:space-between"><span>' + esc(o.k) + '</span><span class="hint">' + esc(o.why) + '</span></div><div class="meter"><i style="width:' + o.s + '%;background:' + (o.s >= 70 ? '#3f7d58' : '#c4413b') + '"></i></div></div><span class="num ' + (o.s >= 70 ? '' : 'pill red') + '">' + o.s + '</span></div>'; }).join('') +
      '<div class="callout ' + (g.pass ? 'green' : 'red') + ' mt8"><b>' + (g.pass ? 'Passes the bar' : 'Blocked by the bar') + '</b>. Every item must score 70 or more. Score ' + g.score + '.</div>';
  }
  var CST = { live: ['Live', 'blue'], draft: ['Draft', 'gray'], approved: ['Approved', 'green'], paused: ['Paused', 'yellow'] };
  function vCreative() {
    var f = st.ui.cfilter;
    var list = st.creatives.filter(function (c) { var g = grade(c); return f === 'all' || (f === 'failing' ? !g.pass : c.status === f); });
    var c = cre(st.ui.cr) || list[0];
    var failing = st.creatives.filter(function (x) { return !grade(x).pass; }).length;
    var chips = '<div class="chips" role="group" aria-label="Filter ads">' + [['all', 'All ' + st.creatives.length], ['live', 'Live'], ['draft', 'Draft'], ['approved', 'Approved'], ['failing', 'Fails bar ' + failing]].map(function (k) { return '<button class="chip" data-act="cfilter" data-v="' + k[0] + '" aria-pressed="' + (f === k[0]) + '">' + k[1] + '</button>'; }).join('') + '</div>';
    var items = list.length ? list.map(function (x) { var g = grade(x); return '<button class="item" data-act="cr" data-v="' + x.id + '" aria-pressed="' + (c && c.id === x.id) + '"><div class="grow"><div class="row" style="justify-content:space-between"><span class="m num">' + x.id + ' · ' + esc(x.persona) + ' · ' + CH[x.ch].short + ' · ' + x.lang + '</span><span class="pill ' + (CST[x.status] || ['', ''])[1] + '">' + (CST[x.status] || [x.status])[0] + '</span></div><div class="t">' + esc(x.headline) + '</div><div class="m">' + (g.pass ? '<span class="pill green">Passes</span>' : '<span class="pill red">Blocked</span>') + ' Score ' + g.score + '</div></div></button>'; }).join('') : '<div class="empty">No ads here.</div>';
    var det = '';
    if (c) {
      var ed = st.ui.edit && st.ui.edit.id === c.id ? st.ui.edit : null;
      var view = ed ? { headline: ed.headline, body: ed.body, ch: c.ch, lang: c.lang, mt: c.mt } : c;
      var g = grade(view);
      det = '<div class="card" id="detail"><div class="row" style="justify-content:space-between"><span class="m muted num">' + c.id + ' · ' + esc(c.persona) + '</span><span class="pill ' + (CST[c.status] || ['', ''])[1] + '">' + (CST[c.status] || [c.status])[0] + '</span></div>' +
        '<div class="grid g2 mt12"><div id="adprev">' + adPreview(view) + '</div><div><h3>Quality bar</h3><div id="scorebox">' + scoreBox(g) + '</div></div></div>';
      if (ed) {
        det += '<div class="section"><h4>Edit copy</h4><label class="f" for="ed-h">Headline</label><input class="inp" id="ed-h" data-in="edh" value="' + esc(ed.headline) + '"><label class="f mt12" for="ed-b">Body</label><textarea class="inp" id="ed-b" data-in="edb">' + esc(ed.body) + '</textarea><p class="hint mt8">Scores update as you type.</p><div class="row mt8"><button class="btn primary" data-act="ed-save">Save and re-grade</button><button class="btn" data-act="ed-cancel">Cancel</button></div></div>';
      } else {
        det += '<div class="row mt16"><button class="btn" data-act="ed-start">Edit copy</button>' +
          (c.status !== 'live' && c.status !== 'approved' ? '<button class="btn primary" data-act="approve" ' + (g.pass ? '' : 'disabled') + '>Approve for duplicator</button>' : '') +
          (c.status === 'live' ? '<button class="btn danger" data-act="pause">Pause ad</button>' : '') + (c.status === 'paused' ? '<button class="btn" data-act="relive" ' + (g.pass ? '' : 'disabled') + '>Put back live</button>' : '') + '</div>' +
          (!g.pass && c.status === 'live' ? '<div class="callout red mt12">This ad is live and fails the bar. Fix the copy or pause it. The Budget gate stays locked until you do.</div>' : '');
      }
      det += '</div>';
    }
    var kap = '<div class="card mt16"><h3>Can we trust the grader?</h3><p class="sub">The grader is checked against brand reviewers on 300 labeled ads (sample). Cohen\'s kappa per rubric item. v5 is proposed by the Evaluator.</p><div class="scroll"><table><thead><tr><th>Rubric item</th><th class="n">Live v4</th><th class="n">Proposed v5</th><th>Gate (min 0.6, max drop 0.05)</th></tr></thead><tbody>' +
      S.graderKappa.map(function (k) { var keep = st.graderJaKeep && /ja-JP/.test(k[0]); var v5 = keep ? k[1] : k[2]; var ok = v5 >= 0.6 && k[1] - v5 <= 0.05; return '<tr><td>' + k[0] + '</td><td class="n">' + k[1].toFixed(2) + '</td><td class="n">' + v5.toFixed(2) + (keep ? ' <span class="pill">keeps v4</span>' : '') + '</td><td><span class="pill ' + (ok ? 'green">Pass' : 'red">Fail') + '</span></td></tr>'; }).join('') +
      '</tbody></table></div><div class="row mt12"><a class="btn sm" href="#/agents/A-7">Review Creative grader v5</a></div></div>';
    return '<div class="head"><div><h1>Creative quality bar</h1><p>Agents can write and copy ads fast. Nothing goes live unless it is true, calm, clear, fits the channel, and carries no legal risk.</p></div></div>' + chips +
      '<div class="grid split"><div class="list">' + items + '</div>' + det + '</div>' + kap;
  }

  // ---------- Agents ----------
  var AUT = { 'Suggest': 'gray', 'Act with approval': 'yellow', 'Act': 'blue' };
  function vAgents() {
    var a = agent(st.ui.agent) || st.agents[0];
    var items = st.agents.map(function (x) { var r = replay(x); return '<button class="item" data-act="agent" data-v="' + x.id + '" aria-pressed="' + (x.id === a.id) + '"><div class="grow"><div class="row" style="justify-content:space-between"><span class="t">' + esc(x.name) + '</span><span class="pill ' + AUT[x.autonomy] + '">' + x.autonomy + '</span></div><div class="m">' + esc(x.job) + '</div><div class="m mt8">' + x.version + ' · ' + (x.helped == null ? 'Grades others' : pct(x.helped) + ' of actions helped') + (x.pending ? ' · <span class="pill ' + (r.pass ? 'green">' + x.pending.version + ' passes replay' : 'red">' + x.pending.version + ' fails replay') + '</span>' : '') + '</div></div></button>'; }).join('');
    var r = replay(a);
    var det = '<div class="card" id="detail"><div class="row" style="justify-content:space-between"><h2>' + esc(a.name) + '</h2><span class="pill">' + a.version + '</span></div><p class="mt8">' + esc(a.job) + '</p>' +
      '<div class="facts"><div class="fact"><div class="l">Runs (7 days)</div><div class="v num">' + num(a.runs) + '</div></div><div class="fact"><div class="l">Actions (7 days)</div><div class="v num">' + num(a.actions) + '</div></div><div class="fact"><div class="l">Actions that helped</div><div class="v">' + (a.helped == null ? 'n/a' : pct(a.helped)) + '</div></div><div class="fact"><div class="l">Model size</div><div class="v">' + a.model + '</div></div></div>' +
      '<div class="section"><h4>Autonomy</h4><div class="seg" role="group" aria-label="Autonomy">' + ['Suggest', 'Act with approval', 'Act'].map(function (k) { return '<button data-act="aut" data-v="' + k + '" aria-pressed="' + (a.autonomy === k) + '">' + k + '</button>'; }).join('') + '</div><p class="hint mt8">Judged on: ' + esc(a.target) + '. New agents start at Suggest and earn Act, like a junior teammate.</p></div>';
    if (a.pending) {
      det += '<div class="section"><h4>Proposed change ' + a.version + ' to ' + a.pending.version + ' (by ' + a.pending.by + ')</h4><p>' + esc(a.pending.note) + '</p><div class="diff mt8">' + a.pending.diff.map(function (l) { return '<span class="' + (l[0] === '+' ? 'a' : 'r') + '">' + esc(l) + '</span>'; }).join('\n') + (a.id === 'A-2' && st.pacerCap ? '\n<span class="a">+ Never move more than 15% of a platform budget in one day</span>' : '') + (a.id === 'A-7' && st.graderJaKeep ? '\n<span class="a">+ Keep v4 examples for ja-JP</span>' : '') + '</div>' +
        '<div class="section"><h4>Replay gate: last 28 days of logged decisions</h4><div class="grid g2"><div class="fact"><div class="l">Agrees with human calls</div><div class="v">' + pct(r.agree) + ' <span class="muted">vs ' + pct(r.base) + ' for ' + a.version + '</span></div></div><div class="fact"><div class="l">Guardrail violations</div><div class="v">' + r.violations.length + '</div></div></div>' +
        (r.violations.length ? '<ul class="checks mt8">' + r.violations.map(function (v) { return '<li><span class="pill red">Fail</span><div class="grow">' + esc(v) + '</div></li>'; }).join('') + '</ul>' : '<div class="callout green mt8">No violations. Better agreement than the live version.</div>') + '</div>' +
        (a.id === 'A-2' ? '<label class="chk mt8"><input type="checkbox" data-act="pcap" ' + (st.pacerCap ? 'checked' : '') + '> Add rule: never move more than 15% of a platform budget in one day</label>' : '') +
        (a.id === 'A-7' ? '<label class="chk mt8"><input type="checkbox" data-act="jakeep" ' + (st.graderJaKeep ? 'checked' : '') + '> Keep v4 rules for ja-JP</label>' : '') +
        '<div class="row mt12"><button class="btn primary" data-act="promote" ' + (r.pass ? '' : 'disabled') + '>Promote ' + a.pending.version + '</button><button class="btn" data-act="reject">Reject change</button></div>' + (r.pass ? '' : '<p class="hint mt8">Promote unlocks when the replay passes.</p>') + '</div>';
    } else {
      det += '<div class="section"><div class="callout">No open instruction change.</div></div>';
    }
    det += '</div>';
    var sc = '<div class="card mt16"><h3>Evaluator scorecard</h3><p class="sub">Did each agent\'s actions improve its target metric 14 days later? Low scores trigger an instruction review.</p><div class="scroll"><table><thead><tr><th>Agent</th><th>Autonomy</th><th>Target</th><th class="n">Helped</th><th>Verdict</th></tr></thead><tbody>' +
      st.agents.filter(function (x) { return x.helped != null; }).map(function (x) { var v = x.helped >= 0.85 ? ['green', 'Keep'] : x.helped >= 0.65 ? ['yellow', 'Review instructions'] : ['red', 'Keep at Suggest']; return '<tr><td><b>' + esc(x.name) + '</b></td><td>' + x.autonomy + '</td><td>' + esc(x.target) + '</td><td class="n">' + pct(x.helped) + '</td><td><span class="pill ' + v[0] + '">' + v[1] + '</span></td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="callout mt12">Plain scripts for repeat work. Agents for judgment calls. An evaluator to grade outcomes and rewrite instructions. Small models where deep reasoning is not needed.</div></div>';
    return '<div class="head"><div><h1>Agents</h1><p>Each agent has one job, a target metric, and an autonomy level. Instruction changes must pass a replay against past human calls before they ship.</p></div></div><div class="grid split"><div class="list">' + items + '</div>' + det + '</div>' + sc;
  }

  // ---------- Budget gate ----------
  function improvement() { var n = st.experiments.filter(function (e) { return e.decision && (e.decision.type === 'scale' || e.decision.type === 'segment'); }).length; return Math.min(0.2, 0.05 + n * 0.03); }
  function vGraduate() {
    var cs = checks(), ok = cs.every(function (c) { return c.ok; });
    var managed = ALL.spend * st.share / 100;
    var imp = improvement(), fc = ALL.cpa * (1 - st.share / 100 * imp);
    var h = '<div class="head"><div><h1>Budget gate</h1><p>Graduate the program from the test budget to more of paid spend, one step at a time. It moves only when every check passes.</p></div></div>';
    if (st.graduated) h += '<div class="callout green" style="margin-bottom:16px"><b>Graduated to ' + st.graduated.share + '% of paid spend</b> on ' + esc(st.graduated.at) + '. Download the memo below.</div>';
    h += '<div class="grid split2"><div class="card"><h3>Step size</h3><label class="f" for="share">Share of paid spend run by the program: <span id="share-v" class="num">' + st.share + '%</span></label><input class="range" id="share" type="range" min="18" max="70" step="1" value="' + st.share + '" data-in="share" aria-describedby="share-help"><p class="hint" id="share-help">Today 18% (the test budget). Above 30% needs a geo holdout read on every managed channel.</p>' +
      '<div class="grid g3 mt12"><div class="fact"><div class="l">Managed per week</div><div class="v num" id="g-man">' + kfmt(managed) + '</div></div><div class="fact"><div class="l">Cost per activated now</div><div class="v num">' + money(ALL.cpa, 2) + '</div></div><div class="fact"><div class="l">Forecast at this step</div><div class="v num" id="g-fc">' + money(fc, 2) + '</div></div></div>' +
      '<p class="hint mt8">Forecast uses the average lift from scaled tests (' + pct(imp) + ' on managed spend, sample math). Decide more tests to update it.</p>' +
      '<div class="section"><h4>Guardrails</h4><label class="f" for="appr">Human approval for any change over (USD per day)</label><input class="inp num" id="appr" type="number" step="1000" min="1000" value="' + st.approval + '" data-in="appr"><p class="hint mt8">Daily shift cap: ' + (st.pacerCap ? '<span class="pill green">15% set on Budget pacer</span>' : '<span class="pill red">Not set</span> <a href="#/agents/A-2">Set it in Agents</a>') + '</p>' +
      '<label class="chk"><input type="checkbox" data-act="keepgpt" ' + (st.keepChatgpt ? 'checked' : '') + '> Keep ChatGPT ads in the test budget until a holdout reads</label></div>' +
      '<div class="section"><h4>Strat Fin sign-off</h4>' + (st.fin.ok ? '<div class="callout green">Signed by ' + esc(st.fin.name) + '. ' + esc(st.fin.note) + ' <button class="btn sm ghost" data-act="unsign">Undo</button></div>' :
        '<div class="grid g2"><div><label class="f" for="fin-n">Name</label><input class="inp" id="fin-n" data-in="finn" value="' + esc(st.fin.name) + '" placeholder="Sample: Strat Fin partner"></div><div><label class="f" for="fin-t">Note</label><input class="inp" id="fin-t" data-in="fint" value="' + esc(st.fin.note) + '" placeholder="What you checked"></div></div><div class="row mt8"><button class="btn" data-act="sign">Sign off</button></div><div class="err" id="ferr" aria-live="polite"></div>') + '</div></div>' +
      '<div class="card"><h3>Checks</h3><ul class="checks">' + cs.map(function (c) { return '<li><span class="pill ' + (c.ok ? 'green">Pass' : 'red">Fail') + '</span><div class="grow"><div><b>' + esc(c.name) + '</b></div><div class="m">' + esc(c.detail) + '</div></div>' + (!c.ok && c.go ? '<a class="btn sm" href="' + c.go + '">Fix</a>' : '') + '</li>'; }).join('') + '</ul>' +
      (st.graduated && st.graduated.share === st.share ? '<button class="btn mt12" style="width:100%" disabled>Graduated at ' + st.share + '%</button>' : '<button class="btn primary mt12" style="width:100%" data-act="graduate" ' + (ok ? '' : 'disabled') + '>' + (ok ? 'Graduate to ' + st.share + '% of paid spend' : (cs.filter(function (c) { return !c.ok; }).length + ' checks to clear')) + '</button>') +
      '<div class="row mt12"><button class="btn sm" data-act="dl-memo">Download decision memo (.md)</button><button class="btn sm" data-act="dl-csv">Download decision log (.csv)</button></div><p class="hint mt8">Files are made in your browser. Nothing is sent anywhere.</p></div></div>';
    h += '<div class="card mt16"><h3>Decision log</h3><p class="sub">Every human call, with the reason. This is what the Evaluator learns from.</p>' + (st.log.length ? '<div class="scroll"><table><thead><tr><th>When</th><th>What</th><th>Why</th></tr></thead><tbody>' + st.log.map(function (l) { return '<tr><td class="num">' + esc(l.at) + '</td><td>' + esc(l.what) + '</td><td style="white-space:normal;min-width:240px">' + esc(l.why) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="empty">No decisions yet this session.</div>') + '</div>';
    return h;
  }
  function memo() {
    var cs = checks();
    var L = ['# Weekly paid growth decision memo (sample data)', '', 'Prototype by Ami. Not a Notion product. Not affiliated with Notion Labs, Inc. All numbers are sample data.', '', '## Program', '- Share of paid spend: ' + (st.graduated ? st.graduated.share + '% (graduated ' + st.graduated.at + ')' : '18% (test budget), proposed ' + st.share + '%'),
      '- Cost per activated workspace: ' + money(ALL.cpa, 2) + '. Cost per retained workspace: ' + money(ALL.qcpa, 2), '', '## Test decisions'];
    st.experiments.forEach(function (e) { if (e.decision) L.push('- ' + e.id + ' ' + e.title + ': ' + DLAB[e.decision.type] + '. ' + e.decision.reason); });
    L.push('', '## Gate checks'); cs.forEach(function (c) { L.push('- [' + (c.ok ? 'x' : ' ') + '] ' + c.name + ': ' + c.detail); });
    L.push('', '## Log'); st.log.forEach(function (l) { L.push('- ' + l.at + ': ' + l.what + (l.why ? '. ' + l.why : '')); });
    return L.join('\n') + '\n';
  }
  function csv() {
    var rows = [['id', 'title', 'stage', 'decision', 'reason', 'by', 'at', 'cpa_effect_pct']];
    st.experiments.forEach(function (e) { rows.push([e.id, e.title, e.stage, e.decision ? e.decision.type : '', e.decision ? e.decision.reason : '', e.decision ? e.decision.by : '', e.decision ? e.decision.at : '', e.result ? e.result.cpa[0] : '']); });
    return rows.map(function (r) { return r.map(function (v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\n') + '\n';
  }

  // ---------- guide ----------
  var GUIDE = [
    ['#/pulse', 'The program runs 18% of paid spend', '3 tests wait for a call, 1 live ad fails the bar, and an agent change fails its replay. Each one blocks the next budget step.'],
    ['#/tests/E-102', 'Kill the cheap-looking test', 'The agent wants to scale E-102 because signups got 21% cheaper. W4 retention fell 9%, so the rule says Kill. Pick Kill, give a reason, save. Then decide E-101 and E-105.'],
    ['#/creative/C-03', 'Fix the live ad that fails the bar', 'C-03 says "10x your team overnight!" Edit it to plain, true copy until it passes, or pause it.'],
    ['#/agents/A-2', 'Gate the agent change', 'Budget pacer v8 agrees with people more often, but would move 38% of a budget in one day. Add the 15% daily cap, watch the replay pass, then promote.'],
    ['#/graduate', 'Take the next budget step', 'Slide to 40%. Keep ChatGPT ads in the test budget, set approval to $10,000, sign as Strat Fin, then graduate and download the memo.']
  ];
  function guideBar() {
    var i = st.ui.guide; if (i < 0) return '';
    var g = GUIDE[i];
    return '<div class="guide" role="region" aria-label="Walkthrough"><div class="gt"><small>Walkthrough, step ' + (i + 1) + ' of ' + GUIDE.length + '</small><b>' + esc(g[1]) + '</b><div style="font-size:14px;color:#e7e7e4">' + esc(g[2]) + '</div></div><div class="row">' +
      (i > 0 ? '<button class="btn sm" data-act="g-prev">Back</button>' : '') + (i < GUIDE.length - 1 ? '<button class="btn sm primary" data-act="g-next">Next step</button>' : '<button class="btn sm primary" data-act="g-end">Finish</button>') + '<button class="btn sm" data-act="g-end" aria-label="Close walkthrough">Close</button></div></div>';
  }

  // ---------- shell ----------
  var route = { view: 'pulse', id: null };
  function parse() {
    var p = (location.hash || '#/pulse').replace(/^#\/?/, '').split('/');
    var v = VIEWS.some(function (x) { return x[0] === p[0]; }) ? p[0] : 'pulse';
    route = { view: v, id: p[1] || null };
    if (route.id) {
      if (v === 'tests' && exp(route.id)) { st.ui.exp = route.id; var e = exp(route.id); if (st.ui.stage !== 'all' && st.ui.stage !== e.stage) st.ui.stage = 'all'; }
      if (v === 'creative' && cre(route.id)) { st.ui.cr = route.id; st.ui.cfilter = 'all'; }
      if (v === 'agents' && agent(route.id)) st.ui.agent = route.id;
    }
  }
  function counts() {
    var cs = checks();
    return { tests: st.experiments.filter(function (e) { return e.stage === 'read'; }).length, creative: st.creatives.filter(function (c) { return c.status === 'live' && !grade(c).pass; }).length,
      agents: st.agents.filter(function (a) { return a.autonomy === 'Act' && a.pending && !replay(a).pass; }).length, graduate: st.graduated ? 0 : cs.filter(function (c) { return !c.ok; }).length };
  }
  function render(scrollDetail) {
    var c = counts();
    var body = { pulse: vPulse, signals: vSignals, tests: vTests, creative: vCreative, agents: vAgents, graduate: vGraduate }[route.view]();
    var y = window.scrollY;
    document.getElementById('app').innerHTML =
      '<header class="top"><div class="bar"><div class="brand"><div class="glyph" aria-hidden="true"><i></i></div><b>Growth Loop Console</b><span>Paid growth decisions, sample data</span></div><div class="sp"></div><button class="btn sm reset" data-act="reset" aria-label="Reset demo">&#8634; <span>Reset demo</span></button></div>' +
      '<nav class="tabs" aria-label="Views">' + VIEWS.map(function (v) { return '<a class="tab" href="#/' + v[0] + '" ' + (route.view === v[0] ? 'aria-current="page"' : '') + '>' + v[1] + (c[v[0]] ? '<span class="ct">' + c[v[0]] + '</span>' : '') + '</a>'; }).join('') + '</nav></header>' +
      '<main id="main"><div class="banner" role="note"><b>Sample data.</b><span>Independent prototype by Ami. Not a Notion product, not affiliated with or endorsed by Notion Labs, Inc. All spend, users, tests, ads, and agents are made up.</span></div>' + guideBar() + body + '</main>' +
      '<footer>Growth Loop Console is a concept prototype built for a job conversation. Not affiliated with Notion. No real ad accounts, no real users, no network calls. Your changes stay in this browser (Reset demo clears them).</footer>';
    if (scrollDetail) { var d = document.getElementById('detail') || document.getElementById('cell-detail'); if (d && window.innerWidth < 860) d.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0); }
    else window.scrollTo(0, y);
  }
  function go() {
    parse();
    if (st.ui.guide >= 0) { for (var i = 0; i < GUIDE.length; i++) { if (GUIDE[i][0].split('/')[1] === route.view) { st.ui.guide = i; break; } } }
    save(); render(true);
  }
  window.addEventListener('hashchange', go);

  function scrollToDetail() { var d = document.getElementById('detail') || document.getElementById('cell-detail'); if (d && window.innerWidth < 860) { var top = d.getBoundingClientRect().top + window.scrollY - 110; window.scrollTo(0, top); } }

  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-act]'); if (!t) return;
    var a = t.getAttribute('data-act'), v = t.getAttribute('data-v');
    var e = exp(st.ui.exp), c = cre(st.ui.cr), ag = agent(st.ui.agent);
    var rer = true, toDetail = false;
    switch (a) {
      case 'reset': localStorage.removeItem(KEY); st = seed(); location.hash = '#/pulse'; toast('Demo reset to sample data'); break;
      case 'guide-start': st.ui.guide = 0; break;
      case 'g-next': st.ui.guide = Math.min(GUIDE.length - 1, st.ui.guide + 1); save(); location.hash = GUIDE[st.ui.guide][0]; return;
      case 'g-prev': st.ui.guide = Math.max(0, st.ui.guide - 1); save(); location.hash = GUIDE[st.ui.guide][0]; return;
      case 'g-end': st.ui.guide = -1; break;
      case 'metric': st.ui.metric = v; break;
      case 'pmetric': st.ui.pmetric = v; break;
      case 'cell': st.ui.cell = v; toDetail = true; break;
      case 'draft-test':
        var p = st.ui.cell.split('|'), cl = S.cells.filter(function (x) { return x.ch === p[0] && x.geo === p[1]; })[0];
        var id = 'E-' + (111 + st.experiments.filter(function (x) { return x.fromCell; }).length);
        st.experiments.push({ id: id, fromCell: st.ui.cell, title: CH[p[0]].short + ' ' + p[1] + ': ' + (cl.flag || 'improve cost per activated'), ch: p[0], geo: p[1], persona: 'All', owner: 'Hypothesis agent (from Signals)', stage: 'proposed', day: 0, days: 14, budget: 0,
          hypothesis: 'Drafted from the ' + CH[p[0]].name + ' ' + p[1] + ' signal. ' + (cl.flag ? cl.flag + '. ' : '') + 'Test a fix and judge it on cost per activated workspace with the W4 retention guardrail.', baseline: { rate: +(cl.activated / cl.signups).toFixed(2), traffic: Math.max(100, Math.round(cl.signups / 7)) }, mde: 0.1, qa: [], result: null, agentRec: null, agentWhy: '' });
        log('Drafted ' + id + ' from Signals', CH[p[0]].name + ' ' + p[1]); toast(id + ' drafted. Find it in Tests.'); break;
      case 'stage': st.ui.stage = v; break;
      case 'exp': st.ui.exp = v; toDetail = true; break;
      case 'run-qa':
        e.qa = [['Audience overlap with other live tests under 10%', true, '2% overlap'], ['Holdout cell set and clean', true, 'OK'], ['Signup and activation events firing', true, 'OK'], ['Budget cap set', true, '$1,500 per day'],
          ['Creative passes quality bar', e.id !== 'E-110' || cre('C-09').status === 'approved', e.id === 'E-110' && cre('C-09').status !== 'approved' ? 'C-09 is not approved yet' : 'All variants pass']];
        e.stage = 'qa'; e.budget = e.budget || 1500; log('Ran QA on ' + e.id); break;
      case 'fix-qa': e.qa[+v][1] = true; e.qa[+v][2] = +v === 0 ? 'Fixed: E-101 ad sets excluded, 4% overlap' : 'Fixed: failing variant swapped'; log('Fixed QA on ' + e.id, e.qa[+v][0]); break;
      case 'launch': e.stage = 'live'; e.day = 0; log('Launched ' + e.id); toast(e.id + ' is live (sample)'); break;
      case 'discard': st.experiments = st.experiments.filter(function (x) { return x.id !== e.id; }); log('Discarded idea ' + e.id); st.ui.exp = st.experiments[0].id; break;
      case 'dtype': st.ui.decide[e.id] = st.ui.decide[e.id] || {}; st.ui.decide[e.id].type = v; break;
      case 'use-rule': var rr = rule(e); st.ui.decide[e.id] = { type: rr.type, reason: rr.why }; break;
      case 'decide':
        var d = st.ui.decide[e.id] || {}; var ta = document.getElementById('dreason'); if (ta) d.reason = ta.value;
        var err = !d.type ? 'Pick a decision.' : (!d.reason || d.reason.trim().length < 12) ? 'Add a reason of at least a few words.' : '';
        if (err) { document.getElementById('derr').textContent = err; return; }
        if (d.type === 'extend') { e.days += 7; e.stage = 'live'; log('Extended ' + e.id + ' by 7 days', d.reason); }
        else { e.decision = { type: d.type, reason: d.reason.trim(), by: 'Ami (sample PM)', at: now() }; e.stage = 'decided'; log(DLAB[d.type] + ' ' + e.id, d.reason.trim()); }
        delete st.ui.decide[e.id];
        if (e.agentRec && rule(e) && e.agentRec !== rule(e).type) log('Sent ' + e.id + ' to Evaluator', 'Agent recommendation disagreed with the rule');
        toast('Decision saved for ' + e.id);
        var next = st.experiments.filter(function (x) { return x.stage === 'read'; })[0]; if (next) st.ui.exp = next.id;
        break;
      case 'cfilter': st.ui.cfilter = v; break;
      case 'cr': st.ui.cr = v; st.ui.edit = null; toDetail = true; break;
      case 'ed-start': st.ui.edit = { id: c.id, headline: c.headline, body: c.body }; break;
      case 'ed-cancel': st.ui.edit = null; break;
      case 'ed-save': c.headline = st.ui.edit.headline.trim(); c.body = st.ui.edit.body.trim(); if (c.mt && c.lang === 'ja' && !/しなさい/.test(c.headline + c.body)) c.mt = false; st.ui.edit = null; var g2 = grade(c); log('Edited ' + c.id, g2.pass ? 'Now passes the bar' : 'Still blocked'); toast(g2.pass ? c.id + ' passes the bar' : c.id + ' is still blocked'); break;
      case 'approve': c.status = 'approved'; log('Approved ' + c.id + ' for duplicator', c.headline); toast(c.id + ' approved'); break;
      case 'pause': c.status = 'paused'; log('Paused ' + c.id, 'Failed or pulled from the quality bar'); toast(c.id + ' paused'); break;
      case 'relive': c.status = 'live'; log('Put ' + c.id + ' back live'); break;
      case 'agent': st.ui.agent = v; toDetail = true; break;
      case 'aut': ag.autonomy = v; log(ag.name + ' autonomy set to ' + v); break;
      case 'pcap': st.pacerCap = t.checked; log(st.pacerCap ? 'Added 15% daily shift cap to Budget pacer' : 'Removed daily shift cap'); break;
      case 'jakeep': st.graderJaKeep = t.checked; break;
      case 'promote': log('Promoted ' + ag.name + ' ' + ag.pending.version, ag.pending.note + (ag.id === 'A-2' && st.pacerCap ? ' With 15% daily cap.' : '')); ag.version = ag.pending.version; ag.pending = null; toast(ag.name + ' promoted to ' + ag.version); break;
      case 'reject': log('Rejected ' + ag.name + ' ' + ag.pending.version, 'Kept ' + ag.version); ag.pending = null; toast('Change rejected. ' + ag.version + ' stays live.'); break;
      case 'keepgpt': st.keepChatgpt = t.checked; break;
      case 'sign':
        if (!st.fin.name.trim() || st.fin.note.trim().length < 4) { document.getElementById('ferr').textContent = 'Add a name and a short note.'; return; }
        st.fin.ok = true; log('Strat Fin signed off', st.fin.name + ': ' + st.fin.note); break;
      case 'unsign': st.fin.ok = false; break;
      case 'graduate': st.graduated = { share: st.share, at: now() }; log('Graduated program to ' + st.share + '% of paid spend', 'All 6 checks passed'); toast('Graduated to ' + st.share + '% (sample)'); break;
      case 'dl-memo': download('decision-memo-sample.md', memo(), 'text/markdown'); toast('Memo downloaded'); rer = false; break;
      case 'dl-csv': download('decision-log-sample.csv', csv(), 'text/csv'); toast('Decision log downloaded'); rer = false; break;
      default: rer = false;
    }
    save();
    if (rer) { render(false); if (toDetail) scrollToDetail(); }
  });

  document.addEventListener('input', function (ev) {
    var t = ev.target, k = t.getAttribute('data-in'); if (!k) return;
    var e = exp(st.ui.exp);
    if (k === 'pw') { var val = parseFloat(t.value); if (!isNaN(val) && val > 0) { if (t.getAttribute('data-k') === 'traffic') e.baseline.traffic = val; else if (t.getAttribute('data-k') === 'rate') e.baseline.rate = Math.min(0.95, val); else e.mde = val; document.getElementById('pw-out').innerHTML = powerText(power(e.baseline.rate, e.mde, e.baseline.traffic), e); save(); } }
    else if (k === 'reason') { st.ui.decide[e.id] = st.ui.decide[e.id] || {}; st.ui.decide[e.id].reason = t.value; save(); }
    else if (k === 'edh' || k === 'edb') {
      st.ui.edit[k === 'edh' ? 'headline' : 'body'] = t.value; var c = cre(st.ui.cr);
      var view = { headline: st.ui.edit.headline, body: st.ui.edit.body, ch: c.ch, lang: c.lang, mt: c.mt && /しなさい/.test(st.ui.edit.headline + st.ui.edit.body) };
      document.getElementById('scorebox').innerHTML = scoreBox(grade(view)); document.getElementById('adprev').innerHTML = adPreview(view); save();
    }
    else if (k === 'share') { st.share = +t.value; document.getElementById('share-v').textContent = st.share + '%'; var gm = document.getElementById('g-man'); if (gm) gm.textContent = kfmt(ALL.spend * st.share / 100); var gf = document.getElementById('g-fc'); if (gf) gf.textContent = money(ALL.cpa * (1 - st.share / 100 * improvement()), 2); save(); }
    else if (k === 'appr') { var n = parseInt(t.value, 10); if (!isNaN(n)) { st.approval = n; save(); } }
    else if (k === 'finn') { st.fin.name = t.value; save(); }
    else if (k === 'fint') { st.fin.note = t.value; save(); }
  });

  document.addEventListener('change', function (ev) {
    var k = ev.target.getAttribute('data-in');
    if (k === 'share' || k === 'appr') { render(false); var el = document.getElementById(k === 'share' ? 'share' : 'appr'); if (el) el.focus(); }
  });

  parse(); render(false);
})();
