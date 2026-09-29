/* LEAP customize-to-deploy builder. Synthetic catalog + harness shapes.
   Model facts (names, params, context, formats) mirror public Liquid docs. */

"use strict";

/* ---- synthetic catalog (facts grounded in docs.liquid.ai) ---- */

const MODELS = {
  "LFM2.5-2.6B": {
    tag: "text",
    params: "2.6B dense",
    ctx: "128K context",
    formats: {
      "GGUF · Q4_K_M": "1.7 GB",
      "ONNX · Q4": "1.8 GB",
      "MLX · 8bit": "2.8 GB",
    },
  },
  "LFM2.5-1.2B-Instruct": {
    tag: "text",
    params: "1.2B instruct",
    ctx: "long context",
    formats: {
      "GGUF · Q4_K_M": "0.8 GB",
      "ONNX · Q4": "0.9 GB",
    },
  },
  "LFM2.5-8B-A1B": {
    tag: "text",
    params: "8B MoE · 1B active",
    ctx: "128K context",
    formats: {
      "GGUF · Q4_K_M": "4.6 GB",
      "ONNX · Q4": "4.9 GB",
    },
  },
  "LFM2.5-Audio-1.5B": {
    tag: "audio",
    params: "1.5B interleaved",
    ctx: "audio + text",
    formats: {
      "GGUF · Q4_K_M": "1.1 GB",
      "ONNX · Q4": "1.2 GB",
    },
  },
  "LFM2.5-350M": {
    tag: "text",
    params: "350M",
    ctx: "32K context",
    formats: {
      "GGUF · Q4_K_M": "0.3 GB",
      "ONNX · Q4": "0.3 GB",
    },
  },
};

const CASES = [
  {
    id: "phone",
    label: "Offline phone agent that can call tools",
    keywords: ["phone", "sms", "message", "contact", "offline", "tool"],
    model: "LFM2.5-2.6B",
    why: "Built for agentic workloads: native tool calling, trained inside real agent harnesses (Hermes Agent, OpenClaw, Pi), 128K context for long tool traces, and small enough to run on a phone.",
    alt: [
      ["LFM2.5-1.2B-Instruct", "lighter, fewer tool steps"],
      ["LFM2.5-8B-A1B", "more headroom, same 128K context"],
    ],
    tools: ["message.send", "message.read", "contacts.search", "calendar.next"],
    memory: "200-token rolling + last 8 tool calls",
    routers: [
      "tool intent → LFM2.5-2.6B · casual → LFM2.5-1.2B-Instruct",
      "single model · LFM2.5-2.6B for everything",
      "voice input → audio model · text/tools → LFM2.5-2.6B",
    ],
    harness: "Liquid Agent harness · OpenClaw-compatible tool loop",
    latency: "~90 ms/token",
    chat: [
      { role: "user", text: "Text Dana that my plane lands at 9:40." },
      {
        role: "tools",
        calls: [
          ["contacts.search", '"Dana"'],
          ["message.send", "Dana · landing 9:40"],
        ],
      },
      { role: "agent", text: "Done. Dana gets it the moment she's back on signal." },
    ],
  },
  {
    id: "vehicle",
    label: "In-vehicle function orchestration",
    keywords: ["vehicle", "car", "drive", "driving", "cabin", "nav", "route", "dashboard"],
    model: "LFM2.5-1.2B-Instruct",
    why: "A small instruct model is plenty for a fixed, well-schema'd function set: crisp structured calls, low power draw, and a footprint that fits head units and trim-level compute.",
    alt: [
      ["LFM2.5-2.6B", "richer multi-step reasoning"],
      ["LFM2.5-350M", "tiny, single-function jobs only"],
    ],
    tools: ["vehicle.climate", "vehicle.media", "nav.route", "obd.status"],
    memory: "session summary + last 4 tool calls",
    routers: [
      "confirmed functions → vehicle toolset · free-form → LFM2.5-1.2B-Instruct",
      "single model · LFM2.5-1.2B-Instruct for everything",
    ],
    harness: "Function-call harness · fixed tool schema",
    latency: "~70 ms/token",
    chat: [
      { role: "user", text: "Keep the cabin at 22° and start route home." },
      {
        role: "tools",
        calls: [
          ["vehicle.climate", "set 22°"],
          ["nav.route", '"home"'],
        ],
      },
      { role: "agent", text: "Cabin at 22°. Route home started." },
    ],
  },
  {
    id: "voice",
    label: "Offline voice assistant",
    keywords: ["voice", "audio", "speak", "speech", "listening", "assistant", "tts"],
    model: "LFM2.5-Audio-1.5B",
    why: "Interleaved audio and text in one small model: speech in, speech out, no cloud round-trip. Sized for always-listening phone and edge-speaker slots.",
    alt: [
      ["LFM2.5-2.6B", "text companion for follow-up tasks"],
      ["LFM2.5-Audio-1.5B-JP", "same stack, Japanese speech"],
    ],
    tools: ["music.play", "timer.set", "contacts.search", "message.send"],
    memory: "last 6 turns + 1 min of audio context",
    routers: [
      "speech → LFM2.5-Audio-1.5B · text/tools → LFM2.5-1.2B-Instruct",
      "single model · LFM2.5-Audio-1.5B for everything",
    ],
    harness: "Audio-first harness · TTS + ASR inside",
    latency: "~120 ms/token",
    chat: [
      { role: "user", text: "Play my focus playlist for 25 minutes." },
      {
        role: "tools",
        calls: [
          ["music.play", '"focus"'],
          ["timer.set", "25 min"],
        ],
      },
      { role: "agent", text: "Focus mix on for 25 minutes." },
    ],
  },
];

/* ---- state ---- */

let state = {
  caseId: "phone",
  tools: [],
  memory: "",
  routerIdx: 0,
  formatIdx: 0,
};

const byId = (id) => document.getElementById(id);

function pickCase(text) {
  const t = text.toLowerCase();
  let best = CASES[0];
  let bestScore = 0;
  for (const c of CASES) {
    const score = c.keywords.filter((k) => t.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

/* ---- renderers ---- */

function renderRecommendation(c) {
  const m = MODELS[c.model];
  byId("model-name").textContent = c.model;
  byId("model-meta").textContent = `${m.params} · ${m.ctx} · on-device`;
  const tag = byId("model-tag");
  tag.textContent = m.tag;
  tag.className = "pill pill-purple";
  byId("model-why").innerHTML = `<strong>Why it fits:</strong> ${c.why}`;

  const alts = byId("model-alts");
  alts.textContent = "";
  for (const [name, note] of c.alt) {
    const row = document.createElement("div");
    row.className = "alt-row";
    const b = document.createElement("b");
    b.textContent = name;
    row.append(b, document.createTextNode(" · " + note + " · also on-device"));
    alts.append(row);
  }

  const fmt = byId("format");
  fmt.textContent = "";
  Object.keys(m.formats).forEach((f, i) => {
    const o = document.createElement("option");
    o.textContent = f;
    o.value = String(i);
    fmt.append(o);
  });
  state.formatIdx = 0;
  fmt.value = "0";
}

function renderHarness(c) {
  const toolsBox = byId("tools");
  toolsBox.textContent = "";
  for (const t of c.tools) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tool-btn" + (state.tools.includes(t) ? " on" : "");
    btn.dataset.tool = t;
    btn.setAttribute("aria-pressed", String(state.tools.includes(t)));
    const tick = document.createElement("span");
    tick.className = "tick";
    tick.textContent = state.tools.includes(t) ? "✓" : "";
    btn.append(tick, document.createTextNode(t));
    btn.addEventListener("click", () => {
      if (state.tools.includes(t)) {
        state.tools = state.tools.filter((x) => x !== t);
      } else {
        state.tools = [...state.tools, t];
      }
            renderHarness(c);
      renderSnippet(c);
      renderPreview(c);
    });
    toolsBox.append(btn);
  }

  byId("memory").value = state.memory;

  const router = byId("router");
  router.textContent = "";
  c.routers.forEach((r, i) => {
    const o = document.createElement("option");
    o.textContent = r;
    o.value = String(i);
    router.append(o);
  });
  state.routerIdx = Math.min(state.routerIdx, c.routers.length - 1);
  router.value = String(state.routerIdx);
}

function snippetFor(c) {
  const m = MODELS[c.model];
  const fmtLabel = Object.keys(m.formats)[state.formatIdx];
  const fmtFp = m.formats[fmtLabel];
  const modelRef =
    c.model +
    (fmtLabel.startsWith("GGUF") ? "-GGUF" : fmtLabel.startsWith("ONNX") ? "-ONNX" : "");
  const tools = state.tools.map((t) => `"${t}"`).join(", ");
  const router = c.routers[state.routerIdx];
  const dev = c.id === "vehicle" ? "linux" : "android";
  return [
    `import { LiquidEdge } from "@liquidai/edge-sdk";`,
    ``,
    `const agent = new LiquidEdge({`,
    `  model: "${modelRef}",        // ${fmtLabel} · ${fmtFp}`,
    `  harness: {`,
    `    tools: [${tools}],`,
    `    memory: "${state.memory}",`,
    `    router: "${router}"`,
    `  },`,
    `  device: "${dev}",`,
    `  offline: true`,
    `});`,
    ``,
    `await agent.deploy();            // bundles model + harness onto the device`,
  ].join("\n");
}

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function renderSnippet(c) {
  const hlLine = (line) => {
    let s = esc(line);
    if (s.includes('"')) s = s.replace(/"[^"]*"/g, (mm) => `<span class="s">${mm}</span>`);
    return s.replace(/\b(import|const|new|await|from|true)\b/g, '<span class="k">$1</span>');
  };
  const code = byId("snippet");
  code.innerHTML = snippetFor(c)
    .split("\n")
    .map((l) => {
      const ci = l.indexOf("//");
      if (ci > -1) return hlLine(l.slice(0, ci)) + `<span class="c">${esc(l.slice(ci))}</span>`;
      return hlLine(l);
    })
    .join("\n");
}

function renderPreview(c) {
  const m = MODELS[c.model];
  const fmtLabel = Object.keys(m.formats)[state.formatIdx];
  const fmtFp = m.formats[fmtLabel];

  const chat = byId("phone-chat");
  chat.textContent = "";
  for (const msg of c.chat) {
    if (msg.role === "user") {
      const b = document.createElement("div");
      b.className = "bubble user";
      b.textContent = msg.text;
      chat.append(b);
    } else if (msg.role === "tools") {
      const wrap = document.createElement("div");
      wrap.className = "toolcalls";
      for (const [name, arg] of msg.calls) {
        const on = state.tools.includes(name);
        const tc = document.createElement("div");
        tc.className = "toolcall";
        const ok = document.createElement("span");
        ok.className = "ok";
        ok.textContent = on ? "✓" : "·";
        tc.append(ok, document.createTextNode(`${name}(${arg})`));
        wrap.append(tc);
        if (!on) tc.style.opacity = "0.45";
      }
      chat.append(wrap);
    } else {
      const b = document.createElement("div");
      b.className = "bubble agent";
      b.textContent = msg.text;
      chat.append(b);
    }
  }

  const chips = byId("phone-chips");
  chips.textContent = "";
  for (const chip of [c.latency + " · est.", `${fmtFp} footprint`, "works offline"]) {
    const s = document.createElement("span");
    s.className = "phone-chip";
    s.textContent = chip;
    chips.append(s);
  }

  const list = byId("ship-list");
  list.textContent = "";
  const rows = [
    ["Model", `${c.model} · ${fmtLabel} · ${fmtFp}`],
    ["Harness", c.harness],
    ["Tools", `${state.tools.length} tool${state.tools.length === 1 ? "" : "s"} · local only`],
    ["Memory", state.memory],
    ["Router", c.routers[state.routerIdx]],
  ];
  for (const [k, v] of rows) {
    const li = document.createElement("li");
    const kk = document.createElement("span");
    kk.className = "ship-k";
    const check = document.createElement("span");
    check.className = "check";
    check.textContent = "✓";
    kk.append(check, document.createTextNode(k));
    const vv = document.createElement("span");
    vv.className = "ship-v";
    vv.textContent = v;
    li.append(kk, vv);
    list.append(li);
  }
}

function renderAll(c) {
  renderRecommendation(c);
  renderHarness(c);
  renderSnippet(c);
  renderPreview(c);
}

/* ---- events ---- */

function applyCase(id, silent) {
  const c = CASES.find((x) => x.id === id) || CASES[0];
  state.caseId = c.id;
  state.tools = [...c.tools];
  state.memory = c.memory;
  state.routerIdx = 0;
  state.formatIdx = 0;
  byId("use-case").value = c.label;
  document.querySelectorAll(".chip").forEach((ch) => {
    ch.classList.toggle("active", ch.dataset.case === c.id);
  });
  renderAll(c);
  if (!silent) byId("find").focus({ preventScroll: true });
}

document.querySelectorAll(".chip").forEach((ch) => {
  ch.addEventListener("click", () => applyCase(ch.dataset.case));
});

byId("find").addEventListener("click", () => {
  const c = pickCase(byId("use-case").value);
  document.querySelectorAll(".chip").forEach((ch) => {
    ch.classList.toggle("active", ch.dataset.case === c.id);
  });
  if (c.id !== state.caseId) {
    state.caseId = c.id;
    state.tools = [...c.tools];
    state.memory = c.memory;
    state.routerIdx = 0;
    state.formatIdx = 0;
  }
  renderAll(c);
});

byId("memory").addEventListener("input", (e) => {
  state.memory = e.target.value;
  const c = CASES.find((x) => x.id === state.caseId);
  renderSnippet(c);
  renderPreview(c);
});

byId("router").addEventListener("change", (e) => {
  state.routerIdx = Number(e.target.value);
  const c = CASES.find((x) => x.id === state.caseId);
  renderSnippet(c);
  renderPreview(c);
});

byId("format").addEventListener("change", (e) => {
  state.formatIdx = Number(e.target.value);
  const c = CASES.find((x) => x.id === state.caseId);
  renderSnippet(c);
  renderPreview(c);
});

byId("copy").addEventListener("click", async () => {
  const c = CASES.find((x) => x.id === state.caseId);
  const text = snippetFor(c);
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  const btn = byId("copy");
  btn.textContent = "Copied ✓";
  btn.classList.add("copied");
  setTimeout(() => {
    btn.textContent = "Copy";
    btn.classList.remove("copied");
  }, 1500);
});

/* ---- boot: walkthrough-ready on load ---- */
applyCase("phone", true);