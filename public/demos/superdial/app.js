// app.js
// Renders the packet for the selected transcript case: call player with
// highlighted citation spans, the Output Report card, escalation packet,
// and the pass/fail rubric table.

const FIELD_META = {
  required:    { label: "Auth requirement",      css: "f-req",    color: "#6B5BD6" },
  status:      { label: "Auth status",           css: "f-status", color: "#4A3AA6" },
  authNumber:  { label: "Auth number",           css: "f-auth",   color: "#4d65ff" },
  missingDocs: { label: "Missing documentation", css: "f-missing", color: "#B9761F" },
  next:        { label: "Next steps",            css: "f-next",   color: "#1E7B4A" },
};

const DUR = { A: "0:42", B: "0:51", C: "0:47" };
const DOT = { A: "#7CE8A9", B: "#F0C569", C: "#C9BCE8" };

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const packets = {};
for (const id of Object.keys(CASES)) packets[id] = buildPacket(CASES[id]);
const evalRows = Object.keys(CASES).map((id) => evaluateCase(CASES[id]));
window.__packets = packets;
window.__evalRows = evalRows;

let current = "A";
const jumpKey = (c) => `${c.corpus}:${c.seg}:${c.bodyStart}`;

// ---------------------------------------------------------------------------
// Transcript + portal rendering with citation highlights
// ---------------------------------------------------------------------------

function rangesForSeg(packet, segIdx) {
  const ranges = [];
  for (const f of packet.fields) {
    for (const c of f.citations) {
      if (c.corpus !== "phone" || c.seg !== segIdx) continue;
      ranges.push({ s: c.bodyStart, e: c.bodyEnd, cls: FIELD_META[f.key].css, key: jumpKey(c), label: f.label });
    }
  }
  ranges.sort((a, b) => a.s - b.s);
  const out = [];
  let lastEnd = -1;
  for (const r of ranges) {
    if (r.s < lastEnd) continue; // overlapping spans: first field wins
    out.push(r);
    lastEnd = r.e;
  }
  return out;
}

function highlight(body, ranges) {
  let html = "";
  let pos = 0;
  for (const r of ranges) {
    html += esc(body.slice(pos, r.s));
    html += `<mark class="${r.cls}" data-key="${esc(r.key)}" title="${esc(r.label)} - cited span">${esc(body.slice(r.s, r.e))}</mark>`;
    pos = r.e;
  }
  html += esc(body.slice(pos));
  return html;
}

function renderTranscript(packet) {
  const phone = packet.corpora[0];
  const box = document.getElementById("transcript");
  box.innerHTML = "";
  phone.segments.forEach((seg, i) => {
    const row = document.createElement("div");
    row.className = "trow " + (seg.speaker === "Agent" ? "agent" : "payer");
    row.innerHTML = `<div class="who">${seg.speaker}</div><div class="txt">${highlight(seg.body, rangesForSeg(packet, i))}</div>`;
    box.appendChild(row);
  });
}

function renderPortal(packet) {
  const portal = packet.corpora.find((c) => c.id === "portal");
  const box = document.getElementById("portal");
  box.innerHTML = "";
  if (!portal) return;
  const ranges = [];
  for (const f of packet.fields) {
    for (const c of f.citations) {
      if (c.corpus !== "portal") continue;
      ranges.push({ s: c.bodyStart, e: c.bodyEnd, cls: FIELD_META[f.key].css, key: jumpKey(c), label: f.label });
    }
  }
  ranges.sort((a, b) => a.s - b.s);
  let lastEnd = -1;
  const kept = [];
  for (const r of ranges) {
    if (r.s < lastEnd) continue;
    kept.push(r);
    lastEnd = r.e;
  }
  box.innerHTML = `<div class="ph">Payer Portal snippet · ${portal.source}</div><div class="pl">${highlight(portal.text, kept)}</div>`;
}

function renderLegend(packet) {
  const box = document.getElementById("legend");
  box.innerHTML = packet.fields
    .filter((f) => f.citations.length > 0)
    .map((f) => `<span class="lg"><span class="sw" style="background:${FIELD_META[f.key].color}"></span>${FIELD_META[f.key].label}</span>`)
    .join("");
}

function renderWave() {
  const box = document.getElementById("wave");
  let html = `<span class="play">&#9654;</span>`;
  for (let i = 0; i < 52; i++) {
    const v = Math.sin(i * 0.9) + Math.sin(i * 0.37) + Math.sin(i * 0.13);
    const h = 8 + Math.max(0, Math.abs(v)) * 16;
    const cls = Math.abs(v) > 1.1 ? "dark" : (i >= 24 && i <= 30 ? "live" : "");
    html += `<i class="${cls}" style="height:${h.toFixed(1)}px"></i>`;
  }
  box.innerHTML = html;
}

function renderPlayer(packet) {
  document.getElementById("dur").textContent = DUR[packet.caseId] || "";
  const clip = `<svg width="15" height="19" viewBox="0 0 15 19" aria-hidden="true"><rect x="2.5" y="1.5" width="10" height="16" rx="5" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="5" y="5.5" width="5" height="8" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;
  document.getElementById("paperclip").innerHTML = clip + "Recording &amp; Transcript Attached";
  document.getElementById("paperclip2").innerHTML = clip + "Recording &amp; Transcript Attached";
  renderTranscript(packet);
  renderPortal(packet);
  renderLegend(packet);
}

// ---------------------------------------------------------------------------
// Output Report card
// ---------------------------------------------------------------------------

function statusPill(status) {
  const map = {
    approved: ["green", "Approved"],
    pending: ["amber", "Pending"],
    denied: ["red", "Denied"],
    conflict: ["purple", "Conflict"],
  };
  return map[status.value] || ["mild", "Not stated"];
}

function evidenceChips(citations) {
  if (!citations.length) return "";
  return (
    `<div class="ev"><div class="ev-label">Source evidence</div>` +
    citations
      .map(
        (c) =>
          `<button class="chip" data-jump="${esc(jumpKey(c))}"><span class="src">${esc(c.source)}</span><span class="q">"${esc(c.text)}"</span></button>`
      )
      .join("") +
    `</div>`
  );
}

function fieldRow(f) {
  const meta = FIELD_META[f.key];
  const low = f.conf < 0.7;
  const value =
    f.key === "status" && f.value === "conflict"
      ? `<span class="v-null">Denied vs Pending</span>`
      : esc(f.value);
  const extra = [];

  if (f.key === "status" && f.conflict) {
    extra.push(
      `<div class="conflict-note"><div class="cn-title">Sources disagree on status</div>` +
        f.specs
          .map((s) => `${esc(s.citation.source)} says <b>${esc(s.value)}</b> · <span class="q">"${esc(s.citation.text)}"</span>`)
          .join("<br>") +
        `</div>`
    );
  }
  if (f.key === "missingDocs" && f.docs.length) {
    extra.push(
      `<div class="docs">` +
        f.docs
          .map((d) => {
            const chips = d.citations
              .map((c) => `<button class="chip" data-jump="${esc(jumpKey(c))}"><span class="src">${esc(c.source)}</span><span class="q">"${esc(c.text)}"</span></button>`)
              .join("");
            return `<div class="fl-note" style="color:var(--purple);font-weight:700">${esc(d.doc)}</div><div style="display:flex;flex-direction:column;gap:5px">${chips}</div>`;
          })
          .join("") +
        `</div>`
    );
  }
  if (f.note) extra.push(`<div class="fl-note">${esc(f.note)}</div>`);
  extra.push(evidenceChips(f.citations));

  return (
    `<div class="fl" id="row-${f.key}">` +
    `<div class="fl-label"><span class="tag">${meta.label}</span>` +
    `<span class="cbar"><i style="width:${Math.round(f.conf * 100)}%"></i></span></div>` +
    `<div class="fl-value"><div class="fl-main"><span>${value}</span>` +
    `<span class="conf ${low ? "low" : ""}">${pct(f.conf)}%${low ? " · low" : ""}</span></div>` +
    extra.join("") +
    `</div></div>`
  );
}

function renderReport(packet) {
  const { status } = packet;
  const [cls, text] = statusPill(status);
  const sl = document.getElementById("statusline");
  sl.innerHTML =
    `<span class="pill ${cls}">${text}</span>` +
    (status.conflict ? `<span class="confpop">${esc(status.specs.map((s) => s.value).join(" vs "))}</span>` : "") +
    `<span class="conf">Overall confidence <b>${pct(packet.overall)}%</b></span>`;

  document.getElementById("fields").innerHTML = packet.fields
    .filter((f) => f.key !== "status")
    .map((f) => fieldRow(f))
    .join("");
  // status row first, matching SuperDial report order
  const fieldsBox = document.getElementById("fields");
  fieldsBox.insertAdjacentHTML("afterbegin", fieldRow(status));

  const escBox = document.getElementById("escalation");
  if (packet.escalate) {
    const flag = packet.status.conflict;
    const cap = packet.packet.captured;
    escBox.innerHTML =
      `<div class="esc ${flag ? "flag" : ""}">` +
      `<div class="esc-head"><span class="pill ${flag ? "red" : "amber"}">Escalation</span><span class="esc-title">Review before closing</span></div>` +
      `<div class="esc-reasons">${packet.reasons.map((r) => esc(r)).join(" · ")}</div>` +
      `<div class="pk">` +
      `<div class="k">What was tried</div><div class="v">${esc(packet.packet.tried.value)}` +
      (packet.packet.tried.citations.length
        ? `<div class="chips">${packet.packet.tried.citations
            .map((c) => `<button class="chip" data-jump="${esc(jumpKey(c))}"><span class="src">${esc(c.source)}</span><span class="q">"${esc(c.text)}"</span></button>`)
            .join("")}</div>`
        : "") +
      `</div>` +
      `<div class="k">What was captured</div><div class="v"><div class="chips">` +
      cap
        .map((c) => `<span class="chip static">${esc(c.label)}: <b>${esc(c.value)}</b>${c.conf < 0.7 ? " · low" : ""}</span>`)
        .join("") +
      `</div></div>` +
      `<div class="k">What is missing</div><div class="v">${esc(packet.packet.missing)}</div>` +
      `<div class="k">Recommended next step</div><div class="v">${esc(packet.packet.nextStep)}` +
      (packet.next.citations.length
        ? `<div class="chips">${packet.next.citations
            .map((c) => `<button class="chip" data-jump="${esc(jumpKey(c))}"><span class="src">${esc(c.source)}</span><span class="q">"${esc(c.text)}"</span></button>`)
            .join("")}</div>`
        : "") +
      `</div>` +
      `</div></div>`;
  } else {
    escBox.innerHTML = `<div class="ok"><span>&#10003;</span> No escalation. All fields high confidence and consistently sourced.</div>`;
  }
}

// ---------------------------------------------------------------------------
// Rubric table
// ---------------------------------------------------------------------------

function renderEval() {
  const tbody = document.getElementById("evalbody");
  tbody.innerHTML = evalRows
    .map((r) => {
      const checks = r.checks
        .map((c) => `<span class="ck ${c.pass ? "ok" : "bad"}">${c.pass ? "&#10003;" : "&#10007;"} ${esc(c.label)}</span>`)
        .join("");
      return (
        `<tr>` +
        `<td class="mono">${r.caseId}</td>` +
        `<td><div class="checks">${checks}</div></td>` +
        `<td><span class="pill ${r.pass ? "green" : "red"}">${r.pass ? "PASS" : "FAIL"}</span></td>` +
        `<td class="reason">${esc(r.reason)}</td>` +
        `</tr>`
      );
    })
    .join("");
  const passes = evalRows.filter((r) => r.pass).length;
  const totalChecks = evalRows.reduce((a, r) => a + r.checks.length, 0);
  document.getElementById("evalsum").innerHTML =
    `<b>${passes}/${evalRows.length} cases pass</b>` +
    `<span>${totalChecks} rubric checks ran against packets extracted from the raw transcripts above</span>` +
    `<span>Case fails if any field is missing, uncited, or the escalation flag is wrong</span>`;
}

// ---------------------------------------------------------------------------
// Tabs + interactions
// ---------------------------------------------------------------------------

function renderTabs() {
  document.getElementById("tabs").innerHTML = Object.keys(CASES)
    .map((id) => {
      const cse = CASES[id];
      const short = cse.title.replace(/^Transcript [A-Z] - /, "");
      return `<button class="tab ${id === current ? "active" : ""}" data-case="${id}"><span class="dot" style="background:${DOT[id]}"></span>Transcript ${id} · ${esc(short)}</button>`;
    })
    .join("");
  document.querySelectorAll(".tab").forEach((b) =>
    b.addEventListener("click", () => {
      current = b.dataset.case;
      renderTabs();
      renderPlayer(packets[current]);
      renderReport(packets[current]);
    })
  );
}

function bindJumps(root) {
  root.addEventListener("click", (e) => {
    const markEl = e.target.closest("mark[data-key]");
    if (markEl) {
      const clsToKey = { "f-req": "required", "f-status": "status", "f-auth": "authNumber", "f-missing": "missingDocs", "f-next": "next" };
      const key = clsToKey[markEl.classList.item(0)];
      const row = key && document.getElementById("row-" + key);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
        row.classList.add("flash");
        setTimeout(() => row.classList.remove("flash"), 1300);
      }
      return;
    }
    const chip = e.target.closest("[data-jump]");
    if (!chip) return;
    const key = chip.dataset.jump;
    const mark = document.querySelector(`mark[data-key="${key}"]`);
    if (mark) {
      mark.scrollIntoView({ behavior: "smooth", block: "center" });
      mark.classList.add("flash");
      setTimeout(() => mark.classList.remove("flash"), 1200);
      return;
    }
    // citation without its own mark: flash the overlapping mark in its segment
    const seg = key.split(":")[1];
    const row = document.querySelectorAll(".trow")[Number(seg)];
    if (row) {
      const q = chip.querySelector(".q");
      const quote = q ? q.textContent.replace(/^"|"$/g, "") : "";
      const marks = row.querySelectorAll("mark");
      const overlap = [...marks].find((m) => quote && m.textContent.includes(quote));
      const target = overlap || marks[0];
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("flash");
        setTimeout(() => target.classList.remove("flash"), 1200);
        return;
      }
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.style.outline = "2px solid var(--purple)";
      setTimeout(() => (row.style.outline = ""), 1200);
    }
  });
}

function setupModal() {
  const modal = document.getElementById("modal");
  document.getElementById("btnJson").addEventListener("click", () => {
    document.getElementById("jsonOut").textContent = packetJSON(packets[current]);
    modal.classList.add("open");
  });
  document.getElementById("modalClose").addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });
}

function boot() {
  renderWave();
  renderTabs();
  renderPlayer(packets[current]);
  renderReport(packets[current]);
  renderEval();
  bindJumps(document);
  setupModal();
  for (const id of Object.keys(packets)) {
    console.log("PACKET " + id + "\n" + packetJSON(packets[id]));
  }
}

boot();
