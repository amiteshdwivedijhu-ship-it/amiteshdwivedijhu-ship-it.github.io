(function () {
  const DATA = window.FINDING_DATA;
  const KEY = "alchemy-finding-to-training-v1";
  const SCREENS = [
    ["inbox", "Inbox"],
    ["detail", "Finding"],
    ["lesson", "Lesson"],
    ["assign", "Assign"],
    ["worker", "Worker"],
    ["floor", "Floor"],
    ["audit", "Audit packet"]
  ];

  function blankFinding() {
    return {
      rootCause: "",
      stepEdits: {},
      approved: false,
      approvedBy: "",
      approvedAt: "",
      spanishReviewed: false,
      spanishReviewedBy: "",
      spanishReviewedAt: "",
      assign: { lines: [], roles: [], shifts: [], delivery: "", due: "" },
      sim: null,
      liveSignoff: null,
      worker: { answers: {}, submitted: false, passed: false },
      observations: [],
      obsNote: "",
      obsWorker: "",
      closed: false,
      closedAt: ""
    };
  }

  function seedState() {
    const findings = {};
    DATA.findings.forEach((f) => { findings[f.id] = blankFinding(); });
    return { screen: "inbox", findingId: "F-1042", lang: "en", flash: "", findings: findings };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seedState();
      const saved = JSON.parse(raw);
      const base = seedState();
      if (!saved || !saved.findings) return base;
      DATA.findings.forEach((f) => {
        base.findings[f.id] = Object.assign(blankFinding(), saved.findings[f.id] || {});
        base.findings[f.id].assign = Object.assign(blankFinding().assign, (saved.findings[f.id] || {}).assign || {});
        base.findings[f.id].worker = Object.assign(blankFinding().worker, (saved.findings[f.id] || {}).worker || {});
      });
      base.screen = saved.screen || "inbox";
      base.findingId = saved.findingId || "F-1042";
      base.lang = saved.lang === "es" ? "es" : "en";
      base.flash = "";
      return base;
    } catch (err) {
      return seedState();
    }
  }

  let state = load();

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function finding(id) {
    return DATA.findings.find((f) => f.id === (id || state.findingId));
  }

  function fs() {
    return state.findings[state.findingId];
  }

  function nowStamp() {
    return new Date().toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
    });
  }

  function stepText(step, lang) {
    const edit = fs().stepEdits[step.id];
    if (edit && typeof edit[lang] === "string") return edit[lang];
    return step[lang];
  }

  function cite(f, step) {
    return f.sop.code + " " + f.sop.version + ", section " + step.section;
  }

  function assignedCount(assign) {
    if (!assign.lines.length || !assign.shifts.length || !assign.roles.length) return 0;
    let n = 0;
    assign.lines.forEach((line) => {
      assign.shifts.forEach((shift) => {
        n += (DATA.roster[line] && DATA.roster[line][shift]) || 0;
      });
    });
    if (assign.roles.length === DATA.roles.length) return n;
    const share = assign.roles.reduce((sum, role) => sum + (DATA.roleShare[role] || 0), 0);
    return Math.max(0, Math.round(n * share));
  }

  function completion(fstate) {
    if (fstate.sim) return { assigned: fstate.sim.assigned, passed: fstate.sim.passed, retries: fstate.sim.retries };
    const assigned = assignedCount(fstate.assign);
    const passed = fstate.liveSignoff && fstate.liveSignoff.passed ? 1 : 0;
    return { assigned: assigned, passed: passed, retries: 0 };
  }

  function closeChecks() {
    const f = finding();
    const st = fs();
    const reasons = [];
    if (!st.approved || !st.approvedBy) {
      reasons.push("A named supervisor has not approved the lesson. AI draft text cannot be published without that approval.");
    }
    const missing = f.steps.some((step) => !step.section || !f.sop.version || !f.sop.code);
    if (missing) reasons.push("Every lesson step needs an SOP section and version.");
    if (!st.spanishReviewed || !st.spanishReviewedBy) {
      reasons.push("The Spanish version is not marked reviewed by a bilingual reviewer.");
    }
    const comp = completion(st);
    if (!comp.assigned) {
      reasons.push("No workers are assigned yet, so the passing rate is not at 95%.");
    } else if (comp.passed / comp.assigned < 0.95) {
      const pct = Math.round((comp.passed / comp.assigned) * 100);
      reasons.push("Completion is " + pct + "% (" + comp.passed + " of " + comp.assigned + "). At least 95% must pass the check.");
    }
    const qualified = st.observations.filter((o) => o.result === "Qualified").length;
    if (qualified < 3) {
      reasons.push("Floor observations marked Qualified: " + qualified + ". You need at least 3.");
    }
    return { ok: reasons.length === 0, reasons: reasons, comp: comp, qualified: qualified };
  }

  function causeLabel(id) {
    const hit = DATA.causes.find((c) => c.id === id);
    return hit ? hit.label : "Not chosen yet";
  }

  function pill(text, kind) {
    return '<span class="pill pill-' + kind + '">' + esc(text) + "</span>";
  }

  function severityPill(sev) {
    return pill(sev, sev === "High" ? "high" : "medium");
  }

  function footer() {
    return '' +
      '<footer class="site-footer">' +
      '<p><a href="https://amiteshdwivedijhu-ship-it.github.io/" target="_blank" rel="noopener noreferrer">Prototype by Amitesh Dwivedi</a></p>' +
      '<p>Prototype for interview practice. Not affiliated with Intertek or Intertek Alchemy. Not an Intertek product. Synthetic plant, people, SOPs, and findings only. Not food safety advice.</p>' +
      "</footer>";
  }

  function chrome(body) {
    const nav = SCREENS.map(([id, label]) => {
      const current = state.screen === id ? ' aria-current="page"' : "";
      return '<button type="button" class="nav-btn" data-action="screen" data-screen="' + id + '"' + current + ">" + label + "</button>";
    }).join("");
    return '' +
      '<header class="topbar">' +
      '<div class="brand"><h1>Finding to Training</h1><p>' + esc(DATA.plant.name) + "</p></div>" +
      '<button type="button" class="btn btn-yellow" data-action="reset">Reset demo</button>' +
      "</header>" +
      '<div class="wrap">' +
      '<div class="banner" role="note"><p><strong>Sample data.</strong> ' + esc(DATA.plant.name) +
      " is a synthetic " + esc(DATA.plant.kind.toLowerCase()) + " plant. People, SOPs, and findings are fake. The lesson is a sample AI draft, not a live model.</p>" +
      "<p>QA lead " + esc(DATA.people.qa) + ". Supervisor " + esc(DATA.people.supervisor) + ". Bilingual reviewer " + esc(DATA.people.reviewer) + ".</p></div>" +
      '<nav class="screen-nav" aria-label="Screens">' + nav + "</nav>" +
      (state.flash ? '<p class="lock-box" role="status">' + esc(state.flash) + "</p>" : "") +
      body +
      footer() +
      "</div>";
  }

  function findingSelect() {
    const opts = DATA.findings.map((f) => {
      const sel = f.id === state.findingId ? " selected" : "";
      return '<option value="' + f.id + '"' + sel + ">" + f.id + "</option>";
    }).join("");
    return '<label class="field"><span>Open finding</span><select data-action="switch-finding">' + opts + "</select></label>";
  }

  function screenInbox() {
    const cards = DATA.findings.map((f) => {
      const st = state.findings[f.id];
      const status = st.closed ? "Closed" : (st.approved ? "Lesson approved" : "Open");
      return '<button type="button" class="finding-btn" data-action="open-finding" data-id="' + f.id + '">' +
        "<strong>" + esc(f.id) + ": " + esc(f.title) + "</strong>" +
        severityPill(f.severity) +
        pill(f.line, "draft") +
        pill(f.shift + " shift", "draft") +
        pill(f.source, "draft") +
        '<span class="meta">' + f.ageDays + " days open. Status: " + esc(status) + "</span>" +
        "</button>";
    }).join("");
    return "<h2>Findings inbox</h2><p class=\"measure\">Four open items at " + esc(DATA.plant.name) + ". " +
      DATA.plant.workers + " line workers. " + esc(DATA.plant.spanishFirst) + " are Spanish-first.</p>" + cards;
  }

  function screenDetail() {
    const f = finding();
    const st = fs();
    const causes = DATA.causes.map((c) => {
      const pressed = st.rootCause === c.id ? "true" : "false";
      return '<button type="button" class="choice" data-action="cause" data-id="' + c.id + '" aria-pressed="' + pressed + '">' + esc(c.label) + "</button>";
    }).join("");
    const excerpt = f.sop.excerpt.map((line) => "<li>" + esc(line) + "</li>").join("");
    return findingSelect() +
      "<h2>" + esc(f.id) + "</h2>" +
      "<p>" + esc(f.title) + "</p>" +
      "<p>" + severityPill(f.severity) + pill(f.line, "draft") + pill(f.shift + " shift", "draft") + pill(f.source, "draft") +
      '<span class="meta">Opened ' + esc(f.opened) + " (" + f.ageDays + " days)</span></p>" +
      '<article class="card"><h3>What happened</h3><p>' + esc(f.what) + "</p></article>" +
      '<article class="card"><h3>Root cause</h3><p>Pick one. This goes on the audit packet.</p><div class="choice-row">' + causes + "</div></article>" +
      '<article class="card"><h3>Linked SOP</h3><p><strong>' + esc(f.sop.code) + " " + esc(f.sop.version) + ", section " + esc(f.sop.section) + "</strong>. " + esc(f.sop.title) + ".</p>" +
      '<ol class="sop">' + excerpt + "</ol>" +
      '<button type="button" class="btn btn-primary" data-action="screen" data-screen="lesson">Open the sample lesson draft</button></article>';
  }

  function lessonColumn(f, lang) {
    const label = lang === "en" ? "English" : "Espanol";
    const active = state.lang === lang ? " active-lang" : "";
    const steps = f.steps.map((step, i) => {
      return '<div class="step-card"><p class="label">Step ' + (i + 1) + "</p>" +
        '<label class="field"><span>What to do</span>' +
        '<textarea data-field="step" data-step="' + step.id + '" data-lang="' + lang + '">' + esc(stepText(step, lang)) + "</textarea></label>" +
        "<p><strong>Why:</strong> The SOP says to do this before the line starts again.</p>" +
        "<p>" + pill(cite(f, step), "draft") + "</p></div>";
    }).join("");
    const questions = f.questions.map((q, i) => {
      return "<li><strong>" + (i + 1) + ". " + esc(q[lang]) + "</strong></li>";
    }).join("");
    return '<section class="col' + active + '" data-lang-col="' + lang + '"><h3>' + label + '</h3><p class="meta">Sample AI draft. A person must approve it before anyone on the floor sees it as published.</p>' +
      steps + "<h3>3-question check</h3><ol>" + questions + "</ol></section>";
  }

  function screenLesson() {
    const f = finding();
    const st = fs();
    const badge = st.approved
      ? pill("Approved by " + st.approvedBy + " at " + st.approvedAt, "good")
      : pill("Draft", "draft");
    const spanish = st.spanishReviewed
      ? pill("Spanish reviewed by " + st.spanishReviewedBy + " at " + st.spanishReviewedAt, "good")
      : pill("Spanish review not done", "warn");
    const enPressed = state.lang === "en" ? "true" : "false";
    const esPressed = state.lang === "es" ? "true" : "false";
    return findingSelect() +
      "<h2>Lesson draft</h2>" +
      '<p id="lesson-badge">' + badge + " " + spanish + "</p>" +
      '<div class="choice-row lang-toggle" role="group" aria-label="Language">' +
      '<button type="button" class="choice" data-action="lang" data-lang="en" aria-pressed="' + enPressed + '">English</button>' +
      '<button type="button" class="choice" data-action="lang" data-lang="es" aria-pressed="' + esPressed + '">Espanol</button></div>' +
      '<div class="bi">' + lessonColumn(f, "en") + lessonColumn(f, "es") + "</div>" +
      '<div class="btn-row" style="margin-top:12px">' +
      '<button type="button" class="btn btn-primary" data-action="approve">Approve as ' + esc(DATA.people.supervisor) + "</button>" +
      '<button type="button" class="btn" data-action="review-es">Mark Spanish reviewed (' + esc(DATA.people.reviewer) + ")</button>" +
      '<button type="button" class="btn" data-action="screen" data-screen="assign">Continue to assign</button></div>' +
      "<p class=\"meta\">Editing a line after approval returns the lesson to Draft.</p>";
  }

  function toggleList(items, selected, action, label) {
    return '<div class="choice-row" role="group" aria-label="' + esc(label) + '">' + items.map((item) => {
      const id = item.id || item;
      const text = item.label || item;
      const on = selected.indexOf(id) !== -1;
      return '<button type="button" class="choice" data-action="' + action + '" data-id="' + esc(id) + '" aria-pressed="' + (on ? "true" : "false") + '">' + esc(text) + "</button>";
    }).join("") + "</div>";
  }

  function screenAssign() {
    const st = fs();
    const count = assignedCount(st.assign);
    const delivery = ["Shift-start huddle", "On phone"].map((d) => {
      const on = st.assign.delivery === d;
      return '<button type="button" class="choice" data-action="delivery" data-id="' + esc(d) + '" aria-pressed="' + (on ? "true" : "false") + '">' + esc(d) + "</button>";
    }).join("");
    return findingSelect() +
      "<h2>Assign the lesson</h2>" +
      "<p>Pick who must finish it, how they get it, and the due date. Line 3 across all shifts is 48 people.</p>" +
      '<article class="card"><h3>Lines</h3>' + toggleList(DATA.lines, st.assign.lines, "toggle-line", "Lines") + "</article>" +
      '<article class="card"><h3>Roles</h3>' + toggleList(DATA.roles, st.assign.roles, "toggle-role", "Roles") + "</article>" +
      '<article class="card"><h3>Shifts</h3>' + toggleList(DATA.shifts.map((s) => ({ id: s, label: s + " shift" })), st.assign.shifts, "toggle-shift", "Shifts") + "</article>" +
      '<article class="card"><h3>Delivery</h3><div class="choice-row">' + delivery + "</div>" +
      '<label class="field" style="margin-top:12px"><span>Due date</span><input type="date" data-field="due" value="' + esc(st.assign.due) + '"></label>' +
      "<p><strong>" + count + "</strong> workers in this assignment.</p></article>" +
      '<div class="btn-row"><button type="button" class="btn btn-primary" data-action="simulate">Simulate shift</button>' +
      '<button type="button" class="btn" data-action="screen" data-screen="worker">Open worker phone view</button></div>' +
      (st.sim ? '<p class="ready-box">Shift simulation saved: ' + st.sim.passed + " of " + st.sim.assigned + " passed (" +
        Math.round((st.sim.passed / st.sim.assigned) * 100) + "%). " + st.sim.retries + " of those passes were retries.</p>" : "");
  }

  function screenWorker() {
    const f = finding();
    const st = fs();
    const lang = state.lang;
    const enPressed = lang === "en" ? "true" : "false";
    const esPressed = lang === "es" ? "true" : "false";
    const steps = f.steps.map((step, i) => {
      return '<article class="step-card"><p class="label">Step ' + (i + 1) + "</p><p>" + esc(stepText(step, lang)) + "</p><p>" +
        pill(cite(f, step), "draft") + "</p></article>";
    }).join("");
    const questions = f.questions.map((q) => {
      const opts = q.options.map((opt) => {
        const on = st.worker.answers[q.id] === opt.id;
        return '<button type="button" class="option" data-action="answer" data-q="' + q.id + '" data-id="' + opt.id + '" aria-pressed="' + (on ? "true" : "false") + '">' + esc(opt[lang]) + "</button>";
      }).join("");
      return '<article class="q-card"><h3>' + esc(q[lang]) + '</h3><div class="stack">' + opts + "</div></article>";
    }).join("");
    let result = "";
    if (st.worker.submitted && st.worker.passed) {
      result = '<p class="ready-box">Pass. You can sign off.</p>';
    } else if (st.worker.submitted) {
      result = '<p class="lock-box">Retry. One or more answers do not match the SOP. Read the steps and try again.</p>';
    }
    const signed = st.liveSignoff
      ? '<p class="ready-box">Signed off by ' + esc(st.liveSignoff.name) + " at " + esc(st.liveSignoff.at) + ".</p>"
      : "";
    return '<div class="worker-view">' +
      '<div class="choice-row lang-toggle" role="group" aria-label="Language">' +
      '<button type="button" class="choice" data-action="lang" data-lang="en" aria-pressed="' + enPressed + '">English</button>' +
      '<button type="button" class="choice" data-action="lang" data-lang="es" aria-pressed="' + esPressed + '">Espanol</button></div>' +
      "<h2>" + esc(f.id) + " lesson</h2>" +
      "<p>About 3 minutes. " + esc(DATA.people.demoWorker) + ", " + esc(f.line) + ", " + esc(f.shift) + " shift.</p>" +
      steps + questions + result +
      '<div class="stack">' +
      '<button type="button" class="btn btn-primary big-btn" data-action="grade">Check answers</button>' +
      '<button type="button" class="btn big-btn" data-action="signoff"' + (st.worker.passed ? "" : " disabled") + ">Sign off</button>" +
      '<button type="button" class="btn big-btn" data-action="retry-check">Retry check</button>' +
      "</div>" + signed + "</div>";
  }

  function screenFloor() {
    const st = fs();
    const workers = DATA.floorWorkers.filter((w) => {
      if (!st.assign.lines.length) return w.line === finding().line;
      return st.assign.lines.indexOf(w.line) !== -1;
    });
    const opts = workers.map((w) => {
      const sel = st.obsWorker === w.id ? " selected" : "";
      return '<option value="' + w.id + '"' + sel + ">" + esc(w.name) + " (" + esc(w.line) + ", " + esc(w.shift) + ")</option>";
    }).join("");
    const rows = st.observations.map((o) => {
      const kind = o.result === "Qualified" ? "good" : "bad";
      return "<li>" + pill(o.result, kind) + " <strong>" + esc(o.name) + "</strong> at " + esc(o.at) +
        (o.note ? ". " + esc(o.note) : "") + "</li>";
    }).join("");
    return findingSelect() +
      "<h2>Floor observation</h2>" +
      "<p>Watch the task on the floor. Mark Qualified or Needs retrain. You need at least 3 Qualified marks before the finding can close.</p>" +
      '<article class="card"><label class="field"><span>Worker</span><select data-field="obs-worker"><option value="">Choose a worker</option>' + opts + "</select></label>" +
      '<label class="field"><span>Note</span><textarea data-field="obs-note" placeholder="What you saw">' + esc(st.obsNote) + "</textarea></label>" +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-primary" data-action="observe" data-result="Qualified">Qualified</button>' +
      '<button type="button" class="btn" data-action="observe" data-result="Needs retrain">Needs retrain</button>' +
      "</div></article>" +
      "<h3>Observations</h3>" +
      (rows ? "<ul>" + rows + "</ul>" : "<p>None yet. For the sample shift, mark Luis, Carmen, and Mateo Qualified.</p>");
  }

  function screenAudit() {
    const f = finding();
    const st = fs();
    const checks = closeChecks();
    const comp = checks.comp;
    const pct = comp.assigned ? Math.round((comp.passed / comp.assigned) * 100) : 0;
    const checkList = [
      [st.approved && st.approvedBy, "Supervisor approval", st.approved ? "Approved by " + st.approvedBy + " at " + st.approvedAt : "Not approved."],
      [true, "SOP citation on every step", f.steps.map((s) => cite(f, s)).join(". ")],
      [st.spanishReviewed, "Spanish review", st.spanishReviewed ? "Reviewed by " + st.spanishReviewedBy + " at " + st.spanishReviewedAt : "Not reviewed."],
      [comp.assigned > 0 && comp.passed / comp.assigned >= 0.95, "95% passing completion", comp.assigned ? (comp.passed + " of " + comp.assigned + " (" + pct + "%). Retries: " + comp.retries + ".") : "Nobody is assigned."],
      [checks.qualified >= 3, "At least 3 Qualified observations", checks.qualified + " Qualified."]
    ].map((row) => {
      return '<li class="' + (row[0] ? "check-pass" : "check-fail") + '">' + (row[0] ? "Pass. " : "Not yet. ") + esc(row[1]) + ". " + esc(row[2]) + "</li>";
    }).join("");
    const obsRows = st.observations.map((o) => "<tr><td>" + esc(o.name) + "</td><td>" + esc(o.result) + "</td><td>" + esc(o.note || "") + "</td><td>" + esc(o.at) + "</td></tr>").join("");
    const version = Object.keys(st.stepEdits).length ? "Lesson v2, edited" : "Lesson v1, sample draft";
    const lock = checks.ok
      ? '<div class="ready-box"><p>All five checks pass. You can close the finding.</p></div>'
      : '<div class="lock-box"><p><strong>Close finding is locked.</strong></p><ul>' + checks.reasons.map((r) => "<li>" + esc(r) + "</li>").join("") + "</ul></div>";
    return findingSelect() +
      '<article class="card" id="packet">' +
      "<h2>Audit packet</h2>" +
      "<p>" + esc(DATA.plant.name) + ". Record for " + esc(f.id) + ".</p>" +
      "<p>" + severityPill(f.severity) + pill(st.closed ? "Closed" : "Open", st.closed ? "good" : "warn") + "</p>" +
      "<h3>Finding</h3><p>" + esc(f.title) + "</p><p>" + esc(f.what) + "</p>" +
      "<p>Line " + esc(f.line) + ", " + esc(f.shift) + " shift. Source: " + esc(f.source) + ". Opened " + esc(f.opened) + ".</p>" +
      "<h3>Root cause</h3><p>" + esc(causeLabel(st.rootCause)) + "</p>" +
      "<h3>Corrective action</h3><p>Retrain the assigned crew on " + esc(f.sop.code) + " " + esc(f.sop.version) + " section " + esc(f.sop.section) + " and check the work on the floor.</p>" +
      "<h3>Lesson</h3><p>" + esc(version) + ". " + (st.approved ? "Approved by " + esc(st.approvedBy) + " at " + esc(st.approvedAt) + "." : "Still a draft.") + "</p>" +
      "<ol>" + f.steps.map((s, i) => "<li>" + esc(stepText(s, "en")) + " (" + esc(cite(f, s)) + ")</li>").join("") + "</ol>" +
      "<h3>Assignment</h3><p>Lines: " + esc(st.assign.lines.join(", ") || "none") + ". Shifts: " + esc(st.assign.shifts.join(", ") || "none") +
      ". Roles: " + esc(st.assign.roles.join(", ") || "none") + ". Delivery: " + esc(st.assign.delivery || "not set") + ". Due: " + esc(st.assign.due || "not set") + ".</p>" +
      "<h3>Completion</h3><p>" + (comp.assigned ? comp.passed + " of " + comp.assigned + " passed (" + pct + "%)." : "No assignment yet.") + "</p>" +
      (st.liveSignoff ? "<p>Phone sign-off in this session: " + esc(st.liveSignoff.name) + " at " + esc(st.liveSignoff.at) + ".</p>" : "<p>No phone sign-off in this session yet.</p>") +
      "<h3>Floor observations</h3>" +
      (obsRows ? '<div class="table-wrap"><table><thead><tr><th>Worker</th><th>Result</th><th>Note</th><th>Time</th></tr></thead><tbody>' + obsRows + "</tbody></table></div>" : "<p>None yet.</p>") +
      "<h3>Approvals</h3><ul class=\"checks\">" + checkList + "</ul>" +
      (st.closed ? "<p><strong>Finding closed at " + esc(st.closedAt) + ".</strong></p>" : "") +
      '<p class="print-note" style="display:none">Synthetic record for interview practice. Not an Intertek product. Not food safety advice.</p>' +
      "</article>" +
      lock +
      '<div class="btn-row no-print" style="margin-top:12px">' +
      '<button type="button" class="btn btn-primary" data-action="close"' + (checks.ok && !st.closed ? "" : " disabled") + ">Close finding</button>" +
      '<button type="button" class="btn" data-action="simulate">Simulate shift</button>' +
      '<button type="button" class="btn" data-action="print">Print packet</button></div>';
  }

  function render() {
    const screens = {
      inbox: screenInbox,
      detail: screenDetail,
      lesson: screenLesson,
      assign: screenAssign,
      worker: screenWorker,
      floor: screenFloor,
      audit: screenAudit
    };
    const fn = screens[state.screen] || screenInbox;
    document.getElementById("app").innerHTML = chrome(fn());
  }

  function toggleIn(list, id) {
    const i = list.indexOf(id);
    if (i === -1) list.push(id);
    else list.splice(i, 1);
  }

  function clearApproval() {
    const st = fs();
    if (!st.approved) return;
    st.approved = false;
    st.approvedBy = "";
    st.approvedAt = "";
  }

  function onClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const st = fs();
    if (action !== "reset") state.flash = "";
    if (action === "reset") {
      localStorage.removeItem(KEY);
      state = seedState();
      save();
      render();
      return;
    }
    if (action === "screen") {
      state.screen = btn.dataset.screen;
      save();
      render();
      return;
    }
    if (action === "open-finding") {
      state.findingId = btn.dataset.id;
      state.screen = "detail";
      save();
      render();
      return;
    }
    if (action === "lang") {
      state.lang = btn.dataset.lang;
      save();
      render();
      return;
    }
    if (action === "cause") {
      st.rootCause = btn.dataset.id;
      save();
      render();
      return;
    }
    if (action === "approve") {
      st.approved = true;
      st.approvedBy = DATA.people.supervisor;
      st.approvedAt = nowStamp();
      save();
      render();
      return;
    }
    if (action === "review-es") {
      st.spanishReviewed = true;
      st.spanishReviewedBy = DATA.people.reviewer;
      st.spanishReviewedAt = nowStamp();
      save();
      render();
      return;
    }
    if (action === "toggle-line") {
      toggleIn(st.assign.lines, btn.dataset.id);
      save();
      render();
      return;
    }
    if (action === "toggle-role") {
      toggleIn(st.assign.roles, btn.dataset.id);
      save();
      render();
      return;
    }
    if (action === "toggle-shift") {
      toggleIn(st.assign.shifts, btn.dataset.id);
      save();
      render();
      return;
    }
    if (action === "delivery") {
      st.assign.delivery = btn.dataset.id;
      save();
      render();
      return;
    }
    if (action === "simulate") {
      const n = assignedCount(st.assign);
      if (!n) {
        state.flash = "Assign at least one line, one role, and one shift first.";
        save();
        render();
        return;
      }
      state.flash = "";
      const passed = n === 48 ? 46 : Math.max(1, Math.round(n * 0.96));
      st.sim = { assigned: n, passed: Math.min(n, passed), retries: n >= 10 ? 2 : 0 };
      save();
      render();
      return;
    }
    if (action === "answer") {
      st.worker.answers[btn.dataset.q] = btn.dataset.id;
      st.worker.submitted = false;
      st.worker.passed = false;
      save();
      render();
      return;
    }
    if (action === "grade") {
      const f = finding();
      const all = f.questions.every((q) => st.worker.answers[q.id]);
      if (!all) {
        state.flash = "Answer all 3 questions first.";
        save();
        render();
        return;
      }
      state.flash = "";
      st.worker.submitted = true;
      st.worker.passed = f.questions.every((q) => st.worker.answers[q.id] === q.correct);
      save();
      render();
      return;
    }
    if (action === "retry-check") {
      st.worker = { answers: {}, submitted: false, passed: false };
      save();
      render();
      return;
    }
    if (action === "signoff") {
      if (!st.worker.passed) return;
      st.liveSignoff = { name: DATA.people.demoWorker, at: nowStamp(), passed: true, lang: state.lang };
      save();
      render();
      return;
    }
    if (action === "observe") {
      if (!st.obsWorker) {
        state.flash = "Choose a worker first.";
        save();
        render();
        return;
      }
      state.flash = "";
      const person = DATA.floorWorkers.find((w) => w.id === st.obsWorker);
      const existing = st.observations.find((o) => o.workerId === person.id);
      const row = {
        workerId: person.id,
        name: person.name,
        result: btn.dataset.result,
        note: st.obsNote.trim(),
        at: nowStamp()
      };
      if (existing) Object.assign(existing, row);
      else st.observations.push(row);
      save();
      render();
      return;
    }
    if (action === "close") {
      const checks = closeChecks();
      if (!checks.ok || st.closed) return;
      st.closed = true;
      st.closedAt = nowStamp();
      save();
      render();
      return;
    }
    if (action === "print") {
      window.print();
    }
  }

  function onChange(e) {
    const t = e.target;
    const st = fs();
    if (t.dataset.action === "switch-finding") {
      state.findingId = t.value;
      save();
      render();
      return;
    }
    if (t.dataset.field === "due") {
      st.assign.due = t.value;
      save();
    }
    if (t.dataset.field === "obs-worker") {
      st.obsWorker = t.value;
      save();
    }
  }

  function onInput(e) {
    const t = e.target;
    const st = fs();
    if (t.dataset.field === "step") {
      if (!st.stepEdits[t.dataset.step]) st.stepEdits[t.dataset.step] = {};
      st.stepEdits[t.dataset.step][t.dataset.lang] = t.value;
      clearApproval();
      const badge = document.getElementById("lesson-badge");
      if (badge) {
        badge.innerHTML = pill("Draft", "draft") + " " + (st.spanishReviewed
          ? pill("Spanish reviewed by " + st.spanishReviewedBy + " at " + st.spanishReviewedAt, "good")
          : pill("Spanish review not done", "warn"));
      }
      save();
      return;
    }
    if (t.dataset.field === "obs-note") {
      st.obsNote = t.value;
      save();
    }
  }

  const app = document.getElementById("app");
  app.addEventListener("click", onClick);
  app.addEventListener("change", onChange);
  app.addEventListener("input", onInput);
  render();
})();
