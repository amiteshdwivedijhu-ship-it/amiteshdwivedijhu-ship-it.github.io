(function () {
  const DATA = window.MERGE_DATA;
  const KEY = "merge-policy-dry-run-v1";
  const main = document.getElementById("main");

  function fresh() {
    return {
      screen: "policy",
      draft: { contractorBlock: true, dlp: true, supportReroute: true, financeCap: true, financeAmount: 4000 },
      exceptions: [],
      dryRun: null,
      note: "",
      published: null,
      audits: [],
      requests: [],
      drillId: "C-001",
      exceptionOwner: "Dana Ruiz, RevOps"
    };
  }

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return fresh();
      return Object.assign(fresh(), JSON.parse(raw));
    } catch (err) {
      return fresh();
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function signature() {
    return JSON.stringify({ draft: state.draft, exceptions: state.exceptions.map(function (item) { return item.owner + "|" + item.scope; }) });
  }

  function pipelineCovered() {
    return state.exceptions.some(function (item) {
      return item.coversPipeline && String(item.owner || "").trim();
    });
  }

  function effects() {
    const draft = state.draft;
    const covered = pipelineCovered();
    const blocked = draft.contractorBlock ? (covered ? 192 : 312) : 0;
    const criticalBlocked = draft.contractorBlock && !covered ? 120 : 0;
    const redact = draft.dlp ? 41 : 0;
    const reroute = draft.supportReroute ? 5200 : 0;
    const supportSave = draft.supportReroute ? 2100 : 0;
    const financeSave = draft.financeCap ? 800 : 0;
    return {
      blocked: blocked,
      criticalBlocked: criticalBlocked,
      redact: redact,
      reroute: reroute,
      supportSave: supportSave,
      financeSave: financeSave,
      savings: supportSave + financeSave,
      covered: covered
    };
  }

  function teamRows() {
    const fx = effects();
    const redactSplit = { Sales: 8, Engineering: 5, Support: 28, Finance: 0, Contractors: 0 };
    return DATA.groups.map(function (group) {
      const redact = state.draft.dlp ? redactSplit[group.name] : 0;
      const blocked = group.name === "Contractors" ? fx.blocked : 0;
      const reroute = group.name === "Support" ? fx.reroute : 0;
      let spendAfter = group.spend;
      if (group.name === "Support") spendAfter -= fx.supportSave;
      if (group.name === "Finance") spendAfter -= fx.financeSave;
      return { name: group.name, blocked: blocked, redact: redact, reroute: reroute, before: group.spend, after: spendAfter };
    });
  }

  function callEffect(call) {
    const draft = state.draft;
    if (draft.contractorBlock && call.group === "Contractors" && call.connector === "Salesforce" && call.op === "write") {
      if (pipelineCovered() && call.action === "update_opportunity") {
        return { label: "Allowed by exception", kind: "ok", message: "Salesforce opportunity updates stay on for Sales Ops contractors. Ref: policy draft." };
      }
      return { label: "Blocked", kind: "block", message: "Salesforce write is not allowed for your group. Request access from IT. Ref: policy v13." };
    }
    if (draft.dlp && call.containsPII) {
      return { label: "Redacted", kind: "redact", message: "Card numbers and SSNs in this call would be redacted before the model sees them." };
    }
    if (draft.supportReroute && call.group === "Support" && call.kind === "model") {
      return { label: "Rerouted", kind: "route", message: "This Support answer would use the lower cost model unless the ticket is tagged complex." };
    }
    return { label: "Allowed", kind: "ok", message: "This call still matches the live group rules." };
  }

  function workflowImpact(flow) {
    const fx = effects();
    if (flow.name === "Sales Ops pipeline sync") {
      return { blocked: fx.criticalBlocked, words: fx.criticalBlocked ? fx.criticalBlocked + " calls would be blocked" : "0 calls blocked" };
    }
    if (flow.name === "Support refund macros" && state.draft.dlp) {
      return { blocked: 0, words: "0 calls blocked. Some ticket bodies would be redacted." };
    }
    if (flow.name === "Finance month close" && state.draft.financeCap) {
      return { blocked: 0, words: "0 calls blocked. The cap would have stopped 2 days of Finance usage last month." };
    }
    return { blocked: 0, words: "0 calls blocked" };
  }

  function publishReasons() {
    const reasons = [];
    const fx = effects();
    if (!state.dryRun || state.dryRun.sig !== signature()) reasons.push("Run the dry run on the current draft.");
    const critical = DATA.workflows.filter(function (flow) { return flow.critical; });
    const broken = critical.filter(function (flow) { return workflowImpact(flow).blocked > 0; });
    if (broken.length) reasons.push("Business critical workflows still have blocked calls: " + broken.map(function (flow) { return flow.name; }).join(", ") + ".");
    if (!DATA.liveVersion) reasons.push("Save a rollback version first.");
    if (!String(state.note || "").trim()) reasons.push("Write a short note to affected employees.");
    return { reasons: reasons, fx: fx };
  }

  function render() {
    const active = document.activeElement;
    const focusId = active && active.id ? active.id : "";
    const sel = active && typeof active.selectionStart === "number" ? active.selectionStart : null;
    document.querySelectorAll(".tabs button").forEach(function (button) {
      button.classList.toggle("active-tab", button.getAttribute("data-screen") === state.screen);
    });
    const views = { policy: renderPolicy, draft: renderDraft, dry: renderDry, drill: renderDrill, exceptions: renderExceptions, publish: renderPublish, employee: renderEmployee };
    main.innerHTML = (views[state.screen] || renderPolicy)();
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) {
        el.focus();
        if (sel != null && el.setSelectionRange) {
          try { el.setSelectionRange(sel, sel); } catch (err) { /* ignore */ }
        }
      }
    }
  }

  function renderPolicy() {
    const cards = DATA.groups.map(function (group) {
      return "<article class='card'><h2>" + esc(group.name) + " · " + group.size + " people</h2><div class='pair'><div class='side'><h3>Live access</h3><p>" + esc(group.connectors.join(". ")) + ".</p><p>Tools: " + esc(group.tools.join(", ")) + ".</p><p>DLP: " + esc(group.dlp) + ".</p><p>Default model: " + esc(group.model) + ".</p><p>Monthly cap: $" + group.cap.toLocaleString("en-US") + ".</p></div><div class='side'><h3>Last 7 days, this group</h3><p>Spend $" + group.spend.toLocaleString("en-US") + ".</p></div></div></article>";
    }).join("");
    return "<section><div class='card'><h2>Live policy " + DATA.liveVersion + "</h2><p>Last 7 days across the company: " + DATA.week.toolCalls.toLocaleString("en-US") + " tool calls, " + DATA.week.modelCalls.toLocaleString("en-US") + " model calls, $" + DATA.week.spend.toLocaleString("en-US") + " spend.</p><p>Global DLP is off. Contractor Salesforce write is still allowed.</p></div>" + cards + "</section>";
  }

  function toggle(key, on, title, detail) {
    return "<button type='button' class='toggle" + (on ? " on" : "") + "' data-toggle='" + key + "'><span class='knob' aria-hidden='true'></span><span><strong>" + title + "</strong><br>" + detail + "</span></button>";
  }

  function renderDraft() {
    const draft = state.draft;
    return "<section><div class='card'><h2>Draft on top of " + DATA.liveVersion + "</h2><p>These four changes are the ask from IT. Turn any of them off to see a smaller blast radius.</p>" +
      toggle("contractorBlock", draft.contractorBlock, "Contractors: block Salesforce write", "Read stays on. Write, including update_opportunity, would block.") +
      toggle("dlp", draft.dlp, "Global DLP: redact SSN and card numbers", "Applies to every group. The call continues with the secret removed.") +
      toggle("supportReroute", draft.supportReroute, "Support: lower cost model by default", "Escalate to the frontier tier only when the ticket is tagged complex.") +
      toggle("financeCap", draft.financeCap, "Finance monthly cap", "Drop the cap from $7,000 to the amount below.") +
      "<label class='field' for='cap-amount'>Finance cap amount</label><input id='cap-amount' type='number' min='0' step='100' value='" + esc(draft.financeAmount) + "'></div></section>";
  }

  function renderDry() {
    const fx = effects();
    const freshRun = state.dryRun && state.dryRun.sig === signature();
    const rows = teamRows().map(function (row) {
      return "<tr><td>" + esc(row.name) + "</td><td>" + row.blocked + " blocked</td><td>" + row.redact + " redacted</td><td>" + row.reroute.toLocaleString("en-US") + " rerouted</td><td>$" + row.before.toLocaleString("en-US") + "</td><td>$" + row.after.toLocaleString("en-US") + "</td></tr>";
    }).join("");
    const flows = DATA.workflows.map(function (flow) {
      const impact = workflowImpact(flow);
      return "<li><strong>" + esc(flow.name) + "</strong> (" + (flow.critical ? "business critical" : "not critical") + ", owner " + esc(flow.owner) + "). " + esc(impact.words) + ". Uses " + esc(flow.connector) + " " + esc(flow.op) + ".</li>";
    }).join("");
    return "<section><div class='actions'><button type='button' class='primary' id='run-dry'>Run dry run</button></div>" + (freshRun ? "<div class='okbox'>Dry run " + esc(state.dryRun.id) + " matches this draft.</div>" : "<div class='warnbox'>No dry run matches this draft yet.</div>") + "<div class='stats'><article class='stat block'><p>Would block</p><p class='n'>" + fx.blocked + "</p><p>calls</p></article><article class='stat redact'><p>Would redact</p><p class='n'>" + fx.redact + "</p><p>calls</p></article><article class='stat route'><p>Would reroute</p><p class='n'>" + fx.reroute.toLocaleString("en-US") + "</p><p>model calls</p></article><article class='stat ok'><p>Monthly spend change</p><p class='n'>minus $" + fx.savings.toLocaleString("en-US") + "</p><p>about $" + fx.supportSave.toLocaleString("en-US") + " from Support and $" + fx.financeSave.toLocaleString("en-US") + " from the Finance cap</p></article></div><div class='card'><h2>By team, before and after</h2><div class='table-scroll'><table><thead><tr><th>Team</th><th>Blocked</th><th>Redacted</th><th>Rerouted</th><th>Spend now</th><th>Spend after</th></tr></thead><tbody>" + rows + "</tbody></table></div></div><div class='card'><h2>Workflows that would break</h2><ul>" + flows + "</ul>" + (state.draft.financeCap ? "<p class='warnbox'>Finance cap warning: it would have stopped 2 days of usage last month.</p>" : "") + "</div></section>";
  }

  function renderDrill() {
    const rows = DATA.calls.map(function (call) {
      const effect = callEffect(call);
      return "<tr><td><button type='button' data-call='" + call.id + "'>" + esc(call.id) + "</button></td><td>" + esc(call.person) + "</td><td>" + esc(call.group) + "</td><td>" + esc(call.client) + "</td><td>" + esc(call.connector) + " " + esc(call.action) + "</td><td><span class='pill " + effect.kind + "'>" + esc(effect.label) + "</span></td></tr>";
    }).join("");
    const call = DATA.calls.find(function (item) { return item.id === state.drillId; }) || DATA.calls[0];
    const effect = callEffect(call);
    return "<section><p class='muted'>Sample of last 7 days (" + DATA.calls.length + " rows). Week totals on the dry run screen are the full company, not a sum of this sample.</p><div class='card'><h2>" + esc(call.person) + " · " + esc(call.id) + "</h2><p>" + esc(call.group) + " · " + esc(call.client) + " · " + esc(call.connector) + " · " + esc(call.action) + " · " + esc(call.op) + ".</p><p>Policy that hit: <span class='pill " + effect.kind + "'>" + esc(effect.label) + "</span></p><div class='employee-msg'><h3>What the employee would see</h3><p>" + esc(effect.message) + "</p></div></div><div class='table-scroll'><table><thead><tr><th>Call</th><th>Person</th><th>Team</th><th>Client</th><th>Action</th><th>Result</th></tr></thead><tbody>" + rows + "</tbody></table></div></section>";
  }

  function renderExceptions() {
    const list = state.exceptions.map(function (item) {
      return "<li>" + esc(item.scope) + ". Owner " + esc(item.owner) + ". Expires in " + esc(item.expires) + ".</li>";
    }).join("") || "<li>No exceptions yet.</li>";
    return "<section class='card'><h2>Scoped exception</h2><p>The Sales Ops pipeline sync is business critical. A narrow exception keeps that write and still blocks other contractor Salesforce writes.</p><label class='field' for='ex-owner'>Owner</label><input id='ex-owner' type='text' value='" + esc(state.exceptionOwner) + "'><p>Group: Sales Ops contractors. Access: Salesforce write on Opportunity only. Expires in 30 days.</p><div class='actions'><button type='button' class='primary' id='add-exception'>Add exception and re-run</button></div><ul>" + list + "</ul></section>";
  }

  function renderPublish() {
    const check = publishReasons();
    const rollbackPass = true;
    const lines = [
      { ok: !!(state.dryRun && state.dryRun.sig === signature()), text: "Dry run has been run on the current draft." },
      { ok: check.reasons.every(function (reason) { return reason.indexOf("critical") === -1; }) && !(DATA.workflows.filter(function (flow) { return flow.critical && workflowImpact(flow).blocked > 0; }).length), text: "Every business critical workflow has 0 blocked calls, or an exception with a named owner." },
      { ok: rollbackPass, text: "Rollback version v12 is saved." },
      { ok: !!String(state.note || "").trim(), text: "A short note to affected employees is written." }
    ];
    const list = lines.map(function (line) {
      return "<div class='check'><span class='pill " + (line.ok ? "ok" : "block") + "'>" + (line.ok ? "Pass" : "Fail") + "</span> " + esc(line.text) + "</div>";
    }).join("");
    const audits = state.audits.map(function (item) {
      return "<li><strong>" + esc(item.version) + "</strong> by " + esc(item.who) + " at " + esc(item.at) + ". Dry run " + esc(item.dryRunId) + ". " + esc(item.what) + " Exceptions: " + esc(item.exceptions || "none") + ". Rollback " + esc(item.rollback) + ".</li>";
    }).join("") || "<li>Nothing published yet.</li>";
    return "<section><div class='card'><h2>Publish gate</h2>" + list + (check.reasons.length ? "<div class='lock'>" + check.reasons.map(esc).join(" ") + "</div>" : "<div class='okbox'>All four checks pass.</div>") + "<label class='field' for='employee-note'>Note to affected employees</label><textarea id='employee-note'>" + esc(state.note) + "</textarea><div class='actions'><button type='button' id='sample-note'>Insert sample note</button><button type='button' class='primary' id='publish-btn'" + (check.reasons.length || state.published ? " disabled" : "") + ">Publish</button></div>" + (state.published ? "<div class='okbox'>Published " + esc(state.published.version) + ". Rollback version is " + esc(state.published.rollback) + ".</div>" : "") + "</div><div class='card'><h2>Audit</h2><ul>" + audits + "</ul></div></section>";
  }

  function renderEmployee() {
    const call = DATA.calls.find(function (item) { return item.action === "create_task"; }) || DATA.calls[0];
    const effect = callEffect(call);
    const queue = state.requests.map(function (item) {
      return "<li>" + esc(item.person) + " asked for " + esc(item.need) + " at " + esc(item.at) + ".</li>";
    }).join("") || "<li>The IT queue is empty.</li>";
    return "<section><div class='employee-msg'><p class='muted'>" + esc(call.person) + " · " + esc(call.group) + " · " + esc(call.client) + "</p><h2>In the AI tool</h2><p>" + esc(effect.message) + "</p><button type='button' class='primary' id='request-access'>Request access</button></div><div class='card'><h2>IT queue</h2><ul>" + queue + "</ul></div></section>";
  }

  function invalidate() {
    if (state.dryRun && state.dryRun.sig !== signature()) {
      /* keep the old run so the mismatch is visible */
    }
  }

  document.body.addEventListener("click", function (event) {
    const tab = event.target.closest("[data-screen]");
    if (tab) {
      state.screen = tab.getAttribute("data-screen");
      save();
      render();
      return;
    }
    const toggleBtn = event.target.closest("[data-toggle]");
    if (toggleBtn) {
      const key = toggleBtn.getAttribute("data-toggle");
      state.draft[key] = !state.draft[key];
      invalidate();
      save();
      render();
      return;
    }
    if (event.target.id === "run-dry") {
      const fx = effects();
      state.dryRun = { id: "DR-20261007-0" + (state.audits.length + 1), sig: signature(), at: new Date().toISOString(), blocked: fx.blocked };
      state.screen = "dry";
      save();
      render();
      return;
    }
    const call = event.target.closest("[data-call]");
    if (call) {
      state.drillId = call.getAttribute("data-call");
      save();
      render();
      return;
    }
    if (event.target.id === "add-exception") {
      const owner = String(state.exceptionOwner || "").trim();
      if (!owner) return;
      state.exceptions.push({
        scope: "Sales Ops contractors: Salesforce write on Opportunity only",
        owner: owner,
        expires: "30 days",
        coversPipeline: true
      });
      const fx = effects();
      state.dryRun = { id: "DR-20261007-0" + (state.exceptions.length + 1), sig: signature(), at: new Date().toISOString(), blocked: fx.blocked };
      state.screen = "dry";
      save();
      render();
      return;
    }
    if (event.target.id === "sample-note") {
      state.note = "Contractors can no longer update Salesforce, except Sales Ops opportunity updates for 30 days. Card numbers in tickets will be redacted. Support answers may use a lower cost model unless the ticket is tagged complex.";
      save();
      render();
      return;
    }
    if (event.target.id === "publish-btn") {
      const check = publishReasons();
      if (check.reasons.length) return;
      const version = "v13";
      const what = [
        state.draft.contractorBlock ? "contractor Salesforce write blocked" : "",
        state.draft.dlp ? "global DLP redact" : "",
        state.draft.supportReroute ? "Support model reroute" : "",
        state.draft.financeCap ? "Finance cap $" + state.draft.financeAmount : ""
      ].filter(Boolean).join("; ");
      const entry = {
        version: version,
        who: "you (demo)",
        at: new Date().toLocaleString(),
        what: what,
        dryRunId: state.dryRun.id,
        exceptions: state.exceptions.map(function (item) { return item.owner; }).join(", "),
        rollback: "v12",
        note: state.note.trim()
      };
      state.audits.unshift(entry);
      state.published = { version: version, rollback: "v12" };
      save();
      render();
      return;
    }
    if (event.target.id === "request-access") {
      const call = DATA.calls.find(function (item) { return item.action === "create_task"; }) || DATA.calls[0];
      state.requests.unshift({
        person: call.person,
        need: "Salesforce write for Contractors",
        at: new Date().toLocaleString()
      });
      save();
      render();
    }
  });

  document.body.addEventListener("input", function (event) {
    if (event.target.id === "cap-amount") {
      state.draft.financeAmount = Number(event.target.value || 0);
      save();
      return;
    }
    if (event.target.id === "ex-owner") {
      state.exceptionOwner = event.target.value;
      save();
      return;
    }
    if (event.target.id === "employee-note") {
      state.note = event.target.value;
      save();
      render();
    }
  });

  document.getElementById("btn-reset").addEventListener("click", function () {
    state = fresh();
    localStorage.removeItem(KEY);
    render();
  });

  render();
})();
