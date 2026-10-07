(function () {
  const DATA = window.PARTY_DATA;
  const KEY = "ps-party-ready-check-v1";
  const RATE = DATA.gbPerMinute;
  const SCREENS = [
    ["create", "Create"],
    ["board", "Board"],
    ["fixes", "Host fixes"],
    ["phone", "Friend phone"],
    ["tv", "Game Base"],
    ["start", "Start"],
    ["pm", "PM view"]
  ];

  function freshPlayers() {
    const out = {};
    Object.keys(DATA.players).forEach((id) => {
      const p = DATA.players[id];
      out[id] = {
        remain: p.remain,
        downloading: false,
        choice: "",
        share: true
      };
    });
    return out;
  }

  function seed() {
    return {
      screen: "create",
      created: false,
      invites: { ren: false, mira: false, theo: false, ava: false },
      minute: 0,
      players: freshPlayers(),
      reminder: false,
      started: false,
      late: false,
      phone: "theo",
      flash: "",
      nudge: Object.assign({}, DATA.nudgeSeed)
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seed();
      const saved = JSON.parse(raw);
      const base = seed();
      if (!saved) return base;
      base.screen = saved.screen || "create";
      base.created = !!saved.created;
      base.invites = Object.assign(base.invites, saved.invites || {});
      base.minute = saved.minute || 0;
      base.players = freshPlayers();
      Object.keys(base.players).forEach((id) => Object.assign(base.players[id], (saved.players || {})[id] || {}));
      base.reminder = !!saved.reminder;
      base.started = !!saved.started;
      base.late = !!saved.late;
      base.phone = saved.phone || "theo";
      base.nudge = Object.assign({}, DATA.nudgeSeed, saved.nudge || {});
      return base;
    } catch (err) {
      return seed();
    }
  }

  let state = load();
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function clock() {
    const total = 19 * 60 + 31 + state.minute;
    let h = Math.floor(total / 60) % 24;
    const m = total % 60;
    const ap = h >= 12 ? "PM" : "AM";
    const hr = h % 12 || 12;
    return hr + ":" + String(m).padStart(2, "0") + " " + ap;
  }

  function roster() {
    const ids = ["kai"].concat(DATA.friends.filter((id) => state.invites[id] && state.players[id].choice !== "out"));
    return ids;
  }

  function pctDone(id) {
    const meta = DATA.players[id];
    const live = state.players[id];
    if (!meta.total) return 100;
    if (id === "mira") {
      const doneGb = meta.total - live.remain;
      return Math.max(0, Math.min(100, Math.round((doneGb / meta.total) * 100)));
    }
    if (!meta.installed && id === "theo") {
      return Math.max(0, Math.min(100, Math.round(((meta.total - live.remain) / meta.total) * 100)));
    }
    return Math.max(0, Math.min(100, Math.round(((meta.total - live.remain) / meta.total) * 100)));
  }

  function statusOf(id) {
    const meta = DATA.players[id];
    const live = state.players[id];
    if (live.choice === "later") return { chip: "Join later", kind: "later", reason: meta.name + " chose to join later." };
    if (live.choice === "out") return { chip: "Out", kind: "bad", reason: meta.name + " cannot make it." };
    if (id === "ava" && meta.online === "Lapsed") return { chip: "Not ready", kind: "bad", reason: "Online access lapsed. Nothing was bought." };
    if (live.remain > 0.05) {
      const why = id === "theo" && !meta.installed ? "Game is not installed (" + live.remain.toFixed(1) + " GB left)." : "Update in progress (" + pctDone(id) + "%).";
      return { chip: "Fixable", kind: "fix", reason: why };
    }
    return { chip: "Ready", kind: "ready", reason: "Owns the game, installed, up to date, and online access is fine for this device." };
  }

  function counts() {
    const ids = state.created ? roster() : ["kai"].concat(DATA.friends);
    const tally = { Ready: 0, Fixable: 0, "Not ready": 0, "Join later": 0 };
    ids.forEach((id) => {
      if (!state.created && id !== "kai" && false) return;
      const chip = statusOf(id).chip;
      if (tally[chip] === undefined) tally[chip] = 0;
      tally[chip] += 1;
    });
    return { ids: ids, tally: tally };
  }

  function startReasons() {
    if (!state.created) return ["Create the session and invite friends first."];
    const reasons = [];
    roster().forEach((id) => {
      const st = statusOf(id);
      if (st.chip !== "Ready" && st.chip !== "Join later") reasons.push(DATA.players[id].name + " is " + st.chip + ". " + st.reason);
    });
    return reasons;
  }

  function advance(mins) {
    if (!mins) return;
    state.minute += mins;
    ["kai", "mira", "theo"].forEach((id) => {
      const live = state.players[id];
      if (!live.downloading || live.remain <= 0) return;
      live.remain = Math.max(0, live.remain - RATE * mins);
      if (live.remain <= 0.05) {
        live.remain = 0;
        live.downloading = false;
      }
    });
  }

  function footer() {
    return '<footer class="site-footer"><p><a href="https://amiteshdwivedijhu-ship-it.github.io/" target="_blank" rel="noopener noreferrer">Prototype by Amitesh Dwivedi</a></p>' +
      "<p>Prototype for interview practice. Not affiliated with Sony Interactive Entertainment or PlayStation. Not a PlayStation product. Synthetic players and a fake game only.</p></footer>";
  }

  function chrome(body) {
    const nav = SCREENS.map(([id, label]) => '<button type="button" class="nav-btn" data-action="screen" data-screen="' + id + '"' + (state.screen === id ? ' aria-current="page"' : "") + ">" + label + "</button>").join("");
    return '<header class="topbar"><div class="brand"><h1>Party Ready Check</h1><p>' + esc(clock()) + " · concept</p></div>" +
      '<button type="button" class="btn" data-action="reset">Reset demo</button></header><div class="wrap">' +
      '<div class="banner" role="note"><p><strong>Sample concept.</strong> Players, the game, and the numbers are synthetic. This is not a console feature. Nothing is bought.</p></div>' +
      '<nav class="screen-nav" aria-label="Screens">' + nav + "</nav>" +
      (state.flash ? '<p class="lock-box" role="status">' + esc(state.flash) + "</p>" : "") +
      body + footer() + "</div>";
  }

  function pill(st) {
    return '<span class="pill pill-' + st.kind + '">' + esc(st.chip) + "</span>";
  }

  function screenCreate() {
    const friends = DATA.friends.map((id) => {
      const on = state.invites[id];
      return '<button type="button" class="choice" data-action="invite" data-id="' + id + '" aria-pressed="' + (on ? "true" : "false") + '">' + esc(DATA.players[id].name) + "</button>";
    }).join("");
    return "<h2>Create a session</h2><p>Game: " + esc(DATA.game) + ". Time: " + DATA.timeLabel + ". Clock starts at 7:31 PM.</p>" +
      "<h3>Invite friends</h3><div class=\"choice-row\">" + friends + "</div>" +
      '<p>Share by QR, text only: party.example/starfall-8pm. This is not a real code.</p>' +
      '<button type="button" class="btn btn-primary" data-action="create">Create session</button>' +
      (state.created ? '<p class="ready-box">Session created.</p>' : "");
  }

  function row(id) {
    const meta = DATA.players[id];
    const live = state.players[id];
    const st = statusOf(id);
    const shared = live.share;
    const detail = shared ? st.reason : "Sharing is off. The host does not see the reason.";
    const checks = [
      ["Owns game", meta.owns ? "Yes" : "No"],
      ["Installed", (id === "theo" ? live.remain <= 0 : meta.installed) ? "Yes" : "No"],
      ["Up to date", live.remain <= 0.05 ? "Yes" : "No"],
      ["Online access", meta.online],
      ["Device", meta.device],
      ["Readiness sharing", shared ? "On" : "Off"]
    ];
    const eta = live.remain > 0.05 ? " About " + Math.ceil(live.remain / RATE) + " min to ready." : "";
    return '<article class="card"><h3>' + esc(meta.name) + " · " + esc(meta.device) + "</h3><p>" + pill(st) + esc(detail) + eta + "</p><p>" +
      checks.map((c) => esc(c[0]) + ": " + esc(c[1])).join(". ") + ".</p>" +
      (live.remain > 0 && live.downloading ? '<div class="bar" aria-hidden="true"><span style="width:' + pctDone(id) + '%"></span></div><p>' + pctDone(id) + "% done.</p>" : "") +
      "</article>";
  }

  function screenBoard() {
    if (!state.created) return "<h2>Ready board</h2><p>Create the session first.</p>";
    const c = counts();
    return "<h2>Ready board</h2><p>" + c.tally.Ready + " Ready. " + (c.tally.Fixable || 0) + " Fixable. " + (c.tally["Not ready"] || 0) + " Not ready. " + (c.tally["Join later"] || 0) + " joining later.</p>" +
      "<p>Session at 8:00 PM. Now " + esc(clock()) + ".</p>" +
      c.ids.map(row).join("") +
      '<button type="button" class="btn" data-action="ff">Fast-forward 25 minutes</button>';
  }

  function screenFixes() {
    const kai = state.players.kai;
    const left = Math.max(0, 29 - state.minute);
    return "<h2>Host fixes</h2><p>Countdown to 8:00 PM: " + left + " min. Now " + esc(clock()) + ".</p>" +
      '<article class="card"><h3>Kai on PS5</h3><p>Remote download is allowed only in Rest Mode with Stay Connected turned on. Kai confirms this on the host console.</p>' +
      (kai.remain <= 0 ? '<p class="ready-box">Patch finished. Kai is up to date.</p>' : '<div class="bar"><span style="width:' + pctDone("kai") + '%"></span></div>') +
      '<button type="button" class="btn btn-primary" data-action="kai-download"' + (kai.remain <= 0 ? " disabled" : "") + ">Start download to my PS5</button></article>" +
      '<article class="card"><h3>Theo</h3><p>Theo is away from the console. A reminder asks Theo to confirm the download on the phone. The host cannot start it.</p>' +
      (state.reminder ? '<p class="ready-box">Reminder sent to Theo.</p>' : "") +
      '<button type="button" class="btn" data-action="remind">Send a reminder</button></article>' +
      '<button type="button" class="btn" data-action="ff">Fast-forward 25 minutes</button>';
  }

  function screenPhone() {
    const who = state.phone;
    const tabs = ["theo", "ava"].map((id) => '<button type="button" class="choice" data-action="phone" data-id="' + id + '" aria-pressed="' + (who === id ? "true" : "false") + '">' + esc(DATA.players[id].name) + "</button>").join("");
    let body = "";
    if (who === "theo") {
      const live = state.players.theo;
      const eta = Math.ceil(Math.max(live.remain, 0) / RATE);
      body = "<h2>Theo</h2><p>Starfall Rally at 8:00. You are on your phone. The game is not installed.</p>" +
        (state.reminder ? "<p>Kai sent a reminder.</p>" : "") +
        "<p>Download size 46 GB. About " + (live.remain <= 0 ? "0" : eta) + " minutes on a " + DATA.bandwidth + " Mbps line. Your PS5 allows remote download (Rest Mode, Stay Connected).</p>" +
        '<div class="stack">' +
        '<button type="button" class="btn btn-primary" data-action="theo-download"' + (live.remain <= 0 ? " disabled" : "") + ">Download to my console now</button>" +
        '<button type="button" class="btn" data-action="choice" data-id="theo" data-choice="later">Join later</button>' +
        '<button type="button" class="btn" data-action="choice" data-id="theo" data-choice="out">Can\'t make it</button></div>' +
        (live.downloading ? '<div class="bar"><span style="width:' + pctDone("theo") + '%"></span></div><p>' + pctDone("theo") + "% downloaded.</p>" : "") +
        '<button type="button" class="choice" data-action="share" data-id="theo" aria-pressed="' + (live.share ? "true" : "false") + '">Share readiness: ' + (live.share ? "On" : "Off") + "</button>";
    } else {
      const live = state.players.ava;
      body = "<h2>Ava</h2><p>Online access lapsed. You can still join later, or skip tonight. This demo does not sell memberships.</p>" +
        '<p id="membership-note"><a href="#membership-note">See membership options</a>. The link stays on this page. There is no purchase button.</p>' +
        '<div class="stack">' +
        '<button type="button" class="btn" data-action="choice" data-id="ava" data-choice="later">Join later</button>' +
        '<button type="button" class="btn" data-action="choice" data-id="ava" data-choice="out">Can\'t make it</button></div>' +
        "<p>Current choice: " + esc(live.choice || "none") + ".</p>";
    }
    return '<div class="choice-row">' + tabs + "</div>" + body +
      '<button type="button" class="btn" data-action="ff">Fast-forward 25 minutes</button>';
  }

  function tvText() {
    const ids = state.created ? roster() : ["kai"].concat(DATA.friends);
    const ready = ids.filter((id) => statusOf(id).chip === "Ready").length;
    let text = DATA.game + " at 8:00, " + ready + " of " + ids.length + " ready";
    if (state.players.mira.remain > 0.05 && (!state.created || state.invites.mira)) text += ", Mira updating " + pctDone("mira") + "%";
    if (state.players.ava.choice === "later" && state.invites.ava) text += ", Ava joining later";
    return text;
  }

  function screenTv() {
    const reasons = startReasons();
    return "<h2>Console Game Base</h2><div class=\"tv\"><div class=\"tv-card\"><p class=\"label\">Party card</p><h3>" + esc(tvText()) + "</h3>" +
      '<button type="button" class="btn btn-primary" data-action="start"' + (reasons.length ? " disabled" : "") + ">Join</button></div></div>" +
      (reasons.length ? '<div class="lock-box"><p>Join stays locked.</p><ul>' + reasons.map((r) => "<li>" + esc(r) + "</li>").join("") + "</ul></div>" : '<p class="ready-box">Everyone invited is Ready or joining later.</p>');
  }

  function screenStart() {
    const reasons = startReasons();
    const names = roster().filter((id) => statusOf(id).chip === "Ready" || state.late && id === "ava").map((id) => DATA.players[id].name);
    return "<h2>Start together</h2>" +
      (reasons.length ? '<div class="lock-box"><p><strong>Start together is locked.</strong></p><ul>' + reasons.map((r) => '<li class="check-fail">' + esc(r) + "</li>").join("") + "</ul></div>" : '<div class="ready-box"><p class="check-pass">Everyone invited is Ready or has chosen Join later.</p></div>') +
      '<button type="button" class="btn btn-primary" data-action="start"' + (reasons.length || state.started ? " disabled" : "") + ">Start together</button>" +
      '<button type="button" class="btn" data-action="ff">Fast-forward 25 minutes</button>' +
      (state.started ? '<article class="card"><h3>' + esc(DATA.game) + " lobby</h3><p>" + esc(names.join(", ")) + " are in.</p>" +
        (state.players.ava.choice === "later" && !state.late ? '<button type="button" class="btn" data-action="late">Ava joins late</button>' : "") +
        (state.late ? "<p>Ava joined the lobby late.</p>" : "") + "</article>" : "");
  }

  function screenPm() {
    const n = state.nudge;
    const blocks = DATA.pm.blockers.map((b) => "<li>" + esc(b[0]) + ": " + b[1] + "%</li>").join("");
    return "<h2>PM view</h2><p>Last 30 days, synthetic. This is not this session's live count.</p>" +
      "<ul><li>Sessions: " + DATA.pm.sessions.toLocaleString("en-US") + "</li>" +
      "<li>All ready by start time: " + DATA.pm.readyPct + "%</li>" +
      "<li>Target after this concept: " + DATA.pm.targetPct + "%</li>" +
      "<li>Median time from invite to in game: " + DATA.pm.medianMin + " minutes</li></ul>" +
      "<h3>Top blockers</h3><ul>" + blocks + "</ul>" +
      "<h3>Discovery nudge, 4T</h3>" +
      '<label class="field"><span>Tone</span><input data-field="tone" value="' + esc(n.tone) + '"></label>' +
      '<label class="field"><span>Target audience</span><input data-field="audience" value="' + esc(n.audience) + '"></label>' +
      '<label class="field"><span>Touch points</span><input data-field="touch" value="' + esc(n.touch) + '"></label>' +
      '<label class="field"><span>Technique</span><textarea data-field="technique">' + esc(n.technique) + "</textarea></label>";
  }

  function render() {
    const map = { create: screenCreate, board: screenBoard, fixes: screenFixes, phone: screenPhone, tv: screenTv, start: screenStart, pm: screenPm };
    document.getElementById("app").innerHTML = chrome((map[state.screen] || screenCreate)());
  }

  function onClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action !== "reset") state.flash = "";
    if (action === "reset") { localStorage.removeItem(KEY); state = seed(); save(); render(); return; }
    if (action === "screen") { state.screen = btn.dataset.screen; save(); render(); return; }
    if (action === "invite") { state.invites[btn.dataset.id] = !state.invites[btn.dataset.id]; save(); render(); return; }
    if (action === "create") {
      const any = DATA.friends.some((id) => state.invites[id]);
      if (!any) { state.flash = "Invite at least one friend."; save(); render(); return; }
      state.created = true;
      state.screen = "board";
      save(); render(); return;
    }
    if (action === "kai-download") {
      state.players.kai.downloading = true;
      state.flash = "Download started. The PS5 must stay in Rest Mode with Stay Connected on.";
      save(); render(); return;
    }
    if (action === "remind") { state.reminder = true; state.phone = "theo"; save(); render(); return; }
    if (action === "phone") { state.phone = btn.dataset.id; save(); render(); return; }
    if (action === "theo-download") {
      if (!DATA.players.theo.remote) return;
      state.players.theo.downloading = true;
      state.players.theo.choice = "";
      state.flash = "Theo confirmed the download on this phone.";
      save(); render(); return;
    }
    if (action === "choice") {
      state.players[btn.dataset.id].choice = btn.dataset.choice;
      if (btn.dataset.choice === "later" || btn.dataset.choice === "out") state.players[btn.dataset.id].downloading = false;
      save(); render(); return;
    }
    if (action === "share") { state.players[btn.dataset.id].share = !state.players[btn.dataset.id].share; save(); render(); return; }
    if (action === "ff") {
      if (state.players.mira.remain > 0) state.players.mira.downloading = true;
      advance(25);
      save();
      render();
      return;
    }
    if (action === "start") {
      const reasons = startReasons();
      if (reasons.length) { state.flash = reasons[0]; save(); render(); return; }
      state.started = true;
      state.screen = "start";
      save(); render(); return;
    }
    if (action === "late") { state.late = true; save(); render(); return; }
  }

  function onInput(e) {
    const t = e.target;
    if (!t.dataset.field) return;
    state.nudge[t.dataset.field] = t.value;
    save();
  }

  document.getElementById("app").addEventListener("click", onClick);
  document.getElementById("app").addEventListener("input", onInput);
  setInterval(function () {
    if (!state.created) return;
    const active = ["kai", "mira", "theo"].some((id) => state.players[id].downloading && state.players[id].remain > 0);
    if (!active) return;
    advance(1);
    save();
    if (["board", "tv", "fixes", "phone", "start"].indexOf(state.screen) !== -1) render();
  }, 1000);
  render();
})();
