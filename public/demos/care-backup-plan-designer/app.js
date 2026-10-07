(function () {
  const DATA = window.CARE_DATA;
  const KEY = "care-backup-plan-designer-v1";
  const SCREENS = [
    ["profile", "Profile"],
    ["plan", "Plan"],
    ["projection", "Projection"],
    ["supply", "Supply"],
    ["compare", "Tiers"],
    ["employee", "Employee"],
    ["quote", "Quote"]
  ];

  function seed() {
    const plus = DATA.tiers.plus;
    return {
      screen: "profile",
      flash: "",
      metros: DATA.metros.map((m) => Object.assign({}, m)),
      days: plus.days,
      inHome: plus.inHome,
      center: plus.center,
      child: plus.child,
      adult: plus.adult,
      pet: plus.pet,
      eligibility: plus.eligibility,
      nightRule: "none",
      budget: 600000,
      centers: { dallas: 0, atlanta: 0, phoenix: 0, chicago: 0, remote: 0 },
      ramps: { dallas: "", atlanta: "", phoenix: "", chicago: "", remote: "" },
      tier: "plus",
      viewer: "ft",
      bookType: "child",
      bookPlace: "center",
      bookDate: "2026-10-08",
      booked: false
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seed();
      const saved = JSON.parse(raw);
      const base = seed();
      if (!saved) return base;
      Object.keys(base).forEach((k) => { if (saved[k] !== undefined) base[k] = saved[k]; });
      base.metros = DATA.metros.map((m) => Object.assign({}, m, (saved.metros || []).find((row) => row.id === m.id) || {}));
      base.flash = "";
      return base;
    } catch (err) {
      return seed();
    }
  }

  let state = load();
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function money(n) {
    return "$" + Math.round(Number(n) || 0).toLocaleString("en-US");
  }

  function planFrom(src) {
    return {
      days: src.days,
      inHome: src.inHome,
      center: src.center,
      child: src.child,
      adult: src.adult,
      pet: src.pet,
      eligibility: src.eligibility,
      nightRule: src.nightRule || "none"
    };
  }

  function workingPlan() { return planFrom(state); }

  function typeFactor(plan) {
    if (!plan.child && !plan.adult && !plan.pet) return 0;
    if (plan.child && !plan.adult && !plan.pet) return 0.72;
    if (!plan.child && plan.adult && !plan.pet) return 0.4;
    if (!plan.child && !plan.adult && plan.pet) return 0.15;
    return plan.pet ? 1.08 : 1;
  }

  function project(plan) {
    const hc = state.metros.reduce((sum, m) => sum + (Number(m.headcount) || 0), 0);
    const eligRate = plan.eligibility === "ft" ? DATA.ftShare : plan.eligibility === "group" ? 0.55 : 1;
    const dayFactor = 0.9 + 0.1 * (plan.days / 10);
    const copayFactor = Math.min(1.15, Math.max(0.7, 1 - (plan.inHome - 8) * 0.01 - (plan.center - 15) * 0.005));
    const takeup = 0.18 * dayFactor * copayFactor * typeFactor(plan);
    const eligible = hc * eligRate;
    const users = eligible * takeup;
    const avg = Math.min(plan.days, 4.5 * Math.sqrt(plan.days / 10));
    const careDays = users * avg;
    const inHomeEmployer = 159 - 8 * plan.inHome;
    const centerEmployer = 85 - plan.center;
    const perDay = 0.55 * inHomeEmployer + 0.45 * centerEmployer;
    const cost = careDays * perDay;
    const avoided = careDays * 0.55;
    const dayValue = 0.3 * 380 + 0.7 * 250;
    const benefit = avoided * dayValue;
    const roi = cost > 0 ? benefit / cost : 0;
    const supply = state.metros.map((m) => {
      const share = hc ? m.headcount / hc : 0;
      const yearly = careDays * share;
      const peak = yearly / 12 * 1.25;
      const extra = (Number(state.centers[m.id]) || 0) * 7;
      const cap = m.caregivers == null ? null : (m.caregivers + m.slots + extra);
      const fill = cap == null ? null : Math.min(1, cap / Math.max(peak, 0.0001));
      return {
        id: m.id,
        name: m.name,
        headcount: m.headcount,
        share: share,
        yearly: yearly,
        peak: peak,
        cap: cap,
        fill: fill,
        ramp: (state.ramps[m.id] || "").trim(),
        needs: share >= 0.05
      };
    });
    return { hc: hc, eligible: eligible, users: users, avg: avg, careDays: careDays, perDay: perDay, cost: cost, benefit: benefit, roi: roi, supply: supply, inHomeEmployer: inHomeEmployer, centerEmployer: centerEmployer };
  }

  function conflict(plan) {
    const includesPt = plan.eligibility === "all";
    return includesPt && plan.nightRule === "exclude-pt";
  }

  function quoteChecks(result, plan) {
    const reasons = [];
    result.supply.forEach((m) => {
      if (!m.needs) return;
      if (m.fill == null && !m.ramp) reasons.push(m.name + " is at least 5% of headcount and has no provider fill rate. Add a ramp note or it stays blocked.");
      else if (m.fill != null && m.fill < 0.9 && !m.ramp) reasons.push(m.name + " fill rate is " + Math.round(m.fill * 100) + "%, under the 90% target.");
    });
    if (result.cost > state.budget) reasons.push("Employer cost " + money(result.cost) + " is over the budget of " + money(state.budget) + ".");
    if (conflict(plan)) reasons.push("Eligibility conflict: part-time staff are included in one rule and excluded in another.");
    return reasons;
  }

  function footer() {
    return '<footer class="site-footer"><p><a href="https://amiteshdwivedijhu-ship-it.github.io/" target="_blank" rel="noopener noreferrer">Prototype by Amitesh Dwivedi</a></p>' +
      "<p>Prototype for interview practice. Not affiliated with Care.com. Not a Care.com product. Synthetic employer, providers, prices, and assumptions only.</p></footer>";
  }

  function chrome(body) {
    const nav = SCREENS.map(([id, label]) => '<button type="button" class="nav-btn" data-action="screen" data-screen="' + id + '"' + (state.screen === id ? ' aria-current="page"' : "") + ">" + label + "</button>").join("");
    return '<header class="topbar"><div class="brand"><h1>Backup Care Plan Designer</h1><p>' + esc(DATA.employer) + "</p></div>" +
      '<button type="button" class="btn" data-action="reset">Reset demo</button></header><div class="wrap">' +
      '<div class="banner" role="note"><p><strong>Sample data.</strong> ' + esc(DATA.employer) + " is a synthetic employer. Providers, prices, and assumptions are fake. Buyer " + esc(DATA.buyer) + ".</p></div>" +
      '<nav class="screen-nav" aria-label="Screens">' + nav + "</nav>" +
      (state.flash ? '<p class="lock-box" role="status">' + esc(state.flash) + "</p>" : "") +
      body + footer() + "</div>";
  }

  function screenProfile() {
    const rows = state.metros.map((m) => {
      return '<article class="card"><h3>' + esc(m.name) + "</h3>" +
        '<label class="field"><span>Headcount</span><input type="number" min="0" data-metro="' + m.id + '" data-field="headcount" value="' + esc(m.headcount) + '"></label>' +
        '<label class="field"><span>Kids under 13 share</span><input type="number" min="0" max="1" step="0.01" data-metro="' + m.id + '" data-field="kids" value="' + esc(m.kids) + '"></label>' +
        '<label class="field"><span>Shift worker share</span><input type="number" min="0" max="1" step="0.01" data-metro="' + m.id + '" data-field="shift" value="' + esc(m.shift) + '"></label>' +
        "<p>" + Math.round(m.kids * 100) + "% with kids under 13. " + Math.round(m.shift * 100) + "% shift workers.</p></article>";
    }).join("");
    const hc = state.metros.reduce((s, m) => s + (Number(m.headcount) || 0), 0);
    return "<h2>Employer profile</h2><p>" + hc.toLocaleString("en-US") + " employees. Full-time share in this sample is 80%. Demand math uses headcount. Kids and shift shares stay on the profile.</p>" + rows;
  }

  function screenPlan() {
    const tiers = Object.keys(DATA.tiers).map((id) => '<button type="button" class="choice" data-action="tier" data-id="' + id + '" aria-pressed="' + (state.tier === id ? "true" : "false") + '">' + DATA.tiers[id].name + "</button>").join("");
    const days = [5, 10, 15, 20].map((d) => '<button type="button" class="choice" data-action="days" data-id="' + d + '" aria-pressed="' + (Number(state.days) === d ? "true" : "false") + '">' + d + " days</button>").join("");
    return "<h2>Plan builder</h2><div class=\"choice-row\" role=\"group\" aria-label=\"Tier\">" + tiers + "</div>" +
      "<h3>Days per employee</h3><div class=\"choice-row\">" + days + "</div>" +
      '<label class="field"><span>In-home copay per hour</span><input type="number" min="0" data-field="inHome" value="' + esc(state.inHome) + '"></label>' +
      '<label class="field"><span>Center copay per day</span><input type="number" min="0" data-field="center" value="' + esc(state.center) + '"></label>' +
      "<h3>Care types</h3><div class=\"choice-row\">" +
      '<button type="button" class="choice" data-action="care" data-id="child" aria-pressed="' + state.child + '">Child</button>' +
      '<button type="button" class="choice" data-action="care" data-id="adult" aria-pressed="' + state.adult + '">Adult</button>' +
      '<button type="button" class="choice" data-action="care" data-id="pet" aria-pressed="' + state.pet + '">Pet</button></div>' +
      '<label class="field"><span>Eligibility</span><select data-field="eligibility">' +
      '<option value="ft"' + (state.eligibility === "ft" ? " selected" : "") + ">Full-time only</option>" +
      '<option value="all"' + (state.eligibility === "all" ? " selected" : "") + ">All employees, including part-time</option>" +
      '<option value="group"' + (state.eligibility === "group" ? " selected" : "") + ">Clinical group only</option></select></label>" +
      '<label class="field"><span>Night shift rule</span><select data-field="nightRule">' +
      '<option value="none"' + (state.nightRule === "none" ? " selected" : "") + ">No extra rule</option>" +
      '<option value="exclude-pt"' + (state.nightRule === "exclude-pt" ? " selected" : "") + ">Exclude part-time</option></select></label>" +
      '<label class="field"><span>Employer budget</span><input type="number" min="0" step="10000" data-field="budget" value="' + esc(state.budget) + '"></label>' +
      (conflict(workingPlan()) ? '<p class="bad">Conflict: part-time staff are included above and excluded in the night shift rule.</p>' : '<p class="good">No eligibility conflict.</p>');
  }

  function assumptionList() {
    return "<ul>" + DATA.assumptions.map((a) => "<li><strong>" + esc(a[0]) + ".</strong> " + esc(a[1]) + " Source label: synthetic assumption.</li>").join("") + "</ul>";
  }

  function screenProjection() {
    const result = project(workingPlan());
    return "<h2>Projection</h2><div class=\"grid\">" +
      '<article class="card"><p class="label">Users</p><p class="stat">' + Math.round(result.users).toLocaleString("en-US") + "</p><p>of " + Math.round(result.eligible).toLocaleString("en-US") + " eligible</p></article>" +
      '<article class="card"><p class="label">Care days</p><p class="stat">' + Math.round(result.careDays).toLocaleString("en-US") + "</p><p>about " + result.avg.toFixed(1) + " days each</p></article>" +
      '<article class="card"><p class="label">Employer cost</p><p class="stat">' + money(result.cost) + "</p><p>ROI " + result.roi.toFixed(1) + "x</p></article></div>" +
      "<p>Employee savings are the copays they would avoid versus paying full price. This sample tracks employer cost and avoided absence, not a second savings total.</p>" +
      "<h3>Assumptions</h3>" + assumptionList();
  }

  function screenSupply() {
    const result = project(workingPlan());
    const cards = result.supply.map((m) => {
      const fillText = m.fill == null ? "Reimbursement only" : Math.round(m.fill * 100) + "%";
      const flag = m.needs && m.fill != null && m.fill < 0.9 && !m.ramp;
      const words = flag ? '<p class="bad">Below target. Fill rate is under 90%.</p>' : '<p class="good">' + (m.fill == null ? "No network target. Headcount share is under 5%, or this metro is reimbursement only." : "Meets target, or a ramp note is on file.") + "</p>";
      return '<article class="card"><h3>' + esc(m.name) + "</h3><p class=\"stat\">" + fillText + "</p>" +
        "<p>Headcount " + Math.round(m.headcount).toLocaleString("en-US") + " (" + Math.round(m.share * 100) + "%). Peak month about " + Math.round(m.peak) + " care days. Capacity " + (m.cap == null ? "n/a" : Math.round(m.cap)) + ".</p>" +
        words +
        '<label class="field"><span>Partner centers to add</span><input type="number" min="0" data-center="' + m.id + '" value="' + esc(state.centers[m.id]) + '"></label>' +
        "<p>Suggested fixes: add partner centers, raise the caregiver incentive, or cap days in month 1. Each center adds 7 slots a month.</p>" +
        '<label class="field"><span>Ramp plan note</span><textarea data-ramp="' + m.id + '">' + esc(state.ramps[m.id]) + "</textarea></label></article>";
    }).join("");
    return "<h2>Supply check</h2><p>Target is 90% fill in every metro with at least 5% of headcount.</p>" + cards;
  }

  function screenCompare() {
    const cards = Object.keys(DATA.tiers).map((id) => {
      const tier = DATA.tiers[id];
      const plan = planFrom(Object.assign({}, tier, { nightRule: "none" }));
      const result = project(plan);
      const blocked = result.supply.filter((m) => m.needs && ((m.fill == null && !m.ramp) || (m.fill != null && m.fill < 0.9 && !m.ramp)));
      const supply = blocked.length ? "Below target in " + blocked.map((m) => m.name).join(", ") : "Meets target";
      return '<article class="card"><h3>' + esc(tier.name) + "</h3><p>" + tier.days + " days. In-home $" + tier.inHome + "/hour. Center $" + tier.center + "/day.</p>" +
        "<p>Cost " + money(result.cost) + "</p><p>ROI " + result.roi.toFixed(1) + "x</p><p>" + esc(supply) + "</p>" +
        '<button type="button" class="btn" data-action="tier" data-id="' + id + '">Use ' + esc(tier.name) + "</button></article>";
    }).join("");
    return "<h2>Tier compare</h2><p>Presets use the current headcount and any centers or ramp notes you already added.</p><div class=\"grid\">" + cards + "</div>" +
      '<div class="table-wrap"><table><thead><tr><th>Tier</th><th>Cost</th><th>ROI</th><th>Supply</th></tr></thead><tbody>' +
      Object.keys(DATA.tiers).map((id) => {
        const tier = DATA.tiers[id];
        const result = project(planFrom(Object.assign({}, tier, { nightRule: "none" })));
        const blocked = result.supply.filter((m) => m.needs && m.fill != null && m.fill < 0.9 && !m.ramp);
        return "<tr><td>" + esc(tier.name) + "</td><td>" + money(result.cost) + "</td><td>" + result.roi.toFixed(1) + "x</td><td>" + (blocked.length ? "Below target" : "Meets target") + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  function screenEmployee() {
    const plan = workingPlan();
    const left = Math.max(0, plan.days - DATA.employee.used);
    const eligible = !(plan.eligibility === "ft" && state.viewer === "pt") && !(plan.eligibility === "group" && state.viewer === "pt");
    const types = [["child", "Child"], ["adult", "Adult"], ["pet", "Pet"]].filter((t) => plan[t[0]]).map((t) => {
      return '<button type="button" class="choice" data-action="book-type" data-id="' + t[0] + '" aria-pressed="' + (state.bookType === t[0] ? "true" : "false") + '">' + t[1] + "</button>";
    }).join("");
    return '<div class="phone"><h2>Need backup care tomorrow?</h2><p>' + esc(DATA.employee.name) + " · " + esc(DATA.employee.metro) + "</p>" +
      '<div class="choice-row"><button type="button" class="choice" data-action="viewer" data-id="ft" aria-pressed="' + (state.viewer === "ft" ? "true" : "false") + '">View as full-time</button>' +
      '<button type="button" class="choice" data-action="viewer" data-id="pt" aria-pressed="' + (state.viewer === "pt" ? "true" : "false") + '">View as part-time</button></div>' +
      "<p><strong>" + left + " of " + plan.days + " days left</strong> this year.</p>" +
      "<p>In-home copay $" + plan.inHome + " an hour. Center copay $" + plan.center + " a day.</p>" +
      (eligible ? '<p class="good">Eligible under this plan.</p>' : '<p class="bad">Not eligible. This plan does not cover this group.</p>') +
      '<label class="field"><span>Date</span><input type="date" data-field="bookDate" value="' + esc(state.bookDate) + '"></label>' +
      "<h3>Care type</h3><div class=\"choice-row\">" + (types || "<p>No care types on this plan.</p>") + "</div>" +
      "<h3>Where</h3><div class=\"choice-row\">" +
      '<button type="button" class="choice" data-action="book-place" data-id="inhome" aria-pressed="' + (state.bookPlace === "inhome" ? "true" : "false") + '">In-home</button>' +
      '<button type="button" class="choice" data-action="book-place" data-id="center" aria-pressed="' + (state.bookPlace === "center" ? "true" : "false") + '">Center</button></div>' +
      '<button type="button" class="btn btn-primary" data-action="book"' + (eligible ? "" : " disabled") + ">Book backup care</button>" +
      (state.booked ? '<p class="ready-box">Matching a caregiver (demo).</p>' : "") +
      "</div>";
  }

  function screenQuote() {
    const plan = workingPlan();
    const result = project(workingPlan());
    const reasons = quoteChecks(result, plan);
    const box = reasons.length
      ? '<div class="lock-box"><p><strong>Ready to quote is locked.</strong></p><ul>' + reasons.map((r) => "<li>" + esc(r) + "</li>").join("") + "</ul></div>"
      : '<div class="ready-box"><p class="good">Ready to quote. All four checks pass.</p></div>';
    const supply = result.supply.map((m) => "<li>" + esc(m.name) + ": " + (m.fill == null ? "reimbursement only" : Math.round(m.fill * 100) + "% fill") + (m.ramp ? ". Ramp note: " + esc(m.ramp) : "") + "</li>").join("");
    return '<article class="card" id="quote"><h2>Quote summary</h2><p>' + esc(DATA.employer) + " for " + esc(DATA.buyer) + ".</p>" +
      "<p>" + state.days + " days. In-home $" + state.inHome + "/hour. Center $" + state.center + "/day. Care: " +
      [state.child && "child", state.adult && "adult", state.pet && "pet"].filter(Boolean).join(", ") + ".</p>" +
      "<p>Eligible employees about " + Math.round(result.eligible).toLocaleString("en-US") + ". Users about " + Math.round(result.users).toLocaleString("en-US") + ". Care days about " + Math.round(result.careDays).toLocaleString("en-US") + ".</p>" +
      "<p>Employer cost " + money(result.cost) + ". Budget " + money(state.budget) + ". ROI " + result.roi.toFixed(1) + "x. Avoided-absence value " + money(result.benefit) + ".</p>" +
      "<h3>Supply</h3><ul>" + supply + "</ul><h3>Assumptions</h3>" + assumptionList() + "</article>" +
      box + '<button type="button" class="btn no-print" data-action="print">Print quote</button>';
  }

  function render() {
    const map = { profile: screenProfile, plan: screenPlan, projection: screenProjection, supply: screenSupply, compare: screenCompare, employee: screenEmployee, quote: screenQuote };
    document.getElementById("app").innerHTML = chrome((map[state.screen] || screenProfile)());
  }

  function applyTier(id) {
    const tier = DATA.tiers[id];
    state.tier = id;
    state.days = tier.days;
    state.inHome = tier.inHome;
    state.center = tier.center;
    state.child = tier.child;
    state.adult = tier.adult;
    state.pet = tier.pet;
    state.eligibility = tier.eligibility;
    state.nightRule = "none";
  }

  function onClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action !== "reset") state.flash = "";
    if (action === "reset") { localStorage.removeItem(KEY); state = seed(); save(); render(); return; }
    if (action === "screen") { state.screen = btn.dataset.screen; save(); render(); return; }
    if (action === "tier") { applyTier(btn.dataset.id); save(); render(); return; }
    if (action === "days") { state.days = Number(btn.dataset.id); state.tier = "custom"; save(); render(); return; }
    if (action === "care") { state[btn.dataset.id] = !state[btn.dataset.id]; state.tier = "custom"; save(); render(); return; }
    if (action === "viewer") { state.viewer = btn.dataset.id; save(); render(); return; }
    if (action === "book-type") { state.bookType = btn.dataset.id; save(); render(); return; }
    if (action === "book-place") { state.bookPlace = btn.dataset.id; save(); render(); return; }
    if (action === "book") { state.booked = true; save(); render(); return; }
    if (action === "print") window.print();
  }

  function onInput(e) {
    const t = e.target;
    if (t.dataset.metro && t.dataset.field) {
      const m = state.metros.find((row) => row.id === t.dataset.metro);
      m[t.dataset.field] = Number(t.value);
      save();
      return;
    }
    if (t.dataset.center) { state.centers[t.dataset.center] = Number(t.value); save(); render(); return; }
    if (t.dataset.ramp !== undefined && t.dataset.ramp !== "") {
      state.ramps[t.dataset.ramp] = t.value;
      save();
      if (e.type === "change") render();
      return;
    }
    if (t.dataset.field === "inHome" || t.dataset.field === "center" || t.dataset.field === "budget" || t.dataset.field === "days") {
      state[t.dataset.field] = Number(t.value);
      if (t.dataset.field !== "budget") state.tier = "custom";
      save();
      return;
    }
    if (t.dataset.field === "eligibility" || t.dataset.field === "nightRule" || t.dataset.field === "bookDate") {
      state[t.dataset.field] = t.value;
      if (t.dataset.field !== "bookDate") state.tier = "custom";
      save();
      render();
    }
  }

  document.getElementById("app").addEventListener("click", onClick);
  document.getElementById("app").addEventListener("input", onInput);
  document.getElementById("app").addEventListener("change", onInput);
  render();
})();
