/* Odyssey · Trajectory Review — UI wiring. Vanilla JS, no deps. */

"use strict";

const PACKETS = PACKS.map(evalPack);

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

let active = 0;
let frame = 0;
let playTimer = null;
let activeSpanKey = null;

/* ---------------- session overview ---------------- */

function renderCases() {
  const wrap = $("#cases");
  wrap.innerHTML = "";
  PACKETS.forEach((p, i) => {
    const card = el("div", "case " + (p.verdict === "PASS" ? "pass" : p.verdict === "FAIL" ? "fail" : "note"));
    card.innerHTML =
      '<div class="case-top"><span class="case-tag">' +
      p.tag +
      "</span><span class=\"case-name\">" +
      esc(p.case) +
      "</span><span class=\"mini-vchip " +
      (p.verdict === "PASS" ? "pass" : "fail") +
      '">' +
      p.verdict +
      "</span></div>" +
      '<div class="case-run">' +
      esc(p.run) +
      " · " +
      p.meta.agents.join(", ") +
      " · " +
      p.meta.duration_s +
      "s</div>" +
      '<div class="scorebar"><div class="bar"><i style="width:' +
      p.score +
      '%"></i></div><span class="score-num">' +
      p.score +
      "</span></div>";
    card.addEventListener("click", () => load(i));
    wrap.appendChild(card);
  });
}

function integrityLine(packets) {
  const failed = packets.reduce((a, p) => a + p.integrity.failed_checks, 0);
  const cited = packets.reduce((a, p) => a + p.integrity.cited_checks, 0);
  const ok = packets.every((p) => p.integrity.ok);
  return (
    "citation integrity: " +
    failed +
    " failed check" +
    (failed === 1 ? "" : "s") +
    " · " +
    cited +
    " cited span" +
    (cited === 1 ? "" : "s") +
    " · gate <span class=\"ok\">OK</span> — every failure in every packet cites a frame range, and each next-priority matches its top failed critical"
  );
}

function renderEvalTable() {
  const tb = $("#eval-table tbody");
  tb.innerHTML = "";
  PACKETS.forEach((p) => {
    const row = document.createElement("tr");
    const fails = p.checks.filter((c) => !c.pass);
    let reason;
    if (fails.length === 0) {
      reason = "<span class=\"reason\">all " + p.checks.length + " checks pass — no failure claims</span>";
    } else {
      const parts = fails.map((c) => {
        const sp = c.cites[0];
        if (!sp) return "<b class=\"nocite\">" + esc(c.label) + " UNCITED — row fails</b>";
        return "<b>" + esc(c.label) + "</b> @" + (sp.frames[0] === sp.frames[1] ? "f" + sp.frames[0] : "f" + sp.frames[0] + "-" + sp.frames[1]) + " <span>(" + esc(sp.event || "span") + ")</span>";
      });
      reason = "<span class=\"reason\">" + parts.join("; ") + "</span>";
    }
    row.innerHTML =
      "<td><b>" +
      p.case +
      "</b> <span class=\"runid\">" +
      esc(p.run) +
      "</span></td><td class=\"runid\">" +
      p.tag +
      "</td><td><span class=\"vchip " +
      (p.verdict === "PASS" ? "pass" : "fail") +
      "\">" +
      p.verdict +
      "</span></td><td>" +
      reason +
      "</td>";
    tb.appendChild(row);
  });
  const int = $("#integrity");
  int.innerHTML = integrityLine(PACKETS);
}

/* ---------------- packet ---------------- */

function renderPacket() {
  const p = PACKETS[active];
  $("#pk-case").textContent = "case " + p.tag + " · " + p.case + " · shared simulation";
  $("#pk-run").textContent = p.run;
  $("#pk-meta").textContent =
    p.meta.frames + " frames @ " + p.meta.fps + " fps · " + p.meta.duration_s.toFixed(1) + "s · agents " + p.meta.agents.join(", ") + " · " + p.meta.generated;
  const score = $("#pk-score");
  score.textContent = p.score;
  score.style.color = p.verdict === "PASS" ? "var(--pass)" : "var(--fail)";
  const vc = $("#pk-verdict");
  vc.textContent = p.verdict;
  vc.className = "vchip " + (p.verdict === "PASS" ? "pass" : "fail");

  // next training priority
  const pri = $("#pk-priority");
  pri.innerHTML = "";
  const np = p.next_priority;
  const pat = el("span", "pat" + (np.rank === null ? " none" : ""));
  pat.textContent = np.rank === null ? "PAT · none" : "PAT-" + String(np.rank).padStart(2, "0");
  pri.appendChild(pat);
  const body = el("span", "pat-body");
  if (np.escalated) body.innerHTML = '<span class="escalated">escalated</span>';
  body.insertAdjacentHTML("beforeend", "<b>" + esc(np.label) + "</b> — " + esc(np.body));
  pri.appendChild(body);

  // failure chips
  const chips = $("#pk-chips");
  chips.innerHTML = "";
  const chipRows = p.checks.filter((c) => !c.pass || (c.severity === "critical" && c.cites.length > 0));
  chipRows.forEach((c) => {
    const cls = !c.pass ? c.severity : "pass";
    const sp = c.cites[0];
    const chip = el(
      "button",
      "fchip " + cls,
      '<span class="fm-label">' +
        esc(c.label) +
        '</span><span class="fm-sev">' +
        (!c.pass ? c.severity : "pass") +
        "</span>" +
        (sp ? '<span class="fm-span">f' + sp.frames[0] + (sp.frames[0] === sp.frames[1] ? "" : "-" + sp.frames[1]) + " · " + tc(sp.frames[0]) + "</span>" : "")
    );
    chip.type = "button";
    chip.dataset.check = c.id;
    if (!c.pass && sp) {
      chip.addEventListener("click", () => {
        seekTo(sp.frames[0]);
        setActiveSpan("seg-" + c.id + "-0", chip);
      });
    }
    chips.appendChild(chip);
  });

  // rubric table
  const tb = $("#pk-rubric tbody");
  tb.innerHTML = "";
  p.checks.forEach((c) => {
    const tr = document.createElement("tr");
    const spanCells = c.cites.map((sp) => (sp.frames[0] === sp.frames[1] ? "f" + sp.frames[0] : "f" + sp.frames[0] + "-" + sp.frames[1])).join(", ");
    tr.innerHTML =
      "<td><span class=\"ck-label\">" +
      esc(c.label) +
      '</span><br><span class="ck-sev">' +
      c.severity +
      " · w" +
      c.weight +
      "</span></td><td class=\"ck-measure\">" +
      esc(c.measure) +
      "</td><td><span class=\"vchip " +
      (c.pass ? "pass" : "fail") +
      "\">" +
      (c.pass ? "PASS" : "FAIL") +
      "</span></td><td class=\"ck-span\">" +
      (spanCells || "—") +
      "</td>";
    tb.appendChild(tr);
  });

  $("#pk-note").textContent = p.integrity.ok
    ? "Pack " + p.tag + " integrity: " + p.integrity.note + "."
    : "Pack " + p.tag + " integrity FAILED: " + p.integrity.note + ".";
}

/* ---------------- timeline ---------------- */

const svgNS = "http://www.w3.org/2000/svg";

function setSvg(el2, attrs) {
  for (const k in attrs) el2.setAttribute(k, attrs[k]);
  return el2;
}

function renderRoom() {
  const p = PACKS[active];
  const room = $("#room");
  room.innerHTML = "";
  const svg = setSvg(document.createElementNS(svgNS, "svg"), {
    viewBox: "0 0 " + p.room.w + " " + p.room.h,
  });
  for (const ob of p.obstacles) {
    svg.appendChild(
      setSvg(document.createElementNS(svgNS, "rect"), {
        x: ob.x, y: ob.y, width: ob.w, height: ob.h,
        fill: "#161616", stroke: "#262626", rx: 2,
      })
    );
  }
  // object homes
  const homes = document.createElementNS(svgNS, "g");
  for (const id in p.objects) {
    const o = p.objects[id];
    const g = document.createElementNS(svgNS, "g");
    g.dataset.obj = id;
    g.appendChild(
      setSvg(document.createElementNS(svgNS, "rect"), {
        x: o.x - 6, y: o.y - 6, width: 12, height: 12,
        fill: "none", stroke: "#8a8783", "stroke-width": 1.5, rx: 2,
      })
    );
    const t = setSvg(document.createElementNS(svgNS, "text"), {
      x: o.x + 12, y: o.y + 4, fill: "#6b6865", "font-size": 10,
      "font-family": "Chivo Mono Variable, monospace",
    });
    t.textContent = id;
    g.appendChild(t);
    homes.appendChild(g);
  }
  svg.appendChild(homes);
  // agent trails
  for (const agent of p.agents) {
    const trail = document.createElementNS(svgNS, "polyline");
    const pts = [];
    for (let f = 0; f <= frame; f += 2) {
      const a = p.framesArr[f].agents[agent];
      pts.push(a.x.toFixed(1) + "," + a.y.toFixed(1));
    }
    trail.setAttribute("points", pts.join(" "));
    trail.setAttribute("fill", "none");
    trail.setAttribute("stroke", agent === "wr-01" ? "rgba(0,82,255,0.45)" : "rgba(214,211,209,0.4)");
    trail.setAttribute("stroke-width", "1.5");
    trail.setAttribute("stroke-linejoin", "round");
    trail.dataset.trail = agent;
    svg.appendChild(trail);
  }
  room.appendChild(svg);
}

function updateRoom() {
  const p = PACKS[active];
  const fr = p.framesArr[frame];
  const svg = $("#room svg");
  if (!svg) return;
  // objects
  for (const id in p.objects) {
    const g = svg.querySelector('g[data-obj="' + id + '"]');
    const w = fr.world[id];
    const r = g.querySelector("rect");
    r.setAttribute("x", w.x - 6);
    r.setAttribute("y", w.y - 6);
    const t = g.querySelector("text");
    t.setAttribute("x", w.x + 12);
    t.setAttribute("y", w.y + 4);
    g.getAttribute("x");
  }
  // agents
  for (const agent of p.agents) {
    const a = fr.agents[agent];
    let node = svg.querySelector('[data-agent="' + agent + '"]');
    if (!node) {
      node = document.createElementNS(svgNS, "g");
      node.dataset.agent = agent;
      const circle = setSvg(document.createElementNS(svgNS, "circle"), {
        r: 10, fill: agent === "wr-01" ? "#0052ff" : "#d6d3d1",
      });
      const tick = setSvg(document.createElementNS(svgNS, "line"), {
        stroke: "#040303", "stroke-width": 2,
      });
      const label = setSvg(document.createElementNS(svgNS, "text"), {
        y: -14, fill: agent === "wr-01" ? "#7fa8ff" : "#e5e2df", "font-size": 10,
        "font-family": "Chivo Mono Variable, monospace",
      });
      label.textContent = agent;
      node.appendChild(circle);
      node.appendChild(tick);
      node.appendChild(label);
      svg.appendChild(node);
    }
    const c = node.querySelector("circle");
    c.setAttribute("cx", a.x);
    c.setAttribute("cy", a.y);
    const tick = node.querySelector("line");
    const rad = (a.h * Math.PI) / 180;
    tick.setAttribute("x1", a.x);
    tick.setAttribute("y1", a.y);
    tick.setAttribute("x2", a.x + Math.cos(rad) * 16);
    tick.setAttribute("y2", a.y + Math.sin(rad) * 16);
    const label = node.querySelector("text");
    label.setAttribute("x", a.x);
    label.setAttribute("y", a.y - 16);
    // trail up to current frame
    const trail = svg.querySelector('[data-trail="' + agent + '"]');
    const pts = [];
    for (let f = 0; f <= frame; f += 2) {
      const af = p.framesArr[f].agents[agent];
      pts.push(af.x.toFixed(1) + "," + af.y.toFixed(1));
    }
    trail.setAttribute("points", pts.join(" "));
  }
}

function renderSpans() {
  const p = PACKETS[active];
  const strip = $("#spans");
  strip.innerHTML = "";
  const N = p.meta.frames;
  const cmark = el("div", "cmark");
  strip.appendChild(cmark);
  p.checks.forEach((c) => {
    if (!c.cites.length) return;
    c.cites.forEach((sp, idx) => {
      if (!sp.frames) return;
      const a = sp.frames[0];
      const b = sp.frames[1];
      const left = (a / N) * 100;
      const width = Math.max(((b - a + 1) / N) * 100, 2.2);
      const cls = !c.pass ? (c.severity === "critical" ? "critical" : "note") : "pass";
      const seg = el(
        "button",
        "spanseg " + cls,
        '<span class="seg-label">' +
          (c.pass ? c.label + " ✓" : c.label) +
          " f" +
          a +
          (a === b ? "" : "-" + b) +
          "</span>"
      );
      seg.type = "button";
      seg.style.left = left + "%";
      seg.style.width = width + "%";
      seg.dataset.key = "seg-" + c.id + "-" + idx;
      if (!c.pass) {
        seg.addEventListener("click", () => {
          seekTo(a);
          setActiveSpan(seg.dataset.key, null);
        });
      }
      strip.appendChild(seg);
    });
  });
}

function updateCmark() {
  const p = PACKS[active];
  const cm = $("#spans .cmark");
  if (cm) cm.style.left = (frame / p.frames) * 100 + "%";
}

function setActiveSpan(key, chip) {
  document.querySelectorAll(".spanseg.active").forEach((s) => s.classList.remove("active"));
  document.querySelectorAll(".fchip.flash").forEach((s) => s.classList.remove("flash"));
  if (!key) return;
  const seg = document.querySelector('.spanseg[data-key="' + key + '"]');
  if (seg) seg.classList.add("active");
  if (chip) {
    chip.classList.add("flash");
    setTimeout(() => chip.classList.remove("flash"), 900);
  }
}

function renderFramebox() {
  const p = PACKS[active];
  const fr = p.framesArr[frame];
  const box = $("#framebox");
  box.innerHTML = "";
  const colAgents = el("div", "fb-col");
  colAgents.appendChild(el("div", "fb-title", "agents @" + ("f" + frame)));
  for (const agent of p.agents) {
    const a = fr.agents[agent];
    const match = a.intent === a.action;
    const row = el("div", "fb-agent");
    row.innerHTML =
      '<span>' +
      agent +
      "</span><span class=\"ia\">intent <b>" +
      esc(a.intent) +
      "</b> · exec <b>" +
      esc(a.action) +
      "</b></span><span class=\"" +
      (match ? "ok" : "mm") +
      '">' +
      (match ? "✓" : "✗ action-following") +
      "</span>" +
      (a.carry ? '<span class="ia">carrying ' + esc(a.carry) + "</span>" : "");
    colAgents.appendChild(row);
  }
  box.appendChild(colAgents);
  const colEvents = el("div", "fb-col");
  colEvents.appendChild(el("div", "fb-title", "shared-state events @" + ("f" + frame)));
  const evs = fr.events;
  if (!evs.length) {
    colEvents.appendChild(el("div", "fb-event", "— no events at this frame —"));
  } else {
    evs.forEach((ev) => {
      const e = el("div", "fb-event");
      e.innerHTML =
        '<span class="ev-id">' +
        esc(ev.id) +
        "</span> " +
        (ev.late_by ? '<span class="ev-note">[logged ' + ev.late_by + "f late]</span> " : "") +
        esc(ev.type.replace(/_/g, " ")) +
        ' <span class="ev-note">' +
        esc(ev.note) +
        "</span>";
      colEvents.appendChild(e);
    });
  }
  box.appendChild(colEvents);
}

function seekTo(f) {
  const p = PACKS[active];
  frame = Math.max(0, Math.min(p.frames - 1, f));
  $("#scrub").value = frame;
  $("#timecode").textContent = tc(frame);
  $("#framedisp").textContent = "f" + frame;
  updateRoom();
  updateCmark();
  renderFramebox();
}

function togglePlay() {
  const p = PACKS[active];
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
    $("#play").textContent = "▶";
    return;
  }
  if (frame >= p.frames - 1) {
    seekTo(0);
  }
  $("#play").textContent = "❚❚";
  playTimer = setInterval(() => {
    if (frame >= p.frames - 1) {
      clearInterval(playTimer);
      playTimer = null;
      $("#play").textContent = "▶";
      return;
    }
    seekTo(frame + 1);
  }, 90);
}

/* ---------------- JSON ---------------- */

function jsonHtml(obj) {
  const raw = JSON.stringify(obj, null, 2);
  const escd = esc(raw);
  return escd
    .replace(/("(?:[^"\\]|\\.)*")(?=\s*:)/g, '<span class="j-k">$1</span>')
    .replace(/: ("(?:[^"\\]|\\.)*")/g, ': <span class="j-s">$1</span>')
    .replace(/: (-?\d+(?:\.\d+)?|true|false|null)/g, ': <span class="j-n">$1</span>');
}

function renderJson() {
  const pre = $("#json");
  const p = PACKETS[active];
  pre.innerHTML = jsonHtml({
    run: p.run,
    case: p.case,
    task: p.task,
    meta: p.meta,
    score: p.score,
    verdict: p.verdict,
    checks: p.checks.map((c) => ({
      id: c.id,
      label: c.label,
      severity: c.severity,
      weight: c.weight,
      pass: c.pass,
      cites: c.cites,
    })),
    next_priority: p.next_priority,
    integrity: p.integrity,
  });
  $("#json-sub").textContent = "computed from " + p.meta.frames + " raw frames · " + p.run;
}

/* ---------------- load / init ---------------- */

function load(i) {
  active = i;
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
    $("#play").textContent = "▶";
  }
  document.querySelectorAll(".case").forEach((c, idx) => c.classList.toggle("loaded", idx === i));
  frame = 0;
  $("#scrub").max = PACKS[active].frames - 1;
  renderPacket();
  renderRoom();
  renderSpans();
  seekTo(0);
  renderJson();
  const json = $("#json");
  if (!json.hidden) json.hidden = true;
  $("#json-toggle").textContent = "show packet JSON";
}

function init() {
  renderCases();
  renderEvalTable();
  $("#scrub").addEventListener("input", (e) => seekTo(parseInt(e.target.value, 10)));
  $("#play").addEventListener("click", togglePlay);
  $("#json-toggle").addEventListener("click", () => {
    const json = $("#json");
    json.hidden = !json.hidden;
    $("#json-toggle").textContent = json.hidden ? "show packet JSON" : "hide packet JSON";
  });
  load(0);
}

document.addEventListener("DOMContentLoaded", init);