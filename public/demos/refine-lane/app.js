(function () {
  var D = window.REFINE_LANE;
  var KEY = "refine-lane-demo-v1";
  var root = document.getElementById("app");
  var state = load();

  function blankCase() {
    return { badOn: true, rejected: false, gold: false, seen: false };
  }

  function fresh() {
    return {
      activeId: "",
      cases: { cxr: blankCase(), path: blankCase(), icd: blankCase() },
      nextMinute: 9 * 60 + 41,
      events: [
        { t: "9:40 AM", text: "Desk opened" },
        {
          t: "9:40 AM",
          text: "Modality requests loaded: chest X-ray lesion polygon, pathology report NER, discharge summary ICD mapping"
        }
      ]
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return fresh();
      var parsed = JSON.parse(raw);
      var base = fresh();
      if (parsed && parsed.cases) {
        ["cxr", "path", "icd"].forEach(function (id) {
          var c = parsed.cases[id] || {};
          base.cases[id] = {
            badOn: c.badOn !== false,
            rejected: !!c.rejected,
            gold: !!c.gold,
            seen: !!c.seen
          };
          if (base.cases[id].rejected || base.cases[id].badOn) base.cases[id].gold = false;
        });
      }
      if (parsed && (parsed.activeId === "cxr" || parsed.activeId === "path" || parsed.activeId === "icd")) {
        base.activeId = parsed.activeId;
      }
      if (typeof parsed.nextMinute === "number") base.nextMinute = parsed.nextMinute;
      if (Array.isArray(parsed.events) && parsed.events.length) base.events = parsed.events;
      return base;
    } catch (err) {
      return fresh();
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function stamp() {
    var total = state.nextMinute;
    state.nextMinute += 1;
    var h = Math.floor(total / 60);
    var m = total % 60;
    var ap = h >= 12 ? "PM" : "AM";
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    var mm = m < 10 ? "0" + m : String(m);
    return h12 + ":" + mm + " " + ap;
  }

  function pushEvent(text) {
    state.events.push({ t: stamp(), text: text });
  }

  function modality(id) {
    return D.modalities.filter(function (m) { return m.id === id; })[0];
  }

  function active() {
    return state.activeId ? modality(state.activeId) : null;
  }

  function caseState(id) {
    return state.cases[id];
  }

  function reasons(id) {
    if (!id) return ["Pick a modality before a draft can become gold."];
    var c = caseState(id);
    var list = [];
    if (c.rejected) list.push("Reject is on. This draft cannot become gold.");
    if (c.badOn) list.push("A known bad edge or span is still on the draft.");
    return list;
  }

  function canGold(id) {
    return !!id && reasons(id).length === 0;
  }

  function commit() {
    save();
    render();
  }

  function pick(id) {
    var m = modality(id);
    var c = caseState(id);
    state.activeId = id;
    if (!c.seen) {
      c.seen = true;
      pushEvent("Modality picked: " + m.title);
      pushEvent("AI draft shown: " + m.caseId);
    } else {
      pushEvent("Opened again: " + m.caseId);
    }
    commit();
  }

  function toggleEdit() {
    var m = active();
    if (!m) return;
    var c = caseState(m.id);
    c.badOn = !c.badOn;
    if (c.badOn) {
      pushEvent("Expert edit: known bad edge or span put back on " + m.caseId);
    } else if (m.kind === "region") {
      pushEvent("Expert edit: trimmed the known bad edge on " + m.caseId);
    } else {
      pushEvent("Expert edit: moved the highlight off the known bad span on " + m.caseId);
    }
    if (c.gold && (c.badOn || c.rejected)) {
      c.gold = false;
      pushEvent("Gold cleared on " + m.caseId + " because the draft is no longer clean.");
    }
    commit();
  }

  function rejectOrClear() {
    var m = active();
    if (!m) return;
    var c = caseState(m.id);
    if (c.rejected) {
      c.rejected = false;
      pushEvent("Reject cleared on " + m.caseId);
    } else {
      c.rejected = true;
      if (c.gold) c.gold = false;
      pushEvent("Rejected: " + m.caseId + " sent back. Not for gold or the crowd.");
    }
    commit();
  }

  function acceptGold() {
    var m = active();
    if (!m) return;
    var c = caseState(m.id);
    var blocks = reasons(m.id);
    if (blocks.length) {
      pushEvent("Accept blocked on " + m.caseId + ": " + blocks.join(" "));
      commit();
      return;
    }
    if (!c.gold) {
      c.gold = true;
      pushEvent("Accept to gold: " + m.caseId);
    }
    commit();
  }

  function reset() {
    state = fresh();
    localStorage.removeItem(KEY);
    render();
  }

  function exportAudit() {
    var lines = [
      "Refine Lane audit",
      "Synthetic demo. Not a Centaur product. No real patient PHI.",
      ""
    ];
    state.events.forEach(function (ev) {
      lines.push(ev.t + "  " + ev.text);
    });
    var blob = new Blob([lines.join("\n") + "\n"], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "refine-lane-audit.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function cardStatus(id) {
    var c = caseState(id);
    if (c.gold) return "Gold in this session";
    if (c.rejected) return "Sent back";
    if (c.seen && !c.badOn) return "Bad edge cleared";
    if (c.seen) return "Draft open";
    return "Not started";
  }

  function regionSvg(badOn) {
    var bad = badOn
      ? '<polygon class="poly bad" points="78,58 126,54 140,86 132,124 70,128 58,90"></polygon>'
      : '<polygon class="poly good" points="82,60 122,56 132,82 114,100 84,98 68,76"></polygon>';
    return (
      '<svg viewBox="0 0 200 160" role="img" aria-label="Synthetic chest film sketch with a polygon draft">' +
      '<rect class="film" x="8" y="8" width="184" height="144" rx="8"></rect>' +
      '<ellipse class="lung" cx="78" cy="78" rx="28" ry="40"></ellipse>' +
      '<ellipse class="lung" cx="124" cy="78" rx="28" ry="40"></ellipse>' +
      bad +
      "</svg>"
    );
  }

  function spanBlock(m, badOn) {
    var badCls = badOn ? "mark bad" : "mark idle";
    var goodCls = badOn ? "mark idle" : "mark good";
    var code = "";
    if (m.kind === "code") {
      code = badOn
        ? '<p class="codechip">Demo code ' + esc(m.badCode) + " on the family-history span</p>"
        : '<p class="codechip good">Demo code ' + esc(m.goodCode) + " on the treated-for span</p>";
    }
    return (
      '<p class="report">' +
      esc(m.before) +
      '<mark class="' + badCls + '">' + esc(m.badSpan) + "</mark>" +
      esc(m.mid) +
      '<mark class="' + goodCls + '">' + esc(m.goodSpan) + "</mark>" +
      esc(m.after) +
      "</p>" +
      code
    );
  }

  function deskCard(m) {
    var on = state.activeId === m.id ? " card on" : " card";
    return (
      '<article class="' + on.trim() + '">' +
      '<p class="kicker">' + esc(cardStatus(m.id)) + "</p>" +
      "<h3>" + esc(m.title) + "</h3>" +
      '<p><strong>Demand.</strong> ' + esc(m.demand) + "</p>" +
      '<p><strong>Tool gap.</strong> ' + esc(m.gap) + "</p>" +
      '<p><strong>Disagreement.</strong> ' + esc(m.disagree) + "</p>" +
      '<button type="button" class="btn primary" data-act="pick" data-id="' + esc(m.id) + '">Prototype next</button>' +
      "</article>"
    );
  }

  function refineBlock() {
    var m = active();
    if (!m) {
      return (
        '<section class="card" id="refine">' +
        "<h2>Refine lane</h2>" +
        "<p>Pick a modality to open one synthetic case. Nothing here is a real study.</p>" +
        "</section>"
      );
    }
    var c = caseState(m.id);
    var visual = m.kind === "region" ? regionSvg(c.badOn) : spanBlock(m, c.badOn);
    var line = c.badOn ? m.badLine : m.goodLine;
    var lineCls = c.badOn ? "status bad" : "status ok";
    var rejectLabel = c.rejected ? "Clear reject" : "Reject";
    var rejectCls = c.rejected ? "btn ghost" : "btn danger";
    var flag = c.rejected ? '<p class="status bad">Reject is on. Sent back. Not for gold or the crowd.</p>' : "";
    return (
      '<section class="card" id="refine">' +
      "<h2>Refine lane</h2>" +
      '<p class="kicker">' + esc(m.caseId) + " / " + esc(m.title) + "</p>" +
      "<p>" + esc(m.draftLead) + "</p>" +
      visual +
      '<p class="' + lineCls + '">' + esc(line) + "</p>" +
      flag +
      '<div class="btn-col">' +
      '<button type="button" class="btn primary" data-act="edit">' + esc(m.editLabel) + "</button>" +
      '<button type="button" class="' + rejectCls + '" data-act="reject">' + rejectLabel + "</button>" +
      "</div>" +
      "</section>"
    );
  }

  function shipBlock() {
    var m = active();
    var id = m ? m.id : "";
    var blocks = reasons(id);
    var c = m ? caseState(m.id) : null;
    var rows = "";
    if (!m) {
      rows =
        '<li class="row fail"><span>Modality picked</span><strong>Needed</strong></li>' +
        '<li class="row fail"><span>AI draft shown</span><strong>Needed</strong></li>';
    } else {
      rows =
        '<li class="row pass"><span>Modality picked</span><strong>Pass</strong></li>' +
        '<li class="row pass"><span>AI draft shown</span><strong>Pass</strong></li>' +
        (c.rejected
          ? '<li class="row fail"><span>Reject is off</span><strong>Blocked</strong></li>'
          : '<li class="row pass"><span>Reject is off</span><strong>Pass</strong></li>') +
        (c.badOn
          ? '<li class="row fail"><span>Known bad edge or span cleared</span><strong>Blocked</strong></li>'
          : '<li class="row pass"><span>Known bad edge or span cleared</span><strong>Pass</strong></li>') +
        (c.gold
          ? '<li class="row pass"><span>Accept to gold</span><strong>Pass</strong></li>'
          : '<li class="row fail"><span>Accept to gold</span><strong>Not yet</strong></li>');
    }
    var reason = blocks.length
      ? '<p class="status bad">' + esc(blocks.join(" ")) + "</p>"
      : '<p class="status ok">Ship check is clear. Accept to gold is open. Nothing is uploaded.</p>';
    if (c && c.gold) {
      reason = '<p class="status ok">Accepted to gold for this session. The crowd does not see it from this page.</p>';
    }
    var disabled = canGold(id) ? "" : " disabled";
    var acceptLabel = c && c.gold ? "Accepted to gold" : "Accept to gold";
    return (
      '<section class="card" id="ship">' +
      "<h2>Ship check</h2>" +
      "<p>A draft cannot become gold while Reject is on, or while a known bad edge or span remains.</p>" +
      '<ul class="bar">' + rows + "</ul>" +
      reason +
      '<button type="button" class="btn good" data-act="accept"' + disabled + ">" + acceptLabel + "</button>" +
      "</section>"
    );
  }

  function auditBlock() {
    var items = state.events.map(function (ev) {
      return "<li><span>" + esc(ev.t) + "</span> " + esc(ev.text) + "</li>";
    }).join("");
    return (
      '<section class="card" id="audit">' +
      "<h2>Event audit</h2>" +
      "<p>Modality picked, AI draft shown, expert edit, and accept to gold show up here.</p>" +
      '<ol class="log">' + items + "</ol>" +
      '<div class="btn-col">' +
      '<button type="button" class="btn primary" data-act="export">Export audit</button>' +
      '<button type="button" class="btn ghost" data-act="reset">Reset demo</button>' +
      "</div>" +
      "</section>"
    );
  }

  function render() {
    var cards = D.modalities.map(deskCard).join("");
    root.innerHTML =
      '<header><p class="brand">Refine Lane</p><h1>Next modality desk</h1></header>' +
      '<p class="banner">Synthetic labeling desk for ' + esc(D.program) + ". Not a diagnosis. Not real patient data. No PHI.</p>" +
      "<section><h2>Requests</h2>" + cards + "</section>" +
      refineBlock() +
      shipBlock() +
      auditBlock() +
      '<footer><p>Prototype for interview practice. Not affiliated with Centaur. Not a Centaur product. Synthetic cases only. No real patient PHI.</p></footer>';
  }

  root.addEventListener("click", function (ev) {
    var btn = ev.target.closest("button");
    if (!btn) return;
    var act = btn.getAttribute("data-act");
    if (act === "pick") pick(btn.getAttribute("data-id"));
    else if (act === "edit") toggleEdit();
    else if (act === "reject") rejectOrClear();
    else if (act === "accept") acceptGold();
    else if (act === "export") exportAudit();
    else if (act === "reset") reset();
  });

  render();
})();
