// Voice Sims panel wiring. Reads SUITES/GATES from the page, computes every
// verdict with HARNESS.runSuite, renders release banner, gate cards,
// waveform markers, and transcript. Zero network calls, opens from disk.

(function () {
  "use strict";

  const SUITES = window.SUITES;
  const GATES = window.GATES;
  const H = window.HARNESS;
  const fmtT = H.fmtT;

  const state = {
    selectedId: null,
    recovery: false,
    lastRun: null,
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const suiteById = (id) => SUITES.find((s) => s.id === id);
  const selectedSuite = () =>
    suiteById(state.selectedId === "noisy-interrupted-misheard-email" && state.recovery
      ? "noisy-with-recovery"
      : state.selectedId);

  function tagHtml(text, cls) {
    return '<span class="tag' + (cls ? " " + cls : "") + '">' + text + "</span>";
  }

  // ---------- suite cards ----------

  function renderCards() {
    const wrap = $("#suite-cards");
    wrap.innerHTML = "";

    const clean = suiteById("calm-caller-clean-audio");
    const noisy = suiteById("noisy-interrupted-misheard-email");

    for (const suite of [clean, noisy]) {
      const card = document.createElement("div");
      card.className = "suite-card";
      card.dataset.suite = suite.id;
      card.innerHTML =
        "<h3>" + suite.name + "</h3>" +
        "<p>" + suite.description + "</p>" +
        '<div class="suite-meta-row">' +
        suite.tags.map((t) => tagHtml(t, t.indexOf("noise") >= 0 || t.indexOf("barge") >= 0 || t.indexOf("misheard") >= 0 ? "noise" : null)).join("") +
        "</div>" +
        '<div class="suite-footer">' +
        (suite.hasRecoveryVariant
          ? '<label class="recovery-toggle">' +
            '<input type="checkbox" id="recovery-check">' +
            '<span>Recovery behavior</span>' +
            '<span class="fix-label">yields on barge-in &middot; readback after mishear</span>' +
            "</label>"
          : '<span class="fix-label">no recovery questions this run</span>') +
        '<span class="chip never" data-role="status">Not run</span>' +
        "</div>";
      wrap.appendChild(card);
    }

    $("#recovery-check").checked = state.recovery;
  }

  function setCardStatus(suiteId, run) {
    const card = $$(".suite-card").find((c) => c.dataset.suite === suiteId);
    if (!card) return;
    const chip = card.querySelector("[data-role=status]");
    if (!run) {
      chip.className = "chip never";
      chip.textContent = "Not run";
      return;
    }
    chip.className = "chip " + (run.decision === "SHIP" ? "pass" : "fail");
    chip.textContent = run.decision;
    card.classList.add("selected");
  }

  // ---------- result panel ----------

  function renderResult(run, suite) {
    $("#result-panel").hidden = false;
    $("#result-head").innerHTML =
      "<h2>Suite: " + suite.name + "</h2>" +
      '<p class="env-line">' +
      suite.env.condition + " audio &middot; " + suite.env.noise + " &middot; " +
      runsToFmt(run.durationMs) + " call &middot; " + run.turnCount + " turns &middot; " +
      (state.selectedId === "noisy-interrupted-misheard-email" && state.recovery
        ? '<span style="color:var(--green-ink)">recovery behavior ON (variant transcript)</span>'
        : "recovery behavior OFF (base transcript)") +
      "</p>";

    const cls = run.decision === "SHIP" ? "ship" : "block";
    const ghost = run.decision === "BLOCK" && (suite.id === "noisy-interrupted-misheard-email" || suite.id === "noisy-with-recovery")
      ? '<div class="banner-actions">' +
        '<button class="btn-ghostwriter" id="ghost-btn">Fix with Ghostwriter</button>' +
        "<button class=\"btn\" onclick=\"HARNESS_UI.copyReason()\">Copy reason</button>" +
        "</div>"
      : run.decision === "SHIP"
        ? '<div class="banner-actions"><button class="btn" onclick="HARNESS_UI.copyReason()">Copy reason</button></div>'
        : "";
    $("#release-banner").className = "release-banner " + cls;
    $("#release-banner").innerHTML =
      '<div class="banner-decision ' + cls + '">' + run.decision + "</div>" +
      '<p class="banner-reason">' + run.reason + "</p>" +
      ghost;

    renderGates(run);
    renderWaveform(run, suite);
    renderTranscript(run, suite);
  }

  function runsToFmt(ms) {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return (m > 0 ? m + "m " : "") + s + "s";
  }

  function renderGates(run) {
    const grid = $("#gate-grid");
    grid.innerHTML = "";
    for (const g of run.gates) {
      const card = document.createElement("div");
      card.className = "gate-card";
      const evLis = g.evidence
        .map((e) => {
          if (e.text === null || e.text === undefined || e.turnId === null && e.time === null) return "";
          const t = e.time !== null ? '<button class="ev-time" data-turn="' + (e.turnId || "") + '">' + fmtT(e.time) + "</button> " : "";
          return "<li>" + t + e.text + "</li>";
        })
        .join("");
      card.innerHTML =
        '<div class="gate-head">' +
        '<span class="gate-name">' + g.label + "</span>" +
        '<span class="chip ' + (g.pass ? "pass" : "fail") + '">' + (g.pass ? "PASS" : "FAIL") + "</span>" +
        "</div>" +
        '<div class="gate-measured">' + g.measuredText + " &middot; " + g.budgetText + "</div>" +
        '<div class="gate-verdict ' + (g.pass ? "ok" : "bad") + '">' + g.verdict + "</div>" +
        '<div class="gate-why">Rubric: ' + GATES[g.id].why + "</div>" +
        '<div class="evidence-title">Evidence</div>' +
        '<ul class="evidence-list">' + evLis + "</ul>";
      grid.appendChild(card);
    }
  }

  const MARKER_COLOR = {
    interruption: "#b3261e",
    asr: "#a15a00",
    recovery: "#2f4f3a",
    "recovery-miss": "#b3261e",
  };

  function renderWaveform(run, suite) {
    const W = 1000;
    const HGT = 72;
    const baseY = 54;
    const svg = $("#waveform");
    let out = "";
    const dur = Math.max(run.durationMs, 1);
    const x = (ms) => (ms / dur) * W;

    // baseline
    out += '<rect x="0" y="' + (baseY - 1) + '" width="' + W + '" height="2" fill="#d9dbdf"/>';
    for (let t = 0; t <= dur; t += 10000) {
      const xp = x(t);
      out += '<text x="' + (xp + 3) + '" y="66" font-size="9" fill="#9aa0a8">' + fmtT(t) + "</text>";
      out += '<line x1="' + xp + '" y1="' + (baseY + 4) + '" x2="' + xp + '" y2="' + (baseY + 7) + '" stroke="#c7cbd1"/>';
    }

    for (const turn of suite.turns) {
      const w = Math.max(6, x(turn.tEnd) - x(turn.tStart));
      const h = hash(turn.id) % 15 + 7;
      const fill = turn.speaker === "agent" ? "rgba(47,79,58,0.5)" : "rgba(23,24,26,0.42)";
      out += '<rect class="w-turn" data-turn="' + turn.id + '" x="' + x(turn.tStart) + '" y="' + (baseY - h) + '" width="' + w + '" height="' + h + '" rx="1.5" fill="' + fill + '">' +
        '<title>' + turn.id + " " + turn.speaker + " " + fmtT(turn.tStart) + "</title></rect>";
    }

    for (const m of run.markers) {
      const xp = x(m.time);
      const c = MARKER_COLOR[m.kind] || "#b3261e";
      const dash = m.kind === "recovery-miss" ? ' stroke-dasharray="4 3"' : "";
      out += '<g class="w-marker" data-turn="' + m.turnId + '" style="cursor:pointer">';
      out += '<line x1="' + xp + '" y1="30" x2="' + xp + '" y2="' + baseY + '" stroke="' + c + '" stroke-width="2"' + dash + "/>";
      out += '<polygon points="' + (xp - 4) + ',44 ' + (xp + 4) + ',44 ' + xp + ",50" + '" fill="' + c + '"/>';
      out += '<text x="' + (xp + 5) + '" y="26" font-size="9.5" fill="' + c + '">' + m.label + " &middot; " + fmtT(m.time) + "</text>";
      out += "</g>";
    }

    svg.setAttribute("viewBox", "0 0 " + W + " " + HGT);
    svg.innerHTML = out;
  }

  function hash(s) {
    let h = 7;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
    return h;
  }

  function renderTranscript(run, suite) {
    const host = $("#transcript");
    host.innerHTML = "";
    const failTurns = new Set();
    for (const g of run.gates) {
      if (g.pass) continue;
      for (const e of g.evidence) if (e.turnId) failTurns.add(e.turnId);
    }
    for (const turn of suite.turns) {
      const row = document.createElement("div");
      row.className = "transcript-row" + (failTurns.has(turn.id) ? " fail-row" : "");
      row.dataset.turn = turn.id;
      const badges = [];
      let heard = "";
      let notes = [];
      for (const e of turn.entities || []) {
        const ok = normEq(e.intended, e.hypothesis);
        badges.push('<span class="badge ' + (ok ? "ok" : "bad") + '">' + e.field + " " + (ok ? "ok" : "MISS: " + e.intended + " &rarr; " + e.hypothesis) + "</span>");
      }
      if (turn.speaker === "caller" && turn.asr && turn.asr !== turn.intended) {
        heard = '<span class="heard">Heard: ' + turn.asr + "</span>";
      }
      if (turn.bargeIn) {
        badges.push('<span class="badge bad">barge-in ' + fmtT(turn.tStart) + "</span>");
      }
      for (const m of run.markers) {
        if (m.turnId === turn.id) {
          const mk = m.kind === "recovery" ? "green" : "";
          notes.push('<span class="note ' + mk + '">' + m.label + " &middot; " + fmtT(m.time) + "</span>");
        }
      }
      row.innerHTML =
        '<span class="t-time">' + fmtT(turn.tStart) + "</span>" +
        '<span class="t-speaker ' + turn.speaker + '">' + turn.speaker + "</span>" +
        '<span class="t-text">' + turn.text + heard + notes.join("") + "</span>" +
        '<span class="t-badges">' + badges.join("") + "</span>";
      host.appendChild(row);
    }
  }

  function normEq(a, b) {
    return String(a || "").toLowerCase().replace(/[^a-z0-9]/g, "") === String(b || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  // ---------- actions ----------

  function runSelected() {
    const suite = selectedSuite();
    if (!suite) return;
    const run = H.runSuite(suite, GATES);
    state.lastRun = run;
    setCardStatus(suite.id, run);
    renderResult(run, suite);
    for (const c of $$(".suite-card")) {
      if (c.dataset.suite !== suite.id) {
        c.classList.remove("selected");
        const chip = c.querySelector("[data-role=status]");
        if (!chip.classList.contains("never")) {
          chip.className = "chip never";
          chip.textContent = "Not run";
        }
      }
    }
  }

  function jumpToTurn(turnId) {
    if (!turnId) return;
    const row = $$(".transcript-row").find((r) => r.dataset.turn === turnId);
    if (!row) return;
    row.classList.remove("flash");
    void row.offsetWidth;
    row.classList.add("flash");
    row.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function copyReason() {
    if (!state.lastRun) return;
    navigator.clipboard.writeText(state.lastRun.reason);
    toast("Reason copied: " + state.lastRun.reason);
  }

  function toast(msg) {
    const t = $("#toast");
    t.hidden = false;
    t.textContent = msg;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.hidden = true), 4200);
  }

  // ---------- events ----------

  document.addEventListener("click", (e) => {
    const card = e.target.closest(".suite-card");
    if (card) {
      state.selectedId = card.dataset.suite;
      for (const c of $$(".suite-card")) c.classList.remove("selected");
      card.classList.add("selected");
      runSelected();
      return;
    }
    const ev = e.target.closest("[data-turn]");
    if (ev && ev.classList.contains("ev-time") || ev && ev.classList.contains("w-marker") || ev && ev.classList.contains("w-turn")) {
      jumpToTurn(ev.dataset.turn);
      return;
    }
    if (e.target.id === "ghost-btn") {
      state.recovery = true;
      $("#recovery-check").checked = true;
      runSelected();
      toast("Ghostwriter drafted the recovery patch: yield on barge-in, readback after mishear. The ASR miss is a model-level fix and stays red on purpose.");
      return;
    }
  });

  renderCards();
  $("#recovery-check").addEventListener("change", (e) => {
    state.recovery = e.target.checked;
    if (state.selectedId === "noisy-interrupted-misheard-email") runSelected();
  });
  window.HARNESS_UI = { copyReason: copyReason, jumpToTurn: jumpToTurn };
})();
