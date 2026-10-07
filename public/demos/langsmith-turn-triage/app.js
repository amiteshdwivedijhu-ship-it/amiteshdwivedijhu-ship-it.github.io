(function () {
  const DATA = window.TURN_DATA;
  const KEY = "langsmith-turn-triage-v1";
  const main = document.getElementById("main");

  function fresh() {
    return {
      screen: "threads",
      failedOnly: false,
      query: "",
      openId: "",
      pendingBreak: {},
      pendingTag: {},
      expected: {},
      confirmed: {},
      queue: [],
      dataset: [],
      engineCards: [],
      backtestRan: "",
      savedRules: [],
      activity: []
    };
  }

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return fresh();
      const parsed = JSON.parse(raw);
      return Object.assign(fresh(), parsed);
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

  function threadById(id) {
    return DATA.threads.find(function (thread) { return thread.id === id; });
  }

  function breakTurnOf(thread) {
    if (state.confirmed[thread.id]) return state.confirmed[thread.id].breakTurn;
    if (state.pendingBreak[thread.id]) return state.pendingBreak[thread.id];
    return thread.breakTurn;
  }

  function tagOf(thread) {
    if (state.confirmed[thread.id]) return state.confirmed[thread.id].tag;
    return thread.tag;
  }

  function log(action, detail) {
    state.activity.unshift({
      at: new Date().toISOString(),
      user: "you (demo)",
      action: action,
      detail: detail
    });
  }

  function formatTime(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString();
  }

  function isEmptyOutput(output) {
    return Array.isArray(output) && output.length === 0;
  }

  function matchesToolRule(thread) {
    return thread.turns.some(function (item) {
      const emptySearch = (item.tools || []).some(function (call) {
        return call.name === "search_flights" && isEmptyOutput(call.output);
      });
      return emptySearch && String(item.assistant || "").indexOf("I found") !== -1;
    });
  }

  function matchesSentimentRule(thread) {
    return thread.turns.some(function (item) {
      return (item.signals || []).indexOf("sentiment drop") !== -1;
    });
  }

  function labeledBreaks(ruleId) {
    return DATA.threads.filter(function (thread) {
      if (thread.resolved && !state.confirmed[thread.id]) return false;
      const tag = tagOf(thread);
      if (ruleId === "tool-ignored") return tag === "Tool result ignored";
      if (ruleId === "sentiment") return (thread.turns || []).some(function (item) {
        return (item.signals || []).indexOf("sentiment drop") !== -1;
      }) && !thread.resolved;
      return false;
    });
  }

  function runBacktest(ruleId) {
    const match = ruleId === "tool-ignored" ? matchesToolRule : matchesSentimentRule;
    const caught = [];
    const missed = [];
    const falseFlags = [];
    DATA.threads.forEach(function (thread) {
      const hit = match(thread);
      const isTarget = ruleId === "tool-ignored"
        ? tagOf(thread) === "Tool result ignored" && (!thread.resolved || state.confirmed[thread.id])
        : !thread.resolved && matchesSentimentRule(thread);
      if (ruleId === "tool-ignored") {
        const labeled = tagOf(thread) === "Tool result ignored" && !thread.resolved;
        if (labeled && hit) caught.push(thread.id);
        else if (labeled && !hit) missed.push(thread.id);
        else if (hit) falseFlags.push(thread.id);
      } else {
        const failed = !thread.resolved;
        if (failed && hit) caught.push(thread.id);
        else if (failed && !hit) missed.push(thread.id);
        else if (!failed && hit) falseFlags.push(thread.id);
      }
    });
    return { caught: caught, missed: missed, falseFlags: falseFlags };
  }

  function rulePasses(result) {
    return result.caught.length >= 3 && result.falseFlags.length <= 1;
  }

  function visibleThreads() {
    return DATA.threads.filter(function (thread) {
      if (state.failedOnly && thread.resolved) return false;
      if (state.query && thread.id.toLowerCase().indexOf(state.query.toLowerCase()) === -1) return false;
      return true;
    });
  }

  function fixLabel(tag, tool) {
    if (tag === "Tool result ignored" && tool === "search_flights") return "search_flights empty result treated as success";
    if (tag === "Lost context") return "agent lost city or date after lookup";
    if (tag === "Wrong tool") return "wrong tool called before a real search";
    if (tag === "Policy miss") return "voucher went over the $150 cap";
    if (tag === "Asked again") return "traveler had to ask again";
    return tag;
  }

  function patternRows() {
    const buckets = { "Turns 1 to 3": 0, "Turns 4 to 6": 0, "Turn 7+": 0 };
    const tags = {};
    const tools = {};
    const fixes = {};
    DATA.threads.forEach(function (thread) {
      const failed = !thread.resolved || !!state.confirmed[thread.id];
      if (thread.resolved && !state.confirmed[thread.id]) return;
      if (!thread.breakTurn && !state.confirmed[thread.id] && !state.pendingBreak[thread.id]) return;
      const b = breakTurnOf(thread);
      if (!b) return;
      if (b <= 3) buckets["Turns 1 to 3"] += 1;
      else if (b <= 6) buckets["Turns 4 to 6"] += 1;
      else buckets["Turn 7+"] += 1;
      const tag = tagOf(thread);
      if (!tag || tag === "None") return;
      tags[tag] = (tags[tag] || 0) + 1;
      tools[thread.tool] = (tools[thread.tool] || 0) + 1;
      const label = fixLabel(tag, thread.tool);
      if (!fixes[label]) fixes[label] = { label: label, count: 0, confirmed: 0 };
      fixes[label].count += 1;
      if (state.confirmed[thread.id]) fixes[label].confirmed += 1;
    });
    const ranked = Object.keys(fixes).map(function (key) { return fixes[key]; });
    ranked.sort(function (a, b) { return b.count - a.count || a.label.localeCompare(b.label); });
    return { buckets: buckets, tags: tags, tools: tools, ranked: ranked };
  }

  function datasetLock(thread) {
    const reasons = [];
    if (!state.confirmed[thread.id]) reasons.push("Confirm the break turn first.");
    if (!String(state.expected[thread.id] || "").trim()) reasons.push("Write the expected next action.");
    return reasons;
  }

  function render() {
    const active = document.activeElement;
    const focusId = active && active.id ? active.id : "";
    const sel = active && typeof active.selectionStart === "number" ? active.selectionStart : null;
    document.querySelectorAll(".tabs button").forEach(function (button) {
      button.classList.toggle("active-tab", button.getAttribute("data-screen") === state.screen);
    });
    if (state.screen === "threads") main.innerHTML = renderThreads();
    else if (state.screen === "patterns") main.innerHTML = renderPatterns();
    else if (state.screen === "backtest") main.innerHTML = renderBacktest();
    else main.innerHTML = renderActivity();
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

  function renderThreads() {
    const rows = visibleThreads();
    const open = state.openId ? threadById(state.openId) : null;
    const body = rows.map(function (thread) {
      const suggested = thread.breakTurn == null ? "none" : "Turn " + thread.breakTurn;
      const resolved = thread.resolved ? "yes" : "no";
      return "<tr class='" + (thread.id === state.openId ? "picked" : "") + "'><td><button type='button' class='row-btn' data-open='" + thread.id + "'>" + esc(thread.id) + "</button></td><td>" + thread.turns.length + "</td><td>" + resolved + "</td><td>" + esc(thread.endSentiment) + "</td><td>" + esc(suggested) + "</td><td>" + esc(thread.tag) + "</td></tr>";
    }).join("");
    return "<section class='workspace" + (open ? " split" : "") + "'><div><div class='filters'><button type='button' id='failed-toggle' class='" + (state.failedOnly ? "primary" : "") + "'>" + (state.failedOnly ? "Showing failed only" : "Failed only") + "</button><input id='thread-query' type='search' placeholder='Find a thread id, such as th_0412' value='" + esc(state.query) + "'></div><p class='muted'>" + rows.length + " of " + DATA.threads.length + " threads. The score on a thread says resolved yes or no. It does not say which turn broke.</p><div class='table-scroll'><table><thead><tr><th>Thread</th><th>Turns</th><th>Resolved</th><th>End sentiment</th><th>Suggested break</th><th>Top tag</th></tr></thead><tbody>" + body + "</tbody></table></div></div><div>" + (open ? renderTimeline(open) : "<div class='card'><h2>Open a thread</h2><p>Pick a failed thread to see the turn timeline. Start with th_0412.</p></div>") + "</div></section>";
  }

  function renderTimeline(thread) {
    const currentBreak = breakTurnOf(thread) || thread.breakTurn;
    const turns = thread.turns.map(function (item, index) {
      const n = index + 1;
      const isBreak = currentBreak === n;
      const chips = (item.signals || []).map(function (signal) {
        const kind = signal.indexOf("error") !== -1 || signal.indexOf("claimed") !== -1 ? "bad" : "warn";
        return "<span class='chip " + kind + "'>" + esc(signal) + "</span>";
      }).join("");
      const tools = (item.tools || []).map(function (call) {
        return "<div class='tool'><div class='mono'>" + esc(call.name) + "</div><pre>" + esc(JSON.stringify({ input: call.input, output: call.output }, null, 2)) + "</pre></div>";
      }).join("");
      const user = item.user ? "<p><strong>User.</strong> " + esc(item.user) + "</p>" : "";
      const assistant = item.assistant ? "<p><strong>Assistant.</strong> " + esc(item.assistant) + "</p>" : "";
      return "<article class='turn" + (isBreak ? " break" : "") + "'><div class='turn-head'><h3>Turn " + n + (isBreak ? " · Break turn" : "") + "</h3><span class='muted'>" + (item.latencyMs || 0) + " ms</span></div>" + user + assistant + tools + (chips ? "<div class='chips'>" + chips + "</div>" : "") + (isBreak && thread.why ? "<div class='why'><strong>Why this turn.</strong> " + esc(confirmedWhy(thread, n)) + "</div>" : "") + "</article>";
    }).join("");
    return "<div class='card'><h2>" + esc(thread.id) + "</h2><p>Resolved: " + (thread.resolved ? "yes" : "no") + ". End sentiment: " + esc(thread.endSentiment) + ". Suggested break: " + (thread.breakTurn ? "turn " + thread.breakTurn : "none") + ".</p></div>" + turns + renderConfirm(thread);
  }

  function confirmedWhy(thread, n) {
    if (state.confirmed[thread.id] && state.confirmed[thread.id].breakTurn === n && state.confirmed[thread.id].breakTurn !== thread.breakTurn) {
      return "You moved the break to turn " + n + ". " + (thread.why || "Review the tool result and the assistant reply on this turn.");
    }
    if (n === thread.breakTurn && thread.why) return thread.why;
    return "This is the turn you marked. Check the tool result against what the assistant told the traveler.";
  }

  function renderConfirm(thread) {
    const current = breakTurnOf(thread) || 1;
    const tag = state.pendingTag[thread.id] || (state.confirmed[thread.id] && state.confirmed[thread.id].tag) || thread.tag || DATA.tags[0];
    const expected = state.expected[thread.id] || "";
    const tagButtons = DATA.tags.map(function (name) {
      return "<button type='button' class='chip btn" + (name === tag ? " on" : "") + "' data-tag='" + esc(name) + "' data-thread='" + thread.id + "'>" + esc(name) + "</button>";
    }).join("");
    const locks = datasetLock(thread);
    const saved = state.confirmed[thread.id];
    const queueItems = state.queue.filter(function (item) { return item.threadId === thread.id; });
    const datasetItems = state.dataset.filter(function (item) { return item.threadId === thread.id; });
    return "<section class='card' id='confirm-panel'><h2>Confirm the break</h2><p>Suggested turn " + current + " of " + thread.turns.length + ". Move it if the first bad turn is earlier or later.</p><div class='actions'><button type='button' data-move='earlier' data-thread='" + thread.id + "'" + (current <= 1 ? " disabled" : "") + ">Move earlier</button><button type='button' data-move='later' data-thread='" + thread.id + "'" + (current >= thread.turns.length ? " disabled" : "") + ">Move later</button><button type='button' class='primary' data-confirm='" + thread.id + "'>Confirm break</button></div><label class='field'>Failure tag</label><div class='chips'>" + tagButtons + "</div><label class='field' for='expected-" + thread.id + "'>Expected next action</label><textarea id='expected-" + thread.id + "' data-expected='" + thread.id + "'>" + esc(expected) + "</textarea>" + (saved ? "<div class='okbox'>Confirmed turn " + saved.breakTurn + " as " + esc(saved.tag) + ".</div>" : "<p class='muted'>Not confirmed yet.</p>") + "</section>" + renderPromote(thread, locks, queueItems, datasetItems);
  }

  function renderPromote(thread, locks, queueItems, datasetItems) {
    const k = (state.confirmed[thread.id] && state.confirmed[thread.id].breakTurn) || breakTurnOf(thread) || thread.breakTurn || 1;
    const start = Math.max(1, k - 2);
    const queueHtml = queueItems.map(function (item) {
      const slice = item.turns.map(function (itemTurn) {
        return "<li>Turn " + itemTurn.n + ": " + esc(itemTurn.user || itemTurn.assistant || "(tool only)") + "</li>";
      }).join("");
      return "<div class='card'><strong>Queue item for " + esc(item.queue) + "</strong><p>Turns " + item.from + " to " + item.to + ". Tag: " + esc(item.tag) + ".</p><ul>" + slice + "</ul><p>Rubric: did the assistant respect the tool result? Expected next action: " + esc(item.expected || "(not written yet)") + "</p></div>";
    }).join("");
    const dataHtml = datasetItems.map(function (item) {
      return "<div class='card'><strong>Dataset example in " + esc(item.dataset) + "</strong><p>Inputs are turns 1 to " + item.through + ". Reference next action: " + esc(item.reference) + "</p><pre>" + esc(JSON.stringify({ inputs: item.inputs, reference: item.reference }, null, 2)) + "</pre></div>";
    }).join("");
    const engine = state.engineCards.filter(function (card) { return card.threadId === thread.id; }).map(function (card) {
      return "<div class='card'><strong>Mock Engine issue.</strong> " + esc(card.text) + "</div>";
    }).join("");
    return "<section class='card'><h2>Promote</h2><p>Send the break somewhere that already exists: a queue, a dataset, or an automation rule.</p><div class='actions'><button type='button' data-queue='" + thread.id + "'>Send to annotation queue</button><button type='button' data-dataset='" + thread.id + "'" + (locks.length ? " disabled" : "") + ">Add to dataset</button><button type='button' data-draft='" + thread.id + "'>Draft automation rule</button><button type='button' data-engine='" + thread.id + "'>Send to Engine (mock)</button></div>" + (locks.length ? "<div class='lock'>" + locks.map(esc).join(" ") + "</div>" : "<div class='okbox'>Dataset add is unlocked for this thread.</div>") + "<p class='muted'>Queue " + esc(DATA.queueName) + " will attach turns " + start + " to " + k + ". Dataset " + esc(DATA.datasetName) + " uses turns 1 to " + Math.max(1, k - 1) + " as inputs.</p></section>" + queueHtml + dataHtml + engine;
  }

  function renderPatterns() {
    const stats = patternRows();
    const maxBucket = Math.max(1, stats.buckets["Turns 1 to 3"], stats.buckets["Turns 4 to 6"], stats.buckets["Turn 7+"]);
    const bars = Object.keys(stats.buckets).map(function (label) {
      const count = stats.buckets[label];
      const width = Math.round((count / maxBucket) * 100);
      return "<div class='bar-row'><span>" + esc(label) + "</span><div class='bar'><span style='width:" + width + "%'></span></div><strong>" + count + "</strong></div>";
    }).join("");
    const tagList = Object.keys(stats.tags).map(function (tag) {
      return "<li>" + esc(tag) + ": " + stats.tags[tag] + "</li>";
    }).join("") || "<li>No failed threads in view.</li>";
    const toolList = Object.keys(stats.tools).map(function (tool) {
      return "<li>" + esc(tool) + ": " + stats.tools[tool] + "</li>";
    }).join("");
    const ranked = stats.ranked.map(function (row) {
      return "<li>" + esc(row.label) + ": " + row.count + " threads (" + row.confirmed + " confirmed)</li>";
    }).join("") || "<li>Confirm a break to start the fix list.</li>";
    const side = state.engineCards.map(function (card) {
      return "<li>" + esc(card.threadId) + ": " + esc(card.text) + "</li>";
    }).join("");
    return "<section><h2>Patterns across " + DATA.threads.length + " threads</h2><p>Counts use a confirmed tag when you have confirmed one. Until then they use the suggested tag.</p><div class='card'><h3>Where the break sits</h3>" + bars + "</div><div class='workspace split'><div class='card'><h3>By tag</h3><ul>" + tagList + "</ul></div><div class='card'><h3>By tool</h3><ul>" + toolList + "</ul></div></div><div class='card'><h3>Ranked fix list</h3><ol>" + ranked + "</ol></div>" + (side ? "<div class='card'><h3>Mock Engine cards</h3><ul>" + side + "</ul></div>" : "") + "</section>";
  }

  function renderBacktest() {
    const selected = state.backtestRan || "tool-ignored";
    const result = state.backtestRan ? runBacktest(state.backtestRan) : null;
    const choices = DATA.rules.map(function (rule) {
      return "<button type='button' class='" + (selected === rule.id && state.backtestRan ? "primary" : "") + "' data-rule='" + rule.id + "'>Run: " + esc(rule.name) + "</button>";
    }).join("");
    let body = "<p>Pick a drafted rule and run it on all " + DATA.threads.length + " labeled threads.</p>";
    if (result) {
      const rule = DATA.rules.find(function (item) { return item.id === state.backtestRan; });
      const pass = rulePasses(result);
      const saved = state.savedRules.some(function (item) { return item.id === rule.id; });
      const reasons = [];
      if (result.caught.length < 3) reasons.push("Caught " + result.caught.length + " confirmed breaks. The rule needs at least 3.");
      if (result.falseFlags.length > 1) reasons.push("False flags: " + result.falseFlags.length + ". The rule allows at most 1.");
      body = "<div class='card'><h3>" + esc(rule.name) + "</h3><p class='mono'>" + esc(rule.filter) + "</p><p>Action: " + esc(rule.action) + "</p><p><strong>Caught confirmed breaks:</strong> " + result.caught.length + " (" + esc(result.caught.join(", ") || "none") + ")</p><p><strong>False flags:</strong> " + result.falseFlags.length + " (" + esc(result.falseFlags.join(", ") || "none") + ")</p><p><strong>Missed:</strong> " + result.missed.length + " (" + esc(result.missed.join(", ") || "none") + ")</p>" + (pass ? "<div class='okbox'>Hard rule passed. You can save this rule.</div>" : "<div class='lock'>" + reasons.join(" ") + "</div>") + "<div class='actions'><button type='button' class='primary' data-save-rule='" + rule.id + "'" + (pass ? "" : " disabled") + ">" + (saved ? "Rule saved" : "Save rule") + "</button></div></div>";
    }
    const savedList = state.savedRules.map(function (rule) {
      return "<li>" + esc(rule.name) + " saved at " + esc(formatTime(rule.at)) + "</li>";
    }).join("") || "<li>No rule saved yet.</li>";
    return "<section><h2>Rule backtest</h2><div class='actions'>" + choices + "</div>" + body + "<div class='card'><h3>Saved rules</h3><ul>" + savedList + "</ul></div><div class='table-scroll'><table><thead><tr><th>Rule</th><th>What it asks</th><th>Needs</th></tr></thead><tbody><tr><td>Empty search treated as success</td><td>search_flights output is [] and the assistant says I found</td><td>At least 3 caught, at most 1 false flag</td></tr><tr><td>Sentiment drop alone</td><td>Any sentiment drop, with no tool check</td><td>Stays locked on this sample</td></tr></tbody></table></div></section>";
  }

  function renderActivity() {
    if (!state.activity.length) {
      return "<section class='card'><h2>Activity log</h2><p>No actions yet. Confirm a break, move it, promote it, or save a rule.</p></section>";
    }
    const rows = state.activity.map(function (item) {
      return "<tr><td>" + esc(formatTime(item.at)) + "</td><td>" + esc(item.user) + "</td><td>" + esc(item.action) + "</td><td>" + esc(item.detail) + "</td></tr>";
    }).join("");
    return "<section><h2>Activity log</h2><div class='table-scroll'><table><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Detail</th></tr></thead><tbody>" + rows + "</tbody></table></div></section>";
  }

  function snapshotTurns(thread, from, to) {
    const items = [];
    for (let n = from; n <= to; n += 1) {
      const item = thread.turns[n - 1];
      if (!item) continue;
      items.push({
        n: n,
        user: item.user,
        assistant: item.assistant,
        tools: item.tools
      });
    }
    return items;
  }

  document.body.addEventListener("click", function (event) {
    const tab = event.target.closest("[data-screen]");
    if (tab) {
      state.screen = tab.getAttribute("data-screen");
      save();
      render();
      return;
    }
    if (event.target.id === "btn-reset" || event.target.dataset.action === "reset") {
      state = fresh();
      save();
      render();
      return;
    }
    if (event.target.id === "failed-toggle") {
      state.failedOnly = !state.failedOnly;
      save();
      render();
      return;
    }
    const open = event.target.closest("[data-open]");
    if (open) {
      state.openId = open.getAttribute("data-open");
      state.screen = "threads";
      save();
      render();
      const panel = document.getElementById("confirm-panel");
      if (panel) panel.scrollIntoView({ block: "nearest" });
      return;
    }
    const move = event.target.closest("[data-move]");
    if (move) {
      const thread = threadById(move.getAttribute("data-thread"));
      const current = breakTurnOf(thread) || thread.breakTurn || 1;
      const next = move.getAttribute("data-move") === "earlier" ? current - 1 : current + 1;
      if (next < 1 || next > thread.turns.length) return;
      state.pendingBreak[thread.id] = next;
      if (state.confirmed[thread.id]) state.confirmed[thread.id].breakTurn = next;
      log("move", thread.id + " break turn moved " + move.getAttribute("data-move") + " to turn " + next);
      save();
      render();
      return;
    }
    const tagBtn = event.target.closest("[data-tag]");
    if (tagBtn) {
      state.pendingTag[tagBtn.getAttribute("data-thread")] = tagBtn.getAttribute("data-tag");
      save();
      render();
      return;
    }
    const confirm = event.target.closest("[data-confirm]");
    if (confirm) {
      const thread = threadById(confirm.getAttribute("data-confirm"));
      const breakTurn = breakTurnOf(thread) || thread.breakTurn || 1;
      const tag = state.pendingTag[thread.id] || thread.tag || "Tool result ignored";
      state.confirmed[thread.id] = {
        breakTurn: breakTurn,
        tag: tag,
        expected: String(state.expected[thread.id] || "").trim(),
        at: new Date().toISOString()
      };
      log("confirm", thread.id + " break confirmed at turn " + breakTurn + " with tag " + tag);
      save();
      render();
      return;
    }
    const queue = event.target.closest("[data-queue]");
    if (queue) {
      const thread = threadById(queue.getAttribute("data-queue"));
      const k = (state.confirmed[thread.id] && state.confirmed[thread.id].breakTurn) || breakTurnOf(thread) || thread.breakTurn || 1;
      const from = Math.max(1, k - 2);
      state.queue.unshift({
        threadId: thread.id,
        queue: DATA.queueName,
        from: from,
        to: k,
        tag: tagOf(thread),
        expected: String(state.expected[thread.id] || "").trim(),
        turns: snapshotTurns(thread, from, k),
        at: new Date().toISOString()
      });
      log("promote", "Sent " + thread.id + " to annotation queue " + DATA.queueName + " with turns " + from + " to " + k);
      save();
      render();
      return;
    }
    const dataset = event.target.closest("[data-dataset]");
    if (dataset) {
      const thread = threadById(dataset.getAttribute("data-dataset"));
      const locks = datasetLock(thread);
      if (locks.length) return;
      const k = state.confirmed[thread.id].breakTurn;
      const through = Math.max(1, k - 1);
      state.dataset.unshift({
        threadId: thread.id,
        dataset: DATA.datasetName,
        through: through,
        inputs: snapshotTurns(thread, 1, through),
        reference: String(state.expected[thread.id] || "").trim(),
        at: new Date().toISOString()
      });
      log("promote", "Added " + thread.id + " to dataset " + DATA.datasetName);
      save();
      render();
      return;
    }
    const draft = event.target.closest("[data-draft]");
    if (draft) {
      const thread = threadById(draft.getAttribute("data-draft"));
      const tag = tagOf(thread);
      state.screen = "backtest";
      state.backtestRan = tag === "Tool result ignored" ? "" : "";
      log("promote", "Drafted an automation rule from tag " + tag + " on " + thread.id);
      save();
      render();
      return;
    }
    const engine = event.target.closest("[data-engine]");
    if (engine) {
      const thread = threadById(engine.getAttribute("data-engine"));
      const k = breakTurnOf(thread) || thread.breakTurn || 1;
      state.engineCards.unshift({
        threadId: thread.id,
        text: "Mock only. Cluster: " + tagOf(thread) + " around turn " + k + ". This is not a LangSmith Engine call."
      });
      log("promote", "Mock Engine card created for " + thread.id);
      save();
      render();
      return;
    }
    const rule = event.target.closest("[data-rule]");
    if (rule) {
      state.backtestRan = rule.getAttribute("data-rule");
      state.screen = "backtest";
      const result = runBacktest(state.backtestRan);
      log("backtest", state.backtestRan + " caught " + result.caught.length + ", false flags " + result.falseFlags.length + ", missed " + result.missed.length);
      save();
      render();
      return;
    }
    const saveRule = event.target.closest("[data-save-rule]");
    if (saveRule) {
      const id = saveRule.getAttribute("data-save-rule");
      const result = runBacktest(id);
      if (!rulePasses(result)) return;
      const ruleDef = DATA.rules.find(function (item) { return item.id === id; });
      if (!state.savedRules.some(function (item) { return item.id === id; })) {
        state.savedRules.unshift({ id: id, name: ruleDef.name, at: new Date().toISOString() });
        log("rule save", "Saved automation rule: " + ruleDef.name);
        save();
        render();
      }
    }
  });

  document.body.addEventListener("input", function (event) {
    if (event.target.id === "thread-query") {
      state.query = event.target.value;
      save();
      render();
      return;
    }
    const expected = event.target.getAttribute && event.target.getAttribute("data-expected");
    if (expected) {
      state.expected[expected] = event.target.value;
      if (state.confirmed[expected]) state.confirmed[expected].expected = event.target.value.trim();
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
