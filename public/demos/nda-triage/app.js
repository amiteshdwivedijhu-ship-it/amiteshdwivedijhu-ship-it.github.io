/* NDA Triage – static replay demo. Dependency-free; reads the embedded
 * recorded output and changes only the deterministic playbook cell. */

(function () {
  "use strict";

  var CLAUSE_LABELS = {
    mutuality: "Mutuality",
    term_survival: "Term & survival",
    confidentiality_definition: "Confidentiality definition",
    non_compete_solicit: "Non-compete / non-solicit",
    ip_assignment: "IP assignment",
    governing_law: "Governing law",
  };
  var CLAUSE_ORDER = [
    "mutuality",
    "term_survival",
    "confidentiality_definition",
    "non_compete_solicit",
    "ip_assignment",
    "governing_law",
  ];
  var CONTROL_CONFIG = {
    our_role: {
      label: "Our role",
      query: "role",
      help: "Changes how one-way duties and protections are evaluated.",
    },
    data_class: {
      label: "Data class",
      query: "data",
      help: "Higher-sensitivity information raises the playbook bar.",
    },
    counterparty_type: {
      label: "Counterparty",
      query: "counterparty",
      help: "Competitors are never eligible for autonomous approval.",
    },
    leverage: {
      label: "Bargaining power",
      query: "leverage",
      help: "Changes the route and plan, but never changes clause tiers.",
    },
  };
  var CONTROL_ORDER = ["our_role", "data_class", "counterparty_type", "leverage"];
  var ROUTING_LABELS = {
    auto_approve: "Auto-approve",
    flag: "Flag for review",
    escalate: "Escalate to counsel",
  };
  var ROUTING_ICONS = { auto_approve: "✓", flag: "!", escalate: "↑" };

  var manifest = window.NDA_MANIFEST;
  var docs = {};
  manifest.documents.forEach(function (entry) {
    docs[entry.id] = window["NDA_DOC_" + entry.id];
  });

  var defaultDocId = manifest.documents[0].id;
  var state = {
    docId: defaultDocId,
    our_role: null,
    data_class: null,
    counterparty_type: null,
    leverage: null,
  };
  var previousSnapshot = null;
  var comparisonSnapshot = null;

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function humanValue(value) {
    return String(value)
      .split("_")
      .map(function (part) { return part.charAt(0).toUpperCase() + part.slice(1); })
      .join(" ");
  }

  function doc() {
    return docs[state.docId];
  }

  function manifestEntry() {
    return manifest.documents.find(function (entry) { return entry.id === state.docId; });
  }

  function contextKey(source) {
    source = source || state;
    return [source.our_role, source.data_class, source.counterparty_type, source.leverage].join("|");
  }

  function tierKey(source) {
    source = source || state;
    return [source.our_role, source.data_class, source.counterparty_type].join("|");
  }

  function outcomeFor(d, source) {
    var index = d.replay.cells[contextKey(source)];
    return typeof index === "number" ? d.replay.outcomes[index] : null;
  }

  function currentOutcome() {
    return outcomeFor(doc(), state);
  }

  function tierMap(outcome) {
    var map = {};
    (outcome ? outcome.tiers : []).forEach(function (tier) {
      map[tier.clause_type] = tier.tier;
    });
    return map;
  }

  function planLabel(plan) {
    var mustFix = plan.must_fix.map(function (item) { return CLAUSE_LABELS[item]; });
    var concede = plan.concede.map(function (item) { return CLAUSE_LABELS[item]; });
    var parts = [];
    parts.push(mustFix.length ? "Must fix: " + mustFix.join(", ") : "No must-fix clauses");
    parts.push(concede.length ? "Concede: " + concede.join(", ") : "No concessions");
    if (plan.priority_fight) parts.push("Priority fight: " + CLAUSE_LABELS[plan.priority_fight]);
    return parts.join(" · ");
  }

  function takeSnapshot() {
    var outcome = currentOutcome();
    return {
      docId: state.docId,
      our_role: state.our_role,
      data_class: state.data_class,
      counterparty_type: state.counterparty_type,
      leverage: state.leverage,
      routing: outcome.routing_decision,
      tiers: tierMap(outcome),
      plan: {
        must_fix: outcome.plan.must_fix.slice(),
        concede: outcome.plan.concede.slice(),
        priority_fight: outcome.plan.priority_fight,
      },
    };
  }

  function validValue(d, field, value) {
    return d.contexts[field].indexOf(value) !== -1;
  }

  function loadStateFromQuery() {
    var params = new URLSearchParams(window.location.search);
    var requestedDoc = params.get("nda");
    if (requestedDoc && docs[requestedDoc]) state.docId = requestedDoc;
    var d = doc();
    CONTROL_ORDER.forEach(function (field) {
      var requested = params.get(CONTROL_CONFIG[field].query);
      state[field] = requested && validValue(d, field, requested) ? requested : d.contexts[field][0];
    });
  }

  function syncQuery() {
    var params = new URLSearchParams();
    params.set("nda", state.docId);
    CONTROL_ORDER.forEach(function (field) {
      params.set(CONTROL_CONFIG[field].query, state[field]);
    });
    var next = window.location.pathname + "?" + params.toString() + window.location.hash;
    window.history.replaceState(null, "", next);
  }

  function routeBadge(decision, small) {
    return '<span class="route-badge ' + decision + (small ? " small" : "") + '">' +
      '<span aria-hidden="true">' + ROUTING_ICONS[decision] + "</span> " + ROUTING_LABELS[decision] + "</span>";
  }

  /* ---------- Document picker ---------- */

  function renderDocumentContext() {
    var entry = manifestEntry();
    var host = document.getElementById("document-context");
    var features = (entry.features || []).map(function (feature) {
      return '<span class="document-feature">' + esc(feature) + "</span>";
    }).join("");
    host.innerHTML =
      '<div class="document-context-main">' +
        '<p class="eyebrow">Selected source document · ContractNLI dev split</p>' +
        '<h2 id="document-context-title">NDA ' + esc(entry.id) + ' · ' + esc(entry.title || entry.agreement_type) + "</h2>" +
        '<p class="document-type">' + esc(entry.agreement_type) + "</p>" +
        '<p class="document-overview">' + esc(entry.overview || entry.descriptor) + "</p>" +
        '<div class="document-features" aria-label="Document characteristics">' + features + "</div>" +
      "</div>" +
      '<aside class="why-selected"><span class="eyebrow">Why it is in the demo</span><p>' + esc(entry.why_selected || entry.descriptor) + "</p></aside>";
  }

  function renderDocList() {
    var ul = document.getElementById("doc-list");
    ul.innerHTML = "";
    manifest.documents.forEach(function (entry) {
      var d = docs[entry.id];
      var outcome = outcomeFor(d, state);
      var li = document.createElement("li");
      var btn = document.createElement("button");
      var selected = entry.id === state.docId;
      btn.type = "button";
      btn.className = "doc-btn" + (selected ? " active" : "");
      if (selected) btn.setAttribute("aria-current", "true");
      btn.innerHTML =
        '<span class="doc-topline"><span class="doc-title">NDA ' + esc(entry.id) + "</span>" +
        (outcome ? routeBadge(outcome.routing_decision, true) : "") + "</span>" +
        '<span class="doc-name">' + esc(entry.title || entry.agreement_type) + "</span>" +
        '<span class="doc-desc">' + esc(entry.descriptor) + "</span>" +
        (selected ? '<span class="selected-label"><span aria-hidden="true">✓</span> Selected</span>' : "");
      btn.addEventListener("click", function () {
        if (entry.id === state.docId) return;
        state.docId = entry.id;
        comparisonSnapshot = null;
        previousSnapshot = null;
        ensureContextValues();
        updateControlValues();
        syncQuery();
        renderAll();
        showDocumentChange();
      });
      li.appendChild(btn);
      ul.appendChild(li);
    });
  }

  function ensureContextValues() {
    var d = doc();
    CONTROL_ORDER.forEach(function (field) {
      if (!validValue(d, field, state[field])) state[field] = d.contexts[field][0];
    });
  }

  /* ---------- Deal Context controls ---------- */

  function renderControls() {
    var host = document.getElementById("controls");
    var contexts = doc().contexts;
    host.innerHTML = "";
    CONTROL_ORDER.forEach(function (field) {
      var config = CONTROL_CONFIG[field];
      var wrapper = document.createElement("div");
      wrapper.className = "control";
      var label = document.createElement("label");
      label.setAttribute("for", "ctl-" + field);
      label.textContent = config.label;
      var select = document.createElement("select");
      select.id = "ctl-" + field;
      select.name = field;
      select.setAttribute("aria-describedby", "help-" + field);
      contexts[field].forEach(function (value) {
        var option = document.createElement("option");
        option.value = value;
        option.textContent = humanValue(value);
        select.appendChild(option);
      });
      select.value = state[field];
      select.addEventListener("change", function () {
        previousSnapshot = takeSnapshot();
        state[field] = select.value;
        syncQuery();
        renderAll();
        renderChangeSummary(field);
      });
      var help = document.createElement("span");
      help.className = "control-help";
      help.id = "help-" + field;
      help.innerHTML = esc(config.help) + ' <span class="control-code">Data field: <code>' + esc(field) + "</code></span>";
      wrapper.appendChild(label);
      wrapper.appendChild(select);
      wrapper.appendChild(help);
      host.appendChild(wrapper);
    });
  }

  function updateControlValues() {
    CONTROL_ORDER.forEach(function (field) {
      var control = document.getElementById("ctl-" + field);
      if (control) control.value = state[field];
    });
  }

  /* ---------- Routing decision ---------- */

  function routingExplanation(outcome, d) {
    var reasons = [];
    if (!outcome.autonomy_eligible) {
      var exclusions = [];
      if (state.data_class === "source_code") exclusions.push("the data is source code");
      if (state.counterparty_type === "competitor") exclusions.push("the counterparty is a competitor");
      reasons.push("This cell is not eligible for autonomous approval because " + exclusions.join(" and ") + ".");
    }
    var unacceptable = outcome.tiers.filter(function (tier) { return tier.tier === "unacceptable"; });
    if (unacceptable.length && outcome.routing_decision === "escalate") {
      reasons.push(unacceptable.length + " unacceptable clause tier" + (unacceptable.length > 1 ? "s" : "") + " with low bargaining power requires counsel to make the walk-away call.");
    } else if (unacceptable.length) {
      reasons.push(unacceptable.length + " unacceptable clause tier" + (unacceptable.length > 1 ? "s" : "") + " must be corrected in negotiation.");
    }
    if (outcome.routing_decision === "flag" && !unacceptable.length) {
      var blockers = [];
      if (outcome.tiers.some(function (tier) { return tier.tier === "negotiable"; })) blockers.push("negotiable clause tiers");
      if (d.absence_findings.length) blockers.push(d.absence_findings.length + " absence finding" + (d.absence_findings.length > 1 ? "s" : ""));
      if (d.unmodeled_risks.length) blockers.push(d.unmodeled_risks.length + " unmodeled risk" + (d.unmodeled_risks.length > 1 ? "s" : ""));
      if (!d.spans_verified) blockers.push("unverified source spans");
      if (d.termination_state !== "exhaustive") blockers.push("a " + humanValue(d.termination_state).toLowerCase() + " search termination state");
      if (!outcome.autonomy_eligible) blockers.push("an autonomy-ineligible context");
      if (blockers.length) reasons.push("Auto-approval is blocked by " + blockers.join(", ") + ".");
    }
    return reasons.join(" ");
  }

  function renderRouting() {
    var outcome = currentOutcome();
    var banner = document.getElementById("routing-banner");
    var changed = previousSnapshot && previousSnapshot.routing !== outcome.routing_decision;
    banner.className = "banner " + outcome.routing_decision + (changed ? " value-changed" : "");
    banner.innerHTML =
      '<span class="banner-label">Routing decision</span>' +
      '<span class="banner-value"><span aria-hidden="true">' + ROUTING_ICONS[outcome.routing_decision] + "</span> " +
      ROUTING_LABELS[outcome.routing_decision] + "</span>";
    document.getElementById("routing-why").textContent = routingExplanation(outcome, doc());
  }

  /* ---------- Change summary ---------- */

  function arraysEqual(a, b) {
    return a.length === b.length && a.every(function (item, index) { return item === b[index]; });
  }

  function plansEqual(a, b) {
    return arraysEqual(a.must_fix, b.must_fix) && arraysEqual(a.concede, b.concede) && a.priority_fight === b.priority_fight;
  }

  function tierChanges(before, after) {
    var changes = [];
    CLAUSE_ORDER.forEach(function (clause) {
      var oldTier = before.tiers[clause] || "no clause";
      var newTier = after.tiers[clause] || "no clause";
      if (oldTier !== newTier) changes.push(CLAUSE_LABELS[clause] + ": " + humanValue(oldTier) + " → " + humanValue(newTier));
    });
    return changes;
  }

  function renderChangeSummary(field) {
    var host = document.getElementById("change-summary");
    if (!previousSnapshot) {
      host.hidden = true;
      return;
    }
    var after = takeSnapshot();
    var changes = tierChanges(previousSnapshot, after);
    if (previousSnapshot.routing !== after.routing) {
      changes.unshift("Route: " + ROUTING_LABELS[previousSnapshot.routing] + " → " + ROUTING_LABELS[after.routing]);
    }
    if (!plansEqual(previousSnapshot.plan, after.plan)) {
      changes.push("Negotiation plan: " + planLabel(previousSnapshot.plan) + " → " + planLabel(after.plan));
    }
    host.hidden = false;
    host.innerHTML = '<strong>What changed after ' + esc(CONTROL_CONFIG[field].label.toLowerCase()) + '?</strong>' +
      (changes.length
        ? "<ul>" + changes.map(function (change) { return "<li>" + esc(change) + "</li>"; }).join("") + "</ul>"
        : "<p>The playbook result did not change. Extracted findings remain held constant.</p>");
  }

  function showDocumentChange() {
    var host = document.getElementById("change-summary");
    host.hidden = false;
    host.innerHTML = "<strong>NDA changed.</strong><p>The recorded extraction, routing result, and invariant findings were reloaded for NDA " + esc(state.docId) + ".</p>";
  }

  /* ---------- Clause tiers ---------- */

  function attrSummary(clause) {
    if (!clause) return "Not extracted";
    var attributes = clause.attributes || {};
    switch (clause.clause_type) {
      case "mutuality":
        return "Direction: " + humanValue(attributes.direction);
      case "term_survival":
        return "Term: " + (attributes.term_years === null ? "none stated" : attributes.term_years + " years") + "; perpetual scope: " + humanValue(attributes.perpetual_scope);
      case "confidentiality_definition":
        return (attributes.carveouts || []).length + " of 4 carve-outs" + (attributes.oral_disclosure_covered ? "; oral disclosures covered" : "");
      case "non_compete_solicit":
        if (!attributes.present) return "No rider present";
        return humanValue(attributes.kind) + "; " + (attributes.duration_months === null ? "unbounded" : attributes.duration_months + " months") + "; " + (attributes.mutual ? "mutual" : "one-way");
      case "ip_assignment":
        return attributes.present ? "Present" : "Absent";
      case "governing_law":
        return "Jurisdiction: " + attributes.jurisdiction + (attributes.us_jurisdiction ? " (US)" : " (non-US)");
      default:
        return "";
    }
  }

  function renderTiers() {
    var d = doc();
    var tiers = d.tiers_by_context[tierKey()];
    var tbody = document.getElementById("tier-rows");
    tbody.innerHTML = "";
    CLAUSE_ORDER.forEach(function (clauseType) {
      var tier = tiers[clauseType];
      var clause = d.clauses.find(function (item) { return item.clause_type === clauseType; }) || null;
      var priorTier = previousSnapshot ? previousSnapshot.tiers[clauseType] : null;
      var changed = previousSnapshot && previousSnapshot.docId === state.docId && priorTier !== (tier ? tier.tier : undefined);
      var row = document.createElement("tr");
      if (changed) row.className = "value-changed";
      row.innerHTML =
        "<td><strong>" + CLAUSE_LABELS[clauseType] + "</strong>" +
        '<div class="attr">' + esc(attrSummary(clause)) + "</div>" +
        (clause && clause.span ? '<details class="span"><summary>View source span</summary><blockquote>' + esc(clause.span) + "</blockquote></details>" : "") +
        "</td>" +
        "<td>" + (tier ? '<span class="chip ' + tier.tier + '">' + humanValue(tier.tier) + "</span>" : '<span class="chip none">No clause</span>') + "</td>" +
        '<td class="rule">' + (tier ? esc(tier.rule_id) : "—") + "</td>";
      tbody.appendChild(row);
    });
  }

  /* ---------- Negotiation plan ---------- */

  function clauseList(items, emptyText) {
    if (!items.length) return '<p class="empty">' + esc(emptyText) + "</p>";
    return "<ul>" + items.map(function (item) { return "<li>" + CLAUSE_LABELS[item] + "</li>"; }).join("") + "</ul>";
  }

  function renderPlan() {
    var plan = currentOutcome().plan;
    var changed = previousSnapshot && previousSnapshot.docId === state.docId && !plansEqual(previousSnapshot.plan, plan);
    var host = document.getElementById("plan-body");
    host.className = changed ? "value-changed" : "";
    var html = '<div class="plan-block"><h4>Must fix</h4>' + clauseList(plan.must_fix, "Nothing must be fixed in this cell.") + "</div>";
    html += '<div class="plan-block"><h4>Concede</h4>' + clauseList(plan.concede, state.leverage === "low" ? "No negotiable deviations to concede." : "Nothing conceded at this level of bargaining power.") + "</div>";
    if (plan.priority_fight) {
      html += '<p class="priority"><strong>Priority fight</strong><br>' + CLAUSE_LABELS[plan.priority_fight] + " is the one concession worth spending capital on.</p>";
    }
    host.innerHTML = html;
  }

  /* ---------- Findings held constant ---------- */

  function renderFindings() {
    var d = doc();
    document.getElementById("absence-count").textContent = d.absence_findings.length ? "(" + d.absence_findings.length + ")" : "(none)";
    var absence = document.getElementById("absence-body");
    if (!d.absence_findings.length) {
      absence.innerHTML = '<p class="empty">The Absence Detector found nothing conspicuously missing. Search termination: ' + esc(humanValue(d.termination_state)) + ".</p>";
    } else {
      absence.innerHTML = "<ul>" + d.absence_findings.map(function (finding) {
        var subject = finding.clause_type ? "Clause type: " + (CLAUSE_LABELS[finding.clause_type] || humanValue(finding.clause_type)) : "Carve-out: " + humanValue(finding.carveout);
        return "<li><strong>" + esc(subject) + '</strong><br><span class="muted">' + esc(finding.note) + "</span></li>";
      }).join("") + "</ul>" + '<p class="note">Search termination: ' + esc(humanValue(d.termination_state)) + ".</p>";
    }

    document.getElementById("risk-count").textContent = d.unmodeled_risks.length ? "(" + d.unmodeled_risks.length + ")" : "(none)";
    var risks = document.getElementById("risk-body");
    if (!d.unmodeled_risks.length) {
      risks.innerHTML = '<p class="empty">The shadow judge identified no risk outside the playbook.</p>';
    } else {
      risks.innerHTML = "<ul>" + d.unmodeled_risks.map(function (risk) {
        return "<li>" + esc(risk.concern) + '<details class="span"><summary>View source span</summary><blockquote>' + esc(risk.span.text) + "</blockquote></details></li>";
      }).join("") + "</ul>" + '<p class="note">The shadow judge surfaces concerns outside the playbook. A non-silent judge blocks auto-approval but never overrides the route.</p>';
    }
  }

  /* ---------- Compare contexts ---------- */

  function contextSummary(snapshot) {
    return CONTROL_ORDER.map(function (field) {
      return '<span><strong>' + esc(CONTROL_CONFIG[field].label) + ":</strong> " + esc(humanValue(snapshot[field])) + "</span>";
    }).join("");
  }

  function renderComparison() {
    var host = document.getElementById("comparison");
    var clear = document.getElementById("clear-compare");
    if (!comparisonSnapshot) {
      host.hidden = true;
      clear.hidden = true;
      return;
    }
    clear.hidden = false;
    host.hidden = false;
    var current = takeSnapshot();
    var changes = tierChanges(comparisonSnapshot, current);
    var routeChanged = comparisonSnapshot.routing !== current.routing;
    var planChanged = !plansEqual(comparisonSnapshot.plan, current.plan);
    host.innerHTML =
      '<div class="comparison-heading"><div><p class="eyebrow">Compare contexts</p><h3>Saved A vs current B</h3></div>' +
      '<span class="comparison-result">' + (routeChanged || planChanged || changes.length ? "Outcomes differ" : "Same outcome") + "</span></div>" +
      '<div class="compare-grid">' +
      '<section><h4>Context A · saved</h4><div class="context-summary">' + contextSummary(comparisonSnapshot) + "</div>" + routeBadge(comparisonSnapshot.routing) + '<p class="compare-plan">' + esc(planLabel(comparisonSnapshot.plan)) + "</p></section>" +
      '<section><h4>Context B · current</h4><div class="context-summary">' + contextSummary(current) + "</div>" + routeBadge(current.routing) + '<p class="compare-plan">' + esc(planLabel(current.plan)) + "</p></section>" +
      "</div>" +
      '<div class="compare-deltas"><strong>Differences</strong>' +
      (routeChanged || planChanged || changes.length
        ? "<ul>" +
          (routeChanged ? "<li>Route: " + esc(ROUTING_LABELS[comparisonSnapshot.routing]) + " → " + esc(ROUTING_LABELS[current.routing]) + "</li>" : "") +
          changes.map(function (change) { return "<li>" + esc(change) + "</li>"; }).join("") +
          (planChanged ? "<li>Negotiation plan changed.</li>" : "") + "</ul>"
        : "<p>Change an intake control to compare this saved cell with another.</p>") + "</div>";
  }

  /* ---------- Aggregate ---------- */

  function renderAcross() {
    var d = doc();
    var summary = d.replay.summary;
    var counts = { auto_approve: 0, flag: 0, escalate: 0 };
    var escalateCells = [];
    Object.keys(d.replay.cells).forEach(function (key) {
      var outcome = d.replay.outcomes[d.replay.cells[key]];
      counts[outcome.routing_decision] += 1;
      if (outcome.routing_decision === "escalate") escalateCells.push(key);
    });
    var percent = Math.round(summary.auto_approve_rate * 100);
    var html = '<div class="stats">' +
      "<div><strong>" + counts.auto_approve + "</strong><span>Auto-approve</span></div>" +
      "<div><strong>" + counts.flag + "</strong><span>Flag</span></div>" +
      "<div><strong>" + counts.escalate + "</strong><span>Escalate</span></div>" +
      "<div><strong>" + summary.n_distinct_outcomes + "</strong><span>Distinct outcomes</span></div>" +
      "<div><strong>" + summary.n_distinct_plans + "</strong><span>Distinct plans</span></div>" +
      "</div>";
    html += "<p>Auto-approve rate: <strong>" + percent + "%</strong> of " + summary.eligible_cells + " autonomy-eligible cells (" + summary.auto_approve_cells + " of " + summary.eligible_cells + "). ";
    if (summary.eligible_cells < 144) html += (144 - summary.eligible_cells) + " cells contain source code or a competitor and are not eligible for autonomous approval.";
    html += "</p>";
    if (escalateCells.length) {
      html += '<details class="cell-list"><summary>View ' + escalateCells.length + ' escalating cells</summary><ul class="cells">' + escalateCells.map(function (key) {
        return "<li><code>" + esc(key.split("|").map(humanValue).join(" · ")) + "</code></li>";
      }).join("") + "</ul></details>";
    } else {
      html += "<p>No cell escalates for this NDA.</p>";
    }
    document.getElementById("across-body").innerHTML = html;
  }

  /* ---------- Actions ---------- */

  function copyCurrentLink() {
    syncQuery();
    var value = window.location.href;
    var status = document.getElementById("copy-status");
    function succeed() {
      var button = document.getElementById("copy-link");
      button.textContent = "Link copied";
      status.textContent = "Shareable link copied to clipboard.";
      window.setTimeout(function () { button.textContent = "Copy link"; }, 1800);
    }
    function fallback() {
      var input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand("copy");
        succeed();
      } catch (error) {
        status.textContent = "Copy failed. Use the browser address bar to copy this URL.";
      }
      document.body.removeChild(input);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(succeed, fallback);
    } else {
      fallback();
    }
  }

  function resetState() {
    state.docId = defaultDocId;
    var d = doc();
    CONTROL_ORDER.forEach(function (field) { state[field] = d.contexts[field][0]; });
    previousSnapshot = null;
    comparisonSnapshot = null;
    updateControlValues();
    syncQuery();
    renderAll();
    var host = document.getElementById("change-summary");
    host.hidden = false;
    host.innerHTML = "<strong>Demo reset.</strong><p>Showing the first recorded NDA and the default intake context.</p>";
  }

  function bindActions() {
    document.getElementById("copy-link").addEventListener("click", copyCurrentLink);
    document.getElementById("reset-state").addEventListener("click", resetState);
    document.getElementById("save-compare").addEventListener("click", function () {
      comparisonSnapshot = takeSnapshot();
      renderComparison();
      document.getElementById("clear-compare").focus();
    });
    document.getElementById("clear-compare").addEventListener("click", function () {
      comparisonSnapshot = null;
      renderComparison();
      document.getElementById("save-compare").focus();
    });
  }

  function renderAll() {
    renderDocList();
    renderDocumentContext();
    renderRouting();
    renderTiers();
    renderPlan();
    renderFindings();
    renderComparison();
    renderAcross();
  }

  loadStateFromQuery();
  renderControls();
  bindActions();
  syncQuery();
  renderAll();
})();
