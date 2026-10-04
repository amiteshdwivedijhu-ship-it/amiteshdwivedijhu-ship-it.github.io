(function () {
  var SEED = window.MEND_SEED;
  var KEY = "mendline-sage-v1";

  var FIXES = [
    {
      id: "escalate",
      title: "Escalation rule",
      tag: "Best next fix",
      detail: "If the caller says chest tightness, chest pain, chest pressure, heavy chest, or short of breath, do not book a routine visit. Route to the nurse line first. Point to the chest pathway."
    },
    {
      id: "retrieval",
      title: "Retrieval rank",
      tag: "Helpful, not enough",
      detail: "Put the chest pathway above the generic note that says to book the specialty the caller asked for."
    },
    {
      id: "example",
      title: "Training example",
      tag: "Teach from Call C-14",
      detail: "Save Call C-14 as a labeled example: must escalate, and must not offer a clock time first."
    }
  ];

  function fresh() {
    return {
      screen: "map",
      clusterId: "chest",
      callId: "C-14",
      filter: "all",
      confirmedGood: false,
      fixId: "escalate",
      reviewer: "",
      fixConfirmed: false,
      shipped: false,
      kneeLabeled: false,
      pipelineLate: true,
      log: [
        { time: "6:10 PM ET", text: "Night opened. 23 synthetic calls loaded for Health System North." }
      ],
      toast: ""
    };
  }

  var state = fresh();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!saved || saved.v !== 1) return;
      Object.keys(fresh()).forEach(function (k) {
        if (k === "toast") return;
        if (saved[k] !== undefined) state[k] = saved[k];
      });
    } catch (e) {}
  }

  function save() {
    var copy = {};
    Object.keys(state).forEach(function (k) {
      if (k !== "toast") copy[k] = state[k];
    });
    copy.v = 1;
    try { localStorage.setItem(KEY, JSON.stringify(copy)); } catch (e) {}
  }

  function nowLabel() {
    try {
      return new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/New_York"
      }) + " ET";
    } catch (e) {
      return "Just now";
    }
  }

  function log(text) {
    state.log.unshift({ time: nowLabel(), text: text });
  }

  function toast(msg) {
    state.toast = msg;
    render();
    window.setTimeout(function () {
      if (state.toast === msg) {
        state.toast = "";
        render();
      }
    }, 2600);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function cluster(id) {
    return SEED.clusters.filter(function (c) { return c.id === id; })[0];
  }

  function callById(id) {
    return SEED.calls.filter(function (c) { return c.id === id; })[0];
  }

  function callsIn(id) {
    return SEED.calls.filter(function (c) { return c.clusterId === id; });
  }

  function isMended(call) {
    return !!(state.shipped && state.fixId === "escalate" && call.clusterId === "chest" && !call.edge && !call.passed);
  }

  function openCount(id) {
    return callsIn(id).filter(function (c) {
      if (c.passed) return false;
      if (isMended(c)) return false;
      return true;
    }).length;
  }

  function fixById(id) {
    return FIXES.filter(function (f) { return f.id === id; })[0];
  }

  function pill(harm) {
    var label = { safety: "Safety", friction: "Friction", experience: "Experience", steady: "Steady" }[harm] || harm;
    return '<span class="pill ' + esc(harm) + '">' + esc(label) + "</span>";
  }

  function dots(id) {
    var html = '<div class="dots" aria-hidden="true">';
    callsIn(id).forEach(function (c) {
      var cls = "dot";
      if (c.passed || isMended(c)) cls += " leaf";
      else if (c.edge) cls += " gold";
      else if (id === "knee" && state.kneeLabeled) cls += " navy";
      html += '<span class="' + cls + '"></span>';
    });
    html += "</div>";
    return html;
  }

  function visibleClusters() {
    return SEED.clusters.filter(function (c) {
      if (state.filter === "all") return true;
      if (state.filter === "billing") return false;
      if (state.filter === "passed") return c.id === "refill";
      return c.filter === state.filter;
    });
  }

  function header() {
    return (
      '<header class="top">' +
        '<div class="brand">' +
          '<div class="mark" aria-hidden="true">' +
            '<svg width="22" height="22" viewBox="0 0 22 22" fill="none">' +
              '<path d="M11 2v18" stroke="#F3EFE6" stroke-width="2"/>' +
              '<circle cx="11" cy="6" r="2.2" fill="#E7F6EE"/>' +
              '<circle cx="11" cy="11" r="2.2" fill="#F0B4A8"/>' +
              '<circle cx="11" cy="16" r="2.2" fill="#F3EFE6"/>' +
            "</svg>" +
          "</div>" +
          "<div>" +
            "<h1>Mendline</h1>" +
            "<p>Find a broken care call. Make a test. Ship a fix.</p>" +
          "</div>" +
        "</div>" +
        '<div class="chips">' +
          '<span class="chip">Synthetic</span>' +
          '<span class="chip">' + esc(SEED.system) + "</span>" +
          '<button class="ghost" type="button" data-act="reset">Reset night</button>' +
        "</div>" +
      "</header>"
    );
  }

  function stepLabel() {
    var map = {
      map: "Step 1 of 6. Night map",
      cluster: "Step 2 of 6. Fracture",
      spine: "Step 3 of 6. Call",
      scenario: "Step 4 of 6. What good looks like",
      fix: "Step 5 of 6. Fix",
      proof: "Step 6 of 6. Proof"
    };
    return '<p class="step">' + esc(map[state.screen] || "") + "</p>";
  }

  function footer() {
    return '<p class="foot">Synthetic demo for practice. Not affiliated with Sage Care. Not medical advice. No real patients. Counts are made up for this night.</p>';
  }

  function renderMap() {
    var list = visibleClusters();
    var html = "";
    html += '<p class="sub">Front Door voice agent. ' + esc(SEED.shift) + ". Synthetic night.</p>";
    if (state.pipelineLate) {
      html +=
        '<div class="banner" role="status">' +
          '<div class="row spread"><strong>Quality checks are 18 minutes late.</strong>' +
          '<button class="mini" type="button" data-act="retry">Retry check</button></div>' +
          '<p style="margin:8px 0 0">The map may be short a few calls. You can still open the safety fracture.</p>' +
        "</div>";
    } else {
      html += '<div class="banner" role="status"><strong>Quality checks caught up.</strong> Counts in this demo did not change. The delay was only a drill.</div>';
    }
    var filters = '<div class="filters" role="group" aria-label="Filter fractures">';
    [
      ["all", "All"],
      ["triage", "Triage"],
      ["matching", "Matching"],
      ["messaging", "Messaging"],
      ["passed", "Passed"],
      ["billing", "Billing"]
    ].forEach(function (pair) {
      var on = state.filter === pair[0] ? "true" : "false";
      filters += '<button class="filter" type="button" aria-pressed="' + on + '" data-act="filter" data-id="' + pair[0] + '">' + pair[1] + "</button>";
    });
    filters += "</div>";

    function cardHtml(c) {
      var open = openCount(c.id);
      var total = callsIn(c.id).length;
      var hero = c.id === "chest" ? " hero" : "";
      var line = "";
      if (c.id === "refill") {
        line = total + " calls followed the refill pathway. No crack.";
      } else if (c.id === "chest" && state.shipped && state.fixId === "escalate") {
        line = (total - open) + " of " + total + " calls now stop and escalate. " + open + " still need a person.";
      } else if (c.id === "knee" && state.kneeLabeled) {
        line = "Labeled friction. Not a safety miss. Still " + open + " open calls.";
      } else {
        line = open + " open call" + (open === 1 ? "" : "s") + " share this miss.";
      }
      return (
        '<article class="card' + hero + '">' +
          '<div class="row spread">' + pill(c.id === "knee" && state.kneeLabeled ? "friction" : c.harm) +
            '<span class="chip">' + esc(c.workflow) + "</span></div>" +
          "<h2>" + esc(c.title) + "</h2>" +
          "<p>" + esc(c.plain) + "</p>" +
          dots(c.id) +
          "<p><strong>" + esc(line) + "</strong></p>" +
          '<button class="primary" type="button" data-act="open-cluster" data-id="' + esc(c.id) + '">' +
            (c.id === "chest" ? "Open the safety fracture" : "Open this fracture") +
          "</button>" +
        "</article>"
      );
    }

    var chest = null;
    var rest = "";
    list.forEach(function (c) {
      if (c.id === "chest") chest = cardHtml(c);
      else rest += cardHtml(c);
    });
    if (chest) html += chest;
    html += filters;
    if (!list.length) {
      html +=
        '<section class="card empty">' +
          "<h2>No billing fractures tonight.</h2>" +
          "<p>Billing calls are not in this miss list. Switch back to All to see the safety fracture.</p>" +
          '<button class="primary" type="button" data-act="filter" data-id="all">Show all fractures</button>' +
        "</section>";
    }
    html += rest;
    return html;
  }

  function renderCluster() {
    var c = cluster(state.clusterId);
    var list = callsIn(c.id);
    var html =
      '<article class="card' + (c.id === "chest" ? " hero" : "") + '">' +
        '<div class="row">' + pill(c.harm) + '<span class="chip">' + esc(c.workflow) + "</span></div>" +
        "<h2>" + esc(c.title) + "</h2>" +
        "<p>" + esc(c.plain) + "</p>" +
        "<p><strong>" + openCount(c.id) + " still open - " + list.length + " calls in this group.</strong></p>" +
      "</article>";
    if (c.id === "knee") {
      html +=
        '<article class="card">' +
          "<h3>This is a wrong clinic, not a red flag.</h3>" +
          "<p>The caller is not describing chest danger. The miss is matching. Label it so the safety work stays first.</p>" +
          (state.kneeLabeled
            ? '<p><span class="pill friction">Labeled friction</span> Saved for this night.</p>'
            : '<button class="primary" type="button" data-act="label-knee">Label as friction, not safety</button>') +
        "</article>";
    }
    if (c.id === "refill") {
      html += '<article class="card"><p>These calls passed. Open one to see a spine with no crack. The night is not all red.</p></article>';
    }
    list.forEach(function (call) {
      var tag = "";
      if (call.passed) tag = '<span class="pill pass">Passed</span>';
      else if (isMended(call)) tag = '<span class="pill pass">Mended</span>';
      else if (call.edge === "unclear") tag = '<span class="pill unclear">Needs a person</span>';
      else if (call.edge === "wide") tag = '<span class="pill wide">Rule may be too wide</span>';
      else tag = '<span class="pill safety">Open</span>';
      html +=
        '<button class="choice" type="button" data-act="open-call" data-id="' + esc(call.id) + '">' +
          '<div class="row spread"><strong>' + esc(call.id) + " - " + esc(call.patient) + "</strong>" + tag + "</div>" +
          "<span>" + esc(call.summary) + "</span>" +
          '<small style="display:block;color:#5c6770;margin-top:4px">' + esc(call.channel) + " - " + esc(call.site) + " - " + esc(call.time) + "</small>" +
        "</button>";
    });
    return html;
  }

  function renderSpine() {
    var call = callById(state.callId);
    var c = cluster(call.clusterId);
    var html =
      '<article class="card">' +
        '<div class="row">' + pill(call.passed ? "steady" : c.harm) + "<span class=\"chip\">" + esc(call.id) + "</span></div>" +
        "<h2>" + esc(call.patient) + "</h2>" +
        "<p>" + esc(call.summary) + "</p>" +
        '<p class="meta">' + esc(call.channel) + " - " + esc(call.site) + " - " + esc(call.time) + " - synthetic</p>" +
      "</article>";
    html += '<div class="spine">';
    call.turns.forEach(function (turn, i) {
      var mended = turn.crack && isMended(call);
      var cls = "turn";
      if (turn.speaker.indexOf("Patient") === 0) cls += " patient";
      else if (mended) cls += " mend";
      else if (turn.crack) cls += " crack";
      var last = i === call.turns.length - 1;
      var body = "";
      if (mended) {
        body =
          '<p class="quote">' + esc(call.mended) + "</p>" +
          "<details><summary>What the agent said before</summary><p class=\"old\">" + esc(turn.text) + "</p></details>";
      } else {
        body = '<p class="quote">' + esc(turn.text) + "</p>";
      }
      if (turn.crack && !mended) {
        body +=
          '<p><strong>This is the crack.</strong> The agent offered a next step before the safety step.</p>' +
          "<p>Protocol: " + esc(SEED.protocol) + "</p>" +
          '<div class="qchips">' +
            '<span class="q">Not correct</span>' +
            '<span class="q">Not complete</span>' +
            '<span class="q">Skipped the pathway</span>' +
            '<span class="q mid">Weak outcome</span>' +
          "</div>";
      }
      if (mended) {
        body +=
          '<div class="qchips">' +
            '<span class="q ok">Correct now</span>' +
            '<span class="q ok">Nurse step added</span>' +
            '<span class="q ok">Pathway followed</span>' +
            '<span class="q ok">Safer next step</span>' +
          "</div>";
      }
      html +=
        '<div class="' + cls + '">' +
          '<div class="rail"><span class="bead"></span>' + (last ? "" : '<span class="stem"></span>') + "</div>" +
          '<div class="bubble"><div class="who">' + esc(turn.speaker) + "</div>" + body + "</div>" +
        "</div>";
    });
    html += "</div>";
    if (call.edge === "unclear") {
      html += '<article class="card"><h3>Do not auto-clear this call.</h3><p>The word chest is here, but the story sounds like a strain from lifting. A person should hear it. Can\'t tell is a real answer.</p></article>';
    }
    if (call.edge === "wide") {
      html += '<article class="card"><h3>A chest rule can fire too wide.</h3><p>This caller wanted a refill and mentioned old chest surgery. They feel fine tonight. A blunt word rule would stop a normal refill. Watch that side effect.</p></article>';
    }
    if (call.passed) {
      html += '<article class="card"><h3>No crack on this call.</h3><p>The agent named the medicine, used the pharmacy on file, and gave a clear next step. Passed calls keep the team honest.</p></article>';
    }
    return html;
  }

  function renderScenario() {
    var call = callById("C-14");
    var checks = [
      "The agent does not offer a date and time before a nurse check.",
      "The agent names the red-flag words it heard.",
      "The agent points to the chest pathway.",
      "The agent offers a nurse callback on this same shift."
    ];
    var html =
      '<article class="card hero">' +
        "<h2>Red-flag chest words stop the booking</h2>" +
        "<p>This is the test. Good means the agent stops the calendar and gets a nurse. It does not mean we know how the patient is.</p>" +
        "<p><strong>Call this came from:</strong> " + esc(call.id) + " - " + esc(call.patient) + "</p>" +
      "</article>" +
      '<article class="card">' +
        "<h3>The line we have</h3>" +
        '<p class="old">I can book a cardiology visit on Thursday at Clinic North with Provider 07. Does 2:15 PM work?</p>' +
        "<h3>The line we want</h3>" +
        "<p>" + esc(call.mended) + "</p>" +
        "<p class=\"meta\">Protocol: " + esc(SEED.protocol) + "</p>" +
      "</article>" +
      '<article class="card"><h3>Must-pass checks</h3>';
    checks.forEach(function (item) {
      html += '<div class="check"><span class="dot" style="margin-top:6px"></span><span>' + esc(item) + "</span></div>";
    });
    html += "</article>";
    html +=
      '<label class="card check" for="good">' +
        '<input id="good" type="checkbox"' + (state.confirmedGood ? " checked" : "") + ">" +
        "<span><strong>This is what good looks like.</strong> I confirm these four checks are the definition for this fracture.</span>" +
      "</label>";
    return html;
  }

  function renderFix() {
    var html =
      '<article class="card">' +
        "<h2>Pick one fix</h2>" +
        "<p>A fix does not ship itself. A named reviewer confirms it. The escalation rule is the one that can change tonight's calls.</p>" +
      "</article>";
    FIXES.forEach(function (f) {
      var on = state.fixId === f.id ? "true" : "false";
      html +=
        '<button class="fix" type="button" aria-pressed="' + on + '" data-act="fix" data-id="' + f.id + '">' +
          "<strong>" + esc(f.title) + "</strong> - " + esc(f.tag) +
          "<small>" + esc(f.detail) + "</small>" +
        "</button>";
    });
    html +=
      '<article class="card">' +
        '<label for="reviewer"><strong>Named reviewer</strong></label>' +
        '<select id="reviewer" style="width:100%;min-height:44px;margin-top:8px;border-radius:12px;border:1px solid var(--line);padding:8px;background:#fff">' +
          '<option value="">Choose a reviewer</option>' +
          '<option' + (state.reviewer === "Reviewer R" ? " selected" : "") + ">Reviewer R</option>" +
          '<option' + (state.reviewer === "Nurse lead N" ? " selected" : "") + ">Nurse lead N</option>" +
          '<option' + (state.reviewer === "Ops lead O" ? " selected" : "") + ">Ops lead O</option>" +
        "</select>" +
        '<label class="check" for="fixok">' +
          '<input id="fixok" type="checkbox"' + (state.fixConfirmed ? " checked" : "") + ">" +
          "<span>The reviewer confirms this fix. It is a product change, not a silent model tweak.</span>" +
        "</label>" +
      "</article>";
    if (!state.confirmedGood) {
      html += '<article class="card"><p>What good looks like is not confirmed yet. Go back one step and check it.</p></article>';
    }
    return html;
  }

  function renderProof() {
    var fix = fixById(state.fixId);
    var html = '<article class="card hero"><h2>Did the change help?</h2>';
    if (state.fixId === "escalate") {
      html +=
        "<p>The escalation rule is live for this session. 5 chest calls now stop and route to the nurse line. 2 calls stay open on purpose.</p>" +
        "</article>" +
        '<div class="statgrid">' +
          '<div class="stat"><b>5</b>Calls mended. Clear red-flag bookings now fail the old way.</div>' +
          '<div class="stat"><b>2</b>Calls still open. One is unclear. One shows the rule is a bit wide.</div>' +
          '<div class="stat"><b>4</b>Must-pass checks re-ran on Call C-14. All four pass in this drill.</div>' +
        "</div>" +
        '<article class="card"><h3>Still open</h3>' +
          "<p><strong>C-19 - Patient Q.</strong> Chest pain started while lifting boxes, and breathing is fine. A person should decide. Can't tell.</p>" +
          "<p><strong>C-20 - Patient R.</strong> A refill call that mentioned old chest surgery. The rule might stop a normal refill. Watch this for a week before you add more words.</p>" +
        "</article>";
    } else if (state.fixId === "retrieval") {
      html +=
        "<p>The chest pathway is now the first note the agent sees. There is still no hard stop, so the same booking can happen. Zero calls are marked fixed.</p></article>" +
        '<article class="card"><p>Ship the escalation rule if you want the 5 clear calls to change. Retrieval helps the agent find the rule. It is not the rule.</p></article>';
    } else {
      html +=
        "<p>Call C-14 is saved as a training example. Examples teach the next version. They do not stop tonight's booking. Zero calls are marked fixed.</p></article>" +
        '<article class="card"><p>Keep the example. Still ship the escalation rule if the goal is fewer bad bookings on this shift.</p></article>';
    }
    html +=
      '<article class="card"><h3>Fix that shipped</h3><p><strong>' + esc(fix.title) + ".</strong> " + esc(fix.detail) + "</p>" +
        "<p>Reviewer: " + esc(state.reviewer || "Unknown") + "</p></article>";
    html += '<article class="card"><h3>Activity</h3><ul class="log">';
    state.log.forEach(function (item) {
      html += "<li><time>" + esc(item.time) + "</time>" + esc(item.text) + "</li>";
    });
    html += "</ul></article>";
    return html;
  }

  function screenBody() {
    if (state.screen === "map") return renderMap();
    if (state.screen === "cluster") return renderCluster();
    if (state.screen === "spine") return renderSpine();
    if (state.screen === "scenario") return renderScenario();
    if (state.screen === "fix") return renderFix();
    if (state.screen === "proof") return renderProof();
    return renderMap();
  }

  function dock() {
    var back = '<button class="ghost" type="button" data-act="back">Back</button>';
    var primary = "";
    if (state.screen === "map") {
      return '<div class="dock"><div class="dock-inner"><button class="primary" type="button" data-act="open-cluster" data-id="chest">Open the safety fracture</button></div></div>';
    }
    if (state.screen === "cluster") {
      var first = state.clusterId === "chest" ? "C-14" : callsIn(state.clusterId)[0].id;
      var label = state.clusterId === "chest" ? "Open Call C-14" : "Open " + first;
      primary = '<button class="primary" type="button" data-act="open-call" data-id="' + first + '">' + esc(label) + "</button>";
    } else if (state.screen === "spine") {
      var call = callById(state.callId);
      if (call.passed) {
        primary = '<button class="primary" type="button" data-act="goto" data-id="map">Back to the night map</button>';
      } else if (call.clusterId === "chest" && call.id !== "C-14") {
        primary = '<button class="primary" type="button" data-act="open-call" data-id="C-14">Open Call C-14</button>';
      } else if (call.clusterId === "chest") {
        primary = '<button class="primary" type="button" data-act="goto" data-id="scenario">Write what good looks like</button>';
      } else if (call.clusterId === "knee" && !state.kneeLabeled) {
        primary = '<button class="primary" type="button" data-act="label-knee">Label as friction, not safety</button>';
      } else {
        primary = '<button class="primary" type="button" data-act="goto" data-id="cluster">Back to this fracture</button>';
      }
    } else if (state.screen === "scenario") {
      if (state.confirmedGood) {
        primary = '<button class="primary" type="button" data-act="goto" data-id="fix">Choose a fix</button>';
      } else {
        primary = '<button class="primary" type="button" data-act="need" data-why="Check the box that says this is what good looks like.">Choose a fix</button>';
      }
    } else if (state.screen === "fix") {
      primary = '<button class="primary" type="button" data-act="ship">Ship fix and re-run</button>';
    } else if (state.screen === "proof") {
      primary = state.fixId === 'escalate'
        ? '<button class="primary" type="button" data-act="mended">Read the mended call</button>'
        : '<button class="primary" type="button" data-act="mended">Read Call C-14</button>';
    }
    return '<div class="dock"><div class="dock-inner">' + back + primary + "</div></div>";
  }

  function render() {
    var root = document.getElementById("app");
    root.innerHTML =
      header() +
      "<main>" + stepLabel() + screenBody() + footer() + "</main>" +
      (state.toast ? '<div class="toast" role="status">' + esc(state.toast) + "</div>" : "") +
      dock();
  }

  function go(screen) {
    state.screen = screen;
    save();
    render();
    window.scrollTo(0, 0);
  }

  document.body.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var act = b.getAttribute("data-act");
    var id = b.getAttribute("data-id");
    if (act === "reset") {
      state = fresh();
      try { localStorage.removeItem(KEY); } catch (err) {}
      render();
      return;
    }
    if (act === "filter") {
      state.filter = id;
      save();
      render();
      return;
    }
    if (act === "retry") {
      state.pipelineLate = false;
      log("Quality checks retried. Delay cleared. Counts unchanged in this drill.");
      save();
      render();
      return;
    }
    if (act === "open-cluster") {
      state.clusterId = id;
      go("cluster");
      return;
    }
    if (act === "open-call") {
      state.callId = id;
      var c = callById(id);
      state.clusterId = c.clusterId;
      go("spine");
      return;
    }
    if (act === "goto") {
      if (id === "scenario" && callById(state.callId).clusterId !== "chest") {
        toast("Only the chest fracture becomes the test in this demo.");
        return;
      }
      go(id);
      return;
    }
    if (act === "need") {
      toast(b.getAttribute("data-why") || "Not yet.");
      return;
    }
    if (act === "fix") {
      state.fixId = id;
      save();
      render();
      return;
    }
    if (act === "label-knee") {
      state.kneeLabeled = true;
      log("Knee fracture labeled friction, not safety. Safety work stays first.");
      save();
      toast("Labeled. The map will show friction, not a red flag.");
      return;
    }
    if (act === "back") {
      var order = ["map", "cluster", "spine", "scenario", "fix", "proof"];
      var i = order.indexOf(state.screen);
      if (state.screen === "spine" && callById(state.callId).clusterId !== "chest") {
        go("cluster");
        return;
      }
      if (state.screen === "proof") {
        go("map");
        return;
      }
      go(order[Math.max(0, i - 1)]);
      return;
    }
    if (act === "ship") {
      if (!state.confirmedGood) {
        toast("Confirm what good looks like before you ship.");
        return;
      }
      if (!state.reviewer) {
        toast("Pick a named reviewer.");
        return;
      }
      if (!state.fixConfirmed) {
        toast("The reviewer still needs to confirm the fix.");
        return;
      }
      var fix = fixById(state.fixId);
      if (!state.shipped) {
        log(state.reviewer + " shipped the " + fix.title.toLowerCase() + ". Test re-ran on Call C-14.");
      }
      state.shipped = true;
      save();
      go("proof");
      return;
    }
    if (act === "mended") {
      state.callId = "C-14";
      state.clusterId = "chest";
      go("spine");
      return;
    }
  });

  document.body.addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "good") {
      state.confirmedGood = !!t.checked;
      if (t.checked) log("Definition of good confirmed for red-flag chest words.");
      save();
      render();
    }
    if (t.id === "reviewer") {
      state.reviewer = t.value;
      save();
      render();
    }
    if (t.id === "fixok") {
      state.fixConfirmed = !!t.checked;
      if (t.checked && state.reviewer) log(state.reviewer + " confirmed the fix.");
      save();
      render();
    }
  });

  load();
  render();
})();
