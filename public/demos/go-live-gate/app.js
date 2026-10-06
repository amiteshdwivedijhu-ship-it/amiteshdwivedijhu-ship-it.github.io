(function () {
  "use strict";

  var STORAGE_KEY = "euclid-go-live-gate-v1";
  var STATUS_STEPS = [
    "Scoped",
    "Spec signed",
    "Build",
    "UAT",
    "Gate",
    "Live",
    "Handed off"
  ];

  function defaultState() {
    return {
      panel: "deployment",
      fixedRules: {},
      exceptions: {
        "ex-rate": { status: "open", note: "", sentEng: false },
        "ex-ref": { status: "open", note: "", sentEng: false },
        "ex-tz": { status: "open", note: "", sentEng: false }
      },
      acceptedEdgeCases: [],
      rulesAdded: [],
      determinismRun: false,
      determinismIdentical: false,
      signoffName: "",
      signoffDate: "",
      live: false,
      handedOff: false,
      statusIndex: 3 /* UAT */
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      var parsed = JSON.parse(raw);
      var base = defaultState();
      return Object.assign(base, parsed, {
        fixedRules: Object.assign({}, base.fixedRules, parsed.fixedRules || {}),
        exceptions: Object.assign({}, base.exceptions, parsed.exceptions || {})
      });
    } catch (e) {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  var state = loadState();

  function $(id) {
    return document.getElementById(id);
  }

  function openExceptions() {
    var list = [];
    Object.keys(state.exceptions).forEach(function (id) {
      var ex = state.exceptions[id];
      if (ex.status === "open" || ex.status === "engineering") list.push(id);
    });
    return list;
  }

  function computeAccuracy(loads) {
    var critical = window.GLG_SEED.criticalFields;
    var other = window.GLG_SEED.otherFields;
    var critTotal = 0;
    var critOk = 0;
    var otherTotal = 0;
    var otherOk = 0;

    loads.forEach(function (load) {
      critical.forEach(function (f) {
        critTotal++;
        if (load.agent[f] === load.expected[f]) critOk++;
      });
      other.forEach(function (f) {
        otherTotal++;
        if (load.agent[f] === load.expected[f]) otherOk++;
      });
    });

    return {
      criticalPct: critTotal ? (critOk / critTotal) * 100 : 100,
      otherPct: otherTotal ? (otherOk / otherTotal) * 100 : 100,
      critOk: critOk,
      critTotal: critTotal,
      otherOk: otherOk,
      otherTotal: otherTotal,
      loadExceptions: loads.filter(function (l) {
        return l.hasException;
      }).length
    };
  }

  function gateChecks(loads, acc) {
    var open = openExceptions();
    var moneyOk = acc.criticalPct >= 100;
    var otherOk = acc.otherPct >= 98;
    var zeroOpen = open.length === 0;
    var determOk = state.determinismRun && state.determinismIdentical;
    var signoffOk =
      !!(state.signoffName && state.signoffName.trim()) &&
      !!(state.signoffDate && state.signoffDate.trim());

    var reasons = [];
    if (!moneyOk) {
      reasons.push(
        "Money and reference fields are at " +
          acc.criticalPct.toFixed(1) +
          "% (need 100%)."
      );
    }
    if (!otherOk) {
      reasons.push(
        "Other fields are at " + acc.otherPct.toFixed(1) + "% (need at least 98%)."
      );
    }
    if (!zeroOpen) {
      reasons.push(
        open.length +
          " open exception" +
          (open.length === 1 ? "" : "s") +
          " remain in the queue."
      );
    }
    if (!state.determinismRun) {
      reasons.push("Determinism check has not been run.");
    } else if (!state.determinismIdentical) {
      reasons.push("Run A and run B are not identical. Fix the mismatched rule and run again.");
    }
    if (!signoffOk) {
      reasons.push("Customer UAT signoff needs a name and a date.");
    }

    return {
      checks: [
        {
          id: "money",
          name: "UAT accuracy on money and reference fields is 100%",
          pass: moneyOk,
          reason: moneyOk
            ? "Rate, linehaul, accessorials, customer reference, pickup and delivery appointment all match on the UAT set."
            : "Currently " +
              acc.criticalPct.toFixed(1) +
              "%. Clear rate, reference, and appointment exceptions."
        },
        {
          id: "other",
          name: "All other fields are at least 98%",
          pass: otherOk,
          reason: otherOk
            ? "Origin, destination, equipment, and shipper are at " +
              acc.otherPct.toFixed(1) +
              "%."
            : "Currently " + acc.otherPct.toFixed(1) + "%."
        },
        {
          id: "exceptions",
          name: "Zero open exceptions in the queue",
          pass: zeroOpen,
          reason: zeroOpen
            ? "Exception queue is clear."
            : open.length + " still open or sent to engineering."
        },
        {
          id: "determinism",
          name: "Second run on the same UAT set gives identical output",
          pass: determOk,
          reason: determOk
            ? "Run A and run B match field by field."
            : !state.determinismRun
              ? "Not run yet. Open Determinism and press Run again."
              : "Mismatch remains on at least one field."
        },
        {
          id: "signoff",
          name: "Customer UAT signoff recorded with name and date",
          pass: signoffOk,
          reason: signoffOk
            ? "Signed by " + state.signoffName.trim() + " on " + state.signoffDate + "."
            : "Enter signoff name and date below."
        }
      ],
      allPass: moneyOk && otherOk && zeroOpen && determOk && signoffOk,
      lockReasons: reasons
    };
  }

  function syncStatusFromState(gate) {
    if (state.handedOff) {
      state.statusIndex = 6;
    } else if (state.live) {
      state.statusIndex = 5;
    } else if (gate && gate.allPass) {
      state.statusIndex = 4;
    } else if (openExceptions().length < 3 || Object.keys(state.fixedRules).length) {
      state.statusIndex = 3;
    } else {
      state.statusIndex = 3;
    }
  }

  function setPanel(name) {
    state.panel = name;
    saveState();
    render();
  }

  function resetDemo() {
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    render();
  }

  function fixRule(exId) {
    var meta = window.GLG_SEED.seededExceptions.find(function (e) {
      return e.id === exId;
    });
    if (!meta) return;
    state.fixedRules[meta.ruleFixKey] = true;
    state.exceptions[exId].status = "fixed";
    state.exceptions[exId].sentEng = false;
    if (state.rulesAdded.indexOf(meta.businessRule) === -1) {
      state.rulesAdded.push(meta.businessRule);
    }
    /* Re-check determinism after rate fix */
    if (meta.ruleFixKey === "rate_digit_swap" && state.determinismRun) {
      state.determinismIdentical = true;
    }
    if (meta.ruleFixKey === "pickup_tz" && state.determinismRun && state.fixedRules.rate_digit_swap) {
      state.determinismIdentical = true;
    }
    saveState();
    render();
  }

  function showAcceptNote(exId) {
    var box = $("note-" + exId);
    if (box) box.classList.add("show");
  }

  function acceptEdgeCase(exId) {
    var noteEl = $("note-input-" + exId);
    var note = noteEl ? noteEl.value.trim() : "";
    if (!note) {
      if (noteEl) {
        noteEl.focus();
        noteEl.setAttribute("placeholder", "A note is required to accept as an edge case.");
      }
      return;
    }
    var meta = window.GLG_SEED.seededExceptions.find(function (e) {
      return e.id === exId;
    });
    state.exceptions[exId].status = "accepted";
    state.exceptions[exId].note = note;
    state.exceptions[exId].sentEng = false;
    if (meta && meta.ruleFixKey === "missing_po_policy") {
      state.fixedRules.accept_missing_po = true;
    }
    var entry = {
      id: exId,
      title: meta ? meta.title : exId,
      note: note
    };
    state.acceptedEdgeCases = state.acceptedEdgeCases.filter(function (a) {
      return a.id !== exId;
    });
    state.acceptedEdgeCases.push(entry);
    saveState();
    render();
  }

  function sendToEngineering(exId) {
    state.exceptions[exId].status = "engineering";
    state.exceptions[exId].sentEng = true;
    /* Engineering items stay open and block the gate */
    saveState();
    render();
  }

  function runDeterminism() {
    state.determinismRun = true;
    /* Seeded mismatch on rate_total until rate_digit_swap is fixed */
    state.determinismIdentical = !!state.fixedRules.rate_digit_swap;
    saveState();
    render();
  }

  function goLive() {
    var loads = window.GLG_buildLoads(state.fixedRules);
    var acc = computeAccuracy(loads);
    var gate = gateChecks(loads, acc);
    if (!gate.allPass) return;
    state.live = true;
    state.statusIndex = 5;
    saveState();
    render();
    setPanel("handoff");
  }

  function markHandedOff() {
    if (!state.live) return;
    state.handedOff = true;
    state.statusIndex = 6;
    saveState();
    render();
  }

  function onSignoffChange() {
    var name = $("signoff-name");
    var date = $("signoff-date");
    state.signoffName = name ? name.value : "";
    state.signoffDate = date ? date.value : "";
    saveState();
    renderGateOnly();
  }

  function renderGateOnly() {
    var loads = window.GLG_buildLoads(state.fixedRules);
    var acc = computeAccuracy(loads);
    var gate = gateChecks(loads, acc);
    var host = $("gate-body");
    if (host) host.innerHTML = renderGateHtml(gate, acc);
    bindGateHandlers();
  }

  /* ---------- Render helpers ---------- */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderStatusPipe() {
    return (
      '<div class="status-pipe" role="list" aria-label="Deployment status">' +
      STATUS_STEPS.map(function (label, i) {
        var cls = "step";
        if (i < state.statusIndex) cls += " done";
        else if (i === state.statusIndex) cls += " active";
        return '<div class="' + cls + '" role="listitem">' + esc(label) + "</div>";
      }).join("") +
      "</div>"
    );
  }

  function renderDeployment(loads, acc) {
    var d = window.GLG_SEED.deployment;
    return (
      '<div class="card">' +
      "<h2>Deployment card</h2>" +
      '<div class="grid-2">' +
      "<div><strong>Customer</strong><br>" +
      esc(d.customer) +
      '<div class="muted">' +
      esc(d.customerNote) +
      "</div></div>" +
      "<div><strong>Agent</strong><br>" +
      esc(d.agentName) +
      '<div class="muted">' +
      esc(d.agentType) +
      " · " +
      esc(d.tmsLabel) +
      "</div></div>" +
      "<div><strong>Owner (FD PM)</strong><br>" +
      esc(d.owner) +
      "</div>" +
      "<div><strong>Committed go-live</strong><br>" +
      esc(d.committedGoLive) +
      " · " +
      d.daysLeft +
      " days left</div>" +
      "</div>" +
      '<div class="stat-tiles">' +
      '<div class="stat"><div class="num">' +
      loads.length +
      '</div><div class="label">UAT loads</div></div>' +
      '<div class="stat"><div class="num">' +
      openExceptions().length +
      '</div><div class="label">Open exceptions</div></div>' +
      '<div class="stat"><div class="num">' +
      acc.criticalPct.toFixed(0) +
      '%</div><div class="label">Money + ref accuracy</div></div>' +
      "</div>" +
      "<h3>Status</h3>" +
      renderStatusPipe() +
      '<p class="muted" style="margin-top:0.85rem">Path: Spec → UAT → Exceptions → Determinism → Gate → CSM handoff</p>' +
      "</div>"
    );
  }

  function renderSpec() {
    var steps = window.GLG_SEED.workflowSteps
      .map(function (s, i) {
        return "<li><strong>" + (i + 1) + ".</strong> " + esc(s) + "</li>";
      })
      .join("");
    var rows = window.GLG_SEED.fieldMap
      .map(function (f) {
        var badges = "";
        if (f.money) badges += ' <span class="badge money">money</span>';
        if (f.critical) badges += ' <span class="badge critical">critical</span>';
        return (
          "<tr><td>" +
          esc(f.source) +
          badges +
          "</td><td>" +
          esc(f.tms) +
          "</td></tr>"
        );
      })
      .join("");
    var edges = window.GLG_SEED.edgeCases
      .map(function (e) {
        return (
          '<div class="edge-card"><strong>' +
          esc(e.name) +
          "</strong>" +
          esc(e.detail) +
          "</div>"
        );
      })
      .join("");
    var accepted =
      state.acceptedEdgeCases.length === 0
        ? ""
        : "<h3>Accepted during UAT</h3>" +
          state.acceptedEdgeCases
            .map(function (a) {
              return (
                '<div class="edge-card"><strong>' +
                esc(a.title) +
                "</strong>Note: " +
                esc(a.note) +
                "</div>"
              );
            })
            .join("");

    return (
      '<div class="card"><h2>Spec · Rate Confirmation to TMS Load Entry</h2>' +
      "<h3>Current workflow</h3>" +
      '<ol class="plain-list">' +
      steps +
      "</ol>" +
      "<h3>Field map (rate con → TMS)</h3>" +
      '<div class="table-scroll"><table class="field-map"><thead><tr><th>Source</th><th>TMS field</th></tr></thead><tbody>' +
      rows +
      "</tbody></table></div>" +
      "<h3>Named edge cases</h3>" +
      edges +
      accepted +
      "</div>"
    );
  }

  function renderUat(loads, acc) {
    var headFields = [
      "rate_total",
      "customer_ref",
      "pickup_appt",
      "linehaul",
      "accessorials_total"
    ];
    var th =
      "<th>Load</th><th>Shipper</th>" +
      headFields
        .map(function (f) {
          return "<th>" + esc(f) + "</th>";
        })
        .join("") +
      "<th>Status</th>";

    var rows = loads
      .map(function (load) {
        var cells = headFields
          .map(function (f) {
            var ok = load.agent[f] === load.expected[f];
            return (
              '<td class="' +
              (ok ? "match-yes" : "match-no") +
              '" title="Agent: ' +
              esc(load.agent[f]) +
              " | Expected: " +
              esc(load.expected[f]) +
              '">' +
              (ok ? "Match" : "Miss") +
              "</td>"
            );
          })
          .join("");
        return (
          '<tr class="' +
          (load.hasException ? "exception-row" : "") +
          '"><td>' +
          esc(load.id) +
          "</td><td>" +
          esc(load.shipper) +
          "</td>" +
          cells +
          "<td>" +
          (load.hasException ? '<span class="match-no">Exception</span>' : '<span class="match-yes">OK</span>') +
          "</td></tr>"
        );
      })
      .join("");

    var barClass =
      acc.criticalPct >= 100 && acc.otherPct >= 98 ? "pass" : "fail";

    return (
      '<div class="card"><h2>UAT run · ' +
      loads.length +
      " synthetic loads</h2>" +
      '<div class="stat-tiles">' +
      '<div class="stat"><div class="num">' +
      acc.criticalPct.toFixed(1) +
      '%</div><div class="label">Money + reference (need 100%)</div></div>' +
      '<div class="stat"><div class="num">' +
      acc.otherPct.toFixed(1) +
      '%</div><div class="label">Other fields (need at least 98%)</div></div>' +
      '<div class="stat"><div class="num">' +
      acc.loadExceptions +
      '</div><div class="label">Loads with exceptions</div></div>' +
      "</div>" +
      '<div class="acc-bar-wrap"><div class="acc-bar ' +
      barClass +
      '"><span style="width:' +
      Math.min(100, acc.criticalPct) +
      '%"></span></div>' +
      '<div class="muted" style="margin-top:0.35rem;font-size:14px">Money and reference accuracy bar</div></div>' +
      '<p class="muted">Seeded exceptions: rate off by one digit, missing customer reference, pickup appointment in the wrong time zone.</p>' +
      '<div class="table-scroll"><table class="uat-table"><thead><tr>' +
      th +
      "</tr></thead><tbody>" +
      rows +
      "</tbody></table></div>" +
      '<p style="margin-top:0.75rem"><button type="button" data-go="exceptions">Open exception queue</button></p>' +
      "</div>"
    );
  }

  function statusPill(status) {
    var map = {
      open: ["open", "Open"],
      fixed: ["fixed", "Rule fixed"],
      accepted: ["accepted", "Accepted edge case"],
      engineering: ["engineering", "Sent to engineering"]
    };
    var m = map[status] || ["open", status];
    return '<span class="pill ' + m[0] + '">' + m[1] + "</span>";
  }

  function renderExceptions() {
    var html =
      '<div class="card"><h2>Exception queue</h2>' +
      '<p class="muted">Each exception: Fix rule (re-run), Accept as customer edge case (note required), or Send to engineering (stays open, blocks gate).</p>';

    window.GLG_SEED.seededExceptions.forEach(function (meta) {
      var st = state.exceptions[meta.id] || { status: "open", note: "" };
      var cls = "exception open";
      if (st.status === "fixed" || st.status === "accepted") cls = "exception resolved";
      if (st.status === "engineering") cls = "exception sent-eng";

      var actions = "";
      if (st.status === "open" || st.status === "engineering") {
        actions =
          '<div class="actions">' +
          '<button type="button" class="success" data-fix="' +
          esc(meta.id) +
          '">Fix rule</button>' +
          '<button type="button" data-accept-show="' +
          esc(meta.id) +
          '">Accept as edge case</button>' +
          '<button type="button" class="danger" data-eng="' +
          esc(meta.id) +
          '">Send to engineering</button>' +
          "</div>" +
          '<div class="note-box" id="note-' +
          esc(meta.id) +
          '">' +
          '<label for="note-input-' +
          esc(meta.id) +
          '"><strong>Edge case note (required)</strong></label>' +
          '<textarea id="note-input-' +
          esc(meta.id) +
          '" placeholder="Why the customer accepts this as an edge case"></textarea>' +
          '<div class="row"><button type="button" class="primary" data-accept="' +
          esc(meta.id) +
          '">Save acceptance</button></div>' +
          "</div>";
      } else if (st.status === "accepted") {
        actions =
          '<p><strong>Accepted note:</strong> ' + esc(st.note) + "</p>";
      } else if (st.status === "fixed") {
        actions = "<p class=\"muted\">Rule fixed. UAT re-run applied.</p>";
      }

      html +=
        '<div class="' +
        cls +
        '">' +
        '<div class="title-row"><h3>' +
        esc(meta.title) +
        " · " +
        esc(meta.loadId) +
        "</h3>" +
        statusPill(st.status) +
        "</div>" +
        '<div class="snippet">' +
        esc(meta.sourceSnippet) +
        "</div>" +
        '<dl class="kv">' +
        "<dt>Agent value</dt><dd>" +
        esc(meta.agentValue) +
        "</dd>" +
        "<dt>Expected</dt><dd>" +
        esc(meta.expectedValue) +
        "</dd>" +
        "<dt>Business rule</dt><dd>" +
        esc(meta.businessRule) +
        "</dd>" +
        "</dl>" +
        actions +
        "</div>";
    });

    html += "</div>";
    return html;
  }

  function renderDeterminism(loads) {
    var identical = state.determinismIdentical;
    var ran = state.determinismRun;
    var mismatchLoad = window.GLG_SEED.determinismMismatchLoadId;
    var mismatchField = window.GLG_SEED.determinismMismatchField;

    var rows = "";
    loads.slice(0, 8).forEach(function (load) {
      ["rate_total", "customer_ref", "pickup_appt"].forEach(function (f) {
        var runA = load.agent[f];
        var runB = runA;
        var isMismatch =
          ran &&
          !identical &&
          load.id === mismatchLoad &&
          f === mismatchField;
        if (isMismatch) {
          runB = "$2,540.00 (digit swap still present)";
        }
        var match = !isMismatch;
        rows +=
          '<tr class="' +
          (match ? "" : "mismatch") +
          '"><td>' +
          esc(load.id) +
          "</td><td>" +
          esc(f) +
          "</td><td>" +
          esc(runA) +
          "</td><td>" +
          esc(runB) +
          '</td><td class="' +
          (match ? "match-yes" : "match-no") +
          '">' +
          (match ? "Same" : "Different") +
          "</td></tr>";
      });
    });

    var summary = !ran
      ? '<p class="muted">Press Run again to compare run A and run B on the same UAT set.</p>'
      : identical
        ? '<p class="match-yes"><strong>Identical.</strong> Same answer every time, field by field.</p>'
        : '<p class="match-no"><strong>Mismatch.</strong> ' +
          esc(mismatchLoad) +
          " · " +
          esc(mismatchField) +
          " differs until the rate digit-swap rule is fixed.</p>";

    return (
      '<div class="card"><h2>Determinism check</h2>' +
      "<p>Same UAT set, second pass. The agent must give the same answer every time.</p>" +
      '<p><button type="button" class="primary" id="btn-determinism">Run again</button></p>' +
      summary +
      (ran
        ? '<div class="table-scroll"><table class="diff-table"><thead><tr><th>Load</th><th>Field</th><th>Run A</th><th>Run B</th><th>Result</th></tr></thead><tbody>' +
          rows +
          "</tbody></table></div>"
        : "") +
      "</div>"
    );
  }

  function renderGateHtml(gate) {
    var checks = gate.checks
      .map(function (c) {
        return (
          '<div class="gate-check">' +
          '<div class="gate-icon ' +
          (c.pass ? "pass" : "fail") +
          '">' +
          (c.pass ? "OK" : "No") +
          "</div>" +
          '<div class="gate-body"><div class="name">' +
          esc(c.name) +
          '</div><div class="reason ' +
          (c.pass ? "pass" : "fail") +
          '">' +
          esc(c.reason) +
          "</div></div></div>"
        );
      })
      .join("");

    var lock = gate.allPass
      ? '<div class="gate-lock-msg open">All five checks pass. Go Live is unlocked.</div>'
      : '<div class="gate-lock-msg">Go Live is locked. ' +
        esc(gate.lockReasons.join(" ")) +
        "</div>";

    return (
      "<h2>Go-Live Gate</h2>" +
      "<p>The agent may go live only when all five checks pass. If any check fails, Go Live stays locked and the reason is visible.</p>" +
      checks +
      '<div class="signoff">' +
      '<label>Customer UAT signoff name<input type="text" id="signoff-name" value="' +
      esc(state.signoffName) +
      '" placeholder="e.g. Jordan Lee, Ops Manager" autocomplete="name"></label>' +
      '<label>Signoff date<input type="date" id="signoff-date" value="' +
      esc(state.signoffDate) +
      '"></label>' +
      "</div>" +
      lock +
      '<p><button type="button" class="primary" id="btn-golive" ' +
      (gate.allPass && !state.live ? "" : "disabled") +
      ">" +
      (state.live ? "Already live" : "Go Live") +
      "</button></p>" +
      (state.live
        ? '<p class="match-yes"><strong>Live.</strong> Status moved to Live. Open the CSM handoff packet.</p>'
        : "")
    );
  }

  function renderGate(gate) {
    return '<div class="card" id="gate-body">' + renderGateHtml(gate) + "</div>";
  }

  function renderHandoff(acc) {
    var d = window.GLG_SEED.deployment;
    if (!state.live) {
      return (
        '<div class="card"><h2>CSM handoff packet</h2>' +
        '<p class="empty-state">Handoff unlocks after Go Live. Clear the gate first.</p></div>'
      );
    }

    var rules =
      state.rulesAdded.length === 0
        ? "<li>None added this UAT cycle</li>"
        : state.rulesAdded
            .map(function (r) {
              return "<li>" + esc(r) + "</li>";
            })
            .join("");
    var edges =
      state.acceptedEdgeCases.length === 0
        ? "<li>None</li>"
        : state.acceptedEdgeCases
            .map(function (a) {
              return "<li><strong>" + esc(a.title) + ":</strong> " + esc(a.note) + "</li>";
            })
            .join("");
    var watch = window.GLG_SEED.watchList
      .map(function (w) {
        return "<li>" + esc(w) + "</li>";
      })
      .join("");

    return (
      '<div class="card"><h2>CSM handoff packet</h2>' +
      '<div class="handoff-block"><h3>Accuracy at handoff</h3>' +
      "<p>Money and reference fields: <strong>" +
      acc.criticalPct.toFixed(1) +
      "%</strong>. Other fields: <strong>" +
      acc.otherPct.toFixed(1) +
      "%</strong>. Determinism: identical.</p></div>" +
      '<div class="handoff-block"><h3>Rules added during UAT</h3><ul class="plain-list">' +
      rules +
      "</ul></div>" +
      '<div class="handoff-block"><h3>Accepted edge cases</h3><ul class="plain-list">' +
      edges +
      "</ul></div>" +
      '<div class="handoff-block"><h3>On-call contact</h3><p>' +
      esc(d.onCall) +
      "</p></div>" +
      '<div class="handoff-block"><h3>First 30-day watch list</h3><ul class="plain-list">' +
      watch +
      "</ul></div>" +
      '<p><button type="button" class="primary" id="btn-handoff" ' +
      (state.handedOff ? "disabled" : "") +
      ">" +
      (state.handedOff ? "Handed off" : "Mark handed off") +
      "</button></p>" +
      (state.handedOff
        ? '<p class="match-yes"><strong>Handed off.</strong> Account is with CSM. FD PM stays on call.</p>'
        : "") +
      "</div>"
    );
  }

  function bindGateHandlers() {
    var name = $("signoff-name");
    var date = $("signoff-date");
    if (name) {
      name.addEventListener("change", onSignoffChange);
      name.addEventListener("input", function () {
        state.signoffName = name.value;
      });
      name.addEventListener("blur", onSignoffChange);
    }
    if (date) {
      date.addEventListener("change", onSignoffChange);
    }
    var btn = $("btn-golive");
    if (btn) btn.addEventListener("click", goLive);
  }

  function bindPanelHandlers() {
    document.querySelectorAll("[data-go]").forEach(function (el) {
      el.addEventListener("click", function () {
        setPanel(el.getAttribute("data-go"));
      });
    });
    document.querySelectorAll("[data-fix]").forEach(function (el) {
      el.addEventListener("click", function () {
        fixRule(el.getAttribute("data-fix"));
      });
    });
    document.querySelectorAll("[data-accept-show]").forEach(function (el) {
      el.addEventListener("click", function () {
        showAcceptNote(el.getAttribute("data-accept-show"));
      });
    });
    document.querySelectorAll("[data-accept]").forEach(function (el) {
      el.addEventListener("click", function () {
        acceptEdgeCase(el.getAttribute("data-accept"));
      });
    });
    document.querySelectorAll("[data-eng]").forEach(function (el) {
      el.addEventListener("click", function () {
        sendToEngineering(el.getAttribute("data-eng"));
      });
    });
    var det = $("btn-determinism");
    if (det) det.addEventListener("click", runDeterminism);
    var hand = $("btn-handoff");
    if (hand) hand.addEventListener("click", markHandedOff);
    bindGateHandlers();
  }

  function render() {
    var loads = window.GLG_buildLoads(state.fixedRules);
    var acc = computeAccuracy(loads);
    var gate = gateChecks(loads, acc);
    syncStatusFromState(gate);
    saveState();

    /* Nav */
    document.querySelectorAll(".nav-steps button").forEach(function (btn) {
      var p = btn.getAttribute("data-panel");
      btn.classList.toggle("active", p === state.panel);
      var done = false;
      if (p === "deployment") done = true;
      if (p === "spec") done = state.statusIndex >= 1;
      if (p === "uat") done = openExceptions().length < 3;
      if (p === "exceptions") done = openExceptions().length === 0;
      if (p === "determinism") done = state.determinismIdentical;
      if (p === "gate") done = state.live;
      if (p === "handoff") done = state.handedOff;
      btn.classList.toggle("done", done && p !== state.panel);
    });

    var panels = {
      deployment: renderDeployment(loads, acc),
      spec: renderSpec(),
      uat: renderUat(loads, acc),
      exceptions: renderExceptions(),
      determinism: renderDeterminism(loads),
      gate: renderGate(gate),
      handoff: renderHandoff(acc)
    };

    Object.keys(panels).forEach(function (key) {
      var el = $("panel-" + key);
      if (!el) return;
      el.innerHTML = panels[key];
      el.classList.toggle("active", key === state.panel);
    });

    bindPanelHandlers();
  }

  function init() {
    document.querySelectorAll(".nav-steps button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setPanel(btn.getAttribute("data-panel"));
      });
    });
    var reset = $("btn-reset");
    if (reset) reset.addEventListener("click", resetDemo);
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
