(function () {
  const DATA = window.AZELIS_DATA;
  const KEY = "azelis-principal-update-desk-v1";
  const SCREENS = [
    ["inbox", "Inbox"],
    ["parsed", "Parsed"],
    ["impact", "Impact"],
    ["price", "Price"],
    ["alts", "Alternatives"],
    ["drafts", "Drafts"],
    ["tracker", "Rollout"]
  ];

  function customersFor(notice) {
    return DATA.customers.filter((c) => notice.products.indexOf(c.product) !== -1);
  }

  function blankRuntime(notice) {
    const drafts = {};
    const tracker = {};
    const groups = {};
    customersFor(notice).forEach((c) => {
      groups[c.am] = groups[c.am] || [];
      groups[c.am].push(c);
      drafts["note-" + c.id] = { text: noteText(notice, c), approved: false, sent: false };
      tracker[c.id] = { notified: false, ack: false, erp: false };
    });
    Object.keys(groups).forEach((am) => {
      drafts["alert-" + am] = { text: alertText(notice, am, groups[am]), approved: false, sent: false };
    });
    return { fields: notice.fields.map((f) => Object.assign({}, f)), priceApproved: false, drafts: drafts, tracker: tracker, touched: false };
  }

  function noteText(notice, c) {
    if (c.lock) return c.name + " buys " + c.product + ". The contract price is locked until " + c.lock + ". Exclude this account from the new price and flag it for commercial review.";
    if (notice.kind === "stop") return c.name + " buys " + c.product + ", which will be discontinued. Last orders " + notice.effectiveLabel + ". Suggested grade " + notice.alt.code + ". Customer change control and regulatory review needed before any switch.";
    if (notice.kind === "lead") return c.name + " buys " + c.product + ". Lead time moves from 8 weeks to 14 weeks on " + notice.effectiveLabel + ". No price change. Please warn the buyer about cover stock.";
    const row = priceMath(notice, c);
    return c.name + " buys " + c.product + ". List cost rises " + Math.round((notice.pct[c.product] || 0) * 1000) / 10 + "%. Suggested selling price " + money(row.hold) + " per kg to hold today's margin. Effective " + notice.effectiveLabel + ".";
  }

  function alertText(notice, am, list) {
    const names = list.map((c) => c.name).join(", ");
    return "Sales alert for " + am + ". " + notice.principal + " notice " + notice.id + " is effective " + notice.effectiveLabel + ". Accounts: " + names + ". Do not send a customer note until it is approved.";
  }

  function priceMath(notice, c) {
    const pct = notice.pct[c.product] || 0;
    const newCost = c.cost * (1 + pct);
    const margin = (c.price - c.cost) / c.price;
    const hold = margin < 0.99 ? newCost / (1 - margin) : c.price;
    const target = newCost / (1 - DATA.marginTarget);
    const gp = c.volume * (newCost - c.cost);
    return { newCost: newCost, margin: margin, hold: hold, target: target, gp: gp };
  }

  function seed() {
    const runtime = {};
    DATA.notices.forEach((n) => { runtime[n.id] = blankRuntime(n); });
    return { screen: "inbox", id: "N-301", highlight: -1, flash: "", paste: "", extra: [], runtime: runtime };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seed();
      const saved = JSON.parse(raw);
      const base = seed();
      if (!saved || !saved.runtime) return base;
      base.screen = saved.screen || "inbox";
      base.id = saved.id || "N-301";
      base.paste = saved.paste || "";
      base.extra = saved.extra || [];
      Object.keys(base.runtime).forEach((id) => {
        if (saved.runtime[id]) base.runtime[id] = Object.assign(base.runtime[id], saved.runtime[id]);
      });
      (saved.extra || []).forEach((n) => { if (!base.runtime[n.id]) base.runtime[n.id] = blankRuntime(n); });
      base.flash = "";
      return base;
    } catch (err) {
      return seed();
    }
  }

  let state = load();
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const allNotices = () => DATA.notices.concat(state.extra);
  const notice = () => allNotices().find((n) => n.id === state.id) || DATA.notices[0];
  const rt = () => state.runtime[notice().id];

  function money(n) {
    return "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function daysUntil(iso) {
    const target = new Date(iso + "T00:00:00");
    const today = new Date(DATA.today + "T00:00:00");
    return Math.round((target - today) / 86400000);
  }

  function fieldsOk(n) {
    const pack = state.runtime[n.id];
    if (!pack) return false;
    return pack.fields.every((f) => {
      const line = n.lines[f.line] || "";
      if (f.line == null || f.line < 0) return false;
      if (!String(f.value || "").trim()) return false;
      if (line.toLowerCase().indexOf(String(f.token).toLowerCase()) === -1) return false;
      if (f.id === "date") {
        return String(f.value).toLowerCase().indexOf(String(f.token).toLowerCase()) !== -1;
      }
      return true;
    });
  }

  function noteReady(n, c) {
    const pack = state.runtime[n.id];
    const draft = pack.drafts["note-" + c.id];
    const alert = pack.drafts["alert-" + c.am];
    const reasons = [];
    if (!fieldsOk(n)) reasons.push("Product codes and the effective date must match the notice, and each field must cite its line.");
    if (c.lock && draft.text.toLowerCase().indexOf("commercial review") === -1) reasons.push("This contract-locked price must be excluded or flagged for commercial review.");
    if (n.kind === "stop" && c.segment === "Pharma" && draft.text.toLowerCase().indexOf("change control") === -1) reasons.push("A pharma alternative needs a customer change control and regulatory review note.");
    if (!pack.priceApproved) reasons.push("The product manager has not approved the price math.");
    if (!alert || !alert.approved) reasons.push("The sales alert for " + c.am + " is not approved.");
    if (!draft.approved) reasons.push("This customer note is not approved.");
    return { ok: reasons.length === 0, reasons: reasons, draft: draft };
  }

  function statusOf(n) {
    const list = customersFor(n);
    if (!list.length) return "New";
    const sent = list.every((c) => state.runtime[n.id].drafts["note-" + c.id].sent);
    if (sent) return "Rolled out";
    if (list.some((c) => noteReady(n, c).ok)) return "Ready";
    if (state.runtime[n.id].touched) return "In review";
    return "New";
  }

  function footer() {
    return '<footer class="site-footer"><p><a href="https://amiteshdwivedijhu-ship-it.github.io/" target="_blank" rel="noopener noreferrer">Prototype by Amitesh Dwivedi</a></p>' +
      "<p>Prototype for interview practice. Not affiliated with Azelis. Not an Azelis product. Synthetic suppliers, products, customers, and prices only.</p></footer>";
  }

  function chrome(body) {
    const nav = SCREENS.map(([id, label]) => '<button type="button" class="nav-btn" data-action="screen" data-screen="' + id + '"' + (state.screen === id ? ' aria-current="page"' : "") + ">" + label + "</button>").join("");
    return '<header class="topbar"><div class="brand"><h1>Principal Update Desk</h1><p>Sample book</p></div>' +
      '<button type="button" class="btn" data-action="reset">Reset demo</button></header><div class="wrap">' +
      '<div class="banner" role="note"><p><strong>Sample data.</strong> Suppliers, products, customers, and prices are synthetic. The parser is a demo rule, not a live model. Nothing is emailed.</p></div>' +
      '<nav class="screen-nav" aria-label="Screens">' + nav + "</nav>" +
      (state.flash ? '<p class="lock-box" role="status">' + esc(state.flash) + "</p>" : "") +
      body + footer() + "</div>";
  }

  function picker() {
    const opts = allNotices().map((n) => '<option value="' + n.id + '"' + (n.id === state.id ? " selected" : "") + ">" + n.id + " " + esc(n.principal) + "</option>").join("");
    return '<label class="field"><span>Notice</span><select data-action="switch">' + opts + "</select></label>";
  }

  function screenInbox() {
    const cards = allNotices().map((n) => '<button type="button" class="inv-btn" data-action="open" data-id="' + n.id + '"><strong>' + n.id + " · " + esc(n.principal) + "</strong><br><span class=\"pill\">" + esc(statusOf(n)) + "</span> <span class=\"label\">" + esc(n.effectiveLabel) + "</span></button>").join("");
    return "<h2>Notice inbox</h2>" + cards +
      '<article class="card"><h3>Paste a notice</h3><p>Demo parser. It looks for a line like: Effective April 1, 2027, list price for VX-MCC 102 increases 3.0%.</p>' +
      '<label class="field"><span>Notice text</span><textarea data-field="paste">' + esc(state.paste) + "</textarea></label>" +
      '<div class="btn-row"><button type="button" class="btn btn-primary" data-action="parse">Parse notice</button>' +
      '<button type="button" class="btn" data-action="sample-paste">Insert sample</button></div></article>';
  }

  function screenParsed() {
    const n = notice();
    const pack = rt();
    const lines = n.lines.map((line, i) => '<p class="line' + (state.highlight === i ? " on" : "") + '" id="line-' + i + '"><strong>Line ' + (i + 1) + ".</strong> " + esc(line) + "</p>").join("");
    const fields = pack.fields.map((f) => {
      return '<article class="card"><label class="field"><span>' + esc(f.label) + "</span><input data-field-id=\"" + f.id + "\" value=\"" + esc(f.value) + "\"></label>" +
        '<button type="button" class="chip" data-action="cite" data-line="' + f.line + '" aria-pressed="' + (state.highlight === f.line ? "true" : "false") + '">Cites line ' + (f.line + 1) + "</button></article>";
    }).join("");
    return picker() + "<h2>Parsed update</h2><p>Tap a citation to highlight the source line. Correct a field if the demo parser missed it.</p>" +
      '<article class="card"><h3>Notice</h3>' + lines + "</article>" + fields;
  }

  function impactCards(n) {
    const list = customersFor(n);
    let gp = 0;
    const cards = list.map((c) => {
      const row = n.kind === "price" ? priceMath(n, c) : null;
      if (row) gp += row.gp;
      const currentGp = (c.price - c.cost) * c.volume;
      return '<article class="card"><h3>' + esc(c.name) + "</h3><p>" + esc(c.segment) + " · " + esc(c.product) + "</p>" +
        "<p>12-month volume " + c.volume.toLocaleString("en-US") + " kg. Current price " + money(c.price) + "/kg.</p>" +
        "<p>Contract lock: " + (c.lock ? esc(c.lock) : "No") + ".</p>" +
        "<p>Account manager: " + esc(c.am) + ".</p>" +
        (row ? "<p>GP at risk if the price stays put: " + money(row.gp) + ".</p>" : "<p>GP on this grade today: " + money(currentGp) + ".</p>") +
        (c.lock ? '<p class="bad">Flagged for commercial review. Do not reprice.</p>' : "") +
        "</article>";
    }).join("");
    return { cards: cards, gp: gp, count: list.length };
  }

  function screenImpact() {
    const n = notice();
    const block = impactCards(n);
    const table = customersFor(n).map((c) => {
      const row = n.kind === "price" ? priceMath(n, c) : null;
      return "<tr><td>" + esc(c.name) + "</td><td>" + esc(c.product) + "</td><td>" + c.volume.toLocaleString("en-US") + "</td><td>" + (c.lock ? "Yes, until " + esc(c.lock) : "No") + "</td><td>" + esc(c.am) + "</td><td>" + (row ? money(row.gp) : "n/a") + "</td></tr>";
    }).join("");
    return picker() + "<h2>Impact map</h2><p>" + block.count + " customers. " + (n.kind === "price" ? "Total GP at risk if prices stay put: " + money(block.gp) + "." : "No list-price change on this notice.") + "</p>" +
      '<div class="wide-table table-wrap"><table><thead><tr><th>Customer</th><th>Product</th><th>12-mo kg</th><th>Contract lock</th><th>Account manager</th><th>GP at risk</th></tr></thead><tbody>' + table + "</tbody></table></div>" +
      '<div class="phone-cards">' + block.cards + "</div>";
  }

  function screenPrice() {
    const n = notice();
    const pack = rt();
    if (n.kind !== "price") {
      return picker() + "<h2>Price calculator</h2><p>No selling price change on this notice. Confirm that the price math is unchanged.</p>" +
        (pack.priceApproved ? '<p class="ready-box">Price math approved by the product manager.</p>' : "") +
        '<button type="button" class="btn btn-primary" data-action="approve-price">Approve price math</button>';
    }
    const rows = customersFor(n).map((c) => {
      const row = priceMath(n, c);
      return '<article class="card"><h3>' + esc(c.name) + "</h3><p>" + esc(c.product) + ". New cost " + money(row.newCost) + "/kg. Today " + money(c.price) + "/kg. Today's margin " + Math.round(row.margin * 1000) / 10 + "%.</p>" +
        "<p>Hold today's margin: <strong>" + money(row.hold) + "</strong> per kg. Hold the 21% target: <strong>" + money(row.target) + "</strong> per kg.</p>" +
        (c.lock ? '<p class="bad">Contract locked until ' + esc(c.lock) + ". Flagged for commercial review, not repriced.</p>" : "<p>Open quote can move to the suggested price after approval.</p>") +
        "</article>";
    }).join("");
    return picker() + "<h2>Price calculator</h2><p>Target gross margin for pharma excipients in this sample is 21%.</p>" + rows +
      (pack.priceApproved ? '<p class="ready-box">Price math approved by the product manager.</p>' : '<p class="lock-box">Price math is not approved yet.</p>') +
      '<button type="button" class="btn btn-primary" data-action="approve-price">Approve price math</button>';
  }

  function screenAlts() {
    const n = notice();
    if (n.kind !== "stop") return picker() + "<h2>Alternatives</h2><p>No alternative needed. This is not a discontinuation.</p>";
    const pharma = customersFor(n).filter((c) => c.segment === "Pharma").map((c) => "<li>" + esc(c.name) + ": customer change control and regulatory review needed.</li>").join("");
    return picker() + "<h2>Alternatives</h2><article class=\"card\"><h3>" + esc(n.alt.code) + "</h3><p>" + esc(n.alt.note) + "</p><p class=\"bad\">Pharma customers need a change control and regulatory review before a switch.</p><ul>" + pharma + "</ul></article>";
  }

  function screenDrafts() {
    const n = notice();
    const pack = rt();
    const blocks = Object.keys(pack.drafts).map((key) => {
      const draft = pack.drafts[key];
      const isNote = key.indexOf("note-") === 0;
      let extra = "";
      if (isNote) {
        const c = DATA.customers.find((row) => row.id === key.slice(5));
        const ready = noteReady(n, c);
        extra = ready.ok ? '<p class="good">Ready.</p>' : '<div class="lock-box"><p>Ready is locked.</p><ul>' + ready.reasons.map((r) => "<li>" + esc(r) + "</li>").join("") + "</ul></div>";
        extra += '<button type="button" class="btn" data-action="send" data-id="' + key + '"' + (ready.ok && !draft.sent ? "" : " disabled") + ">Mark as sent (demo)</button>";
      }
      return '<article class="card"><h3>' + esc(key.indexOf("alert-") === 0 ? "Sales alert, " + key.slice(6) : "Customer note") + "</h3>" +
        '<label class="field"><span>Draft</span><textarea data-draft="' + key + '">' + esc(draft.text) + "</textarea></label>" +
        '<button type="button" class="btn btn-primary" data-action="approve-draft" data-id="' + key + '">' + (draft.approved ? "Approved" : "Approve") + "</button>" +
        (draft.sent ? '<p class="ready-box">Marked sent in this demo. No email was sent.</p>' : "") + extra + "</article>";
    }).join("");
    return picker() + "<h2>Drafts</h2><p>Edit the words. Approve each one. Mark as sent does not email anyone.</p>" + blocks;
  }

  function screenTracker() {
    const n = notice();
    const pack = rt();
    const days = daysUntil(n.effective);
    const rows = customersFor(n).map((c) => {
      const t = pack.tracker[c.id];
      const overdue = days < 45 && !t.notified;
      return '<article class="card' + (overdue ? " lock-box" : "") + '"><h3>' + esc(c.name) + "</h3>" +
        "<p>Notified: " + (t.notified ? "Yes" : "No") + ". Acknowledged: " + (t.ack ? "Yes" : "No") + ". Price updated in ERP (simulated D365): " + (t.erp ? "Yes" : "No") + ".</p>" +
        "<p>" + days + " days to " + esc(n.effectiveLabel) + ".</p>" +
        (overdue ? '<p class="bad">Overdue. Not sent, and the effective date is inside 45 days.</p>' : "") +
        '<div class="btn-row"><button type="button" class="btn" data-action="ack" data-id="' + c.id + '">Mark acknowledged</button>' +
        '<button type="button" class="btn" data-action="erp" data-id="' + c.id + '">Mark ERP updated</button></div></article>';
    }).join("");
    return picker() + "<h2>Rollout tracker</h2><p>Demo date is October 7, 2026. " + days + " days to the effective date.</p>" + rows;
  }

  function render() {
    const map = { inbox: screenInbox, parsed: screenParsed, impact: screenImpact, price: screenPrice, alts: screenAlts, drafts: screenDrafts, tracker: screenTracker };
    document.getElementById("app").innerHTML = chrome((map[state.screen] || screenInbox)());
  }

  function isoFromLabel(label) {
    const d = new Date(label);
    if (isNaN(d.getTime())) return "2027-04-01";
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function parsePaste(text) {
    const lines = text.split(/\n/).map((s) => s.trim()).filter(Boolean);
    const flat = lines.join(" ");
    const date = (flat.match(/Effective ([A-Z][a-z]+ \d{1,2}, \d{4})/) || [])[1] || "";
    const code = (flat.match(/[A-Z]{2,}-[A-Z0-9]+(?: \d+)?(?: [A-Za-z]+)*(?: USP)?/) || [])[0] || "";
    const pct = (flat.match(/increases ([0-9.]+)%/) || [])[1];
    if (!date || !code) return null;
    const id = "N-" + (304 + state.extra.length);
    const products = DATA.customers.some((c) => c.product === code) ? [code] : [];
    const notice = {
      id: id,
      principal: lines[0] && lines[0].indexOf("Effective") === -1 ? lines[0].replace(/ notice.*/, "") : "Pasted principal",
      kind: "price",
      products: products,
      pct: {},
      effective: isoFromLabel(date),
      effectiveLabel: date,
      lines: lines,
      fields: [
        { id: "date", label: "Effective date", value: date, line: Math.max(0, lines.findIndex((l) => l.indexOf(date) !== -1)), token: date },
        { id: "code", label: "Product code", value: code, line: Math.max(0, lines.findIndex((l) => l.indexOf(code) !== -1)), token: code },
        { id: "type", label: "Change type", value: pct ? "Price increase " + pct + "%" : "Update", line: Math.max(0, lines.findIndex((l) => l.indexOf("increases") !== -1)), token: pct ? pct + "%" : (lines[0] || "Update") }
      ]
    };
    if (pct) notice.pct[code] = Number(pct) / 100;
    notice.fields.forEach((f) => { if (f.line < 0) f.line = 0; });
    return notice;
  }

  function onClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action !== "reset") state.flash = "";
    if (action === "reset") { localStorage.removeItem(KEY); state = seed(); save(); render(); return; }
    if (action === "screen") { state.screen = btn.dataset.screen; save(); render(); return; }
    if (action === "open") {
      state.id = btn.dataset.id;
      state.runtime[state.id].touched = true;
      state.screen = "parsed";
      state.highlight = -1;
      save(); render(); return;
    }
    if (action === "cite") {
      state.highlight = Number(btn.dataset.line);
      state.screen = "parsed";
      save(); render();
      const el = document.getElementById("line-" + state.highlight);
      if (el) el.scrollIntoView({ block: "center" });
      return;
    }
    if (action === "sample-paste") {
      state.paste = "Pasted principal\nEffective April 1, 2027, list price for VX-MCC 102 increases 3.0%.";
      save(); render(); return;
    }
    if (action === "parse") {
      const parsed = parsePaste(state.paste);
      if (!parsed) { state.flash = "This demo parser needs an Effective date and a product code, plus increases N% for a price change."; save(); render(); return; }
      state.extra.push(parsed);
      state.runtime[parsed.id] = blankRuntime(parsed);
      state.id = parsed.id;
      state.screen = "parsed";
      save(); render(); return;
    }
    if (action === "approve-price") { rt().priceApproved = true; save(); render(); return; }
    if (action === "approve-draft") {
      const draft = rt().drafts[btn.dataset.id];
      draft.approved = true;
      save(); render(); return;
    }
    if (action === "send") {
      const n = notice();
      const key = btn.dataset.id;
      const c = DATA.customers.find((row) => row.id === key.slice(5));
      const ready = noteReady(n, c);
      if (!ready.ok) { state.flash = ready.reasons[0]; save(); render(); return; }
      rt().drafts[key].sent = true;
      rt().tracker[c.id].notified = true;
      state.flash = "Marked sent in this demo. No email was sent.";
      save(); render(); return;
    }
    if (action === "ack") { rt().tracker[btn.dataset.id].ack = true; save(); render(); return; }
    if (action === "erp") { rt().tracker[btn.dataset.id].erp = true; save(); render(); return; }
  }

  function onChange(e) {
    const t = e.target;
    if (t.dataset.action === "switch") {
      state.id = t.value;
      state.runtime[state.id].touched = true;
      save(); render();
    }
  }

  function onInput(e) {
    const t = e.target;
    if (t.dataset.field === "paste") { state.paste = t.value; save(); return; }
    if (t.dataset.fieldId) {
      const field = rt().fields.find((f) => f.id === t.dataset.fieldId);
      if (field) field.value = t.value;
      save();
      return;
    }
    if (t.dataset.draft) {
      rt().drafts[t.dataset.draft].text = t.value;
      if (rt().drafts[t.dataset.draft].approved) rt().drafts[t.dataset.draft].approved = false;
      save();
    }
  }

  document.getElementById("app").addEventListener("click", onClick);
  document.getElementById("app").addEventListener("change", onChange);
  document.getElementById("app").addEventListener("input", onInput);
  render();
})();
