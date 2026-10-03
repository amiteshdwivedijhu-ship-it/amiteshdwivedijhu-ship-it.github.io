/* Enrollment Runway — provider operations console (synthetic prototype).
   All data is simulated. No real PHI, NPIs, provider names, or payer connections. */
"use strict";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const DAY = 864e5;
const fmtDay = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtDayYear = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const dayAt = (n) => new Date(Date.now() + n * DAY);

function parseOffset(s) { // "-6d" | "-10h"
  const m = /^-(\d+)([dh])$/.exec(String(s || ""));
  return m ? { n: +m[1], unit: m[2] } : null;
}
function dateFromOffset(s) {
  if (String(s) === "now") return new Date();
  const o = parseOffset(s);
  if (!o) return new Date(s);
  return new Date(Date.now() - (o.unit === "d" ? o.n : o.n / 24) * DAY);
}
function timeLabel(s) {
  const d = String(s) === "now" ? new Date() : dateFromOffset(s);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dd = new Date(d); dd.setHours(0, 0, 0, 0);
  const hm = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (+dd === +today) return `Today ${hm}`;
  if (+dd === +today - DAY) return `Yesterday ${hm}`;
  if (d.getFullYear() === today.getFullYear()) return `${fmtDay(d)} ${hm}`;
  return `${fmtDayYear(d)} ${hm}`;
}

const LS_KEY = "enrollment-runway-v1";

/* ---------------------------------------------------------------- store -- */
let DATA;
let state;

async function load() {
  DATA = await (await fetch("data.json")).json();
  const resetFlag = sessionStorage.getItem("er-reset");
  if (resetFlag) sessionStorage.removeItem("er-reset");
  const saved = (() => {
    if (resetFlag) return null;
    try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch { return null; }
  })();
  if (saved) {
    state = saved;
    // Rebase seed so stale sessions stay coherent with the real clock.
    state.rebasedAt = Date.now();
  } else {
    state = {
      portalUp: false, // seeded outage: W-9 checks show "can't tell" (simulated)
      reviewerName: "",
      signed: {},
      gate: {},       // { [enrId]: { [itemId]: {status, via, detail, reason, locId, doc} } }
      packets: {},    // { [enrId]: { signatureFix: bool, routed: bool } }
      enrollments: structuredClone(DATA.enrollments),
      followups: structuredClone(DATA.followups),
      licenses: structuredClone(DATA.licenses),
      activity: structuredClone(DATA.activity),
      lastProvider: "P07",
      lastPacket: "P07-PN",
    };
  }
}
function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* private mode */ }
}
function logActivity(entry) {
  state.activity.unshift(Object.assign({ time: "now" }, entry));
  save(); render();
}

/* ------------------------------------------------------------- helpers -- */
const providerOf = (id) => DATA.providers.find((p) => p.id === id);
const payerOf = (id) => DATA.payers.find((p) => p.id === id);
const tinOf = (id) => DATA.tins.find((t) => t.id === id);
const enrollmentsOf = (pid) => state.enrollments.filter((e) => e.providerId === pid);
const followupsOf = (eid) => state.followups[eid] || [];
const stageOf = (p) => {
  const ens = enrollmentsOf(p.id);
  if (ens.length && ens.every((e) => e.status === "approved")) return "approved";
  if (ens.some((e) => e.status === "needs_action")) return "needs_action";
  if (ens.some((e) => e.status !== "approved")) return "enrollment";
  if (p.credentialing === "in_progress") return "credentialing";
  return "intake";
};
const gateStatus = (enr, itemId) => (state.gate[enr.id] && state.gate[enr.id][itemId]) || { status: "pending" };
const isCleared = (enr, itemId) => gateStatus(enr, itemId).status === "cleared";
const isHardStopped = (enr) => !!(enr.hardStop && enr.hardStop.active && !(state.packets[enr.id] && state.packets[enr.id].licenseCleared));

function projectedDays(enr) {
  const delays = enr.delays.filter((d) => !(d.gateId && isCleared(enr, d.gateId))).reduce((s, d) => s + d.days, 0);
  return enr.baseDays + delays + (enr.returnDelay || 0);
}
function delayBreakdown(enr) {
  return [
    ...enr.delays.filter((d) => !(d.gateId && isCleared(enr, d.gateId))).map((d) => ({ label: d.label, days: d.days })),
    ...((enr.returnDelay || 0) ? [{ label: "Payer return", days: enr.returnDelay }] : []),
  ];
}
function medianDays() {
  const vals = state.enrollments.filter((e) => e.status !== "approved").map(projectedDays).sort((a, b) => a - b);
  if (!vals.length) return null;
  const m = Math.floor(vals.length / 2);
  return vals.length % 2 ? vals[m] : Math.round((vals[m - 1] + vals[m]) / 2);
}
function notYetBillable() {
  return DATA.providers.filter((p) => stageOf(p) !== "approved").length;
}
function waitingOnTeam() {
  let n = 0;
  for (const enr of state.enrollments) {
    if (enr.status === "needs_action") { n += 1; continue; }
    const blocked = enr.hardStop && enr.hardStop.active && isHardStopped(enr);
    if (blocked) { n += 1; continue; } // licensing hard stop (incl. its gate item)
    if (enr.gate) n += Math.max(0, enr.gate.length - Object.keys(state.gate[enr.id] || {}).filter((k) => isCleared(enr, k)).length);
    if (enr.status === "draft" && !enr.packet) n += 1; // agent queue
  }
  return n;
}
function waitingOnPayer() {
  return state.enrollments.filter((e) =>
    (e.status === "submitted" || e.status === "in_progress") &&
    followupsOf(e.id).some((f) => f.owner === "payer")
  ).length;
}

/* -------------------------------------------------------- packet fields -- */
const FIELD_TEMPLATE = [
  { sec: "Provider identity", label: "Legal name", key: "legal_name", src: "profile", val: (p) => p.name },
  { sec: "Provider identity", label: "Date of birth", key: "dob", src: "profile", val: (p) => `${p.dob} (synthetic)` },
  { sec: "Provider identity", label: "NPI", key: "npi", src: "profile", val: (p) => `${p.npi} (synthetic format)` },
  { sec: "Provider identity", label: "Provider type", key: "ptype", src: "profile", val: () => "Individual (simulated)" },
  { sec: "Provider identity", label: "Taxonomy code", key: "taxonomy", src: "profile", val: (p) => p.taxonomy.split(" — ")[0] },
  { sec: "Provider identity", label: "Specialty", key: "specialty", src: "profile", val: (p) => (p.role.split(" — ")[1] || p.role) },
  { sec: "Provider identity", label: "Credentials / degrees", key: "creds", src: "profile", val: (p) => p.role.split(" — ")[0] },
  { sec: "Provider identity", label: "Languages", key: "lang", src: "profile", val: () => "English (simulated)" },
  { sec: "Provider identity", label: "CAQH profile ID", key: "caqh", src: "profile", val: (p) => `${p.caqh} (synthetic)` },
  { sec: "Provider identity", label: "DEA number", key: "dea", src: "profile", val: () => "N/A — not required for this provider type" },

  { sec: "Licenses", label: "License number", key: "lic_num", src: "license", gap: "license", val: (p, enr) => licFor(p, enr)?.number ?? null },
  { sec: "Licenses", label: "License state", key: "lic_state", src: "license", gap: "license", val: (p, enr) => licFor(p, enr)?.state ?? null },
  { sec: "Licenses", label: "License status", key: "lic_status", src: "license", gap: "license", val: (p, enr) => licFor(p, enr)?.status ?? null },
  { sec: "Licenses", label: "License expiration", key: "lic_exp", src: "license", gap: "license", val: (p, enr) => licFor(p, enr)?.expires ?? null },
  { sec: "Licenses", label: "Issuing board", key: "lic_board", src: "license", gap: "license", val: (p, enr) => licFor(p, enr)?.board ?? null },
  { sec: "Licenses", label: "License verified", key: "lic_ver", src: "license", gap: "license", val: (p, enr) => licFor(p, enr)?.verified ?? null },
  { sec: "Licenses", label: "Medicaid ID", key: "medicaid", src: "license", val: () => "N/A — not enrolled in Medicaid" },
  { sec: "Licenses", label: "State controlled-substance", key: "controlled", src: "license", val: () => "N/A — not applicable" },

  { sec: "Malpractice", label: "Carrier", key: "mal_carrier", src: "malpractice", val: (p) => malFor(p)?.carrier ?? null },
  { sec: "Malpractice", label: "Policy number", key: "mal_policy", src: "malpractice", val: (p) => malFor(p)?.policy ?? null },
  { sec: "Malpractice", label: "Policy period", key: "mal_period", src: "malpractice", val: (p) => malFor(p)?.period ?? null },
  { sec: "Malpractice", label: "Coverage type", key: "mal_type", src: "malpractice", val: (p) => malFor(p)?.type ?? null },
  { sec: "Malpractice", label: "Per-claim limit", key: "mal_perclaim", src: "malpractice", val: (p) => malFor(p)?.perClaim ?? null },
  { sec: "Malpractice", label: "Aggregate limit", key: "mal_agg", src: "malpractice", val: (p) => malFor(p)?.aggregate ?? null },
  { sec: "Malpractice", label: "Certificate of coverage", key: "mal_cert", src: "document", gap: "cert", val: (p, enr) => certValue(enr) },

  { sec: "Practice locations", label: "Primary location", key: "loc_primary", src: "location", val: (p, enr) => locFor(enr)?.name ?? null },
  { sec: "Practice locations", label: "Primary location address", key: "loc_addr", src: "location", val: (p, enr) => locFor(enr)?.address ?? null },
  { sec: "Practice locations", label: "Primary location phone", key: "loc_phone", src: "location", val: (p, enr) => locFor(enr)?.phone ?? null },
  { sec: "Practice locations", label: "Primary location TIN", key: "loc_tin", src: "location", gap: "location", val: (p, enr) => locFor(enr)?.tin ?? null },
  { sec: "Practice locations", label: "Secondary location", key: "loc2", src: "location", val: (p) => (DATA.locations[p.id] && DATA.locations[p.id][1] ? DATA.locations[p.id][1].name : "None on record") },
  { sec: "Practice locations", label: "Secondary location TIN", key: "loc2_tin", src: "location", val: (p) => (DATA.locations[p.id] && DATA.locations[p.id][1] ? DATA.locations[p.id][1].tin : "N/A") },
  { sec: "Practice locations", label: "Secondary address", key: "loc2_addr", src: "location", val: (p) => (DATA.locations[p.id] && DATA.locations[p.id][1] ? DATA.locations[p.id][1].address : "N/A") },
  { sec: "Practice locations", label: "Group NPI", key: "group_npi", src: "profile", val: () => "Group NPI-1000-0000-S (synthetic format)" },

  { sec: "Payer requirements", label: "Line of business", key: "lob", src: "payerForm", gap: "lob", val: (p, enr) => `${payerOf(enr.payerId).name} — ${payerOf(enr.payerId).lob}` },
  { sec: "Payer requirements", label: "W-9 on file", key: "w9", src: "document", gap: "w9", val: (p, enr) => w9Value(enr) },
  { sec: "Payer requirements", label: "Claims address", key: "claims", src: "payerForm", val: () => payerAddr("Claims") },
  { sec: "Payer requirements", label: "Remittance address", key: "remit", src: "payerForm", val: () => payerAddr("Remittance") },
  { sec: "Payer requirements", label: "EFT bank account", key: "eft", src: "payerForm", val: () => "EFT-7788-3321 (synthetic bank account)" },
  { sec: "Payer requirements", label: "Claims format", key: "fmt", src: "payerForm", val: () => "EDI 837P (simulated)" },
  { sec: "Payer requirements", label: "Recredentialing interval", key: "recred", src: "payerForm", val: () => "36 months (payer policy, synthetic)" },
  { sec: "Payer requirements", label: "Application signature", key: "signature", src: "payerForm", gap: "signature", val: (p, enr) => sigValue(enr) },
  { sec: "Payer requirements", label: "Superbill on file", key: "superbill", src: "document", val: () => "On record — SUP-0912.pdf (synthetic)" },
  { sec: "Payer requirements", label: "Facility affiliation", key: "facility", src: "payerForm", val: (p, enr) => locFor(enr)?.name ?? "None on record" },
  { sec: "Payer requirements", label: "Effective date requested", key: "eff_req", src: "payerForm", val: () => "As soon as possible" },
];

const licFor = (p, enr) => {
  const lic = state.licenses[p.id] || [];
  return lic.find((l) => l.state === enr.state) || null;
};
const malFor = (p) => DATA.malpractice[p.id] || null;
const locFor = (enr) => {
  const g = gateStatus(enr, "location");
  if (g.status === "cleared" && g.locId) return (DATA.locations[enr.providerId] || []).find((l) => l.id === g.locId);
  const locs = DATA.locations[enr.providerId] || [];
  if (enr.draftedLocId) return locs.find((l) => l.id === enr.draftedLocId) || locs[0];
  return locs[0] || null;
};
function certValue(enr) {
  const g = gateStatus(enr, "cert");
  return g.status === "cleared" ? (g.doc || "Renewed certificate on record") : null;
}
function w9Value(enr) {
  const g = gateStatus(enr, "w9");
  return g.status === "cleared" ? (g.doc || "W-9 on record") : null;
}
function sigValue(enr) {
  const st = state.packets[enr.id];
  if (st && st.signatureFix) return "Agent-drafted signature block (needs review)";
  return "Signed — Sep 18, 2026 (synthetic)";
}
function payerAddr(kind) {
  return `${kind} address: 100 Payer Dr, Suite 200, Anywhere, NY 10001 (synthetic)`;
}

const SRC_DISPLAY = {
  profile: "Profile import",
  license: "License record",
  location: "Location record",
  malpractice: "Malpractice record",
  payerForm: "Payer form",
  document: "Uploaded document",
};
const SRC_STAGE = { profile: "src-profile", license: "src-license", location: "src-location", malpractice: "src-malpractice", payerForm: "src-payer", document: "src-doc" };

function sourcePayload(src, p, enr, extra) {
  switch (src) {
    case "profile": return {
      title: DATA.sources.profile.title,
      rows: [
        ["Name", p.name], ["NPI", `${p.npi} (synthetic format)`], ["Date of birth", `${p.dob} (synthetic)`],
        ["Specialty", p.role], ["Taxonomy", p.taxonomy], ["CAQH ID", `${p.caqh} (synthetic)`],
        ["Intake", p.intake === "complete" ? "Complete" : p.intake],
      ],
      note: DATA.sources.profile.note,
    };
    case "license": {
      const lic = licFor(p, enr);
      return {
        title: DATA.sources.license.title,
        rows: lic ? [
          ["State", lic.state], ["License number", lic.number ?? "Missing"], ["Status", lic.status],
          ["Issued", lic.issued ?? "—"], ["Expires", lic.expires ?? "—"], ["Board", lic.board],
          ["Last verified", lic.verified],
        ] : [["State", enr.state], ["License", "No record on file"]],
        note: DATA.sources.license.note,
      };
    }
    case "location": {
      const l = locFor(enr) || (DATA.locations[p.id] || [])[0];
      return {
        title: DATA.sources.location.title,
        rows: l ? [
          ["Location", l.name], ["Address", l.address], ["Phone", l.phone], ["TIN", l.tin],
          ["Primary", l.primary ? "Yes" : "No"], ["Last updated", l.updated],
        ] : [["Location", "None on record"]],
        note: DATA.sources.location.note,
      };
    }
    case "malpractice": {
      const m = malFor(p);
      return {
        title: DATA.sources.malpractice.title,
        rows: m ? [
          ["Carrier", m.carrier], ["Policy", m.policy], ["Period", m.period], ["Type", m.type],
          ["Per-claim limit", m.perClaim], ["Aggregate limit", m.aggregate], ["Status", m.status],
          ["Policy document", m.doc],
        ] : [["Carrier", "No record on file"]],
        note: DATA.sources.malpractice.note,
      };
    }
    case "payerForm": {
      return {
        title: `Payer application form — ${payerOf(enr.payerId).name} ${payerOf(enr.payerId).lob} (simulated)`,
        rows: [["Form version", "v2026.3 (synthetic)"], ["Field", extra || "Application requirement"], ["Source", "Payer form template + profile record"]],
        note: DATA.sources.payerForm.note,
      };
    }
    case "document": {
      return {
        title: DATA.sources.document.title,
        rows: [["Document", extra || "UPL-2026.pdf (synthetic)"]],
        note: DATA.sources.document.note,
      };
    }
  }
}

/* ------------------------------------------------------------ pre-flight -- */
function checksFor(enr) {
  const p = providerOf(enr.providerId);
  const checks = [];
  const payer = payerOf(enr.payerId);
  const m = malFor(p);
  const cert = gateStatus(enr, "cert");
  const loc = gateStatus(enr, "location");
  const w9 = gateStatus(enr, "w9");
  const lic = gateStatus(enr, "license");
  const addr = gateStatus(enr, "address");
  const sig = gateStatus(enr, "signature");

  if (enr.gate.includes("cert")) {
    checks.push(cert.status === "cleared"
      ? { state: "pass", label: "Payer rule — malpractice coverage current", reason: cert.detail || "Verified on record" }
      : { state: "fail", label: "Payer rule — malpractice coverage current", reason: `Policy ${m?.policy || "on record"} ${m?.expires ? `expired ${m.expires}` : "not current"}; renewed certificate not on record.` });
  }
  if (enr.gate.includes("location")) {
    const l = locFor(enr);
    checks.push(loc.status === "cleared"
      ? { state: "pass", label: "State rule — practice location matches TIN on file", reason: loc.detail || "Location matches entity TIN" }
      : { state: "fail", label: "State rule — practice location matches TIN on file", reason: `Primary location TIN (${l ? l.tin.split(" ")[1] : "?"}) does not match the tax entity on file (${tinOf(p.tins[0]).label}).` });
  }
  if (enr.gate.includes("address")) {
    checks.push(addr.status === "cleared"
      ? { state: "pass", label: "State rule — practice location current", reason: addr.detail || "Primary location confirmed by reviewer" }
      : { state: "fail", label: "State rule — practice location current", reason: "Primary location updated Sep 2, 2026 — confirm before submitting." });
  }
  if (enr.hardStop && enr.hardStop.active) {
    checks.push(isHardStopped(enr)
      ? { state: "fail", label: "State rule — active license in " + enr.state, reason: "No active " + enr.state + " license on record. This is a hard stop: the packet cannot be submitted." }
      : { state: "pass", label: "State rule — active license in " + enr.state, reason: "License " + (lic.detail || "approved") + " — active." });
  } else if (enr.gate.includes("license")) {
    checks.push(lic.status === "cleared"
      ? { state: "pass", label: "State rule — active license in " + enr.state, reason: lic.detail || "License active" }
      : { state: "fail", label: "State rule — active license in " + enr.state, reason: "No active " + enr.state + " license on record. This is a hard stop: the packet cannot be submitted." });
  }
  checks.push({ state: "pass", label: "Line of business — scope matches network", reason: `${p.role.split(" — ")[0]} appears in ${payer.name} ${payer.lob} network roster (synthetic roster v3.1).` });
  if (enr.gate.includes("w9")) {
    if (!state.portalUp) {
      checks.push({ state: "cant", label: "Payer record — W-9 on file", reason: `${payer.name} portal is unavailable (simulated outage). Cannot verify pull. Upload from record or mark not needed.` });
    } else if (w9.status === "cleared") {
      checks.push({ state: "pass", label: "Payer record — W-9 on file", reason: w9.detail || "W-9 verified with payer record" });
    } else {
      checks.push({ state: "fail", label: "Payer record — W-9 on file", reason: "No W-9 found on payer record." });
    }
  }
  if (state.packets[enr.id] && state.packets[enr.id].signatureFix && enr.status === "needs_action") {
    checks.push(sig.status === "cleared"
      ? { state: "pass", label: "Payer rule — signature on form page 3", reason: sig.detail || "Signature block confirmed by reviewer" }
      : { state: "fail", label: "Payer rule — signature on form page 3", reason: "Payer returned the application: missing signature on form page 3 (simulated). Agent drafted the signature block — confirm in Review." });
  }
  return checks;
}
const checkCounts = (checks) => ({
  pass: checks.filter((c) => c.state === "pass").length,
  fail: checks.filter((c) => c.state === "fail").length,
  cant: checks.filter((c) => c.state === "cant").length,
});

/* --------------------------------------------------------------- router -- */
function parseRoute() {
  const h = location.hash.replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean);
  const r = { screen: parts[0] || "pipeline", args: parts.slice(1) };
  if (r.screen === "packet" && r.args[0]) {
    state.lastPacket = r.args[0];
    const enr = state.enrollments.find((e) => e.id === r.args[0]);
    if (enr) state.lastProvider = enr.providerId;
  }
  if (r.screen === "provider" && r.args[0]) state.lastProvider = r.args[0];
  save();
  return r;
}

/* ------------------------------------------------------------------ app -- */
const ROOT = $("#app");
const MODAL = $("#modal");
const TOASTS = $("#toasts");
let router = { screen: "pipeline", args: [] };

function nav() {
  const r = router;
  const active = (s) => (r.screen === s ? "nav-btn active" : "nav-btn");
  return `
  <header class="topbar">
    <div class="brand">
      <div class="brand-mark" aria-hidden="true"></div>
      <div>
        <div class="brand-name">Enrollment Runway</div>
        <div class="brand-sub">Provider operations console · synthetic prototype</div>
      </div>
    </div>
    <button class="btn btn-ghost btn-badge" data-action="demo-panel"><span class="demo-dot"></span>Demo controls</button>
  </header>
  <div class="shell">
    <aside class="sidebar card">
      <nav class="side-nav">
        <a class="${active("pipeline")}" href="#/">Network pipeline</a>
        <a class="${active("provider")}" href="#/provider/${state.lastProvider}">Provider profile</a>
        <a class="${active("packet")}" href="#/packet/${state.lastPacket}">Packet builder</a>
        <a class="${active("activity")}" href="#/activity">Activity log</a>
      </nav>
      <div class="side-notes">
        <div class="side-note">${state.portalUp ? "Payer portals: <b>all up</b> (simulated)" : "Payer North portal: <b>down</b> (simulated)"}</div>
        <button class="btn btn-ghost" data-action="reset">Reset demo</button>
      </div>
    </aside>
    <main id="main" class="main"></main>
  </div>
  <nav class="bottom-nav" aria-label="Primary">
    <a class="${active("pipeline")}" href="#/"><span class="bn-ic">▦</span><span>Pipeline</span></a>
    <a class="${active("provider")}" href="#/provider/${state.lastProvider}"><span class="bn-ic">◉</span><span>Provider</span></a>
    <a class="${active("packet")}" href="#/packet/${state.lastPacket}"><span class="bn-ic">▤</span><span>Packet</span></a>
    <a class="${active("activity")}" href="#/activity"><span class="bn-ic">≡</span><span>Activity</span></a>
  </nav>`;
}

function toast(text, kind = "info") {
  const t = document.createElement("div");
  t.className = `toast toast-${kind}`;
  t.setAttribute("role", "status");
  t.innerHTML = esc(text);
  TOASTS.appendChild(t);
  setTimeout(() => t.classList.add("show"));
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 400); }, 4600);
}

function render() {
  router = parseRoute();
  ROOT.innerHTML = nav();
  const main = $("#main");
  switch (router.screen) {
    case "pipeline": main.innerHTML = screenPipeline(); wirePipeline(main); break;
    case "provider": main.innerHTML = screenProvider(router.args[0]); wireProvider(main); break;
    case "packet": main.innerHTML = screenPacket(router.args[0], router.args[1]); wirePacket(main); break;
    case "activity": main.innerHTML = screenActivity(); wireActivity(main); break;
    default: location.hash = "#/"; main.innerHTML = screenPipeline(); wirePipeline(main);
  }
}

function statusChip(enr, extra = "") {
  const map = {
    draft: ["draft", "Draft"], ready: ["ready", "Ready to submit"], submitted: ["submitted", "Submitted"],
    in_progress: ["in_progress", "In progress"], needs_action: ["needs_action", "Needs action"], approved: ["approved", "Approved"],
  };
  const [cls, label] = map[enr.status] || ["draft", enr.status];
  return `<span class="chip chip-${cls}">${label}${extra}</span>`;
}
const stageTitles = {
  intake: ["Intake", "Waiting on provider data"], credentialing: ["Credentialing", "Primary-source checks in progress"],
  enrollment: ["Enrollment", "Payer packets in motion"], needs_action: ["Needs action", "A person must act"],
  approved: ["Approved", "Ready to bill (simulated)"],
};

/* ------------------------------------------------------------- pipeline -- */
const FILTERS = { state: "all", payer: "all", tin: "all" };
function screenPipeline() {
  const cols = ["intake", "credentialing", "enrollment", "needs_action", "approved"];
  const groups = { intake: [], credentialing: [], enrollment: [], needs_action: [], approved: [] };
  for (const p of DATA.providers) {
    if (FILTERS.state !== "all" && !p.states.includes(FILTERS.state)) continue;
    if (FILTERS.payer !== "all" && !enrollmentsOf(p.id).some((e) => e.payerId === FILTERS.payer)) continue;
    if (FILTERS.tin !== "all" && !p.tins.includes(FILTERS.tin)) continue;
    groups[stageOf(p)].push(p);
  }
  const filterActive = FILTERS.state !== "all" || FILTERS.payer !== "all" || FILTERS.tin !== "all";
  const med = medianDays();
  const sel = (id, current, opts, label) => `
    <label class="f-label" for="${id}">${label}</label>
    <select id="${id}" class="f-select">
      <option value="all" ${current === "all" ? "selected" : ""}>All</option>
      ${opts.map((o) => `<option value="${o.value}" ${current === o.value ? "selected" : ""}>${esc(o.label)}</option>`).join("")}
    </select>`;
  const portalBanner = !state.portalUp ? `
    <div class="alert alert-amber" role="alert">
      <div class="alert-title">Payer North portal unavailable (simulated outage)</div>
      <div>What the system does: W-9 checks against Payer North show <b>Can't tell</b> and are re-checked hourly. What you should do: verify from uploaded records or mark not needed (reason required).</div>
    </div>` : "";

  return `
    <div class="page-head">
      <div>
        <div class="eyebrow">Network · all providers</div>
        <h1>Network pipeline</h1>
        <p class="sub">What is blocking revenue today? 24 synthetic providers across ${DATA.states.length} states and ${DATA.payers.length} payers.</p>
      </div>
    </div>
    ${portalBanner}
    <div class="tiles">
      <div class="tile"><div class="tile-num">${notYetBillable()}</div><div class="tile-label">Providers not yet billable</div><div class="tile-sub">not Approved (synthetic)</div></div>
      <div class="tile tile-accent"><div class="tile-num">${med ?? "—"}</div><div class="tile-label">Median days-to-enroll</div><div class="tile-sub">across open enrollments (synthetic)</div></div>
      <div class="tile"><div class="tile-num">${waitingOnTeam()}</div><div class="tile-label">Items waiting on our team</div><div class="tile-sub">blockers, returns, review items</div></div>
      <div class="tile"><div class="tile-num">${waitingOnPayer()}</div><div class="tile-label">Items waiting on payer</div><div class="tile-sub">open follow-ups with payers</div></div>
    </div>
    <div class="filters card">
      ${sel("f-state", FILTERS.state, DATA.states.map((s) => ({ value: s, label: s })), "State")}
      ${sel("f-payer", FILTERS.payer, DATA.payers.map((p) => ({ value: p.id, label: p.name })), "Payer")}
      ${sel("f-tin", FILTERS.tin, DATA.tins.map((t) => ({ value: t.id, label: t.label })), "Tax entity")}
      <button class="btn btn-ghost" data-action="clear-filters" ${filterActive ? "" : "disabled"}>Clear filters</button>
    </div>
    <div class="board">
      ${cols.map((c) => {
        const [title, hint] = stageTitles[c];
        const list = groups[c];
        return `<section class="board-col">
          <div class="col-head"><h2>${title}</h2><span class="col-count">${list.length}</span><div class="col-hint">${hint}</div></div>
          <div class="col-body">
            ${list.length ? list.map(providerCard).join("") : `<div class="col-empty">${c === "needs_action" ? "No cases need you right now." : c === "intake" ? "Nothing waiting on intake." : "No providers here."}</div>`}
          </div>
        </section>`;
      }).join("")}
    </div>
    ${filterActive && !DATA.providers.some((p) => stageOf(p)) ? "" : ""}
    <div class="synthetic-note">${esc(DATA.meta.syntheticNotice)}</div>`;
}

function providerCard(p) {
  const ens = enrollmentsOf(p.id);
  const active = ens.find((e) => e.status !== "approved");
  const latest = ens[ens.length - 1];
  const blocked = active && active.hardStop && active.hardStop.active && isHardStopped(active);
  const packet = active && active.packet;
  const payers = [...new Set(ens.map((e) => payerOf(e.payerId).name))];
  return `
  <article class="pcard" data-action="open-provider" data-id="${p.id}" tabindex="0" role="button" aria-label="Open profile for ${esc(p.name)}">
    <div class="pcard-top">
      <div class="pcard-name">${esc(p.name)}</div>
      ${blocked ? `<span class="badge badge-red">Blocked by licensing</span>` : ""}
    </div>
    <div class="pcard-role">${esc(p.role)}</div>
    <div class="pcard-meta">
      <span>${p.states.map((s) => `<span class="chip chip-state">${s}</span>`).join("")}</span>
      <span class="muted">${esc(p.tins.length ? tinOf(p.tins[0]).label.split(" ")[1] : "")}</span>
    </div>
    ${active ? `<div class="pcard-days">~${projectedDays(active)} days-to-enroll · ${esc(payers.join(", "))}</div>`
      : latest ? `<div class="pcard-days">Approved in ${latest.actualDays} days · ${esc(payers.join(", "))}</div>` : ""}
    ${active && active.status === "needs_action" ? `<div class="pcard-reason">${esc("Returned: " + (active.returnReason || "needs action"))}</div>` : ""}
    <div class="pcard-foot">
      ${active ? statusChip(active) : `<span class="chip chip-approved">${p.intake === "pending" ? "Intake pending" : "Approved"}</span>`}
      ${packet ? `<a class="link-sm" href="#/packet/${active.id}" data-action="open-packet" data-id="${active.id}">Open packet →</a>`
        : active && active.status !== "approved" ? `<span class="muted sm">Agent queue</span>` : ""}
    </div>
  </article>`;
}

function wirePipeline(main) {
  main.addEventListener("click", (ev) => {
    const t = ev.target.closest("[data-action]");
    if (!t) return;
    const a = t.dataset.action;
    if (a === "open-provider") { location.hash = `#/provider/${t.dataset.id}`; }
    if (a === "open-packet") { ev.stopPropagation(); location.hash = `#/packet/${t.dataset.id}`; }
    if (a === "clear-filters") { FILTERS.state = "all"; FILTERS.payer = "all"; FILTERS.tin = "all"; render(); }
  });
  main.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && ev.target.classList.contains("pcard")) location.hash = `#/provider/${ev.target.dataset.id}`;
  });
  main.addEventListener("change", (ev) => {
    const id = ev.target.id;
    if (!id) return;
    if (id === "f-state") FILTERS.state = ev.target.value;
    if (id === "f-payer") FILTERS.payer = ev.target.value;
    if (id === "f-tin") FILTERS.tin = ev.target.value;
    if (["f-state", "f-payer", "f-tin"].includes(id)) render();
  });
}

/* ------------------------------------------------------------- provider -- */
function screenProvider(pid) {
  const p = providerOf(pid);
  if (!p) return `<div class="page-head"><h1>Provider not found</h1><a class="btn" href="#/">Back to pipeline</a></div>`;
  const ens = enrollmentsOf(p.id);
  const lic = state.licenses[p.id] || [];
  const mal = DATA.malpractice[p.id] || null;
  const locs = DATA.locations[p.id] || [];
  const licBad = lic.filter((l) => l.status !== "active");
  const certRec = (state.gate["P07-PN"] || {}).cert;
  const malBad = mal && mal.status !== "active"
    ? (certRec && certRec.status === "cleared" ? null : { why: `Policy ${mal.policy} ${mal.expires ? "expired " + mal.expires : "not current"} — renewal needed before submission.` })
    : null;
  const flagCount = licBad.length + (malBad ? 1 : 0) + (p.intake === "missing" ? 1 : 0);
  const fle = ens.filter((e) => e.status === "needs_action");

  return `
    <div class="page-head">
      <div class="crumb"><a href="#/">Pipeline</a> / Provider</div>
      <h1>${esc(p.name)}</h1>
      <p class="sub">${esc(p.role)} · ${p.states.join(", ")} · ${esc(tinOf(p.tins[0]).label)}</p>
    </div>
    ${flagCount ? `<div class="alert alert-red"><div class="alert-title">${flagCount} item${flagCount > 1 ? "s" : ""} need${flagCount > 1 ? "" : "s"} attention</div>
      ${licBad.map((l) => `<div>• ${l.state} license ${l.status === "missing" ? "missing" : "not active"} — ${esc(l.verified)}</div>`).join("")}
      ${malBad ? `<div>• Malpractice: ${esc(malBad.why)}</div>` : ""}
      ${p.intake === "missing" ? `<div>• Intake incomplete — missing tax entity confirmation</div>` : ""}
    </div>` : `<div class="alert alert-green"><div class="alert-title">No open issues</div><div>This profile is complete for credentialing and enrollment.</div></div>`}

    <div class="card pane">
      <div class="pane-head"><h2>Imported profile</h2><span class="chip chip-import">CAQH-style import (simulated)</span></div>
      <div class="kv">
        ${[["NPI", p.npi + " (synthetic format)"], ["Date of birth", p.dob + " (synthetic)"], ["Specialty", p.role.split(" — ")[1]], ["Taxonomy", p.taxonomy], ["CAQH ID", p.caqh + " (synthetic)"], ["Provider type", "Individual (simulated)"]]
          .map(([k, v]) => `<div class="kv-row"><span class="kv-k">${k}</span><span class="kv-v">${esc(v)}</span></div>`).join("")}
      </div>
      <button class="btn btn-ghost" data-action="source" data-src="profile" data-pid="${p.id}">View source record</button>
    </div>

    <div class="card pane">
      <div class="pane-head"><h2>Licenses</h2></div>
      ${lic.length ? lic.map((l) => `
        <div class="kv-row ${l.status !== "active" ? "row-bad" : ""}">
          <div>
            <div class="kv-k">${l.state} license</div>
            <div class="kv-v">${l.number ?? "No license on record"} · ${esc(l.board)}</div>
            <div class="kv-sub">${l.issued ? "Issued " + l.issued + " · " : ""}Expires ${l.expires ?? "—"} · Verified ${l.verified ?? "—"}</div>
            ${l.status !== "active" ? `<div class="reason-bad">${l.status === "missing" ? "Missing license — enrollment to this state is blocked. " + esc(l.verified) : "Not active."}</div>` : ""}
          </div>
          <span class="chip ${l.status === "active" ? "chip-ok" : "chip-bad"}">${l.status === "active" ? "Active" : l.status === "missing" ? "Missing" : "Expired"}</span>
        </div>`).join("")
      : `<div class="empty">No license records yet — intake pending for this provider.</div>`}
    </div>

    <div class="card pane">
      <div class="pane-head"><h2>Malpractice</h2></div>
      ${mal ? `
        <div class="kv">
          ${[["Carrier", mal.carrier], ["Policy", mal.policy], ["Period", mal.period], ["Type", mal.type], ["Per-claim limit", mal.perClaim], ["Aggregate limit", mal.aggregate], ["Status", mal.status]].map(([k, v]) => `<div class="kv-row"><span class="kv-k">${k}</span><span class="kv-v">${esc(v)}</span></div>`).join("")}
        </div>
        ${certRec && certRec.status === "cleared"
          ? `<div class="kv-sub">Renewed certificate ${esc(certRec.doc || "uploaded (simulated)")} on record — clear for submission.</div>`
          : malBad ? `<div class="reason-bad">${esc(malBad.why)}</div>` : ""}
        <button class="btn btn-ghost" data-action="source" data-src="malpractice" data-pid="${p.id}">View source record</button>`
      : `<div class="empty">No malpractice record on file.</div>`}
    </div>

    <div class="card pane">
      <div class="pane-head"><h2>Practice locations</h2><span class="chip chip-import">Roster (simulated)</span></div>
      ${locs.length ? locs.map((l) => `
        <div class="kv-row">
          <div>
            <div class="kv-k">${esc(l.name)} ${l.primary ? '<span class="chip chip-ok">Primary</span>' : ""}</div>
            <div class="kv-v">${esc(l.address)}</div>
            <div class="kv-sub">${esc(l.phone)} · ${esc(l.tin)} · updated ${esc(l.updated)}</div>
          </div>
        </div>`).join("")
      : `<div class="empty">No practice locations on file.</div>`}
    </div>

    <div class="card pane">
      <div class="pane-head"><h2>Enrollments</h2></div>
      ${ens.length ? ens.map((e) => `
        <div class="kv-row">
          <div>
            <div class="kv-k">${esc(payerOf(e.payerId).name)} — ${esc(payerOf(e.payerId).lob)} · ${e.state}</div>
            <div class="kv-v">Projected ${projectedDays(e)} days-to-enroll ${e.status === "approved" ? `· actual ${e.actualDays} days · payer ID ${esc(e.payerAccount)}` : ""}</div>
            ${e.status === "needs_action" ? `<div class="reason-bad">Returned: ${esc(e.returnReason)}</div>` : ""}
            ${e.hardStop && e.hardStop.active ? `<div class="reason-bad">${esc(e.hardStop.reason)}</div>` : ""}
          </div>
          <div class="kv-act">
            ${statusChip(e)}
            ${e.packet ? `<a class="btn btn-sm" href="#/packet/${e.id}">Open packet</a>`
              : e.status === "needs_action" ? `<button class="btn btn-sm" data-action="resolve-return" data-id="${e.id}">Resolve return</button>`
              : `<span class="muted sm">Agent queue — packet not drafted</span>`}
          </div>
        </div>`).join("")
      : `<div class="empty">No payer enrollments yet — starts after credentialing.</div>`}
    </div>
    <div class="synthetic-note">${esc(DATA.meta.syntheticNotice)}</div>`;
}

function wireProvider(main) {
  main.addEventListener("click", (ev) => {
    const t = ev.target.closest("[data-action]");
    if (!t) return;
    if (t.dataset.action === "source") showSourceModal(t.dataset.src, providerOf(t.dataset.pid), null);
    if (t.dataset.action === "resolve-return") openReturnModal(t.dataset.id);
  });
}

/* --------------------------------------------------------------- packet -- */
function packetTabs(enr, tab) {
  return `<div class="tabs" role="tablist">
    <a class="tab ${tab === "draft" ? "active" : ""}" href="#/packet/${enr.id}/draft" role="tab">Draft</a>
    <a class="tab ${tab === "review" ? "active" : ""}" href="#/packet/${enr.id}/review" role="tab">Review gate</a>
    <a class="tab ${tab === "tracker" ? "active" : ""}" href="#/packet/${enr.id}/tracker" role="tab">Tracker</a>
  </div>`;
}

function screenPacket(eid, tab = "draft") {
  const enr = state.enrollments.find((e) => e.id === eid);
  if (!enr) return `<div class="page-head"><h1>Enrollment not found</h1><a class="btn" href="#/">Back to pipeline</a></div>`;
  const p = providerOf(enr.providerId);
  const payer = payerOf(enr.payerId);
  const st = state.packets[enr.id] || {};

  if (!enr.packet) {
    return `
      <div class="page-head">
        <div class="crumb"><a href="#/">Pipeline</a> / <a href="#/provider/${p.id}">${esc(p.name)}</a> / Packet</div>
        <h1>${esc(p.name)} · ${esc(payer.name)}</h1>
        <p class="sub">${esc(p.role)} · ${enr.state} · ${esc(payer.lob)}</p>
      </div>
      <div class="card pane"><div class="empty">
        <h2>No packet drafted yet</h2>
        <p>The agent drafts packets in priority order (simulated queue). Expected within 2 days of enrollment start.</p>
        <p class="muted">A person reviews every agent draft before anything is submitted — drafts are never sent by the agent alone.</p>
      </div></div>
      <div class="synthetic-note">${esc(DATA.meta.syntheticNotice)}</div>`;
  }

  if (tab === "review") return reviewTab(enr, p, payer, st);
  if (tab === "tracker") return trackerTab(enr, p, payer);
  return draftTab(enr, p, payer, st);
}

function draftTab(enr, p, payer, st) {
  const checks = checksFor(enr);
  const cc = checkCounts(checks);
  const gaps = ["cert", "location", "w9", "signature", "license"].filter((g) => enr.gate.includes(g) && (g !== "signature" || (st.signatureFix && enr.status === "needs_action")));
  let unresolved = 0;
  const fieldsHtml = [];
  let curSec = null;
  for (const f of FIELD_TEMPLATE) {
    if (f.sec !== curSec) {
      if (curSec !== null) fieldsHtml.push(`</div>`);
      curSec = f.sec;
      fieldsHtml.push(`<div class="fsect"><div class="fsect-title">${f.sec}</div>`);
    }
    const gs = gateStatus(enr, f.gap);
    const isGap = gaps.includes(f.gap) && gs.status !== "cleared";
    const sigFix = f.key === "signature" && st.signatureFix && enr.status === "needs_action";
    let value = isGap ? null : f.val(p, enr);
    if (f.gap === "cert" && gs.status === "cleared") value = certValue(enr);
    if (isGap && f.gap === "location") {
      value = locFor(enr)?.tin ?? null; // the drafted location's TIN — it fails the check
    }
    if (isGap) unresolved += 1;
    const chip = isGap
      ? (value == null
          ? `<span class="chip chip-fail">Missing — resolve in Review</span>`
          : `<span class="chip chip-fail">Fails check — resolve in Review</span>`)
      : `<button class="chip chip-src ${SRC_STAGE[f.src]}" data-action="source" data-src="${f.src}" data-eid="${enr.id}">${SRC_DISPLAY[f.src]}</button>`;
    fieldsHtml.push(`
      <div class="frow ${sigFix ? "frow-fix" : ""} ${isGap ? "frow-gap" : ""}">
        <div class="frow-main">
          <div class="f-k">${f.label}${sigFix ? ` <span class="badge badge-red badge-sm">Agent-drafted fix</span>` : ""}</div>
          <div class="f-v ${!value ? "f-v-empty" : ""}">${value == null ? "Not on record" : esc(value)}</div>
          ${sigFix ? `<div class="kv-sub">Payer returned the application — signature missing on page 3 (simulated). Agent drafted the signature block from the profile. <a href="#/packet/${enr.id}/review">Review it →</a></div>` : ""}
        </div>
        <div class="f-src">${chip}</div>
      </div>`);
  }
  fieldsHtml.push(`</div>`);
  const filled = 44 - unresolved;
  const story = !st.signatureFix || enr.status !== "needs_action"
    ? `<div class="agent-para">The agent filled <b>${filled} of 44 fields</b> from the record (simulated). Every filled field shows where its value came from. Unfilled fields wait on the record — a person resolves them in the Review gate, never the agent.</div>`
    : `<div class="agent-para">The agent drafted a fix for the returned application: signature block on form page 3, filled from the profile record. <b>${filled} of 44 fields</b> are populated. Confirm the fix in the Review gate.</div>`;

  return `
    <div class="page-head">
      <div class="crumb"><a href="#/">Pipeline</a> / <a href="#/provider/${p.id}">${esc(p.name)}</a> / Packet</div>
      <h1>${esc(p.name)} · ${esc(payer.name)}</h1>
      <p class="sub">${esc(p.role)} · ${enr.state} · ${esc(payer.lob)} · started ${fmtDayYear(dateFromOffset(enr.start))} (simulated)</p>
      <div class="head-chips">${statusChip(enr)}<span class="chip chip-state">${enr.state}</span><span class="chip chip-days">~${projectedDays(enr)} days-to-enroll</span></div>
    </div>
    ${packetTabs(enr, "draft")}
    ${enr.hardStop && enr.hardStop.active && isHardStopped(enr) ? `
      <div class="alert alert-red" role="alert">
        <div class="alert-title">Pre-flight hard stop — cannot submit</div>
        <div>${esc(enr.hardStop.reason)}</div>
        <div class="alert-act"><a class="btn btn-sm" href="#/packet/${enr.id}/review">Route licensing task →</a></div>
      </div>` : ""}
    <div class="alert alert-blue"><div class="alert-title">Review required</div><div>This is an agent draft. Nothing is submitted until a named reviewer clears the blockers and signs. ${cc.fail ? cc.fail + " blocker(s) open." : "No blockers — still requires a reviewer signature."}</div></div>
    <div class="card pane">
      <div class="pane-head"><h2>Pre-flight checks</h2><span class="muted">agent, simulated</span></div>
      <div class="checks">
        ${checks.map((c) => `
          <div class="check check-${c.state}">
            <span class="check-ic" aria-hidden="true">${c.state === "pass" ? "✓" : c.state === "fail" ? "✕" : "?"}</span>
            <div class="check-body">
              <div class="check-label">${esc(c.label)} <span class="chip chip-${c.state}">${c.state === "pass" ? "Pass" : c.state === "fail" ? "Fail" : "Can't tell"}</span></div>
              <div class="check-reason">${esc(c.reason)}</div>
            </div>
          </div>`).join("")}
      </div>
    </div>
    <div class="card pane">
      <div class="pane-head"><h2>Packet draft</h2><span class="chip chip-agent">Agent-filled · ${filled}/44</span></div>
      ${story}
      <div class="progress"><div class="progress-bar" style="width:${Math.round((filled / 44) * 100)}%"></div><span>${filled}/44 fields</span></div>
      ${fieldsHtml.join("")}
    </div>
    <div class="synthetic-note">${esc(DATA.meta.syntheticNotice)}</div>`;
}

function gateItemDefs(enr) {
  const p = providerOf(enr.providerId);
  const m = DATA.malpractice[p.id];
  return {
    cert: { title: "Malpractice certificate", why: `Policy ${m?.policy || ""} expired ${m?.expires || ""} — the renewed certificate is not on record. Payers reject expired certificates; the check would fail.`,
      actions: [["upload", "Upload renewed certificate (simulated)"], ["not_needed", "Not needed"]], btn: "Upload certificate" },
    location: { title: "Practice location / TIN", why: `The draft picked a location whose TIN does not match the tax entity on file (${tinOf(p.tins[0]).label}). A wrong TIN on an application is the #1 reason payers return packets.`,
      actions: [["choose", "Choose the right location"], ["not_needed", "Not needed"]], btn: "Choose location" },
    w9: { title: "W-9 on payer record", why: state.portalUp ? "No W-9 found on the payer record." : "Payer North portal is unavailable (simulated) — the agent can't verify the W-9 pull. Verify from uploaded records instead.",
      actions: [["upload", "Upload W-9 from record (simulated)"], ["confirm", "Confirm on record"], ["not_needed", "Not needed"]], btn: "Upload W-9" },
    address: { title: "Primary location confirmation", why: "Primary location was updated Sep 2, 2026. Confirm the current address before submission.",
      actions: [["confirm", "Confirm current location"], ["not_needed", "Not needed"]], btn: "Confirm location" },
    license: { title: `Active license in ${enr.state}`, why: "No active license on record for the target state. Enrollment cannot be submitted until the license is active.",
      actions: [["route", "Route a Licensing task (simulated)"]], btn: "Route licensing task" },
    signature: { title: "Application signature (form page 3)", why: "Payer returned the application: missing signature on form page 3 (simulated). The agent drafted the signature block from the profile.",
      actions: [["confirm", "Confirm agent-drafted signature"], ["not_needed", "Not needed"]], btn: "Confirm signature" },
  };
}

function gateItemsFor(enr) {
  const st = state.packets[enr.id] || {};
  const items = [...(enr.gate || [])];
  if (st.signatureFix && enr.status === "needs_action" && !items.includes("signature")) items.push("signature");
  return items;
}
function reviewTab(enr, p, payer, st) {
  const defs = gateItemDefs(enr);
  const items = gateItemsFor(enr);
  const signed = !!state.signed[enr.id];
  const open = items.filter((g) => !isCleared(enr, g));
  const hardStop = enr.hardStop && enr.hardStop.active && isHardStopped(enr);
  const canSubmit = !hardStop && open.length === 0 && !!state.reviewerName.trim() && signed;
  const submitLabel = enr.status === "needs_action" ? "Resubmit to " + payer.name : `Submit to ${payer.name} (simulated)`;
  const blockedWhy = [];
  if (hardStop) blockedWhy.push("hard stop: license not active");
  if (open.length) blockedWhy.push(`${open.length} item${open.length > 1 ? "s" : ""} need action`);
  if (!state.reviewerName.trim()) blockedWhy.push("no reviewer name entered");
  if (!signed) blockedWhy.push("reviewer not signed");

  const submitBlockedNote = !canSubmit ? `<div class="gate-blocked">Submit is blocked: ${esc(blockedWhy.join(" · "))}. Click submit to see why.</div>` : "";

  return `
    <div class="page-head">
      <div class="crumb"><a href="#/">Pipeline</a> / <a href="#/provider/${p.id}">${esc(p.name)}</a> / Packet</div>
      <h1>Review gate · ${esc(p.name)} · ${esc(payer.name)}</h1>
      <p class="sub">A person clears the missing items and signs. The agent never submits alone.</p>
      <div class="head-chips">${statusChip(enr)}</div>
    </div>
    ${packetTabs(enr, "review")}
    ${hardStop ? `
      <div class="alert alert-red" role="alert">
        <div class="alert-title">Pre-flight hard stop — cannot submit</div>
        <div>${esc(enr.hardStop.reason)}</div>
      </div>` : ""}
    ${st.signatureFix && enr.status === "needs_action" ? `
      <div class="alert alert-amber" role="alert">
        <div class="alert-title">Payer return — agent drafted a fix</div>
        <div>${esc(enr.returnReason)}. The agent drafted the signature block on page 3 from the profile record. Confirm it below, then resubmit.</div>
      </div>` : ""}
    <div class="card pane">
      <div class="pane-head"><h2>Missing items</h2><span class="chip ${open.length ? "chip-fail" : "chip-ok"}">${open.length ? open.length + " open" : "All clear"}</span></div>
      ${items.length ? items.map((g) => {
        const d = defs[g];
        const gs = gateStatus(enr, g);
        if (gs.status === "cleared") return `
          <div class="gitem gitem-clear">
            <span class="check-ic ok" aria-hidden="true">✓</span>
            <div class="gitem-body">
              <div class="gitem-title">${d.title}</div>
              <div class="kv-sub">Cleared — ${esc(gs.detail || "resolved")}${gs.reason ? ` (reason: ${esc(gs.reason)})` : ""}</div>
            </div>
          </div>`;
        return `
          <div class="gitem">
            <span class="check-ic bad" aria-hidden="true">${g === "license" ? "⛔" : "!"}</span>
            <div class="gitem-body">
              <div class="gitem-title">${d.title} <span class="chip chip-fail">blocks submission</span></div>
              <div class="gitem-why">${esc(d.why)}</div>
              <div class="gitem-acts">
                ${g === "license" && (state.packets[enr.id] && state.packets[enr.id].routed)
                  ? `<span class="chip chip-agent">Licensing task routed — see demo controls to simulate approval</span>`
                  : d.actions.map(([act, label]) => `<button class="btn btn-sm" data-action="gate-action" data-item="${g}" data-act="${act}">${label}</button>`).join("")}
              </div>
            </div>
          </div>`;
      }).join("")
      : `<div class="empty"><h2>No missing items</h2><p>The draft is clean. A reviewer still has to sign before submission.</p></div>`}
    </div>

    <div class="card pane gate-sign">
      <div class="pane-head"><h2>Human gate</h2><span class="muted">every sign-off is logged</span></div>
      <label class="f-label" for="reviewer-name">Reviewer name</label>
      <input id="reviewer-name" class="f-input" type="text" autocomplete="name" placeholder="e.g. Kim Rivera (synthetic)" value="${esc(state.reviewerName)}">
      <label class="f-check"><input type="checkbox" id="sign-check" ${signed ? "checked" : ""}> I reviewed the draft, the source chips, and the cleared items, and I approve this submission.</label>
      ${!state.portalUp ? `<div class="kv-sub">Note: ${payer.name} portal is unavailable (simulated) — W-9 checks show Can't tell. Cleared items are verified from record copies.</div>` : ""}
      <div class="gate-submit">
        <button class="btn btn-primary btn-lg" data-action="submit" ${canSubmit ? "" : "aria-disabled='true'"}>${submitLabel}</button>
        ${submitBlockedNote}
      </div>
    </div>
    <div class="synthetic-note">${esc(DATA.meta.syntheticNotice)}</div>`;
}

function trackerTab(enr, p, payer) {
  const steps = [];
  const push = (label, when, done) => steps.push({ label, when, done });
  push("Draft", dateFromOffset(enr.start), true);
  push("Ready to submit", enr.submittedAt ? "cleared into submission" : (canSubmitNow() ? "now — sign in Review" : "waiting on gate"), !!enr.submittedAt || canSubmitNow());
  push("Submitted", enr.submittedAt ? timeLabel(enr.submittedAt) : null, !!enr.submittedAt || enr.status === "in_progress" || enr.status === "needs_action");
  push("In progress", enr.status === "in_progress" ? "payer reviewing (simulated)" : null, enr.status === "in_progress");
  push("Needs action", timeLabel(enr.returnAt), enr.status === "needs_action" || !!enr.returnAt);
  push("Approved", enr.effective ? "effective " + fmtDayYear(dateFromOffset(enr.effective)) : null, enr.status === "approved");

  const proj = projectedDays(enr);
  const breakD = delayBreakdown(enr);
  const daysCard = enr.status === "approved"
    ? `<div class="tile tile-days"><div class="tile-num">${enr.actualDays}</div><div class="tile-label">Actual days-to-enroll</div><div class="tile-sub">started ${fmtDay(dateFromOffset(enr.start))} → approved ${fmtDay(dateFromOffset(enr.effective))} (synthetic)</div></div>`
    : `<div class="tile tile-days tile-accent"><div class="tile-num">${proj}</div><div class="tile-label">Projected days-to-enroll</div><div class="tile-sub">${enr.baseDays} base estimate${breakD.length ? " + " + breakD.map((d) => d.days).join(" + ") : ""} (synthetic)${breakD.length ? `<div class="tile-sub">${breakD.map((d) => "• " + esc(d.label)).join("<br>")}</div>` : ""}</div></div>`;

  function canSubmitNow() {
    const st = state.packets[enr.id] || {};
    const open = gateItemsFor(enr).filter((g) => !isCleared(enr, g));
    return !(enr.hardStop && enr.hardStop.active && isHardStopped(enr)) && open.length === 0 && !enr.submittedAt && enr.status !== "approved";
  }

  const fups = followupsOf(enr.id);
  const payerDecision = (enr.status === "submitted" || enr.status === "in_progress") ? `
    <div class="card pane">
      <div class="pane-head"><h2>Payer decision</h2><span class="chip chip-agent">demo controls — simulated</span></div>
      <div class="kv-sub">These buttons stand in for the payer's portal. In production, follow-ups, returns, and approvals arrive automatically.</div>
      <div class="btn-row">
        <button class="btn btn-sm" data-action="sim-followup">Simulate follow-up</button>
        <button class="btn btn-sm btn-warn" data-action="sim-return">Simulate payer return</button>
        <button class="btn btn-sm btn-primary" data-action="sim-approve">Simulate approval</button>
      </div>
    </div>` : "";

  const approvedCard = enr.status === "approved" ? `
    <div class="card pane approved-card">
      <div class="pane-head"><h2>Approved</h2><span class="chip chip-ok">billable (simulated)</span></div>
      <div class="kv">
        <div class="kv-row"><span class="kv-k">Payer ID</span><span class="kv-v">${esc(enr.payerAccount)}</span></div>
        <div class="kv-row"><span class="kv-k">Effective date</span><span class="kv-v">${fmtDayYear(dateFromOffset(enr.effective))} (synthetic)</span></div>
        <div class="kv-row"><span class="kv-k">Time from start</span><span class="kv-v">${enr.actualDays} days</span></div>
      </div>
    </div>` : "";

  return `
    <div class="page-head">
      <div class="crumb"><a href="#/">Pipeline</a> / <a href="#/provider/${p.id}">${esc(p.name)}</a> / Packet</div>
      <h1>Submission tracker · ${esc(p.name)} · ${esc(payer.name)}</h1>
      <p class="sub">Every touchpoint logged by outcome and next action (simulated).</p>
      <div class="head-chips">${statusChip(enr)}</div>
    </div>
    ${packetTabs(enr, "tracker")}
    ${daysCard}
    ${enr.status === "needs_action" ? `
      <div class="alert alert-amber" role="alert">
        <div class="alert-title">Needs action — ${esc(payer.name)} returned the application</div>
        <div>${esc(enr.returnReason)}. Days-to-enroll now includes the return delay. Fix it in the <a href="#/packet/${enr.id}/review">Review gate</a> and resubmit.</div>
      </div>` : ""}
    <div class="card pane">
      <div class="pane-head"><h2>Status timeline</h2></div>
      <ol class="timeline">
        ${steps.map((s, i) => `
          <li class="tl ${s.done ? "done" : ""}">
            <span class="tl-dot">${s.done ? "✓" : i + 1}</span>
            <div class="tl-body">
              <div class="tl-label">${s.label}</div>
              <div class="tl-when">${s.when ? esc(s.when) : s.done ? "" : "pending"}</div>
            </div>
          </li>`).join("")}
      </ol>
    </div>
    <div class="card pane">
      <div class="pane-head"><h2>Follow-up log</h2><span class="muted">outcome + next step, simulated</span></div>
      ${fups.length ? fups.map((f) => `
        <div class="fup">
          <div class="fup-date">${timeLabel(f.date)}</div>
          <div class="fup-body">
            <div class="fup-out">${esc(f.outcome)}</div>
            <div class="fup-next">Next: ${esc(f.next)}</div>
          </div>
          <span class="chip ${f.owner === "payer" ? "chip-payer" : "chip-agent"}">${f.owner === "payer" ? "Payer" : "Our team"}</span>
        </div>`).join("")
      : `<div class="empty">No follow-ups yet — follow-ups are logged after submission.</div>`}
    </div>
    ${payerDecision}
    ${approvedCard}
    <div class="synthetic-note">${esc(DATA.meta.syntheticNotice)}</div>`;
}

function wirePacket(main) {
  main.addEventListener("click", (ev) => {
    const t = ev.target.closest("[data-action]");
    if (!t) return;
    const a = t.dataset.action;
    const eid = router.args[0];
    const enr = state.enrollments.find((e) => e.id === eid);
    if (!enr) return;

    if (a === "source") {
      const e = state.enrollments.find((x) => x.id === t.dataset.eid);
      const f = FIELD_TEMPLATE.find((f) => f.src === t.dataset.src);
      showSourceModal(t.dataset.src, providerOf(enr.providerId), e, f && SRC_DISPLAY[f.src]);
    }
    if (a === "gate-action") handleGateAction(enr, t.dataset.item, t.dataset.act);
    if (a === "submit") handleSubmit(enr);
    if (a === "sim-followup") simulateFollowup(enr);
    if (a === "sim-return") openReturnModal(enr.id, true);
    if (a === "sim-approve") openApproveModal(enr);
  });
  main.addEventListener("change", (ev) => {
    if (ev.target.id === "reviewer-name") { state.reviewerName = ev.target.value; save(); render(); }
    if (ev.target.id === "sign-check") { state.signed[router.args[0]] = ev.target.checked; if (ev.target.checked) logActivity({ actor: "human", name: state.reviewerName.trim() || "reviewer", provider: enrOf(router.args[0]).providerId, payer: enrOf(router.args[0]).payerId, text: `Signed the review gate for ${enrOf(router.args[0]).id}`, kind: "gate" }); else render(); }
  });
}
const enrOf = (id) => state.enrollments.find((e) => e.id === id);

function handleGateAction(enr, item, act) {
  const p = providerOf(enr.providerId);
  const payer = payerOf(enr.payerId);
  if (act === "not_needed") return openReasonModal(enr, item);
  if (act === "upload") {
    const doc = item === "cert" ? "CERT-20261003-R.pdf (synthetic)" : "W9-2026-R.pdf (synthetic)";
    state.gate[enr.id] = { ...(state.gate[enr.id] || {}), [item]: { status: "cleared", via: "upload", doc, detail: `Uploaded ${doc}` } };
    logActivity({ actor: "human", name: state.reviewerName.trim() || "Reviewer", provider: p.id, payer: enr.payerId, text: `Uploaded ${doc} to clear "${item === "cert" ? "malpractice certificate" : "W-9"}" (simulated upload)`, kind: "gate" });
    toast(`${doc} uploaded (simulated) — pre-flight re-checked`, "ok");
    render();
  }
  if (act === "confirm") {
    const detail = item === "w9" ? "Confirmed on record by reviewer" : item === "address" ? "Primary location confirmed current" : "Agent-drafted signature confirmed";
    state.gate[enr.id] = { ...(state.gate[enr.id] || {}), [item]: { status: "cleared", via: "confirm", detail } };
    logActivity({ actor: "human", name: state.reviewerName.trim() || "Reviewer", provider: p.id, payer: enr.payerId, text: `Confirmed: ${detail}`, kind: "gate" });
    render();
  }
  if (act === "choose") return openLocateModal(enr);
  if (act === "route") {
    state.packets[enr.id] = { ...(state.packets[enr.id] || {}), routed: true };
    logActivity({ actor: "agent", name: "Agent — Enrollment", provider: p.id, payer: enr.payerId, text: `Created Licensing task: ${enr.state} license for ${p.name} (simulated)`, kind: "license" });
    logActivity({ actor: "human", name: state.reviewerName.trim() || "Reviewer", provider: p.id, payer: enr.payerId, text: `Routed licensing task for ${enr.state} license`, kind: "license" });
    toast(`Licensing task routed (simulated) — enrollment resumes when the license is active`, "info");
    render();
  }
}

function handleSubmit(enr) {
  const p = providerOf(enr.providerId);
  const payer = payerOf(enr.payerId);
  const st = state.packets[enr.id] || {};
  const open = gateItemsFor(enr).filter((g) => !isCleared(enr, g));
  const hardStop = enr.hardStop && enr.hardStop.active && isHardStopped(enr);
  const blocked = [];
  if (hardStop) blocked.push("the packet is hard-stopped (no active license)");
  if (open.length) blocked.push(`${open.length} missing item${open.length > 1 ? "s" : ""} (${open.join(", ")})`);
  if (!state.reviewerName.trim()) blocked.push("no reviewer name entered");
  if (!state.signed[enr.id]) blocked.push("the reviewer has not signed");
  if (blocked.length) { toast("Submit is blocked: " + blocked.join("; ") + ".", "warn"); return; }

  const wasReturned = enr.status === "needs_action";
  enr.status = "submitted";
  enr.submittedAt = "-0h";
  if (wasReturned) enr.returnAt = state._returnAt || "-0h";
  save();
  logActivity({ actor: "human", name: state.reviewerName.trim(), provider: p.id, payer: enr.payerId, text: `${wasReturned ? "Resubmitted" : "Submitted"} packet to ${payer.name} (simulated) — ${payer.name} ${payer.lob}`, kind: "submission" });
  state.followups[enr.id] = [...(state.followups[enr.id] || []), { date: "now", outcome: `${wasReturned ? "Resubmitted after fix" : "Submitted"} — ${payer.name} ${payer.lob} (simulated)`, next: "Payer review; follow-up in 14 days if no response (simulated)", owner: "payer" }];
  save();
  toast(`Submitted to ${payer.name} (simulated). Days-to-enroll updated.`, "ok");
  render();
}

function simulateFollowup(enr) {
  const payer = payerOf(enr.payerId);
  state.followups[enr.id] = [...(state.followups[enr.id] || []), { date: "now", outcome: `Follow-up sent to ${payer.name}: application status (simulated)`, next: "Payer response expected within 7 days (simulated)", owner: "payer" }];
  logActivity({ actor: "agent", name: "Agent — Enrollment", provider: enr.providerId, payer: enr.payerId, text: `Follow-up sent to ${payer.name} (simulated)`, kind: "followup" });
  save(); render();
  toast("Follow-up logged (simulated)", "ok");
}

function openReturnModal(enrId, live = false) {
  const enr = enrOf(enrId);
  const payer = payerOf(enr.payerId);
  if (!live && enr.status !== "needs_action") return;
  const reasons = [
    "Missing signature on form page 3 (synthetic)",
    "Address page does not match tax entity (synthetic)",
    "Document page unreadable — fax issue (synthetic)",
  ];
  const cur = enr.returnReason || reasons[0];
  MODAL.innerHTML = `
    <div class="modal-backdrop" data-action="modal-close"></div>
    <div class="modal card" role="dialog" aria-modal="true" aria-labelledby="rm-title">
      <button class="modal-x btn" data-action="modal-close" aria-label="Close">✕</button>
      <h2 id="rm-title">Simulate payer return — ${esc(payer.name)}</h2>
      ${live ? `<p class="kv-sub">Demo control: stands in for a return via ${esc(payer.portal)}. Adds a return delay to days-to-enroll.</p>` : `<p class="kv-sub">Resolving the seeded return marks the fix applied and resubmits.</p>`}
      <label class="f-label" for="ret-reason">Return reason</label>
      <select id="ret-reason" class="f-select">${reasons.map((r) => `<option ${r === cur ? "selected" : ""}>${r}</option>`).join("")}</select>
      <label class="f-label" for="ret-fix">${live ? "Agent fix (simulated)" : "Fix applied"}</label>
      <textarea id="ret-fix" class="f-input" rows="2" placeholder="What the fix is (simulated)">${live ? "Agent drafts signature block from profile; reviewer re-approves (simulated)" : "Fix applied by team (simulated)"}</textarea>
      <div class="btn-row">
        <button class="btn btn-primary" data-action="ret-ok">${live ? "Return the application" : "Resubmit after fix"}</button>
        <button class="btn btn-ghost" data-action="modal-close">Cancel</button>
      </div>
    </div>`;
  MODAL.dataset.enr = enrId;
  MODAL.hidden = false;
}

function openApproveModal(enr) {
  const payer = payerOf(enr.payerId);
  const eff = new Date(Date.now() + 14 * DAY).toISOString().slice(0, 10);
  MODAL.innerHTML = `
    <div class="modal-backdrop" data-action="modal-close"></div>
    <div class="modal card" role="dialog" aria-modal="true" aria-labelledby="am-title">
      <button class="modal-x btn" data-action="modal-close" aria-label="Close">✕</button>
      <h2 id="am-title">Simulate approval — ${esc(payer.name)}</h2>
      <p class="kv-sub">Demo control: captures the approval the way the product would — payer ID and effective date (synthetic).</p>
      <label class="f-label" for="app-pid">Payer ID (synthetic)</label>
      <input id="app-pid" class="f-input" type="text" value="${esc(payer.id)}-${String(Math.floor(10000 + Math.random() * 89999))}">
      <label class="f-label" for="app-eff">Effective date (synthetic)</label>
      <input id="app-eff" class="f-input" type="date" value="${eff}">
      <div class="btn-row">
        <button class="btn btn-primary" data-action="app-ok">Approve</button>
        <button class="btn btn-ghost" data-action="modal-close">Cancel</button>
      </div>
    </div>`;
  MODAL.hidden = false;
}

function openReasonModal(enr, item) {
  const d = gateItemDefs(enr)[item];
  MODAL.innerHTML = `
    <div class="modal-backdrop" data-action="modal-close"></div>
    <div class="modal card" role="dialog" aria-modal="true" aria-labelledby="nm-title">
      <button class="modal-x btn" data-action="modal-close" aria-label="Close">✕</button>
      <h2 id="nm-title">Mark "${esc(d.title)}" as not needed</h2>
      <p class="kv-sub">A written reason is required and is saved to the activity log. This is the human gate: the agent cannot mark its own item not needed.</p>
      <label class="f-label" for="nm-reason">Reason (required)</label>
      <textarea id="nm-reason" class="f-input" rows="3" placeholder="Why this item does not apply (simulated)"></textarea>
      <div class="btn-row">
        <button class="btn btn-primary" data-action="nm-ok">Save reason</button>
        <button class="btn btn-ghost" data-action="modal-close">Cancel</button>
      </div>
    </div>`;
  MODAL.dataset.item = item;
  MODAL.hidden = false;
}

function openLocateModal(enr) {
  const p = providerOf(enr.providerId);
  const wantTin = tinOf(p.tins[0]).label;
  const locs = DATA.locations[p.id] || [];
  MODAL.innerHTML = `
    <div class="modal-backdrop" data-action="modal-close"></div>
    <div class="modal card" role="dialog" aria-modal="true" aria-labelledby="lm-title">
      <button class="modal-x btn" data-action="modal-close" aria-label="Close">✕</button>
      <h2 id="lm-title">Pick the location that matches the TIN</h2>
      <p class="kv-sub">Entity TIN on file: <b>${esc(wantTin)}</b></p>
      ${locs.length ? locs.map((l) => `
        <button class="loc-pick ${l.tin.startsWith("TIN 700-0001-A") || l.tin === wantTin ? "loc-match" : ""}" data-action="loc-ok" data-loc="${l.id}">
          <div class="loc-name">${esc(l.name)} ${l.primary ? "· primary" : ""}</div>
          <div class="kv-sub">${esc(l.address)}</div>
          <div class="kv-sub">${esc(l.tin)} ${l.tin === wantTin ? `<span class="chip chip-ok">matches entity</span>` : `<span class="chip chip-fail">mismatch</span>`}</div>
        </button>`).join("")
      : `<div class="empty">No locations on record.</div>`}
      <div class="btn-row"><button class="btn btn-ghost" data-action="modal-close">Cancel</button></div>
    </div>`;
  MODAL.hidden = false;
}

function showSourceModal(src, p, enr, extra) {
  const payload = sourcePayload(src, p, enr, extra);
  MODAL.innerHTML = `
    <div class="modal-backdrop" data-action="modal-close"></div>
    <div class="modal card" role="dialog" aria-modal="true" aria-labelledby="sm-title">
      <button class="modal-x btn" data-action="modal-close" aria-label="Close">✕</button>
      <h2 id="sm-title">${esc(payload.title)}</h2>
      <div class="kv">
        ${payload.rows.map(([k, v]) => `<div class="kv-row"><span class="kv-k">${esc(k)}</span><span class="kv-v">${esc(v)}</span></div>`).join("")}
      </div>
      <p class="kv-sub">${esc(payload.note)}</p>
    </div>`;
  MODAL.hidden = false;
}

/* ------------------------------------------------------------- activity -- */
const ACT_FILTERS = { provider: "all", payer: "all" };
function screenActivity() {
  const rows = state.activity.filter((a) =>
    (ACT_FILTERS.provider === "all" || a.provider === ACT_FILTERS.provider) &&
    (ACT_FILTERS.payer === "all" || a.payer === ACT_FILTERS.payer)
  );
  const actorChip = (a) => {
    if (a.actor === "agent") return `<span class="chip chip-agent">Agent</span>`;
    if (a.actor === "payer") return `<span class="chip chip-payer">${esc(a.name || "Payer")} (simulated)</span>`;
    if (a.actor === "system") return `<span class="chip chip-intake">System</span>`;
    return `<span class="chip chip-human">${esc(a.name || "Human")}</span>`;
  };
  const sel = (id, current, opts, label) => `
    <label class="f-label" for="${id}">${label}</label>
    <select id="${id}" class="f-select">
      <option value="all" ${current === "all" ? "selected" : ""}>All</option>
      ${opts.map((o) => `<option value="${o.value}" ${current === o.value ? "selected" : ""}>${esc(o.label)}</option>`).join("")}
    </select>`;
  return `
    <div class="page-head">
      <div class="eyebrow">Audit trail</div>
      <h1>Activity log</h1>
      <p class="sub">Every agent and human action, with time, actor, and what changed (simulated). Filter by provider or payer.</p>
    </div>
    <div class="filters card">
      ${sel("af-provider", ACT_FILTERS.provider, DATA.providers.map((p) => ({ value: p.id, label: p.name })), "Provider")}
      ${sel("af-payer", ACT_FILTERS.payer, DATA.payers.map((p) => ({ value: p.id, label: p.name })), "Payer")}
      <button class="btn btn-ghost" data-action="clear-af" ${ACT_FILTERS.provider !== "all" || ACT_FILTERS.payer !== "all" ? "" : "disabled"}>Clear</button>
    </div>
    <div class="card pane">
      <div class="act-list">
        ${rows.length ? rows.map((a) => `
          <div class="act-row">
            <div class="act-time">${timeLabel(a.time)}</div>
            <div class="act-main">
              <div class="act-line">${actorChip(a)} ${a.provider ? `<span class="chip chip-muted">${esc(providerOf(a.provider).name)}</span>` : ""} ${a.payer ? `<span class="chip chip-muted">${esc(payerOf(a.payer).name)}</span>` : ""}</div>
              <div class="act-text">${esc(a.text)}</div>
            </div>
          </div>`).join("")
        : `<div class="empty">No activity matches these filters. Change or clear the filters.</div>`}
      </div>
    </div>
    <div class="synthetic-note">${esc(DATA.meta.syntheticNotice)}</div>`;
}

function wireActivity(main) {
  main.addEventListener("change", (ev) => {
    if (ev.target.id === "af-provider") ACT_FILTERS.provider = ev.target.value;
    if (ev.target.id === "af-payer") ACT_FILTERS.payer = ev.target.value;
    if (["af-provider", "af-payer"].includes(ev.target.id)) render();
  });
  main.addEventListener("click", (ev) => {
    if (ev.target.closest('[data-action="clear-af"]')) { ACT_FILTERS.provider = "all"; ACT_FILTERS.payer = "all"; render(); }
  });
}

/* ------------------------------------------------------------ demo panel -- */
function demoPanel() {
  const portalState = state.portalUp;
  MODAL.innerHTML = `
    <div class="modal-backdrop" data-action="modal-close"></div>
    <div class="modal card modal-demo" role="dialog" aria-modal="true" aria-labelledby="dp-title">
      <button class="modal-x btn" data-action="modal-close" aria-label="Close">✕</button>
      <h2 id="dp-title">Demo controls</h2>
      <p class="kv-sub">Simulated switches for the walkthrough. Nothing here touches a real payer.</p>
      <div class="demo-group">
        <div class="demo-row">
          <div>
            <div class="kv-k">Payer portal</div>
            <div class="kv-sub">${portalState ? "All portals up (simulated)" : "Payer North down (simulated) — W-9 checks show Can't tell"}</div>
          </div>
          <button class="btn btn-sm" data-action="portal-toggle">${portalState ? "Simulate outage" : "Restore portal"}</button>
        </div>
        <div class="demo-row">
          <div>
            <div class="kv-k">Payer returns (Alternate 1)</div>
            <div class="kv-sub">Run it on the packet tracker: Submitted → Simulate payer return → fix signature in Review → resubmit.</div>
          </div>
          <button class="btn btn-sm" data-action="goto-alt1">Go to tracker</button>
        </div>
        <div class="demo-row">
          <div>
            <div class="kv-k">License hard stop (Alternate 2)</div>
            <div class="kv-sub">Provider 12 has no NY license. ${state.packets["P12-PE"] && state.packets["P12-PE"].routed ? "Licensing task routed." : "Route the licensing task from the packet."} ${isHardStopped(enrOf("P12-PE")) ? "License still missing." : "License is active — hard stop cleared."}</div>
          </div>
          <button class="btn btn-sm" data-action="license-approve" ${isHardStopped(enrOf("P12-PE")) ? "" : "disabled"}>Simulate NY license approval</button>
        </div>
        <div class="demo-row">
          <div>
            <div class="kv-k">Reset demo</div>
            <div class="kv-sub">Restores seed data and clears the activity log changes.</div>
          </div>
          <button class="btn btn-sm btn-warn" data-action="reset">Reset</button>
        </div>
      </div>
    </div>`;
  MODAL.hidden = false;
}

function licenseApprove() {
  const enr = enrOf("P12-PE");
  const p = providerOf("P12");
  state.licenses["P12"] = [
    ...state.licenses["P12"].filter((l) => l.state !== "NY"),
    { state: "NY", number: "L-90321 (synthetic)", status: "active", issued: "Oct 2026", expires: "Oct 2030", board: "NY State Education Dept (simulated)", verified: "Oct 3, 2026 (simulated)" },
  ];
  enr.hardStop.active = false;
  state.gate["P12-PE"] = { ...(state.gate["P12-PE"] || {}), license: { status: "cleared", via: "auto", detail: "NY license L-90321 approved — active (simulated)" } };
  state.packets["P12-PE"] = { ...(state.packets["P12-PE"] || {}), licenseCleared: true };
  logActivity({ actor: "system", name: "System", provider: "P12", payer: "PE", text: "NY license L-90321 approved and made active (simulated) — hard stop cleared, enrollment resumes", kind: "license" });
  MODAL.hidden = true;
  toast("NY license approved (simulated) — P12-PE can now proceed", "ok");
  render();
}

/* ------------------------------------------------------ global listeners -- */
function wireGlobal() {
  document.addEventListener("click", (ev) => {
    const t = ev.target.closest("[data-action]");
    if (!t) return;
    const a = t.dataset.action;
    if (a === "modal-close") { MODAL.hidden = true; return; }
    if (a === "demo-panel") { demoPanel(); return; }
    if (a === "portal-toggle") {
      state.portalUp = !state.portalUp;
      logActivity({ actor: "system", name: "System", provider: null, payer: state.portalUp ? null : "PN", text: state.portalUp ? "Payer North portal restored — W-9 checks re-ran (simulated)" : "Payer North portal reported unavailable (simulated outage)", kind: "system" });
      MODAL.hidden = true; toast(state.portalUp ? "Portal restored (simulated) — checks re-ran" : "Outage simulated — W-9 checks show Can't tell", state.portalUp ? "ok" : "warn"); render();
    }
    if (a === "license-approve") { licenseApprove(); return; }
    if (a === "goto-alt1") { MODAL.hidden = true; location.hash = `#/packet/${state.lastPacket}/tracker`; return; }
    if (a === "reset") {
      const enr = router.args[0] ? enrOf(router.args[0]) : null;
      if (confirm("Reset the demo to seed data? Your session changes (uploads, signs, submissions) will be cleared.")) {
        sessionStorage.setItem("er-reset", "1");
        localStorage.removeItem(LS_KEY);
        location.hash = "#/";
        location.reload();
      }
      return;
    }
    if (a === "ret-ok") {
      const id = MODAL.dataset.enr || router.args[0];
      const enr = enrOf(id);
      const reason = $("#ret-reason").value;
      const fix = $("#ret-fix").value.trim();
      if (!fix) { toast("Describe the fix (required)", "warn"); return; }
      if (enr.status === "needs_action") { // resolving a seeded return
        state.followups[enr.id] = [...(state.followups[enr.id] || []), { date: "now", outcome: `Fix applied and resubmitted: ${fix} (simulated)`, next: "Payer review; follow-up in 14 days (simulated)", owner: "payer" }];
        enr.returnDelay = enr.returnDelay || 0;
        enr.status = "in_progress"; enr.returnReason = null;
        logActivity({ actor: "human", name: state.reviewerName.trim() || "Reviewer", provider: enr.providerId, payer: enr.payerId, text: `Resolved payer return (${reason}) with fix: ${fix}`, kind: "return" });
        toast("Return resolved and resubmitted (simulated)", "ok");
      } else { // live Alternate 1
        state._returnAt = "now";
        state.packets[enr.id] = { ...(state.packets[enr.id] || {}), signatureFix: true };
        state.gate[enr.id] = { ...(state.gate[enr.id] || {}), signature: { status: "pending" } };
        enr.status = "needs_action"; enr.returnReason = reason; enr.returnDelay = (enr.returnDelay || 0) + 12; enr.returnAt = "now";
        state.followups[enr.id] = [...(state.followups[enr.id] || []), { date: "now", outcome: `${payerOf(enr.payerId).name} returned the application: ${reason}`, next: "Team fixes and resubmits", owner: "payer" }];
        logActivity({ actor: "payer", name: payerOf(enr.payerId).name, provider: enr.providerId, payer: enr.payerId, text: `Returned application: ${reason}`, kind: "return" });
        logActivity({ actor: "agent", name: "Agent — Enrollment", provider: enr.providerId, payer: enr.payerId, text: "Drafted fix: signature block on form page 3 from profile (simulated)", kind: "packet" });
        toast("Application returned (simulated) — +12 days added", "warn");
      }
      MODAL.hidden = true; save(); render();
      return;
    }
    if (a === "app-ok") {
      const enr = enrOf(router.args[0]);
      if (!enr) return;
      const pid = $("#app-pid").value.trim();
      const eff = $("#app-eff").value;
      if (!pid || !eff) { toast("Payer ID and effective date are required", "warn"); return; }
      enr.status = "approved"; enr.payerAccount = pid + " (synthetic)"; enr.effective = eff;
      enr.actualDays = Math.max(1, Math.round((dateFromOffset(eff) - dateFromOffset(enr.start)) / DAY));
      state.followups[enr.id] = [...(state.followups[enr.id] || []), { date: "now", outcome: `Approved — payer ID ${pid} and effective date ${fmtDayYear(dateFromOffset(eff))} captured (simulated)`, next: "None — enrollment complete", owner: "payer" }];
      logActivity({ actor: "payer", name: payerOf(enr.payerId).name, provider: enr.providerId, payer: enr.payerId, text: `Approved enrollment — captured payer ID ${pid}`, kind: "approval" });
      logActivity({ actor: "human", name: state.reviewerName.trim() || "Reviewer", provider: enr.providerId, payer: enr.payerId, text: "Captured payer ID and effective date (simulated)", kind: "approval" });
      MODAL.hidden = true; save(); render();
      toast(`${providerOf(enr.providerId).name} approved — not-yet-billable count updated`, "ok");
      return;
    }
    if (a === "nm-ok") {
      const reason = $("#nm-reason").value.trim();
      if (!reason) { toast("A written reason is required", "warn"); return; }
      const enr = enrOf(router.args[0]);
      const item = MODAL.dataset.item;
      if (enr && item) {
        const d = gateItemDefs(enr)[item];
        state.gate[enr.id] = { ...(state.gate[enr.id] || {}), [item]: { status: "cleared", via: "not_needed", reason } };
        logActivity({ actor: "human", name: state.reviewerName.trim() || "Reviewer", provider: enr.providerId, payer: enr.payerId, text: `Marked "${d.title}" not needed — reason: ${reason}`, kind: "gate" });
        toast('"Not needed" saved to the activity log', "ok");
        MODAL.hidden = true; save(); render();
      }
      return;
    }
    if (a === "loc-ok") {
      const enr = enrOf(router.args[0]);
      const l = (DATA.locations[enr.providerId] || []).find((x) => x.id === t.dataset.loc);
      if (enr && l) {
        state.gate[enr.id] = { ...(state.gate[enr.id] || {}), location: { status: "cleared", via: "choose", locId: l.id, detail: `Primary location set to ${l.name} — matches entity TIN` } };
        logActivity({ actor: "human", name: state.reviewerName.trim() || "Reviewer", provider: enr.providerId, payer: enr.payerId, text: `Picked ${l.name} as primary location (TIN now matches entity)`, kind: "gate" });
        toast(`Primary location set to ${l.name}`, "ok");
        MODAL.hidden = true; save(); render();
      }
      return;
    }
  });
  // modal keyboard
  MODAL.addEventListener("click", (ev) => {
    if (ev.target.classList.contains("modal-backdrop")) MODAL.hidden = true;
  });
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !MODAL.hidden) MODAL.hidden = true;
  });
}

async function init() {
  await load();
  wireGlobal();
  window.addEventListener("hashchange", render);
  render();
}
init();
