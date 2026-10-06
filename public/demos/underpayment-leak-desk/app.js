(function () {
  "use strict";
  var D = window.LEAK_DATA;
  var KEY = "hvh-leak-desk-v1";
  var LABEL = { new: "New", needs_review: "Needs review", approved: "Approved", not_leak: "Not a leak", sent_back: "Sent back" };

  var CASES = D.cases.map(function (c) {
    var o = Object.assign({}, c);
    o.gap = c.expected - c.paid;
    return o;
  }).sort(function (a, b) { return b.gap - a.gap; });
  var BY_ID = {};
  CASES.forEach(function (c) { BY_ID[c.id] = c; });

  function seed() {
    var cs = {};
    CASES.forEach(function (c) {
      cs[c.id] = c.seedStatus === "not_leak_agent"
        ? { status: "not_leak", by: "agent", note: "", sentBack: false, linkedClause: "" }
        : { status: "open", by: "", note: "", sentBack: false, linkedClause: "" };
    });
    return { cases: cs, selected: null, threshold: D.threshold, payer: "All" };
  }

  var state;
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
  if (!state || !state.cases || Object.keys(state.cases).length !== CASES.length) state = seed();
  var ui = { err: "", noteErr: "", clauseErr: "", flash: "" };

  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]; }); }
  function $(id) { return document.getElementById(id); }

  function clauseOf(c) {
    var s = state.cases[c.id];
    if (c.clause) return c.clause;
    if (s.linkedClause) return { id: s.linkedClause, text: "Linked by a human reviewer. Read the clause in the contract before you approve.", linked: true };
    return null;
  }
  function gates(c) {
    var r = [];
    if (c.gap >= state.threshold) r.push("Gap is " + money(c.gap) + ", at or over the " + money(state.threshold) + " line");
    if (c.confidence < D.confidenceFloor) r.push("Agent confidence is " + c.confidence + "%, under " + D.confidenceFloor + "%");
    if (!clauseOf(c)) r.push("Contract clause is missing");
    return r;
  }
  function chips(c) {
    var s = state.cases[c.id];
    if (s.status === "approved") return [["approved", "Approved"]];
    if (s.status === "not_leak") return [["not_leak", s.by === "agent" ? "Not a leak (agent)" : "Not a leak"]];
    var out = [];
    if (s.sentBack) { out.push(["needs_review", "Needs review"]); out.push(["sent_back", "Sent back"]); }
    else if (gates(c).length) out.push(["needs_review", "Needs review"]);
    else out.push(["new", "New"]);
    return out;
  }
  function chipHtml(c) { return chips(c).map(function (x) { return '<span class="chip ' + x[0] + '">' + x[1] + "</span>"; }).join(""); }
  function isOpen(c) { var s = state.cases[c.id].status; return s !== "approved" && s !== "not_leak"; }

  function renderSummary() {
    var total = 0, open = 0, cfo = 0, byCause = {};
    D.rootCauses.forEach(function (r) { byCause[r] = 0; });
    CASES.forEach(function (c) {
      total += c.gap;
      byCause[c.rootCause] = (byCause[c.rootCause] || 0) + c.gap;
      if (isOpen(c)) open += c.gap;
      if (state.cases[c.id].status === "approved") cfo += c.gap;
    });
    $("month").textContent = D.month;
    $("totalGap").textContent = money(total);
    $("openGap").textContent = money(open);
    $("cfoDollars").textContent = money(cfo);
    $("causes").innerHTML = Object.keys(byCause).map(function (k) {
      return '<li class="' + (k.indexOf("Not a leak") === 0 ? "notleak" : "") + '"><span>' + esc(k) + "</span><strong>" + money(byCause[k]) + "</strong></li>";
    }).join("");

    var reviewed = 0, approved = 0;
    CASES.forEach(function (c) {
      var s = state.cases[c.id];
      if (s.status === "approved") { reviewed++; approved++; }
      else if (s.status === "not_leak" && s.by === "human") reviewed++;
      else if (s.sentBack) reviewed++;
    });
    $("hitRate").textContent = reviewed
      ? "Agent hit rate: " + approved + " of " + reviewed + " human-reviewed cases approved (" + Math.round(100 * approved / reviewed) + "%)."
      : "Agent hit rate: no human reviews yet.";

    var waiting = CASES.filter(function (c) { return isOpen(c); }).length;
    $("agentCount").textContent = CASES.length;
    $("agentWaiting").textContent = waiting;
  }

  function renderList() {
    var payers = ["All"].concat(CASES.map(function (c) { return c.payer; }).filter(function (p, i, a) { return a.indexOf(p) === i; }));
    $("payerFilter").innerHTML = payers.map(function (p) { return "<option" + (p === state.payer ? " selected" : "") + ">" + esc(p) + "</option>"; }).join("");
    var rows = CASES.filter(function (c) { return state.payer === "All" || c.payer === state.payer; });
    $("caseRows").innerHTML = rows.map(function (c) {
      return '<tr class="' + (state.selected === c.id ? "sel" : "") + '">' +
        '<td><button type="button" class="rowbtn" data-open="' + c.id + '" aria-label="Open case ' + c.id + '">' + c.id + "</button></td>" +
        "<td>" + esc(c.payer) + "</td>" +
        '<td class="num">' + (state.cases[c.id].status === "not_leak" ? '<span class="chip not_leak">Gap ' + money(c.gap) + "</span>" : '<span class="chip gap">Underpaid ' + money(c.gap) + "</span>") + "</td>" +
        "<td>" + esc(c.rootCause) + "</td>" +
        "<td>" + chipHtml(c) + "</td></tr>";
    }).join("") || '<tr><td colspan="5">No cases for this payer.</td></tr>';
  }

  function renderDetail() {
    var box = $("detailBody");
    var c = state.selected && BY_ID[state.selected];
    if (!c) { box.innerHTML = '<p class="muted-strong">Open a case from the list to see expected vs paid, the contract clause, and the actions.</p>'; return; }
    var s = state.cases[c.id], cl = clauseOf(c), g = gates(c), open = isOpen(c);
    var h = "";
    h += '<p><span class="mono"><strong>' + c.id + "</strong></span> " + chipHtml(c) + "</p>";
    h += "<p><strong>" + esc(c.payer) + "</strong><br>" + esc(c.service) + "</p>";
    h += '<div class="cmp"><div><span>Expected</span><strong>' + money(c.expected) + '</strong></div><div><span>Paid</span><strong>' + money(c.paid) + '</strong></div><div class="gapbox"><span>Gap</span><strong>' + money(c.gap) + "</strong></div></div>";
    h += '<dl class="facts">' +
      "<dt>Contract rate</dt><dd>" + money(c.contractRate) + "</dd>" +
      "<dt>Remit reason</dt><dd>" + esc(c.remitReason) + "</dd>" +
      (c.patientResp ? "<dt>Patient owes</dt><dd>" + money(c.patientResp) + " on the remit</dd>" : "") +
      "<dt>Agent root cause</dt><dd>" + esc(c.rootCause) + "</dd>" +
      "<dt>Agent says</dt><dd>" + esc(c.agentNote) + "</dd>" +
      "<dt>Agent confidence</dt><dd>" + c.confidence + "%</dd></dl>";
    h += "<h3>Contract clause the agent used</h3>";
    h += cl
      ? '<div class="clause"><span class="mono"><strong>' + esc(cl.id) + "</strong></span><br>" + esc(cl.text) + "</div>"
      : '<div class="clause missing"><strong>No clause found.</strong> The agent could not link this gap to a line in the contract on file.</div>';

    if (s.sentBack && s.note) h += '<div class="note-shown"><strong>Sent back to agent. Note:</strong> ' + esc(s.note) + "</div>";

    if (open) {
      h += '<div class="gates"><strong>Why a human must decide:</strong> ' +
        (g.length ? g.map(function (x) { return '<span class="chip gate">' + esc(x) + "</span>"; }).join(" ")
          : "Under the line, but the agent never approves dollars on its own.") + "</div>";
      var locked = !cl;
      if (locked) {
        h += '<div class="lock" role="status"><p>Approve is locked: this case has no contract clause.</p><p>To fix: link the clause id from the contract below, or send it back to the agent and ask it to find the clause.</p></div>';
        h += '<div class="field"><label for="clauseIn">Link a contract clause id</label><input id="clauseIn" type="text" placeholder="Example: BW-AGR-9.4"><div class="actions"><button type="button" class="btn ghost" data-act="link">Link clause</button></div>' + (ui.clauseErr ? '<p class="err">' + esc(ui.clauseErr) + "</p>" : "") + "</div>";
      }
      h += '<div class="actions">' +
        '<button type="button" class="btn primary" data-act="approve"' + (locked ? " disabled" : "") + ">Approve recovery " + money(c.gap) + "</button>" +
        '<button type="button" class="btn secondary" data-act="notleak">Not a leak</button></div>';
      h += '<div class="field"><label for="noteIn">Note for the agent (required to send back)</label><textarea id="noteIn" rows="2" placeholder="Example: Check the 2026 drug carve-out exhibit."></textarea>' +
        (ui.noteErr ? '<p class="err" role="alert">' + esc(ui.noteErr) + "</p>" : "") +
        '<div class="actions"><button type="button" class="btn secondary fill" data-act="sendback">Send back to agent</button></div></div>';
    } else {
      if (s.status === "approved") h += '<div class="ok">Approved by a human. ' + money(c.gap) + " now counts in CFO-confirmed dollars.</div>";
      else if (s.by === "agent") h += '<div class="ok">The agent closed this as Not a leak by itself. The gap fully matches the patient responsibility line on the remit. This is the one thing it may close alone.</div>';
      else h += '<div class="ok">Marked Not a leak by a human. Removed from the open gap.</div>';
      h += '<div class="actions"><button type="button" class="btn ghost" data-act="reopen">Reopen case</button></div>';
    }
    if (ui.flash) h += '<p class="ok" role="status">' + esc(ui.flash) + "</p>";
    h += '<div class="actions"><button type="button" class="btn ghost" data-act="back">Back to case list</button></div>';
    box.innerHTML = h;
  }

  function renderRule() {
    $("thrText").textContent = money(state.threshold);
    $("thrSel").value = String(state.threshold);
    var openC = CASES.filter(isOpen);
    var gated = openC.filter(function (c) { return gates(c).length; }).length;
    $("thrImpact").textContent = "At " + money(state.threshold) + ", " + gated + " of " + openC.length + " open cases need human review. Cases under the line show as New. The agent still cannot approve them.";
  }

  function renderDigest() {
    var by = {}, any = false;
    CASES.forEach(function (c) { if (state.cases[c.id].status === "approved") { by[c.payer] = (by[c.payer] || 0) + c.gap; any = true; } });
    if (!any) { $("digest").innerHTML = "<p>No CFO-confirmed dollars yet. Approve a case to see it here.</p>"; return; }
    var tot = 0;
    var rows = Object.keys(by).map(function (p) { tot += by[p]; return "<tr><td>" + esc(p) + '</td><td class="num">' + money(by[p]) + "</td></tr>"; }).join("");
    $("digest").innerHTML = '<div class="table-box"><table><thead><tr><th>Payer</th><th class="num">Confirmed</th></tr></thead><tbody>' + rows + '<tr><td><strong>Total</strong></td><td class="num"><strong>' + money(tot) + "</strong></td></tr></tbody></table></div>";
  }

  function render() { renderSummary(); renderList(); renderDetail(); renderRule(); renderDigest(); save(); }

  function openCase(id) {
    state.selected = id; ui.noteErr = ""; ui.clauseErr = ""; ui.flash = "";
    render();
    var d = $("detail");
    if (d && d.scrollIntoView) d.scrollIntoView({ behavior: "smooth", block: "start" });
    if (d) d.focus({ preventScroll: true });
  }

  function act(a) {
    if (a === "back") { var l = $("listH"); if (l && l.scrollIntoView) l.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    var c = BY_ID[state.selected]; if (!c) return;
    var s = state.cases[c.id];
    ui.noteErr = ""; ui.clauseErr = ""; ui.flash = "";
    if (a === "approve") {
      if (!clauseOf(c)) return render();
      s.status = "approved"; s.by = "human";
    } else if (a === "notleak") {
      s.status = "not_leak"; s.by = "human";
    } else if (a === "sendback") {
      var n = ($("noteIn").value || "").trim();
      if (n.length < 3) { ui.noteErr = "Write a short note first. Tell the agent what to check."; return render(); }
      s.status = "open"; s.sentBack = true; s.note = n; s.by = "";
      ui.flash = "Sent back. The case is in Needs review with your note.";
    } else if (a === "link") {
      var v = ($("clauseIn").value || "").trim();
      if (v.length < 3) { ui.clauseErr = "Enter the clause id from the contract, for example BW-AGR-9.4."; return render(); }
      s.linkedClause = v; ui.flash = "Clause linked. Approve is now unlocked.";
    } else if (a === "reopen") {
      s.status = "open"; s.by = "";
    }
    render();
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-open],[data-act]");
    if (!t) return;
    if (t.dataset.open) openCase(t.dataset.open);
    else if (!t.disabled) act(t.dataset.act);
  });
  $("payerFilter").addEventListener("change", function (e) { state.payer = e.target.value; render(); });
  $("thrSel").addEventListener("change", function (e) { state.threshold = Number(e.target.value); render(); });
  $("resetBtn").addEventListener("click", function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    state = seed(); ui = { err: "", noteErr: "", clauseErr: "", flash: "" };
    render(); window.scrollTo(0, 0);
  });

  render();
})();
