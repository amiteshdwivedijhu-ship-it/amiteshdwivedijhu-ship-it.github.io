(function () {
  const DATA = window.NAVAN_DATA;
  const KEY = "navan-audit-gate-v1";
  const SCREENS = [
    ["policy", "Policy"],
    ["queue", "Queue"],
    ["flag", "Flag"],
    ["gates", "Gates"],
    ["evals", "Evals"],
    ["change", "Change check"],
    ["phone", "Phone"],
    ["audit", "Audit log"]
  ];

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  function money(n) {
    return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function pct1(n) {
    return (n * 100).toFixed(1) + "%";
  }

  function conf(n) {
    return Number(n).toFixed(2);
  }

  function per30(n) {
    const v = Math.round((n / 3) * 10) / 10;
    return String(v);
  }

  function stamp() {
    const d = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let h = d.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    const min = String(d.getMinutes()).padStart(2, "0");
    return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear() + ", " + h + ":" + min + " " + ampm;
  }

  function ruleById(id) {
    return DATA.rules.find((r) => r.id === id) || null;
  }

  function policyById(id) {
    return DATA.policy.find((p) => p.id === id) || null;
  }

  function quoteFor(tx) {
    const policy = policyById(tx.ruleId);
    if (policy) return policy.text;
    const rule = ruleById(tx.ruleId);
    return rule && rule.text ? rule.text : "";
  }

  function txById(id) {
    return DATA.transactions.find((t) => t.id === id);
  }

  function seed() {
    const preview = {};
    DATA.rules.forEach((r) => { preview[r.id] = r.threshold; });
    return {
      screen: "queue",
      txId: "T-1001",
      ruleFilter: "All",
      verdictFilter: "All",
      gateRule: "P-4.3",
      preview: preview,
      savedThreshold: {},
      overrides: [],
      agreed: {},
      changeId: "C-13",
      runs: {},
      signoff: null,
      signError: "",
      overrideError: "",
      thresholdError: "",
      phone: { accepted: false, noteOpen: false, note: "", questionOpen: false, question: "" },
      log: DATA.seedLog.map((row) => Object.assign({}, row))
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seed();
      const saved = JSON.parse(raw);
      const base = seed();
      if (!saved || typeof saved !== "object") return base;
      ["screen", "txId", "ruleFilter", "verdictFilter", "gateRule", "changeId", "signError", "overrideError", "thresholdError"].forEach((k) => {
        if (saved[k]) base[k] = saved[k];
      });
      base.preview = Object.assign(base.preview, saved.preview || {});
      base.savedThreshold = saved.savedThreshold || {};
      base.overrides = Array.isArray(saved.overrides) ? saved.overrides : [];
      base.agreed = saved.agreed || {};
      base.runs = saved.runs || {};
      base.signoff = saved.signoff || null;
      base.phone = Object.assign(base.phone, saved.phone || {});
      base.log = Array.isArray(saved.log) && saved.log.length ? saved.log : base.log;
      return base;
    } catch (err) {
      return seed();
    }
  }

  let state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (err) { /* storage can be blocked */ }
  }

  function log(actor, line, text) {
    state.log.unshift({ at: stamp(), actor: actor, line: line || "none", text: text });
  }

  function activeThreshold(rule) {
    if (state.savedThreshold[rule.id] != null) return Number(state.savedThreshold[rule.id]);
    return rule.threshold;
  }

  function tablePrecision(rule) {
    if (!rule || rule.humanOnly || !rule.reviewed) return null;
    return rule.agreed / rule.reviewed;
  }

  function bandStats(rule, threshold) {
    const bands = (rule.bands || []).filter((b) => b.min >= threshold - 0.0001);
    const reviewed = bands.reduce((s, b) => s + b.reviewed, 0);
    const agreed = bands.reduce((s, b) => s + b.agreed, 0);
    return {
      bands: bands,
      reviewed: reviewed,
      agreed: agreed,
      precision: reviewed ? agreed / reviewed : 0
    };
  }

  function liveVerdict(rule, threshold) {
    if (!rule) return { label: "Needs review", pass: false, reason: "Missing rule." };
    if (rule.humanOnly) return { label: "Human only", pass: false, reason: "This rule is Human only." };
    const stats = rule.bands ? bandStats(rule, threshold) : {
      reviewed: rule.reviewed,
      agreed: rule.agreed,
      precision: rule.reviewed ? rule.agreed / rule.reviewed : 0
    };
    if (stats.reviewed < 30) {
      return { label: "Needs review", pass: false, reason: "Fewer than 30 reviewed cases.", stats: stats };
    }
    if (stats.precision < rule.bar) {
      return { label: "Needs review", pass: false, reason: "Precision is under the " + pct1(rule.bar) + " bar.", stats: stats };
    }
    return { label: "Auto-act", pass: true, reason: "Precision and case count clear the bar.", stats: stats };
  }

  function modeFor(rule) {
    if (!rule) return "No gate in the sample";
    if (rule.humanOnly) return "Human only";
    const precision = tablePrecision(rule);
    if (precision == null) return "No gate in the sample";
    if (rule.reviewed < 30 || precision < rule.bar) return "Needs review";
    return "Auto-act";
  }

  function pillClass(tx) {
    if (tx.humanOnly) return "pill-human";
    if (tx.verdict === "needs-review") return "pill-wait";
    return "pill-good";
  }

  function filteredTx() {
    return DATA.transactions.filter((tx) => {
      if (state.ruleFilter !== "All" && tx.ruleId !== state.ruleFilter) return false;
      if (state.verdictFilter === "All") return true;
      if (state.verdictFilter === "human") return !!tx.humanOnly;
      return tx.verdict === state.verdictFilter;
    });
  }

  function counts() {
    const autoActed = DATA.transactions.filter((t) => t.verdict === "auto-acted").length;
    const autoApproved = DATA.transactions.filter((t) => t.verdict === "auto-approved").length;
    const review = DATA.transactions.filter((t) => t.verdict === "needs-review").length;
    return { total: DATA.transactions.length, autoActed: autoActed, autoApproved: autoApproved, review: review, handled: autoActed + autoApproved };
  }

  function checksFor(tx) {
    const rule = ruleById(tx.ruleId);
    const quote = quoteFor(tx);
    const cited = !!(tx.ruleId && quote && tx.receiptField);
    const threshold = rule ? activeThreshold(rule) : 0;
    const useBands = !!(rule && rule.bands && state.savedThreshold[rule.id] != null && Number(state.savedThreshold[rule.id]) !== rule.threshold);
    const stats = !rule ? null : (useBands ? bandStats(rule, threshold) : { reviewed: rule.reviewed, agreed: rule.agreed, precision: tablePrecision(rule) });
    const list = [];
    list.push({
      pass: cited,
      text: cited
        ? "Pass. Cites " + tx.ruleId + " and the receipt field " + tx.receiptField + "."
        : "Fail. The flag is missing a policy line quote or the receipt field."
    });
    if (!rule || rule.humanOnly) {
      list.push({ pass: false, text: "Fail. Human only rules are not scored for precision." });
      list.push({ pass: false, text: "Fail. Human only rules are not cleared by case count." });
    } else {
      const precision = stats.precision;
      const barOk = precision != null && precision >= rule.bar;
      list.push({
        pass: barOk,
        text: barOk
          ? "Pass. Precision is " + pct1(precision) + " on " + stats.reviewed + " reviewed cases. The bar is " + pct1(rule.bar) + "."
          : "Fail. Precision is " + pct1(precision || 0) + " on " + stats.reviewed + " reviewed cases. The bar is " + pct1(rule.bar) + "."
      });
      const countOk = stats.reviewed >= 30;
      list.push({
        pass: countOk,
        text: countOk
          ? "Pass. " + stats.reviewed + " reviewed cases is at least 30."
          : "Fail. " + stats.reviewed + " reviewed cases is fewer than 30."
      });
    }
    const confOk = !!(rule && tx.confidence >= threshold);
    list.push({
      pass: confOk,
      text: confOk
        ? "Pass. Confidence " + conf(tx.confidence) + " meets the " + conf(threshold) + " threshold."
        : "Fail. Confidence " + conf(tx.confidence) + " is below the " + conf(threshold) + " threshold."
    });
    const humanFail = !!(rule && rule.humanOnly) || !!tx.humanOnly;
    list.push({
      pass: !humanFail,
      text: humanFail
        ? "Fail. This rule is Human only, so a person reviews it."
        : "Pass. This rule is not Human only."
    });
    return list;
  }

  function allEvals() {
    const extras = state.overrides.map((row) => ({
      id: row.evalId,
      source: "override",
      rule: row.rule,
      expected: row.expected,
      must: true,
      by: DATA.admin,
      summary: row.reason,
      clientAttendee: !!row.clientAttendee,
      fromOverride: true,
      txId: row.txId
    }));
    return extras.concat(DATA.evals);
  }

  function caseOutcome(changeId, ev) {
    if (changeId === "C-13" && ev.rule === "P-3.4" && ev.clientAttendee && ev.expected === "Approve") {
      return { pass: false, note: "Fail. The update flags the alcohol and ignores the client attendee. Expected Approve." };
    }
    return { pass: true, note: "Pass." };
  }

  function runChange(changeId) {
    const cases = allEvals().map((ev) => {
      const outcome = caseOutcome(changeId, ev);
      return { id: ev.id, must: ev.must, rule: ev.rule, expected: ev.expected, pass: outcome.pass, note: outcome.note };
    });
    const mustFails = cases.filter((row) => row.must && !row.pass);
    const drops = DATA.rules.filter((rule) => {
      if (rule.humanOnly || !rule.reviewed) return false;
      const before = rule.agreed / rule.reviewed;
      const after = before;
      return before >= rule.bar && after < rule.bar;
    });
    return {
      id: changeId,
      at: stamp(),
      cases: cases,
      mustFails: mustFails.map((row) => row.id),
      drops: drops.map((rule) => rule.id),
      blocked: mustFails.length > 0 || drops.length > 0
    };
  }

  function receiptHtml(tx) {
    return tx.receipt.map((line) => {
      const text = typeof line === "string" ? line : line.text;
      const used = typeof line === "object" && line.used;
      return '<div class="' + (used ? "used" : "") + '">' + esc(text) + "</div>";
    }).join("");
  }

  function footer() {
    return '<footer class="site-footer"><p><a href="https://amiteshdwivedijhu-ship-it.github.io/">Prototype by Amitesh Dwivedi</a></p><p>Sample data. Not affiliated with Navan.</p></footer>';
  }

  function shell(body) {
    const nav = SCREENS.map(([id, label]) => {
      return '<button type="button" class="nav-btn" data-action="screen" data-screen="' + id + '"' +
        (state.screen === id ? ' aria-current="page"' : "") + ">" + esc(label) + "</button>";
    }).join("");
    return '<header class="topbar"><div class="brand"><h1>Policy Audit Gate</h1><p>' + esc(DATA.company) + "</p></div>" +
      '<button type="button" class="btn btn-primary" data-action="reset">Reset demo</button></header>' +
      '<div class="wrap"><div class="banner" role="note"><p><strong>Sample data. Not affiliated with Navan.</strong></p>' +
      "<p>Findings, gates, and regression results are simulated. They are stored in this page. Nothing is sent.</p></div>" +
      '<nav class="screen-nav" aria-label="Screens">' + nav + "</nav>" + body + footer() + "</div>";
  }

  function screenPolicy() {
    const buttons = DATA.policy.map((line) => {
      const rule = ruleById(line.id);
      const flags = DATA.transactions.filter((tx) => tx.ruleId === line.id).length;
      const mode = line.humanOnly ? "Human only" : (rule ? modeFor(rule) : "No gate in the sample");
      return '<button type="button" class="policy-btn" data-action="policy" data-rule="' + esc(line.id) + '">' +
        "<strong>" + esc(line.id) + "</strong> " + esc(line.text) +
        '<div class="muted">Mode: ' + esc(mode) + ". Flags this month: " + flags + ".</div></button>";
    }).join("");
    return '<section class="card"><h2>Policy</h2><p>' + esc(DATA.policyName) + ". Admin " + esc(DATA.admin) + ". Second signer " + esc(DATA.controller) + ".</p>" +
      "<p>Tap a line to filter the queue.</p>" +
      '<div class="policy-grid">' + buttons + "</div></section>" +
      '<section class="card"><h3>When the engine may auto-act</h3>' +
      "<p>The engine auto-acts only when all five are true.</p><ol>" +
      "<li>The flag cites a policy line ID, quotes the line, and names the receipt field it used.</li>" +
      "<li>Precision on cases at or above the rule threshold meets the bar. The default bar is 95%.</li>" +
      "<li>At least 30 admins reviewed those cases.</li>" +
      "<li>The flag confidence meets the rule threshold.</li>" +
      "<li>The rule is not Human only.</li></ol>" +
      "<p>If a check fails, the expense goes to Needs review and the screen says which check failed. A change ships only when every must-pass eval case passes and no passing rule drops below its bar. Every override needs a reason and becomes an eval case.</p></section>";
  }

  function txCard(tx) {
    return '<button type="button" class="inv-btn" data-action="open" data-id="' + esc(tx.id) + '">' +
      '<div class="inv-top"><span>' + esc(tx.id) + " · " + esc(tx.shortName) + "</span><span>" + money(tx.amount) + "</span></div>" +
      "<div>" + esc(tx.merchant) + (tx.detail ? " (" + esc(tx.detail) + ")" : "") + "</div>" +
      '<div style="margin-top:6px"><span class="pill ' + pillClass(tx) + '">' + esc(tx.verdictLabel) + "</span></div>" +
      '<div class="muted">Cited line: ' + esc(tx.noPolicyFlag ? "No policy flag · " + tx.ruleId : tx.ruleId) + ". Confidence " + conf(tx.confidence) + ".</div></button>";
  }

  function screenQueue() {
    const c = counts();
    const rows = filteredTx();
    const verdicts = [
      ["All", "All"],
      ["auto-acted", "Auto-acted"],
      ["auto-approved", "Auto-approved"],
      ["needs-review", "Needs review"],
      ["human", "Human only"]
    ];
    const chips = verdicts.map(([id, label]) => {
      return '<button type="button" class="choice" data-action="verdict" data-verdict="' + id + '" aria-pressed="' +
        (state.verdictFilter === id ? "true" : "false") + '">' + label + "</button>";
    }).join("");
    const ruleOptions = ['<option value="All">All rules</option>'].concat(DATA.rules.map((rule) => {
      return '<option value="' + esc(rule.id) + '"' + (state.ruleFilter === rule.id ? " selected" : "") + ">" + esc(rule.id) + "</option>";
    })).join("");
    const cards = rows.length ? rows.map(txCard).join("") : '<p>No expenses match this filter.</p>';
    const table = '<div class="table-wrap"><table><thead><tr><th>ID</th><th>Employee</th><th>Merchant</th><th>Amount</th><th>Verdict</th><th>Cited line</th><th>Confidence</th></tr></thead><tbody>' +
      rows.map((tx) => {
        return "<tr><td><button type=\"button\" class=\"btn\" data-action=\"open\" data-id=\"" + esc(tx.id) + "\">" + esc(tx.id) + "</button></td><td>" +
          esc(tx.shortName) + "</td><td>" + esc(tx.merchant) + "</td><td>" + money(tx.amount) + "</td><td>" + esc(tx.verdictLabel) +
          "</td><td>" + esc(tx.noPolicyFlag ? "No policy flag" : tx.ruleId) + "</td><td>" + conf(tx.confidence) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
    return '<section class="card"><h2>Audit queue</h2><p id="queue-summary">' + c.total + " expenses. " + c.handled +
      " handled automatically (" + c.autoActed + " auto-acted, " + c.autoApproved + " auto-approved), " + c.review +
      " need review. Every flag cites a policy line.</p>" +
      '<div class="choice-row" role="group" aria-label="Verdict filter">' + chips + "</div>" +
      '<label class="field"><span class="label">Rule filter</span><select id="rule-filter">' + ruleOptions + "</select></label>" +
      (state.ruleFilter !== "All" ? '<p class="muted">Showing ' + esc(state.ruleFilter) + '.</p>' : "") +
      "</section>" +
      '<div class="only-phone" id="queue-cards">' + cards + "</div>" +
      '<div class="only-desk card">' + (rows.length ? table : "<p>No expenses match this filter.</p>") + "</div>";
  }

  function screenFlag() {
    const tx = txById(state.txId) || DATA.transactions[0];
    const checks = checksFor(tx);
    const quote = quoteFor(tx);
    const failed = checks.filter((row) => !row.pass).map((row) => row.text);
    let lead = "";
    if (tx.verdict === "auto-acted") {
      lead = "All five checks pass, so the engine auto-acted.";
    } else if (tx.verdict === "auto-approved") {
      lead = "No policy flag. The coding rule cleared its bar, so this was auto-approved.";
    } else if (tx.humanOnly) {
      lead = "Needs review. This rule is Human only.";
    } else if (tx.ruleId === "P-3.4") {
      lead = "Needs review. The alcohol rule is 74.0% precise over 90 days (71 of 96), under the 95% bar.";
    } else if (tx.ruleId === "P-4.3") {
      lead = "Needs review. The weekend rule is 80.7% precise over 90 days (113 of 140), under the 95% bar.";
    } else {
      lead = "Needs review. " + (failed[0] || "A gate check failed.");
    }
    const existing = state.overrides.find((row) => row.txId === tx.id);
    const agreed = !!state.agreed[tx.id];
    return '<section class="card"><p class="muted">' + esc(tx.id) + " · " + esc(tx.employee) + " · " + esc(tx.merchant) + " · " + money(tx.amount) + "</p>" +
      '<h2>Flag detail</h2><span class="pill ' + pillClass(tx) + '">' + esc(tx.verdictLabel) + '</span> <span class="pill pill-sim">Simulated</span>' +
      "<h3>Policy line</h3>" +
      '<blockquote class="quote"><strong>' + esc(tx.ruleId) + "</strong> " + esc(quote) + "</blockquote>" +
      "<h3>Receipt</h3>" +
      '<div class="receipt" aria-label="Receipt">' + receiptHtml(tx) + "</div>" +
      '<p class="label">Highlighted line is the receipt field used: ' + esc(tx.receiptField) + ".</p>" +
      "<h3>Finding</h3><p>" + esc(tx.finding) + "</p>" +
      "<p>Confidence " + conf(tx.confidence) + ". Suggested GL code: " + esc(tx.gl) + ".</p>" +
      "<h3>Five gate checks</h3><p>" + esc(lead) + "</p>" +
      '<div id="check-list">' + checks.map((row) => {
        return '<p class="check ' + (row.pass ? "check-pass" : "check-fail") + '">' + esc(row.text) + "</p>";
      }).join("") + "</div></section>" +
      '<section class="card"><h3>Admin action</h3><p>Running as ' + esc(DATA.admin) + ".</p>" +
      (agreed ? "<p>You agreed with the engine. The audit log has the line.</p>" : "") +
      '<div class="btn-row"><button type="button" class="btn btn-primary" data-action="agree">Agree</button></div>' +
      "<h3>Override</h3><p>An override needs a reason and an expected outcome. It becomes an eval case. The form stays on this page.</p>" +
      (existing ? '<p><strong>From override.</strong> ' + esc(existing.evalId) + " expects " + esc(existing.expected) + ". Reason: " + esc(existing.reason) + ".</p>" : "") +
      '<label class="field"><span class="label">Expected outcome</span><select id="override-expected">' +
      ["Approve", "Flag", "Needs review"].map((opt) => {
        const selected = existing && existing.expected === opt ? " selected" : "";
        return '<option' + selected + ">" + opt + "</option>";
      }).join("") + "</select></label>" +
      '<label class="field"><span class="label">Reason</span><textarea id="override-reason" placeholder="Why should the engine change its call?">' +
      esc(existing ? existing.reason : "") + "</textarea></label>" +
      (state.overrideError ? '<p class="err">' + esc(state.overrideError) + "</p>" : "") +
      '<button type="button" class="btn btn-primary" data-action="override">Save override</button></section>';
  }

  function gateLive(ruleId) {
    const rule = ruleById(ruleId);
    if (!rule) return "";
    if (rule.humanOnly) {
      return "<p><strong>Human only.</strong> There is no threshold slider. A person reviews every flag on this rule.</p>";
    }
    const threshold = Number(state.preview[ruleId] != null ? state.preview[ruleId] : rule.threshold);
    if (!rule.bands) {
      const precision = tablePrecision(rule);
      const verdict = liveVerdict(rule, threshold);
      return "<p>This sample has no confidence bands, so the 90-day totals stay put.</p>" +
        "<p>Reviewed " + rule.reviewed + ". Agreed " + rule.agreed + ". Precision " + pct1(precision) +
        ". Bar " + pct1(rule.bar) + ". Threshold " + conf(rule.threshold) + ".</p>" +
        "<p>Verdict: <strong>" + esc(verdict.label) + ".</strong> " + esc(verdict.reason) + "</p>";
    }
    const stats = bandStats(rule, threshold);
    const verdict = liveVerdict(rule, threshold);
    const bandRows = rule.bands.map((band) => {
      const counted = band.min >= threshold - 0.0001;
      return '<div class="band"><span>' + band.min.toFixed(2) + " to " + band.max.toFixed(2) + "</span><span>" +
        band.reviewed + " reviewed, " + band.agreed + " agreed. " + (counted ? "Counted" : "Below threshold") + "</span></div>";
    }).join("");
    return '<div id="gate-live"><p>At threshold <strong id="threshold-readout">' + conf(threshold) + "</strong>.</p>" +
      "<p>Auto-acts per 30 days: <strong>" + per30(stats.reviewed) + "</strong>. Expected wrong auto-acts: <strong>" +
      per30(stats.reviewed - stats.agreed) + "</strong>.</p>" +
      "<p>Precision: <strong>" + pct1(stats.precision) + "</strong>. Case count: <strong>" + stats.reviewed + "</strong>. Bar " + pct1(rule.bar) + ".</p>" +
      '<p>Verdict: <strong class="' + (verdict.pass ? "check-pass" : "check-fail") + '">' + esc(verdict.label) + ".</strong> " + esc(verdict.reason) + "</p>" +
      bandRows + "</div>";
  }

  function screenGates() {
    const rows = DATA.rules.map((rule) => {
      const precision = rule.humanOnly || !rule.reviewed ? "Human only" : pct1(rule.agreed / rule.reviewed);
      const reviewed = rule.humanOnly ? "Human only" : String(rule.reviewed);
      const agreed = rule.humanOnly ? "Human only" : String(rule.agreed);
      const result = modeFor(rule);
      const cls = result === "Auto-act" ? "pill-good" : (result === "Human only" ? "pill-human" : "pill-wait");
      return "<tr><td><button type=\"button\" class=\"btn\" data-action=\"gate\" data-rule=\"" + esc(rule.id) + "\">" + esc(rule.id) +
        "</button></td><td>" + reviewed + "</td><td>" + agreed + "</td><td>" + precision + "</td><td>" + pct1(rule.bar) +
        "</td><td>" + conf(activeThreshold(rule)) + "</td><td><span class=\"pill " + cls + "\">" + esc(result) + "</span></td></tr>";
    }).join("");
    const cards = DATA.rules.map((rule) => {
      const result = modeFor(rule);
      return '<button type="button" class="inv-btn" data-action="gate" data-rule="' + esc(rule.id) + '"><strong>' + esc(rule.id) +
        "</strong><div>" + esc(rule.name || "") + "</div><div class=\"muted\">" +
        (rule.humanOnly ? "Human only" : (rule.reviewed + " reviewed, " + pct1(rule.agreed / rule.reviewed) + " precision")) +
        ". Result: " + esc(result) + ".</div></button>";
    }).join("");
    const rule = ruleById(state.gateRule);
    const threshold = Number(state.preview[state.gateRule] != null ? state.preview[state.gateRule] : (rule ? rule.threshold : 0.9));
    const slider = rule && !rule.humanOnly && rule.bands
      ? '<label class="field"><span class="label">Threshold for ' + esc(rule.id) + "</span>" +
        '<div class="slider-wrap"><input id="threshold-slider" data-slider="' + esc(rule.id) + '" type="range" min="0.5" max="0.9" step="0.1" value="' + threshold + '"></div></label>' +
        '<label class="field"><span class="label">Reason for this edit</span><textarea id="threshold-reason" placeholder="Why change the threshold?"></textarea></label>' +
        (state.thresholdError ? '<p class="err">' + esc(state.thresholdError) + "</p>" : "") +
        '<button type="button" class="btn btn-primary" data-action="save-threshold">Save threshold</button>'
      : "";
    return '<section class="card"><h2>Precision gates</h2><p>Last 90 days, synthetic. Pick a rule to see confidence bands. The slider updates the counts before you save. Saving needs a reason.</p>' +
      '<div class="only-phone">' + cards + "</div>" +
      '<div class="only-desk table-wrap"><table><thead><tr><th>Rule</th><th>Reviewed</th><th>Agreed</th><th>Precision</th><th>Bar</th><th>Threshold</th><th>Result</th></tr></thead><tbody>' +
      rows + "</tbody></table></div></section>" +
      '<section class="card"><h3>' + esc(state.gateRule) + "</h3>" + slider + gateLive(state.gateRule) + "</section>";
  }

  function screenEvals() {
    const rows = allEvals();
    const body = rows.map((ev) => {
      const tag = ev.fromOverride ? '<span class="pill pill-wait">From override</span>' : '<span class="pill">Seed</span>';
      return '<article class="card"><h3>' + esc(ev.id) + " " + tag + "</h3><p>" + esc(ev.summary) + "</p>" +
        "<p>Source: " + esc(ev.source) + ". Rule: " + esc(ev.rule) + ". Expected outcome: " + esc(ev.expected) +
        ". Must pass: " + (ev.must ? "yes" : "no") + ". Added by: " + esc(ev.by) + ".</p></article>";
    }).join("");
    return '<section class="card"><h2>Eval set</h2><p>' + rows.length + " cases. Override cases sit on top.</p></section><div id=\"eval-list\">" + body + "</div>";
  }

  function precisionTable() {
    return '<div class="table-wrap"><table><thead><tr><th>Rule</th><th>Precision before</th><th>Precision after</th><th>Bar</th></tr></thead><tbody>' +
      DATA.rules.map((rule) => {
        if (rule.humanOnly || !rule.reviewed) {
          return "<tr><td>" + esc(rule.id) + "</td><td>Human only</td><td>Human only</td><td>" + pct1(rule.bar) + "</td></tr>";
        }
        const p = pct1(rule.agreed / rule.reviewed);
        return "<tr><td>" + esc(rule.id) + "</td><td>" + p + "</td><td>" + p + "</td><td>" + pct1(rule.bar) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  function screenChange() {
    const change = DATA.changes.find((row) => row.id === state.changeId) || DATA.changes[0];
    const options = DATA.changes.map((row) => {
      return '<option value="' + row.id + '"' + (row.id === state.changeId ? " selected" : "") + ">" + row.id + " " + esc(row.title) + "</option>";
    }).join("");
    const run = state.runs[state.changeId];
    let result = "";
    if (state.changeId === "C-13") {
      result += "<p><strong>Last run: Oct 6, passed 14 of 14.</strong> That run is the seed. It did not include an override case.</p>";
    }
    if (!run) {
      result += '<p id="change-result">No new run yet. The button below runs the regression on the current eval set. Simulated.</p>';
    } else if (run.blocked) {
      result += '<div class="card lock-box" id="change-result"><p><strong>Blocked.</strong> ' +
        (run.mustFails.length ? "Must-pass fail: " + esc(run.mustFails.join(", ")) + "." : "") +
        (run.drops.length ? " Rule dropped below its bar: " + esc(run.drops.join(", ")) + "." : "") +
        "</p></div>";
    } else {
      result += '<div class="card ready-box" id="change-result"><p><strong>Safe to ship.</strong> Every must-pass case passed, and no passing rule dropped below its bar. Nothing has shipped.</p></div>';
    }
    const caseList = run ? '<div class="table-wrap"><table><thead><tr><th>Case</th><th>Rule</th><th>Expected</th><th>Must pass</th><th>Result</th></tr></thead><tbody>' +
      run.cases.map((row) => {
        return "<tr><td>" + esc(row.id) + "</td><td>" + esc(row.rule) + "</td><td>" + esc(row.expected) + "</td><td>" +
          (row.must ? "yes" : "no") + "</td><td>" + esc(row.note) + "</td></tr>";
      }).join("") + "</tbody></table></div>" : "";
    const locked = !run || run.blocked;
    const signed = state.signoff && state.signoff.changeId === state.changeId;
    return '<section class="card"><h2>Change check</h2><label class="field"><span class="label">Change</span><select id="change-id">' + options + "</select></label>" +
      "<p>" + esc(change.detail) + "</p>" +
      '<button type="button" class="btn btn-primary" data-action="run-change">Run regression (simulated)</button></section>' +
      '<section class="card"><h3>Precision before and after</h3><p>Simulated. These 90-day figures do not move in this sample. The case results decide the ship call. Rules already under the bar stay in review. They do not block a change that does not drop a passing rule.</p>' +
      precisionTable() + "</section>" +
      "<section class=\"card\">" + result + caseList + "</section>" +
      '<section class="card"><h3>Ship with sign-off</h3><p>Running as ' + esc(DATA.admin) + ". Sign-off needs a different person and a reason. Nothing in this prototype is published.</p>" +
      '<label class="field"><span class="label">Signer</span><select id="signer"><option>' + esc(DATA.admin) + "</option><option>" + esc(DATA.controller) + "</option></select></label>" +
      '<label class="field"><span class="label">Reason</span><textarea id="sign-reason" placeholder="Why is this change ready?"></textarea></label>' +
      (state.signError ? '<p class="err">' + esc(state.signError) + "</p>" : "") +
      '<button type="button" class="btn btn-primary" data-action="signoff"' + (locked ? " disabled" : "") + ">Ship with sign-off</button>" +
      (signed ? '<p class="ready-box" style="padding:10px;margin-top:12px">Sign-off recorded for ' + esc(state.signoff.by) + ". Nothing shipped.</p>" : "") +
      "</section>";
  }

  function screenPhone() {
    const tx = txById("T-1001");
    const phone = state.phone;
    return '<section class="card"><h2>Employee phone card</h2><p>Theo Park sees the same policy line and the dollar cut.</p>' +
      '<div class="phone-shell" id="phone-card"><p class="label">Halcyon expenses</p><p>' + esc(tx.phone) + "</p>" +
      (phone.accepted ? "<p><strong>You accepted the adjusted reimbursement of $219.09.</strong></p>" : "") +
      '<div class="stack"><button type="button" class="btn btn-primary" data-action="phone-accept">Accept</button>' +
      '<button type="button" class="btn" data-action="phone-note-toggle">Add a note</button>' +
      '<button type="button" class="btn" data-action="phone-question-toggle">Ask a question</button></div>' +
      (phone.noteOpen ? '<label class="field" style="margin-top:8px"><span class="label">Note</span><textarea id="phone-note">' + esc(phone.note) +
        '</textarea></label><button type="button" class="btn" data-action="phone-note-save">Save note</button>' : "") +
      (phone.note && !phone.noteOpen ? "<p>Note saved: " + esc(phone.note) + "</p>" : "") +
      (phone.questionOpen ? '<label class="field" style="margin-top:8px"><span class="label">Question</span><textarea id="phone-question">' + esc(phone.question) +
        '</textarea></label><button type="button" class="btn" data-action="phone-question-save">Send question</button>' : "") +
      (phone.question && !phone.questionOpen ? "<p>Question sent: " + esc(phone.question) + "</p>" : "") +
      "</div></section>";
  }

  function screenAudit() {
    const cards = state.log.map((row) => {
      return '<article class="card"><p class="label">' + esc(row.at) + "</p><p><strong>" + esc(row.actor) + "</strong> · Policy line " + esc(row.line) + "</p><p>" + esc(row.text) + "</p></article>";
    }).join("");
    const table = '<div class="table-wrap"><table><thead><tr><th>Time</th><th>Actor</th><th>Policy line</th><th>Action</th></tr></thead><tbody>' +
      state.log.map((row) => "<tr><td>" + esc(row.at) + "</td><td>" + esc(row.actor) + "</td><td>" + esc(row.line) + "</td><td>" + esc(row.text) + "</td></tr>").join("") +
      "</tbody></table></div>";
    return '<section class="card"><h2>Audit log</h2><p>Each line has a time, an actor, and a policy line. The actor is a person or the engine.</p>' +
      '<div class="only-desk">' + table + "</div></section><div class=\"only-phone\" id=\"audit-log\">" + cards + "</div>";
  }

  function screenHtml() {
    if (state.screen === "policy") return screenPolicy();
    if (state.screen === "flag") return screenFlag();
    if (state.screen === "gates") return screenGates();
    if (state.screen === "evals") return screenEvals();
    if (state.screen === "change") return screenChange();
    if (state.screen === "phone") return screenPhone();
    if (state.screen === "audit") return screenAudit();
    return screenQueue();
  }

  function render(keepScroll) {
    const y = keepScroll ? window.scrollY : 0;
    document.getElementById("app").innerHTML = shell(screenHtml());
    if (keepScroll) window.scrollTo(0, y);
    else window.scrollTo(0, 0);
  }

  function refresh() {
    save();
    render(true);
  }

  function go(screen) {
    state.screen = screen;
    save();
    render(false);
  }

  document.getElementById("app").addEventListener("input", (e) => {
    const slider = e.target.closest("[data-slider]");
    if (!slider) return;
    const id = slider.getAttribute("data-slider");
    state.preview[id] = Number(slider.value);
    save();
    const live = document.getElementById("gate-live");
    if (live) {
      const next = document.createElement("div");
      next.innerHTML = gateLive(id);
      const replacement = next.querySelector("#gate-live");
      if (replacement) live.replaceWith(replacement);
    }
  });

  document.getElementById("app").addEventListener("change", (e) => {
    if (e.target.id === "rule-filter") {
      state.ruleFilter = e.target.value;
      refresh();
    }
    if (e.target.id === "change-id") {
      state.changeId = e.target.value;
      state.signError = "";
      refresh();
    }
  });

  document.getElementById("app").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    if (action === "reset") {
      localStorage.removeItem(KEY);
      state = seed();
      save();
      render(false);
      return;
    }
    if (action === "screen") {
      go(btn.getAttribute("data-screen"));
      return;
    }
    if (action === "policy") {
      state.ruleFilter = btn.getAttribute("data-rule");
      state.verdictFilter = "All";
      go("queue");
      return;
    }
    if (action === "verdict") {
      state.verdictFilter = btn.getAttribute("data-verdict");
      refresh();
      return;
    }
    if (action === "open") {
      state.txId = btn.getAttribute("data-id");
      state.overrideError = "";
      go("flag");
      return;
    }
    if (action === "gate") {
      state.gateRule = btn.getAttribute("data-rule");
      state.thresholdError = "";
      refresh();
      return;
    }
    if (action === "agree") {
      const tx = txById(state.txId);
      state.agreed[tx.id] = true;
      log(DATA.admin, tx.ruleId, "Agreed with the engine on " + tx.id + ".");
      refresh();
      return;
    }
    if (action === "override") {
      const tx = txById(state.txId);
      const reason = (document.getElementById("override-reason").value || "").trim();
      const expected = document.getElementById("override-expected").value;
      if (!reason || !expected) {
        state.overrideError = "Add a reason and an expected outcome.";
        refresh();
        return;
      }
      state.overrideError = "";
      let row = state.overrides.find((item) => item.txId === tx.id);
      if (!row) {
        const evalId = tx.id === "T-1003" ? "EV-015" : "EV-" + String(15 + state.overrides.length + 1).padStart(3, "0");
        row = { txId: tx.id, evalId: evalId, rule: tx.ruleId, clientAttendee: !!tx.clientAttendee };
        state.overrides.unshift(row);
      }
      row.reason = reason;
      row.expected = expected;
      log(DATA.admin, tx.ruleId, "Overrode " + tx.id + ". Expected " + expected + ". Reason: " + reason + ". Eval case " + row.evalId + ".");
      refresh();
      return;
    }
    if (action === "save-threshold") {
      const rule = ruleById(state.gateRule);
      const reason = (document.getElementById("threshold-reason").value || "").trim();
      if (!reason) {
        state.thresholdError = "Add a reason before saving the threshold.";
        refresh();
        return;
      }
      const value = Number(state.preview[rule.id]);
      state.savedThreshold[rule.id] = value;
      state.thresholdError = "";
      log(DATA.admin, rule.id, "Set the threshold to " + conf(value) + ". Reason: " + reason + ".");
      refresh();
      return;
    }
    if (action === "run-change") {
      const run = runChange(state.changeId);
      state.runs[state.changeId] = run;
      state.signError = "";
      log(DATA.admin, state.changeId === "C-12" ? "P-3.1" : "P-3.4", "Ran regression on " + state.changeId + " (simulated). " + (run.blocked ? "Blocked by " + run.mustFails.join(", ") + "." : "All must-pass cases passed."));
      refresh();
      return;
    }
    if (action === "signoff") {
      const run = state.runs[state.changeId];
      if (!run || run.blocked) {
        state.signError = "Ship is locked until every must-pass case passes and no passing rule drops below its bar.";
        refresh();
        return;
      }
      const signer = document.getElementById("signer").value;
      const reason = (document.getElementById("sign-reason").value || "").trim();
      if (signer === DATA.admin) {
        state.signError = "Sign-off needs a different person than the one running the check.";
        refresh();
        return;
      }
      if (!reason) {
        state.signError = "Add a reason for the sign-off.";
        refresh();
        return;
      }
      state.signError = "";
      state.signoff = { changeId: state.changeId, by: signer, reason: reason, at: stamp() };
      log(signer, state.changeId === "C-12" ? "P-3.1" : "P-3.4", "Signed off on " + state.changeId + ". Reason: " + reason + ". Nothing shipped.");
      refresh();
      return;
    }
    if (action === "phone-accept") {
      state.phone.accepted = true;
      log("Theo Park", "P-3.2", "Accepted the adjusted reimbursement on T-1001.");
      refresh();
      return;
    }
    if (action === "phone-note-toggle") {
      state.phone.noteOpen = !state.phone.noteOpen;
      state.phone.questionOpen = false;
      refresh();
      return;
    }
    if (action === "phone-question-toggle") {
      state.phone.questionOpen = !state.phone.questionOpen;
      state.phone.noteOpen = false;
      refresh();
      return;
    }
    if (action === "phone-note-save") {
      const note = (document.getElementById("phone-note").value || "").trim();
      if (!note) return;
      state.phone.note = note;
      state.phone.noteOpen = false;
      log("Theo Park", "P-3.2", "Added a note on T-1001: " + note);
      refresh();
      return;
    }
    if (action === "phone-question-save") {
      const question = (document.getElementById("phone-question").value || "").trim();
      if (!question) return;
      state.phone.question = question;
      state.phone.questionOpen = false;
      log("Theo Park", "P-3.2", "Asked a question on T-1001: " + question);
      refresh();
    }
  });

  render(false);
})();
