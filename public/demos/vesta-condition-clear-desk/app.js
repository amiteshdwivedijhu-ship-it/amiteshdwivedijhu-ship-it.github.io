(function () {
  const DATA = window.VESTA_DATA;
  const KEY = "vesta-condition-clear-desk-v1";
  const SCREENS = [
    ["board", "Board"],
    ["trace", "Trace"],
    ["regression", "Regression"],
    ["gate", "Gate"],
    ["audit", "Audit"]
  ];

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  function money(n) {
    const v = Math.round(Number(n));
    const sign = v < 0 ? "-" : "";
    return sign + "$" + String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function pct(n) {
    return (Math.round(Number(n) * 10) / 10).toFixed(1) + "%";
  }

  function rateText(pass, total) {
    return (Math.round((pass / total) * 1000) / 10).toFixed(1) + "%";
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

  function humanJoin(ids) {
    if (!ids.length) return "";
    if (ids.length === 1) return ids[0];
    if (ids.length === 2) return ids[0] + " and " + ids[1];
    return ids.slice(0, -1).join(", ") + ", and " + ids[ids.length - 1];
  }

  function metaBy(id) {
    return DATA.conditions.find((c) => c.id === id) || DATA.conditions[0];
  }

  function taskOf(meta) {
    return DATA.tasks.find((t) => t.id === meta.task);
  }

  function agentLabel(meta) {
    const task = taskOf(meta);
    return task.version ? task.agent + " " + task.version : task.agent;
  }

  function seed() {
    return {
      screen: "board",
      conditionId: "C-03",
      ownerFilter: "All",
      statusFilter: "All",
      role: "tasha",
      panel: null,
      overrideForm: {
        reason: DATA.reasons[0],
        value: "640",
        note: "",
        saveCase: true,
        otherValue: ""
      },
      escNote: "",
      human: {},
      c05: {
        action: null,
        draft: DATA.loeDraft,
        markedSent: false,
        clearedBy: null
      },
      c08By: null,
      rc12: null,
      regVersion: "v1.4",
      promote: null,
      formError: "",
      notice: "",
      examiner: false,
      log: DATA.seedLog.map((row) => Object.assign({}, row)).reverse()
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seed();
      const saved = JSON.parse(raw);
      const base = seed();
      if (!saved || typeof saved !== "object") return base;
      const screens = SCREENS.map((s) => s[0]);
      if (screens.indexOf(saved.screen) !== -1) base.screen = saved.screen;
      if (typeof saved.conditionId === "string") base.conditionId = saved.conditionId;
      if (typeof saved.ownerFilter === "string") base.ownerFilter = saved.ownerFilter;
      if (typeof saved.statusFilter === "string") base.statusFilter = saved.statusFilter;
      if (typeof saved.role === "string") base.role = saved.role;
      if (saved.panel === "override" || saved.panel === "escalate") base.panel = saved.panel;
      if (saved.overrideForm && typeof saved.overrideForm === "object") {
        base.overrideForm = Object.assign(base.overrideForm, saved.overrideForm);
      }
      if (typeof saved.escNote === "string") base.escNote = saved.escNote;
      if (saved.human && typeof saved.human === "object") base.human = saved.human;
      if (saved.c05 && typeof saved.c05 === "object") base.c05 = Object.assign(base.c05, saved.c05);
      if (typeof saved.c08By === "string") base.c08By = saved.c08By;
      if (saved.rc12 && typeof saved.rc12 === "object") base.rc12 = saved.rc12;
      if (saved.regVersion === "v1.4" || saved.regVersion === "v1.5") base.regVersion = saved.regVersion;
      if (saved.promote && typeof saved.promote === "object") base.promote = saved.promote;
      if (typeof saved.notice === "string") base.notice = saved.notice;
      if (Array.isArray(saved.log) && saved.log.length) base.log = saved.log;
      base.examiner = false;
      base.formError = "";
      return base;
    } catch (err) {
      return seed();
    }
  }

  let state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (err) { /* storage can be blocked */ }
  }

  function role() {
    return DATA.roles.find((r) => r.id === state.role) || DATA.roles[0];
  }

  function actorLine() {
    const r = role();
    return r.name + ", " + r.job;
  }

  function addLog(entry) {
    state.log.unshift(entry);
  }

  function parseOt(raw) {
    const t = String(raw == null ? "" : raw).trim();
    if (!/^\d+$/.test(t)) return null;
    return Number(t);
  }

  function calc(ot) {
    const income = DATA.income.jordanMonthly + DATA.income.caseyBase + Number(ot);
    const dti = Math.round((DATA.debts.total / income) * 1000) / 10;
    const limit = Math.round(income * 0.5);
    return { ot: Number(ot), income: income, dti: dti, limit: limit };
  }

  function currentOt() {
    const h = state.human["C-03"];
    if (h && h.type === "override") {
      const n = parseOt(h.value);
      if (n !== null) return n;
    }
    return DATA.income.agentOt;
  }

  function figures() {
    return calc(currentOt());
  }

  function ausText(dti) {
    if (dti > 45) return "DTI is over the 45% limit. Re-run AUS (simulated).";
    if (dti > 43) return "Re-run AUS (simulated).";
    return "";
  }

  function variablePaused() {
    return !!(state.rc12 && state.rc12.correct !== DATA.income.agentOt);
  }

  function checks(meta) {
    const task = taskOf(meta);
    const paused = meta.task === "variable" && variablePaused();
    const allowed = task.loanTypes.indexOf(DATA.loan.purpose) !== -1 &&
      (task.level === "Auto" || task.level === "Auto on a share");
    let settingText;
    if (task.level === "Auto on a share" && !allowed) {
      settingText = "Variable income is Auto on a share (" + task.share + "). This loan is a purchase, so that share does not cover it.";
    } else if (allowed && task.level === "Auto") {
      settingText = "This task is Auto for a purchase loan.";
    } else if (allowed) {
      settingText = "This task is Auto on a share for this loan type.";
    } else {
      settingText = "This task is " + task.level + ". It is not set to clear a purchase loan alone.";
    }
    const rows = [{ name: "Task setting", ok: allowed, text: settingText }];
    if (meta.confidence == null) {
      rows.push({ name: "Confidence", ok: false, text: "The closing agent has not made a scored clear call." });
    } else if (meta.confidence >= task.threshold) {
      rows.push({
        name: "Confidence",
        ok: true,
        text: "Confidence " + meta.confidence + " meets the " + task.threshold + " line."
      });
    } else {
      rows.push({
        name: "Confidence",
        ok: false,
        text: "Confidence " + meta.confidence + " is under the " + task.threshold + " line."
      });
    }
    if (!meta.rule) {
      rows.push({
        name: "Citations",
        ok: false,
        text: "There is no clear call yet, so there is no field and guideline pair to cite."
      });
    } else {
      rows.push({
        name: "Citations",
        ok: true,
        text: "The call cites document fields and " + meta.rule + "."
      });
    }
    rows.push({
      name: "Document match",
      ok: true,
      text: "No documents disagree on a field this call used."
    });
    rows.push({
      name: "Not adverse",
      ok: true,
      text: "This call does not deny or suspend the loan. Agents never deny or suspend alone."
    });
    rows.push({
      name: "Gate",
      ok: !paused,
      text: paused ? "Paused: live v1.4 fails must-pass case RC-12." : "This task is not paused by the gate."
    });
    return rows;
  }

  function checksPass(meta) {
    return checks(meta).every((row) => row.ok);
  }

  function blankItem(meta) {
    return {
      id: meta.id,
      title: meta.title,
      confidence: meta.confidence,
      agentName: agentLabel(meta),
      summary: meta.action,
      named: "",
      satisfied: false,
      lockReason: "",
      owner: "Person",
      status: "Needs review"
    };
  }

  function asPersonClear(base, who, summary) {
    base.owner = "Person";
    base.status = "Cleared";
    base.satisfied = true;
    base.named = who;
    base.summary = summary;
    base.lockReason = "";
    return base;
  }

  function asEscalate(base, who, reason) {
    base.owner = "Escalated";
    base.status = "Escalated";
    base.satisfied = false;
    base.named = who;
    base.summary = "Escalated by " + who + ".";
    base.lockReason = reason;
    return base;
  }

  function buildAuto(base, meta, h) {
    if (h && h.type === "escalate") {
      return asEscalate(base, h.by, meta.id + " was escalated. A named person has not cleared it.");
    }
    if (h && (h.type === "accept" || h.type === "override" || h.type === "clear")) {
      return asPersonClear(base, h.by, "Cleared by " + h.by + ".");
    }
    base.owner = "Agent";
    base.status = "Cleared";
    base.satisfied = checksPass(meta);
    base.summary = meta.action;
    if (!base.satisfied) {
      base.owner = "Person";
      base.status = "Needs review";
      base.lockReason = meta.id + " needs a person. The hard rule blocked an agent clear.";
    }
    return base;
  }

  function buildC03(base, h) {
    if (h && h.type === "override") {
      return asPersonClear(base, h.by, "Overridden by " + h.by + " to " + money(h.value) + " a month under HL-UW 4.3.2.");
    }
    if (h && h.type === "accept") {
      return asPersonClear(base, h.by, "Accepted by " + h.by + " at $1,180 a month.");
    }
    if (h && h.type === "escalate") {
      return asEscalate(base, h.by, "C-03 was escalated. A named person has not cleared overtime.");
    }
    base.owner = "Person";
    base.status = "Needs review";
    base.satisfied = false;
    base.summary = "Income Agent v1.4 recommends $1,180 a month. Confidence 71 is under 85.";
    base.lockReason = "C-03 Overtime for Casey needs a person. Confidence 71 is under 85.";
    return base;
  }

  function buildC07(base, h) {
    if (h && (h.type === "accept" || h.type === "override" || h.type === "clear")) {
      return asPersonClear(base, h.by, "Cleared by " + h.by + ". The short distance comment was accepted.");
    }
    if (h && h.type === "escalate") {
      return asEscalate(base, h.by, "C-07 was escalated. A named person has not cleared the appraisal comment.");
    }
    base.owner = "Person";
    base.status = "Needs review";
    base.satisfied = false;
    base.summary = "Condition Agent v1.2 recommends clear. Confidence 82 is under 90.";
    base.lockReason = "C-07 Appraisal comp distance needs a person. Confidence 82 is under 90.";
    return base;
  }

  function buildC05(base, meta, fig, h) {
    const over = fig.limit < DATA.deposit.zelle;
    if (!over) {
      const item = buildAuto(base, meta, h);
      if (!h) item.summary = "Not required. $5,000 is under the " + money(fig.limit) + " limit.";
      return item;
    }
    if (state.c05.clearedBy) {
      return asPersonClear(base, state.c05.clearedBy, "Cleared by " + state.c05.clearedBy + " after the deposit was sourced.");
    }
    const reason = "C-05 The $5,000 deposit on Sep 2 is over the sourcing limit of " + money(fig.limit) + ".";
    if (state.c05.action === "agent") {
      base.owner = "Agent";
      base.status = "Needs review";
      base.satisfied = false;
      base.summary = "Sent back to Asset Agent v2.1. The agent cannot clear a deposit over the limit with no source.";
      base.lockReason = reason;
      return base;
    }
    base.owner = "Escalated";
    base.status = "Escalated";
    base.satisfied = false;
    base.summary = "$5,000 deposit on Sep 2 is now over the sourcing limit.";
    base.lockReason = reason;
    return base;
  }

  function buildC08(items) {
    const meta = metaBy("C-08");
    const h = state.human["C-08"];
    const wait = ["C-03", "C-05", "C-07"].filter((id) => !items[id].satisfied);
    const base = blankItem(meta);
    base.agentName = agentLabel(meta);
    base.owner = "Person";
    base.status = "Open";
    if (!wait.length && (state.c08By || (h && (h.type === "accept" || h.type === "clear" || h.type === "override")))) {
      const who = state.c08By || h.by;
      return asPersonClear(base, who, "Cleared by " + who + ".");
    }
    base.summary = wait.length
      ? "Open. Waits on " + humanJoin(wait) + "."
      : "Ready for a named person. The agent does not clear the package alone.";
    base.lockReason = wait.length
      ? "C-08 Closing package is open. It waits on " + humanJoin(wait) + "."
      : "C-08 Closing package is open. A named person has not cleared it.";
    if (h && h.type === "escalate") {
      base.owner = "Escalated";
      base.status = "Escalated";
      base.summary = "Escalated by " + h.by + ". " + base.summary;
    }
    return base;
  }

  function model() {
    const fig = figures();
    const items = {};
    DATA.conditions.forEach((meta) => {
      if (meta.id === "C-08") return;
      const base = blankItem(meta);
      const h = state.human[meta.id];
      if (meta.id === "C-03") items[meta.id] = buildC03(base, h);
      else if (meta.id === "C-05") items[meta.id] = buildC05(base, meta, fig, h);
      else if (meta.id === "C-07") items[meta.id] = buildC07(base, h);
      else items[meta.id] = buildAuto(base, meta, h);
    });
    items["C-08"] = buildC08(items);
    return {
      fig: fig,
      paused: variablePaused(),
      items: items,
      list: DATA.conditions.map((meta) => items[meta.id])
    };
  }

  function allCases() {
    const list = DATA.cases.map((row) => Object.assign({ fromOverride: false }, row));
    if (state.rc12) {
      list.push({
        id: "RC-12",
        family: "Income",
        title: "Declining overtime uses the year to date average",
        mustPass: true,
        input: "2024 overtime $15,600. 2025 overtime $12,720. 2026 through Aug 31 $5,120, which is $640 a month.",
        agent: "$1,180 a month",
        v15: "$640 a month",
        correct: money(state.rc12.correct) + " a month",
        correctNum: state.rc12.correct,
        rule: "HL-UW 4.3.2",
        fromOverride: true
      });
    }
    return list;
  }

  function casePass(row, version) {
    if (row.id !== "RC-12") return true;
    const agentNum = version === "v1.5" ? DATA.income.ytdMonthly : DATA.income.agentOt;
    return agentNum === row.correctNum;
  }

  function shownAnswer(row, version) {
    if (row.id === "RC-12" && version === "v1.5") return row.v15;
    return row.agent;
  }

  function versionStats(version) {
    const list = allCases();
    let pass = 0;
    const mustFail = [];
    list.forEach((row) => {
      const ok = casePass(row, version);
      if (ok) pass += 1;
      else if (row.mustPass) mustFail.push(row.id);
    });
    const fails = list.length - pass;
    const sampleTotal = 24;
    const samplePass = sampleTotal - fails;
    const rate = samplePass / sampleTotal;
    const overrideCount = 2;
    const overrideLoans = 50;
    const overrideRate = overrideCount / overrideLoans;
    return {
      pass: pass,
      total: list.length,
      mustFail: mustFail,
      samplePass: samplePass,
      sampleTotal: sampleTotal,
      rate: rate,
      overrideCount: overrideCount,
      overrideLoans: overrideLoans,
      overrideRate: overrideRate,
      mustOk: mustFail.length === 0,
      rateOk: sampleTotal >= 20 && rate >= 0.95,
      ovOk: overrideRate < 0.05
    };
  }

  function promoteReady() {
    const stats = versionStats("v1.5");
    return stats.mustOk && stats.rateOk && stats.ovOk && !state.promote;
  }

  function pill(status) {
    const map = {
      "Cleared": "pill-cleared",
      "Needs review": "pill-review",
      "Escalated": "pill-esc",
      "Paused": "pill-pause",
      "Open": "pill-open"
    };
    return '<span class="pill ' + (map[status] || "pill-open") + '">' + esc(status) + "</span>";
  }

  function confidenceText(value) {
    return value == null ? "Confidence not scored" : "Confidence " + value;
  }

  function navHtml() {
    return '<nav class="screen-nav" aria-label="Screens">' + SCREENS.map((pair) => {
      const on = state.screen === pair[0] && !state.examiner ? ' aria-current="page"' : "";
      return '<button type="button" class="nav-btn" data-act="nav" data-screen="' + pair[0] + '"' + on + ">" + esc(pair[1]) + "</button>";
    }).join("") + "</nav>";
  }

  function bannerHtml() {
    return '<div class="banner"><p class="prose">All lender, borrower, loan, and guide data is sample data. Harborline Home Loans, the borrowers, and the Harborline Underwriting Guide are made up.</p></div>';
  }

  function footerHtml() {
    return '<footer class="site-footer"><p><a href="https://amiteshdwivedijhu-ship-it.github.io/">Prototype by Amitesh Dwivedi</a></p><p>Sample data. Not affiliated with Vesta.</p></footer>';
  }

  function roleSelect() {
    const options = DATA.roles.map((r) => {
      const on = r.id === state.role ? " selected" : "";
      return '<option value="' + esc(r.id) + '"' + on + ">" + esc(r.name + ", " + r.job) + "</option>";
    }).join("");
    return '<label class="field">Acting as<select class="role-select">' + options + "</select></label>";
  }

  function statsHtml(fig) {
    const aus = ausText(fig.dti);
    return '<div class="stat-grid">' +
      '<div class="stat"><span class="kicker">Qualifying income</span><b id="income-now">' + money(fig.income) + "</b></div>" +
      '<div class="stat"><span class="kicker">DTI</span><b id="dti-now">' + pct(fig.dti) + "</b></div>" +
      '<div class="stat"><span class="kicker">Deposit limit</span><b id="limit-now">' + money(fig.limit) + "</b></div>" +
      '<div class="stat"><span class="kicker">Overtime used</span><b>' + money(fig.ot) + "</b></div>" +
      "</div>" +
      (aus ? '<p id="aus-flag" class="pill pill-aus" style="margin-top:8px">' + esc(aus) + "</p>" : "");
  }

  function loanCard(fig) {
    const snap = model();
    const ctc = snap.list.filter((item) => !item.satisfied);
    return '<section class="card">' +
      '<div class="loan-top"><span class="kicker">' + esc(DATA.lender) + "</span>" +
      pill(ctc.length ? "Locked" : "Unlocked") + "</div>" +
      "<h2>Loan " + esc(DATA.loan.id) + "</h2>" +
      '<div class="fact-grid">' +
      fact("Borrowers", DATA.loan.borrowers) +
      fact("Loan", DATA.loan.product + ", " + money(DATA.loan.amount)) +
      fact("Purpose", DATA.loan.purpose) +
      fact("Rate lock", "Expires " + DATA.loan.lock) +
      fact("Processor", DATA.people.processor) +
      fact("Underwriter", DATA.people.underwriter) +
      "</div>" +
      roleSelect() +
      '<p class="prose">Jordan salary ' + money(DATA.income.jordanMonthly) + " a month. Casey base " + money(DATA.income.caseyBase) + " a month. Debts " + money(DATA.debts.total) + " a month. DTI limit 45%.</p>" +
      statsHtml(fig) +
      "</section>";
  }

  function fact(label, value) {
    return '<p class="fact"><span>' + esc(label) + "</span>" + esc(value) + "</p>";
  }

  function ctcCard(list) {
    const open = list.filter((item) => !item.satisfied);
    if (!open.length) {
      return '<section class="card ready-box" id="ctc-box"><h2>Clear to close: unlocked</h2><p class="prose">Every condition passed the hard rule or has a named person.</p></section>';
    }
    return '<section class="card lock-box" id="ctc-box" aria-live="polite"><h2>Clear to close: locked</h2><p class="prose">It stays locked until every condition passes the hard rule or has a named person.</p><ul class="hard-rule">' +
      open.map((item) => "<li>" + esc(item.lockReason) + "</li>").join("") +
      "</ul></section>";
  }

  function renderBoard() {
    const snap = model();
    const agentClears = snap.list.filter((item) => item.status === "Cleared" && item.owner === "Agent").length;
    const owners = ["All", "Agent", "Person", "Escalated"];
    const statuses = ["All", "Cleared", "Needs review", "Open", "Escalated"];
    const chips = (label, values, key) => {
      return '<div class="choice-row" role="group" aria-label="' + esc(label) + '"><span class="filter-label">' + esc(label) + "</span>" +
        values.map((value) => {
          const on = state[key] === value;
          return '<button type="button" class="choice" data-act="filter" data-key="' + key + '" data-value="' + esc(value) + '" aria-pressed="' + (on ? "true" : "false") + '">' + esc(value) + "</button>";
        }).join("") + "</div>";
    };
    const shown = snap.list.filter((item) => {
      if (state.ownerFilter !== "All" && item.owner !== state.ownerFilter) return false;
      if (state.statusFilter !== "All" && item.status !== state.statusFilter) return false;
      return true;
    });
    const rows = shown.length ? shown.map((item) => {
      return '<button type="button" class="btn cond-btn" data-act="open" data-id="' + item.id + '" id="cond-' + item.id + '">' +
        '<span class="kicker">' + esc(item.id) + " · " + esc(item.agentName) + "</span>" +
        '<div class="cond-title">' + esc(item.title) + "</div>" +
        '<div class="cond-top">' +
        '<span class="pill">' + esc(item.owner) + "</span>" +
        pill(item.status) +
        "<span>" + esc(confidenceText(item.confidence)) + "</span>" +
        "</div>" +
        "<p>" + esc(item.summary) + "</p>" +
        (item.named ? "<p>Named person: " + esc(item.named) + "</p>" : "") +
        "</button>";
    }).join("") : '<p class="empty">No conditions match this filter.</p>';
    const pause = snap.paused
      ? '<section class="card lock-box" id="pause-reason"><h2>Variable income paused</h2><p>Paused: live v1.4 fails must-pass case RC-12.</p></section>'
      : "";
    const ruleCard = '<section class="card"><h2>Hard rule for an agent clear</h2><p class="prose">An agent may clear a condition alone only when all six are true. If one fails, the file goes to a person and the reason is written in words.</p><ol class="hard-rule">' +
      "<li>The task is Auto, or Auto on a share, for this loan type.</li>" +
      "<li>Confidence meets the task line.</li>" +
      "<li>Every claim cites a document field and a guideline line.</li>" +
      "<li>No documents disagree on a field it used.</li>" +
      "<li>The action is not a denial or a suspension. Agents never deny or suspend alone.</li>" +
      "<li>The task is not paused by the gate.</li>" +
      "</ol></section>";
    return loanCard(snap.fig) +
      ctcCard(snap.list) +
      pause +
      '<section class="card"><h2>Conditions</h2><p id="agent-cleared">' + agentClears + " conditions were cleared by an agent. " + snap.list.length + " conditions on this file.</p>" +
      chips("Owner", owners, "ownerFilter") +
      chips("Status", statuses, "statusFilter") +
      '<p class="muted">Showing ' + shown.length + " of " + snap.list.length + ".</p>" +
      rows +
      "</section>" +
      ruleCard;
  }

  function checkList(meta, item, fig) {
    const rows = checks(meta).map((row) => Object.assign({}, row));
    if (meta.id === "C-05" && fig.limit < DATA.deposit.zelle && !item.satisfied) {
      const cite = rows.find((row) => row.name === "Citations");
      if (cite) {
        cite.ok = false;
        cite.text = "A clear needs a source document. This file does not have one, so the agent cannot cite a field that sources the deposit.";
      }
    }
    return '<div class="check-list"><span class="kicker">Hard rule on this call</span>' + rows.map((row) => {
      const word = row.ok ? "Pass" : "Fail";
      const cls = row.ok ? "pass" : "fail";
      return '<div class="check-row"><b class="' + cls + '">' + word + " · " + esc(row.name) + "</b><p>" + esc(row.text) + "</p></div>";
    }).join("") + "</div>";
  }

  function fieldsTable(meta) {
    return '<div class="table-wrap"><table><thead><tr><th>Field</th><th>Value</th><th>Used</th></tr></thead><tbody>' +
      meta.fields.map((field) => "<tr><td>" + esc(field.field) + "</td><td>" + esc(field.value) + "</td><td>" + esc(field.used) + "</td></tr>").join("") +
      "</tbody></table></div>";
  }

  function decisionButtons(item) {
    const overridePrimary = item.status !== "Cleared";
    return '<div class="btn-row">' +
      '<button type="button" class="btn' + (overridePrimary ? "" : " btn-primary") + '" data-act="accept">Accept</button>' +
      '<button type="button" class="btn' + (overridePrimary ? " btn-primary" : "") + '" id="btn-override" data-act="show-override">Override</button>' +
      '<button type="button" class="btn" data-act="show-escalate">Escalate</button>' +
      "</div>";
  }

  function escalationCard(fig) {
    const sent = state.c05.markedSent
      ? '<p id="sent-note"><strong>Marked as sent (demo). Nothing left this page.</strong></p>'
      : "";
    const agentBack = state.c05.action === "agent"
      ? '<div class="agent-block"><span class="kicker">Asset Agent v2.1</span><p>I cannot clear this. HL-UW 5.2.1 says this deposit is over the limit and it is not payroll. A person still has to source it.</p></div>'
      : "";
    const gift = state.c05.action === "gift"
      ? "<p><strong>Marked as a gift. A gift letter is still required. Nothing is sent.</strong></p>"
      : "";
    const loe = state.c05.action === "loe"
      ? "<p><strong>Letter of explanation requested. Nothing is sent.</strong></p>"
      : "";
    const clearBtn = state.c05.markedSent
      ? '<button type="button" class="btn" data-act="clear-sourced">Record the letter and clear C-05 (demo)</button>'
      : "";
    return '<div class="esc-card" id="esc-card">' +
      '<span class="kicker">Escalation</span>' +
      "<h3>$5,000 deposit on Sep 2 is now over the sourcing limit.</h3>" +
      "<p class=\"prose\">The limit is now " + money(fig.limit) + ". The Zelle line is " + esc(DATA.deposit.zelleLine) + ". A person has to source it. Rate lock expires " + esc(DATA.loan.lock) + ".</p>" +
      agentBack + gift + loe +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-primary" id="btn-loe" data-act="esc-loe">Request letter of explanation</button>' +
      '<button type="button" class="btn" id="btn-gift" data-act="esc-gift">Mark as gift (needs gift letter)</button>' +
      '<button type="button" class="btn" id="btn-back-agent" data-act="esc-agent">Send back to agent</button>' +
      "</div>" +
      '<label class="field">Letter of explanation draft<textarea id="loe-draft">' + esc(state.c05.draft) + "</textarea></label>" +
      '<div class="btn-row"><button type="button" class="btn" id="btn-mark-sent" data-act="mark-sent">Mark as sent (demo)</button>' + clearBtn + "</div>" +
      sent +
      "<p class=\"prose\">Mark as sent (demo) does not send email or a text. Nothing leaves this page.</p>" +
      "</div>";
  }

  function renderTrace() {
    const snap = model();
    const meta = metaBy(state.conditionId);
    const item = snap.items[meta.id];
    const fig = snap.fig;
    const over = meta.id === "C-05" && fig.limit < DATA.deposit.zelle && !item.satisfied;
    const guide = meta.rule ? DATA.guidelines[meta.rule] : "";
    const named = item.named ? "<p>Named person: " + esc(item.named) + "</p>" : "";
    const notice = state.notice
      ? '<div class="card notice" id="save-notice"><p>' + esc(state.notice) + "</p>" +
        (snap.items["C-05"] && !snap.items["C-05"].satisfied
          ? '<div class="btn-row"><button type="button" class="btn btn-primary" data-act="open" data-id="C-05">Open the C-05 escalation</button></div>'
          : "") +
        "</div>"
      : "";
    let decisionBody;
    if (over) {
      decisionBody = escalationCard(fig) +
        '<div class="agent-block"><span class="kicker">Earlier agent call</span>' +
        meta.reasoning.map((line) => "<p>" + esc(line) + "</p>").join("") +
        "<p><strong>What would change this call.</strong> " + esc(meta.change) + "</p></div>";
    } else {
      decisionBody = '<span class="kicker">Decision</span>' +
        "<h3>" + esc(meta.action) + "</h3>" +
        "<p>" + esc(confidenceText(meta.confidence)) + "</p>" +
        named +
        decisionButtons(item) +
        '<div class="agent-block"><span class="kicker">Agent reasoning</span>' +
        meta.reasoning.map((line) => "<p>" + esc(line) + "</p>").join("") +
        "</div>" +
        "<p><strong>What would change this call.</strong> " + esc(meta.change) + "</p>";
    }
    const packageBtn = meta.id === "C-08"
      ? '<div class="btn-row"><button type="button" class="btn btn-primary" data-act="clear-package">Clear closing package</button></div><p class="prose">A named person must clear the package. The agent does not clear it alone.</p>'
      : "";
    const error = state.formError ? '<p class="err" id="form-error">' + esc(state.formError) + "</p>" : "";
    return '<div class="btn-row no-print"><button type="button" class="btn" data-act="nav" data-screen="board">Back to board</button></div>' +
      '<section class="card"><span class="kicker">' + esc(meta.id) + " · " + esc(item.agentName) + "</span><h2>" + esc(meta.title) + "</h2>" +
      '<div class="cond-top">' + '<span class="pill">' + esc(item.owner) + "</span>" + pill(item.status) + "</div>" +
      "<p>" + esc(item.summary) + "</p>" + statsHtml(fig) + "</section>" +
      notice +
      '<div class="trace-grid">' +
      '<section class="card decision">' + decisionBody + packageBtn + error + checkList(meta, item, fig) + "</section>" +
      '<section class="card source"><span class="kicker">Source</span><h3>' + esc(meta.doc.name) + "</h3><p>" + esc(meta.doc.page) + "</p>" +
      '<blockquote class="quote">' + esc(meta.doc.excerpt) + "</blockquote>" + fieldsTable(meta) + "</section>" +
      '<section class="card rule"><span class="kicker">Rule</span>' +
      (meta.rule
        ? "<h3>" + esc(meta.rule) + "</h3><p class=\"prose\">" + esc(guide) + "</p>"
        : "<h3>No guideline cited</h3><p class=\"prose\">The package is waiting, so there is no clear to cite.</p>") +
      (meta.id === "C-03"
        ? '<div class="agent-block"><span class="kicker">Rule that would change the call</span><h3>HL-UW 4.3.2</h3><p>' + esc(DATA.guidelines["HL-UW 4.3.2"]) + "</p></div>"
        : "") +
      "</section>" +
      extraPanels(meta) +
      "</div>";
  }

  function extraPanels(meta) {
    let html = "";
    if (state.panel === "override") html += overridePanel(meta);
    if (state.panel === "escalate" && !(meta.id === "C-05" && figures().limit < DATA.deposit.zelle)) html += escalatePanel(meta);
    return html;
  }

  function overridePanel(meta) {
    const isOt = meta.id === "C-03";
    const reasons = isOt ? DATA.reasons : ["Agent figure is wrong", "Document disagrees", "Other"];
    const options = reasons.map((reason) => {
      const on = state.overrideForm.reason === reason ? " selected" : "";
      return "<option" + on + ">" + esc(reason) + "</option>";
    }).join("");
    const valueField = isOt
      ? '<label class="field"><span class="label">Corrected monthly overtime</span><input id="ot-value" inputmode="numeric" type="text" value="' + esc(state.overrideForm.value) + '"></label>'
      : '<label class="field"><span class="label">Corrected value</span><input id="ov-other" type="text" value="' + esc(state.overrideForm.otherValue) + '"></label>';
    const box = isOt
      ? '<label class="check-hit"><input id="save-case" type="checkbox"' + (state.overrideForm.saveCase ? " checked" : "") + '> Save as regression case</label><p class="prose">Checked by default. Saving adds RC-12, a must-pass case, when this box stays on.</p>'
      : "<p class=\"prose\">This note stays on the condition and in the audit log. The income math changes only from the Casey overtime override.</p>";
    return '<section class="card extra" id="override-panel"><h2>Override</h2>' +
      (state.formError ? '<p class="err">' + esc(state.formError) + "</p>" : "") +
      '<label class="field"><span class="label">Reason</span><select id="ov-reason">' + options + "</select></label>" +
      valueField +
      '<label class="field"><span class="label">Note</span><textarea id="ov-note">' + esc(state.overrideForm.note) + "</textarea></label>" +
      box +
      (isOt ? '<div id="impact-live">' + impactInner() + "</div>" : "") +
      '<div class="btn-row"><button type="button" class="btn btn-primary" id="btn-save-override" data-act="save-override">Save override</button>' +
      '<button type="button" class="btn" data-act="close-panel">Cancel</button></div></section>';
  }

  function impactInner() {
    const before = figures();
    const typed = parseOt(state.overrideForm.value);
    if (typed === null) {
      return '<div class="impact"><h3>Live impact</h3><p class="err">Enter a whole number, such as 640.</p>' +
        "<p>Now: income " + money(before.income) + ", DTI " + pct(before.dti) + ", deposit limit " + money(before.limit) + ".</p></div>";
    }
    const after = calc(typed);
    const beforeC05 = before.limit < DATA.deposit.zelle ? "Over the limit" : "Under the limit";
    const afterC05 = after.limit < DATA.deposit.zelle ? "Reopens. $5,000 is over the limit." : "Stays cleared. $5,000 is not over the limit.";
    const cell = (title, fig, c05) => {
      const aus = ausText(fig.dti);
      return '<div class="impact-col"><span class="kicker">' + title + "</span>" +
        "<p>Income " + money(fig.income) + "</p>" +
        "<p>DTI " + pct(fig.dti) + "</p>" +
        "<p>Deposit limit " + money(fig.limit) + "</p>" +
        "<p>C-05 " + esc(c05) + "</p>" +
        (aus ? "<p>" + esc(aus) + "</p>" : "<p>No AUS flag</p>") +
        "</div>";
    };
    return '<div class="impact"><h3>Live impact</h3><p class="prose">Debts of ' + money(DATA.debts.total) + " divided by qualifying income. The deposit limit is half of monthly qualifying income.</p>" +
      '<div class="impact-cols">' + cell("Before", before, beforeC05) + cell("After", after, afterC05) + "</div></div>";
  }

  function escalatePanel(meta) {
    return '<section class="card extra" id="escalate-panel"><h2>Escalate ' + esc(meta.id) + "</h2>" +
      "<p class=\"prose\">This stays in the page. A person has to pick it up. Nothing is sent.</p>" +
      '<label class="field"><span class="label">Note</span><textarea id="esc-note">' + esc(state.escNote) + "</textarea></label>" +
      '<div class="btn-row"><button type="button" class="btn btn-primary" data-act="save-escalate">Escalate to a person</button>' +
      '<button type="button" class="btn" data-act="close-panel">Cancel</button></div></section>';
  }

  function renderRegression() {
    const version = state.regVersion;
    const list = allCases();
    const stats = versionStats(version);
    const groups = ["Income", "Asset", "Condition"].map((family) => {
      const rows = list.filter((row) => row.family === family);
      const cards = rows.map((row) => {
        const ok = casePass(row, version);
        return '<article class="card case-card" id="case-' + row.id + '">' +
          '<div class="cond-top"><span class="kicker">' + esc(row.id) + " · " + esc(row.family) + "</span>" +
          (row.mustPass ? '<span class="pill">Must-pass</span>' : "") +
          pill(ok ? "Pass" : "Fail") + "</div>" +
          "<h3>" + esc(row.title) + "</h3>" +
          "<p><strong>Input.</strong> " + esc(row.input) + "</p>" +
          "<p><strong>Agent answer (" + esc(version) + ").</strong> " + esc(shownAnswer(row, version)) + "</p>" +
          "<p><strong>Correct answer.</strong> " + esc(row.correct) + "</p>" +
          "<p><strong>Guideline.</strong> " + esc(row.rule) + ". " + esc(DATA.guidelines[row.rule] || "") + "</p>" +
          (row.fromOverride ? "<p>Added from the C-03 override on this loan.</p>" : "") +
          "</article>";
      }).join("");
      return "<h3>" + family + " (" + rows.length + ")</h3>" + cards;
    }).join("");
    return '<section class="card"><h2>Regression set</h2>' +
      '<p class="prose">Seeded results for Income Agent variable income, plus the asset and condition cases on this file. v1.4 is live. v1.5 is the candidate. Pick a version to read its seeded answers.</p>' +
      '<div class="choice-row">' +
      '<button type="button" class="choice" data-act="reg-version" data-version="v1.4" aria-pressed="' + (version === "v1.4" ? "true" : "false") + '">v1.4 live</button>' +
      '<button type="button" class="choice" data-act="reg-version" data-version="v1.5" aria-pressed="' + (version === "v1.5" ? "true" : "false") + '">v1.5 candidate</button>' +
      "</div>" +
      '<p id="reg-score"><strong>' + stats.pass + " of " + stats.total + "</strong> on " + esc(version) + ".</p>" +
      "</section>" + groups;
  }

  function checkLine(ok, text) {
    return '<p><strong class="' + (ok ? "pass" : "fail") + '">' + (ok ? "Pass" : "Fail") + ".</strong> " + esc(text) + "</p>";
  }

  function statsBlock(version, title) {
    const stats = versionStats(version);
    const mustText = stats.mustOk
      ? "Every must-pass case passes."
      : "Must-pass failed: " + stats.mustFail.join(", ") + ".";
    const rateLine = stats.samplePass + " of " + stats.sampleTotal + " on the seeded sample (" + rateText(stats.samplePass, stats.sampleTotal) + "). The line is 95% or better on 20 or more cases.";
    const ovLine = stats.overrideCount + " overrides in the last " + stats.overrideLoans + " loans (" + rateText(stats.overrideCount, stats.overrideLoans) + "). The line is under 5%.";
    return '<section class="card"><h3>' + esc(title) + "</h3>" +
      '<p id="' + (version === "v1.5" ? "score-v15" : "score-v14") + '"><strong>' + stats.pass + " of " + stats.total + "</strong> regression cases.</p>" +
      checkLine(stats.mustOk, mustText) +
      checkLine(stats.rateOk, rateLine) +
      checkLine(stats.ovOk, ovLine) +
      "</section>";
  }

  function renderGate() {
    const snap = model();
    const pause = snap.paused
      ? '<section class="card lock-box" id="pause-reason"><h2>Live task paused</h2><p>Paused: live v1.4 fails must-pass case RC-12.</p><p class="prose">Variable income was Auto on a share (25% of refi loans, 10% audit sample). It is now Person approves until a candidate passes the gate.</p></section>'
      : '<section class="card ready-box" id="pause-reason"><h2>Live task not paused</h2><p>Variable income is Auto on a share (25% of refi loans, 10% audit sample). No must-pass case is failing.</p></section>';
    const ladder = DATA.tasks.map((task) => {
      const pausedTask = task.id === "variable" && snap.paused;
      const level = pausedTask ? "Person approves" : task.level;
      return '<article class="rung' + (pausedTask ? " rung-paused" : "") + '">' +
        '<div class="rung-top"><h3>' + esc(task.name) + "</h3>" + pill(pausedTask ? "Paused" : level) + "</div>" +
        "<p>" + esc(task.version ? task.agent + " " + task.version : task.agent) + "</p>" +
        "<p>Live level: " + esc(level) + ". Confidence line: " + task.threshold + ".</p>" +
        (task.share ? "<p>Share: " + esc(task.share) + ".</p>" : "") +
        (pausedTask ? "<p>Paused: live v1.4 fails must-pass case RC-12.</p>" : "") +
        "</article>";
    }).join("");
    const ready = promoteReady();
    let promoteBlock;
    if (state.promote) {
      promoteBlock = '<p id="promote-note"><strong>Promote requested.</strong> ' + esc(state.promote.text) + "</p>";
    } else if (ready) {
      promoteBlock = '<div class="btn-row"><button type="button" class="btn btn-primary" id="request-promote" data-act="promote">Request promote</button></div>' +
        "<p>Promote needs the agent admin. This asks Lena Park. It does not turn the live task on.</p>";
    } else {
      const stats = versionStats("v1.5");
      const why = [];
      if (!stats.mustOk) why.push("a must-pass case fails");
      if (!stats.rateOk) why.push("the sample pass rate is short of the line");
      if (!stats.ovOk) why.push("the override rate is too high");
      promoteBlock = '<div class="btn-row"><button type="button" class="btn btn-primary" id="request-promote" data-act="promote" disabled>Request promote</button></div>' +
        "<p>Request promote stays off because " + esc(why.join(", ") || "the checks are not ready") + ".</p>";
    }
    return pause +
      '<section class="card"><h2>Rollout gate</h2>' +
      '<p class="prose">Ladder, in order: Shadow, Person approves, Auto on a share, Auto. A task moves up only when every must-pass case passes, the seeded sample is 95% or better on 20 or more cases, and the override rate is under 5% in the last 50 loans.</p>' +
      "<p class=\"prose\">The 24 case sample is seeded. The named cases you can open are on the regression screen. This loan's new override is in RC-12. It is not yet inside the last 50 funded loans.</p>" +
      roleSelect() +
      ladder +
      "</section>" +
      '<div class="gate-grid">' +
      statsBlock("v1.4", "Live Income Agent v1.4") +
      '<div>' + statsBlock("v1.5", "Candidate Income Agent v1.5") +
      '<section class="card">' + promoteBlock + "</section></div></div>";
  }

  function renderAudit() {
    const head = state.examiner
      ? '<section class="card"><h2>Examiner view</h2><p class="prose">Time, actor and version, sources, before, and after. This view is for a file review.</p><div class="btn-row no-print"><button type="button" class="btn" data-act="examiner-off">Desk view</button><button type="button" class="btn" data-act="print">Print</button></div></section>'
      : '<section class="card"><h2>Audit log</h2><p class="prose">Newest first. Each row has the actor and version, the sources, and the before and after.</p><div class="btn-row"><button type="button" class="btn btn-primary" data-act="examiner-on">Examiner view</button><button type="button" class="btn" data-act="print">Print</button></div></section>';
    const table = '<section class="card"><div class="table-wrap"><table class="audit-table"><thead><tr><th>Time</th><th>Actor and version</th><th>Sources</th><th>Before</th><th>After</th></tr></thead><tbody>' +
      state.log.map((row) => "<tr><td>" + esc(row.at) + "</td><td>" + esc(row.actor) + "</td><td>" + esc(row.sources) + "</td><td>" + esc(row.before) + "</td><td>" + esc(row.after) + "</td></tr>").join("") +
      "</tbody></table></div></section>";
    return head + table;
  }

  function render(opts) {
    const app = document.getElementById("app");
    const top = opts && opts.top;
    const y = top ? 0 : window.scrollY;
    let main = "";
    if (state.examiner) main = renderAudit();
    else if (state.screen === "trace") main = renderTrace();
    else if (state.screen === "regression") main = renderRegression();
    else if (state.screen === "gate") main = renderGate();
    else if (state.screen === "audit") main = renderAudit();
    else main = renderBoard();
    app.innerHTML = '<header class="topbar"><div class="brand"><h1>Condition Clear Desk</h1></div>' +
      '<button type="button" class="btn" data-act="reset">Reset demo</button></header>' +
      '<div class="wrap">' + navHtml() + bannerHtml() + main + footerHtml() + "</div>";
    window.scrollTo(0, y);
  }

  function readOverride() {
    const value = document.getElementById("ot-value");
    const other = document.getElementById("ov-other");
    const note = document.getElementById("ov-note");
    const box = document.getElementById("save-case");
    const reason = document.getElementById("ov-reason");
    if (value) state.overrideForm.value = value.value;
    if (other) state.overrideForm.otherValue = other.value;
    if (note) state.overrideForm.note = note.value;
    if (box) state.overrideForm.saveCase = box.checked;
    if (reason) state.overrideForm.reason = reason.value;
  }

  function saveOverride() {
    readOverride();
    const id = metaBy(state.conditionId).id;
    const who = role();
    if (id === "C-03") {
      const n = parseOt(state.overrideForm.value);
      if (n === null) {
        state.formError = "Enter a whole number, such as 640.";
        render();
        return;
      }
      const before = figures();
      const wasPaused = variablePaused();
      state.human["C-03"] = {
        type: "override",
        by: who.name,
        reason: state.overrideForm.reason,
        note: state.overrideForm.note,
        value: String(n),
        at: stamp()
      };
      const after = calc(n);
      let rcNote = "RC-12 was not added.";
      if (state.overrideForm.saveCase) {
        state.rc12 = { correct: n, by: who.name, at: stamp() };
        rcNote = "RC-12 added as a must-pass case.";
      }
      const beforeC05 = before.limit < DATA.deposit.zelle ? "C-05 over the limit." : "C-05 cleared.";
      const afterC05 = after.limit < DATA.deposit.zelle ? "C-05 reopened." : "C-05 stays cleared.";
      addLog({
        at: stamp(),
        actor: actorLine(),
        sources: "Written VOE, page 2. Fields ot_2024, ot_2025, ot_2026_ytd. HL-UW 4.3.2.",
        before: "Overtime " + money(before.ot) + ". Income " + money(before.income) + ". DTI " + pct(before.dti) + ". Deposit limit " + money(before.limit) + ". " + beforeC05,
        after: "Overtime " + money(after.ot) + ". Income " + money(after.income) + ". DTI " + pct(after.dti) + ". Deposit limit " + money(after.limit) + ". " + afterC05 + " " + rcNote
      });
      if (after.limit < DATA.deposit.zelle) {
        state.c05.clearedBy = null;
        addLog({
          at: stamp(),
          actor: "Asset Agent v2.1",
          sources: "Bank statement September page 1. Zelle $5,000. New limit " + money(after.limit) + ". HL-UW 5.2.1.",
          before: "C-05 cleared. Limit was " + money(before.limit) + ".",
          after: "C-05 reopened. $5,000 is over " + money(after.limit) + "."
        });
      }
      if (!wasPaused && variablePaused()) {
        addLog({
          at: stamp(),
          actor: "Rollout gate, v1.4",
          sources: "Regression case RC-12. HL-UW 4.3.2.",
          before: "Variable income was Auto on a share.",
          after: "Paused: live v1.4 fails must-pass case RC-12."
        });
      }
      state.panel = null;
      state.formError = "";
      const aus = ausText(after.dti);
      state.notice = "Saved. Overtime is " + money(n) + " a month. Income is " + money(after.income) + ". DTI is " + pct(after.dti) + ". Deposit limit is " + money(after.limit) + "." +
        (aus ? " " + aus : "") +
        (after.limit < DATA.deposit.zelle ? " C-05 reopened." : " C-05 stays cleared.") +
        (state.overrideForm.saveCase ? " RC-12 is in the regression set." : "");
      save();
      render({ top: true });
      return;
    }
    const corrected = state.overrideForm.otherValue.trim();
    if (!corrected) {
      state.formError = "Enter the corrected value.";
      render();
      return;
    }
    const item = model().items[id];
    state.human[id] = {
      type: "override",
      by: who.name,
      reason: state.overrideForm.reason,
      note: state.overrideForm.note,
      value: corrected,
      at: stamp()
    };
    if (id === "C-08") state.c08By = who.name;
    if (id === "C-05") state.c05.clearedBy = who.name;
    addLog({
      at: stamp(),
      actor: actorLine(),
      sources: metaBy(id).doc.name + ", " + metaBy(id).doc.page + ". " + (metaBy(id).rule || "No guideline."),
      before: item.status + ". " + item.summary,
      after: "Overridden by " + who.name + " to " + corrected + "."
    });
    state.panel = null;
    state.formError = "";
    state.notice = "Override saved by " + who.name + ".";
    save();
    render({ top: true });
  }

  function acceptCurrent() {
    const meta = metaBy(state.conditionId);
    const snap = model();
    const item = snap.items[meta.id];
    if (meta.id === "C-05" && snap.fig.limit < DATA.deposit.zelle && !state.c05.clearedBy) {
      state.formError = "Accept stays off while this deposit is over the limit. Use the escalation card.";
      state.screen = "trace";
      render();
      return;
    }
    if (meta.id === "C-08") {
      const wait = ["C-03", "C-05", "C-07"].filter((cid) => !snap.items[cid].satisfied);
      if (wait.length) {
        state.formError = "The package still waits on " + humanJoin(wait) + ".";
        render();
        return;
      }
      state.c08By = role().name;
    }
    state.human[meta.id] = { type: "accept", by: role().name, note: "", at: stamp() };
    addLog({
      at: stamp(),
      actor: actorLine(),
      sources: meta.doc.name + ", " + meta.doc.page + ". " + (meta.rule || "No guideline."),
      before: item.status + ". " + item.summary,
      after: "Accepted by " + role().name + "."
    });
    state.panel = null;
    state.formError = "";
    state.notice = "Accepted by " + role().name + ".";
    save();
    render({ top: true });
  }

  function saveEscalate() {
    const noteEl = document.getElementById("esc-note");
    if (noteEl) state.escNote = noteEl.value;
    const meta = metaBy(state.conditionId);
    const item = model().items[meta.id];
    state.human[meta.id] = { type: "escalate", by: role().name, note: state.escNote, at: stamp() };
    addLog({
      at: stamp(),
      actor: actorLine(),
      sources: meta.doc.name + ", " + meta.doc.page + ".",
      before: item.status + ". " + item.summary,
      after: "Escalated by " + role().name + "." + (state.escNote ? " Note: " + state.escNote : "")
    });
    state.panel = null;
    state.formError = "";
    state.notice = "Escalated by " + role().name + ". Nothing was sent.";
    save();
    render({ top: true });
  }

  function onClick(event) {
    const btn = event.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    if (act === "nav") {
      state.screen = btn.getAttribute("data-screen");
      state.examiner = false;
      state.formError = "";
      save();
      render({ top: true });
      return;
    }
    if (act === "open") {
      state.conditionId = btn.getAttribute("data-id");
      state.screen = "trace";
      state.panel = null;
      state.formError = "";
      state.examiner = false;
      save();
      render({ top: true });
      return;
    }
    if (act === "filter") {
      state[btn.getAttribute("data-key")] = btn.getAttribute("data-value");
      save();
      render();
      return;
    }
    if (act === "reset") {
      state = seed();
      save();
      render({ top: true });
      return;
    }
    if (act === "show-override") {
      state.panel = "override";
      state.formError = "";
      if (state.conditionId === "C-03" && state.human["C-03"] && state.human["C-03"].type === "override") {
        state.overrideForm.value = state.human["C-03"].value;
      }
      save();
      render();
      const panel = document.getElementById("override-panel");
      if (panel) panel.scrollIntoView({ block: "start" });
      return;
    }
    if (act === "show-escalate") {
      state.panel = "escalate";
      state.formError = "";
      save();
      render();
      return;
    }
    if (act === "close-panel") {
      state.panel = null;
      state.formError = "";
      save();
      render();
      return;
    }
    if (act === "save-override") return saveOverride();
    if (act === "accept") return acceptCurrent();
    if (act === "save-escalate") return saveEscalate();
    if (act === "esc-loe") {
      state.c05.action = "loe";
      state.notice = "Letter of explanation requested. The draft is on this page. Nothing is sent.";
      addLog({
        at: stamp(),
        actor: actorLine(),
        sources: "Bank statement September page 1. HL-UW 5.2.1.",
        before: "C-05 escalated. No letter requested.",
        after: "Letter of explanation requested by " + role().name + ". Nothing was sent."
      });
      save();
      render();
      return;
    }
    if (act === "esc-gift") {
      state.c05.action = "gift";
      state.notice = "Marked as a gift. A gift letter is still required. Nothing is sent.";
      addLog({
        at: stamp(),
        actor: actorLine(),
        sources: "Bank statement September page 1. HL-UW 5.2.1.",
        before: "C-05 escalated.",
        after: "Marked as a gift by " + role().name + ". Gift letter still required. Nothing was sent."
      });
      save();
      render();
      return;
    }
    if (act === "esc-agent") {
      state.c05.action = "agent";
      state.notice = "Sent back to Asset Agent v2.1. The agent cannot clear this while the deposit is over the limit.";
      addLog({
        at: stamp(),
        actor: actorLine(),
        sources: "Bank statement September page 1. HL-UW 5.2.1.",
        before: "C-05 escalated to a person.",
        after: "Sent back to Asset Agent v2.1. Agent did not clear it."
      });
      save();
      render();
      return;
    }
    if (act === "mark-sent") {
      const draft = document.getElementById("loe-draft");
      if (draft) state.c05.draft = draft.value;
      state.c05.markedSent = true;
      if (!state.c05.action) state.c05.action = "loe";
      state.notice = "Marked as sent (demo). Nothing left this page.";
      addLog({
        at: stamp(),
        actor: actorLine(),
        sources: "Escalation card draft. No outside message.",
        before: "C-05 open. Letter not marked sent.",
        after: "Marked as sent (demo). Nothing was sent. C-05 stays open."
      });
      save();
      render();
      return;
    }
    if (act === "clear-sourced") {
      state.c05.clearedBy = role().name;
      state.notice = "C-05 cleared by " + role().name + " with the letter on file (demo).";
      addLog({
        at: stamp(),
        actor: actorLine(),
        sources: "Letter of explanation draft marked received in this demo. HL-UW 5.2.1.",
        before: "C-05 waiting on a source.",
        after: "Cleared by " + role().name + "."
      });
      save();
      render({ top: true });
      return;
    }
    if (act === "clear-package") {
      const snap = model();
      const wait = ["C-03", "C-05", "C-07"].filter((cid) => !snap.items[cid].satisfied);
      if (wait.length) {
        state.formError = "The package still waits on " + humanJoin(wait) + ".";
        render();
        return;
      }
      state.c08By = role().name;
      state.human["C-08"] = { type: "clear", by: role().name, at: stamp() };
      addLog({
        at: stamp(),
        actor: actorLine(),
        sources: "Closing package checklist, page 1.",
        before: "C-08 open.",
        after: "Cleared by " + role().name + "."
      });
      state.notice = "Closing package cleared by " + role().name + ".";
      state.formError = "";
      save();
      render({ top: true });
      return;
    }
    if (act === "reg-version") {
      state.regVersion = btn.getAttribute("data-version");
      save();
      render();
      return;
    }
    if (act === "promote") {
      if (!promoteReady()) return;
      const text = role().id === "lena"
        ? "Lena Park requested promote for Income Agent v1.5. This demo does not flip the live task."
        : role().name + " requested promote for Income Agent v1.5. Lena Park, the agent admin, still has to approve. Nothing went live.";
      state.promote = { by: role().name, at: stamp(), text: text };
      addLog({
        at: stamp(),
        actor: actorLine(),
        sources: "Rollout gate checks on candidate v1.5. RC-12 and the seeded 24 case sample.",
        before: "Income Agent v1.4 is live. Variable income is paused.",
        after: text
      });
      save();
      render();
      return;
    }
    if (act === "examiner-on") {
      state.screen = "audit";
      state.examiner = true;
      save();
      render({ top: true });
      return;
    }
    if (act === "examiner-off") {
      state.examiner = false;
      state.screen = "audit";
      save();
      render({ top: true });
      return;
    }
    if (act === "print") window.print();
  }

  function onChange(event) {
    const target = event.target;
    if (target.classList && target.classList.contains("role-select")) {
      state.role = target.value;
      save();
      return;
    }
    if (target.id === "ov-reason") {
      state.overrideForm.reason = target.value;
      save();
      return;
    }
    if (target.id === "save-case") {
      state.overrideForm.saveCase = target.checked;
      save();
    }
  }

  function onInput(event) {
    const target = event.target;
    if (target.id === "ot-value") {
      state.overrideForm.value = target.value;
      const box = document.getElementById("impact-live");
      if (box) box.innerHTML = impactInner();
      save();
      return;
    }
    if (target.id === "ov-note") state.overrideForm.note = target.value;
    if (target.id === "ov-other") state.overrideForm.otherValue = target.value;
    if (target.id === "loe-draft") state.c05.draft = target.value;
    if (target.id === "esc-note") state.escNote = target.value;
    save();
  }

  const app = document.getElementById("app");
  app.addEventListener("click", onClick);
  app.addEventListener("change", onChange);
  app.addEventListener("input", onInput);
  render();
})();
