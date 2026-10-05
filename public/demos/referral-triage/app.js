(function () {
  var D = window.REFERRAL_TRIAGE;
  var KEY = "referral-triage-demo-v1";
  var root = document.getElementById("app");
  var state = load();

  function blankCase(fax) {
    var fields = {};
    Object.keys(fax.fields).forEach(function (fid) {
      var f = fax.fields[fid];
      fields[fid] = {
        value: f.value,
        accepted: !f.low,
        edited: false,
        sentHuman: false,
        fixed: false
      };
    });
    return { seen: false, locked: false, fields: fields, contributed: false };
  }

  function fresh() {
    var cases = {};
    D.faxes.forEach(function (fax) {
      cases[fax.id] = blankCase(fax);
    });
    return {
      activeId: "",
      cases: cases,
      nextMinute: 8 * 60 + 14,
      events: [
        { t: "8:12 AM", text: "Queue opened for " + D.program },
        { t: "8:12 AM", text: "Loaded " + D.faxes.length + " synthetic faxes" }
      ],
      /* Extra correct outcomes appended when a case is locked cleanly */
      extras: {
        patientName: [],
        dob: [],
        orderType: [],
        urgency: [],
        referringProvider: [],
        specialty: []
      }
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return fresh();
      var parsed = JSON.parse(raw);
      var base = fresh();
      if (parsed && parsed.cases) {
        D.faxes.forEach(function (fax) {
          var c = parsed.cases[fax.id];
          if (!c) return;
          var b = blankCase(fax);
          b.seen = !!c.seen;
          b.locked = !!c.locked;
          b.contributed = !!c.contributed;
          if (c.fields) {
            Object.keys(b.fields).forEach(function (fid) {
              var pf = c.fields[fid] || {};
              b.fields[fid].value = typeof pf.value === "string" ? pf.value : b.fields[fid].value;
              b.fields[fid].accepted = !!pf.accepted;
              b.fields[fid].edited = !!pf.edited;
              b.fields[fid].sentHuman = !!pf.sentHuman;
              b.fields[fid].fixed = !!pf.fixed;
            });
          }
          base.cases[fax.id] = b;
        });
      }
      if (parsed && parsed.activeId) {
        var exists = D.faxes.some(function (f) { return f.id === parsed.activeId; });
        if (exists) base.activeId = parsed.activeId;
      }
      if (typeof parsed.nextMinute === "number") base.nextMinute = parsed.nextMinute;
      if (Array.isArray(parsed.events) && parsed.events.length) base.events = parsed.events;
      if (parsed && parsed.extras) base.extras = parsed.extras;
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

  function faxById(id) {
    return D.faxes.filter(function (f) { return f.id === id; })[0];
  }

  function activeFax() {
    return state.activeId ? faxById(state.activeId) : null;
  }

  function caseState(id) {
    return state.cases[id];
  }

  function fieldMeta(fax, fid) {
    return fax.fields[fid];
  }

  function fieldLabel(fid) {
    var hit = D.fields.filter(function (f) { return f.id === fid; })[0];
    return hit ? hit.label : fid;
  }

  function lowOpen(fax, c) {
    var list = [];
    Object.keys(fax.fields).forEach(function (fid) {
      var meta = fax.fields[fid];
      if (!meta.low) return;
      var fs = c.fields[fid];
      if (fs.sentHuman) return;
      if (fs.fixed) return;
      list.push(fid);
    });
    return list;
  }

  function lockReasons(fax, c) {
    if (!fax) return ["Open a fax before you can lock a case."];
    if (c.locked) return [];
    var open = lowOpen(fax, c);
    var list = [];
    if (!fax.classification.isReferral) {
      list.push("This page is classified as not a referral. Send it out of the referral queue instead of locking as a referral.");
      return list;
    }
    open.forEach(function (fid) {
      list.push(fieldLabel(fid) + " is still low-confidence. Edit it or Send to human before lock.");
    });
    return list;
  }

  function canLock(fax, c) {
    return !!fax && lockReasons(fax, c).length === 0 && !c.locked;
  }

  function batchSeries(fid) {
    var base = (D.batch[fid] || []).slice();
    var extras = (state.extras && state.extras[fid]) || [];
    return base.concat(extras);
  }

  function accuracyPct(fid) {
    var series = batchSeries(fid);
    if (!series.length) return 0;
    var ok = series.filter(Boolean).length;
    return Math.round((ok / series.length) * 100);
  }

  function citationOk(meta) {
    return !!(meta && meta.cite && meta.cite.indexOf("No ") !== 0 && meta.cite !== "n/a");
  }

  function autoFillAllowed(fax, fid, fs) {
    var meta = fieldMeta(fax, fid);
    var conf = meta.confidence;
    if (fs.fixed) conf = 99;
    if (fs.sentHuman) return false;
    if (meta.low && !fs.fixed) return false;
    var rule = D.autoFillRule;
    if (conf < rule.fieldConfidenceMin) return false;
    if (rule.needsCitation && !citationOk(meta)) return false;
    if (accuracyPct(fid) < rule.batchAccuracyMin) return false;
    return true;
  }

  function commit() {
    save();
    render();
  }

  function openFax(id) {
    var fax = faxById(id);
    var c = caseState(id);
    state.activeId = id;
    if (!c.seen) {
      c.seen = true;
      pushEvent("Opened fax " + fax.label);
      pushEvent(
        "Classification: " +
          (fax.classification.isReferral ? "referral" : "not a referral") +
          " at " +
          fax.classification.confidence +
          "% confidence"
      );
    } else {
      pushEvent("Opened again: " + fax.label);
    }
    commit();
    var el = document.getElementById("case");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function acceptField(fid) {
    var fax = activeFax();
    if (!fax) return;
    var c = caseState(fax.id);
    if (c.locked) return;
    var meta = fieldMeta(fax, fid);
    var fs = c.fields[fid];
    if (meta.low && !fs.fixed) {
      pushEvent("Accept blocked on " + fieldLabel(fid) + ": still low-confidence. Edit or Send to human.");
      commit();
      return;
    }
    fs.accepted = true;
    fs.sentHuman = false;
    pushEvent("Accepted field: " + fieldLabel(fid) + " on " + fax.label);
    commit();
  }

  function startEdit(fid) {
    var fax = activeFax();
    if (!fax) return;
    var c = caseState(fax.id);
    if (c.locked) return;
    var meta = fieldMeta(fax, fid);
    if (!meta.low || !meta.correctValue) {
      pushEvent("Edit skipped: " + fieldLabel(fid) + " has no synthetic wrong value to fix.");
      commit();
      return;
    }
    var fs = c.fields[fid];
    fs.value = meta.correctValue;
    fs.fixed = true;
    fs.edited = true;
    fs.accepted = true;
    fs.sentHuman = false;
    pushEvent("Edited " + fieldLabel(fid) + " on " + fax.label + " to " + meta.correctValue);
    commit();
  }

  function sendHuman(fid) {
    var fax = activeFax();
    if (!fax) return;
    var c = caseState(fax.id);
    if (c.locked) return;
    var fs = c.fields[fid];
    fs.sentHuman = true;
    fs.accepted = false;
    pushEvent("Sent to human: " + fieldLabel(fid) + " on " + fax.label);
    commit();
  }

  function lockCase() {
    var fax = activeFax();
    if (!fax) return;
    var c = caseState(fax.id);
    var blocks = lockReasons(fax, c);
    if (blocks.length) {
      pushEvent("Lock blocked on " + fax.label + ": " + blocks[0]);
      commit();
      return;
    }
    if (c.locked) return;
    c.locked = true;
    if (!c.contributed && fax.classification.isReferral) {
      c.contributed = true;
      Object.keys(fax.fields).forEach(function (fid) {
        var meta = fax.fields[fid];
        var fs = c.fields[fid];
        var correct = true;
        if (meta.low) {
          correct = !!(fs.fixed || fs.sentHuman);
        }
        if (!state.extras[fid]) state.extras[fid] = [];
        state.extras[fid].push(correct);
      });
    }
    pushEvent("Locked case: " + fax.label + ". Scorecard updated. Nothing written to a real EMR.");
    commit();
    var el = document.getElementById("scorecard");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function reset() {
    state = fresh();
    localStorage.removeItem(KEY);
    render();
  }

  function queueStatus(fax) {
    var c = caseState(fax.id);
    if (c.locked) return { text: "Locked", cls: "chip locked" };
    if (!fax.classification.isReferral) return { text: "Not a referral", cls: "chip" };
    if (lowOpen(fax, c).length) return { text: "Needs review", cls: "chip needs" };
    if (c.seen) return { text: "Ready to lock", cls: "chip" };
    return { text: "New", cls: "chip" };
  }

  function queueCard(fax) {
    var on = state.activeId === fax.id ? " card on" : " card";
    var st = queueStatus(fax);
    var tip = fax.isHappyPath ? " Start here for the 90-second path." : "";
    return (
      '<li><article class="' +
      on.trim() +
      '">' +
      '<span class="' +
      st.cls +
      '">' +
      esc(st.text) +
      "</span>" +
      "<h3>" +
      esc(fax.label) +
      "</h3>" +
      "<p>Received " +
      esc(fax.received) +
      ". Classification confidence " +
      fax.classification.confidence +
      "%." +
      tip +
      "</p>" +
      '<button type="button" class="btn primary" data-act="open" data-id="' +
      esc(fax.id) +
      '">Open fax</button>' +
      "</article></li>"
    );
  }

  function fieldBlock(fax, fid) {
    var meta = fieldMeta(fax, fid);
    var c = caseState(fax.id);
    var fs = c.fields[fid];
    var badge;
    if (fs.sentHuman) badge = '<span class="badge lo">Sent to human</span>';
    else if (fs.fixed) badge = '<span class="badge fixed">Edited</span>';
    else if (meta.low) badge = '<span class="badge lo">Low confidence ' + meta.confidence + "%</span>";
    else badge = '<span class="badge hi">' + meta.confidence + "% confidence</span>";

    var why = "";
    if (meta.low && !fs.fixed && !fs.sentHuman && meta.wrongWhy) {
      why = '<p class="status bad">' + esc(meta.wrongWhy) + "</p>";
    } else if (fs.fixed) {
      why = '<p class="status ok">Fixed to ' + esc(fs.value) + ". Ready for lock.</p>";
    } else if (fs.sentHuman) {
      why = '<p class="status warn">Held for a human. Lock can proceed without EMR auto-fill on this field.</p>';
    }

    var actions = "";
    if (!c.locked && fax.classification.isReferral) {
      var showEdit = meta.low && !fs.fixed;
      actions =
        '<div class="btn-row">' +
        (showEdit
          ? '<button type="button" class="btn primary" data-act="edit" data-fid="' +
            esc(fid) +
            '">Edit field</button>'
          : '<button type="button" class="btn ghost" data-act="accept" data-fid="' +
            esc(fid) +
            '">Accept field</button>') +
        (meta.low && !fs.sentHuman
          ? '<button type="button" class="btn danger" data-act="human" data-fid="' +
            esc(fid) +
            '">Send to human</button>'
          : "") +
        "</div>";
    }

    var auto = autoFillAllowed(fax, fid, fs)
      ? '<p class="cite">Auto-fill rule: pass for this field on this case.</p>'
      : '<p class="cite">Auto-fill rule: hold. Needs review or fails the batch bar.</p>';

    return (
      '<div class="field">' +
      '<div class="field-top"><p class="field-name">' +
      esc(fieldLabel(fid)) +
      "</p>" +
      badge +
      "</div>" +
      "<p><strong>Value.</strong> " +
      esc(fs.value) +
      "</p>" +
      '<p class="cite">Citation: ' +
      esc(meta.cite) +
      "</p>" +
      why +
      auto +
      actions +
      "</div>"
    );
  }

  function caseBlock() {
    var fax = activeFax();
    if (!fax) {
      return (
        '<section class="card" id="case">' +
        "<h2>Open a fax</h2>" +
        "<p>Pick FX-204 Cardiology consult for the happy path, or any other synthetic fax.</p>" +
        "</section>"
      );
    }
    var c = caseState(fax.id);
    var cls = fax.classification;
    var clsLine = cls.isReferral
      ? "AI classification: this is a referral (" + cls.confidence + "% confidence)."
      : "AI classification: this is not a referral (" + cls.confidence + "% confidence).";
    var clsStatus = cls.isReferral ? "status ok" : "status warn";

    var fieldHtml = D.fields
      .map(function (f) {
        return fieldBlock(fax, f.id);
      })
      .join("");

    var blocks = lockReasons(fax, c);
    var lockMsg;
    if (c.locked) {
      lockMsg = '<p class="status ok">Case locked for this session. Scorecard includes this outcome. Nothing uploaded.</p>';
    } else if (blocks.length) {
      lockMsg = '<p class="status bad">' + esc(blocks.join(" ")) + "</p>";
    } else {
      lockMsg = '<p class="status ok">Review is clear. Lock case is open.</p>';
    }

    var lockDisabled = canLock(fax, c) ? "" : " disabled";
    var lockLabel = c.locked ? "Case locked" : "Lock case";

    return (
      '<section class="card" id="case">' +
      "<h2>Fax and extraction</h2>" +
      '<p class="kicker">' +
      esc(fax.label) +
      "</p>" +
      '<div class="fax" role="img" aria-label="Synthetic fax facsimile">' +
      esc(fax.faxText) +
      "</div>" +
      '<p class="' +
      clsStatus +
      '">' +
      esc(clsLine) +
      "</p>" +
      "<h3>Extracted fields</h3>" +
      fieldHtml +
      "<h3>Lock</h3>" +
      lockMsg +
      '<button type="button" class="btn good" data-act="lock"' +
      lockDisabled +
      ">" +
      lockLabel +
      "</button>" +
      "</section>"
    );
  }

  function scorecardBlock() {
    var rows = D.fields
      .map(function (f) {
        var pct = accuracyPct(f.id);
        var pass = pct >= D.autoFillRule.batchAccuracyMin;
        return (
          '<li class="row ' +
          (pass ? "pass" : "fail") +
          '"><span>' +
          esc(f.label) +
          " (" +
          batchSeries(f.id).length +
          " faxes)</span><strong>" +
          pct +
          "%</strong></li>"
        );
      })
      .join("");

    return (
      '<section class="card" id="scorecard">' +
      "<h2>Field accuracy scorecard</h2>" +
      '<p class="rule">' +
      esc(D.autoFillRule.plain) +
      "</p>" +
      "<p>Batch accuracy updates when you lock a clean referral case. Synthetic counts only.</p>" +
      '<ul class="bar">' +
      rows +
      "</ul>" +
      '<div class="btn-col">' +
      '<button type="button" class="btn ghost" data-act="reset">Reset demo</button>' +
      "</div>" +
      "</section>"
    );
  }

  function auditBlock() {
    var items = state.events
      .map(function (ev) {
        return "<li><span>" + esc(ev.t) + "</span> " + esc(ev.text) + "</li>";
      })
      .join("");
    return (
      '<section class="card" id="audit">' +
      "<h2>Event trail</h2>" +
      "<p>Open, classify, edit, send to human, and lock show up here.</p>" +
      '<ol class="log">' +
      items +
      "</ol>" +
      "</section>"
    );
  }

  function render() {
    var cards = D.faxes.map(queueCard).join("");
    root.innerHTML =
      '<header><p class="brand">' +
      esc(D.productName) +
      "</p><h1>Fax referral desk</h1></header>" +
      '<p class="banner">Synthetic referral desk for ' +
      esc(D.program) +
      ". Not a real fax system. Not real patient data. No PHI.</p>" +
      "<section><h2>Incoming faxes</h2><ul class=\"queue\">" +
      cards +
      "</ul></section>" +
      caseBlock() +
      scorecardBlock() +
      auditBlock() +
      '<footer><p>Prototype for interview practice. Not affiliated with Luminai. Not a Luminai product. Synthetic faxes only. No real patient PHI.</p></footer>';
  }

  root.addEventListener("click", function (ev) {
    var btn = ev.target.closest("button");
    if (!btn) return;
    var act = btn.getAttribute("data-act");
    if (act === "open") openFax(btn.getAttribute("data-id"));
    else if (act === "accept") acceptField(btn.getAttribute("data-fid"));
    else if (act === "edit") startEdit(btn.getAttribute("data-fid"));
    else if (act === "human") sendHuman(btn.getAttribute("data-fid"));
    else if (act === "lock") lockCase();
    else if (act === "reset") reset();
  });

  render();
})();
