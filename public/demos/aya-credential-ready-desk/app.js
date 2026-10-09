(function () {
  "use strict";

  const DATA = window.AYA_DATA;
  const KEY = "aya-credential-ready-desk-v1";
  const SCREENS = [
    ["queue", "Queue"],
    ["packet", "Packet"],
    ["nudge", "Nudge"],
    ["clinician", "Clinician"],
    ["submit", "Submit"],
    ["ops", "Ops"],
    ["audit", "Audit"]
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

  function joinAnd(list) {
    if (!list.length) return "";
    if (list.length === 1) return list[0];
    if (list.length === 2) return list[0] + " and " + list[1];
    return list.slice(0, -1).join(", ") + ", and " + list[list.length - 1];
  }

  function blankMessage(draft) {
    return { draft: draft, saved: draft, status: "pending", editing: false, sent: false, error: "" };
  }

  function seed() {
    return {
      screen: "queue",
      packetId: "dana",
      selectedItem: "bls",
      statusFilter: "All",
      weekFilter: "All",
      packets: JSON.parse(JSON.stringify(DATA.packets)),
      nudge: blankMessage(DATA.nudgeDraft),
      heads: blankMessage(DATA.headsDraft),
      tab: "text",
      rejectFor: "",
      rejectCustom: "",
      uploadFor: "",
      uploadNote: "",
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
      if (Array.isArray(saved.packets) && saved.packets.length === base.packets.length && saved.packets.every((p) => p && Array.isArray(p.items) && p.items.length)) {
        base.packets = saved.packets;
      }
      if (base.packets.some((p) => p.id === saved.packetId)) base.packetId = saved.packetId;
      if (typeof saved.selectedItem === "string") base.selectedItem = saved.selectedItem;
      if (saved.statusFilter === "All" || DATA.statuses.indexOf(saved.statusFilter) !== -1) base.statusFilter = saved.statusFilter;
      if (saved.weekFilter === "All" || DATA.weeks.indexOf(saved.weekFilter) !== -1) base.weekFilter = saved.weekFilter;
      ["nudge", "heads"].forEach((key) => {
        const row = saved[key];
        if (!row) return;
        if (typeof row.draft === "string") base[key].draft = row.draft;
        if (typeof row.saved === "string") base[key].saved = row.saved;
        if (row.status === "pending" || row.status === "approved") base[key].status = row.status;
        base[key].sent = !!row.sent;
      });
      if (saved.tab === "text" || saved.tab === "email") base.tab = saved.tab;
      if (typeof saved.uploadNote === "string") base.uploadNote = saved.uploadNote;
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
    copy.rejectFor = "";
    copy.rejectCustom = "";
    copy.uploadFor = "";
    copy.nudge.editing = false;
    copy.nudge.error = "";
    copy.heads.editing = false;
    copy.heads.error = "";
    localStorage.setItem(KEY, JSON.stringify(copy));
    } catch (err) { /* this demo keeps working if storage is blocked */ }
  }

  function addLog(actor, item, before, after, reason) {
    state.log.unshift({
      time: stamp(),
      actor: actor,
      item: item,
      before: before,
      after: after,
      reason: reason
    });
  }

  function packetById(id) {
    return state.packets.find((p) => p.id === id) || state.packets[0];
  }

  function currentPacket() {
    return packetById(state.packetId);
  }

  function dana() {
    return packetById("dana");
  }

  function approvedCount(packet) {
    return packet.items.filter((item) => item.status === "Approved").length;
  }

  function queueStatus(packet) {
    if (packet.submitted) return "Submitted";
    if (approvedCount(packet) === packet.items.length) return "Ready to submit";
    if (packet.baseStatus === "Will miss start") return "Will miss start";
    if (packet.baseStatus === "At risk") return "At risk";
    return "On track";
  }

  function blockReason(item) {
    if (item.status === "Approved") return "";
    if (item.status === "Missing") return "There is no file to approve.";
    if (item.status === "In progress") return item.waitReason || "The result is not in yet.";
    if (item.expiresBeforeEnd) return "Expires before the assignment end date (" + item.ruleId + "). A specialist cannot approve this card.";
    if (item.dateUnreadable) return "The date is unreadable, so this item cannot be approved.";
    if (item.nameMismatch && !item.nameChangeLinked) return "The name does not match the profile, and no name-change document is linked.";
    return "";
  }

  function needsClinician(item) {
    if (item.status === "Missing") return true;
    if (item.status === "Pending" && (item.expiresBeforeEnd || item.dateUnreadable)) return true;
    return false;
  }

  function nextStep(packet) {
    const status = queueStatus(packet);
    if (status === "Submitted") return "Packet submitted";
    if (status === "Ready to submit") return "Submit to facility";
    if (packet.id === "priya") return "WA license in board review, est. Oct 23";
    const nrp = packet.items.find((item) => item.id === "nrp");
    if (packet.id === "luis" && nrp && nrp.status !== "Approved") return "NRP card missing";
    const flu = packet.items.find((item) => item.id === "flu");
    if (packet.id === "grace" && flu && flu.status !== "Approved") return "Flu record pending";
    const pending = packet.items.filter((item) => item.status === "Pending");
    if (pending.length) return "Review " + joinAnd(pending.map((item) => item.shortName));
    const missing = packet.items.filter((item) => item.status === "Missing");
    if (missing.length) return "Waiting on clinician: " + joinAnd(missing.map((item) => item.shortName));
    const prog = packet.items.filter((item) => item.status === "In progress");
    if (prog.length) return "Waiting: " + joinAnd(prog.map((item) => item.shortName));
    return "Review packet";
  }

  function rank(item) {
    if (item.status === "Pending" && item.precheck && item.precheck.result === "Flag") return 0;
    if (item.status === "Missing") return 1;
    if (item.status === "Pending") return 2;
    if (item.status === "In progress") return 3;
    return 4;
  }

  function sortedItems(items) {
    return items.slice().sort((a, b) => (rank(a) - rank(b)) || (a.n - b.n));
  }

  function pill(status) {
    const map = {
      "On track": "on-track",
      "At risk": "at-risk",
      "Will miss start": "miss",
      "Ready to submit": "ready",
      "Submitted": "submitted",
      "Approved": "approved",
      "Pending": "pending",
      "Missing": "missing",
      "In progress": "progress",
      "Pass": "pass",
      "Flag": "fail",
      "Waiting": "wait"
    };
    return "<span class=\"pill " + (map[status] || "wait") + "\">" + esc(status) + "</span>";
  }

  function chip(kind, value, label, on) {
    return "<button class=\"chip\" type=\"button\" data-act=\"" + kind + "\" data-id=\"" + esc(value) + "\" aria-pressed=\"" + (on ? "true" : "false") + "\">" + esc(label || value) + "</button>";
  }

  function lockReasons(packet) {
    return packet.items.filter((item) => item.status !== "Approved").map((item) => {
      if (item.status === "Missing") return item.name + ": Missing. " + (item.missingReason || "No file on the packet.");
      if (item.status === "In progress") return item.name + ": In progress. " + (item.waitReason || "Result not in.");
      const block = blockReason(item);
      return item.name + ": Pending. " + (block || "A specialist has not approved it.");
    });
  }

  function renderPrecheck(item) {
    if (!item.precheck) {
      if (item.status === "Missing") return "<p>No file yet, so there is no pre-check.</p>";
      return "<p>No pre-check on this sample row.</p>";
    }
    const pc = item.precheck;
    let html = "<p class=\"label\">Field read</p><p>" + esc(pc.field) + ": " + esc(pc.read) + "</p>";
    html += "<p class=\"label\">Rule</p><p>" + esc(item.ruleId) + ": " + esc(item.rule) + "</p>";
    html += "<p class=\"label\">Confidence</p><p>" + (pc.confidence == null ? "No confidence. There is no document date to read." : esc(String(pc.confidence))) + "</p>";
    html += "<p>Pre-check result: " + pill(pc.result) + " " + esc(pc.reason) + "</p>";
    return html;
  }

  function renderDetail(packet, item) {
    const block = blockReason(item);
    let html = "<p>Rule " + esc(item.ruleId) + ". Document: " + esc(item.file || "None") + ". Status: " + pill(item.status) + "</p>";
    html += renderPrecheck(item);
    if (item.status === "Approved") {
      html += "<p>Approved by " + esc(item.approvedBy || "Carla Mendes") + ". The pre-check did not set Approved.</p>";
    }
    if (item.nameMismatch) {
      html += "<p>Name on the file: " + esc(item.nameOnFile || "See the pre-check") + ". Profile: " + esc(item.profileName || "the clinician profile") + ".</p>";
      if (item.nameChangeLinked) {
        html += "<p>You can approve this. A marriage certificate is linked (" + esc(item.linkedDoc || "on file") + "), so the name rule is met. The pre-check did not approve it.</p>";
        if (item.status !== "Approved") {
          html += "<div class=\"actions\"><button class=\"btn\" type=\"button\" data-act=\"unlink\" data-packet=\"" + packet.id + "\" data-id=\"" + item.id + "\">Unlink document (demo)</button></div>";
        }
      }
    }
    if (item.missingReason && item.status === "Missing") html += "<p>Reason: " + esc(item.missingReason) + "</p>";
    if (item.waitReason && item.status === "In progress") html += "<p>" + esc(item.waitReason) + "</p>";
    if (packet.submitted) {
      html += "<p>This packet is already submitted. Nothing new is sent.</p>";
      return html;
    }
    if (item.status !== "Approved") {
      html += "<div class=\"actions\">";
      if (block) html += "<button class=\"btn\" type=\"button\" disabled>Approve</button>";
      else html += "<button class=\"btn primary\" type=\"button\" data-act=\"approve\" data-packet=\"" + packet.id + "\" data-id=\"" + item.id + "\">Approve</button>";
      if (item.status === "Pending") {
        html += "<button class=\"btn\" type=\"button\" data-act=\"reject-open\" data-packet=\"" + packet.id + "\" data-id=\"" + item.id + "\">Reject with reason</button>";
        html += "<button class=\"btn\" type=\"button\" data-act=\"request\" data-packet=\"" + packet.id + "\" data-id=\"" + item.id + "\">Request new</button>";
      }
      html += "</div>";
      if (block) html += "<p class=\"slot-no\">Approve is blocked. " + esc(block) + "</p>";
    }
    if (state.rejectFor === packet.id + ":" + item.id) {
      html += "<p class=\"label\">Reject reason</p><div class=\"actions\">";
      DATA.rejectPresets.forEach((reason) => {
        html += "<button class=\"btn\" type=\"button\" data-act=\"reject-now\" data-packet=\"" + packet.id + "\" data-id=\"" + item.id + "\" data-reason=\"" + esc(reason) + "\">" + esc(reason) + "</button>";
      });
      html += "</div>";
      html += "<textarea data-bind=\"reject-custom\" aria-label=\"Other reject reason\">" + esc(state.rejectCustom) + "</textarea>";
      html += "<div class=\"actions\">";
      html += "<button class=\"btn primary\" type=\"button\" data-act=\"reject-custom\" data-packet=\"" + packet.id + "\" data-id=\"" + item.id + "\">Reject with this note</button>";
      html += "<button class=\"btn\" type=\"button\" data-act=\"reject-cancel\">Cancel</button>";
      html += "</div>";
    }
    return html;
  }

  function renderPacketBody(packet) {
    const count = approvedCount(packet);
    const status = queueStatus(packet);
    let html = "<h2>" + esc(packet.clinician) + ", " + esc(packet.credential) + "</h2>";
    html += "<p>" + esc(packet.role) + ". " + esc(packet.facility) + (packet.place ? ", " + esc(packet.place) : "") + ".</p>";
    html += "<p>Start " + esc(packet.start) + ". " + count + " of " + packet.items.length + " approved. Status: " + pill(status) + "</p>";
    html += "<p>Next step: " + esc(nextStep(packet)) + ".</p>";
    if (packet.id === "dana") {
      html += "<p>13 weeks. End Sat " + esc(packet.end) + ". Contract signed " + esc(packet.signed) + ". Facility deadline " + esc(packet.deadline) + ", 5 business days before start. List: " + esc(packet.listName) + ". Rule MV-3: every card and cert must be valid through the assignment end date.</p>";
    }
    html += "<p class=\"rule\">" + esc(DATA.rule) + "</p>";
    const items = sortedItems(packet.items);
    const selected = items.find((item) => item.id === state.selectedItem) || items[0];
    html += "<div class=\"packet\"><div class=\"checklist\">";
    items.forEach((item) => {
      const flagged = item.precheck && item.precheck.result === "Flag" && item.status !== "Approved";
      html += "<article class=\"card" + (flagged ? " flag" : "") + (item.id === selected.id ? " walk" : "") + "\">";
      html += "<h3>" + item.n + ". " + esc(item.name) + "</h3>";
      html += "<p>" + pill(item.status) + " Rule " + esc(item.ruleId) + ".</p>";
      html += "<div class=\"actions\"><button class=\"btn\" type=\"button\" data-act=\"select\" data-packet=\"" + packet.id + "\" data-id=\"" + item.id + "\">Show pre-check</button></div>";
      const showInline = item.status !== "Approved" || item.id === selected.id;
      if (showInline) html += "<div class=\"detail-inline\">" + renderDetail(packet, item) + "</div>";
      html += "</article>";
    });
    html += "</div><aside class=\"detail-side card\"><p class=\"label\">Pre-check detail</p><h3>" + selected.n + ". " + esc(selected.name) + "</h3>";
    html += renderDetail(packet, selected);
    html += "</aside></div>";
    return html;
  }

  function renderQueue() {
    const rows = state.packets.filter((packet) => {
      if (state.statusFilter !== "All" && queueStatus(packet) !== state.statusFilter) return false;
      if (state.weekFilter !== "All" && packet.week !== state.weekFilter) return false;
      return true;
    });
    const totals = {};
    DATA.statuses.forEach((status) => { totals[status] = 0; });
    state.packets.forEach((packet) => { totals[queueStatus(packet)] += 1; });
    let html = "<h2>Start queue</h2>";
    html += "<p>10 upcoming starts. Today is " + esc(DATA.today) + ". Specialist " + esc(DATA.specialist) + ". Recruiter " + esc(DATA.recruiter) + ".</p>";
    html += "<p>On track " + totals["On track"] + ". At risk " + totals["At risk"] + ". Will miss start " + totals["Will miss start"] + ". Ready to submit " + totals["Ready to submit"] + ". Submitted " + totals["Submitted"] + ".</p>";
    html += "<p class=\"label\">Status</p><div class=\"chip-row\">";
    html += chip("status", "All", "All", state.statusFilter === "All");
    DATA.statuses.forEach((status) => { html += chip("status", status, status, state.statusFilter === status); });
    html += "</div><p class=\"label\">Start week</p><div class=\"chip-row\">";
    html += chip("week", "All", "All weeks", state.weekFilter === "All");
    DATA.weeks.forEach((week) => { html += chip("week", week, "Week of " + week, state.weekFilter === week); });
    html += "</div>";
    html += "<p>Showing " + rows.length + " of 10.</p>";
    if (!rows.length) {
      html += "<p>No packets match this filter.</p>";
      html += "<button class=\"btn\" type=\"button\" data-act=\"clear-filters\">Clear filters</button>";
      return html;
    }
    html += "<div class=\"stack two\">";
    rows.forEach((packet) => {
      const status = queueStatus(packet);
      html += "<article class=\"card" + (packet.id === "dana" ? " walk" : "") + "\">";
      html += "<h3>" + esc(packet.clinician) + "</h3>";
      html += "<p>" + esc(packet.credential) + ", " + esc(packet.role) + ".</p>";
      html += "<p>" + esc(packet.facility) + ".</p>";
      html += "<p>Start " + esc(packet.start) + ".</p>";
      html += "<p>" + approvedCount(packet) + " of " + packet.items.length + " approved.</p>";
      html += "<p>Status: " + pill(status) + "</p>";
      html += "<p>Next step: " + esc(nextStep(packet)) + ".</p>";
      if (packet.deadline) html += "<p>Facility deadline " + esc(packet.deadline) + ".</p>";
      html += "<div class=\"actions\"><button class=\"btn primary\" type=\"button\" data-act=\"open\" data-id=\"" + packet.id + "\">Open packet</button></div>";
      html += "</article>";
    });
    html += "</div>";
    return html;
  }

  function renderMessage(key, title, who) {
    const msg = state[key];
    let html = "<article class=\"card\"><h3>" + esc(title) + "</h3>";
    html += "<p>" + esc(who) + "</p>";
    if (msg.editing) html += "<textarea data-bind=\"" + key + "\" aria-label=\"" + esc(title) + "\">" + esc(msg.draft) + "</textarea>";
    else html += "<p>" + esc(msg.draft) + "</p>";
    if (msg.error) html += "<p class=\"slot-no\">" + esc(msg.error) + "</p>";
    html += "<div class=\"actions\">";
    if (msg.status === "approved") html += "<button class=\"btn\" type=\"button\" disabled>Approved</button>";
    else html += "<button class=\"btn primary\" type=\"button\" data-act=\"msg-approve\" data-id=\"" + key + "\">Approve</button>";
    if (!msg.sent && msg.editing) {
      html += "<button class=\"btn primary\" type=\"button\" data-act=\"msg-save\" data-id=\"" + key + "\">Save edit</button>";
      html += "<button class=\"btn\" type=\"button\" data-act=\"msg-cancel\" data-id=\"" + key + "\">Cancel edit</button>";
    } else if (!msg.sent) {
      html += "<button class=\"btn\" type=\"button\" data-act=\"msg-edit\" data-id=\"" + key + "\">Edit</button>";
    }
    if (msg.sent) html += "<button class=\"btn\" type=\"button\" disabled>Marked as sent</button>";
    else html += "<button class=\"btn\" type=\"button\" data-act=\"msg-sent\" data-id=\"" + key + "\"" + (msg.status === "approved" ? "" : " disabled") + ">Mark as sent (demo)</button>";
    html += "</div>";
    if (msg.sent) html += "<p>Marked as sent in this demo. Nothing was sent.</p>";
    else html += "<p>Mark as sent (demo) does not send this. It stays off until you approve.</p>";
    html += "</article>";
    return html;
  }

  function renderNudge() {
    const things = dana().items.filter(needsClinician);
    let html = "<h2>One nudge for Dana</h2>";
    html += "<p>Every open item is in one note. Recruiter heads-up sits beside it. Nothing goes out until " + esc(DATA.specialist) + " approves it.</p>";
    if (things.length !== 3 && state.nudge.status !== "approved") {
      html += "<p class=\"notice\">Dana's phone list now has " + things.length + " open items. Edit the draft if it should match.</p>";
    }
    html += "<article class=\"card\"><h3>Open items in this note</h3>";
    if (!things.length) html += "<p>Dana has no upload left on her list.</p>";
    things.forEach((item, index) => {
      html += "<p>" + (index + 1) + ") " + esc(item.shortName) + ": " + esc(plainFix(item)) + "</p>";
    });
    html += "</article>";
    html += "<div class=\"actions\">";
    html += "<button class=\"chip\" type=\"button\" data-act=\"tab\" data-id=\"text\" aria-pressed=\"" + (state.tab === "text" ? "true" : "false") + "\">Text</button>";
    html += "<button class=\"chip\" type=\"button\" data-act=\"tab\" data-id=\"email\" aria-pressed=\"" + (state.tab === "email" ? "true" : "false") + "\">Email</button>";
    html += "</div>";
    html += "<div class=\"split\">";
    html += "<div>";
    if (state.tab === "email") {
      html += "<article class=\"card\"><p>To: Dana Whitfield</p><p>From: Carla Mendes</p><p>Subject: 3 items left for your Oct 26 start</p></article>";
    } else {
      html += "<article class=\"card\"><p>Text to Dana Whitfield</p><p>From: Carla Mendes</p></article>";
    }
    html += renderMessage("nudge", "Nudge to Dana", "One message for every open item. Due Wed Oct 14 so the packet can go by Oct 19.");
    html += "</div>";
    html += renderMessage("heads", "Recruiter heads-up", "To Brian Foster, from Carla Mendes.");
    html += "</div>";
    return html;
  }

  function plainFix(item) {
    if (item.id === "bls") return "Your BLS card ends Dec 31, 2026, before your Jan 23, 2027 end date. Please renew and upload the new card.";
    if (item.id === "tb") return "Your TB result photo is blurry. Please upload a clear photo or PDF.";
    if (item.id === "flu") return "Please upload your 2026-27 flu shot record.";
    return item.missingReason || item.waitReason || "Please upload a new file.";
  }

  function renderClinician() {
    const packet = dana();
    const things = packet.items.filter(needsClinician);
    const waiting = packet.items.filter((item) => item.status === "Pending" && !needsClinician(item));
    const progress = packet.items.filter((item) => item.status === "In progress");
    const word = things.length === 1 ? "thing" : "things";
    let html = "<h2>" + things.length + " " + word + " left before your Oct 26 start</h2>";
    html += "<p>Dana Whitfield, RN. Mesa Verde Regional Medical Center. Send these by Wed Oct 14 so Carla can file the packet by Oct 19.</p>";
    if (state.uploadNote) html += "<p class=\"notice\" role=\"status\">" + esc(state.uploadNote) + "</p>";
    html += "<div class=\"stack\">";
    if (!things.length) html += "<article class=\"card\"><p>Nothing for you to upload right now.</p></article>";
    things.forEach((item) => {
      html += "<article class=\"card\"><h3>" + esc(item.name) + "</h3>";
      html += "<p>" + esc(plainFix(item)) + "</p>";
      html += "<p>Status: " + pill(item.status) + "</p>";
      html += "<div class=\"actions\"><button class=\"btn primary\" type=\"button\" data-act=\"upload-open\" data-id=\"" + item.id + "\">Upload</button></div>";
      if (state.uploadFor === item.id) {
        const samples = DATA.uploads[item.id] || [];
        html += "<p>Pick a sample file. The pre-check runs in this browser. Nothing is uploaded to a server.</p>";
        html += "<div class=\"actions\">";
        samples.forEach((file) => {
          html += "<button class=\"btn\" type=\"button\" data-act=\"upload-pick\" data-id=\"" + item.id + "\" data-file=\"" + file.id + "\">" + esc(file.label) + "</button>";
        });
        html += "<button class=\"btn\" type=\"button\" data-act=\"upload-cancel\">Cancel</button>";
        html += "</div>";
      }
      html += "</article>";
    });
    if (waiting.length) {
      html += "<article class=\"card\"><h3>Waiting on Carla</h3>";
      waiting.forEach((item) => {
        html += "<p>" + esc(item.shortName) + " is " + esc(item.status) + ". The pre-check did not approve it.</p>";
        if (item.precheck) html += "<p>Field read: " + esc(item.precheck.field) + ", " + esc(item.precheck.read) + ". Confidence: " + esc(item.precheck.confidence == null ? "none" : String(item.precheck.confidence)) + ".</p>";
      });
      html += "</article>";
    }
    if (progress.length) {
      html += "<article class=\"card\"><h3>Not on you</h3>";
      progress.forEach((item) => { html += "<p>" + esc(item.name) + ". " + esc(item.waitReason) + "</p>"; });
      html += "</article>";
    }
    html += "</div>";
    return html;
  }

  function renderSubmit() {
    const packet = currentPacket();
    const reasons = lockReasons(packet);
    const status = queueStatus(packet);
    let html = "<h2>Submit to facility</h2>";
    html += "<p>" + esc(packet.clinician) + ". " + esc(packet.facility) + ". Start " + esc(packet.start) + ".</p>";
    html += "<p class=\"rule\">" + esc(DATA.rule) + "</p>";
    if (packet.submitted || status === "Submitted") {
      html += "<p class=\"slot-ok\">Status: Submitted.</p>";
      html += "<p>This packet was already submitted in the sample. Nothing new is sent.</p>";
      return html;
    }
    if (reasons.length) {
      html += "<p class=\"slot-no\">Submit to facility is locked.</p>";
      html += "<p>" + reasons.length + " open item" + (reasons.length === 1 ? "" : "s") + ":</p>";
      html += "<div class=\"stack\">";
      reasons.forEach((reason) => { html += "<article class=\"card\"><p>" + esc(reason) + "</p></article>"; });
      html += "</div>";
      html += "<div class=\"actions\"><button class=\"btn\" type=\"button\" disabled>Submit (demo)</button></div>";
      return html;
    }
    html += "<p class=\"slot-ok\">Every required item is Approved. Status: Ready to submit.</p>";
    html += "<div class=\"stack\">";
    packet.items.forEach((item) => {
      html += "<article class=\"card\"><p>" + item.n + ". " + esc(item.name) + ". " + pill("Approved") + "</p></article>";
    });
    html += "</div>";
    html += "<div class=\"actions\"><button class=\"btn primary\" type=\"button\" data-act=\"submit\" data-id=\"" + packet.id + "\">Submit (demo)</button></div>";
    html += "<p>Submit (demo) does not send the packet to the facility.</p>";
    return html;
  }

  function renderOps() {
    const risky = state.packets.filter((packet) => {
      const status = queueStatus(packet);
      return status === "At risk" || status === "Will miss start";
    });
    const near = risky.filter((packet) => packet.week === "Oct 19" || packet.week === "Oct 26");
    const later = risky.filter((packet) => near.indexOf(packet) === -1);
    let html = "<h2>Ops</h2>";
    html += "<p>Starts at risk from today, Thu Oct 8, through the Oct 26 starts. Later at-risk starts are listed under that.</p>";
    html += "<h3>Starts at risk</h3><div class=\"stack\">";
    near.forEach((packet) => { html += opsCard(packet); });
    if (!near.length) html += "<p>No near starts are at risk.</p>";
    html += "</div><h3 style=\"margin-top:16px\">Later</h3><div class=\"stack\">";
    later.forEach((packet) => { html += opsCard(packet); });
    if (!later.length) html += "<p>No later starts are at risk.</p>";
    html += "</div>";
    html += "<h3 style=\"margin-top:16px\">Why packets bounce</h3>";
    html += "<p>Sample, last 30 days. Share of rejected uploads.</p>";
    DATA.bounce.forEach((row) => {
      html += "<p>" + esc(row.name) + ": " + row.pct + "%</p>";
      html += "<div class=\"meter\" role=\"img\" aria-label=\"" + esc(row.name) + " " + row.pct + " percent\"><span style=\"width:" + row.pct + "%\"></span></div>";
    });
    html += "<article class=\"card\"><h3>First-try pass rate</h3>";
    html += "<p>Formula: uploads the specialist accepts on the first review, divided by all uploads in the last 30 days.</p>";
    html += "<p>Sample baseline, before pre-check: 58%.</p>";
    html += "<p>This screen shows the formula. It does not claim a new rate. The pre-check only flags. It does not approve.</p></article>";
    return html;
  }

  function opsCard(packet) {
    return "<article class=\"card\"><h3>" + esc(packet.clinician) + "</h3><p>" + esc(packet.facility) + ". Start " + esc(packet.start) + ".</p><p>" + pill(queueStatus(packet)) + " " + approvedCount(packet) + " of " + packet.items.length + ".</p><p>" + esc(nextStep(packet)) + ".</p></article>";
  }

  function renderAudit() {
    let html = "<h2>Audit log</h2>";
    html += "<p>Time, actor, item, before, after, and reason. The pre-check is an actor. Only " + esc(DATA.specialist) + " can set Approved.</p>";
    html += "<div class=\"stack\">";
    state.log.forEach((row) => {
      html += "<article class=\"card\">";
      html += "<p class=\"label\">" + esc(row.time) + "</p>";
      html += "<p><strong>" + esc(row.actor) + "</strong> on " + esc(row.item) + "</p>";
      html += "<p>Before: " + esc(row.before) + ". After: " + esc(row.after) + ".</p>";
      html += "<p>" + esc(row.reason) + "</p>";
      html += "</article>";
    });
    html += "</div>";
    return html;
  }

  function renderMain() {
    if (state.screen === "packet") return renderPacketBody(currentPacket());
    if (state.screen === "nudge") return renderNudge();
    if (state.screen === "clinician") return renderClinician();
    if (state.screen === "submit") return renderSubmit();
    if (state.screen === "ops") return renderOps();
    if (state.screen === "audit") return renderAudit();
    return renderQueue();
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
      + "<header class=\"top\"><div><p class=\"eyebrow\">Credentialing specialist desk</p><h1>Credential Ready Desk</h1></div>"
      + "<button class=\"btn\" type=\"button\" data-act=\"reset\">Reset demo</button></header>"
      + "<p class=\"who\">" + esc(DATA.specialist) + ", credentialing specialist. Recruiter " + esc(DATA.recruiter) + ". Today is " + esc(DATA.today) + ".</p>"
      + "<p class=\"banner\">All clinician, facility, and document data on this page is sample data. Facility names are made up.</p>"
      + notice
      + nav
      + "<main id=\"main\">" + renderMain() + "</main>"
      + "<footer class=\"footer\"><p>Prototype by Amitesh Dwivedi</p><p>Sample data. Not affiliated with Aya Healthcare.</p></footer>"
      + "</div>";
    window.scrollTo(0, y);
  }

  function itemOf(packetId, itemId) {
    const packet = packetById(packetId);
    return { packet: packet, item: packet.items.find((item) => item.id === itemId) };
  }

  function applySample(item, fileId) {
    const before = item.status;
    let reason = "";
    if (fileId === "tb-clear") {
      item.status = "Pending";
      item.dateUnreadable = false;
      item.file = "tb-quantiferon-sep2.pdf";
      item.missingReason = "";
      item.precheck = {
        field: "Result date",
        read: "Sep 2, 2026",
        result: "Pass",
        confidence: 94,
        reason: "Within 12 months of the Oct 26 start."
      };
      reason = "Read result date Sep 2, 2026. Confidence 94. Within 12 months of the start. Status set to Pending, not Approved.";
      state.uploadNote = "Pre-check read the TB result date as Sep 2, 2026. Confidence 94. Status is Pending, not Approved. Carla still has to approve it. The specialist packet is updated.";
    } else if (fileId === "tb-blur") {
      item.status = "Pending";
      item.dateUnreadable = true;
      item.file = "tb-result-blurry.jpg";
      item.missingReason = "";
      item.precheck = {
        field: "Result date",
        read: "Unreadable",
        result: "Flag",
        confidence: 41,
        reason: "Blurry image. Result date could not be read."
      };
      reason = "Blurry image. Result date unreadable. Confidence 41. Status set to Pending, not Approved.";
      state.uploadNote = "Pre-check still cannot read the TB date. Confidence 41. Approve stays blocked.";
    } else if (fileId === "bls-new") {
      item.status = "Pending";
      item.expiresBeforeEnd = false;
      item.file = "bls-card-2028.pdf";
      item.missingReason = "";
      item.precheck = {
        field: "Expiration date",
        read: "Jun 30, 2028",
        result: "Pass",
        confidence: 97,
        reason: "Valid through the assignment end date Jan 23, 2027. Rule MV-3."
      };
      reason = "Read expiration Jun 30, 2028, after end date Jan 23, 2027. Rule MV-3 passes. Confidence 97. Status set to Pending, not Approved.";
      state.uploadNote = "Pre-check read a BLS card expiring Jun 30, 2028, after the Jan 23, 2027 end date. Status is Pending. Carla still has to approve it.";
    } else if (fileId === "bls-old") {
      item.status = "Pending";
      item.expiresBeforeEnd = true;
      item.file = "bls-card.jpg";
      item.missingReason = "";
      item.precheck = {
        field: "Expiration date",
        read: "12/31/2026",
        result: "Flag",
        confidence: 96,
        reason: "Expires 12/31/2026, before end 01/23/2027 (MV-3)."
      };
      reason = "Read expiration 12/31/2026, before end 01/23/2027. Rule MV-3. Confidence 96. Status set to Pending, not Approved.";
      state.uploadNote = "Pre-check read a BLS card that expires Dec 31, 2026, before the end date. Approve stays blocked.";
    } else if (fileId === "flu-ok") {
      item.status = "Pending";
      item.file = "flu-2026-27.pdf";
      item.missingReason = "";
      item.precheck = {
        field: "Vaccine date and season",
        read: "Sep 28, 2026, 2026-27 season",
        result: "Pass",
        confidence: 92,
        reason: "Record is for the 2026-27 season."
      };
      reason = "Read a 2026-27 flu record dated Sep 28, 2026. Confidence 92. Status set to Pending, not Approved.";
      state.uploadNote = "Pre-check read a 2026-27 flu record dated Sep 28, 2026. Status is Pending. Carla still has to approve it.";
    } else {
      return;
    }
    if (item.status === "Approved") item.status = "Pending";
    addLog("Pre-check", item.name, before, "Pending", reason);
  }

  function onInput(e) {
    const t = e.target;
    const bind = t.getAttribute && t.getAttribute("data-bind");
    if (!bind) return;
    if (bind === "nudge" || bind === "heads") {
      state[bind].draft = t.value;
      save();
      return;
    }
    if (bind === "reject-custom") {
      state.rejectCustom = t.value;
      save();
    }
  }

  function onClick(e) {
    const el = e.target.closest("[data-act]");
    if (!el || !document.getElementById("app").contains(el)) return;
    const act = el.getAttribute("data-act");
    const id = el.getAttribute("data-id");
    const packetId = el.getAttribute("data-packet") || state.packetId;

    if (act === "screen") {
      state.screen = id;
      state.notice = "";
      save();
      render(true);
      return;
    }
    if (act === "status") {
      state.statusFilter = id;
      save();
      render();
      return;
    }
    if (act === "week") {
      state.weekFilter = id;
      save();
      render();
      return;
    }
    if (act === "clear-filters") {
      state.statusFilter = "All";
      state.weekFilter = "All";
      save();
      render();
      return;
    }
    if (act === "open") {
      const packet = packetById(id);
      state.packetId = packet.id;
      state.screen = "packet";
      const first = sortedItems(packet.items).find((item) => item.status !== "Approved") || packet.items[0];
      state.selectedItem = first.id;
      state.notice = "";
      save();
      render(true);
      return;
    }
    if (act === "select") {
      state.packetId = packetId;
      state.selectedItem = id;
      state.screen = "packet";
      render();
      return;
    }
    if (act === "approve") {
      const found = itemOf(packetId, id);
      const item = found.item;
      if (!item || found.packet.submitted) return;
      const block = blockReason(item);
      if (block || item.status === "Approved") {
        state.notice = block || "Already approved.";
        render();
        return;
      }
      const before = item.status;
      item.status = "Approved";
      item.approvedBy = "Carla Mendes";
      let reason = "Specialist approved. The pre-check did not approve this.";
      if (item.nameMismatch && item.nameChangeLinked) reason = "Name-change document linked (marriage certificate). The pre-check did not approve this.";
      if (item.precheck && item.precheck.result === "Pass") reason = "Pre-check read " + item.precheck.read + ". Carla approved it. The pre-check did not set Approved.";
      addLog("Carla Mendes", item.name, before, "Approved", reason);
      state.selectedItem = item.id;
      state.notice = "Approved " + item.shortName + ". " + approvedCount(found.packet) + " of " + found.packet.items.length + " approved.";
      save();
      render();
      return;
    }
    if (act === "unlink") {
      const item = itemOf(packetId, id).item;
      if (!item || item.status === "Approved") return;
      item.nameChangeLinked = false;
      addLog("Carla Mendes", item.name, "Name-change linked", "Name-change unlinked", "Unlink document (demo). Approve is now blocked.");
      state.notice = "Marriage certificate unlinked. Approve is blocked until a name-change document is linked.";
      save();
      render();
      return;
    }
    if (act === "reject-open") {
      state.rejectFor = packetId + ":" + id;
      state.rejectCustom = "";
      state.selectedItem = id;
      render();
      return;
    }
    if (act === "reject-cancel") {
      state.rejectFor = "";
      render();
      return;
    }
    if (act === "reject-now" || act === "reject-custom") {
      const found = itemOf(packetId, id);
      const item = found.item;
      const reason = act === "reject-now" ? el.getAttribute("data-reason") : state.rejectCustom.trim();
      if (!item || !reason) {
        state.notice = "Add a reason to reject.";
        render();
        return;
      }
      const before = item.status;
      item.status = "Missing";
      item.missingReason = reason;
      item.file = "";
      item.expiresBeforeEnd = item.id === "bls";
      item.dateUnreadable = false;
      state.rejectFor = "";
      addLog("Carla Mendes", item.name, before, "Missing", "Rejected. Reason: " + reason);
      state.notice = "Rejected " + item.shortName + ". It is Missing. Nothing was sent.";
      save();
      render();
      return;
    }
    if (act === "request") {
      const found = itemOf(packetId, id);
      const item = found.item;
      if (!item) return;
      const before = item.status;
      const why = item.dateUnreadable
        ? "New image requested. The photo was blurry and the date was unreadable."
        : "New file requested.";
      item.status = "Missing";
      item.missingReason = why;
      item.file = "";
      item.dateUnreadable = false;
      addLog("Carla Mendes", item.name, before, "Missing", why);
      state.notice = "Requested a new file for " + item.shortName + ". Nothing was sent.";
      save();
      render();
      return;
    }
    if (act === "tab") {
      state.tab = id;
      save();
      render();
      return;
    }
    if (act === "msg-approve") {
      const msg = state[id];
      if (!msg || msg.status === "approved") return;
      if (!msg.draft.trim()) {
        msg.error = "The draft is empty.";
        render();
        return;
      }
      msg.status = "approved";
      msg.saved = msg.draft;
      msg.editing = false;
      msg.error = "";
      const label = id === "nudge" ? "Nudge to Dana" : "Recruiter heads-up";
      addLog("Carla Mendes", label, "Draft", "Approved", "Approved to send. Nothing has been sent yet.");
      state.notice = "Approved the " + (id === "nudge" ? "nudge" : "heads-up") + ". Nothing was sent.";
      save();
      render();
      return;
    }
    if (act === "msg-edit") {
      state[id].editing = true;
      state[id].error = "";
      render();
      return;
    }
    if (act === "msg-cancel") {
      state[id].draft = state[id].saved;
      state[id].editing = false;
      render();
      return;
    }
    if (act === "msg-save") {
      const msg = state[id];
      if (!msg.draft.trim()) {
        msg.error = "The draft is empty.";
        render();
        return;
      }
      const changed = msg.draft.trim() !== msg.saved.trim();
      msg.saved = msg.draft;
      msg.editing = false;
      msg.error = "";
      if (changed) {
        const label = id === "nudge" ? "Nudge to Dana" : "Recruiter heads-up";
        addLog("Carla Mendes", label, "Draft", "Draft edited", "Edit saved. Nothing was sent.");
        state.notice = "Edit saved. Nothing was sent.";
      }
      save();
      render();
      return;
    }
    if (act === "msg-sent") {
      const msg = state[id];
      if (!msg || msg.status !== "approved" || msg.sent) return;
      msg.sent = true;
      const label = id === "nudge" ? "Nudge to Dana" : "Recruiter heads-up";
      addLog("Carla Mendes", label, "Approved", "Marked as sent (demo)", "Nothing left this browser.");
      state.notice = "Marked as sent in this demo. Nothing left this browser.";
      save();
      render();
      return;
    }
    if (act === "upload-open") {
      state.uploadFor = id;
      render();
      return;
    }
    if (act === "upload-cancel") {
      state.uploadFor = "";
      render();
      return;
    }
    if (act === "upload-pick") {
      const item = dana().items.find((row) => row.id === id);
      if (!item) return;
      applySample(item, el.getAttribute("data-file"));
      state.uploadFor = "";
      state.selectedItem = item.id;
      state.notice = state.uploadNote;
      save();
      render();
      return;
    }
    if (act === "submit") {
      const packet = packetById(id);
      if (!packet || packet.submitted) return;
      if (lockReasons(packet).length) {
        state.notice = "Submit stays locked until every required item is Approved.";
        render();
        return;
      }
      packet.submitted = true;
      addLog("Carla Mendes", packet.clinician + " packet", "Ready to submit", "Submitted", "Submit (demo). Nothing was sent to the facility.");
      state.notice = "Marked submitted in this demo. Nothing was sent to the facility.";
      save();
      render();
      return;
    }
    if (act === "reset") {
      localStorage.removeItem(KEY);
      state = seed();
      state.notice = "Demo reset to the Oct 8 sample file.";
      save();
      render(true);
    }
  }

  const app = document.getElementById("app");
  app.addEventListener("click", onClick);
  app.addEventListener("input", onInput);
  render(true);
})();
