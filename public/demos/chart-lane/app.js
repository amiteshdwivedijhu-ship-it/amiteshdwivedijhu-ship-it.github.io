(function () {
  var KEY = "chart-lane-flagler-v1";

  function eligAuthNeeded() {
    return [
      { name: "Plan active", result: "Active", tone: "good", detail: "The payer shows an active plan in this fake check." },
      { name: "Benefit", result: "Listed", tone: "good", detail: "This visit type is on the benefit list." },
      { name: "Auth on file", result: "Not found", tone: "bad", detail: "No auth is on file. The payer wants one before the visit." },
      { name: "Deductible left", result: "Can't tell", tone: "unk", detail: "The payer did not send this number. Do not guess what the patient owes." }
    ];
  }

  function eligNoAuth() {
    return [
      { name: "Plan active", result: "Active", tone: "good", detail: "The payer shows an active plan in this fake check." },
      { name: "Benefit", result: "Listed", tone: "good", detail: "This visit type is on the benefit list." },
      { name: "Auth on file", result: "Not required", tone: "good", detail: "This visit does not need an auth." },
      { name: "Deductible left", result: "Can't tell", tone: "unk", detail: "The payer did not send this number. Do not guess what the patient owes." }
    ];
  }

  function eligOnFile(id) {
    return [
      { name: "Plan active", result: "Active", tone: "good", detail: "The payer shows an active plan in this fake check." },
      { name: "Benefit", result: "Listed", tone: "good", detail: "This visit type is on the benefit list." },
      { name: "Auth on file", result: "On file", tone: "good", detail: "Fake auth id " + id + " is already on file." },
      { name: "Deductible left", result: "Can't tell", tone: "unk", detail: "The payer did not send this number. Do not guess what the patient owes." }
    ];
  }

  var VISITS = [
    {
      id: "A", patient: "Patient A", time: "9:10 AM", room: "Room 2",
      provider: "Provider 07", payer: "Payer North", plan: "Commercial",
      member: "SYN-1044", visit: "Right knee injection", cpt: "20610", value: 480,
      status: "auth_needed", copay: 40, authId: "",
      note: "Patient A has right knee pain that limits walking. Care so far has not been enough. The plan for today is an injection.",
      sources: {
        sched: "9:10 AM, Room 2, right knee injection, Provider 07, Clinic North.",
        note: "Right knee pain limits walking. Care so far has not been enough. Plan: injection today.",
        pt: "Therapy log: therapy visits across 6 weeks. The prose note does not state the week count.",
        img: "Imaging list: right knee image dated Mar 18. The prose note does not repeat the day."
      },
      lines: [
        { label: "Who", value: "Patient A with Provider 07 at Clinic North", source: "sched" },
        { label: "What", value: "Right knee injection, code 20610", source: "sched" },
        { label: "Why", value: "Pain limits walking, and earlier care was not enough", source: "note" },
        { label: "Weeks of care", fromGap: "pt", source: "pt" },
        { label: "Imaging date", fromGap: "img", source: "img" }
      ],
      gaps: [
        {
          id: "pt", label: "Weeks of care before the shot",
          why: "Payer North asks for this number before it reviews an injection.",
          options: [
            { value: "6 weeks", label: "6 weeks, from the therapy log", match: true },
            { value: "4 weeks", label: "4 weeks", match: false },
            { value: "not_in_chart", label: "Not in the chart", match: false }
          ]
        },
        {
          id: "img", label: "Imaging date",
          why: "The note says imaging exists. The date is only on the imaging list.",
          options: [
            { value: "Mar 18", label: "Mar 18, from the imaging list", match: true },
            { value: "Mar 2", label: "Mar 2", match: false },
            { value: "not_in_chart", label: "Not in the chart", match: false }
          ]
        }
      ],
      elig: eligAuthNeeded(),
      timeline: [{ t: "8:02 AM", actor: "Lane (agent)", label: "Plan check finished. Auth is required." }]
    },
    {
      id: "B", patient: "Patient B", time: "9:20 AM", room: "Room 1",
      provider: "Provider 03", payer: "Payer East", plan: "Commercial",
      member: "SYN-1880", visit: "PT eval", cpt: "97161", value: 140,
      status: "no_auth", copay: 25, authId: "",
      note: "First therapy visit for a sore shoulder. No procedure today.",
      elig: eligNoAuth(),
      timeline: [{ t: "8:05 AM", actor: "Lane (agent)", label: "Plan check finished. No auth needed." }]
    },
    {
      id: "C", patient: "Patient C", time: "9:30 AM", room: "Imaging",
      provider: "Provider 12", payer: "Payer West", plan: "Commercial",
      member: "SYN-2201", visit: "Lumbar MRI", cpt: "72148", value: 610,
      status: "mismatch", copay: null, authId: "",
      note: "Order is for a lumbar MRI. The chart member id does not match the card.",
      sources: {
        sched: "9:30 AM, Imaging, lumbar MRI, Provider 12.",
        order: "Order: lumbar MRI. Not cervical.",
        card: "Card photo on file reads SYN-2201-B. The chart field reads SYN-2201."
      },
      lines: [
        { label: "Who", value: "Patient C with Provider 12", source: "sched" },
        { label: "What", value: "Lumbar MRI, code 72148", source: "order" },
        { label: "Body part", fromGap: "part", source: "order" }
      ],
      gaps: [
        {
          id: "part", label: "Body part on the order",
          why: "A wrong body part is a common reason an auth comes back.",
          options: [
            { value: "Lumbar", label: "Lumbar, from the order", match: true },
            { value: "Cervical", label: "Cervical", match: false },
            { value: "not_in_chart", label: "Not in the chart", match: false }
          ]
        }
      ],
      elig: [],
      timeline: [{ t: "8:11 AM", actor: "Lane (agent)", label: "Plan check stopped. Member id does not match." }]
    },
    {
      id: "D", patient: "Patient D", time: "9:40 AM", room: "Room 3",
      provider: "Provider 07", payer: "Payer North", plan: "Commercial",
      member: "SYN-1302", visit: "Shoulder injection", cpt: "20610", value: 520,
      status: "draft", copay: 40, authId: "",
      note: "Shoulder injection planned. A draft was started. It still needs a signature.",
      sources: { sched: "9:40 AM, Room 3, shoulder injection, Provider 07.", note: "Shoulder pain after a fall. Injection planned today." },
      lines: [
        { label: "Who", value: "Patient D with Provider 07", source: "sched" },
        { label: "What", value: "Shoulder injection, code 20610", source: "sched" },
        { label: "Why", value: "Shoulder pain after a fall. Injection planned today.", source: "note" }
      ],
      gaps: [],
      elig: eligAuthNeeded(),
      timeline: [{ t: "8:20 AM", actor: "Lane (agent)", label: "Draft started from the chart. Not sent." }]
    },
    {
      id: "E", patient: "Patient E", time: "9:50 AM", room: "Room 4",
      provider: "Provider 12", payer: "Payer East", plan: "Commercial",
      member: "SYN-1411", visit: "Hip clinic visit", cpt: "99213", value: 180,
      status: "eligibility_needed", afterCheck: "no_auth", copay: 30, authId: "",
      note: "Clinic visit only. No procedure on the schedule.",
      elig: [],
      timeline: []
    },
    {
      id: "F", patient: "Patient F", time: "10:00 AM", room: "Room 2",
      provider: "Provider 07", payer: "Payer North", plan: "Commercial",
      member: "SYN-1550", visit: "Low back injection", cpt: "27096", value: 640,
      status: "needs_action", copay: 50, authId: "",
      note: "The payer sent the auth back. They want the weeks of care before the shot.",
      sources: {
        sched: "10:00 AM, Room 2, low back injection, Provider 07.",
        note: "Low back pain. Injection planned.",
        pt: "Therapy log shows 6 weeks. That number was not in the packet that was sent."
      },
      lines: [
        { label: "Who", value: "Patient F with Provider 07", source: "sched" },
        { label: "What", value: "Low back injection, code 27096", source: "sched" },
        { label: "Why", value: "Low back pain. Injection planned.", source: "note" },
        { label: "Weeks of care", fromGap: "pt", source: "pt" }
      ],
      gaps: [
        {
          id: "pt", label: "Weeks of care before the shot",
          why: "Payer North sent this back. The therapy log has the number. The first packet did not.",
          options: [
            { value: "6 weeks", label: "6 weeks, from the therapy log", match: true },
            { value: "2 weeks", label: "2 weeks", match: false },
            { value: "not_in_chart", label: "Not in the chart", match: false }
          ]
        }
      ],
      elig: [
        { name: "Plan active", result: "Active", tone: "good", detail: "The plan is active in this fake check." },
        { name: "Benefit", result: "Listed", tone: "good", detail: "The injection is on the benefit list." },
        { name: "Auth status", result: "Sent back", tone: "bad", detail: "Payer asked for weeks of care before the shot." },
        { name: "Deductible left", result: "Can't tell", tone: "unk", detail: "The payer did not send this number." }
      ],
      timeline: [
        { t: "Yesterday", actor: "Lane (agent)", label: "Packet sent (fake)." },
        { t: "8:30 AM", actor: "Payer North (simulated)", label: "Sent back. Need weeks of care." }
      ]
    },
    {
      id: "G", patient: "Patient G", time: "10:10 AM", room: "Room 5",
      provider: "Provider 12", payer: "Payer West", plan: "Commercial",
      member: "SYN-1602", visit: "Carpal tunnel consult", cpt: "99204", value: 260,
      status: "submitted", copay: 40, authId: "",
      note: "Consult sent for review. No reply yet.",
      elig: eligAuthNeeded(),
      timeline: [{ t: "8:40 AM", actor: "Coordinator 02", label: "Packet sent (fake). Waiting on the payer." }]
    },
    {
      id: "H", patient: "Patient H", time: "10:20 AM", room: "Imaging",
      provider: "Provider 12", payer: "Payer East", plan: "Commercial",
      member: "SYN-1710", visit: "Knee MRI", cpt: "73721", value: 580,
      status: "clear", copay: 40, authId: "SYN-OK-H18",
      note: "Auth already on file. Clear to do the MRI.",
      elig: eligOnFile("SYN-OK-H18"),
      timeline: [{ t: "Last week", actor: "Payer East (simulated)", label: "Auth SYN-OK-H18 marked clear in this demo." }]
    },
    {
      id: "I", patient: "Patient I", time: "10:40 AM", room: "Room 2",
      provider: "Provider 07", payer: "Payer North", plan: "Commercial",
      member: "SYN-1804", visit: "Lumbar injection", cpt: "62323", value: 890,
      status: "auth_needed", copay: 50, authId: "",
      note: "Epidural injection planned. Auth has not been started.",
      sources: { sched: "10:40 AM, Room 2, lumbar injection, Provider 07.", note: "Leg pain from the low back. An injection is planned." },
      lines: [
        { label: "Who", value: "Patient I with Provider 07", source: "sched" },
        { label: "What", value: "Lumbar injection, code 62323", source: "sched" },
        { label: "Why", value: "Leg pain from the low back. An injection is planned.", source: "note" }
      ],
      gaps: [],
      elig: eligAuthNeeded(),
      timeline: [{ t: "8:44 AM", actor: "Lane (agent)", label: "Plan check finished. Auth is required." }]
    },
    {
      id: "J", patient: "Patient J", time: "10:50 AM", room: "Room 1",
      provider: "Provider 03", payer: "Payer East", plan: "Commercial",
      member: "SYN-1900", visit: "PT follow up", cpt: "97110", value: 95,
      status: "no_auth", copay: 20, authId: "",
      note: "Return therapy visit. No auth needed in this demo.",
      elig: eligNoAuth(),
      timeline: [{ t: "8:46 AM", actor: "Lane (agent)", label: "No auth needed." }]
    },
    {
      id: "K", patient: "Patient K", time: "11:00 AM", room: "Imaging",
      provider: "Provider 12", payer: "Payer West", plan: "Commercial",
      member: "SYN-2008", visit: "Cervical MRI", cpt: "72141", value: 590,
      status: "payer_down", copay: null, authId: "",
      note: "The payer link did not answer. Do not cancel the visit.",
      elig: [],
      timeline: [{ t: "8:48 AM", actor: "Lane (agent)", label: "Payer link did not answer." }]
    },
    {
      id: "L", patient: "Patient L", time: "11:10 AM", room: "Room 3",
      provider: "Provider 07", payer: "Payer North", plan: "Commercial",
      member: "SYN-2114", visit: "Ankle injection", cpt: "20605", value: 410,
      status: "submitted", copay: 40, authId: "",
      note: "Packet sent. Waiting.",
      elig: eligAuthNeeded(),
      timeline: [{ t: "8:52 AM", actor: "Coordinator 02", label: "Packet sent (fake)." }]
    },
    {
      id: "M", patient: "Patient M", time: "11:20 AM", room: "Room 4",
      provider: "Provider 12", payer: "Payer East", plan: "Commercial",
      member: "SYN-2220", visit: "Elbow pain visit", cpt: "99213", value: 175,
      status: "eligibility_needed", afterCheck: "auth_needed", copay: 30, authId: "",
      note: "The plan check has not been run. A procedure may be added.",
      sources: { sched: "11:20 AM, Room 4, elbow pain visit, Provider 12.", note: "Elbow pain. The team may add an injection." },
      lines: [
        { label: "Who", value: "Patient M with Provider 12", source: "sched" },
        { label: "What", value: "Elbow pain visit, code 99213", source: "sched" },
        { label: "Why", value: "Elbow pain. The team may add an injection.", source: "note" }
      ],
      gaps: [],
      elig: [],
      timeline: []
    },
    {
      id: "N", patient: "Patient N", time: "11:30 AM", room: "Room 5",
      provider: "Provider 07", payer: "Payer North", plan: "Commercial",
      member: "SYN-2301", visit: "Spine follow up", cpt: "99214", value: 210,
      status: "clear", copay: 40, authId: "SYN-OK-N02",
      note: "Follow up. Auth already cleared in this demo.",
      elig: eligOnFile("SYN-OK-N02"),
      timeline: [{ t: "Monday", actor: "Payer North (simulated)", label: "Marked clear in this demo." }]
    },
    {
      id: "O", patient: "Patient O", time: "11:40 AM", room: "Room 6",
      provider: "Provider 12", payer: "Payer West", plan: "Commercial",
      member: "SYN-2406", visit: "Knee scope consult", cpt: "99204", value: 540,
      status: "auth_needed", copay: 45, authId: "",
      note: "Surgery consult. Auth not started.",
      sources: { sched: "11:40 AM, Room 6, knee scope consult, Provider 12.", note: "Knee locking. Consult for a possible scope." },
      lines: [
        { label: "Who", value: "Patient O with Provider 12", source: "sched" },
        { label: "What", value: "Knee scope consult, code 99204", source: "sched" },
        { label: "Why", value: "Knee locking. Consult for a possible scope.", source: "note" }
      ],
      gaps: [],
      elig: eligAuthNeeded(),
      timeline: [{ t: "8:58 AM", actor: "Lane (agent)", label: "Auth required. Packet not started." }]
    },
    {
      id: "P", patient: "Patient P", time: "1:00 PM", room: "Imaging",
      provider: "Provider 12", payer: "Payer East", plan: "Commercial",
      member: "SYN-2509", visit: "Wrist MRI", cpt: "73221", value: 560,
      status: "draft", copay: 40, authId: "",
      note: "Draft is open. Not signed.",
      sources: { sched: "1:00 PM, Imaging, wrist MRI, Provider 12.", note: "Wrist pain after a twist. MRI requested." },
      lines: [
        { label: "Who", value: "Patient P with Provider 12", source: "sched" },
        { label: "What", value: "Wrist MRI, code 73221", source: "sched" },
        { label: "Why", value: "Wrist pain after a twist. MRI requested.", source: "note" }
      ],
      gaps: [],
      elig: eligAuthNeeded(),
      timeline: [{ t: "9:02 AM", actor: "Lane (agent)", label: "Draft started. Not sent." }]
    },
    {
      id: "Q", patient: "Patient Q", time: "1:10 PM", room: "Room 2",
      provider: "Provider 07", payer: "Payer North", plan: "Commercial",
      member: "SYN-2612", visit: "Hip injection", cpt: "20610", value: 470,
      status: "submitted", copay: 40, authId: "",
      note: "Waiting on Payer North.",
      elig: eligAuthNeeded(),
      timeline: [{ t: "9:05 AM", actor: "Coordinator 02", label: "Packet sent (fake)." }]
    },
    {
      id: "R", patient: "Patient R", time: "1:20 PM", room: "Room 1",
      provider: "Provider 03", payer: "Payer West", plan: "Commercial",
      member: "SYN-2704", visit: "Back PT start", cpt: "97161", value: 130,
      status: "no_auth", copay: 20, authId: "",
      note: "Therapy start. No auth in this demo.",
      elig: eligNoAuth(),
      timeline: [{ t: "9:06 AM", actor: "Lane (agent)", label: "No auth needed." }]
    },
    {
      id: "S", patient: "Patient S", time: "1:30 PM", room: "Room 1",
      provider: "Provider 03", payer: "Payer East", plan: "Commercial",
      member: "SYN-2807", visit: "Neck PT", cpt: "97110", value: 95,
      status: "no_auth", copay: 20, authId: "",
      note: "Therapy visit. No auth in this demo.",
      elig: eligNoAuth(),
      timeline: [{ t: "9:07 AM", actor: "Lane (agent)", label: "No auth needed." }]
    },
    {
      id: "T", patient: "Patient T", time: "1:40 PM", room: "Room 5",
      provider: "Provider 07", payer: "Payer North", plan: "Commercial",
      member: "SYN-2915", visit: "Knee follow up", cpt: "99213", value: 160,
      status: "submitted", copay: 30, authId: "",
      note: "Follow up auth is with the payer.",
      elig: eligAuthNeeded(),
      timeline: [{ t: "9:08 AM", actor: "Coordinator 02", label: "Packet sent (fake)." }]
    }
  ];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function fresh() {
    return {
      visits: clone(VISITS),
      answers: {},
      signers: {},
      attest: {},
      activity: [
        { t: "8:02 AM", actor: "Lane (agent)", text: "Finished the morning plan check for Clinic North.", visitId: "" },
        { t: "8:11 AM", actor: "Lane (agent)", text: "Patient C member id does not match the card photo.", visitId: "C" },
        { t: "8:30 AM", actor: "Payer North (simulated)", text: "Sent Patient F back. Asked for weeks of care.", visitId: "F" },
        { t: "8:48 AM", actor: "Lane (agent)", text: "Payer link did not answer for Patient K.", visitId: "K" }
      ],
      clockMin: 70,
      view: "board",
      selectedId: "A",
      filter: "all",
      q: "",
      logFilter: "all",
      openSource: "",
      banner: ""
    };
  }

  var state = fresh();
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && saved.visits && saved.visits.length === VISITS.length) state = saved;
  } catch (e) { state = fresh(); }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function commit() { save(); render(); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function money(n) { return "$" + Number(n || 0).toLocaleString("en-US"); }

  function stamp() {
    state.clockMin += 2;
    var total = 8 * 60 + state.clockMin;
    var h24 = Math.floor(total / 60);
    var m = total % 60;
    var ap = h24 >= 12 ? "PM" : "AM";
    var h = h24 % 12;
    if (h === 0) h = 12;
    return h + ":" + String(m).padStart(2, "0") + " " + ap;
  }

  function log(actor, text, visitId) {
    state.activity.unshift({ t: stamp(), actor: actor, text: text, visitId: visitId || "" });
  }

  function visit() {
    return state.visits.filter(function (v) { return v.id === state.selectedId; })[0] || state.visits[0];
  }

  function ans(v, gapId) {
    var bag = state.answers[v.id] || {};
    return bag[gapId] || { choice: "", reason: "" };
  }

  function setAns(v, gapId, patch) {
    if (!state.answers[v.id]) state.answers[v.id] = {};
    var cur = state.answers[v.id][gapId] || { choice: "", reason: "" };
    state.answers[v.id][gapId] = {
      choice: patch.choice != null ? patch.choice : cur.choice,
      reason: patch.reason != null ? patch.reason : cur.reason
    };
  }

  var STATUS = {
    eligibility_needed: ["Check the plan", "unk"],
    mismatch: ["Id does not match", "bad"],
    payer_down: ["Payer link is down", "bad"],
    auth_needed: ["Auth not started", "bad"],
    draft: ["Draft, not sent", "unk"],
    submitted: ["Sent to payer", "unk"],
    needs_action: ["Payer sent it back", "bad"],
    clear: ["Clear to treat", "good"],
    no_auth: ["No auth needed", "good"]
  };

  function pill(status) {
    var s = STATUS[status] || ["Unknown", "plain"];
    return '<span class="pill ' + s[1] + '">' + esc(s[0]) + "</span>";
  }

  function isClear(v) { return v.status === "clear" || v.status === "no_auth"; }
  function needsPerson(v) {
    return ["eligibility_needed", "mismatch", "payer_down", "auth_needed", "draft", "needs_action"].indexOf(v.status) >= 0;
  }

  function gapDone(v, g) {
    var a = ans(v, g.id);
    if (!a.choice) return false;
    if (a.choice === "not_in_chart") return (a.reason || "").trim().length >= 12;
    return true;
  }

  function gaps(v) { return v.gaps || []; }

  function allGapsDone(v) {
    var gs = gaps(v);
    for (var i = 0; i < gs.length; i++) if (!gapDone(v, gs[i])) return false;
    return true;
  }

  function optionMeta(g, choice) {
    var opts = g.options || [];
    for (var i = 0; i < opts.length; i++) if (opts[i].value === choice) return opts[i];
    return null;
  }

  function canSend(v) {
    if (!v) return { ok: false, why: "Pick a visit first." };
    if (v.status === "clear" || v.status === "no_auth") return { ok: false, why: "Nothing to send. This visit is already clear in the demo." };
    if (v.status === "submitted") return { ok: false, why: "This packet was already sent. Wait, or use the demo reply on the Pulse screen." };
    if (v.status === "mismatch") return { ok: false, why: "Fix the member id on the plan check before you send an auth." };
    if (v.status === "payer_down") return { ok: false, why: "The payer link is down. Retry it before you send." };
    if (v.status === "eligibility_needed") return { ok: false, why: "Run the plan check first. Do not send an auth you have not checked." };
    if (!allGapsDone(v)) return { ok: false, why: "Fill every open item. If you pick Not in the chart, type a short reason (at least 12 characters)." };
    if (!state.signers[v.id]) return { ok: false, why: "Pick who is signing." };
    if (!state.attest[v.id]) return { ok: false, why: "Check the box that you read the sources." };
    return { ok: true, why: "Ready to send. This send stays on this computer. No payer receives it." };
  }

  function filtered() {
    var q = (state.q || "").trim().toLowerCase();
    return state.visits.filter(function (v) {
      if (state.filter === "needs" && !needsPerson(v)) return false;
      if (state.filter === "plan" && ["eligibility_needed", "mismatch", "payer_down"].indexOf(v.status) < 0) return false;
      if (state.filter === "auth" && ["auth_needed", "draft", "needs_action", "submitted"].indexOf(v.status) < 0) return false;
      if (state.filter === "clear" && !isClear(v)) return false;
      if (!q) return true;
      var blob = [v.patient, v.visit, v.payer, v.provider, v.room, v.cpt, v.member].join(" ").toLowerCase();
      return blob.indexOf(q) >= 0;
    });
  }

  function totals() {
    var atRisk = 0, cleared = 0, need = 0, clearN = 0;
    state.visits.forEach(function (v) {
      if (isClear(v)) { cleared += v.value; clearN += 1; }
      else atRisk += v.value;
      if (needsPerson(v)) need += 1;
    });
    return { atRisk: atRisk, cleared: cleared, need: need, clearN: clearN };
  }

  function sourceBtn(v, key) {
    var open = state.openSource === v.id + ":" + key;
    var quote = (v.sources || {})[key] || "No chart quote is stored for this line in the demo.";
    return '<div><button type="button" class="chip" data-action="source" data-key="' + esc(key) + '">' +
      (open ? "Hide source" : "Show source") + "</button>" +
      (open ? '<div class="quote">' + esc(quote) + "</div>" : "") + "</div>";
  }

  function lineValue(v, line) {
    if (!line.fromGap) return line.value;
    var a = ans(v, line.fromGap);
    if (!a.choice) return "Still open";
    if (a.choice === "not_in_chart") return "Marked not in the chart. Reason: " + (a.reason || "");
    return a.choice;
  }

  function nav() {
    var items = [
      ["board", "Morning"],
      ["chart", "Chart"],
      ["plan", "Plan check"],
      ["packet", "Packet"],
      ["sign", "Sign"],
      ["pulse", "Pulse"]
    ];
    return '<nav class="nav" aria-label="Screens">' + items.map(function (it) {
      var cur = state.view === it[0] ? ' aria-current="page"' : "";
      return '<button type="button" data-action="nav" data-view="' + it[0] + '"' + cur + ">" + it[1] + "</button>";
    }).join("") + "</nav>";
  }

  function shell(body) {
    var t = totals();
    return '<header class="top"><div class="brand"><div class="mark">CL</div><div><h1>Chart Lane</h1>' +
      '<p class="sub">Clinic North, fake MSK morning. ' + state.visits.length + ' visits. ' +
      t.need + ' need a person. Dollars still at risk ' + money(t.atRisk) + " (fake).</p></div></div>" +
      '<button type="button" class="btn" data-action="reset">Reset demo</button></header>' +
      nav() + body +
      '<p class="foot">Synthetic demo for practice. Not affiliated with Flagler Health. Not a real clinic, payer, chart, or medical decision. No real patient is shown. Numbers are made up. A send on this page does not leave your browser.</p>';
  }

  function steps(n) {
    var labels = ["1 Morning", "2 Chart", "3 Plan", "4 Packet", "5 Sign", "6 Pulse"];
    return '<div class="steps">' + labels.map(function (lb, i) {
      return '<span class="' + (i + 1 === n ? "on" : "") + '">' + lb + "</span>";
    }).join("") + "</div>";
  }

  function renderBoard() {
    var rows = filtered();
    var chips = [
      ["all", "All"],
      ["needs", "Needs a person"],
      ["plan", "Plan problems"],
      ["auth", "Auth work"],
      ["clear", "Clear"]
    ];
    var chipHtml = chips.map(function (c) {
      var on = state.filter === c[0] ? ' aria-current="page"' : "";
      return '<button type="button" class="chip" data-action="filter" data-filter="' + c[0] + '"' + on + ">" + c[1] + "</button>";
    }).join("");
    var list = rows.length ? '<div class="cards">' + rows.map(function (v) {
      return '<button type="button" class="card" data-action="open" data-id="' + v.id + '">' +
        '<p class="kicker">' + esc(v.time) + " | " + esc(v.room) + "</p>" +
        "<h3>" + esc(v.patient) + "</h3>" +
        "<p>" + esc(v.visit) + "</p>" +
        '<p class="kicker">' + esc(v.provider) + " | " + esc(v.payer) + " | code " + esc(v.cpt) + "</p>" +
        '<div class="row">' + pill(v.status) + '<span class="pill plain">' + money(v.value) + " fake allowed</span></div>" +
        (v.id === "A" ? '<p class="kicker">Start here for the 90 second path.</p>' : "") +
        "</button>";
    }).join("") + "</div>" : '<div class="panel"><h2>No visits match</h2><p>Clear the search or pick All to see the morning list.</p></div>';
    var t = totals();
    return shell(
      steps(1) +
      '<div class="tiles">' +
      tile(String(state.visits.length), "Visits today") +
      tile(String(t.need), "Need a person") +
      tile(String(t.clearN), "Clear to treat") +
      tile(money(t.atRisk), "Still at risk (fake)") +
      "</div>" +
      '<div class="panel" style="margin-bottom:12px"><p class="stamp">In the chart</p>' +
      "<h2>Visits that need a money check</h2>" +
      "<p>Chart Lane sits next to the chart. It checks the plan, drafts the prior auth from chart lines, and waits for a person to sign. It does not ask the clinic for a new login in this story.</p>" +
      '<div class="row">' + chipHtml + "</div>" +
      '<label class="block" for="q" style="margin-top:10px">Search</label><input id="q" data-action="q" value="' + esc(state.q) + '" placeholder="Patient, payer, visit">' +
      "</div>" + list
    );
  }

  function tile(big, small) {
    return '<div class="card tile"><strong>' + esc(big) + '</strong><span>' + esc(small) + "</span></div>";
  }

  function renderChart() {
    var v = visit();
    var next = "Open the plan check";
    var dest = "plan";
    if (v.status === "auth_needed" || v.status === "draft" || v.status === "needs_action") { next = "Open the packet"; dest = "packet"; }
    if (v.status === "submitted" || isClear(v)) { next = "See the pulse"; dest = "pulse"; }
    return shell(
      steps(2) +
      '<div class="split"><article class="panel"><p class="kicker">' + esc(v.time) + " | " + esc(v.room) + "</p>" +
      "<h2>" + esc(v.patient) + "</h2>" +
      "<p>" + esc(v.visit) + " | code " + esc(v.cpt) + "</p>" +
      "<p>" + esc(v.note) + "</p>" +
      '<p class="kicker">' + esc(v.provider) + " | " + esc(v.payer) + " " + esc(v.plan) + " | member " + esc(v.member) + "</p>" +
      '<div class="row">' + pill(v.status) + "</div>" +
      (v.id === "A" ? "<p>90 second path: read this chart, check the plan, fill the two open lines from their sources, sign, send, then mark the fake payer reply on Pulse.</p>" : "") +
      '<div class="actions"><button type="button" class="btn primary" data-action="nav" data-view="' + dest + '">' + next + "</button>" +
      '<button type="button" class="btn" data-action="nav" data-view="board">Back to morning</button></div></article>' +
      '<aside class="lane"><p class="stamp">Routing slip</p><h3>Lane for this visit</h3>' +
      "<p>Fake allowed amount " + money(v.value) + ". " +
      (v.copay == null ? "Copay: can't tell yet." : "Copay on file: " + money(v.copay) + " (fake). This is not the full patient cost.") +
      "</p><p>" + laneBlurb(v) + "</p>" +
      '<div class="actions"><button type="button" class="btn" data-action="nav" data-view="plan">Plan check</button>' +
      '<button type="button" class="btn" data-action="nav" data-view="packet">Packet</button></div></aside></div>'
    );
  }

  function laneBlurb(v) {
    if (v.status === "mismatch") return "Stop. The member id on the chart does not match the card. Do not tell the patient the MRI is denied. Fix the id first.";
    if (v.status === "payer_down") return "The payer link did not answer. Keep the visit on the schedule. Retry the link. Do not invent a coverage answer.";
    if (v.status === "eligibility_needed") return "The plan check has not run. Run it before anyone talks about an auth.";
    if (v.status === "no_auth") return "The plan is active and this visit does not need an auth. The team can treat.";
    if (v.status === "clear") return "Clear to treat in this demo. Auth id " + (v.authId || "none") + ". This is not a claim. The note still has to match the auth.";
    if (v.status === "needs_action") return "The payer sent the auth back. The chart may already hold the missing fact. Add it and send again.";
    if (v.status === "submitted") return "Sent. The visit is not clear until the payer replies. Use Pulse to play a fake reply.";
    if (v.status === "draft") return "A draft is open. A person still has to sign before a send.";
    return "Auth is required and it has not been started. The draft should only use lines you can point to in the chart.";
  }

  function renderPlan() {
    var v = visit();
    var body = "";
    if (v.status === "payer_down") {
      body = '<div class="banner bad"><strong>The payer link did not answer.</strong><p>What failed: the fake link to ' + esc(v.payer) + ".</p>" +
        "<p>What Lane will do: keep the try on the log and wait for a retry.</p>" +
        "<p>What you should do: do not cancel the visit and do not tell the patient it was denied.</p></div>" +
        '<button type="button" class="btn primary" data-action="retry">Try the link again</button>';
    } else if (v.status === "mismatch") {
      body = '<div class="banner bad"><strong>Member id does not match.</strong><p>Chart field: ' + esc(v.member) + ". Card photo: SYN-2201-B. The payer found no plan on the chart id.</p>" +
        "<p>Result: can't tell if the plan is active. An auth must wait.</p></div>" +
        sourceBtn(v, "card") +
        '<div class="actions"><button type="button" class="btn primary" data-action="fixid">Use the card id SYN-2201-B</button>' +
        '<button type="button" class="btn" data-action="keepid">Keep the chart id and stop</button></div>' +
        (state.banner ? '<p class="why">' + esc(state.banner) + "</p>" : "");
    } else if (v.status === "eligibility_needed") {
      body = '<div class="banner unk"><strong>Plan check has not run.</strong><p>Run it before you draft an auth. If the link fails, you will see an error, not a guess.</p></div>' +
        '<button type="button" class="btn primary" data-action="runcheck">Run the plan check</button>';
    } else {
      body = '<p>Member id used for this check: <span class="mono">' + esc(v.member) + '</span></p>' +
      (v.elig || []).map(function (c) {
        return '<article class="check ' + c.tone + '"><div class="row"><strong>' + esc(c.name) + '</strong> ' +
          '<span class="pill ' + c.tone + '">' + esc(c.result) + "</span></div><p>" + esc(c.detail) + "</p></article>";
      }).join("") + '<div class="actions">' + planNext(v) + "</div>";
    }
    return shell(steps(3) + '<div class="panel"><p class="kicker">' + esc(v.patient) + " | " + esc(v.payer) + "</p><h2>Plan check</h2>" +
      "<p>Three answers are allowed: covered, not covered, and can't tell. Can't tell is a real answer. It is not a failure of the staff.</p>" +
      body + "</div>");
  }

  function planNext(v) {
    if (v.status === "no_auth" || v.status === "clear") {
      return '<button type="button" class="btn primary" data-action="nav" data-view="pulse">See clinic pulse</button>';
    }
    return '<button type="button" class="btn primary" data-action="nav" data-view="packet">Build the auth packet</button>';
  }

  function renderPacket() {
    var v = visit();
    if (v.status === "payer_down" || v.status === "mismatch" || v.status === "eligibility_needed") {
      return shell(steps(4) + '<div class="panel"><h2>Packet is locked</h2><p>' + esc(canSend(v).why) + '</p>' +
        '<button type="button" class="btn primary" data-action="nav" data-view="plan">Go to plan check</button></div>');
    }
    if (v.status === "no_auth") {
      return shell(steps(4) + '<div class="panel"><h2>No packet</h2><p>This visit does not need an auth. There is nothing to send.</p>' +
        '<button type="button" class="btn primary" data-action="nav" data-view="pulse">See pulse</button></div>');
    }
    var lines = (v.lines && v.lines.length) ? v.lines : [
      { label: "Who", value: v.patient + " with " + v.provider, source: "sched" },
      { label: "Visit", value: v.visit + ", code " + v.cpt, source: "sched" },
      { label: "Payer", value: v.payer + " " + v.plan, source: "note" }
    ];
    var lineHtml = lines.map(function (ln) {
      return '<article class="check"><div class="row"><strong>' + esc(ln.label) + "</strong></div><p>" + esc(lineValue(v, ln)) + "</p>" + sourceBtn(v, ln.source || "note") + "</article>";
    }).join("");
    var gapHtml = gaps(v).map(function (g) {
      var a = ans(v, g.id);
      var opts = (g.options || []).map(function (o) {
        var checked = a.choice === o.value ? " checked" : "";
        return '<label class="choice"><input type="radio" name="gap-' + esc(v.id + g.id) + '" data-action="gap" data-gap="' + esc(g.id) + '" value="' + esc(o.value) + '"' + checked + "> <span>" + esc(o.label) + "</span></label>";
      }).join("");
      var meta = optionMeta(g, a.choice);
      var warn = "";
      if (a.choice && meta && !meta.match && a.choice !== "not_in_chart") {
        warn = '<p class="why">This does not match the chart source. You can still send it after you sign, but the payer may send it back.</p>';
      }
      if (a.choice === "not_in_chart") {
        warn = '<p class="why">You are sending without this fact unless you explain why it is not needed.</p>' +
          '<label class="block">Why is it not needed?<textarea id="reason-' + esc(g.id) + '" data-action="reason" data-gap="' + esc(g.id) + '">' + esc(a.reason || "") + "</textarea></label>";
      }
      if (a.choice && meta && meta.match) warn = '<p class="banner good">This matches the chart source.</p>';
      return '<section class="panel" style="margin-top:10px"><h3>' + esc(g.label) + "</h3><p>" + esc(g.why) + "</p>" + opts + warn + "</section>";
    }).join("");
    var locked = v.status === "submitted" || v.status === "clear";
    return shell(steps(4) + '<div class="panel"><p class="kicker">' + esc(v.patient) + "</p><h2>Auth packet from the chart</h2>" +
      (v.status === "needs_action" ? '<div class="banner bad"><strong>Payer sent this back.</strong><p>They want the missing fact below. Add it from the chart, then sign and send again.</p></div>' : "") +
      "<p>Each line should point at a chart source. A line with no source stays open. Lane does not invent it.</p>" +
      (v.status === "clear" ? "<p>Fake auth id " + esc(v.authId) + " is on file. This screen does not submit a claim.</p>" : "") +
      lineHtml + "</div>" + (locked ? "" : gapHtml) +
      '<div class="actions"><button type="button" class="btn primary" data-action="nav" data-view="sign">' +
      (v.status === "needs_action" ? "Review and send again" : "Review and sign") + "</button></div>"
    );
  }

  function renderSign() {
    var v = visit();
    var gate = canSend(v);
    var signer = state.signers[v.id] || "";
    var checked = state.attest[v.id] ? " checked" : "";
    var preview = "";
    (v.lines || []).forEach(function (ln) {
      preview += "<li><strong>" + esc(ln.label) + ":</strong> " + esc(lineValue(v, ln)) + "</li>";
    });
    return shell(steps(5) + '<div class="panel"><p class="kicker">' + esc(v.patient) + " | " + esc(v.visit) + "</p><h2>Sign before send</h2>" +
      "<p>You are looking at a fake packet for " + esc(v.payer) + ". Nothing is transmitted.</p>" +
      (preview ? "<ul>" + preview + "</ul>" : "") +
      '<label class="block">Who is signing?<select id="signer" data-action="signer">' +
      '<option value="">Pick a person</option>' +
      opt("Coordinator 02", signer) + opt("Provider 07", signer) +
      "</select></label>" +
      '<label class="choice"><input type="checkbox" data-action="attest"' + checked + "> <span>I read the sources. I am not guessing.</span></label>" +
      '<p class="why">' + esc(gate.why) + "</p>" +
      '<div class="actions"><button type="button" class="btn primary" data-action="submit"' + (gate.ok ? "" : " disabled") + ">" +
      (v.status === "needs_action" ? "Send again" : "Send to payer") + "</button>" +
      '<button type="button" class="btn" data-action="nav" data-view="packet">Back to packet</button></div></div>'
    );
  }

  function opt(name, cur) {
    return '<option value="' + esc(name) + '"' + (cur === name ? " selected" : "") + ">" + esc(name) + "</option>";
  }

  function renderPulse() {
    var v = visit();
    var t = totals();
    var items = state.activity.filter(function (a) {
      if (state.logFilter === "visit") return a.visitId === v.id;
      return true;
    });
    var logHtml = items.length ? '<ul class="log">' + items.map(function (a) {
      return "<li><span class=\"time\">" + esc(a.t) + " | " + esc(a.actor) + "</span><br>" + esc(a.text) + "</li>";
    }).join("") + "</ul>" : "<p>No lines yet. Actions you take will show up here.</p>";
    var demo = "";
    if (v.status === "submitted") {
      demo = '<div class="actions"><button type="button" class="btn primary" data-action="approve">Demo: payer says yes</button>' +
        '<button type="button" class="btn" data-action="return">Demo: payer asks for more</button></div>' +
        '<p class="kicker">Demo only. This plays a fake reply so you can see the board move.</p>';
    } else if (v.status === "needs_action") {
      demo = '<p>The payer already sent this back. Finish the packet and send again before you play a yes.</p>' +
        '<button type="button" class="btn primary" data-action="nav" data-view="packet">Open the packet</button>';
    }
    var tl = (v.timeline || []).map(function (ev) {
      return "<li><span class=\"time\">" + esc(ev.t) + " | " + esc(ev.actor) + "</span><br>" + esc(ev.label) + "</li>";
    }).join("");
    return shell(steps(6) +
      '<div class="tiles">' +
      tile(money(t.atRisk), "Still at risk (fake)") +
      tile(money(t.cleared), "Cleared amount (fake)") +
      tile(String(t.clearN), "Visits clear") +
      tile(String(t.need), "Need a person") +
      "</div>" +
      (state.banner ? '<div class="banner good">' + esc(state.banner) + "</div>" : "") +
      '<div class="split"><section class="panel"><p class="kicker">This visit</p><h2>' + esc(v.patient) + "</h2>" +
      "<p>" + esc(v.visit) + " | " + esc(v.payer) + "</p><div class=\"row\">" + pill(v.status) +
      (v.authId ? '<span class="pill good">' + esc(v.authId) + "</span>" : "") + "</div>" +
      (v.status === "clear" ? "<p>Clear to treat in this demo. This is not a claim. The note still has to match the auth or a later claim can still be denied.</p>" : "") +
      "<h3>Path of this auth</h3><ul class=\"log\">" + (tl || "<li>No events yet.</li>") + "</ul>" + demo +
      "</section><section class=\"panel\"><h2>Activity</h2>" +
      '<div class="row"><button type="button" class="chip" data-action="logfilter" data-filter="all">All</button>' +
      '<button type="button" class="chip" data-action="logfilter" data-filter="visit">This visit</button></div>' +
      logHtml + "</section></div>"
    );
  }

  function render() {
    var active = document.activeElement;
    var aid = active && active.id;
    var sel = active && typeof active.selectionStart === "number" ? active.selectionStart : null;
    var html;
    if (state.view === "chart") html = renderChart();
    else if (state.view === "plan") html = renderPlan();
    else if (state.view === "packet") html = renderPacket();
    else if (state.view === "sign") html = renderSign();
    else if (state.view === "pulse") html = renderPulse();
    else html = renderBoard();
    document.getElementById("app").innerHTML = html;
    if (aid) {
      var el = document.getElementById(aid);
      if (el) {
        el.focus();
        if (sel != null && el.setSelectionRange) {
          try { el.setSelectionRange(sel, sel); } catch (e) {}
        }
      }
    }
  }

  function currentVisit() { return visit(); }

  document.getElementById("app").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-action]");
    if (!btn || btn.tagName === "TEXTAREA" || btn.tagName === "SELECT" || btn.tagName === "INPUT") return;
    var action = btn.dataset.action;
    var v = currentVisit();
    if (action === "nav") {
      state.view = btn.dataset.view;
      if (state.view !== "plan") state.banner = "";
      commit();
      return;
    }
    if (action === "filter") { state.filter = btn.dataset.filter; commit(); return; }
    if (action === "logfilter") { state.logFilter = btn.dataset.filter; commit(); return; }
    if (action === "open") {
      state.selectedId = btn.dataset.id;
      state.view = "chart";
      state.banner = "";
      commit();
      return;
    }
    if (action === "source") {
      var key = v.id + ":" + btn.dataset.key;
      state.openSource = state.openSource === key ? "" : key;
      commit();
      return;
    }
    if (action === "reset") {
      try { localStorage.removeItem(KEY); } catch (err) {}
      state = fresh();
      commit();
      return;
    }
    if (action === "retry") {
      v.status = "auth_needed";
      v.elig = eligAuthNeeded();
      v.timeline.push({ t: stamp(), actor: "Lane (agent)", label: "Link answered on retry. Auth is required." });
      log("Lane (agent)", "Payer link for Patient K answered on retry. Auth is required.", v.id);
      state.view = "plan";
      state.banner = "";
      commit();
      return;
    }
    if (action === "fixid") {
      v.member = "SYN-2201-B";
      v.status = "auth_needed";
      v.elig = eligAuthNeeded();
      v.timeline.push({ t: stamp(), actor: "Staff (you)", label: "Used card id SYN-2201-B. Plan is active. Auth is required." });
      log("Staff (you)", "Patient C id updated to the card photo. Plan is active. Auth is required.", "C");
      state.banner = "";
      commit();
      return;
    }
    if (action === "keepid") {
      state.banner = "Stopped. The chart id still does not match. Do not start the auth. Ask the front desk to confirm the card.";
      log("Staff (you)", "Kept the chart id for Patient C. Auth stays blocked.", "C");
      commit();
      return;
    }
    if (action === "runcheck") {
      var next = v.afterCheck || "auth_needed";
      v.status = next;
      v.elig = next === "no_auth" ? eligNoAuth() : eligAuthNeeded();
      var msg = next === "no_auth" ? "Plan is active. No auth needed." : "Plan is active. Auth is required.";
      v.timeline.push({ t: stamp(), actor: "Lane (agent)", label: msg });
      log("Lane (agent)", v.patient + ": " + msg, v.id);
      commit();
      return;
    }
    if (action === "submit") {
      var gate = canSend(v);
      if (!gate.ok) return;
      var was = v.status;
      v.status = "submitted";
      var who = state.signers[v.id];
      gaps(v).forEach(function (g) {
        var a = ans(v, g.id);
        log(who, v.patient + " " + g.label + ": " + (a.choice === "not_in_chart" ? "not in chart (" + a.reason.trim() + ")" : a.choice) + ".", v.id);
      });
      v.timeline.push({ t: stamp(), actor: who, label: was === "needs_action" ? "Sent again (fake)." : "Sent to payer (fake)." });
      log(who, (was === "needs_action" ? "Sent again" : "Sent") + " the " + v.patient + " packet. No payer received it.", v.id);
      state.banner = "Sent (fake). " + v.payer + " has not replied. Play a reply below if you want to see the dollars move.";
      state.view = "pulse";
      commit();
      return;
    }
    if (action === "approve") {
      if (v.status !== "submitted" && v.status !== "needs_action") return;
      v.status = "clear";
      v.authId = v.authId || ("SYN-OK-" + v.id + "7");
      v.timeline.push({ t: stamp(), actor: v.payer + " (simulated)", label: "Said yes. Fake auth " + v.authId + "." });
      log(v.payer + " (simulated)", v.patient + " is clear to treat. Fake auth " + v.authId + ". At risk dollars drop by " + money(v.value) + ".", v.id);
      state.banner = v.patient + " is clear to treat in this demo. Fake allowed " + money(v.value) + " moved off the at risk tile. This is not a claim.";
      commit();
      return;
    }
    if (action === "return") {
      v.status = "needs_action";
      if (!v.gaps) v.gaps = [];
      if (!v.gaps.filter(function (g) { return g.id === "return"; })[0]) {
        v.gaps.push({
          id: "return",
          label: "Proof of care before the visit",
          why: "The fake payer sent the auth back and asked for this proof.",
          options: [
            { value: "On the therapy log", label: "It is on the therapy log", match: true },
            { value: "not_in_chart", label: "Not in the chart", match: false }
          ]
        });
        if (!v.lines) v.lines = [];
        v.lines.push({ label: "Proof of care", fromGap: "return", source: "pt" });
        if (!v.sources) v.sources = {};
        if (!v.sources.pt) v.sources.pt = "Therapy log is the place to look. This demo does not invent the weeks.";
      }
      v.timeline.push({ t: stamp(), actor: v.payer + " (simulated)", label: "Sent back. Need proof of care." });
      log(v.payer + " (simulated)", v.patient + " auth came back. Add proof of care from the chart.", v.id);
      state.banner = "Payer sent it back. Open the packet, fill the new line, sign, and send again.";
      state.view = "packet";
      commit();
    }
  });

  document.getElementById("app").addEventListener("change", function (e) {
    var el = e.target;
    var action = el.dataset.action;
    var v = currentVisit();
    if (action === "gap") {
      setAns(v, el.dataset.gap, { choice: el.value });
      if (v.status === "auth_needed") v.status = "draft";
      commit();
      return;
    }
    if (action === "signer") { state.signers[v.id] = el.value; commit(); return; }
    if (action === "attest") { state.attest[v.id] = el.checked; commit(); }
  });

  document.getElementById("app").addEventListener("input", function (e) {
    var el = e.target;
    if (el.dataset.action === "q") {
      state.q = el.value;
      save();
      render();
      return;
    }
    if (el.dataset.action === "reason") {
      setAns(currentVisit(), el.dataset.gap, { reason: el.value });
      save();
    }
  });

  render();
})();
