/* Claims Review Copilot. Concept prototype by Ami Dwivedi. Synthetic data only. */
(function () {
  'use strict';
  var D = window.CRC;
  var KEY = 'crc-state-v1';
  var view = document.getElementById('view');
  var ui = { rec: 'all', lob: 'all', sort: 'clock', q: '', stage: 'all', mix: 'before' };

  function fresh() { return { decisions: {}, log: [], gateFixed: false, shipped: false, signer: '', leads: {} }; }
  var S = load();
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.decisions) return s; } catch (e) {} return fresh(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function pct(n, d) { return (n * 100).toFixed(d == null ? 1 : d) + '%'; }
  function days(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000); }
  function fmtDate(iso) { var d = new Date(iso + 'T12:00:00'); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  function nowStamp() { var d = new Date(); return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  function byId(id) { for (var i = 0; i < D.claims.length; i++) if (D.claims[i].id === id) return D.claims[i]; return null; }
  function recPill(r, conf) { var R = D.REC[r]; return '<span class="pill ' + R.tone + '">' + esc(R.label) + (conf != null ? ' · ' + Math.round(conf * 100) + '%' : '') + '</span>'; }
  function clock(c) {
    var limit = c.channel === 'Electronic' ? 30 : 45;
    var left = limit - days(c.received, D.TODAY);
    var cls = left <= 5 ? 'red' : left <= 12 ? 'amber' : 'green';
    return { left: left, limit: limit, cls: cls, text: left + ' days left' };
  }
  function status(c) { var d = S.decisions[c.id]; return d ? d.label : 'Open'; }
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
  }
  function addLog(text) { S.log.unshift({ at: nowStamp(), text: text }); S.log = S.log.slice(0, 60); save(); }

  // ---------- nav ----------
  var NAV = [
    ['grp', 'Work'],
    ['pulse', 'Pulse', '&#9673;'],
    ['queue', 'Work queue', '&#9776;'],
    ['claim/' + D.claims[3].id, 'Claim detail', '&#128196;'],
    ['grp', 'Quality and risk'],
    ['denials', 'Denials and appeals', '&#9878;'],
    ['integrity', 'Payment integrity', '&#128269;'],
    ['eval', 'Model quality gate', '&#10003;'],
    ['grp', 'Why this exists'],
    ['problems', 'Problems we solve', '&#9733;'],
    ['plan', 'Squad plan', '&#9873;']
  ];
  function renderNav(route) {
    var h = '';
    NAV.forEach(function (n) {
      if (n[0] === 'grp') { h += '<div class="grp">' + n[1] + '</div>'; return; }
      var on = route === n[0].split('/')[0] ? ' on' : '';
      h += '<a class="' + on.trim() + '" href="#/' + n[0] + '"' + (on ? ' aria-current="page"' : '') + '><span class="ico" aria-hidden="true">' + n[2] + '</span>' + n[1] + '</a>';
    });
    h += '<div class="who"><b>Demo reviewer:</b> you.<br>Every decision is saved in this browser only. <button class="btn ghost small mt" data-act="reset" style="width:100%">Reset demo</button></div>';
    document.getElementById('side').innerHTML = h;
  }
  var side = document.getElementById('side'), overlay = document.getElementById('overlay'), menuBtn = document.getElementById('menuBtn');
  function closeMenu() { side.classList.remove('open'); overlay.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', function () { var o = !side.classList.contains('open'); side.classList.toggle('open', o); overlay.classList.toggle('open', o); menuBtn.setAttribute('aria-expanded', String(o)); });
  overlay.addEventListener('click', closeMenu);

  // ---------- charts ----------
  function lineChart(vals, labels, color, fmt, W) {
    var w = W || 560, h = W ? 220 : 200, p = { l: 44, r: 26, t: 14, b: 28 };
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var pad = (max - min) * 0.15 || 1; min -= pad; max += pad;
    var x = function (i) { return p.l + i * (w - p.l - p.r) / (vals.length - 1); };
    var y = function (v) { return p.t + (1 - (v - min) / (max - min)) * (h - p.t - p.b); };
    var pts = vals.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).join(' ');
    var area = 'M' + x(0) + ',' + (h - p.b) + ' L' + pts.replace(/ /g, ' L') + ' L' + x(vals.length - 1) + ',' + (h - p.b) + ' Z';
    var g = '';
    for (var k = 0; k < 4; k++) { var vv = min + (max - min) * k / 3; g += '<line x1="' + p.l + '" x2="' + (w - p.r) + '" y1="' + y(vv) + '" y2="' + y(vv) + '" stroke="#e7ebf3"/><text x="' + (p.l - 6) + '" y="' + (y(vv) + 4) + '" font-size="11" text-anchor="end" fill="#6b7690">' + fmt(vv) + '</text>'; }
    var lab = labels.map(function (l, i) { return (i % 2 === 0 || i === labels.length - 1) ? '<text x="' + x(i) + '" y="' + (h - 8) + '" font-size="11" text-anchor="middle" fill="#6b7690">' + l + '</text>' : ''; }).join('');
    var dots = vals.map(function (v, i) { return '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3.5" fill="#fff" stroke="' + color + '" stroke-width="2"/>'; }).join('');
    return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="trend chart">' + g + '<path d="' + area + '" fill="' + color + '" opacity=".08"/><polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="2.5"/>' + dots + lab + '</svg>';
  }
  function bar(label, val, max, txt, color) {
    return '<div class="bar"><span class="l">' + label + '</span><span class="n">' + txt + '</span><div class="meter"><i style="width:' + Math.max(2, Math.min(100, val / max * 100)) + '%;background:' + (color || 'var(--brand)') + '"></i></div></div>';
  }

  // ---------- PULSE ----------
  function vPulse() {
    var P = D.pulse;
    var open = D.claims.filter(function (c) { return status(c) === 'Open'; });
    var counts = {}; Object.keys(D.REC).forEach(function (k) { counts[k] = 0; });
    open.forEach(function (c) { counts[c.rec]++; });
    var colors = { pay: 'var(--good)', adjust: 'var(--info)', info: '#d99a2b', clinical: 'var(--clin)', integrity: 'var(--pi)' };
    var h = '<div class="head"><div><div class="crumb">Pilot desks · week of Oct 26, 2026</div><h1>Pulse</h1><p>How the claims review copilot is doing this week. All numbers on this page are synthetic examples for the concept.</p></div><a class="btn primary" href="#/queue">Open work queue</a></div>';
    h += '<div class="grid g6">' + P.kpis.map(function (k) { return '<div class="card kpi"><div class="k">' + esc(k.k) + '</div><div class="v">' + esc(k.v) + '</div><div class="d' + (k.good ? ' up' : '') + '">' + esc(k.d) + '</div></div>'; }).join('') + '</div>';
    h += '<div class="grid g2 mt"><div class="card"><div class="row between"><h2>Pended claims in queue</h2><span class="pill good">Down 28%</span></div>' + lineChart(P.pended, P.weeks, '#2446a8', function (v) { return (v / 1000).toFixed(1) + 'k'; }) + '</div>';
    h += '<div class="card"><div class="row between"><h2>Avg handle time, minutes</h2><span class="pill good">-3.6 min</span></div>' + lineChart(P.aht, P.weeks, '#0f8b8d', function (v) { return v.toFixed(1); }) + '</div></div>';
    h += '<div class="grid g3 mt"><div class="card"><h2>Open claims by copilot advice</h2><p class="muted small">' + open.length + ' open claims in this demo queue. Tap to filter.</p>';
    Object.keys(D.REC).forEach(function (k) { h += '<a href="#/queue" data-act="qfilter" data-v="' + k + '" style="text-decoration:none;color:inherit;display:block">' + bar(esc(D.REC[k].label), counts[k], Math.max(1, open.length / 2), counts[k], colors[k]) + '</a>'; });
    h += '<div class="callout clin small mt">The copilot never denies a claim. Its strongest move is <b>Send to clinician</b>.</div></div>';
    h += '<div class="card"><h2>Reviewer adoption</h2><p class="muted small">Share of pilot reviewers who used the copilot on most claims that week.</p>' + lineChart(P.adoption, P.weeks, '#6a3fb5', function (v) { return Math.round(v) + '%'; }, 340) + '</div>';
    h += '<div class="card"><h2>Try the demo path</h2><ol class="steps small"><li>Open the <a href="#/queue">work queue</a>. Sort by prompt pay clock.</li><li>Open <a href="#/claim/' + D.claims[3].id + '">' + D.claims[3].id + '</a>. Try to deny it. See why you cannot.</li><li>Fix a vague denial reason on <a href="#/denials">Denials</a>.</li><li>Review a lead on <a href="#/integrity">Payment integrity</a>.</li><li>Try to ship model v2.4 on the <a href="#/eval">quality gate</a>.</li></ol></div></div>';
    h += '<div class="card mt"><div class="row between"><h2>ROI calculator</h2><span class="pill">Your inputs, not CVS data</span></div><p class="muted small">Move the sliders to size the time saved. Default minutes saved come from the synthetic pilot above (14.2 to 10.6 min).</p>';
    h += '<div class="grid g3"><div class="field"><label for="r-vol">Pended claims per month: <span id="r-vol-o"></span></label><input type="range" id="r-vol" min="5000" max="500000" step="5000" value="120000"></div>';
    h += '<div class="field"><label for="r-min">Minutes saved per claim: <span id="r-min-o"></span></label><input type="range" id="r-min" min="0.5" max="8" step="0.1" value="3.6"></div>';
    h += '<div class="field"><label for="r-cost">Loaded cost per reviewer hour: <span id="r-cost-o"></span></label><input type="range" id="r-cost" min="25" max="90" step="1" value="42"></div></div>';
    h += '<div class="grid g3 mt"><div class="kpi"><div class="k">Hours back per year</div><div class="v" id="r-h"></div></div><div class="kpi"><div class="k">Reviewer capacity freed</div><div class="v" id="r-f"></div><div class="d">at 1,800 work hours per person</div></div><div class="kpi"><div class="k">Value per year</div><div class="v" id="r-v"></div><div class="d">before quality gains</div></div></div></div>';
    view.innerHTML = h;
    var calc = function () {
      var vol = +document.getElementById('r-vol').value, m = +document.getElementById('r-min').value, c = +document.getElementById('r-cost').value;
      var hrs = vol * 12 * m / 60;
      document.getElementById('r-vol-o').textContent = vol.toLocaleString('en-US');
      document.getElementById('r-min-o').textContent = m.toFixed(1);
      document.getElementById('r-cost-o').textContent = '$' + c;
      document.getElementById('r-h').textContent = Math.round(hrs).toLocaleString('en-US');
      document.getElementById('r-f').textContent = Math.round(hrs / 1800).toLocaleString('en-US') + ' FTE';
      document.getElementById('r-v').textContent = money(hrs * c);
    };
    ['r-vol', 'r-min', 'r-cost'].forEach(function (id) { document.getElementById(id).addEventListener('input', calc); });
    calc();
  }

  // ---------- QUEUE ----------
  function vQueue() {
    var h = '<div class="head"><div><div class="crumb">Pended claims · synthetic</div><h1>Work queue</h1><p>Every pended claim gets copilot triage: what to do next, why, and how sure it is. You decide. Claims closest to the prompt pay limit show first.</p></div></div>';
    h += '<div class="card"><div class="chips" role="group" aria-label="Filter by copilot advice"><button class="chip' + (ui.rec === 'all' ? ' on' : '') + '" data-act="rec" data-v="all">All</button>';
    Object.keys(D.REC).forEach(function (k) { h += '<button class="chip' + (ui.rec === k ? ' on' : '') + '" data-act="rec" data-v="' + k + '">' + esc(D.REC[k].label) + '</button>'; });
    h += '</div><div class="grid g3 mt"><div class="field"><label for="q">Search</label><input type="search" id="q" placeholder="Claim, provider, code, reason" value="' + esc(ui.q) + '"></div>';
    h += '<div class="field"><label for="lob">Line of business</label><select id="lob"><option value="all">All lines</option><option>Commercial</option><option>Medicare Advantage</option><option>Medicaid</option></select></div>';
    h += '<div class="field"><label for="sort">Sort by</label><select id="sort"><option value="clock">Prompt pay clock (soonest)</option><option value="risk">Appeal risk (highest)</option><option value="dollars">Billed amount (highest)</option><option value="conf">Copilot confidence (lowest)</option></select></div></div></div>';
    h += '<div class="card"><div id="qsum" class="row small muted"></div><div class="qtable scroll mt"><table class="tbl"><thead><tr><th>Claim</th><th>Member</th><th>Line</th><th>Why it pended</th><th>Copilot says</th><th>Prompt pay</th><th class="num">Appeal risk</th><th class="num">Billed</th><th>Status</th></tr></thead><tbody id="qbody"></tbody></table></div><div class="qcards mt" id="qcards"></div></div>';
    view.innerHTML = h;
    document.getElementById('lob').value = ui.lob; document.getElementById('sort').value = ui.sort;
    document.getElementById('q').addEventListener('input', function (e) { ui.q = e.target.value; qList(); });
    document.getElementById('lob').addEventListener('change', function (e) { ui.lob = e.target.value; qList(); });
    document.getElementById('sort').addEventListener('change', function (e) { ui.sort = e.target.value; qList(); });
    qList();
  }
  function qList() {
    var q = ui.q.toLowerCase();
    var list = D.claims.filter(function (c) {
      if (ui.rec !== 'all' && c.rec !== ui.rec) return false;
      if (ui.lob !== 'all' && c.lob !== ui.lob) return false;
      if (q) { var hay = (c.id + ' ' + c.provider + ' ' + c.pend + ' ' + c.lines.map(function (l) { return l.code + ' ' + l.desc; }).join(' ') + ' ' + c.member).toLowerCase(); if (hay.indexOf(q) < 0) return false; }
      return true;
    });
    list.sort(function (a, b) {
      var oa = status(a) === 'Open' ? 0 : 1, ob = status(b) === 'Open' ? 0 : 1; if (oa !== ob) return oa - ob;
      if (ui.sort === 'risk') return b.appealRisk - a.appealRisk;
      if (ui.sort === 'dollars') return b.billed - a.billed;
      if (ui.sort === 'conf') return a.conf - b.conf;
      return clock(a).left - clock(b).left;
    });
    var open = list.filter(function (c) { return status(c) === 'Open'; }).length;
    var due = list.filter(function (c) { return status(c) === 'Open' && clock(c).left <= 5; }).length;
    var dollars = list.reduce(function (s, c) { return s + c.billed; }, 0);
    document.getElementById('qsum').innerHTML = '<span><b>' + list.length + '</b> claims</span><span>·</span><span><b>' + open + '</b> open</span><span>·</span><span class="clock red">' + due + ' due in 5 days or less</span><span>·</span><span>' + money(dollars) + ' billed</span>';
    var rows = '', cards = '';
    list.forEach(function (c) {
      var k = clock(c), st = status(c);
      var stp = st === 'Open' ? '<span class="pill">Open</span>' : '<span class="pill dark">' + esc(st) + '</span>';
      rows += '<tr class="click" data-href="#/claim/' + c.id + '"><td><a href="#/claim/' + c.id + '"><b>' + c.id + '</b></a><div class="small muted">' + esc(c.lines[0].code) + ' · ' + esc(c.provider) + '</div></td><td>' + esc(c.member) + '<div class="small muted">' + esc(c.age) + '</div></td><td>' + esc(c.lob) + '<div class="small muted">' + c.state + ' · ' + c.channel + '</div></td><td>' + esc(c.pend) + '</td><td>' + recPill(c.rec, c.conf) + '</td><td><span class="clock ' + k.cls + '">' + k.text + '</span><div class="small muted">of ' + k.limit + '</div></td><td class="num">' + c.appealRisk + '%</td><td class="num">' + money(c.billed) + '</td><td>' + stp + '</td></tr>';
      cards += '<a class="qcard" href="#/claim/' + c.id + '"><div class="row between"><span class="t">' + c.id + '</span>' + stp + '</div><div class="meta">' + esc(c.pend) + ' · ' + esc(c.lob) + ' · ' + money(c.billed) + '</div><div class="row between mt" style="margin-top:8px">' + recPill(c.rec, c.conf) + '<span class="clock small ' + k.cls + '">' + k.text + '</span></div></a>';
    });
    document.getElementById('qbody').innerHTML = rows || '<tr><td colspan="9">No claims match. Try another filter.</td></tr>';
    document.getElementById('qcards').innerHTML = cards || '<p>No claims match. Try another filter.</p>';
  }

  // ---------- CLAIM ----------
  var MIND = {
    'auth-match': 'If the tax ID or address on the auth did not match, I would ask for a corrected claim instead.',
    ncci: 'A note that shows a separate body area or a separate session would support the modifier and full payment.',
    cob: 'A current COB survey that shows no other coverage would let this pay today.',
    'med-nec': 'PT notes covering 12 weeks, or a note saying why PT was not possible, would meet the example criteria.',
    dup: 'Proof the second device is a replacement for a lost or broken one would make this a valid claim.',
    elig: 'Once the employer file sync confirms coverage, this should reprocess and pay.',
    nsa: 'If the member signed a valid notice and consent form, different cost sharing rules could apply.',
    units: 'A new weight on file or a dose change order would explain the units and allow payment as billed.'
  };
  var OVR = ['Copilot missed a document', 'Policy changed, copilot used old version', 'I have member context (call notes)', 'Prefer caution on this one', 'Other'];
  function vClaim(id) {
    var c = byId(id);
    if (!c) { view.innerHTML = '<div class="card"><h1>Claim not found</h1><p><a href="#/queue">Back to the queue</a></p></div>'; return; }
    var R = D.REC[c.rec], k = clock(c), dec = S.decisions[c.id];
    var tone = { good: 'good', info: '', warn: 'warn', clin: 'clin', pi: 'pi' }[R.tone];
    var h = '<div class="crumb"><a href="#/queue">Work queue</a> / ' + c.id + '</div>';
    h += '<div class="head"><div><h1>' + c.id + '</h1><div class="row small"><span class="pill">' + esc(c.lob) + '</span><span class="pill">' + c.state + '</span><span class="pill">' + c.channel + '</span><span class="pill warn">Pended: ' + esc(c.pend) + '</span>' + (dec ? '<span class="pill dark">' + esc(dec.label) + '</span>' : '') + '</div></div><span class="pill">Synthetic claim</span></div>';
    h += '<div class="grid g3"><div class="span2">';
    h += '<section class="rec ' + tone + '" aria-label="Copilot recommendation"><div class="row between"><div><div class="small muted">Copilot suggests</div><div class="big">' + esc(R.label) + '</div></div><div style="min-width:160px"><div class="small muted">Confidence ' + Math.round(c.conf * 100) + '%</div><div class="meter"><i style="width:' + Math.round(c.conf * 100) + '%"></i></div></div></div><p class="mt">' + esc(c.why) + '</p><p class="small muted">' + esc(R.note) + '</p><div class="small"><b>What would change my mind:</b> ' + esc(MIND[c.scenario]) + '</div><div class="row mt"><a class="btn primary" href="#decide" data-act="jump">' + (dec ? 'See decision' : 'Go to decision') + '</a><span class="small muted">AI suggests. You decide.</span></div></section>';
    h += '<div class="card mt"><h2>Evidence the copilot used</h2><ul class="ev">' + c.evidence.map(function (e, i) { return '<li><span class="dot">' + (i + 1) + '</span><div><b>' + esc(e[0]) + '</b><div class="small">' + esc(e[1]) + '</div></div></li>'; }).join('') + '</ul></div>';
    h += '<div class="card"><h2>Policy it relied on</h2><div class="cite"><b>' + esc(c.policy[0]) + '</b><div>' + esc(c.policy[1]) + '</div>' + (c.policyUrl ? '<div class="mt small"><a href="' + c.policyUrl + '" target="_blank" rel="noopener">Open public reference</a></div>' : '') + '</div><p class="small muted mt">Policies marked "synthetic example" are made up for this prototype. A real build would cite the plan\'s live policy version and date.</p></div>';
    h += '<div class="card"><h2>Claim lines</h2><div class="scroll"><table class="tbl stack"><thead><tr><th>Code</th><th>Description</th><th class="num">Units</th><th class="num">Billed</th></tr></thead><tbody>' + c.lines.map(function (l) { return '<tr><td data-l="Code"><b>' + l.code + '</b></td><td data-l="Description">' + esc(l.desc) + '</td><td class="num" data-l="Units">' + l.units + '</td><td class="num" data-l="Billed">' + money(l.billed) + '</td></tr>'; }).join('') + '</tbody></table></div><p class="small muted mt">Diagnosis: ' + esc(c.dx) + ' · Place: ' + esc(c.pos) + '</p></div>';
    h += '</div><div>';
    h += '<div class="card"><h3>Prompt pay clock</h3><div class="clock ' + k.cls + '" style="font-size:1.6rem">' + k.text + '</div><div class="meter mt"><i style="width:' + Math.min(100, (k.limit - k.left) / k.limit * 100) + '%;background:' + (k.cls === 'red' ? 'var(--bad)' : k.cls === 'amber' ? '#d99a2b' : 'var(--good)') + '"></i></div><p class="small muted mt">Received ' + fmtDate(c.received) + '. Example limit: ' + k.limit + ' days for ' + c.channel.toLowerCase() + ' claims (NY Ins. Law 3224-a). Rules vary by state and line of business.</p></div>';
    h += '<div class="card"><h3>Appeal and overturn risk</h3><div class="row between"><b style="font-size:1.4rem">' + c.appealRisk + '%</b>' + (c.appealRisk >= 40 ? '<span class="pill bad">Second look</span>' : '<span class="pill good">Low</span>') + '</div><div class="meter mt"><i style="width:' + c.appealRisk + '%;background:' + (c.appealRisk >= 40 ? 'var(--bad)' : 'var(--teal)') + '"></i></div><p class="small muted mt">Chance an adverse action here gets appealed and overturned, from past synthetic outcomes.</p></div>';
    h += '<div class="card"><h3>Member and provider</h3><div class="small"><div><b>Member:</b> ' + esc(c.member) + ' (synthetic), age ' + esc(c.age) + '</div><div><b>ID:</b> ' + c.memberId + '</div><div><b>Provider:</b> ' + esc(c.provider) + '</div><div><b>Billed:</b> ' + money(c.billed) + '</div></div></div>';
    h += '<div class="card" id="decide"></div>';
    h += '<div class="card"><h3>Audit trail</h3><ul class="log">' + auditFor(c) + '</ul></div>';
    h += '</div></div>';
    view.innerHTML = h;
    renderDecide(c);
  }
  function auditFor(c) {
    var items = ['Oct 27, 6:02 AM: Copilot v2.3 triaged claim. Suggested ' + D.REC[c.rec].label + '.', fmtDate(c.received) + ': Claim received (' + c.channel.toLowerCase() + ') and pended: ' + c.pend + '.'];
    var d = S.decisions[c.id];
    if (d) items.unshift(d.at + ': ' + d.by + ' chose ' + d.label + (d.override ? ' (override: ' + d.reason + ')' : '') + '.');
    return items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
  }
  var ACT = {
    pay: { label: 'Approve and pay', cls: 'good' },
    adjust: { label: 'Pay with adjustment', cls: 'primary' },
    info: { label: 'Request info', cls: '' },
    clinical: { label: 'Send to clinician', cls: 'clin' },
    integrity: { label: 'Send to integrity review', cls: '' },
    deny: { label: 'Deny (administrative reason)', cls: '' }
  };
  function renderDecide(c) {
    var el = document.getElementById('decide'); var d = S.decisions[c.id];
    if (d) {
      el.innerHTML = '<h3>Your decision</h3><div class="callout good"><b>' + esc(d.label) + '</b><div class="small">By ' + esc(d.by) + ' at ' + esc(d.at) + (d.override ? '<br>Override reason: ' + esc(d.reason) : '<br>Matched copilot advice') + (d.note ? '<br>Note: ' + esc(d.note) : '') + '</div></div>' + (d.letter ? '<h3 class="mt">Notice sent to provider (draft)</h3><div class="letter">' + esc(d.letter) + '</div>' : '') + '<div class="row mt"><button class="btn" data-act="undo" data-id="' + c.id + '">Undo decision</button><a class="btn primary" href="#/queue">Next claim</a></div>';
      return;
    }
    var opts = Object.keys(ACT).map(function (k) { return '<option value="' + k + '"' + (k === (c.rec === 'pay' ? 'pay' : c.rec) ? ' selected' : '') + '>' + ACT[k].label + (k === c.rec || (k === 'pay' && c.rec === 'pay') ? ' (suggested)' : '') + '</option>'; }).join('');
    var h = '<h3>Decide</h3><p class="small muted">You make the call. The copilot only suggests. Any action that differs from its advice needs a reason, which trains the next model.</p>';
    h += '<div class="field"><label for="d-act">Action</label><select id="d-act">' + opts + '</select></div>';
    h += '<div id="d-ovr" class="hide"><div class="field mt"><label for="d-reason">Why are you overriding?</label><select id="d-reason"><option value="">Choose a reason</option>' + OVR.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select></div></div>';
    h += '<div class="field mt"><label for="d-note">Note to file <span class="muted" id="d-note-hint">(optional)</span></label><textarea id="d-note" placeholder="Short note for the next person who opens this claim"></textarea></div>';
    h += '<div id="d-letter-wrap" class="hide mt"><div class="small"><b>Provider notice preview</b></div><div class="letter" id="d-letter"></div></div>';
    h += '<div class="err mt" id="d-err" role="alert"></div><div class="actions"><button class="btn primary" data-act="decide" data-id="' + c.id + '">Confirm decision</button><button class="btn ghost" data-act="pickrec" data-id="' + c.id + '">Reset to copilot advice</button></div>';
    el.innerHTML = h;
    var sel = document.getElementById('d-act');
    var upd = function () { decidePreview(c); };
    sel.addEventListener('change', upd); document.getElementById('d-note').addEventListener('input', upd);
    upd();
  }
  function letterFor(c, act, note) {
    var miss = c.evidence.map(function (e) { return '- ' + e[0] + ': ' + e[1]; }).join('\n');
    if (act === 'info') return 'Claim ' + c.id + ' (synthetic)\nWe need a bit more before we can finish this claim.\n\nWhat we checked:\n' + miss + '\n\nWhat to send: the item that resolves "' + c.pend + '".\nHow: upload to the provider portal or reply to this notice.\nWe will pay any undisputed part on time.';
    if (act === 'deny') return 'Claim ' + c.id + ' (synthetic)\nDecision: not paid as billed.\nSpecific reason: ' + (note || '[write the specific reason above]') + '\nPolicy: ' + c.policy[0] + '\nHow to fix: send a corrected claim or the missing record.\nYour rights: you can appeal. Instructions and deadlines are on the enclosed form.';
    if (act === 'clinical') return 'Routed to a licensed clinician for a medical necessity review.\nCopilot summary and the missing items list go with it. The clinician makes the decision and signs it.';
    return '';
  }
  function decidePreview(c) {
    var act = document.getElementById('d-act').value;
    var isOverride = act !== c.rec;
    document.getElementById('d-ovr').classList.toggle('hide', !isOverride);
    document.getElementById('d-note-hint').textContent = act === 'deny' ? '(required: the specific reason, in plain words)' : '(optional)';
    var L = letterFor(c, act, document.getElementById('d-note').value.trim());
    document.getElementById('d-letter-wrap').classList.toggle('hide', !L);
    document.getElementById('d-letter').textContent = L;
    var err = document.getElementById('d-err');
    if (act === 'deny' && (c.rec === 'clinical' || c.scenario === 'med-nec')) err.textContent = 'Medical necessity denials must come from a licensed clinician. Use Send to clinician.';
    else err.textContent = '';
  }
  function doDecide(id) {
    var c = byId(id), act = document.getElementById('d-act').value, err = document.getElementById('d-err');
    var note = document.getElementById('d-note').value.trim();
    var reason = document.getElementById('d-reason').value;
    var isOverride = act !== c.rec;
    if (act === 'deny' && (c.rec === 'clinical' || c.scenario === 'med-nec')) { err.textContent = 'Blocked. Medical necessity denials must come from a licensed clinician. Use Send to clinician.'; return; }
    if (isOverride && !reason) { err.textContent = 'Pick an override reason. It helps us fix the model.'; document.getElementById('d-reason').focus(); return; }
    if (act === 'deny' && note.length < 20) { err.textContent = 'Write the specific reason in plain words (at least 20 characters). Vague reasons are not allowed.'; document.getElementById('d-note').focus(); return; }
    S.decisions[id] = { act: act, label: ACT[act].label, override: isOverride, reason: reason, note: note, by: 'Demo reviewer', at: nowStamp(), letter: letterFor(c, act, note) };
    addLog(id + ': ' + ACT[act].label + (isOverride ? ' (override)' : ''));
    save(); toast('Saved: ' + ACT[act].label + ' on ' + id); vClaim(id);
  }

  // ---------- DENIALS ----------
  var VAGUE = 'Claim denied. Service not covered per plan.';
  function reasonChecks(t) {
    var s = t.toLowerCase();
    return [
      ['Names the exact policy or rule', /(policy|ex-\d|ncci|section|rule|criteria)/.test(s)],
      ['Says what was missing or wrong', /(missing|no |not include|did not|needs|without|only \d|units|modifier|record|note)/.test(s) && s.length > 60],
      ['Says how to fix it', /(send|submit|upload|corrected|resubmit|attach|call)/.test(s)],
      ['Explains appeal rights', /(appeal)/.test(s)],
      ['Plain words, short sentences', t.length > 0 && t.split(/[.!?]/).filter(function (x) { return x.trim(); }).every(function (x) { return x.trim().split(/\s+/).length <= 25; })]
    ];
  }
  function vDenials() {
    var mix = D.denialMix;
    var after = mix.map(function (m) { var s = m.share; if (!m.clear) s = 4; else s = Math.round(m.share * 1.0 + (31 - 4) * m.share / 69); return { reason: m.reason, share: s, clear: m.clear }; });
    var show = ui.mix === 'before' ? mix : after;
    var risky = D.claims.filter(function (c) { return status(c) === 'Open'; }).sort(function (a, b) { return b.appealRisk - a.appealRisk; }).slice(0, 6);
    var h = '<div class="head"><div><div class="crumb">Quality and risk</div><h1>Denials and appeals</h1><p>Most denials in public data carry vague or administrative reasons. Clear, specific reasons help providers fix claims and cut avoidable appeals. Data on this page is synthetic.</p></div><a class="btn" href="#/problems">See the research</a></div>';
    h += '<div class="grid g4"><div class="card kpi"><div class="k">Denials coded "Other"</div><div class="v">' + (ui.mix === 'before' ? '31%' : '4%') + '</div><div class="d">goal under 5%</div></div><div class="card kpi"><div class="k">Reason quality, avg</div><div class="v">' + (ui.mix === 'before' ? '2.1 / 5' : '4.6 / 5') + '</div><div class="d">5 point checklist below</div></div><div class="card kpi"><div class="k">Overturned on appeal</div><div class="v">1.9%</div><div class="d up">was 2.6%</div></div><div class="card kpi"><div class="k">AI only denials</div><div class="v">0</div><div class="d up">blocked by design</div></div></div>';
    h += '<div class="grid g2 mt"><div class="card"><div class="row between"><h2>Denial reasons, synthetic book</h2></div><div class="chips mt" role="group" aria-label="Before or after"><button class="chip' + (ui.mix === 'before' ? ' on' : '') + '" data-act="mix" data-v="before">Before copilot</button><button class="chip' + (ui.mix === 'after' ? ' on' : '') + '" data-act="mix" data-v="after">With specific reasons</button></div>';
    show.forEach(function (m) { h += bar(esc(m.reason), m.share, 35, m.share + '%', m.clear ? 'var(--brand)' : 'var(--bad)'); });
    h += '<p class="small muted">Real world anchor: KFF found 36% of in-network denials on HealthCare.gov plans in 2024 were coded "Other". <a href="https://www.kff.org/patient-consumer-protections/claims-denials-and-appeals-in-aca-marketplace-plans-in-2024/" target="_blank" rel="noopener">KFF source</a></p></div>';
    h += '<div class="card"><h2>Reason quality checker</h2><p class="small muted">Paste a denial reason. The checker scores it before it goes out. CMS-0057-F asks for a specific reason on prior auth denials from 2026.</p><div class="field"><label for="rq">Denial reason text</label><textarea id="rq">' + esc(VAGUE) + '</textarea></div><ul class="checks mt" id="rq-checks"></ul><div class="row mt"><button class="btn primary" data-act="rewrite">Rewrite with copilot</button><button class="btn" data-act="vague">Load vague example</button></div></div></div>';
    h += '<div class="grid g2 mt"><div class="card"><h2>Second look before it goes out</h2><p class="small muted">Open claims with the highest chance of appeal and overturn. Fix these first.</p><div class="scroll"><table class="tbl stack"><thead><tr><th>Claim</th><th>Reason pended</th><th>Copilot</th><th class="num">Risk</th></tr></thead><tbody>' + risky.map(function (c) { return '<tr class="click" data-href="#/claim/' + c.id + '"><td data-l="Claim"><a href="#/claim/' + c.id + '">' + c.id + '</a></td><td data-l="Reason">' + esc(c.pend) + '</td><td data-l="Copilot">' + recPill(c.rec) + '</td><td class="num" data-l="Risk"><b>' + c.appealRisk + '%</b></td></tr>'; }).join('') + '</tbody></table></div></div>';
    var pa = [['PA-SYN-8812', 'Expedited', 'MRI lumbar spine', 9], ['PA-SYN-8815', 'Expedited', 'Home oxygen', 31], ['PA-SYN-8790', 'Standard', 'Knee arthroscopy', 22], ['PA-SYN-8771', 'Standard', 'Sleep study', 70], ['PA-SYN-8764', 'Standard', 'Outpatient PT, 12 visits', 118]];
    h += '<div class="card"><h2>Prior auth clocks (CMS-0057-F)</h2><p class="small muted">Example limits for impacted payers: 72 hours expedited, 7 calendar days standard. Synthetic requests.</p><div class="scroll"><table class="tbl stack"><thead><tr><th>Request</th><th>Type</th><th>Service</th><th class="num">Hours left</th></tr></thead><tbody>' + pa.map(function (p) { var lim = p[1] === 'Expedited' ? 72 : 168; var cls = p[3] < lim * 0.2 ? 'red' : p[3] < lim * 0.5 ? 'amber' : 'green'; return '<tr><td data-l="Request">' + p[0] + '</td><td data-l="Type">' + p[1] + '</td><td data-l="Service">' + p[2] + '</td><td class="num" data-l="Hours left"><span class="clock ' + cls + '">' + p[3] + ' h</span></td></tr>'; }).join('') + '</tbody></table></div><p class="small mt"><a href="https://www.cms.gov/newsroom/fact-sheets/cms-interoperability-prior-authorization-final-rule-cms-0057-f" target="_blank" rel="noopener">CMS-0057-F fact sheet</a></p></div></div>';
    view.innerHTML = h;
    var rq = document.getElementById('rq');
    rq.addEventListener('input', rqUpdate); rqUpdate();
  }
  function rqUpdate() {
    var t = document.getElementById('rq').value; var cs = reasonChecks(t); var n = cs.filter(function (x) { return x[1]; }).length;
    document.getElementById('rq-checks').innerHTML = cs.map(function (x) { return '<li><span class="pill ' + (x[1] ? 'good' : 'bad') + '">' + (x[1] ? 'Pass' : 'Fix') + '</span><span>' + x[0] + '</span></li>'; }).join('') + '<li><span class="pill ' + (n >= 4 ? 'good' : 'warn') + '">' + n + ' / 5</span><b>' + (n >= 4 ? 'Ready to send' : 'Not ready. A reviewer must fix this first.') + '</b></li>';
  }

  // ---------- INTEGRITY ----------
  function vIntegrity() {
    var stages = ['all', 'Pre-pay hold', 'Provider outreach', 'Post-pay review', 'Education first', 'Watch'];
    var list = D.anomalies.filter(function (a) { return ui.stage === 'all' || a.stage === ui.stage; });
    var total = D.anomalies.reduce(function (s, a) { return s + a.dollars; }, 0);
    var h = '<div class="head"><div><div class="crumb">Quality and risk</div><h1>Payment integrity leads</h1><p>The copilot spots patterns that look off. A flag is a lead, not a finding. An investigator decides, and honest providers still get paid on time.</p></div></div>';
    h += '<div class="grid g4"><div class="card kpi"><div class="k">Open leads</div><div class="v">' + D.anomalies.length + '</div></div><div class="card kpi"><div class="k">Dollars under review</div><div class="v">' + money(total) + '</div><div class="d">synthetic</div></div><div class="card kpi"><div class="k">Leads confirmed last quarter</div><div class="v">38%</div><div class="d">precision, synthetic</div></div><div class="card kpi"><div class="k">Valid claims held past prompt pay</div><div class="v">0</div><div class="d up">guardrail</div></div></div>';
    h += '<div class="card mt"><div class="chips" role="group" aria-label="Filter by stage">' + stages.map(function (s) { return '<button class="chip' + (ui.stage === s ? ' on' : '') + '" data-act="stage" data-v="' + s + '">' + (s === 'all' ? 'All stages' : s) + '</button>'; }).join('') + '</div></div>';
    h += '<div class="grid g2 mt">' + list.map(function (a) {
      var st = S.leads[a.id];
      var related = D.claims.filter(function (c) { return c.provider === a.provider; }).slice(0, 3);
      return '<div class="card"><div class="row between"><span class="pill pi">' + esc(a.type) + '</span><span class="pill">' + (st ? esc(st) : esc(a.stage)) + '</span></div><h3 class="mt">' + a.id + ' · ' + esc(a.provider) + '</h3><div class="small muted">' + a.claims + ' claims · ' + money(a.dollars) + '</div><div class="mt small">Signal strength ' + Math.round(a.score * 100) + '%</div><div class="meter"><i style="width:' + Math.round(a.score * 100) + '%;background:var(--pi)"></i></div><p class="mt small">' + esc(a.detail) + '</p><div class="cite small"><b>Next step:</b> ' + esc(a.next) + '</div>' + (related.length ? '<div class="small mt"><b>Sample claims:</b> ' + related.map(function (c) { return '<a href="#/claim/' + c.id + '">' + c.id + '</a>'; }).join(', ') + '</div>' : '') + '<div class="actions mt"><button class="btn" data-act="lead" data-id="' + a.id + '" data-v="Confirmed, investigator">Confirm lead</button><button class="btn" data-act="lead" data-id="' + a.id + '" data-v="Cleared, release claims">Clear and release</button></div></div>';
    }).join('') + '</div>';
    h += '<div class="card mt"><h2>Rules of the road</h2><ul class="checks"><li><span class="pill good">1</span><span>No claim is denied because of a pattern flag alone. A person reviews the record.</span></li><li><span class="pill good">2</span><span>Pre-pay holds must clear inside the prompt pay window, or the valid part pays.</span></li><li><span class="pill good">3</span><span>Education before penalties when the pattern looks like an honest coding mistake.</span></li><li><span class="pill good">4</span><span>Every lead tracks precision. Rules that waste provider time get retired.</span></li></ul><p class="small muted mt">Why this matters: CMS estimated a 6.55% Medicare fee for service improper payment rate in FY 2025, and 24.12% for DME. Improper payments are not the same as fraud. <a href="https://www.cms.gov/data-research/monitoring-programs/improper-payment-measurement-programs/comprehensive-error-rate-testing-cert" target="_blank" rel="noopener">CMS CERT</a></p></div>';
    view.innerHTML = h;
  }

  // ---------- EVAL ----------
  function slicesNow() {
    return D.evalData.slices.map(function (s) {
      var cand = s.cand;
      if (S.gateFixed) { if (s.slice === 'Medicaid') cand = 0.133; if (s.slice === 'Spanish language preference') cand = 0.131; if (s.slice === 'Paper claims') cand = 0.138; if (s.slice === 'Rural ZIP') cand = 0.128; }
      return { slice: s.slice, n: s.n, prod: s.prod, cand: cand };
    });
  }
  function gate() {
    var E = D.evalData, p = E.prod, c = E.cand, sl = slicesNow(), overall = S.gateFixed ? 0.124 : E.overallInfoRate.cand;
    var worst = sl.reduce(function (m, s) { var g = s.cand - overall; return g > m.g ? { g: g, s: s.slice } : m; }, { g: -1, s: '' });
    var agreement = S.gateFixed ? 0.931 : c.agreement;
    return {
      overall: overall, worst: worst, agreement: agreement,
      checks: [
        ['Agreement with expert reviewers is at least as good as live', agreement >= p.agreement, pct(agreement) + ' vs ' + pct(p.agreement)],
        ['Unsafe suggestions (any path to an AI only denial) equal zero', c.unsafe === 0, String(c.unsafe) + ' of ' + E.goldenSet.toLocaleString('en-US')],
        ['Wrong "pay" suggestions do not go up', c.falsePay <= p.falsePay, pct(c.falsePay) + ' vs ' + pct(p.falsePay)],
        ['Confidence is calibrated (error under 4 pts)', c.calib < 0.04, pct(c.calib)],
        ['No slice is more than 3 pts above average for "request info" rate', worst.g <= E.sliceGap, worst.s + ': +' + (worst.g * 100).toFixed(1) + ' pts'],
        ['Explanations pass the grader and a human spot check', true, '96% pass, 50 read by a senior processor']
      ]
    };
  }
  function vEval() {
    var E = D.evalData, G = gate(), passed = G.checks.every(function (x) { return x[1]; });
    var candName = S.gateFixed ? 'Model v2.4.1 (candidate)' : E.cand.name;
    var h = '<div class="head"><div><div class="crumb">Quality and risk</div><h1>Model quality gate</h1><p>No model change reaches reviewers until it beats the live model on a fixed test set and passes fairness slices. This is how we keep trust while moving fast. Synthetic numbers.</p></div>' + (S.shipped ? '<span class="pill good">Shipped to shadow mode</span>' : passed ? '<span class="pill good">Ready to ship</span>' : '<span class="pill bad">Blocked</span>') + '</div>';
    h += '<div class="grid g3"><div class="card span2"><h2>Live vs candidate</h2><div class="scroll"><table class="tbl stack"><thead><tr><th>Metric</th><th class="num">' + esc(E.prod.name) + '</th><th class="num">' + esc(candName) + '</th></tr></thead><tbody>';
    [['Agreement with expert reviewers', pct(E.prod.agreement), pct(G.agreement)], ['Unsafe suggestions', '0', '0'], ['Wrong "pay" rate', pct(E.prod.falsePay), pct(E.cand.falsePay)], ['Calibration error', pct(E.prod.calib), pct(E.cand.calib)], ['Reviewer override rate (shadow)', pct(E.prod.override), pct(E.cand.override)], ['Median time to suggestion', E.prod.latency + ' s', E.cand.latency + ' s']].forEach(function (r) { h += '<tr><td data-l="Metric">' + r[0] + '</td><td class="num" data-l="Live">' + r[1] + '</td><td class="num" data-l="Candidate"><b>' + r[2] + '</b></td></tr>'; });
    h += '</tbody></table></div><p class="small muted">Test set: ' + E.goldenSet.toLocaleString('en-US') + ' synthetic claims labeled by senior processors and clinicians, plus simulated edge cases.</p></div>';
    h += '<div class="card"><h2>Ship gate</h2><ul class="checks">' + G.checks.map(function (x) { return '<li><span class="pill ' + (x[1] ? 'good' : 'bad') + '">' + (x[1] ? 'Pass' : 'Fail') + '</span><div><b>' + x[0] + '</b><div class="small muted">' + esc(x[2]) + '</div></div></li>'; }).join('') + '</ul></div></div>';
    h += '<div class="card mt"><div class="row between"><h2>Fairness slices: "request info" rate</h2><div class="legend"><span><i style="background:#9aa7c2"></i>Live</span><span><i style="background:var(--brand)"></i>Candidate</span><span><i style="background:var(--bad)"></i>Over the 3 pt limit</span></div></div><p class="small muted">If one group gets asked for more paperwork than others, that is a burden and a delay. Average candidate rate: ' + pct(G.overall) + '. Limit: ' + pct(G.overall + E.sliceGap) + '.</p>';
    slicesNow().forEach(function (s) {
      var over = s.cand - G.overall > E.sliceGap;
      h += '<div class="bar"><span class="l"><b>' + esc(s.slice) + '</b> <span class="muted small">n=' + s.n + '</span></span><span class="n">' + pct(s.prod) + ' to <span style="color:' + (over ? 'var(--bad)' : 'inherit') + '">' + pct(s.cand) + '</span></span><div class="meter" style="height:6px"><i style="width:' + (s.prod / 0.2 * 100) + '%;background:#9aa7c2"></i></div><div class="meter"><i style="width:' + (s.cand / 0.2 * 100) + '%;background:' + (over ? 'var(--bad)' : 'var(--brand)') + '"></i></div></div>';
    });
    if (!passed) h += '<div class="callout bad mt"><b>Blocked:</b> v2.4 asks Medicaid members\' providers for more info far more often. Root cause in this story: Medicaid claims had fewer readable attachments in training. <div class="row mt"><button class="btn primary" data-act="fixgate">Retrain with Medicaid attachment data and rerun</button></div></div>';
    else if (!S.shipped) h += '<div class="callout good mt"><b>All checks pass.</b> Sign off to ship to pilot desks in shadow mode first.<div class="grid g2 mt"><div class="field"><label for="signer">Your name</label><input type="text" id="signer" placeholder="Product manager"></div><div class="field"><label for="ack" style="min-height:44px;display:flex;align-items:center;gap:10px"><input type="checkbox" id="ack" style="width:22px;height:22px"> I read the slice report and override reasons</label></div></div><div class="err" id="ship-err" role="alert"></div><button class="btn good" data-act="ship">Approve ship to shadow mode</button></div>';
    else h += '<div class="callout good mt"><b>Shipped to shadow mode</b> by ' + esc(S.signer) + '. Reviewers see v2.4.1 suggestions next to v2.3 for 2 weeks before it goes live.</div>';
    h += '</div>';
    h += '<div class="grid g2 mt"><div class="card"><h2>Why reviewers overrode the copilot</h2><p class="small muted">Last 30 days, synthetic. Each reason becomes backlog work.</p>' + E.overrideReasons.map(function (r) { return bar(esc(r[0]), r[1], 40, r[1] + '%', 'var(--teal)'); }).join('') + '</div>';
    h += '<div class="card"><h2>Release history</h2><div class="scroll"><table class="tbl stack"><thead><tr><th>Version</th><th>Date</th><th class="num">Agreement</th><th class="num">Override</th><th>Result</th></tr></thead><tbody>' + E.history.map(function (r) { var res = r.shipped === true ? '<span class="pill good">Shipped</span>' : r.shipped === false ? '<span class="pill bad">Blocked</span>' : (S.shipped ? '<span class="pill good">Shadow</span>' : '<span class="pill warn">In gate</span>'); return '<tr><td data-l="Version"><b>' + r.v + '</b></td><td data-l="Date">' + r.date + '</td><td class="num" data-l="Agreement">' + pct(r.agreement) + '</td><td class="num" data-l="Override">' + pct(r.override) + '</td><td data-l="Result">' + res + (r.note ? '<div class="small muted">' + esc(r.note) + '</div>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div></div></div>';
    h += '<div class="card mt"><h2>How the eval harness works</h2><ol class="steps"><li><b>Golden set.</b> Real workflows, synthetic data. Senior processors and clinicians label the right next action for each claim.</li><li><b>Simulated cases.</b> Generate hard edge cases (typos in IDs, stale COB, unit errors) so rare failures show up before launch.</li><li><b>Graders.</b> An LLM grader scores each explanation for evidence and policy citation. Humans spot check a sample every release.</li><li><b>Regression gate.</b> Every model or prompt change runs the full set. Any fail blocks the release, same as a failing unit test.</li><li><b>Shadow then live.</b> New versions run silently next to the live one before reviewers see them.</li></ol></div>';
    view.innerHTML = h;
  }

  // ---------- PROBLEMS ----------
  function vProblems() {
    var h = '<div class="head"><div><div class="crumb">Why this exists</div><h1>Problems we solve</h1><p>Real, public numbers on the problems a claims AI team works on. Each card links to its source and to the part of this prototype that tackles it.</p></div></div>';
    h += '<div class="grid g3">' + D.sources.map(function (s) {
      var vlink = s.view === 'claim' ? 'claim/' + D.claims[3].id : s.view;
      return '<article class="card prob"><div class="stat">' + esc(s.stat) + '</div><p><b>' + esc(s.label) + '</b></p><p class="small">' + esc(s.more) + '</p><div class="src"><a href="' + s.url + '" target="_blank" rel="noopener">' + esc(s.org) + '</a>' + (s.url2 ? ' · <a href="' + s.url2 + '" target="_blank" rel="noopener">Case tracker</a>' : '') + '</div><div class="help"><b>How the copilot helps:</b> ' + esc(s.help) + ' <a href="#/' + vlink + '">See it</a></div></article>';
    }).join('') + '</div>';
    h += '<div class="callout mt small">Numbers come from the linked public sources as read on Oct 28, 2026. They describe the industry, not CVS Health or Aetna operations. Everything inside the app views is synthetic.</div>';
    view.innerHTML = h;
  }

  // ---------- PLAN ----------
  function vPlan() {
    var h = '<div class="head"><div><div class="crumb">Why this exists</div><h1>Squad plan</h1><p>How I would run discovery and delivery for an AI claims decision support squad. Written as a starting point to test with the team, not a final answer.</p></div></div>';
    h += '<div class="grid g3"><div class="card"><h2>North star</h2><p><b>Correct decisions per reviewer hour</b></p><p class="small">Speed only counts if the decision holds up. A fast wrong denial is a cost, not a win.</p><h3 class="mt">Guardrails</h3><ul class="small"><li>AI only denials: always 0</li><li>Overturned on appeal: down, never up</li><li>Paid inside prompt pay window: 99%+</li><li>Slice gap for any group: 3 pts or less</li><li>Reviewer trust score: up month over month</li></ul></div>';
    h += '<div class="card"><h2>First 30 days: discovery</h2><ul class="small"><li>Shadow 12 processors across 3 lines of business. Time each pend reason.</li><li>Pull top 20 pend reasons by volume and by minutes. Pick 3 to start.</li><li>Read 100 overturned appeals. Tag the root cause.</li><li>Sit with Data Science on model logic, labels, and what "right" means.</li><li>Agree on the ship gate with ops, compliance, and clinical leads.</li></ul></div>';
    h += '<div class="card"><h2>Days 31 to 90: deliver</h2><ul class="small"><li>Ship copilot triage for the top 3 pend reasons in shadow mode.</li><li>Override reasons captured on every decision. Weekly review with DS.</li><li>Prompt pay clock sorting live on pilot desks.</li><li>Reason quality checker on every adverse notice.</li><li>Monthly readout to leadership: north star, guardrails, next bets.</li></ul></div></div>';
    var bl = [
      ['Link orphan prior auths to claims', 'Biggest avoidable pend in shadowing (synthetic example)', 'Pend rate, minutes saved', 'M'],
      ['Override reason capture', 'Labels for the next model and trust signal', '% decisions with reason', 'S'],
      ['Attachment reader with page cite', 'Only 24% of medical attachments are fully electronic (CAQH 2025)', 'Handle time on attachment claims', 'L'],
      ['Reason quality checker', 'Vague "Other" reasons drive appeals (KFF 2024)', 'Reason score, overturn rate', 'S'],
      ['Fairness slice gate in CI', 'Stop a model that burdens one group', 'Slice gap', 'M'],
      ['Integrity lead precision tracking', 'Do not waste honest providers\' time', 'Lead precision', 'S']
    ];
    h += '<div class="card mt"><h2>Starter backlog</h2><div class="scroll"><table class="tbl stack"><thead><tr><th>Item</th><th>Why</th><th>Metric</th><th>Size</th></tr></thead><tbody>' + bl.map(function (b) { return '<tr><td data-l="Item"><b>' + esc(b[0]) + '</b></td><td data-l="Why">' + esc(b[1]) + '</td><td data-l="Metric">' + esc(b[2]) + '</td><td data-l="Size"><span class="pill">' + b[3] + '</span></td></tr>'; }).join('') + '</tbody></table></div></div>';
    h += '<div class="grid g2 mt"><div class="card"><h2>Risks I would watch</h2><ul class="small"><li><b>Automation bias.</b> Reviewers rubber stamp. Fix: show evidence first, track agreement on hard cases, spot audits.</li><li><b>Policy drift.</b> Copilot cites an old version. Fix: policy version on every citation, gate on policy updates.</li><li><b>Fairness.</b> One group gets more paperwork. Fix: slice gate before ship.</li><li><b>Regulation.</b> State AI laws and CMS rules change. Fix: compliance in the gate, not after.</li></ul></div>';
    h += '<div class="card"><h2>About the builder</h2><p class="small">I am Ami Dwivedi, an AI product manager at Ellipsis Health. I built voice AI agents for payor calls and benefits checks, with memory. I also built the eval harnesses behind them: simulated callers, LLM graders, and regression gates that block a release when quality drops. This prototype uses the same playbook for claims.</p><p class="small muted">This is a concept prototype made for a job conversation. It is not a CVS Health or Aetna product and uses no CVS data.</p></div></div>';
    view.innerHTML = h;
  }

  // ---------- router + events ----------
  function route() {
    var hash = location.hash.replace(/^#\/?/, '') || 'pulse';
    var parts = hash.split('/'); var r = parts[0];
    renderNav(r); closeMenu();
    if (r === 'pulse') vPulse();
    else if (r === 'queue') vQueue();
    else if (r === 'claim') vClaim(parts[1]);
    else if (r === 'denials') vDenials();
    else if (r === 'integrity') vIntegrity();
    else if (r === 'eval') vEval();
    else if (r === 'problems') vProblems();
    else if (r === 'plan') vPlan();
    else { location.hash = '#/pulse'; return; }
    window.scrollTo(0, 0);
    var t = { pulse: 'Pulse', queue: 'Work queue', claim: 'Claim ' + (parts[1] || ''), denials: 'Denials and appeals', integrity: 'Payment integrity', eval: 'Model quality gate', problems: 'Problems we solve', plan: 'Squad plan' }[r];
    document.title = t + ' · Claims Review Copilot (concept, synthetic data)';
  }
  document.addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-href]');
    if (tr && !e.target.closest('a')) { location.hash = tr.getAttribute('data-href'); return; }
    var b = e.target.closest('[data-act]'); if (!b) return;
    var a = b.getAttribute('data-act'), v = b.getAttribute('data-v'), id = b.getAttribute('data-id');
    if (a === 'rec') { ui.rec = v; document.querySelectorAll('[data-act=rec]').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-v') === v); }); qList(); }
    else if (a === 'qfilter') { ui.rec = v; }
    else if (a === 'jump') { e.preventDefault(); var dd = document.getElementById('decide'); dd.scrollIntoView({ behavior: 'smooth', block: 'start' }); var f = dd.querySelector('select,button'); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 400); }
    else if (a === 'decide') doDecide(id);
    else if (a === 'pickrec') { var c = byId(id); document.getElementById('d-act').value = c.rec; document.getElementById('d-reason').value = ''; decidePreview(c); }
    else if (a === 'undo') { delete S.decisions[id]; addLog(id + ': decision undone'); save(); toast('Decision undone'); vClaim(id); }
    else if (a === 'mix') { ui.mix = v; vDenials(); }
    else if (a === 'rewrite') { document.getElementById('rq').value = 'Not paid as billed. Policy EX-402 needs 12 weeks of physical therapy notes before a knee replacement. The record only has 6 weeks. Please send the remaining notes or a note on why therapy was not possible. You can also appeal. Steps are on the attached form.'; rqUpdate(); toast('Rewritten. Review it before sending.'); }
    else if (a === 'vague') { document.getElementById('rq').value = VAGUE; rqUpdate(); }
    else if (a === 'stage') { ui.stage = v; vIntegrity(); }
    else if (a === 'lead') { S.leads[id] = v; addLog(id + ': ' + v); save(); toast(id + ': ' + v); vIntegrity(); }
    else if (a === 'fixgate') { S.gateFixed = true; addLog('Model v2.4.1 retrained and rerun'); save(); toast('Rerun complete: v2.4.1'); vEval(); }
    else if (a === 'ship') {
      var n = document.getElementById('signer').value.trim(), ack = document.getElementById('ack').checked, err = document.getElementById('ship-err');
      if (!n || !ack) { err.textContent = 'Add your name and confirm you read the slice report.'; return; }
      S.shipped = true; S.signer = n; addLog('v2.4.1 approved for shadow mode by ' + n); save(); toast('Approved for shadow mode'); vEval();
    }
    else if (a === 'reset') { S = fresh(); save(); ui = { rec: 'all', lob: 'all', sort: 'clock', q: '', stage: 'all', mix: 'before' }; toast('Demo reset'); route(); }
  });
  window.addEventListener('hashchange', route);
  route();
})();
