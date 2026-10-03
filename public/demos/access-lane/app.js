/* Access Lane console — Squad Health founding PM prototype.
   Vanilla JS, no build step, no backend, no model calls. Every number is
   synthetic and labeled on screen. State lives in localStorage; the reset
   button returns to the seed data. */

"use strict";

/* ---------------------------------------------------------------- state --- */

const STORAGE_KEY = "accessLaneStateV1";
const STAFF = "Staff 02 (MA)";
const AGENT = "Agent";

const seedStamp = SEED.updatedAt;

function freshState() {
  return {
    v: 1,
    seedStamp,
    cases: SEED.cases.map(deepCopy),
    filters: { clinic: "all", prescriber: "all", stage: "all" },
    view: "dashboard",
    activeCaseId: null,
    activeStep: "benefits",
    walkthrough: { active: false, idx: 0 },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const s = JSON.parse(raw);
    if (!s || s.v !== 1 || s.seedStamp !== seedStamp) return freshState();
    return s;
  } catch (e) {
    return freshState();
  }
}

let state = loadState();
let autoVerifyTimer = null;

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
}

function deepCopy(x) { return JSON.parse(JSON.stringify(x)); }

function caseById(id) { return state.cases.find((c) => c.id === id) || null; }
function payerOf(c) { return SEED.payers.find((p) => p.id === c.payerId) || SEED.payers[0]; }
function programById(id) { return SEED.programs.find((p) => p.id === id); }
function phxById(id) { return SEED.pharmacies.find((p) => p.id === id); }

/* ---------------------------------------------------------- utilities --- */

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

function fmtTime(ts) {
  const d = new Date(ts);
  let h = d.getHours(); const m = String(d.getMinutes()).padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
  return h + ":" + m + " " + ap;
}
function fmtDay(ts) {
  const d = new Date(ts); const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return (sameDay ? "Today " : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " ") + fmtTime(ts);
}
function fmtDate(ts) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function daysFromNow(ts) {
  return Math.max(1, Math.round((ts - Date.now()) / 86400e3));
}
function escMoney(n) {
  return n == null ? "—" : "$" + n.toLocaleString("en-US");
}

function log(c, actor, text, at) {
  c.log.unshift({ at: at || Date.now(), actor, text });
}

/* ------------------------------------------------------------- journey --- */

/* The rail is derived from case state, so every action moves it. */
const RAIL_STEPS = [
  { id: "order", label: "Order" },
  { id: "benefits", label: "Benefits" },
  { id: "priorAuth", label: "Prior auth" },
  { id: "appeal", label: "Appeal" },
  { id: "assistance", label: "Assistance" },
  { id: "pharmacy", label: "Pharmacy" },
  { id: "onTherapy", label: "On therapy" },
];

function paOpenItems(c) {
  if (!c.pa || c.pa.status !== "draft") return [];
  return (c.pa.criteria || []).filter((cr) => cr.det === "cant-tell" && !cr.confirmedBy);
}

function appealOpenItems(c) {
  if (!c.appeal || c.appeal.status !== "draft") return [];
  return (c.appeal.points || []).filter((pt) => !pt.reviewedBy);
}

function deriveJourney(c) {
  const j = {};
  j.order = "done";
  const b = c.benefits || { status: "pending" };
  j.benefits = b.status === "verified" ? "done"
    : b.status === "inactive" ? "needs-input"
    : b.status === "error" ? "blocked"
    : b.status === "checking" ? "working" : "working";
  if (!c.pa) {
    j.priorAuth = j.benefits === "done" ? "working" : "pending";
  } else if (c.pa.status === "approved") {
    j.priorAuth = "done";
  } else if (c.pa.status === "denied") {
    j.priorAuth = "done";
  } else if (c.pa.status === "submitted") {
    j.priorAuth = "working";
  } else {
    j.priorAuth = paOpenItems(c).length ? "needs-input" : "working";
  }
  j.appeal = !c.appeal ? "skipped"
    : c.appeal.status === "approved" ? "done"
    : c.appeal.status === "submitted" ? "working"
    : appealOpenItems(c).length ? "needs-input" : "working";
  const a = c.assistance;
  j.assistance = !a ? (c.pa && c.pa.status === "approved" ? "working" : "pending")
    : a.status === "enrolled" ? "done"
    : a.status === "pending-eligibility" ? "working" : "working";
  const p = c.pharmacy;
  j.pharmacy = !p ? (a && a.status === "enrolled" ? "working" : "pending")
    : (p.status === "done" || p.status === "routed") ? "done" : "working";
  j.onTherapy = c.onTherapy ? "done" : (j.pharmacy === "done" ? "working" : "pending");
  return j;
}

const RAIL_LABELS = {
  done: "Done", working: "Working", "needs-input": "Input needed", blocked: "Blocked",
  skipped: "Not needed", pending: "Waiting",
};

/* ------------------------------------------------------ dashboard --------- */

const STAGE_FILTERS = [
  { id: "all", label: "All cases", test: () => true },
  { id: "new", label: "New orders", test: (c) => Date.now() - c.createdAt < 7 * 86400e3 && deriveJourney(c).benefits !== "done" },
  { id: "needs-input", label: "Needs input", test: (c) => Object.values(deriveJourney(c)).includes("needs-input") },
  { id: "benefits", label: "Benefits", test: (c) => ["working", "blocked"].includes(deriveJourney(c).benefits) },
  { id: "pa", label: "Prior auth", test: (c) => ["draft", "submitted"].includes(c.pa && c.pa.status) },
  { id: "appeal", label: "Appeal", test: (c) => ["draft", "submitted"].includes(c.appeal && c.appeal.status) },
  { id: "assistance", label: "Assistance", test: (c) => c.assistance && c.assistance.status !== "enrolled" || (c.pa && c.pa.status === "approved" && !c.assistance) },
  { id: "pharmacy", label: "Pharmacy", test: (c) => ["working"].includes(deriveJourney(c).pharmacy) },
  { id: "therapy", label: "On therapy", test: (c) => !!c.onTherapy },
  { id: "blocked", label: "Blocked", test: (c) => Object.values(deriveJourney(c)).includes("blocked") },
];

function filteredCases() {
  const f = state.filters;
  const stage = STAGE_FILTERS.find((s) => s.id === f.stage) || STAGE_FILTERS[0];
  return state.cases.filter((c) =>
    (f.clinic === "all" || c.clinic === f.clinic) &&
    (f.prescriber === "all" || c.prescriber === f.prescriber) &&
    stage.test(c)
  );
}

function statsFor(list) {
  const jAll = list.map(deriveJourney);
  const newOrders = list.filter((c) => Date.now() - c.createdAt < 7 * 86400e3 && jAll[list.indexOf(c)].benefits !== "done").length;
  const needYou = jAll.filter((j) => Object.values(j).includes("needs-input")).length;
  const inFlightPa = list.filter((c) => ["draft", "submitted"].includes(c.pa && c.pa.status)).length;
  const appeals = list.filter((c) => ["draft", "submitted"].includes(c.appeal && c.appeal.status)).length;
  const onTherapy = list.filter((c) => !!c.onTherapy).length;
  const medians = list.filter((c) => c.onTherapy).map((c) => (c.onTherapy.startedAt - c.createdAt) / 86400e3).sort((a, b) => a - b);
  const median = medians.length ? medians[Math.floor(medians.length / 2)] : null;
  return { newOrders, needYou, inFlightPa, appeals, onTherapy, median };
}

function renderStats(list) {
  const s = statsFor(list);
  const strip = $("#stat-strip");
  const cards = [
    { k: s.newOrders, t: "New orders this week", n: "synthetic", filter: "new" },
    { k: s.needYou, t: "Cases needing input", n: "synthetic", filter: "needs-input" },
    { k: s.inFlightPa, t: "In-flight prior auths", n: "synthetic", filter: "pa" },
    { k: s.appeals, t: "Appeals active", n: "synthetic", filter: "appeal" },
    { k: s.onTherapy, t: "Patients on therapy", n: "synthetic", filter: "therapy" },
    { k: s.median == null ? "—" : s.median.toFixed(1) + " d", t: "Median order → therapy", n: "synthetic", filter: null },
  ];
  strip.innerHTML = cards.map((c) =>
    `<div class="stat${c.filter ? " inline-click" : ""}" data-action="stat-filter" data-filter="${c.filter || ""}" role="button" tabindex="0">
      <b>${esc(String(c.k))}</b><span>${esc(c.t)}</span><span class="stat-note">${esc(c.n)}</span>
    </div>`).join("");
}

function renderFilters() {
  const clinics = ["all", ...new Set(state.cases.map((c) => c.clinic))].sort();
  const prescribers = ["all", ...new Set(state.cases.map((c) => c.prescriber))].sort();
  $("#filter-clinic").innerHTML = clinics.map((cl) =>
    `<option value="${esc(cl)}"${cl === state.filters.clinic ? " selected" : ""}>${cl === "all" ? "All locations" : esc(cl)}</option>`).join("");
  $("#filter-prescriber").innerHTML = prescribers.map((p) =>
    `<option value="${esc(p)}"${p === state.filters.prescriber ? " selected" : ""}>${p === "all" ? "All prescribers" : esc(p)}</option>`).join("");
  $("#filter-stage").innerHTML = STAGE_FILTERS.map((s) =>
    `<option value="${esc(s.id)}"${s.id === state.filters.stage ? " selected" : ""}>${esc(s.label)}</option>`).join("");
}

function stageOfCase(c) {
  const j = deriveJourney(c);
  if (Object.values(j).includes("needs-input")) return "needs input";
  if (j.benefits === "blocked") return "blocked";
  if (c.pa && ["draft", "submitted"].includes(c.pa.status)) return c.pa.status === "draft" ? "PA draft" : "PA submitted";
  if (c.appeal && ["draft", "submitted"].includes(c.appeal.status)) return c.appeal.status === "draft" ? "appeal draft" : "appeal filed";
  if (c.assistance && c.assistance.status !== "enrolled" && c.assistance.status !== "pending-eligibility" || (c.pa && c.pa.status === "approved" && !c.assistance)) return "assistance";
  if (j.pharmacy === "working") return "pharmacy";
  if (j.onTherapy === "working") return "awaiting first fill";
  if (c.onTherapy) return "on therapy";
  if (j.benefits === "working") return "benefits";
  return "working";
}

function renderCaseList(list) {
  const el = $("#case-list");
  const empty = $("#case-empty");
  if (!list.length) {
    el.innerHTML = "";
    const needsInputFilter = state.filters.stage === "needs-input";
    empty.classList.remove("hidden");
    $("h2", empty).textContent = needsInputFilter
      ? "No cases need you right now"
      : "No cases match these filters";
    $("p", empty).textContent = needsInputFilter
      ? "Everything is moving. New orders land here when they arrive, and the console auto-follows up on anything a payer has gone quiet on."
      : "Try clearing the location or prescriber filter to see the full list.";
    return;
  }
  empty.classList.add("hidden");
  el.innerHTML = list.map((c) => {
    const j = deriveJourney(c);
    const stepNow = RAIL_STEPS.find((s) => j[s.id] === "working" || j[s.id] === "needs-input" || j[s.id] === "blocked");
    const stateNow = stepNow ? RAIL_LABELS[j[stepNow.id]] : (c.onTherapy ? "On therapy" : "Complete");
    const tag = c.id === "C-1042" ? "walkthrough case" : c.gap ? "coverage gap" : "";
    const needDot = Object.values(j).includes("needs-input") ? `<span class="pill pill-warn">Input needed</span>`
      : Object.values(j).includes("blocked") ? `<span class="pill pill-bad">Blocked</span>` : `<span class="pill">${esc(stateNow)}</span>`;
    return `<button class="case-card" type="button" data-action="open-case" data-id="${esc(c.id)}" aria-label="Open case ${esc(c.id)} for ${esc(c.patient)}">
      <div class="case-card-top">
        <span class="case-card-id trunc" title="Tap to expand">${esc(c.id)} · ${esc(c.clinic)}</span>
        <span class="case-type-tag${c.hero ? " hero-tag" : ""}">${tag ? esc(tag) : "&nbsp;"}</span>
      </div>
      <div>
        <div class="case-card-patient">${esc(c.patient)} — ${esc(c.drug.name)}</div>
        <div class="case-card-drug">${esc(c.drug.cls)} · ${esc(c.drug.disease)}</div>
      </div>
      <div class="case-card-meta">
        <span>${esc(c.prescriber)}</span><span>${esc(payerOf(c).name)}</span>
      </div>
      <div class="case-card-foot">${needDot}</div>
    </button>`;
  }).join("");
  $("#result-count").textContent =
    `${list.length} of ${state.cases.length} cases shown` + (state.filters.clinic !== "all" || state.filters.prescriber !== "all" || state.filters.stage !== "all" ? " · filters active" : " · synthetic working day");
}

function renderDashboard() {
  state.view = "dashboard";
  $("#dashboard-view").classList.remove("hidden");
  $("#case-view").classList.add("hidden");
  renderFilters();
  const list = filteredCases();
  renderStats(list);
  renderCaseList(list);
}

/* ------------------------------------------------------------ case view --- */

function openCase(id, { startGuide = false } = {}) {
  const c = caseById(id);
  if (!c) return;
  if (startGuide) state.walkthrough = { active: true, idx: 0 };
  state.activeCaseId = id;
  state.activeStep = "benefits";
  state.view = "case";
  $("#dashboard-view").classList.add("hidden");
  $("#case-view").classList.remove("hidden");
  renderCaseView();
  maybeAutoVerify(c);
  tickGuide(c);
}

function maybeAutoVerify(c) {
  const b = c.benefits || {};
  if (b.status !== "pending" || autoVerifyTimer) return;
  b.status = "checking";
  log(c, AGENT, "Eligibility check running against " + payerOf(c).name + " (simulated).", Date.now());
  save(); renderCaseView();
  autoVerifyTimer = setTimeout(() => {
    autoVerifyTimer = null;
    const p = payerOf(c);
    Object.assign(b, {
      status: "verified",
      lastVerified: Date.now(),
      plan: { name: p.planName, active: true },
      benefitType: p.benefitType, paRequired: p.paRequired, stepTherapy: p.stepTherapy,
      deductibleLeft: 4200, oopLeft: 8000, estPatientCost: 950, estPatientCostAfterHelp: null,
      estimateNote: "Estimated patient cost before assistance. Copay card drops it to the savings-card level when enrolled (synthetic).",
      sources: { plan: "eligibility check · simulated", doc: "plan document · simulated", call: "call note · simulated" },
    });
    log(c, AGENT, c.hero ? "Benefits verified: covered, PA required, step therapy set. Estimated cost before help is high (synthetic)."
      : "Benefits verified for " + p.name + " (synthetic).");
    if (c.hero) {
      c.pa = heroPaDraft();
    } else {
      c.pa = {
        status: "draft", policyId: p.policy.id, policyTitle: p.policy.title,
        criteria: [
          { id: "B-1", text: "Diagnosis established by a specialist.", det: "met", citation: null, confirmedBy: null },
          { id: "B-2", text: "Documented trial of standard therapy.", det: "met", citation: null, confirmedBy: null },
          { id: "B-3", text: "Severity documented at baseline.", det: "met", citation: null, confirmedBy: null },
          { id: "B-4", text: "No contraindications.", det: "met", citation: null, confirmedBy: null },
        ],
        payerNote: null, submittedAt: null,
      };
      log(c, AGENT, "Prior authorization draft started from " + p.policy.id + ".");
    }
    save(); renderCaseView();
    tickGuide(c);
  }, 950);
}

function heroPaDraft() {
  return {
    status: "draft",
    policyId: "PN-AD-12",
    policyTitle: "Biologics for Atopic Dermatitis — Payer North policy PN-AD-12 (synthetic)",
    payerNote: "Payer North preference: step-therapy history must be shown as dated chart excerpts. Surfaced requirement posted to the draft (synthetic).",
    criteria: SEED.heroCriteriaTemplate.map((c) => ({
      ...c,
      citation: c.citation ? { ...c.citation } : null,
      resolution: c.resolution ? { ...c.resolution, citation: c.resolution.citation ? { ...c.resolution.citation } : null } : null,
      confirmedBy: null,
      resolvedLog: null,
    })),
    submittedAt: null,
  };
}

function renderCaseView() {
  const c = caseById(state.activeCaseId);
  if (!c) { renderDashboard(); return; }
  const p = payerOf(c);
  $("#case-title").textContent = c.id + " · " + c.patient + " · " + c.drug.name;
  $("#case-sub").textContent =
    `${c.clinic} · ${c.prescriber} · ${p.name} — ${c.drug.cls} · ${c.drug.disease}. All case data is synthetic.`;
  const j = deriveJourney(c);
  const need = Object.values(j).includes("needs-input");
  const blocked = Object.values(j).includes("blocked");
  let pill = `<span class="pill">${esc(stageOfCase(c))}</span>`;
  if (need) pill += `<span class="pill pill-warn">Input needed</span>`;
  if (blocked) pill += `<span class="pill pill-bad">Blocked</span>`;
  $("#case-pill").innerHTML = pill;

  /* journey rail */
  $("#journey-rail").innerHTML = RAIL_STEPS.map((s) => {
    const st = j[s.id];
    const active = state.activeStep === s.id && st !== "skipped";
    return `<button class="rail-step ${esc(st)}${active ? " active" : ""}" type="button" data-action="jump-step" data-step="${esc(s.id)}" aria-label="${esc(RAIL_LABELS[st])} — ${esc(s.label)}">
      <span class="rail-dot" aria-hidden="true"></span>
      <span>${esc(s.label)}</span>
      <span class="rail-state">${esc(RAIL_LABELS[st])}</span>
      <span class="rail-num">${esc(c.id)}</span>
    </button>`;
  }).join("");

  renderWalkthroughGuide(c, j);
  renderStepPanels(c, j);
  renderActivity(c);
  renderDemoControls(c, j);
}

/* ----------------------------------------------------- walkthrough guide --- */

const GUIDE = [
  {
    t: "Step 1 of 7 · Benefits auto-check",
    d: "The order is in. The agent is running the eligibility check against Payer North — results land in a moment.",
    detect: (c) => (c.benefits || {}).status === "verified",
  },
  {
    t: "Step 2 of 7 · Benefits verified",
    d: "Covered, PA required, step therapy set — and the estimated cost is high (synthetic). Open Prior auth to review the draft.",
    detect: (c) => state.activeStep === "priorAuth" && paOpenItems(c).length > 0,
  },
  {
    t: "Step 3 of 7 · Resolve the open item",
    d: "4 of 5 criteria are met. One is can't tell: the failed topical therapy dates are missing. Tap “Add dates from chart note” on criterion A-2.",
    detect: (c) => paOpenItems(c).length === 0,
  },
  {
    t: "Step 4 of 7 · Confirm and submit",
    d: "Every open item is confirmed. Review and submit the PA under Provider 07's signature (simulated).",
    detect: (c) => c.pa && c.pa.status === "submitted",
  },
  {
    t: "Step 5 of 7 · Payer reply",
    d: "The PA is out. Simulate the payer: approve the request from the demo controls.",
    detect: (c) => c.pa && c.pa.status === "approved",
  },
  {
    t: "Step 6 of 7 · Affordability",
    d: "Approved — and this is where patients usually drop off. The copay card matched. Check the consent box and enroll.",
    detect: (c) => c.assistance && c.assistance.status === "enrolled",
  },
  {
    t: "Step 7 of 7 · Pharmacy routing",
    d: "Last leg: route to the payer-preferred specialty pharmacy so the drug actually ships.",
    detect: (c) => c.pharmacy && c.pharmacy.status === "routed",
  },
  {
    t: "Walkthrough complete",
    d: "Ready to dispense — one prescription moved through benefits, prior auth, assistance, and pharmacy on one case. That's the whole journey, not one form.",
    detect: () => false,
  },
];

function renderWalkthroughGuide(c, j) {
  const el = $("#walkthrough-guide");
  const w = state.walkthrough;
  if (!w.active || !c.hero) { el.classList.add("hidden"); return; }
  const step = GUIDE[Math.min(w.idx, GUIDE.length - 1)];
  el.classList.remove("hidden");
  el.innerHTML = `
    <button class="wt-close" type="button" data-action="wt-close" aria-label="Close walkthrough guide">✕ Close</button>
    <p class="wt-kicker">90-second walkthrough · synthetic</p>
    <p class="wt-step">${esc(step.t)}</p>
    <p class="wt-detail">${esc(step.d)}</p>`;
}

function tickGuide(c) {
  const w = state.walkthrough;
  if (!w.active || !c) return;
  const step = GUIDE[Math.min(w.idx, GUIDE.length - 1)];
  if (step.detect(c)) {
    w.idx += 1;
    save(); renderWalkthroughGuide(c, deriveJourney(c));
    if (w.idx < GUIDE.length) {
      toast("Walkthrough · " + GUIDE[w.idx].t.replace(/Step \d+ of \d+ · /, ""));
    }
  }
}

/* --------------------------------------------------------- step panels ---- */

function renderStepPanels(c, j) {
  const order = [];
  if (j.order !== "pending") order.push(stepBlock("order", "Order", stepLine(j.order), renderOrder(c)));
  order.push(stepBlock("benefits", "Benefits verification", stepLine(j.benefits), renderBenefits(c)));
  if (j.priorAuth !== "pending" || c.pa) order.push(stepBlock("priorAuth", "Prior authorization", stepLine(j.priorAuth), renderPA(c)));
  if (c.appeal) order.push(stepBlock("appeal", "Appeal", stepLine(j.appeal), renderAppeal(c)));
  if (j.assistance !== "pending" || c.assistance) order.push(stepBlock("assistance", "Financial assistance", stepLine(j.assistance), renderAssistance(c)));
  if (j.pharmacy !== "pending" || c.pharmacy) order.push(stepBlock("pharmacy", "Pharmacy routing", stepLine(j.pharmacy), renderPharmacy(c)));
  if (c.onTherapy || j.onTherapy === "working") order.push(stepBlock("onTherapy", "On therapy", stepLine(j.onTherapy), renderOnTherapy(c)));

  /* desktop tabs: show only the active step; phone: same, rail jumps */
  const visible = order.map((o) => o.id === state.activeStep ? o.html : "").join("");
  $("#step-panels").innerHTML = visible || order.map((o) => o.html).join("");
}

function stepBlock(id, title, line, bodyHtml) {
  return {
    id,
    html: `<section class="step-block" data-step-block="${esc(id)}" aria-labelledby="h-${esc(id)}">
      <h2 id="h-${esc(id)}">${esc(title)}</h2>
      ${line ? `<p class="step-state-line">${line}</p>` : ""}
      ${bodyHtml}
    </section>`,
  };
}

function stepLine(st) {
  const map = {
    done: `<span class="pill pill-ok">Complete</span>`,
    working: `<span class="pill pill-blue">Working</span>`,
    "needs-input": `<span class="pill pill-warn">Input needed</span>`,
    blocked: `<span class="pill pill-bad">Blocked</span>`,
    pending: `<span class="pill pill-quiet">Waiting</span>`,
    skipped: `<span class="pill pill-quiet">Not needed for this case</span>`,
  };
  return map[st] || "";
}

function renderOrder(c) {
  return `<p class="benefit-note">Rx received ${fmtDay(c.createdAt)} via EMR (fax simulation). Case opened automatically — no one typed a thing.</p>`;
}

/* ----------------------------------------------------- benefits panel ----- */

function benefitCell(k, v, source) {
  return `<div class="benefit-cell">
    <span class="k">${esc(k)}</span>
    <span class="v">${v}</span>
    ${source ? `<span class="source-chip">${esc(source)} <span class="src-sim">· simulated</span></span>` : ""}
  </div>`;
}

function renderBenefits(c) {
  const b = c.benefits || { status: "pending" };
  const p = payerOf(c);
  if (b.status === "checking") {
    return `<div class="info-banner"><p><strong style="color:var(--blue)">Checking eligibility…</strong> Simulated eligibility check against ${esc(p.name)} running now.</p></div>`;
  }
  if (b.status === "error") {
    const e = b.error || {};
    return `<div class="error-banner">
      <strong>Payer portal unavailable — eligibility check failed</strong>
      <p><strong>What failed:</strong> ${esc(e.what || "Portal timeout")}</p>
      <p><strong>What the system will do:</strong> ${esc(e.system || "Retry scheduled.")}</p>
      <p><strong>What you should do:</strong> ${esc(e.person || "Nothing yet.")}</p>
      <button class="button button-secondary" type="button" data-action="retry-benefits" style="margin-top:12px">Retry eligibility now (simulated)</button>
    </div>`;
  }
  if (b.status === "inactive") {
    return `<div class="error-banner">
      <strong>Coverage check returned: plan inactive</strong>
      <p>${esc(b.plan.note || "")}</p>
      <p><strong>What you should do:</strong> confirm current insurance with the patient, then re-run the check.</p>
      <button class="button button-secondary" type="button" data-action="confirm-insurance" style="margin-top:12px">Confirm new insurance with patient (simulated)</button>
    </div>
    ${b.lastVerified ? `<p class="benefit-note">Last verified ${fmtDay(b.lastVerified)} · synthetic.</p>` : ""}`;
  }
  if (b.status === "verified") {
    const src = b.sources || { plan: "eligibility check · simulated", doc: "plan document · simulated", call: "call note · simulated" };
    const costAfter = b.estPatientCostAfterHelp;
    return `<div class="benefit-grid">
      ${benefitCell("Plan", esc(b.plan.name || p.planName), src.plan + (b.plan && b.plan.active === false ? " · inactive" : ""))}
      ${benefitCell("Plan status", `<span class="pill ${b.plan && b.plan.active === false ? "pill-bad" : "pill-ok"}">${b.plan && b.plan.active === false ? "Inactive" : "Active"}</span>`, src.plan)}
      ${benefitCell("Benefit type", b.benefitType === "medical" ? "Medical benefit" : "Pharmacy benefit", src.doc)}
      ${benefitCell("Prior authorization", b.paRequired ? "Required" : "Not required", src.doc)}
      ${benefitCell("Step therapy", b.stepTherapy ? "Flag set" : "No flag", src.doc)}
      ${benefitCell("Deductible remaining", `<span class="amount">${escMoney(b.deductibleLeft)}</span>`, src.plan)}
      ${benefitCell("Out-of-pocket remaining", `<span class="amount">${escMoney(b.oopLeft)}</span>`, src.plan)}
      ${benefitCell("Estimated patient cost (before help)", `<span class="amount">${escMoney(b.estPatientCost)}</span>`, src.call)}
      ${benefitCell("Estimated cost with assistance", `<span class="amount">${costAfter != null ? escMoney(costAfter) : "—"}</span>`, costAfter != null ? "program match · simulated" : "")}
    </div>
    <p class="benefit-note">${esc(b.estimateNote || "")}</p>
    <p class="benefit-note">Last verified ${fmtDay(b.lastVerified)}. Every value above carries its source — eligibility check, plan document, or call note (all simulated).</p>`;
  }
  return `<div class="info-banner"><p>Waiting for the eligibility check to run.</p></div>`;
}

/* -------------------------------------------------------- PA panel -------- */

function renderPA(c) {
  const pa = c.pa;
  if (!pa) return `<div class="info-banner"><p>Prior authorization starts automatically once benefits are verified.</p></div>`;
  const p = payerOf(c);
  let html = `<p class="benefit-note"><strong>${esc(pa.policyId)}</strong> — ${esc(pa.policyTitle || p.policy.title)}</p>`;
  if (pa.payerNote) html += `<div class="info-banner"><p><strong>Surfaced requirement:</strong> ${esc(pa.payerNote)}</p></div>`;

  if (pa.status === "submitted") {
    html += `<div class="submitted-state"><strong>Submitted to ${esc(p.name)}</strong>Submitted ${fmtDay(pa.submittedAt || Date.now())} under ${esc(c.prescriber)}'s signature (simulated). Turnaround clock running — follow-up auto-planned for ${fmtDate(Date.now() + (pa.followUpDays || 4) * 86400e3)} if no reply.</div>`;
    html += criteriaList(pa);
    return html;
  }
  if (pa.status === "approved") {
    html += `<div class="submitted-state" style="border-color:rgba(15,138,95,.5);background:var(--ok-bg)"><strong style="color:var(--ok)">Approved by ${esc(p.name)}</strong>${pa.approvedAt ? "Decision received " + fmtDay(pa.approvedAt) : "Decision received (simulated)"}. The case now moves to affordability.</div>`;
    return html;
  }
  if (pa.status === "denied") {
    return html + `<div class="error-banner"><strong>Denied by ${esc(p.name)}</strong><p>Stated reason: <strong>${esc(pa.deniedReason || "Medical necessity criteria not met")}</strong>. The denial letter was read automatically; the appeal draft is ready on the Appeal step.</p></div>
      <button class="button button-secondary" type="button" data-action="jump-step" data-step="appeal">Open appeal workspace</button>`;
  }

  /* draft: review-required, criteria, gate */
  html += `<div class="review-banner"><strong>Review required</strong><p>This draft is agent-written. Every claim carries the chart passage it came from — or is marked can't tell. Nothing goes out under ${esc(c.prescriber)}'s signature until a named staff member clears the open items.</p></div>`;
  html += criteriaList(pa);
  const open = paOpenItems(c);
  const gateState = open.length ? "locked" : "ready";
  html += `<div class="gate">
    <h3>Submit gate — ${gateState === "locked" ? open.length + " open item" + (open.length > 1 ? "s" : "") : "all items confirmed"}</h3>
    ${open.length ? `<ul class="gate-open-list">${open.map((o) => `<li>${esc(o.id)} — ${esc(o.text)} <em>(can't tell: ${esc(o.note || "no passage found in the record")})</em></li>`).join("")}</ul>
      <p>A named staff member must confirm or resolve every can't-tell before this can go out. Early submits are blocked — the draft is not complete evidence.</p>`
    : `<p>Every open item is confirmed by a named staff member. The draft is ready to go out.</p>`}
    <div class="submit-confirm-note">Going out as: <strong>${esc(c.prescriber)}</strong> (prescriber of record) → ${esc(p.name)} · simulated transmission.</div>
    <button class="button ${gateState === "locked" ? "button-quiet" : "button-primary"}" type="button" data-action="submit-pa" ${gateState === "locked" ? 'aria-disabled="true"' : ""}>
      ${gateState === "locked" ? "Review and submit — open items remain" : "Review and submit"}
    </button>
    ${gateState === "locked" ? `<span class="gate-hint">Tap submit to see what's still open.</span>` : ""}
  </div>`;
  return html;
}

function criteriaList(pa) {
  return (pa.criteria || []).map((cr) => {
    const detClass = { met: "det-met", "not-met": "det-not-met", "cant-tell": "det-cant-tell" }[cr.det] || "det-cant-tell";
    const detLabel = { met: "Met", "not-met": "Not met", "cant-tell": "Can't tell" }[cr.det] || "Can't tell";
    let body = "";
    if (cr.citation) {
      const doc = SEED.heroDocs.find((d) => d.id === cr.citation.doc);
      const pass = doc && doc.passages.find((pa2) => pa2.id === cr.citation.passageId);
      body += `<div class="citation"><p>“${esc(pass ? pass.text : cr.citation.passageId)}”</p><cite>— ${esc(doc ? doc.title : cr.citation.doc)} · cited passage (synthetic)</cite></div>`;
    } else if (cr.det !== "cant-tell") {
      body += `<p class="no-passage">No passage found in the chart record for this criterion (synthetic).</p>`;
    } else if (cr.det === "cant-tell") {
      body += `<p class="no-passage">No passage found for this fact in the chart: ${esc(cr.note || "the record does not document it.")}</p>`;
    }
    if (cr.det === "cant-tell" && cr.resolution) {
      if (cr.confirmedBy) {
        body += `<div class="open-item"><span class="oi-resolved">✓ Resolved — confirmed by ${esc(cr.confirmedBy)}</span>
          ${cr.resolvedLog ? `<p class="confirm-chip">${esc(cr.resolvedLog)}</p>` : ""}</div>`;
      } else {
        body += `<div class="open-item">
          <span class="oi-label">Open item — needs a named staff member</span>
          <div class="oi-actions">
            <button class="button button-secondary" type="button" data-action="resolve-criterion" data-crit="${esc(cr.id)}">${esc(cr.resolution.label)}</button>
            <button class="button button-quiet" type="button" data-action="confirm-criterion" data-crit="${esc(cr.id)}">Confirm as can't tell on record</button>
          </div>
        </div>`;
      }
    } else if (cr.det === "cant-tell" && !cr.resolution) {
      body += `<p class="no-passage">No passage found — flagged can't tell.</p>`;
    }
    return `<article class="criterion ${detClass}">
      <div class="criterion-head">
        <span><span class="criterion-id">${esc(cr.id)}</span>
        <p class="criterion-text">${esc(cr.text)}</p></span>
        <span class="det-badge ${detClass}">${detLabel}</span>
      </div>
      ${body}
    </article>`;
  }).join("");
}

/* ------------------------------------------------------- appeal panel ----- */

function renderAppeal(c) {
  const ap = c.appeal;
  const p = payerOf(c);
  if (ap.status === "submitted") {
    return `<div class="submitted-state"><strong>Appeal submitted to ${esc(p.name)}</strong>
      Submitted ${fmtDay(ap.submittedAt || Date.now())} under ${esc(c.prescriber)}'s signature (simulated) — the packet answers the stated denial reason point by point.
      Follow-up date set for <strong>${fmtDate(ap.followUpDate || Date.now() + 12 * 86400e3)}</strong>. The console will track it and escalate if it goes quiet.</div>
      <p class="benefit-note">Denial reason: ${esc(ap.denial.reason)}.</p>`;
  }
  if (ap.status === "approved") {
    return `<div class="submitted-state" style="border-color:rgba(15,138,95,.5);background:var(--ok-bg)"><strong style="color:var(--ok)">Appeal approved — coverage overturned</strong>
      Decision received ${fmtDay(ap.approvedAt || Date.now())} (simulated). Prior authorization is now in force; the case moved to assistance.</div>`;
  }
  let html = `<div class="review-banner"><strong>Review required — appeal goes out under ${esc(c.prescriber)}'s signature</strong>
    <p>The agent read the denial letter and drafted the packet below, answering the stated reason point by point with citations. A named staff member must review every point before submit.</p></div>`;
  html += `<p class="benefit-note"><strong>Denial reason:</strong> ${esc(ap.denial.reason)}</p>
    <div class="denial-card"><span class="k">Denial letter summary · synthetic</span>
      <p class="reason">${esc(ap.denial.summary)}</p>
      <blockquote class="letter-quote">${esc(ap.denial.letterExcerpt)}</blockquote>
    </div>`;
  html += `<h3 style="margin:18px 0 4px">Agent-drafted appeal packet</h3>`;
  const allReviewed = ap.points.every((pt) => pt.reviewedBy);
  html += ap.points.map((pt) => {
    let citations = "";
    if (pt.citations && pt.citations.length) {
      citations = pt.citations.map((ct) => {
        const doc = SEED.heroDocs.find((d) => d.id === ct.doc);
        const pass = doc && doc.passages.find((pa2) => pa2.id === ct.passageId);
        return `<div class="citation"><p>“${esc(pass ? pass.text : "")}”</p><cite>— ${esc(doc ? doc.title : ct.doc)} · cited passage (synthetic)</cite></div>`;
      }).join("");
    } else {
      citations = `<p class="no-passage">No passage found for this point — it carries the clinical context from the case record (synthetic).</p>`;
    }
    const status = pt.reviewedBy
      ? `<span class="pill pill-ok">Reviewed · ${esc(pt.reviewedBy)}</span>`
      : `<button class="button button-quiet" type="button" data-action="review-appeal-point" data-pt="${esc(pt.id)}">Mark reviewed</button>`;
    return `<article class="appeal-point">
      <span class="agent-drafted">Agent-drafted · answers the stated reason</span>
      <h3>${esc(pt.id)} · ${esc(pt.title)}</h3>
      <p>${esc(pt.body)}</p>
      ${citations}
      <div class="appeal-edit">
        <label for="edit-${esc(pt.id)}">Human edits (optional — changes are logged)</label>
        <textarea id="edit-${esc(pt.id)}" data-field="appeal-edit" data-pt="${esc(pt.id)}">${esc(pt.body)}</textarea>
      </div>
      <div style="margin-top:10px">${status}</div>
    </article>`;
  }).join("");
  html += `<div class="gate">
    <h3>Submit gate — ${allReviewed ? "every point reviewed" : ap.points.length + " point" + (ap.points.length > 1 ? "s" : "") + " not yet reviewed"}</h3>
    ${allReviewed ? `<p>A named staff member reviewed every point. The packet is ready to go out to ${esc(p.name)} (simulated).</p>`
      : `<p>Every point must be marked reviewed by a named staff member before the appeal can be transmitted.</p>`}
    <button class="button ${allReviewed ? "button-primary" : "button-quiet"}" type="button" data-action="submit-appeal" ${allReviewed ? "" : 'aria-disabled="true"'}>
      ${allReviewed ? "Approve and submit appeal" : "Approve and submit — review points above"}
    </button>
    <div class="submit-confirm-note">Appeal transmits as: <strong>${esc(c.prescriber)}</strong> → ${esc(p.name)} · simulated transmission. Follow-up date is set automatically.</div>
  </div>`;
  return html;
}

/* ---------------------------------------------------- assistance panel ---- */

function assistProgramsFor(c) {
  if (c.assistance && c.assistance.programs) return c.assistance.programs;
  if (c.gap) return [{ programId: "prog-bridge", matched: true }, { programId: "prog-copay", matched: false }];
  return [{ programId: "prog-copay", matched: true }, { programId: "prog-manuf", matched: false }, { programId: "prog-foundation", matched: false }];
}

function renderAssistance(c) {
  const a = c.assistance;
  if (!a || !a.programs) {
    return `<div class="info-banner"><p>Matching patient to manufacturer programs, savings cards, bridge programs, and foundation grants (synthetic criteria).</p></div>`;
  }
  const programs = assistProgramsFor(c);
  const matched = programs.filter((x) => x.matched).length;
  let html = `<p class="benefit-note">Programs matched <strong>${matched} of ${programs.length}</strong> (synthetic eligibility rules). Reference prices and limits are synthetic.</p>`;
  const heldPending = a.status === "pending-eligibility";
  html += programs.map((x) => {
    const prog = programById(x.programId);
    if (!prog) return "";
    const enrolled = (a.consents || []).some((cn) => cn.programId === prog.id);
    const pending = heldPending;
    let action = "";
    if (enrolled) {
      action = `<div class="chosen-state">✓ Enrolled — consent confirmed by ${esc((a.consents || []).find((cn) => cn.programId === prog.id).by)}</div>`;
    } else if (pending) {
      action = `<div class="enroll-row"><span class="gate-hint">Held: eligibility pending — enrollment unlocks when coverage is confirmed.</span></div>`;
    } else if (x.matched) {
      action = `
        <div class="enroll-row">
          <label><input type="checkbox" data-field="consent" data-program="${esc(prog.id)}" aria-label="Consent to enroll ${esc(prog.name)}"> I confirm the practice has the patient's consent to enroll in ${esc(prog.name)} (simulated)</label>
        </div>
        <button class="button button-primary" type="button" data-action="enroll-program" data-program="${esc(prog.id)}" aria-disabled="true">Enroll in ${esc(prog.name)}</button>
        <span class="gate-hint" data-hint="${esc(prog.id)}">Check the consent box to unlock enrollment.</span>`;
    }
    return `<article class="program-card">
      <div class="prog-top">
        <h3>${esc(prog.name)}</h3>
        <span class="pill ${x.matched ? "pill-ok" : "pill-quiet"}">${x.matched ? "Matched" : "Not matched"}</span>
      </div>
      <p class="prog-kind">${esc(prog.kind)} · ${esc(prog.programName)}</p>
      <p class="prog-reason">${x.matched ? `<strong>Eligibility reason:</strong> ${esc(prog.reason)}` : `<strong>Why not:</strong> ${esc(prog.reason)}`}</p>
      <p>Eligibility rules: ${esc(prog.eligibility)}</p>
      ${action}
    </article>`;
  }).join("");

  if (a.status === "enrolled") {
    html += `<div class="cost-compare">
      <div class="cost-box"><b>${escMoney(c.benefits && c.benefits.estPatientCost)}</b><span>Estimated cost before help (synthetic)</span></div>
      <div class="cost-box after"><b>${escMoney(c.benefits && c.benefits.estPatientCostAfterHelp)}</b><span>Estimated cost with assistance (synthetic)</span></div>
    </div>`;
    html += `<p class="benefit-note">Enrollment logged with the consenting staff member — see activity log.</p>`;
  }
  return html;
}

/* ---------------------------------------------------- pharmacy panel ----- */

function renderPharmacy(c) {
  const ph = c.pharmacy;
  if (!ph) return `<div class="info-banner"><p>Pharmacy routing starts after assistance is set — the console looks at the payer-preferred specialty pharmacy and the patient's own pharmacy.</p></div>`;
  const candidates = (ph.candidateIds || ["phx-preferred", "phx-local"]).map(phxById).filter(Boolean);
  let html = `<p class="benefit-note">${candidates.length} pharmacies evaluated for ${esc(c.patient)} (synthetic availability and delivery estimates).</p>`;
  html += candidates.map((phx) => {
    const chosen = ph.chosenId === phx.id;
    let action = "";
    if (chosen) {
      action = `<div class="chosen-state">✓ Routed here — ${esc(phx.kind)}</div>`;
    } else if (!ph.chosenId && ph.status !== "done") {
      action = `<button class="button" type="button" data-action="route-pharmacy" data-phx="${esc(phx.id)}">Route to ${esc(phx.kind)}</button>`;
    }
    return `<article class="pharmacy-card">
      <div class="prog-top">
        <h3>${esc(phx.name)}</h3>
        <span class="pill ${chosen ? "pill-ok" : "pill-quiet"}">${chosen ? "Selected" : esc(phx.kind)}</span>
      </div>
      <p>${esc(phx.note)}</p>
      <div class="phx-meta">
        <span class="pill ${phx.inNetwork ? "pill-ok" : "pill-bad"}">${phx.inNetwork ? "In network" : "Out of network"}</span>
        <span class="pill">${esc(phx.delivery)}</span>
      </div>
      ${action}
    </article>`;
  }).join("");
  if (ph.status === "routed" && ph.chosenId) {
    html += `<div class="ready-banner"><strong>Ready to dispense</strong>
      <p>Rx sent to ${esc(phxById(ph.chosenId).name)} (simulated eRx). First fill expected within ${esc(phxById(ph.chosenId).delivery.replace(/\(synthetic\)/g, "").toLowerCase())}. The console tracks the fill and refill schedule from here.</p></div>`;
  }
  return html;
}

function renderOnTherapy(c) {
  const o = c.onTherapy;
  if (!o) return `<div class="info-banner"><p>Awaiting first fill — once the specialty pharmacy ships, the case moves to on-therapy tracking.</p></div>`;
  return `<div class="ready-banner"><strong>On therapy — ${esc(c.patient)}</strong>
    <p>Therapy began ${fmtDate(o.startedAt)}. First fill: <strong>${esc(o.firstFill)}</strong>. Refill reminder set for ${fmtDate(o.refillDate)} (synthetic). The console keeps following the case — this is where gaps usually hide.</p></div>`;
}

/* ------------------------------------------------------ activity log ----- */

function renderActivity(c) {
  const list = $("#activity-list");
  if (!c.log.length) { list.innerHTML = `<p class="gate-hint">No logged actions yet.</p>`; return; }
  list.innerHTML = c.log.map((e) => `
    <div class="log-entry">
      <span class="log-actor ${e.actor === AGENT ? "agent" : ""}">${esc(e.actor)}</span>
      <p class="log-text">${esc(e.text)}</p>
      <span class="log-at">${esc(fmtDay(e.at))}</span>
    </div>`).join("");
}

/* ------------------------------------------------------ demo controls ---- */

function renderDemoControls(c, j) {
  const el = $("#demo-controls");
  let html = "";
  const p = payerOf(c);
  if (c.pa && c.pa.status === "submitted") {
    html += `<div class="demo-control-group">
      <label>Payer reply (simulated)</label>
      <button class="button button-secondary" type="button" data-action="payer-approve">Approve</button>
      <button class="button button-quiet" type="button" data-action="payer-deny">Deny · step therapy not met</button>
    </div>`;
  }
  if (c.appeal && c.appeal.status === "submitted") {
    html += `<div class="demo-control-group">
      <label>Appeal decision (simulated)</label>
      <button class="button button-secondary" type="button" data-action="appeal-overturn">Overturn denial</button>
    </div>`;
  }
  if (c.benefits && c.benefits.status === "error") {
    html += `<div class="demo-control-group">
      <label>Portal state (simulated)</label>
      <button class="button button-secondary" type="button" data-action="retry-benefits">Retry eligibility now</button>
    </div>`;
  }
  if (c.onTherapy) {
    html += `<p class="gate-hint">Nothing left to simulate — ${esc(c.id)} is on therapy. Open another case to see the other paths.</p>`;
  }
  if (!html) html = `<p class="gate-hint">No simulatable outside events for this case right now. Submit something or check a case that's stuck.</p>`;
  el.innerHTML = html;
}

/* ------------------------------------------------------------ actions ---- */

function openModal({ title, body, confirmLabel, danger }) {
  return new Promise((resolve) => {
    const root = $("#modal-root");
    root.innerHTML = `
      <div class="modal-backdrop" data-action="modal-dismiss">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="modal-head"><h3 id="modal-title">${esc(title)}</h3></div>
          <div class="modal-body">${body}</div>
          <div class="modal-foot">
            <button class="button button-quiet" type="button" data-action="modal-dismiss">Cancel</button>
            <button class="button ${danger ? "button-secondary" : "button-primary"}" type="button" data-action="modal-confirm">${esc(confirmLabel)}</button>
          </div>
        </div>
      </div>`;
    const done = (v) => { root.innerHTML = ""; resolve(v); };
    const onDismiss = (e) => {
      if (e.target === e.currentTarget) done(false);
    };
    $('[data-action="modal-confirm"]', root).addEventListener("click", () => done(true));
    $$('[data-action="modal-dismiss"]', root).forEach((el) => el.addEventListener("click", onDismiss));
    const onKey = (e) => { if (e.key === "Escape") { done(false); document.removeEventListener("keydown", onKey); } };
    document.addEventListener("keydown", onKey);
  });
}

let toastTimer = null;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("visible"), 3600);
}

function actResolveCriterion(c, critId) {
  const cr = c.pa.criteria.find((x) => x.id === critId);
  if (!cr || cr.det !== "cant-tell" || cr.confirmedBy) return;
  if (cr.resolution && cr.resolution.kind === "add-dates" && cr.resolution.citation) {
    cr.det = "met";
    cr.confirmedBy = STAFF;
    cr.citation = { ...cr.resolution.citation };
    cr.resolvedLog = STAFF + " " + cr.resolution.logText;
    log(c, STAFF, "Resolved " + cr.id + ": " + cr.resolution.logText + ". Criterion flipped to met with citation.", Date.now());
    toast("A-2 flipped to Met — the trial dates are now cited.");
  } else {
    cr.confirmedBy = STAFF;
    cr.resolvedLog = STAFF + " " + (cr.resolution ? cr.resolution.logText : "confirmed the record does not document this item; proceeding on the record");
    log(c, STAFF, "Confirmed " + cr.id + " as can't tell on record: " + (cr.note || "no passage found") + ".", Date.now());
    toast(cr.id + " confirmed by " + STAFF + " — safe to proceed on the record.");
  }
  save(); renderCaseView(); tickGuide(c);
}

function actConfirmCriterion(c, critId) {
  const cr = c.pa.criteria.find((x) => x.id === critId);
  if (!cr || cr.confirmedBy) return;
  cr.confirmedBy = STAFF;
  cr.resolvedLog = STAFF + " confirmed " + cr.id + " as can't tell on record — the item stays open in the draft but is cleared for submission";
  log(c, STAFF, "Confirmed " + cr.id + " as can't tell on record (" + (cr.note || "no passage found") + "). Item cleared for submission.", Date.now());
  save(); renderCaseView(); tickGuide(c);
  toast(cr.id + " confirmed by " + STAFF + " — submit gate will open.");
}

async function actSubmitPA(c) {
  const open = paOpenItems(c);
  if (open.length) {
    toast("Can't submit yet — " + open.length + " open item" + (open.length > 1 ? "s" : "") + ": " + open.map((o) => o.id).join(", ") + ". Resolve or confirm each one first.");
    return;
  }
  const p = payerOf(c);
  const ok = await openModal({
    title: "Submit prior authorization to " + p.name + "?",
    body: `<p>This transmits a prior authorization request <strong>under ${esc(c.prescriber)}'s signature</strong> (simulated transmission to the payer portal — nothing leaves this browser).</p>
      <p>The draft carries citations for every met criterion and a named-staff confirmation for every open item. ${esc(STAFF)} is recorded as the reviewer.</p>`,
    confirmLabel: "Submit to " + p.name,
  });
  if (!ok) return;
  c.pa.status = "submitted";
  c.pa.submittedAt = Date.now();
  c.pa.followUpDays = 4;
  log(c, STAFF, "Reviewed draft and submitted the PA to " + p.name + " under " + c.prescriber + "'s signature (simulated).", Date.now());
  log(c, AGENT, "Submission acknowledged by " + p.name + " portal. Turnaround clock started — follow-up planned in 4 days.", Date.now());
  save(); renderCaseView(); tickGuide(c);
  toast("PA submitted to " + p.name + " (simulated). Demo control: simulate the payer's reply.");
}

function actPayerApprove(c) {
  c.pa.status = "approved";
  c.pa.approvedAt = Date.now();
  if (c.appeal) c.appeal.status = "approved", c.appeal.approvedAt = Date.now();
  log(c, payerOf(c).name + " · simulated", "Reply received: prior authorization approved.", Date.now());
  if (!c.assistance) {
    c.assistance = { status: "matching", programs: null };
    setTimeout(() => {
      c.assistance = { status: "matching", programs: [{ programId: "prog-copay", matched: true }, { programId: "prog-manuf", matched: false }, { programId: "prog-foundation", matched: false }] };
      log(c, AGENT, "Financial assistance matching complete: 1 of 3 programs matched (copay card).", Date.now());
      save(); renderCaseView(); tickGuide(c);
    }, 800);
  }
  log(c, AGENT, "Case moved to assistance — affordability is where patients usually drop off.", Date.now());
  save(); renderCaseView(); tickGuide(c);
  toast("Approved (simulated). The rail moved to Assistance.");
}

function actPayerDeny(c) {
  c.pa.status = "denied";
  c.pa.deniedReason = "Step therapy not met";
  log(c, payerOf(c).name + " · simulated", "Reply received: prior authorization denied. Stated reason: step therapy not met.", Date.now());
  if (c.hero) {
    c.appeal = {
      status: "draft",
      denial: { ...SEED.heroAppeal.denial },
      points: SEED.heroAppeal.points.map((pt) => ({ ...pt, citations: pt.citations.map((ct) => ({ ...ct })), reviewedBy: null })),
      followUpDate: null,
    };
    log(c, AGENT, "Denial letter read automatically; appeal packet drafted point by point against the stated reason. Flagged review-required.", Date.now());
  } else {
    c.appeal = {
      status: "draft",
      denial: { reason: "Step therapy not met", summary: payerOf(c).name + " denied the prior authorization. Stated reason: step therapy not met.", letterExcerpt: "Denial letter (synthetic)." },
      points: [{ id: "R-1", title: "Standard therapy was trialed and failed.", body: "The chart documents a trial of standard therapy with no improvement, which the denial did not account for.", citations: [], reviewedBy: null }],
      followUpDate: null,
    };
    log(c, AGENT, "Appeal packet drafted against the stated reason. Flagged review-required.", Date.now());
  }
  state.activeStep = "appeal";
  save(); renderCaseView();
  toast("Denied — step therapy not met (simulated). The Appeal step opened with an agent-drafted packet.");
}

function actReviewAppealPoint(c, ptId) {
  const pt = c.appeal.points.find((x) => x.id === ptId);
  if (!pt || pt.reviewedBy) return;
  pt.reviewedBy = STAFF;
  log(c, STAFF, "Reviewed appeal point " + ptId + " (" + pt.title + ") and confirmed it on record.", Date.now());
  save(); renderCaseView();
  toast("Point " + ptId + " reviewed by " + STAFF + ".");
}

async function actSubmitAppeal(c) {
  const unreviewed = c.appeal.points.filter((pt) => !pt.reviewedBy);
  if (unreviewed.length) {
    toast("Can't submit yet — " + unreviewed.length + " point" + (unreviewed.length > 1 ? "s" : "") + " not reviewed: " + unreviewed.map((pt) => pt.id).join(", ") + ". Mark each reviewed first.");
    return;
  }
  const p = payerOf(c);
  const ok = await openModal({
    title: "Approve and submit appeal to " + p.name + "?",
    body: `<p>This transmits the appeal packet <strong>under ${esc(c.prescriber)}'s signature</strong> (simulated). Every point has been reviewed by a named staff member, and the packet answers the denial's stated reason.</p>
      <p>The console sets a follow-up date automatically and tracks it until the payer replies.</p>`,
    confirmLabel: "Submit appeal",
  });
  if (!ok) return;
  c.appeal.status = "submitted";
  c.appeal.submittedAt = Date.now();
  c.appeal.followUpDate = Date.now() + 12 * 86400e3;
  log(c, STAFF, "Approved the appeal packet and submitted to " + p.name + " under " + c.prescriber + "'s signature (simulated).", Date.now());
  log(c, AGENT, "Appeal acknowledged. Follow-up date set for " + fmtDate(c.appeal.followUpDate) + " — tracked and escalated if the payer goes quiet.", Date.now());
  save(); renderCaseView(); tickGuide(c);
  toast("Appeal submitted — follow-up date set for " + fmtDate(c.appeal.followUpDate) + ".");
}

function actEnrollProgram(c, programId) {
  const consent = document.querySelector(`[data-field="consent"][data-program="${programId}"]`);
  const checked = consent && consent.checked;
  if (!checked) {
    toast("Enrollment needs consent first — check the consent box (it logs who gave it and why).");
    return;
  }
  const prog = programById(programId);
  const a = c.assistance;
  a.consents = a.consents || [];
  a.consents.push({ programId, by: STAFF, at: Date.now() });
  a.status = "enrolled";
  if (c.benefits && c.benefits.status === "verified") {
    c.benefits.estPatientCostAfterHelp = 45;
  }
  log(c, STAFF, "Confirmed patient consent and enrolled " + c.patient + " in " + prog.name + " (" + prog.kind + ", synthetic).", Date.now());
  log(c, AGENT, "Estimated patient cost updated after savings card — see Benefits.", Date.now());
  if (!c.pharmacy) {
    c.pharmacy = { status: "evaluating", candidateIds: ["phx-preferred", "phx-local"] };
    log(c, AGENT, "Pharmacy routing started: 2 pharmacies evaluated (payer preferred vs patient's pharmacy).", Date.now());
  }
  save(); renderCaseView(); tickGuide(c);
  toast("Enrolled in " + prog.name + " — estimated cost dropped (synthetic).");
}

function actRoutePharmacy(c, phxId) {
  const phx = phxById(phxId);
  c.pharmacy.chosenId = phxId;
  c.pharmacy.status = "routed";
  c.pharmacy.chosenAt = Date.now();
  if (c.hero) c.walked = true;
  log(c, STAFF, "Routed the Rx to " + phx.name + " (" + phx.kind + ", " + phx.delivery + ").", Date.now());
  log(c, AGENT, "eRx handoff queued (simulated). Ready to dispense expected " + phx.delivery.toLowerCase(), Date.now());
  save(); renderCaseView(); tickGuide(c);
  toast("Routed to " + phx.name + " — case is Ready to dispense.");
}

function actRetryBenefits(c) {
  const b = c.benefits;
  b.status = "checking";
  log(c, AGENT, "Manual retry of the eligibility check started (simulated).", Date.now());
  save(); renderCaseView();
  setTimeout(() => {
    if (b.error && b.error.retryAt) delete b.error.retryAt;
    Object.assign(b, {
      status: "verified",
      lastVerified: Date.now(),
      plan: { name: payerOf(c).planName, active: true },
      benefitType: payerOf(c).benefitType, paRequired: true, stepTherapy: payerOf(c).stepTherapy,
      deductibleLeft: 4200, oopLeft: 8000, estPatientCost: 950, estPatientCostAfterHelp: null,
      estimateNote: "Estimated patient cost before assistance (synthetic).",
      sources: { plan: "eligibility check · simulated", doc: "plan document · simulated", call: "call note · simulated" },
    });
    log(c, AGENT, "Retry succeeded — eligibility verified for " + payerOf(c).name + " (simulated portal recovery).", Date.now());
    c.pa = {
      status: "draft", policyId: payerOf(c).policy.id, policyTitle: payerOf(c).policy.title,
      criteria: [
        { id: "B-1", text: "Diagnosis established by a specialist.", det: "met", citation: null, confirmedBy: null },
        { id: "B-2", text: "Documented trial of standard therapy.", det: "met", citation: null, confirmedBy: null },
        { id: "B-3", text: "Severity documented at baseline.", det: "met", citation: null, confirmedBy: null },
        { id: "B-4", text: "No contraindications.", det: "met", citation: null, confirmedBy: null },
      ],
      payerNote: null, submittedAt: null,
    };
    save(); renderCaseView(); tickGuide(c);
  }, 900);
}

function actConfirmInsurance(c) {
  const b = c.benefits;
  b.status = "verified";
  b.plan = { name: payerOf(c).planName, active: true };
  b.lastVerified = Date.now();
  b.deductibleLeft = 4200; b.oopLeft = 8000; b.estPatientCost = 950; b.estPatientCostAfterHelp = null;
  log(c, STAFF, "Confirmed new insurance with the patient (simulated): plan is active under " + payerOf(c).name + ".", Date.now());
  log(c, AGENT, "Eligibility re-checked: covered, PA required, step therapy set (synthetic).", Date.now());
  if (c.assistance && c.assistance.status === "pending-eligibility") {
    c.assistance.programs = c.assistance.programs.map((x) => x.programId === "prog-bridge" ? { ...x, matched: false, note: "no longer needed — coverage confirmed" } : x);
    c.assistance.status = "matching";
    log(c, AGENT, "Bridge program released — coverage confirmed, so the bridge is no longer needed (synthetic).", Date.now());
  }
  c.pa = {
    status: "draft", policyId: payerOf(c).policy.id, policyTitle: payerOf(c).policy.title,
    criteria: [
      { id: "B-1", text: "Diagnosis established by a specialist.", det: "met", citation: null, confirmedBy: null },
      { id: "B-2", text: "Documented trial of standard therapy.", det: "met", citation: null, confirmedBy: null },
      { id: "B-3", text: "Severity documented at baseline.", det: "met", citation: null, confirmedBy: null },
      { id: "B-4", text: "No contraindications.", det: "met", citation: null, confirmedBy: null },
    ],
    payerNote: null, submittedAt: null,
  };
  log(c, AGENT, "Prior authorization draft started from " + payerOf(c).policy.id + ".", Date.now());
  save(); renderCaseView(); tickGuide(c);
  toast("Coverage confirmed — benefits verified, PA draft started.");
}

/* ------------------------------------------------------------ events ----- */

function bindEvents() {
  document.addEventListener("click", (e) => {
    const tr = e.target.closest(".trunc");
    if (tr) { tr.classList.toggle("expanded"); return; }
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    const c = caseById(state.activeCaseId);
    switch (action) {
      case "open-case": openCase(el.dataset.id); break;
      case "back-dashboard": state.activeStep = "benefits"; renderDashboard(); break;
      case "stat-filter": {
        const f = el.dataset.filter;
        if (f) { state.filters.stage = f; renderDashboard(); }
        break;
      }
      case "empty-reset": state.filters = { clinic: "all", prescriber: "all", stage: "all" }; renderDashboard(); break;
      case "jump-step": state.activeStep = el.dataset.step; renderCaseView(); tickGuide(c); break;
      case "resolve-criterion": actResolveCriterion(c, el.dataset.crit); break;
      case "confirm-criterion": actConfirmCriterion(c, el.dataset.crit); break;
      case "submit-pa": actSubmitPA(c); break;
      case "payer-approve": actPayerApprove(c); break;
      case "payer-deny": actPayerDeny(c); break;
      case "appeal-overturn": actPayerApprove(c); toast("Appeal overturned — coverage approved (simulated)."); break;
      case "review-appeal-point": actReviewAppealPoint(c, el.dataset.pt); break;
      case "submit-appeal": actSubmitAppeal(c); break;
      case "enroll-program": actEnrollProgram(c, el.dataset.program); break;
      case "route-pharmacy": actRoutePharmacy(c, el.dataset.phx); break;
      case "retry-benefits": actRetryBenefits(c); break;
      case "confirm-insurance": actConfirmInsurance(c); break;
      case "wt-close": state.walkthrough.active = false; save(); renderCaseView(); break;
      case "walkthrough": {
        const hero = caseById("C-1042");
        if (hero && hero.pa && hero.pa.status === "approved" && hero.onTherapy) {
          toast("This session already walked the happy path — use Reset demo to run it again.");
        } else {
          openCase("C-1042", { startGuide: true });
        }
        break;
      }
      case "reset-demo":
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
        break;
    }
  });

  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "filter-clinic") { state.filters.clinic = t.value; save(); renderDashboard(); }
    else if (t.id === "filter-prescriber") { state.filters.prescriber = t.value; save(); renderDashboard(); }
    else if (t.id === "filter-stage") { state.filters.stage = t.value; save(); renderDashboard(); }
    else if (t.dataset && t.dataset.field === "consent") {
      const btn = document.querySelector(`[data-action="enroll-program"][data-program="${t.dataset.program}"]`);
      const hint = document.querySelector(`[data-hint="${t.dataset.program}"]`);
      if (btn) { btn.disabled = !t.checked; btn.classList.toggle("button-quiet", !t.checked); }
      if (hint) hint.style.display = t.checked ? "none" : "";
    }
  });

  document.addEventListener("blur", (e) => {
    const t = e.target;
    if (!t || !t.dataset || t.dataset.field !== "appeal-edit") return;
    const c = caseById(state.activeCaseId);
    if (!c || !c.appeal) return;
    const pt = c.appeal.points.find((x) => x.id === t.dataset.pt);
    if (!pt || pt.body === t.value) return;
    pt.body = t.value;
    pt.editedBy = STAFF;
    log(c, STAFF, "Edited appeal point " + pt.id + " before submission — human edit on the agent draft.", Date.now());
    save();
  });
}

/* ------------------------------------------------------------- boot ------ */

function init() {
  bindEvents();
  state.view === "case" && state.activeCaseId ? openCase(state.activeCaseId) : renderDashboard();
}

init();
