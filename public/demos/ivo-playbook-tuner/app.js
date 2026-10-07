(function () {
  const DATA = window.IVO_DATA;
  const KEY = "ivo-playbook-tuner-v1";
  const main = document.getElementById("main");
  const BANDS = [
    { id: "all", label: "All deal sizes" },
    { id: "under", label: "Under $100K" },
    { id: "mid", label: "$100K to $500K" },
    { id: "over", label: "Over $500K" }
  ];

  function fresh() {
    return {
      screen: "analytics",
      band: "all",
      provision: "lol",
      proposal: "small",
      carveOut: true,
      riskNote: "Small deals already land on 2x most of the time. Keep 1x when the counterparty handles customer personal data.",
      reviewed: { small: {}, all: {} },
      gcName: "",
      gcNote: "",
      signed: null,
      published: null,
      watch: 15
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

  function slice() {
    return DATA.deals.filter(function (deal) {
      return state.band === "all" || deal.band === state.band;
    });
  }

  function round1(value) {
    return Math.round(value * 10) / 10;
  }

  function statsFor(provisionId, deals) {
    if (!deals.length) return { turns: 0, concession: 0, count: 0 };
    let turns = 0;
    let conceded = 0;
    deals.forEach(function (deal) {
      const row = deal.provisions[provisionId];
      turns += row.turnsAdded;
      if (row.final !== row.start) conceded += 1;
    });
    return {
      turns: round1(turns / deals.length),
      concession: Math.round((conceded / deals.length) * 100),
      count: deals.length,
      conceded: conceded
    };
  }

  function ranked() {
    const deals = slice();
    return DATA.provisions.map(function (provision) {
      return Object.assign({ provision: provision }, statsFor(provision.id, deals));
    }).sort(function (a, b) { return b.turns - a.turns || b.concession - a.concession; });
  }

  function underLol() {
    const deals = DATA.deals.filter(function (deal) { return deal.band === "under"; });
    const moved = deals.filter(function (deal) { return deal.provisions.lol.final === "2x"; });
    const turns = deals.reduce(function (sum, deal) { return sum + deal.provisions.lol.turnsAdded; }, 0);
    const days = deals.reduce(function (sum, deal) { return sum + deal.provisions.lol.daysAdded; }, 0);
    const personal = deals.filter(function (deal) { return deal.handlesPersonalData; }).length;
    return {
      count: deals.length,
      moved: moved.length,
      pct: Math.round((moved.length / deals.length) * 100),
      turns: round1(turns / deals.length),
      days: round1(days / deals.length),
      personal: personal
    };
  }

  function proposal() {
    return DATA.proposals[state.proposal];
  }

  function worseDeals() {
    const key = proposal().worseKey;
    return DATA.deals.filter(function (deal) { return deal[key]; });
  }

  function publishReasons() {
    const item = proposal();
    const worse = worseDeals();
    const reviewed = state.reviewed[item.id] || {};
    const open = worse.filter(function (deal) { return !reviewed[deal.id]; });
    const reasons = [];
    if (item.support < 20) reasons.push("Only " + item.support + " past deals support this. The bar is 20.");
    if (item.worsePct > 5) reasons.push("Simulated worse deals are " + item.worsePct + "%, which is over the 5% limit.");
    if (open.length) reasons.push(open.length + " worse " + (open.length === 1 ? "deal is" : "deals are") + " not reviewed yet.");
    if (!state.carveOut) reasons.push("The data protection carve-out is off. Personal data deals must stay at 1x.");
    if (!state.signed) reasons.push("A named GC approver still needs to sign off with a note.");
    return reasons;
  }

  function render() {
    const active = document.activeElement;
    const focusId = active && active.id ? active.id : "";
    const sel = active && typeof active.selectionStart === "number" ? active.selectionStart : null;
    document.querySelectorAll(".tabs button").forEach(function (button) {
      button.classList.toggle("active-tab", button.getAttribute("data-screen") === state.screen);
    });
    const views = { analytics: renderAnalytics, dive: renderDive, proposal: renderProposal, sim: renderSim, approve: renderApprove, history: renderHistory };
    main.innerHTML = (views[state.screen] || renderAnalytics)();
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

  function bandButtons() {
    return BANDS.map(function (band) {
      return "<button type='button' data-band='" + band.id + "' class='" + (state.band === band.id ? "on" : "") + "'>" + esc(band.label) + "</button>";
    }).join("");
  }

  function renderAnalytics() {
    const rows = ranked();
    const max = Math.max.apply(null, rows.map(function (row) { return row.turns; }).concat([1]));
    const insight = underLol();
    const bars = rows.map(function (row, index) {
      const width = Math.round((row.turns / max) * 100);
      return "<button type='button' class='bar-row' data-provision='" + row.provision.id + "'><span>" + (index + 1) + ". " + esc(row.provision.name) + "</span><span class='bar'><span style='width:" + width + "%'></span></span><strong>" + row.turns + " turns · " + row.concession + "%</strong></button>";
    }).join("");
    const table = rows.map(function (row) {
      return "<tr><td>" + esc(row.provision.name) + "</td><td>" + row.turns + "</td><td>" + row.concession + "%</td><td>" + row.conceded + " of " + row.count + "</td></tr>";
    }).join("");
    return "<section><div class='card'><h2>Where the team gives in</h2><p>Under $100K ACV, limitation of liability moved from 1x to 2x in " + insight.moved + " of " + insight.count + " deals (" + insight.pct + "%). Average " + insight.turns + " turns and " + insight.days + " days added. " + insight.personal + " of those deals handle personal data and should keep 1x.</p><div class='actions'>" + bandButtons() + "</div></div><div class='card'><h3>Ranked by average turns added</h3>" + bars + "</div><div class='table-scroll'><table><thead><tr><th>Provision</th><th>Avg turns added</th><th>Concession rate</th><th>Deals</th></tr></thead><tbody>" + table + "</tbody></table></div></section>";
  }

  function renderDive() {
    const provision = DATA.provisions.find(function (item) { return item.id === state.provision; }) || DATA.provisions[0];
    const bands = ["under", "mid", "over"].map(function (band) {
      const deals = DATA.deals.filter(function (deal) { return deal.band === band; });
      const stat = statsFor(provision.id, deals);
      const label = BANDS.find(function (item) { return item.id === band; }).label;
      return "<li>" + esc(label) + ": " + stat.conceded + " of " + stat.count + " conceded (" + stat.concession + "%). Average " + stat.turns + " turns added.</li>";
    }).join("");
    const approvers = {};
    DATA.deals.forEach(function (deal) {
      const row = deal.provisions[provision.id];
      if (!row.turnsAdded || !row.approver) return;
      approvers[row.approver] = (approvers[row.approver] || 0) + row.turnsAdded;
    });
    const approverList = Object.keys(approvers).sort(function (a, b) { return approvers[b] - approvers[a]; }).map(function (name) {
      return "<li>" + esc(name) + " added " + approvers[name] + " turns.</li>";
    }).join("");
    const excerpts = provision.id === "lol" ? lolExcerpts() : genericExcerpt(provision);
    return "<section><div class='actions'>" + DATA.provisions.map(function (item) {
      return "<button type='button' data-provision='" + item.id + "' class='" + (item.id === provision.id ? "on" : "") + "'>" + esc(item.name) + "</button>";
    }).join("") + "</div><div class='card'><h2>" + esc(provision.name) + "</h2><p>Playbook " + esc(DATA.playbook) + ".</p><p><strong>First position.</strong> " + esc(provision.first) + "</p><p><strong>Fallback.</strong> " + esc(provision.fallback) + "</p><p><strong>Walk-away.</strong> " + esc(provision.walk) + "</p></div><div class='card'><h3>Final outcomes by size band</h3><ul>" + bands + "</ul></div><div class='card'><h3>Approvers who added turns</h3><ul>" + (approverList || "<li>No extra approver turns in this slice.</li>") + "</ul></div>" + excerpts + "</section>";
  }

  function lolExcerpts() {
    return "<div class='card'><h3>Clause excerpts</h3><p class='clause'><span class='sr-only'>removed</span> <del>Liability is capped at one times (1x) the fees paid in the prior twelve months.</del></p><p class='clause'><span class='sr-only'>added</span> <ins>Liability is capped at two times (2x) the fees paid in the prior twelve months.</ins></p><p class='clause'>The cap does not apply to a breach of confidentiality. That sentence stayed in both versions.</p><p class='clause'><span class='sr-only'>added</span> <ins>If the vendor will handle customer personal data, the cap stays at 1x fees.</ins></p><p class='muted'>Synthetic clause text. Not from a real contract.</p></div>";
  }

  function genericExcerpt(provision) {
    return "<div class='card'><h3>Clause excerpt</h3><p class='clause'>First position: " + esc(provision.first) + ".</p><p class='clause'><span class='sr-only'>removed</span> <del>" + esc(provision.first) + "</del> <span class='sr-only'>added</span> <ins>" + esc(provision.fallback) + "</ins></p><p class='muted'>Synthetic clause text. Not from a real contract.</p></div>";
  }

  function renderProposal() {
    const insight = underLol();
    return "<section class='card'><h2>Proposal builder</h2><div class='actions'><button type='button' data-proposal='small' class='" + (state.proposal === "small" ? "on" : "") + "'>Under $100K only</button><button type='button' data-proposal='all' class='" + (state.proposal === "all" ? "on" : "") + "'>Start at 2x for all bands</button></div><p>" + (state.proposal === "small"
      ? "For MSAs under $100K ACV, start at 2x fees (was 1x). Keep 1x where the counterparty handles customer personal data."
      : "Start at 2x fees for every deal size. This is the version that should stay locked.") + "</p><p><strong>Supporting deals:</strong> " + proposal().support + ".</p><p>In the under $100K band, " + insight.moved + " of " + insight.count + " deals (" + insight.pct + "%) already ended at 2x. " + insight.personal + " deals involve personal data.</p><label class='field'>Data protection carve-out</label><div class='actions'><button type='button' id='carve-on' class='" + (state.carveOut ? "on" : "") + "'>Keep 1x for personal data</button><button type='button' id='carve-off' class='" + (!state.carveOut ? "on" : "") + "'>Turn carve-out off</button></div><label class='field' for='risk-note'>Risk note</label><textarea id='risk-note'>" + esc(state.riskNote) + "</textarea></section>";
  }

  function renderSim() {
    const item = proposal();
    const worse = worseDeals();
    const reviewed = state.reviewed[item.id] || {};
    const list = worse.map(function (deal) {
      const on = !!reviewed[deal.id];
      return "<article class='card'><h3>" + esc(deal.id) + " · " + esc(deal.counterparty) + "</h3><p>" + esc(BANDS.find(function (band) { return band.id === deal.band; }).label) + ". Closed at " + esc(deal.provisions.lol.final) + " after " + deal.provisions.lol.turnsAdded + " extra " + (deal.provisions.lol.turnsAdded === 1 ? "turn" : "turns") + ". Starting at 2x would have been worse than the deal the team got.</p><button type='button' data-review='" + deal.id + "' class='" + (on ? "on" : "") + "'>" + (on ? "Reviewed" : "Mark reviewed") + "</button></article>";
    }).join("");
    return "<section><div class='card'><h2>Simulation · " + esc(item.name) + "</h2><p>Replay uses the " + DATA.deals.length + " closed deals. This proposal is supported by " + item.support + " deals.</p><p><strong>Turns saved:</strong> about " + item.turnsSaved + ".</p><p><strong>Days:</strong> about " + item.daysFaster + " days faster on average for the deals this rule would change.</p><p><strong>Worse than actual:</strong> " + worse.length + " deals (" + item.worsePct + "%).</p></div>" + list + "</section>";
  }

  function renderApprove() {
    const reasons = publishReasons();
    const lines = [
      { ok: proposal().support >= 20, text: "At least 20 past deals support it (" + proposal().support + ")." },
      { ok: proposal().worsePct <= 5 && worseDeals().every(function (deal) { return state.reviewed[proposal().id] && state.reviewed[proposal().id][deal.id]; }), text: "Worse-than-actual deals are 5% or fewer (" + proposal().worsePct + "%) and each one is reviewed." },
      { ok: state.carveOut, text: "The data protection carve-out stays in place." },
      { ok: !!state.signed, text: "A named GC approver signed off with a note." + (state.signed ? " " + state.signed.name + "." : "") }
    ];
    const list = lines.map(function (line) {
      return "<p><strong class='" + (line.ok ? "okbox" : "lock") + "'>" + (line.ok ? "Pass" : "Fail") + "</strong> " + esc(line.text) + "</p>";
    }).join("");
    return "<section class='card'><h2>Approval for " + esc(proposal().name) + "</h2><div class='actions'><button type='button' data-proposal='small' class='" + (state.proposal === "small" ? "on" : "") + "'>Under $100K only</button><button type='button' data-proposal='all' class='" + (state.proposal === "all" ? "on" : "") + "'>Start at 2x for all bands</button></div>" + list + (reasons.length ? "<div class='lock'>" + reasons.map(esc).join(" ") + "</div>" : "<div class='okbox'>All four checks pass.</div>") + "<label class='field' for='gc-name'>GC approver</label><input id='gc-name' type='text' value='" + esc(state.gcName) + "' placeholder='Rob Alvarez (General Counsel)'><label class='field' for='gc-note'>Note</label><textarea id='gc-note'>" + esc(state.gcNote) + "</textarea><div class='actions'><button type='button' id='fill-gc'>Use Rob Alvarez</button><button type='button' id='sign-gc'>Record GC sign-off</button><button type='button' class='primary' id='publish-btn'" + (reasons.length || state.published ? " disabled" : "") + ">Publish</button></div>" + (state.published ? "<div class='okbox'>Published " + esc(state.published.version) + ". Approved by " + esc(state.published.approver) + ".</div>" : "") + "<p class='muted'>The all-bands proposal stays locked because worse deals are 14%, over the 5% limit.</p></section>";
  }

  function renderHistory() {
    const current = DATA.history.map(function (item) {
      return "<article class='card'><h3>Customer MSA, " + esc(item.version) + "</h3><p>" + esc(item.change) + "</p><p>Approved by " + esc(item.approver) + ".</p><p>Evidence: " + esc(item.evidence) + "</p></article>";
    }).join("");
    const v15 = state.published ? "<article class='card'><h3>Customer MSA, v15</h3><p>" + esc(state.published.change) + "</p><p>Approved by " + esc(state.published.approver) + ".</p><p>Note: " + esc(state.published.note) + "</p><p>Evidence: " + esc(state.published.evidence) + "</p></article>" : "<article class='card'><h3>Customer MSA, v15</h3><p>Not published yet.</p></article>";
    return "<section><h2>Playbook history</h2>" + current + v15 + "<div class='card'><h3>Watch</h3><p>Flag if the concession rate on limitation of liability moves more than this many points after the change.</p><label class='field' for='watch'>Points</label><input id='watch' type='number' min='1' max='50' value='" + esc(state.watch) + "'><p class='muted'>Watch is set to " + esc(state.watch) + " points.</p></div></section>";
  }

  document.body.addEventListener("click", function (event) {
    const tab = event.target.closest("[data-screen]");
    if (tab) {
      state.screen = tab.getAttribute("data-screen");
      save();
      render();
      return;
    }
    const band = event.target.closest("[data-band]");
    if (band) {
      state.band = band.getAttribute("data-band");
      save();
      render();
      return;
    }
    const provision = event.target.closest("[data-provision]");
    if (provision) {
      state.provision = provision.getAttribute("data-provision");
      state.screen = "dive";
      save();
      render();
      return;
    }
    const proposalBtn = event.target.closest("[data-proposal]");
    if (proposalBtn) {
      state.proposal = proposalBtn.getAttribute("data-proposal");
      state.signed = null;
      save();
      render();
      return;
    }
    if (event.target.id === "carve-on" || event.target.id === "carve-off") {
      state.carveOut = event.target.id === "carve-on";
      save();
      render();
      return;
    }
    const review = event.target.closest("[data-review]");
    if (review) {
      const id = review.getAttribute("data-review");
      const bag = state.reviewed[state.proposal] || {};
      bag[id] = !bag[id];
      state.reviewed[state.proposal] = bag;
      save();
      render();
      return;
    }
    if (event.target.id === "fill-gc") {
      if (!String(state.gcName || "").trim()) state.gcName = DATA.gc;
      save();
      render();
      return;
    }
    if (event.target.id === "sign-gc") {
      const name = String(state.gcName || "").trim();
      const note = String(state.gcNote || "").trim();
      if (!name || !note) return;
      state.signed = { name: name, note: note, at: new Date().toISOString() };
      save();
      render();
      return;
    }
    if (event.target.id === "publish-btn") {
      if (publishReasons().length || state.published) return;
      const item = proposal();
      state.published = {
        version: "v15",
        approver: state.signed.name,
        note: state.signed.note,
        change: item.name + ". " + (state.carveOut ? "Data protection carve-out stays at 1x." : "Carve-out off."),
        evidence: item.support + " supporting deals. Worse than actual: " + item.worsePct + "%. Turns saved about " + item.turnsSaved + "."
      };
      state.screen = "history";
      save();
      render();
    }
  });

  document.body.addEventListener("input", function (event) {
    if (event.target.id === "risk-note") state.riskNote = event.target.value;
    if (event.target.id === "gc-name") state.gcName = event.target.value;
    if (event.target.id === "gc-note") state.gcNote = event.target.value;
    if (event.target.id === "watch") state.watch = event.target.value;
    if (event.target.id === "gc-name" || event.target.id === "gc-note") state.signed = null;
    save();
    if (event.target.id === "gc-name" || event.target.id === "gc-note" || event.target.id === "risk-note") render();
  });

  document.getElementById("btn-reset").addEventListener("click", function () {
    state = fresh();
    localStorage.removeItem(KEY);
    render();
  });

  render();
})();
