"use strict";
/* Trace to Gate — LangSmith-style console prototype.
   Synthetic data only. No real API calls, no model calls. */

/* ================================================================== *
 * Deterministic random + formatting helpers
 * ================================================================== */
function mulberry32(seed) {
  let a = seed;
  return function () {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const STATE_SEED = 20261003;
let rng = mulberry32(STATE_SEED);
function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
function range(lo, hi) { return lo + rng() * (hi - lo); }
function intRange(lo, hi) { return Math.floor(range(lo, hi + 1)); }
function hex8() {
  let s = "";
  for (let i = 0; i < 8; i++) s += "0123456789abcdef"[intRange(0, 15)];
  return s;
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function money(v) { return "$" + v.toFixed(3); }
function fmtMs(ms) { return ms >= 1000 ? (ms / 1000).toFixed(1) + " s" : Math.round(ms) + " ms"; }
function fmtNum(n) { return Math.round(n).toLocaleString("en-US"); }
function fmtPct(x) {
  const r = Math.round(x * 10) / 10;
  return (Number.isInteger(r) ? String(r) : r.toFixed(1)) + "%";
}
function fmtAge(min) {
  if (min < 60) return Math.max(1, Math.round(min)) + "m ago";
  if (min < 60 * 26) return Math.round(min / 60) + "h ago";
  const d = new Date(Date.now() - min * 60000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtWhen(iso) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay ? hh : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " + hh;
}
function nowISO() { return new Date().toISOString(); }

/* ================================================================== *
 * Synthetic traces (42: 4 story traces + 38 generated)
 * ================================================================== */
const FIXED = new Set(["run-9f3a2c1b", "run-c4d2f0a7", "run-88aa3e21", "run-1b7f5d0c"]);
function freshId() {
  let id;
  do { id = "run-" + hex8(); } while (FIXED.has(id));
  return id;
}

const MODELS = ["gpt-4.1", "gpt-4o-mini", "haiku-4.5"];

function llmStep(id, name, model, input, output, latency, tokens) {
  return { id, kind: "llm", name, status: "ok", model, input, output, latencyMs: latency, tokens };
}
function toolStep(id, name, input, output, latency, extra) {
  return Object.assign({ id, kind: "tool", name, status: "ok", input, output, latencyMs: latency }, extra || {});
}
function errStep(id, name, input, output, latency, error) {
  return { id, kind: "tool", name, status: "error", input, output, latencyMs: latency, error };
}

/* The hero trace: refund issued without policy check, order outside 30-day window */
function heroTrace() {
  const steps = [
    llmStep("st-hero-1", "Classify request", "gpt-4o-mini",
      { message: "I'd like a refund for order NW-48219. It arrived yesterday but I don't need it." },
      { intent: "refund_request", order_reference: "NW-48219", tone: "neutral" }, 612, 388),
    toolStep("st-hero-2", "lookup_order",
      { order_id: "NW-48219" },
      { order_id: "NW-48219", total: 89.99, placed_at: "2026-08-01", delivered_at: "2026-08-04", status: "delivered", already_refunded: false }, 340),
    llmStep("st-hero-3", "Choose next action", "gpt-4.1",
      { order: "NW-48219 (delivered 2026-08-04)", available_tools: ["check_refund_policy", "issue_refund", "send_email", "lookup_order"] },
      { action: "issue_refund", reason: "Customer requested a refund; order delivered", policy_checked: false }, 1450, 1216),
    errStep("st-hero-4", "issue_refund",
      { order_id: "NW-48219", amount: 89.99, reason: "customer_request" },
      { refund_id: "rf-77419", status: "issued", amount: 89.99 }, 890,
      {
        code: "POLICY_SKIPPED",
        message: "issue_refund ran before check_refund_policy. Order NW-48219 was delivered 63 days ago, outside the 30-day refund window — the refund should not have been issued.",
        why: "The model called issue_refund directly and never consulted check_refund_policy. Expected behavior: call check_refund_policy first, get CANNOT_REFUND (outside window), then refuse the refund and offer store credit or a return label."
      }),
    toolStep("st-hero-5", "send_email",
      { to: "customer@example.com", template: "refund_confirmed", order_id: "NW-48219", amount: 89.99 },
      { email_id: "em-55102", delivered: true }, 520),
    llmStep("st-hero-6", "Final reply", "gpt-4o-mini",
      { context: "refund rf-77419 confirmed by email" },
      { message: "Your refund of $89.99 for NW-48219 is on its way." }, 780, 402),
  ];
  const latency = steps.reduce((a, s) => a + s.latencyMs, 0);
  return {
    id: "run-9f3a2c1b", name: "Refund request #10482", status: "error", ageMin: 14,
    latencyMs: latency, tokens: 2448, cost: 0.031, feedback: null,
    tools: ["lookup_order", "issue_refund", "send_email"],
    intent: "refund", steps: [{ id: "st-hero-0", kind: "agent", name: "Refund Helper", status: "error", latencyMs: latency, children: steps }],
  };
}

function outsideWindowTrace(id, name, orderId, placedDaysAgo, ageMin) {
  const steps = [
    llmStep("st-" + id.slice(4, 8) + "-1", "Classify request", "gpt-4o-mini",
      { message: "Can I get a refund for " + orderId + "? I ordered it a while ago and never opened it." },
      { intent: "refund_request", order_reference: orderId, tone: "neutral" }, 540, 360),
    toolStep("st-" + id.slice(4, 8) + "-2", "lookup_order",
      { order_id: orderId },
      { order_id: orderId, total: 124.5, placed_at: "2026-08-01", delivered_at: "2026-08-06", status: "delivered", already_refunded: false }, 300),
    llmStep("st-" + id.slice(4, 8) + "-3", "Choose next action", "gpt-4.1",
      { order: orderId + " (delivered 2026-08-06)", available_tools: ["check_refund_policy", "issue_refund", "send_email", "lookup_order"] },
      { action: "issue_refund", reason: "Customer requested refund", policy_checked: false }, 1310, 1102),
    errStep("st-" + id.slice(4, 8) + "-4", "issue_refund",
      { order_id: orderId, amount: 124.5, reason: "customer_request" },
      { refund_id: "rf-" + hex8(), status: "issued", amount: 124.5 }, 840,
      {
        code: "POLICY_SKIPPED",
        message: "issue_refund ran before check_refund_policy. " + orderId + " was delivered " + placedDaysAgo + " days ago, outside the 30-day refund window.",
        why: "The model skipped check_refund_policy. Expected behavior: run the policy check, receive CANNOT_REFUND (outside window), refuse the refund and offer store credit."
      }),
    toolStep("st-" + id.slice(4, 8) + "-5", "send_email",
      { to: "customer@example.com", template: "refund_confirmed", order_id: orderId, amount: 124.5 },
      { email_id: "em-" + hex8(), delivered: true }, 480),
    llmStep("st-" + id.slice(4, 8) + "-6", "Final reply", "gpt-4o-mini",
      { context: "refund confirmed" },
      { message: "Your refund of $124.50 for " + orderId + " is on its way." }, 700, 384),
  ];
  const latency = steps.reduce((a, s) => a + s.latencyMs, 0);
  return {
    id, name, status: "error", ageMin,
    latencyMs: latency, tokens: 2220, cost: 0.029, feedback: null,
    tools: ["lookup_order", "issue_refund", "send_email"], intent: "refund",
    steps: [{ id: "st-" + id.slice(4, 8) + "-0", kind: "agent", name: "Refund Helper", status: "error", latencyMs: latency, children: steps }],
  };
}

function duplicateRefundTrace(id, ageMin) {
  const steps = [
    llmStep("st-" + id.slice(4, 8) + "-1", "Classify request", "gpt-4o-mini",
      { message: "I asked for a refund yesterday. Has it gone through yet?" },
      { intent: "refund_followup", order_reference: null, tone: "impatient" }, 501, 348),
    toolStep("st-" + id.slice(4, 8) + "-2", "lookup_order",
      { order_id: "NW-66319" },
      { order_id: "NW-66319", total: 42.0, status: "delivered", already_refunded: true, refund_id: "rf-55201", refunded_at: "2026-10-01" }, 290),
    llmStep("st-" + id.slice(4, 8) + "-3", "Choose next action", "gpt-4.1",
      { order: "NW-66319 (refunded rf-55201 on 2026-10-01)", available_tools: ["check_refund_policy", "issue_refund", "send_email", "lookup_order"] },
      { action: "issue_refund", reason: "Customer following up; assume refund needed", policy_checked: false }, 1290, 1087),
    errStep("st-" + id.slice(4, 8) + "-4", "issue_refund",
      { order_id: "NW-66319", amount: 42.0, reason: "customer_followup" },
      { refund_id: "rf-" + hex8(), status: "issued", amount: 42.0 }, 790,
      {
        code: "DUPLICATE_REFUND",
        message: "A second refund was issued for NW-66319. The order was already refunded (rf-55201) on 2026-10-01.",
        why: "The model ignored the lookup result showing already_refunded: true. Expected behavior: detect the existing refund, confirm it to the customer, and never issue a second one."
      }),
    toolStep("st-" + id.slice(4, 8) + "-5", "send_email",
      { to: "customer@example.com", template: "refund_confirmed", order_id: "NW-66319", amount: 42.0 },
      { email_id: "em-" + hex8(), delivered: true }, 460),
    llmStep("st-" + id.slice(4, 8) + "-6", "Final reply", "gpt-4o-mini",
      { context: "second refund confirmed" },
      { message: "Your refund was confirmed again — you should see it within 5-7 business days." }, 680, 371),
  ];
  const latency = steps.reduce((a, s) => a + s.latencyMs, 0);
  return {
    id, name: "Refund follow-up #10231", status: "error", ageMin,
    latencyMs: latency, tokens: 2200, cost: 0.028, feedback: null,
    tools: ["lookup_order", "issue_refund", "send_email"], intent: "refund",
    steps: [{ id: "st-" + id.slice(4, 8) + "-0", kind: "agent", name: "Refund Helper", status: "error", latencyMs: latency, children: steps }],
  };
}

function happyRefundTrace(id, ageMin) {
  const steps = [
    llmStep("st-" + id.slice(4, 8) + "-1", "Classify request", "gpt-4o-mini",
      { message: "Order NW-10423 arrived 12 days ago and it's still sealed. I'd like to return it." },
      { intent: "return_request", order_reference: "NW-10423", tone: "polite" }, 488, 330),
    toolStep("st-" + id.slice(4, 8) + "-2", "lookup_order",
      { order_id: "NW-10423" },
      { order_id: "NW-10423", total: 76.4, placed_at: "2026-09-21", delivered_at: "2026-09-22", status: "delivered", already_refunded: false }, 280),
    toolStep("st-" + id.slice(4, 8) + "-3", "check_refund_policy",
      { order_id: "NW-10423", delivered_at: "2026-09-22", now: "2026-10-04" },
      { decision: "ELIGIBLE", window_days: 30, days_since_delivery: 12, note: "within window" }, 230),
    toolStep("st-" + id.slice(4, 8) + "-4", "issue_refund",
      { order_id: "NW-10423", amount: 76.4, reason: "return_within_policy", policy_ref: "policy-ok-30d" },
      { refund_id: "rf-" + hex8(), status: "issued", amount: 76.4 }, 810),
    toolStep("st-" + id.slice(4, 8) + "-5", "send_email",
      { to: "customer@example.com", template: "refund_confirmed", order_id: "NW-10423", amount: 76.4 },
      { email_id: "em-" + hex8(), delivered: true }, 455),
    llmStep("st-" + id.slice(4, 8) + "-6", "Final reply", "gpt-4o-mini",
      { context: "refund rf- issued after policy check" },
      { message: "Your refund of $76.40 for NW-10423 is on its way." }, 655, 355),
  ];
  const latency = steps.reduce((a, s) => a + s.latencyMs, 0);
  return {
    id, name: "Refund request #10023", status: "pass", ageMin,
    latencyMs: latency, tokens: 2140, cost: 0.026, feedback: 4.8,
    tools: ["lookup_order", "check_refund_policy", "issue_refund", "send_email"], intent: "refund",
    steps: [{ id: "st-" + id.slice(4, 8) + "-0", kind: "agent", name: "Refund Helper", status: "ok", latencyMs: latency, children: steps }],
  };
}

/* generated traces */
function genStatusTrace(genNo) {
  const id = freshId();
  const orderId = "NW-" + intRange(10000, 99999);
  const steps = [
    llmStep("g" + genNo + "-1", "Classify request", "gpt-4o-mini",
      { message: "Where is my order " + orderId + "?" },
      { intent: "order_status", order_reference: orderId }, 420, 290),
    toolStep("g" + genNo + "-2", "lookup_order",
      { order_id: orderId },
      { order_id: orderId, status: pick(["in_transit", "out_for_delivery", "delivered"]), eta_days: intRange(0, 3) }, 260),
    llmStep("g" + genNo + "-3", "Final reply", "gpt-4o-mini",
      { context: "order " + orderId },
      { message: orderId + " is " + pick(["in transit", "out for delivery", "delivered"]) + "." }, 430, 210),
  ];
  const latency = steps.reduce((a, s) => a + s.latencyMs, 0);
  return {
    id, name: "Order status #" + intRange(1000, 9999), status: "pass", ageMin: intRange(2, 1400),
    latencyMs: latency, tokens: 640, cost: 0.009, feedback: range(4.0, 5.0),
    tools: ["lookup_order"], intent: "status", steps: [{ id: "g" + genNo + "-0", kind: "agent", name: "Refund Helper", status: "ok", latencyMs: latency, children: steps }],
  };
}

function genRefundTrace(genNo) {
  const id = freshId();
  const orderId = "NW-" + intRange(10000, 99999);
  const days = intRange(4, 28);
  const steps = [
    llmStep("g" + genNo + "-1", "Classify request", "gpt-4o-mini",
      { message: "I need a refund for " + orderId + " — it arrived " + days + " days ago and doesn't fit." },
      { intent: "refund_request", order_reference: orderId }, 470, 310),
    toolStep("g" + genNo + "-2", "lookup_order",
      { order_id: orderId },
      { order_id: orderId, total: Math.round(range(20, 240) * 100) / 100, status: "delivered", already_refunded: false }, 270),
    toolStep("g" + genNo + "-3", "check_refund_policy",
      { order_id: orderId, days_since_delivery: days },
      { decision: "ELIGIBLE", window_days: 30, days_since_delivery: days }, 220),
    toolStep("g" + genNo + "-4", "issue_refund",
      { order_id: orderId, refund_reason: "does_not_fit" },
      { refund_id: "rf-" + hex8(), status: "issued" }, 800),
    toolStep("g" + genNo + "-5", "send_email",
      { to: "customer@example.com", template: "refund_confirmed", order_id: orderId },
      { email_id: "em-" + hex8(), delivered: true }, 450),
    llmStep("g" + genNo + "-6", "Final reply", "gpt-4o-mini",
      { context: "refund issued for " + orderId },
      { message: "Your refund for " + orderId + " is on its way." }, 620, 330),
  ];
  const latency = steps.reduce((a, s) => a + s.latencyMs, 0);
  return {
    id, name: pick(["Refund request #", "Return request #"]) + intRange(1000, 9999), status: "pass", ageMin: intRange(3, 1400),
    latencyMs: latency, tokens: intRange(1900, 2800), cost: range(0.02, 0.04), feedback: range(3.8, 5.0),
    tools: ["lookup_order", "check_refund_policy", "issue_refund", "send_email"], intent: "refund",
    steps: [{ id: "g" + genNo + "-0", kind: "agent", name: "Refund Helper", status: "ok", latencyMs: latency, children: steps }],
  };
}

function genFailTrace(genNo) {
  const id = freshId();
  const orderId = "NW-" + intRange(10000, 99999);
  const days = intRange(31, 75);
  const steps = [
    llmStep("g" + genNo + "-1", "Classify request", "gpt-4o-mini",
      { message: "Refund for " + orderId + ", ordered a couple of months back." },
      { intent: "refund_request", order_reference: orderId }, 460, 300),
    toolStep("g" + genNo + "-2", "lookup_order",
      { order_id: orderId },
      { order_id: orderId, total: Math.round(range(20, 240) * 100) / 100, status: "delivered", already_refunded: false }, 275),
    llmStep("g" + genNo + "-3", "Choose next action", "gpt-4.1",
      { order: orderId + " (delivered)", available_tools: ["check_refund_policy", "issue_refund", "send_email", "lookup_order"] },
      { action: "issue_refund", policy_checked: false }, 1280, 1080),
    errStep("g" + genNo + "-4", "issue_refund",
      { order_id: orderId, reason: "customer_request" },
      { refund_id: "rf-" + hex8(), status: "issued" }, 800,
      {
        code: "POLICY_SKIPPED",
        message: "issue_refund ran before check_refund_policy. Order delivered " + days + " days ago, outside the 30-day refund window.",
        why: "The model called issue_refund without consulting check_refund_policy. Expected behavior: run the policy check first, then refuse the refund and offer store credit."
      }),
    toolStep("g" + genNo + "-5", "send_email",
      { to: "customer@example.com", template: "refund_confirmed", order_id: orderId },
      { email_id: "em-" + hex8(), delivered: true }, 440),
    llmStep("g" + genNo + "-6", "Final reply", "gpt-4o-mini",
      { context: "refund issued for " + orderId },
      { message: "Your refund for " + orderId + " is on its way." }, 610, 320),
  ];
  const latency = steps.reduce((a, s) => a + s.latencyMs, 0);
  return {
    id, name: "Refund request #" + intRange(1000, 9999), status: "error", ageMin: intRange(5, 900),
    latencyMs: latency, tokens: intRange(2000, 2900), cost: range(0.02, 0.04), feedback: null,
    tools: ["lookup_order", "issue_refund", "send_email"], intent: "refund",
    steps: [{ id: "g" + genNo + "-0", kind: "agent", name: "Refund Helper", status: "error", latencyMs: latency, children: steps }],
  };
}

function genFlaggedTrace(genNo) {
  // flagged traces never use check_refund_policy, so status=tool combos can be empty
  const id = freshId();
  const orderId = "NW-" + intRange(10000, 99999);
  const billing = genNo % 2 === 0;
  const steps = billing
    ? [
        llmStep("g" + genNo + "-1", "Classify request", "gpt-4o-mini",
          { message: "Why was I charged twice for " + orderId + "?" },
          { intent: "billing_question", order_reference: orderId }, 455, 285),
        toolStep("g" + genNo + "-2", "lookup_order",
          { order_id: orderId },
          { order_id: orderId, charges: [39.99, 39.99], status: "billing_dispute" }, 265),
        llmStep("g" + genNo + "-3", "Final reply", "gpt-4o-mini",
          { context: "two charges on " + orderId },
          { message: "Two charges were found; escalated to billing team." }, 590, 350),
      ]
    : [
        llmStep("g" + genNo + "-1", "Classify request", "gpt-4o-mini",
          { message: "Can you hold " + orderId + " at the door? I won't be home." },
          { intent: "delivery_instruction", order_reference: orderId }, 440, 270),
        toolStep("g" + genNo + "-2", "lookup_order",
          { order_id: orderId },
          { order_id: orderId, status: "out_for_delivery", notes: [] }, 260),
        llmStep("g" + genNo + "-3", "Final reply", "gpt-4o-mini",
          { context: "delivery instruction for " + orderId },
          { message: "Note added: leave with front desk. Flagged for confirmation because the order is already out for delivery." }, 610, 380),
      ];
  const latency = steps.reduce((a, s) => a + s.latencyMs, 0);
  return {
    id, name: billing ? "Billing question #" + intRange(1000, 9999) : "Delivery note #" + intRange(1000, 9999),
    status: "flagged", ageMin: intRange(1, 1300),
    latencyMs: latency, tokens: intRange(700, 1300), cost: range(0.009, 0.016), feedback: range(2.4, 3.6),
    tools: ["lookup_order", "send_email"], intent: billing ? "billing" : "delivery",
    steps: [{ id: "g" + genNo + "-0", kind: "agent", name: "Refund Helper", status: "ok", latencyMs: latency, children: steps }],
  };
}

function buildTraces() {
  rng = mulberry32(STATE_SEED);
  const list = [
    heroTrace(),
    outsideWindowTrace("run-c4d2f0a7", "Refund request #8891", "NW-77120", 47, 60 * 49),
    duplicateRefundTrace("run-88aa3e21", 60 * 31),
    happyRefundTrace("run-1b7f5d0c", 60 * 3),
  ];
  let genNo = 1;
  let flagged = 0, errors = 0;
  while (list.length < 42) {
    const r = rng();
    if (r < 0.70) list.push(genNo % 3 === 0 ? genRefundTrace(genNo) : genStatusTrace(genNo));
    else if (r < 0.86) { list.push(genFailTrace(genNo)); errors++; }
    else { list.push(genFlaggedTrace(genNo)); flagged++; }
    genNo++;
  }
  list.sort((a, b) => a.ageMin - b.ageMin);
  return list;
}
const TRACES = buildTraces();
const ANN_TRACE_A = TRACES.find((t) => t.intent === "delivery") || TRACES[10];
const ANN_TRACE_B = TRACES.find((t) => t.status === "error" && t.id !== "run-9f3a2c1b") || TRACES[5];

/* ================================================================== *
 * 24 h telemetry (synthetic) — chart strip
 * ================================================================== */
function hourSeries() {
  rng = mulberry32(STATE_SEED ^ 0x51ab);
  const h = [];
  for (let i = 0; i < 24; i++) {
    const wave = Math.sin(i / 24 * Math.PI * 2) * 0.5 + 0.5;
    h.push({
      err: Math.max(0.4, wave * 7 + rng() * 3 - 0.6),
      p50: 900 + rng() * 1400 + wave * 400,
      p99: 3200 + rng() * 3600 + wave * 900,
    });
  }
  return h;
}
const HOURS = hourSeries();

function sparkSVG(series, opts) {
  const W = 320, H = 96, PX = 40, PY = 10;
  const sers = opts.series.map((s) => ({ stroke: s.stroke, fill: s.fill, pts: series.map(s.get) }));
  const all = sers.flatMap((s) => s.pts);
  const min = Math.min(...all), max = Math.max(...all);
  const span = max - min || 1;
  const n = series.length;
  const x = (i) => PX + (i * (W - 2 * PX)) / (n - 1);
  const y = (v) => H - PY - ((v - min) / span) * (H - 2 * PY);
  let out = '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(opts.aria) + '">';
  for (let g = 0; g <= 2; g++) {
    const gy = PY + (g * (H - 2 * PY)) / 2;
    const gv = max - (g * span) / 2;
    out += '<line x1="' + PX + '" y1="' + gy + '" x2="' + (W - 4) + '" y2="' + gy + '" stroke="#c9d8ea" stroke-width="1" stroke-dasharray="3 4"/>';
    out += '<text x="' + (PX - 6) + '" y="' + (gy + 4) + '" font-size="9" fill="#8b9cb0" text-anchor="end">' + esc(opts.fmt(gv)) + "</text>";
  }
  out += '<text x="' + PX + '" y="' + (H - 2) + '" font-size="9" fill="#8b9cb0">-24h</text>';
  out += '<text x="' + (W - 4) + '" y="' + (H - 2) + '" font-size="9" fill="#8b9cb0" text-anchor="end">now</text>';
  sers.forEach((s) => {
    const spts = s.pts.map((v, i) => x(i) + "," + y(v)).join(" ");
    out += '<polygon points="' + PX + "," + (H - PY) + " " + spts + " " + (W - PX) + "," + (H - PY) + '" fill="' + s.fill + '" opacity="0.14"/>';
    out += '<polyline points="' + spts + '" fill="none" stroke="' + s.stroke + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
  });
  return out + "</svg>";
}
function fmtMsShort(ms) { return ms >= 1000 ? (ms / 1000).toFixed(1) + "s" : Math.round(ms) + "ms"; }

/* ================================================================== *
 * Session state (localStorage)
 * ================================================================== */
const LS_KEY = "trace-to-gate-v1";
const EVAL_SEEDS = [
  {
    id: "ex-01", title: "Refund inside 30-day window, item unused",
    input: "Customer: \"Order NW-10423 arrived 12 days ago, still sealed. I'd like to return it.\"",
    expected: "Call check_refund_policy first, confirm eligibility, then issue full refund and email confirmation.",
    fail: "none", source: "run-1b7f5d0c", fromProduction: true, human: "pass", addedAt: "2026-10-01T09:14:00Z",
  },
  {
    id: "ex-02", title: "Refund for order placed 47 days ago (phone order)",
    input: "Customer: \"Can I get a refund for NW-77120? I ordered it in July.\"",
    expected: "Call check_refund_policy before issue_refund. Refund must be denied outside the 30-day window; offer store credit or exchange.",
    fail: "outside-window", source: "run-c4d2f0a7", fromProduction: true, human: "pending", addedAt: "2026-10-02T13:47:00Z",
  },
  {
    id: "ex-03", title: "Duplicate refund attempt on the same order",
    input: "Customer: \"I asked for a refund yesterday. Has it gone through yet?\" (order NW-66319, already refunded)",
    expected: "Detect the existing refund (already_refunded: true), do not issue a second one, confirm the first refund to the customer.",
    fail: "duplicate", source: "run-88aa3e21", fromProduction: true, human: "pending", addedAt: "2026-10-02T08:02:00Z",
  },
];
const ANN_SEEDS = [
  { id: "ann-221", traceId: ANN_TRACE_A.id, category: "note", status: "done", by: "ana",
    note: "Bot offered a door-side hold at the last minute for an order already out for delivery. Wording suggestion: check tracking status before promising holds.", ts: "2026-10-02T12:05:00Z" },
  { id: "ann-222", traceId: ANN_TRACE_B.id, category: "bug", status: "bug", by: "kai",
    note: "Second outside-window refund this week. Candidate fix: tool guard that requires check_refund_policy before issue_refund.", ts: "2026-10-02T16:40:00Z" },
];
const ACT_SEEDS = [
  { who: "kai", what: 'added example "Refund for order placed 47 days ago (phone order)" from <a class="mono" href="#/trace/run-c4d2f0a7">run-c4d2f0a7</a> to Refund regressions', when: "2026-10-02T13:47:00Z" },
  { who: "kai", what: 'added example "Duplicate refund attempt on the same order" from <a class="mono" href="#/trace/run-88aa3e21">run-88aa3e21</a> to Refund regressions', when: "2026-10-02T08:02:00Z" },
  { who: "ana", what: 'marked annotation <span class="mono">ann-221</span> as Not a bug — reviewed wording and released', when: "2026-10-02T12:05:00Z" },
  { who: "system", what: 'blocked v15 deploy — Tool order check pass rate 33% (1/3), below the 100% threshold (run <span class="mono">exp-run-7b2ef0d1</span>)', when: "2026-10-02T18:31:00Z" },
];

function freshState() {
  return {
    examples: EVAL_SEEDS.map((e) => Object.assign({}, e)),
    annotations: ANN_SEEDS.map((a) => Object.assign({}, a)),
    added: ["run-c4d2f0a7", "run-88aa3e21"], // traces already contributing examples
    rule: { toolThreshold: 100, policyDrop: 5 },
    exp: { attempted: false, done: false, lastRunId: "exp-run-7b2ef0d1" },
    v15fixed: false,
    activity: ACT_SEEDS.map((a) => Object.assign({}, a)),
  };
}
let state = freshState();
(function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.examples && s.rule && s.exp && s.activity) {
        state = s;
        state.annotations = state.annotations || ANN_SEEDS.slice();
        state.added = state.added || [];
      }
    }
  } catch (e) { /* corrupted -> fresh */ }
})();
function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* storage full/blocked */ }
}
function mutate(fn) { state = fn(state); save(); }

/* find a trace by id */
function getTrace(id) { return TRACES.find((t) => t.id === id); }

/* ================================================================== *
 * Eval engine + gate
 * ================================================================== */
function freshIdShort(prefix) {
  let s = "";
  for (let i = 0; i < 6; i++) s += "0123456789abcdef"[intRange(0, 15)];
  return prefix + s;
}
function failKind(ex) { return ex.fail || "outside-window"; }
function evalResult(ex, mode) {
  let tool = failKind(ex) === "none" ? "pass" : "fail";
  let policy = failKind(ex) === "none" ? "pass" : "fail";
  let human = ex.human === "pass" ? "pass" : "pending";
  if (mode === "after") { tool = "pass"; policy = "pass"; }
  return { tool, policy, human };
}
function runEval(mode) {
  const rows = state.examples.map((ex) => ({ ex, ...evalResult(ex, mode) }));
  const c = (f) => rows.filter(f).length;
  return {
    rows,
    toolPass: c((r) => r.tool === "pass"), toolTotal: rows.length,
    policyPass: c((r) => r.policy === "pass"), policyTotal: rows.length,
    humanPass: c((r) => r.human === "pass"), humanTotal: rows.length,
  };
}
function fmtRate(p, t) { return t === 0 ? "n/a" : fmtPct((p / t) * 100) + " (" + p + "/" + t + ")"; }

function gateState() {
  const base = { status: "idle", reasons: [], failing: [], toolPct: null, policyPct: null, drop: null, rule: state.rule, runId: state.exp.lastRunId };
  if (state.examples.length === 0) return base;
  const live = runEval("live");
  const cur = runEval(state.v15fixed ? "after" : "before");
  const toolPct = (cur.toolPass / cur.toolTotal) * 100;
  const policyPct = (cur.policyPass / cur.policyTotal) * 100;
  const basePct = (live.policyPass / live.policyTotal) * 100;
  const drop = basePct - policyPct;
  const failing = cur.rows.filter((r) => r.tool === "fail" || r.policy === "fail");
  const rule = state.rule;
  const reasons = [];
  if (toolPct < rule.toolThreshold) {
    reasons.push("Tool order check pass rate is " + fmtPct(toolPct) + " (" + cur.toolPass + "/" + cur.toolTotal + "), below the " + rule.toolThreshold + "% threshold.");
  }
  if (drop > rule.policyDrop) {
    reasons.push("Policy grounded dropped " + fmtPct(drop) + " points vs the live baseline (" + fmtPct(basePct) + "), above the " + rule.policyDrop + "-point limit.");
  }
  const newest = state.examples[0];
  const newestFails = failing.some((r) => r.ex.id === newest.id);
  let newestLine = null;
  if (newestFails && newest.fromProduction) {
    newestLine = "Newest failing example: " + newest.title + " — from " + newest.source;
  }
  return {
    status: reasons.length > 0 ? "blocked" : "ready",
    reasons, failing, toolPct, policyPct, basePct, drop,
    rule, newestLine, runId: state.exp.lastRunId,
  };
}

/* patterns for a trace -> eval example */
function exampleFromTrace(trace) {
  const map = {
    "run-9f3a2c1b": {
      title: "Refund issued for NW-48219, delivered 63 days ago",
      input: "Customer: \"I'd like a refund for order NW-48219. It arrived yesterday but I don't need it.\" (order was delivered 63 days ago)",
      expected: "Call check_refund_policy before issue_refund. Refund must be denied outside the 30-day window; offer store credit or a return label.",
      fail: "outside-window",
    },
    "run-c4d2f0a7": {
      title: "Refund for order placed 47 days ago (phone order)",
      input: "Customer: \"Can I get a refund for NW-77120? I ordered it in July.\"",
      expected: "Call check_refund_policy before issue_refund. Refund must be denied outside the 30-day window; offer store credit or exchange.",
      fail: "outside-window",
    },
    "run-88aa3e21": {
      title: "Duplicate refund attempt on the same order",
      input: "Customer: \"I asked for a refund yesterday. Has it gone through yet?\" (order NW-66319, already refunded)",
      expected: "Detect the existing refund (already_refunded: true), do not issue a second one, confirm the first refund to the customer.",
      fail: "duplicate",
    },
  };
  return map[trace.id] || {
    title: "Refund issued without policy check — " + trace.name.toLowerCase(),
    input: "Customer message from production trace " + trace.id + " (" + trace.name + ")",
    expected: "Call check_refund_policy before issue_refund; only issue refunds within policy.",
    fail: "outside-window",
  };
}

/* ================================================================== *
 * Rendering helpers
 * ================================================================== */
const $ = (sel) => document.querySelector(sel);
function render() {
  const route = currentRoute();
  const gate = gateState();
  const pendingAnn = state.annotations.filter((a) => a.status === "bug" || a.status === "note" || a.status === "not-a-bug").length;

  // nav badges
  let el = $("#nav-traces"); if (el) el.textContent = String(TRACES.length);
  el = $("#nav-evals"); if (el) el.textContent = String(state.examples.length);
  el = $("#nav-annotations"); if (el) el.textContent = String(pendingAnn);
  el = $("#nav-activity"); if (el) el.textContent = String(state.activity.length);
  el = $("#nav-gate"); if (el) { el.textContent = gate.status === "blocked" ? "BLOCKED" : gate.status === "ready" ? "READY" : "IDLE"; }

  const pill = $("#top-gate-pill");
  const pillText = gate.status === "blocked" ? "Gate: BLOCKED" : gate.status === "ready" ? "Gate: READY" : "Gate: idle";
  pill.innerHTML = '<span class="lp"></span>' + esc(pillText);
  pill.className = "gate-pill " + gate.status;

  const main = $("#main");
  const body = viewFor(route);
  main.innerHTML = body;

  setActiveNav(route.view);
  restoreSelectedStep(route);
}
function currentRoute() {
  const h = location.hash || "#/traces";
  const m = h.match(/^#\/(traces|evals|gate|annotations|activity|trace)(?:\/([\w-]+))?/);
  if (!m) return { view: "traces", id: null };
  return { view: m[1], id: m[2] };
}
function setActiveNav(view) {
  document.querySelectorAll(".side-nav a").forEach((a) => {
    a.classList.toggle("active", a.dataset.nav === view);
  });
}
function restoreSelectedStep(route) {
  if (route.view === "trace") {
    const t = getTrace(route.id);
    if (!t) return;
    const sel = selSteps[route.id];
    const target = sel && findStep(t, sel);
    if (target) selectStep(route.id, target.id, false);
    else {
      const fail = findFailing(t);
      if (fail) selectStep(route.id, fail.id, false);
    }
  }
}
/* selected step memory (in-session only) */
const selSteps = {};
function findStep(trace, id) {
  for (const root of trace.steps) {
    if (root.id === id) return root;
    if (root.children) {
      const f = root.children.find((s) => s.id === id);
      if (f) return f;
    }
  }
  return null;
}
function findFailing(trace) {
  for (const root of trace.steps) {
    if (root.children) {
      const f = root.children.find((s) => s.status === "error");
      if (f) return f;
    }
    if (root.status === "error" && root.error) return root;
  }
  return null;
}

/* ================================================================== *
 * View: Traces list
 * ================================================================== */
const filters = { status: "all", tool: "all", latency: "" };
function allTools() {
  return ["lookup_order", "check_refund_policy", "issue_refund", "send_email"].filter((t) =>
    TRACES.some((tr) => tr.tools.includes(t)));
}

function statusChip(status) {
  const m = { pass: ["chip-pass", "pass"], error: ["chip-fail", "error"], flagged: ["chip-warn", "flagged"] };
  const [cls, label] = m[status];
  return '<span class="chip ' + cls + '"><span class="cd"></span>' + label + "</span>";
}

function filteredTraces() {
  return TRACES.filter((t) => {
    if (filters.status !== "all" && t.status !== filters.status) return false;
    if (filters.tool !== "all" && !t.tools.includes(filters.tool)) return false;
    if (filters.latency !== "" && t.latencyMs < parseInt(filters.latency, 10)) return false;
    return true;
  });
}

function rowHtml(t) {
  const fb = t.feedback === null ? '<span class="mono" style="color:var(--muted)">–</span>' : t.feedback.toFixed(1);
  const toolChips = t.tools.map((x) => '<span class="tool-chip">' + esc(x) + "</span>").join("");
  return (
    '<tr class="measurable" data-action="open-trace" data-trace="' + t.id + '" tabindex="0">' +
    "<td>" + statusChip(t.status) + "</td>" +
    "<td><div style=\"font-weight:600\">" + esc(t.name) + "</div>" +
    '<div class="mono" style="color:var(--muted)">' + esc(t.id) + "</div></td>" +
    "<td><span class=\"mono\">" + fmtMs(t.latencyMs) + "</span></td>" +
    "<td><span class=\"mono\">" + fmtNum(t.tokens) + "</span></td>" +
    "<td><span class=\"mono\">" + money(t.cost) + "</span></td>" +
    "<td>" + fb + "</td>" +
    '<td><div class="row-tools">' + toolChips + "</div></td>" +
    "<td><span class=\"mono\">" + fmtAge(t.ageMin) + "</span></td>" +
    "</tr>"
  );
}
function cardHtml(t) {
  const fb = t.feedback === null ? '<span class="mono" style="color:var(--muted)">–</span>' : t.feedback.toFixed(1);
  const toolChips = t.tools.map((x) => '<span class="tool-chip">' + esc(x) + "</span>").join("");
  return (
    '<div class="trace-card" data-action="open-trace" data-trace="' + t.id + '" role="link" tabindex="0">' +
    '<div class="tc-top"><div class="tc-name">' + esc(t.name) + "</div>" + statusChip(t.status) + "</div>" +
    '<div class="mono" style="color:var(--muted);margin-top:4px">' + esc(t.id) + "</div>" +
    '<div class="tc-meta">' +
    '<span>latency<b>' + fmtMs(t.latencyMs) + "</b></span>" +
    '<span>tokens<b>' + fmtNum(t.tokens) + "</b></span>" +
    '<span>cost<b>' + money(t.cost) + "</b></span>" +
    '<span>feedback<b>' + fb + "</b></span>" +
    '<span>time<b>' + fmtAge(t.ageMin) + "</b></span>" +
    "</div>" +
    '<div class="row-tools" style="margin-top:8px">' + toolChips + "</div>" +
    "</div>"
  );
}

function viewTraces() {
  const list = filteredTraces();
  const errAvg = HOURS.reduce((a, h) => a + h.err, 0) / HOURS.length;
  const p50 = HOURS[23].p50, p99 = HOURS[23].p99;
  const errN = TRACES.filter((t) => t.status === "error").length;
  const flagN = TRACES.filter((t) => t.status === "flagged").length;
  const hasFilter = filters.status !== "all" || filters.tool !== "all" || filters.latency !== "";
  const toolOpts = allTools().map((t) => '<option value="' + t + '"' + (filters.tool === t ? " selected" : "") + ">" + t + "</option>").join("");

  let listHtml;
  if (list.length === 0) {
    listHtml = '<div class="empty-state" data-action="clear-filters" role="button" tabindex="0">' +
      '<h2 class="es-title">No traces match these filters</h2>' +
      '<p class="es-body">Try a different status, tool, or latency value. The last 24 hours contain ' + TRACES.length + " runs total.</p>" +
      '<div class="es-actions"><button class="btn btn-primary" type="button">Clear filters</button></div></div>';
  } else {
    listHtml =
      '<div class="table-wrap"><table class="traces-table"><thead><tr>' +
      "<th>Status</th><th>Name</th><th>Latency</th><th>Tokens</th><th>Cost</th><th>Feedback</th><th>Tools</th><th>Time</th>" +
      "</tr></thead><tbody>" + list.map(rowHtml).join("") + "</tbody></table></div>" +
      '<div class="trace-cards">' + list.map(cardHtml).join("") + "</div>";
  }

  return (
    '<section class="view-head"><h1>Traces</h1>' +
    '<span class="chip chip-info" style="margin-left:10px"><span class="cd"></span>refund-helper · last 24 h</span>' +
    '<span class="mono" style="color:var(--muted);font-size:13px">' + list.length + " of " + TRACES.length + " runs</span></section>" +
    '<p class="lead">Every run of the Refund Helper agent, with latency, token, and cost data. An error trace is the seed for a regression eval.</p>' +

    '<div class="chart-strip">' +
    '<div class="chart-card"><div class="chart-head"><span class="chart-title">Error rate</span>' +
    '<span class="chart-note">last 24 h · synthetic telemetry</span></div>' +
    '<div class="chart-svg-wrap">' + sparkSVG(HOURS, { fmt: (v) => fmtPct(v), aria: "Error rate over the last 24 hours", series: [{ get: (h) => h.err, stroke: "#d92d20", fill: "#d92d20" }] }) + "</div></div>" +
    '<div class="chart-card"><div class="chart-head"><span class="chart-title">Latency</span>' +
    '<span class="chart-note">last 24 h · synthetic telemetry</span></div>' +
    '<div class="chart-legend"><span class="legend-item"><span class="sw c"></span>P50</span><span class="legend-item"><span class="sw d"></span>P99</span></div>' +
    '<div class="chart-svg-wrap">' + sparkSVG(HOURS, { fmt: fmtMsShort, aria: "P50 and P99 latency over the last 24 hours", series: [{ get: (h) => h.p50, stroke: "#7fc8ff", fill: "#7fc8ff" }, { get: (h) => h.p99, stroke: "#161f34", fill: "#161f34" }] }) + "</div></div>" +
    "</div>" +

    '<div class="stat-grid">' +
    '<div class="stat"><div class="k">Error rate · now</div><div class="v">' + fmtPct(errAvg) + '</div><div class="s">24 h average</div></div>' +
    '<div class="stat"><div class="k">P50 · now</div><div class="v">' + (p50 >= 1000 ? (p50 / 1000).toFixed(1) + " s" : Math.round(p50) + " ms") + '</div><div class="s">last hour</div></div>' +
    '<div class="stat"><div class="k">P99 · now</div><div class="v">' + (p99 >= 1000 ? (p99 / 1000).toFixed(1) + " s" : Math.round(p99) + " ms") + '</div><div class="s">last hour</div></div>' +
    '<div class="stat"><div class="k">Runs</div><div class="v">' + TRACES.length + '</div><div class="s">in list</div></div>' +
    '<div class="stat"><div class="k">Failed</div><div class="v">' + errN + '</div><div class="s" style="color:var(--red)">need attention</div></div>' +
    '<div class="stat"><div class="k">Flagged</div><div class="v">' + flagN + '</div><div class="s">for human review</div></div>' +
    "</div>" +

    '<div class="filter-bar">' +
    "<label for=\"f-status\">Status</label>" +
    '<select id="f-status" data-action="filter-status">' +
    '<option value="all"' + (filters.status === "all" ? " selected" : "") + ">All statuses</option>" +
    '<option value="pass"' + (filters.status === "pass" ? " selected" : "") + ">pass</option>" +
    '<option value="error"' + (filters.status === "error" ? " selected" : "") + ">error</option>" +
    '<option value="flagged"' + (filters.status === "flagged" ? " selected" : "") + ">flagged</option>" +
    "</select>" +
    "<label for=\"f-tool\">Tool</label>" +
    '<select id="f-tool" data-action="filter-tool"><option value="all"' + (filters.tool === "all" ? " selected" : "") + ">All tools</option>" + toolOpts + "</select>" +
    '<label for="f-lat">Latency ≥</label>' +
    '<input id="f-lat" type="number" min="0" step="100" placeholder="ms" value="' + esc(filters.latency) + '" data-action="filter-latency" style="width:110px">' +
    (hasFilter ? '<button class="filter-clear" data-action="clear-filters" type="button">Clear filters</button>' : "") +
    "</div>" +
    listHtml
  );
}

/* ================================================================== *
 * View: Trace detail
 * ================================================================== */
function kindTag(kind) {
  return '<span class="tn-kind ' + kind + '">' + kind + "</span>";
}

function treeNodeHtml(node, depth, failingId) {
  const isFail = node.status === "error" && node.kind !== "agent";
  const hasKids = node.children && node.children.length > 0;
  const pad = { paddingLeft: (8 + depth * 16) + "px" };
  const sel = selSteps.currentId || null;
  const cls = "tree-node" + (isFail ? " failing" : "") + (sel === node.id ? " selected" : "");
  const bulletCls = isFail ? "err" : node.kind === "agent" ? "run" : node.kind === "tool" ? "ok" : "";
  let row =
    '<div class="tn-row" style="' + (pad.paddingLeft ? "padding-left:" + pad.paddingLeft + ";" : "") + '">' +
    '<span class="tn-bullet ' + bulletCls + '"></span>' +
    '<span class="tn-namelabel">' + esc(node.name) + "</span>" +
    kindTag(node.kind) +
    (node.latencyMs ? '<span class="tn-meta">' + fmtMs(node.latencyMs) + (node.tokens ? " · " + fmtNum(node.tokens) + " tok" : "") + "</span>" : "") +
    (isFail ? '<span class="tn-fail-tag">failed' + (node.error ? " · " + esc(node.error.code) : "") + "</span>" : "") +
    (hasKids ? '<span class="tn-toggle" aria-hidden="true"></span>' : "") +
    "</div>";
  let kids = "";
  if (hasKids) {
    kids = '<div class="tn-children">' + node.children.map((c) => treeNodeHtml(c, depth + 1, failingId)).join("") + "</div>";
  }
  return '<div class="' + cls + '" data-action="select-step" data-trace="' + selSteps.traceId + '" data-step="' + node.id + '" style="' + (depth > 0 ? 'padding-left:' + (depth * 16) + 'px;' : "") + '">' + row + kids + "</div>";
}

function stepJson(v) { return esc(JSON.stringify(v, null, 2)); }

function stepDetailHtml(trace, step, isFailing) {
  const kindLabel = { agent: "agent span", llm: "llm call", tool: "tool call" }[step.kind];
  const statusChipHtml = step.status === "error"
    ? '<span class="chip chip-fail"><span class="cd"></span>error</span>'
    : '<span class="chip chip-pass"><span class="cd"></span>ok</span>';
  const inEval = state.added.includes(trace.id);
  let actions = "";
  if (isFailing) {
    if (inEval) {
      actions = '<a class="btn btn-primary" href="#/evals">In eval set — view example</a>' +
        '<button class="btn btn-ghost" data-action="annotate" data-trace="' + trace.id + '" type="button">Annotate</button>' +
        '<div class="step-inline-note">This trace is already guarding the deploy gate as an eval example.</div>';
    } else {
      actions = '<button class="btn btn-primary" data-action="add-to-eval" data-trace="' + trace.id + '" type="button">Add to eval set</button>' +
        '<button class="btn btn-ghost" data-action="annotate" data-trace="' + trace.id + '" type="button">Annotate</button>' +
        '<div class="step-inline-note">One action creates the dataset example, attaches the evaluators, and links it to the deploy gate.</div>';
    }
  } else {
    actions = '<button class="btn btn-ghost" data-action="annotate" data-trace="' + trace.id + '" type="button">Annotate</button>' +
      '<button class="btn" data-action="disabled-reason" type="button">Add to eval set</button>' +
      '<div class="step-inline-note">Only the failing step seeds an eval example — that is where the regression is.</div>';
  }

  const meta = [];
  if (step.latencyMs) meta.push('<div><div class="k">Latency</div><div class="v">' + fmtMs(step.latencyMs) + "</div></div>");
  if (step.tokens) meta.push('<div><div class="k">Tokens</div><div class="v">' + fmtNum(step.tokens) + "</div></div>");
  if (step.model) meta.push('<div><div class="k">Model</div><div class="v">' + esc(step.model) + "</div></div>");
  if (step.tool) meta.push('<div><div class="k">Tool</div><div class="v">' + esc(step.tool) + "</div></div>");
  meta.push('<div><div class="k">Kind</div><div class="v">' + kindLabel + "</div></div>");
  meta.push('<div><div class="k">Step</div><div class="v mono">' + esc(step.id) + "</div></div>");

  let errorBox = "";
  if (step.status === "error" && step.error) {
    errorBox = '<div class="error-box"><h3 class="eb-title">Failed <span class="eb-code">' + esc(step.error.code) + "</span></h3>" +
      '<p class="eb-msg">' + esc(step.error.message) + "</p>" +
      '<p class="eb-why"><span class="lbl">Why it failed:</span> ' + esc(step.error.why) + "</p></div>";
  }

  return (
    '<div class="step-panel">' +
    '<div class="step-head"><h2><span class="chip chip-blue"><span class="cd"></span>' + esc(step.name) + "</span>" + statusChipHtml + kindTag(step.kind) + "</h2>" +
    '<div class="step-meta">' + meta.join("") + "</div></div>" +
    '<div class="step-body">' +
    (typeof step.goal === "string" ? '<p style="font-size:15px;color:var(--muted);margin:0 0 14px">' + esc(step.goal) + "</p>" : "") +
    '<h3 class="section-label">Input</h3><pre class="json">' + stepJson(step.input) + "</pre>" +
    '<h3 class="section-label">Output</h3><pre class="json">' + stepJson(step.output) + "</pre>" +
    errorBox +
    '<div class="step-actions">' + actions + "</div>" +
    "</div></div>"
  );
}

function viewTrace(route) {
  const trace = getTrace(route.id);
  if (!trace) {
    return '<div class="empty-state"><h2 class="es-title">Trace not found</h2><p class="es-body">' + esc(route.id) +
      ' is not in the synthetic dataset.</p><div class="es-actions"><a class="btn btn-primary" href="#/traces">Back to traces</a></div></div>';
  }
  const fb = trace.feedback === null ? '<span class="mono" style="color:var(--muted)">–</span>' : trace.feedback.toFixed(1);
  const toolChips = trace.tools.map((x) => '<span class="tool-chip">' + esc(x) + "</span>").join("");
  const failing = findFailing(trace);
  const failingId = failing ? failing.id : null;
  selSteps.currentId = selSteps[route.id];
  selSteps.traceId = route.id;
  const tree = trace.steps.map((s) => treeNodeHtml(s, 0, failingId)).join("");
  const selected = selSteps.currentId ? findStep(trace, selSteps.currentId) : failing;
  const detail = selected ? stepDetailHtml(trace, selected, selected.id === failingId) : "";

  return (
    '<section class="view-head"><a class="btn btn-ghost btn-sm" href="#/traces">← Traces</a>' +
    "<h1>" + esc(trace.name) + "</h1>" + statusChip(trace.status) +
    '<span class="mono" style="color:var(--muted);font-size:13px">' + esc(trace.id) + " · " + fmtAge(trace.ageMin) + "</span></section>" +
    '<div class="trace-top"><span class="chip chip-info"><span class="cd"></span>agent: <span class="mono">refund-helper</span></span>' +
    '<span class="chip chip-info"><span class="cd"></span>' + fmtMs(trace.latencyMs) + "</span>" +
    '<span class="chip chip-info"><span class="cd"></span>' + fmtNum(trace.tokens) + " tokens</span>" +
    '<span class="chip chip-info"><span class="cd"></span>' + money(trace.cost) + "</span>" +
    '<span class="chip chip-info"><span class="cd"></span>feedback ' + fb + "</span></div>" +
    '<div class="row-tools" style="margin-top:10px">' + toolChips + "</div>" +

    '<div class="trace-detail-grid">' +
    '<div class="tree-panel"><h2 class="panel-title">Run tree</h2><div class="tree" data-tree="' + route.id + '">' + tree + "</div>" +
    '<p class="tree-help">Tap a step to see inputs and outputs. The failing step is marked in red.</p></div>' +
    '<div>' + detail + "</div>" +
    "</div>"
  );
}

/* ================================================================== *
 * View: Eval set
 * ================================================================== */
function exChip(label, cls) {
  return '<span class="chip ' + cls + '"><span class="cd"></span>' + label + "</span>";
}
function evaluatorChipsHtml(ex) {
  const mode = state.v15fixed ? "after" : "before";
  const r = evalResult(ex, mode);
  return (
    '<span class="eval-chip">Tool order check <span class="ekind">code</span>' + (r.tool === "pass" ? exChip("pass", "chip-pass") : exChip("fail", "chip-fail")) + "</span>" +
    '<span class="eval-chip">Policy grounded <span class="ekind">LLM-as-judge</span>' + (r.policy === "pass" ? exChip("pass", "chip-pass") : exChip("fail", "chip-fail")) + "</span>" +
    '<span class="eval-chip">Human review <span class="ekind">human</span>' + (r.human === "pass" ? exChip("reviewed", "chip-pass") : exChip("pending", "chip-info")) + "</span>"
  );
}

function viewEvals() {
  if (state.examples.length === 0) {
    return (
      '<section class="view-head"><h1>Eval set</h1><span class="chip chip-info"><span class="cd"></span>Refund regressions</span></section>' +
      '<div class="empty-state"><h2 class="es-title">No examples in the eval set</h2>' +
      '<p class="es-body">A deploy gate with no examples has nothing to check. Find a failed trace in production, inspect the bad tool call, and add it here — one action seeds an example, attaches evaluators, and guards the gate.</p>' +
      '<div class="es-actions"><a class="btn btn-primary" href="#/traces">Browse traces</a></div></div>'
    );
  }
  const list = state.examples.map((ex) => {
    const badge = ex.fromProduction
      ? '<span class="badge-fromprod">from production</span>'
      : '<span class="badge-seed">baseline</span>';
    return (
      '<div class="example-card"><div class="ex-top"><h3>' + esc(ex.title) + "</h3>" + badge + "</div>" +
      '<div class="ex-meta">' +
      '<div class="ex-field"><div class="k">Input</div><div class="v">' + esc(ex.input) + "</div></div>" +
      '<div class="ex-field"><div class="k">Expected behavior</div><div class="v">' + esc(ex.expected) + "</div></div>" +
      "</div>" +
      '<div class="ex-source"><a class="btn btn-ghost btn-sm" href="#/trace/' + esc(ex.source) + '">source trace ' + esc(ex.source) + "</a></div>" +
      '<div class="ex-evaluators">' + evaluatorChipsHtml(ex) + "</div>" +
      '<div class="ex-actions"><button class="btn btn-danger btn-sm" data-action="remove-example" data-example="' + ex.id + '" type="button">Remove</button></div>' +
      "</div>"
    );
  }).join("");
  return (
    '<section class="view-head"><h1>Eval set</h1>' +
    '<span class="chip chip-info"><span class="cd"></span>Refund regressions</span>' +
    '<span class="chip chip-info"><span class="cd"></span>' + state.examples.length + " examples</span></section>" +
    '<p class="lead">Examples grow from production failures: each one is a sharp regression case, not a random pile. Every example links back to the trace it came from.</p>' +
    '<div class="evals-legend"><span class="eval-chip">Tool order check <span class="ekind">code</span></span>' +
    '<span class="eval-chip">Policy grounded <span class="ekind">LLM-as-judge</span></span>' +
    '<span class="eval-chip">Human review <span class="ekind">human</span></span></div>' +
    '<div class="eval-list">' + list + "</div>"
  );
}

/* ================================================================== *
 * View: Deploy gate
 * ================================================================== */
function evCell(v) {
  const cls = v === "pass" ? "pass" : v === "fail" ? "fail" : "pending";
  const label = v === "pass" ? "pass" : v === "fail" ? "fail" : "pending";
  return '<span class="ev-cell ' + cls + '">' + label + "</span>";
}

function baRows(res) {
  return res.rows.map((r) =>
    '<div class="ba-row"><span class="bname" title="' + esc(r.ex.title) + '">' + esc(r.ex.title) + "</span>" +
    evCell(r.tool) + evCell(r.policy) + evCell(r.human) + "</div>"
  ).join("");
}
function baSummary(res) {
  const pct = res.toolTotal ? Math.round((res.toolPass / res.toolTotal) * 100) : 0;
  return (
    '<div class="ba-summary"><span class="ba-bar-label">' + pct + "% pass</span>" +
    '<div class="ba-bar" style="background:linear-gradient(90deg,var(--green) 0 ' + pct + '%, #d8e6f4 ' + pct + '% 100%)" aria-label="' + pct + "% pass rate\"></div>" +
    '<span class="ba-bar-label" style="min-width:120px;text-align:left;font-size:12.5px;color:var(--muted)">' + res.toolPass + "/" + res.toolTotal + " examples</span></div>"
  );
}

function viewGate() {
  const gate = gateState();
  const before = runEval("before");
  const after = state.exp.done ? runEval("after") : null;
  const stChipCls = gate.status === "blocked" ? "blocked" : gate.status === "ready" ? "ready" : "idle";
  const stLabel = gate.status === "blocked" ? "Blocked — v15 cannot deploy" : gate.status === "ready" ? "Ready — v15 may deploy" : "Idle — nothing to check";
  const stIcon = '<span class="gate-status-chip ' + stChipCls + '"><span class="dot"></span>' + stLabel + "</span>";

  const live = runEval("live");
  const showRs = state.v15fixed && after ? after : before;

  const reasonsHtml = gate.reasons.length
    ? gate.reasons.map((r) => "<div>" + esc(r) + "</div>").join("") + (gate.newestLine ? '<div class="mono" style="color:#9ED2FA;margin-top:8px">' + esc(gate.newestLine) + "</div>" : "")
    : gate.status === "ready"
      ? "<div>All checks pass under the current rule. Tool order check " + fmtRate(showRs.toolPass, showRs.toolTotal) + "; Policy grounded " + fmtRate(showRs.policyPass, showRs.policyTotal) + " vs live baseline " + fmtRate(live.policyPass, live.policyTotal) + ".</div>"
      : "<div>Add an example to the eval set to give the gate something to check.</div>";

  const actionBtn = !state.v15fixed
    ? '<button class="btn btn-primary" data-action="run-experiment" type="button">Apply fix and rerun</button>'
    : '<button class="btn btn-ghost" data-action="run-experiment" type="button">Rerun experiment</button>';
  const editBtn = '<button class="btn btn-ghost" data-action="edit-rule" type="button">Edit rule</button>';

  const v15 = state.v15fixed ? after : before;
  const basePct = live.policyTotal ? (live.policyPass / live.policyTotal) * 100 : 0;
  const candDrop = v15.policyTotal ? basePct - (v15.policyPass / v15.policyTotal) * 100 : 0;
  const toolOk = v15.toolTotal ? (v15.toolPass / v15.toolTotal) * 100 >= gate.rule.toolThreshold : true;
  const polOk = candDrop <= gate.rule.policyDrop;

  const regressions = gate.failing.length
    ? gate.failing.map((r) =>
      '<div class="regression-item"><div class="r-top"><h4>' + esc(r.ex.title) + "</h4>" +
      (r.ex.fromProduction ? '<span class="badge-fromprod">from production</span>' : "") + "</div>" +
      '<div class="r-fail">Fails: ' + (r.tool === "fail" ? "Tool order check" : "") + (r.tool === "fail" && r.policy === "fail" ? " and " : "") + (r.policy === "fail" ? "Policy grounded" : "") + "</div>" +
      '<div class="r-link"><a class="btn btn-ghost btn-sm" href="#/trace/' + esc(r.ex.source) + '">source trace ' + esc(r.ex.source) + "</a></div></div>"
    ).join("")
    : '<div class="empty-state" style="padding:16px"><h2 class="es-title" style="font-size:15px">No known regressions</h2>' +
      '<p class="es-body" style="font-size:14px">Every example passes the current rule.</p></div>';

  const col = (title, res, runId, note, footer) => {
    const allOk = res !== null && res.toolTotal > 0 && res.toolPass === res.toolTotal && res.policyPass === res.policyTotal;
    const chipCls = res === null ? "chip-info" : allOk ? "chip-pass" : "chip-fail";
    const chipLabel = res === null ? "pending" : allOk ? "all pass" : "failures";
    const empty = '<div class="ba-empty"><h3 class="be-title">No results yet</h3><p class="be-body">Run the experiment to compare — ' + esc(note || "") + "</p></div>";
    const body = res ? baSummary(res) + '<div class="ba-rows" style="display:grid;grid-template-columns:minmax(140px,1fr) auto auto auto;gap:8px;align-items:center"><div class="bname" style="font-weight:700">Example</div><div style="font-size:12px;color:var(--muted);font-weight:600">Tool order</div><div style="font-size:12px;color:var(--muted);font-weight:600">Policy grounded</div><div style="font-size:12px;color:var(--muted);font-weight:600">Human</div></div>' + baRows(res) : empty;
    return '<div class="ba-col"><div class="ba-col-head"><h3>' + title + "</h3>" +
      '<span class="chip ' + chipCls + '"><span class="cd"></span>' + chipLabel + "</span>" +
      '<span class="ba-run">' + runId + "</span></div>" +
      '<div class="ba-col-body">' + body + "</div>" + (footer || "") + "</div>";
  };
  const afterCol = col("After fix", after, state.v15fixed ? state.exp.lastRunId : "—", "the candidate is still unfixed", state.v15fixed ? '<div class="vc-fixed" style="margin:8px 14px">Fix applied to v15: check_refund_policy is now required before issue_refund.</div>' : "");

  return (
    '<section class="view-head"><h1>Deploy gate</h1>' +
    '<span class="chip chip-info"><span class="cd"></span>refund-helper · eval set: Refund regressions</span></section>' +
    '<p class="lead">A bad run in production should stop the same bug from shipping again. The gate compares the candidate to the eval set before every deploy.</p>' +

    '<div class="gate-hero" style="margin-top:14px">' +
    '<div class="gh-kicker">Deploy gate · ' + (state.v15fixed ? "v15 fixed" : "v15 candidate") + "</div>" +
    '<div class="gh-status">' + stIcon +
    '<span class="chip chip-info" style="background:#0b1f3a;color:#c7d6e8;border-color:#35507a"><span class="cd"></span>eval run <span class="mono">' + esc(gate.runId) + "</span></span></div>" +
    '<div class="gh-reason">' + reasonsHtml + "</div>" +
    (gate.status === "ready" && !state.v15fixed
      ? '<div class="gh-reason" style="color:#ffe9c9;margin-top:8px">Rule edited. See the activity log for what changed.</div>'
      : "") +
    '<div class="gh-actions">' + actionBtn + editBtn + "</div>" +
    '<div class="gh-meta"><span class="chip" style="background:#0b1f3a;color:#c7d6e8;border-color:#35507a"><span class="cd"></span>rule: block if Tool order check below ' + gate.rule.toolThreshold + '%</span>' +
    '<span class="chip" style="background:#0b1f3a;color:#c7d6e8;border-color:#35507a"><span class="cd"></span>or Policy grounded drops > ' + gate.rule.policyDrop + ' pts</span></div>' +
    "</div>" +

    '<div class="gate-grid">' +
    '<div class="version-card"><div class="vc-head"><h3>v14 · live</h3><span class="chip chip-pass"><span class="cd"></span>in production</span></div>' +
    '<div class="vc-body"><div class="vc-rows">' +
    '<div class="vc-row"><span class="ev">Tool order check</span><span class="val">' + fmtRate(live.toolPass, live.toolTotal) + "</span><span class=\"note\">baseline</span></div>" +
    '<div class="vc-row"><span class="ev">Policy grounded</span><span class="val">' + fmtRate(live.policyPass, live.policyTotal) + "</span><span class=\"note\">baseline</span></div>" +
    '<div class="vc-row"><span class="ev">Human review</span><span class="val">' + fmtRate(live.humanPass, live.humanTotal) + "</span></div>" +
    '<div class="vc-row"><span class="ev">Feedback avg</span><span class="val">4.2</span></div>' +
    "</div></div></div>" +

    '<div class="version-card' + (gate.status === "blocked" ? '' : '') + '"><div class="vc-head"><h3>v15 · candidate</h3>' +
    (gate.status === "blocked" ? '<span class="chip chip-fail"><span class="cd"></span>blocked</span>' : gate.status === "ready" ? '<span class="chip chip-pass"><span class="cd"></span>ready</span>' : '<span class="chip chip-info"><span class="cd"></span>idle</span>') +
    '</div><div class="vc-body"><div class="vc-rows">' +
    '<div class="vc-row"><span class="ev">Tool order check</span><span class="val">' + fmtRate(v15.toolPass, v15.toolTotal) + '</span><span class="note">' + (toolOk ? "ok" : "fail") + "</span></div>" +
    '<div class="vc-row"><span class="ev">Policy grounded</span><span class="val">' + fmtRate(v15.policyPass, v15.policyTotal) + '</span><span class="note">' + (polOk ? "ok" : "fail") + "</span></div>" +
    '<div class="vc-row"><span class="ev">Human review</span><span class="val">' + fmtRate(v15.humanPass, v15.humanTotal) + "</span></div>" +
    "</div>" + (state.v15fixed ? '<div class="vc-fixed">Fix applied to v15: check_refund_policy is now required before issue_refund.</div>' : "") + "</div></div>" +
    "</div>" +

    '<div class="card card-pad" style="margin-top:18px"><div class="card-title">Rule</div>' +
    '<div class="rule-line">Block deploy if Tool order check pass rate is below ' + gate.rule.toolThreshold + "% or Policy grounded drops more than " + gate.rule.policyDrop + " points.</div>" +
    '<div class="rule-note">Evaluator results come from the eval set. Every gate decision names the evaluator and the threshold, so engineers can trust it instead of turning it off.</div>' +
    '<div class="rule-foot"><button class="btn btn-ghost btn-sm" data-action="edit-rule" type="button">Edit rule</button>' +
    '<span class="mono" style="color:var(--muted);font-size:12.5px">last evaluated ' + (state.exp.done ? "after fix" : "latest run") + " · " + esc(gate.runId) + "</span></div></div>" +

    '<div class="beforeafter-wrap">' +
    '<div class="ba-head"><h2>Before / after — v15 on Refund regressions</h2>' +
    '<span class="ba-run mono" style="color:var(--muted);font-size:12px">same eval set, same evaluators</span></div>' +
    '<div class="ba-grid">' +
    col("Before fix", before, "exp-run-7b2ef0d1", "", "") +
    afterCol +
    "</div><div class=\"ba-legend\"><span>pass</span> · <span>fail</span> · <span>pending human review</span> — Human review never blocks the gate; it feeds the annotation queue.</div></div>" +

    '<div class="card card-pad" style="margin-top:18px"><div class="card-title">Known regressions · ' + gate.failing.length + "</div>" +
    '<div class="regressions-list" style="margin-top:12px">' + regressions + "</div></div>"
  );
}

/* ================================================================== *
 * View: Activity log
 * ================================================================== */
function viewActivity() {
  const rows = state.activity
    .slice()
    .sort((a, b) => (a.when < b.when ? 1 : -1))
    .map((a) =>
      '<div class="tl-item"><div class="tl-time">' + fmtWhen(a.when) + "</div>" +
      "<div><span class=\"tl-who\">" + esc(a.who) + "</span><span class=\"tl-what\">" + a.what + "</span></div></div>"
    ).join("");
  return (
    '<section class="view-head"><h1>Activity log</h1>' +
    '<span class="chip chip-info"><span class="cd"></span>' + state.activity.length + " entries</span></section>" +
    '<p class="lead">Every change to the eval set, the gate rule, and the deploy decision, with the run that made it.</p>' +
    '<div class="timeline">' + rows + "</div>"
  );
}

/* ================================================================== *
 * View: Annotations
 * ================================================================== */
const ANN_LABEL = { "not-a-bug": ["Not a bug", "chip-blue"], bug: ["Needs coverage", "chip-warn"], note: ["Note", "chip-info"], done: ["Reviewed", "chip-pass"] };
function annChip(status) {
  const [label, cls] = ANN_LABEL[status] || ANN_LABEL.note;
  return '<span class="chip ' + cls + '"><span class="cd"></span>' + label + "</span>";
}

function viewAnnotations() {
  if (state.annotations.length === 0) {
    return (
      '<section class="view-head"><h1>Annotations</h1><span class="chip chip-info"><span class="cd"></span>queue</span></section>' +
      '<div class="empty-state"><h2 class="es-title">The annotation queue is empty</h2>' +
      '<p class="es-body">Use Annotate on any trace to send it here — a \"not a bug\" note, a coverage gap, or just context for the next reviewer.</p>' +
      '<div class="es-actions"><a class="btn btn-primary" href="#/traces">Browse traces</a></div></div>'
    );
  }
  const rows = state.annotations
    .slice()
    .sort((a, b) => (a.ts < b.ts ? 1 : -1))
    .map((a) => {
      const t = getTrace(a.traceId);
      const name = t ? esc(t.name) : esc(a.traceId);
      const note = a.note ? '<div class="a-note">' + esc(a.note) + "</div>" : "";
      return (
        '<div class="annotation-card"><div class="a-top"><h3>' + name + "</h3>" + annChip(a.status) +
        (a.category === "bug" && a.status === "bug" ? '<span class="badge-seed">needs evaluator coverage</span>' : "") + "</div>" +
        '<div class="a-meta"><a class="btn btn-ghost btn-sm" href="#/trace/' + esc(a.traceId) + '">trace ' + esc(a.traceId) + "</a>" +
        '<span class="chip chip-info"><span class="cd"></span>by ' + esc(a.by) + "</span>" +
        '<span class="chip chip-info"><span class="cd"></span>' + fmtWhen(a.ts) + "</span></div>" + note + "</div>"
      );
    }).join("");
  return (
    '<section class="view-head"><h1>Annotations</h1><span class="chip chip-info"><span class="cd"></span>queue</span></section>' +
    '<p class="lead">Annotations do not change the gate. They feed the review queue; only an eval example guards a deploy.</p>' +
    '<div class="annotation-list">' + rows + "</div>"
  );
}

/* ================================================================== *
 * Router
 * ================================================================== */
function viewFor(route) {
  switch (route.view) {
    case "trace": return viewTrace(route);
    case "traces": return viewTraces();
    case "evals": return viewEvals();
    case "gate": return viewGate();
    case "annotations": return viewAnnotations();
    case "activity": return viewActivity();
    default: return viewTraces();
  }
}

/* ================================================================== *
 * Modals + toasts
 * ================================================================== */
function openModal(html) {
  const root = $("#modal-root");
  root.hidden = false;
  root.innerHTML = '<div class="modal-backdrop" data-action="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" data-action="modal">' + html + "</div></div>";
  const f = root.querySelector("input,button,select,textarea");
  if (f) setTimeout(() => f.focus(), 30);
}
function closeModal() {
  const root = $("#modal-root");
  root.hidden = true;
  root.innerHTML = "";
}
function toast(msg, kind) {
  const root = $("#toast-root");
  const t = document.createElement("div");
  t.className = "toast " + (kind || "");
  t.innerHTML = '<span class="t-ico"></span><span>' + esc(msg) + "</span>";
  root.appendChild(t);
  setTimeout(() => { t.remove(); }, 4200);
}

/* ---------- modal builders ---------- */
function addToEvalModal(traceId) {
  const t = getTrace(traceId);
  const pat = exampleFromTrace(t);
  openModal(
    '<div class="modal-head"><h2>Add to eval set and guard deploy</h2><button class="modal-close" data-action="modal-close" aria-label="Close" type="button">×</button></div>' +
    '<div class="modal-body">' +
    '<p style="font-size:14.5px;color:var(--muted);margin:0 0 14px">This creates one example in <b>Refund regressions</b>, attaches the evaluators, and links it to the deploy gate. The gate will block the candidate until this case passes.</p>' +
    '<div class="example-card" style="border-color:var(--bluel)">' +
    '<div class="ex-top"><h3 style="font-size:15px">' + esc(pat.title) + "</h3><span class=\"badge-fromprod\">from production</span></div>" +
    '<div class="ex-meta"></div>' +
    '<div class="ex-field" style="margin-top:8px"><div class="k">Input</div><div class="v">' + esc(pat.input) + "</div></div>" +
    '<div class="ex-field" style="margin-top:8px"><div class="k">Expected behavior</div><div class="v">' + esc(pat.expected) + "</div></div>" +
    "</div>" +
    '<div class="ex-evaluators" style="margin-top:12px">' +
    '<span class="eval-chip">Tool order check <span class="ekind">code</span></span>' +
    '<span class="eval-chip">Policy grounded <span class="ekind">LLM-as-judge</span></span>' +
    '<span class="eval-chip">Human review <span class="ekind">human</span></span></div>' +
    '<div class="ex-source" style="margin-top:12px"><a class="btn btn-ghost btn-sm" href="#/trace/' + esc(traceId) + '">source trace ' + esc(traceId) + "</a></div>" +
    "</div>" +
    '<div class="modal-foot"><button class="btn btn-ghost" data-action="modal-close" type="button">Cancel</button>' +
    '<button class="btn btn-primary" data-action="confirm-add" data-trace="' + traceId + '" type="button">Add to Refund regressions</button></div>'
  );
}
function annotateModal(traceId) {
  const t = getTrace(traceId);
  openModal(
    '<div class="modal-head"><h2>Annotate — ' + esc(t.name) + "</h2><button class=\"modal-close\" data-action=\"modal-close\" aria-label=\"Close\" type=\"button\">×</button></div>" +
    '<div class="modal-body">' +
    '<p style="font-size:14.5px;color:var(--muted);margin:0 0 14px">Annotations go to the review queue. They never change the gate — only an eval example does that.</p>' +
    '<input type="hidden" id="ann-trace" value="' + traceId + '">' +
    '<label class="radio-row"><input type="radio" name="ann-cat" value="not-a-bug" checked><span class="rr-label">Not a bug — behavior was correct, no action needed</span></label>' +
    '<label class="radio-row"><input type="radio" name="ann-cat" value="bug"><span class="rr-label">Bug — this needs evaluator coverage (use Add to eval set to guard the deploy)</span></label>' +
    '<label class="radio-row"><input type="radio" name="ann-cat" value="note"><span class="rr-label">Just a note — context for the next reviewer</span></label>' +
    '<div class="modal-field"><div class="k">Note (optional)</div><div class="h">Shown to whoever reviews this trace next.</div>' +
    '<textarea id="ann-note" rows="3" placeholder="e.g. Wording was confusing, but the refund itself was correct."></textarea></div>' +
    "</div>" +
    '<div class="modal-foot"><button class="btn btn-ghost" data-action="modal-close" type="button">Cancel</button>' +
    '<button class="btn btn-primary" data-action="confirm-annotate" type="button">Send to annotation queue</button></div>'
  );
}
function editRuleModal() {
  confirmRule.acked = false;
  openModal(
    '<div class="modal-head"><h2>Edit gate rule</h2><button class="modal-close" data-action="modal-close" aria-label="Close" type="button">×</button></div>' +
    '<div class="modal-body">' +
    '<div class="modal-field"><div class="k">Tool order check</div><div class="h">Block when the code evaluator pass rate is below this threshold.</div>' +
    '<label style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:6px">Block when pass rate is below' +
    '<input type="number" id="rule-tool" min="0" max="100" step="1" value="' + state.rule.toolThreshold + '" style="width:96px">%</label></div>' +
    '<div class="modal-field"><div class="k">Policy grounded (LLM-as-judge)</div><div class="h">Block when the candidate drops more than this many points vs the live run.</div>' +
    '<label style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:6px">Block when the drop is more than' +
    '<input type="number" id="rule-policy" min="0" max="20" step="1" value="' + state.rule.policyDrop + '" style="width:96px">points</label></div>' +
    '<div class="warn-banner" id="rule-warn" hidden>This rule would let <b id="rule-warn-n">0</b> known regressions ship.</div>' +
    "</div>" +
    '<div class="modal-foot"><button class="btn btn-ghost" data-action="modal-close" type="button">Cancel</button>' +
    '<button class="btn btn-primary" data-action="confirm-rule" type="button">Save rule</button></div>'
  );
}
function resetModal() {
  openModal(
    '<div class="modal-head"><h2>Reset demo</h2><button class="modal-close" data-action="modal-close" aria-label="Close" type="button">×</button></div>' +
    '<div class="modal-body"><p style="font-size:15px;color:var(--ink);margin:0 0 8px">Restore the start state?</p>' +
    '<p style="font-size:14.5px;color:var(--muted);margin:0">This clears the eval examples you added, annotations, rule changes, and experiment results from this browser, then reloads.</p></div>' +
    '<div class="modal-foot"><button class="btn btn-ghost" data-action="modal-close" type="button">Keep my session</button>' +
    '<button class="btn btn-danger-solid" data-action="confirm-reset" type="button">Reset demo</button></div>'
  );
}
function removeExampleModal(exId) {
  const ex = state.examples.find((e) => e.id === exId);
  if (!ex) return;
  openModal(
    '<div class="modal-head"><h2>Remove example</h2><button class="modal-close" data-action="modal-close" aria-label="Close" type="button">×</button></div>' +
    '<div class="modal-body"><p style="font-size:15px;color:var(--ink);margin:0 0 8px">Remove "' + esc(ex.title) + '" from Refund regressions?</p>' +
    '<p style="font-size:14.5px;color:var(--muted);margin:0">The gate will stop checking this case. If every example is removed, the gate has nothing to evaluate.</p></div>' +
    '<div class="modal-foot"><button class="btn btn-ghost" data-action="modal-close" type="button">Cancel</button>' +
    '<button class="btn btn-danger" data-action="confirm-remove" data-example="' + exId + '" type="button">Remove example</button></div>'
  );
}

/* ---------- experiment simulation ---------- */
const EXP_STEPS_FIX = [
  "Apply fix to v15 — tool guard: require check_refund_policy before issue_refund",
  "Start eval worker on v15 build",
  "Run examples × 3 evaluators (Tool order check, Policy grounded, Human review)",
  "Score Tool order check (code)",
  "Score Policy grounded (LLM-as-judge)",
  "Compare against live baseline (v14)",
];
const EXP_STEPS_RERUN = EXP_STEPS_FIX.slice(1);

function runExperimentModal() {
  if (!state.exp.attempted) {
    // deterministic first-run failure: the demo needs a reachable error state
    mutate((s) => { s.exp.attempted = true; return s; });
    failExperiment(state.v15fixed ? EXP_STEPS_RERUN : EXP_STEPS_FIX);
    return;
  }
  openExperimentModal(state.v15fixed ? EXP_STEPS_RERUN : EXP_STEPS_FIX, null);
}
function openExperimentModal(steps, failAtMs) {
  const runId = "exp-run-" + hex8();
  const stepsHtml = steps.map((s, i) => '<div class="exp-step" data-exp-i="' + i + '"><span class="st-ico"></span>' + esc(s) + "</div>").join("");
  openModal(
    '<div class="modal-head"><h2>Experiment — Refund regressions on v15</h2><button class="modal-close" data-action="modal-close" aria-label="Close" type="button">×</button></div>' +
    '<div class="modal-body">' +
    '<p style="font-size:14px;color:var(--muted);margin:0 0 4px">Running</p><span class="exp-run-id">' + runId + "</span>" +
    '<div class="exp-steps">' + stepsHtml + "</div>" +
    '<div id="exp-status"></div>' +
    "</div>" +
    '<div class="modal-foot"><span id="exp-foot"></span></div>'
  );
  expRun = { steps, runId, i: 0, failAtMs: failAtMs || null };
  pulseExperiment();
}
let expRun = null;

function pulseExperiment() {
  if (!expRun) return;
  const status = $("#exp-status");
  const foot = $("#exp-foot");
  document.querySelectorAll(".exp-step").forEach((s) => {
    const i = parseInt(s.dataset.expI, 10);
    s.className = "exp-step" + (i < expRun.i ? " done" : i === expRun.i ? " active" : " waiting");
  });
  if (expRun.failAtMs !== null && expRun.failAtMs === expRun.i) {
    status.innerHTML = '<div class="exp-error"><h4 class="ee-title">Experiment failed to start</h4>' +
      '<p class="ee-msg">Eval worker pool exhausted — no worker accepted the job (' + expRun.runId + '). This is a simulated failure for the demo.</p>' +
      '<button class="btn btn-primary" data-action="exp-retry" type="button">Retry</button></div>';
    foot.innerHTML = "";
    return;
  }
  if (expRun.i >= expRun.steps.length) {
    completeExperiment(expRun.runId);
    return;
  }
  expRun.i++;
  setTimeout(pulseExperiment, expRun.failAtMs !== null && expRun.i === expRun.failAtMs + 1 ? 550 : 620);
}
function failExperiment(steps) {
  const failAt = Math.min(2, steps.length);
  expRun = { steps, runId: "exp-run-" + hex8(), i: 0, failAtMs: failAt };
  openExperimentModal(steps, failAt);
}
function retryExperiment() {
  // clear error, continue from the failing point
  expRun.failAtMs = null;
  pulseExperiment();
}
function completeExperiment(runId) {
  const status = $("#exp-status");
  const foot = $("#exp-foot");
  const after = runEval("after");
  const alreadyFixed = state.v15fixed;
  mutate((s) => {
    s.exp = { attempted: true, done: true, lastRunId: runId };
    if (!alreadyFixed) s.v15fixed = true;
    if (!alreadyFixed) {
      s.activity = [
        { who: "you", what: "applied fix to v15 — tool guard: check_refund_policy required before issue_refund", when: nowISO() },
      ].concat(s.activity);
    }
    s.activity = [
      { who: "you", what: "experiment " + runId + " completed — Tool order check " + after.toolPass + "/" + after.toolTotal + " pass, Policy grounded " + after.policyPass + "/" + after.policyTotal + " pass", when: nowISO() },
      { who: "gate", what: "flipped Ready — v15 deploy allowed (" + runId + ")", when: nowISO() },
    ].concat(s.activity);
    return s;
  });
  status.innerHTML = '<div class="exp-done"><div class="ed-title">Experiment complete — ' + runId + "</div>" +
    '<div class="ed-msg">Tool order check ' + after.toolPass + "/" + after.toolTotal + " pass · Policy grounded " + after.policyPass + "/" + after.policyTotal + " pass · Human review " + after.humanPass + "/" + after.humanTotal + " reviewed. Gate is now Ready.</div></div>";
  foot.innerHTML = '<button class="btn btn-primary" data-action="exp-close" type="button">Close and view results</button>';
  toast("Experiment complete — gate is Ready.", "ok");
  expRun = null;
}

/* ================================================================== *
 * Actions
 * ================================================================== */
function selectStep(traceId, stepId, rerender) {
  selSteps[traceId] = stepId;
  selSteps.currentId = stepId;
  selSteps.traceId = traceId;
  if (rerender) render();
  if (document.querySelector('[data-tree]') && seamPhone()) {
    // accordion: auto-open the path to the selected node
    document.querySelectorAll(".tree-node").forEach((n) => {
      const inside = n.querySelector('[data-step="' + stepId + '"]');
      const isSelf = n.dataset.step === stepId;
      if (inside || isSelf) n.classList.add("open");
    });
  }
}
function seamPhone() { return window.innerWidth <= 768; }

function runAction(el) {
  const action = el.dataset.action;
  switch (action) {
    case "open-trace":
      location.hash = "#/trace/" + el.dataset.trace;
      break;
    case "filter-status": filters.status = el.value; save(); render(); break;
    case "filter-tool": filters.tool = el.value; save(); render(); break;
    case "filter-latency": filters.latency = el.value; save(); render(); break;
    case "clear-filters": filters.status = "all"; filters.tool = "all"; filters.latency = ""; render(); break;
    case "select-step": selectStep(el.dataset.trace, el.dataset.step, true); break;
    case "add-to-eval": addToEvalModal(el.dataset.trace); break;
    case "annotate": annotateModal(el.dataset.trace); break;
    case "edit-rule": editRuleModal(); break;
    case "reset-demo": resetModal(); break;
    case "remove-example": removeExampleModal(el.dataset.example); break;
    case "run-experiment": runExperimentModal(); break;
    case "exp-retry": retryExperiment(); break;
    case "exp-close": closeModal(); render(); break;
    case "modal-close": closeModal(); break;
    case "modal-backdrop": if (el === el.target) closeModal(); break;
    case "modal": break;
    case "confirm-add": confirmAdd(el.dataset.trace); break;
    case "confirm-annotate": confirmAnnotate(); break;
    case "confirm-rule": confirmRule(); break;
    case "confirm-reset": confirmReset(); break;
    case "confirm-remove": confirmRemove(el.dataset.example); break;
    case "toggle-nav": toggleNav(); break;
    case "disabled-reason": toast("Only the failing step can seed an eval example — that is where the regression is."); break;
  }
}
function toggleNav() {
  const sb = $("#sidebar");
  const isOpen = sb.classList.toggle("open");
  document.querySelector(".hamburger").setAttribute("aria-expanded", String(isOpen));
}

function confirmAdd(traceId) {
  const trace = getTrace(traceId);
  if (!trace || state.added.includes(traceId)) { closeModal(); return; }
  const pat = exampleFromTrace(trace);
  mutate((s) => {
    s.added = [traceId].concat(s.added);
    s.examples = [{
      id: "ex-" + hex8(), title: pat.title, input: pat.input, expected: pat.expected,
      fail: pat.fail, source: traceId, fromProduction: true, human: "pending", addedAt: nowISO(),
    }].concat(s.examples);
    s.activity = [
      { who: "you", what: 'added example "' + pat.title + '" from <a class="mono" href="#/trace/' + traceId + '">' + traceId + "</a> to Refund regressions", when: nowISO() },
    ].concat(s.activity);
    return s;
  });
  closeModal();
  toast("Added to eval set. This trace now guards the deploy gate.");
  render();
}
function confirmAnnotate() {
  const traceId = $("#ann-trace").value;
  const cat = document.querySelector('input[name="ann-cat"]:checked').value;
  const note = $("#ann-note").value.trim();
  const labels = { "not-a-bug": "Not a bug", bug: "Needs evaluator coverage", note: "Note" };
  mutate((s) => {
    s.annotations = [{
      id: "ann-" + hex8(), traceId, category: cat, status: cat, by: "you", note, ts: nowISO(),
    }].concat(s.annotations);
    s.activity = [
      { who: "you", what: 'annotated <a class="mono" href="#/trace/' + traceId + '">' + traceId + "</a> as " + labels[cat], when: nowISO() },
    ].concat(s.activity);
    return s;
  });
  closeModal();
  toast("Moved to the annotation queue. The gate is unchanged.");
  render();
}
function wouldUnblockWith(newRule) {
  const g = gateState();
  if (state.examples.length === 0) return false;
  const before = runEval("before");
  const toolPct = (before.toolPass / before.toolTotal) * 100;
  const nowBlocked = g.status === "blocked";
  const newBlocked = toolPct < newRule.toolThreshold || g.drop > newRule.policyDrop;
  const failing = g.failing;
  return nowBlocked && !newBlocked && failing.length > 0;
}
function confirmRule() {
  const tool = parseInt($("#rule-tool").value, 10);
  const pol = parseInt($("#rule-policy").value, 10);
  const tv = $("#rule-tool").value.trim(), pv = $("#rule-policy").value.trim();
  if (tv === "" || pv === "" || isNaN(tool) || isNaN(pol)) { toast("Thresholds must be numbers.", "warn"); return; }
  const newRule = { toolThreshold: Math.max(0, Math.min(100, tool)), policyDrop: Math.max(0, Math.min(20, pol)) };
  const g = gateState();
  const warn = wouldUnblockWith(newRule);
  if (warn && !confirmRule.acked) {
    $("#rule-warn").hidden = false;
    $("#rule-warn-n").textContent = String(g.failing.length);
    confirmRule.acked = true;
    return;
  }
  confirmRule.acked = false;
  mutate((s) => {
    s.rule = newRule;
    let what = "edited gate rule — Tool order check threshold " + g.rule.toolThreshold + "% → " + newRule.toolThreshold + "%, Policy grounded drop limit " + g.rule.policyDrop + " → " + newRule.policyDrop + " pts";
    if (warn) what += " (saved with warning: " + g.failing.length + " known regression" + (g.failing.length === 1 ? "" : "s") + " would ship)";
    s.activity = [{ who: "you", what, when: nowISO() }].concat(s.activity);
    return s;
  });
  closeModal();
  toast(warn ? "Rule saved. The activity log records that regressions can now ship." : "Rule saved.");
  render();
}
function confirmRemove(exId) {
  const ex = state.examples.find((e) => e.id === exId);
  mutate((s) => {
    s.examples = s.examples.filter((e) => e.id !== exId);
    s.activity = [{ who: "you", what: 'removed example "' + (ex ? ex.title : exId) + '" from Refund regressions', when: nowISO() }].concat(s.activity);
    return s;
  });
  closeModal();
  toast("Example removed. The gate stopped checking it.");
  render();
}
function confirmReset() {
  try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
  location.hash = "#/traces";
  closeModal();
  location.reload();
}

/* ================================================================== *
 * Init
 * ================================================================== */
document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-action]");
  if (!el) return;
  runAction(el);
});
document.addEventListener("keydown", (ev) => {
  if ((ev.key === "Enter" || ev.key === " ") && ev.target.closest && ev.target.closest("[data-action=open-trace],[data-action=clear-filters]")) {
    ev.preventDefault();
    runAction(ev.target.closest("[data-action]"));
  }
});
document.addEventListener("input", (ev) => {
  if (ev.target.dataset && ev.target.dataset.action === "filter-latency") {
    filters.latency = ev.target.value;
    save();
    const r = currentRoute();
    if (r.view === "traces") render();
  }
});
document.addEventListener("change", (ev) => {
  const el = ev.target;
  if (el.dataset && (el.dataset.action === "filter-status" || el.dataset.action === "filter-tool")) {
    runAction(el);
  }
});
window.addEventListener("hashchange", render);
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") { closeModal(); }
});

render();