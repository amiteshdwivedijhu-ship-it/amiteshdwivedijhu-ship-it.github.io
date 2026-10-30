/* Proof Desk. Concept prototype by Amitesh Dwivedi. Example data only. Not affiliated with Hebbia. */
(function () {
  'use strict';
  var D = window.PD;
  var KEY = 'proofdesk-state-v1';
  var view = document.getElementById('view');
  var ui = { filter: 'all', sel: null, claim: null };

  function fresh() { return { res: {}, approved: false, signer: '', cellFix: {}, gateFixed: false, shipped: false, shipper: '', log: [] }; }
  var S = load();
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.res) return s; } catch (e) {} return fresh(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pct(n, d) { return (n * 100).toFixed(d == null ? 1 : d) + '%'; }
  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function nowStamp() { return new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  function toast(msg) { document.querySelectorAll('.toast').forEach(function (x) { x.remove(); }); var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600); }
  function addLog(t) { S.log.unshift({ at: nowStamp(), text: t }); S.log = S.log.slice(0, 50); save(); }
  function row(id) { for (var i = 0; i < D.rows.length; i++) if (D.rows[i].id === id) return D.rows[i]; return null; }
  function col(k) { for (var i = 0; i < D.COLS.length; i++) if (D.COLS[i].k === k) return D.COLS[i]; return null; }
  function cellOf(r, k) { var c = r.cells[k]; var key = r.id + '/' + k; if (S.cellFix[key] && c.alt) return { v: c.alt.v, conf: 0.97, status: 'ok', src: { doc: c.alt.doc, page: c.alt.page, sec: c.alt.sec, quote: c.alt.quote }, fixed: true, orig: c }; return c; }
  function statusPill(s) { var m = { ok: ['good', 'Verified'], low: ['warn', 'Low confidence'], conflict: ['bad', 'Sources disagree'], missing: ['', 'Not found'], unsupported: ['bad', 'No source'], fixed: ['info', 'Fixed by reviewer'], removed: ['', 'Removed'] }[s] || ['', s]; return '<span class="pill ' + m[0] + '">' + m[1] + '</span>'; }

  // ---------- nav ----------
  var NAV = [
    ['grp', 'Work'],
    ['pulse', 'Pulse', '&#9673;'],
    ['matrix', 'Matrix run', '&#9638;'],
    ['memo', 'Deliverable check', '&#10003;'],
    ['grp', 'Quality and launch'],
    ['evals', 'Quality bar and evals', '&#9878;'],
    ['adoption', 'Launch and adoption', '&#8599;'],
    ['grp', 'Why this exists'],
    ['problems', 'Problems we solve', '&#9733;'],
    ['plan', 'Roadmap and plan', '&#9873;']
  ];
  var side = document.getElementById('side'), overlay = document.getElementById('overlay'), menuBtn = document.getElementById('menuBtn');
  function renderNav(r) {
    var h = '';
    NAV.forEach(function (n) {
      if (n[0] === 'grp') { h += '<div class="grp">' + n[1] + '</div>'; return; }
      var on = r === n[0];
      h += '<a class="' + (on ? 'on' : '') + '" href="#/' + n[0] + '"' + (on ? ' aria-current="page"' : '') + '><span class="ico" aria-hidden="true">' + n[2] + '</span>' + n[1] + '</a>';
    });
    h += '<div class="who"><b>Demo reviewer:</b> you.<br>Your choices are saved in this browser only. <button class="btn ghost small mt" data-act="reset" style="width:100%">Reset demo</button></div>';
    side.innerHTML = h;
  }
  function closeMenu() { side.classList.remove('open'); overlay.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', function () { var o = !side.classList.contains('open'); side.classList.toggle('open', o); overlay.classList.toggle('open', o); menuBtn.setAttribute('aria-expanded', String(o)); });
  overlay.addEventListener('click', closeMenu);

  // ---------- charts ----------
  function lineChart(vals, labels, color, fmt, W) {
    W = W || 560; var h = 200, p = { l: 44, r: 14, t: 16, b: 30 }, w = W;
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals), pad = (max - min) * 0.15 || 1; min -= pad; max += pad;
    var x = function (i) { return p.l + i * (w - p.l - p.r) / (vals.length - 1); };
    var y = function (v) { return p.t + (1 - (v - min) / (max - min)) * (h - p.t - p.b); };
    var pts = vals.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).join(' ');
    var grid = [0, 0.5, 1].map(function (f) { var v = min + (max - min) * f; return '<line x1="' + p.l + '" x2="' + (w - p.r) + '" y1="' + y(v) + '" y2="' + y(v) + '" style="stroke:var(--chart-grid)"/><text x="' + (p.l - 6) + '" y="' + (y(v) + 4) + '" font-size="11" text-anchor="end" style="fill:var(--chart-label);font-family:var(--ff-sans)">' + fmt(v) + '</text>'; }).join('');
    var lab = labels.map(function (l, i) { return (i % 3 === 0 || i === labels.length - 1) ? '<text x="' + x(i) + '" y="' + (h - 8) + '" font-size="11" text-anchor="middle" style="fill:var(--chart-label);font-family:var(--ff-sans)">' + l + '</text>' : ''; }).join('');
    var area = '<polygon points="' + x(0) + ',' + (h - p.b) + ' ' + pts + ' ' + x(vals.length - 1) + ',' + (h - p.b) + '" style="fill:' + color + '" opacity=".07"/>';
    var dots = vals.map(function (v, i) { return '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="2.6" fill="#fff" style="stroke:' + color + '" stroke-width="1.5"/>'; }).join('');
    return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Trend chart">' + grid + area + '<polyline points="' + pts + '" fill="none" style="stroke:' + color + '" stroke-width="1.75"/>' + dots + lab + '</svg>';
  }
  function bar(label, val, max, txt, color) { return '<div class="bar"><span class="l">' + label + '</span><span class="n">' + txt + '</span><div class="meter"><i style="width:' + Math.min(100, val / max * 100) + '%;background:' + (color || 'var(--brand)') + '"></i></div></div>'; }

  // ---------- PULSE ----------
  function vPulse() {
    var P = D.pulse;
    var h = '<section class="hero"><span class="pill">Concept prototype · example data</span><h1 class="mt" style="font-size:1.7rem">Proof Desk: every number in an AI memo, checked before it leaves the firm</h1><p>Matrix 2.0 now carries work from a grid all the way to a memo, deck, or email. Proof Desk is a concept for the sign off step: it links each claim to its cell and its page, flags what a human must check, and turns every edit into an eval. The goal is more work approved, with zero unsupported numbers sent.</p><div class="row mt"><a class="btn" href="#/memo">Try the 90 second path</a><a class="btn ghost" href="#/problems">See the problems</a></div>';
    h += '<ol class="path mt"><li><a href="#/matrix">Matrix run</a>: 16 credit agreements. Filter "Needs a look".</li><li>Open Harbor Lane leverage. Two documents disagree. Accept the newer amendment.</li><li><a href="#/memo">Deliverable check</a>: fix 3 flagged claims, then approve.</li><li><a href="#/evals">Evals</a>: v1.7 is blocked on amended agreements. Fix and rerun.</li><li><a href="#/adoption">Launch</a>: see which accounts get value and which are at risk.</li><li><a href="#/plan">Roadmap</a>: how I would run this area in the first 90 days.</li></ol></section>';
    h += '<div class="head"><div><div class="crumb">Product area health</div><h2 style="font-size:1.3rem;margin:0">Pulse: deliverable trust</h2><p class="small">All metrics are example data for a made up rollout. 12 weeks since Matrix 2.0 launch.</p></div></div>';
    h += '<div class="grid g6">' + P.kpis.map(function (k) { return '<div class="card kpi"><div class="k">' + esc(k.k) + '</div><div class="v">' + esc(k.v) + '</div><div class="d' + (k.good ? ' up' : '') + '">' + esc(k.d) + '</div></div>'; }).join('') + '</div>';
    h += '<div class="grid g2 mt"><div class="card"><div class="row between"><h2>Deliverables approved per week</h2><span class="pill good">8x since Aug</span></div>' + lineChart(P.approved, P.weeks, 'var(--chart-1)', function (v) { return Math.round(v); }) + '</div>';
    h += '<div class="card"><div class="row between"><h2>Median minutes to sign off</h2><span class="pill good">-41 min</span></div>' + lineChart(P.signoff, P.weeks, 'var(--chart-2)', function (v) { return Math.round(v); }) + '</div></div>';
    h += '<div class="grid g3 mt"><div class="card"><h2>Approved with no edits</h2><p class="small muted">Share of deliverables a reviewer approved as drafted.</p>' + lineChart(P.noEdit, P.weeks, 'var(--chart-3)', function (v) { return Math.round(v) + '%'; }, 360) + '</div>';
    h += '<div class="card"><h2>Why reviewers edited</h2><p class="small muted">Last 30 days. Each reason becomes an eval case or a backlog item.</p>' + P.editReasons.map(function (r) { return bar(esc(r[0]), r[1], 35, r[1] + '%', 'var(--teal)'); }).join('') + '<p class="small mt"><a href="#/evals">See the eval gate</a></p></div>';
    h += '<div class="card"><h2>Value calculator</h2><p class="small muted">Your assumptions. Not a Hebbia price or claim.</p><div class="field"><label for="r-a">Analysts using it weekly: <b id="r-a-v"></b></label><input type="range" id="r-a" min="10" max="500" step="10" value="120"></div><div class="field"><label for="r-h">Hours saved per analyst per week: <b id="r-h-v"></b></label><input type="range" id="r-h" min="1" max="12" step="1" value="5"></div><div class="field"><label for="r-c">Loaded cost per hour: <b id="r-c-v"></b></label><input type="range" id="r-c" min="80" max="400" step="10" value="180"></div><div class="callout good mt"><div class="small">Time value per year</div><div style="font-size:1.5rem;font-weight:800" id="r-out"></div><div class="small" id="r-note"></div></div></div></div>';
    view.innerHTML = h;
    var calc = function () {
      var a = +document.getElementById('r-a').value, hr = +document.getElementById('r-h').value, c = +document.getElementById('r-c').value;
      document.getElementById('r-a-v').textContent = a; document.getElementById('r-h-v').textContent = hr; document.getElementById('r-c-v').textContent = money(c);
      document.getElementById('r-out').textContent = money(a * hr * c * 48);
      document.getElementById('r-note').textContent = (a * hr * 48).toLocaleString('en-US') + ' hours a year, at 48 working weeks. FactSet says juniors could get back up to 10 hours a week.';
    };
    ['r-a', 'r-h', 'r-c'].forEach(function (id) { document.getElementById(id).addEventListener('input', calc); }); calc();
  }

  // ---------- MATRIX ----------
  function vMatrix(selRow, selCol) {
    if (selRow && selCol) ui.sel = selRow + '/' + selCol;
    var flagged = 0, missing = 0;
    D.rows.forEach(function (r) { D.COLS.forEach(function (c) { var x = cellOf(r, c.k); if (x.status === 'low' || x.status === 'conflict') flagged++; if (x.status === 'missing') missing++; }); });
    var nDocs = D.rows.reduce(function (a, r) { return a + r.docs; }, 0), nPages = D.rows.reduce(function (a, r) { return a + r.pages; }, 0);
    var h = '<div class="head"><div><div class="crumb">Work</div><h1>Matrix run: Q4 covenant review</h1><p>Example request: "Review every credit agreement in Fund III, pull the covenant terms, compare with the Q3 review, flag changes, and draft an IC memo." Max built these 8 columns. 16 borrowers, ' + nDocs + ' documents (agreements, amendments, compliance certificates). All names are made up.</p></div><a class="btn primary" href="#/memo">Go to memo draft</a></div>';
    h += '<div class="grid g4"><div class="card kpi"><div class="k">Cells</div><div class="v">' + (D.rows.length * D.COLS.length) + '</div><div class="d">Each with page and quote</div></div><div class="card kpi"><div class="k">Needs a look</div><div class="v" style="color:' + (flagged ? 'var(--bad)' : 'var(--good)') + '">' + flagged + '</div><div class="d">Low confidence or sources disagree</div></div><div class="card kpi"><div class="k">Not found</div><div class="v">' + missing + '</div><div class="d">Matrix said so instead of guessing</div></div><div class="card kpi"><div class="k">Run time</div><div class="v">6 min</div><div class="d">Example. ' + nPages.toLocaleString('en-US') + ' pages</div></div></div>';
    h += '<div class="row mt" role="group" aria-label="Filter rows"><div class="chips">' + [['all', 'All rows'], ['flag', 'Needs a look'], ['missing', 'Not found'], ['high', 'Flag for IC: High']].map(function (f) { return '<button class="chip' + (ui.filter === f[0] ? ' on' : '') + '" data-act="mfilter" data-v="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div><span class="legend"><span><i style="background:var(--content-arbor)"></i>Verified</span><span><i style="background:var(--content-solar)"></i>Low confidence</span><span><i style="background:var(--content-negative)"></i>Sources disagree</span><span><i style="background:var(--content-disabled)"></i>Not found</span></span></div>';
    h += '<div class="grid g3 mt"><div class="span2" style="min-width:0"><div class="mxwrap"><table class="mx"><thead><tr><th class="idx" aria-label="Row"></th><th><span class="hi" aria-hidden="true">&#9638;</span>Borrower</th>' + D.COLS.map(function (c) { return '<th title="' + esc(c.q) + '"><span class="hi" aria-hidden="true">' + (c.k === 'risk' ? '&#9673;' : c.k === 'chg' ? '&#8644;' : '&#8801;') + '</span>' + esc(c.label) + '</th>'; }).join('') + '</tr></thead><tbody>';
    D.rows.forEach(function (r) {
      var cs = D.COLS.map(function (c) { return cellOf(r, c.k); });
      if (ui.filter === 'flag' && !cs.some(function (x) { return x.status === 'low' || x.status === 'conflict'; })) return;
      if (ui.filter === 'missing' && !cs.some(function (x) { return x.status === 'missing'; })) return;
      if (ui.filter === 'high' && r.cells.risk.v !== 'High') return;
      h += '<tr><td class="idx">' + (+r.id.slice(1)) + '</td><td class="doc"><span class="co"><span class="av" style="background:' + AV[(+r.id.slice(1)) % AV.length] + '">' + esc(r.name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('')) + '</span>' + esc(r.name) + '</span><small>' + esc(r.sector) + '</small><span class="docpill"><b>PDF</b>' + r.docs + ' docs · ' + r.pages + ' pages</span></td>';
      D.COLS.forEach(function (c, j) {
        var x = cs[j], key = r.id + '/' + c.k;
        var cls = 'cell ' + (x.status !== 'ok' ? x.status : '') + (ui.sel === key ? ' sel' : '');
        var val = c.k === 'risk' ? '<span class="pill ' + (x.v === 'High' ? 'bad' : x.v === 'Medium' ? 'warn' : 'good') + '">' + esc(x.v) + '</span>' : esc(x.v);
        h += '<td><button class="' + cls + '" data-act="cell" data-v="' + key + '" data-l="' + esc(c.label) + '"><span class="flag ' + x.status + '"></span>' + val + '<span class="cf">' + (x.status === 'missing' ? 'Searched ' + r.docs + ' docs' : Math.round(x.conf * 100) + '% · ' + (x.src.page ? 'p. ' + x.src.page : 'derived')) + (x.fixed ? ' · fixed' : '') + '</span></button></td>';
      });
      h += '</tr>';
    });
    h += '</tbody></table></div></div><div id="drawer" class="drawer">' + drawer() + '</div></div>';
    view.innerHTML = h;
  }
  var AV = ['#465BFF', '#5E8E71', '#A46DE0', '#EC7F70', '#D7A136', '#262626', '#0E8AC6'];
  function usedIn(rid, k) { var out = []; Object.keys(D.memo.claims).forEach(function (id) { var c = D.memo.claims[id]; if (c.row === rid && c.col === k) out.push(id); }); return out; }
  function drawer() {
    if (!ui.sel) return '<div class="card"><h2>Source panel</h2><p class="small muted">Tap any cell to see the question, the answer, and the exact quote and page it came from.</p><div class="callout small">Try <a href="#/matrix/D01/lev">Harbor Lane Foods, max net leverage</a>. The credit agreement and a newer amendment disagree.</div></div>';
    var p = ui.sel.split('/'), r = row(p[0]), c = col(p[1]), x = cellOf(r, p[1]), raw = r.cells[p[1]];
    var h = '<div class="card"><div class="crumb">' + esc(r.name) + '</div><h2>' + esc(c.label) + '</h2><p class="small muted">Column prompt: ' + esc(c.q) + '</p>';
    h += '<div class="row between"><div style="font-size:1.25rem;font-weight:800">' + esc(x.v) + '</div>' + statusPill(x.fixed ? 'fixed' : x.status) + '</div>';
    h += '<p class="small muted">Confidence ' + Math.round(x.conf * 100) + '%</p>';
    h += '<h3 class="mt">' + esc(x.src.doc) + (x.src.page ? ', page ' + x.src.page : '') + '</h3><p class="small muted">' + esc(x.src.sec) + '</p>';
    if (x.src.quote) h += '<div class="quote">' + x.src.quote.replace(/&(?!amp;)/g, '&amp;') + '</div>';
    if (raw.alt && !x.fixed) {
      h += '<div class="callout ' + (raw.status === 'conflict' ? 'bad' : 'warn') + ' mt small"><b>' + esc(raw.note) + '</b></div>';
      h += '<h3 class="mt">' + esc(raw.alt.doc) + ', page ' + raw.alt.page + '</h3><p class="small muted">' + esc(raw.alt.sec) + '</p><div class="quote alt">' + raw.alt.quote + '</div>';
      h += '<div class="actions mt"><button class="btn primary" data-act="acceptalt" data-v="' + ui.sel + '">Use "' + esc(raw.alt.v.split(' through')[0]) + '" from this source</button><button class="btn" data-act="keep" data-v="' + ui.sel + '">Keep and add note</button></div>';
    } else if (x.fixed) {
      h += '<div class="callout good mt small">You replaced "' + esc(x.orig.v) + '" with the newer source. Logged as an eval case: <b>' + (raw.status === 'conflict' ? 'amendment precedence' : 'scanned page OCR') + '</b>. <button class="btn small mt" data-act="undofix" data-v="' + ui.sel + '">Undo</button></div>';
    } else if (raw.note) h += '<div class="callout mt small">' + esc(raw.note) + '</div>';
    var u = usedIn(r.id, p[1]);
    if (u.length) h += '<p class="small mt">Used in memo claim ' + u.map(function (id) { return '<a href="#/memo" data-act="gomemo" data-v="' + id + '">' + id.replace('c', '#') + '</a>'; }).join(', ') + '. If this cell changes, that claim is flagged again.</p>';
    return h + '</div>';
  }

  // ---------- MEMO ----------
  function claimState(id) {
    var c = D.memo.claims[id], r = S.res[id];
    if (r) return { cls: r.choice === 'remove' ? 'removed' : r.choice === 'keep' ? 'kept' : 'fixed', text: r.choice === 'fix' ? c.fix : c.text };
    if (c.row && c.col && (c.status === 'conflict' || c.status === 'low') && S.cellFix[c.row + '/' + c.col]) return { cls: 'fixed', text: c.fix, auto: true };
    return { cls: c.status, text: c.text };
  }
  function openIssues() { return Object.keys(D.memo.claims).filter(function (id) { var st = claimState(id).cls; return st === 'conflict' || st === 'low' || st === 'unsupported'; }); }
  function vMemo() {
    var M = D.memo, open = openIssues(), total = Object.keys(M.claims).length;
    var h = '<div class="head"><div><div class="crumb">Work</div><h1>Deliverable check</h1><p>Matrix drafted this IC memo from the run. Every claim is linked to a cell and a page. Green is verified. Red and amber need you. Nothing goes out until they are fixed.</p></div><span class="pill ' + (S.approved ? 'good' : open.length ? 'bad' : 'warn') + '">' + (S.approved ? 'Approved' : open.length ? open.length + ' to check' : 'Ready to approve') + '</span><button class="btn primary mobile-only" data-act="jump">Go to checkpoint</button></div>';
    h += '<div class="grid g3"><div class="card span2 memo"><div class="small muted" style="font-family:Inter,system-ui,sans-serif">To: ' + esc(M.to) + ' · From: ' + esc(M.from) + ' · ' + esc(M.date) + ' · <span class="pill">Example data</span></div><h2 class="mt" style="font-size:1.35rem">' + esc(M.title) + '</h2>';
    M.paras.forEach(function (p) {
      if (p[0] === 'h') { h += '<h3 class="mt">' + esc(p[1]) + '</h3>'; return; }
      h += '<p>' + esc(p[1]).replace(/\{(c\d+)\}/g, function (m, id) { var st = claimState(id); return '<span class="claim ' + st.cls + (ui.claim === id ? ' on' : '') + '" role="button" tabindex="0" data-act="claim" data-v="' + id + '">' + esc(st.text) + '<sup>' + id.replace('c', '') + '</sup></span>'; }) + '</p>';
    });
    h += '<div class="legend mt" style="font-family:Inter,system-ui,sans-serif"><span><i style="background:var(--content-arbor)"></i>Verified</span><span><i style="background:var(--content-solar)"></i>Low confidence</span><span><i style="background:var(--content-negative)"></i>Conflict or no source</span><span><i style="background:var(--content-cobalt)"></i>Fixed by you</span></div></div>';
    h += '<div><div class="card" id="checkpoint"><h2>Checkpoint</h2><div class="meter" aria-label="claims verified"><i style="width:' + ((total - open.length) / total * 100) + '%;background:var(--good)"></i></div><p class="small mt">' + (total - open.length) + ' of ' + total + ' claims ready. ' + (open.length ? 'Fix the ones below.' : 'All clear.') + '</p>';
    ['c2', 'c4', 'c6'].forEach(function (id) { h += issueCard(id); });
    h += '</div><div class="card" id="approve">' + approvePanel(open) + '</div>' + (ui.claim ? '<div class="card" id="claimsrc">' + claimSource(ui.claim) + '</div>' : '') + '<div class="card"><h2>Audit trail</h2><ul class="log">' + (S.log.length ? S.log.slice(0, 8).map(function (l) { return '<li><b>' + esc(l.at) + '</b> ' + esc(l.text) + '</li>'; }).join('') : '<li class="muted">No actions yet.</li>') + '</ul></div></div></div>';
    view.innerHTML = h;
  }
  function issueCard(id) {
    var c = D.memo.claims[id], r = S.res[id], st = claimState(id);
    var title = { conflict: 'Sources disagree', low: 'Low confidence read', unsupported: 'Number with no source' }[c.status];
    var done = st.cls !== c.status;
    var h = '<div class="issue' + (done ? ' done' : '') + '"><div class="row between"><b>#' + id.replace('c', '') + ' ' + title + '</b>' + (done ? statusPill(st.cls === 'removed' ? 'removed' : 'fixed') : statusPill(c.status)) + '</div><p class="small" style="margin:6px 0">"' + esc(c.text) + '"</p>';
    if (done) {
      h += '<p class="small muted" style="margin:0">' + (st.auto ? 'Fixed in Matrix. The memo updated from the cell.' : 'Edit reason: ' + esc(r.reason)) + '</p>';
      if (!st.auto) h += '<button class="btn ghost small mt" data-act="unres" data-v="' + id + '">Undo</button>';
      return h + '</div>';
    }
    var opts = c.status === 'unsupported' ? [['remove', 'Remove the claim', 'No source in the run. Safest choice.'], ['fix', 'Rewrite as a labeled analyst view', c.fix], ['keepx', 'Send as is', 'Blocked. Unsupported numbers cannot leave the firm.']] : [['fix', 'Use the newer or cleaner source', c.fix], ['keep', 'Keep the draft and add a note', 'You must say why in the note.'], ['remove', 'Remove the claim', '']];
    h += '<div role="radiogroup" aria-label="Choose a fix">' + opts.map(function (o, i) { var dis = o[0] === 'keepx'; return '<label class="opt' + (dis ? '' : '') + '" style="' + (dis ? 'opacity:.55;cursor:not-allowed' : '') + '"><input type="radio" name="o-' + id + '" value="' + o[0] + '"' + (dis ? ' disabled' : '') + (i === 0 ? ' checked' : '') + '><span><b>' + esc(o[1]) + '</b>' + (o[2] ? '<span class="small" style="display:block">' + esc(o[2]) + '</span>' : '') + '</span></label>'; }).join('') + '</div>';
    h += '<div class="field mt"><label for="rs-' + id + '">Edit reason (feeds evals)</label><select id="rs-' + id + '">' + D.EDIT_REASONS.map(function (x) { return '<option' + (x === c.reason ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></div>';
    h += '<div class="field mt"><label for="nt-' + id + '">Note (needed if you keep the draft)</label><input type="text" id="nt-' + id + '" placeholder="Optional unless keeping"></div>';
    h += '<div class="err" id="er-' + id + '"></div><div class="row"><button class="btn primary" data-act="resolve" data-v="' + id + '">Apply</button>' + (c.row ? '<a class="btn" href="#/matrix/' + c.row + '/' + c.col + '">Open source</a>' : '') + '</div></div>';
    return h;
  }
  function claimSource(id) {
    var c = D.memo.claims[id];
    var h = '<h2>Claim #' + id.replace('c', '') + ' source</h2>';
    if (!c.row) return h + '<p class="small">' + (c.why ? esc(c.why) : 'No cell or page supports this claim. It was written by the model from general knowledge.') + '</p>' + (c.col ? '<a class="btn" href="#/matrix">Open Matrix column</a>' : '');
    var r = row(c.row), x = cellOf(r, c.col);
    return h + '<p class="small"><b>' + esc(r.name) + '</b> · ' + esc(col(c.col).label) + ' · ' + esc(x.src.doc) + (x.src.page ? ', p. ' + x.src.page : '') + '</p><div class="quote small">' + x.src.quote + '</div><a class="btn mt" href="#/matrix/' + c.row + '/' + c.col + '">Open in Matrix</a>';
  }
  function approvePanel(open) {
    if (S.approved) return '<h2>Approved</h2><div class="callout good small"><b>Approved by ' + esc(S.signer) + '.</b> Ready to send to IC. 0 unsupported numbers. Edits logged as eval cases: ' + Object.keys(S.res).map(function (k) { return S.res[k].reason; }).concat(Object.keys(S.cellFix).length ? ['Stale source (amendment missed)'] : []).map(esc).join(', ') + '.</div><button class="btn ghost mt" data-act="unapprove">Reopen</button>';
    var dis = open.length ? ' disabled' : '';
    return '<h2>Sign off</h2><p class="small muted">Locked until every flagged claim is handled.</p><div class="field"><label for="signer">Your name</label><input type="text" id="signer" placeholder="Reviewer name"' + dis + '></div><label style="display:flex;gap:10px;align-items:center;min-height:44px" class="small"><input type="checkbox" id="ack" style="width:20px;height:20px"' + dis + '>I checked every flagged claim against its source.</label><div class="err" id="ap-err"></div><button class="btn good" style="width:100%" data-act="approve"' + dis + '>' + (open.length ? open.length + ' left to check' : 'Approve for IC') + '</button>';
  }

  // ---------- EVALS ----------
  function gate() {
    var E = D.evals, c = S.gateFixed ? E.fixed : E.cand, p = E.live, key = S.gateFixed ? 'fixed' : 'cand';
    var worst = E.slices.map(function (s) { return { s: s.s, d: s[key] - s.live }; }).sort(function (a, b) { return a.d - b.d; })[0];
    return { c: c, worst: worst, checks: [
      ['Number exact match is at least as good as live', c.exact >= p.exact, pct(c.exact) + ' vs ' + pct(p.exact)],
      ['Citation precision 98% or higher (the quote supports the claim)', c.cite >= 0.98, pct(c.cite)],
      ['Claims in deliverables with a valid source go up', c.support >= p.support, pct(c.support) + ' vs ' + pct(p.support)],
      ['Correct "not found" answers do not drop', c.abstain >= p.abstain, pct(c.abstain) + ' vs ' + pct(p.abstain)],
      ['No slice drops more than 1 point vs live', worst.d >= -0.01, worst.s + ': ' + (worst.d >= 0 ? '+' : '') + (worst.d * 100).toFixed(1) + ' pts'],
      ['p50 latency under 60s and cost per task under $2.00', c.p50 < 60 && c.cost < 2, c.p50 + 's · $' + c.cost.toFixed(2)]
    ] };
  }
  function vEvals() {
    var E = D.evals, G = gate(), passed = G.checks.every(function (x) { return x[1]; }), key = S.gateFixed ? 'fixed' : 'cand';
    var h = '<div class="head"><div><div class="crumb">Quality and launch</div><h1>Quality bar and evals</h1><p>The quality bar is written as customer tasks with clear acceptance criteria. A new version of the checker ships only if it beats live on every check and every slice. Example numbers.</p></div>' + (S.shipped ? '<span class="pill good">Rolling out to 10%</span>' : passed ? '<span class="pill good">Gate passed</span>' : '<span class="pill bad">Gate blocked</span>') + '</div>';
    h += '<div class="grid g4">' + E.suites.map(function (s) { return '<div class="card kpi"><div class="k">' + esc(s.owner) + '</div><div class="v" style="font-size:1.15rem">' + esc(s.name) + '</div><div class="d">' + s.n + ' tasks from real workflows, example docs</div></div>'; }).join('') + '</div>';
    h += '<div class="grid g3 mt"><div class="card span2"><h2>Live vs candidate</h2><div class="scroll"><table class="tbl stack"><thead><tr><th>Metric</th><th class="num">' + esc(E.live.name) + '</th><th class="num">' + esc(G.c.name) + '</th></tr></thead><tbody>';
    [['Number exact match', 'exact', 1], ['Citation precision', 'cite', 1], ['Claims with valid source', 'support', 1], ['Correct "not found"', 'abstain', 1], ['p50 latency (s)', 'p50', 0], ['Cost per task', 'cost', 2]].forEach(function (m) {
      var a = E.live[m[1]], b = G.c[m[1]], f = function (v) { return m[2] === 1 ? pct(v) : m[2] === 2 ? '$' + v.toFixed(2) : v; };
      h += '<tr><td data-l="Metric">' + m[0] + '</td><td class="num" data-l="Live">' + f(a) + '</td><td class="num" data-l="Candidate"><b>' + f(b) + '</b></td></tr>';
    });
    h += '</tbody></table></div><h2 class="mt">Slices: number exact match</h2><div class="scroll"><table class="tbl stack"><thead><tr><th>Slice</th><th class="num">Tasks</th><th class="num">Live</th><th class="num">Candidate</th><th class="num">Change</th></tr></thead><tbody>' + E.slices.map(function (s) { var d = s[key] - s.live; return '<tr><td data-l="Slice">' + esc(s.s) + '</td><td class="num" data-l="Tasks">' + s.n + '</td><td class="num" data-l="Live">' + pct(s.live) + '</td><td class="num" data-l="Candidate">' + pct(s[key]) + '</td><td class="num" data-l="Change"><span class="pill ' + (d < -0.01 ? 'bad' : 'good') + '">' + (d >= 0 ? '+' : '') + (d * 100).toFixed(1) + ' pts</span></td></tr>'; }).join('') + '</tbody></table></div></div>';
    h += '<div class="card"><h2>Ship gate</h2><ul class="checks">' + G.checks.map(function (x) { return '<li><span class="pill ' + (x[1] ? 'good' : 'bad') + '">' + (x[1] ? 'Pass' : 'Fail') + '</span><span class="small"><b>' + esc(x[0]) + '</b><br>' + esc(x[2]) + '</span></li>'; }).join('') + '</ul>';
    if (!S.gateFixed) h += '<div class="callout bad mt small"><b>Blocked.</b> v1.7 reads numbers better overall, but on amended agreements it often picks the original credit agreement over a newer amendment. That is the same error reviewers fixed most last month. <button class="btn primary mt" style="width:100%" data-act="fixgate">Add amendment precedence rule and rerun</button></div>';
    else if (!S.shipped) h += '<div class="callout good mt small"><b>All checks pass.</b> Roll out to 10% of accounts behind a flag. Watch edit reasons for 2 weeks.<div class="field mt"><label for="shipper">Your name</label><input type="text" id="shipper" placeholder="Product manager"></div><label style="display:flex;gap:10px;align-items:center;min-height:44px"><input type="checkbox" id="ack2" style="width:20px;height:20px">I read the slice report.</label><div class="err" id="ship-err"></div><button class="btn good" style="width:100%" data-act="ship">Start 10% rollout</button></div>';
    else h += '<div class="callout good mt small"><b>Rolling out to 10%</b>, approved by ' + esc(S.shipper) + '. Auto rollback if "stale source" edits rise above 5%.</div>';
    h += '</div></div>';
    h += '<div class="grid g2 mt"><div class="card"><h2>Acceptance criteria: covenant extraction</h2><ul class="checks small"><li><span class="pill info">1</span>The value matches the latest document in force. Amendments beat the original.</li><li><span class="pill info">2</span>The quote shown contains the value, on the cited page.</li><li><span class="pill info">3</span>If the term is not in the documents, say "Not found" and list what was searched.</li><li><span class="pill info">4</span>If two documents disagree, flag it. Never pick silently.</li><li><span class="pill info">5</span>Numbers keep units and step downs (for example "6.00x through Q2 2027").</li></ul></div>';
    h += '<div class="card"><h2>Release history</h2><div class="scroll"><table class="tbl stack"><thead><tr><th>Version</th><th>Date</th><th class="num">Exact match</th><th>Result</th></tr></thead><tbody>' + E.history.concat(S.shipped ? [{ v: 'v1.7.1', d: 'Oct 29', exact: E.fixed.exact, res: 'Rolling out' }] : []).map(function (r) { return '<tr><td data-l="Version"><b>' + r.v + '</b></td><td data-l="Date">' + r.d + '</td><td class="num" data-l="Exact">' + pct(r.exact) + '</td><td data-l="Result"><span class="pill ' + (r.res === 'Blocked' ? 'bad' : 'good') + '">' + r.res + '</span></td></tr>'; }).join('') + '</tbody></table></div></div></div>';
    h += '<div class="card mt"><h2>How the harness works</h2><ol class="steps"><li><b>Task sets from customers.</b> With consent, turn real workflows into tasks on public or example documents. Experts label the right answer and the right page.</li><li><b>Edits become cases.</b> Every reviewer edit in Proof Desk, with its reason, is a candidate test case. Stale amendment edits became the "Amended agreements" slice.</li><li><b>Graders.</b> Exact match for numbers. A grader model plus a human spot check for "does the quote support the claim".</li><li><b>Gate in CI.</b> Any slice drop over 1 point blocks the release.</li><li><b>Staged rollout.</b> 10% of accounts, watch edit reasons and no edit rate, then expand.</li></ol></div>';
    view.innerHTML = h;
  }

  // ---------- ADOPTION ----------
  function vAdoption() {
    var A = D.accounts;
    var h = '<div class="head"><div><div class="crumb">Quality and launch</div><h1>Launch and adoption</h1><p>Launch is the start. This view tracks whether Proof Desk keeps paying off after launch: who uses it, who approves work with it, and what customers ask for next. Account names are made up.</p></div></div>';
    var st = [['done', 'Internal dogfood', 'Done Aug 31', 'Hebbia investors and bankers on staff try it first.'], ['done', 'Design partners', 'Done Sep 28', '6 accounts. Weekly calls. Edits reviewed together.'], ['now', '25% of accounts', 'Now', 'Sales and CS enabled. Watching at risk accounts.'], ['', 'All accounts', 'Target Nov 30', 'Only if no edit rate holds and guardrails are green.']];
    h += '<div class="card"><h2>Rollout</h2><div class="stage mt">' + st.map(function (s) { return '<div class="' + s[0] + '"><b>' + s[1] + '</b><div class="small muted">' + s[2] + '</div><p class="small" style="margin:6px 0 0">' + s[3] + '</p></div>'; }).join('') + '</div></div>';
    var f = [['Ran a Matrix', 1240], ['Drafted a deliverable', 812], ['Opened the check', 744], ['Approved', 618], ['Sent outside Hebbia', 541]];
    h += '<div class="grid g2 mt"><div class="card"><h2>Deliverable funnel, last 30 days</h2><div class="funnel">' + f.map(function (x) { return '<div class="step"><span>' + x[0] + '</span><div class="meter"><i style="width:' + (x[1] / f[0][1] * 100) + '%"></i></div><b class="score">' + x[1] + '</b></div>'; }).join('') + '</div><p class="small muted mt">Biggest drop: Matrix to deliverable (35%). Next discovery question: is that by choice, or because the memo format does not fit?</p></div>';
    h += '<div class="card"><h2>What customers ask for</h2><p class="small muted">Tagged from CS notes, sales calls, and in product feedback. Example counts.</p>' + D.themes.map(function (t) { return bar(esc(t[0]), t[1], 35, t[1], 'var(--brand)'); }).join('') + '</div></div>';
    h += '<div class="card mt"><h2>Accounts</h2><div class="scroll"><table class="tbl stack"><thead><tr><th>Account</th><th>Segment</th><th class="num">Seats</th><th class="num">Weekly active</th><th class="num">Deliverables, 30d</th><th class="num">No edit rate</th><th>Health</th><th>Note</th></tr></thead><tbody>' + A.map(function (a) { return '<tr><td data-l="Account"><b>' + esc(a.a) + '</b></td><td data-l="Segment">' + esc(a.seg) + '</td><td class="num" data-l="Seats">' + a.seats + '</td><td class="num" data-l="Weekly active">' + pct(a.wau, 0) + '</td><td class="num" data-l="Deliverables">' + a.del + '</td><td class="num" data-l="No edit">' + pct(a.noEdit, 0) + '</td><td data-l="Health"><span class="pill ' + (a.health === 'Strong' ? 'good' : a.health === 'Watch' ? 'warn' : 'bad') + '">' + a.health + '</span></td><td data-l="Note">' + esc(a.note) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
    h += '<div class="grid g2 mt"><div class="card"><h2>Launch checklist</h2><ul class="checks small"><li><span class="pill good">Done</span>One page for sales: what it does, what it will not do, 3 demo paths.</li><li><span class="pill good">Done</span>CS office hours for design partners.</li><li><span class="pill good">Done</span>Release notes in the monthly product update.</li><li><span class="pill warn">Next</span>Win and loss notes from 10 deals where trust came up.</li><li><span class="pill warn">Next</span>Account health alert when no edit rate drops 10 points.</li></ul></div>';
    h += '<div class="card"><h2>Coverage bank C is at risk</h2><p class="small">Weekly active is 38% and comps numbers get edited often. Plan: sit with 3 analysts for a day, pull their last 20 edits, and add a "Public comps" slice with their tickers. Check again in 3 weeks.</p><div class="callout small">This is where the role meets the customer: deployment lessons become a reusable fix for every bank, not a one off.</div></div></div>';
    view.innerHTML = h;
  }

  // ---------- PROBLEMS ----------
  function vProblems() {
    var h = '<div class="head"><div><div class="crumb">Why this exists</div><h1>Problems we solve</h1><p>Public sources on the problems this product area would own. Each card links to its source and to the part of the prototype that tackles it.</p></div></div>';
    h += '<div class="grid g3">' + D.sources.map(function (s) {
      return '<article class="card prob"><div class="stat">' + esc(s.stat) + '</div><p><b>' + esc(s.label) + '</b></p><p class="small">' + esc(s.more) + '</p><div class="src"><a href="' + s.url + '" target="_blank" rel="noopener">' + esc(s.org) + '</a>' + (s.url2 ? ' · <a href="' + s.url2 + '" target="_blank" rel="noopener">' + esc(s.url2label) + '</a>' : '') + '</div><div class="help"><b>How Proof Desk helps:</b> ' + esc(s.help) + ' <a href="#/' + s.view + '">See it</a></div></article>';
    }).join('') + '</div>';
    h += '<div class="callout mt small">Sources read on Oct 29, 2026. Reddit and review quotes are user opinions, not measured facts. Vendor stories are vendor claims. Nothing here uses Hebbia customer data. Everything inside the app views is example data.</div>';
    view.innerHTML = h;
  }

  // ---------- PLAN ----------
  function vPlan() {
    var h = '<div class="head"><div><div class="crumb">Why this exists</div><h1>Roadmap and plan</h1><p>How I would run this product area. A starting point to test with the team and customers, not a final answer.</p></div></div>';
    h += '<div class="grid g3"><div class="card"><h2>North star</h2><p><b>Verified deliverables approved per active analyst per week</b></p><p class="small">Usage alone can hide bad work. A memo only counts when a professional approved it and every number has a source.</p><h3 class="mt">Guardrails</h3><ul class="small"><li>Unsupported numbers sent: always 0</li><li>Citation precision: 98% or more</li><li>p50 time to first draft: under 60s</li><li>Cost per deliverable: under $2.00</li><li>No eval slice drops more than 1 point</li></ul></div>';
    h += '<div class="card"><h2>First 30 days: learn</h2><ul class="small"><li>Talk to 15 users across credit, PE, banking, and public equities. Watch them check a memo.</li><li>Join 3 live deployments with the customer team.</li><li>Read 200 edited deliverables. Tag why each edit happened.</li><li>Agree with research and eng on the quality bar per task.</li><li>Pick 2 problems for the first release.</li></ul></div>';
    h += '<div class="card"><h2>Days 31 to 90: ship</h2><ul class="small"><li>Claim to cell links and the checkpoint panel for memos.</li><li>Amendment precedence and conflict flags in Matrix.</li><li>Edit reasons captured and turned into eval cases weekly.</li><li>10% rollout, then 25%, with sales and CS enabled.</li><li>Monthly readout: north star, guardrails, what we learned, what is next.</li></ul></div></div>';
    var bl = [
      ['Claim to cell links in memos and decks', 5, 5, 3, 1, 'Core of trust at the sign off step'],
      ['Amendment precedence and conflict flag', 5, 4, 2, 1, 'Top edit reason (29%, example)'],
      ['Edit reasons to eval cases', 4, 3, 2, 1, 'Feeds the quality bar every week'],
      ['SharePoint and Drive folder sync', 4, 5, 4, 2, 'Public reviews ask for it'],
      ['House style for memos', 3, 4, 3, 1, 'Second biggest edit reason'],
      ['Amendment timeline per borrower', 3, 3, 3, 1, 'Asked for by credit accounts']
    ];
    bl.forEach(function (b) { b.push(((b[1] * 2 + b[2]) / (b[3] + b[4])).toFixed(1)); });
    bl.sort(function (a, b) { return b[6] - a[6]; });
    h += '<div class="card mt"><h2>Starter backlog</h2><p class="small muted">Scored on customer value and commercial value (1 to 5, value counts twice) divided by delivery effort plus ongoing operating cost (1 to 5). Rough scores to start a debate.</p><div class="scroll"><table class="tbl stack"><thead><tr><th>Item</th><th class="num">Value</th><th class="num">Commercial</th><th class="num">Effort</th><th class="num">Op cost</th><th class="num">Score</th><th>Why</th></tr></thead><tbody>' + bl.map(function (b) { return '<tr><td data-l="Item"><b>' + esc(b[0]) + '</b></td><td class="num" data-l="Value">' + b[1] + '</td><td class="num" data-l="Commercial">' + b[2] + '</td><td class="num" data-l="Effort">' + b[3] + '</td><td class="num" data-l="Op cost">' + b[4] + '</td><td class="num" data-l="Score"><span class="score">' + b[6] + '</span></td><td data-l="Why">' + esc(b[5]) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
    h += '<div class="grid g2 mt"><div class="card"><h2>Risks I would watch</h2><ul class="small"><li><b>Rubber stamping.</b> Reviewers approve without reading. Fix: only flag what matters, spot audit approved work, track edits on hard cases.</li><li><b>Flag fatigue.</b> Too many amber flags and people ignore them. Fix: cap flags per memo, tune thresholds with evals.</li><li><b>Latency and cost.</b> Deeper checks cost more. Fix: check only claims that leave the firm, cache verified cells.</li><li><b>Copycats.</b> Grids are now common. Fix: win on verified deliverables and firm specific workflows.</li></ul></div>';
    h += '<div class="card"><h2>About the builder</h2><p class="small">I am Amitesh (Ami) Dwivedi, an AI product manager at Ellipsis Health. I own voice AI agents for payor calls and benefits checks, with memory. I also built the eval harnesses behind them: simulated callers, grader models, and regression gates that block a release when quality drops. Proof Desk uses the same playbook for finance: set the quality bar with real tasks, gate every release, and learn from every human edit.</p><h3 class="mt">How this maps to the role</h3><ul class="small"><li>Own a product area from discovery to adoption: Pulse, Launch and adoption.</li><li>Set the quality bar with tasks, criteria, and evals: Quality bar and evals.</li><li>Design complete workflows and prototypes: Matrix run, Deliverable check.</li><li>Weigh value, commercial upside, effort, and op cost: backlog above.</li></ul><p class="small muted">Independent concept prototype made for a job conversation. Not a Hebbia product, not affiliated with Hebbia, and uses no Hebbia or customer data.</p></div></div>';
    view.innerHTML = h;
  }

  // ---------- router ----------
  function route() {
    var hash = location.hash.replace(/^#\/?/, '') || 'pulse';
    var p = hash.split('/'), r = p[0];
    renderNav(r); closeMenu();
    if (r === 'pulse') vPulse();
    else if (r === 'matrix') vMatrix(p[1], p[2]);
    else if (r === 'memo') vMemo();
    else if (r === 'evals') vEvals();
    else if (r === 'adoption') vAdoption();
    else if (r === 'problems') vProblems();
    else if (r === 'plan') vPlan();
    else { location.hash = '#/pulse'; return; }
    window.scrollTo(0, 0);
    if (r === 'matrix' && p[1] && window.innerWidth < 900) { var d = document.getElementById('drawer'); if (d) d.scrollIntoView(); }
    var t = { pulse: 'Pulse', matrix: 'Matrix run', memo: 'Deliverable check', evals: 'Quality bar and evals', adoption: 'Launch and adoption', problems: 'Problems we solve', plan: 'Roadmap and plan' }[r];
    document.title = t + ' · Proof Desk (concept prototype, example data)';
  }
  function rerenderMatrixKeepScroll() { var w = document.querySelector('.mxwrap'), st = w ? w.scrollTop : 0, sl = w ? w.scrollLeft : 0, y = window.scrollY; vMatrix(); var w2 = document.querySelector('.mxwrap'); if (w2) { w2.scrollTop = st; w2.scrollLeft = sl; } window.scrollTo(0, y); }

  document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.claim')) { e.preventDefault(); e.target.click(); } });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var a = b.getAttribute('data-act'), v = b.getAttribute('data-v');
    if (a === 'reset') { S = fresh(); save(); ui = { filter: 'all', sel: null, claim: null }; toast('Demo reset'); route(); }
    else if (a === 'mfilter') { ui.filter = v; rerenderMatrixKeepScroll(); }
    else if (a === 'cell') {
      ui.sel = v; var dr = document.getElementById('drawer'); dr.innerHTML = drawer();
      document.querySelectorAll('.cell.sel').forEach(function (x) { x.classList.remove('sel'); }); b.classList.add('sel');
      if (history.replaceState) history.replaceState(null, '', '#/matrix/' + v);
      if (window.innerWidth < 900) dr.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    else if (a === 'acceptalt') { S.cellFix[v] = true; var p = v.split('/'); addLog(row(p[0]).name + ' ' + col(p[1]).label + ': replaced with newer source'); save(); toast('Cell updated. Linked memo claim updated.'); rerenderMatrixKeepScroll(); }
    else if (a === 'undofix') { delete S.cellFix[v]; save(); toast('Undone'); rerenderMatrixKeepScroll(); }
    else if (a === 'keep') { toast('Open the memo to keep the draft with a note.'); location.hash = '#/memo'; }
    else if (a === 'gomemo') { ui.claim = v; }
    else if (a === 'claim') { ui.claim = v; vMemo(); var cs = document.getElementById('claimsrc'); if (cs) cs.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    else if (a === 'resolve') {
      var pick = document.querySelector('input[name="o-' + v + '"]:checked'), reason = document.getElementById('rs-' + v).value, note = document.getElementById('nt-' + v).value.trim(), er = document.getElementById('er-' + v);
      if (!pick) { er.textContent = 'Choose a fix.'; return; }
      if (pick.value === 'keep' && note.length < 8) { er.textContent = 'Add a short note on why the draft is right.'; return; }
      S.res[v] = { choice: pick.value, reason: reason, note: note }; S.approved = false;
      addLog('Claim #' + v.replace('c', '') + ': ' + (pick.value === 'fix' ? 'fixed' : pick.value === 'remove' ? 'removed' : 'kept with note') + ' (' + reason + ')'); save(); toast('Saved. Logged as an eval case.'); ui.claim = v; vMemo();
    }
    else if (a === 'unres') { delete S.res[v]; S.approved = false; save(); vMemo(); }
    else if (a === 'approve') {
      var n = document.getElementById('signer').value.trim(), ack = document.getElementById('ack').checked;
      if (!n || !ack) { document.getElementById('ap-err').textContent = 'Add your name and confirm you checked the claims.'; return; }
      S.approved = true; S.signer = n; addLog('Memo approved for IC by ' + n); save(); toast('Approved for IC'); vMemo();
    }
    else if (a === 'jump') { var cp = document.getElementById('checkpoint'); if (cp) cp.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    else if (a === 'unapprove') { S.approved = false; save(); vMemo(); }
    else if (a === 'fixgate') { S.gateFixed = true; addLog('Checker v1.7.1 rerun with amendment precedence rule'); save(); toast('Rerun complete: v1.7.1'); vEvals(); }
    else if (a === 'ship') {
      var nm = document.getElementById('shipper').value.trim(), ak = document.getElementById('ack2').checked;
      if (!nm || !ak) { document.getElementById('ship-err').textContent = 'Add your name and confirm you read the slice report.'; return; }
      S.shipped = true; S.shipper = nm; addLog('v1.7.1 rollout to 10% approved by ' + nm); save(); toast('Rollout started'); vEvals();
    }
  });
  window.addEventListener('hashchange', route);
  route();
})();
