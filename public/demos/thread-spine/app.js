(function () {
  var DATA = window.SPINE_DATA;
  var KEY = "thread-spine-demo-v1";
  var root = document.getElementById("app");

  var state = load();

  function fresh() {
    return {
      screen: "desk",
      threadId: "jordan",
      tab: "spine",
      step: 99,
      guardrails: {
        legal: true,
        written: true,
        disclosure: true
      },
      scenario: "legal",
      timeout: false,
      last: null,
      handoff: null,
      qualityOpen: false
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return fresh();
      var parsed = JSON.parse(raw);
      var base = fresh();
      base.screen = parsed.screen || base.screen;
      base.threadId = parsed.threadId || base.threadId;
      base.tab = parsed.tab || base.tab;
      base.step = typeof parsed.step === "number" ? parsed.step : 99;
      base.guardrails = Object.assign(base.guardrails, parsed.guardrails || {});
      base.scenario = parsed.scenario || base.scenario;
      base.timeout = !!parsed.timeout;
      base.last = parsed.last || null;
      base.handoff = parsed.handoff || null;
      base.qualityOpen = !!parsed.qualityOpen;
      return base;
    } catch (err) {
      return fresh();
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function threadById(id) {
    return DATA.threads.filter(function (t) { return t.id === id; })[0];
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function moneyStrip() {
    var contain = 71;
    var handoff = 18;
    var disc = 96;
    var note = "Base week, before this loan's next turn.";
    if (state.last) {
      if (state.last.decision === "handoff") {
        contain = 70;
        handoff = 19;
        note = "Handoff went up by 1. That can be the right outcome.";
      } else if (state.last.decision === "risky") {
        disc = 95;
        note = "Containment did not rise. Disclosure pass fell. A risky contain is not a win.";
      } else if (state.last.decision === "contained") {
        contain = 72;
        note = "Clean contain. The rule and the tool both held.";
      } else if (state.last.decision === "error") {
        note = "Payoff tool failed. No number was spoken. Counts unchanged.";
      }
    }
    return { contain: contain, handoff: handoff, disc: disc, note: note };
  }

  function playTurn() {
    var g = state.guardrails;
    var id = state.scenario;
    if (id === "legal") {
      if (g.legal) {
        state.last = {
          decision: "handoff",
          title: "Handoff",
          spoken: "I hear you. I am not able to talk about lawsuits or repossession. A specialist will take this thread, including your texts and this call.",
          chat: "",
          blocked: DATA.blockedLegal,
          blockedSent: false,
          flags: ["Guardrail held", "Human handoff", "No legal threat spoken"],
          disclosure: "Legal topic routed to a person. The blocked draft is stored, not spoken.",
          tools: []
        };
      } else {
        state.last = {
          decision: "risky",
          title: "Risky contain",
          spoken: DATA.blockedLegal,
          chat: "",
          blocked: "",
          blockedSent: true,
          flags: ["Guardrail off", "Legal consequence without a handoff", "Needs review"],
          disclosure: "The agent stated a legal consequence. That fails the product rule even if the call stays contained.",
          tools: []
        };
      }
    } else if (id === "payoff") {
      if (state.timeout) {
        state.last = {
          decision: "error",
          title: "Tool timeout",
          spoken: "The payoff system did not answer. I will not guess a number. I can retry, or a person can send the quote.",
          chat: "",
          blocked: "",
          blockedSent: false,
          flags: ["payoff_quote timed out", "No dollar amount invented"],
          disclosure: "Silence is safer than a made-up payoff.",
          tools: [
            {
              name: "payoff_quote",
              latency: 2500,
              error: true,
              body: { tool: "payoff_quote", error: "timeout", amount: null }
            }
          ]
        };
      } else if (g.written) {
        state.last = {
          decision: "contained",
          title: "Contained in chat",
          spoken: "I will not read a payoff out loud and hope it is right. I am sending the quote in chat with the good-through date.",
          chat: "Payoff for loan LN-18402 is $8,104.55 if received by Oct 18, 2026. A late payment can change this number. Per day after that date: $3.12.",
          blocked: "",
          blockedSent: false,
          flags: ["Written quote", "Chat follows voice", "Same loan thread"],
          disclosure: "Quote includes the good-through date. Voice did not become the only record.",
          tools: [
            {
              name: "payoff_quote",
              latency: 96,
              body: {
                tool: "payoff_quote",
                loan_id: "LN-18402",
                good_through: "2026-10-18",
                amount: 8104.55,
                per_diem: 3.12,
                channel: "chat",
                latency_ms: 96
              }
            }
          ]
        };
      } else {
        state.last = {
          decision: "risky",
          title: "Spoken quote only",
          spoken: "Your payoff is $8,104.55 through Oct 18. I did not send it in writing.",
          chat: "",
          blocked: "",
          blockedSent: false,
          flags: ["Written-quote rule off", "No readback in chat", "Audit gap"],
          disclosure: "A spoken number with no written quote is a UDAAP risk if the date or fees are unclear.",
          tools: [
            {
              name: "payoff_quote",
              latency: 96,
              body: {
                tool: "payoff_quote",
                loan_id: "LN-18402",
                good_through: "2026-10-18",
                amount: 8104.55,
                channel: "voice_only",
                latency_ms: 96
              }
            }
          ]
        };
      }
    } else if (g.disclosure) {
      state.last = {
        decision: "contained",
        title: "Plan contained",
        spoken: "Before I lock it: this is Northline Auto Finance about your auto loan. You pay $90 on Oct 12 and $90 on Nov 12. Then $312.40 returns. Do you agree?",
        chat: "Jordan agreed on the call. Plan HP-441 is saved. A summary text is on this same thread.",
        blocked: "",
        blockedSent: false,
        flags: ["Disclosure before terms", "Borrower yes", "Contained"],
        disclosure: "Hardship terms came after the servicing line, and the yes is on the thread.",
        tools: [
          {
            name: "commit_hardship_plan",
            latency: 120,
            body: {
              tool: "commit_hardship_plan",
              plan_id: "HP-441",
              status: "active",
              payments: [90, 90],
              resume: 312.4,
              latency_ms: 120
            }
          }
        ]
      };
    } else {
      state.last = {
        decision: "risky",
        title: "Terms before disclosure",
        spoken: "You are on the $90 plan for two months. I saved it.",
        chat: "",
        blocked: "",
        blockedSent: false,
        flags: ["Voice disclosure rule off", "Terms saved with no lead-in", "Compliance gap"],
        disclosure: "The plan tool ran before the borrower heard who was speaking and what the loan was.",
        tools: [
          {
            name: "commit_hardship_plan",
            latency: 120,
            body: {
              tool: "commit_hardship_plan",
              plan_id: "HP-441",
              status: "active",
              disclosure_played: false,
              latency_ms: 120
            }
          }
        ]
      };
    }
    if (state.last.decision === "handoff") state.handoff = state.last;
    state.tab = "next";
    save();
    render();
  }

  function shell(main) {
    return (
      '<div class="page">' +
      '<header class="top">' +
      '<div class="brand">' +
      '<span class="mark" aria-hidden="true"></span>' +
      '<div><p class="eyebrow">Thread Spine</p><h1>One loan across channels</h1></div>' +
      "</div>" +
      '<nav class="nav" aria-label="Primary">' +
      '<button type="button" data-go="desk" class="' + (state.screen === "desk" ? "on" : "") + '">Desk</button>' +
      '<button type="button" data-go="thread" class="' + (state.screen === "thread" ? "on" : "") + '">Loan thread</button>' +
      '<button type="button" data-go="golive" class="' + (state.screen === "golive" ? "on" : "") + '">Go-live</button>' +
      '<button type="button" data-reset="1" class="ghost">Reset demo</button>' +
      "</nav>" +
      "</header>" +
      main +
      '<footer class="foot">Prototype for interview practice. Not affiliated with Salient. Not a Salient product. Synthetic lender and borrowers. No real customer data.</footer>' +
      "</div>"
    );
  }

  function desk() {
    var q = moneyStrip();
    var cards = DATA.threads.map(function (t) {
      var badge = t.status;
      if (t.id === "jordan" && state.last) badge = state.last.title;
      return (
        '<article class="card thread-card">' +
        '<div class="row"><h2>' + esc(t.name) + "</h2><span class=\"pill\">" + esc(badge) + "</span></div>" +
        "<p>" + esc(t.loan) + " · " + esc(t.vehicle) + " · " + esc(t.state) + "</p>" +
        "<p>" + esc(t.blurb) + "</p>" +
        '<div class="chips">' + t.channels.map(function (c) {
          return '<span class="chip ch-' + esc(c.toLowerCase()) + '">' + esc(c) + "</span>";
        }).join("") + "</div>" +
        '<button type="button" data-open="' + esc(t.id) + '">Open thread</button>' +
        "</article>"
      );
    }).join("");

    var qualityBody = state.qualityOpen
      ? '<div class="quality-body"><p>' + esc(q.note) + "</p>" +
        "<ul>" +
        "<li><strong>Containment " + q.contain + "%</strong>. Share of threads that ended without a person. A risky contain stays out of the win column.</li>" +
        "<li><strong>Handoff " + q.handoff + "%</strong>. Share sent to a person on purpose.</li>" +
        "<li><strong>Disclosure pass " + q.disc + "%</strong>. Required lines were said before the risky part.</li>" +
        "<li><strong>Voice first word</strong>. Budget is " + DATA.budgetMs + " ms. Jordan's call was 820 ms. The flag sits on that call.</li>" +
        "</ul>" +
        '<button type="button" data-open="jordan">Open Jordan to see the flags</button></div>'
      : "";

    return shell(
      '<main>' +
      '<section class="lede">' +
      "<p class=\"kicker\">" + esc(DATA.lender.name) + " · synthetic book</p>" +
      "<h2>Same borrower. Text, then voice, then chat. One spine.</h2>" +
      "<p>Lane is the servicing agent for this demo. The desk is one inbox. A text thread does not die when the phone rings.</p>" +
      "</section>" +
      '<section class="quality">' +
      '<div class="stats">' +
      "<p><span>" + q.contain + "%</span> Containment</p>" +
      "<p><span>" + q.handoff + "%</span> Handoff</p>" +
      "<p><span>" + q.disc + "%</span> Disclosure pass</p>" +
      "<p><span>820 ms</span> Jordan voice</p>" +
      "</div>" +
      '<button type="button" data-quality="1">' + (state.qualityOpen ? "Hide quality notes" : "Why these numbers") + "</button>" +
      qualityBody +
      "</section>" +
      '<section class="stack desk-grid">' + cards +
      '<article class="card empty">' +
      "<h2>After-hours chat</h2>" +
      "<p>No open threads. A new chat will land on this same spine, not in a second inbox.</p>" +
      "</article></section></main>"
    );
  }

  function eventCard(ev, index, dim) {
    var tools = (ev.tools || []).map(function (tool) {
      return '<span class="tool">Tool ' + esc(tool.name) + " · " + tool.latency + " ms</span>";
    }).join("");
    var discs = (ev.disclosures || []).map(function (d) {
      return "<li>" + esc(d) + "</li>";
    }).join("");
    var flags = (ev.flags || []).map(function (f) {
      var hot = /820|Over|STOP|suppressed|Do not/i.test(f) ? " hot" : "";
      return '<span class="flag' + hot + '">' + esc(f) + "</span>";
    }).join("");
    return (
      '<article class="event' + (dim ? " dim" : "") + '" id="ev-' + index + '">' +
      '<div class="ev-top"><span class="chip ch-' + esc(ev.channel.toLowerCase()) + '">' + esc(ev.channel) + "</span>" +
      "<time>" + esc(ev.time) + "</time></div>" +
      '<p class="who">' + esc(ev.who) + "</p>" +
      "<blockquote>" + esc(ev.text) + "</blockquote>" +
      '<p class="agent">' + esc(ev.agent) + "</p>" +
      (tools ? '<div class="chips">' + tools + "</div>" : "") +
      (discs ? "<ul class=\"discs\">" + discs + "</ul>" : "") +
      (flags ? '<div class="chips">' + flags + "</div>" : "") +
      "</article>"
    );
  }

  function visibleEvents(t) {
    if (t.id !== "jordan") return t.events.map(function (ev, i) { return eventCard(ev, i, false); }).join("");
    var max = state.step;
    return t.events.map(function (ev, i) {
      return eventCard(ev, i, i > max);
    }).join("");
  }

  function guardrailField(key, label, help) {
    var on = state.guardrails[key];
    return (
      '<label class="switch">' +
      '<input type="checkbox" data-guard="' + key + '"' + (on ? " checked" : "") + ">" +
      "<span>" + esc(label) + "</span>" +
      "</label>" +
      "<p class=\"help\">" + esc(help) + "</p>"
    );
  }

  function resultBlock() {
    var last = state.last;
    if (!last) {
      return '<div class="result wait"><p>No next turn yet. Pick a borrower line and press play.</p></div>';
    }
    var cls = last.decision;
    var tools = (last.tools || []).map(function (tool) {
      return "<pre>" + esc(JSON.stringify(tool.body, null, 2)) + "</pre>";
    }).join("");
    var chat = last.chat
      ? '<div class="chat"><p class="who">Chat on the same loan</p><p>' + esc(last.chat) + "</p></div>"
      : "";
    var blocked = last.blocked
      ? '<div class="blocked"><p class="who">Blocked draft, not spoken</p><p>' + esc(last.blocked) + "</p></div>"
      : "";
    var flags = last.flags.map(function (f) {
      return "<li>" + esc(f) + "</li>";
    }).join("");
    return (
      '<div class="result ' + esc(cls) + '" aria-live="polite">' +
      "<p class=\"kicker\">" + esc(last.title) + "</p>" +
      '<p class="spoken">' + esc(last.spoken) + "</p>" +
      chat + blocked +
      "<ul>" + flags + "</ul>" +
      "<p>" + esc(last.disclosure) + "</p>" +
      tools +
      "</div>"
    );
  }

  function nextPanel() {
    var choices = DATA.scenarios.map(function (s) {
      var on = state.scenario === s.id ? " on" : "";
      return '<button type="button" class="choice' + on + '" data-scenario="' + s.id + '">' + esc(s.label) + "</button>";
    }).join("");
    var current = DATA.scenarios.filter(function (s) { return s.id === state.scenario; })[0];
    var timeout = state.scenario === "payoff"
      ? '<label class="switch"><input type="checkbox" data-timeout="1"' + (state.timeout ? " checked" : "") + "><span>Simulate payoff tool timeout</span></label><p class=\"help\">When this is on, Lane must not invent a payoff.</p>"
      : "";
    return (
      '<section class="panel">' +
      "<h3>Next turn</h3>" +
      "<p>The model can draft a bad line. The product chooses what Jordan is allowed to hear.</p>" +
      guardrailField("legal", "Never discuss legal action without a human handoff", "On: the sue question becomes a handoff. Off: the risky line is spoken.") +
      guardrailField("written", "Payoff quotes go out in writing", "On: voice points to chat. Off: the number is spoken with an audit gap.") +
      guardrailField("disclosure", "Say the servicing line before hardship terms", "On: who we are, then the $90 plan. Off: the plan saves with no lead-in.") +
      '<p class="who">Borrower line</p>' +
      '<div class="choices">' + choices + "</div>" +
      "<blockquote>" + esc(current.borrower) + "</blockquote>" +
      timeout +
      '<button type="button" class="primary" data-play="1">Play next turn</button>' +
      resultBlock() +
      "</section>"
    );
  }

  function auditPanel(t) {
    var items = [];
    t.events.forEach(function (ev) {
      (ev.disclosures || []).forEach(function (d) {
        items.push("<li><span class=\"chip\">" + esc(ev.channel) + "</span> " + esc(d) + "</li>");
      });
    });
    if (state.last && t.id === "jordan") {
      items.push("<li><span class=\"chip\">Next</span> " + esc(state.last.disclosure) + "</li>");
    }
    return (
      '<section class="panel"><h3>Disclosure and audit</h3>' +
      "<p>What an examiner should see without opening a raw log.</p><ul class=\"audit\">" +
      items.join("") + "</ul></section>"
    );
  }

  function toolsPanel(t) {
    var blocks = [];
    t.events.forEach(function (ev) {
      (ev.tools || []).forEach(function (tool) {
        blocks.push("<h3>" + esc(tool.name) + "</h3><pre>" + esc(JSON.stringify(tool.body, null, 2)) + "</pre>");
      });
    });
    if (state.last && t.id === "jordan") {
      (state.last.tools || []).forEach(function (tool) {
        blocks.push("<h3>" + esc(tool.name) + " · next turn</h3><pre>" + esc(JSON.stringify(tool.body, null, 2)) + "</pre>");
      });
    }
    if (!blocks.length) blocks.push("<p>No tool calls on this thread.</p>");
    return '<section class="panel"><h3>Tool calls</h3>' + blocks.join("") + "</section>";
  }

  function handoffPanel(t) {
    if (t.id !== "jordan" || !state.handoff) {
      return (
        '<section class="panel"><h3>Handoff packet</h3>' +
        '<div class="card empty"><p>No handoff yet. On Jordan\'s thread, play "Are you going to sue me?" with the legal guardrail on.</p></div></section>'
      );
    }
    return (
      '<section class="panel"><h3>Handoff packet</h3>' +
      '<article class="card">' +
      "<p><strong>Jordan Hale</strong> · LN-18402 · 2019 Honda Civic · Maryland</p>" +
      "<p>Reason: borrower asked about a lawsuit and repossession. Rule says a person must take that topic.</p>" +
      "<p>Already on the thread: SMS hardship, identity match, $90 draft plan (not locked unless a later turn locked it), voice disclosure.</p>" +
      "<p>Do not repeat a threat. Do not say the blocked draft. The borrower already asked you not to lead with lawsuits.</p>" +
      "<p class=\"spoken\">First line for the human: Jordan, I have your texts and the call. You asked about a $90 plan and about legal action. I will not talk about a lawsuit. We can finish the plan or the written payoff.</p>" +
      "<p>Blocked draft stored for audit only: " + esc(DATA.blockedLegal) + "</p>" +
      "</article></section>"
    );
  }

  function threadScreen() {
    var t = threadById(state.threadId) || DATA.threads[0];
    var tabs = [
      ["spine", "Spine"],
      ["audit", "Audit"],
      ["tools", "Tools"],
      ["next", "Next turn"],
      ["handoff", "Handoff"]
    ];
    var tabBar = tabs.map(function (pair) {
      if (pair[0] === "next" && t.id !== "jordan") return "";
      var on = state.tab === pair[0] ? " on" : "";
      return '<button type="button" class="tab' + on + '" data-tab="' + pair[0] + '">' + pair[1] + "</button>";
    }).join("");

    var body = "";
    if (state.tab === "audit") body = auditPanel(t);
    else if (state.tab === "tools") body = toolsPanel(t);
    else if (state.tab === "handoff") body = handoffPanel(t);
    else if (state.tab === "next" && t.id === "jordan") body = nextPanel();
    else {
      var walk = "";
      if (t.id === "jordan") {
        var extra = state.step === 99 ? "" : '<button type="button" data-showall="1">Show full spine</button>';
        walk = '<div class="walk"><button type="button" data-step="1">Step through the story</button>' + extra + '<p class="help">Each press moves to the next channel event, then opens Next turn.</p></div>';
      }
      body = walk + '<div class="spine">' + visibleEvents(t) + "</div>";
    }

    return shell(
      "<main>" +
      '<p class="kicker"><button type="button" class="linkish" data-go="desk">Back to desk</button></p>' +
      '<header class="loan-head">' +
      "<h2>" + esc(t.name) + "</h2>" +
      "<p>" + esc(t.loan) + " · " + esc(t.vehicle) + " · " + esc(t.state) + "</p>" +
      "<p>Balance " + esc(t.balance) + " · Past due " + esc(t.pastDue) + " · Due " + esc(t.due) + "</p>" +
      '<div class="chips">' + t.channels.map(function (c) {
        return '<span class="chip ch-' + c.toLowerCase() + '">' + esc(c) + "</span>";
      }).join("") + "</div>" +
      "</header>" +
      '<div class="tabs" role="tablist">' + tabBar + "</div>" +
      body +
      "</main>"
    );
  }

  function goLive() {
    var cards = DATA.workflows.map(function (w) {
      var cls = w.state.toLowerCase();
      return (
        '<article class="card">' +
        '<div class="row"><h2>' + esc(w.name) + '</h2><span class="pill ' + esc(cls) + '">' + esc(w.state) + "</span></div>" +
        "<p>" + esc(w.note) + "</p></article>"
      );
    }).join("");
    var pct = Math.round((DATA.lender.day / DATA.lender.target) * 100);
    return shell(
      "<main>" +
      '<section class="lede">' +
      "<p class=\"kicker\">Time to live · " + esc(DATA.lender.name) + "</p>" +
      "<h2>Day " + DATA.lender.day + " of " + DATA.lender.target + ".</h2>" +
      "<p>Contract signed " + esc(DATA.lender.signed) + ". Target is a full servicing set in 28 days. Two workflows are not live, and neither one is a model prompt.</p>" +
      '<div class="bar" aria-label="Go-live progress"><span style="width:' + pct + '%"></span></div>' +
      "</section>" +
      '<section class="stack desk-grid">' + cards + "</section>" +
      "</main>"
    );
  }

  function render() {
    var html = "";
    if (state.screen === "golive") html = goLive();
    else if (state.screen === "thread") html = threadScreen();
    else html = desk();
    root.innerHTML = html;
  }

  root.addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn) return;
    if (btn.dataset.go) {
      state.screen = btn.dataset.go;
      if (state.screen === "thread" && !threadById(state.threadId)) state.threadId = "jordan";
      save();
      render();
      return;
    }
    if (btn.dataset.reset) {
      localStorage.removeItem(KEY);
      state = fresh();
      save();
      render();
      return;
    }
    if (btn.dataset.open) {
      state.threadId = btn.dataset.open;
      state.screen = "thread";
      state.tab = "spine";
      state.step = 99;
      save();
      render();
      return;
    }
    if (btn.dataset.quality) {
      state.qualityOpen = !state.qualityOpen;
      save();
      render();
      return;
    }
    if (btn.dataset.tab) {
      state.tab = btn.dataset.tab;
      save();
      render();
      return;
    }
    if (btn.dataset.scenario) {
      state.scenario = btn.dataset.scenario;
      save();
      render();
      return;
    }
    if (btn.dataset.play) {
      playTurn();
      return;
    }
    if (btn.dataset.step) {
      var t = threadById("jordan");
      var lastIndex = t.events.length - 1;
      if (state.step === 99) state.step = 0;
      else if (state.step >= lastIndex) {
        state.step = lastIndex;
        state.tab = "next";
        save();
        render();
        return;
      } else state.step += 1;
      save();
      render();
      var node = document.getElementById("ev-" + state.step);
      if (node && node.scrollIntoView) node.scrollIntoView({ block: "nearest" });
      return;
    }
    if (btn.dataset.showall) {
      state.step = 99;
      save();
      render();
    }
  });

  root.addEventListener("change", function (e) {
    var el = e.target;
    if (el.dataset.guard) {
      state.guardrails[el.dataset.guard] = el.checked;
      save();
      return;
    }
    if (el.dataset.timeout) {
      state.timeout = el.checked;
      save();
    }
  });

  render();
})();
