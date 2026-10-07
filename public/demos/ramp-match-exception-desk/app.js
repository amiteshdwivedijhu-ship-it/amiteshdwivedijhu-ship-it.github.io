(function () {
  const DATA = window.RAMP_DATA;
  const KEY = "ramp-match-exception-desk-v1";
  const SCREENS = [
    ["inbox", "Inbox"],
    ["detail", "Detail"],
    ["fix", "Fix"],
    ["receipt", "Receipt"],
    ["policy", "Policy"],
    ["vendor", "Vendor note"],
    ["audit", "Audit and ERP"]
  ];

  function blankInvoice(inv) {
    return {
      fixId: "",
      approvedBy: "",
      approvedAt: "",
      rejected: false,
      duplicateCleared: false,
      promptSent: false,
      receipt: Object.assign({}, inv.seedReceipt),
      partialQty: "",
      receiptNote: "",
      vendorNote: inv.vendorNote,
      vendorSent: false,
      audit: [{ at: "Oct 6, 2026, 9:00 AM", actor: "Agent", text: "Drafted an explanation for " + inv.id + " using " + inv.citePo + ", " + inv.citeReceipt + ", and " + inv.citeInvoice + "." }]
    };
  }

  function seed() {
    const invoices = {};
    DATA.invoices.forEach((inv) => { invoices[inv.id] = blankInvoice(inv); });
    return {
      screen: "inbox",
      id: "INV-88341",
      filter: "All",
      flash: "",
      autoLogged: false,
      policy: Object.assign({}, DATA.policySeed),
      invoices: invoices
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seed();
      const saved = JSON.parse(raw);
      const base = seed();
      if (!saved || !saved.invoices) return base;
      DATA.invoices.forEach((inv) => {
        base.invoices[inv.id] = Object.assign(blankInvoice(inv), saved.invoices[inv.id] || {});
        base.invoices[inv.id].receipt = Object.assign({}, inv.seedReceipt, (saved.invoices[inv.id] || {}).receipt || {});
      });
      base.screen = saved.screen || "inbox";
      base.id = saved.id || "INV-88341";
      base.filter = saved.filter || "All";
      base.policy = Object.assign({}, DATA.policySeed, saved.policy || {});
      base.flash = "";
      base.autoLogged = !!saved.autoLogged;
      return base;
    } catch (err) {
      return seed();
    }
  }

  let state = load();
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const inv = () => DATA.invoices.find((row) => row.id === state.id);
  const st = () => state.invoices[state.id];

  function money(n) {
    const num = Number(n) || 0;
    const digits = Math.round(Math.abs(num) * 100) % 100 === 0 ? 0 : 2;
    return (num < 0 ? "-" : "") + "$" + Math.abs(num).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function stamp() {
    return new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function log(id, actor, text) {
    state.invoices[id].audit.push({ at: stamp(), actor: actor, text: text });
  }

  function withinTolerance(row) {
    if (row.issue === "Matched") return row.pricePct <= state.policy.pct && row.priceDollars <= state.policy.dollars;
    if (row.issue !== "Price variance") return false;
    if (row.qtyOver) return false;
    return row.pricePct <= Number(state.policy.pct) && row.priceDollars <= Number(state.policy.dollars);
  }

  function approverFor(amount, outside) {
    const amt = Number(amount) || 0;
    if (!outside && amt <= 500) return { name: "Policy", human: false };
    if (amt > 500) return { name: state.policy.controllerName || DATA.people.approver, human: true };
    return { name: state.policy.apName || DATA.people.ap, human: true };
  }

  function chosenFix(row, rec) {
    if (!rec.fixId) return null;
    return (row.fixes || []).find((f) => f.id === rec.fixId) || null;
  }

  function fixAmount(row, fix, rec) {
    if (row.id === "INV-88343" && fix && fix.id === "pay-received") {
      const qty = Number(rec.receipt.qty);
      if (!qty) return row.atRisk;
      return qty * row.unit;
    }
    return fix ? fix.amount : 0;
  }

  function explanation(row, rec) {
    let text = row.explanation;
    if (row.id === "INV-88343" && rec.receipt.confirmed) {
      text += " Receipt confirm by " + (rec.receipt.by === "requester" ? row.requester : rec.receipt.by) + ": " + rec.receipt.qty + " of " + row.ordered + ". PO-2215 line 1. INV-88343 line 1.";
    }
    return text;
  }

  function citationsOk(row, rec) {
    const text = explanation(row, rec);
    return text.indexOf(row.citePo) !== -1 && text.indexOf(row.citeReceipt) !== -1 && text.indexOf(row.citeInvoice) !== -1;
  }

  function receiptOk(row, rec) {
    if (!row.goods) return true;
    return !!(rec.receipt && rec.receipt.confirmed && rec.receipt.qty);
  }

  function duplicateOpen(row, rec) {
    return !!(row.duplicate && !rec.duplicateCleared && !rec.rejected);
  }

  function lineResolved(row, rec) {
    if (rec.rejected) return false;
    if (row.id === "INV-88343" && rec.receipt.confirmed && Number(rec.receipt.qty) === row.ordered) return true;
    if (withinTolerance(row) && !row.duplicate && row.issue !== "Missing PO" && row.issue !== "Not received" && row.issue !== "Over-billed qty") return true;
    const fix = chosenFix(row, rec);
    if (!fix || fix.resolves === false) return false;
    if (!rec.approvedBy) return false;
    if (row.id === "INV-88343") {
      return !!(rec.receipt.confirmed && Number(rec.receipt.qty) > 0 && fix.id === "pay-received");
    }
    return true;
  }

  function ready(row) {
    const rec = state.invoices[row.id];
    const reasons = [];
    if (rec.rejected) reasons.push("This bill was marked do not pay.");
    if (!lineResolved(row, rec)) {
      reasons.push("A line is still outside tolerance and has no approved fix.");
    }
    const fix = chosenFix(row, rec);
    if (fix && fix.resolves !== false && !rec.rejected) {
      const amount = fixAmount(row, fix, rec);
      const who = approverFor(amount, fix.outside || !withinTolerance(row));
      if (who.human && rec.approvedBy !== who.name) {
        reasons.push("The " + money(amount) + " fix needs approval from " + who.name + ", who is not the requester.");
      }
      if (rec.approvedBy && row.requester && rec.approvedBy === row.requester) {
        reasons.push("The requester cannot approve their own fix.");
      }
    } else if (!withinTolerance(row) && row.issue === "Price variance" && !rec.approvedBy) {
      reasons.push("The price gap is outside tolerance and has no approved fix.");
    }
    if (!citationsOk(row, rec)) reasons.push("The agent explanation must cite the PO line, the receipt line, and the invoice line.");
    if (!receiptOk(row, rec)) reasons.push("Goods on this bill need a receipt confirmed by the requester or the dock.");
    if (duplicateOpen(row, rec)) reasons.push("A duplicate-invoice flag is still open.");
    const uniq = reasons.filter((r, i) => reasons.indexOf(r) === i);
    return { ok: uniq.length === 0, reasons: uniq };
  }

  function statusOf(row) {
    if (ready(row).ok) return "Ready to pay";
    const rec = state.invoices[row.id];
    if (row.goods && !rec.receipt.confirmed && rec.promptSent) return "Waiting on requester";
    const fix = chosenFix(row, rec);
    if ((fix && fix.resolves !== false && !rec.approvedBy) || (row.id === "INV-88343" && rec.receipt.confirmed && !rec.approvedBy && Number(rec.receipt.qty) < row.ordered)) {
      return "Waiting on approver";
    }
    return "Needs fix";
  }

  function pill(status) {
    const kind = status === "Ready to pay" ? "good" : (status === "Needs fix" ? "bad" : "wait");
    return '<span class="pill pill-' + kind + '">' + esc(status) + "</span>";
  }

  function issuePill(issue) {
    const kind = issue === "Matched" ? "good" : "bad";
    return '<span class="pill pill-' + kind + '">' + esc(issue) + "</span>";
  }

  function atRiskTotal() {
    return DATA.invoices.reduce((sum, row) => {
      if (ready(row).ok || state.invoices[row.id].rejected) return sum;
      if (row.id === "INV-88343" && state.invoices[row.id].receipt.confirmed) {
        const qty = Number(state.invoices[row.id].receipt.qty) || 0;
        return sum + Math.max(0, (row.ordered - qty) * row.unit);
      }
      return sum + row.atRisk;
    }, 0);
  }

  function openExceptions() {
    return DATA.invoices.filter((row) => row.issue !== "Matched" && !ready(row).ok && !state.invoices[row.id].rejected).length;
  }

  function footer() {
    return '<footer class="site-footer"><p><a href="https://amiteshdwivedijhu-ship-it.github.io/" target="_blank" rel="noopener noreferrer">Prototype by Amitesh Dwivedi</a></p>' +
      "<p>Prototype for interview practice. Not affiliated with Ramp. Not a Ramp product. Synthetic vendors, invoices, and people only.</p></footer>";
  }

  function chrome(body) {
    const nav = SCREENS.map(([id, label]) => {
      return '<button type="button" class="nav-btn" data-action="screen" data-screen="' + id + '"' +
        (state.screen === id ? ' aria-current="page"' : "") + ">" + label + "</button>";
    }).join("");
    return '<header class="topbar"><div class="brand"><h1>Match Exception Desk</h1><p>' + esc(DATA.customer) + "</p></div>" +
      '<button type="button" class="btn btn-primary" data-action="reset">Reset demo</button></header><div class="wrap">' +
      '<div class="banner" role="note"><p><strong>Sample data.</strong> ' + esc(DATA.customer) +
      " is a synthetic customer. Vendors, invoices, and people are fake. The agent text is a sample, not a live model. Nothing is paid and nothing is emailed.</p>" +
      "<p>AP lead " + esc(DATA.people.ap) + ". Requester " + esc(DATA.people.requester) + ". Controller " + esc(DATA.people.approver) + ".</p></div>" +
      '<nav class="screen-nav" aria-label="Screens">' + nav + "</nav>" +
      (state.flash ? '<p class="lock-box" role="status">' + esc(state.flash) + "</p>" : "") +
      body + footer() + "</div>";
  }

  function picker() {
    const opts = DATA.invoices.map((row) => '<option value="' + row.id + '"' + (row.id === state.id ? " selected" : "") + ">" + row.id + " " + esc(row.vendor) + "</option>").join("");
    return '<label class="field"><span>Invoice</span><select data-action="switch">' + opts + "</select></label>";
  }

  function screenInbox() {
    const filters = ["All", "Matched", "Price variance", "Over-billed qty", "Not received", "Possible duplicate", "Missing PO"];
    const chips = filters.map((f) => '<button type="button" class="choice" data-action="filter" data-id="' + esc(f) + '" aria-pressed="' + (state.filter === f ? "true" : "false") + '">' + esc(f) + "</button>").join("");
    const rows = DATA.invoices.filter((row) => state.filter === "All" || row.issue === state.filter).map((row) => {
      const risk = row.id === "INV-88343" && state.invoices[row.id].receipt.confirmed
        ? Math.max(0, (row.ordered - Number(state.invoices[row.id].receipt.qty || 0)) * row.unit)
        : row.atRisk;
      return '<button type="button" class="inv-btn" data-action="open" data-id="' + row.id + '"><strong>' + row.id + " · " + esc(row.vendor) + "</strong><br>" +
        issuePill(row.issue) + pill(statusOf(row)) +
        '<span class="label">At risk ' + money(risk) + " · " + row.age + " days · " + (row.po || "No PO") + "</span></button>";
    }).join("");
    return "<h2>Exceptions inbox</h2><p class=\"risk\">" + money(atRiskTotal()) + " at risk</p><p>" + openExceptions() + " exceptions still open. Matched bills are not counted in the dollars at risk.</p>" +
      '<div class="choice-row" role="group" aria-label="Filter">' + chips + "</div>" + (rows || "<p>No invoices in this filter.</p>");
  }

  function column(title, lines) {
    const body = lines.map((line) => {
      const cls = line.flag ? ' class="mismatch"' : "";
      const word = line.flag === "price" ? " Price does not match." : line.flag === "qty" ? " Quantity does not match." : line.flag === "dup" ? " Possible duplicate." : line.flag === "po" ? " Missing PO." : "";
      return "<tr><td>" + esc(line.line) + "</td><td>" + esc(line.item) + "</td><td" + cls + ">" + esc(line.qty) + (line.flag === "qty" ? " Does not match." : "") + "</td><td" + (line.flag === "price" || line.flag === "po" || line.flag === "dup" ? ' class="mismatch"' : "") + ">" + esc(line.money) + esc(word) + "</td></tr>";
    }).join("");
    return '<section class="col-card"><h3>' + title + '</h3><div class="table-wrap"><table><thead><tr><th>Line</th><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>' + body + "</tbody></table></div></section>";
  }

  function screenDetail() {
    const row = inv();
    const rec = st();
    const cols = {
      po: row.columns.po,
      receipt: row.columns.receipt,
      invoice: row.columns.invoice
    };
    if (row.id === "INV-88343" && rec.receipt.confirmed) {
      cols.receipt = [{ line: "Receipt confirm", item: "Laptop", qty: String(rec.receipt.qty) + " confirmed", money: "By " + rec.receipt.by, flag: Number(rec.receipt.qty) === row.ordered ? "" : "qty" }];
    }
    return picker() + "<h2>" + row.id + "</h2><p>" + esc(row.vendor) + " · " + (row.po || "No PO") + " · " + row.age + " days</p><p>" + issuePill(row.issue) + pill(statusOf(row)) + "</p>" +
      '<div class="compare">' + column("PO", cols.po) + column("Receipt", cols.receipt) + column("Invoice", cols.invoice) + "</div>" +
      '<article class="card"><h3>Agent explanation</h3><p>' + esc(explanation(row, rec)) + "</p><p>" +
      '<span class="pill">Cites ' + esc(row.citePo) + "</span>" +
      '<span class="pill">Cites ' + esc(row.citeReceipt) + "</span>" +
      '<span class="pill">Cites ' + esc(row.citeInvoice) + "</span></p></article>" +
      '<div class="btn-row"><button type="button" class="btn btn-primary" data-action="screen" data-screen="fix">Review proposed fix</button>' +
      (row.id === "INV-88343" ? '<button type="button" class="btn" data-action="send-prompt">Send receipt prompt to Jordan</button>' : "") +
      "</div>";
  }

  function screenFix() {
    const row = inv();
    const rec = st();
    if (!row.fixes.length) {
      return picker() + "<h2>Proposed fix</h2><p>" + pill(statusOf(row)) + "</p><p>INV-88346 is inside tolerance. Policy already accepted it. No fix is needed.</p>";
    }
    const cards = row.fixes.map((fix) => {
      const amount = fixAmount(row, fix, rec);
      const who = approverFor(amount, fix.outside || !withinTolerance(row));
      const on = rec.fixId === fix.id;
      let impact = fix.impact;
      if (row.id === "INV-88343" && fix.id === "pay-received" && rec.receipt.confirmed) {
        const qty = Number(rec.receipt.qty) || 0;
        impact = "Pay " + money(qty * row.unit) + " for " + qty + " laptops. Hold " + money((row.ordered - qty) * row.unit) + ".";
      }
      return '<article class="card"><h3>' + esc(fix.label) + "</h3><p>" + esc(impact) + "</p><p>Dollar impact reviewed: " + money(amount) + ".</p><p>Approver: " + esc(who.human ? who.name : "None. Inside policy.") + ".</p><p>Policy: price variance auto-accepts only up to " + esc(String(state.policy.pct)) + "% and " + money(state.policy.dollars) + " per line. Quantity over-billing never auto-accepts. Fixes over $500 go to the controller.</p><p>Next: " + esc(fix.next) + "</p>" +
        '<button type="button" class="btn btn-primary" data-action="pick-fix" data-id="' + fix.id + '">' + (on ? "Selected" : "Use this fix") + "</button></article>";
    }).join("");
    const picked = chosenFix(row, rec);
    const who = picked && picked.resolves !== false ? approverFor(fixAmount(row, picked, rec), picked.outside || !withinTolerance(row)) : null;
    const approve = who && who.human && rec.approvedBy !== who.name
      ? '<button type="button" class="btn btn-primary" data-action="approve">Approve as ' + esc(who.name) + "</button>"
      : "";
    return picker() + "<h2>Proposed fix</h2><p>" + pill(statusOf(row)) + "</p>" + cards + '<div class="btn-row">' + approve + "</div>";
  }

  function screenReceipt() {
    const row = DATA.invoices.find((r) => r.id === "INV-88343");
    const rec = state.invoices["INV-88343"];
    return '<div class="phone-card"><p class="label">Requester phone</p><h2>Did you get 6 laptops from Tallgrass IT?</h2>' +
      "<p>PO-2215. Invoice INV-88343. " + (rec.promptSent ? "Prompt sent to Jordan Lee." : "Prompt not sent yet.") + "</p>" +
      '<div class="stack">' +
      '<button type="button" class="btn btn-primary" data-action="recv" data-mode="all">Received all</button>' +
      '<button type="button" class="btn" data-action="recv" data-mode="some">Received some</button>' +
      '<button type="button" class="btn" data-action="recv" data-mode="none">Not received</button>' +
      "</div>" +
      '<label class="field" style="margin-top:12px"><span>Quantity received</span><input id="partial-qty" inputmode="numeric" type="number" min="0" max="6" value="' + esc(rec.partialQty) + '" data-field="partial"></label>' +
      '<label class="field"><span>Note (optional)</span><textarea data-field="receipt-note">' + esc(rec.receiptNote) + "</textarea></label>" +
      (rec.receipt.confirmed ? '<p class="ready-box">Recorded: ' + esc(String(rec.receipt.qty)) + " received, confirmed by " + esc(rec.receipt.by) + ".</p>" : '<p class="lock-box">No requester confirmation yet.</p>') +
      "</div>";
  }

  function screenPolicy() {
    const p = state.policy;
    return "<h2>Tolerance and approval policy</h2><p>Price variance auto-accepts only when it is within both caps. Quantity over-billing never auto-accepts. Saved on this browser.</p>" +
      '<label class="field"><span>Price tolerance percent</span><input type="number" min="0" max="100" step="0.1" data-field="pct" value="' + esc(p.pct) + '"></label>' +
      '<label class="field"><span>Price tolerance dollars per line</span><input type="number" min="0" step="1" data-field="dollars" value="' + esc(p.dollars) + '"></label>' +
      '<label class="field"><span>Approver up to $500</span><input type="text" data-field="apName" value="' + esc(p.apName) + '"></label>' +
      '<label class="field"><span>Approver over $500</span><input type="text" data-field="controllerName" value="' + esc(p.controllerName) + '"></label>' +
      '<button type="button" class="btn btn-primary" data-action="apply-policy">Apply policy</button>' +
      "<p>At " + esc(String(p.pct)) + "%, INV-88341 is " + (withinTolerance(DATA.invoices[0]) ? "inside tolerance and can auto-accept." : "outside tolerance (the gap is about 6.5%).") + "</p>" +
      "<p>INV-88342 stays a manual fix even if you raise the percent. Quantity over-billing never auto-accepts.</p>";
  }

  function screenVendor() {
    const row = inv();
    const rec = st();
    return picker() + "<h2>Vendor note draft</h2><p>Edit the note. Mark as sent only updates this demo. No email is sent.</p>" +
      (row.vendorNote ? '<label class="field"><span>Note to ' + esc(row.vendor) + "</span><textarea data-field=\"vendor\">" + esc(rec.vendorNote) + "</textarea></label>" : "<p>No vendor note is needed for this matched bill.</p>") +
      '<button type="button" class="btn btn-primary" data-action="mark-sent"' + (row.vendorNote ? "" : " disabled") + ">Mark as sent (demo)</button>" +
      (rec.vendorSent ? '<p class="ready-box">Marked sent in this demo. No message left this browser.</p>' : "");
  }

  function screenAudit() {
    const row = inv();
    const rec = st();
    const result = ready(row);
    const items = rec.audit.slice().reverse().map((ev) => "<li><strong>" + esc(ev.at) + "</strong> · " + esc(ev.actor) + " · " + esc(ev.text) + "</li>").join("");
    const box = result.ok
      ? '<div class="ready-box"><p><strong>Ready to pay.</strong> Ready to sync to ERP (simulated NetSuite).</p><p>The agent did not pay this bill.</p></div>'
      : '<div class="lock-box"><p><strong>Ready to pay is locked.</strong></p><ul>' + result.reasons.map((r) => "<li>" + esc(r) + "</li>").join("") + "</ul></div>";
    const checks = [
      [lineResolved(row, rec), "Lines matched or fix approved"],
      [!(chosenFix(row, rec) && chosenFix(row, rec).resolves !== false && approverFor(fixAmount(row, chosenFix(row, rec), rec), true).human && rec.approvedBy !== approverFor(fixAmount(row, chosenFix(row, rec), rec), true).name), "Named approver when required"],
      [citationsOk(row, rec), "Explanation cites PO, receipt, and invoice lines"],
      [receiptOk(row, rec), "Goods receipt confirmed, or no goods line"],
      [!duplicateOpen(row, rec), "No open duplicate flag"]
    ];
    return picker() + "<h2>Audit trail</h2><p>" + pill(statusOf(row)) + "</p>" + box +
      "<ul>" + checks.map((c) => '<li class="' + (c[0] ? "check-pass" : "check-fail") + '">' + (c[0] ? "Pass. " : "Not yet. ") + esc(c[1]) + "</li>").join("") + "</ul>" +
      "<ol>" + items + "</ol>";
  }

  function render() {
    const map = { inbox: screenInbox, detail: screenDetail, fix: screenFix, receipt: screenReceipt, policy: screenPolicy, vendor: screenVendor, audit: screenAudit };
    document.getElementById("app").innerHTML = chrome((map[state.screen] || screenInbox)());
  }

  function onClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action !== "reset") state.flash = "";
    if (action === "reset") {
      localStorage.removeItem(KEY);
      state = seed();
      save();
      render();
      return;
    }
    if (action === "screen") { state.screen = btn.dataset.screen; save(); render(); return; }
    if (action === "filter") { state.filter = btn.dataset.id; save(); render(); return; }
    if (action === "open") { state.id = btn.dataset.id; state.screen = "detail"; save(); render(); return; }
    if (action === "send-prompt") {
      const rec = state.invoices["INV-88343"];
      rec.promptSent = true;
      log("INV-88343", DATA.people.ap, "Sent a receipt prompt to Jordan Lee for PO-2215 line 1 and INV-88343 line 1. No message left this browser.");
      state.id = "INV-88343";
      state.screen = "receipt";
      save();
      render();
      return;
    }
    if (action === "pick-fix") {
      const row = inv();
      const rec = st();
      const fix = row.fixes.find((f) => f.id === btn.dataset.id);
      rec.fixId = fix.id;
      rec.rejected = !!fix.reject;
      rec.approvedBy = "";
      rec.approvedAt = "";
      if (fix.clearsDuplicate) rec.duplicateCleared = false;
      const amount = fixAmount(row, fix, rec);
      const who = approverFor(amount, fix.outside || !withinTolerance(row));
      if (fix.resolves !== false && !who.human) {
        rec.approvedBy = "Policy";
        rec.approvedAt = stamp();
      } else if (fix.resolves !== false && who.name === (state.policy.apName || DATA.people.ap) && who.name !== row.requester) {
        rec.approvedBy = who.name;
        rec.approvedAt = stamp();
      }
      if (fix.reject) {
        rec.duplicateCleared = true;
        rec.approvedBy = DATA.people.ap;
      }
      log(row.id, DATA.people.ap, "Chose fix: " + fix.label + ". Sources: " + row.citePo + ", " + row.citeReceipt + ", " + row.citeInvoice + ".");
      if (rec.approvedBy) log(row.id, rec.approvedBy, "Approved the fix. The requester was not the approver.");
      save();
      render();
      return;
    }
    if (action === "approve") {
      const row = inv();
      const rec = st();
      const fix = chosenFix(row, rec);
      if (!fix) { state.flash = "Pick a fix first."; save(); render(); return; }
      const who = approverFor(fixAmount(row, fix, rec), fix.outside || !withinTolerance(row));
      if (who.name === row.requester) { state.flash = "The requester cannot approve this fix."; save(); render(); return; }
      rec.approvedBy = who.name;
      rec.approvedAt = stamp();
      if (fix.clearsDuplicate) rec.duplicateCleared = true;
      log(row.id, who.name, "Approved " + fix.label + " for " + money(fixAmount(row, fix, rec)) + ". Sources: " + row.citePo + ", " + row.citeReceipt + ", " + row.citeInvoice + ".");
      save();
      render();
      return;
    }
    if (action === "recv") {
      const rec = state.invoices["INV-88343"];
      const row = DATA.invoices.find((r) => r.id === "INV-88343");
      const mode = btn.dataset.mode;
      let qty = 0;
      if (mode === "all") qty = 6;
      if (mode === "none") qty = 0;
      if (mode === "some") {
        qty = Number(rec.partialQty);
        if (!qty || qty < 1 || qty > 5) {
          state.flash = "Enter a quantity from 1 to 5 for a partial receipt.";
          save();
          render();
          return;
        }
      }
      if (mode === "none") {
        rec.receipt = { confirmed: false, by: "", qty: 0, note: rec.receiptNote };
        log(row.id, DATA.people.requester, "Confirmed none of the laptops arrived. INV-88343 line 1. PO-2215 line 1. No receipt line logged.");
      } else {
        rec.receipt = { confirmed: true, by: "requester", qty: qty, note: rec.receiptNote };
        log(row.id, DATA.people.requester, "Confirmed " + qty + " of 6 laptops. PO-2215 line 1. INV-88343 line 1.");
        if (qty < 6) {
          rec.fixId = "pay-received";
          rec.approvedBy = "";
          log(row.id, "Agent", "Proposed short-pay to " + money(qty * row.unit) + ". That payment needs " + (state.policy.controllerName || DATA.people.approver) + ".");
        } else {
          rec.fixId = "";
          rec.approvedBy = "Policy";
          log(row.id, "Policy", "Full receipt matches PO-2215 line 1 and INV-88343 line 1.");
        }
      }
      state.id = "INV-88343";
      save();
      render();
      return;
    }
    if (action === "apply-policy") {
      const row = DATA.invoices[0];
      const now = withinTolerance(row);
      if (now && !state.autoLogged) {
        state.autoLogged = true;
        log(row.id, "Policy", "Auto-accepted " + row.id + " because the price gap is now within " + state.policy.pct + "% and " + money(state.policy.dollars) + ". Sources: " + row.citePo + ", " + row.citeReceipt + ", " + row.citeInvoice + ".");
      }
      if (!now) state.autoLogged = false;
      save();
      render();
      return;
    }
    if (action === "mark-sent") {
      const row = inv();
      const rec = st();
      if (!row.vendorNote) return;
      rec.vendorSent = true;
      log(row.id, DATA.people.ap, "Marked the vendor note as sent in this demo. No email was sent. Sources: " + row.citePo + ", " + row.citeReceipt + ", " + row.citeInvoice + ".");
      save();
      render();
    }
  }

  function onChange(e) {
    const t = e.target;
    if (t.dataset.action === "switch") {
      state.id = t.value;
      save();
      render();
      return;
    }
    if (t.dataset.field === "pct" || t.dataset.field === "dollars" || t.dataset.field === "apName" || t.dataset.field === "controllerName") {
      state.policy[t.dataset.field] = t.dataset.field === "apName" || t.dataset.field === "controllerName" ? t.value : Number(t.value);
      save();
    }
  }

  function onInput(e) {
    const t = e.target;
    if (t.dataset.field === "partial") state.invoices["INV-88343"].partialQty = t.value;
    if (t.dataset.field === "receipt-note") state.invoices["INV-88343"].receiptNote = t.value;
    if (t.dataset.field === "vendor") st().vendorNote = t.value;
    if (t.dataset.field === "pct" || t.dataset.field === "dollars") state.policy[t.dataset.field] = Number(t.value);
    if (t.dataset.field === "apName" || t.dataset.field === "controllerName") state.policy[t.dataset.field] = t.value;
    if (t.dataset.field) save();
  }

  document.getElementById("app").addEventListener("click", onClick);
  document.getElementById("app").addEventListener("change", onChange);
  document.getElementById("app").addEventListener("input", onInput);
  render();
})();
