(function () {
  var D = window.CLAIM_GATE;
  var KEY = "claim-gate-demo-v1";
  var root = document.getElementById("app");
  var state = load();

  function fresh() {
    return {
      mode: "advisor",
      disclosureOn: false,
      claim3: "open",
      sent: false,
      readyLogged: false,
      nextMinute: 9 * 60 + 16,
      openCite: "",
      events: [
        { t: "9:14 AM", text: "Draft created" },
        { t: "9:14 AM", text: "Citation attached: TMP-12 on the meeting line" },
        { t: "9:14 AM", text: "Citation attached: FS-204 on the fund line" },
        { t: "9:15 AM", text: "Missing citation warning on the results line" }
      ]
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return fresh();
      var parsed = JSON.parse(raw);
      var base = fresh();
      base.mode = parsed.mode === "compliance" ? "compliance" : "advisor";
      base.disclosureOn = !!parsed.disclosureOn;
      if (parsed.claim3 === "blocked" || parsed.claim3 === "removed" || parsed.claim3 === "replaced") {
        base.claim3 = parsed.claim3;
      }
      base.sent = !!parsed.sent;
      base.readyLogged = !!parsed.readyLogged;
      base.nextMinute = typeof parsed.nextMinute === "number" ? parsed.nextMinute : base.nextMinute;
      base.openCite = parsed.openCite || "";
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

  function afterChange(message) {
    var wasReady = state.readyLogged;
    if (message) pushEvent(message);
    var gate = D.status(state);
    if (!gate.canSend) {
      if (wasReady && !state.sent) pushEvent("Send locked again");
      state.readyLogged = false;
    } else if (!state.readyLogged && !state.sent) {
      state.readyLogged = true;
      pushEvent("Ready to send");
    }
    save();
    render();
  }

  function claimById(id) {
    return D.claims.filter(function (c) { return c.id === id; })[0];
  }

  function citeButton(cite) {
    if (!cite) return "";
    var open = state.openCite === cite.id;
    return (
      '<button type="button" class="chip good" data-act="toggle-cite" data-id="' + esc(cite.id) + '" aria-expanded="' + (open ? "true" : "false") + '">' +
      "Approved content " + esc(cite.id) +
      "</button>" +
      (open
        ? '<div class="excerpt"><p class="excerpt-title">' + esc(cite.title) + "</p><p>" + esc(cite.excerpt) + "</p></div>"
        : "")
    );
  }

  function fundCard() {
    var c = claimById("fund");
    var shown = state.disclosureOn ? c.text + " " + c.disclosure : c.text;
    var warn = state.disclosureOn
      ? '<p class="status ok">Disclosure added from FS-204.</p>'
      : '<p class="status bad">Disclosure needed. The fact sheet requires a warning on this line.</p>';
    var actions = "";
    if (!state.sent && state.mode === "advisor") {
      actions =
        '<div class="btn-col">' +
        '<button type="button" class="btn primary" data-act="add-disclosure"' + (state.disclosureOn ? " disabled" : "") + ">Add disclosure</button>" +
        '<button type="button" class="btn ghost" data-act="flip-disclosure">Flip claim</button>' +
        "</div>";
    }
    return (
      '<article class="card">' +
      '<p class="kicker">' + esc(c.label) + "</p>" +
      "<p class=\"claim\">" + esc(shown) + "</p>" +
      warn +
      citeButton(c.cite) +
      actions +
      "</article>"
    );
  }

  function resultsCard() {
    var c = claimById("results");
    var body = "";
    var actions = "";
    if (state.claim3 === "removed") {
      body = '<p class="claim">This line is off the draft.</p><p class="status ok">Removed. It will not be sent.</p>';
    } else if (state.claim3 === "replaced") {
      body =
        '<p class="claim">' + esc(c.replace.text) + "</p>" +
        '<p class="status ok">Replaced with an approved line.</p>' +
        citeButton(c.replace.cite);
    } else {
      body =
        '<p class="claim">' + esc(c.text) + "</p>" +
        '<p class="status bad">No approved citation. This wording is not in the fact sheet.</p>' +
        '<p class="chip bad static-chip">Missing citation</p>';
      if (state.claim3 === "blocked") {
        body += '<p class="status bad block-note">Blocked by supervision. This line promises results.</p>';
      }
      if (!state.sent && state.mode === "advisor" && state.claim3 === "blocked") {
        actions =
          '<div class="btn-col">' +
          '<button type="button" class="btn primary" data-act="replace">Replace with approved line</button>' +
          '<button type="button" class="btn ghost" data-act="remove">Remove claim</button>' +
          "</div>";
      }
      if (!state.sent && state.mode === "advisor" && state.claim3 === "open") {
        actions =
          '<div class="btn-col">' +
          '<button type="button" class="btn ghost" data-act="replace">Replace with approved line</button>' +
          '<button type="button" class="btn ghost" data-act="remove">Remove claim</button>' +
          "</div>";
      }
      if (!state.sent && state.mode === "compliance" && state.claim3 === "open") {
        actions =
          '<div class="btn-col">' +
          '<button type="button" class="btn danger" data-act="block">Block this claim</button>' +
          "</div>" +
          '<p class="help">Block it when the line sounds sure about results and approved content does not say that.</p>';
      }
      if (state.mode === "compliance" && state.claim3 === "blocked") {
        actions = '<p class="help">Blocked. The advisor has to remove it or replace it before send.</p>';
      }
    }
    if (state.mode === "compliance" && (state.claim3 === "removed" || state.claim3 === "replaced")) {
      actions = '<p class="help">Nothing to block. This line is already off the original wording.</p>';
    }
    return (
      '<article class="card' + (state.claim3 === "blocked" ? " card-block" : "") + '">' +
      '<p class="kicker">' + esc(c.label) + "</p>" +
      body +
      actions +
      "</article>"
    );
  }

  function meetCard() {
    var c = claimById("meet");
    return (
      '<article class="card">' +
      '<p class="kicker">' + esc(c.label) + "</p>" +
      '<p class="claim">' + esc(c.text) + "</p>" +
      '<p class="status ok">Citation attached.</p>' +
      citeButton(c.cite) +
      "</article>"
    );
  }

  function sendBar() {
    if (state.mode !== "advisor") {
      return '<section class="card quiet"><p class="claim">Send stays with the advisor. Compliance can block a line. It does not send the note.</p></section>';
    }
    if (state.sent) {
      return '<section class="card quiet"><p class="status ok">Marked ready and handed to the review queue in this demo.</p><p class="help">Nothing was emailed. A real firm would keep this audit with the message. Use Reset demo to start over.</p></section>';
    }
    var gate = D.status(state);
    var reasons = gate.reasons.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("");
    var why = gate.canSend
      ? '<p class="status ok">Ready to send. The disclosure is on, and the blocked or uncited results line is gone.</p>'
      : '<p class="status bad">Send is off.</p><ul class="reasons">' + reasons + "</ul>";
    return (
      '<section class="card">' +
      "<h2>Send</h2>" +
      why +
      '<button type="button" class="btn primary" data-act="send"' + (gate.canSend ? "" : " disabled") + ">Send</button>" +
      "</section>"
    );
  }

  function audit() {
    var rows = state.events.map(function (e) {
      return "<li><span class=\"when\">" + esc(e.t) + "</span> <span>" + esc(e.text) + "</span></li>";
    }).join("");
    return (
      '<section class="card" id="audit">' +
      "<h2>Audit log</h2>" +
      '<p class="help">Demo clock, starting at 9:14 AM. This list is the trust proof. Export it if you want the file.</p>' +
      "<ol class=\"log\">" + rows + "</ol>" +
      '<button type="button" class="btn ghost" data-act="export">Export audit</button>' +
      "</section>"
    );
  }

  function library() {
    var items = [];
    D.claims.forEach(function (c) {
      if (c.cite) items.push(c.cite);
      if (c.replace && c.replace.cite) items.push(c.replace.cite);
    });
    var html = items.map(function (cite) {
      return (
        '<li><button type="button" class="text-btn" data-act="toggle-cite" data-id="' + esc(cite.id) + '">' +
        esc(cite.id) + " - " + esc(cite.title) +
        "</button>" +
        (state.openCite === cite.id ? '<p class="excerpt">' + esc(cite.excerpt) + "</p>" : "") +
        "</li>"
      );
    }).join("");
    return (
      '<section class="card">' +
      "<h2>Approved content</h2>" +
      '<p class="help">Synthetic files only. Tap one to read the line the draft is allowed to use.</p>' +
      "<ul class=\"library\">" + html + "</ul>" +
      "</section>"
    );
  }

  function render() {
    var mode = state.mode;
    root.innerHTML =
      '<header class="top">' +
      '<p class="brand">Claim Gate</p>' +
      "<h1>Client follow-up, before it leaves the firm</h1>" +
      '<p class="banner">Synthetic demo data. Firm: ' + esc(D.firm) + ". Advisor: " + esc(D.advisor) + ". Client: " + esc(D.client) + ". Fund: " + esc(D.fund) + ". Not a real account.</p>" +
      '<div class="seg" role="group" aria-label="View">' +
      '<button type="button" class="seg-btn' + (mode === "advisor" ? " on" : "") + '" data-act="mode-advisor" aria-pressed="' + (mode === "advisor" ? "true" : "false") + '">Advisor</button>' +
      '<button type="button" class="seg-btn' + (mode === "compliance" ? " on" : "") + '" data-act="mode-compliance" aria-pressed="' + (mode === "compliance" ? "true" : "false") + '">Compliance</button>' +
      "</div>" +
      '<button type="button" class="btn ghost slim" data-act="reset">Reset demo</button>' +
      "</header>" +
      '<main>' +
      '<section class="card intro">' +
      "<h2>" + (mode === "advisor" ? "Advisor draft" : "Compliance review") + "</h2>" +
      "<p class=\"help\">" +
      (mode === "advisor"
        ? "The assistant drafted three lines. Each line needs approved content, or a warning if the citation is missing. One line also needs a disclosure."
        : "Read the same draft. Block the line that promises results. You cannot send from this view.") +
      "</p>" +
      "</section>" +
      meetCard() +
      fundCard() +
      resultsCard() +
      sendBar() +
      audit() +
      library() +
      "</main>" +
      '<footer class="foot">Prototype for interview practice. Not affiliated with Seismic. Not a Seismic product. Synthetic firm, client, and fund. No real customer data.</footer>';
  }

  function exportAudit() {
    var lines = [
      "Claim Gate audit log",
      "Synthetic demo for North Harbor Wealth. Not a real client file.",
      "Not affiliated with Seismic.",
      ""
    ];
    state.events.forEach(function (e) {
      lines.push(e.t + "  " + e.text);
    });
    var blob = new Blob([lines.join("\n")], { type: "text/plain" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "claim-gate-audit.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  root.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-act]");
    if (!btn || btn.disabled) return;
    var act = btn.getAttribute("data-act");
    if (act === "mode-advisor") {
      state.mode = "advisor";
      save();
      render();
      return;
    }
    if (act === "mode-compliance") {
      state.mode = "compliance";
      save();
      render();
      return;
    }
    if (act === "toggle-cite") {
      var id = btn.getAttribute("data-id");
      state.openCite = state.openCite === id ? "" : id;
      save();
      render();
      return;
    }
    if (act === "reset") {
      localStorage.removeItem(KEY);
      state = fresh();
      render();
      return;
    }
    if (act === "export") {
      exportAudit();
      return;
    }
    if (state.sent) return;
    if (act === "add-disclosure") {
      if (!state.disclosureOn) {
        state.disclosureOn = true;
        afterChange("Disclosure added to the fund line");
      }
      return;
    }
    if (act === "flip-disclosure") {
      state.disclosureOn = !state.disclosureOn;
      afterChange(state.disclosureOn ? "Disclosure added to the fund line" : "Disclosure flipped off the fund line");
      return;
    }
    if (act === "block") {
      if (state.claim3 === "open") {
        state.claim3 = "blocked";
        afterChange("Claim blocked: results line is not in approved content");
      }
      return;
    }
    if (act === "remove") {
      if (state.claim3 === "open" || state.claim3 === "blocked") {
        var wasBlocked = state.claim3 === "blocked";
        state.claim3 = "removed";
        afterChange(wasBlocked ? "Blocked claim removed" : "Results line removed");
      }
      return;
    }
    if (act === "replace") {
      if (state.claim3 === "open" || state.claim3 === "blocked") {
        state.claim3 = "replaced";
        afterChange("Claim replaced with approved line AP-09");
      }
      return;
    }
    if (act === "send") {
      var gate = D.status(state);
      if (!gate.canSend) return;
      state.sent = true;
      pushEvent("Handed to the review queue");
      save();
      render();
    }
  });

  render();
})();
