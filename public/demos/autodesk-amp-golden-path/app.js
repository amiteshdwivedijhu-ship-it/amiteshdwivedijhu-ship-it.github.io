(function () {
  "use strict";

  var DATA = {
    experiment: {
      id: "exp-fusion-sketch-assist-0412",
      run: "run-0412-f8c21",
      title: "Fine-tuned LLM that writes sketch constraint hints for a Fusion-style feature.",
      dataset: "ds-sketch-prompts-v7",
      evalSet: "eval-sketch-golden-v3",
      owner: "Priya Raman",
      team: "Fusion AI",
      practitioner: "Jordan Ellis",
      onCall: "#fusion-sketch-assist",
      productTeam: "Fusion Sketch product team"
    },
    endpoint: {
      name: "ep-sketch-assist-v4",
      url: "https://amp.internal.example/inference/ep-sketch-assist-v4",
      candidate: "v4",
      lastGood: "v3",
      artifact: "ma-sketch-assist-v4",
      artifactSize: "842 MB"
    },
    modelCard: {
      name: "fusion-sketch-assist",
      version: "v4",
      lastGood: "v3",
      owner: "Priya Raman, Fusion AI",
      base: "Llama 3.1 8B Instruct",
      baseNote: "Foundation model, fine-tuned for generative constraint hints.",
      data: "ds-sketch-prompts-v7. 186,000 sketch prompt and hint pairs from internal Fusion workflows. Tenant geometry stays in the tenant.",
      use: "Suggest dimensional and geometric constraints while a practitioner sketches a Fusion-style feature. A person accepts each hint before it is applied.",
      limits: [
        "English prompts only.",
        "Not for assemblies, drawings, or CAM toolpaths.",
        "Weak on imported DXF with mixed units.",
        "Does not write feature code."
      ]
    },
    gates: [
      { id: "eval", name: "Eval set attached", hint: "Requires eval-sketch-golden-v3." },
      { id: "pass", name: "Eval pass rate at or above 90%", hint: "Floor is 90%." },
      { id: "p95", name: "p95 latency under 800 ms", hint: "Limit is 800 ms." },
      { id: "error", name: "Error rate under 1%", hint: "Limit is 1%." },
      { id: "card", name: "Model card complete", hint: "Owner, base model, data, use, limits, and eval." },
      { id: "guard", name: "Guardrail scan passed", hint: "No critical findings." }
    ],
    copy: {
      blocked: "p95 latency is 1,240 ms. Limit is 800 ms. Fix: turn on response streaming or switch to the g5.2xlarge profile, then run checks again.",
      fixApplied: "Fix applied. Run checks again.",
      footer: "Concept prototype by Ami. Not an Autodesk product. All data is fake."
    },
    friction: {
      timeSaved: "3 to 5 days",
      stepsRemoved: "9",
      before: { tools: 5, steps: 14, time: "3 to 5 days" },
      after: { paths: 1, steps: 5, time: "about 20 minutes" },
      toolNames: [
        "AMP Studio notebook",
        "SageMaker console",
        "CI/CD pipeline",
        "Monitoring dashboard",
        "Wiki model card plus Slack"
      ],
      beforeSteps: [
        { tool: "AMP Studio notebook", text: "Export the finished run and copy the artifact URI." },
        { tool: "AMP Studio notebook", text: "Copy pass rate, p95, and error rate into a sheet." },
        { tool: "SageMaker console", text: "Create an endpoint config for the model artifact." },
        { tool: "SageMaker console", text: "Pick an instance profile and create the endpoint." },
        { tool: "SageMaker console", text: "Wait until the endpoint status says InService." },
        { tool: "CI/CD pipeline", text: "Add a package job for the model tarball." },
        { tool: "CI/CD pipeline", text: "Push the artifact to the model registry." },
        { tool: "CI/CD pipeline", text: "Set canary weights in the pipeline file." },
        { tool: "CI/CD pipeline", text: "Run the pipeline and approve the canary stage." },
        { tool: "Monitoring dashboard", text: "Pin p95, error rate, throughput, and cost." },
        { tool: "Monitoring dashboard", text: "Paste a Slack webhook for SLO alerts." },
        { tool: "Wiki model card plus Slack", text: "Write owner, data, intended use, and limits on the wiki." },
        { tool: "Wiki model card plus Slack", text: "Paste the endpoint URL and eval results into the wiki." },
        { tool: "Wiki model card plus Slack", text: "Message the product team in Slack and wait for a reply." }
      ],
      afterSteps: [
        "Validate the six gates.",
        "Package the model artifact.",
        "Deploy a canary and raise traffic.",
        "Monitor latency, errors, throughput, and cost.",
        "Hand off to the product team."
      ]
    },
    stops: [5, 25, 50, 100],
    series: {
      p95Happy: [820, 760, 710, 680, 650, 630, 612],
      p95Fail: [860, 940, 1020, 1100, 1160, 1210, 1240],
      p95Fixed: [1240, 980, 820, 720, 660, 620, 586],
      p95Canary: [700, 680, 660, 650, 640, 634, 628],
      p95Live: [640, 630, 622, 616, 610, 606, 604],
      err: [0.62, 0.55, 0.48, 0.41, 0.37, 0.34, 0.31],
      errFail: [0.7, 0.62, 0.58, 0.51, 0.48, 0.45, 0.42],
      tput: [12, 28, 46, 70, 96, 130, 176],
      cost: [0.62, 0.57, 0.52, 0.49, 0.46, 0.43, 0.41],
      costFail: [0.8, 0.76, 0.74, 0.71, 0.69, 0.68, 0.67]
    }
  };

  var state = blankState();
  var timers = [];
  var toastTimer = 0;
  var drawerReturn = null;

  function blankState() {
    return {
      scenario: "happy",
      phase: "idle",
      revealed: 0,
      checksRun: false,
      fixApplied: false,
      pending: null,
      result: null,
      packageState: "waiting",
      canaryLive: false,
      canaryPct: 0,
      promoted: false,
      handedOff: false,
      rolledBack: false,
      drawerOpen: false,
      log: []
    };
  }

  function $(id) {
    return document.getElementById(id);
  }

  function later(fn, ms) {
    var id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function stamp(d) {
    return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }

  function announce(msg) {
    var el = $("live");
    if (!el) return;
    el.textContent = "";
    el.textContent = msg;
  }

  function log(msg) {
    var d = new Date();
    state.log.push({ t: stamp(d), iso: d.toISOString(), msg: msg });
    announce(msg);
  }

  function showToast(msg) {
    var el = $("toast");
    el.hidden = false;
    el.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.hidden = true;
    }, 2400);
  }

  function formatMs(n) {
    return n.toLocaleString("en-US") + " ms";
  }

  function formatPct(n) {
    return n.toFixed(2) + "%";
  }

  function formatCost(n) {
    return "$" + n.toFixed(2);
  }

  function latencyWillBlock() {
    return state.scenario === "fail" && !state.fixApplied;
  }

  function predictResult() {
    var blocked = latencyWillBlock();
    var p95 = blocked ? 1240 : state.scenario === "fail" ? 586 : 612;
    var err = blocked ? 0.42 : 0.31;
    var cost = blocked ? 0.67 : state.scenario === "fail" ? 0.48 : 0.41;
    return {
      blocked: blocked,
      passRate: 94.6,
      p95: p95,
      err: err,
      cost: cost,
      p95Series: blocked ? DATA.series.p95Fail : state.scenario === "fail" ? DATA.series.p95Fixed : DATA.series.p95Happy,
      errSeries: blocked ? DATA.series.errFail : DATA.series.err,
      costSeries: blocked ? DATA.series.costFail : DATA.series.cost
    };
  }

  function previewResult() {
    if (state.pending && state.phase === "checking") return state.pending;
    if (state.result) return state.result;
    return predictResult();
  }

  function canPromote() {
    if (state.phase === "checking") return false;
    if (!state.checksRun || !state.result || state.result.blocked) return false;
    if (state.rolledBack) return false;
    if (state.promoted) return false;
    return true;
  }

  function canRollback() {
    if (state.rolledBack) return false;
    return state.canaryLive || state.promoted;
  }

  function canHandoff() {
    return state.promoted && !state.rolledBack && !state.handedOff;
  }

  function canDeploy() {
    if (state.phase === "checking") return false;
    if (!state.checksRun) return false;
    if (state.rolledBack) return true;
    if (state.promoted || state.canaryLive) return false;
    return true;
  }

  function canApplyFix() {
    return (
      state.scenario === "fail" &&
      !state.fixApplied &&
      state.phase !== "checking" &&
      state.checksRun &&
      state.result &&
      state.result.blocked
    );
  }

  function sliderEnabled() {
    return state.canaryLive && !state.promoted && !state.rolledBack && state.phase !== "checking";
  }

  function promoteCopy() {
    if (state.phase === "checking") {
      return { tone: "neutral", text: "Checks are still running." };
    }
    if (!state.checksRun) {
      return { tone: "neutral", text: "Run checks before you promote." };
    }
    if (state.result && state.result.blocked) {
      if (state.fixApplied) return { tone: "neutral", text: DATA.copy.fixApplied };
      return { tone: "bad", text: DATA.copy.blocked };
    }
    if (state.rolledBack) {
      return { tone: "neutral", text: "Traffic is on v3. Deploy a canary before you promote." };
    }
    if (state.promoted) {
      return { tone: "good", text: "v4 is live. Monitor is on." };
    }
    return { tone: "good", text: "All 6 gates passed." };
  }

  function deployCopy() {
    if (state.phase === "checking") return "Checks are still running.";
    if (!state.checksRun) return "Run checks before you deploy a canary.";
    if (state.rolledBack) return "Traffic is on v3. Deploy a canary to try v4 again.";
    if (state.promoted) return "v4 is live at 100%.";
    if (state.canaryLive) {
      return "Canary is at " + state.canaryPct + "% on v4. " + (100 - state.canaryPct) + "% stays on v3.";
    }
    if (state.result && state.result.blocked) {
      return "A gate is blocked. You can deploy a canary. Promote stays locked until the gate passes.";
    }
    return "Checks passed. Deploy a canary at 5%.";
  }

  function stepModel() {
    var validate = "waiting";
    if (state.phase === "checking") validate = "running";
    else if (state.checksRun && state.result) validate = state.result.blocked ? "blocked" : "passed";

    var pack = state.packageState === "running" ? "running" : state.packageState === "passed" ? "passed" : "waiting";

    var deploy = "waiting";
    if (state.rolledBack) deploy = "rolled";
    else if (state.promoted) deploy = "passed";
    else if (state.canaryLive) deploy = "canary";

    var monitor = "waiting";
    if (state.promoted && !state.rolledBack) monitor = "live";
    else if (state.canaryLive && !state.rolledBack) monitor = "running";

    var hand = state.handedOff && state.promoted && !state.rolledBack ? "passed" : "waiting";

    return [
      { id: "validate", status: validate },
      { id: "package", status: pack },
      { id: "deploy", status: deploy },
      { id: "monitor", status: monitor },
      { id: "handoff", status: hand }
    ];
  }

  function currentStep(steps) {
    var i;
    for (i = 0; i < steps.length; i += 1) {
      if (steps[i].status === "running" || steps[i].status === "canary" || steps[i].status === "blocked") {
        return steps[i].id;
      }
    }
    for (i = 0; i < steps.length; i += 1) {
      if (steps[i].status === "waiting" || steps[i].status === "rolled") return steps[i].id;
    }
    return "handoff";
  }

  function pillFor(status) {
    if (status === "running") return { cls: "running", text: "Running" };
    if (status === "passed") return { cls: "passed", text: "Passed" };
    if (status === "blocked") return { cls: "blocked", text: "Blocked" };
    if (status === "canary") return { cls: "canary", text: "Canary" };
    if (status === "live") return { cls: "live", text: "Live" };
    if (status === "rolled") return { cls: "neutral", text: "Rolled back" };
    return { cls: "neutral", text: "Waiting" };
  }

  function gateMode(index) {
    if (state.phase === "checking") {
      if (index < state.revealed) return "result";
      if (index === state.revealed) return "running";
      return "notrun";
    }
    if (state.checksRun && state.result) return "result";
    return "notrun";
  }

  function gateDetail(id, mode) {
    if (mode === "notrun") {
      var hint = DATA.gates.filter(function (g) { return g.id === id; })[0];
      return hint ? hint.hint : "";
    }
    if (mode === "running") return "Checking...";
    var result = state.phase === "checking" ? state.pending : state.result;
    if (!result) return "";
    if (id === "eval") return "eval-sketch-golden-v3 is attached.";
    if (id === "pass") return "94.6% passed (1,169 of 1,240). Floor is 90%.";
    if (id === "p95") {
      return result.blocked ? "Measured 1,240 ms." : "Measured " + formatMs(result.p95) + ".";
    }
    if (id === "error") return "Measured " + formatPct(result.err) + ". Limit is 1%.";
    if (id === "card") return "6 of 6 sections filled.";
    if (id === "guard") return "0 critical findings. 2 low, both accepted.";
    return "";
  }

  function trafficV4() {
    if (state.rolledBack) return 0;
    if (state.promoted) return 100;
    if (state.canaryLive) return state.canaryPct;
    return 0;
  }

  function throughput() {
    var v4 = trafficV4();
    if (v4 <= 0) return 0;
    if (state.promoted && !state.rolledBack) return 176;
    if (v4 === 5) return 18;
    if (v4 === 25) return 52;
    if (v4 === 50) return 96;
    return 140;
  }

  function sparkline(values, color) {
    var w = 120;
    var h = 32;
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var span = max - min || 1;
    var coords = values.map(function (v, i) {
      var x = (i / (values.length - 1)) * (w - 4) + 2;
      var y = 2 + (1 - (v - min) / span) * (h - 8);
      return [x, y];
    });
    var line = coords.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
    var area = "2," + (h - 1) + " " + line + " " + (w - 2) + "," + (h - 1);
    return (
      '<svg viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
      '<polygon points="' + area + '" fill="' + color + '" opacity="0.16"></polygon>' +
      '<polyline points="' + line + '" fill="none" stroke="' + color + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"></polyline>' +
      "</svg>"
    );
  }

  function setPill(el, cls, text) {
    el.className = "pill " + cls;
    el.textContent = text;
  }

  function renderScenario() {
    $("scenario-happy").setAttribute("aria-checked", state.scenario === "happy" ? "true" : "false");
    $("scenario-fail").setAttribute("aria-checked", state.scenario === "fail" ? "true" : "false");
  }

  function renderHeader() {
    var pill = $("exp-pill");
    var label = "Ready";
    var cls = "passed";
    if (state.handedOff && state.promoted && !state.rolledBack) {
      label = "Handed off";
      cls = "passed";
    } else if (state.promoted && !state.rolledBack) {
      label = "Live";
      cls = "live";
    } else if (state.canaryLive && !state.rolledBack) {
      label = "Canary";
      cls = "canary";
    } else if (state.rolledBack) {
      label = "Rolled back";
      cls = "neutral";
    } else if (state.checksRun && state.result && state.result.blocked) {
      label = "Blocked";
      cls = "blocked";
    } else if (state.checksRun && state.result) {
      label = "Checks passed";
      cls = "passed";
    } else if (state.scenario === "fail" && state.fixApplied) {
      label = "Fix applied";
      cls = "running";
    } else if (state.scenario === "fail") {
      label = "Latency risk";
      cls = "canary";
    }
    setPill(pill, cls, label);

    var preview = previewResult();
    var source = state.checksRun ? "Last check" : "Offline replay";
    if (state.promoted && !state.rolledBack) source = "Live";
    else if (state.canaryLive && !state.rolledBack) source = "Canary";
    var replay = $("exp-replay");
    replay.replaceChildren();
    replay.append(document.createTextNode(source + " | pass rate 94.6% | p95 "));
    var p95El = document.createElement("span");
    if (preview.blocked) p95El.className = "bad";
    p95El.textContent = formatMs(displayP95(preview));
    replay.append(p95El);
    replay.append(document.createTextNode(" | error rate " + formatPct(preview.err)));
  }

  function renderSteps() {
    var steps = stepModel();
    var current = currentStep(steps);
    steps.forEach(function (step) {
      var li = document.querySelector('[data-step="' + step.id + '"]');
      var pill = pillFor(step.status);
      li.className = "step is-" + (step.status === "rolled" ? "rolled" : step.status) + (step.id === current ? " is-current" : "");
      if (step.id === current) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
      var badge = li.querySelector(".pill");
      setPill(badge, pill.cls, pill.text);
    });
  }

  function renderGates() {
    var rows = document.querySelectorAll(".gate");
    var passed = 0;
    var blocked = 0;
    var shown = 0;
    rows.forEach(function (row, index) {
      var id = row.dataset.gate;
      var mode = gateMode(index);
      var result = state.phase === "checking" ? state.pending : state.result;
      var isBlocked = mode === "result" && id === "p95" && result && result.blocked;
      var isPassed = mode === "result" && !isBlocked;
      row.classList.toggle("is-blocked", !!isBlocked);
      row.classList.toggle("is-running", mode === "running");
      row.classList.toggle("is-passed", !!isPassed);
      var badge = row.querySelector(".pill");
      if (mode === "running") setPill(badge, "running", "Running");
      else if (isBlocked) setPill(badge, "blocked", "Blocked");
      else if (isPassed) setPill(badge, "passed", "Passed");
      else setPill(badge, "neutral", "Not run");
      row.querySelector(".gate-detail").textContent = gateDetail(id, mode);
      var reason = row.querySelector(".gate-reason");
      var fixBtn = row.querySelector(".apply");
      if (isBlocked) {
        reason.hidden = false;
        reason.textContent = state.fixApplied ? DATA.copy.fixApplied : DATA.copy.blocked;
        fixBtn.hidden = state.fixApplied;
      } else {
        reason.hidden = true;
        reason.textContent = "";
        fixBtn.hidden = true;
      }
      if (mode === "result") {
        shown += 1;
        if (isBlocked) blocked += 1;
        else passed += 1;
      }
    });
    var count = $("gates-count");
    if (state.phase === "checking") count.textContent = "Running checks";
    else if (!shown) count.textContent = "6 gates, not run";
    else if (blocked) count.textContent = passed + " passed, " + blocked + " blocked";
    else count.textContent = "6 of 6 passed";
  }

  function renderCanary() {
    var v4 = trafficV4();
    var v3 = 100 - v4;
    var live = state.promoted && !state.rolledBack;
    $("split-v4").style.width = v4 + "%";
    $("split-v3").style.width = v3 + "%";
    $("split").classList.toggle("is-live", live);
    $("swatch-v4").classList.toggle("is-live", live);
    $("v4-label").textContent = live ? "v4 " + v4 + "% live" : "v4 " + v4 + "%";
    $("v3-label").textContent = state.rolledBack ? "v3 100% last good" : "v3 " + v3 + "%";

    var pill = $("endpoint-pill");
    if (state.rolledBack) setPill(pill, "neutral", "Rolled back");
    else if (live) setPill(pill, "live", "Live");
    else if (state.canaryLive) setPill(pill, "canary", "Canary");
    else setPill(pill, "neutral", "Idle");

    var streamingOn = state.scenario === "happy" || state.fixApplied;
    $("profile-line").textContent = streamingOn
      ? "Response streaming on | instance profile g5.2xlarge"
      : "Response streaming off | instance profile g5.xlarge";

    var range = $("canary-range");
    var idx = Math.max(0, DATA.stops.indexOf(state.canaryPct));
    if (!state.canaryLive || state.rolledBack) idx = 0;
    if (document.activeElement !== range) range.value = String(idx);
    range.disabled = !sliderEnabled();
    range.classList.toggle("is-live", live);
    range.classList.toggle("is-canary", state.canaryLive && !live && !state.rolledBack);
    range.style.setProperty("--fill", (state.canaryLive && !state.rolledBack ? (idx / 3) * 100 : 0) + "%");
    range.setAttribute(
      "aria-valuetext",
      state.canaryLive && !state.rolledBack ? state.canaryPct + "% on v4" : "Not deployed"
    );

    document.querySelectorAll("[data-pct]").forEach(function (btn) {
      var pct = Number(btn.dataset.pct);
      var on = (state.canaryLive || live) && !state.rolledBack && state.canaryPct === pct;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.disabled = !sliderEnabled();
    });

    var deploy = $("deploy-canary");
    deploy.disabled = !canDeploy();
    $("deploy-note").textContent = deployCopy();
  }

  function renderSlos() {
    var measured = previewResult();
    var v4 = trafficV4();
    var live = state.promoted && !state.rolledBack;
    var canary = state.canaryLive && !state.rolledBack && !live;
    var source = "Last offline run";
    if (state.phase === "checking") source = "Running checks";
    else if (live) source = "Live traffic";
    else if (canary) source = "Canary " + state.canaryPct + "%";
    else if (state.checksRun) source = "Last check";
    $("slo-source").textContent = source;

    var p95Series = measured.p95Series;
    if (live && !measured.blocked) p95Series = DATA.series.p95Live;
    else if (canary && !measured.blocked && state.scenario === "happy") p95Series = DATA.series.p95Canary;

    var p95Shown = displayP95(measured);

    var tput = throughput();
    var tputSeries = tput === 0 ? [0, 0, 0, 0, 0, 0, 0] : DATA.series.tput.map(function (n) {
      return Math.max(1, Math.round(n * (tput / 176)));
    });

    var cards = [
      {
        id: "slo-p95",
        value: formatMs(p95Shown),
        status: p95Shown > 800 ? "Over limit" : "Inside limit",
        tone: p95Shown > 800 ? "bad" : "good",
        over: p95Shown > 800,
        series: p95Series,
        color: p95Shown > 800 ? "#EC4A41" : "#0696D7"
      },
      {
        id: "slo-err",
        value: formatPct(measured.err),
        status: measured.err < 1 ? "Inside limit" : "Over limit",
        tone: measured.err < 1 ? "good" : "bad",
        over: measured.err >= 1,
        series: measured.errSeries,
        color: "#0696D7"
      },
      {
        id: "slo-tput",
        value: tput + " req/s",
        status: tput ? "Sample" : "No traffic",
        tone: "",
        over: false,
        series: tputSeries,
        color: tput ? "#0696D7" : "#A0A0A0"
      },
      {
        id: "slo-cost",
        value: formatCost(measured.cost),
        status: "Tracked",
        tone: "",
        over: false,
        series: measured.costSeries,
        color: "#0696D7"
      }
    ];

    cards.forEach(function (card) {
      var node = $(card.id);
      node.classList.toggle("is-over", card.over);
      node.querySelector("[data-value]").textContent = card.value;
      var status = node.querySelector("[data-status]");
      status.textContent = card.status;
      status.className = "slo-status" + (card.tone ? " " + card.tone : "");
      node.querySelector("[data-spark]").innerHTML = sparkline(card.series, card.color);
    });
  }

  function renderActions() {
    var promote = $("promote");
    var reason = promoteCopy();
    promote.disabled = !canPromote();
    $("rollback").disabled = !canRollback();
    $("handoff-btn").disabled = !canHandoff();
    var reasonEl = $("promote-reason");
    reasonEl.textContent = reason.text;
    reasonEl.dataset.tone = reason.tone;
    var fix = $("apply-fix");
    fix.hidden = !canApplyFix();
    var run = $("run-checks");
    run.disabled = state.phase === "checking";
    run.setAttribute("aria-busy", state.phase === "checking" ? "true" : "false");
  }

  function renderHandoff() {
    var card = $("handoff-card");
    var show = state.handedOff && state.promoted && !state.rolledBack;
    card.hidden = !show;
    if (!show) return;
    var measured = state.result || predictResult();
    var p95 = displayP95(measured);
    $("handoff-url").textContent = DATA.endpoint.url;
    $("handoff-owner").textContent = DATA.modelCard.owner;
    $("handoff-oncall").textContent = DATA.experiment.onCall;
    $("handoff-slos").textContent =
      "p95 " + formatMs(p95) + " (limit 800 ms). Error rate " +
      formatPct(measured.err) + " (limit 1%). Eval pass rate 94.6% (floor 90%). Cost " +
      formatCost(measured.cost) + " per 1k calls.";
  }

  function renderLog() {
    var ol = $("path-log");
    ol.replaceChildren();
    if (!state.log.length) {
      var empty = document.createElement("li");
      empty.className = "log-empty";
      empty.textContent = "No path events yet. Run checks to start.";
      ol.appendChild(empty);
      $("action-status").textContent = "";
      return;
    }
    var newest = state.log[state.log.length - 1];
    $("action-status").textContent = newest.msg;
    for (var i = state.log.length - 1; i >= 0; i -= 1) {
      var entry = state.log[i];
      var li = document.createElement("li");
      var time = document.createElement("time");
      time.dateTime = entry.iso;
      time.textContent = entry.t;
      var msg = document.createElement("span");
      msg.textContent = entry.msg;
      li.append(time, msg);
      ol.appendChild(li);
    }
  }

  function renderDrawer() {
    var drawer = $("drawer");
    var back = $("drawer-back");
    drawer.classList.toggle("open", state.drawerOpen);
    drawer.setAttribute("aria-hidden", state.drawerOpen ? "false" : "true");
    back.hidden = !state.drawerOpen;
    if ("inert" in drawer) drawer.inert = !state.drawerOpen;
    var measured = previewResult();
    var p95Text = measured.blocked
      ? "p95 " + formatMs(measured.p95) + ". Limit is 800 ms. Gate blocked until streaming is on or the profile is g5.2xlarge."
      : "p95 " + formatMs(measured.p95) + ". Limit is 800 ms.";
    var fields = [
      ["Owner", DATA.modelCard.owner],
      ["Foundation model", DATA.modelCard.base + ". " + DATA.modelCard.baseNote],
      ["Data used", DATA.modelCard.data],
      ["Intended use", DATA.modelCard.use],
      ["Known limits", DATA.modelCard.limits],
      ["Eval results", "eval-sketch-golden-v3, n=1,240. Pass rate 94.6%. " + p95Text + " Error rate " + formatPct(measured.err) + "."]
    ];
    var dl = $("drawer-body");
    dl.replaceChildren();
    fields.forEach(function (field) {
      var dt = document.createElement("dt");
      dt.textContent = field[0];
      var dd = document.createElement("dd");
      if (Array.isArray(field[1])) {
        var ul = document.createElement("ul");
        field[1].forEach(function (item) {
          var li = document.createElement("li");
          li.textContent = item;
          ul.appendChild(li);
        });
        dd.appendChild(ul);
      } else {
        dd.textContent = field[1];
      }
      dl.append(dt, dd);
    });
  }

  function syncDock() {
    var bar = $("actionbar");
    if (!bar) return;
    document.documentElement.style.setProperty("--dock-h", bar.offsetHeight + "px");
  }

  function render() {
    renderScenario();
    renderHeader();
    renderSteps();
    renderGates();
    renderCanary();
    renderSlos();
    renderActions();
    renderHandoff();
    renderLog();
    renderDrawer();
    syncDock();
  }

function setScenario(next) {
  if (next !== "happy" && next !== "fail") return;
  if (state.scenario === next) return;
  clearTimers();
  state = blankState();
  state.scenario = next;
  log(next === "happy" ? "Switched to Happy path. Flow reset." : "Switched to Fail path. Flow reset.");
  render();
}

function displayP95(measured) {
  var live = state.promoted && !state.rolledBack;
  var canary = state.canaryLive && !state.rolledBack && !live;
  if (live && measured && !measured.blocked) return 604;
  if (canary && measured && !measured.blocked && state.scenario === "happy") return 628;
  return measured ? measured.p95 : 612;
}

  function runChecks() {
    if (state.phase === "checking") return;
    clearTimers();
    state.phase = "checking";
    state.revealed = 0;
    state.checksRun = false;
    state.pending = predictResult();
    log("Run checks started for exp-fusion-sketch-assist-0412.");
    render();
    var stepMs = 140;
    DATA.gates.forEach(function (_gate, index) {
      later(function () {
        state.revealed = index + 1;
        render();
      }, stepMs * (index + 1));
    });
    later(function () {
      state.result = state.pending;
      state.checksRun = true;
      state.phase = "checked";
      state.revealed = DATA.gates.length;
      if (state.result.blocked) {
        log("Checks finished. 1 gate blocked: p95 latency.");
        render();
        return;
      }
      log("All 6 gates passed.");
      if (state.packageState !== "passed") {
        state.packageState = "running";
        render();
        later(function () {
          state.packageState = "passed";
          log("Packaged model artifact " + DATA.endpoint.artifact + " (" + DATA.endpoint.artifactSize + ").");
          render();
        }, 320);
      } else {
        render();
      }
    }, stepMs * DATA.gates.length + 40);
  }

  function deployCanary() {
    if (!canDeploy()) return;
    state.canaryLive = true;
    state.canaryPct = 5;
    state.rolledBack = false;
    state.promoted = false;
    state.handedOff = false;
    log("Deployed canary. Endpoint ep-sketch-assist-v4 is at 5% on v4. 95% stays on v3.");
    render();
  }

  function setPct(pct) {
    if (!sliderEnabled()) return;
    if (DATA.stops.indexOf(pct) === -1) return;
    if (state.canaryPct === pct) return;
    state.canaryPct = pct;
    log("Canary traffic set to " + pct + "%. v4 " + pct + "% | v3 " + (100 - pct) + "%.");
    render();
  }

  function promote() {
    if (!canPromote()) return;
    var wasLiveCanary = state.canaryLive;
    var prev = state.canaryPct;
    if (!wasLiveCanary || prev !== 100) {
      state.canaryLive = true;
      state.canaryPct = 100;
      if (prev !== 100) {
        log("Canary traffic set to 100%. v4 100% | v3 0%.");
      }
    }
    state.promoted = true;
    state.rolledBack = false;
    log("Promoted v4 to live. Endpoint ep-sketch-assist-v4 is at 100%. Monitor is live.");
    render();
  }

  function rollback() {
    if (!canRollback()) return;
    state.canaryLive = false;
    state.canaryPct = 0;
    state.promoted = false;
    state.handedOff = false;
    state.rolledBack = true;
    log("Rollback complete. Traffic returned to v3, the last good version. v4 canary stopped.");
    render();
  }

  function handoff() {
    if (!canHandoff()) return;
    state.handedOff = true;
    log("Hand-off card created for the Fusion Sketch product team. On-call #fusion-sketch-assist.");
    render();
    var card = $("handoff-card");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    card.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }

  function applyFix() {
    if (!canApplyFix()) return;
    state.fixApplied = true;
    log("Applied fix: response streaming on, instance profile g5.2xlarge.");
    render();
  }

  function openDrawer(trigger) {
    drawerReturn = trigger || document.activeElement;
    state.drawerOpen = true;
    render();
    $("drawer-close").focus();
  }

  function closeDrawer() {
    state.drawerOpen = false;
    render();
    if (drawerReturn && typeof drawerReturn.focus === "function") drawerReturn.focus();
  }

  function copyUrl() {
    var url = DATA.endpoint.url;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () { showToast("Endpoint URL copied."); },
        function () { showToast("Select the endpoint URL to copy it."); }
      );
    } else {
      showToast("Select the endpoint URL to copy it.");
    }
  }

  function onRange(event) {
    if (!sliderEnabled()) return;
    var pct = DATA.stops[Number(event.target.value)];
    if (pct === state.canaryPct) {
      renderCanary();
      return;
    }
    setPct(pct);
  }

  function buildLists() {
    var gates = $("gate-list");
    DATA.gates.forEach(function (gate) {
      var li = document.createElement("li");
      li.className = "gate";
      li.dataset.gate = gate.id;
      li.innerHTML =
        '<div class="gate-top"><h3 class="gate-name"></h3><span class="pill neutral">Not run</span></div>' +
        '<p class="gate-detail"></p><p class="gate-reason" hidden></p>' +
        '<button type="button" class="btn secondary apply" data-action="apply-fix" hidden>Apply fix</button>';
      li.querySelector(".gate-name").textContent = gate.name;
      gates.appendChild(li);
    });

    var before = $("before-list");
    DATA.friction.beforeSteps.forEach(function (step, index) {
      var li = document.createElement("li");
      var n = document.createElement("span");
      n.className = "n";
      n.textContent = String(index + 1).padStart(2, "0");
      var body = document.createElement("span");
      body.className = "item-body";
      var tool = document.createElement("span");
      tool.className = "tool";
      tool.textContent = step.tool;
      var text = document.createElement("span");
      text.className = "item-text";
      text.textContent = step.text;
      body.append(tool, text);
      li.append(n, body);
      before.appendChild(li);
    });

    var after = $("after-list");
    DATA.friction.afterSteps.forEach(function (text, index) {
      var li = document.createElement("li");
      var n = document.createElement("span");
      n.className = "n";
      n.textContent = String(index + 1).padStart(2, "0");
      var body = document.createElement("span");
      body.className = "item-text";
      body.textContent = text;
      li.append(n, body);
      after.appendChild(li);
    });

    $("tool-line").textContent = DATA.friction.toolNames.join(" | ");
    $("time-saved").textContent = DATA.friction.timeSaved;
    $("steps-removed").textContent = DATA.friction.stepsRemoved;
    $("handoff-owner").textContent = DATA.modelCard.owner;
    $("handoff-oncall").textContent = DATA.experiment.onCall;
    $("handoff-url").textContent = DATA.endpoint.url;
  }

  function bind() {
    document.body.addEventListener("click", function (event) {
      var el = event.target.closest("[data-action]");
      if (!el || el.disabled) return;
      var action = el.dataset.action;
      if (action === "scenario") setScenario(el.dataset.scenario);
      else if (action === "run-checks") runChecks();
      else if (action === "deploy") deployCanary();
      else if (action === "set-pct") setPct(Number(el.dataset.pct));
      else if (action === "promote") promote();
      else if (action === "rollback") rollback();
      else if (action === "handoff") handoff();
      else if (action === "apply-fix") applyFix();
      else if (action === "open-model") openDrawer(el);
      else if (action === "close-model") closeDrawer();
      else if (action === "copy-url") copyUrl();
      else if (action === "nav") {
        if (el.dataset.nav !== "Golden Paths") {
          showToast("This prototype stays on Golden Paths.");
        }
        document.body.classList.remove("nav-open");
        $("menu-btn").setAttribute("aria-expanded", "false");
        $("nav-backdrop").hidden = true;
      } else if (action === "collapse-nav") {
        var collapsed = document.body.classList.toggle("nav-collapsed");
        el.setAttribute("aria-pressed", collapsed ? "true" : "false");
        el.querySelector(".nav-label").textContent = collapsed ? "Expand" : "Collapse";
      }
    });

    $("canary-range").addEventListener("input", onRange);
    $("canary-range").addEventListener("change", onRange);

    $("menu-btn").addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      $("menu-btn").setAttribute("aria-expanded", open ? "true" : "false");
      $("nav-backdrop").hidden = !open;
    });
    $("nav-backdrop").addEventListener("click", function () {
      document.body.classList.remove("nav-open");
      $("menu-btn").setAttribute("aria-expanded", "false");
      $("nav-backdrop").hidden = true;
    });

    $("user-btn").addEventListener("click", function (event) {
      event.stopPropagation();
      var pop = $("user-pop");
      var open = pop.hidden;
      pop.hidden = !open;
      $("user-btn").setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.addEventListener("click", function (event) {
      var pop = $("user-pop");
      if (pop.hidden) return;
      if (event.target.closest("#user-pop") || event.target.closest("#user-btn")) return;
      pop.hidden = true;
      $("user-btn").setAttribute("aria-expanded", "false");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        if (state.drawerOpen) {
          closeDrawer();
          return;
        }
        if (!$("user-pop").hidden) {
          $("user-pop").hidden = true;
          $("user-btn").setAttribute("aria-expanded", "false");
          $("user-btn").focus();
          return;
        }
        if (document.body.classList.contains("nav-open")) {
          document.body.classList.remove("nav-open");
          $("menu-btn").setAttribute("aria-expanded", "false");
          $("nav-backdrop").hidden = true;
          $("menu-btn").focus();
        }
      }
      if (state.drawerOpen && event.key === "Tab") {
        var focusable = $("drawer").querySelectorAll("button, a, input, [href], [tabindex]:not([tabindex='-1'])");
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    var group = $("scenario-happy").parentElement;
    group.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      var next = state.scenario === "happy" ? "fail" : "happy";
      setScenario(next);
      $(next === "happy" ? "scenario-happy" : "scenario-fail").focus();
    });

    $("drawer-back").addEventListener("click", closeDrawer);
    window.addEventListener("resize", syncDock);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncDock);
  }

  function init() {
    buildLists();
    bind();
    render();
  }

  init();
})();
