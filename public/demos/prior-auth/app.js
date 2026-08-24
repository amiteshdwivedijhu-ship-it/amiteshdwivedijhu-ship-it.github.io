/* Recorded Prior Auth Agent replay. The browser renders precomputed outputs
   bundled in data.json; it never calls a model or changes a determination. */

const state = {
  data: null,
  persona: null,
  policies: [],
  criterionFilters: new Set(),
};

const DET_LABELS = {
  met: "Met",
  unmet: "Unmet",
  "non-determinable": "Non-determinable",
};

const OUTCOME_LABELS = {
  satisfied: "Criteria satisfied",
  not_satisfied: "Criteria not satisfied",
  "non-determinable": "Criteria non-determinable",
};

const TIER_LABELS = {
  tier0_span_existence: "Tier 0 · verbatim span",
  tier1_minicheck: "Tier 1 · NLI model",
  tier2_llm: "Tier 2 · LLM adjudication",
};

const RECOMMENDED = {
  C001: { label: "Start here", rank: 1 },
  C009: { label: "Borderline", rank: 2 },
  C016: { label: "Safety failure", rank: 3 },
};

const SCENARIO_CONTEXT = {
  clean_support: {
    title: "Straightforward evidence path",
    why: "The chart contains enough evidence to evaluate the policy criteria and assemble a reviewable request, so this case shows the standard workflow.",
  },
  missing_evidence: {
    title: "Documentation-gap case",
    why: "This case tests whether the product separates an undocumented fact from a negative fact, then tells staff what documentation would resolve the gap.",
  },
  policy_mismatch: {
    title: "Policy-specific mismatch",
    why: "Clinical plausibility does not settle the case. The recorded chart must satisfy the structure and wording of this payer's policy.",
  },
  safety_failure: {
    title: "Evidence-gate stress case",
    why: "Multiple assertions in this recorded run fail the entailment check. The case shows how the product marks unsupported content for human review instead of presenting it as grounded.",
  },
};

// Frozen policy expressions used to produce the recorded rollups. Keeping the
// expression in the UI lets us surface outcome-driving branches without
// re-adjudicating or changing any recorded clinical determination.
const POLICY_EXPRESSIONS = {
  "AETNA-0660": { op: "AND", args: ["A01", "A02", { op: "OR", args: ["A03", "A04", "A05"] }, { op: "OR", args: ["A06", "A07", "A08", "A09", "A10", "A11", "A12"] }, { op: "NOT", args: [{ op: "OR", args: ["A13", "A14", "A15", "A16", "A17", "A18"] }] }] },
  "CIGNA-CMM-311": { op: "AND", args: [{ op: "OR", args: [{ op: "AND", args: ["G01", "G02"] }, { op: "AND", args: [{ op: "OR", args: ["G03", { op: "AND", args: ["G04", "G06"] }, { op: "AND", args: ["G05", "G06"] }, "G07"] }, "G08", "G09", { op: "OR", args: ["G10", "G11"] }] }] }, { op: "NOT", args: [{ op: "OR", args: ["G12", "G13", "G14", "G15", "G16", "G17", "G18"] }] }] },
  "KPWA-TKA": { op: "AND", args: [{ op: "OR", args: [{ op: "AND", args: ["KP01", { op: "OR", args: ["KP02", "KP03", "KP04"] }, "KP05", { op: "OR", args: ["KP06", "KP07"] }, { op: "OR", args: ["KP08", { op: "AND", args: ["KP09", "KP10"] }] }, { op: "OR", args: ["KP11", "KP12"] }, "KP13"] }, { op: "AND", args: ["KP22", { op: "OR", args: [{ op: "AND", args: ["KP14", "KP15"] }, "KP16", "KP17", "KP18", "KP19", "KP20", "KP21"] }] }] }, { op: "NOT", args: [{ op: "OR", args: ["KP23", "KP24", "KP25", "KP26", "KP27"] }] }] },
  L39911: { op: "AND", args: [{ op: "OR", args: ["K01", "K02", "K03", "K04", "K05", { op: "AND", args: ["K06", "K07", { op: "OR", args: ["K08", "K09"] }] }] }, { op: "NOT", args: [{ op: "OR", args: ["K10", "K11", "K12", "K13"] }] }] },
  "PREMERA-7.01.550": { op: "OR", args: [{ op: "AND", args: ["R01", { op: "OR", args: ["R02", "R03"] }, "R07", { op: "OR", args: [{ op: "AND", args: ["R04", "R08", "R09"] }, { op: "AND", args: [{ op: "OR", args: ["R05", "R06"] }, "R08"] }] }] }, { op: "AND", args: ["R10", "R11"] }, "R12", "R13", "R14"] },
  "PROVIDENCE-MP418": { op: "AND", args: [{ op: "OR", args: [{ op: "AND", args: ["PV01", "PV02", "PV03", { op: "AT_LEAST", n: 2, args: ["PV04", "PV05", "PV06"] }, { op: "OR", args: [{ op: "AND", args: ["PV08", "PV07"] }, { op: "AND", args: ["PV09", { op: "AT_LEAST", n: 2, args: ["PV10", "PV11", "PV12", "PV13", "PV14"] }, "PV07", "PV18", "PV15", "PV16", "PV17"] }] }] }, { op: "AND", args: ["PV19", "PV02", "PV03", { op: "AT_LEAST", n: 2, args: ["PV04", "PV05", "PV06"] }, "PV07", { op: "OR", args: ["PV20", { op: "AND", args: ["PV18", "PV21", "PV16", "PV17"] }] }] }, { op: "AND", args: ["PV22", "PV07"] }, { op: "AND", args: ["PV23", "PV07"] }, { op: "AND", args: ["PV24", "PV02", "PV03", { op: "AT_LEAST", n: 2, args: ["PV04", "PV05", "PV06"] }, "PV09", { op: "AT_LEAST", n: 2, args: ["PV10", "PV25", "PV26", "PV14", "PV13"] }, "PV07", "PV18", "PV27", "PV16", "PV17"] }] }, { op: "NOT", args: [{ op: "OR", args: ["PV28", "PV29", "PV30"] }] }] },
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function humanize(code) {
  return String(code || "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value) {
  if (!value) return "date not recorded";
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

function getRollup(persona) {
  return persona.pa_request.satisfaction_rollup || { result: "non-determinable", unnecessary_to_resolve: [] };
}

function isUngrounded(determination) {
  return determination.spans.some((span) => span.gate && span.gate.verdict === "unsupported");
}

function hasMissingEvidence(persona) {
  return persona.determinations.some((determination) => determination.determination === "non-determinable");
}

function baseScenario(persona) {
  if (hasMissingEvidence(persona)) return "missing_evidence";
  if (getRollup(persona).result === "not_satisfied") return "policy_mismatch";
  return "clean_support";
}

function matchesScenario(persona, scenario) {
  if (scenario === "all") return true;
  if (scenario === "safety_failure") return persona.pa_request.ungrounded_assertion_count >= 4;
  return baseScenario(persona) === scenario;
}

function smoothScroll(element) {
  element.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
}

async function init() {
  bindEvents();
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error(`Data request failed (${response.status})`);
    state.data = await response.json();
    state.policies = state.data.payers;
    renderFilterOptions();
    renderServices();
    renderPersonas();
    restoreCaseFromUrl();
  } catch (error) {
    const grid = document.getElementById("persona-grid");
    grid.innerHTML = `<div class="error-state panel"><strong>The recorded runs could not be loaded.</strong><p>${escapeHtml(error.message)}</p></div>`;
    document.getElementById("case-count").textContent = "Data unavailable";
  }
}

function bindEvents() {
  ["scenario-filter", "payer-filter", "outcome-filter"].forEach((id) => {
    document.getElementById(id).addEventListener("change", renderPersonas);
  });
  document.getElementById("clear-filters").addEventListener("click", clearCaseFilters);
  document.querySelector("[data-action='clear-filters']").addEventListener("click", clearCaseFilters);
  document.getElementById("generate-btn").addEventListener("click", generate);
  document.getElementById("copy-request").addEventListener("click", () => copyText(state.persona?.pa_request.text, "Request copied"));
  document.getElementById("copy-link").addEventListener("click", copyLink);
  document.getElementById("choose-another").addEventListener("click", chooseAnother);
  document.getElementById("reset-demo").addEventListener("click", resetDemo);
  document.querySelectorAll(".status-filter").forEach((button) => button.addEventListener("click", handleCriterionFilter));
  window.addEventListener("popstate", restoreCaseFromUrl);
}

function renderFilterOptions() {
  const payerFilter = document.getElementById("payer-filter");
  state.policies.forEach((payer) => {
    const option = document.createElement("option");
    option.value = payer.policy_id;
    option.textContent = payer.payer;
    payerFilter.appendChild(option);
  });
}

function renderServices() {
  const select = document.getElementById("service-select");
  const option = document.createElement("option");
  option.value = state.data.service;
  const label = humanize(state.data.service);
  option.textContent = label.toLowerCase().startsWith("total ") ? label : `Total ${label.toLowerCase()}`;
  select.appendChild(option);
}

function filteredPersonas() {
  const scenario = document.getElementById("scenario-filter").value;
  const payer = document.getElementById("payer-filter").value;
  const outcome = document.getElementById("outcome-filter").value;
  return state.data.personas.filter((persona) =>
    matchesScenario(persona, scenario)
    && (payer === "all" || persona.policy.policy_id === payer)
    && (outcome === "all" || getRollup(persona).result === outcome)
  );
}

function renderPersonas() {
  if (!state.data) return;
  const grid = document.getElementById("persona-grid");
  const empty = document.getElementById("empty-cases");
  const personas = filteredPersonas().sort((a, b) => {
    const aRank = RECOMMENDED[a.case_id]?.rank ?? 99;
    const bRank = RECOMMENDED[b.case_id]?.rank ?? 99;
    return aRank - bRank || a.case_id.localeCompare(b.case_id);
  });

  grid.innerHTML = "";
  personas.forEach((persona) => grid.appendChild(createPersonaCard(persona)));
  document.getElementById("case-count").textContent = `${personas.length} of ${state.data.personas.length} recorded cases`;
  empty.classList.toggle("hidden", personas.length !== 0);
  grid.classList.toggle("hidden", personas.length === 0);
}

function createPersonaCard(persona) {
  const card = document.createElement("button");
  const recommendation = RECOMMENDED[persona.case_id];
  const rollup = getRollup(persona);
  const conditions = persona.patient.conditions.length
    ? persona.patient.conditions.map(humanize).join(", ")
    : "No coded conditions";
  const scenario = humanize(baseScenario(persona));
  const isSelected = state.persona?.case_id === persona.case_id;

  card.type = "button";
  card.className = `card${isSelected ? " selected" : ""}`;
  card.dataset.caseId = persona.case_id;
  card.setAttribute("aria-pressed", String(isSelected));
  card.setAttribute("aria-label", `Choose ${persona.case_id}: ${conditions}; ${OUTCOME_LABELS[rollup.result]}`);
  card.innerHTML = `
    <span class="card-topline">
      <strong>${escapeHtml(persona.case_id)}</strong>
      ${recommendation ? `<span class="recommendation-badge">${escapeHtml(recommendation.label)}</span>` : ""}
    </span>
    <span class="patient-facts">Age ${escapeHtml(persona.patient.age_years ?? "unknown")} <span aria-hidden="true">·</span> BMI ${escapeHtml(persona.patient.bmi ?? "unknown")}</span>
    <span class="condition-text">${escapeHtml(conditions)}</span>
    <span class="payer-name">${escapeHtml(persona.policy.payer)}</span>
    <span class="card-tags">
      <span class="outcome-tag outcome-${escapeHtml(rollup.result)}">${escapeHtml(OUTCOME_LABELS[rollup.result])}</span>
      <span class="scenario-tag">${escapeHtml(scenario)}</span>
    </span>`;
  card.addEventListener("click", () => selectPersona(persona, { moveFocus: true, updateUrl: true }));
  return card;
}

function clearCaseFilters() {
  document.getElementById("scenario-filter").value = "all";
  document.getElementById("payer-filter").value = "all";
  document.getElementById("outcome-filter").value = "all";
  renderPersonas();
  document.getElementById("scenario-filter").focus();
}

function setUrlCase(caseId) {
  const url = new URL(window.location.href);
  if (caseId) url.searchParams.set("case", caseId);
  else url.searchParams.delete("case");
  history.replaceState({}, "", url);
}

function restoreCaseFromUrl() {
  if (!state.data) return;
  const caseId = new URL(window.location.href).searchParams.get("case");
  if (!caseId) return;
  const persona = state.data.personas.find((candidate) => candidate.case_id === caseId);
  if (!persona) {
    showToast(`Case ${caseId} was not found`);
    setUrlCase(null);
    return;
  }
  selectPersona(persona, { moveFocus: false, updateUrl: false });
  renderResult(persona, { moveFocus: false });
}

function selectPersona(persona, { moveFocus = true, updateUrl = true } = {}) {
  state.persona = persona;
  document.querySelectorAll(".card").forEach((card) => {
    const selected = card.dataset.caseId === persona.case_id;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-pressed", String(selected));
  });

  const payerSelect = document.getElementById("payer-select");
  payerSelect.innerHTML = "";
  state.policies.forEach((payer) => {
    const option = document.createElement("option");
    option.value = payer.policy_id;
    option.textContent = `${payer.payer} · ${payer.policy_id}`;
    option.disabled = payer.policy_id !== persona.policy.policy_id;
    payerSelect.appendChild(option);
  });
  payerSelect.value = persona.policy.policy_id;
  renderCaseContext(persona);
  document.getElementById("payer-note").textContent =
    `${persona.policy.title}; effective ${formatDate(persona.policy.effective)}. `
    + "The synthetic corpus records one fixed payer policy and service per profile.";
  document.getElementById("step-coverage").classList.remove("hidden");
  document.getElementById("step-result").classList.add("hidden");
  if (updateUrl) setUrlCase(persona.case_id);

  if (moveFocus) {
    smoothScroll(document.getElementById("step-coverage"));
    document.getElementById("coverage-title").focus({ preventScroll: true });
  }
}

function renderCaseContext(persona) {
  const rollup = getRollup(persona);
  const recommended = RECOMMENDED[persona.case_id];
  const scenarioKey = recommended?.label === "Safety failure" ? "safety_failure" : baseScenario(persona);
  const context = SCENARIO_CONTEXT[scenarioKey];
  const conditions = persona.patient.conditions.length
    ? persona.patient.conditions.map(humanize).join(", ")
    : "no coded diagnosis";
  const unsupported = persona.pa_request.ungrounded_assertion_count;
  document.getElementById("case-context").innerHTML = `
    <div class="case-context-main">
      <p class="eyebrow">Selected synthetic chart</p>
      <h3>${escapeHtml(persona.case_id)} · ${escapeHtml(context.title)}</h3>
      <p>A ${escapeHtml(persona.patient.age_years ?? "unknown")}-year-old patient with ${escapeHtml(conditions)} and BMI ${escapeHtml(persona.patient.bmi ?? "unknown")}, evaluated for ${escapeHtml(humanize(state.data.service).toLowerCase())} under ${escapeHtml(persona.policy.payer)}'s ${escapeHtml(persona.policy.title)}.</p>
      <div class="case-facts" aria-label="Recorded case characteristics">
        <span>${escapeHtml(persona.determinations.length)} policy criteria</span>
        <span>${escapeHtml(OUTCOME_LABELS[rollup.result])}</span>
        <span>${escapeHtml(unsupported)} unsupported assertion${unsupported === 1 ? "" : "s"}</span>
      </div>
    </div>
    <aside><span class="eyebrow">Why inspect this case</span><p>${escapeHtml(context.why)}</p></aside>`;
}

function generate() {
  if (state.persona) renderResult(state.persona, { moveFocus: true });
}

function renderResult(persona, { moveFocus = true } = {}) {
  state.criterionFilters.clear();
  updateCriterionFilterButtons();
  renderSelectedSummary(persona);
  renderDecisionBanner(persona);
  const decisiveIds = getDecisiveCriterionIds(persona);
  renderDecisiveCriteria(persona, decisiveIds);
  renderGaps(persona);
  renderCriteria(persona, decisiveIds);
  document.getElementById("pa-text").textContent = persona.pa_request.text;
  const result = document.getElementById("step-result");
  result.classList.remove("hidden");
  setUrlCase(persona.case_id);
  if (moveFocus) {
    smoothScroll(result);
    document.getElementById("result-title").focus({ preventScroll: true });
  }
}

function renderSelectedSummary(persona) {
  const rollup = getRollup(persona);
  document.getElementById("selected-summary").innerHTML = `
    <span><small>Case</small><strong>${escapeHtml(persona.case_id)}</strong></span>
    <span><small>Patient</small><strong>Age ${escapeHtml(persona.patient.age_years ?? "unknown")} · BMI ${escapeHtml(persona.patient.bmi ?? "unknown")}</strong></span>
    <span><small>Fixed policy</small><strong>${escapeHtml(persona.policy.payer)} · ${escapeHtml(persona.policy.policy_id)}</strong></span>
    <span><small>Recorded outcome</small><strong>${escapeHtml(OUTCOME_LABELS[rollup.result])}</strong></span>`;
}

function renderDecisionBanner(persona) {
  const rollup = getRollup(persona);
  const count = persona.pa_request.ungrounded_assertion_count;
  const banner = document.getElementById("decision-banner");
  banner.className = `decision-banner outcome-${rollup.result}`;
  const safetyText = count > 0
    ? `<div class="safety-callout"><strong>Human review required</strong><span>${count} clinical assertion${count === 1 ? "" : "s"} failed the entailment gate. The draft preserves and marks them as ungrounded.</span></div>`
    : `<div class="safety-callout safety-held"><strong>Evidence gate held</strong><span>No clinical assertions failed the entailment gate in this recorded run.</span></div>`;
  const unnecessary = rollup.unnecessary_to_resolve.length
    ? `<p class="banner-note">${escapeHtml(rollup.unnecessary_to_resolve.join(", "))} ${rollup.unnecessary_to_resolve.length === 1 ? "is" : "are"} non-determinable, but resolving ${rollup.unnecessary_to_resolve.length === 1 ? "it" : "them"} cannot change this outcome.</p>`
    : "";
  banner.innerHTML = `
    <div class="decision-copy">
      <span class="decision-label">Policy-expression result</span>
      <strong class="decision-title">${escapeHtml(OUTCOME_LABELS[rollup.result])}</strong>
      <p>This criteria rollup makes no prediction of payer approval.</p>
      ${unnecessary}
    </div>
    ${safetyText}`;
}

function evaluateExpression(node, values) {
  if (typeof node === "string") return values[node] ?? null;
  const results = node.args.map((arg) => evaluateExpression(arg, values));
  if (node.op === "AND") {
    if (results.includes(false)) return false;
    return results.includes(null) ? null : true;
  }
  if (node.op === "OR") {
    if (results.includes(true)) return true;
    return results.includes(null) ? null : false;
  }
  if (node.op === "NOT") return results[0] === null ? null : !results[0];
  if (node.op === "AT_LEAST") {
    const met = results.filter((result) => result === true).length;
    const unknown = results.filter((result) => result === null).length;
    if (met >= node.n) return true;
    if (met + unknown < node.n) return false;
    return null;
  }
  return null;
}

function collectDecisionLeaves(node, values, result, output) {
  if (typeof node === "string") {
    output.add(node);
    return;
  }
  const children = node.args.map((arg) => ({ node: arg, result: evaluateExpression(arg, values) }));
  let relevant = children;
  if (node.op === "AND") {
    relevant = result === true ? children : children.filter((child) => child.result === result);
  } else if (node.op === "OR") {
    relevant = result === false ? children : children.filter((child) => child.result === result);
  } else if (node.op === "AT_LEAST") {
    if (result === true) relevant = children.filter((child) => child.result === true);
    if (result === false) relevant = children.filter((child) => child.result !== true);
    if (result === null) relevant = children.filter((child) => child.result === null);
  }
  relevant.forEach((child) => collectDecisionLeaves(child.node, values, child.result, output));
}

function getDecisiveCriterionIds(persona) {
  const expression = POLICY_EXPRESSIONS[persona.policy.policy_id];
  if (!expression) return new Set(persona.determinations.filter(isUngrounded).map((d) => d.criterion_id));
  const values = Object.fromEntries(persona.determinations.map((determination) => [
    determination.criterion_id,
    determination.determination === "met" ? true : determination.determination === "unmet" ? false : null,
  ]));
  const output = new Set();
  collectDecisionLeaves(expression, values, evaluateExpression(expression, values), output);
  return output;
}

function renderDecisiveCriteria(persona, decisiveIds) {
  const root = document.getElementById("decisive-criteria");
  const criteria = persona.determinations.filter((determination) => decisiveIds.has(determination.criterion_id));
  root.innerHTML = "";
  if (!criteria.length) {
    root.innerHTML = "<div class='panel empty-state'><p>No decision branch metadata was recorded for this policy.</p></div>";
    return;
  }
  criteria.forEach((determination, index) => root.appendChild(createCriterion(determination, {
    decisive: true,
    expanded: index < 3,
  })));
}

function createCriterion(determination, { decisive = false, expanded = false } = {}) {
  const element = document.createElement("details");
  const ungrounded = isUngrounded(determination);
  element.className = `criterion det-${determination.determination}${decisive ? " decisive" : ""}${ungrounded ? " is-ungrounded" : ""}`;
  element.open = expanded;

  const summary = document.createElement("summary");
  summary.innerHTML = `
    <span class="criterion-statuses">
      <span class="badge det-${escapeHtml(determination.determination)}">${escapeHtml(DET_LABELS[determination.determination])}</span>
      ${ungrounded ? "<span class='badge badge-ungrounded'>Ungrounded</span>" : ""}
      ${decisive ? "<span class='badge badge-decisive'>Decisive</span>" : ""}
    </span>
    <span class="criterion-title"><code>${escapeHtml(determination.criterion_id)}</code>${escapeHtml(determination.criterion_text)}</span>
    <span class="summary-cue" aria-hidden="true"></span>`;
  element.appendChild(summary);

  const body = document.createElement("div");
  body.className = "criterion-body";
  if (determination.rationale) {
    const rationale = document.createElement("p");
    rationale.className = "rationale";
    rationale.textContent = determination.rationale;
    body.appendChild(rationale);
  }
  if (determination.check_used === "deterministic") {
    const note = document.createElement("p");
    note.className = "hint";
    note.textContent = "Checked deterministically from structured data; no model call.";
    body.appendChild(note);
  }
  body.appendChild(createSourceEvidence(determination));
  element.appendChild(body);
  return element;
}

function createSourceEvidence(determination) {
  if (!determination.spans.length) {
    const empty = document.createElement("p");
    empty.className = "no-source";
    empty.textContent = "No source span was recorded for this determination.";
    return empty;
  }
  const evidence = document.createElement("details");
  evidence.className = "source-evidence";
  const summary = document.createElement("summary");
  summary.textContent = `View ${determination.spans.length} source span${determination.spans.length === 1 ? "" : "s"}`;
  evidence.appendChild(summary);

  determination.spans.forEach((span) => {
    const gate = span.gate
      ? `${span.gate.verdict === "supported" ? "Supported" : "Unsupported"} · ${TIER_LABELS[span.gate.deciding_tier] || humanize(span.gate.deciding_tier)}`
      : "Documentation line · not evidence-gated";
    const quote = document.createElement("blockquote");
    quote.className = `span${span.gate?.verdict === "unsupported" ? " unsupported" : ""}`;
    quote.innerHTML = `<p>“${escapeHtml(span.text)}”</p><cite>${escapeHtml(span.document_id)} · characters ${escapeHtml(span.start)}–${escapeHtml(span.end)}<br>${escapeHtml(gate)}</cite>`;
    evidence.appendChild(quote);
  });
  return evidence;
}

function renderGaps(persona) {
  const root = document.getElementById("gaps");
  const unnecessary = new Set(getRollup(persona).unnecessary_to_resolve);
  const unresolved = persona.determinations.filter((determination) =>
    determination.determination === "non-determinable" && !unnecessary.has(determination.criterion_id)
  );
  root.innerHTML = "";
  if (!unresolved.length) {
    const message = document.createElement("div");
    message.className = "gap-state panel gap-clear";
    message.innerHTML = unnecessary.size
      ? `<strong>No outcome-changing documentation gap.</strong><p>${escapeHtml([...unnecessary].join(", "))} remains non-determinable, but the recorded policy expression proves it cannot change the result.</p>`
      : "<strong>No unresolved documentation gap.</strong><p>The recorded determinations settle the policy expression.</p>";
    root.appendChild(message);
    return;
  }

  unresolved.forEach((determination) => {
    const gap = document.createElement("div");
    gap.className = "gap-state panel";
    gap.innerHTML = `
      <div><span class="badge det-non-determinable">Non-determinable</span> <code>${escapeHtml(determination.criterion_id)}</code></div>
      <strong>${escapeHtml(determination.criterion_text)}</strong>
      <p>${determination.resolution_hint ? `<b>To resolve:</b> ${escapeHtml(determination.resolution_hint)}` : "No resolution guidance was recorded for this criterion."}</p>`;
    root.appendChild(gap);
  });
}

function handleCriterionFilter(event) {
  const status = event.currentTarget.dataset.status;
  if (status === "all") state.criterionFilters.clear();
  else if (state.criterionFilters.has(status)) state.criterionFilters.delete(status);
  else state.criterionFilters.add(status);
  updateCriterionFilterButtons();
  if (state.persona) renderCriteria(state.persona, getDecisiveCriterionIds(state.persona));
}

function updateCriterionFilterButtons() {
  document.querySelectorAll(".status-filter").forEach((button) => {
    const status = button.dataset.status;
    const active = status === "all" ? state.criterionFilters.size === 0 : state.criterionFilters.has(status);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderCriteria(persona, decisiveIds) {
  const root = document.getElementById("criteria");
  const filtered = persona.determinations.filter((determination) => {
    if (!state.criterionFilters.size) return true;
    return state.criterionFilters.has(determination.determination)
      || (state.criterionFilters.has("ungrounded") && isUngrounded(determination));
  });
  root.innerHTML = "";
  filtered.forEach((determination) => root.appendChild(createCriterion(determination, {
    decisive: decisiveIds.has(determination.criterion_id),
    expanded: false,
  })));
  document.getElementById("criterion-count").textContent = `${filtered.length} of ${persona.determinations.length} criteria shown`;
  if (!filtered.length) root.innerHTML = "<div class='panel empty-state'><p>No criteria match the selected status filters.</p></div>";
}

async function copyText(text, successMessage) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) {
      showToast("Copy failed. Select the text manually.");
      return;
    }
  }
  showToast(successMessage);
}

function copyLink() {
  if (!state.persona) return;
  setUrlCase(state.persona.case_id);
  copyText(window.location.href, "Case link copied");
}

function chooseAnother() {
  state.persona = null;
  state.criterionFilters.clear();
  setUrlCase(null);
  document.getElementById("step-coverage").classList.add("hidden");
  document.getElementById("step-result").classList.add("hidden");
  renderPersonas();
  smoothScroll(document.getElementById("step-persona"));
  document.getElementById("persona-title").focus({ preventScroll: true });
}

function resetDemo() {
  document.getElementById("scenario-filter").value = "all";
  document.getElementById("payer-filter").value = "all";
  document.getElementById("outcome-filter").value = "all";
  chooseAnother();
  showToast("Demo reset");
}

let toastTimer;
function showToast(message) {
  const toast = document.getElementById("toast");
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2400);
}

init();
