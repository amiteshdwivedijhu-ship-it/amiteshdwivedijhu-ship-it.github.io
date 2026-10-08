(function () {
  "use strict";

  const DATA = window.DUET_DATA;
  const KEY = "duet-clinic-launch-desk-v1";
  const SCREENS = [
    ["cohort", "Cohort"],
    ["plan", "Launch plan"],
    ["golive", "Go-live"],
    ["week", "This week"],
    ["ninety", "First 90 days"],
    ["metrics", "Metrics"]
  ];

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  function stamp() {
    const d = new Date();
    let h = d.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    const min = String(d.getMinutes()).padStart(2, "0");
    return "Oct 8, 2026, " + h + ":" + min + " " + ampm;
  }

  function seed() {
    const suggestions = {};
    DATA.suggestions.forEach((s) => {
      suggestions[s.id] = {
        status: "pending",
        draft: s.draft,
        saved: s.draft,
        reason: "",
        editing: false,
        dismissing: false,
        sent: false,
        error: ""
      };
    });
    const tasks = {};
    DATA.tasks.forEach((t) => { tasks[t.id] = false; });
    return {
      screen: "cohort",
      practiceId: "birchwood",
      stageFilter: "All",
      statusFilter: "All",
      suggestions: suggestions,
      tasks: tasks,
      feeLoaded: false,
      ask: {
        draft: "Maya, I have a question about the Harbor hold.",
        sentText: "",
        sent: false
      },
      notice: "",
      log: DATA.seedLog.map((row) => Object.assign({}, row))
    };
  }

  function load() {
    const base = seed();
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return base;
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return base;
      if (SCREENS.some((s) => s[0] === saved.screen)) base.screen = saved.screen;
      if (DATA.practices.some((p) => p.id === saved.practiceId)) base.practiceId = saved.practiceId;
      if (saved.stageFilter === "All" || DATA.stages.indexOf(saved.stageFilter) !== -1) {
        base.stageFilter = saved.stageFilter;
      }
      if (saved.statusFilter === "All" || DATA.statuses.indexOf(saved.statusFilter) !== -1) {
        base.statusFilter = saved.statusFilter;
      }
      if (saved.suggestions && typeof saved.suggestions === "object") {
        Object.keys(base.suggestions).forEach((id) => {
          const row = saved.suggestions[id];
          if (!row) return;
          if (row.status === "pending" || row.status === "approved" || row.status === "dismissed") {
            base.suggestions[id].status = row.status;
          }
          if (typeof row.draft === "string") base.suggestions[id].draft = row.draft;
          if (typeof row.saved === "string") base.suggestions[id].saved = row.saved;
          if (typeof row.reason === "string") base.suggestions[id].reason = row.reason;
          base.suggestions[id].sent = !!row.sent;
        });
      }
      if (saved.tasks && typeof saved.tasks === "object") {
        Object.keys(base.tasks).forEach((id) => { base.tasks[id] = !!saved.tasks[id]; });
      }
      base.feeLoaded = !!saved.feeLoaded;
      if (saved.ask && typeof saved.ask === "object") {
        if (typeof saved.ask.draft === "string") base.ask.draft = saved.ask.draft;
        if (typeof saved.ask.sentText === "string") base.ask.sentText = saved.ask.sentText;
        base.ask.sent = !!saved.ask.sent;
      }
      if (typeof saved.notice === "string") base.notice = saved.notice;
      if (Array.isArray(saved.log) && saved.log.length) base.log = saved.log;
      return base;
    } catch (err) {
      return base;
    }
  }

  let state = load();

  function save() {
    try {
    const copy = JSON.parse(JSON.stringify(state));
    Object.keys(copy.suggestions).forEach((id) => {
      copy.suggestions[id].editing = false;
      copy.suggestions[id].dismissing = false;
      copy.suggestions[id].error = "";
    });
    localStorage.setItem(KEY, JSON.stringify(copy));
    } catch (err) { /* this demo keeps working if storage is blocked */ }
  }

  function addLog(actor, action, detail) {
    state.log.unshift({ time: stamp(), actor: actor, action: action, detail: detail });
  }

  function practiceById(id) {
    return DATA.practices.find((p) => p.id === id) || DATA.practices[0];
  }

  function birch() {
    const s1 = state.suggestions.s1.status === "approved";
    const s2 = state.suggestions.s2.status === "approved";
    const s1off = state.suggestions.s1.status === "dismissed";
    const caqh = !!state.tasks.caqh;
    let status = "At risk";
    let statusDetail = "Harbor paused";
    let firstPatient = "Nov 14";
    let firstNote = "Target Nov 2";
    let why = "The first patient is Nov 14, twelve days after the Nov 2 target, because Harbor Community Plan paused review on Oct 2 when the CAQH attestation expired Sep 30, and Harbor needs about 5 weeks from a complete file.";
    let blocker = "Harbor paused review. CAQH attestation expired Sep 30.";
    if (caqh) {
      blocker = "Harbor paused review. Rosa marked the CAQH re-attest done.";
      statusDetail = "Harbor paused, CAQH marked done";
    }
    if (s1 && !s2) {
      statusDetail = caqh ? "Re-attest approved, CAQH marked done" : "Re-attest approved, still at Harbor";
    }
    if (s1off && !s2) statusDetail = "Harbor paused, re-attest dismissed";
    if (s2 && !s1) {
      firstPatient = "Nov 2";
      firstNote = "Full payer go-live not pinned";
      statusDetail = s1off ? "Opened Nov 2, re-attest dismissed" : "Opened Nov 2, re-attest not approved";
      blocker = "First patient is Nov 2 only if Harbor's Nov 14 estimate still holds. The re-attest draft is not approved.";
      why = s1off
        ? "The first patient is Nov 2 on approved payers, and full payer go-live is not pinned to Nov 14, because the CAQH re-attest draft was dismissed."
        : "The first patient is Nov 2 on approved payers, and Birchwood stays At risk until the CAQH re-attest draft is approved so Harbor can still land on Nov 14.";
    }
    if (s1 && s2) {
      status = "On track";
      statusDetail = "Open on approved payers";
      firstPatient = "Nov 2";
      firstNote = "Full payer go-live Nov 14";
      blocker = "Harbor still estimated Nov 14. First patient does not wait on Harbor.";
      why = "The first patient is Nov 2 for Medicare, Pinecrest, and self-pay, and full payer go-live is Nov 14, because Maya approved opening on approved payers while Harbor finishes.";
    }
    return {
      s1: s1,
      s2: s2,
      caqh: caqh,
      status: status,
      statusDetail: statusDetail,
      firstPatient: firstPatient,
      firstNote: firstNote,
      why: why,
      blocker: blocker,
      visit: s2 ? "Nov 2" : "Nov 14"
    };
  }

  function viewPractice(p) {
    if (p.id !== "birchwood") return p;
    const b = birch();
    return Object.assign({}, p, {
      status: b.status,
      statusDetail: b.statusDetail,
      firstPatient: b.firstPatient,
      firstNote: b.firstNote,
      blocker: b.blocker
    });
  }

  function visiblePractices() {
    return DATA.practices.map(viewPractice).filter((p) => {
      if (state.stageFilter !== "All" && p.stage !== state.stageFilter) return false;
      if (state.statusFilter !== "All" && p.status !== state.statusFilter) return false;
      return true;
    });
  }

  function pill(status) {
    const key = status === "On track" ? "on-track"
      : status === "At risk" ? "at-risk"
      : status === "Blocked" ? "blocked"
      : status === "Live" ? "live"
      : status === "Pass" ? "pass"
      : status === "Fail" ? "fail"
      : status === "Not open" ? "wait"
      : "idle";
    return "<span class=\"pill " + key + "\">" + esc(status) + "</span>";
  }

  function gates() {
    const b = birch();
    const visit = b.visit;
    const medicare = [
      { n: "1", name: "Enrollment approved, effective on or before the visit", result: "Pass", reason: "Approved. Effective Oct 1, which is on or before " + visit + "." },
      { n: "2", name: "Payer ID mapped in the EHR and clearinghouse", result: "Pass", reason: "Mapped for Medicare (simulated)." },
      { n: "3", name: "Fee schedule loaded", result: "Pass", reason: "Medicare fee schedule is loaded." },
      { n: "4", name: "Rendering NP linked to the group", result: "Pass", reason: "Rosa Delgado is linked to the group." }
    ];
    const pinecrest = [
      { n: "1", name: "Enrollment approved, effective on or before the visit", result: "Pass", reason: "Approved Sep 28. Effective Nov 1, which is on or before " + visit + "." },
      { n: "2", name: "Payer ID mapped in the EHR and clearinghouse", result: "Pass", reason: "Pinecrest payer ID is mapped." },
      {
        n: "3",
        name: "Fee schedule loaded",
        result: state.feeLoaded ? "Pass" : "Fail",
        reason: state.feeLoaded
          ? "Maya marked the Pinecrest fee schedule loaded in this demo."
          : "Fee schedule is not loaded. Owner: Duet billing. Due Oct 20."
      },
      { n: "4", name: "Rendering NP linked to the group", result: "Pass", reason: "Rosa Delgado is linked to the group." }
    ];
    const harborNote = b.caqh
      ? "Rosa marked the re-attest done on her phone. Harbor has not approved the file."
      : "Portal note Oct 2: CAQH attestation expired 09/30/2026. Application on hold.";
    const harbor = [
      { n: "1", name: "Enrollment approved, effective on or before the visit", result: "Fail", reason: "Enrollment is not approved. " + harborNote },
      { n: "2", name: "Payer ID mapped in the EHR and clearinghouse", result: "Not open", reason: "Not mapped while enrollment is paused." },
      { n: "3", name: "Fee schedule loaded", result: "Not open", reason: "No fee schedule while enrollment is paused." },
      { n: "4", name: "Rendering NP linked to the group", result: "Not open", reason: "Rendering NP is not linked at Harbor yet." }
    ];
    return [
      { id: "medicare", name: "Medicare (simulated)", meta: "Approved. Effective Oct 1.", gates: medicare },
      { id: "pinecrest", name: "Pinecrest Health Plan", meta: "Approved. Effective Nov 1. Commercial, sample plan.", gates: pinecrest },
      { id: "harbor", name: "Harbor Community Plan", meta: "Review paused. Medicaid MCO, sample plan. Turnaround about 5 weeks from a complete file.", gates: harbor }
    ];
  }

  function slotFor(rows) {
    const bad = rows.find((g) => g.result !== "Pass");
    if (!bad) return { ok: true, text: "Can book insured", reason: "All 4 gates pass for this visit." };
    return { ok: false, text: "Book as self-pay or wait", reason: bad.reason };
  }

  function bookingCopy(b) {
    const pine = state.feeLoaded
      ? "Pinecrest passes all 4 gates, so those members can book insured."
      : "Pinecrest fails gate 3, so those members see Book as self-pay or wait until the fee schedule is loaded.";
    if (!b.s2) {
      return "The projected first patient is " + b.firstPatient + " because the plan still waits on Harbor. Medicare passes all 4 gates. " + pine + " Harbor fails gate 1.";
    }
    return "Day-one booking plan: open Nov 2 for Medicare and self-pay. Full payer go-live is Nov 14. " + pine + " Harbor members see Book as self-pay or wait until enrollment is approved, estimated Nov 14 if Rosa re-attests by Oct 10.";
  }

  function milestones() {
    const b = birch();
    const t = state.tasks;
    const s3 = state.suggestions.s3.status === "approved";
    let feeNote = state.feeLoaded
      ? "Maya marked the Pinecrest fee schedule loaded in this demo."
      : "Pinecrest fee schedule is not loaded. Due Oct 20.";
    if (s3 && !state.feeLoaded) feeNote += " Maya approved a note to Duet billing. The file is not loaded yet.";
    return [
      {
        stage: "Business setup",
        target: "Target 14 days. Done.",
        items: [
          { name: "Form the practice and get the EIN", owner: "NP", status: "Done", due: "Aug 12", note: "Done Aug 11.", critical: false },
          { name: "Group NPI", owner: "NP", status: "Done", due: "Aug 16", note: "NPI is on the launch file.", critical: false },
          { name: "Malpractice policy in the group name", owner: "NP", status: "Done", due: "Aug 18", note: "Policy name matches Rosa Delgado.", critical: false }
        ]
      },
      {
        stage: "Credentialing and payer enrollment",
        target: "Target 75 days. Day 51. This stage is the critical path.",
        items: [
          {
            name: "CAQH profile and attestation",
            owner: "NP",
            status: t.caqh ? "NP marked done" : "At risk",
            due: "Oct 10",
            note: t.caqh
              ? "Rosa marked this done on Oct 8 from her phone. Maya still needs the portal to show a new attestation before Harbor will review."
              : "Attestation expired Sep 30. Harbor will not review until this is current.",
            critical: true
          },
          { name: "Medicare enrollment (simulated)", owner: "Payer", status: "Approved", due: "Effective Oct 1", note: "All 4 go-live gates pass.", critical: false },
          { name: "Pinecrest Health Plan enrollment", owner: "Payer", status: "Approved", due: "Effective Nov 1", note: "Approval letter dated Sep 28. Fee schedule is still open.", critical: false },
          {
            name: "Harbor Community Plan enrollment",
            owner: "Payer",
            status: "Paused",
            due: "Est. Nov 14",
            note: "Portal note Oct 2: CAQH attestation expired 09/30/2026. Application on hold. About 5 weeks from a complete file. If Rosa re-attests by Oct 10, the estimate stays Nov 14.",
            critical: true
          },
          { name: "Link rendering NP to the group", owner: "Advisor", status: "In progress", due: "Oct 17", note: "Linked for Medicare and Pinecrest. Harbor waits on approval.", critical: false }
        ]
      },
      {
        stage: "EHR and billing setup",
        target: "Target 21 days. Runs in parallel. Day 18.",
        items: [
          { name: "Map payer IDs in the EHR", owner: "Duet billing", status: "Done", due: "Oct 6", note: "Medicare and Pinecrest are mapped.", critical: false },
          { name: "Map payer IDs in the clearinghouse", owner: "Duet billing", status: "Done", due: "Oct 6", note: "Medicare and Pinecrest are mapped.", critical: false },
          { name: "Load fee schedules", owner: "Duet billing", status: state.feeLoaded ? "Done" : "At risk", due: "Oct 20", note: feeNote, critical: false },
          {
            name: "Website draft",
            owner: "Advisor",
            status: t.website ? "Done" : "Waiting on NP",
            due: "This week",
            note: t.website ? "Rosa approved the website draft from her phone." : "Waiting on Rosa to approve the draft.",
            critical: false
          }
        ]
      },
      {
        stage: "Go-live readiness",
        target: "Target 7 days. Not started as a stage.",
        items: [
          {
            name: "Pick the Nov 2 opening hours",
            owner: "NP",
            status: t.hours ? "Done" : "Not started",
            due: "This week",
            note: t.hours ? "Rosa picked the Nov 2 hours from her phone." : "Rosa has not picked hours yet.",
            critical: false
          },
          {
            name: "Claim Google Business Profile",
            owner: "NP",
            status: t.gbp ? "Done" : "Not started",
            due: "This week",
            note: t.gbp ? "Rosa marked the Google Business Profile claimed." : "Listing is not claimed yet.",
            critical: false
          },
          {
            name: "Day-one slot rules",
            owner: "Advisor",
            status: b.s2 ? "Approved" : "In progress",
            due: "Oct 18",
            note: b.s2
              ? "Open Nov 2 for Medicare, Pinecrest, and self-pay. Book Harbor members from Nov 14."
              : "Waiting on the decision to open on approved payers.",
            critical: false
          }
        ]
      }
    ];
  }

  function suggestionMeta(id) {
    return DATA.suggestions.find((s) => s.id === id);
  }

  function approveNotice(id) {
    const b = birch();
    if ((id === "s1" || id === "s2") && b.s1 && b.s2) {
      return "Approved. Birchwood is On track. First patient is Nov 2. Full payer go-live is Nov 14. Nothing was sent.";
    }
    if (id === "s1") return "Approved the re-attest draft. Harbor stays estimated at Nov 14. Approve the open-on-approved-payers plan to move the first patient to Nov 2. Nothing was sent.";
    if (id === "s2") return "Approved the plan to open on Nov 2. Birchwood stays At risk until you also approve the CAQH re-attest draft. Nothing was sent.";
    if (id === "s3") return "Approved the note to Duet billing. Gate 3 stays open until the fee schedule is marked loaded. Nothing was sent.";
    return "Approved. Nothing was sent.";
  }

  function renderSuggestion(meta) {
    const s = state.suggestions[meta.id];
    let body = "";
    body += "<p class=\"label\">What I saw</p><p>" + esc(meta.source) + "</p>";
    body += "<p class=\"label\">What I suggest</p><p>" + esc(meta.suggest) + "</p>";
    body += "<p class=\"label\">Draft</p>";
    if (s.editing) {
      body += "<textarea data-bind=\"draft-" + meta.id + "\" aria-label=\"Edit draft\">" + esc(s.draft) + "</textarea>";
    } else {
      body += "<p>" + esc(s.draft) + "</p>";
    }
    body += "<p class=\"label\">Effect on date</p><p>" + esc(meta.effect) + "</p>";
    if (meta.id === "s3") {
      body += "<p>Approving this note does not load the fee schedule. Gate 3 stays open until Duet billing marks it loaded.</p>";
    }
    if (meta.id === "s1" && state.tasks.caqh) {
      body += "<p>Rosa tapped I did it on CAQH from her phone.</p>";
    }
    if (s.error) body += "<p class=\"slot-no\">" + esc(s.error) + "</p>";
    if (s.status === "dismissed") {
      body += "<p>Status: Dismissed. Reason: " + esc(s.reason) + "</p>";
      return "<article class=\"card assist-card\"><h3>Suggestion " + esc(meta.id.slice(1)) + "</h3>" + body + "</article>";
    }
    body += "<div class=\"actions\">";
    if (s.status !== "approved") {
      body += "<button class=\"btn primary\" type=\"button\" data-act=\"approve\" data-id=\"" + meta.id + "\">Approve</button>";
    } else {
      body += "<button class=\"btn\" type=\"button\" disabled>Approved</button>";
    }
    if (!s.sent) {
      if (s.editing) {
        body += "<button class=\"btn primary\" type=\"button\" data-act=\"save-edit\" data-id=\"" + meta.id + "\">Save edit</button>";
        body += "<button class=\"btn\" type=\"button\" data-act=\"cancel-edit\" data-id=\"" + meta.id + "\">Cancel edit</button>";
      } else {
        body += "<button class=\"btn\" type=\"button\" data-act=\"edit\" data-id=\"" + meta.id + "\">Edit</button>";
      }
    }
    if (s.status === "pending" && !s.dismissing) {
      body += "<button class=\"btn\" type=\"button\" data-act=\"dismiss\" data-id=\"" + meta.id + "\">Dismiss</button>";
    }
    const sentDisabled = s.status === "approved" ? "" : " disabled";
    if (s.sent) {
      body += "<button class=\"btn\" type=\"button\" disabled>Marked as sent</button>";
    } else {
      body += "<button class=\"btn\" type=\"button\" data-act=\"sent\" data-id=\"" + meta.id + "\"" + sentDisabled + ">Mark as sent (demo)</button>";
    }
    body += "</div>";
    if (s.dismissing) {
      body += "<p class=\"label\">Why dismiss this?</p>";
      body += "<textarea data-bind=\"reason-" + meta.id + "\" aria-label=\"Dismiss reason\">" + esc(s.reason) + "</textarea>";
      body += "<div class=\"actions\">";
      body += "<button class=\"btn primary\" type=\"button\" data-act=\"confirm-dismiss\" data-id=\"" + meta.id + "\">Confirm dismiss</button>";
      body += "<button class=\"btn\" type=\"button\" data-act=\"cancel-dismiss\" data-id=\"" + meta.id + "\">Cancel</button>";
      body += "</div>";
    }
    if (s.sent) body += "<p>Marked as sent in this demo. Nothing was sent.</p>";
    else if (s.status !== "approved") body += "<p>Mark as sent stays off until you approve. It never sends.</p>";
    else body += "<p>Mark as sent (demo) does not send this draft.</p>";
    return "<article class=\"card assist-card\"><h3>Suggestion " + esc(meta.id.slice(1)) + "</h3>" + body + "</article>";
  }

  function renderCohort() {
    const rows = visiblePractices();
    let html = "<h2>Fall cohort</h2>";
    html += "<p>8 launching practices. Days in stage use the sample playbook targets. Open a practice for its launch plan.</p>";
    html += "<div class=\"filters\">";
    html += "<p class=\"label\">Stage</p><div class=\"chip-row\">";
    html += chip("stage", "All", state.stageFilter === "All");
    DATA.stages.forEach((stage) => { html += chip("stage", stage, state.stageFilter === stage); });
    html += "</div><p class=\"label\">Status</p><div class=\"chip-row\">";
    html += chip("status", "All", state.statusFilter === "All");
    DATA.statuses.forEach((status) => { html += chip("status", status, state.statusFilter === status); });
    html += "</div></div>";
    html += "<p>Showing " + rows.length + " of 8.</p>";
    if (!rows.length) {
      html += "<p>No practices match this filter.</p>";
      html += "<button class=\"btn\" type=\"button\" data-act=\"clear-filters\">Clear filters</button>";
      return html;
    }
    html += "<div class=\"stack two\">";
    rows.forEach((p) => {
      const walk = p.id === "birchwood" ? " walk" : "";
      html += "<article class=\"card" + walk + "\">";
      html += "<h3>" + esc(p.name) + "</h3>";
      html += "<p>" + esc(p.town) + "</p>";
      html += "<p><span class=\"label\">Stage</span><br>" + esc(p.stageLabel) + "</p>";
      html += "<p><span class=\"label\">Days in stage vs target</span><br>" + esc(p.daysText) + "</p>";
      html += "<p><span class=\"label\">Status</span><br>" + pill(p.status) + " " + esc(p.statusDetail) + "</p>";
      html += "<p><span class=\"label\">Projected first patient</span><br>" + esc(p.firstPatient) + ". " + esc(p.firstNote) + ".</p>";
      html += "<p><span class=\"label\">Top blocker</span><br>" + esc(p.blocker) + "</p>";
      if (p.panel) html += "<p>Panel " + esc(p.panel) + ".</p>";
      html += "<div class=\"actions\"><button class=\"btn primary\" type=\"button\" data-act=\"open\" data-id=\"" + esc(p.id) + "\">Open launch plan</button></div>";
      html += "</article>";
    });
    html += "</div>";
    return html;
  }

  function chip(kind, value, on) {
    return "<button class=\"chip\" type=\"button\" data-act=\"" + kind + "\" data-id=\"" + esc(value) + "\" aria-pressed=\"" + (on ? "true" : "false") + "\">" + esc(value) + "</button>";
  }

  function renderPlan() {
    const raw = practiceById(state.practiceId);
    const p = viewPractice(raw);
    if (p.id !== "birchwood") {
      let html = "<h2>" + esc(p.name) + "</h2>";
      html += "<p>" + esc(p.owner) + ". " + esc(p.town) + ".</p>";
      html += "<p>Stage: " + esc(p.stageLabel) + ".</p>";
      html += "<p>Status: " + pill(p.status) + " " + esc(p.statusDetail) + ".</p>";
      html += "<p>Projected first patient: " + esc(p.firstPatient) + ".</p>";
      html += "<p>Top blocker: " + esc(p.blocker) + ".</p>";
      html += "<p>" + esc(p.story) + "</p>";
      html += "<div class=\"stack\">";
      (p.steps || []).forEach((step) => {
        html += "<article class=\"card\"><h3>" + esc(step.name) + "</h3>";
        html += "<p>Owner: " + esc(step.owner) + ". Status: " + esc(step.status) + ".</p>";
        html += "<p>" + esc(step.note) + "</p></article>";
      });
      html += "</div>";
      html += "<p>The critical path, Launch Assist, and the 4-gate check in this demo are filled out for Birchwood Family Health.</p>";
      html += "<div class=\"actions\"><button class=\"btn primary\" type=\"button\" data-act=\"open\" data-id=\"birchwood\">Open Birchwood</button></div>";
      return html;
    }
    const b = birch();
    let html = "<h2>Birchwood Family Health</h2>";
    html += "<p>" + esc(p.owner) + ". Concord, NH. Advisor " + esc(DATA.advisor) + ".</p>";
    html += "<p>" + esc(p.story) + "</p>";
    html += "<p>Status: " + pill(b.status) + " " + esc(b.statusDetail) + ".</p>";
    html += "<p>Projected first patient: <strong>" + esc(b.firstPatient) + "</strong>. " + esc(b.firstNote) + ".</p>";
    html += "<p>" + esc(b.why) + "</p>";
    html += "<p class=\"rule\">Launch Assist drafts the next step and cites the line it read. You approve, edit, or dismiss. It does not attest, file, or send.</p>";
    if (state.ask.sent) {
      html += "<article class=\"card\"><h3>Note from Rosa</h3><p>" + esc(state.ask.sentText) + "</p><p>Saved in this demo. Nothing was sent.</p></article>";
    }
    html += "<div class=\"plan-grid\">";
    html += "<div class=\"milestones\">";
    milestones().forEach((group) => {
      html += "<section class=\"stage-block\"><h3>" + esc(group.stage) + "</h3><p>" + esc(group.target) + "</p>";
      group.items.forEach((item) => {
        const klass = item.critical ? "card critical" : "card";
        html += "<article class=\"" + klass + "\">";
        if (item.critical) html += "<p><strong>Critical path</strong></p>";
        html += "<h3>" + esc(item.name) + "</h3>";
        html += "<p>Owner: " + esc(item.owner) + ". Status: " + esc(item.status) + ". Due: " + esc(item.due) + ".</p>";
        html += "<p>" + esc(item.note) + "</p></article>";
      });
      html += "</section>";
    });
    html += "</div><div class=\"assist\"><h2>Launch Assist</h2>";
    DATA.suggestions.forEach((meta) => { html += renderSuggestion(meta); });
    html += "</div></div>";
    return html;
  }

  function renderGoLive() {
    const current = viewPractice(practiceById(state.practiceId));
    if (current.id !== "birchwood") {
      let html = "<h2>Go-live check</h2>";
      html += "<p class=\"rule\">" + esc(DATA.rule) + "</p>";
      html += "<p>" + esc(current.name) + " is the open practice. " + esc(current.story) + "</p>";
      html += "<p>The filled 4-gate check in this demo is Birchwood Family Health.</p>";
      html += "<div class=\"actions\"><button class=\"btn primary\" type=\"button\" data-act=\"open-screen\" data-id=\"birchwood\">Open Birchwood go-live check</button></div>";
      return html;
    }
    const b = birch();
    let html = "<h2>Go-live check</h2>";
    html += "<p>Birchwood Family Health. Visit date used for gate 1: <strong>" + esc(b.visit) + "</strong>.</p>";
    html += "<p class=\"rule\">" + esc(DATA.rule) + "</p>";
    html += "<p>" + esc(bookingCopy(b)) + "</p>";
    html += "<div class=\"stack payer-grid\">";
    gates().forEach((payer) => {
      const slot = slotFor(payer.gates);
      html += "<article class=\"card\"><h3>" + esc(payer.name) + "</h3>";
      html += "<p>" + esc(payer.meta) + "</p>";
      payer.gates.forEach((g) => {
        html += "<p class=\"gate\">Gate " + esc(g.n) + ": " + pill(g.result) + " " + esc(g.name) + ". " + esc(g.reason) + "</p>";
      });
      html += "<p class=\"" + (slot.ok ? "slot-ok" : "slot-no") + "\">" + esc(slot.text) + "</p>";
      html += "<p>" + esc(slot.reason) + "</p>";
      if (payer.id === "pinecrest") {
        const label = state.feeLoaded ? "Fee schedule marked loaded" : "Mark Pinecrest fee schedule loaded (demo)";
        html += "<div class=\"actions\"><button class=\"btn\" type=\"button\" data-act=\"fee\"" + (state.feeLoaded ? " disabled" : "") + ">" + label + "</button></div>";
      }
      html += "</article>";
    });
    html += "</div>";
    return html;
  }

  function renderWeek() {
    const done = DATA.tasks.filter((t) => state.tasks[t.id]).length;
    let html = "<h2>This week</h2>";
    html += "<p>Rosa Delgado, FNP-C. Birchwood Family Health. Checked from her phone.</p>";
    html += "<p class=\"progress\">Progress: " + done + " of 4 done this week.</p>";
    html += "<div class=\"stack\">";
    DATA.tasks.forEach((task) => {
      const on = !!state.tasks[task.id];
      html += "<article class=\"card\"><h3>" + esc(task.name) + "</h3>";
      html += "<p>" + esc(task.due) + "</p>";
      html += "<p>" + esc(task.detail) + "</p>";
      html += "<p>Status: " + (on ? "Done" : "Not done") + ".</p>";
      html += "<div class=\"actions\"><button class=\"btn primary\" type=\"button\" data-act=\"task\" data-id=\"" + task.id + "\">" + (on ? "Undo" : "I did it") + "</button></div>";
      html += "</article>";
    });
    html += "</div>";
    html += "<article class=\"card\"><h3>Ask my advisor</h3>";
    html += "<p>Write Maya Chen a note. Send to Maya (demo) keeps it in this browser. Nothing is sent.</p>";
    html += "<textarea data-bind=\"ask\" aria-label=\"Note to Maya\">" + esc(state.ask.draft) + "</textarea>";
    html += "<div class=\"actions\"><button class=\"btn primary\" type=\"button\" data-act=\"ask\">Send to Maya (demo)</button></div>";
    if (state.ask.sent) html += "<p>Saved for Maya: " + esc(state.ask.sentText) + "</p>";
    html += "</article>";
    return html;
  }

  function renderNinety() {
    const b = birch();
    let html = "<h2>First 90 days</h2>";
    html += "<p>Panel target in this sample playbook is 300 patients. Birchwood is not live yet.</p>";
    html += "<div class=\"stack two\">";
    html += "<article class=\"card\"><h3>Birchwood Family Health</h3><p>Panel: 0 of 300.</p><p>Projected first patient " + esc(b.firstPatient) + ". " + esc(b.firstNote) + ".</p></article>";
    html += "<article class=\"card\"><h3>Pine Hollow Family Practice</h3><p>Panel: 96 of 300.</p><p>Live Sep 15. Day 23.</p></article>";
    html += "<article class=\"card\"><h3>Riverbend Primary Care</h3><p>Panel: 212 of 300.</p><p>Live Aug 11. Day 58.</p></article>";
    html += "<article class=\"card\"><h3>Annual wellness visits booked</h3><p>Birchwood: 0 booked. The practice is not live, so the sample file has no visits yet.</p></article>";
    html += "</div>";
    html += "<h3 style=\"margin-top:16px\">Last cohort channels</h3>";
    html += "<p>6 practices. Sample dollars. Payback months use a sample $35 gross margin per patient per month.</p>";
    html += "<div class=\"stack two\">";
    DATA.channels.forEach((ch) => {
      html += "<article class=\"card\"><h3>" + esc(ch.name) + "</h3>";
      html += "<p>Spend " + esc(ch.spend) + ".</p>";
      html += "<p>" + esc(ch.patients) + " new patients.</p>";
      html += "<p>" + esc(ch.each) + " each.</p>";
      html += "<p>Payback " + esc(ch.payback) + " months.</p></article>";
    });
    html += "</div>";
    html += "<article class=\"card critical\" style=\"margin-top:12px\"><h3>Live experiment, Birchwood</h3>";
    html += "<p>Outreach to 420 Pinecrest attributed members near Concord.</p>";
    html += "<p>Hypothesis: 10% (42) book in 6 weeks.</p>";
    html += "<p>Kill rule: under 4% at week 3.</p></article>";
    return html;
  }

  function renderMetrics() {
    const b = birch();
    const m = DATA.metrics;
    const approved = ["s1", "s2", "s3"].filter((id) => state.suggestions[id].status === "approved").length;
    let html = "<h2>Metrics and audit log</h2>";
    html += "<p>Sample, last cohort, unless a line says this session. Time to launch means signed agreement to first patient seen.</p>";
    html += "<div class=\"stack two\">";
    html += "<article class=\"card\"><h3>Time to launch</h3><p>Median " + esc(m.timeToLaunch) + ".</p><p>Target " + esc(m.timeTarget) + ".</p></article>";
    html += "<article class=\"card\"><h3>Stage spread</h3><p>Enrollment stage: " + esc(m.spread) + ".</p></article>";
    html += "<article class=\"card\"><h3>Automated or self-serve</h3><p>" + esc(m.autoNow) + " today.</p><p>Launch Assist drafts 6 more, so " + esc(m.autoWith) + " with advisor approval.</p><p>A draft does not count until an advisor approves it.</p></article>";
    html += "<article class=\"card\"><h3>NP pulse</h3><p>" + esc(m.pulse) + " after each stage.</p></article>";
    html += "<article class=\"card\"><h3>This session</h3><p>Launch Assist drafts approved: " + approved + " of 3.</p>";
    html += "<p>Birchwood: " + esc(b.status) + ". First patient " + esc(b.firstPatient) + ". " + esc(b.firstNote) + ".</p></article>";
    html += "<article class=\"card\"><h3>Playbook targets</h3>";
    DATA.playbook.forEach((row) => {
      html += "<p>" + esc(row.stage) + ": " + esc(row.days) + ".</p>";
    });
    html += "</article></div>";
    html += "<h3 style=\"margin-top:16px\">Audit log</h3>";
    html += "<p>Every approve, edit, dismiss, send mark, and phone check-off.</p>";
    html += "<div class=\"stack\">";
    state.log.forEach((row) => {
      html += "<article class=\"card\"><p class=\"label\">" + esc(row.time) + "</p>";
      html += "<p><strong>" + esc(row.actor) + ".</strong> " + esc(row.action) + "</p>";
      html += "<p>" + esc(row.detail) + "</p></article>";
    });
    html += "</div>";
    return html;
  }

  function renderMain() {
    if (state.screen === "plan") return renderPlan();
    if (state.screen === "golive") return renderGoLive();
    if (state.screen === "week") return renderWeek();
    if (state.screen === "ninety") return renderNinety();
    if (state.screen === "metrics") return renderMetrics();
    return renderCohort();
  }

  function render(toTop) {
    const root = document.getElementById("app");
    const y = toTop ? 0 : window.scrollY;
    let nav = "<nav class=\"nav\" aria-label=\"Screens\">";
    SCREENS.forEach((pair) => {
      const on = state.screen === pair[0];
      nav += "<button type=\"button\" data-act=\"screen\" data-id=\"" + pair[0] + "\"" + (on ? " aria-current=\"page\"" : "") + ">" + esc(pair[1]) + "</button>";
    });
    nav += "</nav>";
    const notice = state.notice ? "<p class=\"notice\" role=\"status\">" + esc(state.notice) + "</p>" : "";
    root.innerHTML = ""
      + "<div class=\"wrap\">"
      + "<header class=\"top\"><div><p class=\"eyebrow\">Practice advisor desk</p><h1>Clinic Launch Desk</h1></div>"
      + "<button class=\"btn\" type=\"button\" data-act=\"reset\">Reset demo</button></header>"
      + "<p class=\"who\">" + esc(DATA.advisor) + ", practice advisor. Today is " + esc(DATA.today) + ". Birchwood is on day 65.</p>"
      + "<p class=\"banner\">All practice, NP, payer, and dollar data on this page is sample data. Payer names are made up.</p>"
      + notice
      + nav
      + "<main id=\"main\">" + renderMain() + "</main>"
      + "<footer class=\"footer\"><p>Prototype by Amitesh Dwivedi</p><p>Sample data. Not affiliated with Duet.</p></footer>"
      + "</div>";
    window.scrollTo(0, y);
  }

  function onInput(e) {
    const t = e.target;
    const bind = t.getAttribute && t.getAttribute("data-bind");
    if (!bind) return;
    if (bind.indexOf("draft-") === 0) {
      state.suggestions[bind.slice(6)].draft = t.value;
      save();
    } else if (bind.indexOf("reason-") === 0) {
      state.suggestions[bind.slice(7)].reason = t.value;
      save();
    } else if (bind === "ask") {
      state.ask.draft = t.value;
      save();
    }
  }

  function onClick(e) {
    const el = e.target.closest("[data-act]");
    if (!el || !document.getElementById("app").contains(el)) return;
    const act = el.getAttribute("data-act");
    const id = el.getAttribute("data-id");
    if (act === "screen") {
      state.screen = id;
      state.notice = "";
      save();
      render(true);
      return;
    }
    if (act === "stage") {
      state.stageFilter = id;
      save();
      render();
      return;
    }
    if (act === "status") {
      state.statusFilter = id;
      save();
      render();
      return;
    }
    if (act === "clear-filters") {
      state.stageFilter = "All";
      state.statusFilter = "All";
      save();
      render();
      return;
    }
    if (act === "open") {
      state.practiceId = id;
      state.screen = "plan";
      state.notice = "";
      save();
      render(true);
      return;
    }
    if (act === "open-screen") {
      state.practiceId = "birchwood";
      state.screen = "golive";
      save();
      render();
      return;
    }
    if (act === "approve") {
      const s = state.suggestions[id];
      const meta = suggestionMeta(id);
      if (!s || s.status === "dismissed" || s.status === "approved") return;
      if (!s.draft.trim()) {
        s.error = "Add draft text before you approve.";
        render();
        return;
      }
      s.error = "";
      s.status = "approved";
      s.saved = s.draft;
      s.editing = false;
      s.dismissing = false;
      addLog("Maya Chen", "Approved suggestion " + id.slice(1), meta.suggest);
      state.notice = approveNotice(id);
      save();
      render();
      return;
    }
    if (act === "edit") {
      const s = state.suggestions[id];
      if (!s || s.sent) return;
      s.editing = true;
      s.dismissing = false;
      s.error = "";
      render();
      return;
    }
    if (act === "cancel-edit") {
      const s = state.suggestions[id];
      s.draft = s.saved;
      s.editing = false;
      s.error = "";
      save();
      render();
      return;
    }
    if (act === "save-edit") {
      const s = state.suggestions[id];
      const meta = suggestionMeta(id);
      if (!s.draft.trim()) {
        s.error = "The draft is empty.";
        render();
        return;
      }
      if (s.draft.trim() === s.saved.trim()) {
        s.editing = false;
        s.draft = s.saved;
        s.error = "";
        render();
        return;
      }
      s.saved = s.draft;
      s.editing = false;
      s.error = "";
      addLog("Maya Chen", "Edited suggestion " + id.slice(1), meta.suggest + " Draft updated.");
      state.notice = "Edit saved on the launch file. Nothing was sent.";
      save();
      render();
      return;
    }
    if (act === "dismiss") {
      const s = state.suggestions[id];
      if (!s || s.status !== "pending") return;
      s.dismissing = true;
      s.editing = false;
      s.error = "";
      render();
      return;
    }
    if (act === "cancel-dismiss") {
      state.suggestions[id].dismissing = false;
      state.suggestions[id].error = "";
      render();
      return;
    }
    if (act === "confirm-dismiss") {
      const s = state.suggestions[id];
      const meta = suggestionMeta(id);
      if (!s.reason.trim()) {
        s.error = "Add a reason to dismiss.";
        render();
        return;
      }
      s.status = "dismissed";
      s.dismissing = false;
      s.editing = false;
      s.error = "";
      addLog("Maya Chen", "Dismissed suggestion " + id.slice(1), meta.suggest + " Reason: " + s.reason.trim());
      state.notice = "Dismissed. The reason is in the audit log. Nothing was sent.";
      save();
      render();
      return;
    }
    if (act === "sent") {
      const s = state.suggestions[id];
      const meta = suggestionMeta(id);
      if (!s || s.status !== "approved" || s.sent) return;
      s.sent = true;
      addLog("Maya Chen", "Marked suggestion " + id.slice(1) + " as sent (demo)", meta.suggest + " Nothing was sent.");
      state.notice = "Marked as sent in this demo. Nothing left this browser.";
      save();
      render();
      return;
    }
    if (act === "task") {
      const task = DATA.tasks.find((item) => item.id === id);
      state.tasks[id] = !state.tasks[id];
      if (state.tasks[id]) {
        addLog("Rosa Delgado", "Marked done: " + task.name, "From the This week list. The advisor view updates.");
        state.notice = id === "caqh"
          ? "Rosa marked CAQH re-attest done. The Birchwood launch plan now shows it."
          : "Marked done. Maya can see it on the launch plan.";
      } else {
        addLog("Rosa Delgado", "Cleared: " + task.name, "Undid the phone check-off.");
        state.notice = "Cleared that check-off.";
      }
      save();
      render();
      return;
    }
    if (act === "ask") {
      if (!state.ask.draft.trim()) {
        state.notice = "Write a note before you send it to Maya.";
        render();
        return;
      }
      state.ask.sent = true;
      state.ask.sentText = state.ask.draft.trim();
      addLog("Rosa Delgado", "Asked Maya (demo)", state.ask.sentText + " Nothing was sent.");
      state.notice = "Saved for Maya on the launch plan. Nothing was sent.";
      save();
      render();
      return;
    }
    if (act === "fee") {
      if (state.feeLoaded) return;
      state.feeLoaded = true;
      addLog("Maya Chen", "Marked Pinecrest fee schedule loaded (demo)", "Gate 3 for Pinecrest now passes. This did not update a clearinghouse.");
      state.notice = "Pinecrest fee schedule marked loaded. Gate 3 now passes.";
      save();
      render();
      return;
    }
    if (act === "reset") {
      localStorage.removeItem(KEY);
      state = seed();
      state.notice = "Demo reset to the Oct 8 sample file.";
      save();
      render();
    }
  }

  const app = document.getElementById("app");
  app.addEventListener("click", onClick);
  app.addEventListener("input", onInput);
  render();
})();
