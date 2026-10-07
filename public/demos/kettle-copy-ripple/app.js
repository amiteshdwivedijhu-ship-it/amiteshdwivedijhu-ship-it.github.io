(function () {
  const DATA = window.KETTLE_DATA;
  const KEY = "kettle-copy-ripple-v1";
  const main = document.getElementById("main");

  function fresh() {
    return {
      screen: "deck",
      p1: DATA.samplePrice,
      l1: DATA.sampleLegal,
      shown: false,
      choice: {},
      editId: "",
      alt: {},
      altEdit: "",
      legalBy: "",
      legalText: "",
      localeBy: ""
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

  function price() {
    return state.shown ? state.p1 : "$249";
  }

  function baseText(placement) {
    if (placement.legal) return state.shown ? state.l1 : placement.oldText;
    if (placement.needsHumanLocale) return state.shown ? placement.localeText : placement.oldText;
    const template = placement.fit || placement.oldText;
    return template.replaceAll("{{price}}", state.shown ? state.p1 : "$249");
  }

  function currentText(placement) {
    if (state.choice[placement.id] && state.choice[placement.id].text) return state.choice[placement.id].text;
    return baseText(placement);
  }

  function draftsFor(placement) {
    if (placement.legal) return [];
    if (placement.drafts && placement.drafts.length) return placement.drafts;
    return [];
  }

  function flags(placement) {
    const text = currentText(placement);
    const tooLong = text.length > placement.limit;
    const list = [];
    if (tooLong) list.push("Too long");
    if (placement.legal && !(state.legalBy && state.legalText === state.l1)) list.push("Needs legal");
    else if (placement.needsHumanLocale && !state.localeBy) list.push("Needs translation review");
    else if (!tooLong) list.push("Fits");
    if (placement.image && !(state.alt[placement.id] && state.alt[placement.id].approved)) list.push("Needs alt text");
    if (!list.length) list.push("Fits");
    return { list: list, tooLong: tooLong, text: text, len: text.length };
  }

  function summary() {
    const placements = DATA.placements.map(flags);
    return {
      tooLong: DATA.placements.filter(function (item) { return currentText(item).length > item.limit; }).length,
      legal: DATA.placements.filter(function (item) { return item.legal && !(state.legalBy && state.legalText === state.l1); }).length,
      locale: DATA.placements.filter(function (item) { return item.needsHumanLocale && !state.localeBy; }).length,
      alt: DATA.placements.filter(function (item) { return item.image && !(state.alt[item.id] && state.alt[item.id].approved); }).length,
      total: DATA.placements.length
    };
  }

  function shipReasons() {
    if (!state.shown) return ["Show the ripple first."];
    const counts = summary();
    const reasons = [];
    if (counts.tooLong) reasons.push(counts.tooLong + " placements still too long.");
    if (counts.legal) reasons.push(counts.legal + " legal lines still need a named person. Legal lines are not rewritten by AI.");
    if (counts.alt) reasons.push(counts.alt + " image placements still need updated alt text.");
    if (counts.locale) reasons.push(counts.locale + " non-English locale strings still need a person to review them.");
    return reasons;
  }

  function aspect(size) {
    const match = String(size || "").match(/^(\d+)x(\d+)$/);
    if (!match) return "16 / 5";
    return match[1] + " / " + match[2];
  }

  function pill(name) {
    const kind = name === "Fits" ? "ok" : (name === "Too long" ? "bad" : "warn");
    return "<span class='pill " + kind + "'>" + esc(name) + "</span>";
  }

  function render() {
    const active = document.activeElement;
    const focusId = active && active.id ? active.id : "";
    const sel = active && typeof active.selectionStart === "number" ? active.selectionStart : null;
    document.querySelectorAll(".tabs button").forEach(function (button) {
      button.classList.toggle("active-tab", button.getAttribute("data-screen") === state.screen);
    });
    const views = { deck: renderDeck, change: renderChange, ripple: renderRipple, fit: renderFit, alt: renderAlt, gate: renderGate, handoff: renderHandoff };
    main.innerHTML = (views[state.screen] || renderDeck)();
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

  function renderDeck() {
    const cards = DATA.deck.map(function (line) {
      return "<article class='card'><h2>" + esc(line.id) + " · " + esc(line.label) + (line.legal ? " · legal line" : "") + "</h2><p>" + esc(line.text) + "</p><p class='muted'>Used in: " + esc(line.usedIn.join(", ")) + ".</p></article>";
    }).join("");
    return "<section><p class='muted'>Master copy deck for " + esc(DATA.campaign) + ". Editors: " + esc(DATA.editors.production) + " and " + esc(DATA.editors.legal) + ".</p>" + cards + "</section>";
  }

  function renderChange() {
    return "<section class='card'><h2>Make a change</h2><p>The client moved the price and added a legal line. The sample change is filled in. Edit it if you want, then show the ripple.</p><label class='field' for='p1'>P1 price. Master is $249.</label><input id='p1' type='text' value='" + esc(state.p1) + "'><label class='field' for='l1'>L1 legal. Master is: Offer valid in US and Canada.</label><textarea id='l1'>" + esc(state.l1) + "</textarea><div class='actions'><button type='button' class='primary' id='show-ripple'>Show ripple</button></div>" + (state.shown ? "<div class='okbox'>Ripple is on for this price and legal line.</div>" : "") + "</section>";
  }

  function renderRipple() {
    if (!state.shown) return "<section class='card'><h2>Ripple map</h2><p>Change P1 and L1, then click Show ripple.</p></section>";
    const groups = {};
    DATA.placements.forEach(function (placement) {
      groups[placement.channel] = groups[placement.channel] || [];
      groups[placement.channel].push(placement);
    });
    const counts = summary();
    const html = Object.keys(groups).map(function (channel) {
      const cards = groups[channel].map(function (placement) {
        const info = flags(placement);
        const preview = placement.channel === "Display" ? "<div class='banner-box' style='aspect-ratio:" + aspect(placement.size) + ";width:min(100%," + (placement.size === "160x600" ? "160px" : "100%") + ")'>" + esc(info.text) + "</div>" : "";
        return "<article class='card'><h3>" + esc(placement.id) + "</h3><p>" + esc(placement.channel) + " · " + esc(placement.size) + " · " + esc(placement.locale) + "</p>" + preview + "<p>" + info.list.map(pill).join("") + "</p><p>" + info.len + " of " + placement.limit + " characters.</p></article>";
      }).join("");
      return "<h2>" + esc(channel) + "</h2>" + cards;
    }).join("");
    return "<section><p class='muted'>" + counts.total + " placements. " + counts.tooLong + " too long, " + counts.legal + " legal, " + counts.locale + " French, " + counts.alt + " need new alt text.</p>" + html + "</section>";
  }

  function renderFit() {
    if (!state.shown) return "<section class='card'><h2>Fit board</h2><p>Show the ripple first.</p></section>";
    const cards = DATA.placements.map(function (placement) {
      const info = flags(placement);
      const drafts = draftsFor(placement).map(function (draft, index) {
        const disabled = placement.legal ? " disabled" : "";
        return "<button type='button' data-draft='" + placement.id + "' data-index='" + index + "'" + disabled + ">Use this draft</button><p class='muted'>" + esc(draft) + " (" + draft.length + " of " + placement.limit + " characters)</p>";
      }).join("");
      const legalNote = placement.legal ? "<p class='lock'>Legal lines are not rewritten by AI. Route to client legal.</p>" : "";
      const edit = state.editId === placement.id ? "<textarea id='edit-" + placement.id + "'>" + esc(info.text) + "</textarea><button type='button' data-save-edit='" + placement.id + "'>Save edit</button>" : "";
      return "<article class='card'><h3>" + esc(placement.id) + " · " + esc(placement.locale) + "</h3><p><strong>Old.</strong> " + esc(placement.oldText) + "</p><p><strong>New.</strong> " + esc(info.text) + "</p><p>" + info.len + " of " + placement.limit + " characters." + (info.tooLong ? " Too long by " + (info.len - placement.limit) + "." : " Within the limit.") + "</p><p>" + info.list.map(pill).join("") + "</p>" + legalNote + "<div class='actions'>" + drafts + "<button type='button' data-edit='" + placement.id + "'>Edit</button><button type='button' data-approve='" + placement.id + "'" + (info.tooLong || placement.legal ? " disabled" : "") + ">Approve</button></div>" + edit + "</article>";
    }).join("");
    return "<section><h2>Fit board</h2>" + cards + "</section>";
  }

  function renderAlt() {
    const images = DATA.placements.filter(function (item) { return item.image; });
    const cards = images.map(function (placement) {
      const saved = state.alt[placement.id];
      const editing = state.altEdit === placement.id;
      return "<article class='card'><h3>" + esc(placement.id) + "</h3><p><strong>Current alt text.</strong> " + esc(placement.altCurrent) + "</p><p><strong>Updated draft.</strong> " + esc(placement.altDraft) + "</p>" + (saved && saved.approved ? "<div class='okbox'>Approved: " + esc(saved.text) + "</div>" : "<p class='pill warn'>Needs alt text</p>") + "<div class='actions'><button type='button' data-alt-approve='" + placement.id + "'>Approve</button><button type='button' data-alt-edit='" + placement.id + "'>Edit</button></div>" + (editing ? "<textarea id='alt-" + placement.id + "'>" + esc((saved && saved.text) || placement.altDraft) + "</textarea><button type='button' data-alt-save='" + placement.id + "'>Save alt text</button>" : "") + "</article>";
    }).join("");
    return "<section><h2>Alt text</h2><p class='muted'>" + images.length + " image placements.</p>" + cards + "</section>";
  }

  function renderGate() {
    const counts = summary();
    const reasons = shipReasons();
    const lines = [
      { ok: state.shown && counts.tooLong === 0, text: "Every placement fits its character limit. " + (state.shown ? counts.tooLong + " still too long." : "Ripple is not on.") },
      { ok: counts.legal === 0 && !!state.legalBy, text: "Every legal line is approved by a named person and was not rewritten by AI. " + (state.legalBy ? "Approved by " + state.legalBy + "." : counts.legal + " still open.") },
      { ok: counts.alt === 0, text: "Every image placement has updated alt text. " + counts.alt + " still open." },
      { ok: counts.locale === 0 && !!state.localeBy, text: "Every non-English locale string was reviewed by a person. " + (state.localeBy ? "Reviewed by " + state.localeBy + "." : counts.locale + " still open.") }
    ];
    const list = lines.map(function (line) {
      return "<p>" + pill(line.ok ? "Fits" : "Needs legal").replace("Fits", "Pass").replace("Needs legal", "Fail") + " " + esc(line.text) + "</p>";
    }).join("");
    return "<section class='card'><h2>Review gate</h2>" + list + (reasons.length ? "<div class='lock'>" + reasons.map(esc).join(" ") + "</div>" : "<div class='okbox'>Ready to ship.</div>") + "<div class='actions'><button type='button' id='approve-legal'>Approve legal as Marcus</button><button type='button' id='review-locale'>Mark fr-CA reviewed as Priya</button><button type='button' class='primary' id='ship-btn'" + (reasons.length ? " disabled" : "") + ">Ship</button></div><p class='muted'>Ship stays locked until every check passes. The handoff list is on the next screen.</p></section>";
  }

  function devRows() {
    return DATA.placements.map(function (placement) {
      const owner = placement.legal ? DATA.editors.legal : DATA.editors.production;
      return { id: placement.id, component: placement.component, oldText: placement.oldText, newText: currentText(placement), owner: owner, channel: placement.channel };
    });
  }

  function renderHandoff() {
    if (!state.shown) return "<section class='card'><h2>Handoff</h2><p>Show the ripple first.</p></section>";
    const rows = devRows();
    const body = rows.map(function (row) {
      return "<tr><td>" + esc(row.id) + "</td><td>" + esc(row.component) + "</td><td>" + esc(row.oldText) + "</td><td>" + esc(row.newText) + "</td><td>" + esc(row.owner) + "</td></tr>";
    }).join("");
    const sheet = rows.map(function (row) {
      return "<p><strong>" + esc(row.channel) + " · " + esc(row.id) + ".</strong> Was: " + esc(row.oldText) + " Now: " + esc(row.newText) + "</p>";
    }).join("");
    const ready = shipReasons().length === 0;
    return "<section><div class='" + (ready ? "okbox" : "lock") + "'>" + (ready ? "Ready to ship. Dev and client can use this list." : "Not ready to ship yet. You can still preview the list.") + "</div><div class='card'><h2>Dev change list</h2><div class='table-scroll'><table><thead><tr><th>Placement</th><th>File or component</th><th>Old</th><th>New</th><th>Owner</th></tr></thead><tbody>" + body + "</tbody></table></div><div class='actions'><button type='button' id='copy-list'>Copy to clipboard</button><button type='button' class='primary' id='download-csv'>Download CSV</button></div><textarea id='copy-box' readonly>" + esc(rows.map(function (row) { return [row.id, row.component, row.oldText, row.newText, row.owner].join(" | "); }).join("\n")) + "</textarea></div><div class='card'><h2>Client review sheet</h2><div class='sheet'>" + sheet + "</div></div></section>";
  }

  function csv() {
    const lines = [["placement", "component", "old", "new", "owner"].join(",")];
    devRows().forEach(function (row) {
      lines.push([row.id, row.component, row.oldText, row.newText, row.owner].map(function (value) {
        return '"' + String(value).replaceAll('"', '""') + '"';
      }).join(","));
    });
    return lines.join("\n");
  }

  document.body.addEventListener("click", function (event) {
    const tab = event.target.closest("[data-screen]");
    if (tab) {
      state.screen = tab.getAttribute("data-screen");
      save();
      render();
      return;
    }
    if (event.target.id === "show-ripple") {
      state.shown = true;
      state.legalBy = "";
      state.legalText = "";
      state.screen = "ripple";
      save();
      render();
      return;
    }
    const draft = event.target.closest("[data-draft]");
    if (draft && !draft.disabled) {
      const placement = DATA.placements.find(function (item) { return item.id === draft.getAttribute("data-draft"); });
      const text = draftsFor(placement)[Number(draft.getAttribute("data-index"))];
      if (placement.legal) return;
      state.choice[placement.id] = { text: text, via: "draft" };
      save();
      render();
      return;
    }
    const edit = event.target.closest("[data-edit]");
    if (edit) {
      state.editId = edit.getAttribute("data-edit");
      save();
      render();
      return;
    }
    const saveEdit = event.target.closest("[data-save-edit]");
    if (saveEdit) {
      const id = saveEdit.getAttribute("data-save-edit");
      const box = document.getElementById("edit-" + id);
      const placement = DATA.placements.find(function (item) { return item.id === id; });
      if (placement.legal) return;
      state.choice[id] = { text: box ? box.value : "", via: "edit" };
      state.editId = "";
      save();
      render();
      return;
    }
    const approve = event.target.closest("[data-approve]");
    if (approve && !approve.disabled) {
      const id = approve.getAttribute("data-approve");
      const placement = DATA.placements.find(function (item) { return item.id === id; });
      if (placement.legal) return;
      state.choice[id] = { text: currentText(placement), via: "approve" };
      save();
      render();
      return;
    }
    const altApprove = event.target.closest("[data-alt-approve]");
    if (altApprove) {
      const id = altApprove.getAttribute("data-alt-approve");
      const placement = DATA.placements.find(function (item) { return item.id === id; });
      state.alt[id] = { text: placement.altDraft, approved: true };
      save();
      render();
      return;
    }
    const altEdit = event.target.closest("[data-alt-edit]");
    if (altEdit) {
      state.altEdit = altEdit.getAttribute("data-alt-edit");
      save();
      render();
      return;
    }
    const altSave = event.target.closest("[data-alt-save]");
    if (altSave) {
      const id = altSave.getAttribute("data-alt-save");
      const box = document.getElementById("alt-" + id);
      const text = box ? box.value.trim() : "";
      if (!text) return;
      state.alt[id] = { text: text, approved: true };
      state.altEdit = "";
      save();
      render();
      return;
    }
    if (event.target.id === "approve-legal") {
      state.legalBy = DATA.editors.legal;
      state.legalText = state.l1;
      save();
      render();
      return;
    }
    if (event.target.id === "review-locale") {
      state.localeBy = DATA.editors.production;
      save();
      render();
      return;
    }
    if (event.target.id === "ship-btn") {
      if (shipReasons().length) return;
      state.screen = "handoff";
      state.shipped = true;
      save();
      render();
      return;
    }
    if (event.target.id === "copy-list") {
      const box = document.getElementById("copy-box");
      const text = box ? box.value : "";
      if (box) {
        box.focus();
        box.select();
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () { /* the box stays selected */ });
      }
      return;
    }
    if (event.target.id === "download-csv") {
      const blob = new Blob([csv()], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "northgate-halo2-dev-changes.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
  });

  document.body.addEventListener("input", function (event) {
    if (event.target.id === "p1") {
      state.p1 = event.target.value;
      state.shown = false;
      state.choice = {};
      save();
      return;
    }
    if (event.target.id === "l1") {
      state.l1 = event.target.value;
      state.shown = false;
      state.choice = {};
      if (state.legalText && state.legalText !== state.l1) state.legalBy = "";
      save();
    }
  });

  document.getElementById("btn-reset").addEventListener("click", function () {
    state = fresh();
    localStorage.removeItem(KEY);
    render();
  });

  render();
})();
