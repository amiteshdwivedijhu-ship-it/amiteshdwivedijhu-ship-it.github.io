(function () {
  const DATA = window.CHALK_DATA;
  const KEY = "chalk-context-replay-v1";
  const main = document.getElementById("main");

  function fresh() {
    return {
      screen: "feed",
      flaggedOnly: false,
      query: "",
      openId: "D-1182",
      selectedFix: "a",
      backtests: {},
      changeNote: "",
      shipped: null
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

  function decisionById(id) {
    return DATA.decisions.find(function (item) { return item.id === id; }) || DATA.decisions[0];
  }

  function visible() {
    return DATA.decisions.filter(function (item) {
      if (state.flaggedOnly && !item.flagged) return false;
      const blob = (item.id + " " + item.order + " " + item.customer).toLowerCase();
      if (state.query && blob.indexOf(state.query.toLowerCase()) === -1) return false;
      return true;
    });
  }

  function shipReasons() {
    const fix = DATA.fixes.find(function (item) { return item.id === state.selectedFix; });
    const ran = state.backtests[state.selectedFix];
    const reasons = [];
    if (state.shipped) return reasons;
    if (!ran) reasons.push("Run the backtest on this fix first.");
    else {
      if (ran.newWrong > 0) reasons.push("The backtest shows " + ran.newWrong + " new wrong denials.");
      if (ran.p99After >= 50) reasons.push("p99 serving latency is " + ran.p99After + "ms. The budget is under 50ms.");
    }
    if (!String(state.changeNote || "").trim()) reasons.push("Write a change note for the version bump.");
    if (fix && fix.id === "b" && ran && ran.p99After >= 50) {
      /* reason already added */
    }
    return reasons;
  }

  function render() {
    const active = document.activeElement;
    const focusId = active && active.id ? active.id : "";
    const sel = active && typeof active.selectionStart === "number" ? active.selectionStart : null;
    document.querySelectorAll(".tabs button").forEach(function (button) {
      button.classList.toggle("active-tab", button.getAttribute("data-screen") === state.screen);
    });
    const screen = state.screen;
    if (screen === "feed") main.innerHTML = renderFeed();
    else if (screen === "replay") main.innerHTML = renderReplay();
    else if (screen === "diff") main.innerHTML = renderDiff();
    else if (screen === "cause") main.innerHTML = renderCause();
    else if (screen === "fix") main.innerHTML = renderFix();
    else main.innerHTML = renderShip();
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

  function renderFeed() {
    const rows = visible().map(function (item) {
      return "<tr class='" + (item.id === state.openId ? "picked" : "") + "'><td><button type='button' class='row-btn' data-open='" + item.id + "'>" + esc(item.id) + "</button></td><td>#" + esc(item.order) + "</td><td>" + esc(item.customer) + "</td><td>" + esc(item.result) + "</td><td>" + (item.flagged ? "Flagged" : "No flag") + "</td><td>" + esc(item.at) + "</td></tr>";
    }).join("");
    return "<section><div class='filters'><button type='button' id='flag-toggle' class='" + (state.flaggedOnly ? "primary" : "") + "'>" + (state.flaggedOnly ? "Showing flagged only" : "Flagged only") + "</button><input id='decision-query' type='text' placeholder='Find D-1182 or an order' value='" + esc(state.query) + "'></div><p class='muted'>" + visible().length + " of " + DATA.decisions.length + " refund decisions. 6 are flagged by customers. 4 of those used a stale prior_claims_90d.</p><div class='table-scroll'><table><thead><tr><th>Decision</th><th>Order</th><th>Customer</th><th>Result</th><th>Complaint</th><th>Time</th></tr></thead><tbody>" + rows + "</tbody></table></div></section>";
  }

  function renderReplay() {
    const item = decisionById(state.openId);
    const rows = item.features.map(function (feature) {
      const stale = !!feature.staleWords;
      return "<tr class='" + (stale ? "stale" : "") + "'><td class='feat'>" + esc(feature.name) + "</td><td>" + esc(feature.served) + (stale ? " <span class='word-warn'>Stale. " + esc(feature.staleWords) + "</span>" : " <span class='word-ok'>Fresh</span>") + "</td><td>" + esc(feature.source) + "</td><td>" + esc(feature.computedAt) + "</td><td>" + esc(feature.freshness) + "</td><td>" + esc(feature.cacheHit) + "</td><td>" + esc(feature.version) + "</td></tr>";
    }).join("");
    return "<section><div class='card'><h2>" + esc(item.id) + " · order #" + esc(item.order) + "</h2><p>" + esc(item.customer) + " · " + esc(item.result) + " · " + esc(item.at) + "</p><h3>Agent reply</h3><p>" + esc(item.reply) + "</p><h3>Reasoning</h3><p>" + esc(item.reasoning) + "</p></div><div class='table-scroll'><table><thead><tr><th>Feature</th><th>Value served</th><th>Source</th><th>Computed at</th><th>Freshness limit</th><th>Cache hit</th><th>Version</th></tr></thead><tbody>" + rows + "</tbody></table></div></section>";
  }

  function renderDiff() {
    const item = decisionById(state.openId);
    const blocks = item.features.map(function (feature) {
      const changed = String(feature.served) !== String(feature.now) || String(feature.served) !== String(feature.offline);
      const flip = feature.name === "customer.prior_claims_90d" && Number(feature.served) > 2 && Number(feature.now) <= 2;
      const otherFlip = feature.name === "order.days_since_delivery" && Number(feature.served) > 30 && Number(feature.now) <= 30;
      let note = "No flip. Served value matches now and the offline value.";
      if (flip || otherFlip) note = "Decision would flip with the current value.";
      else if (changed) note = "Values differ, but this field alone would not flip the refund.";
      return "<article class='card" + (changed ? " stale" : "") + "'><h3 class='feat'>" + esc(feature.name) + "</h3><div class='trio cols-3'><div class='cell'><strong>Served</strong><p>" + esc(feature.served) + "</p></div><div class='cell'><strong>Now</strong><p>" + esc(feature.now) + "</p></div><div class='cell'><strong>Offline training</strong><p>" + esc(feature.offline) + "</p></div></div><p class='" + ((flip || otherFlip) ? "word-warn" : "muted") + "'>" + note + "</p></article>";
    }).join("");
    return "<section><h2>Served vs now vs offline</h2><p class='muted'>" + esc(item.id) + ". Policy denies a refund when prior claims are over 2.</p>" + blocks + "</section>";
  }

  function renderCause() {
    const item = decisionById(state.openId);
    if (!item.cause) {
      return "<section class='card'><h2>Root cause</h2><p>No stale feature on " + esc(item.id) + ". Served values match the current values.</p></section>";
    }
    const events = item.cause.events.map(function (event) {
      return "<li><strong>" + esc(event.at) + ".</strong> " + esc(event.text) + "</li>";
    }).join("");
    const prior = item.features.find(function (feature) { return feature.name === "customer.prior_claims_90d"; });
    return "<section><div class='card stale'><h2>Root cause</h2><p>" + esc(item.cause.title) + "</p><p>Cache age: " + esc(prior && prior.staleWords ? prior.staleWords : "see the timeline") + ".</p></div><ol class='timeline'>" + events + "</ol></section>";
  }

  function renderFix() {
    const cards = DATA.fixes.map(function (fix) {
      const ran = state.backtests[fix.id];
      const selected = state.selectedFix === fix.id;
      return "<article class='card" + (selected ? " stale" : "") + "'><h3>" + esc(fix.name) + "</h3><p>" + esc(fix.summary) + "</p><p class='muted'>Pseudo-code</p><pre>" + esc(fix.code) + "</pre><div class='actions'><button type='button' data-pick-fix='" + fix.id + "'" + (selected ? " class='primary'" : "") + ">" + (selected ? "Selected" : "Select this fix") + "</button><button type='button' data-backtest='" + fix.id + "'>Run backtest</button></div>" + (ran ? "<div class='okbox'>Backtest on 40 decisions. Flips: " + ran.flips + ". New wrong denials: " + ran.newWrong + ". p99: " + ran.p99Before + "ms to " + ran.p99After + "ms." + (ran.humanReviews ? " Sent to a human: " + ran.humanReviews + "." : "") + " " + esc(fix.note) + "</div>" : "<p class='muted'>Backtest has not been run for this option.</p>") + "</article>";
    }).join("");
    return "<section><h2>Fix options for prior_claims_90d</h2><p>Each option replays the same 40 decisions. Shipping still waits for the hard rule on the Ship screen.</p>" + cards + "</section>";
  }

  function renderShip() {
    const reasons = shipReasons();
    const history = DATA.versions.map(function (item) {
      const isV4 = item.version === "v4";
      const note = isV4 ? (state.shipped ? state.shipped.note : "Not shipped yet.") : item.note;
      const label = isV4 && state.shipped ? "v4 live" : (isV4 ? "v4 not shipped" : item.version + " past");
      return "<li><strong>" + esc(item.version) + " (" + esc(label) + ").</strong> " + esc(note) + "</li>";
    }).join("");
    const watch = state.shipped
      ? "Freshness watch, simulated last day: limit is now in place. 4 served values that were over a missing limit would have been refreshed. 0 values are still over the limit in this simulation."
      : "Freshness watch, last day: 4 served values of prior_claims_90d were older than a limit that was not set.";
    const current = state.shipped ? "v4" : "v3";
    return "<section><div class='card'><h2>Ship prior_claims_90d</h2><p>Current version: " + current + ". A ship bumps v3 to v4.</p><label class='field' for='change-note'>Change note</label><textarea id='change-note'>" + esc(state.changeNote) + "</textarea><p class='muted'>Selected fix: " + esc((DATA.fixes.find(function (item) { return item.id === state.selectedFix; }) || {}).name || "") + ".</p>" + (state.shipped ? "<div class='okbox'>Shipped " + esc(state.shipped.version) + ". " + esc(state.shipped.fixName) + ".</div>" : (reasons.length ? "<div class='lock'>" + reasons.map(esc).join(" ") + "</div>" : "<div class='okbox'>All ship checks pass.</div>")) + "<div class='actions'><button type='button' class='primary' id='ship-btn'" + (reasons.length || state.shipped ? " disabled" : "") + ">Ship fix</button></div></div><div class='card'><h3>Version history</h3><ul>" + history + "</ul></div><div class='card'><h3>Freshness watch</h3><p>" + esc(watch) + "</p></div></section>";
  }

  document.body.addEventListener("click", function (event) {
    const tab = event.target.closest("[data-screen]");
    if (tab) {
      state.screen = tab.getAttribute("data-screen");
      save();
      render();
      return;
    }
    if (event.target.id === "flag-toggle") {
      state.flaggedOnly = !state.flaggedOnly;
      save();
      render();
      return;
    }
    const open = event.target.closest("[data-open]");
    if (open) {
      state.openId = open.getAttribute("data-open");
      state.screen = "replay";
      save();
      render();
      return;
    }
    const pick = event.target.closest("[data-pick-fix]");
    if (pick) {
      state.selectedFix = pick.getAttribute("data-pick-fix");
      save();
      render();
      return;
    }
    const backtest = event.target.closest("[data-backtest]");
    if (backtest) {
      const id = backtest.getAttribute("data-backtest");
      const fix = DATA.fixes.find(function (item) { return item.id === id; });
      state.selectedFix = id;
      state.backtests[id] = {
        flips: fix.flips,
        newWrong: fix.newWrong,
        p99Before: fix.p99Before,
        p99After: fix.p99After,
        humanReviews: fix.humanReviews || 0
      };
      state.screen = "fix";
      save();
      render();
      return;
    }
    if (event.target.id === "ship-btn") {
      const reasons = shipReasons();
      if (reasons.length) return;
      const fix = DATA.fixes.find(function (item) { return item.id === state.selectedFix; });
      state.shipped = {
        version: "v4",
        fixName: fix.name,
        note: state.changeNote.trim(),
        at: new Date().toISOString()
      };
      save();
      render();
    }
  });

  document.body.addEventListener("input", function (event) {
    if (event.target.id === "decision-query") {
      state.query = event.target.value;
      save();
      render();
      return;
    }
    if (event.target.id === "change-note") {
      state.changeNote = event.target.value;
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
