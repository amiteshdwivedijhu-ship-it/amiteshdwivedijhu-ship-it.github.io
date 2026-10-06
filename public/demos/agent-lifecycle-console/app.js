(function () {
  "use strict";
  var KEY = "sycamore-alc-v1";
  function defaultState() {
    return {
      panel: "roster",
      selected: "wire",
      toolScopesFixed: false,
      dryRunCleared: false,
      live: false,
      approvedRun: false,
      incidentAction: null,
      incidentNote: "",
      drained: false,
      retireReason: "",
      retireSignedBy: "",
      retired: false,
      rolledBack: false
    };
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) { return defaultState(); }
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
  var state = load();
  var seed = window.ALC_SEED;

  function $(id) { return document.getElementById(id); }
  function agent() { return seed.agents.find(function (a) { return a.id === state.selected; }); }

  function goLiveChecks() {
    var a = agent();
    var scoped = state.toolScopesFixed || state.selected !== "wire";
    return [
      { ok: !!(a && a.owner), label: "Owner and backup named", reason: "Owner missing" },
      { ok: true, label: "Prod env and model pinned", reason: "" },
      { ok: scoped, label: "Tool permissions scoped (no wildcard)", reason: "wire.release still has wildcard *" },
      { ok: true, label: "Runtime policy pack attached (" + seed.policyPack + ")", reason: "" },
      { ok: state.dryRunCleared || state.selected !== "wire", label: "Dry-run has zero open policy blocks", reason: "Dry-run still has 1 open policy block" }
    ];
  }
  function canGoLive() { return goLiveChecks().every(function (c) { return c.ok; }); }
  function retireChecks() {
    return [
      { ok: state.live || state.retired, label: "Agent was live (or already retired)", reason: "Not live yet" },
      { ok: state.drained || state.retired, label: "Live traffic drained to zero", reason: "Traffic not drained" },
      { ok: !!(state.retireReason && state.retireReason.trim()), label: "Retirement reason written", reason: "Reason required" },
      { ok: !!(state.retireSignedBy && state.retireSignedBy.trim()), label: "Evidence pack signed", reason: "Signature required" }
    ];
  }
  function canRetire() { return retireChecks().every(function (c) { return c.ok; }) && !state.retired; }

  function setPanel(name) {
    state.panel = name;
    save();
    render();
  }

  function renderNav() {
    document.querySelectorAll(".nav-steps button").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-panel") === state.panel);
    });
    document.querySelectorAll(".panel").forEach(function (p) {
      p.classList.toggle("active", p.id === "panel-" + state.panel);
    });
  }

  function renderRoster() {
    var html = '<div class="card"><h2>Agent roster · ' + seed.customer + '</h2>';
    seed.agents.forEach(function (a) {
      var status = a.id === "wire" ? (state.retired ? "Retiring" : state.live ? "Live" : "Draft") : a.status;
      var chip = status === "Live" ? "live" : status === "Draft" ? "draft" : "retiring";
      html += '<button type="button" class="list-btn' + (state.selected === a.id ? " selected" : "") + '" data-select="' + a.id + '"><span><strong>' + a.name + '</strong><br><span style="color:#5b6b63;font-size:14px">' + a.owner + ' · ' + a.track + '</span></span><span class="chip ' + chip + '">' + status + '</span></button>';
    });
    html += '</div>';
    $("panel-roster").innerHTML = html;
  }

  function renderOwnership() {
    var a = agent();
    var tools = seed.tools.map(function (t) {
      var scope = (t.id === "wire.release" && state.toolScopesFixed) ? "wire:release:approval" : t.scope;
      var bad = scope === "*";
      return '<tr><td>' + t.label + '</td><td>' + scope + (bad ? ' <span class="chip blocked">wildcard</span>' : '') + '</td></tr>';
    }).join("");
    $("panel-ownership").innerHTML =
      '<div class="card"><h2>Ownership</h2>' +
      '<div class="row"><div class="metric"><div class="label">Owner</div><div class="value" style="font-size:1rem">' + a.owner + '</div></div>' +
      '<div class="metric"><div class="label">Backup</div><div class="value" style="font-size:1rem">Jordan Lee</div></div>' +
      '<div class="metric"><div class="label">Track</div><div class="value" style="font-size:1rem">' + a.track + '</div></div></div>' +
      '<p style="margin:0.75rem 0 0.35rem"><strong>Environments:</strong> Preview · Dev · <strong>Prod</strong> (pinned)</p>' +
      '<p style="margin:0"><strong>Model pin:</strong> bank-ops-router@2026.09.18</p></div>' +
      '<div class="card"><h2>Tool scopes</h2><div class="table-wrap"><table><thead><tr><th>Tool</th><th>Scope</th></tr></thead><tbody>' + tools + '</tbody></table></div>' +
      (state.toolScopesFixed ? '<p class="ok-reason">Wildcard removed. wire.release now requires approval.</p>' :
        '<div class="actions"><button type="button" class="primary" id="fix-scope">Fix wildcard on wire.release</button></div>') +
      '</div>';
  }

  function renderGoLive() {
    var checks = goLiveChecks();
    var list = checks.map(function (c) {
      return '<div class="check"><div class="status ' + (c.ok ? "pass" : "fail") + '">' + (c.ok ? "PASS" : "FAIL") + '</div><div><div>' + c.label + '</div>' + (!c.ok ? '<div style="color:#991b1b;font-size:14px">' + c.reason + '</div>' : '') + '</div></div>';
    }).join("");
    var lock = canGoLive()
      ? (state.live ? '<p class="ok-reason">Agent is live in Prod.</p>' : '<div class="actions"><button type="button" class="primary" id="btn-golive">Go Live</button></div>')
      : '<p class="lock-reason">Go Live locked: ' + checks.filter(function (c) { return !c.ok; }).map(function (c) { return c.reason; }).join("; ") + '</p>' +
        (!state.dryRunCleared ? '<div class="actions"><button type="button" id="clear-dryrun">Clear dry-run policy block</button></div>' : '');
    $("panel-golive").innerHTML = '<div class="card"><h2>Go-live checklist</h2>' + list + lock + '</div>';
  }

  function renderMonitor() {
    if (!state.live && !state.retired) {
      $("panel-monitor").innerHTML = '<div class="card"><h2>Live monitor</h2><p>Agent is not live yet. Clear go-live checks first.</p></div>';
      return;
    }
    var rows = seed.runs.map(function (r) {
      var chip = r.result === "allow" ? "live" : r.result === "block" ? "blocked" : "retiring";
      var action = (r.id === "r2" && !state.approvedRun)
        ? '<button type="button" data-approve="' + r.id + '" class="success">Approve</button>'
        : (r.id === "r2" && state.approvedRun ? '<span class="chip live">approved</span>' : "");
      return '<tr><td>' + r.when + '</td><td><span class="chip ' + chip + '">' + r.result + '</span></td><td>' + r.latency + '</td><td>' + r.note + ' ' + action + '</td></tr>';
    }).join("");
    $("panel-monitor").innerHTML =
      '<div class="card"><h2>Live monitor</h2><div class="row">' +
      '<div class="metric"><div class="label">Error rate</div><div class="value">' + (state.rolledBack ? "0.4%" : "2.1%") + '</div></div>' +
      '<div class="metric"><div class="label">p95 latency</div><div class="value">' + (state.rolledBack ? "1.3s" : "3.8s") + '</div></div>' +
      '<div class="metric"><div class="label">Policy hits</div><div class="value">12</div></div></div>' +
      '<div class="table-wrap" style="margin-top:0.75rem"><table><thead><tr><th>Time</th><th>Decision</th><th>Latency</th><th>Note</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function renderIncident() {
    $("panel-incident").innerHTML =
      '<div class="card"><h2>Incident</h2>' +
      '<p><strong>Symptom:</strong> latency spike + one blocked consequential wire.release.</p>' +
      '<p><strong>Suspected cause:</strong> model pin drift after morning promote.</p>' +
      (state.incidentAction ? '<p class="ok-reason">Action taken: ' + state.incidentAction + (state.incidentNote ? " · Note: " + state.incidentNote : "") + (state.rolledBack ? " · Rolled back to bank-ops-router@2026.09.12" : "") + '</p>' :
        '<label for="inc-note">Note (required for Keep watching)</label><textarea id="inc-note" rows="3" placeholder="What are you watching for?"></textarea>' +
        '<div class="actions">' +
        '<button type="button" class="primary" id="inc-rollback">Roll back version</button>' +
        '<button type="button" id="inc-tighten">Tighten policy</button>' +
        '<button type="button" id="inc-watch">Keep watching</button></div>') +
      '</div>';
  }

  function renderRetire() {
    var checks = retireChecks();
    var list = checks.map(function (c) {
      return '<div class="check"><div class="status ' + (c.ok ? "pass" : "fail") + '">' + (c.ok ? "PASS" : "FAIL") + '</div><div>' + c.label + (!c.ok ? '<div style="color:#991b1b;font-size:14px">' + c.reason + '</div>' : '') + '</div></div>';
    }).join("");
    $("panel-retire").innerHTML =
      '<div class="card"><h2>Retire agent</h2>' + list +
      (!state.drained && state.live ? '<div class="actions"><button type="button" id="btn-drain">Drain traffic to zero</button></div>' : '') +
      '<label for="retire-reason">Retirement reason</label><textarea id="retire-reason" rows="3">' + (state.retireReason || "") + '</textarea>' +
      '<label for="retire-sign">Sign evidence pack as</label><input type="text" id="retire-sign" value="' + (state.retireSignedBy || "") + '" placeholder="Your name">' +
      (state.retired ? '<p class="ok-reason">Agent retired. Evidence pack sealed.</p>' :
        (canRetire() ? '<div class="actions"><button type="button" class="danger" id="btn-retire">Retire agent</button></div>' :
          '<p class="lock-reason">Retire locked until drain, reason, and signature are complete' + (!state.live && !state.retired ? " (and agent has been live)" : "") + '.</p>')) +
      '</div>';
  }

  function renderEvidence() {
    $("panel-evidence").innerHTML =
      '<div class="card"><h2>Evidence pack</h2>' +
      '<p><strong>Customer:</strong> ' + seed.customer + '</p>' +
      '<p><strong>Agent:</strong> ' + agent().name + '</p>' +
      '<p><strong>Owner history:</strong> ' + agent().owner + ' (current), Jordan Lee (backup)</p>' +
      '<p><strong>Versions:</strong> bank-ops-router@2026.09.18' + (state.rolledBack ? ' · rolled back to @2026.09.12' : '') + '</p>' +
      '<p><strong>Policy pack:</strong> ' + seed.policyPack + '</p>' +
      '<p><strong>Consequential actions (30d):</strong> 148</p>' +
      '<p><strong>Retirement reason:</strong> ' + (state.retireReason || "(not signed yet)") + '</p>' +
      '<p><strong>Signed by:</strong> ' + (state.retireSignedBy || "(pending)") + '</p>' +
      (state.retired ? '<p class="ok-reason">Pack status: sealed</p>' : '<p class="lock-reason">Pack status: open until retire completes</p>') +
      '</div>';
  }

  function render() {
    renderNav();
    renderRoster();
    renderOwnership();
    renderGoLive();
    renderMonitor();
    renderIncident();
    renderRetire();
    renderEvidence();
    bind();
  }

  function bind() {
    document.querySelectorAll("[data-select]").forEach(function (btn) {
      btn.onclick = function () { state.selected = btn.getAttribute("data-select"); save(); render(); };
    });
    var fix = $("fix-scope"); if (fix) fix.onclick = function () { state.toolScopesFixed = true; save(); render(); };
    var dry = $("clear-dryrun"); if (dry) dry.onclick = function () { state.dryRunCleared = true; save(); render(); };
    var gl = $("btn-golive"); if (gl) gl.onclick = function () { if (!canGoLive()) return; state.live = true; save(); setPanel("monitor"); };
    document.querySelectorAll("[data-approve]").forEach(function (btn) {
      btn.onclick = function () { state.approvedRun = true; save(); render(); };
    });
    var rb = $("inc-rollback"); if (rb) rb.onclick = function () { state.incidentAction = "Roll back version"; state.rolledBack = true; save(); render(); };
    var tight = $("inc-tighten"); if (tight) tight.onclick = function () { state.incidentAction = "Tighten policy"; save(); render(); };
    var watch = $("inc-watch"); if (watch) watch.onclick = function () {
      var note = ($("inc-note") || {}).value || "";
      if (!note.trim()) { alert("Add a note for Keep watching."); return; }
      state.incidentAction = "Keep watching"; state.incidentNote = note; save(); render();
    };
    var drain = $("btn-drain"); if (drain) drain.onclick = function () { state.drained = true; save(); render(); };
    var rr = $("retire-reason"); if (rr) rr.onchange = rr.onblur = function () { state.retireReason = rr.value; save(); render(); };
    var rs = $("retire-sign"); if (rs) rs.onchange = rs.onblur = function () { state.retireSignedBy = rs.value; save(); render(); };
    var ret = $("btn-retire"); if (ret) ret.onclick = function () {
      state.retireReason = ($("retire-reason") || {}).value || state.retireReason;
      state.retireSignedBy = ($("retire-sign") || {}).value || state.retireSignedBy;
      if (!canRetire()) { save(); render(); return; }
      state.retired = true; state.live = false; save(); setPanel("evidence");
    };
  }

  document.querySelectorAll(".nav-steps button").forEach(function (btn) {
    btn.onclick = function () { setPanel(btn.getAttribute("data-panel")); };
  });
  $("btn-reset").onclick = function () { state = defaultState(); save(); render(); };
  render();
})();
