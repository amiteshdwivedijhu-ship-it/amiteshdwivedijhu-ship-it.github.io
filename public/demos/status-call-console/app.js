(function () {
  var KEY = "status-call-console-v1";

  function seedClaims() {
    return [
      {
        id: "CLM-18442",
        patient: "Jordan Hale",
        dos: "Aug 12, 2026",
        cpt: "27447",
        cptName: "Total knee replacement",
        amount: 18400,
        days: 46,
        payer: "Northline Health Plan",
        memberPrefix: "HBR",
        memberId: "4418291",
        lane: "phone",
        hero: true,
        api: { tone: "warn", label: "API vague", detail: "277 from Oct 2 says pending. No reason code and no remark." },
        portal: { tone: "bad", label: "Portal down", detail: "Login failed. Northline shows a maintenance window." },
        phone: { tone: "next", label: "Phone next", detail: "No call yet. This is the channel left." },
        disposition: null,
        conflict: false
      },
      {
        id: "CLM-19002",
        patient: "Casey Bloom",
        dos: "Sep 3, 2026",
        cpt: "29881",
        cptName: "Knee arthroscopy",
        amount: 6400,
        days: 12,
        payer: "Cedar State Plan",
        lane: "resolved",
        api: { tone: "ok", label: "API paid", detail: "277 says paid in full on Sep 28." },
        portal: { tone: "ok", label: "Portal matches", detail: "Portal shows the same paid amount." },
        phone: { tone: "ok", label: "No call needed", detail: "API and portal agree." },
        disposition: { status: "Paid", reason: "Paid in full", next: "None", confidence: "Channels agree", citations: ["277 and portal both say paid."] },
        conflict: false
      },
      {
        id: "CLM-17610",
        patient: "Avery Quinn",
        dos: "Jul 22, 2026",
        cpt: "27447",
        cptName: "Total knee replacement",
        amount: 19250,
        days: 61,
        payer: "Northline Health Plan",
        lane: "resolved",
        api: { tone: "warn", label: "API pending", detail: "277 still says pending." },
        portal: { tone: "ok", label: "Portal denial", detail: "Portal shows denial CO-16, missing information." },
        phone: { tone: "ok", label: "Phone skipped", detail: "Portal already has a clear reason." },
        disposition: { status: "Denied", reason: "Missing information", next: "Fix and resubmit", confidence: "Portal read", citations: ["Portal denial CO-16."] },
        conflict: false
      },
      {
        id: "CLM-18820",
        patient: "Morgan Ellis",
        dos: "Aug 30, 2026",
        cpt: "20610",
        cptName: "Joint injection",
        amount: 890,
        days: 28,
        payer: "Northline Health Plan",
        lane: "disagree",
        api: { tone: "ok", label: "API says paid", detail: "277 on Oct 1 says paid, $890." },
        portal: { tone: "warn", label: "Portal locked", detail: "Portal would not open this claim." },
        phone: { tone: "warn", label: "Older phone note", detail: "Sep 20 call note says the rep could not find the claim." },
        disposition: null,
        conflict: true
      },
      {
        id: "CLM-20115",
        patient: "Riley Santos",
        dos: "Sep 14, 2026",
        cpt: "29827",
        cptName: "Shoulder repair",
        amount: 12100,
        days: 19,
        payer: "Lumen Workers Fund",
        lane: "phone",
        api: { tone: "bad", label: "No API", detail: "This payer does not return 277 status." },
        portal: { tone: "bad", label: "No portal", detail: "No portal login on file." },
        phone: { tone: "next", label: "Phone only", detail: "There is no call flow yet, so a call would dead-end." },
        disposition: null,
        conflict: false
      },
      {
        id: "CLM-16990",
        patient: "Drew Okonkwo",
        dos: "Sep 18, 2026",
        cpt: "99213",
        cptName: "Office visit",
        amount: 240,
        days: 9,
        payer: "Cedar State Plan",
        lane: "waiting",
        api: { tone: "warn", label: "API pending", detail: "277 says pending, reason: medical review. Fresh as of yesterday." },
        portal: { tone: "ok", label: "Portal matches", detail: "Same pending reason." },
        phone: { tone: "ok", label: "Hold the call", detail: "A new reason is already on file. Calling would not add information." },
        disposition: null,
        conflict: false
      }
    ];
  }

  function seed() {
    return {
      view: "worklist",
      filter: "all",
      selectedId: "CLM-18442",
      flowPayer: "Northline",
      prefixMapped: false,
      lumenStarted: false,
      sheet: null,
      menuOpen: false,
      badRead: false,
      call: null,
      log: []
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.claims) return null;
      if (data.call && data.call.phase === "running") {
        data.call.phase = "paused";
        data.call.turns.push({ t: "system", text: "Reload paused the live call. Start it again if you still need a status." });
      }
      return data;
    } catch (err) {
      return null;
    }
  }

  var state = location.hash === "#selftest" ? seed() : (load() || seed());
  if (!state.claims) state.claims = seedClaims();

  function save() {
    state.claims = state.claims || seedClaims();
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (err) {}
  }

  if (!state.claims) state.claims = seedClaims();

  var timers = [];
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function money(n) {
    return "$" + Number(n).toLocaleString("en-US");
  }

  function claim() {
    return state.claims.find(function (c) { return c.id === state.selectedId; }) || state.claims[0];
  }

  function metrics() {
    return {
      accuracy: state.badRead ? 80 : 88,
      quality: state.prefixMapped ? 84 : 71,
      coverage: state.prefixMapped ? 81 : 64,
      reliability: 40
    };
  }

  function stamp() {
    try {
      return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }) + " ET";
    } catch (err) {
      return "";
    }
  }

  function log(text) {
    state.log.unshift({ time: stamp(), text: text });
    state.log = state.log.slice(0, 12);
  }

  function successTail() {
    return [
      { t: "rep", text: "I found claim CLM-18442. It was denied on September 2. We need the operative note before we can pay." },
      { t: "agent", text: "I drafted a status: denied, medical records needed. I will not write back until you confirm.", tool: { name: "draft_disposition", detail: "Denied / records", ms: 310 } },
      { t: "done", text: "Call complete. Confirm the structured status before writeback." }
    ];
  }

  function buildScript(mapped) {
    var steps = [
      { t: "system", text: "Dialing Northline claims line, 800-555-0142." },
      { t: "ivr", text: "Thank you for calling Northline. Press 1 for claim status. Press 2 for benefits." },
      { t: "agent", text: "Pressing 1 for claim status.", tool: { name: "send_dtmf", detail: "1", ms: 180 } },
      { t: "ivr", text: "Enter the claim number, then press pound." },
      { t: "agent", text: "Entering claim CLM-18442.", tool: { name: "enter_claim_number", detail: "CLM-18442", ms: 420 } },
      { t: "ivr", text: "Please say the alpha prefix of the member ID." }
    ];
    if (!mapped) {
      steps.push({ t: "stall", text: "This prompt is not in the call flow. The agent has nothing to say." });
      return steps;
    }
    steps.push({ t: "agent", text: "The member ID prefix is HBR, then 4418291.", tool: { name: "read_member_prefix", detail: "HBR", ms: 260 } });
    return steps.concat(successTail());
  }

  function tick() {
    var call = state.call;
    if (!call || call.phase !== "running") return;
    if (call.cursor >= call.script.length) return;
    var step = call.script[call.cursor++];
    call.turns.push(step);
    if (step.t === "stall") call.phase = "stalled";
    else if (step.t === "done") {
      call.phase = "needs_confirm";
      call.outcome = "needs_confirm";
      if (state.view === "live") state.sheet = "disposition";
    }
    save();
    render();
    if (call.phase === "running" && !call.manual) timers.push(setTimeout(tick, 700));
  }

  function startCall(opts) {
    opts = opts || {};
    var c = claim();
    if (c.id !== "CLM-18442") return;
    clearTimers();
    state.call = {
      phase: "running",
      turns: [],
      script: buildScript(state.prefixMapped),
      cursor: 0,
      manual: !!opts.manual,
      tookOver: false,
      hadStall: !state.prefixMapped,
      outcome: null,
      forClaim: c.id
    };
    state.view = "live";
    state.sheet = null;
    log("Started a status call for CLM-18442 on the Northline claims line.");
    save();
    render();
    if (!state.call.manual) timers.push(setTimeout(tick, 700));
  }

  function simulateTimeout() {
    if (!state.call || state.call.phase !== "running") return;
    clearTimers();
    state.call.phase = "tool_error";
    state.call.turns.push({ t: "error", text: "enter_claim_number timed out after 8 seconds. Nothing was written back." });
    log("Tool timeout on enter_claim_number. Call is waiting for a retry.");
    save();
    render();
  }

  function retryTool() {
    if (!state.call || state.call.phase !== "tool_error") return;
    state.call.turns.push({ t: "agent", text: "Retry succeeded. Claim number entered.", tool: { name: "enter_claim_number", detail: "CLM-18442", ms: 640 } });
    state.call.phase = "running";
    log("Retried enter_claim_number. Call continued.");
    save();
    render();
    if (!state.call.manual) timers.push(setTimeout(tick, 700));
  }

  function letStop() {
    if (!state.call) return;
    clearTimers();
    state.sheet = null;
    state.call.phase = "dead";
    state.call.outcome = "dead_end";
    state.call.turns.push({ t: "system", text: "Call ended with no status. Nothing was written back." });
    state.view = "review";
    log("Let the Northline call stop. No writeback.");
    save();
    render();
  }

  function chooseLine(which) {
    if (!state.call) return;
    state.sheet = null;
    if (which === "prefix") {
      state.call.tookOver = true;
      state.call.hadStall = true;
      state.call.turns.push({ t: "operator", text: "The member ID prefix is HBR, then 4418291." });
      state.call.script = state.call.script.slice(0, state.call.cursor).concat(successTail());
      state.call.phase = "running";
      log("Operator took over and gave the member ID prefix.");
      save();
      render();
      if (!state.call.manual) timers.push(setTimeout(tick, 700));
      else tick();
      return;
    }
    if (which === "repeat") {
      state.call.turns.push({ t: "operator", text: "Please repeat the prompt." });
      state.call.turns.push({ t: "ivr", text: "Please say the alpha prefix of the member ID." });
      state.call.turns.push({ t: "stall", text: "Still not in the call flow. The agent has nothing new to say." });
      state.call.phase = "stalled";
      state.call.hadStall = true;
      log("Asked the payer to repeat. The same unmapped prompt came back.");
      save();
      render();
      return;
    }
    clearTimers();
    state.call.turns.push({ t: "operator", text: "Please transfer me to a supervisor." });
    state.call.turns.push({ t: "ivr", text: "That option is not available. Goodbye." });
    state.call.phase = "dead";
    state.call.outcome = "failed_handoff";
    state.view = "review";
    log("Asked for a supervisor. The line hung up. No writeback.");
    save();
    render();
  }

  function confirmWriteback() {
    var c = claim();
    if (c.id !== "CLM-18442") return;
    if (c.disposition && c.disposition.status === "Denied" && c.disposition.confidence === "Confirmed by a person") {
      log("Writeback was already queued. No duplicate sent.");
      state.view = "review";
      state.sheet = null;
      save();
      render();
      return;
    }
    c.disposition = {
      status: "Denied",
      reason: "Medical records needed",
      next: "Send the operative note",
      confidence: "Confirmed by a person",
      citations: [
        "Phone rep: denied on September 2, needs the operative note.",
        "277 from October 2 still says pending. Treat that read as stale."
      ]
    };
    c.phone = { tone: "ok", label: "Heard denial", detail: "Rep asked for the operative note." };
    c.lane = "resolved";
    c.next = "Records packet queued";
    if (state.call) {
      state.call.outcome = "resolved";
      state.call.phase = "done";
    }
    state.sheet = null;
    state.view = "review";
    log("Confirmed denied status for CLM-18442. Writeback queued to the billing record.");
    save();
    render();
  }

  function markBadRead() {
    state.badRead = true;
    state.sheet = null;
    if (state.call) {
      state.call.outcome = "bad_read";
      state.call.phase = "dead";
    }
    clearTimers();
    state.view = "review";
    log("Marked the read as wrong. No writeback. Status accuracy for Northline dropped.");
    save();
    render();
  }

  function applyFix() {
    if (state.prefixMapped) return;
    state.prefixMapped = true;
    state.sheet = null;
    log("Mapped the member ID prefix branch on the Northline call flow.");
    save();
    render();
  }

  function trust(source) {
    var c = claim();
    if (!c.conflict) return;
    if (source === "api") {
      c.disposition = {
        status: "Paid",
        reason: "277 says paid in full",
        next: "Post the payment",
        confidence: "Trusted the newer 277",
        citations: ["277 on Oct 1 says paid, $890.", "Phone note from Sep 20 is older and said not found."]
      };
      c.lane = "resolved";
      log("Trusted the 277 over the older phone note on CLM-18820.");
    } else {
      c.disposition = {
        status: "Needs a new call",
        reason: "Phone note said not found",
        next: "Call again and read the claim number back",
        confidence: "Trusted the phone note",
        citations: ["Sep 20 phone note: rep could not find the claim.", "277 says paid, but you chose not to trust it yet."]
      };
      log("Trusted the phone note on CLM-18820. No payment posted.");
    }
    c.conflict = false;
    save();
    render();
  }

  function openClaim(id) {
    state.selectedId = id;
    state.view = "claim";
    state.sheet = null;
    save();
    render();
  }

  function filtered() {
    return state.claims.filter(function (c) {
      if (state.filter === "all") return true;
      if (state.filter === "unassigned") return false;
      return c.lane === state.filter;
    });
  }

  function hint() {
    var c = claim();
    if (!state.call && state.view === "worklist") return "Open CLM-18442. The 277 is vague and the portal is down. Phone is next.";
    if (!state.call && c.id === "CLM-18442") return "Start the status call, or open the Northline flow and map the prefix first.";
    if (state.call && state.call.phase === "running") return "Watch the call. The agent uses tools. It will stop if the phone tree asks for something the flow does not know.";
    if (state.call && state.call.phase === "stalled") return "The phone tree asked for a member ID prefix. Take over before the call dead-ends.";
    if (state.call && state.call.phase === "needs_confirm") return "Confirm the structured status. Nothing writes back until you do.";
    if (state.call && state.call.outcome === "resolved" && !state.prefixMapped) return "Apply the flow fix so the next Northline call does not stall on the same prompt.";
    if (state.prefixMapped && state.call && state.call.outcome === "resolved") return "Path complete. Reset the demo if you want to play it again.";
    if (state.call && state.call.outcome === "dead_end") return "No writeback happened. The review says which prompt to map.";
    return "Pick a claim, a channel, and a next action. Phone is for gaps the API and portal cannot close.";
  }

  function checks() {
    var c = state.claims.find(function (x) { return x.id === "CLM-18442"; });
    var opened = state.selectedId === "CLM-18442" && state.view !== "worklist";
    var started = !!state.call;
    var handled = state.call && (state.call.tookOver || (state.prefixMapped && state.call.phase !== "stalled" && state.call.outcome));
    var confirmed = c && c.disposition && c.disposition.confidence === "Confirmed by a person";
    var fixed = state.prefixMapped;
    return [
      [opened || started, "Open CLM-18442"],
      [started, "Start the status call"],
      [!!handled || (state.call && state.call.phase === "needs_confirm"), "Get past the prefix prompt"],
      [!!confirmed, "Confirm the writeback"],
      [fixed, "Map the prefix on the call flow"]
    ];
  }

  function pill(obj) {
    if (!obj) return "";
    return '<span class="pill ' + esc(obj.tone || "") + '">' + esc(obj.label) + "</span>";
  }

  function metricStrip() {
    var m = metrics();
    return (
      '<div class="metrics">' +
      metricBox("Status accuracy", m.accuracy + "%", state.badRead ? "was 88%" : "Northline, this week") +
      metricBox("Call quality", m.quality + "%", state.prefixMapped ? "was 71%" : "Calls finished clean") +
      metricBox("Phone coverage", m.coverage + "%", state.prefixMapped ? "was 64%" : "Prompts the flow can answer") +
      metricBox("Portal reliability", m.reliability + "%", "Northline portal, this week") +
      "</div>"
    );
  }

  function metricBox(label, value, note) {
    return '<div class="metric"><span>' + esc(label) + '</span><b>' + esc(value) + '</b><span>' + esc(note) + "</span></div>";
  }

  function checklist() {
    return '<ul class="check">' + checks().map(function (row) {
      return '<li class="' + (row[0] ? "done" : "") + '">' + (row[0] ? "Done. " : "Next. ") + esc(row[1]) + "</li>";
    }).join("") + "</ul>";
  }

  function viewWorklist() {
    var rows = filtered();
    var hero = rows.filter(function (c) { return c.hero; })[0];
    var rest = rows.filter(function (c) { return !c.hero; });
    var body = "";
    if (!rows.length) {
      body = '<div class="empty"><h2>No claims in this lane</h2><p>Switch back to All to see Harbor Orthopedics work.</p></div>';
    } else {
      if (hero) {
        body += '<article class="hero"><p class="kicker">Start here</p><h2>' + esc(hero.id) + " · " + esc(hero.patient) + "</h2>" +
          "<p>API came back vague. Portal is down. " + money(hero.amount) + " has been in AR for " + hero.days + " days. This one needs a phone call.</p>" +
          '<p style="margin-top:8px">' + pill(hero.api) + pill(hero.portal) + pill(hero.phone) + "</p>" +
          '<div class="actions" style="margin-top:12px"><button class="btn primary" data-act="open-claim" data-id="' + hero.id + '">Open claim</button></div></article>';
      }
      body += rest.map(function (c) {
        return '<button class="row" data-act="open-claim" data-id="' + c.id + '"><span><strong>' + esc(c.id) + "</strong><br>" + esc(c.patient) + " · " + esc(c.payer) + "</span><span>" + money(c.amount) + " · " + c.days + " days</span><span>" + pill(c.api) + pill(c.portal) + pill(c.phone) + "</span></button>";
      }).join("");
    }
    return '<div class="card"><p class="kicker">90 second path</p>' + checklist() + "</div>" + body;
  }

  function viewClaim() {
    var c = claim();
    var disp = c.disposition
      ? "<p><strong>" + esc(c.disposition.status) + "</strong> · " + esc(c.disposition.reason) + "</p><p>Next: " + esc(c.disposition.next) + "</p><p>Confidence: " + esc(c.disposition.confidence) + "</p><p>" + c.disposition.citations.map(esc).join("<br>") + "</p>"
      : "<p>Waiting on a clean read. Nothing will write back yet.</p>";
    var conflict = "";
    if (c.conflict) {
      conflict = '<div class="card" style="border-color:#e5d3b3"><h2>Channels do not agree</h2><p>The 277 says paid. An older phone note says the rep could not find the claim. Pick a source before anyone posts money.</p><div class="actions" style="margin-top:10px"><button class="btn primary" data-act="trust" data-source="api">Trust the 277</button><button class="btn secondary" data-act="trust" data-source="phone">Trust the phone note</button></div></div>';
    }
    var callBtn = "";
    if (c.id === "CLM-18442") {
      callBtn = '<button class="btn primary" data-act="start-call">Start status call</button>';
    } else if (c.payer === "Lumen Workers Fund") {
      callBtn = '<button class="btn secondary" data-act="nav" data-view="flows">Open call flows first</button><p class="muted">No call flow for Lumen. A call would dead-end on the first menu.</p>';
    } else {
      callBtn = "<p>A scripted live call is ready on CLM-18442. This claim is here to show channel state.</p>";
    }
    return (
      '<div class="split"><div class="card"><p class="kicker">' + esc(c.payer) + "</p><h2>" + esc(c.id) + "</h2><p>" + esc(c.patient) + " · DOS " + esc(c.dos) + " · CPT " + esc(c.cpt) + " " + esc(c.cptName) + "</p><p><strong>" + money(c.amount) + "</strong> · " + c.days + " days in AR</p>" +
      '<div class="ladder" style="margin-top:12px">' +
      step(1, "API, 277", c.api) + step(2, "Payer portal", c.portal) + step(3, "Phone", c.phone) +
      "</div></div>" +
      '<div class="card"><p class="kicker">Structured status</p><h2>Disposition</h2>' + disp +
      '<div class="actions" style="margin-top:12px">' + callBtn + '<button class="btn secondary" data-act="nav" data-view="flows">Call flow</button></div></div></div>' + conflict
    );
  }

  function step(n, title, obj) {
    return '<div class="step"><div class="num">' + n + "</div><div><strong>" + esc(title) + "</strong> " + pill(obj) + "<p>" + esc(obj.detail) + "</p></div></div>";
  }

  function flowNodes() {
    if (state.flowPayer === "Lumen") {
      if (!state.lumenStarted) {
        return '<div class="empty"><h2>No call flow yet</h2><p>Lumen Workers Fund has no tree. Status calls to this payer will dead-end on the first menu.</p><div class="actions" style="margin-top:10px"><button class="btn primary" data-act="start-flow">Add a starting node</button></div></div>';
      }
      return '<article class="node"><strong>1. Greeting</strong><p>Thanks for calling. This flow is not ready to run.</p></article>';
    }
    if (state.flowPayer === "Cedar") {
      return '<article class="node ok"><strong>1. Greeting</strong><p>Mapped.</p></article><article class="node ok"><strong>2. Press 1 for claim status</strong><p>Mapped to send_dtmf 1.</p></article><article class="node ok"><strong>3. Claim number</strong><p>Mapped to the claim id. Cedar usually answers on the API, so this flow is a backup.</p></article>';
    }
    var prefix = state.prefixMapped
      ? '<article class="node ok"><strong>4. Member ID prefix</strong><p>Mapped. Read the prefix from the claim and say it. Example on this claim: HBR.</p></article>'
      : '<article class="node gap"><strong>4. Member ID prefix</strong><p>Not mapped. Northline asks for the alpha prefix. The agent has no line for it.</p><div class="actions" style="margin-top:8px"><button class="btn warn" data-act="open-map">Map this prompt</button></div></article>';
    return (
      '<article class="node ok"><strong>1. Greeting</strong><p>Thank you for calling Northline.</p></article>' +
      '<article class="node ok"><strong>2. Press 1 for claim status</strong><p>Mapped to send_dtmf 1.</p></article>' +
      '<article class="node ok"><strong>3. Enter claim number</strong><p>Mapped to enter_claim_number.</p></article>' +
      prefix +
      '<article class="node"><strong>5. Listen for the status</strong><p>Paid, denied, or pending, plus the reason in the rep\'s words.</p></article>' +
      '<article class="node"><strong>6. Draft a disposition</strong><p>Do not write back until a person confirms a low confidence read.</p></article>'
    );
  }

  function viewFlows() {
    return (
      '<div class="card"><p class="kicker">Payer phone tree</p><h2>Call flow designer</h2><p>Flows have to survive different payer menus. Map the prompts you can answer. Leave a visible gap when you cannot.</p>' +
      '<div class="filters" style="margin-top:10px">' +
      payerBtn("Northline", "Northline") + payerBtn("Cedar", "Cedar") + payerBtn("Lumen", "Lumen") +
      "</div></div>" + flowNodes()
    );
  }

  function payerBtn(id, label) {
    return '<button data-act="flow-payer" data-payer="' + id + '" aria-pressed="' + (state.flowPayer === id ? "true" : "false") + '">' + label + "</button>";
  }

  function turnHtml(turn, index) {
    var tool = "";
    if (turn.tool) {
      tool = '<div class="tool">' + esc(turn.tool.name) + " · " + esc(turn.tool.detail) + " · " + turn.tool.ms + " ms</div>";
    }
    var who = { system: "System", ivr: "IVR", agent: "Agent", rep: "Payer rep", operator: "You", stall: "Stall", error: "Tool error", done: "System" }[turn.t] || "Note";
    return '<div class="turn ' + esc(turn.t) + '"><div class="who">' + who + " · 00:" + String(index * 6).padStart(2, "0") + '</div><div class="bubble"><p>' + esc(turn.text) + "</p>" + tool + "</div></div>";
  }

  function viewLive() {
    if (!state.call) {
      return '<div class="empty"><h2>No live call</h2><p>Open CLM-18442 and start a status call. The transcript, tools, and stall banner show up here.</p><div class="actions" style="margin-top:10px"><button class="btn primary" data-act="open-claim" data-id="CLM-18442">Go to CLM-18442</button></div></div>';
    }
    var c = state.claims.find(function (x) { return x.id === "CLM-18442"; });
    var turns = state.call.turns.map(turnHtml).join("");
    if (!turns) turns = '<p>Dialing. Turns will appear one by one.</p>';
    var wave = state.call.phase === "running" ? '<div class="wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' : "";
    var actions = "";
    if (state.call.phase === "stalled") {
      actions = '<div class="call-actions"><button class="btn warn" data-act="open-takeover">Take over</button><button class="btn bad" data-act="let-stop">Let it stop</button></div>';
    } else if (state.call.phase === "tool_error") {
      actions = '<div class="call-actions"><button class="btn primary" data-act="retry-tool">Retry tool</button><button class="btn secondary" data-act="let-stop">End call</button></div>';
    } else if (state.call.phase === "running") {
      actions = '<div class="call-actions"><button class="btn secondary" data-act="timeout">Simulate tool timeout</button></div>';
    } else if (state.call.phase === "needs_confirm" || state.call.phase === "paused") {
      actions = '<div class="call-actions"><button class="btn primary" data-act="open-disposition">Review disposition</button></div>';
    }
    return (
      '<div class="monitor">' +
      '<div class="card"><p class="kicker">Calls</p><p><strong>CLM-18442</strong><br>Northline · live status</p><p class="phone-only" style="margin-top:8px">Context is below the transcript on a phone.</p></div>' +
      '<div class="card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><h2>Live call</h2>' + wave + "</div>" +
      (state.call.phase === "stalled" ? '<p class="kicker" style="margin-top:8px">At risk of a dead end</p>' : "") +
      '<div class="transcript" style="margin-top:10px">' + turns + "</div>" + actions + "</div>" +
      '<div class="card"><p class="kicker">Claim context</p><p><strong>' + esc(c.patient) + "</strong></p><p>" + money(c.amount) + " · " + c.days + " days</p><p>Prefix on file: " + esc(c.memberPrefix) + "</p><p>Member ID: " + esc(c.memberId) + "</p><p>API: " + esc(c.api.detail) + "</p><p>Portal: " + esc(c.portal.detail) + "</p></div>" +
      "</div>"
    );
  }

  function viewReview() {
    var c = state.claims.find(function (x) { return x.id === "CLM-18442"; });
    if (!state.call) {
      return '<div class="empty"><h2>No call to review</h2><p>Start with CLM-18442. After the call, this screen keeps the stall, the disposition, and the flow fix.</p></div>';
    }
    var stalled = state.call.hadStall || state.call.turns.some(function (t) { return t.t === "stall"; });
    var fix = "";
    if (state.prefixMapped && !stalled) {
      fix = "<p>No stall. The flow already had the prefix branch. Nothing to fix on this call.</p>";
    } else if (state.prefixMapped) {
      fix = "<p>Flow updated. The next Northline status call can say the member ID prefix without a person.</p>";
    } else {
      fix = '<p>Suggested fix: when Northline asks for the alpha prefix, say the member ID prefix on the claim (HBR for Jordan Hale).</p><div class="actions" style="margin-top:8px"><button class="btn primary" data-act="apply-fix">Apply flow fix</button></div>';
    }
    var outcome = "In progress";
    if (state.call.outcome === "resolved") outcome = "Writeback queued. Denied, records needed.";
    if (state.call.outcome === "dead_end") outcome = "Dead end. No writeback.";
    if (state.call.outcome === "failed_handoff") outcome = "Handoff failed. No writeback.";
    if (state.call.outcome === "bad_read") outcome = "Bad read. No writeback.";
    if (state.call.outcome === "needs_confirm") outcome = "Waiting for a person to confirm.";
    var logHtml = state.log.length ? "<ul>" + state.log.map(function (item) {
      return "<li><strong>" + esc(item.time) + "</strong> " + esc(item.text) + "</li>";
    }).join("") + "</ul>" : "<p>No activity yet.</p>";
    return (
      '<div class="card"><p class="kicker">Call review</p><h2>' + esc(outcome) + "</h2><p>Claim " + esc(c.id) + " · " + esc(c.patient) + "</p></div>" +
      '<div class="card"><h2>Where it stalled</h2><p>' + (stalled ? "Northline asked for the alpha prefix of the member ID. That prompt was not in the flow." : "This call did not stall.") + "</p></div>" +
      '<div class="card"><h2>Fix</h2>' + fix + "</div>" +
      '<div class="card"><h2>Disposition</h2>' + (c.disposition ? "<p><strong>" + esc(c.disposition.status) + "</strong> · " + esc(c.disposition.reason) + "</p><p>Next: " + esc(c.disposition.next) + "</p><p>" + c.disposition.citations.map(function (line) { return esc(line); }).join("<br>") + "</p>" : "<p>Nothing written back.</p>") + "</div>" +
      '<div class="log"><h2>Activity</h2>' + logHtml + "</div>"
    );
  }

  function sheets() {
    if (state.sheet === "takeover") {
      return sheet("Take over this call", "<p>Say this to the payer. The agent will keep the call after you do.</p>" +
        '<div class="choice-list">' +
        '<button class="choice" data-act="choice" data-choice="prefix">The member ID prefix is HBR, then 4418291.</button>' +
        '<button class="choice" data-act="choice" data-choice="repeat">Please repeat the prompt.</button>' +
        '<button class="choice" data-act="choice" data-choice="supervisor">Please transfer me to a supervisor.</button>' +
        "</div>");
    }
    if (state.sheet === "disposition") {
      return sheet("Confirm status before writeback",
        "<p>Raw words from the rep: \"It was denied on September 2. We need the operative note before we can pay.\"</p>" +
        "<p style=\"margin-top:8px\"><strong>Denied</strong><br>Reason: medical records needed<br>Next: send the operative note<br>Confidence: low until you confirm. The 277 from October 2 still says pending, with no reason.</p>" +
        '<div class="actions" style="margin-top:12px"><button class="btn primary" data-act="confirm">Confirm writeback</button><button class="btn bad" data-act="bad-read">This read is wrong</button></div>');
    }
    if (state.sheet === "map") {
      return sheet("Map the prefix prompt",
        "<p>When Northline asks for the alpha prefix, read the member ID prefix from the claim and say it.</p><p style=\"margin-top:8px\">On CLM-18442 that prefix is HBR.</p>" +
        '<div class="actions" style="margin-top:12px"><button class="btn primary" data-act="apply-fix">Save this branch</button></div>');
    }
    return "";
  }

  function sheet(title, body) {
    return '<div class="sheet" role="dialog" aria-modal="true"><div class="sheet-card"><h2>' + title + "</h2>" + body +
      '<div class="actions" style="margin-top:12px"><button class="btn secondary" data-act="close-sheet">Close</button></div></div></div>';
  }

  function render() {
    var titles = { worklist: "Claim worklist", claim: "Claim detail", flows: "Call flows", live: "Live call", review: "Call review" };
    var nav = [
      ["worklist", "Worklist"],
      ["claim", "This claim"],
      ["flows", "Call flows"],
      ["live", "Live call"],
      ["review", "Review"]
    ].map(function (item) {
      return '<button data-act="nav" data-view="' + item[0] + '" aria-current="' + (state.view === item[0] ? "page" : "false") + '">' + item[1] + "</button>";
    }).join("");
    var filters = [
      ["all", "All"],
      ["phone", "Needs phone"],
      ["disagree", "Channels disagree"],
      ["resolved", "Resolved"],
      ["unassigned", "Unassigned"]
    ].map(function (item) {
      return '<button data-act="filter" data-filter="' + item[0] + '" aria-pressed="' + (state.filter === item[0] ? "true" : "false") + '">' + item[1] + "</button>";
    }).join("");
    var view = "";
    if (state.view === "worklist") view = '<div class="filters">' + filters + "</div>" + viewWorklist();
    if (state.view === "claim") view = viewClaim();
    if (state.view === "flows") view = viewFlows();
    if (state.view === "live") view = viewLive();
    if (state.view === "review") view = viewReview();
    document.body.classList.toggle("sheet-open", !!state.sheet || state.menuOpen);
    document.getElementById("app").innerHTML =
      '<div class="app">' +
      '<aside class="sidebar' + (state.menuOpen ? " open" : "") + '">' +
      '<div class="brand"><small>Harbor Orthopedics</small><strong>Status Call Console</strong></div>' +
      '<nav class="nav">' + nav + '<button class="phone-only" data-act="close-menu">Close menu</button></nav>' +
      '<p class="fine">Synthetic provider group. Not a real billing system.</p></aside>' +
      '<div class="main"><header class="topbar"><button class="btn secondary menu-btn" data-act="open-menu">Menu</button><h1>' + titles[state.view] + '</h1><button class="btn secondary" data-act="reset">Reset demo</button></header>' +
      '<div class="hint">' + esc(hint()) + "</div>" +
      '<div class="content">' + metricStrip() + view + "</div>" +
      '<p class="footer">Prototype inspired by public Adonis marketing pages. Not affiliated with Adonis. Synthetic data.</p></div></div>' +
      sheets();
    var box = document.querySelector(".transcript");
    if (box) box.scrollTop = box.scrollHeight;
  }

  function resetDemo() {
    clearTimers();
    try { localStorage.removeItem(KEY); } catch (err) {}
    state = seed();
    state.claims = seedClaims();
    render();
  }

  document.getElementById("app").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var act = b.getAttribute("data-act");
    if (act === "nav") {
      state.view = b.getAttribute("data-view");
      state.menuOpen = false;
      state.sheet = null;
      save();
      render();
    } else if (act === "filter") {
      state.filter = b.getAttribute("data-filter");
      save();
      render();
    } else if (act === "open-claim") {
      openClaim(b.getAttribute("data-id"));
    } else if (act === "start-call") {
      if (claim().id === "CLM-18442") startCall();
    } else if (act === "open-menu") {
      state.menuOpen = true;
      render();
    } else if (act === "close-menu") {
      state.menuOpen = false;
      render();
    } else if (act === "reset") {
      resetDemo();
    } else if (act === "open-map") {
      state.sheet = "map";
      render();
    } else if (act === "close-sheet") {
      state.sheet = null;
      render();
    } else if (act === "apply-fix") {
      applyFix();
    } else if (act === "open-takeover") {
      state.sheet = "takeover";
      render();
    } else if (act === "let-stop") {
      letStop();
    } else if (act === "choice") {
      chooseLine(b.getAttribute("data-choice"));
    } else if (act === "open-disposition") {
      state.sheet = "disposition";
      render();
    } else if (act === "confirm") {
      confirmWriteback();
    } else if (act === "bad-read") {
      markBadRead();
    } else if (act === "timeout") {
      simulateTimeout();
    } else if (act === "retry-tool") {
      retryTool();
    } else if (act === "trust") {
      trust(b.getAttribute("data-source"));
    } else if (act === "flow-payer") {
      state.flowPayer = b.getAttribute("data-payer");
      save();
      render();
    } else if (act === "start-flow") {
      state.lumenStarted = true;
      log("Added a starting node for Lumen. The flow is still not ready to call.");
      save();
      render();
    }
  });

  render();
})();
