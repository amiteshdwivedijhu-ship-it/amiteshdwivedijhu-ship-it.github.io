(function () {
  const DATA = window.CARD_DATA;
  const KEY = "nerdwallet-card-fit-landing-v1";
  const SCREENS = [
    ["ad", "Ad"],
    ["questions", "Questions"],
    ["results", "Results"],
    ["compare", "Compare"],
    ["apply", "Apply"],
    ["pm", "PM setup"],
    ["ab", "A/B readout"]
  ];

  function seed() {
    return {
      screen: "ad",
      keyword: "travel",
      channel: "search",
      variant: "B",
      questionCount: 3,
      headlineMatch: true,
      rankMode: "net",
      answers: Object.assign({}, DATA.keywords.travel.defaults),
      compare: [],
      clicks: [],
      showBad: false,
      decision: "",
      flash: ""
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seed();
      const saved = JSON.parse(raw);
      const base = seed();
      if (!saved) return base;
      Object.keys(base).forEach((k) => { if (saved[k] !== undefined) base[k] = saved[k]; });
      base.answers = Object.assign({}, DATA.keywords[base.keyword].defaults, saved.answers || {});
      base.flash = "";
      return base;
    } catch (err) {
      return seed();
    }
  }

  let state = load();
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function money(n) {
    const num = Math.round(Number(n) || 0);
    return (num < 0 ? "-" : "") + "$" + Math.abs(num).toLocaleString("en-US");
  }

  function totalMonth(a) {
    return ["groceries", "dining", "travel", "other"].reduce((s, k) => s + (Number(a[k]) || 0), 0);
  }

  function mathFor(card, a) {
    const g = Number(a.groceries) || 0;
    const d = Number(a.dining) || 0;
    const t = Number(a.travel) || 0;
    const o = Number(a.other) || 0;
    const month = g + d + t + o;
    const year = month * 12;
    if (card.id === "atlas") {
      const net = Math.round(year * 0.015);
      return { net: net, line: money(month) + " a month x 12 x 1.5% = " + money(net) + ". Fee $0. Net " + money(net) + ". Miles at 1 cent." };
    }
    if (card.id === "summit") {
      const rewards = Math.round(t * 12 * 0.03 + d * 12 * 0.03 + (g + o) * 12 * 0.01);
      const net = rewards - 95;
      return { net: net, line: "Travel " + money(Math.round(t * 12 * 0.03)) + " + dining " + money(Math.round(d * 12 * 0.03)) + " + other " + money(Math.round((g + o) * 12 * 0.01)) + " = " + money(rewards) + ". Minus $95 fee. Net " + money(net) + "." };
    }
    if (card.id === "harbor") {
      const gSpend = g * 12;
      const bonus = Math.min(gSpend, 6000);
      const rewards = Math.round(bonus * 0.03 + (year - gSpend) * 0.01);
      return { net: rewards, line: "3% on " + money(Math.round(bonus)) + " groceries + 1% on the rest = " + money(rewards) + ". Fee $0." };
    }
    if (card.id === "pine") {
      const net = Math.round(year * 0.02);
      return { net: net, line: money(month) + " a month x 12 x 2% = " + money(net) + ". Fee $0." };
    }
    if (card.id === "brook") {
      if (a.balance !== "yes") return { net: 0, line: "You said you do not carry a balance, so the sample value is $0. Fee $0." };
      return { net: 510, line: "Sample: transfer $3,000, save about $600 interest, pay a 3% fee ($90). Net $510. Fee $0." };
    }
    const net = Math.round(year * 0.01);
    return { net: net, line: money(month) + " a month x 12 x 1% = " + money(net) + ". Fee $0. Deposit $200 is not in the net." };
  }

  function scored(list, mode) {
    const rows = list.map((card) => Object.assign({ card: card }, mathFor(card, state.answers)));
    rows.sort((a, b) => b.net - a.net || a.card.name.localeCompare(b.card.name));
    if (mode !== "tiebreak" || !rows.length) return rows;
    const best = rows[0].net;
    const inBand = (row) => best <= 0 ? row.net === best : row.net >= best * 0.9;
    const top = rows.filter(inBand).sort((a, b) => b.card.payout - a.card.payout || b.net - a.net);
    const rest = rows.filter((row) => !inBand(row));
    return top.concat(rest);
  }

  function keyword() { return DATA.keywords[state.keyword]; }

  function headline() {
    if (state.variant === "A" || !state.headlineMatch) return "Best credit cards";
    return state.channel === "social" ? keyword().social : keyword().headline;
  }

  function creditFits(card) {
    const stated = card.credit.toLowerCase();
    if (state.answers.credit === "limited") return stated.indexOf("limited") !== -1;
    if (stated.indexOf("limited") !== -1) return false;
    return true;
  }

  function footer() {
    return '<footer class="site-footer"><p><a href="https://amiteshdwivedijhu-ship-it.github.io/" target="_blank" rel="noopener noreferrer">Prototype by Amitesh Dwivedi</a></p>' +
      "<p>Prototype for interview practice. Not affiliated with NerdWallet. Not a NerdWallet product. All cards, issuers, payouts, and results are synthetic. Not financial advice.</p></footer>";
  }

  function chrome(body) {
    const nav = SCREENS.map(([id, label]) => '<button type="button" class="nav-btn" data-action="screen" data-screen="' + id + '"' + (state.screen === id ? ' aria-current="page"' : "") + ">" + label + "</button>").join("");
    return '<header class="topbar"><div class="brand"><h1>Card Fit Landing</h1><p>Sample shopper page</p></div>' +
      '<button type="button" class="btn" data-action="reset">Reset demo</button></header><div class="wrap">' +
      '<div class="banner" role="note"><p><strong>Sample data.</strong> Cards, issuers, payouts, and traffic are synthetic. This is not financial advice. No credit pull and no issuer site.</p></div>' +
      '<nav class="screen-nav" aria-label="Screens">' + nav + "</nav>" +
      (state.flash ? '<p class="lock-box" role="status">' + esc(state.flash) + "</p>" : "") +
      body + footer() + "</div>";
  }

  function screenAd() {
    const keys = Object.keys(DATA.keywords).map((id) => {
      return '<button type="button" class="choice" data-action="keyword" data-id="' + id + '" aria-pressed="' + (state.keyword === id ? "true" : "false") + '">' + esc(DATA.keywords[id].label) + "</button>";
    }).join("");
    return "<h2>Ad entry</h2><p>Pick the keyword and the channel. This shows which landing variant loads.</p>" +
      '<div class="choice-row" role="group" aria-label="Keyword">' + keys + "</div>" +
      '<div class="choice-row" role="group" aria-label="Channel">' +
      '<button type="button" class="choice" data-action="channel" data-id="search" aria-pressed="' + (state.channel === "search" ? "true" : "false") + '">Search</button>' +
      '<button type="button" class="choice" data-action="channel" data-id="social" aria-pressed="' + (state.channel === "social" ? "true" : "false") + '">Social</button></div>' +
      '<article class="card"><p>Loads <strong>variant ' + esc(state.variant) + "</strong>.</p><p>Headline: " + esc(headline()) + "</p><p>Questions on this variant: " + (state.variant === "A" ? "none. It is a generic list." : state.questionCount) + ".</p></article>" +
      '<button type="button" class="btn btn-primary" data-action="screen" data-screen="' + (state.variant === "A" ? "results" : "questions") + '">Open the landing page</button>';
  }

  function screenQuestions() {
    const a = state.answers;
    const spend = ["groceries", "dining", "travel", "other"].map((key) => {
      return '<label class="field"><span>' + key[0].toUpperCase() + key.slice(1) + ' per month</span><input type="number" min="0" step="10" data-field="' + key + '" value="' + esc(a[key]) + '"></label>';
    }).join("");
    let extra = "";
    if (state.questionCount >= 2) {
      extra += '<div class="choice-row" role="group" aria-label="Carry a balance">' +
        '<button type="button" class="choice" data-action="balance" data-id="no" aria-pressed="' + (a.balance === "no" ? "true" : "false") + '">No balance</button>' +
        '<button type="button" class="choice" data-action="balance" data-id="yes" aria-pressed="' + (a.balance === "yes" ? "true" : "false") + '">Carry a balance</button></div>';
    }
    if (state.questionCount >= 3) {
      extra += '<label class="field"><span>Stated credit range</span><select data-field="credit">' +
        ["good", "excellent", "limited"].map((c) => '<option value="' + c + '"' + (a.credit === c ? " selected" : "") + ">" + (c === "good" ? "Good" : c === "excellent" ? "Excellent" : "Limited or fair") + "</option>").join("") +
        "</select></label>" +
        '<label class="field"><span>Trips per year</span><input type="number" min="0" max="40" data-field="trips" value="' + esc(a.trips) + '"></label>';
    }
    return "<h2>" + esc(headline()) + "</h2><p>Question 1 of " + state.questionCount + ". Monthly spend by category. Total " + money(totalMonth(a)) + " a month.</p>" +
      '<div class="spend">' + spend + "</div>" + extra +
      '<button type="button" class="btn btn-primary" data-action="screen" data-screen="results">See ranked cards</button>';
  }

  function cardBlock(row, rank) {
    const card = row.card;
    const fitNote = creditFits(card) ? "" : " Issuer range: " + card.credit + ". Your stated range does not match.";
    const picked = state.compare.indexOf(card.id) !== -1;
    return '<article class="card"><p class="label">Rank ' + rank + "</p><h3>" + esc(card.name) + "</h3><p class=\"net\">" + money(row.net) + " net / year</p>" +
      "<p>Annual fee " + money(card.fee) + ". " + esc(card.rewards) + ".</p>" +
      "<p><strong>Math.</strong> " + esc(row.line) + "</p>" +
      "<p><strong>Why this fits.</strong> " + esc(card.why[0]) + " " + esc(card.why[1]) + (state.answers.trips ? " You said " + esc(String(state.answers.trips)) + " trips a year." : "") + "</p>" +
      '<p class="poor">When this is a poor fit. ' + esc(card.poor) + esc(fitNote) + "</p>" +
      "<p>Issuer states: " + esc(card.credit) + ". Sample payout " + money(card.payout) + " per approval. Best for: " + esc(card.best) + ".</p>" +
      '<div class="btn-row"><button type="button" class="btn" data-action="compare-toggle" data-id="' + card.id + '">' + (picked ? "Remove from compare" : "Add to compare") + "</button>" +
      '<button type="button" class="btn btn-primary" data-action="click-out" data-id="' + card.id + '">Apply</button></div></article>';
  }

  function ruleNote(rows) {
    if (!rows.length) return "";
    const best = Math.max.apply(null, rows.map((r) => r.net));
    const leader = rows[0];
    const moved = state.rankMode === "tiebreak" && leader.net !== best;
    const blocked = rows.filter((r) => r.card.payout > leader.card.payout && (best <= 0 ? r.net !== best : r.net < best * 0.9));
    let text = "Top slot rule: a card can lead only if its net value is within 10% of the best net value in this list (" + money(best) + "). ";
    if (moved) text += leader.card.name + " leads on payout because it is inside that band.";
    else text += "Partner payout did not change the leader.";
    if (blocked.length) text += " " + blocked[0].card.name + " pays more (" + money(blocked[0].card.payout) + ") but sits outside the 10% band, so payout cannot move it up.";
    return "<p>" + esc(text) + "</p>";
  }

  function screenResults() {
    const kw = keyword();
    const matchCards = DATA.cards.filter((c) => kw.match.indexOf(c.id) !== -1);
    const matchRows = scored(matchCards, state.rankMode);
    const allRows = scored(DATA.cards, state.rankMode);
    return "<h2>" + esc(headline()) + "</h2><p>" + esc(DATA.assumption) + " Total spend " + money(totalMonth(state.answers)) + " a month.</p>" +
      '<div class="disclosure" role="note"><strong>Advertiser disclosure.</strong> We may be paid if you apply. We rank by estimated value to you, not by what we are paid.</div>' +
      "<h2>For this search</h2>" + ruleNote(matchRows) +
      matchRows.map((row, i) => cardBlock(row, i + 1)).join("") +
      "<h2>All cards by value</h2>" + ruleNote(allRows) +
      allRows.map((row, i) => cardBlock(row, i + 1)).join("");
  }

  function screenCompare() {
    const chosen = state.compare.map((id) => DATA.cards.find((c) => c.id === id)).filter(Boolean);
    if (chosen.length < 2) return "<h2>Compare</h2><p>Add 2 cards from the results. You have " + chosen.length + " selected.</p>";
    const blocks = chosen.map((card) => {
      const row = mathFor(card, state.answers);
      return '<article class="card"><h3>' + esc(card.name) + '</h3><p class="net">' + money(row.net) + "</p><p>Fee " + money(card.fee) + "</p><p>" + esc(card.rewards) + "</p><p>" + esc(row.line) + "</p><p class=\"poor\">" + esc(card.poor) + "</p><p>Issuer states: " + esc(card.credit) + "</p></article>";
    }).join("");
    const table = '<div class="table-wrap"><table><thead><tr><th>Item</th>' + chosen.map((c) => "<th>" + esc(c.name) + "</th>").join("") + "</tr></thead><tbody>" +
      "<tr><td>Net value</td>" + chosen.map((c) => "<td>" + money(mathFor(c, state.answers).net) + "</td>").join("") + "</tr>" +
      "<tr><td>Annual fee</td>" + chosen.map((c) => "<td>" + money(c.fee) + "</td>").join("") + "</tr>" +
      "<tr><td>Payout (sample)</td>" + chosen.map((c) => "<td>" + money(c.payout) + "</td>").join("") + "</tr>" +
      "<tr><td>Issuer range</td>" + chosen.map((c) => "<td>" + esc(c.credit) + "</td>").join("") + "</tr></tbody></table></div>";
    return "<h2>Compare</h2>" + table + '<div class="compare">' + blocks + "</div>";
  }

  function screenApply() {
    const list = state.clicks.map((c) => "<li>" + esc(c) + "</li>").join("");
    return "<h2>Apply click</h2><p>You are leaving to the issuer site (demo, nothing happens).</p>" +
      (list ? "<ul>" + list + "</ul>" : "<p>No clicks yet. Use Apply on a card.</p>");
  }

  function screenPm() {
    return "<h2>PM variant setup</h2><p>Variant A is a generic best-cards list. Variant B matches the ad and asks questions.</p>" +
      '<div class="choice-row">' +
      '<button type="button" class="choice" data-action="variant" data-id="A" aria-pressed="' + (state.variant === "A" ? "true" : "false") + '">Variant A</button>' +
      '<button type="button" class="choice" data-action="variant" data-id="B" aria-pressed="' + (state.variant === "B" ? "true" : "false") + '">Variant B</button></div>' +
      '<div class="choice-row">' +
      '<button type="button" class="choice" data-action="qcount" data-id="2" aria-pressed="' + (state.questionCount === 2 ? "true" : "false") + '">2 questions</button>' +
      '<button type="button" class="choice" data-action="qcount" data-id="3" aria-pressed="' + (state.questionCount === 3 ? "true" : "false") + '">3 questions</button></div>' +
      '<div class="choice-row">' +
      '<button type="button" class="choice" data-action="headline" data-id="on" aria-pressed="' + (state.headlineMatch ? "true" : "false") + '">Headline match on</button>' +
      '<button type="button" class="choice" data-action="headline" data-id="off" aria-pressed="' + (!state.headlineMatch ? "true" : "false") + '">Headline match off</button></div>' +
      '<div class="choice-row">' +
      '<button type="button" class="choice" data-action="rank" data-id="net" aria-pressed="' + (state.rankMode === "net" ? "true" : "false") + '">Rank by net value</button>' +
      '<button type="button" class="choice" data-action="rank" data-id="tiebreak" aria-pressed="' + (state.rankMode === "tiebreak" ? "true" : "false") + '">Net value, payout breaks ties</button></div>' +
      '<button type="button" class="choice" disabled>Rank by payout only</button>' +
      '<p class="lock-box">Blocked. Partner payout can only break ties inside the 10% net value band. It cannot set the order by itself.</p>';
  }

  function metrics(row) {
    const cpa = row.cost / row.approve;
    const roas = row.rev / row.cost;
    return { cpa: cpa, roas: roas };
  }

  function guardrail(row) {
    const base = DATA.ab.A;
    const reasons = [];
    if (row.bounce > base.bounce) reasons.push("Bounce is " + Math.round(row.bounce * 100) + "%, worse than variant A at " + Math.round(base.bounce * 100) + "%.");
    if (row.complaint > base.complaint) reasons.push("Complaint rate is " + (row.complaint * 100).toFixed(1) + "%, worse than variant A at " + (base.complaint * 100).toFixed(1) + "%.");
    return reasons;
  }

  function metricTable(row) {
    const m = metrics(row);
    return "<ul><li>Sessions: " + row.sessions.toLocaleString("en-US") + "</li>" +
      "<li>Click-out: " + (row.click * 100).toFixed(1) + "%</li>" +
      "<li>Approvals: " + (row.approve * 100).toFixed(1) + "%</li>" +
      "<li>Revenue per session: " + money(row.rev) + "</li>" +
      "<li>Cost per session: " + money(row.cost) + "</li>" +
      "<li>CPA: " + money(Math.round(m.cpa)) + "</li>" +
      "<li>ROAS: " + m.roas.toFixed(2) + "</li>" +
      "<li>Bounce: " + Math.round(row.bounce * 100) + "%</li>" +
      "<li>Complaint rate: " + (row.complaint * 100).toFixed(1) + "%</li></ul>";
  }

  function screenAb() {
    const challenger = state.showBad ? DATA.ab.bad : DATA.ab.B;
    const reasons = guardrail(challenger);
    const box = reasons.length
      ? '<div class="lock-box"><p><strong>Ship is blocked.</strong> ROAS can be higher and still fail.</p><ul>' + reasons.map((r) => "<li>" + esc(r) + "</li>").join("") + "</ul></div>"
      : '<div class="ready-box"><p>Guardrails pass. Bounce is down or flat, and the complaint rate is not worse.</p></div>';
    return "<h2>A/B readout</h2><p>Synthetic 14 day test. Variant A is the baseline.</p>" +
      '<article class="card"><h3>' + esc(DATA.ab.A.name) + "</h3>" + metricTable(DATA.ab.A) + "</article>" +
      '<article class="card"><h3>' + esc(challenger.name) + "</h3>" + metricTable(challenger) + "</article>" +
      box +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-primary" data-action="ship"' + (reasons.length ? " disabled" : "") + ">Ship</button>" +
      '<button type="button" class="btn" data-action="iterate">Iterate</button>' +
      '<button type="button" class="btn" data-action="stop">Stop</button>' +
      '<button type="button" class="choice" data-action="bad" aria-pressed="' + (state.showBad ? "true" : "false") + '">' + (state.showBad ? "Showing bad variant" : "Show bad variant") + "</button></div>" +
      (state.decision ? '<p class="ready-box">' + esc(state.decision) + "</p>" : "");
  }

  function render() {
    const map = { ad: screenAd, questions: screenQuestions, results: screenResults, compare: screenCompare, apply: screenApply, pm: screenPm, ab: screenAb };
    document.getElementById("app").innerHTML = chrome((map[state.screen] || screenAd)());
  }

  function onClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action !== "reset") state.flash = "";
    if (action === "reset") { localStorage.removeItem(KEY); state = seed(); save(); render(); return; }
    if (action === "screen") { state.screen = btn.dataset.screen; save(); render(); return; }
    if (action === "keyword") {
      state.keyword = btn.dataset.id;
      state.answers = Object.assign({}, DATA.keywords[state.keyword].defaults);
      save(); render(); return;
    }
    if (action === "channel") { state.channel = btn.dataset.id; save(); render(); return; }
    if (action === "balance") { state.answers.balance = btn.dataset.id; save(); render(); return; }
    if (action === "variant") { state.variant = btn.dataset.id; save(); render(); return; }
    if (action === "qcount") { state.questionCount = Number(btn.dataset.id); save(); render(); return; }
    if (action === "headline") { state.headlineMatch = btn.dataset.id === "on"; save(); render(); return; }
    if (action === "rank") { state.rankMode = btn.dataset.id; save(); render(); return; }
    if (action === "compare-toggle") {
      const id = btn.dataset.id;
      const i = state.compare.indexOf(id);
      if (i === -1) {
        if (state.compare.length >= 2) state.compare.shift();
        state.compare.push(id);
      } else state.compare.splice(i, 1);
      save(); render(); return;
    }
    if (action === "click-out") {
      const card = DATA.cards.find((c) => c.id === btn.dataset.id);
      state.clicks.push(card.name + ": you are leaving to the issuer site (demo, nothing happens).");
      state.screen = "apply";
      save(); render(); return;
    }
    if (action === "bad") { state.showBad = !state.showBad; state.decision = ""; save(); render(); return; }
    if (action === "ship") {
      const row = state.showBad ? DATA.ab.bad : DATA.ab.B;
      const reasons = guardrail(row);
      if (reasons.length) { state.flash = reasons.join(" "); save(); render(); return; }
      state.decision = row.name + " is marked to ship in this demo. Nothing goes live.";
      save(); render(); return;
    }
    if (action === "iterate") { state.decision = "Marked iterate. Keep the test running in this demo."; save(); render(); return; }
    if (action === "stop") { state.decision = "Marked stop. The variant stays off in this demo."; save(); render(); return; }
  }

  function onInput(e) {
    const t = e.target;
    if (!t.dataset.field) return;
    if (t.dataset.field === "credit") state.answers.credit = t.value;
    else state.answers[t.dataset.field] = t.type === "number" ? Number(t.value) : t.value;
    save();
  }

  document.getElementById("app").addEventListener("click", onClick);
  document.getElementById("app").addEventListener("input", onInput);
  document.getElementById("app").addEventListener("change", onInput);
  render();
})();
