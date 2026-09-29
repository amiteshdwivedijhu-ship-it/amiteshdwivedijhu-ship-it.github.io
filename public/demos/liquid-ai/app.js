"use strict";
/* UI wiring: renders rubric strip, run log, packet, eval table; handles run
   switching and citation chips. Pure rendering only; scoring lives in engine.js. */

(() => {
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const ui = { runKey: "A" };

  // --------------------------------------------------------------------------
  // Rubric Lens strip: the three checks, measurable before the run
  // --------------------------------------------------------------------------

  function renderRubric() {
    $("#rubric").innerHTML = LIQUID_ENGINE.RUBRIC.map(
      (c) => `
      <div class="check">
        <div class="chk-name">${esc(c.id)} · ${esc(c.check)}</div>
        <div class="chk-rule">Pass rule: ${esc(c.rule)}</div>
        <div class="chk-ev">Evidence: ${esc(c.evidence)}</div>
        <span class="chk-measurable">Measurable: yes</span>
      </div>`
    ).join("");
  }

  // --------------------------------------------------------------------------
  // Run log (left): latency series, tool trace, passages, claims
  // --------------------------------------------------------------------------

  function segmentPassage(p) {
    // Split bracketed spans into segments, computing real character offsets so
    // cite refs like "P1:10-26" can be matched by overlap.
    const segs = [];
    let plain = "";
    const re = /\[([^\]]+)\]/g;
    let last = 0;
    let m;
    while ((m = re.exec(p.text))) {
      const pre = p.text.slice(last, m.index);
      plain += pre;
      const start = plain.length;
      plain += m[1];
      if (pre) segs.push({ kind: "text", text: pre, pid: p.id });
      segs.push({ kind: "mark", text: m[1], start, end: plain.length, pid: p.id });
      last = m.index + m[0].length;
    }
    const tail = p.text.slice(last);
    if (tail) segs.push({ kind: "text", text: tail, pid: p.id });
    return { plain, segs };
  }

  function renderPassage(p) {
    const { segs } = segmentPassage(p);
    let html = `<div class="passage-src">${esc(p.source)}</div><div class="passage-text">`;
    for (const s of segs) {
      if (s.kind === "text") html += esc(s.text);
      else html += `<mark data-cite="${s.pid}:${s.start}-${s.end}" title="${esc(p.source)}">${esc(s.text)}</mark>`;
    }
    html += `</div>`;
    return `<div class="passage" id="passage-${p.id}">${html}</div>`;
  }

  function renderLog(p) {
    const run = p.run;
    const lat = p.latency;
    const series = run.latencySamples.map((s) => s).sort((a, b) => a - b);
    const p50i = series.indexOf(lat.p50);
    const p95i = series.indexOf(lat.p95);
    const seriesHtml = series
      .map((s, i) => {
        const bold = i === p50i || i === p95i ? ` style="color:var(--ink);font-weight:700"` : "";
        return `<b${bold}>${s}</b>`;
      })
      .join(" ");

    const traces = run.trace
      .map(
        (t) => `
        <div class="trace-row ${t.status === "error" ? "err" : ""}" data-cite="${t.id}" id="trace-${t.id}">
          <div class="trace-top">
            <span class="trace-tool">${esc(t.tool)}</span>
            <span class="pill ${t.status === "error" ? "bad" : "ok"} sm">${t.status}</span>
            <span class="trace-ms">${t.ms} ms</span>
          </div>
          <div class="trace-args">${esc(JSON.stringify(t.args))}</div>
          <div class="trace-out ${t.status === "error" ? "bad" : "good"}">${esc(t.out)}</div>
        </div>`
      )
      .join("");

    const passages = run.passages.map(renderPassage).join("");

    const claims = run.claims
      .map((c) => {
        const chips = c.cite.map(
          (ref) => `<button type="button" class="chip" data-cite="${esc(ref)}">${esc(ref)}</button>`
        );
        const missing = !c.cite || c.cite.length === 0;
        const note = c.weak
          ? `<div class="claim-note">Low confidence: ${esc(c.weak)}</div>`
          : "";
        return `
        <div class="claim ${missing ? "bad" : c.weak ? "weak" : ""}" data-cite="${c.id}" id="claim-${c.id}">
          <span class="claim-id">${c.id}</span>${esc(c.text)}
          <span class="chipwrap">
            ${chips.join("")}
            ${missing ? `<span class="chip none">no citation</span>` : ""}
            ${c.weak ? `<span class="chip weakc">weak span</span>` : ""}
          </span>
          ${note}
        </div>`;
      })
      .join("");

    return `
      <h2>Run log · ${esc(run.key)} · ${esc(run.label)}</h2>
      <div class="logmeta">
        <span class="pill ink">${esc(run.model)}</span>
        <span class="pill purple">${esc(run.device)}</span>
        <span class="pill muted">${esc(run.selector)}</span>
      </div>
      <p class="sub" style="margin-bottom:10px">Task: ${esc(run.task)}</p>

      <section class="logsec">
        <h3>Latency samples · per turn, ms · budget ${lat.budgetMs} ms</h3>
        <div class="latrow" data-cite="lat" id="lat">${seriesHtml}</div>
      </section>

      <section class="logsec">
        <h3>Tool-call trace · function calling</h3>
        ${traces}
      </section>

      <section class="logsec">
        <h3>Retrieved passages · Edge SDK retrieval</h3>
        ${passages}
      </section>

      <section class="logsec">
        <h3>Assistant claims · citation spans</h3>
        ${claims}
      </section>`;
  }

  // --------------------------------------------------------------------------
  // Packet (right): gate, cite-carrying scores, flags
  // --------------------------------------------------------------------------

  function metricRow(m, opts = {}) {
    const kind = m.ok ? "ok" : "bad";
    const bar = opts.bar
      ? `<div class="bar">
           <div class="fill ${m.ok ? "" : "over"}" style="width:${opts.fillPct}%"></div>
           <div class="tick" style="left:${opts.tickPct}%" title="budget"></div>
         </div>`
      : "";
    const next = m.nextAction ? `<div class="metric-next">Next action: ${esc(m.nextAction)}</div>` : "";
    const cites = m.cite.map((c) => `<button type="button" class="chip" data-cite="${esc(c)}">${esc(c)}</button>`).join(" ");
    return `
      <div class="metric">
        <div class="metric-top">
          <span class="metric-name">${esc(m.field)}</span>
          <span class="pill ${kind}">${m.ok ? "pass" : "fail"}</span>
        </div>
        <div class="metric-val">${opts.valueHtml}</div>
        <div class="metric-rule">Pass rule: ${esc(m.passRule)}</div>
        ${bar}
        ${next}
        <div class="metric-cite">Evidence: ${cites}</div>
      </div>`;
  }

  function renderPacket(p) {
    const lat = p.latency;
    const gtClass = p.gate.verdict === "Pass" ? "pass" : "fail";
    const seriesMax = Math.max(...p.run.latencySamples, lat.budgetMs);
    const fillPct = Math.min(100, Math.round((lat.p95 / seriesMax) * 100));
    const tickPct = Math.min(100, Math.round((lat.budgetMs / seriesMax) * 100));

    const latVal = `<b>${lat.p50}</b> ms p50 · <b>${lat.p95}</b> ms p95 of ${lat.budgetMs} ms budget · wall ${lat.wallMs} ms`;
    const toolVal = `<b>${p.tools.okCount}</b> / ${p.tools.attempted} tool calls succeeded · ${Math.round(p.tools.rate * 100)}%`;
    const groundVal = `<b>${p.ground.cited - p.ground.weak}</b> / ${p.ground.total} claims supported by a cited span · ${Math.round(p.ground.rate * 100)}%`;

    const flags = [];
    if (p.gate.review) flags.push(`<div class="flagrow review"><span class="fl-label">Needs human review</span><span>${p.gate.fails.map((f) => f.check + ": " + f.detail).join(" · ")}${p.ground.weak ? (p.gate.fails.length ? " · " : "") + p.ground.weak + " (claim " + p.ground.weakClaims.map((c) => c.id).join(", ") + ")" : ""}</span></div>`);
    else flags.push(`<div class="flagrow"><span class="fl-label">Review flags</span><span class="none">none</span></div>`);
    if (p.gate.escalate) flags.push(`<div class="flagrow escalate"><span class="fl-label">Escalated</span><span>model or harness misbehaved (tool error or uncited claim) · hold before ship</span></div>`);

    return `
      <h2>Eval harness packet · run ${esc(p.key)}</h2>
      <div class="packet-head">
        <span class="gt ${gtClass}">${p.gate.verdict.toUpperCase()}</span>
        <span class="pill muted">ship gate</span>
        ${p.gate.review ? `<span class="pill warn">needs review</span>` : `<span class="pill ok">no flags</span>`}
      </div>
      <div class="note ${gtClass === "pass" ? "pass" : "fail"}">${esc(p.note)}</div>

      ${metricRow(lat, { bar: true, valueHtml: latVal, fillPct, tickPct })}
      ${metricRow(p.tools, { valueHtml: toolVal })}
      ${metricRow(p.ground, { valueHtml: groundVal })}

      <section class="flags">${flags.join("")}</section>
      <p class="sub" style="margin-top:10px;margin-bottom:0;font-size:12px">
        Packet integrity: every scored field carries a citation span
        <span class="pill ${p.integrity.ok ? "ok" : "bad"}">${p.integrity.ok ? "OK" : p.integrity.missing.join(", ")}</span>
      </p>`;
  }

  // --------------------------------------------------------------------------
  // Eval table: 3 runs, fails if any scored field lacks a citation span
  // --------------------------------------------------------------------------

  function renderEval() {
    const ev = LIQUID_ENGINE.evalTable();
    $("#evalrule").textContent = "Rule: " + ev.rule;
    $("#eval").innerHTML = `
      <table class="eval">
        <thead><tr><th>Case</th><th>Outcome</th><th>Scored fields cited</th><th>Reason</th></tr></thead>
        <tbody>
          ${ev.rows.map((r) => `
            <tr>
              <td class="case">${esc(r.key)} · ${esc(r.label)}</td>
              <td><span class="pill ${r.verdict === "Pass" ? "ok" : "bad"}">${r.verdict}</span></td>
              <td><span class="mono">${esc(r.cited)}</span></td>
              <td>${esc(r.reason)}</td>
            </tr>`).join("")}
        </tbody>
      </table>`;
  }

  // --------------------------------------------------------------------------
  // Citation highlighting
  // --------------------------------------------------------------------------

  function rangesOverlap(a, b) {
    const [as, ae] = a.split(":").slice(1).join(":").split("-").map(Number);
    const [bs, be] = b.split(":").slice(1).join(":").split("-").map(Number);
    return as < be && bs < ae;
  }

  function citeTargets(cite) {
    if (cite === "lat") return [document.getElementById("lat")];
    if (/^t\d+$/.test(cite)) {
      const el = document.getElementById("trace-" + cite);
      return el ? [el] : [];
    }
    if (/^c\d+$/.test(cite)) {
      const el = document.getElementById("claim-" + cite);
      return el ? [el] : [];
    }
    // Passage spans: match by overlap, e.g. "P1:10-26" vs mark "P1:34-49".
    if (/^P\d+:\d+-\d+$/.test(cite)) {
      const pid = cite.split(":")[0];
      return Array.from(document.querySelectorAll(`#passage-${pid} mark[data-cite]`)).filter(
        (m) => rangesOverlap(cite, m.dataset.cite)
      );
    }
    return [];
  }

  function highlight(cite) {
    document.querySelectorAll(".lit").forEach((el) => el.classList.remove("lit"));
    const targets = citeTargets(cite);
    if (!targets.length) return;
    targets.forEach((t) => t.classList.add("lit"));
    targets[0].scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // --------------------------------------------------------------------------
  // Wiring
  // --------------------------------------------------------------------------

  function render() {
    const p = LIQUID_ENGINE.buildPacket(LIQUID_RUNS[ui.runKey]);
    $("#log").innerHTML = renderLog(p);
    $("#packet").innerHTML = renderPacket(p);
    document.querySelectorAll("#runbar button").forEach((b) => {
      b.classList.toggle("on", b.dataset.run === ui.runKey);
    });
  }

  function wire() {
    renderRubric();
    renderEval();
    render();
    document.querySelectorAll("#runbar button[data-run]").forEach((b) => {
      b.addEventListener("click", () => { ui.runKey = b.dataset.run; render(); });
    });
    document.addEventListener("click", (e) => {
      const chip = e.target.closest("button.chip");
      if (!chip) { document.querySelectorAll(".lit").forEach((el) => el.classList.remove("lit")); return; }
      highlight(chip.dataset.cite);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();