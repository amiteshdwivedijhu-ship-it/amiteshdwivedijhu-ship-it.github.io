/* Care Team Admin Desk — synthetic prototype.
   Client-side only: seed data from data.js is snapshotted into localStorage;
   every action mutates the snapshot, writes the audit log, and re-renders.
   No model, no network, no real data. */

"use strict";

const LS_KEY = "ascertain-desk-v1";

let state = loadState();
let busy = false; // in-flight simulated outside-world call

/* ------------------------------------------------------------------ */
/* Status metadata                                                     */
/* ------------------------------------------------------------------ */

const PA_STATUS = [
  { id: "ingested", label: "Ingested" },
  { id: "ready", label: "Ready to submit" },
  { id: "review", label: "Needs human review" },
  { id: "retry", label: "Retry scheduled" },
  { id: "submitted", label: "Submitted" },
  { id: "pending", label: "Pending payer" },
  { id: "approved", label: "Approved" },
  { id: "denied", label: "Denied" },
];

const REF_STATUS = [
  { id: "ingested", label: "Ingested" },
  { id: "review", label: "Needs human review" },
  { id: "eligibility", label: "Eligibility check" },
  { id: "matched", label: "Specialist match" },
  { id: "scheduled", label: "Scheduling requested" },
];

const WF_META = {
  pa: { name: "Prior authorization", short: "PA", stage: "Live" },
  referral: { name: "Referral processing", short: "REF", stage: "Pilot" },
  eligibility: { name: "Eligibility verification", short: "ELIG", stage: "Planned" },
  denials: { name: "Denials", short: "DEN", stage: "Planned" },
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function fmtClock(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const p = (n) => String(n).padStart(2, "0");
  return p(d.getMonth() + 1) + "/" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
}

function relTime(iso) {
  const d = new Date(iso).getTime();
  if (isNaN(d)) return "";
  const mins = Math.max(1, Math.round((Date.now() - d) / 60000));
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return hrs + "h ago";
  return Math.floor(hrs / 24) + "d ago";
}

function statusMeta(wf, status) {
  const list = wf === "pa" ? PA_STATUS : REF_STATUS;
  return list.find((s) => s.id === status) || { id: status, label: status };
}

function pillClass(wf, status) {
  return "pill pill-" + status;
}

function stagePill(stage) {
  const cls = stage === "Live" ? "stage-live" : stage === "Pilot" ? "stage-pilot" : "stage-planned";
  return `<span class="stage ${cls}">${stage}</span>`;
}

function px(val) { return `${Math.round(val * 10) / 10}`; }

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.v === 1 && parsed.paCases && parsed.refCases) return parsed;
    }
  } catch (e) { /* fall through to seed */ }
  return freshSeed();
}

function persist() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
}

function paCase(id) { return state.paCases.find((c) => c.id === id); }
function refCase(id) { return state.refCases.find((c) => c.id === id); }

function countBy(list, key) {
  const out = {};
  for (const item of list) out[item[key]] = (out[item[key]] || 0) + 1;
  return out;
}

function reviewItems() {
  return [
    ...state.paCases.filter((c) => c.status === "review").map((c) => ({ wf: "pa", case: c })),
    ...state.refCases.filter((c) => c.status === "review").map((c) => ({ wf: "referral", case: c })),
  ];
}

function logAudit(actor, action, detail, caseId, wf) {
  if (!state.audit) state.audit = [];
  state.audit.unshift({ t: fmtNow(), actor, action, detail, caseId, wf });
  if (state.audit.length > 120) state.audit.length = 120;
}

function fmtNow() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes());
}

function touchClick() {
  state.session.clicks++;
}

function recentFeed() {
  const entries = [];
  for (const c of state.paCases) for (const h of c.history) entries.push({ t: h.t, ...h, wf: "pa", caseId: c.id });
  for (const c of state.refCases) for (const h of c.history) entries.push({ t: h.t, ...h, wf: "referral", caseId: c.id });
  if (state.audit) for (const a of state.audit) entries.push({ t: a.t, ...a, caseId: a.caseId, wf: a.wf });
  return entries.sort((a, b) => (a.t < b.t ? 1 : -1)).slice(0, 8);
}

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

function route() {
  const hash = location.hash.replace(/^#\/?/, "");
  const parts = hash.split("/").filter(Boolean);
  if (parts[0] === "case" && parts.length >= 3) return { name: "case", wf: parts[1], id: parts[2] };
  if (parts[0] === "spec") return { name: "spec", id: parts[1] };
  const names = ["home", "pa", "review", "referral", "rollout"];
  if (names.includes(parts[0])) return { name: parts[0] };
  return { name: "home" };
}

function render() {
  const r = route();
  const views = { home: "view-home", pa: "view-pa", case: "view-case", review: "view-review", referral: "view-referral", rollout: "view-rollout", spec: "view-spec" };
  for (const [name, id] of Object.entries(views)) {
    const el = document.getElementById(id);
    el.hidden = name !== r.name;
  }
  const nav = document.querySelectorAll("[data-nav]");
  nav.forEach((a) => a.classList.toggle("nav-active", a.dataset.nav === r.name || (r.name === "case" && a.dataset.nav === r.wf)));

  const badge = $("#review-badge");
  const n = reviewItems().length;
  badge.textContent = n;
  badge.hidden = n === 0;

  if (r.name === "home") renderHome();
  else if (r.name === "pa") renderPa();
  else if (r.name === "case") renderCase(r.wf, r.id);
  else if (r.name === "review") renderReview();
  else if (r.name === "referral") renderReferral();
  else if (r.name === "rollout") renderRollout();
  else if (r.name === "spec") renderSpec(r.id);

  renderDemoBar(r);
  window.scrollTo(0, 0);
}

function go(hash) {
  touchClick();
  location.hash = hash;
  render();
}

/* ------------------------------------------------------------------ */
/* Home                                                                */
/* ------------------------------------------------------------------ */

function renderHome() {
  const paCount = state.paCases.length;
  const paHuman = state.paCases.filter((c) => c.status === "review").length;
  const refCount = state.refCases.length;
  const refHuman = state.refCases.filter((c) => c.status === "review").length;

  const tiles = [
    {
      wf: "pa", stage: WF_META.pa.stage,
      title: WF_META.pa.name, subtitle: "First live workflow — where the desk starts.",
      statA: paCount + " cases on file", statB: paHuman + " need a human",
      link: "#/pa", cta: "Open worklist",
    },
    {
      wf: "referral", stage: WF_META.referral.stage,
      title: WF_META.referral.name, subtitle: "Second workflow, same case shell, same queue.",
      statA: refCount + " referrals on file", statB: refHuman + " need a human",
      link: "#/referral", cta: "Open worklist",
    },
    {
      wf: "eligibility", stage: WF_META.eligibility.stage,
      title: WF_META.eligibility.name, subtitle: "Already runs inside referral cases as a check.",
      statA: "Spec attached", statB: "Not scheduled for rollout",
      link: "#/spec/eligibility", cta: "Read one-page spec",
    },
    {
      wf: "denials", stage: WF_META.denials.stage,
      title: WF_META.denials.name, subtitle: "Denied cases already land here with reasons.",
      statA: "Spec attached", statB: "Appeal draft outlined",
      link: "#/spec/denials", cta: "Read one-page spec",
    },
  ];

  const feed = recentFeed().map((e) => `
    <li class="feed-item">
      <span class="feed-time">${fmtClock(e.t)}</span>
      <span class="feed-wf">${WF_META[e.wf] ? WF_META[e.wf].short : ""}</span>
      <span class="feed-body"><strong>${esc(e.actor)}</strong> — ${esc(e.action)} <span class="feed-detail">${esc(e.detail)}</span></span>
      <a class="feed-link" href="#/case/${e.wf}/${encodeURIComponent(e.caseId || "")}">${esc(e.caseId || "")}</a>
    </li>`).join("");

  $("#view-home").innerHTML = `
    <section class="hero-panel panel">
      <p class="eyebrow">Ascertain · Expand team · prototype</p>
      <h1 class="page-title">Care Team Admin Desk</h1>
      <p class="page-sub">One shared case model, one human review queue, one audit log — carrying prior authorization today and referral processing next. Agent does routine steps; non-routine work stops for a human; everything is logged.</p>
      <div class="hero-stats">
        <div class="stat"><span class="stat-num">${paCount + refCount}</span><span class="stat-label">cases on file</span></div>
        <div class="stat"><span class="stat-num">${paHuman + refHuman}</span><span class="stat-label">need a human</span></div>
        <div class="stat"><span class="stat-num">2</span><span class="stat-label">workflows live or in pilot</span></div>
      </div>
    </section>

    <section aria-labelledby="wf-heading">
      <h2 id="wf-heading" class="section-heading">Workflows</h2>
      <div class="tile-grid">
        ${tiles.map((t) => `
        <article class="tile panel">
          <div class="tile-top">
            <h3 class="tile-title">${esc(t.title)}</h3>
            ${stagePill(t.stage)}
          </div>
          <p class="tile-sub">${esc(t.subtitle)}</p>
          <ul class="tile-stats">
            <li><span class="tile-stat">${esc(t.statA)}</span></li>
            <li><span class="tile-stat">${esc(t.statB)}</span></li>
          </ul>
          <a class="button button-primary tile-cta" href="${t.link}">${t.cta}</a>
        </article>`).join("")}
      </div>
    </section>

    <section aria-labelledby="recent-heading" class="two-col">
      <div>
        <h2 id="recent-heading" class="section-heading">Recent activity</h2>
        ${feed ? `<ul class="feed">${feed}</ul>` : `<div class="empty-state panel">No activity yet this session.</div>`}
      </div>
      <aside class="panel how-panel">
        <h2 class="section-heading">How this desk works</h2>
        <ol class="how-list">
          <li><strong>Routine work flows.</strong> When every criterion is supported by a cited passage, the agent completes and submits (simulated) without a person.</li>
          <li><strong>Non-routine work stops.</strong> A missing note, a policy mismatch, or a portal error sends the case to the human review queue with the reason stated and an owner named.</li>
          <li><strong>Everything is logged.</strong> Every AI and human action carries a time and an actor — built-in traceability.</li>
          <li><strong>Coverage belongs to the payer.</strong> This desk never claims an outcome. It says what the record supports.</li>
        </ol>
      </aside>
    </section>
    <p class="screen-note">All data synthetic — see footer. Visit <a href="#/rollout">Rollout</a> for baseline vs current metrics and the product-vs-custom panel.</p>`;
}

/* ------------------------------------------------------------------ */
/* PA worklist                                                         */
/* ------------------------------------------------------------------ */

function renderPa() {
  const filters = state.paFilters = state.paFilters || { status: "all", payer: "all", clinic: "all", type: "all" };
  const counts = countBy(state.paCases, "status");
  const payers = [...new Set(state.paCases.map((c) => c.payer))].sort();
  const clinics = [...new Set(state.paCases.map((c) => c.clinic))].sort();
  const types = [...new Set(state.paCases.map((c) => c.serviceType))].sort();

  let list = state.paCases.slice();
  if (filters.status !== "all") list = list.filter((c) => c.status === filters.status);
  if (filters.payer !== "all") list = list.filter((c) => c.payer === filters.payer);
  if (filters.clinic !== "all") list = list.filter((c) => c.clinic === filters.clinic);
  if (filters.type !== "all") list = list.filter((c) => c.serviceType === filters.type);

  const grouped = PA_STATUS.map((s) => ({ ...s, items: list.filter((c) => c.status === s.id) })).filter((g) => g.items.length || filters.status === "all" || filters.status === g.id);

  const sel = (name, options, allLabel, key) => `
    <label class="filter-group">${name}
      <select data-pa-filter="${key}" class="filter-select">
        <option value="all">${allLabel}</option>
        ${options.map((o) => `<option value="${esc(o)}" ${filters[key] === o ? "selected" : ""}>${esc(o)}</option>`).join("")}
      </select>
    </label>`;

  $("#view-pa").innerHTML = `
    <p class="eyebrow">Workflow · ${WF_META.pa.name} · ${stagePill("Live")}</p>
    <h1 class="page-title">Prior authorization worklist</h1>
    <p class="page-sub">${state.paCases.length} synthetic cases across ${clinics.length} clinics. Routine cases auto-submit; non-routine cases stop in the <a href="#/review">review queue</a>.</p>

    <div class="status-tabs" role="tablist" aria-label="Status filter">
      <button class="status-tab ${filters.status === "all" ? "tab-active" : ""}" data-pa-status="all" type="button">All <span class="tab-count">${state.paCases.length}</span></button>
      ${PA_STATUS.map((s) => `
      <button class="status-tab ${filters.status === s.id ? "tab-active" : ""}" data-pa-status="${s.id}" type="button">${s.label} <span class="tab-count">${counts[s.id] || 0}</span></button>`).join("")}
    </div>

    <div class="filters panel">
      ${sel("Payer", payers, "All payers", "payer")}
      ${sel("Location", clinics, "All clinics", "clinic")}
      ${sel("Service type", types, "All services", "type")}
      <button id="pa-filters-clear" class="button button-quiet" type="button">Clear filters</button>
    </div>

    ${list.length === 0 ? `
      <div class="empty-state panel">
        <p><strong>No cases match these filters.</strong></p>
        <p>Clear a filter or check the review queue — that is where work waits on a person.</p>
        <button class="button button-secondary" type="button" data-clear-pa>Clear filters</button>
      </div>`
    : grouped.filter((g) => g.items.length).map((g) => `
      <section class="status-group" aria-labelledby="grp-${g.id}">
        <h2 id="grp-${g.id}" class="group-heading"><span class="${pillClass("pa", g.id)}">${g.label}</span> <span class="group-count">${g.items.length}</span></h2>
        <div class="rowlist">
          ${g.items.map(paRow).join("")}
        </div>
      </section>`).join("")}`;

  $("#view-pa").querySelectorAll("[data-pa-status]").forEach((b) => b.addEventListener("click", () => { filters.status = b.dataset.paStatus; touchClick(); renderPa(); }));
  $("#view-pa").querySelectorAll("[data-pa-filter]").forEach((s) => s.addEventListener("change", () => { filters[s.dataset.paFilter] = s.value; touchClick(); renderPa(); }));
  const clear = $("#pa-filters-clear");
  if (clear) clear.addEventListener("click", () => { Object.assign(filters, { status: "all", payer: "all", clinic: "all", type: "all" }); renderPa(); });
  const clear2 = $("#view-pa").querySelector("[data-clear-pa]");
  if (clear2) clear2.addEventListener("click", () => { Object.assign(filters, { status: "all", payer: "all", clinic: "all", type: "all" }); renderPa(); });
}

function paRow(c) {
  const held = c.status === "review" ? ` <span class="held-chip">needs human</span>` : "";
  return `
  <a class="row panel" href="#/case/pa/${encodeURIComponent(c.id)}">
    <div class="row-main">
      <span class="row-id">${esc(c.id)}</span>
      <span class="row-title">${esc(c.patient)} — ${esc(c.service)}</span>
      <span class="row-meta">${esc(c.payer)} · ${esc(c.provider)} · ${esc(c.clinic)}</span>
    </div>
    <div class="row-side">
      <span class="${pillClass("pa", c.status)}">${statusMeta("pa", c.status).label}</span>
      ${held}
      <span class="row-time">${relTime(c.history[0]?.t || state.startedAt)}</span>
    </div>
  </a>`;
}

/* ------------------------------------------------------------------ */
/* Case screen (PA and referral share the shell)                       */
/* ------------------------------------------------------------------ */

function renderCase(wf, id) {
  if (wf === "pa") return renderPaCase(id);
  if (wf === "referral") return renderRefCase(id);
  $("#view-case").innerHTML = `<div class="empty-state panel">Unknown case.</div>`;
}

function renderPaCase(id) {
  const c = paCase(id);
  if (!c) { $("#view-case").innerHTML = `<div class="empty-state panel">Case ${esc(id)} not found.</div>`; return; }

  const gaps = c.criteria.filter((x) => x.state !== "met");
  const allMet = gaps.length === 0;
  const attachable = c.addendum && !c.docs.find((d) => d.id === "chart addendum")?.attached;

  let actionCard = "";
  const draftBox = `
    <div class="draft-box">
      ${c.criteria.map((cr) => `
        <div class="draft-line">
          <span class="draft-crit">${esc(cr.text)}</span>
          <span class="${cr.state === "met" ? "state-met" : cr.state === "not met" ? "state-notmet" : "state-cant"}">${cr.state === "met" ? "met — cited" : cr.state === "not met" ? "not met" : "can't tell — no passage found"}</span>
        </div>`).join("")}
      <p class="draft-foot">Requested: ${esc(c.service)} for ${esc(c.patient)}. This draft states what the record supports — coverage decisions belong to the payer.</p>
    </div>`;
  const gateBanner = allMet
    ? `<div class="ok-banner">All payer criteria are supported by cited passages. ${c.status === "review" ? "Review the draft, then approve &amp; submit." : "Ready to submit (simulated portal)."}</div>`
    : `<div class="gate-banner">Review required — <strong>${gaps.length} ${gaps.length === 1 ? "criterion is" : "criteria are"}</strong> not confirmed: ${gaps.map((g) => esc(g.text)).join("; ")}. The risky submit button stays disabled until a named person clears every blocker.</div>`;

  if (c.status === "review" || c.status === "ready" || c.status === "ingested") {
    const canSubmit = allMet && c.status === "ready";
    const canApprove = allMet && c.status === "review";
    const actionButtons = c.status === "review"
      ? `<button class="button button-primary" ${canApprove ? "" : "disabled"} data-act="approve-submit" type="button">Approve draft &amp; submit</button>
         <button class="button button-quiet" data-act="edit-draft" type="button">Edit draft</button>
         <button class="button button-quiet" data-act="send-back" type="button">Send back</button>`
      : c.status === "ingested"
      ? `<span class="hint">Agent is reading the fax and drafting (simulated) — the submission controls appear once the draft is complete.</span>`
      : `<button class="button button-primary" ${canSubmit ? "" : "disabled"} data-act="submit" type="button">Submit to ${esc(c.payer)} (simulated portal)</button>
         <button class="button button-quiet" data-act="edit-draft" type="button">Edit draft</button>
         <button class="button button-quiet" data-act="send-back" type="button">Send back</button>`;
    actionCard = `
      <section class="panel action-panel" aria-labelledby="action-heading">
        <h2 id="action-heading" class="section-heading">Draft submission</h2>
        ${draftBox}
        ${gateBanner}
        <div class="action-row">
          ${actionButtons}
          ${attachable ? `<button class="button button-secondary" data-act="attach-note" type="button">Attach result note from chart</button>` : ""}
        </div>
      </section>`;
  }

  let statusCard = "";
  if (c.status === "retry") {
    statusCard = `
      <section class="panel error-box">
        <h2 class="section-heading">Submission failed — outside world</h2>
        <p><strong>What failed:</strong> ${esc(c.payer)} portal returned ${esc(c.portalError ? c.portalError.code : "a gateway timeout")} on attempt ${c.portalError ? c.portalError.attempts : Math.max(c.failures || 0, 1)} of 2 (the demo outage is still on).</p>
        <p><strong>What the system will do:</strong> retry is scheduled automatically (simulated); the case escalates to the review queue after two failures.</p>
        <p><strong>What you should do:</strong> nothing right now — or force a retry in the demo.</p>
        <button class="button button-secondary" data-act="force-retry" type="button">Force retry now (demo)</button>
      </section>`;
  }
  if (c.status === "denied") {
    statusCard = `
      <section class="panel error-box">
        <h2 class="section-heading">Payer response: Denied (synthetic)</h2>
        <p><strong>Reason:</strong> ${esc(c.history.find((h) => h.action.includes("Denied"))?.detail || "Not medically necessary.")}</p>
        <p>The denial and its reason are logged. The Expand team would pick this up next — the staged <a href="#/spec/denials">Denials workflow spec</a> starts with a draft appeal assembled from the same cited criteria.</p>
        <button class="button button-primary" data-act="start-appeal" type="button">Start appeal</button>
      </section>`;
  }
  if (c.status === "approved") {
    statusCard = `
      <section class="panel ok-banner">
        <h2 class="section-heading">Payer response: Approved (synthetic)</h2>
        <p>Case closed. The record supported every criterion with a cited passage, and the payer approved the simulated submission.</p>
      </section>`;
  }

  $("#view-case").innerHTML = `
    <a class="back-link" href="#/pa">← Back to PA worklist</a>
    <header class="case-head">
      <div>
        <p class="eyebrow">Prior authorization · ${esc(c.clinic)}</p>
        <h1 class="page-title">${esc(c.patient)} — ${esc(c.service)}</h1>
        <p class="page-sub">${esc(c.payer)} · ordered by ${esc(c.provider)} · ${esc(c.serviceType)}</p>
      </div>
      <div class="case-head-right">
        <span class="${pillClass("pa", c.status)} big-pill">${statusMeta("pa", c.status).label}</span>
      </div>
    </header>

    ${c.status === "review" ? `
      <section class="panel gate-banner">
        <strong>Held for human review — ${esc(c.reasons.join("; "))}.</strong>
        Owner: ${esc(c.owner)}. This case will never auto-submit.
      </section>` : ""}
    ${c.routine && (c.status === "submitted" || c.status === "pending" || c.status === "approved") ? `
      <section class="panel info-box">Routine case — every criterion was supported by a cited passage, so the agent auto-submitted (simulated). No human touched it.</section>` : ""}
    ${statusCard}
    ${actionCard}

    <div class="case-grid">
      <section class="panel" aria-labelledby="docs-heading">
        <h2 id="docs-heading" class="section-heading">Source documents</h2>
        ${c.docs.map((d) => `
          <details class="doc-card" ${d.attached ? "open" : ""}>
            <summary class="doc-label">${esc(d.label)}${d.attached ? ` <span class="tag tag-new">attached this session</span>` : ""}</summary>
            <pre class="doc-text">${esc(d.text)}</pre>
          </details>`).join("")}
      </section>

      <section class="panel" aria-labelledby="criteria-heading">
        <h2 id="criteria-heading" class="section-heading">Payer criteria — ${esc(c.payer)} (synthetic policy)</h2>
        <p class="section-note">Every answer is met, not met, or can't tell from the record. Each "met" carries the passage that supports it.</p>
        ${c.criteria.map((cr) => `
          <article class="criterion">
            <div class="criterion-head">
              <h3 class="criterion-title">${esc(cr.text)}</h3>
              <span class="${cr.state === "met" ? "state-met" : cr.state === "not met" ? "state-notmet" : "state-cant"}">${cr.state === "met" ? "met" : cr.state === "not met" ? "not met" : "can't tell"}</span>
            </div>
            ${cr.passage
              ? `<blockquote class="criterion-passage">“${esc(cr.passage)}” <cite class="source-tag">— ${esc(cr.doc)}</cite></blockquote>`
              : `<p class="no-passage">No passage found — the record does not answer this criterion. ${esc(cr.gap || "")}</p>`}
          </article>`).join("")}
      </section>
    </div>

    <section class="panel" aria-labelledby="log-heading">
      <h2 id="log-heading" class="section-heading">Activity log</h2>
      <ul class="timeline">
        ${c.history.slice().reverse().map((h) => `
          <li class="tl-item">
            <span class="tl-time">${fmtClock(h.t)}</span>
            <span class="tl-actor">${esc(h.actor)}</span>
            <span class="tl-action">${esc(h.action)}</span>
            ${h.detail ? `<span class="tl-detail">${esc(h.detail)}</span>` : ""}
          </li>`).join("")}
      </ul>
    </section>
    `;

  bindPaCase(id);
}

function bindPaCase(id) {
  const c = paCase(id);
  const root = $("#view-case");

  root.querySelectorAll("[data-act]").forEach((btn) => btn.addEventListener("click", () => {
    const act = btn.dataset.act;
    if (act === "attach-note") attachNote(id);
    else if (act === "approve-submit") approveAndSubmit(id);
    else if (act === "submit") submitPa(id);
    else if (act === "edit-draft") editDraft(id, btn);
    else if (act === "send-back") openSendBack(id, "pa");
    else if (act === "force-retry") forceRetry(id);
    else if (act === "start-appeal") { touchClick(); go("#/spec/denials"); toast("Denials workflow spec — staged for the Expand team.", "info"); }
  }));
}

function attachNote(id) {
  const c = paCase(id);
  const add = SCENARIOS[scenarioOf(c)].addendum;
  if (!add) return;
  busy = true;
  toast("Reading chart for prior test result…", "info");
  setTimeout(() => {
    busy = false;
    const doc = c.docs.find((d) => d.id === "chart addendum");
    doc.attached = true;
    doc.text = add.text.replace("[Patient label]", c.patient);
    const crit = c.criteria.find((x) => x.id === add.fix.c);
    crit.state = "met";
    crit.doc = doc.id;
    crit.passage = add.fix.passage;
    crit.gap = null;
    state.session.processed++;
    touchClick();
    const when = fmtNow();
    c.history.push({ t: when, actor: "Clinic North staff", action: "Result note attached", detail: "Prior stress test result attached from chart; criterion now met with cited passage." });
    logAudit("Clinic North staff", "Result note attached", c.id + " — criterion confirmed by new passage.", id, "pa");
    persist();
    renderPaCase(id);
    toast("Criterion confirmed — prior stress test cited. Submit is now enabled.", "ok");
  }, 900);
}

function submitPa(id) {
  if (busy) return;
  const c = paCase(id);
  if (c.criteria.some((x) => x.state !== "met")) { toast("Blockers remain — clear every criterion before submitting.", "warn"); return; }
  busy = true;
  touchClick();
  toast("Opening " + c.payer + " portal (simulated)…", "info");
  setTimeout(() => {
    busy = false;
    const when = fmtNow();
    if (state.demo.portalDown) {
      c.failures = (c.failures || 0) + 1;
      if (c.failures >= 2) {
        c.status = "review";
        c.reasons = ["Portal error: submission failed twice"];
        c.owner = "Ops partner";
        c.routine = false;
        c.history.push({ t: when, actor: c.payer + " portal", action: "Submission failed — " + (c.portalError ? c.portalError.code : "504 gateway timeout"), detail: "Attempt " + c.failures + " of 2 — escalated to human review. Owner: Ops partner." });
        logAudit(c.payer + " portal", "Submission escalated", c.id + " — two portal failures, moved to review queue.", id, "pa");
        state.session.errors++;
        persist();
        render();
        toast("Second failure — case moved to review queue (Ops partner).", "warn");
      } else {
        c.status = "retry";
        c.failures = 1;
        c.history.push({ t: when, actor: c.payer + " portal", action: "Submission failed — 504 gateway timeout", detail: "Attempt 1 of 2. Auto-retry scheduled in 30 minutes (simulated)." });
        logAudit(c.payer + " portal", "Submission failed — retry scheduled", c.id + " — 504, attempt 1 of 2.", id, "pa");
        state.session.errors++;
        persist();
        render();
        toast("Portal timeout — retry scheduled. Escalates to humans after attempt 2.", "warn");
      }
    } else {
      c.status = "submitted";
      c.submittedAt = when;
      state.demo.lastSubmittedId = id;
      c.history.push({ t: when, actor: "Clinic North staff", action: "Submitted", detail: "Submitted to " + c.payer + " portal (simulated)." });
      state.session.processed++;
      logAudit("Clinic North staff", "Submitted to portal", c.id + " — draft approved, submission sent (simulated).", id, "pa");
      persist();
      render();
      toast("Submitted to " + c.payer + " — use Demo controls to simulate the payer response.", "ok");
    }
  }, 1000);
}

function approveAndSubmit(id) {
  const c = paCase(id);
  if (c.criteria.some((x) => x.state !== "met")) { toast("A named person must clear every blocker before approve is enabled.", "warn"); return; }
  const when = fmtNow();
  c.history.push({ t: when, actor: c.owner || "Clinic North staff", action: "Draft approved", detail: "Human review complete — all criteria confirmed with citations." });
  logAudit(c.owner || "Clinic North staff", "Draft approved", c.id + " — human gate cleared.", id, "pa");
  touchClick();
  touchClick();
  persist();
  renderPaCase(id);
  submitPa(id);
}

function forceRetry(id) {
  if (busy) return;
  const c = paCase(id);
  busy = true;
  touchClick();
  toast("Retrying submission to " + c.payer + " (simulated)…", "info");
  setTimeout(() => {
    busy = false;
    const when = fmtNow();
    if (state.demo.portalDown) {
      c.failures = (c.failures || 0) + 1;
      c.status = "review";
      c.reasons = ["Portal error: submission failed twice"];
      c.owner = "Ops partner";
      c.routine = false;
      c.history.push({ t: when, actor: c.payer + " portal", action: "Submission failed — portal outage", detail: "Attempt " + Math.min(c.failures, 2) + " of 2 — escalated to human review. Owner: Ops partner." });
      logAudit(c.payer + " portal", "Submission escalated", c.id + " — portal still down on retry, moved to review queue.", id, "pa");
      state.session.errors++;
      persist();
      render();
      toast("Portal still down — case escalated to the review queue (Ops partner).", "warn");
    } else {
      c.status = "submitted";
      c.submittedAt = when;
      state.demo.lastSubmittedId = id;
      c.history.push({ t: when, actor: "Agent", action: "Auto-retry succeeded", detail: "Submitted to " + c.payer + " portal (simulated)." });
      state.session.processed++;
      logAudit("Agent", "Auto-retry succeeded", c.id + " — submitted after retry.", id, "pa");
      persist();
      render();
      toast("Retry succeeded — now simulating the payer response.", "ok");
    }
  }, 1000);
}

function editDraft(id, btn) {
  const c = paCase(id);
  touchClick();
  const box = btn.closest(".action-panel");
  const draftArea = box.querySelector(".draft-box");
  const textarea = document.createElement("textarea");
  textarea.className = "draft-edit";
  textarea.value = c.criteria.map((cr) => `[${cr.state}] ${cr.text} — ${cr.passage ? "cited: " + cr.passage : "no passage found"}`).join("\n");
  const save = document.createElement("button");
  save.className = "button button-primary";
  save.type = "button";
  save.textContent = "Save edited draft";
  save.style.marginTop = "10px";
  const wrap = document.createElement("div");
  wrap.appendChild(textarea);
  wrap.appendChild(save);
  draftArea.replaceWith(wrap);
  save.addEventListener("click", () => {
    const when = fmtNow();
    c.history.push({ t: when, actor: "Clinic North staff", action: "Draft edited", detail: "Human edited the draft text before submission." });
    logAudit("Clinic North staff", "Draft edited", c.id + " — draft text changed.", id, "pa");
    state.session.processed++;
    persist();
    renderPaCase(id);
    toast("Draft edit logged to the activity log.", "ok");
  });
  textarea.focus();
}

/* ------------------------------------------------------------------ */
/* Review queue                                                        */
/* ------------------------------------------------------------------ */

function renderReview() {
  const items = reviewItems();
  $("#view-review").innerHTML = `
    <p class="eyebrow">One queue for all workflows</p>
    <h1 class="page-title">Human review queue</h1>
    <p class="page-sub">Non-routine work stops here, from every workflow, with the reason stated and an owner named. Approve, edit, or send back — each action is logged.</p>
    ${items.length === 0 ? `
      <div class="empty-state panel">
        <p><strong>No cases need you right now.</strong></p>
        <p>Routine work is flowing on its own. New non-routine cases land here the moment a criterion cannot be confirmed or a portal errors.</p>
      </div>` : `
      <div class="rowlist">
        ${items.map(reviewRow).join("")}
      </div>`}
    <p class="screen-note">Queue contents are derived live from case state — approve a case here and the badge count drops everywhere.</p>`;

  $("#view-review").querySelectorAll("[data-queue-act]").forEach((btn) => btn.addEventListener("click", () => {
    const act = btn.dataset.queueAct;
    const wf = btn.dataset.wf;
    const id = btn.dataset.id;
    if (act === "open") go("#/case/" + wf + "/" + encodeURIComponent(id));
    else if (act === "approve") { wf === "pa" ? approveAndSubmit(id) : approveRef(id); }
    else if (act === "sendback") openSendBack(id, wf);
  }));
}

function reviewRow(item) {
  const c = item.case;
  const wf = item.wf;
  const canApprove = wf === "pa" ? c.criteria.every((x) => x.state === "met") : true;
  const held = c.history.filter((h) => h.action.includes("Held") || h.action.includes("escalated")).pop();
  return `
  <article class="review-card panel">
    <div class="review-top">
      <span class="wf-chip">${WF_META[wf].name}</span>
      <span class="review-id">${esc(c.id)}</span>
      ${stagePill(WF_META[wf].stage)}
      <span class="review-wait">in queue ${held ? relTime(held.t) : "today"}</span>
    </div>
    <h3 class="review-title"><a href="#/case/${wf}/${encodeURIComponent(c.id)}">${esc(c.patient)} — ${esc(c.service || c.needed)}</a></h3>
    <p class="review-meta">${esc(c.payer || "")} · ${esc(c.clinic)} · ${esc(c.provider || c.from || "")}</p>
    <div class="reason-list">${c.reasons.map((r) => `<span class="tag tag-reason">${esc(r)}</span>`).join("") || `<span class="tag">non-routine</span>`}</div>
    <p class="review-owner">Owner: <strong>${esc(c.owner || "Unassigned")}</strong></p>
    <div class="action-row">
      <button class="button button-primary" type="button" data-queue-act="approve" data-wf="${wf}" data-id="${esc(c.id)}" ${canApprove ? "" : "disabled"}>${wf === "pa" ? "Approve &amp; submit" : "Approve"}</button>
      <button class="button button-quiet" type="button" data-queue-act="open" data-wf="${wf}" data-id="${esc(c.id)}">${wf === "pa" ? "Open case (clear blockers)" : "Open case"}</button>
      <button class="button button-quiet" type="button" data-queue-act="sendback" data-wf="${wf}" data-id="${esc(c.id)}">Send back</button>
    </div>
    ${!canApprove ? `<p class="hint">Approve stays disabled until every payer criterion carries a cited passage — open the case to clear the blocker.</p>` : ""}
  </article>`;
}

function approveRef(id) {
  const c = refCase(id);
  if (!c) return;
  touchClick();
  const when = fmtNow();
  c.status = "eligibility";
  c.eligibility = null;
  c.reasons = [];
  c.owner = null;
  c.history.push({ t: when, actor: "Ops partner", action: "Approved", detail: "Fields corrected after human review (insurance ID re-read from fax). Eligibility check next." });
  logAudit("Ops partner", "Approved referral after review", c.id + " — moved to eligibility check.", id, "referral");
  state.session.processed++;
  persist();
  render();
  toast(c.id + " approved — eligibility check is next in the same shell.", "ok");
}

/* ------------------------------------------------------------------ */
/* Send back modal                                                     */
/* ------------------------------------------------------------------ */

function openSendBack(id, wf) {
  const reasons = wf === "pa"
    ? ["Missing documentation", "Wrong service code", "Duplicate request", "Needs clinical correction"]
    : ["Fax unreadable — request resend", "Wrong recipient specialty", "Missing insurance information", "Duplicate request"];
  openModal(`
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="sb-title">
      <h2 id="sb-title" class="modal-title">Send ${esc(id)} back</h2>
      <p class="modal-note">The case returns to the practice with this reason. The action is written to the audit log.</p>
      <label class="filter-group" for="sb-reason">Reason</label>
      <select id="sb-reason" class="filter-select">
        ${reasons.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join("")}
      </select>
      <label class="filter-group" for="sb-note">Note to practice (optional)</label>
      <textarea id="sb-note" class="draft-edit" rows="3" placeholder="What should the practice add or fix?"></textarea>
      <div class="modal-actions">
        <button id="sb-cancel" class="button button-quiet" type="button">Cancel</button>
        <button id="sb-confirm" class="button button-primary" type="button">Send back</button>
      </div>
    </div>`);
  const modal = $("#modal-root");
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  $("#sb-cancel").addEventListener("click", closeModal);
  $("#sb-confirm").addEventListener("click", () => {
    const reason = $("#sb-reason").value;
    const note = $("#sb-note").value.trim();
    const c = wf === "pa" ? paCase(id) : refCase(id);
    const when = fmtNow();
    c.status = "ingested";
    c.reasons = [];
    c.owner = "Clinic North staff";
    c.routine = false;
    c.history.push({ t: when, actor: "Clinic North staff", action: "Sent back", detail: (reason + (note ? " — " + note : "")) });
    logAudit("Clinic North staff", "Sent back", id + " — " + reason + (note ? " (" + note + ")" : ""), id, wf);
    state.session.processed++;
    touchClick();
    persist();
    closeModal();
    render();
    toast(id + " sent back to the practice — logged.", "warn");
  });
}

/* ------------------------------------------------------------------ */
/* Referral worklist + case                                            */
/* ------------------------------------------------------------------ */

function renderReferral() {
  const filters = state.refFilters = state.refFilters || { status: "all" };
  const counts = countBy(state.refCases, "status");
  let list = state.refCases.slice();
  if (filters.status !== "all") list = list.filter((c) => c.status === filters.status);

  $("#view-referral").innerHTML = `
    <p class="eyebrow">Workflow · ${WF_META.referral.name} · ${stagePill("Pilot")}</p>
    <h1 class="page-title">Referral processing</h1>
    <p class="page-sub">${state.refCases.length} synthetic referrals. The same case shell, review queue, and audit log as prior authorization — that reuse is the platform bet.</p>

    <div class="status-tabs" role="tablist" aria-label="Status filter">
      <button class="status-tab ${filters.status === "all" ? "tab-active" : ""}" data-ref-status="all" type="button">All <span class="tab-count">${state.refCases.length}</span></button>
      ${REF_STATUS.map((s) => `
      <button class="status-tab ${filters.status === s.id ? "tab-active" : ""}" data-ref-status="${s.id}" type="button">${s.label} <span class="tab-count">${counts[s.id] || 0}</span></button>`).join("")}
    </div>

    ${list.length === 0 ? `
      <div class="empty-state panel">
        <p><strong>No referrals in this state.</strong></p>
        <p>New referrals appear here the moment the fax is read.</p>
      </div>` : `
      <div class="rowlist">
        ${list.map((c) => `
        <a class="row panel" href="#/case/referral/${encodeURIComponent(c.id)}">
          <div class="row-main">
            <span class="row-id">${esc(c.id)}</span>
            <span class="row-title">${esc(c.patient)} — ${esc(c.needed)}</span>
            <span class="row-meta">${esc(c.from)} · ${esc(c.payer)} · ${esc(c.clinic)} · ${esc(c.urgency)}</span>
          </div>
          <div class="row-side">
            <span class="${pillClass("referral", c.status)}">${statusMeta("referral", c.status).label}</span>
            ${c.status === "review" ? `<span class="held-chip">needs human</span>` : ""}
            <span class="row-time">${relTime(c.history[0]?.t || state.startedAt)}</span>
          </div>
        </a>`).join("")}
      </div>`}`;

  $("#view-referral").querySelectorAll("[data-ref-status]").forEach((b) => b.addEventListener("click", () => { filters.status = b.dataset.refStatus; touchClick(); renderReferral(); }));
}

function renderRefCase(id) {
  const c = refCase(id);
  if (!c) { $("#view-case").innerHTML = `<div class="empty-state panel">Case ${esc(id)} not found.</div>`; return; }

  const fields = [
    ["Referring", c.from], ["Specialty needed", c.specialty], ["Reason", c.needed],
    ["Urgency", c.urgency], ["Insurance", c.payer],
  ];

  let flowCard = "";
  if (c.status === "review") {
    flowCard = `
      <section class="panel gate-banner">
        <strong>Held for human review — ${esc(c.reasons.join("; "))}.</strong>
        Owner: ${esc(c.owner)}. Review in the queue, then the same shell continues to eligibility.
      </section>`;
  } else if (c.status === "ingested") {
    flowCard = `
      <section class="panel action-panel">
        <h2 class="section-heading">Eligibility check</h2>
        <p>Fields were read from the referral fax. Check member eligibility and benefits before scheduling — the same step the Eligibility workflow would own at scale.</p>
        <button class="button button-primary" data-ref-act="eligibility" type="button">Run eligibility check (simulated)</button>
      </section>`;
  } else if (c.status === "eligibility" && !c.eligibility) {
    flowCard = `
      <section class="panel action-panel">
        <h2 class="section-heading">Eligibility check</h2>
        <p>Check member eligibility and benefits before scheduling — the same step the Eligibility workflow would own at scale.</p>
        <button class="button button-primary" data-ref-act="eligibility" type="button">Run eligibility check (simulated)</button>
      </section>`;
  } else if (c.status === "eligibility" || c.status === "matched" || c.status === "scheduled") {
    flowCard = `
      <section class="panel action-panel">
        <h2 class="section-heading">Eligibility check</h2>
        <div class="ok-banner">${esc(c.eligibility.detail)}</div>
        ${c.status === "matched" || c.status === "scheduled" ? `
        <h2 class="section-heading">Specialist match</h2>
        <div class="match-list">
          ${c.matches.map((m, i) => `
            <div class="match-card ${c.chosenSpecialist === m.specialist ? "match-chosen" : ""}">
              <span class="match-name">${esc(m.specialist)} ${c.chosenSpecialist === m.specialist ? `<span class="tag tag-new">assigned</span>` : ""}</span>
              <span class="match-score">match ${px(m.score * 100)}%</span>
              <span class="match-reason">${esc(m.reason)}</span>
            </div>`).join("")}
        </div>
        ${c.status === "matched" ? `
          <button class="button button-primary" data-ref-act="schedule" type="button">Request scheduling (simulated)</button>` : `
          <div class="ok-banner">Scheduling requested — slot held by the scheduler portal (simulated).</div>`}` : ``}
      </section>`;
  }

  $("#view-case").innerHTML = `
    <a class="back-link" href="#/referral">← Back to referrals</a>
    <header class="case-head">
      <div>
        <p class="eyebrow">Referral processing · ${esc(c.clinic)}</p>
        <h1 class="page-title">${esc(c.patient)} — ${esc(c.needed)}</h1>
        <p class="page-sub">${esc(c.payer)} · referred by ${esc(c.from)}</p>
      </div>
      <div class="case-head-right">
        <span class="${pillClass("referral", c.status)} big-pill">${statusMeta("referral", c.status).label}</span>
      </div>
    </header>

    ${flowCard}

    <div class="case-grid">
      <section class="panel" aria-labelledby="ref-fields">
        <h2 id="ref-fields" class="section-heading">Read from referral fax</h2>
        <dl class="kv">
          ${fields.map(([k, v]) => `<div class="kv-row"><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}
        </dl>
        <details class="doc-card">
          <summary class="doc-label">${esc(c.fax.split("\n")[0] || "Referral fax")}</summary>
          <pre class="doc-text">${esc(c.fax)}</pre>
        </details>
      </section>

      <section class="panel" aria-labelledby="log-heading">
        <h2 id="log-heading" class="section-heading">Activity log</h2>
        <ul class="timeline">
          ${c.history.slice().reverse().map((h) => `
            <li class="tl-item">
              <span class="tl-time">${fmtClock(h.t)}</span>
              <span class="tl-actor">${esc(h.actor)}</span>
              <span class="tl-action">${esc(h.action)}</span>
              ${h.detail ? `<span class="tl-detail">${esc(h.detail)}</span>` : ""}
            </li>`).join("")}
        </ul>
        <p class="hint">Same audit log shape as prior authorization — one log across workflows.</p>
      </section>
    </div>
    `;

  $("#view-case").querySelectorAll("[data-ref-act]").forEach((btn) => btn.addEventListener("click", () => {
    const act = btn.dataset.refAct;
    if (act === "eligibility") runEligibility(id);
    else if (act === "schedule") requestScheduling(id);
  }));
}

function scenarioOf(c) {
  if (c.service === "Cardiac PET/CT with stress") return "cardiac";
  if (c.service === "MRI lumbar spine without contrast") return "mriSpine";
  if (c.service === "CT chest with contrast") return "ctChest";
  if (c.service === "Echocardiogram with strain imaging") return "echo";
  if (c.service === "Screening colonoscopy") return "colonoscopy";
  if (c.service === "Knee arthroscopy") return "kneeScope";
  if (c.service === "GLP-1 (semaglutide) 1 mg weekly") return "glp1";
  return "biologic";
}

function runEligibility(id) {
  if (busy) return;
  const c = refCase(id);
  busy = true;
  touchClick();
  toast("Querying " + c.payer + " eligibility (simulated)…", "info");
  setTimeout(() => {
    busy = false;
    const when = fmtNow();
    c.eligibility = { state: "verified", detail: c.payer + " — member active, " + c.specialty + " in network. Deductible $1,500 (synthetic response)." };
    c.status = "matched";
    c.matches = [
      { specialist: matchFor(c), score: c.urgency === "Urgent" ? 0.9 : 0.94, reason: "Specialty match, 4.1 mi, next slot " + (slotFor(c)) + "." },
      { specialist: "Specialist 9 — " + c.specialty, score: 0.81, reason: "Specialty match, 9.8 mi, later slot." },
    ];
    c.chosenSpecialist = matchFor(c);
    c.history.push({ t: when, actor: "Agent", action: "Eligibility check complete", detail: c.eligibility.detail });
    c.history.push({ t: when, actor: "Agent", action: "Specialist matched", detail: c.chosenSpecialist + " — best match by specialty, distance, and next availability." });
    logAudit("Agent", "Eligibility verified", c.id + " — " + c.eligibility.detail, id, "referral");
    state.session.processed++;
    persist();
    renderRefCase(id);
    toast("Eligibility verified — specialist matched. Request scheduling to finish.", "ok");
  }, 1000);
}

function matchFor(c) {
  const map = { Cardiology: "Specialist 2 — Cardiology", Orthopedics: "Specialist 4 — Orthopedics", Dermatology: "Specialist 6 — Dermatology", Neurology: "Specialist 8 — Neurology", Endocrinology: "Specialist 10 — Endocrinology" };
  return map[c.specialty] || "Specialist 1 — " + c.specialty;
}

function slotFor(c) {
  const base = Date.now() + 5 * DAY;
  const d = new Date(base);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + " 09:30";
}

function requestScheduling(id) {
  const c = refCase(id);
  touchClick();
  const when = fmtNow();
  c.status = "scheduled";
  c.requestedSlot = slotFor(c);
  c.history.push({ t: when, actor: "Agent", action: "Scheduling requested", detail: c.requestedSlot + " requested via scheduler portal (simulated). Practice scheduler confirms by phone." });
  logAudit("Agent", "Scheduling requested", c.id + " — " + c.requestedSlot, id, "referral");
  state.session.processed++;
  persist();
  renderRefCase(id);
  toast(c.id + " — scheduling requested. Referral reached the end of this shell.", "ok");
}

/* ------------------------------------------------------------------ */
/* Rollout view                                                        */
/* ------------------------------------------------------------------ */

function renderRollout() {
  const seed = ROLLOUT_SEED;
  const s = state.session;

  const metricRow = (wfName, m) => {
    const b = m.baseline, c = m.current;
    if (!c) return `
      <div class="metric-pair baseline-only">
        <h4>${wfName}</h4>
        <p class="hint">Baseline recorded — ${m.note || "awaiting deployment (Map phase)."}</p>
      </div>`;
    const bars = (key, label, unit, better) => {
      const bl = b[key], cl = c[key];
      const max = Math.max(bl, cl) * 1.15;
      return `
        <div class="bar-row">
          <span class="bar-label">${label}</span>
          <span class="bar-track"><span class="bar-fill bar-base" style="width:${Math.round((bl / max) * 100)}%"></span></span>
          <span class="bar-num">base ${px(bl)}${unit}</span>
          <span class="bar-track"><span class="bar-fill bar-now" style="width:${Math.round((cl / max) * 100)}%"></span></span>
          <span class="bar-num">now ${px(cl)}${unit} <span class="delta ${cl <= bl ? "delta-good" : "delta-bad"}">${cl <= bl ? "↓" : "↑"}</span></span>
        </div>`;
    };
    return `
      <div class="metric-pair">
        <h4>${wfName}</h4>
        ${bars("taskMin", "Task time", " min", true)}
        ${bars("clicks", "Clicks per case", "", true)}
        ${bars("errorPct", "Error rate", "%", true)}
      </div>`;
  };

  $("#view-rollout").innerHTML = `
    <p class="eyebrow">Rollout — how the Expand team measures value</p>
    <h1 class="page-title">Rollout and outcome</h1>
    <p class="page-sub">Baseline metrics are captured before deployment (Map phase); current metrics come from the running workflows. <strong>All numbers on this page are synthetic.</strong></p>

    <div class="session-strip panel">
      <span class="session-chip">This session: <strong>${s.clicks}</strong> clicks recorded</span>
      <span class="session-chip"><strong>${s.processed}</strong> cases advanced by you</span>
      <span class="session-chip"><strong>${s.errors}</strong> simulated outside failures</span>
      <span class="session-chip">Started ${fmtClock(s.startedAt)}</span>
    </div>

    <h2 class="section-heading">Per practice</h2>
    <div class="practice-grid">
      ${seed.practices.map((p) => `
      <article class="panel practice-card">
        <div class="tile-top">
          <h3 class="tile-title">${esc(p.name)}</h3>
          ${stagePill(p.stage)}
        </div>
        <p class="hint">${esc(p.note)}</p>
        ${metricRow("Prior authorization", p.metrics.pa)}
        ${metricRow("Referral processing", p.metrics.referral)}
      </article>`).join("")}
    </div>

    <h2 class="section-heading">Product vs custom</h2>
    <p class="page-sub">The Expand PM's real choice: what becomes standard product and what stays a custom build for one practice. This panel keeps that choice visible.</p>
    <div class="pv-grid">
      <section class="panel">
        <h3 class="panel-title">Standard product settings</h3>
        <ul class="check-list">
          ${seed.productVsCustom.standard.map((x) => `<li><span class="check" aria-hidden="true">✓</span>${esc(x)}</li>`).join("")}
        </ul>
      </section>
      <section class="panel">
        <h3 class="panel-title">Practice-specific (custom)</h3>
        <ul class="check-list custom-list">
          ${seed.productVsCustom.custom.map((x) => `<li><span class="gear" aria-hidden="true">⚙</span>${esc(x)}</li>`).join("")}
        </ul>
        <p class="hint">Each custom item is a candidate to become product once a second practice needs it.</p>
      </section>
    </div>

    <h2 class="section-heading">Workflow rollout stages</h2>
    <div class="rowlist stage-list">
      <div class="row panel stage-row"><div><strong>Prior authorization</strong><span class="hint">First live workflow — started here because this is the workflow Ascertain understands best.</span></div>${stagePill("Live")}<span class="hint">Next: scale to Clinic East</span></div>
      <div class="row panel stage-row"><div><strong>Referral processing</strong><span class="hint">Second workflow — same case model, same queue, same log.</span></div>${stagePill("Pilot")}<span class="hint">Next: Clinic East referrals live</span></div>
      <div class="row panel stage-row"><div><strong>Eligibility verification</strong><span class="hint">Already a step inside referrals.</span></div>${stagePill("Planned")}<a href="#/spec/eligibility" class="hint-link">Spec →</a></div>
      <div class="row panel stage-row"><div><strong>Denials</strong><span class="hint">Denied cases land here today with reasons logged.</span></div>${stagePill("Planned")}<a href="#/spec/denials" class="hint-link">Spec →</a></div>
    </div>
    `;
}

/* ------------------------------------------------------------------ */
/* Spec pages                                                          */
/* ------------------------------------------------------------------ */

function renderSpec(id) {
  const spec = SPECS[id];
  const wfId = id === "denials" ? "denials" : "eligibility";
  if (!spec) { $("#view-spec").innerHTML = `<div class="empty-state panel">Spec not found.</div>`; return; }
  $("#view-spec").innerHTML = `
    <a class="back-link" href="#/home">← Back to workflows</a>
    <header class="case-head">
      <div>
        <p class="eyebrow">Workflow · ${esc(spec.wf)} · ${stagePill(spec.stage)}</p>
        <h1 class="page-title">One-page spec</h1>
        <p class="page-sub">${esc(spec.summary)}</p>
      </div>
    </header>
    <div class="spec-grid">
      <section class="panel">
        <h2 class="section-heading">Why next</h2>
        <p>${esc(spec.why)}</p>
        <h2 class="section-heading">What we reuse</h2>
        <ul class="check-list">${spec.reuse.map((x) => `<li><span class="check" aria-hidden="true">✓</span>${esc(x)}</li>`).join("")}</ul>
        <h2 class="section-heading">Practice-specific pieces</h2>
        <ul class="check-list custom-list">${spec.custom.map((x) => `<li><span class="gear" aria-hidden="true">⚙</span>${esc(x)}</li>`).join("")}</ul>
        <h2 class="section-heading">Open questions</h2>
        <ul class="question-list">${spec.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>
        <h2 class="section-heading">First milestone</h2>
        <p>${esc(spec.milestone)}</p>
      </section>
      ${spec.draftOutline ? `
      <aside class="panel">
        <h2 class="section-heading">Draft appeal outline — staged</h2>
        <p class="hint">What the ${esc(spec.wf)} workflow would start with, sketched so the staged card is not a dead link.</p>
        <ol class="how-list">
          ${spec.draftOutline.map((s) => `<li>${esc(s)}</li>`).join("")}
        </ol>
      </aside>` : ""}
      <div class="spec-cta panel">
        <p class="hint">This card exists so Planned tiles open something real — the Expand PM owns whether this workflow ships next.</p>
        <a class="button button-secondary" href="#/home">Back to workflows</a>
        ${wfId === "denials" ? `<button class="button button-quiet" id="spec-demo-denial" type="button">See a denied case →</button>` : ""}
      </div>
    </div>`;
  const btn = $("#spec-demo-denial");
  if (btn) btn.addEventListener("click", () => {
    const denied = state.paCases.find((c) => c.status === "denied");
    if (denied) go("#/case/pa/" + encodeURIComponent(denied.id));
  });
}

/* ------------------------------------------------------------------ */
/* Demo bar — simulated outside world                                  */
/* ------------------------------------------------------------------ */

function renderDemoBar(r) {
  const demo = state.demo;
  const portalBtn = $("#demo-portal");
  portalBtn.dataset.portal = demo.portalDown ? "up" : "down";
  portalBtn.textContent = demo.portalDown ? "Payer portal: outage ON (click to restore)" : "Payer portal: simulate outage";
  portalBtn.classList.toggle("demo-btn-danger", demo.portalDown);

  const target = demo.lastSubmittedId ? paCase(demo.lastSubmittedId) : null;
  const approveBtn = $("#demo-approve");
  const denyBtn = $("#demo-deny");
  approveBtn.disabled = !target;
  denyBtn.disabled = !target;
  $("#demo-hint").textContent = target
    ? `Next simulated payer response applies to ${target.id} (${target.patient}, ${target.service}).`
    : "Submit a case first — the next simulated payer response will apply to it. These buttons never touch a real payer.";

  fitBodyPadding();
}

function fitBodyPadding() {
  const bar = document.querySelector(".demo-bar");
  const collapsed = document.querySelector("#demo-bar-body").classList.contains("demo-bar-closed");
  document.body.style.paddingBottom = (bar.offsetHeight + (collapsed ? 4 : 14)) + "px";
}

function bindDemoBar() {
  $("#demo-toggle").addEventListener("click", () => {
    const open = $("#demo-bar-body").classList.toggle("demo-bar-closed");
    $("#demo-toggle").setAttribute("aria-expanded", String(!open));
    $("#demo-toggle").textContent = open ? "Expand" : "Minimize";
    document.body.classList.toggle("demo-bar-open", !open);
    touchClick();
    fitBodyPadding();
  });
  $("#demo-portal").addEventListener("click", () => {
    state.demo.portalDown = !state.demo.portalDown;
    touchClick();
    persist();
    renderDemoBar(route());
    toast(state.demo.portalDown ? "Payer portal outage simulated — submissions will fail and escalate." : "Portal restored — submissions flow again.", "warn");
  });
  $("#demo-approve").addEventListener("click", () => payerRespond("approved"));
  $("#demo-deny").addEventListener("click", () => payerRespond("denied"));
  $("#demo-reset").addEventListener("click", () => {
    openModal(`
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="rs-title">
        <h2 id="rs-title" class="modal-title">Reset the demo?</h2>
        <p class="modal-note">Everything returns to the seed data. Session counters and this session's audit entries are cleared.</p>
        <div class="modal-actions">
          <button id="rs-cancel" class="button button-quiet" type="button">Cancel</button>
          <button id="rs-confirm" class="button button-primary" type="button">Reset to seed</button>
        </div>
      </div>`);
    $("#rs-cancel").addEventListener("click", closeModal);
    $("#rs-confirm").addEventListener("click", () => { resetDemo(); closeModal(); });
  });
  $("#footer-reset").addEventListener("click", () => $("#demo-reset").click());
}

function payerRespond(kind) {
  if (busy) return;
  const id = state.demo.lastSubmittedId;
  const c = paCase(id);
  if (!c) { toast("No case is waiting on a payer response.", "warn"); return; }
  busy = true;
  touchClick();
  toast("Simulating payer response…", "info");
  setTimeout(() => {
    busy = false;
    const when = fmtNow();
    if (kind === "approved") {
      c.status = "approved";
      c.history.push({ t: when, actor: c.payer, action: "Payer response: Approved (synthetic)", detail: "Demo control simulated the payer decision." });
      logAudit(c.payer, "Payer response: Approved", c.id + " — simulated via demo control.", id, "pa");
    } else {
      c.status = "denied";
      c.history.push({ t: when, actor: c.payer, action: "Payer response: Denied (synthetic)", detail: "Not medically necessary: record did not fully support the requested service at review time. Demo control simulated the decision." });
      logAudit(c.payer, "Payer response: Denied", c.id + " — reason logged; appeal workflow staged.", id, "pa");
      state.demo.lastDeniedId = id;
    }
    state.demo.lastSubmittedId = null;
    state.session.processed++;
    persist();
    render();
    toast(kind === "approved" ? c.id + " approved (synthetic). Audit log updated — case closed." : c.id + " denied (synthetic). Start appeal opens the staged Denials spec.", kind === "approved" ? "ok" : "warn");
  }, 900);
}

function resetDemo() {
  state = freshSeed();
  persist();
  render();
  toast("Demo reset to seed data.", "info");
}

/* ------------------------------------------------------------------ */
/* Modal + toast                                                       */
/* ------------------------------------------------------------------ */

function openModal(html) {
  $("#modal-root").innerHTML = `<div class="modal-overlay">${html}</div>`;
  document.addEventListener("keydown", escKey);
}

function closeModal() {
  $("#modal-root").innerHTML = "";
  document.removeEventListener("keydown", escKey);
}

function escKey(e) {
  if (e.key === "Escape") closeModal();
}

let toastTimer;
function toast(message, kind = "") {
  const el = $("#toast");
  el.textContent = message;
  el.className = "toast toast-visible" + (kind ? " toast-" + kind : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = "toast"; }, 4200);
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => {
  bindDemoBar();
  render();
});