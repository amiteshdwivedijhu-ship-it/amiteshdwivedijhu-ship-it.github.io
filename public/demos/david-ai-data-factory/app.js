/* Data Factory Console prototype. Static, no network calls. All data is SAMPLE DATA. */
(function () {
  'use strict';
  var S = window.SAMPLE;
  var LS_KEY = 'dfc-david-v1';
  var TODAY = '2026-10-26', BATCH_FROM = '2026-10-20', DUE = '2026-11-20';
  var DAYS_LEFT = 25;
  var LANG = {}; S.LANGS.forEach(function (l) { LANG[l.code] = l; });
  var ENV = {}; S.ENVS.forEach(function (e) { ENV[e.id] = e; });
  var CON = {}; S.contributors.forEach(function (c) { CON[c.id] = c; });
  var SES = {}; S.sessions.forEach(function (s) { SES[s.id] = s; });

  var DEFAULT_RULES = { minSnr: 15, maxBleed: -25, maxClip: 1.0, overlapMin: 5, overlapMax: 25, maxGap: 900, maxSilence: 30, minNat: 3.0, maxScripted: 0.6 };
  function defaults() {
    return {
      rules: JSON.parse(JSON.stringify(DEFAULT_RULES)),
      spec: JSON.parse(JSON.stringify(S.spec)),
      overrides: {}, paused: [], coached: [], promoted: [], queue: [],
      routing: { 'en-US': 'v2', 'en-IN': 'v2', 'es-MX': 'v2', 'hi-IN': 'v2' },
      gate: { minKappa: 0.55, maxDrop: 0.05 },
      waivers: {}, consentFixed: [], holdOver: false, released: null
    };
  }
  var st;
  try { st = JSON.parse(localStorage.getItem(LS_KEY)) || defaults(); } catch (e) { st = defaults(); }
  var d0 = defaults(); Object.keys(d0).forEach(function (k) { if (st[k] === undefined) st[k] = d0[k]; });
  function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(st)); } catch (e) {} }

  // ---------- helpers ----------
  function esc(x) { return String(x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(n, d) { return Number(n).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function money(n) { return '$' + fmt(n, 0); }
  function pct(n, d) { return fmt(n * 100, d || 0) + '%'; }
  function hrs(min) { return min / 60; }
  function dateLabel(iso) { var p = iso.split('-'); var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+p[1] - 1]; return m + ' ' + (+p[2]); }
  function addDays(iso, n) { var d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + Math.round(n)); return d.toISOString().slice(0, 10); }
  function isPaused(id) { return st.paused.indexOf(id) >= 0; }
  function pill(cls, txt) { return '<span class="pill ' + cls + '">' + esc(txt) + '</span>'; }
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
  }
  function download(name, text, type) {
    var blob = new Blob([text], { type: type || 'text/plain' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ---------- QA engine ----------
  function natFor(s) { return st.routing[s.lang] === 'v3' ? s.m.natV3 : s.m.nat; }
  function verdict(s) {
    var r = st.rules, m = s.m, hard = [], soft = [];
    if (m.snr < r.minSnr) hard.push('Low SNR');
    if (m.bleed > r.maxBleed) hard.push('Channel bleed');
    if (m.clip > r.maxClip) hard.push('Clipping');
    if (m.overlap < r.overlapMin) soft.push('Too little overlap');
    if (m.overlap > r.overlapMax) soft.push('Too much overlap');
    if (m.gap > r.maxGap) soft.push('Slow turn-taking');
    if (m.silence > r.maxSilence) soft.push('Long silence');
    if (natFor(s) < r.minNat) soft.push('Low naturalness (judge ' + st.routing[s.lang] + ')');
    if (m.scripted > r.maxScripted) soft.push('Sounds scripted');
    if (s.pii) soft.push('PII spoken');
    if (s.dup) soft.push('Duplicate voice');
    var o = st.overrides[s.id];
    if (o) return { v: o.v, hard: hard, soft: soft, src: 'human', reason: o.reason };
    if (isPaused(s.a) || isPaused(s.b)) return { v: 'hold', hard: hard, soft: soft.concat(['Contributor paused']), src: 'auto' };
    if (hard.length) return { v: 'reject', hard: hard, soft: soft, src: 'auto' };
    if (soft.length) return { v: 'review', hard: hard, soft: soft, src: 'auto' };
    return { v: 'accept', hard: hard, soft: soft, src: 'auto' };
  }
  var VLABEL = { accept: 'Accepted', reject: 'Rejected', review: 'Needs review', hold: 'On hold' };
  var VCLS = { accept: 'ok', reject: 'bad', review: 'warn', hold: 'plain' };
  function vpill(v) { return pill(VCLS[v.v], VLABEL[v.v] + (v.src === 'human' ? ' (human)' : '')); }
  function sessionCost(s, v) { return hrs(s.durMin) * 2 * st.spec.payPerHour + 1.2 + ((v.src === 'human' || v.v === 'review') ? 8 : 0); }

  function cellQuota(lang, env) { var sp = st.spec; return sp.targetHours * (sp.langShare[lang] / 100) * (sp.envShare[env] / 100); }
  function coverage() {
    var out = {};
    S.LANGS.forEach(function (L) {
      out[L.code] = {};
      S.ENVS.forEach(function (E) { out[L.code][E.id] = { hours: S.priorHours[L.code][E.id], sample: 0, speakers: S.priorSpeakers[L.code][E.id], spk: {}, accents: {}, quota: cellQuota(L.code, E.id) }; });
    });
    S.sessions.forEach(function (s) {
      var v = verdict(s); if (v.v !== 'accept') return;
      var c = out[s.lang][s.env], h = hrs(s.durMin);
      c.hours += h; c.sample += h;
      [s.a, s.b].forEach(function (id) { c.spk[id] = (c.spk[id] || 0) + h; });
      c.accents[s.accentA] = (c.accents[s.accentA] || 0) + h / 2; c.accents[s.accentB] = (c.accents[s.accentB] || 0) + h / 2;
    });
    return out;
  }
  function totals() {
    var acc = 0, rej = 0, rev = 0, hold = 0, accH = 0, cost = 0, reasons = {}, humanN = 0;
    S.sessions.forEach(function (s) {
      var v = verdict(s);
      cost += sessionCost(s, v);
      if (v.src === 'human') humanN++;
      if (v.v === 'accept') { acc++; accH += hrs(s.durMin); }
      else if (v.v === 'reject') rej++; else if (v.v === 'review') rev++; else hold++;
      if (v.v !== 'accept') v.hard.concat(v.soft).forEach(function (r) { var k = r.replace(/ \(judge.*\)/, ''); reasons[k] = (reasons[k] || 0) + 1; });
    });
    var prior = 0; S.LANGS.forEach(function (L) { S.ENVS.forEach(function (E) { prior += S.priorHours[L.code][E.id]; }); });
    return { acc: acc, rej: rej, rev: rev, hold: hold, accH: accH, cost: cost, reasons: reasons, prior: prior, humanN: humanN, toDate: prior + accH };
  }

  // ---------- judge math ----------
  function makeCM(n, p, kappa) {
    var pe = p * p + (1 - p) * (1 - p), po = kappa * (1 - pe) + pe, d = Math.round(n * (1 - po));
    var pos = Math.round(n * p), fn = Math.ceil(d / 2), fp = Math.floor(d / 2);
    return { tp: pos - fn, fn: fn, fp: fp, tn: n - pos - fp };
  }
  function kappaOf(cm) {
    var n = cm.tp + cm.fn + cm.fp + cm.tn, po = (cm.tp + cm.tn) / n;
    var ph = (cm.tp + cm.fn) / n, pj = (cm.tp + cm.fp) / n, pe = ph * pj + (1 - ph) * (1 - pj);
    return (po - pe) / (1 - pe);
  }
  function cmFor(ver, item, lang) {
    if (lang === 'all') {
      var t = { tp: 0, fn: 0, fp: 0, tn: 0 };
      S.LANGS.forEach(function (L) { var c = cmFor(ver, item, L.code); t.tp += c.tp; t.fn += c.fn; t.fp += c.fp; t.tn += c.tn; });
      return t;
    }
    return makeCM(50, S.HUMAN_ACCEPT[lang], S.KAPPA[ver][item][lang]);
  }
  function K(ver, item, lang) { return kappaOf(cmFor(ver, item, lang)); }
  function gateFails(routing) {
    var fails = [];
    S.LANGS.forEach(function (L) {
      var ver = routing[L.code];
      S.RUBRIC.forEach(function (it) {
        var k = K(ver, it.id, L.code), base = K('v2', it.id, L.code);
        if (k < st.gate.minKappa) fails.push({ lang: L.code, item: it.name, why: 'kappa ' + fmt(k, 2) + ' is under ' + fmt(st.gate.minKappa, 2), ver: ver });
        else if (base - k > st.gate.maxDrop) fails.push({ lang: L.code, item: it.name, why: 'drops ' + fmt(base - k, 2) + ' vs v2 (max ' + fmt(st.gate.maxDrop, 2) + ')', ver: ver });
      });
    });
    return fails;
  }

  // ---------- release batch ----------
  function batchSessions() {
    return S.sessions.filter(function (s) {
      if (s.date < BATCH_FROM) return false;
      if (st.holdOver && s.lang === 'en-US' && s.env === 'quiet') return false;
      return true;
    });
  }
  function releaseChecks() {
    var b = batchSessions(), cov = coverage(), checks = [];
    var vs = b.map(function (s) { return { s: s, v: verdict(s) }; });
    var review = vs.filter(function (x) { return x.v.v === 'review'; });
    checks.push({ id: 'review', name: 'Review queue is clear for this batch', pass: review.length === 0, detail: review.length ? review.length + ' sessions still need a human decision.' : 'Every session has an auto or human decision.', act: review.length ? '<a class="btn sm ghost" href="#/sessions?v=review&batch=1">Open review queue</a>' : '' });
    var pii = vs.filter(function (x) { return x.s.pii && x.v.src !== 'human' && x.v.v !== 'hold'; });
    checks.push({ id: 'pii', name: 'No open PII flags', pass: pii.length === 0, detail: pii.length ? pii.length + ' sessions have a spoken phone number with no decision.' : 'All PII flags were decided by a person.', act: pii.length ? '<a class="btn sm ghost" href="#/sessions?flag=pii&batch=1">See PII sessions</a>' : '' });
    var dup = vs.filter(function (x) { return x.s.dup && x.v.src !== 'human' && x.v.v !== 'hold'; });
    checks.push({ id: 'dup', name: 'No open duplicate-voice flags', pass: dup.length === 0, detail: dup.length ? dup.length + ' sessions may have one person on two accounts (C-2291 and C-3307).' : 'Duplicate-voice sessions are decided or on hold.', act: dup.length ? '<a class="btn sm ghost" href="#/contributors/C-3307">Open contributor</a>' : '' });
    var gf = gateFails(st.routing);
    checks.push({ id: 'judge', name: 'Live audio judge passes the calibration gate', pass: gf.length === 0, detail: gf.length ? gf.length + ' slice(s) fail: ' + gf.slice(0, 2).map(function (f) { return f.lang + ' ' + f.item + ' (' + f.why + ')'; }).join('; ') : 'Every language uses a judge version that passes on the golden set.', act: gf.length ? '<a class="btn sm ghost" href="#/judge">Open judge calibration</a>' : '' });
    var over = [];
    S.LANGS.forEach(function (L) { S.ENVS.forEach(function (E) { var c = cov[L.code][E.id]; if (c.hours / c.quota > 1.2) over.push(L.code + ' ' + E.name + ' at ' + pct(c.hours / c.quota)); }); });
    var waived = !!st.waivers.balance;
    checks.push({ id: 'balance', name: 'Coverage stays balanced (no cell over 120% of quota)', pass: over.length === 0 || st.holdOver, waived: waived && over.length > 0 && !st.holdOver, detail: over.length && !st.holdOver ? 'Over quota: ' + over.join(', ') + '. Buyer spec asks for a balanced mix.' : (st.holdOver ? 'Extra en-US quiet-room sessions are held back from this batch.' : 'All cells are within range.'), act: over.length && !st.holdOver ? '<button class="btn sm" data-act="holdover">Hold extra en-US quiet sessions</button>' + (waived ? '' : '<button class="btn sm ghost" data-act="waive" data-id="balance">Waive with reason</button>') : '' });
    var noConsent = vs.filter(function (x) { return x.v.v === 'accept' && !x.s.consent && st.consentFixed.indexOf(x.s.id) < 0; });
    checks.push({ id: 'manifest', name: 'Manifest is valid (2 channels, 48 kHz, transcript, consent ID)', pass: noConsent.length === 0, detail: noConsent.length ? noConsent.map(function (x) { return x.s.id; }).join(', ') + ' missing consent_id.' : 'All accepted sessions have every required field.', act: noConsent.length ? '<button class="btn sm" data-act="fixconsent">Re-link consent records</button>' : '' });
    return { checks: checks, batch: b, vs: vs };
  }

  // ---------- views ----------
  var VIEWS = [
    { id: 'pulse', name: 'Pulse' }, { id: 'spec', name: 'Spec to plan' }, { id: 'sessions', name: 'Session QA' },
    { id: 'coverage', name: 'Coverage' }, { id: 'judge', name: 'Judge calibration' }, { id: 'contributors', name: 'Contributors' }, { id: 'release', name: 'Release gate' }
  ];
  function route() {
    var h = location.hash.replace(/^#\/?/, '') || 'pulse';
    var q = {}, qi = h.indexOf('?');
    if (qi >= 0) { h.slice(qi + 1).split('&').forEach(function (kv) { var p = kv.split('='); q[p[0]] = decodeURIComponent(p[1] || ''); }); h = h.slice(0, qi); }
    var parts = h.split('/');
    return { view: parts[0], id: parts[1], q: q };
  }

  function renderTabs(cur) {
    var t = totals(), rc = releaseChecks(), open = rc.checks.filter(function (c) { return !c.pass && !c.waived; }).length;
    document.getElementById('tabs').innerHTML = VIEWS.map(function (v) {
      var cnt = v.id === 'sessions' && t.rev ? '<span class="cnt">' + t.rev + '</span>' : v.id === 'release' && open ? '<span class="cnt">' + open + '</span>' : '';
      return '<a href="#/' + v.id + '"' + (v.id === cur ? ' aria-current="page"' : '') + '>' + v.name + cnt + '</a>';
    }).join('');
    document.getElementById('projChip').innerHTML = '<b>' + esc(S.project.name) + '</b> · ' + esc(S.project.buyer) + ' · due ' + dateLabel(DUE);
  }

  // ----- Pulse -----
  function viewPulse() {
    var t = totals(), cov = coverage(), sp = st.spec;
    var acc7 = 0;
    S.sessions.forEach(function (s) { if (s.date >= '2026-10-20' && verdict(s).v === 'accept') acc7 += hrs(s.durMin); });
    var perDay = acc7 / 7, remaining = Math.max(0, sp.targetHours - t.toDate), finishDays = perDay ? remaining / perDay : 999;
    var finish = addDays(TODAY, finishDays), late = finish > DUE;
    var gf = gateFails(st.routing);
    var kNat = 0; S.LANGS.forEach(function (L) { kNat += K(st.routing[L.code], 'nat', L.code); }); kNat /= 4;
    var h = '<div class="head"><div><div class="eyebrow">Factory pulse</div><h1>' + esc(S.project.name) + ': ' + fmt(t.toDate) + ' of ' + fmt(sp.targetHours) + ' accepted hours</h1>' +
      '<p>Full-duplex, channel-separated support-style conversations in 4 languages for ' + esc(S.project.buyer) + '. Sample window shows 240 sessions recorded Oct 13 to Oct 26, 2026.</p></div>' +
      '<div class="btns"><a class="btn blue" href="#/release">Go to release gate</a><a class="btn ghost" href="#/sessions?v=review">Review queue (' + t.rev + ')</a></div></div>';
    h += '<div class="grid g5 kpis">' +
      kpi('Accepted hours to date', fmt(t.toDate), pct(t.toDate / sp.targetHours) + ' of target', t.toDate / sp.targetHours) +
      kpi('Accept rate (sample)', pct(t.acc / Math.max(1, S.sessions.length)), t.rej + ' rejected · ' + t.rev + ' in review') +
      kpi('Cost per accepted hour', money(t.cost / Math.max(1, t.accH)), 'pay $' + sp.payPerHour + '/hr x 2 speakers + QA') +
      kpi('Forecast finish', dateLabel(finish), (late ? '<span class="down">' + Math.round((new Date(finish) - new Date(DUE)) / 864e5) + ' days after due date</span>' : '<span class="up">On time for ' + dateLabel(DUE) + '</span>') + '<br>Bottleneck: ' + bottleneck(cov)) +
      kpi('Judge agreement (naturalness)', 'κ ' + fmt(kNat, 2), gf.length ? '<span class="down">' + gf.length + ' gate failure(s)</span>' : '<span class="up">Gate passing</span>') + '</div>';

    h += '<div class="grid split mt"><div class="card"><h2>Daily output, last 14 days</h2><p class="sub">Hours recorded per day, split by QA result. Sample data.</p>' + dailyChart() +
      '<div class="legend"><span><i style="background:var(--blue)"></i>Accepted</span><span><i style="background:#f0c24b"></i>Needs review or on hold</span><span><i style="background:var(--pink)"></i>Rejected</span></div></div>';
    h += '<div class="card"><h2>What needs you today</h2><p class="sub">Ranked by risk to the delivery date and to quality.</p>' + alerts(cov, gf, late, finish) + '</div></div>';

    var rs = Object.keys(t.reasons).map(function (k) { return [k, t.reasons[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 8);
    var mx = rs.length ? rs[0][1] : 1;
    h += '<div class="grid g2 mt"><div class="card"><h2>Why sessions do not pass</h2><p class="sub">Flags on sessions that are not accepted. One session can have more than one.</p>' +
      rs.map(function (r) { return '<div class="hbar"><span>' + esc(r[0]) + '</span><span class="tr"><i style="width:' + (r[1] / mx * 100) + '%"></i></span><b>' + r[1] + '</b></div>'; }).join('') + '</div>';
    h += '<div class="card"><h2>Coverage by language</h2><p class="sub">Accepted hours vs. quota from the buyer spec.</p>' + S.LANGS.map(function (L) {
      var a = 0, q = 0; S.ENVS.forEach(function (E) { a += cov[L.code][E.id].hours; q += cellQuota(L.code, E.id); });
      var p = a / q;
      return '<div class="mt8"><div style="display:flex;justify-content:space-between;gap:8px;font-size:15px"><span>' + esc(L.name) + '</span><span class="num">' + fmt(a) + ' / ' + fmt(q) + ' h · <b>' + pct(p) + '</b></span></div><div class="bar"><i style="width:' + Math.min(100, p * 100) + '%;background:' + (p < 0.7 ? 'var(--pink)' : 'var(--blue)') + '"></i></div></div>';
    }).join('') + '<p class="mt"><a href="#/coverage">Open coverage map</a></p></div></div>';
    return h;
  }
  function bottleneck(cov) {
    var worst = null;
    S.LANGS.forEach(function (L) { var a = 0, q = 0; S.ENVS.forEach(function (E) { a += cov[L.code][E.id].hours; q += cov[L.code][E.id].quota; }); var p = a / q; if (!worst || p < worst.p) worst = { L: L, p: p, left: q - a }; });
    return worst.L.code + ', ' + fmt(Math.max(0, worst.left)) + ' h left';
  }
  function kpi(label, val, sub, bar) {
    return '<div class="card kpi"><span>' + esc(label) + '</span><b>' + val + '</b><small>' + sub + '</small>' + (bar !== undefined ? '<div class="bar"><i style="width:' + Math.min(100, bar * 100) + '%"></i></div>' : '') + '</div>';
  }
  function dailyChart() {
    var days = []; for (var d = 13; d <= 26; d++) days.push('2026-10-' + String(d).padStart(2, '0'));
    var data = days.map(function (dd) { var o = { a: 0, r: 0, w: 0 }; S.sessions.forEach(function (s) { if (s.date !== dd) return; var v = verdict(s).v, h = hrs(s.durMin); if (v === 'accept') o.a += h; else if (v === 'reject') o.r += h; else o.w += h; }); return o; });
    var max = Math.max.apply(null, data.map(function (o) { return o.a + o.r + o.w; })) * 1.15 || 1;
    var W = 700, H = 220, pad = 34, bw = (W - pad) / days.length;
    var svg = '<svg class="chart" viewBox="0 0 ' + W + ' ' + (H + 26) + '" role="img" aria-label="Daily hours by QA result">';
    for (var g = 0; g <= 4; g++) { var y = H - (H - 10) * g / 4; svg += '<line x1="' + pad + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="#e4e5dc"/><text x="0" y="' + (y + 4) + '" font-size="13" fill="#686963">' + fmt(max * g / 4) + 'h</text>'; }
    data.forEach(function (o, i) {
      var x = pad + i * bw + bw * 0.18, w = bw * 0.64, y = H, sc = (H - 10) / max;
      [['a', '#2d62ff'], ['w', '#f0c24b'], ['r', '#dd23bb']].forEach(function (k) { var hh = o[k[0]] * sc; if (hh > 0) { y -= hh; svg += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '" rx="3" fill="' + k[1] + '"><title>' + dateLabel(days[i]) + ': ' + fmt(o[k[0]], 1) + 'h</title></rect>'; } });
      if (i % 2 === 0) svg += '<text x="' + (x + w / 2) + '" y="' + (H + 18) + '" font-size="13" text-anchor="middle" fill="#686963">' + dateLabel(days[i]) + '</text>';
    });
    return svg + '</svg>';
  }
  function alerts(cov, gf, late, finish) {
    var list = [], gaps = [];
    S.LANGS.forEach(function (L) { S.ENVS.forEach(function (E) { var c = cov[L.code][E.id]; if (c.hours / c.quota < 0.5) gaps.push({ L: L, E: E, c: c }); }); });
    gaps.sort(function (a, b) { return a.c.hours / a.c.quota - b.c.hours / b.c.quota; });
    gaps.slice(0, 2).forEach(function (g) { list.push(['bad', '!', g.L.code + ' ' + g.E.name + ' is at ' + pct(g.c.hours / g.c.quota) + ' of quota', fmt(g.c.quota - g.c.hours) + ' hours short with ' + DAYS_LEFT + ' days left. Only ' + g.L.active + ' active ' + g.L.code + ' contributors.', '#/coverage/' + g.L.code + '.' + g.E.id, 'Plan batch']); });
    var dupOpen = S.sessions.filter(function (s) { var v = verdict(s); return s.dup && v.src !== 'human' && v.v !== 'hold'; }).length;
    if (dupOpen) list.push(['bad', '!', 'Possible duplicate voice on two accounts', 'C-2291 and C-3307 match at 0.94. ' + dupOpen + ' sessions affected.', '#/contributors/C-3307', 'Review']);
    var scr = S.sessions.filter(function (s) { return (s.a === 'C-2418' || s.b === 'C-2418') && verdict(s).v === 'review'; }).length;
    if (scr && !isPaused('C-2418')) list.push(['warn', '?', 'C-2418 sounds scripted', 'Long gaps, almost no overlap, judge says scripted. ' + scr + ' sessions in review.', '#/contributors/C-2418', 'Open']);
    if (gf.length) list.push(['bad', 'κ', 'Live judge fails calibration on ' + gf.length + ' slice(s)', gf[0].lang + ' ' + gf[0].item + ': ' + gf[0].why + '.', '#/judge', 'Fix']);
    else list.push(['blue', 'κ', 'Judge v3 is ready for review', 'Better on scripted speech in all 4 languages. Check the hi-IN slice before shipping.', '#/judge', 'Compare']);
    if (late) list.push(['warn', '⏱', 'Forecast is after the due date', 'At the last 7-day pace the project lands ' + dateLabel(finish) + '. Recruiting for the short cells is the main lever.', '#/spec', 'Re-plan']);
    if (st.queue.length) list.push(['blue', '+', st.queue.length + ' targeted batch(es) queued', st.queue.map(function (q) { return q.label; }).join(', '), '#/coverage', 'View']);
    return list.map(function (a) { return '<div class="alert ' + a[0] + '"><span class="ic" aria-hidden="true">' + a[1] + '</span><div class="body"><b>' + esc(a[2]) + '</b><p>' + esc(a[3]) + '</p></div><a class="btn sm ghost" href="' + a[4] + '">' + a[5] + '</a></div>'; }).join('');
  }

  // ----- Spec to plan -----
  function planRows() {
    var sp = st.spec, cov = coverage();
    var weeksLeft = Math.max(0.5, DAYS_LEFT / 7 + (sp.weeks - 6));
    return S.LANGS.map(function (L) {
      var quota = sp.targetHours * sp.langShare[L.code] / 100, have = 0;
      S.ENVS.forEach(function (E) { have += cov[L.code][E.id].hours; });
      var rem = Math.max(0, quota - have);
      var sessions = rem / (sp.avgSessionMin / 60) / L.accept;
      var spkHours = sessions * sp.avgSessionMin / 60 * 2;
      var perWeek = spkHours / weeksLeft / sp.hoursPerContributorWeek;
      var active = L.active + st.queue.filter(function (q) { return q.lang === L.code; }).reduce(function (a, q) { return a + q.contributors; }, 0);
      var cost = spkHours * sp.payPerHour + sessions * 1.2 + sessions * (1 - L.accept) * 8;
      return { L: L, quota: quota, have: have, rem: rem, sessions: sessions, spkHours: spkHours, perWeek: perWeek, active: active, cost: cost, short: perWeek > active, weeksLeft: weeksLeft };
    });
  }
  function viewSpec() {
    var sp = st.spec, rows = planRows();
    var sumL = 0, sumE = 0; Object.keys(sp.langShare).forEach(function (k) { sumL += sp.langShare[k]; }); Object.keys(sp.envShare).forEach(function (k) { sumE += sp.envShare[k]; });
    var h = '<div class="head"><div><div class="eyebrow">Spec to plan</div><h1>Turn a buyer request into a collection plan</h1><p>Edit the spec. The plan, capacity check, and cost update live. Quotas here drive the coverage map and the release gate.</p></div></div>';
    h += '<div class="stepper">' + ['Hypothesize', 'Design', 'Experiment', 'Evaluate and iterate', 'Productionize', 'Release'].map(function (n, i) {
      return '<div class="step ' + (i < S.project.stage ? 'done' : i === S.project.stage ? 'now' : '') + '"><b>' + (i + 1) + '. ' + n + '</b>' + (i < S.project.stage ? 'Done' : i === S.project.stage ? 'Now' : 'Next') + '</div>';
    }).join('') + '</div>';
    h += '<div class="grid split-r"><div class="card"><h2>Buyer request</h2><p class="sub">' + esc(S.project.buyer) + ' · received ' + esc(S.project.startDate) + '</p><blockquote style="margin:0 0 14px;padding:12px 14px;border-left:3px solid var(--pink);background:var(--bg);border-radius:8px">' + esc(S.project.request) + '</blockquote>' +
      '<h3>Pilot result (20 hours)</h3><dl class="kv mt8"><dt>Accept rate</dt><dd>' + pct(S.pilot.accept) + '</dd><dt>Judge agreement</dt><dd>κ ' + fmt(S.pilot.agreement, 2) + '</dd><dt>Model impact</dt><dd>' + esc(S.pilot.impact) + '</dd></dl>' +
      '<h3 class="mt">Spec</h3>' +
      num('targetHours', 'Target accepted hours', sp.targetHours, 100, 5000, 50) + num('weeks', 'Plan length (weeks)', sp.weeks, 2, 20, 1) + num('avgSessionMin', 'Average session (minutes)', sp.avgSessionMin, 10, 60, 1) +
      num('payPerHour', 'Contributor pay per hour ($, sample)', sp.payPerHour, 15, 60, 1) + num('hoursPerContributorWeek', 'Hours a contributor records per week', sp.hoursPerContributorWeek, 1, 15, 1) +
      '<h3 class="mt">Language mix ' + (sumL !== 100 ? pill('bad', 'Sums to ' + sumL + '%') : pill('ok', '100%')) + '</h3>' +
      S.LANGS.map(function (L) { return slider('lang.' + L.code, L.name, sp.langShare[L.code], 0, 80, 5, '%'); }).join('') +
      '<h3 class="mt">Environment mix ' + (sumE !== 100 ? pill('bad', 'Sums to ' + sumE + '%') : pill('ok', '100%')) + '</h3>' +
      S.ENVS.map(function (E) { return slider('env.' + E.id, E.name, sp.envShare[E.id], 0, 60, 5, '%'); }).join('') +
      '<h3 class="mt">Shape of the data</h3><dl class="kv mt8"><dt>Channels</dt><dd>2, one per speaker (full duplex)</dd><dt>Sample rate</dt><dd>48 kHz, 24-bit</dd><dt>Overlap target</dt><dd>' + sp.overlapMin + '% to ' + sp.overlapMax + '% of talk time</dd><dt>Min SNR</dt><dd>' + sp.minSnr + ' dB</dd><dt>Speaker cap</dt><dd>No speaker over ' + sp.maxSpeakerShare + '% of hours in a cell</dd></dl></div>';

    var tot = rows.reduce(function (a, r) { a.rem += r.rem; a.cost += r.cost; a.sessions += r.sessions; return a; }, { rem: 0, cost: 0, sessions: 0 });
    h += '<div><div class="card"><h2>Collection plan for the remaining work</h2><p class="sub">Uses each language\'s recent accept rate. ' + fmt(rows[0].weeksLeft, 1) + ' weeks left in the plan.</p><div class="tw"><table><thead><tr><th>Language</th><th class="n">Quota h</th><th class="n">Accepted h</th><th class="n">Left h</th><th class="n">Accept rate</th><th class="n">Sessions to record</th><th class="n">Contributors / wk</th><th class="n">Active pool</th><th>Status</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr class="static"><td>' + r.L.code + '</td><td class="n">' + fmt(r.quota) + '</td><td class="n">' + fmt(r.have) + '</td><td class="n">' + fmt(r.rem) + '</td><td class="n">' + pct(r.L.accept) + '</td><td class="n">' + fmt(r.sessions) + '</td><td class="n">' + fmt(r.perWeek) + '</td><td class="n">' + fmt(r.active) + '</td><td>' + (r.rem === 0 ? pill('ok', 'Done') : r.short ? pill('bad', 'Short ' + fmt(r.perWeek - r.active)) : pill('ok', 'Fits')) + '</td></tr>'; }).join('') +
      '</tbody></table></div><div class="grid g3 kpis mt">' + kpi('Hours left', fmt(tot.rem), 'across 4 languages') + kpi('Est. cost to finish', money(tot.cost), 'pay + auto QA + human review') + kpi('Cost per accepted hour', money(tot.rem ? tot.cost / tot.rem : 0), 'blended, sample rates') + '</div></div>';
    var shortRows = rows.filter(function (r) { return r.short && r.rem > 0; });
    h += '<div class="card mt"><h2>Plan check</h2>';
    if (sumL !== 100 || sumE !== 100) h += '<div class="alert bad"><span class="ic">!</span><div class="body"><b>Mix does not add to 100%</b><p>Fix the language or environment sliders so quotas are real.</p></div></div>';
    if (!shortRows.length) h += '<div class="alert blue"><span class="ic">✓</span><div class="body"><b>Capacity fits the plan</b><p>Every language has enough active contributors at ' + sp.hoursPerContributorWeek + ' hours per week.</p></div></div>';
    shortRows.forEach(function (r) {
      var need = Math.ceil(r.perWeek - r.active), wNeed = Math.ceil(r.spkHours / r.active / sp.hoursPerContributorWeek + 6 - DAYS_LEFT / 7);
      h += '<div class="alert bad"><span class="ic">!</span><div class="body"><b>' + r.L.code + ' needs ' + fmt(r.perWeek) + ' contributors per week; ' + r.active + ' are active</b><p>Pick one. Each option updates the plan.</p><div class="btns mt8">' +
        '<button class="btn sm ghost" data-act="spec-weeks" data-v="' + wNeed + '">Extend plan to ' + wNeed + ' weeks</button>' +
        '<button class="btn sm ghost" data-act="spec-shift" data-id="' + r.L.code + '">Move 5% of ' + r.L.code + ' to en-US</button>' +
        '<button class="btn sm" data-act="recruit" data-id="' + r.L.code + '" data-v="' + need + '">Recruit ' + need + ' (adds about 1 week)</button></div></div></div>';
    });
    h += '<p class="note mt8">Pay, accept rates, and pool sizes are sample numbers. Recruiting goes into a queue here. Nothing is posted.</p></div></div></div>';
    return h;
  }
  function num(k, label, v, mn, mx, stp) { return '<div class="rule"><label for="sp-' + k + '">' + esc(label) + '</label><output>' + fmt(v) + '</output><input id="sp-' + k + '" type="range" min="' + mn + '" max="' + mx + '" step="' + stp + '" value="' + v + '" data-spec="' + k + '"></div>'; }
  function slider(k, label, v, mn, mx, stp, unit) { return '<div class="rule"><label for="sp-' + k + '">' + esc(label) + '</label><output>' + v + unit + '</output><input id="sp-' + k + '" type="range" min="' + mn + '" max="' + mx + '" step="' + stp + '" value="' + v + '" data-spec="' + k + '"></div>'; }

  // ----- Session QA -----
  var listLimit = 40, sortKey = 'date', sortDir = -1, sesFilter = {};
  function filteredSessions() {
    var f = sesFilter;
    return S.sessions.map(function (s) { return { s: s, v: verdict(s) }; }).filter(function (x) {
      var s = x.s;
      if (f.batch && s.date < BATCH_FROM) return false;
      if (f.lang && s.lang !== f.lang) return false;
      if (f.env && s.env !== f.env) return false;
      if (f.v && x.v.v !== f.v) return false;
      if (f.flag === 'pii' && !s.pii) return false;
      if (f.flag === 'dup' && !s.dup) return false;
      if (f.flag === 'hard' && !x.v.hard.length) return false;
      if (f.text) { var t = f.text.toLowerCase(); if ((s.id + ' ' + s.a + ' ' + s.b + ' ' + s.topic).toLowerCase().indexOf(t) < 0) return false; }
      return true;
    });
  }
  function viewSessions(r) {
    var q = r.q, f = sesFilter;
    if (q.v !== undefined) f.v = q.v; if (q.flag !== undefined) f.flag = q.flag; if (q.batch) f.batch = true; if (q.lang) f.lang = q.lang;
    var rows = filteredSessions();
    var keyf = { date: function (x) { return x.s.date + x.s.id; }, snr: function (x) { return x.s.m.snr; }, overlap: function (x) { return x.s.m.overlap; }, nat: function (x) { return natFor(x.s); }, dur: function (x) { return x.s.durMin; } }[sortKey];
    rows.sort(function (a, b) { var A = keyf(a), B = keyf(b); return (A > B ? 1 : A < B ? -1 : 0) * sortDir; });
    var sel = r.id && SES[r.id] ? SES[r.id] : null;
    var h = '<div class="head"><div><div class="eyebrow">Session QA</div><h1>Every session, scored before it ships</h1><p>Auto checks run on each recording. Hard fails are rejected. Soft flags go to a person. Change a rule and every verdict updates.</p></div><div class="btns"><button class="btn ghost" data-act="csv">Export CSV</button></div></div>';
    h += '<div class="grid split"><div class="card">' +
      '<div class="filters">' +
      '<label class="field">Search<input type="search" id="q-text" data-f="text" value="' + esc(f.text || '') + '" placeholder="Session, contributor, topic"></label>' +
      sel_('lang', 'Language', [['', 'All']].concat(S.LANGS.map(function (L) { return [L.code, L.code]; })), f.lang) +
      sel_('env', 'Environment', [['', 'All']].concat(S.ENVS.map(function (E) { return [E.id, E.name]; })), f.env) +
      sel_('v', 'Verdict', [['', 'All'], ['accept', 'Accepted'], ['review', 'Needs review'], ['reject', 'Rejected'], ['hold', 'On hold']], f.v) +
      sel_('flag', 'Flag', [['', 'Any'], ['hard', 'Hard fail'], ['pii', 'PII'], ['dup', 'Duplicate voice']], f.flag) +
      '<label class="field" style="flex-direction:row;align-items:center;gap:8px;min-height:44px;color:var(--ink)"><input type="checkbox" data-f="batch" ' + (f.batch ? 'checked' : '') + ' style="width:22px;height:22px"> Batch B-14 only</label></div>' +
      '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;align-items:center;margin-bottom:8px"><span class="note">' + rows.length + ' sessions match</span>' +
      (f.v === 'review' && rows.length ? '<span class="btns"><button class="btn sm ghost" data-act="bulk" data-v="reject">Reject all ' + rows.length + '</button><button class="btn sm ghost" data-act="bulk" data-v="accept">Accept all ' + rows.length + '</button></span>' : '') + '</div>' +
      (bulkOpen ? bulkForm(rows.length) : '') +
      '<div class="tw" style="max-height:640px"><table><thead><tr>' + th('date', 'Session') + '<th>Lang</th><th class="hide-m">Env</th>' + th('dur', 'Min', 1) + th('snr', 'SNR', 1) + th('overlap', 'Overlap', 1) + th('nat', 'Natural', 1) + '<th>Verdict</th><th class="hide-m">Flags</th></tr></thead><tbody>' +
      (rows.length ? rows.slice(0, listLimit).map(function (x) {
        var s = x.s, v = x.v;
        return '<tr data-go="#/sessions/' + s.id + '" class="' + (sel && sel.id === s.id ? 'sel' : '') + '"><td><b>' + s.id + '</b><div class="note">' + dateLabel(s.date) + '</div></td><td>' + s.lang + '</td><td class="hide-m">' + esc(ENV[s.env].name) + '</td><td class="n">' + s.durMin + '</td><td class="n ' + (s.m.snr < st.rules.minSnr ? 'bad-t' : '') + '">' + fmt(s.m.snr, 1) + '</td><td class="n ' + (s.m.overlap < st.rules.overlapMin || s.m.overlap > st.rules.overlapMax ? 'warn-t' : '') + '">' + fmt(s.m.overlap, 1) + '%</td><td class="n ' + (natFor(s) < st.rules.minNat ? 'warn-t' : '') + '">' + fmt(natFor(s), 1) + '</td><td>' + vpill(v) + '</td><td class="hide-m note">' + esc(v.hard.concat(v.soft).slice(0, 2).join(', ')) + '</td></tr>';
      }).join('') : '<tr class="static"><td colspan="9" class="empty">No sessions match these filters.</td></tr>') + '</tbody></table></div>' +
      (rows.length > listLimit ? '<p class="mt8"><button class="btn ghost sm" data-act="more">Show more (' + (rows.length - listLimit) + ' left)</button></p>' : '') +
      rulesCard() + '</div>';
    h += '<div>' + (sel ? sessionDetail(sel) : '<div class="card sticky" id="detail"><h2>Pick a session</h2><p class="note mt8">Tap any row to see both channels, the checks, the judge scores, and the transcript. Then accept or reject with a reason.</p><div class="btns mt"><button class="btn blue" data-act="openfirst">Open first in review</button></div></div>') + '</div></div>';
    return h;
  }
  var bulkOpen = null;
  function bulkForm(n) {
    return '<div class="alert warn"><span class="ic">!</span><div class="body"><b>' + (bulkOpen === 'accept' ? 'Accept' : 'Reject') + ' all ' + n + ' sessions in this view</b><p>A reason is required. It goes in the audit trail for each session.</p><div class="reason"><input type="text" id="bulkReason" aria-label="Bulk reason" value="' + (bulkOpen === 'accept' ? 'Spot-checked 5 of these, flags are minor' : 'Failed soft checks on review') + '" style="min-height:44px;border:1px solid var(--line2);border-radius:10px;padding:0 12px;font-size:16px"></div><div class="btns mt8"><button class="btn sm" data-act="bulk-do">Confirm</button><button class="btn sm ghost" data-act="bulk-cancel">Cancel</button></div></div></div>';
  }
  function th(k, label, n) { return '<th class="' + (n ? 'n' : '') + '"><button class="sortb" data-sort="' + k + '">' + label + (sortKey === k ? (sortDir > 0 ? ' ▲' : ' ▼') : '') + '</button></th>'; }
  function sel_(k, label, opts, cur) { return '<label class="field">' + label + '<select data-f="' + k + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + ((cur || '') === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>'; }
  function rulesCard() {
    var r = st.rules;
    function rr(k, label, mn, mx, stp, unit) { return '<div class="rule"><label for="r-' + k + '">' + label + '</label><output>' + r[k] + unit + '</output><input id="r-' + k + '" type="range" min="' + mn + '" max="' + mx + '" step="' + stp + '" value="' + r[k] + '" data-rule="' + k + '"></div>'; }
    return '<details class="mt" open><summary style="min-height:44px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;cursor:pointer"><h3>QA rules</h3><span class="note">Hard fails reject. Soft flags go to review.</span></summary>' +
      '<div class="grid g2"><div>' + rr('minSnr', 'Min SNR (hard)', 5, 30, 1, ' dB') + rr('maxBleed', 'Max channel bleed (hard)', -45, -10, 1, ' dB') + rr('maxClip', 'Max clipping (hard)', 0.2, 3, 0.1, '%') + rr('minNat', 'Min naturalness (soft)', 2, 4.5, 0.1, '') + '</div>' +
      '<div>' + rr('overlapMin', 'Min overlap (soft)', 0, 15, 1, '%') + rr('overlapMax', 'Max overlap (soft)', 15, 40, 1, '%') + rr('maxGap', 'Max median turn gap (soft)', 400, 1500, 50, ' ms') + rr('maxScripted', 'Max scripted score (soft)', 0.3, 0.95, 0.05, '') + '</div></div>' +
      '<p class="btns mt8"><button class="btn sm ghost" data-act="rules-reset">Reset rules</button></p></details>';
  }
  function sessionDetail(s) {
    var v = verdict(s), r = st.rules, m = s.m;
    function chk(label, val, lim, bad, warn) { return '<div class="chk ' + (bad ? 'bad' : warn ? 'warn' : '') + '"><div>' + label + '</div><div class="v">' + val + '</div><div class="lim">' + lim + (bad ? ' · fail' : warn ? ' · flag' : ' · ok') + '</div></div>'; }
    var h = '<div class="card sticky" id="detail"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;flex-wrap:wrap"><div><div class="eyebrow">' + s.lang + ' · ' + esc(ENV[s.env].name) + ' · ' + dateLabel(s.date) + '</div><h2>' + s.id + ': ' + esc(s.topic) + '</h2></div>' + vpill(v) + '</div>' +
      '<p class="note mt8">Speaker A <a href="#/contributors/' + s.a + '">' + s.a + '</a> (' + esc(s.accentA) + ') · Speaker B <a href="#/contributors/' + s.b + '">' + s.b + '</a> (' + esc(s.accentB) + ') · ' + s.durMin + ' min · 48 kHz · 2 ch</p>' +
      '<div class="wave mt8"><div class="lab"><span>A · ' + s.a + '</span><span>excerpt 0:00 to 1:30</span></div><canvas id="cvA" height="84" aria-label="Channel A waveform"></canvas><div class="lab"><span style="color:#ffaefe">B · ' + s.b + '</span><span>pink band = overlap</span></div><canvas id="cvB" height="84" aria-label="Channel B waveform"></canvas></div>' +
      '<div class="player"><button class="btn sm blue" data-act="play" id="playBtn" aria-label="Play excerpt">▶ Play</button><span class="seg"><button data-act="speed" data-v="1" aria-pressed="' + (speed === 1) + '">1x</button><button data-act="speed" data-v="3" aria-pressed="' + (speed === 3) + '">3x</button></span><span class="time" id="tm">0:00 / 1:30</span></div><p class="note">Visual playback drawn from sample numbers. No real audio. Tap a waveform to seek.</p>' +
      '<h3 class="mt">Auto checks</h3><div class="checks mt8">' +
      chk('Signal to noise', fmt(m.snr, 1) + ' dB', 'min ' + r.minSnr, m.snr < r.minSnr) +
      chk('Channel bleed', fmt(m.bleed, 1) + ' dB', 'max ' + r.maxBleed, m.bleed > r.maxBleed) +
      chk('Clipping', fmt(m.clip, 2) + '%', 'max ' + r.maxClip + '%', m.clip > r.maxClip) +
      chk('Overlap', fmt(m.overlap, 1) + '%', r.overlapMin + ' to ' + r.overlapMax + '%', false, m.overlap < r.overlapMin || m.overlap > r.overlapMax) +
      chk('Median turn gap', fmt(m.gap) + ' ms', 'max ' + r.maxGap, false, m.gap > r.maxGap) +
      chk('Silence', fmt(m.silence, 1) + '%', 'max ' + r.maxSilence + '%', false, m.silence > r.maxSilence) + '</div>' +
      '<h3 class="mt">Audio judge</h3><div class="checks mt8">' +
      chk('Naturalness v2', fmt(m.nat, 1) + ' / 5', (st.routing[s.lang] === 'v2' ? 'live' : 'not live') + ' · min ' + r.minNat, false, st.routing[s.lang] === 'v2' && m.nat < r.minNat) +
      chk('Naturalness v3', fmt(m.natV3, 1) + ' / 5', (st.routing[s.lang] === 'v3' ? 'live' : 'candidate') + ' · min ' + r.minNat, false, st.routing[s.lang] === 'v3' && m.natV3 < r.minNat) +
      chk('Scripted score', fmt(m.scripted, 2), 'max ' + r.maxScripted, false, m.scripted > r.maxScripted) +
      chk('Topic adherence', pct(m.adherence), 'info only', false, false) + '</div>' +
      (s.codeSwitch ? '<p class="note mt8">Speakers mix languages in the same turn (code-switching). This is normal speech for this group.</p>' : '') +
      ((s.pii || s.dup) ? '<div class="mt8">' + (s.pii ? '<div class="alert bad"><span class="ic">!</span><div class="body"><b>PII</b><p>' + esc(s.pii) + '. Redact or reject before release.</p></div></div>' : '') + (s.dup ? '<div class="alert bad"><span class="ic">!</span><div class="body"><b>Duplicate voice</b><p>Voice match 0.94 between C-2291 and C-3307. Could be one person on two accounts.</p></div></div>' : '') + '</div>' : '') +
      '<h3 class="mt">Transcript (excerpt' + (s.lang.indexOf('en') === 0 ? '' : ', English gloss') + ')</h3><div class="transcript mt8" id="tr">' + turns(s).filter(function (t) { return t.text; }).map(function (t) { return '<p data-t0="' + t.t0 + '" data-t1="' + t.t1 + '"><span class="spk ' + t.ch + '">' + t.ch + '</span><span class="note mono">' + clock(t.t0) + '</span> ' + esc(t.text) + '</p>'; }).join('') + '</div>' +
      '<h3 class="mt">Decision</h3>' + (v.src === 'human' ? '<p class="note mt8">Decided by you: ' + esc(VLABEL[v.v]) + '. Reason: ' + esc(v.reason || '') + '</p>' : '') +
      '<div class="reason"><input type="text" id="reason" placeholder="Reason (required), e.g. phone number redacted" aria-label="Reason" style="min-height:44px;border:1px solid var(--line2);border-radius:10px;padding:0 12px;font-size:16px"></div>' +
      '<div class="btns mt8"><button class="btn" data-act="decide" data-v="accept" data-id="' + s.id + '">Accept</button><button class="btn ghost" data-act="decide" data-v="reject" data-id="' + s.id + '">Reject</button>' + (v.src === 'human' ? '<button class="btn ghost" data-act="undo" data-id="' + s.id + '">Undo decision</button>' : '') + '<button class="btn ghost" data-act="nextreview">Next in review</button></div></div>';
    return h;
  }
  function clock(t) { t = Math.max(0, Math.floor(t)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); }
  var LINES = {
    support: [['A', 'Hi, yeah, um, I am calling about, uh, {topic}.'], ['B', 'Sure, I can help with that. Can I get the name on the account?'], ['A', 'Yeah it is under my name. Sorry, one sec, it is loud here.'], ['B', 'No problem, take your time.'], ['A', 'Okay so, the thing is, it was supposed to be fixed last week and'], ['B', 'Right, right, I see that note.'], ['A', 'and nobody called me back.'], ['B', 'I am sorry about that. Let me check what happened.'], ['A', 'Mm-hm.'], ['B', 'Okay, it looks like the request was closed by mistake.'], ['A', 'Wait, closed? So I have to start over?'], ['B', 'No, no, I can reopen it right now.'], ['A', 'Okay. Good. Thank you.'], ['B', 'Is there anything else I can help with?'], ['A', 'Actually, yes, one more thing'], ['B', 'Go ahead.']],
    casual: [['A', 'So did you end up doing it? {topic}?'], ['B', 'Oh my gosh, yes. Okay so'], ['A', 'Wait, wait, start from the beginning.'], ['B', 'Ha, okay. So Friday I was like, let us just try it.'], ['A', 'Mm-hm.'], ['B', 'And it was way harder than I thought.'], ['A', 'Right, that always happens to me too.'], ['B', 'Like, I had no plan at all.'], ['A', 'No plan is the best plan, honestly.'], ['B', 'Ha, maybe. But then my brother called and'], ['A', 'Oh no.'], ['B', 'Yeah. So that was the whole afternoon.'], ['A', 'Okay but was it worth it?'], ['B', 'Totally. I would do it again.']]
  };
  var turnCache = {};
  function turns(s) {
    if (turnCache[s.id]) return turnCache[s.id];
    var seed = s.seed, R = function () { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    var bank = LINES[s.kind], out = [], t = 0.6, li = 0;
    var gapS = s.m.gap / 1000, ovP = Math.min(0.6, s.m.overlap / 30);
    while (t < 90) {
      var line = bank[li % bank.length], dur = 1.6 + R() * 4.6, ch = line[0];
      out.push({ ch: ch, t0: t, t1: Math.min(90, t + dur), text: line[1].replace('{topic}', s.topic.toLowerCase()) });
      if (dur > 3 && R() < 0.6) { var bt = t + dur * (0.3 + R() * 0.4); out.push({ ch: ch === 'A' ? 'B' : 'A', t0: bt, t1: bt + 0.4, text: '', bc: true }); }
      var next = t + dur + (R() < ovP ? -(0.3 + R() * 1.0) : gapS * (0.6 + R() * 0.8));
      t = Math.max(t + 0.8, next); li++;
    }
    turnCache[s.id] = out; return out;
  }
  function envelope(s, ch) {
    var N = 900, a = new Float32Array(N), tl = turns(s), seed = s.seed + (ch === 'A' ? 1 : 2);
    var R = function () { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 4294967296; };
    var floor = 0.6 * Math.pow(10, -s.m.snr / 30);
    for (var i = 0; i < N; i++) a[i] = floor * (0.4 + R() * 0.6);
    function add(arr, tt, gain) {
      tt.forEach(function (t) { var i0 = Math.floor(t.t0 / 90 * N), i1 = Math.min(N, Math.ceil(t.t1 / 90 * N)); for (var i = i0; i < i1; i++) { var syl = 0.5 + 0.5 * Math.abs(Math.sin(i * 0.9 + t.t0)); var v = (t.bc ? 0.35 : 0.55 + R() * 0.4) * syl * gain; arr[i] = Math.max(arr[i], v); } });
    }
    add(a, tl.filter(function (t) { return t.ch === ch; }), 1);
    var bleedG = Math.pow(10, s.m.bleed / 20) * 2.2;
    if (bleedG > 0.03) { var other = new Float32Array(N); add(other, tl.filter(function (t) { return t.ch !== ch; }), 1); for (var j = 0; j < N; j++) a[j] = Math.max(a[j], other[j] * bleedG); }
    if (s.m.clip > st.rules.maxClip) { for (var k = 0; k < N; k++) if (a[k] > 0.8 && R() < 0.25) a[k] = 1; }
    return a;
  }
  var player = { t: 0, playing: false, raf: 0, last: 0, sid: null }, speed = 1;
  function drawWaves(s) {
    ['A', 'B'].forEach(function (ch) {
      var cv = document.getElementById('cv' + ch); if (!cv) return;
      var dpr = window.devicePixelRatio || 1, w = cv.clientWidth || 300, hh = 84;
      cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr);
      var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, hh);
      var tl = turns(s);
      c.fillStyle = 'rgba(221,35,187,.22)';
      tl.forEach(function (t) { if (t.bc) return; tl.forEach(function (u) { if (u === t || u.ch === t.ch || u.bc) return; var a0 = Math.max(t.t0, u.t0), a1 = Math.min(t.t1, u.t1); if (a1 > a0) c.fillRect(a0 / 90 * w, 0, (a1 - a0) / 90 * w, hh); }); });
      var env = envelope(s, ch), N = env.length, mid = hh / 2, played = player.t / 90 * w;
      for (var x = 0; x < w; x += 2) {
        var i = Math.floor(x / w * N), v = env[i], y = v * (mid - 3);
        c.fillStyle = v >= 1 ? '#ff5a4f' : x <= played ? (ch === 'A' ? '#8fb0ff' : '#ffaefe') : (ch === 'A' ? '#2d62ff' : '#dd23bb');
        c.fillRect(x, mid - y, 1.4, Math.max(1, y * 2));
      }
      c.fillStyle = '#fff'; c.fillRect(played, 0, 2, hh);
    });
    var tm = document.getElementById('tm'); if (tm) tm.textContent = clock(player.t) + ' / 1:30';
    var tr = document.getElementById('tr');
    if (tr) { var cur = null; tr.querySelectorAll('p').forEach(function (p) { var on = player.t >= +p.dataset.t0 && player.t < +p.dataset.t1; p.classList.toggle('now', on); if (on) cur = p; }); if (cur && player.playing) tr.scrollTop = cur.offsetTop - tr.offsetTop - 40; }
  }
  function tick(now) {
    if (!player.playing) return;
    var dt = (now - player.last) / 1000; player.last = now;
    player.t += dt * speed;
    if (player.t >= 90) { player.t = 90; stopPlay(); }
    var s = SES[player.sid]; if (s) drawWaves(s);
    if (player.playing) player.raf = requestAnimationFrame(tick);
  }
  function stopPlay() { player.playing = false; cancelAnimationFrame(player.raf); var b = document.getElementById('playBtn'); if (b) b.textContent = '▶ Play'; }

  // ----- Coverage -----
  function viewCoverage(r) {
    var cov = coverage(), sel = (r.id || 'hi-IN.cafe').split('.');
    var sl = sel[0], se = sel[1]; if (!LANG[sl] || !ENV[se]) { sl = 'hi-IN'; se = 'cafe'; }
    var h = '<div class="head"><div><div class="eyebrow">Coverage</div><h1>Where the dataset is thin</h1><p>Accepted hours vs. quota for each language and environment. Tap a cell to see accents, speaker spread, and a targeted batch plan.</p></div></div>';
    var gl = []; S.LANGS.forEach(function (L) { S.ENVS.forEach(function (E) { var c = cov[L.code][E.id]; gl.push({ k: L.code + '.' + E.id, n: L.code + ' ' + E.name, p: c.hours / c.quota }); }); });
    gl.sort(function (a, b) { return a.p - b.p; });
    h += '<div class="grid split"><div class="card"><h3>Biggest gaps</h3><div class="seg mt8" style="margin-bottom:14px">' + gl.slice(0, 4).map(function (g) { return '<button data-go="#/coverage/' + g.k + '" aria-pressed="' + (g.k === sl + '.' + se) + '">' + esc(g.n) + ' · ' + pct(g.p) + '</button>'; }).join('') + '</div><p class="note show-m" style="margin-bottom:8px">Swipe the map sideways to see every environment.</p><div class="tw" style="border:0"><div class="heat" style="grid-template-columns:72px repeat(5,minmax(92px,1fr));min-width:560px"><div class="hd"></div>' + S.ENVS.map(function (E) { return '<div class="hd">' + esc(E.name) + '</div>'; }).join('');
    S.LANGS.forEach(function (L) {
      h += '<div class="hd" style="align-items:center">' + L.code + '</div>';
      S.ENVS.forEach(function (E) {
        var c = cov[L.code][E.id], p = c.hours / c.quota;
        var bg = p < 0.5 ? '#fde8e8' : p < 0.8 ? '#fff2cc' : p <= 1.2 ? '#e3f4ea' : '#d9e5ff';
        var lab = p < 0.5 ? 'Gap' : p < 0.8 ? 'Behind' : p <= 1.2 ? 'On track' : 'Over';
        h += '<button class="cell" style="background:' + bg + '" data-go="#/coverage/' + L.code + '.' + E.id + '" aria-pressed="' + (L.code === sl && E.id === se) + '" aria-label="' + L.code + ' ' + esc(E.name) + ' ' + pct(p) + '"><span>' + lab + '</span><b>' + pct(p) + '</b><span class="num">' + fmt(c.hours) + ' / ' + fmt(c.quota) + ' h</span></button>';
      });
    });
    h += '</div></div><div class="legend"><span><i style="background:#fde8e8"></i>Gap, under 50%</span><span><i style="background:#fff2cc"></i>Behind, 50 to 80%</span><span><i style="background:#e3f4ea"></i>On track</span><span><i style="background:#d9e5ff"></i>Over 120%</span></div>';
    h += '<h3 class="mt">Targeted batch queue</h3>' + (st.queue.length ? '<ul class="list">' + st.queue.map(function (q, i) { return '<li><div><div class="t">' + esc(q.label) + '</div><div class="d">' + (q.sessions ? fmt(q.sessions) + ' sessions · ' : '') + q.contributors + ' contributors · ' + money(q.cost) + ' est.</div></div><button class="btn sm ghost" data-act="unqueue" data-v="' + i + '">Remove</button></li>'; }).join('') + '</ul>' : '<p class="note mt8">Nothing queued yet. Pick a gap cell and plan a batch.</p>') + '</div>';

    var c = cov[sl][se], L = LANG[sl], E = ENV[se], gap = Math.max(0, c.quota - c.hours);
    var spk = Object.keys(c.spk).map(function (k) { return [k, c.spk[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
    var topShare = spk.length && c.sample ? spk[0][1] / (c.sample * 2) : 0;
    var accents = L.accents.map(function (a) { return [a, c.accents[a] || 0]; });
    var amax = Math.max.apply(null, accents.map(function (a) { return a[1]; })) || 1;
    var sess = gap / (st.spec.avgSessionMin / 60) / L.accept, contribs = Math.ceil(sess * 2 * st.spec.avgSessionMin / 60 / st.spec.hoursPerContributorWeek / (DAYS_LEFT / 7));
    var cost = sess * st.spec.avgSessionMin / 60 * 2 * st.spec.payPerHour + sess * 1.2 + sess * (1 - L.accept) * 8;
    var queued = st.queue.some(function (q) { return q.key === sl + '.' + se; });
    h += '<div class="card sticky" id="detail"><div class="eyebrow">' + sl + ' · ' + esc(E.name) + '</div><h2>' + fmt(c.hours) + ' of ' + fmt(c.quota) + ' hours (' + pct(c.hours / c.quota) + ')</h2>' +
      '<dl class="kv mt8"><dt>Gap</dt><dd>' + fmt(gap) + ' hours</dd><dt>Accepted, last 14 days</dt><dd>' + fmt(c.sample, 1) + ' hours</dd><dt>Unique speakers</dt><dd>' + fmt(c.speakers + spk.length) + '</dd><dt>Top speaker share</dt><dd>' + (topShare ? pct(topShare) + ' of sample hours ' + (topShare > 0.1 ? pill('warn', 'Low spread') : '') : 'n/a') + '</dd><dt>Accept rate</dt><dd>' + pct(L.accept) + '</dd></dl>' +
      '<h3 class="mt">Accents in this cell (sample window)</h3>' + accents.map(function (a) { return '<div class="hbar"><span>' + esc(a[0]) + '</span><span class="tr"><i style="width:' + (a[1] / amax * 100) + '%;background:var(--blue)"></i></span><b>' + fmt(a[1], 1) + 'h</b></div>'; }).join('') +
      (gap > 0 ? '<h3 class="mt">Targeted batch plan</h3><div class="grid g2 kpis mt8">' + kpi('Sessions to record', fmt(sess), 'at ' + pct(L.accept) + ' accept') + kpi('Contributors needed', fmt(contribs), DAYS_LEFT + ' days, ' + st.spec.hoursPerContributorWeek + ' h/wk each') + kpi('Est. cost', money(cost), 'pay + QA') + kpi('Active pool', fmt(L.active), sl + ' today') + '</div>' +
        '<p class="note mt8">Batch brief: ' + esc(E.name.toLowerCase()) + ' recordings, 2 speakers on headphones, balance across ' + L.accents.length + ' accents, cap any speaker at ' + st.spec.maxSpeakerShare + '% of cell hours.</p>' +
        '<div class="btns mt8"><button class="btn blue" data-act="queue" data-id="' + sl + '.' + se + '" data-sess="' + Math.round(sess) + '" data-c="' + contribs + '" data-cost="' + Math.round(cost) + '"' + (queued ? ' disabled' : '') + '>' + (queued ? 'Queued' : 'Add batch to queue') + '</button><a class="btn ghost" href="#/sessions?lang=' + sl + '">See ' + sl + ' sessions</a></div>' : '<p class="mt">' + pill('ok', 'Quota met') + '</p>') + '</div></div>';
    return h;
  }

  // ----- Judge calibration -----
  var jsel = { ver: 'v3', item: 'nat', lang: 'hi-IN' };
  function viewJudge() {
    var h = '<div class="head"><div><div class="eyebrow">Judge calibration</div><h1>Can the audio judge stand in for people?</h1><p>An audio LLM judge scores every session. It goes live on a language only if it agrees with human raters on a 200-clip golden set (50 per language, double-labeled). Agreement is Cohen\'s kappa on accept vs. reject.</p></div></div>';
    h += '<div class="grid split"><div class="card"><h2>Kappa by rubric item and language</h2><p class="sub">v2 is live. v3 is the candidate. Each cell shows v2 → v3 and the change. Tap a cell to open it.</p><div class="tw"><table><thead><tr><th>Rubric item</th>' + S.LANGS.map(function (L) { return '<th class="n">' + L.code + '</th>'; }).join('') + '<th class="n">All</th></tr></thead><tbody>' +
      S.RUBRIC.map(function (it) {
        return '<tr class="static"><td><b>' + esc(it.name) + '</b><div class="note" style="white-space:normal;min-width:140px;max-width:200px">' + esc(it.desc) + '</div></td>' + S.LANGS.concat([{ code: 'all' }]).map(function (L) {
          var a = K('v2', it.id, L.code), b = K('v3', it.id, L.code), d = b - a;
          var fail = L.code !== 'all' && (b < st.gate.minKappa || a - b > st.gate.maxDrop);
          var on = jsel.item === it.id && jsel.lang === L.code;
          return '<td class="n" style="cursor:pointer;' + (on ? 'background:var(--blue-l)' : '') + '" data-jsel="' + it.id + '|' + L.code + '"><span class="num">' + fmt(a, 2) + ' → ' + fmt(b, 2) + '</span><div class="' + (fail ? 'bad-t' : d > 0 ? 'ok-t' : 'note') + '" style="font-size:13px">' + (d >= 0 ? '+' : '') + fmt(d, 2) + (fail ? ' fail' : '') + '</div></td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>' +
      '<h3 class="mt">Gate settings</h3><div class="grid g2"><div class="rule"><label for="g-min">Min kappa per slice</label><output>' + fmt(st.gate.minKappa, 2) + '</output><input id="g-min" type="range" min="0.4" max="0.8" step="0.01" value="' + st.gate.minKappa + '" data-gate="minKappa"></div><div class="rule"><label for="g-drop">Max drop vs. v2 per slice</label><output>' + fmt(st.gate.maxDrop, 2) + '</output><input id="g-drop" type="range" min="0" max="0.15" step="0.01" value="' + st.gate.maxDrop + '" data-gate="maxDrop"></div></div></div>';

    var cm = cmFor(jsel.ver, jsel.item, jsel.lang), k = kappaOf(cm), n = cm.tp + cm.fn + cm.fp + cm.tn;
    var itName = S.RUBRIC.filter(function (i) { return i.id === jsel.item; })[0].name;
    h += '<div class="card sticky" id="detail"><h2>Confusion: ' + esc(itName) + ', ' + (jsel.lang === 'all' ? 'all languages' : jsel.lang) + '</h2><div class="seg mt8">' + ['v2', 'v3'].map(function (v) { return '<button data-act="jver" data-v="' + v + '" aria-pressed="' + (jsel.ver === v) + '">Judge ' + v + '</button>'; }).join('') + '</div>' +
      '<div class="cm mt"><div class="h"></div><div class="h">Human: accept</div><div class="h">Human: reject</div><div class="h">Judge: accept</div><div class="g">' + cm.tp + '</div><div class="x">' + cm.fp + '</div><div class="h">Judge: reject</div><div class="x">' + cm.fn + '</div><div class="g">' + cm.tn + '</div></div>' +
      '<dl class="kv mt"><dt>Clips</dt><dd>' + n + '</dd><dt>Raw agreement</dt><dd>' + pct((cm.tp + cm.tn) / n) + '</dd><dt>Cohen\'s kappa</dt><dd>' + fmt(k, 2) + '</dd><dt>False rejects</dt><dd>' + cm.fn + ' good clips the judge would throw away</dd><dt>False accepts</dt><dd>' + cm.fp + ' bad clips the judge would ship</dd></dl></div></div>';

    var gfv3 = gateFails({ 'en-US': 'v3', 'en-IN': 'v3', 'es-MX': 'v3', 'hi-IN': 'v3' });
    var gfm = gateFails({ 'en-US': 'v3', 'en-IN': 'v3', 'es-MX': 'v3', 'hi-IN': 'v2' }), gfl = gateFails(st.routing);
    var routeName = S.LANGS.map(function (L) { return L.code + ' ' + st.routing[L.code]; }).join(' · ');
    h += '<div class="grid g2 mt"><div class="card"><h2>Regression gate</h2><p class="sub">Live routing: ' + routeName + '</p>' +
      gateRow('Ship v3 to all 4 languages', gfv3, 'all') + gateRow('Ship v3, keep v2 on hi-IN', gfm, 'mixed') + gateRow('Keep v2 everywhere', gateFails({ 'en-US': 'v2', 'en-IN': 'v2', 'es-MX': 'v2', 'hi-IN': 'v2' }), 'v2') +
      '<p class="note mt8">Live gate status: ' + (gfl.length ? pill('bad', gfl.length + ' failing') : pill('ok', 'Passing')) + '. Switching versions re-scores every session in Session QA.</p></div>';
    var dis = S.sessions.filter(function (s) { return s.lang === 'hi-IN' && s.codeSwitch && s.m.natV3 < st.rules.minNat && s.m.nat >= st.rules.minNat; }).slice(0, 7);
    h += '<div class="card"><h2>Why v3 fails on hi-IN</h2><p class="sub">Sessions where v3 calls the talk unnatural but v2 and human raters do not. All have code-switching (Hindi and English in the same turn).</p><ul class="list">' +
      dis.map(function (s) { return '<li><div><div class="t"><a href="#/sessions/' + s.id + '">' + s.id + '</a> · ' + esc(s.topic) + '</div><div class="d">v3 ' + fmt(s.m.natV3, 1) + ' vs. v2 ' + fmt(s.m.nat, 1) + ' · human: natural</div></div>' + pill('warn', 'Code-switch') + '</li>'; }).join('') +
      '</ul><p class="note mt8">Next step: add 40 code-switched clips to the v3 judge examples and to the golden set, then re-run the gate.</p></div></div>';
    return h;
  }
  function gateRow(label, fails, key) {
    return '<div class="gate ' + (fails.length ? 'fail' : 'pass') + '"><span class="st">' + (fails.length ? '✕' : '✓') + '</span><div class="body"><b>' + esc(label) + '</b><p>' + (fails.length ? fails.map(function (f) { return f.lang + ' ' + f.item + ': ' + f.why; }).join('; ') : 'Passes every slice.') + '</p><div class="btns"><button class="btn sm ' + (fails.length ? 'ghost' : '') + '" data-act="route" data-v="' + key + '">Make live</button></div></div></div>';
  }

  // ----- Contributors -----
  var cFilter = { flagged: false, lang: '' };
  function cstats(c) {
    var ss = S.sessions.filter(function (s) { return s.a === c.id || s.b === c.id; });
    var acc = 0, h = 0, nat = 0;
    ss.forEach(function (s) { var v = verdict(s); if (v.v === 'accept') acc++; h += hrs(s.durMin); nat += natFor(s); });
    return { ss: ss, n: ss.length, acc: ss.length ? acc / ss.length : 0, h: h, nat: ss.length ? nat / ss.length : 0, pay: h * st.spec.payPerHour };
  }
  function tierOf(c) { return isPaused(c.id) ? 'Paused' : st.promoted.indexOf(c.id) >= 0 ? 'Trusted' : c.tier; }
  function tierPill(t) { return pill(t === 'Paused' ? 'bad' : t === 'New' ? 'blue' : 'ok', t); }
  function viewContributors(r) {
    var list = S.contributors.filter(function (c) { return (!cFilter.flagged || c.flags.length) && (!cFilter.lang || c.lang === cFilter.lang); });
    list.sort(function (a, b) { return b.flags.length - a.flags.length; });
    var sel = r.id && CON[r.id] ? CON[r.id] : null;
    var h = '<div class="head"><div><div class="eyebrow">Contributors</div><h1>Who is recording, and how it is going</h1><p>Sample contributor IDs and first names only. Quality signals roll up from their sessions. Actions here change how their sessions are handled.</p></div></div>';
    h += '<div class="grid split"><div class="card"><div class="filters"><div class="seg"><button data-act="cflag" aria-pressed="' + (!cFilter.flagged) + '" data-v="0">All (' + S.contributors.length + ')</button><button data-act="cflag" data-v="1" aria-pressed="' + cFilter.flagged + '">Flagged (' + S.contributors.filter(function (c) { return c.flags.length; }).length + ')</button></div>' +
      '<label class="field">Language<select data-cf="lang"><option value="">All</option>' + S.LANGS.map(function (L) { return '<option' + (cFilter.lang === L.code ? ' selected' : '') + '>' + L.code + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="tw" style="max-height:640px"><table><thead><tr><th>Contributor</th><th>Lang</th><th class="hide-m">Accent</th><th>Tier</th><th class="n">Sessions</th><th class="n">Accept</th><th class="n hide-m">Hours</th><th>Flags</th></tr></thead><tbody>' +
      list.map(function (c) { var x = cstats(c); return '<tr data-go="#/contributors/' + c.id + '" class="' + (sel && sel.id === c.id ? 'sel' : '') + '"><td><b>' + c.id + '</b><div class="note">' + esc(c.name) + '</div></td><td>' + c.lang + '</td><td class="hide-m">' + esc(c.accent) + '</td><td>' + tierPill(tierOf(c)) + '</td><td class="n">' + x.n + '</td><td class="n ' + (x.acc < 0.6 && x.n ? 'bad-t' : '') + '">' + (x.n ? pct(x.acc) : 'n/a') + '</td><td class="n hide-m">' + fmt(x.h, 1) + '</td><td>' + (c.flags.length ? pill('warn', c.flags.length + ' flag') : '<span class="note">None</span>') + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>';
    if (!sel) { h += '<div class="card sticky" id="detail"><h2>Pick a contributor</h2><p class="note mt8">Start with the flagged ones. C-2291 and C-3307 may be one person on two accounts.</p><div class="btns mt"><a class="btn blue" href="#/contributors/C-3307">Open C-3307</a><a class="btn ghost" href="#/contributors/C-2418">Open C-2418</a></div></div></div>'; return h; }
    var x = cstats(sel), t = tierOf(sel);
    h += '<div class="card sticky" id="detail"><div class="eyebrow">' + sel.lang + ' · ' + esc(sel.accent) + ' · ' + sel.weeks + ' weeks on platform</div><h2>' + sel.id + ' · ' + esc(sel.name) + '</h2><p class="mt8">' + tierPill(t) + '</p>' +
      '<div class="grid g2 kpis mt">' + kpi('Sessions (sample)', x.n, fmt(x.h, 1) + ' hours') + kpi('Accept rate', x.n ? pct(x.acc) : 'n/a', 'project avg 80%') + kpi('Avg naturalness', fmt(x.nat, 1), 'live judge') + kpi('Pay (sample)', money(x.pay), '$' + st.spec.payPerHour + '/hr') + '</div>' +
      (sel.flags.length ? '<h3 class="mt">Flags</h3>' + sel.flags.map(function (f) { return '<div class="alert warn mt8"><span class="ic">!</span><div class="body"><b>' + esc(f) + '</b><p>' + esc(flagHelp(sel)) + '</p></div></div>'; }).join('') : '') +
      '<div class="btns mt">' + (isPaused(sel.id) ? '<button class="btn ghost" data-act="unpause" data-id="' + sel.id + '">Unpause</button>' : '<button class="btn" data-act="pause" data-id="' + sel.id + '">Pause and hold sessions</button>') +
      (st.coached.indexOf(sel.id) >= 0 ? '<button class="btn ghost" disabled>Coaching note queued</button>' : '<button class="btn ghost" data-act="coach" data-id="' + sel.id + '">Queue coaching note</button>') +
      (t === 'New' ? '<button class="btn ghost" data-act="promote" data-id="' + sel.id + '">Promote to Trusted</button>' : '') + '</div><p class="note mt8">Notes are queued here only. Nothing is sent.</p>' +
      '<h3 class="mt">Sessions</h3><ul class="list">' + x.ss.slice(0, 8).map(function (s) { return '<li><div><div class="t"><a href="#/sessions/' + s.id + '">' + s.id + '</a> · ' + esc(s.topic) + '</div><div class="d">' + dateLabel(s.date) + ' · ' + esc(ENV[s.env].name) + ' · with ' + (s.a === sel.id ? s.b : s.a) + '</div></div>' + vpill(verdict(s)) + '</li>'; }).join('') + '</ul></div></div>';
    return h;
  }
  function flagHelp(c) {
    return { dup: 'Pausing holds both accounts\' sessions out of the batch until identity is checked.', scripted: 'Scripted talk teaches models the wrong turn-taking. A coaching note with an example usually fixes it.', bleed: 'Ask them to wear headphones. Bleed breaks channel separation, which is the point of full-duplex data.', clip: 'Ask them to lower mic gain. Clipped audio cannot be repaired.' }[c.quirk] || 'Review recent sessions.';
  }

  // ----- Release gate -----
  var waiveOpen = false;
  function viewRelease() {
    var rc = releaseChecks(), ready = rc.checks.every(function (c) { return c.pass || c.waived; });
    var acc = rc.vs.filter(function (x) { return x.v.v === 'accept'; }), accH = acc.reduce(function (a, x) { return a + hrs(x.s.durMin); }, 0);
    var byL = {}; acc.forEach(function (x) { byL[x.s.lang] = (byL[x.s.lang] || 0) + hrs(x.s.durMin); });
    var h = '<div class="head"><div><div class="eyebrow">Release gate</div><h1>Batch B-14 to ' + esc(S.project.buyer) + '</h1><p>Sessions recorded Oct 20 to Oct 26. The batch can ship only when every check passes or has a written waiver.</p></div>' +
      '<div class="btns"><button class="btn blue" data-act="release"' + (ready && !st.released ? '' : ' disabled') + '>' + (st.released ? 'Released ' + esc(st.released) : 'Release batch') + '</button></div></div>';
    h += '<div class="grid g5 kpis">' + kpi('Sessions in batch', rc.batch.length, st.holdOver ? 'extra en-US quiet held' : 'Oct 20 to 26') + kpi('Accepted', acc.length, fmt(accH, 1) + ' hours') + kpi('Checks passing', rc.checks.filter(function (c) { return c.pass || c.waived; }).length + ' / ' + rc.checks.length, ready ? '<span class="up">Ready to release</span>' : '<span class="down">Blocked</span>') +
      S.LANGS.slice(2, 4).map(function (L) { return kpi(L.code + ' hours', fmt(byL[L.code] || 0, 1), 'accepted in batch'); }).join('') + '</div>';
    h += '<div class="grid split mt"><div class="card"><h2>Checks</h2>' + rc.checks.map(function (c) {
      var cls = c.pass ? 'pass' : c.waived ? 'waived' : 'fail';
      var extra = (c.id === 'balance' && waiveOpen && !c.pass && !c.waived) ? '<div class="reason"><input type="text" id="waiveReason" aria-label="Waiver reason" value="Buyer OK with extra quiet-room hours this batch, per call on Oct 24 (sample)" style="min-height:44px;border:1px solid var(--line2);border-radius:10px;padding:0 12px;font-size:16px"></div><div class="btns mt8"><button class="btn sm" data-act="waive-do">Save waiver</button><button class="btn sm ghost" data-act="waive-cancel">Cancel</button></div>' : '';
      return '<div class="gate ' + cls + '"><span class="st">' + (c.pass ? '✓' : c.waived ? 'W' : '✕') + '</span><div class="body"><b>' + esc(c.name) + '</b><p>' + esc(c.detail) + (c.waived ? ' Waived: ' + esc(st.waivers[c.id]) : '') + '</p>' + (c.act && !c.pass && !extra ? '<div class="btns">' + c.act + '</div>' : '') + extra + '</div></div>';
    }).join('') + '</div>';
    h += '<div class="card sticky" id="detail"><h2>Delivery files</h2><p class="sub">Made in your browser. Nothing is uploaded or sent.</p><ul class="list"><li><div><div class="t mono">manifest_B-14.jsonl</div><div class="d">One line per accepted session: channels, sample rate, language, accents, environment, QA scores, judge version, consent ID.</div></div><button class="btn sm ghost" data-act="dl-manifest">Download</button></li>' +
      '<li><div><div class="t mono">release_note_B-14.md</div><div class="d">What is in the batch, coverage after it, open issues, waivers.</div></div><button class="btn sm ghost" data-act="dl-note">Download</button></li></ul>' +
      '<h3 class="mt">Manifest preview</h3><pre class="mono" style="white-space:pre-wrap;overflow-wrap:anywhere;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:10px;max-height:220px;overflow:auto">' + esc(acc.slice(0, 2).map(function (x) { return JSON.stringify(manifestLine(x.s)); }).join('\n')) + '</pre></div></div>';
    return h;
  }
  function manifestLine(s) {
    return { session_id: s.id, batch: 'B-14', lang: s.lang, env: s.env, accents: [s.accentA, s.accentB], duration_s: s.durMin * 60, channels: 2, sample_rate_hz: 48000, snr_db: s.m.snr, overlap_pct: s.m.overlap, naturalness: natFor(s), judge_version: st.routing[s.lang], consent_id: s.consent || (st.consentFixed.indexOf(s.id) >= 0 ? 'CN-RELINKED-' + s.id.slice(2) : null), sample_data: true };
  }

  // ---------- render ----------
  function render() {
    stopPlay();
    var r = route(); if (!VIEWS.some(function (v) { return v.id === r.view; })) r.view = 'pulse';
    renderTabs(r.view);
    var m = document.getElementById('main');
    var fn = { pulse: viewPulse, spec: viewSpec, sessions: viewSessions, coverage: viewCoverage, judge: viewJudge, contributors: viewContributors, release: viewRelease }[r.view];
    m.innerHTML = fn(r);
    if (r.view === 'sessions' && r.id && SES[r.id]) {
      if (player.sid !== r.id) { player.t = 0; player.sid = r.id; }
      drawWaves(SES[r.id]);
    }
  }
  var lastView = null;
  function onRoute() {
    var r = route();
    if (r.view === 'sessions' && Object.keys(r.q).length) sesFilter = {};
    render();
    if (lastView !== r.view) window.scrollTo(0, 0);
    else if (r.id && window.innerWidth < 1100) { var d = document.getElementById('detail'); if (d) d.scrollIntoView({ block: 'start' }); }
    lastView = r.view;
  }
  window.addEventListener('hashchange', onRoute);
  window.addEventListener('resize', function () { var r = route(); if (r.view === 'sessions' && r.id && SES[r.id]) drawWaves(SES[r.id]); });

  function matchFlag(s) { var f = sesFilter.flag; if (!f) return true; if (f === 'pii') return !!s.pii; if (f === 'dup') return s.dup; if (f === 'hard') return verdict(s).hard.length > 0; return true; }
  function nextReview(cur) {
    var q = S.sessions.filter(function (s) { return verdict(s).v === 'review' && s.id !== cur; });
    if (sesFilter.batch) q = q.filter(function (s) { return s.date >= BATCH_FROM; });
    if (q.length) location.hash = '#/sessions/' + q[0].id; else { render(); toast('Review queue is clear.'); }
  }

  document.addEventListener('click', function (e) {
    var cv = e.target.closest('canvas');
    if (cv) { var rect = cv.getBoundingClientRect(); player.t = Math.max(0, Math.min(90, (e.clientX - rect.left) / rect.width * 90)); var s0 = SES[player.sid]; if (s0) drawWaves(s0); return; }
    var go = e.target.closest('[data-go]');
    if (go && !e.target.closest('a')) { location.hash = go.getAttribute('data-go'); return; }
    var js = e.target.closest('[data-jsel]');
    if (js) { var p = js.getAttribute('data-jsel').split('|'); jsel.item = p[0]; jsel.lang = p[1]; render(); if (window.innerWidth < 1100) document.getElementById('detail').scrollIntoView({ block: 'start' }); return; }
    var so = e.target.closest('[data-sort]');
    if (so) { var k = so.getAttribute('data-sort'); if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = -1; } render(); return; }
    var b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    var act = b.getAttribute('data-act'), id = b.getAttribute('data-id'), v = b.getAttribute('data-v');
    var r = route();
    switch (act) {
      case 'play':
        if (player.playing) { stopPlay(); break; }
        if (player.t >= 90) player.t = 0;
        player.playing = true; player.last = performance.now(); b.textContent = '❚❚ Pause'; player.raf = requestAnimationFrame(tick); break;
      case 'speed': speed = +v; document.querySelectorAll('[data-act=speed]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); break;
      case 'decide':
        var ri = document.getElementById('reason'), reason = ri ? ri.value : '';
        if (!reason.trim()) { ri.focus(); ri.style.borderColor = 'var(--bad)'; toast('Add a reason first. It goes in the audit trail.'); break; }
        st.overrides[id] = { v: v, reason: reason.trim() }; save(); toast(id + ' ' + (v === 'accept' ? 'accepted' : 'rejected') + '.');
        nextReview(id); break;
      case 'undo': delete st.overrides[id]; save(); render(); break;
      case 'nextreview': nextReview(r.id); break;
      case 'openfirst': nextReview(null); break;
      case 'bulk': bulkOpen = v; render(); break;
      case 'bulk-cancel': bulkOpen = null; render(); break;
      case 'bulk-do':
        var why = (document.getElementById('bulkReason') || {}).value || '';
        if (!why.trim()) { toast('Add a reason first.'); break; }
        filteredSessions().forEach(function (x) { if (x.v.v === 'review') st.overrides[x.s.id] = { v: bulkOpen, reason: why.trim() + ' (bulk)' }; });
        bulkOpen = null; save(); render(); toast('Decisions saved with reason.'); break;
      case 'more': listLimit += 40; render(); break;
      case 'csv': download('sessions_sample.csv', csv(), 'text/csv'); break;
      case 'rules-reset': st.rules = JSON.parse(JSON.stringify(DEFAULT_RULES)); save(); render(); break;
      case 'queue':
        var pp = id.split('.');
        st.queue.push({ key: id, lang: pp[0], label: pp[0] + ' ' + ENV[pp[1]].name + ' batch', sessions: +b.dataset.sess, contributors: +b.dataset.c, cost: +b.dataset.cost }); save(); render(); toast('Batch queued. Nothing posted.'); break;
      case 'unqueue': st.queue.splice(+v, 1); save(); render(); break;
      case 'recruit': st.queue.push({ key: 'recruit.' + id, lang: id, label: 'Recruit ' + v + ' ' + id + ' contributors', sessions: 0, contributors: +v, cost: +v * 40 }); st.spec.weeks = Math.max(st.spec.weeks, 7); save(); render(); toast('Recruiting queued. Plan moved to ' + st.spec.weeks + ' weeks.'); break;
      case 'spec-weeks': st.spec.weeks = +v; save(); render(); break;
      case 'spec-shift': if (st.spec.langShare[id] >= 5) { st.spec.langShare[id] -= 5; st.spec.langShare['en-US'] += 5; } save(); render(); break;
      case 'jver': jsel.ver = v; render(); break;
      case 'route':
        st.routing = v === 'all' ? { 'en-US': 'v3', 'en-IN': 'v3', 'es-MX': 'v3', 'hi-IN': 'v3' } : v === 'mixed' ? { 'en-US': 'v3', 'en-IN': 'v3', 'es-MX': 'v3', 'hi-IN': 'v2' } : { 'en-US': 'v2', 'en-IN': 'v2', 'es-MX': 'v2', 'hi-IN': 'v2' };
        save(); render(); toast('Judge routing updated. Sessions re-scored.'); break;
      case 'cflag': cFilter.flagged = v === '1'; render(); break;
      case 'pause':
        [id].concat(id === 'C-3307' ? ['C-2291'] : id === 'C-2291' ? ['C-3307'] : []).forEach(function (x) { if (!isPaused(x)) st.paused.push(x); });
        save(); render(); toast(id === 'C-3307' || id === 'C-2291' ? 'Both linked accounts paused. Their sessions are on hold.' : id + ' paused. Sessions on hold.'); break;
      case 'unpause': st.paused = st.paused.filter(function (x) { return x !== id && !((id === 'C-3307' && x === 'C-2291') || (id === 'C-2291' && x === 'C-3307')); }); save(); render(); break;
      case 'coach': st.coached.push(id); save(); render(); toast('Coaching note queued. Not sent.'); break;
      case 'promote': st.promoted.push(id); save(); render(); break;
      case 'holdover': st.holdOver = true; save(); render(); break;
      case 'waive': waiveOpen = true; render(); break;
      case 'waive-cancel': waiveOpen = false; render(); break;
      case 'waive-do': var w = (document.getElementById('waiveReason') || {}).value || ''; if (!w.trim()) { toast('Add a reason first.'); break; } st.waivers.balance = w.trim(); waiveOpen = false; save(); render(); break;
      case 'fixconsent': S.sessions.forEach(function (s) { if (!s.consent && st.consentFixed.indexOf(s.id) < 0) st.consentFixed.push(s.id); }); save(); render(); toast('Consent records re-linked.'); break;
      case 'release': st.released = dateLabel(TODAY) + ' (sample)'; save(); render(); toast('Batch B-14 marked released. Nothing was sent.'); break;
      case 'dl-manifest': download('manifest_B-14.jsonl', releaseChecks().vs.filter(function (x) { return x.v.v === 'accept'; }).map(function (x) { return JSON.stringify(manifestLine(x.s)); }).join('\n'), 'application/json'); break;
      case 'dl-note': download('release_note_B-14.md', note(), 'text/markdown'); break;
    }
  });
  document.addEventListener('input', function (e) {
    var t = e.target, out = t.parentNode && t.parentNode.querySelector('output');
    if (t.dataset.rule) { st.rules[t.dataset.rule] = +t.value; save(); if (out) out.textContent = t.value; debounce(); }
    else if (t.dataset.gate) { st.gate[t.dataset.gate] = +t.value; save(); if (out) out.textContent = (+t.value).toFixed(2); debounce(); }
    else if (t.dataset.spec) {
      var k = t.dataset.spec;
      if (k.indexOf('lang.') === 0) st.spec.langShare[k.slice(5)] = +t.value; else if (k.indexOf('env.') === 0) st.spec.envShare[k.slice(4)] = +t.value; else st.spec[k] = +t.value;
      if (out) out.textContent = t.value; save(); debounce();
    } else if (t.dataset.f === 'text') { sesFilter.text = t.value; debounce(true); }
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset.f && t.dataset.f !== 'text') { sesFilter[t.dataset.f] = t.type === 'checkbox' ? t.checked : t.value; listLimit = 40; if (location.hash.indexOf('?') >= 0) history.replaceState(null, '', '#/sessions'); render(); }
    if (t.dataset.cf) { cFilter[t.dataset.cf] = t.value; render(); }
  });
  var dtm = 0;
  function debounce(keepCaret) {
    clearTimeout(dtm);
    dtm = setTimeout(function () {
      var a = document.activeElement, id = a && a.id, pos = a && a.selectionStart;
      var y = window.scrollY; render(); window.scrollTo(0, y);
      if (id) { var n = document.getElementById(id); if (n) { n.focus({ preventScroll: true }); if (keepCaret && pos != null) try { n.setSelectionRange(pos, pos); } catch (err) {} } }
    }, 200);
  }
  function csv() {
    var head = ['session_id', 'date', 'lang', 'env', 'contributor_a', 'contributor_b', 'duration_min', 'snr_db', 'bleed_db', 'clip_pct', 'overlap_pct', 'turn_gap_ms', 'silence_pct', 'naturalness_live', 'scripted', 'verdict', 'source', 'flags'];
    return head.join(',') + '\n' + S.sessions.map(function (s) { var v = verdict(s); return [s.id, s.date, s.lang, s.env, s.a, s.b, s.durMin, s.m.snr, s.m.bleed, s.m.clip, s.m.overlap, s.m.gap, s.m.silence, natFor(s), s.m.scripted, v.v, v.src, '"' + v.hard.concat(v.soft).join('; ') + '"'].join(','); }).join('\n');
  }
  function note() {
    var rc = releaseChecks(), acc = rc.vs.filter(function (x) { return x.v.v === 'accept'; }), cov = coverage();
    var L = ['# Release note: Batch B-14 (sample data)', '', 'Project: ' + S.project.name + ' for ' + S.project.buyer, 'Sessions in batch: ' + rc.batch.length + ', accepted: ' + acc.length, 'Judge routing: ' + S.LANGS.map(function (l) { return l.code + ' ' + st.routing[l.code]; }).join(', '), '', '## Checks'];
    rc.checks.forEach(function (c) { L.push('- [' + (c.pass ? 'x' : c.waived ? 'w' : ' ') + '] ' + c.name + ': ' + c.detail + (c.waived ? ' Waiver: ' + st.waivers[c.id] : '')); });
    L.push('', '## Coverage after this batch');
    S.LANGS.forEach(function (l) { L.push('- ' + l.code + ': ' + S.ENVS.map(function (E) { return E.name + ' ' + pct(cov[l.code][E.id].hours / cov[l.code][E.id].quota); }).join(', ')); });
    L.push('', 'Prototype output. Not a David AI document. All numbers are sample data.');
    return L.join('\n');
  }
  document.getElementById('resetBtn').addEventListener('click', function () { st = defaults(); save(); sesFilter = {}; bulkOpen = null; waiveOpen = false; cFilter = { flagged: false, lang: '' }; jsel = { ver: 'v3', item: 'nat', lang: 'hi-IN' }; location.hash = '#/pulse'; render(); toast('Demo reset.'); });
  onRoute();
})();
