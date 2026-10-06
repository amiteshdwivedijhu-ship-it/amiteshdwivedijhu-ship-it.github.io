/*
  Ship Gate app. Static, no build step, no network.
  Hash routes:
    #/queue
    #/gate/<id>/brief | changes | decide | proof
*/
(function () {
  "use strict";

  var SEED = window.SHIP_GATE_SEED;
  var STORE_KEY = "shipgate.northline.v1";
  var LEVELS = ["Off", "Low", "Medium", "High"];
  var KIND_LABEL = { push: "Push", deploy: "Deploy", migrate: "Migrate" };
  var APPROVE_LABEL = { push: "Approve push", deploy: "Approve deploy", migrate: "Approve migration" };
  var RELEASE_TEXT = { push: "Push released", deploy: "Deploy released", migrate: "Migration released" };

  var app = document.getElementById("app");
  var actionbar = document.getElementById("actionbar");
  var toastEl = document.getElementById("toast");
  var modalRoot = document.getElementById("modalRoot");
  var toastTimer = null;
  var state;

  /* ---------- helpers ---------- */

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function fmtTime(ms) {
    var d = new Date(ms);
    try {
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }) + " ET";
    } catch (e) {
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
  }

  function fmtNum(n) { return Number(n).toLocaleString("en-US"); }

  function fmtTokens(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(2).replace(/\.?0+$/, "") + "M";
    if (n >= 1000) return Math.round(n / 1000) + "K";
    return String(n);
  }

  function waitText(min) {
    if (min < 60) return min + " min";
    return Math.floor(min / 60) + " h " + (min % 60) + " min";
  }

  function fresh() {
    var now = Date.now();
    var s = {
      loadedAt: now,
      items: SEED.items.map(function (it) {
        var x = clone(it);
        x.status = "open";
        x.openedAt = now - it.waitMin * 60000;
        return x;
      }),
      caps: {},
      confirmed: {},
      telemetry: "late",
      filterKind: "all",
      filterStatus: "open",
      log: SEED.log.map(function (l) {
        return { t: now - l.minAgo * 60000, actor: l.actor, text: l.text };
      })
    };
    s.log.sort(function (a, b) { return b.t - a.t; });
    return s;
  }

  function save() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* file:// or private mode: keep in memory */ }
  }

  function load() {
    try {
      var raw = sessionStorage.getItem(STORE_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (s && s.items && s.items.length) return s;
      }
    } catch (e) { /* ignore */ }
    return fresh();
  }

  function getItem(id) {
    for (var i = 0; i < state.items.length; i++) if (state.items[i].id === id) return state.items[i];
    return null;
  }

  function byStatus(status) {
    return state.items.filter(function (it) {
      if (status === "closed") return it.status === "approved" || it.status === "capped";
      return it.status === status;
    });
  }

  function openCount() { return byStatus("open").length; }

  function addLog(actor, text) {
    state.log.unshift({ t: Date.now(), actor: actor, text: text });
  }

  function isLate(it) {
    return state.telemetry !== "synced" && SEED.telemetry.lateSessions.indexOf(it.sessionId) !== -1;
  }

  function nextOpen(exceptId) {
    var open = byStatus("open").filter(function (it) { return it.id !== exceptId; });
    var p = open.filter(function (it) { return it.primary; });
    return p[0] || open[0] || null;
  }

  /* ---------- small UI parts ---------- */

  function kindBadge(kind) {
    return '<span class="kind kind-' + kind + '">' + KIND_LABEL[kind] + "</span>";
  }

  function statusBadge(it) {
    if (it.status === "open") return '<span class="status status-open">Waiting</span>';
    if (it.status === "approved") return '<span class="status status-approved">Approved</span>';
    if (it.status === "blocked") return '<span class="status status-blocked">Blocked</span>';
    if (it.status === "capped") return '<span class="status status-capped">Capped</span>';
    return "";
  }

  function chip(text, tone) {
    return '<span class="chip chip-' + (tone || "muted") + '">' + esc(text) + "</span>";
  }

  // Long IDs truncate; tap to expand.
  function idToggle(value, label) {
    return '<button type="button" class="idt" data-action="toggle-id" aria-expanded="false" aria-label="' +
      esc(label || "Show full value") + '"><span class="idt-text">' + esc(value) + '</span><span class="idt-hint" aria-hidden="true">Show all</span></button>';
  }

  function sparkline(points) {
    if (!points || points.length < 2) return "";
    var w = 160, h = 40, max = Math.max.apply(null, points), min = 0;
    var step = w / (points.length - 1);
    var d = points.map(function (p, i) {
      var x = (i * step).toFixed(1);
      var y = (h - 4 - ((p - min) / (max - min || 1)) * (h - 8)).toFixed(1);
      return (i ? "L" : "M") + x + " " + y;
    }).join(" ");
    return '<svg class="spark" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="Synthetic credit trend for this session, rising to ' +
      points[points.length - 1] + ' credits"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function stepper(it, current) {
    var steps = [["brief", "Brief"], ["changes", "Changes"], ["decide", "Decide"], ["proof", "Proof"]];
    var decided = it.status !== "open";
    var idx = steps.map(function (s) { return s[0]; }).indexOf(current);
    return '<nav class="stepper" aria-label="Gate steps"><ol>' + steps.map(function (s, i) {
      var locked = s[0] === "proof" && !decided;
      var cls = "step" + (i === idx ? " is-current" : "") + (i < idx ? " is-done" : "") + (locked ? " is-locked" : "");
      var inner = '<span class="step-n">' + (i + 1) + '</span><span class="step-l">' + s[1] + "</span>";
      if (locked) {
        return '<li><button type="button" class="' + cls + '" data-action="proof-locked">' + inner + "</button></li>";
      }
      return '<li><a class="' + cls + '" href="#/gate/' + it.id + "/" + s[0] + '"' + (i === idx ? ' aria-current="step"' : "") + ">" + inner + "</a></li>";
    }).join("") + "</ol></nav>";
  }

  function gateHeader(it, current) {
    return '<div class="gate-head">' +
      '<a class="back-link" href="#/queue"><span aria-hidden="true">&lsaquo;</span> Queue (' + openCount() + " open)</a>" +
      '<div class="gate-title">' +
        '<div class="gate-badges">' + kindBadge(it.kind) + statusBadge(it) + '<span class="gid">' + esc(it.id) + "</span></div>" +
        '<h1 tabindex="-1">' + esc(it.title) + "</h1>" +
        '<p class="repo">' + esc(it.repo) + "</p>" +
      "</div>" +
      stepper(it, current) +
    "</div>";
  }

  function capBanner(user) {
    var c = state.caps[user];
    if (!c) return "";
    return '<div class="banner banner-cap" role="status"><strong>High autonomy is hidden for ' + esc(user) + " today.</strong> " +
      "Capped at Medium by " + esc(c.by) + " at " + fmtTime(c.at) + ". Reset clears it.</div>";
  }

  /* ---------- screens ---------- */

  function renderQueue() {
    var fs = state.filterStatus, fk = state.filterKind;
    var inStatus = byStatus(fs);
    var list = inStatus.filter(function (it) { return fk === "all" || it.kind === fk; });
    list.sort(function (a, b) {
      if (a.primary !== b.primary) return a.primary ? -1 : 1;
      return a.waitMin - b.waitMin;
    });
    var open = byStatus("open");
    var waitingCredits = open.reduce(function (s, it) { return s + it.credits; }, 0);

    var html = '<section class="screen queue">';
    html += '<div class="screen-head"><h1 tabindex="-1">Gate queue</h1>' +
      "<p class=\"lede\">Droids paused by an org <strong>ask</strong> rule. Approve, Block, or Cap.</p></div>";

    // Telemetry banner
    if (state.telemetry === "late" || state.telemetry === "syncing") {
      var syncing = state.telemetry === "syncing";
      html += '<div class="banner banner-warn" role="status">' +
        '<p><strong>Late telemetry.</strong> Credit data for ' + SEED.telemetry.lateSessions.length +
        " sessions is " + SEED.telemetry.lastSyncMinutes + " min old. Spend shown may be low.</p>" +
        '<div class="banner-actions">' +
          '<button type="button" class="btn btn-small" data-action="tele-retry"' + (syncing ? " disabled" : "") + ">" + (syncing ? "Syncing..." : "Retry sync") + "</button>" +
          '<button type="button" class="btn btn-small btn-ghost" data-action="tele-dismiss"' + (syncing ? " disabled" : "") + ">Dismiss</button>" +
        "</div></div>";
    } else if (state.telemetry === "synced-new") {
      html += '<div class="banner banner-ok" role="status"><p><strong>Telemetry synced.</strong> 2 sessions updated with late credit data.</p>' +
        '<div class="banner-actions"><button type="button" class="btn btn-small btn-ghost" data-action="tele-ok">OK</button></div></div>';
    }

    Object.keys(state.caps).forEach(function (u) { html += capBanner(u); });

    // Stats
    html += '<div class="stats">' +
      '<div class="stat"><span class="stat-n" id="openCount">' + open.length + '</span><span class="stat-l">Open asks</span></div>' +
      '<div class="stat"><span class="stat-n">' + fmtNum(waitingCredits) + '</span><span class="stat-l">Credits paused</span></div>' +
      '<div class="stat"><span class="stat-n">' + SEED.org.maxAutonomy + '</span><span class="stat-l">Org max</span></div>' +
    "</div>";

    html += '<div class="queue-layout"><div class="queue-main">';

    // Status tabs
    var tabs = [["open", "Open"], ["blocked", "Blocked"], ["closed", "Closed"]];
    html += '<div class="tabs" role="tablist" aria-label="Status">' + tabs.map(function (t) {
      var n = byStatus(t[0]).length;
      var on = fs === t[0];
      return '<button type="button" role="tab" class="tab' + (on ? " is-on" : "") + '" aria-selected="' + on + '" data-action="status" data-v="' + t[0] + '">' +
        t[1] + ' <span class="count">' + n + "</span></button>";
    }).join("") + "</div>";

    // Kind filters
    var kinds = [["all", "All"], ["push", "Push"], ["deploy", "Deploy"], ["migrate", "Migrate"]];
    html += '<div class="filters" role="group" aria-label="Filter by command risk">' + kinds.map(function (k) {
      var n = k[0] === "all" ? inStatus.length : inStatus.filter(function (it) { return it.kind === k[0]; }).length;
      var on = fk === k[0];
      return '<button type="button" class="filter' + (on ? " is-on" : "") + '" aria-pressed="' + on + '" data-action="kind" data-v="' + k[0] + '">' +
        k[1] + ' <span class="count">' + n + "</span></button>";
    }).join("") + "</div>";

    html += '<p class="list-meta" aria-live="polite">Showing ' + list.length + " of " + inStatus.length + " " +
      (fs === "open" ? "open" : fs) + " asks</p>";

    if (!list.length) {
      html += emptyState(fs, fk);
    } else {
      html += '<ul class="cards">' + list.map(queueCard).join("") + "</ul>";
    }

    html += '</div><aside class="queue-side">' + orgPanel() + logPanel(8) + "</aside></div>";
    html += "</section>";
    return html;
  }

  function emptyState(fs, fk) {
    var kindWord = fk === "all" ? "" : KIND_LABEL[fk].toLowerCase() + " ";
    var title, body, btn;
    if (fs === "open") {
      title = "No open " + kindWord + "asks";
      body = fk === "all"
        ? "Every paused session has a decision. New asks show up here when a Droid hits an org ask rule. Tap Reset to load the demo again."
        : "No Droid is waiting on a " + kindWord + "step right now. Pick All to see every open ask.";
      btn = fk === "all" ? '<button type="button" class="btn" data-action="reset">Reset demo</button>'
        : '<button type="button" class="btn" data-action="kind" data-v="all">Show all open asks</button>';
    } else if (fs === "blocked") {
      title = "No blocked " + kindWord + "asks";
      body = "When you block an ask from its Decide step, it lands here with your reason. The Droid session stays paused until someone acts.";
      btn = '<button type="button" class="btn" data-action="status" data-v="open">Go to open asks</button>';
    } else {
      title = "Nothing closed yet" + (fk === "all" ? "" : " for " + KIND_LABEL[fk]);
      body = "Approved and capped asks land here. Open an ask, read the brief, and make a call.";
      btn = '<button type="button" class="btn" data-action="status" data-v="open">Go to open asks</button>';
    }
    return '<div class="empty" role="status"><h2>' + esc(title) + "</h2><p>" + esc(body) + "</p>" + btn + "</div>";
  }

  function queueCard(it) {
    var capped = state.caps[it.user] && it.status === "open";
    var outcome = "";
    if (it.status === "blocked") outcome = '<p class="card-outcome is-blocked">Blocked by ' + esc(it.decision.actor) + " at " + fmtTime(it.decision.at) + ": " + esc(it.decision.reason) + "</p>";
    if (it.status === "approved") outcome = '<p class="card-outcome is-approved">' + RELEASE_TEXT[it.kind] + " by " + esc(it.decision.actor) + " at " + fmtTime(it.decision.at) + "</p>";
    if (it.status === "capped") outcome = '<p class="card-outcome is-capped">Capped to Medium by ' + esc(it.decision.actor) + " at " + fmtTime(it.decision.at) + ". Did not run.</p>";

    var target = it.status === "open" ? "brief" : "proof";
    return '<li class="card qcard' + (it.primary && it.status === "open" ? " is-primary" : "") + '">' +
      '<a class="qcard-link" href="#/gate/' + it.id + "/" + target + '" aria-label="' + esc(KIND_LABEL[it.kind] + " ask: " + it.title + ", " + it.repo) + '">' +
        '<div class="qcard-top">' + kindBadge(it.kind) + statusBadge(it) +
          (it.primary && it.status === "open" ? '<span class="tag-start">Start here</span>' : "") +
          '<span class="gid">' + esc(it.id) + "</span></div>" +
        '<h3 class="qcard-title">' + esc(it.title) + "</h3>" +
        '<p class="repo">' + esc(it.repo) + "</p>" +
        '<p class="cmd"><code>' + esc(it.command) + "</code></p>" +
        '<dl class="meta">' +
          '<div><dt>Autonomy</dt><dd>' + esc(it.autonomy) + ", asks " + esc(it.requested) + "</dd></div>" +
          '<div><dt>Credits</dt><dd>' + fmtNum(it.credits) + (isLate(it) ? ' <span class="late-dot" title="Late telemetry">late</span>' : "") + "</dd></div>" +
          '<div><dt>Waiting</dt><dd>' + waitText(it.waitMin) + "</dd></div>" +
          '<div><dt>By</dt><dd>' + esc(it.user) + (it.principal !== "user" ? " (" + esc(it.principal) + ")" : "") + "</dd></div>" +
        "</dl>" +
        (capped ? '<p class="card-note">' + esc(it.user) + " is capped at Medium today. High is hidden.</p>" : "") +
        outcome +
      "</a></li>";
  }

  function orgPanel() {
    var r = SEED.rules;
    return '<section class="card side-card"><h2>Enterprise Controls <span class="syn">synthetic</span></h2>' +
      '<p class="small">Org rules for Northline Eng that pause a session and open a gate.</p>' +
      '<ul class="rules">' + Object.keys(r).map(function (k) {
        return '<li><code>' + esc(r[k].id) + '</code> <span class="dec dec-ask">ask</span><span class="small rule-why">' + esc(r[k].why) + "</span></li>";
      }).join("") + "</ul>" +
      '<p class="small">Org max autonomy: <strong>High</strong>. Daily credit limit per user: <strong>' + fmtNum(SEED.org.dailyCreditLimitPerUser) + "</strong>.</p>" +
      '<div class="elsewhere"><span class="small"><strong>Leadership view elsewhere.</strong> Throughput, output, and attribution live in Agent Effectiveness. Not rebuilt here.</span></div>' +
    "</section>";
  }

  function logPanel(limit) {
    var rows = state.log.slice(0, limit || state.log.length);
    return '<section class="card side-card"><h2>Activity log</h2><ol class="log">' + rows.map(function (l) {
      return '<li><span class="log-meta"><strong>' + esc(l.actor) + "</strong> <time>" + fmtTime(l.t) + "</time></span><span class=\"log-text\">" + esc(l.text) + "</span></li>";
    }).join("") + "</ol></section>";
  }

  function autonomyTrack(it) {
    var capped = !!state.caps[it.user];
    var max = capped ? "Medium" : SEED.org.maxAutonomy;
    var cur = LEVELS.indexOf(it.autonomy), req = LEVELS.indexOf(it.requested), mx = LEVELS.indexOf(max);
    return '<ol class="track" aria-label="Autonomy levels">' + LEVELS.map(function (lv, i) {
      var tags = [];
      if (i === cur) tags.push('<span class="tt tt-cur">Session</span>');
      if (i === req) tags.push('<span class="tt tt-req">Asks</span>');
      if (i === mx) tags.push('<span class="tt tt-max">' + (capped ? "User cap" : "Org max") + "</span>");
      var cls = "lv" + (i <= cur ? " is-on" : "") + (i > mx ? " is-over" : "");
      return '<li class="' + cls + '"><span class="lv-name">' + lv + "</span>" + tags.join("") + "</li>";
    }).join("") + "</ol>";
  }

  function renderBrief(it) {
    var rule = SEED.rules[it.ruleId];
    var pct = Math.round((it.credits / SEED.org.dailyCreditLimitPerUser) * 100);
    var capped = state.caps[it.user];
    var html = '<section class="screen">' + gateHeader(it, "brief") + '<div class="grid-2"><div class="col">';

    html += '<article class="card"><h2>What the Droid was asked to do</h2>' +
      '<blockquote class="intent">' + esc(it.intent) + "</blockquote>" +
      '<dl class="kv">' +
        "<div><dt>Started by</dt><dd>" + esc(it.user) + " (" + esc(it.principal) + ")</dd></div>" +
        "<div><dt>Session</dt><dd>" + idToggle(it.sessionId, "Show full session ID") + "</dd></div>" +
        "<div><dt>Paused at</dt><dd>" + fmtTime(it.openedAt) + " (" + waitText(it.waitMin) + " ago)</dd></div>" +
      "</dl></article>";

    html += '<article class="card card-rule"><h2>Org rule that fired</h2>' +
      '<p class="rule-line"><code class="rule-id">' + esc(rule.id) + '</code> <span class="dec dec-ask">ask</span></p>' +
      '<dl class="kv">' +
        "<div><dt>Command</dt><dd><code>" + esc(it.command) + "</code></dd></div>" +
        "<div><dt>Rule matches</dt><dd><code>" + esc(rule.match) + "</code></dd></div>" +
        "<div><dt>Why</dt><dd>" + esc(rule.why) + "</dd></div>" +
      "</dl></article>";

    html += '<article class="card"><h2>Autonomy</h2>' + autonomyTrack(it) +
      '<p class="explain">Session runs at <strong>' + esc(it.autonomy) + "</strong>. This " + KIND_LABEL[it.kind].toLowerCase() +
      " step needs <strong>" + esc(it.requested) + "</strong>. Org max is <strong>" + SEED.org.maxAutonomy + "</strong>, so a platform lead can release it once.</p>" +
      (capped ? '<p class="explain warn-text">' + esc(it.user) + " is capped at Medium today. High is hidden for their sessions.</p>" : "") +
      "</article>";

    html += '</div><div class="col">';

    html += '<article class="card"><h2>Spend <span class="syn">synthetic</span></h2>' +
      '<div class="spend">' +
        '<div class="spend-n"><span class="big">' + fmtNum(it.credits) + '</span><span class="small">credits this session</span></div>' +
        '<div class="spend-n"><span class="big">~' + fmtTokens(it.tokens) + '</span><span class="small">tokens (estimate)</span></div>' +
      "</div>" +
      '<div class="spark-row">' + sparkline(it.creditTrend) + '<span class="small">Credit trend this session</span></div>' +
      '<div class="meter" role="img" aria-label="' + pct + ' percent of daily user credit limit"><span style="width:' + Math.min(pct, 100) + '%"></span></div>' +
      '<p class="small">' + pct + "% of the " + fmtNum(SEED.org.dailyCreditLimitPerUser) + " credit daily limit for this user.</p>" +
      (isLate(it) ? '<p class="small warn-text">Late telemetry: this number may be low until sync.</p>' : "") +
      "</article>";

    html += '<article class="card"><h2>Linked work <span class="syn">synthetic</span></h2>' +
      '<ul class="links">' +
        '<li><span class="small">Pull request</span><span class="lk">' + esc(it.pr.label) + '</span><span class="small">' + esc(it.pr.title) + "</span></li>" +
        '<li><span class="small">Issue</span><span class="lk">' + esc(it.issue.label) + '</span><span class="small">' + esc(it.issue.title) + "</span></li>" +
        '<li><span class="small">Head commit</span>' + idToggle(it.sha, "Show full commit SHA") + "</li>" +
      "</ul></article>";

    html += "</div></div></section>";
    return html;
  }

  function renderChanges(it) {
    var add = 0, del = 0;
    it.files.forEach(function (f) { add += f.add; del += f.del; });
    var flagText = { payments: "payments path", auth: "auth path", schema: "schema", prod: "prod config" };
    var html = '<section class="screen">' + gateHeader(it, "changes") + '<div class="grid-2"><div class="col">';

    html += '<article class="card"><h2>Change summary</h2>' +
      '<p class="diffsum"><strong>' + it.files.length + " file" + (it.files.length > 1 ? "s" : "") + '</strong> <span class="add">+' + add + '</span> <span class="del">-' + del + "</span></p>" +
      '<ul class="files">' + it.files.map(function (f) {
        return '<li class="file' + (f.flag ? " is-flag" : "") + '">' +
          '<p class="fpath"><code>' + esc(f.path) + "</code></p>" +
          '<p class="fmeta"><span class="add">+' + f.add + '</span> <span class="del">-' + f.del + "</span>" +
          (f.flag ? ' <span class="flag">' + esc(flagText[f.flag] || f.flag) + "</span>" : "") + "</p>" +
          '<p class="fnote">' + esc(f.note) + "</p></li>";
      }).join("") + "</ul>" +
      '<p class="small">This is a gate summary, not a code review. The full diff lives in ' + esc(it.pr.label) + ".</p>" +
      "</article>";

    html += '</div><div class="col">';

    html += '<article class="card"><h2>Risk callouts</h2><ul class="risks">' + it.risks.map(function (r) {
      return '<li class="risk risk-' + r.tone + '"><strong>' + esc(r.title) + "</strong><span>" + esc(r.body) + "</span></li>";
    }).join("") + "</ul></article>";

    html += '<article class="card card-quiet"><h2 class="h-small">Quality signals <span class="syn">secondary</span></h2>' +
      '<div class="chips">' + it.chips.map(function (c) { return chip(c.text, c.tone); }).join("") + "</div>" +
      '<p class="small">Signals help the call. They do not make it.</p></article>';

    html += "</div></div></section>";
    return html;
  }

  function renderDecide(it) {
    var rule = SEED.rules[it.ruleId];
    var warn = it.risks.filter(function (r) { return r.tone === "warn"; })[0] || it.risks[0];
    var confirmed = !!state.confirmed[it.id];
    var html = '<section class="screen">' + gateHeader(it, "decide") + '<div class="grid-2"><div class="col">';

    if (it.status !== "open") {
      html += '<article class="card"><h2>Already decided</h2><p>This ask is ' + esc(it.status) + ". See the proof for who decided and when.</p>" +
        '<a class="btn" href="#/gate/' + it.id + '/proof">See proof</a></article></div></div></section>';
      return html;
    }

    html += '<article class="card"><h2>The call</h2>' +
      '<p class="explain"><code>' + esc(it.command) + "</code> paused by <code>" + esc(rule.id) + "</code>. " +
      esc(it.user) + " runs at " + esc(it.autonomy) + " and this step needs " + esc(it.requested) + ". " +
      fmtNum(it.credits) + " credits spent so far (synthetic).</p></article>";

    html += '<article class="card card-confirm' + (confirmed ? " is-ok" : "") + '" id="confirmCard">' +
      '<h2>' + esc(warn.title) + "</h2><p>" + esc(warn.body) + "</p>" +
      '<label class="check"><input type="checkbox" id="confirmBox" data-action="confirm"' + (confirmed ? " checked" : "") + ">" +
      "<span>" + esc(it.confirm) + "</span></label>" +
      '<p class="err" id="confirmErr" role="alert" hidden></p>' +
      "</article>";

    html += '</div><div class="col">';

    var capWho = it.user;
    html += '<article class="card"><h2>What each choice does</h2><ul class="choices">' +
      '<li><strong>' + APPROVE_LABEL[it.kind] + "</strong><span>Releases this one command. The session goes on at " + esc(it.autonomy) + ". Needs the box above.</span></li>" +
      "<li><strong>Block</strong><span>The command does not run. The session stays paused. You give a one-line reason.</span></li>" +
      "<li><strong>Cap autonomy to Medium</strong><span>The command does not run. " + esc(capWho) + " cannot use High for the rest of today.</span></li>" +
      "</ul></article>";

    html += "</div></div></section>";
    return html;
  }

  function renderProof(it) {
    if (it.status === "open") {
      return '<section class="screen">' + gateHeader(it, "proof") +
        '<article class="card"><h2>No decision yet</h2><p>Proof shows up after you Approve, Block, or Cap. Go to Decide to make the call.</p>' +
        '<a class="btn btn-primary" href="#/gate/' + it.id + '/decide">Go to Decide</a></article></section>';
    }
    var d = it.decision;
    var title, body, tone;
    if (it.status === "approved") {
      tone = "ok"; title = RELEASE_TEXT[it.kind];
      body = "The Droid session resumed and ran <code>" + esc(it.command) + "</code>. Simulated only. No real git, deploy, or database.";
    } else if (it.status === "blocked") {
      tone = "block"; title = "Blocked. Session stays paused.";
      body = "The command did not run. The Droid waits. Reason: <strong>" + esc(d.reason) + "</strong>";
    } else {
      tone = "cap"; title = "Capped at Medium. Command did not run.";
      body = esc(it.user) + " cannot raise autonomy above Medium until Reset. This ask is closed as capped.";
    }

    var html = '<section class="screen">' + gateHeader(it, "proof") + '<div class="grid-2"><div class="col">';
    html += '<article class="card outcome outcome-' + tone + '"><p class="outcome-kicker">Decision recorded</p><h2>' + esc(title) + "</h2><p>" + body + "</p>" +
      '<dl class="kv">' +
        "<div><dt>Actor</dt><dd>" + esc(d.actor) + "</dd></div>" +
        "<div><dt>Time</dt><dd>" + fmtTime(d.at) + "</dd></div>" +
        "<div><dt>Rule</dt><dd><code>" + esc(it.ruleId) + "</code></dd></div>" +
        "<div><dt>Credits at decision</dt><dd>" + fmtNum(d.credits) + " (synthetic)</dd></div>" +
        "<div><dt>Session</dt><dd>" + idToggle(it.sessionId, "Show full session ID") + "</dd></div>" +
      "</dl></article>";

    html += '<article class="card"><h2>Queue</h2><p class="qdelta"><span class="big">' + openCount() + "</span> open asks now <span class=\"small\">(was " + d.openBefore + ")</span></p>" +
      '<p class="small">This ask moved to ' + (it.status === "blocked" ? "Blocked" : "Closed") + ".</p></article>";

    if (it.status === "capped" && state.caps[it.user]) {
      html += '<article class="card"><h2>Autonomy for ' + esc(it.user) + "</h2>" +
        '<p class="small">What ' + esc(it.user) + " sees when they try to raise autonomy today (simulated picker).</p>" +
        '<div class="picker" role="radiogroup" aria-label="Autonomy level for ' + esc(it.user) + '">' + LEVELS.map(function (lv) {
          var hidden = lv === "High";
          var on = lv === "Medium";
          return '<button type="button" role="radio" class="pick' + (on ? " is-on" : "") + (hidden ? " is-hidden" : "") + '" aria-checked="' + on + '"' +
            (hidden ? ' aria-disabled="true" data-action="pick-high"' : ' data-action="pick" data-v="' + lv + '"') + ">" +
            lv + (hidden ? '<span class="pick-why">Hidden today</span>' : "") + "</button>";
        }).join("") + "</div>" +
        '<p class="small" id="pickMsg">High stays hidden until Reset. In a real build this would clear at midnight org time.</p>' +
      "</article>";
    }

    html += '</div><div class="col">' + logPanel(10) + "</div></div></section>";
    return html;
  }

  /* ---------- action bar ---------- */

  function setActionbar(html) {
    if (!html) {
      actionbar.hidden = true;
      actionbar.innerHTML = "";
      document.body.style.setProperty("--ab-h", "0px");
      return;
    }
    actionbar.innerHTML = '<div class="actionbar-inner">' + html + "</div>";
    actionbar.hidden = false;
    requestAnimationFrame(function () {
      document.body.style.setProperty("--ab-h", actionbar.offsetHeight + "px");
    });
  }

  function actionbarFor(route, it) {
    if (route === "queue") {
      var n = nextOpen();
      if (state.filterStatus === "open" && n && n.primary) {
        return '<a class="btn btn-primary btn-block" href="#/gate/' + n.id + '/brief">Open ' + esc(n.id) + ": " + esc(n.title) + "</a>";
      }
      return "";
    }
    if (route === "brief") {
      return '<a class="btn btn-ghost" href="#/queue">Queue</a><a class="btn btn-primary grow" href="#/gate/' + it.id + '/changes">Next: Review changes</a>';
    }
    if (route === "changes") {
      return '<a class="btn btn-ghost" href="#/gate/' + it.id + '/brief">Brief</a><a class="btn btn-primary grow" href="#/gate/' + it.id + '/decide">Next: Decide</a>';
    }
    if (route === "decide") {
      if (it.status !== "open") return '<a class="btn btn-primary grow" href="#/gate/' + it.id + '/proof">See proof</a>';
      var ok = !!state.confirmed[it.id];
      return '<div class="decide-bar">' +
        '<button type="button" class="btn btn-primary btn-block' + (ok ? "" : " is-locked") + '" id="approveBtn" data-action="approve" aria-disabled="' + (!ok) + '">' +
          (ok ? "" : '<span class="lock" aria-hidden="true"></span>') + APPROVE_LABEL[it.kind] + (ok ? "" : '<span class="sr-only"> (locked until you confirm the risk note)</span>') + "</button>" +
        '<div class="decide-row">' +
          '<button type="button" class="btn btn-cap grow" data-action="cap-open">Cap to Medium</button>' +
          '<button type="button" class="btn btn-block-red grow" data-action="block-open">Block</button>' +
        "</div></div>";
    }
    if (route === "proof") {
      var nx = nextOpen(it.id);
      return '<a class="btn btn-ghost" href="#/queue">Queue</a>' +
        (nx ? '<a class="btn btn-primary grow" href="#/gate/' + nx.id + '/brief">Next ask: ' + esc(nx.id) + "</a>"
            : '<a class="btn btn-primary grow" href="#/queue">Back to queue</a>');
    }
    return "";
  }

  /* ---------- toast + modal ---------- */

  function toast(msg, tone) {
    clearTimeout(toastTimer);
    toastEl.className = "toast" + (tone ? " toast-" + tone : "");
    toastEl.textContent = msg;
    toastEl.hidden = false;
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 4200);
  }

  var lastFocus = null;

  function openModal(html, labelId) {
    lastFocus = document.activeElement;
    modalRoot.innerHTML = '<div class="modal-backdrop" data-action="modal-close"></div>' +
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="' + labelId + '"><div class="modal-body">' + html + "</div></div>";
    document.body.classList.add("modal-open");
    var first = modalRoot.querySelector("input, textarea, button.btn-primary, button.btn-cap, button.btn-block-red, button");
    if (first) setTimeout(function () { first.focus(); }, 30);
  }

  function closeModal() {
    modalRoot.innerHTML = "";
    document.body.classList.remove("modal-open");
    if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus();
  }

  function blockModal(it) {
    var picks = ["Needs a canary first", "Wrong branch", "Spend too high for this change", "Owner must review"];
    openModal('<h2 id="mTitle">Block this ' + KIND_LABEL[it.kind].toLowerCase() + "?</h2>" +
      "<p>The command will not run and the Droid session stays paused. " + esc(it.user) + " sees your reason.</p>" +
      '<label class="field-label" for="blockReason">One-line reason (required)</label>' +
      '<input id="blockReason" class="field" type="text" maxlength="120" autocomplete="off" placeholder="Example: Needs a canary first">' +
      '<p class="err" id="blockErr" role="alert" hidden>Add a short reason so ' + esc(it.user) + ' knows what to fix.</p>' +
      '<div class="quick" role="group" aria-label="Quick reasons">' + picks.map(function (p) {
        return '<button type="button" class="chip-btn" data-action="block-pick" data-v="' + esc(p) + '">' + esc(p) + "</button>";
      }).join("") + "</div>" +
      '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-action="modal-close">Cancel</button>' +
      '<button type="button" class="btn btn-block-red grow" data-action="block-do">Block and keep paused</button></div>', "mTitle");
  }

  function capModal(it) {
    openModal('<h2 id="mTitle">Cap ' + esc(it.user) + " to Medium?</h2>" +
      "<ul class=\"bullets\">" +
        "<li>This " + KIND_LABEL[it.kind].toLowerCase() + " does not run. The ask closes as capped.</li>" +
        "<li>" + esc(it.user) + " cannot pick High for the rest of today. Low and Medium still work.</li>" +
        "<li>Their other open asks stay in the queue for you to decide.</li>" +
        "<li>Reset clears the cap in this demo.</li>" +
      "</ul>" +
      '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-action="modal-close">Cancel</button>' +
      '<button type="button" class="btn btn-cap grow" data-action="cap-do">Cap to Medium</button></div>', "mTitle");
  }

  function resetModal() {
    openModal('<h2 id="mTitle">Reset the demo?</h2><p>This restores all 7 seed asks, clears caps, and resets the activity log.</p>' +
      '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-action="modal-close">Cancel</button>' +
      '<button type="button" class="btn btn-primary grow" data-action="reset-do">Reset</button></div>', "mTitle");
  }

  /* ---------- decisions ---------- */

  function decide(it, status, extra) {
    var before = openCount();
    it.status = status;
    it.decision = { actor: SEED.org.reviewer, at: Date.now(), credits: it.credits, openBefore: before };
    if (extra) for (var k in extra) it.decision[k] = extra[k];
    var verb = status === "approved" ? "Approved " + KIND_LABEL[it.kind].toLowerCase()
      : status === "blocked" ? "Blocked " + KIND_LABEL[it.kind].toLowerCase()
      : "Capped " + it.user + " to Medium on";
    var text = verb + " " + it.id + " (" + it.repo + "). Rule " + it.ruleId + ".";
    if (status === "approved") text += " Session resumed.";
    if (status === "blocked") text += " Reason: " + extra.reason + ". Session paused.";
    if (status === "capped") text += " High hidden for " + it.user + " today.";
    addLog(SEED.org.reviewer, text);
    save();
    location.hash = "#/gate/" + it.id + "/proof";
  }

  /* ---------- router ---------- */

  function parse() {
    var h = location.hash.replace(/^#\/?/, "");
    var parts = h.split("/");
    if (parts[0] === "gate" && parts[1]) {
      var it = getItem(parts[1]);
      var step = ["brief", "changes", "decide", "proof"].indexOf(parts[2]) !== -1 ? parts[2] : "brief";
      if (it) return { route: step, item: it };
    }
    return { route: "queue", item: null };
  }

  function render(keepScroll) {
    var r = parse();
    var html;
    if (r.route === "queue") html = renderQueue();
    else if (r.route === "brief") html = renderBrief(r.item);
    else if (r.route === "changes") html = renderChanges(r.item);
    else if (r.route === "decide") html = renderDecide(r.item);
    else html = renderProof(r.item);
    app.innerHTML = html;
    setActionbar(actionbarFor(r.route, r.item));
    if (!keepScroll) {
      window.scrollTo(0, 0);
      var h1 = app.querySelector("h1");
      if (h1) h1.focus({ preventScroll: true });
    }
  }

  /* ---------- events ---------- */

  function current() { return parse().item; }

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-action]");
    if (!el) return;
    var a = el.getAttribute("data-action");
    var it = current();

    switch (a) {
      case "toggle-id":
        var ex = el.getAttribute("aria-expanded") === "true";
        el.setAttribute("aria-expanded", String(!ex));
        el.classList.toggle("is-open", !ex);
        el.querySelector(".idt-hint").textContent = ex ? "Show all" : "Show less";
        break;
      case "status":
        state.filterStatus = el.getAttribute("data-v");
        save(); render(true);
        break;
      case "kind":
        state.filterKind = el.getAttribute("data-v");
        save(); render(true);
        break;
      case "tele-retry":
        state.telemetry = "syncing"; render(true);
        setTimeout(function () {
          state.items.forEach(function (x) {
            if (SEED.telemetry.lateSessions.indexOf(x.sessionId) !== -1) {
              var bump = x.id === "g-102" ? 23 : 41;
              x.credits += bump;
              x.creditTrend.push(x.credits);
            }
          });
          state.telemetry = "synced-new";
          addLog("Ship Gate", "Telemetry synced. Late credit data added for 2 sessions.");
          save();
          if (parse().route === "queue") render(true);
          toast("Telemetry synced. 2 sessions updated.", "ok");
        }, 1200);
        break;
      case "tele-dismiss":
        state.telemetry = "dismissed"; save(); render(true);
        toast("Banner hidden. Spend for 2 sessions may still be low.");
        break;
      case "tele-ok":
        state.telemetry = "synced"; save(); render(true);
        break;
      case "proof-locked":
        toast("Proof unlocks after you decide. Go to Decide first.");
        break;
      case "confirm":
        // handled on change
        break;
      case "approve":
        if (!it) break;
        if (!state.confirmed[it.id]) {
          var err = document.getElementById("confirmErr");
          var card = document.getElementById("confirmCard");
          var warn = it.risks.filter(function (r) { return r.tone === "warn"; })[0] || it.risks[0];
          if (err) {
            err.textContent = "Approve is locked. Read \"" + warn.title + "\" and tick the box first. This step can change production, so a person has to confirm the risk.";
            err.hidden = false;
          }
          if (card) {
            card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
            card.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          toast("Confirm the risk note to unlock " + APPROVE_LABEL[it.kind] + ".", "warn");
          break;
        }
        decide(it, "approved");
        toast(RELEASE_TEXT[it.kind] + ". Logged for Reviewer R.", "ok");
        break;
      case "block-open":
        if (it) blockModal(it);
        break;
      case "block-pick":
        var inp = document.getElementById("blockReason");
        if (inp) { inp.value = el.getAttribute("data-v"); inp.focus(); document.getElementById("blockErr").hidden = true; }
        break;
      case "block-do":
        var reason = (document.getElementById("blockReason").value || "").trim();
        if (!reason) {
          document.getElementById("blockErr").hidden = false;
          document.getElementById("blockReason").focus();
          break;
        }
        closeModal();
        decide(it, "blocked", { reason: reason });
        toast("Blocked. Session stays paused.", "block");
        break;
      case "cap-open":
        if (it) capModal(it);
        break;
      case "cap-do":
        state.caps[it.user] = { by: SEED.org.reviewer, at: Date.now() };
        closeModal();
        decide(it, "capped");
        toast(it.user + " capped at Medium for today.", "warn");
        break;
      case "pick-high":
        var m = document.getElementById("pickMsg");
        if (m) { m.textContent = "High is hidden for " + it.user + " today. A platform lead set a cap. Reset clears it."; m.classList.add("warn-text"); }
        toast("High is hidden today for " + it.user + ".", "warn");
        break;
      case "pick":
        toast(el.getAttribute("data-v") + " is allowed. This picker is a preview only.");
        break;
      case "modal-close":
        closeModal();
        break;
      case "reset":
        resetModal();
        break;
      case "reset-do":
        state = fresh();
        save();
        closeModal();
        if (location.hash === "#/queue") render(); else location.hash = "#/queue";
        toast("Demo reset. 7 seed asks restored.", "ok");
        break;
    }
  });

  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "confirmBox") {
      var it = current();
      if (!it) return;
      state.confirmed[it.id] = e.target.checked;
      save();
      var card = document.getElementById("confirmCard");
      if (card) card.classList.toggle("is-ok", e.target.checked);
      var err = document.getElementById("confirmErr");
      if (err && e.target.checked) err.hidden = true;
      setActionbar(actionbarFor("decide", it));
      if (e.target.checked) toast(APPROVE_LABEL[it.kind] + " unlocked.", "ok");
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modalRoot.innerHTML) closeModal();
    if (e.key === "Enter" && e.target && e.target.id === "blockReason") {
      var btn = modalRoot.querySelector('[data-action="block-do"]');
      if (btn) btn.click();
    }
  });

  document.getElementById("resetBtn").addEventListener("click", function (e) {
    e.stopPropagation();
    resetModal();
  });

  window.addEventListener("hashchange", function () { closeModal(); render(); });
  window.addEventListener("resize", function () {
    if (!actionbar.hidden) document.body.style.setProperty("--ab-h", actionbar.offsetHeight + "px");
  });

  state = load();
  if (!location.hash) history.replaceState(null, "", "#/queue");
  render();
})();
