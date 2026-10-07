(function () {
  const DATA = window.ICON_DATA;
  const KEY = "icon-msk-steerage-desk-v1";
  const main = document.getElementById("main");

  function fresh() {
    return {
      screen: "worklist",
      openId: "M-014",
      records: {},
      roadmap: []
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

  function rec(id) {
    if (!state.records[id]) {
      state.records[id] = {
        override: "",
        providerId: "",
        reason: "",
        agreed: "",
        steered: null,
        outreach: []
      };
    }
    return state.records[id];
  }

  function memberById(id) {
    return DATA.members.find(function (item) { return item.id === id; }) || DATA.members[0];
  }

  function isStale(member) {
    return member.dataAgeDays > 30 && !String(rec(member.id).override || "").trim();
  }

  function ranked() {
    return DATA.members.slice().sort(function (a, b) {
      const aStale = isStale(a);
      const bStale = isStale(b);
      if (aStale !== bStale) return aStale ? 1 : -1;
      if (b.risk !== a.risk) return b.risk - a.risk;
      return a.id < b.id ? -1 : 1;
    });
  }

  function freshnessWords(member) {
    if (member.dataAgeDays > 30) {
      return "Data stale: " + member.dataAgeDays + " days (claims through " + member.claimsThrough + ")";
    }
    return "Claims " + member.dataAgeDays + " days old";
  }

  function money(value) {
    return "$" + Number(value).toLocaleString("en-US");
  }

  function steerReasons(member) {
    const row = rec(member.id);
    const provider = DATA.providers.find(function (item) { return item.id === row.providerId; });
    const reasons = [];
    if (!provider) reasons.push("Pick a provider first.");
    else if (provider.score < 4) reasons.push("Score is " + provider.score + " of 5. Steered stays locked under 4.");
    if (!String(row.reason || "").trim()) reasons.push("Write the reason for this steer.");
    if (row.agreed !== "yes") reasons.push("Record that the member agreed.");
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
    if (screen === "worklist") main.innerHTML = renderWorklist();
    else if (screen === "member") main.innerHTML = renderMember();
    else if (screen === "steer") main.innerHTML = renderSteer();
    else if (screen === "outreach") main.innerHTML = renderOutreach();
    else if (screen === "partner") main.innerHTML = renderPartner();
    else main.innerHTML = renderRoadmap();
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

  function renderWorklist() {
    const list = ranked();
    const cards = list.map(function (member, index) {
      const row = rec(member.id);
      const stale = member.dataAgeDays > 30;
      const rankNote = stale && row.override.trim()
        ? "<p class='okbox'>Override on. Ranked with fresh members because a note was saved.</p>"
        : "";
      return "<article class='card'><button type='button' class='member' data-open='" + member.id + "'><strong>" + (index + 1) + ". " + esc(member.initials) + "</strong> · " + esc(member.ageBand) + " · " + esc(member.planName) + "<div class='meta'><span class='pill " + (stale ? "stale" : "fresh") + "'>" + esc(freshnessWords(member)) + "</span><span class='pill cost'>Avoidable " + esc(member.costBand) + "</span><span class='pill'>Risk " + member.risk.toFixed(2) + "</span>" + (row.steered ? "<span class='pill good'>Steered</span>" : "") + "</div><p>" + member.reasons.map(function (reason) { return esc(reason.text); }).join(". ") + ".</p></button>" + (stale ? "<label class='field' for='override-" + member.id + "'>Override note to rank with fresh data</label><textarea id='override-" + member.id + "' data-override='" + member.id + "'>" + esc(row.override) + "</textarea>" + rankNote : "") + "</article>";
    }).join("");
    return "<section><h2>Worklist</h2><p class='muted'>" + DATA.members.length + " members. Fresh claims rank first. Data stale members stay below unless an override note is saved.</p>" + cards + "</section>";
  }

  function renderMember() {
    const member = memberById(state.openId);
    const row = rec(member.id);
    const reasons = member.reasons.map(function (reason) {
      return "<li><strong>" + esc(reason.text) + ".</strong> Claim " + esc(reason.claimRef) + " on " + esc(reason.date) + ".</li>";
    }).join("");
    const timeline = member.timeline.map(function (item) {
      return "<li><strong>" + esc(item.date) + ".</strong> " + esc(item.text) + ". Claim " + esc(item.claimRef) + ".</li>";
    }).join("");
    const extra = row.outreach.map(function (item) {
      return "<li><strong>" + esc(item.at.slice(0, 10)) + ".</strong> Call logged: " + esc(item.outcome) + ". Member agreed: " + esc(item.agreed) + ". Next step " + esc(item.next || "not set") + ".</li>";
    }).join("");
    const steerLine = row.steered
      ? "<li><strong>" + esc(row.steered.at.slice(0, 10)) + ".</strong> Steered to " + esc(row.steered.provider) + ". " + esc(row.steered.reason) + "</li>"
      : "";
    return "<section><div class='card'><h2>" + esc(member.initials) + " · " + esc(member.id) + "</h2><p>" + esc(member.ageBand) + " · " + esc(member.planName) + "</p><p class='" + (member.dataAgeDays > 30 ? "word-warn" : "") + "'>" + esc(freshnessWords(member)) + "</p><p>Current referral: " + esc(member.referral.type) + " at " + esc(member.referral.provider) + ". Efficiency score " + member.referral.score + " of 5. Estimated episode " + money(member.referral.cost) + ".</p></div><div class='card'><h3>Why this member is on the list</h3><ul>" + reasons + "</ul></div><div class='card'><h3>Claims timeline</h3><ul class='timeline'>" + timeline + steerLine + extra + "</ul></div></section>";
  }

  function renderSteer() {
    const member = memberById(state.openId);
    const row = rec(member.id);
    const options = DATA.providers.filter(function (provider) { return provider.type === member.referral.type; });
    const cards = options.map(function (provider) {
      const on = row.providerId === provider.id;
      return "<button type='button' class='card pick" + (on ? " on" : "") + "' data-provider='" + provider.id + "'><strong>" + esc(provider.name) + "</strong><p>Score " + provider.score + " of 5. Episode " + money(provider.cost) + ". " + provider.miles + " miles. Next opening in " + esc(provider.opening) + ".</p><p>" + (provider.score >= 4 ? "Meets the 4 of 5 bar." : "Under the 4 of 5 bar.") + "</p></button>";
    }).join("");
    const reasons = steerReasons(member);
    return "<section><div class='card'><h2>Steer " + esc(member.initials) + "</h2><p>Needed service: " + esc(member.referral.type) + ". Today they are pointed at " + esc(member.referral.provider) + " (score " + member.referral.score + " of 5, about " + money(member.referral.cost) + ").</p></div>" + cards + "<div class='card'><label class='field' for='steer-reason'>Reason</label><textarea id='steer-reason'>" + esc(row.reason) + "</textarea><label class='field'>Member agreed</label><div class='actions'><button type='button' data-agree='yes' class='" + (row.agreed === "yes" ? "primary" : "") + "'>Agreed, yes</button><button type='button' data-agree='no' class='" + (row.agreed === "no" ? "primary" : "") + "'>Agreed, no</button></div>" + (row.steered ? "<div class='okbox'>Steered to " + esc(row.steered.provider) + ".</div>" : (reasons.length ? "<div class='lock'>" + reasons.map(esc).join(" ") + "</div>" : "<div class='okbox'>Ready to mark Steered.</div>")) + "<div class='actions'><button type='button' class='primary' id='mark-steered'" + (reasons.length ? " disabled" : "") + ">Mark Steered</button></div></div></section>";
  }

  function renderOutreach() {
    const member = memberById(state.openId);
    const row = rec(member.id);
    const outcomes = ["Reached", "Left voicemail", "Declined", "Scheduled"];
    const buttons = outcomes.map(function (outcome) {
      return "<button type='button' data-outcome='" + outcome + "' class='" + (row.draftOutcome === outcome ? "primary" : "") + "'>" + outcome + "</button>";
    }).join("");
    const list = row.outreach.map(function (item) {
      return "<li>" + esc(item.outcome) + " on " + esc(item.at.slice(0, 16).replace("T", " ")) + ". Agreed: " + esc(item.agreed) + ". Next step: " + esc(item.next || "not set") + ".</li>";
    }).join("") || "<li>No calls logged yet.</li>";
    return "<section class='card'><h2>Outreach log for " + esc(member.initials) + "</h2><label class='field'>Call outcome</label><div class='actions'>" + buttons + "</div><label class='field'>Member agreed on this call</label><div class='actions'><button type='button' data-call-agree='yes' class='" + (row.draftAgreed === "yes" ? "primary" : "") + "'>Yes</button><button type='button' data-call-agree='no' class='" + (row.draftAgreed === "no" ? "primary" : "") + "'>No</button></div><label class='field' for='next-step'>Next step date</label><input id='next-step' type='date' value='" + esc(row.draftNext || "") + "'><div class='actions'><button type='button' class='primary' id='save-call'>Save call to timeline</button></div><h3>Saved calls</h3><ul>" + list + "</ul></section>";
  }

  function renderPartner() {
    const deskSteered = DATA.members.filter(function (member) { return rec(member.id).steered; }).length;
    const cards = ["Plan A", "Plan B"].map(function (key) {
      const plan = DATA.plans[key];
      const rate = Math.round((plan.steered / plan.flagged) * 1000) / 10;
      const feeds = plan.feeds.map(function (feed) {
        return "<li>" + esc(feed.name) + ": " + esc(feed.text) + "</li>";
      }).join("");
      return "<article class='card'><h2>" + esc(plan.name) + "</h2><p class='big'>" + rate + "%</p><p>Steerage rate. Steered " + plan.steered + " of " + plan.flagged + " flagged. Reached " + plan.reached + ".</p><p>Estimated savings band: " + esc(plan.savings) + ".</p><h3>Data freshness by feed</h3><ul>" + feeds + "</ul>" + (plan.gap ? "<p class='lock'>" + esc(plan.gap) + "</p>" : "<p class='okbox'>No open data gap on this snapshot.</p>") + "</article>";
    }).join("");
    return "<section><p class='muted'>Plan snapshot for the month. These totals are not a sum of the 25 people on this desk. Steered on this desk today: " + deskSteered + ".</p><div class='columns three'>" + cards + "</div></section>";
  }

  function renderRoadmap() {
    const seed = DATA.roadmapSeed;
    const columns = ["Now", "Next", "Later"].map(function (column) {
      const items = state.roadmap.filter(function (item) { return item.column === column; }).map(function (item) {
        return "<article class='card'><h3>" + esc(item.problem) + "</h3><p>Commitment: " + esc(item.commitment) + "</p><p>Metric: " + esc(item.metric) + "</p><p>Acceptance: " + esc(item.acceptance) + "</p><p>Owner: " + esc(item.owner) + "</p><p>Dependencies: " + esc(item.dependencies) + "</p><div class='actions'><button type='button' data-move-item='" + item.id + "' data-column='Now'>Now</button><button type='button' data-move-item='" + item.id + "' data-column='Next'>Next</button><button type='button' data-move-item='" + item.id + "' data-column='Later'>Later</button></div></article>";
      }).join("") || "<p class='muted'>Nothing in " + column + ".</p>";
      return "<div><h2>" + column + "</h2>" + items + "</div>";
    }).join("");
    return "<section><div class='card'><h2>Create roadmap item from the Plan B gap</h2><label class='field' for='rm-problem'>Problem</label><textarea id='rm-problem'>" + esc(state.draftProblem == null ? seed.problem : state.draftProblem) + "</textarea><label class='field' for='rm-commit'>Partner commitment</label><input id='rm-commit' type='text' value='" + esc(state.draftCommit == null ? seed.commitment : state.draftCommit) + "'><label class='field' for='rm-metric'>Metric</label><input id='rm-metric' type='text' value='" + esc(state.draftMetric == null ? seed.metric : state.draftMetric) + "'><label class='field' for='rm-accept'>Acceptance criteria</label><textarea id='rm-accept'>" + esc(state.draftAccept == null ? seed.acceptance : state.draftAccept) + "</textarea><label class='field' for='rm-owner'>Owner</label><input id='rm-owner' type='text' value='" + esc(state.draftOwner == null ? seed.owner : state.draftOwner) + "'><label class='field' for='rm-dep'>Dependencies</label><input id='rm-dep' type='text' value='" + esc(state.draftDep == null ? seed.dependencies : state.draftDep) + "'><div class='actions'><button type='button' class='primary' id='add-roadmap'>Create roadmap item</button></div></div><div class='columns three'>" + columns + "</div></section>";
  }

  document.body.addEventListener("click", function (event) {
    const tab = event.target.closest("[data-screen]");
    if (tab) {
      state.screen = tab.getAttribute("data-screen");
      save();
      render();
      return;
    }
    const open = event.target.closest("[data-open]");
    if (open) {
      state.openId = open.getAttribute("data-open");
      state.screen = "member";
      save();
      render();
      return;
    }
    const provider = event.target.closest("[data-provider]");
    if (provider) {
      rec(state.openId).providerId = provider.getAttribute("data-provider");
      save();
      render();
      return;
    }
    const agree = event.target.closest("[data-agree]");
    if (agree) {
      rec(state.openId).agreed = agree.getAttribute("data-agree");
      save();
      render();
      return;
    }
    if (event.target.id === "mark-steered") {
      const member = memberById(state.openId);
      if (steerReasons(member).length) return;
      const row = rec(member.id);
      const chosen = DATA.providers.find(function (item) { return item.id === row.providerId; });
      row.steered = {
        provider: chosen.name,
        score: chosen.score,
        cost: chosen.cost,
        reason: row.reason.trim(),
        at: new Date().toISOString()
      };
      save();
      render();
      return;
    }
    const outcome = event.target.closest("[data-outcome]");
    if (outcome) {
      rec(state.openId).draftOutcome = outcome.getAttribute("data-outcome");
      save();
      render();
      return;
    }
    const callAgree = event.target.closest("[data-call-agree]");
    if (callAgree) {
      rec(state.openId).draftAgreed = callAgree.getAttribute("data-call-agree");
      save();
      render();
      return;
    }
    if (event.target.id === "save-call") {
      const row = rec(state.openId);
      if (!row.draftOutcome) return;
      row.outreach.unshift({
        outcome: row.draftOutcome,
        agreed: row.draftAgreed || "not asked",
        next: row.draftNext || "",
        at: new Date().toISOString()
      });
      save();
      render();
      return;
    }
    if (event.target.id === "add-roadmap") {
      const seed = DATA.roadmapSeed;
      state.roadmap.unshift({
        id: "RM-" + Date.now(),
        problem: state.draftProblem == null ? seed.problem : state.draftProblem,
        commitment: state.draftCommit == null ? seed.commitment : state.draftCommit,
        metric: state.draftMetric == null ? seed.metric : state.draftMetric,
        acceptance: state.draftAccept == null ? seed.acceptance : state.draftAccept,
        owner: state.draftOwner == null ? seed.owner : state.draftOwner,
        dependencies: state.draftDep == null ? seed.dependencies : state.draftDep,
        column: "Now"
      });
      save();
      render();
      return;
    }
    const move = event.target.closest("[data-move-item]");
    if (move) {
      const item = state.roadmap.find(function (row) { return row.id === move.getAttribute("data-move-item"); });
      if (item) item.column = move.getAttribute("data-column");
      save();
      render();
    }
  });

  document.body.addEventListener("input", function (event) {
    const override = event.target.getAttribute && event.target.getAttribute("data-override");
    if (override) {
      rec(override).override = event.target.value;
      save();
      render();
      return;
    }
    const map = {
      "steer-reason": function (value) { rec(state.openId).reason = value; },
      "next-step": function (value) { rec(state.openId).draftNext = value; },
      "rm-problem": function (value) { state.draftProblem = value; },
      "rm-commit": function (value) { state.draftCommit = value; },
      "rm-metric": function (value) { state.draftMetric = value; },
      "rm-accept": function (value) { state.draftAccept = value; },
      "rm-owner": function (value) { state.draftOwner = value; },
      "rm-dep": function (value) { state.draftDep = value; }
    };
    if (map[event.target.id]) {
      map[event.target.id](event.target.value);
      save();
      if (event.target.id === "steer-reason") render();
    }
  });

  document.getElementById("btn-reset").addEventListener("click", function () {
    state = fresh();
    localStorage.removeItem(KEY);
    render();
  });

  render();
})();
