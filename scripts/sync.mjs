/**
 * Copies build inputs from the three project repos into this one.
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
];

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
  const base = join(SRC, p.dir);
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
    emit(join("src/content/artifacts", p.slug, `${file}.md`), fm + rewriteDeepLinks(liftMermaid(rewriteImages(readFileSync(from, "utf8"), dirname(from)))));
  }

  // Eval report
  const rp = join(base, p.report);
  if (existsSync(rp)) {
    const fm = ["---", `title: ${esc("Eval report")}`, `project: ${esc(p.slug)}`,
      `source: ${esc(`${p.dir}/${p.report}`)}`, "---", ""].join("\n");
    emit(join("src/content/reports", `${p.slug}.md`), fm + rewriteDeepLinks(liftMermaid(rewriteImages(readFileSync(rp, "utf8"), dirname(rp)))));
  } else console.warn(`  missing report: ${p.slug}`);

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
        emit(join("public/demos", p.slug, rel), readFileSync(join(from, rel), "utf8"));
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
