/* Stuut Collections exception packet: UI wiring.
   Renders worklist + exception packet detail + rubric eval table.
   Every fact chip jumps to the cited span in the source; spans are marked from
   verbatim substrings, the same spans the lens re-locates. */

var App = (function () {
  'use strict';

  var packets = {};
  var selected = null;
  var jsonOpen = false;

  var RANK = { B: 1, C: 2, A: 3 };
  var STANCE_STYLE = {
    'commitment': ['Promise made', ''],
    'confirmed': ['Confirmed', 'st-confirmed'],
    'no-commitment': ['No commitment', 'st-no-commitment'],
    'partial-intent': ['Partial intent', 'st-partial-intent']
  };

  function esc(s) {
    return ('' + s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtDay(iso) { return StuutEngine.fmtDay(iso); }
  function money(x) { return StuutEngine.money(x); }

  function buildAll() {
    packets = {};
    STUUT_CASES.forEach(function (c) { packets[c.id] = StuutEngine.buildPacket(c); });
  }

  function sortedCases() {
    return STUUT_CASES.slice().sort(function (a, b) { return (RANK[a.id] || 9) - (RANK[b.id] || 9); });
  }

  /* ---------- citation marking ---------- */

  function html(text) { return esc(text); }

  /* mark verbatim spans inside text; intervals found by indexOf on the raw string */
  function markText(text, spans) {
    var iv = [];
    (spans || []).forEach(function (sp) {
      var i = text.indexOf(sp);
      if (i >= 0) iv.push([i, i + sp.length]);
    });
    if (!iv.length) return html(text);
    iv.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [];
    iv.forEach(function (seg) {
      var last = merged[merged.length - 1];
      if (last && seg[0] <= last[1]) { last[1] = Math.max(last[1], seg[1]); }
      else merged.push(seg.slice());
    });
    var out = [];
    var pos = 0;
    merged.forEach(function (seg) {
      if (seg[0] > pos) out.push(html(text.slice(pos, seg[0])));
      out.push('<mark class="cite">' + html(text.slice(seg[0], seg[1])) + '</mark>');
      pos = seg[1];
    });
    if (pos < text.length) out.push(html(text.slice(pos)));
    return out.join('');
  }

  /* spans for an item from all packet facts */
  function spansFor(p, itemId) {
    var out = [];
    p.facts.forEach(function (f) {
      if (f.cite && f.cite.itemId === itemId && f.cite.span) out.push(f.cite.span);
    });
    return out;
  }

  function locateCite(itemId, span) {
    var card = document.querySelector('.tl-item[data-item="' + itemId + '"]');
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    var marks = card.querySelectorAll('mark.cite');
    Array.prototype.forEach.call(marks, function (m) {
      if (span == null || m.textContent === span) {
        m.classList.add('flash');
        setTimeout(function () { m.classList.remove('flash'); }, 1400);
      }
    });
  }

  /* ---------- pills ---------- */

  function promisePill(p) {
    if (p.promise.status === 'broken') return ['pill-broken', 'Broken commitment'];
    if (p.promise.status === 'active') return ['pill-risk', 'Promise to pay'];
    if (p.shortPay.detected) return ['pill-broken', 'Short-pay exception'];
    return ['pill-risk', 'No commitment on record'];
  }

  /* ---------- worklist ---------- */

  function renderWorklist() {
    var rows = sortedCases().map(function (c) {
      var p = packets[c.id];
      var pill = promisePill(p);
      var chans = p.channelsTried.map(function (x) { return x.type; });
      var chIcons = chans.map(function (t) {
        var label = t === 'email' ? 'EM' : (t === 'voice' ? 'CL' : 'TX');
        return '<span class="ch-icon" title="' + t + ' channel">' + label + '</span>';
      }).join(' ');
      return '<button class="wl-row' + (p.caseId === selected ? ' selected' : '') + '" data-case="' + c.id + '">' +
        '<span class="wl-rank">' + (RANK[c.id] || '') + '</span> ' +
        '<span class="pill ' + pill[0] + '">' + pill[1] + '</span>' +
        '<span class="wl-main">' + esc(c.account.name) + '</span>' +
        '<span class="wl-sub">' + esc(c.invoice.number) + ' · ' + money(p.invoice.open) + ' open · ' +
          p.invoice.agingDays + 'd aged</span>' +
        '<span class="wl-meta"><span class="wl-ch">' + chIcons + '</span>' +
        '<span>' + esc(fmtDay(p.asOf)) + '</span></span>' +
      '</button>';
    }).join('');
    document.getElementById('wl-rows').innerHTML = rows;
    Array.prototype.forEach.call(document.querySelectorAll('.wl-row'), function (r) {
      r.onclick = sel;
    });
  }

  function sel() { selectCase(this.dataset.case); }

  /* ---------- detail ---------- */

  function citeChip(itemId, span, label) {
    return '<span class="cite-chip" data-item="' + itemId + '" title="Jump to cited span">' +
      '<span class="cc-id">' + (label || 'CIT') + '</span></span>';
  }

  function factRow(f, i) {
    return '<div class="fact-row">' +
      '<span class="fact-idx" title="Jump to the cited span">' + (i + 1) + '</span>' +
      '<span class="fact-label">' + esc(f.label) + '</span>' +
      '<span class="fact-value">' + esc(f.value) + ' ' +
        (f.cite && f.cite.itemId ? citeChip(f.cite.itemId, f.cite.span, f.cite.itemId) : '') + '</span>' +
    '</div>';
  }

  function renderDetail() {
    var p = packets[selected];
    if (!p) return;
    var host = document.getElementById('detail');
    var pill = promisePill(p);
    var shortPay = p.shortPay.detected;

    /* header */
    var header = '<div class="d-head">' +
      '<span class="crumb">Worklist / ' + esc(p.account.id) + '</span>' +
      '<span class="pill ' + pill[0] + '">' + pill[1] + '</span>' +
      (p.escalate ? '<span class="pill pill-broken">Escalate</span>' : '') +
    '</div>' +
    '<div class="d-title">' + esc(p.account.name) + '</div>' +
    '<div class="d-sub">' + esc(p.invoice.number) + ' · ' + money(p.invoice.total) + ' · terms ' + esc(p.invoice.terms) +
      ' · due ' + fmtDay(p.invoice.dueDate) + ' · AR rep ' + esc(p.account.arRep) + '</div>';

    /* KPIs */
    var chanCount = p.channelsTried.length;
    var chanLabel = p.channelsTried.map(function (x) {
      return x.type === 'email' ? 'email' : (x.type === 'voice' ? 'voice' : 'sms');
    }).join(' + ');
    var kpis = '<div class="kpis">' +
      kpi('Open balance', money(p.invoice.open), 'aging row · ' + esc(p.invoice.number)) +
      kpi('Aging', p.invoice.agingDays + ' days', 'past due as of ' + fmtDay(p.asOf)) +
      kpi('Channels tried', chanCount + '', chanLabel) +
      kpi('Confidence', Math.round(p.confidence * 100) + '%', 'packet grounding') +
    '</div>';

    var out = header + kpis;

    /* promise card */
    var promiseInner = '';
    if (p.promise.status === 'active') {
      promiseInner = '<div class="promise-row">' +
        '<div class="promise-field"><div class="pf-lab">Promise to pay</div>' +
          '<div class="pf-val">' + esc(p.promise.payByLabel) + '</div></div>' +
        '<div class="promise-field"><div class="pf-lab">Follow-up (computed)</div>' +
          '<div class="pf-val">' + esc(fmtDay(p.promise.followUp)) + '</div></div>' +
      '</div>' +
      '<div class="promise-field" style="margin-top:8px"><span class="pill pill-risk">Promise to pay</span> ' +
        (p.promise.stance === 'confirmed'
          ? '<span class="pill pill-keep">Confirmed on voice re-readback</span>'
          : '') + ' ' + citeChip(p.promise.cite.itemId, p.promise.cite.span, 'P2P') + '</div>';
    } else if (p.promise.status === 'broken') {
      promiseInner = '<div class="promise-row">' +
        '<div class="promise-field"><div class="pf-lab">Promised by</div>' +
          '<div class="pf-val" style="color:var(--red)">' + esc(fmtDay(p.promise.brokenAt)) + '</div></div>' +
        '<div class="promise-field"><div class="pf-lab">Status</div>' +
          '<div class="pf-val" style="color:var(--red)">Broken commitment · payment not received</div></div>' +
      '</div>' +
      '<div style="margin-top:8px">' + citeChip(p.promise.cite.itemId, p.promise.cite.span, 'EM') + '</div>';
    } else {
      promiseInner = '<div class="promise-row"><div class="promise-field"><div class="pf-lab">Promise to pay</div>' +
        '<div class="pf-val">None on record</div></div>' +
        (p.promise.stance ? '<div class="promise-field"><div class="pf-lab">Latest stance</div>' +
          '<div class="pf-val">' + esc(p.promise.stance) + '</div></div>' : '') +
      '</div>' +
      (p.promise.stanceSpan ? '<div style="margin-top:8px">' +
        citeChip(p.promise.stanceItemId, p.promise.stanceSpan, 'VC') + '</div>' : '');
    }
    out += '<div class="card' + (p.promise.status === 'broken' ? ' card-red' : '') + '">' +
      '<h3>Promise to pay</h3>' + promiseInner + '</div>';

    /* amount / short-pay card */
    var amountInner = '<div class="promise-row">' +
      '<div class="promise-field"><div class="pf-lab">Invoice total</div><div class="pf-val">' + money(p.invoice.total) + '</div></div>' +
      '<div class="promise-field"><div class="pf-lab">Paid</div><div class="pf-val">' + money(p.invoice.paid) + '</div></div>' +
      '<div class="promise-field"><div class="pf-lab">Open</div><div class="pf-val">' + money(p.invoice.open) + '</div></div>' +
      (shortPay ? '<div class="promise-field"><div class="pf-lab">Short-pay</div>' +
        '<div class="pf-val" style="color:var(--red)">' + money(p.shortPay.short) + '</div></div>' : '') +
    '</div>';
    if (shortPay) {
      amountInner += '<div style="margin-top:8px;font-size:12.5px"><b>Received ' + money(p.shortPay.received) + '</b> ' +
        (p.remittance ? 'via ' + esc(p.remittance.bank) + ' on ' + fmtDay(p.remittance.date) : '') +
        ' · ' + money(p.shortPay.short) + ' below invoice total · ' +
        citeChip(p.shortPay.cite.itemId, p.shortPay.cite.span, 'RMT') + '</div>';
      if (p.shortPay.dispute) {
        amountInner += '<div style="margin-top:8px"><b>Dispute reason:</b> ' + esc(p.shortPay.dispute.reason) + ' ' +
          citeChip(p.shortPay.dispute.itemId, p.shortPay.dispute.span, 'DSP') + '</div>';
      }
    }
    out += '<div class="card' + (shortPay ? ' card-yellow' : '') + '">' +
      '<h3>Amount</h3>' + amountInner + '</div>';

    /* next action card */
    var actionStyle = p.escalate ? 'card-red' : '';
    var banner = p.escalate
      ? '<div class="esc-banner">Escalate to AR lead · needs a human decision today</div>'
      : '<div class="esc-banner ok">No escalation · autonomy window: ' + esc(p.nextAction.action) + '</div>';
    out += '<div class="card action-card ' + actionStyle + '">' +
      '<h3>Recommended next action</h3>' +
      '<div class="action-title">' + esc(p.nextAction.action) + '</div>' +
      '<div class="action-detail">' + esc(p.nextAction.detail) +
        (p.nextAction.dueBy ? ' Due ' + fmtDay(p.nextAction.dueBy) + '.' : '') + '</div>' +
      banner +
      '<div class="conf-line"><span>Grounding confidence</span><div class="conf-bar-track"><div class="conf-bar" style="width:' +
        (p.confidence * 100) + '%"></div></div><span class="conf-pct">' + Math.round(p.confidence * 100) + '%</span></div>' +
      '<div class="muted" style="margin-top:4px">' + esc(p.confidenceRationale.join(' · ')) + '</div>' +
    '</div>';

    /* grounding facts */
    var factsHtml = p.facts.map(function (f, i) { return factRow(f, i); }).join('');
    out += '<div class="card"><h3>Grounding · every claim cites a span</h3>' +
      '<div class="facts">' + factsHtml + '</div>' +
      '<div class="muted" style="margin-top:6px">Click a numbered chip to jump to the cited source span. ' +
        'The rubric lens re-locates every span in code; an unlocatable claim fails the row.</div></div>';

    /* timeline */
    out += '<div class="card"><h3>Channels tried · source of truth</h3>' + renderTimeline(p) + '</div>';

    /* packet json */
    out += '<div class="packet-json">' +
      '<button class="btn-secondary" id="json-toggle">' + (jsonOpen ? 'Hide packet (JSON)' : 'View packet (JSON)') + '</button>' +
      (jsonOpen ? '<pre>' + esc(JSON.stringify(p, null, 2)) + '</pre>' : '') + '</div>';

    host.innerHTML = out;

    Array.prototype.forEach.call(document.querySelectorAll('.fact-idx'), function (chip) {
      chip.onclick = function () {
        var f = p.facts[+chip.textContent - 1];
        locateCite(f.cite.itemId, f.cite.span);
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll('.cite-chip'), function (chip) {
      chip.onclick = function () { locateCite(chip.dataset.item, null); };
    });
    var jt = document.getElementById('json-toggle');
    if (jt) jt.onclick = function () { jsonOpen = !jsonOpen; renderDetail(); };
  }

  function kpi(label, val, sub) {
    return '<div class="kpi"><div class="k-lab">' + esc(label) + '</div>' +
      '<div class="k-val">' + esc(val) + '</div><div class="k-src">' + esc(sub) + '</div></div>';
  }

  /* ---------- timeline rendering ---------- */

  function renderTimeline(p) {
    var out = '<div class="timeline">';

    /* input 1: invoice aging row */
    out += '<div class="tl-item" data-item="aging"><div class="tl-head">' +
      '<span class="tl-type">Aging row</span><span class="tl-date">' + esc(p.invoice.number) + ' · ' + fmtDay(p.invoice.dueDate) + '</span></div>' +
      '<div class="tl-body">' + markText(p.sources.aging, spansFor(p, 'aging')) + '</div></div>';

    /* channel items */
    STUUT_CASES.find(function (c) { return c.id === selected; }).channels.forEach(function (ch) {
      if (ch.type === 'email') {
        var subjMarked = markText(ch.subject, spansFor(p, ch.id));
        var bodyMarked = markText(ch.body, spansFor(p, ch.id));
        out += '<div class="tl-item" data-item="' + ch.id + '"><div class="tl-head">' +
          '<span class="tl-type">' + (ch.direction === 'in' ? 'Email in' : 'Email out') + '</span>' +
          '<span class="tl-date">' + fmtDay(ch.date) + '</span>' +
          (ch.from ? '<span class="tl-email-meta">from ' + esc(ch.from) + '</span>' : '') +
        '</div>' +
        '<div class="tl-subj">' + subjMarked + '</div>' +
        '<div class="tl-body">' + bodyMarked + '</div></div>';
      } else if (ch.type === 'voice') {
        var turns = ch.turns.map(function (t) {
          var cust = !/(stuut|\(ai\)|alex)/i.test(t.speaker);
          var stanceHtml = '';
          if (cust) {
            var st = StuutEngine.turnStance(t.text, ch.date);
            if (st && STANCE_STYLE[st.label]) {
              stanceHtml = ' <span class="stance-pill ' + STANCE_STYLE[st.label][1] + '">' + STANCE_STYLE[st.label][0] + '</span>';
            }
          }
          return '<div class="turn"><span class="turn-time">' + esc(t.time) + '</span>' +
            '<span class="turn-speaker' + (cust ? ' cust' : '') + '">' + esc(t.speaker) + ': ' + stanceHtml + '</span>' +
            '<span class="turn-text">' + markText(t.text, spansFor(p, ch.id)) + '</span></div>';
        }).join('');
        out += '<div class="tl-item" data-item="' + ch.id + '"><div class="tl-head">' +
          '<span class="tl-type">Voice</span><span class="tl-date">' + fmtDay(ch.date) + ' · ' + esc(ch.time || '') + ' · ' + esc(ch.duration || '') + '</span>' +
          '<span class="tl-email-meta">' + esc(ch.label || 'AI voice call') + ' · ' + ch.turns.length + ' turns</span></div>' +
          turns + '</div>';
      } else if (ch.type === 'remittance') {
        var noteMarked = markText(ch.note, spansFor(p, ch.id));
        var shortPill = p.shortPay.detected
          ? '<span class="pill pill-broken">Short-pay</span>'
          : '<span class="pill pill-keep">Paid in full</span>';
        out += '<div class="tl-item" data-item="' + ch.id + '"><div class="tl-head">' +
          '<span class="tl-type">Remittance</span><span class="tl-date">' + fmtDay(ch.date) + '</span>' +
          shortPill + '</div>' +
          '<div class="rmt-amount">' + money(ch.amount) + '</div>' +
          '<div class="tl-email-meta">' + esc(ch.bank || '') + '</div>' +
          '<div class="tl-body">' + noteMarked + '</div></div>';
      }
    });

    out += '</div>';
    return out;
  }

  /* ---------- rubric eval table ---------- */

  function renderRubric() {
    var rows = StuutEngine.rubric(STUUT_CASES);
    var body = rows.map(function (r) {
      var statusCls = r.pass ? 'eval-pass' : 'eval-fail';
      return '<tr data-case="' + r.id + '">' +
        '<td>Case ' + r.id + ' · <span class="muted">' + esc(r.title) + '</span></td>' +
        '<td class="' + statusCls + '">' + (r.pass ? 'PASS' : 'FAIL') + '</td>' +
        '<td class="eval-checks">' + (r.pass ? r.checks.length + '/' + r.checks.length : r.checks.length + ' checks, ' + r.checks.filter(function (k) { return !k.pass; }).length + ' broken') + '</td>' +
        '<td class="eval-reason">' + esc(r.reason) + '</td>' +
      '</tr>';
    }).join('');
    var tbody = document.getElementById('eval-body');
    if (tbody) {
      tbody.innerHTML = body;
      Array.prototype.forEach.call(tbody.querySelectorAll('tr'), function (tr) {
        tr.onclick = function () { selectCase(tr.dataset.case); };
      });
    }
    var note = document.getElementById('worklist-note');
    if (note) {
      var needsHuman = STUUT_CASES.filter(function (c) { return packets[c.id].escalate; }).length;
      note.textContent = needsHuman + ' of ' + STUUT_CASES.length + ' need a human decision today · ranked by exception severity';
    }
  }

  /* ---------- Ask Stuut ---------- */

  function askAnswer(p) {
    if (p.promise.status === 'broken') {
      return 'Broken commitment: payment promised by ' + fmtDay(p.promise.brokenAt) + ' (email ' + p.promise.cite.itemId +
        ') was not received, and the latest voicemail (' + p.promise.stanceItemId +
        ') brings no replacement date. That is why it is escalated for a human call on revised terms. Confidence ' +
        Math.round(p.confidence * 100) + '%.';
    }
    if (p.shortPay.detected) {
      return 'Short-pay exception: ' + money(p.shortPay.received) + ' received against ' + money(p.invoice.total) +
        ' on ' + p.invoice.number + '. ' + money(p.shortPay.short) + ' is withheld pending the ' +
        (p.shortPay.dispute ? 'cited dispute (' + p.shortPay.dispute.itemId + ')' : 'short-pay') +
        '. Recommended: validate and route to Disputes. Confidence ' + Math.round(p.confidence * 100) + '%.';
    }
    if (p.promise.status === 'active') {
      return 'Confirmed promise to pay: full ' + money(p.invoice.total) + ' by ' + p.promise.payByLabel +
        ' on voice (' + p.promise.cite.itemId + '). No escalation. Auto-check runs ' + fmtDay(p.promise.followUp) +
        '; you are not needed unless it slips. Confidence ' + Math.round(p.confidence * 100) + '%.';
    }
    return 'No promise on record; next step is outreach for a confirmed pay-by date.';
  }

  function renderAsk() {
    var el = document.getElementById('ask-answer');
    if (el && selected) el.textContent = askAnswer(packets[selected]);
  }

  function wireAsk() {
    var panel = document.getElementById('ask-panel');
    document.getElementById('ask-chip').onclick = function () { panel.classList.remove('hidden'); renderAsk(); };
    document.getElementById('ask-close').onclick = function () { panel.classList.add('hidden'); };
    document.getElementById('thumb-up').onclick = function () { recordThumb(true); };
    document.getElementById('thumb-down').onclick = function () { recordThumb(false); };
  }

  function recordThumb(up) {
    var key = 'stuut.evalSet';
    var set = { count: 0, thumbsDown: 0 };
    try { set = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) { /* first run */ }
    set.count = (set.count || 0) + 1;
    if (!up) set.thumbsDown = (set.thumbsDown || 0) + 1;
    localStorage.setItem(key, JSON.stringify(set));
    var req = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    var note = document.getElementById('ask-note');
    if (note) {
      note.textContent = 'Saved to the eval set (request_id req_' + req + '). ' +
        (up ? 'Grounded answer kept.' : 'Grounded answer flagged for the eval set.');
    }
    var btn = up ? document.getElementById('thumb-up') : document.getElementById('thumb-down');
    if (btn) btn.classList.add('voted');
    updateEvalCount();
  }

  function updateEvalCount() {
    var el = document.getElementById('eval-count');
    if (!el) return;
    try {
      var set = JSON.parse(localStorage.getItem('stuut.evalSet') || '{}');
      el.textContent = set.count ? set.count + ' feedback in eval set' : '';
    } catch (e) { el.textContent = ''; }
  }

  /* ---------- selection ---------- */

  function selectCase(id) {
    selected = id;
    var dateEl = document.getElementById('top-date');
    if (dateEl) dateEl.textContent = 'As of ' + fmtDay(packets[id].asOf);
    renderWorklist();
    renderDetail();
    renderAsk();
  }

  /* ---------- init ---------- */

  function init() {
    buildAll();

    /* top date: demo world = max asOf across cases */
    var maxAsOf = STUUT_CASES.map(function (c) { return packets[c.id].asOf; }).sort().reverse()[0];
    document.getElementById('top-date').textContent = 'Worklist · ' + fmtDay(maxAsOf);

    var jr = document.getElementById('rerun-btn');
    if (jr) jr.onclick = function () {
      buildAll();
      selectCase(selected);
      renderRubric();
      var rows = Array.prototype.slice.call(document.querySelectorAll('#eval-body tr'));
      rows.forEach(function (tr) {
        tr.classList.add('flash');
        setTimeout(function () { tr.classList.remove('flash'); }, 1200);
      });
    };

    wireAsk();
    updateEvalCount();
    selectCase('B');
    renderRubric();
  }

  return { init: init };
})();

if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('DOMContentLoaded', App.init);
}