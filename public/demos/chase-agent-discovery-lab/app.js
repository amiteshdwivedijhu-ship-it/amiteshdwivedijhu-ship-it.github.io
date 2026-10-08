(function () {
  const DATA = window.BANK_DATA;
  const KEY = "chase-agent-discovery-lab-v1";
  const SCREENS = [
    ["entry", "Entry points"],
    ["nudges", "Nudges"],
    ["sim", "Simulator"],
    ["phone", "Phone"],
    ["handoff", "Handoffs"],
    ["funnel", "Funnel"],
    ["decisions", "Decisions"]
  ];
  const SURFACES = ["Home", "Charge", "Card", "Fee", "Help", "Paid"];

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  function fmt(n) {
    return Math.round(Number(n) || 0).toLocaleString("en-US");
  }

  function pct(n) {
    return Math.round(Number(n) * 100) + "%";
  }

  function pct1(n) {
    return (Number(n) * 100).toFixed(1) + "%";
  }

  function clampNum(value, min, max, fallback) {
    const n = Number(value);
    if (Number.isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function seedNudges() {
    const map = {};
    DATA.nudges.forEach((nudge) => {
      map[nudge.id] = {
        on: nudge.on,
        priority: nudge.priority,
        message: nudge.message,
        commsTag: !!nudge.commsTag
      };
    });
    return map;
  }

  function seed() {
    return {
      screen: "entry",
      rollout: { E1: 100, E2: 25, E3: 10, E4: 5, E5: 100, E6: 0 },
      nudges: seedNudges(),
      caps: { per7: 1, per30: 3, quietStart: 21, quietEnd: 8 },
      persona: "C-01",
      h5: 0.70,
      phone: { surface: "Home", why: false, push: false, stop: false, view: "surface", back: "surface" },
      copyStatus: ""
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seed();
      const saved = JSON.parse(raw);
      const base = seed();
      if (!saved || typeof saved !== "object") return base;
      base.screen = saved.screen || base.screen;
      base.rollout = Object.assign(base.rollout, saved.rollout || {});
      Object.keys(base.nudges).forEach((id) => {
        base.nudges[id] = Object.assign(base.nudges[id], (saved.nudges || {})[id] || {});
      });
      base.caps = Object.assign(base.caps, saved.caps || {});
      base.persona = saved.persona || base.persona;
      base.h5 = saved.h5 || base.h5;
      base.phone = Object.assign(base.phone, saved.phone || {});
      base.copyStatus = "";
      return base;
    } catch (err) {
      return seed();
    }
  }

  let state = load();

  function save() {
    try {
      const copy = Object.assign({}, state, { copyStatus: "" });
      localStorage.setItem(KEY, JSON.stringify(copy));
    } catch (err) { /* storage can be blocked */ }
  }

  function persona() {
    return DATA.personas.find((row) => row.id === state.persona) || DATA.personas[0];
  }

  function staticNudge(id) {
    return DATA.nudges.find((row) => row.id === id);
  }

  function entryBySurface(surface) {
    return DATA.entries.find((row) => row.surface === surface);
  }

  function hourLabel(h) {
    const suffix = h >= 12 ? "pm" : "am";
    const hr = h % 12 || 12;
    return hr + suffix;
  }

  function parseDay(label) {
    const parts = String(label).split(" ");
    const month = parts[0] === "Sep" ? 8 : 9;
    return new Date(2026, month, Number(parts[1]));
  }

  function dayDiff(from, to) {
    return Math.round((parseDay(to) - parseDay(from)) / 86400000);
  }

  function isQuiet(hour, minute) {
    const mins = hour * 60 + minute;
    const start = state.caps.quietStart * 60;
    const end = state.caps.quietEnd * 60;
    if (start === end) return false;
    if (start > end) return mins >= start || mins < end;
    return mins >= start && mins < end;
  }

  function quietLabel() {
    return hourLabel(state.caps.quietStart) + " to " + hourLabel(state.caps.quietEnd);
  }

  function decidePersona(person) {
    const sends = [];
    const output = [];
    const rules = person.events.filter((ev) => ev.rule);
    const notes = person.events.filter((ev) => !ev.rule);
    const dates = [];
    rules.forEach((ev) => { if (dates.indexOf(ev.date) === -1) dates.push(ev.date); });
    dates.sort((a, b) => dayDiff("Oct 1", a) - dayDiff("Oct 1", b));
    dates.forEach((date) => {
      const group = rules.filter((ev) => ev.date === date).map((ev) => Object.assign({ eligible: false, status: "", reason: "" }, ev));
      group.forEach((ev) => applyPre(person, ev));
      const eligible = group.filter((ev) => ev.eligible).sort((a, b) => state.nudges[a.rule].priority - state.nudges[b.rule].priority);
      if (eligible.length > 1) {
        const winner = eligible[0];
        eligible.slice(1).forEach((loser) => {
          loser.eligible = false;
          loser.status = "Suppressed";
          loser.reason = "Suppressed: lower priority than " + winner.rule + " on " + date + ".";
        });
      }
      const winner = group.find((ev) => ev.eligible);
      if (winner) {
        const cap = capReason(winner, sends);
        if (cap) {
          winner.status = "Suppressed";
          winner.reason = cap;
          winner.eligible = false;
        } else {
          winner.status = "Sent";
          winner.reason = sentReason(person, winner);
          sends.push({ date: date, rule: winner.rule });
        }
      }
      group.forEach((ev) => output.push(ev));
    });
    notes.forEach((note) => output.push(Object.assign({}, note)));
    return output;
  }

  function applyPre(person, ev) {
    const nudge = staticNudge(ev.rule);
    const cfg = state.nudges[ev.rule];
    if (nudge.feature && !person.marketing) {
      ev.status = "Suppressed";
      ev.reason = "Suppressed: no marketing consent.";
      return;
    }
    if (nudge.feature && !cfg.commsTag) {
      ev.status = "Suppressed";
      ev.reason = "Suppressed: no Comms approval tag.";
      return;
    }
    if (!cfg.on) {
      ev.status = "Suppressed";
      ev.reason = "Suppressed: " + nudge.id + " is off.";
      return;
    }
    if (nudge.needsPush && !person.push) {
      ev.status = "Suppressed";
      ev.reason = "Suppressed: push is off.";
      return;
    }
    if (nudge.tip && !person.tips) {
      ev.status = "Suppressed";
      ev.reason = "Suppressed: opted out of tips.";
      return;
    }
    if (person.complaint) {
      ev.status = "Suppressed";
      ev.reason = "Suppressed: complaint on " + person.complaint + ", nudges held through Oct 28.";
      return;
    }
    if (person.fraud && nudge.fraudBlock) {
      ev.status = "Suppressed";
      ev.reason = "Suppressed: open fraud case.";
      return;
    }
    if (isQuiet(ev.hour, ev.minute) && !nudge.timeCritical) {
      ev.status = "Suppressed";
      ev.reason = "Suppressed: quiet hours (" + quietLabel() + ").";
      return;
    }
    ev.eligible = true;
  }

  function sentReason(person, ev) {
    const nudge = staticNudge(ev.rule);
    if (nudge.timeCritical && isQuiet(ev.hour, ev.minute)) {
      return "Sent. Time-critical servicing, so quiet hours (" + quietLabel() + ") do not block it.";
    }
    if (nudge.timeCritical && !person.tips) {
      return "Sent. Card alert. An opt-out of tips does not block this time-critical alert.";
    }
    if (!nudge.needsPush) return "Sent. In-app only. Push consent is not required.";
    return "Sent. Consent is on, caps are clear, and it is not quiet hours.";
  }

  function capReason(ev, sends) {
    const week = sends.filter((row) => {
      const diff = dayDiff(row.date, ev.date);
      return diff >= 0 && diff <= 6;
    });
    if (week.length >= state.caps.per7) {
      const last = week[week.length - 1];
      return "Suppressed: weekly cap, " + last.rule + " sent " + last.date + ".";
    }
    const month = sends.filter((row) => {
      const diff = dayDiff(row.date, ev.date);
      return diff >= 0 && diff <= 29;
    });
    if (month.length >= state.caps.per30) return "Suppressed: 30 day cap is " + state.caps.per30 + ".";
    return "";
  }

  function scaleEntry(entry, percent) {
    if (entry.id === "E6") {
      if (!percent) return { saw: 0, first: 0, completed: 0 };
      const factor = percent / 10;
      return { saw: entry.forecastSaw * factor, first: entry.forecastFirst * factor, completed: 0 };
    }
    const factor = entry.seedPct ? percent / entry.seedPct : 0;
    const first = entry.first * factor;
    return { saw: entry.saw * factor, first: first, completed: entry.rate == null ? 0 : first * entry.rate };
  }

  function startRate(entry) {
    if (entry.id === "E6") return entry.forecastFirst / entry.forecastSaw;
    if (!entry.saw) return 0;
    return entry.first / entry.saw;
  }

  function statusLabel(percent) {
    if (!percent) return "Off 0%";
    if (percent <= 10) return "Pilot " + percent + "%";
    return "Live " + percent + "%";
  }

  function funnel() {
    let sawSum = 0;
    let first = 0;
    let completed = 0;
    const entryRows = DATA.entries.map((entry) => {
      const scaled = scaleEntry(entry, state.rollout[entry.id]);
      sawSum += scaled.saw;
      first += scaled.first;
      completed += scaled.completed;
      return { id: entry.id, label: entry.label, rate: entry.rate, saw: scaled.saw, first: scaled.first, completed: scaled.completed };
    });
    const nudgeRows = DATA.nudges.map((nudge) => {
      const on = !!state.nudges[nudge.id].on;
      let starts = 0;
      let done = 0;
      let sends = 0;
      if (on && nudge.id !== "N6" && nudge.starts != null) {
        starts = nudge.starts;
        sends = nudge.sends || 0;
        if (nudge.completion != null) done = nudge.starts * nudge.completion;
        first += starts;
        completed += done;
      }
      return { id: nudge.id, name: nudge.name, on: on, sends: on ? sends : 0, starts: starts, done: done, optOut: nudge.optOut, complaints: nudge.complaints };
    });
    const firstR = Math.round(first);
    const compR = Math.round(completed);
    const returnRate = state.nudges.N6.on ? 0.34 : 0.28;
    return {
      saw: Math.min(DATA.eligible, Math.round(sawSum * 0.75)),
      first: firstR,
      completed: compR,
      completedPct: firstR ? compR / firstR : 0,
      returned: Math.round(compR * returnRate),
      returnRate: returnRate,
      second: 650,
      entryRows: entryRows,
      nudgeRows: nudgeRows
    };
  }

  function nextStep(percent) {
    const index = DATA.steps.indexOf(percent);
    if (index < 0 || index === DATA.steps.length - 1) return null;
    return DATA.steps[index + 1];
  }

  function entryDecision(entry) {
    const scaled = scaleEntry(entry, state.rollout[entry.id]);
    const fails = [];
    if (entry.rate != null && entry.rate < 0.70) fails.push("Synthetic completion is " + pct(entry.rate) + ", under 70%.");
    if (entry.repeat != null && entry.repeat > 0.08) fails.push("Synthetic repeat contact is " + pct(entry.repeat) + ", over 8%.");
    if (entry.handoff != null && entry.handoff > 0.25) fails.push("Synthetic handoff is " + pct(entry.handoff) + ", over 25%.");
    const exposures = Math.round(scaled.saw);
    if (exposures < 1000) fails.push("Synthetic exposures are " + fmt(exposures) + ", under 1,000.");
    if (fails.length) {
      return {
        id: entry.id,
        name: entry.label,
        verdict: "Hold",
        target: "",
        cls: "pill-hold",
        reason: fails.join(" ") + " A guardrail fail beats growth."
      };
    }
    const current = state.rollout[entry.id];
    if (!current || exposures === 0) {
      return {
        id: entry.id,
        name: entry.label,
        verdict: "Test",
        target: 10,
        cls: "pill-test",
        reason: "Synthetic exposures are 0. The sample forecast is at 10%. Test at 10%."
      };
    }
    if (current >= 100) {
      return {
        id: entry.id,
        name: entry.label,
        verdict: "Keep",
        target: "",
        cls: "pill-keep",
        reason: "Synthetic guardrails pass and this entry is already at 100%."
      };
    }
    const upcoming = nextStep(current);
    let reason = "Synthetic guardrails pass.";
    if (entry.rate != null) reason += " Completion is " + pct(entry.rate) + ".";
    if (entry.repeat != null) reason += " Repeat contact is " + pct(entry.repeat) + ".";
    if (entry.handoff != null) reason += " Handoff is " + pct(entry.handoff) + ".";
    reason += " Next rollout step is " + upcoming + "%.";
    return { id: entry.id, name: entry.label, verdict: "Scale", target: upcoming, cls: "pill-scale", reason: reason };
  }

  function nudgeDecision(nudge) {
    const cfg = state.nudges[nudge.id];
    if (nudge.id === "N5") {
      return {
        id: "N5",
        name: nudge.name,
        verdict: "Roll back",
        target: "",
        cls: "pill-back",
        reason: "The pilot grew first use (225 starts), but opt-out is 2.4% per send and complaints are 3.1 per 10,000. Both broke the guardrail. A guardrail fail beats growth."
      };
    }
    if (nudge.id === "N6") {
      return {
        id: "N6",
        name: nudge.name,
        verdict: "Test",
        target: 10,
        cls: "pill-test",
        reason: cfg.on
          ? "N6 is on in this session. Synthetic return use moves to 34%. Test at 10% until there are 1,000 exposures."
          : "No live exposures yet. Forecast opt-out is 0.9% per send. Test at 10%."
      };
    }
    if (nudge.optOut != null && nudge.optOut > 0.015) {
      return { id: nudge.id, name: nudge.name, verdict: "Roll back", target: "", cls: "pill-back", reason: "Synthetic opt-out is over 1.5% per send. Roll back." };
    }
    if (nudge.complaints != null && nudge.complaints > 2) {
      return { id: nudge.id, name: nudge.name, verdict: "Roll back", target: "", cls: "pill-back", reason: "Synthetic complaints are over 2 per 10,000. Roll back." };
    }
    const exposures = nudge.sends || 0;
    if (!cfg.on && !exposures) {
      return { id: nudge.id, name: nudge.name, verdict: "Test", target: "", cls: "pill-test", reason: "This rule is off. Test it before a wider step." };
    }
    if (exposures < 1000) {
      return { id: nudge.id, name: nudge.name, verdict: "Hold", target: "", cls: "pill-hold", reason: "Rates pass, but synthetic exposures are " + fmt(exposures) + ", under 1,000. Hold." };
    }
    let reason = "Synthetic guardrails pass.";
    if (nudge.optOut != null) reason += " Opt-out is " + pct1(nudge.optOut) + " per send.";
    if (nudge.completion != null) reason += " Completion is " + pct(nudge.completion) + ".";
    reason += " Keep the rule as it is.";
    return { id: nudge.id, name: nudge.name, verdict: "Keep", target: "", cls: "pill-keep", reason: reason };
  }

  function decisions() {
    return DATA.entries.map(entryDecision).concat(DATA.nudges.map(nudgeDecision));
  }

  function memo() {
    const lines = ["Agent Discovery Lab decision note. Synthetic.", "Nothing in this note is sent.", ""];
    decisions().forEach((item) => {
      const target = item.target ? " to " + item.target + "%" : "";
      lines.push(item.id + " " + item.name + ": " + item.verdict + target + ". " + item.reason);
    });
    return lines.join("\n");
  }

  function priorityNote() {
    const a = state.nudges.N1.priority;
    const b = state.nudges.N3.priority;
    if (a === b) return "If N1 and N3 both fire for one customer on one day, N1 wins the tie because it is the earlier rule.";
    const winner = a < b ? "N1" : "N3";
    const loser = winner === "N1" ? "N3" : "N1";
    const winP = winner === "N1" ? a : b;
    const loseP = winner === "N1" ? b : a;
    return "If N1 and N3 both fire for one customer on one day, " + winner + " wins. Priority " + winP + " beats priority " + loseP + ". Priority 1 is first.";
  }

  function whyText() {
    const cap = state.caps.per7;
    const word = cap === 1 ? "tip" : "tips";
    return "You have account alerts on. We show at most " + cap + " " + word + " a week.";
  }

  function stat(label, value) {
    return '<div class="stat"><div class="label">Synthetic ' + esc(label) + '</div><div class="stat-num">' + esc(value) + "</div></div>";
  }

  function footer() {
    return '<footer class="site-footer"><p><a href="https://amiteshdwivedijhu-ship-it.github.io/">Prototype by Amitesh Dwivedi</a></p><p>Sample data. Not affiliated with JPMorgan Chase.</p></footer>';
  }

  function phoneHtml() {
    const person = persona();
    const events = decidePersona(person).filter((ev) => ev.status === "Sent");
    const surface = state.phone.surface;
    const entry = entryBySurface(surface);
    const rollout = entry ? state.rollout[entry.id] : 0;
    const chips = SURFACES.map((name) => {
      return '<button type="button" class="choice" data-action="surface" data-surface="' + name + '" aria-pressed="' +
        (surface === name ? "true" : "false") + '">' + name + "</button>";
    }).join("");
    const talk = '<button type="button" class="btn" data-action="handoff">Talk to a person</button>';
    if (state.phone.view === "handoff") {
      return '<div class="phone" id="bank-phone"><p class="bank-mark">Sample Bank</p>' +
        '<div class="tile"><p><strong>Connecting you to a specialist.</strong> They will see this chat, so you will not repeat yourself. About 3 minutes (sample).</p></div>' +
        '<button type="button" class="btn" data-action="phone-back">Back</button></div>';
    }
    let body = "";
    if (state.phone.view === "chat" || state.phone.view === "confirm" || state.phone.view === "done") {
      body += '<div class="chat-head"><strong>Assistant</strong>' + talk + "</div>";
      if (person.id === "C-01") {
        if (state.phone.view === "chat") {
          body += '<div class="bubble">' + esc(DATA.chat.prompt) + "</div>" +
            '<button type="button" class="btn btn-blue" data-action="pick-charge">The extra $42.18 charge</button>';
        } else if (state.phone.view === "confirm") {
          body += '<div class="bubble">' + esc(DATA.chat.confirm) + "</div>" +
            '<button type="button" class="btn btn-blue" data-action="confirm-dispute">Confirm</button>';
        } else {
          body += '<div class="bubble">' + esc(DATA.chat.done) + "</div>";
        }
      } else {
        body += '<div class="bubble">I can help with that (sample). If you want a person, tap Talk to a person.</div>';
      }
    } else if (surface === "Home") {
      body += '<div class="chat-head"><strong>Home</strong>' + talk + "</div>";
      body += '<div class="tile"><div class="label">Checking (sample)</div><div>$2,480.16</div></div>';
      body += '<div class="tile"><div class="label">Savings (sample)</div><div>$9,120.00</div></div>';
      if (state.rollout.E1 > 0) {
        body += '<button type="button" class="btn btn-blue" data-action="open-chat">Ask or search</button>';
        body += '<p class="muted">Entry E1 is ' + esc(statusLabel(state.rollout.E1)) + ".</p>";
      } else {
        body += "<p>The home ask bar is off.</p>";
      }
      if (state.phone.push) {
        const pushText = events[0] ? (events[0].card || state.nudges[events[0].rule].message) : "No push is waiting in this sample.";
        body += '<div class="push"><div class="label">Push preview</div><p>Sample Bank: ' + esc(pushText) + "</p></div>";
      }
      body += '<button type="button" class="btn" data-action="push">Show push preview</button>';
      events.forEach((ev) => {
        const text = ev.card || state.nudges[ev.rule].message;
        body += '<div class="tile"><div class="label">' + esc(ev.rule) + " · " + esc(staticNudge(ev.rule).name) + "</div><p>" + esc(text) + "</p>";
        if (state.phone.stop && staticNudge(ev.rule).tip) body += "<p><strong>You stopped tips like this.</strong></p>";
        body += '<div class="stack"><button type="button" class="btn" data-action="why">Why am I seeing this?</button>' +
          '<button type="button" class="btn" data-action="stop">Stop tips like this</button>';
        if (person.id === "C-01" && ev.rule === "N1") body += '<button type="button" class="btn btn-blue" data-action="open-chat">Review this charge</button>';
        body += "</div>";
        if (state.phone.why) body += '<div class="why">' + esc(whyText()) + "</div>";
        body += "</div>";
      });
      if (!events.length) body += "<p>No nudge card for this customer right now.</p>";
      if (state.nudges.N6.on) {
        body += '<div class="tile"><div class="label">N6</div><p>' + esc(state.nudges.N6.message) + "</p>" +
          '<div class="stack"><button type="button" class="btn" data-action="why">Why am I seeing this?</button>' +
          '<button type="button" class="btn" data-action="stop">Stop tips like this</button></div>';
        if (state.phone.why) body += '<div class="why">' + esc(whyText()) + "</div>";
        body += "</div>";
      }
    } else {
      const prompts = {
        Charge: "Something wrong with this charge?",
        Card: "Lost, stolen, or damaged card?",
        Fee: "Ask about this fee",
        Help: "Chat with the assistant",
        Paid: "Set up autopay with the assistant"
      };
      body += '<div class="chat-head"><strong>' + esc(surface) + "</strong>" + talk + "</div>";
      body += "<p>" + esc(entry ? entry.task : "") + "</p>";
      if (rollout > 0) {
        body += '<p class="muted">' + esc(statusLabel(rollout)) + ".</p>";
        body += '<button type="button" class="btn btn-blue" data-action="open-chat">' + esc(prompts[surface]) + "</button>";
      } else {
        body += "<p>This entry point is off.</p>";
      }
    }
    return '<div class="phone" id="bank-phone"><p class="bank-mark">Sample Bank</p>' +
      '<div class="choice-row" aria-label="App surface">' + chips + "</div>" + body + "</div>";
  }

  function screenEntry() {
    const cards = DATA.entries.map((entry) => {
      const percent = state.rollout[entry.id];
      const scaled = scaleEntry(entry, percent);
      const steps = DATA.steps.map((step) => {
        return '<button type="button" class="step" data-action="roll" data-id="' + entry.id + '" data-pct="' + step + '" aria-pressed="' +
          (percent === step ? "true" : "false") + '">' + step + "%</button>";
      }).join("");
      const rateNote = entry.id === "E6" ? " at the 10% forecast" : "";
      return '<article class="card"><h3>' + esc(entry.id) + " " + esc(entry.label) + "</h3>" +
        "<p>" + esc(entry.task) + ". Status: " + esc(statusLabel(percent)) + ".</p>" +
        '<div class="stats">' +
        stat("saw", fmt(scaled.saw)) +
        stat("first use", fmt(scaled.first)) +
        stat("completion", entry.rate == null ? "n/a" : pct(entry.rate)) +
        stat("start rate" + rateNote, pct(startRate(entry))) +
        "</div><div class=\"label\" style=\"margin-top:8px\">Rollout step</div><div class=\"stepper\">" + steps + "</div></article>";
    }).join("");
    return '<section class="card"><h2>Entry points</h2><p>On a strange charge (E2), 13% start the assistant. In the search bar (E1), 5% start. Raise a rollout step and the funnel and phone preview update.</p></section>' + cards;
  }

  function screenNudges() {
    const cards = DATA.nudges.map((nudge) => {
      const cfg = state.nudges[nudge.id];
      const consent = nudge.feature ? "Marketing consent and a Comms approval tag" : (nudge.needsPush ? "Push consent" : "In-app, no push consent");
      const sends = nudge.sends == null ? "Off" : fmt(nudge.sends);
      const starts = nudge.starts == null ? "n/a" : fmt(nudge.starts);
      const opt = nudge.optOut == null ? "n/a" : pct1(nudge.optOut);
      return '<article class="card"><h3>' + esc(nudge.id) + " " + esc(nudge.name) + "</h3>" +
        "<p>" + esc(nudge.channel) + ". " + esc(nudge.type) + ". Consent needed: " + esc(consent) + ".</p>" +
        '<div class="stats">' + stat("sends", sends) + stat("starts", starts) + stat("opt-out per send", nudge.id === "N6" && !cfg.on ? "forecast " + opt : opt) + "</div>" +
        (nudge.complaints != null ? "<p>Synthetic complaints " + nudge.complaints + " per 10,000.</p>" : "") +
        '<div class="btn-row" style="margin-top:8px"><button type="button" class="choice" data-action="toggle-nudge" data-id="' + nudge.id + '" aria-pressed="' +
        (cfg.on ? "true" : "false") + '">' + (cfg.on ? "On" : "Off") + "</button></div>" +
        '<label class="field"><span class="label">Priority (1 is first)</span><input data-priority="' + nudge.id + '" type="number" min="1" max="9" value="' + cfg.priority + '"></label>' +
        '<label class="field"><span class="label">Message</span><textarea data-message="' + nudge.id + '">' + esc(cfg.message) + "</textarea></label>" +
        (nudge.feature ? '<button type="button" class="choice" data-action="comms" data-id="' + nudge.id + '" aria-pressed="' + (cfg.commsTag ? "true" : "false") + '">Comms approval tag: ' + (cfg.commsTag ? "on" : "off") + "</button>" : "") +
        "</article>";
    }).join("");
    return '<section class="card"><h2>Nudge rules</h2><p>A nudge is sent only when consent, caps, quiet hours, and suppression all pass, and the message can explain itself.</p>' +
      "<ol><li>The customer has consent for that channel. Feature promotion also needs marketing consent and a Comms approval tag.</li>" +
      "<li>Caps are not hit: at most " + state.caps.per7 + " assistant nudge" + (state.caps.per7 === 1 ? "" : "s") + " per 7 days and " + state.caps.per30 + " per 30 days.</li>" +
      "<li>It is not quiet hours (" + esc(quietLabel()) + ") unless the rule is time-critical servicing.</li>" +
      "<li>No suppression applies: opted out of tips, a complaint in the last 30 days, an open fraud case, or a task already done.</li>" +
      "<li>The message has Why am I seeing this? and a one-tap Stop tips like this.</li></ol>" +
      "<p>" + esc(priorityNote()) + "</p></section>" +
      '<section class="card"><h3>Caps</h3><div class="stats">' +
      '<label class="field"><span class="label">Per 7 days</span><input id="cap-7" type="number" min="0" max="10" value="' + state.caps.per7 + '"></label>' +
      '<label class="field"><span class="label">Per 30 days</span><input id="cap-30" type="number" min="0" max="10" value="' + state.caps.per30 + '"></label>' +
      '<label class="field"><span class="label">Quiet hours start</span><select id="quiet-start">' + hourOptions(state.caps.quietStart) + "</select></label>" +
      '<label class="field"><span class="label">Quiet hours end</span><select id="quiet-end">' + hourOptions(state.caps.quietEnd) + "</select></label>" +
      "</div><p class=\"muted\">Set the weekly cap to 2 and Maya R. gets the Oct 3 bill nudge. The seed cap is 1, so that nudge stays suppressed.</p></section>" + cards;
  }

  function hourOptions(selected) {
    let html = "";
    for (let hour = 0; hour < 24; hour += 1) {
      html += '<option value="' + hour + '"' + (hour === selected ? " selected" : "") + ">" + hourLabel(hour) + "</option>";
    }
    return html;
  }

  function screenSim() {
    const person = persona();
    const chips = DATA.personas.map((row) => {
      return '<button type="button" class="choice" data-action="persona" data-id="' + row.id + '" aria-pressed="' +
        (row.id === person.id ? "true" : "false") + '">' + esc(row.name) + " " + row.id + "</button>";
    }).join("");
    const decided = decidePersona(person);
    const days = [];
    for (let day = 1; day <= 14; day += 1) days.push("Oct " + day);
    const list = days.map((day) => {
      const rows = decided.filter((ev) => ev.date === day);
      if (!rows.length) return '<div class="day"><p class="label">' + day + '</p><p>No nudge event.</p></div>';
      return '<div class="day"><p class="label">' + day + "</p>" + rows.map((ev) => {
        if (ev.kind === "note") return "<p>" + esc(ev.text) + "</p>";
        if (ev.kind === "handoff") return '<span class="pill pill-hold">Handoff</span><p>' + esc(ev.text) + "</p>";
        const cls = ev.status === "Sent" ? "pill-sent" : "pill-stop";
        const name = ev.rule ? staticNudge(ev.rule).name : "";
        return '<span class="pill ' + cls + '">' + esc(ev.status) + "</span><p>" + esc(ev.rule) + " " + esc(name) + ". " + esc(ev.reason) + "</p>";
      }).join("") + "</div>";
    }).join("");
    return '<section class="card"><h2>Customer simulator</h2><p>Oct 1 to Oct 14. Sent or Suppressed, with the reason in words. Sent nudges show on the phone preview.</p>' +
      '<div class="choice-row">' + chips + '</div><p>' + esc(person.note) + "</p></section>" +
      '<section class="card" id="sim-results">' + list + "</section>";
  }

  function screenPhonePage() {
    return '<section class="card"><h2>Phone preview</h2><p>This is the customer app, Sample Bank. Open the nudge, ask why it is here, file the dispute, or talk to a person.</p>' +
      "<p>For Maya R., the dispute is three taps: Review this charge, the extra charge, then Confirm.</p></section>";
  }

  function screenHandoff() {
    const floor = DATA.h5Floors[Number(state.h5).toFixed(2)];
    const buttons = [0.60, 0.70, 0.80].map((value) => {
      return '<button type="button" class="choice" data-action="h5" data-floor="' + value.toFixed(2) + '" aria-pressed="' +
        (Number(state.h5).toFixed(2) === value.toFixed(2) ? "true" : "false") + '">' + value.toFixed(2) + "</button>";
    }).join("");
    const rows = DATA.handoffs.map((rule) => {
      const share = rule.id === "H5" ? floor.h5Share : rule.share;
      const extra = rule.note ? " " + rule.note + "." : "";
      return '<article class="card"><h3>' + esc(rule.id) + "</h3><p>" + esc(rule.condition) + "</p><p>Destination: " + esc(rule.destination) + ".</p>" +
        "<p>Synthetic share of sessions: " + pctFlex(share) + "." + esc(extra) + "</p></article>";
    }).join("");
    return '<section class="card"><h2>Handoff rules</h2><p>Talk to a person is always one tap in the customer chat. These are the rules and the synthetic share of sessions. The share split is a sample of the 15% seed handoff rate.</p>' +
      '<div class="stats">' + stat("handoff rate", pct(floor.handoff)) + stat("completion", pct(floor.completion)) + "</div>" +
      "<p>H5 confidence floor moves the handoff rate and completion. A higher floor sends more chats to a person. In this sample both numbers rise.</p>" +
      '<div class="label">H5 confidence floor</div><div class="choice-row">' + buttons + "</div></section>" + rows;
  }

  function pctFlex(n) {
    const value = Math.round(n * 1000) / 10;
    return String(value).replace(/\.0$/, "") + "%";
  }

  function screenFunnel() {
    const numbers = funnel();
    const entryTable = '<div class="table-wrap"><table><thead><tr><th>Entry</th><th>Synthetic saw</th><th>Synthetic first use</th><th>Synthetic completed</th></tr></thead><tbody>' +
      numbers.entryRows.map((row) => "<tr><td>" + esc(row.id) + "</td><td>" + fmt(row.saw) + "</td><td>" + fmt(row.first) + "</td><td>" + (row.rate == null ? "n/a" : fmt(row.completed)) + "</td></tr>").join("") +
      "</tbody></table></div>";
    const nudgeTable = '<div class="table-wrap"><table><thead><tr><th>Nudge</th><th>Synthetic sends</th><th>Synthetic starts</th><th>Synthetic completed</th><th>Synthetic opt-out</th></tr></thead><tbody>' +
      numbers.nudgeRows.map((row) => "<tr><td>" + esc(row.id) + (row.on ? "" : " off") + "</td><td>" + fmt(row.sends) + "</td><td>" + fmt(row.starts) + "</td><td>" + fmt(row.done) + "</td><td>" + (row.optOut == null ? "n/a" : pct1(row.optOut)) + "</td></tr>").join("") +
      "</tbody></table></div>";
    return '<section class="card"><h2>Funnel and trust</h2><p>Per 100,000 eligible app users per 30 days. All figures on this screen are Synthetic.</p>' +
      '<div class="stats" id="funnel-numbers">' +
      stat("eligible", fmt(DATA.eligible)) +
      stat("saw", fmt(numbers.saw)) +
      stat("first use", fmt(numbers.first)) +
      stat("completed", fmt(numbers.completed) + " (" + pct(numbers.completedPct) + ")") +
      stat("returned within 30 days", fmt(numbers.returned)) +
      stat("second task type", fmt(numbers.second)) +
      "</div><p id=\"funnel-returned\">Synthetic returned within 30 days is " + fmt(numbers.returned) + " at a " + pct(numbers.returnRate) + " return rate." +
      (state.nudges.N6.on ? " N6 is on, so the rate is 34%." : " Turn N6 on to move the rate from 28% to 34%.") +
      " Second task type stays at the seed count of 650. The sample does not give a new count for N6.</p></section>" +
      '<section class="card"><h3>Synthetic trust</h3><div class="stats">' +
      stat("handoff rate", pct(DATA.h5Floors[Number(state.h5).toFixed(2)].handoff)) +
      stat("repeat contact in 7 days", pct(DATA.trustSeed.repeat)) +
      stat("opt-out per send", pct1(DATA.trustSeed.optOut)) +
      stat("complaints per 10,000", String(DATA.trustSeed.complaints)) +
      stat("handoffs with chat summary", pct(DATA.trustSeed.summary)) +
      "</div><p class=\"muted\">Headline trust is the seed. Handoff rate follows the H5 floor. N5 rates stay on the N5 decision, because the seed measured the funnel with N5 off.</p></section>" +
      '<section class="card"><h3>By entry point</h3>' + entryTable + "<h3>By nudge</h3>" + nudgeTable + "</section>";
  }

  function screenDecisions() {
    const cards = decisions().map((item) => {
      const target = item.target ? " to " + item.target + "%" : "";
      return '<article class="card"><h3>' + esc(item.id) + "</h3><span class=\"pill " + item.cls + "\">" + esc(item.verdict + target) + "</span><p>" + esc(item.reason) + "</p></article>";
    }).join("");
    return '<section class="card"><h2>Scale decisions</h2><p>A guardrail fail means Hold or Roll back, whatever the growth numbers say. Nothing is sent.</p><ul>' +
      DATA.guardrails.map((line) => "<li>" + esc(line) + "</li>").join("") + "</ul></section>" +
      '<div id="decision-list">' + cards + "</div>" +
      '<section class="card"><h3>Decision note</h3><label class="field"><span class="label">Plain text memo</span><textarea id="decision-note" readonly>' +
      esc(memo()) + "</textarea></label>" +
      '<button type="button" class="btn btn-primary" data-action="copy">Copy decision note</button>' +
      '<p id="copy-status">' + esc(state.copyStatus) + "</p></section>";
  }

  function screenHtml() {
    if (state.screen === "nudges") return screenNudges();
    if (state.screen === "sim") return screenSim();
    if (state.screen === "phone") return screenPhonePage();
    if (state.screen === "handoff") return screenHandoff();
    if (state.screen === "funnel") return screenFunnel();
    if (state.screen === "decisions") return screenDecisions();
    return screenEntry();
  }

  function shell(body) {
    const nav = SCREENS.map(([id, label]) => {
      return '<button type="button" class="nav-btn" data-action="screen" data-screen="' + id + '"' +
        (state.screen === id ? ' aria-current="page"' : "") + ">" + esc(label) + "</button>";
    }).join("");
    const layoutClass = "layout" + (state.screen === "phone" ? " is-phone" : "");
    return '<header class="topbar"><div class="brand"><h1>Agent Discovery Lab</h1><p>Sample planning view</p></div>' +
      '<button type="button" class="btn btn-primary" data-action="reset">Reset demo</button></header>' +
      '<div class="wrap"><div class="banner" role="note"><p><strong>Sample data. Not affiliated with JPMorgan Chase.</strong></p>' +
      "<p>All metrics are Synthetic. The phone app is Sample Bank. Nothing is sent.</p></div>" +
      '<nav class="screen-nav" aria-label="Screens">' + nav + "</nav>" +
      '<div class="' + layoutClass + '"><div class="lab">' + body + '</div><aside class="phone-col">' + phoneHtml() + "</aside></div>" +
      footer() + "</div>";
  }

  function render(keepScroll) {
    const y = keepScroll ? window.scrollY : 0;
    document.getElementById("app").innerHTML = shell(screenHtml());
    window.scrollTo(0, keepScroll ? y : 0);
  }

  function refresh() {
    save();
    render(true);
  }

  function go(screen) {
    state.screen = screen;
    save();
    render(false);
  }

  document.getElementById("app").addEventListener("change", (e) => {
    if (e.target.id === "cap-7") state.caps.per7 = clampNum(e.target.value, 0, 10, 1);
    else if (e.target.id === "cap-30") state.caps.per30 = clampNum(e.target.value, 0, 10, 3);
    else if (e.target.id === "quiet-start") state.caps.quietStart = clampNum(e.target.value, 0, 23, 21);
    else if (e.target.id === "quiet-end") state.caps.quietEnd = clampNum(e.target.value, 0, 23, 8);
    else if (e.target.dataset.priority) state.nudges[e.target.dataset.priority].priority = clampNum(e.target.value, 1, 9, 1);
    else if (e.target.dataset.message) {
      state.nudges[e.target.dataset.message].message = e.target.value;
      save();
      return;
    } else return;
    refresh();
  });

  document.getElementById("app").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    if (action === "reset") {
      localStorage.removeItem(KEY);
      state = seed();
      save();
      render(false);
      return;
    }
    if (action === "screen") {
      go(btn.getAttribute("data-screen"));
      return;
    }
    if (action === "roll") {
      state.rollout[btn.getAttribute("data-id")] = Number(btn.getAttribute("data-pct"));
      refresh();
      return;
    }
    if (action === "toggle-nudge") {
      const id = btn.getAttribute("data-id");
      state.nudges[id].on = !state.nudges[id].on;
      refresh();
      return;
    }
    if (action === "comms") {
      const id = btn.getAttribute("data-id");
      state.nudges[id].commsTag = !state.nudges[id].commsTag;
      refresh();
      return;
    }
    if (action === "persona") {
      state.persona = btn.getAttribute("data-id");
      state.phone.view = "surface";
      state.phone.why = false;
      state.phone.push = false;
      refresh();
      return;
    }
    if (action === "surface") {
      state.phone.surface = btn.getAttribute("data-surface");
      state.phone.view = "surface";
      refresh();
      return;
    }
    if (action === "why") {
      state.phone.why = !state.phone.why;
      refresh();
      return;
    }
    if (action === "stop") {
      state.phone.stop = true;
      refresh();
      return;
    }
    if (action === "push") {
      state.phone.push = !state.phone.push;
      refresh();
      return;
    }
    if (action === "open-chat") {
      state.phone.back = "surface";
      state.phone.view = "chat";
      refresh();
      return;
    }
    if (action === "pick-charge") {
      state.phone.view = "confirm";
      refresh();
      return;
    }
    if (action === "confirm-dispute") {
      state.phone.view = "done";
      refresh();
      return;
    }
    if (action === "handoff") {
      state.phone.back = state.phone.view;
      state.phone.view = "handoff";
      refresh();
      return;
    }
    if (action === "phone-back") {
      state.phone.view = state.phone.back || "surface";
      refresh();
      return;
    }
    if (action === "h5") {
      state.h5 = Number(btn.getAttribute("data-floor"));
      refresh();
      return;
    }
    if (action === "copy") {
      const note = document.getElementById("decision-note");
      const status = document.getElementById("copy-status");
      const done = (text) => { if (status) status.textContent = text; };
      try {
        note.focus();
        note.select();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(note.value).then(() => done("Copied. Nothing is sent.")).catch(() => done("The note is selected above. Nothing is sent."));
        } else done("The note is selected above. Nothing is sent.");
      } catch (err) {
        done("The note is selected above. Nothing is sent.");
      }
    }
  });

  render(false);
})();
