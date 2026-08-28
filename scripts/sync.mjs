/**
 * Copies build inputs from the project repos into this one.
 *
 * Rule 2 (SPEC.md): no measured number is ever typed into the site. Every figure is
 * read at build time from a file a project committed. Cloudflare only ever sees this
 * repo, so those files have to live here too. They are generated, committed, and never
 * edited by hand: edit the project, then re-run `npm run sync`.
 *
 * `--check` exits non-zero if anything here has drifted from source.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";

const CHECK = process.argv.includes("--check");
const ROOT = resolve(import.meta.dirname, "..");
const SRC = resolve(ROOT, "..");
const DESKTOP = resolve(SRC, "..");

const hook = (title, hook) => ({ title, hook });

const RESUME = { from: "Amitesh_Dwivedi_Resume_08_14_final.md", to: "src/content/resume.md" };

const PROJECTS = [
  {
    slug: "prior-auth",
    name: "Prior Auth Agent",
    dir: "Prior Auth Agent",
    report: "REPORT.md",
    data: ["runs/scorecards/_summary.json", "runs/scorecards/_hypotheses.json", "runs/scorecards/ood.json"],
    demo: "web",
    sourceDocs: [{ from: "EVAL-PLAN.md", to: "public/downloads/prior-auth/EVAL-PLAN.md", matches: [/\.\/EVAL-PLAN\.md/g, /\.\.\/EVAL-PLAN\.md/g], href: "/downloads/prior-auth/EVAL-PLAN.md" }],
    artifacts: {
      "Case-Study-One-Pager": hook("Case study", "The workflow, safety bar, measured results, and recommendation."),
      "PRD": hook("PRD", "What the agent is for, what it refuses to do, and why non-determinable is a first-class answer."),
      "Metric-Design": hook("Metric design", "Why met-precision is gated and recall is only reported."),
      "Eval-Summary": hook("Eval summary", "The corpus, the strata, and what each configuration was allowed to see."),
      "Tradeoff-Memo": hook("Tradeoff memo", "Cheap tier against frontier, and what the routing decision cost in recall."),
      "Safety-and-Oversight-Review": hook("Safety and oversight", "Six hazards, and the human in the loop each one requires."),
      "Launch-Decision-Memo": hook("Launch decision", "The ship call, made against my own system."),
      "README": hook("Readme", "How to run it."),
    },
  },
  {
    slug: "10k-risk",
    name: "10-K Risk Extractor",
    dir: "10K Risk Extractor",
    report: "docs/eval-report.md",
    data: [
      "data/benchmark/stability.json",
      "data/benchmark/instability-detail.json",
      "data/benchmark/diff-routed.json",
      "data/benchmark/diff-frontier.json",
      "data/benchmark/entailment.json",
      "data/benchmark/panel.json",
    ],
    demo: null,
    sourceDocs: [{ from: "docs/corpus.md", to: "public/downloads/10k-risk/corpus.md", matches: [/\.\/corpus\.md/g, /\.\.\/docs\/corpus\.md/g], href: "/downloads/10k-risk/corpus.md" }],
    artifacts: {
      "Case-Study-One-Pager": hook("Case study", "The analyst problem, system design, benchmark, and recommendation."),
      "PRD": hook("PRD", "Claims as the unit of comparison, factors as the unit of provenance."),
      "Metric-Design": hook("Metric design", "Why it never emits an aggregate risk score."),
      "Eval-Summary": hook("Eval summary", "Twenty filings, and controls assigned by measurement rather than by hypothesis."),
      "Tradeoff-Memo": hook("Tradeoff memo", "Frontier against routed model, priced per corpus run."),
      "Launch-Decision-Memo": hook("Launch decision", "Why the stability number outranks the accuracy numbers."),
      "README": hook("Readme", "How to run it."),
    },
  },
  {
    slug: "nda-triage",
    name: "NDA Triage",
    dir: "NDA Risk Extractor ",
    report: "docs/eval-report.md",
    data: ["runs/phase-d/sweep.json", "runs/phase-f/report.json", "runs/phase-f/report-midprice.json"],
    demo: "demo",
    sourceDocs: [],
    artifacts: {
      "Case-Study-One-Pager": hook("Case study", "The legal workflow, product rules, evaluation, and recommendation."),
      "PRD": hook("PRD", "Triage, not review: who needs to read this NDA, and who does not."),
      "Metric-Design": hook("Metric design", "Absence is the metric, and why recall outranks precision here."),
      "Eval-Summary": hook("Eval summary", "Dev split only, with the test split held back to the very end."),
      "Tradeoff-Memo": hook("Tradeoff memo", "Search budget against false negatives, priced against a fifty dollar ceiling."),
      "Launch-Decision-Memo": hook("Launch decision", "The kill decision, and the bar no model tier cleared."),
      "README": hook("Readme", "How to run it."),
    },
  },
  {
    slug: "calibration",
    name: "Rubric Lens",
    legacyName: "Rubric Triage",
    dir: "Calibration Harness",
    root: DESKTOP,
    report: null,
    data: [
      "out-live/pinned-judge-grounded-in-retrieved-documents.json",
      "out-live/pinned-judge-no-hallucinated-policy.json",
      "out-live/pinned-judge-empathetic-tone.json",
      "out-live/pinned-judge-escalation-policy-followed.json",
      "out-live/pinned-judge-pii-safety.json",
      "out-live/pinned-judge-clear-next-steps.json",
      "out-live/report.html",
    ],
    demo: null,
    sourceDocs: [],
    artifacts: {
      "Case-Study-One-Pager": hook("Case study", "The rubric problem, the question it asks instead, and the partial ship call."),
      "PRD": hook("PRD", "Triage the check, not the answer: is this question answerable at all?"),
      "Metric-Design": hook("Metric design", "Why it prints no accuracy number, and why that is enforced in code."),
      "Eval-Summary": hook("Eval summary", "Six checks over 300 conversations, each phrased two ways and asked three times."),
      "Tradeoff-Memo": hook("Tradeoff memo", "Two phrasings against two models, and why the phrasing pair wins."),
      "Launch-Decision-Memo": hook("Launch decision", "Ship the table, hold the queue, and drop the thirty-minute claim."),
      "README": hook("Readme", "How to run it."),
    },
  },
  {
    slug: "learning-harness",
    name: "Reasoning Atlas",
    legacyName: "Learning Harness",
    dir: "Learning Harness",
    root: DESKTOP,
    report: null,
    data: ["calibration/results/2026-08-28-budget-glm-5-3-flash.json"],
    demo: null,
    sourceDocs: [],
    artifacts: {
      "Case-Study-One-Pager": hook("Case study", "The learning problem, the boundary-first loop, the recorded baseline, and the no-release call."),
      "PRD": hook("PRD", "A map-first learning system that tests reasoning at the edge where a principle stops holding."),
      "Metric-Design": hook("Metric design", "Why recall on right-answer-wrong-reason controls the decision, and why accuracy can hide the failure."),
      "Eval-Summary": hook("Eval summary", "The committed grader run, the full confusion record, the QA findings, and what remains unmeasured."),
      "Tradeoff-Memo": hook("Tradeoff memo", "Where the product spends quality, latency, teaching-integrity, and reliability budget."),
      "Launch-Decision-Memo": hook("Launch decision", "Keep the harness local until the grader and the truthful-state gates earn release."),
      "README": hook("Readme", "How the prototype, evidence, and documents fit together."),
    },
  },
];

/**
 * The two vanilla demos are copied verbatim from their project repos, where they
 * still carry the old dark palette. The house world is applied here rather than
 * by hand in public/demos/, because anything edited there is destroyed by the
 * next sync. Palette lives in one :root block per demo (SPEC 7.1/7.2), so the
 * whole retheme is a token swap plus the flat-world rules: no shadow, no blur,
 * no gradient, no radius except on pills.
 */
const HOUSE_TOKENS = `:root {
  /* House paper world. Source of truth: portfolio/src/styles/house.css. */
  --paper:#f2efe3; --paper-sunk:#e8e4d4; --paper-edge:#dbd6c3;
  --bg:#f2efe3; --bg-raised:#e8e4d4;
  --ink:#171613; --muted:#4e4b42; --dim:#57544a;
  --line:#d5d0be; --line-strong:#bdb7a2;
  --card:#f2efe3; --card-strong:#e8e4d4; --panel:#f2efe3; --panel-solid:#e8e4d4;

  /* The four inks, and what each one means. */
  --vermilion:#e2361a; --vermilion-deep:#b32809;   /* a gate that was missed */
  --chrome:#f2b200;    --chrome-deep:#6b5000;      /* will not hold still     */
  --cobalt:#1b3fd8;    --cobalt-deep:#1834b4;      /* a decision taken        */
  --viridian:#0f8a5f;  --viridian-deep:#0b6a49;    /* held, by construction   */

  --accent:#b32809; --accent-bright:#b32809; --accent-bg:rgba(226,54,26,.09);
  --ok:#0b6a49;    --ok-bg:rgba(15,138,95,.1);
  --warn:#6b5000;  --warn-bg:rgba(242,178,0,.16);
  --bad:#b32809;   --bad-bg:rgba(226,54,26,.09);
  --green:#0b6a49; --amber:#6b5000; --red:#b32809; --blue:#1834b4; --violet:#1834b4;

  --sans:"Archivo Variable",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
  --serif:"Archivo Variable",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
  --mono:"Chivo Mono Variable",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  --radius:0px;
  --shadow:none;
}`;

/* Old dark-world colours, mapped onto the house inks. */
const RGBA_MAP = [
  [[232,169,127],[226,54,26]], [[240,179,138],[226,54,26]], [[239,177,134],[226,54,26]],
  [[255,123,112],[226,54,26]], [[255,129,113],[226,54,26]], [[255,117,99],[226,54,26]],
  [[241,185,110],[242,178,0]], [[241,197,109],[242,178,0]],
  [[128,194,164],[15,138,95]], [[75,148,116],[15,138,95]], [[116,215,162],[15,138,95]],
  [[155,184,255],[27,63,216]], [[137,164,219],[27,63,216]], [[89,116,173],[27,63,216]],
];
const HEX_MAP = {
  "#d8d2dc":"var(--ink-soft)","#d7d1db":"var(--ink)","#d7d1da":"var(--ink)","#ffd0af":"var(--vermilion-deep)",
  "#d3cfda":"var(--muted)","#d5d1da":"var(--ink)","#ffc2b8":"var(--vermilion-deep)",
  "#b8e1ce":"var(--viridian-deep)","#ffd1c8":"var(--vermilion-deep)","#f3c79f":"var(--chrome-deep)",
  "#c7c2cd":"var(--muted)","#c7c2cc":"var(--muted)","#cbc7d2":"var(--muted)","#c9c5d0":"var(--muted)",
  "#bbb7c4":"var(--muted)","#bbb6c3":"var(--muted)","#b5b0bd":"var(--muted)","#aaa5b3":"var(--muted)",
  "#aaa5b1":"var(--muted)","#817b8a":"var(--dim)","#ffd2b4":"var(--cobalt)","#c5c0ca":"var(--muted)",
  "#c9c2cb":"var(--muted)","#cdc7d0":"var(--muted)","#d4c8ff":"var(--cobalt-deep)",
  "#ffd1b2":"var(--vermilion-deep)","#ffd2b5":"var(--vermilion-deep)","#ffc096":"var(--vermilion-deep)",
  "#e8a97f":"var(--vermilion-deep)","#f0b38a":"var(--vermilion-deep)","#ff8171":"var(--vermilion-deep)",
  "#f1edf3":"var(--ink)","#f0edf4":"var(--ink)","#17131a":"var(--paper)","#15121a":"var(--paper)",
  "#8a6600":"var(--chrome-deep)","#c42d0e":"var(--vermilion-deep)",
};

/* Relative luminance, so dark values are caught by rule rather than by a list
   that always misses one. Runs before the token block is inserted, so it can
   never eat the house tokens themselves. */
const isDark = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] < 0.16;
};

function rethemeDemoCss(css) {
  let out = css;
  /* A dark background becomes paper; dark text stays ink. */
  out = out.replace(/(background(?:-color)?\s*:\s*)(#[0-9a-fA-F]{6})/g,
    (m, prop, hex) => (isDark(hex) ? `${prop}var(--paper-sunk)` : m));
  out = out.replace(/(\bcolor\s*:\s*)(#[0-9a-fA-F]{6})/g,
    (m, prop, hex) => (isDark(hex) ? `${prop}var(--ink)` : m));
  out = out.replace(/:root\s*\{[^}]*\}/, HOUSE_TOKENS);
  out = out.replace(/box-shadow\s*:[^;}]*;/g, "box-shadow:none;");
  out = out.replace(/(-webkit-)?backdrop-filter\s*:[^;}]*;/g, "");
  out = out.replace(/(background(-image)?\s*:\s*)(linear|radial)-gradient\([^;]*\);/g, "$1var(--paper-sunk);");
  out = out.replace(/rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([.\d]+)\s*\)/g, (m, r, g, b, a) => {
    const key = [Number(r), Number(g), Number(b)];
    const hit = RGBA_MAP.find(([from]) => from[0] === key[0] && from[1] === key[1] && from[2] === key[2]);
    if (hit) return `rgba(${hit[1].join(",")},${a})`;
    if (key.every((v) => v < 60)) return "var(--paper-sunk)";
    if (key.every((v) => v > 245)) return Number(a) < .5 ? "var(--paper-sunk)" : "var(--paper)";
    return m;
  });
  for (const [from, to] of Object.entries(HEX_MAP)) out = out.replace(new RegExp(from, "gi"), to);
  out = out.replace(/border-radius\s*:\s*(?!999)[0-9.]+(px|rem|em)/g, "border-radius:0px");
  out = out.replace(/border-left:\s*[2-9]px solid/g, "border-left: 1px solid");
  /* Links match the house: ink text, vermilion underline. */
  out = out.replace(/^a\s*\{[^}]*\}/m, 'a { color: var(--ink); text-decoration-color: var(--vermilion); text-decoration-thickness: 2px; text-underline-offset: .18em; }');
  return out + `

/* Applied by scripts/sync.mjs. Edit the transform there, never this file. */
.skip-link { color: var(--paper) !important; background: var(--ink) !important; }
.back-link, .global-nav a { color: var(--ink) !important; }
.global-nav a:hover { color: var(--vermilion-deep) !important; }

/* A grid or flex item defaults to min-width:auto, so a child that is meant to
   scroll horizontally stretches its parent instead. That is what pushed the demo
   sidebars past the viewport on a phone. */
#sidebar, #workspace > *, .doc-list, .case-list { min-width: 0; }
#sidebar ul, .scroller { max-width: 100%; }
`;
}

/* The two shared faces are linked ahead of the demo's own stylesheet. */
function linkHouseFonts(html) {
  if (html.includes("house-demo.css")) return html;
  return html.replace(/<link rel="stylesheet" href="(styles?\.css)">/,
    '<link rel="stylesheet" href="../house-demo.css">\n<link rel="stylesheet" href="$1">');
}

const pending = [];
function emit(path, body) {
  const full = join(ROOT, path);
  const isBuf = Buffer.isBuffer(body);
  const prev = existsSync(full) ? readFileSync(full, isBuf ? undefined : "utf8") : null;
  if (prev !== null && (isBuf ? Buffer.compare(prev, body) === 0 : prev === body)) return;
  pending.push(path);
  if (!CHECK) {
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
  }
}

const esc = (s) => JSON.stringify(String(s));

for (const p of PROJECTS) {
  const base = p.root ? join(p.root, p.dir) : join(SRC, p.dir);
  if (!existsSync(base)) throw new Error(`source project missing: ${base}`);

  // Images referenced from report or artifact markdown. Relative paths are resolved
  // against the source file, copied into public/assets/<slug>/, and rewritten. Without
  // this the build fails on the first chart an eval report embeds.
  const rewriteImages = (body, fromDir) => body.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (m, alt, href) => {
      if (/^(https?:|data:|\/)/.test(href)) return m;
      const abs = resolve(fromDir, href);
      if (!existsSync(abs)) { console.warn(`  missing image: ${p.slug} ${href}`); return m; }
      const name = abs.split("/").pop();
      emit(join("public/assets", p.slug, name), readFileSync(abs));
      return `![${alt}](/assets/${p.slug}/${name})`;
    }
  );


  // Mermaid fenced blocks are lifted to plain <pre class="mermaid"> elements so the
  // client-side renderer can find them; the source markdown keeps ```mermaid fences,
  // which GitHub renders natively.
  const escHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const liftMermaid = (body) => body.replace(
    /```mermaid\s*\n([\s\S]*?)```/g,
    (m, code) => `<pre class="mermaid">\n${escHtml(code.trim())}\n</pre>`
  );

  // Deep source documents are published as explicit downloads instead of broken
  // relative Markdown routes. The link label tells readers they are leaving the
  // rendered portfolio shell.
  const rewriteDeepLinks = (body) => {
    let next = body;
    for (const doc of p.sourceDocs ?? []) {
      for (const match of doc.matches) next = next.replace(match, doc.href);
      const from = join(base, doc.from);
      if (existsSync(from)) emit(doc.to, readFileSync(from, "utf8"));
    }
    next = next.replace(/\[EVAL-PLAN\.md\]\((\/downloads\/prior-auth\/EVAL-PLAN\.md)\)/g, "[View pre-registration source ↓]($1)");
    next = next.replace(/\[`corpus\.md`\]\((\/downloads\/10k-risk\/corpus\.md)\)/g, "[View corpus source ↓]($1)");
    return next;
  };

  /* The local source folders keep their original working titles. Public copies
     use the product names published on GitHub, and sync owns that translation so
     a future refresh cannot silently restore the working names. */
  const applyBrand = (body) => p.legacyName ? body.replaceAll(p.legacyName, p.name) : body;

  // Artifacts: frontmatter is injected here so the markdown in the project repo stays
  // clean. Ordering is the object key order above, which is the reading order.
  let order = 0;
  for (const [file, meta] of Object.entries(p.artifacts)) {
    const from = join(base, "Artifacts", `${file}.md`);
    if (!existsSync(from)) { console.warn(`  missing artifact: ${p.slug}/${file}`); continue; }
    const fm = [
      "---",
      `title: ${esc(meta.title)}`,
      `hook: ${esc(meta.hook)}`,
      `project: ${esc(p.slug)}`,
      `order: ${order++}`,
      `source: ${esc(`${p.dir}/Artifacts/${file}.md`)}`,
      "---",
      "",
    ].join("\n");
    emit(join("src/content/artifacts", p.slug, `${file}.md`), fm + rewriteDeepLinks(liftMermaid(rewriteImages(applyBrand(readFileSync(from, "utf8")), dirname(from)))));
  }

  // Eval report
  const rp = p.report ? join(base, p.report) : null;
  if (rp && existsSync(rp)) {
    const fm = ["---", `title: ${esc("Eval report")}`, `project: ${esc(p.slug)}`,
      `source: ${esc(`${p.dir}/${p.report}`)}`, "---", ""].join("\n");
    emit(join("src/content/reports", `${p.slug}.md`), fm + rewriteDeepLinks(liftMermaid(rewriteImages(readFileSync(rp, "utf8"), dirname(rp)))));
  } else if (p.report) console.warn(`  missing report: ${p.slug}`);

  // Scorecards: the numbers themselves
  for (const rel of p.data) {
    const from = join(base, rel);
    if (!existsSync(from)) { console.warn(`  missing data: ${p.slug}/${rel}`); continue; }
    emit(join("src/data", p.slug, rel.split("/").pop()), readFileSync(from, "utf8"));
  }

  // Demo assets
  if (p.demo) {
    const from = join(base, p.demo);
    const to = join(ROOT, "public/demos", p.slug);
    const walk = (d, pre = "") => readdirSync(d).flatMap((n) => {
      const f = join(d, n);
      return statSync(f).isDirectory() ? walk(f, join(pre, n)) : [join(pre, n)];
    });
    if (existsSync(from)) {
      for (const rel of walk(from)) {
        let body = readFileSync(join(from, rel), "utf8");
        if (rel.endsWith(".css")) body = rethemeDemoCss(body);
        if (rel.endsWith(".html")) body = linkHouseFonts(body);
        emit(join("public/demos", p.slug, rel), body);
      }
    } else console.warn(`  missing demo: ${p.slug}`);
  }
}

// Resume, rendered as a page rather than linked as a file that does not exist.
{
  const from = join(SRC, RESUME.from);
  if (existsSync(from)) emit(RESUME.to, readFileSync(from, "utf8"));
  else console.warn(`  missing resume: ${RESUME.from}`);
}

if (CHECK) {
  if (pending.length) {
    console.error(`sync drift in ${pending.length} file(s):`);
    for (const f of pending.slice(0, 20)) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log("sync: no drift");
} else {
  console.log(pending.length ? `sync: wrote ${pending.length} file(s)` : "sync: already current");
}
