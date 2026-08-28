import paSummary from "../data/prior-auth/_summary.json";
import paHyp from "../data/prior-auth/_hypotheses.json";
import paOod from "../data/prior-auth/ood.json";
import stability from "../data/10k-risk/stability.json";
import diffRouted from "../data/10k-risk/diff-routed.json";
import entailment from "../data/10k-risk/entailment.json";
import instability from "../data/10k-risk/instability-detail.json";
import ndaSweep from "../data/nda-triage/sweep.json";
import ndaSplice from "../data/nda-triage/report.json";
import ndaCost from "../data/nda-triage/cost.json";
import calGrounded from "../data/calibration/pinned-judge-grounded-in-retrieved-documents.json";
import calPolicy from "../data/calibration/pinned-judge-no-hallucinated-policy.json";
import calTone from "../data/calibration/pinned-judge-empathetic-tone.json";
import calEscalation from "../data/calibration/pinned-judge-escalation-policy-followed.json";
import calPii from "../data/calibration/pinned-judge-pii-safety.json";
import calNextSteps from "../data/calibration/pinned-judge-clear-next-steps.json";
import calReport from "../data/calibration/report.html?raw";
import learningRun from "../data/learning-harness/2026-08-28-budget-glm-5-3-flash.json";

export type Badge = "fail" | "pass";
export interface Cell { text: string; mono?: boolean; dim?: boolean; r?: boolean; badge?: Badge }
export interface Table { head: string[]; rows: Cell[][]; caption?: string; note?: string }

const pct = (v: number, d = 3) => v.toFixed(d);
const ci = (w: number[]) => `[${w[0].toFixed(3)}, ${w[1].toFixed(3)}]`;
const t = (text: string, extra: Partial<Cell> = {}): Cell => ({ text, ...extra });
const n = (text: string, extra: Partial<Cell> = {}): Cell => ({ text, mono: true, r: true, ...extra });

/* ---------- Prior Auth: gates, generated from the scorecards ---------- */
const paGateRows: Cell[][] = [
  ...Object.entries(paSummary.in_distribution).map(([cfg, m]: [string, any]) => [
    t(cfg),
    n(pct(m.met_precision.value)),
    n(ci(m.met_precision.wilson95), { dim: true }),
    n(String(m.met_precision.n), { dim: true }),
    { text: m.met_precision.pass ? "held" : "missed the 0.95 bar", r: true, badge: (m.met_precision.pass ? "pass" : "fail") as Badge },
  ]),
  (() => {
    const g = (paOod as any).slices.ood.gates.met_precision;
    return [
      t("ood-fc-golden"),
      n(pct(g.value)),
      n(ci(g.wilson95), { dim: true }),
      n(String(g.n), { dim: true }),
      { text: g.pass ? "held" : "missed the 0.95 bar", r: true, badge: (g.pass ? "pass" : "fail") as Badge },
    ];
  })(),
];

const paCitationRows: Cell[][] = [
  ...Object.entries(paSummary.in_distribution).map(([cfg, m]: [string, any]) => [
    t(cfg),
    n(pct(m.grounded_citation.value)),
    n(String(m.grounded_citation.n), { dim: true }),
    { text: m.grounded_citation.pass ? "held" : "missed", r: true, badge: (m.grounded_citation.pass ? "pass" : "fail") as Badge },
  ]),
];

const paHypRows: Cell[][] = Object.entries(paHyp as any).map(([id, h]: [string, any]) => [
  t(id, { mono: true }),
  t(h.claim),
  { text: h.confirmed ? "held" : "didn't hold", r: true, badge: (h.confirmed ? "pass" : "fail") as Badge },
]);

/* ---------- 10-K: stability, generated ---------- */
const stabRows: Cell[][] = (stability as any).issuers.map((i: any) => {
  const survived = `${Math.round(i.consensus_ratio * 100)}%`;
  return [
    t(i.ticker, { mono: true }),
    n(i.claim_counts.join(" / "), { dim: true }),
    n(i.new_counts.join(" / "), { dim: true }),
    n(i.mean_jaccard.toFixed(3)),
    { text: survived, mono: true, r: true, badge: (i.consensus_ratio === 0 ? "fail" : undefined) as any },
  ];
});

/* ---------- NDA: search-budget sweep, generated ---------- */
const ndaRows: Cell[][] = Object.entries((ndaSweep as any).levels).map(([budget, l]: [string, any]) => [
  t(budget, { mono: true }),
  n(l.absence_precision.toFixed(3)),
  n(l.absence_recall.toFixed(3)),
  n(`${l.correctly_declared_absent} / ${l.gold_absent_items}`, { dim: true }),
  n(String(l.false_absence_count), { dim: true }),
]);

const splice = (ndaSplice as any).extraction;

/* ---------- TL;DR figures, read from the same artifacts as the tables ---------- */
const paGateMetric = (paSummary as any).in_distribution["fc-golden"].met_precision;
const ndaBudget5 = (ndaSweep as any).levels["5"];
const entPct = ((entailment as any).entailment_rate * 100).toFixed(1);
const jacVals = (stability as any).issuers.map((i: any) => i.mean_jaccard);
const jacMin = Math.min(...jacVals).toFixed(2);
const jacMax = Math.max(...jacVals).toFixed(2);
const baDet = (instability as any).issuers.find((i: any) => i.ticker === "BA");
const paCitationMetrics = [
  ...Object.values((paSummary as any).in_distribution).map((m: any) => m.grounded_citation),
  (paOod as any).slices.ood.gates.grounded_citation,
];
const paCitationFloor = Math.min(...paCitationMetrics.map((m: any) => m.value as number));

/* ---------- Rubric Lens: the six checks, and what the rewrites did ------------
   The pinned judge exports carry each check's diagnostics. The corpus size and
   the rewrite outcomes exist only in the run's own report.html, so they are
   parsed out of that committed artifact rather than typed here. */
const CAL_CHECKS = [calGrounded, calPolicy, calTone, calEscalation, calPii, calNextSteps] as any[];

const calTraces = Number(/([\d,]+)\s+traces/.exec(calReport)?.[1].replace(/,/g, "") ?? 0);

/* Each rewrite row: the call the tool stamped on it, and the rate it now fires at. */
export interface Rewrite { of: string; call: string; base: number; consistency: number; stability: number; ceiling: number }
const strip = (v: string) => v.replace(/<[^>]+>/g, "").trim();
const calRewrites: Rewrite[] = [...calReport.matchAll(/<tr class="rewrite-row call-([a-z-]+)">([\s\S]*?)<\/tr>/g)].map((m) => {
  const cells = [...m[2].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => strip(c[1]));
  const pct = (v: string) => Number(/(-?[\d.]+)\s*%/.exec(v)?.[1] ?? 0) / 100;
  return {
    of: /rewrite of ([a-z-]+)/.exec(cells[0])?.[1] ?? "",
    call: m[1],
    base: pct(cells[1]),
    consistency: pct(cells[2]),
    stability: pct(cells[3]),
    ceiling: Number(cells[5]),
  };
});
/* Derived counts still have to read as prose, so small ones are spelled. */
const spell = (v: number) => ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][v] ?? String(v);
const calStamped = calRewrites.filter((r) => r.call === "automatable").length;
const calTooExtreme = calRewrites.filter((r) => r.base <= 0.01 || r.base >= 0.98).length;
const calUnmeasurable = CAL_CHECKS.filter((c) => c.diagnostics.call === "Too Rare").length;

export const CALIBRATION = { checks: CAL_CHECKS, rewrites: calRewrites, traces: calTraces };

/* ---------- Reasoning Atlas: the grader grading itself --------------------- */
const learningResults = (learningRun as any).results as Array<{
  fixture: string; expected: string; actual: string; pass: boolean;
}>;
const learningTarget = learningResults.filter((r) => r.expected === "right_answer_wrong_reason");
const learningTargetHits = learningTarget.filter((r) => r.pass).length;
const learningRecall = Number((learningRun as any).recallRightAnswerWrongReason);
const learningClassRows = [...new Set(learningResults.map((r) => r.expected))]
  .map((expected) => {
    const rows = learningResults.filter((r) => r.expected === expected);
    const correct = rows.filter((r) => r.pass).length;
    return { expected, total: rows.length, correct };
  })
  .sort((a, b) => b.total - a.total || a.expected.localeCompare(b.expected));
const humanClass = (value: string) => value.replaceAll("_", " ");

export const LEARNING = {
  run: learningRun as any,
  results: learningResults,
  target: learningTarget,
  targetHits: learningTargetHits,
  recall: learningRecall,
};

export const TABLES: Record<string, Table[]> = {
  "prior-auth": [
    {
      caption: "Every configuration is scored against the release bar set before the run, and the result is reported before any utility metric. No utility metric offsets a miss.",
      head: ["Configuration", "met-precision", "Wilson 95%", "n", "Release bar"],
      rows: paGateRows,
      note: "The out of distribution row returns a perfect point estimate and still fails, because ten observations cannot lift the lower bound above 0.90. Reporting it as a pass would be the interesting kind of dishonest.",
    },
    {
      caption: "Grounded citation is enforced by code rather than by prompting. The evaluator relocates every span itself and drops what it cannot find, so a met with no span is downgraded to non-determinable.",
      head: ["Configuration", "grounded citation", "n", "Release bar"],
      rows: paCitationRows,
      note: "1.000 on every configuration, by construction.",
    },
    {
      caption: "Six hypotheses were registered before the run. Four held. Two did not, and they are reported here at the same size as the four that did.",
      head: ["Hypothesis", "Registered claim", "Result"],
      rows: paHypRows,
    },
  ],
  "10k-risk": [
    {
      caption: "The same pipeline run three times per issuer. Only the cache salt changes, so every pass makes real calls rather than replaying the last one. The last column is the share of flagged passages that survive all three passes.",
      head: ["Issuer", "claims per pass", "new claims per pass", "mean Jaccard", "flagged passages surviving all 3"],
      rows: stabRows,
      note: `Corpus totals: ${(diffRouted as any).totals.claims.toLocaleString()} risk claims, ${(diffRouted as any).totals.rejected_citations} rejected citations, $${(diffRouted as any).totals.cost_usd.toFixed(2)} per full corpus run.`,
    },
  ],
  "nda-triage": [
    {
      caption: "Absence detection across three search budgets. Recall is the metric that matters: a missed absence lets a document sail toward auto-approval looking clean, and precision costs only a human clearing a flag in seconds.",
      head: ["Search budget", "absence precision", "absence recall", "found / gold absent", "false absence"],
      rows: ndaRows,
      note: `Total inference spend across the whole project: $${(ndaCost as any).total_estimated_cost_usd.toFixed(2)} against a $${(ndaCost as any).ceiling_usd.toFixed(0)} ceiling.`,
    },
    {
      caption: "Splice fixtures test the kill criterion directly: real NDA bodies with a rider or IP-assignment clause of known type spliced in, so ground truth holds by construction.",
      head: ["Splice fixtures", "hits", "hit rate", "kill-criterion misses", "control false positives"],
      rows: [[
        t(String(splice.spliced_fixtures), { mono: true }),
        n(String(splice.splice_hits)),
        n(splice.splice_hit_rate.toFixed(3)),
        { text: String(splice.kill_criterion_misses.length), mono: true, r: true, badge: "fail" as Badge },
        n(String(splice.control_false_positives.length)),
      ]],
      note: "Seven misses on unacceptable-tier clause types. One is enough to fail the criterion.",
    },
  ],
  "calibration": [
    {
      caption: "The six checks as measured, with no human labels anywhere. Fires on is how often the check says yes. Agrees with itself is the same phrasing asked three times. Two phrasings agree is the point of the whole method: two honest wordings of a clear question agree, and two wordings of a muddy one do not.",
      head: ["Check", "fires on", "agrees with itself", "two phrasings agree", "best recall reachable", "Call"],
      rows: CAL_CHECKS.map((c: any) => [
        t(c.criterion.name),
        n(`${(c.diagnostics.base_rate * 100).toFixed(1)}%`),
        n(`${(c.diagnostics.self_consistency * 100).toFixed(0)}%`),
        n(`${(c.diagnostics.rendering_stability * 100).toFixed(0)}%`),
        n(c.diagnostics.recall_ceiling.toFixed(2), { dim: true }),
        {
          text: c.diagnostics.call === "Automatable" ? "no ambiguity found" : c.diagnostics.call === "Ambiguous" ? "ambiguous, rewrite proposed" : "too rare to measure",
          r: true,
          badge: (c.diagnostics.call === "Automatable" ? "pass" : "fail") as Badge,
        },
      ]),
      note: `Only one check of ${CAL_CHECKS.length} is measurable as written. ${spell(calUnmeasurable).replace(/^./, (m) => m.toUpperCase())} fire too rarely for any recall to be reachable, and one is genuinely ambiguous: its two phrasings agree only ${((calPii as any).diagnostics.rendering_stability * 100).toFixed(0)}% of the time.`,
    },
    {
      caption: "The tool then rewrote the five failing checks by itself and re-measured them on the same conversations. This table is the finding.",
      head: ["Rewrite of", "now fires on", "agrees with itself", "two phrasings agree", "best recall", "Call the tool stamped"],
      rows: calRewrites.map((r) => [
        t(r.of, { mono: true }),
        n(`${(r.base * 100).toFixed(0)}%`),
        n(`${(r.consistency * 100).toFixed(0)}%`),
        n(`${(r.stability * 100).toFixed(0)}%`),
        n(r.ceiling.toFixed(2), { dim: true }),
        {
          text: r.call === "automatable" ? "no ambiguity found" : r.call === "ambiguous" ? "ambiguous" : "too rare to measure",
          r: true,
          badge: (r.call === "automatable" ? "fail" : "pass") as Badge,
        },
      ]),
      note: `The mark on this table means the opposite of the one above it, and that is the point: every row marked here is one the tool called a pass and should not have. ${spell(calStamped).replace(/^./, (m) => m.toUpperCase())} rewrites now fire on nearly every conversation, which distinguishes nothing, and the verdict logic had no ceiling to catch it.`,
    },
  ],
  "learning-harness": [
    {
      caption: `The recorded run graded ${(learningRun as any).cases} committed fixtures. The class mix is deliberately weighted toward the failure a quiz cannot see: a learner who reaches the right answer by reasoning that will not generalize.`,
      head: ["Expected diagnosis", "Fixtures", "Correct", "Recall"],
      rows: learningClassRows.map((r) => [
        t(humanClass(r.expected)),
        n(String(r.total), { dim: true }),
        n(String(r.correct)),
        {
          text: `${Math.round((r.correct / r.total) * 100)}%`,
          mono: true,
          r: true,
          badge: (r.correct === r.total ? "pass" : "fail") as Badge,
        },
      ]),
      note: `Overall accuracy was ${(learningRun as any).accuracy}. The headline class was caught ${learningTargetHits} time in ${learningTarget.length}; the aggregate score hides where the misses landed.`,
    },
    {
      caption: "Every false-confidence fixture, shown without averaging. A wrong route changes what the learner is told and which principle the system teaches next.",
      head: ["Fixture", "Expected", "Grader returned", "Result"],
      rows: learningTarget.map((r) => [
        t(r.fixture.replaceAll("-", " ")),
        t(humanClass(r.expected), { mono: true, dim: true }),
        t(humanClass(r.actual), { mono: true }),
        { text: r.pass ? "caught" : "misrouted", r: true, badge: (r.pass ? "pass" : "fail") as Badge },
      ]),
      note: `The baseline recall is ${(learningRecall * 100).toFixed(0)}%. The recorded run belongs to ${(learningRun as any).model}; the pinned grader is still the pending measurement.`,
    },
  ],
};

export type Ink = "vermilion" | "chrome" | "cobalt" | "viridian" | "violet" | "ink";

/* One stage of a project's pipeline, drawn on the project page. The detail line
   says what the stage does and, where it matters, what it refuses to do. */
export interface Stage { icon: string; name: string; detail: string }

export const PIPELINES: Record<string, Stage[]> = {
  "prior-auth": [
    { icon: "chart", name: "Read the record", detail: "A synthetic patient chart and the payer's own published policy go in. Nothing is fetched at run time." },
    { icon: "funnel", name: "Extract the criteria", detail: "The policy becomes a list of criteria the case has to meet, one at a time, in the payer's wording." },
    { icon: "scale", name: "Decide each criterion", detail: "Met, not met, or non-determinable. A chart that never mentions a criterion is not evidence against it." },
    { icon: "gate", name: "Gate every citation", detail: "The evaluator relocates each quoted span itself and discards what it cannot find, so a met with no span is downgraded by code rather than by prompting." },
    { icon: "letter", name: "Compose the request", detail: "The draft the clinic sends, every clinical claim carrying the passage it came from, and a review-required banner on all of them." },
  ],
  "10k-risk": [
    { icon: "policy", name: "Take Item 1A", detail: "The risk-factor section of a 10-K: twenty to fifty pages, drafted for litigation defence, so everything conceivable is disclosed." },
    { icon: "lines", name: "Split to sentences", detail: "Item 1A is cut into identified sentences before any model sees it. Models emit sentence ids and never quoted text, so a citation cannot be fabricated." },
    { icon: "funnel", name: "Decompose to claims", detail: "Each risk factor becomes individual claims. Claims are the unit of comparison, factors the unit of provenance." },
    { icon: "tag", name: "Tag to the taxonomy", detail: "Forty-eight categories, so identical exposures filed under different headings still line up across issuers." },
    { icon: "diff", name: "Diff against last year", detail: "Most of the text is recycled verbatim from the prior year, so the signal lives entirely in the delta." },
  ],
  "nda-triage": [
    { icon: "stack", name: "Take the inbound NDA", detail: "ContractNLI's public dev split, sixty-one documents, scored against the dataset's own expert annotations. No model grades another model." },
    { icon: "funnel", name: "Extract the clauses", detail: "What the agreement actually says, span by span, with every span verified against the source text before it counts." },
    { icon: "absence", name: "Prove what is missing", detail: "The hard half, and the product. Finding a clause that is present is easy; showing an expected one is absent is what a reviewer cannot do by eye." },
    { icon: "route", name: "Route it, or do not", detail: "Who, if anyone, needs to read this. Recall outranks precision, because a missed absence sails toward auto-approval looking clean." },
  ],
  "calibration": [
    { icon: "rubric", name: "Take the rubric, in prose", detail: "About eight bullets in a document the product manager owns. What good means is her call, not the tool's." },
    { icon: "funnel", name: "Split into checks", detail: "Each bullet becomes one yes-or-no question, scored on its own, so a rewrite has something specific to aim at." },
    { icon: "fork", name: "Write it two honest ways", detail: "Two phrasings of her question, never two models. When two phrasings disagree, the remedy is hers to carry out." },
    { icon: "repeat", name: "Ask three times", detail: "Same settings, same conversations, three passes. A model from a second maker breaks the ties." },
    { icon: "table", name: "Print the coverage table", detail: "How often it fires, how often it agrees with itself, how often the two phrasings agree. No accuracy number, ever, and that is enforced in code." },
  ],
  "learning-harness": [
    { icon: "rubric", name: "Name the learning purpose", detail: "The learner says what they need the topic for, so the map is scoped to a real decision rather than a generic curriculum." },
    { icon: "stack", name: "Draft the topic map", detail: "The model proposes principles, boundaries, dependencies, and common confusions. The learner corrects the map before any case runs." },
    { icon: "gate", name: "Case the boundary", detail: "The learner meets a situation where the obvious rule stops holding. The rule stays hidden and the answer is free prose." },
    { icon: "funnel", name: "Probe the reasoning", detail: "Short follow-ups expose what the learner left implicit before the grader commits to a diagnosis." },
    { icon: "arbitrate", name: "Diagnose from a closed set", detail: "Every claim quotes the learner's own words. A missing foundation names the exact node the session must revisit." },
    { icon: "route", name: "Transfer or redirect", detail: "A miss earns a new surface at the same boundary. A deeper break redirects only to the presupposed principle." },
  ],
};

export interface Project {
  slug: string; name: string; domain: string; blurb: string;
  /* The ink this project's field is drenched in, and the measured fact that
     earns it. The house rule: a colour on this site stands for something the
     evidence says, or it is not used. */
  ink: Ink; inkMeans: string;
  scale: { value: string; label: string };
  result: { value: string; label: string };
  proof: string;
  launch: { label: string; tone: "fail" | "review"; gate: string; reason: string };
  problem: string; people: string; built: string; decisions: string[];
  finding: string; tldr: string[]; demo?: { href: string; label: string }; report: string;
  repo?: { href: string; label: string };
  /* False when a project publishes its evidence inside its artifacts rather than
     as a separate eval report; the nav and the record grid follow this. */
  hasReport?: boolean;
  shot?: { src: string; alt: string; caption: string; width: number; height: number };
}

export const PROJECTS: Project[] = [
  {
    slug: "prior-auth",
    name: "Prior Auth Agent",
    domain: "Clinical",
    ink: "vermilion", inkMeans: "a gate that was missed",
    blurb: "Reads a chart, checks the payer's published policy, and drafts an evidence-cited authorization request. Every claim carries the passage it came from.",
    scale: { value: (402).toString(), label: "determinations, 20 cases across 6 payer policies" },
    result: { value: `${(paCitationFloor * 100).toFixed(0)}%`, label: `citation grounding across ${paCitationMetrics.length} evaluated configurations` },
    proof: "Grounded by construction",
    launch: { label: "No ship", tone: "fail", gate: "Met-precision safety gate", reason: "The system missed its pre-registered 95% precision bar." },
    problem: "Prior authorization is a paperwork tax on care. Staff hunt through charts to prove a patient meets criteria that live in a PDF on a payer website, every payer writes its own criteria, and Medicare writes different ones again. The same evidence can be enough under one policy and not enough under another, and the difference is often one word: must, versus usually.",
    people: "A patient can have the imaging and clinical history they need, yet still wait while a staff member assembles the proof for a payer by hand.",
    built: "A four-stage agent that extracts criteria, evaluates the case, checks citations, and composes the request, plus a scoring system that grades every step. Twenty synthetic Synthea cases across 6 published payer policies produce 402 in-distribution determinations. Five dictated orthopedic notes are held out and never pooled with the synthetic corpus. Before output, the system checks 555 clinical assertions and runs 127 contract tests.",
    decisions: [
      "Non-determinable is a first-class answer: a chart that does not mention a criterion is not evidence against it.",
      "Grounded citation is enforced in code: a met with no locatable span is downgraded automatically.",
      "Precision decides whether it ships; recall is only reported. A weak request can be strengthened by a human; a confident false claim leaves the building.",
      "Check type is biased toward inferential. Over-classifying a criterion as deterministic sends clinical judgment to a comparison operator, which is unsafe. Under-classifying only wastes money.",
      "The system never claims approval. It states what the record supports, because predicting a payer decision would invite reliance the evidence cannot carry.",
    ],
    finding: "The best run fell 1.1 points short of the release bar. Seven unsupported claims per 114 means seven letters could reach a payer under a physician's signature. That is the harm the bar was written to prevent.",
    tldr: [
      "<strong>What it is.</strong> An agent that reads a patient's chart, checks it against the payer's published policy, and drafts the authorization request the clinic sends to the insurer. Every clinical claim in the draft carries the exact passage it came from.",
      "<strong>Why it matters.</strong> Prior authorization is paperwork that delays care. The dangerous failure is a draft that claims the patient meets a criterion the chart does not support, sent to a payer under a physician's signature.",
      "<strong>Scale.</strong> 20 synthetic patients across 6 real published payer policies (402 determinations), 5 real dictated orthopedic notes held out as a reality check, 555 clinical claims checked before anything leaves the system, 127 automated contract tests.",
      `<strong>The safety bar.</strong> Set before the run: when the system says a criterion is met, it must be right at least 95% of the time. Measured across all six configurations: right ${(paGateMetric.value * 100).toFixed(1)}% of the time (95% confidence range ${ci(paGateMetric.wilson95)}, ${paGateMetric.n} cases).`,
      "<strong>What held.</strong> Citation grounding is perfect (1.000) on all six configurations, enforced by code rather than prompting: the system re-locates every quoted passage itself and discards what it cannot find, so a citation cannot be fabricated.",
    ],
    demo: { href: "/demos/prior-auth/", label: "Open the prototype" },
    shot: {
      src: "/assets/prior-auth/demo.jpg",
      width: 1600,
      height: 1000,
      alt: "The Prior Auth Agent prototype: patient profiles on a synthetic corpus",
      caption: "The prototype, replaying recorded runs: pick a patient profile and a payer policy, and it drafts the evidence cited request.",
    },
    report: "/projects/prior-auth/report/",
  },
  {
    slug: "10k-risk",
    name: "10-K Risk Extractor",
    domain: "Markets",
    ink: "chrome", inkMeans: "a result that will not hold still",
    blurb: "Turns Item 1A prose into a comparable, diffable, source-cited dataset, then grades its own output.",
    scale: { value: "3,216", label: "risk claims extracted across 20 filings" },
    result: { value: (diffRouted as any).totals.claims.toLocaleString(), label: "source-linked risk claims made comparable across 20 filings" },
    proof: "Every record traceable to source",
    launch: { label: "No ship", tone: "fail", gate: "Run-to-run stability gate", reason: "Identical inputs produced materially different alerts across runs." },
    problem: "Item 1A runs 20 to 50 pages, drafted for litigation defence, so everything conceivable is disclosed and the two or three material changes are buried. Most of it is recycled verbatim from the prior year, which means the signal lives in the delta. There is no mandated taxonomy, so identical exposures appear under different headings across issuers, which is why keyword search and naive text diffing both fail.",
    people: "Before the market opens, an analyst may have 691 risk factors in front of them and only a few hours to find the two that changed.",
    built: "The system preserves each risk factor as the issuer presented it, breaks it into individual claims, tags those claims against a 48-category taxonomy, and compares them with the prior year. The corpus covers 10 issuers, 20 filings, and 10,074 sentences. Every record links back to its source sentences.",
    decisions: [
      "Claims are the unit of comparison, factors are the unit of provenance. Claim level diffing survives an issuer restructuring its sections; factor level diffing reports the restructure as new risk.",
      "Citations are structurally impossible to fabricate. Item 1A is split into identified sentences before any model sees it, and models emit sentence ids, never quoted text.",
      "Entailment is verified separately, by a different model family than the extractor, because a model can cite a real sentence and still attach a claim it does not support.",
      "Intensity is decomposed, never judged. Nothing is ever asked whether a risk intensified.",
      "It never emits an aggregate risk score. A score strips the traceability that makes the output safe to act on.",
    ],
    finding: "Run-to-run stability controls the recommendation. The output scores well on average, but identical inputs can produce different alerts. An analyst cannot rely on a flag that disappears the next time the filing runs.",
    tldr: [
      "<strong>What it is.</strong> Reads the risk-factor section of 10-K filings and turns the prose into a structured dataset of individual risk claims, each one traced to the exact sentences it came from, so this year's filing can be compared against last year's.",
      "<strong>Why it matters.</strong> An analyst faces 691 risk factors per company and needs the two that actually changed. Most of the text is recycled verbatim from the prior year, so keyword search and naive diffing both fail.",
      `<strong>Scale.</strong> 10 companies, two filings each, 10,074 sentences, ${(diffRouted as any).totals.claims.toLocaleString()} risk claims. A full corpus run costs $${(diffRouted as any).totals.cost_usd.toFixed(2)}.`,
      `<strong>Accuracy.</strong> Zero fabricated citations, structurally: models point to sentence IDs and never quote text, so there is nothing to fabricate. ${entPct}% of claims are supported by the text they cite.`,
      `<strong>Stability.</strong> The same pipeline, run three times on the same filing, does not agree with itself. Run-to-run agreement ranges ${jacMin} to ${jacMax} by company, and on Boeing ${baDet.always_flagged.length} of ${baDet.ever_flagged.length} passages flagged as newly disclosed risk survive all three runs.`,
    ],
    demo: { href: "/demos/10k-risk/", label: "See the instability" },
    shot: {
      src: "/assets/10k-risk/demo.jpg",
      width: 1600,
      height: 925,
      alt: "Three identical runs of the pipeline on the same Boeing filing, side by side",
      caption: "The same pipeline run three times on the same filing. The highlighted passages are flagged as new risk; on Boeing, almost none survive all three passes.",
    },
    report: "/projects/10k-risk/report/",
  },
  {
    slug: "nda-triage",
    name: "NDA Triage",
    domain: "Legal",
    ink: "cobalt", inkMeans: "a decision that was taken",
    blurb: "Compares inbound NDAs against a company playbook to decide who, if anyone, needs to read them. Built around proving a clause is absent.",
    scale: { value: "0.983", label: "absence precision on real annotated NDAs" },
    result: { value: `${(ndaBudget5.absence_precision * 100).toFixed(1)}%`, label: "precision detecting absent clauses against expert annotations" },
    proof: "Scored without an LLM judge",
    launch: { label: "Kill", tone: "fail", gate: "Unacceptable-clause kill criterion", reason: "Every tested model tier missed planted unacceptable clauses." },
    problem: "Most inbound NDAs are routine. The expensive part is finding the few that are not. The real danger may be a missing protection or a rider quietly attached to an otherwise standard agreement.",
    people: "A lawyer with forty NDAs in the queue needs to know which agreement hides an IP assignment before deciding what to read first.",
    built: "Extraction, then absence detection against a playbook, scored on ContractNLI's own expert annotations so no hand labelling enters the loop. Dev split only, 61 documents; the 123 document test split was never touched. No LLM as judge anywhere. Every model call is priced into an append only cost ledger.",
    decisions: [
      "Absence is the product. Proving a clause is missing is harder than finding one that is present, and it is the thing a reviewer cannot do quickly by eye.",
      "The error asymmetry drives the whole eval. A missed absence is catastrophic; a false absence is merely annoying, so recall is weighted above precision.",
      "No LLM as judge, anywhere. Gold is ContractNLI's native expert annotation, in domain and independent of the system under test.",
      "The test split is touched exactly once, at the end. Everything reported here is dev.",
      "Kill criteria were written before the runs, and they are all false-negative statements.",
    ],
    finding: "No tested model tier clears the unacceptable-tier false-negative bar, so the product is not shippable at any autonomy setting at these price points. That is a kill decision, made on evidence, against my own product.",
    tldr: [
      "<strong>What it is.</strong> Reads an inbound NDA, compares it against the company's playbook, and decides who, if anyone, needs to read it. The hard part is proving that an expected clause is missing; finding clauses that are present is easier.",
      "<strong>Why it matters.</strong> The dangerous NDA is usually not the one with a bad clause. It is the one missing a standard protection, or carrying a quiet IP-assignment rider, in a queue of forty.",
      `<strong>How it was measured.</strong> ContractNLI's public dev split (61 documents), scored against the dataset's own expert annotations, with no model grading another model anywhere. The 123-document test split was never touched. Total inference spend $${(ndaCost as any).total_estimated_cost_usd.toFixed(2)} of a $${(ndaCost as any).ceiling_usd.toFixed(0)} ceiling.`,
      `<strong>Results.</strong> When the system declares a clause absent, it is right ${(ndaBudget5.absence_precision * 100).toFixed(1)}% of the time, and it catches ${(ndaBudget5.absence_recall * 100).toFixed(1)}% of genuinely absent clauses.`,
      `<strong>The kill criterion.</strong> On documents with a deliberately planted unacceptable clause (a non-compete rider or an IP assignment), the primary model missed ${splice.kill_criterion_misses.length} of ${splice.spliced_fixtures}.`,
    ],
    demo: { href: "/demos/nda-triage/", label: "Open the prototype" },
    shot: {
      src: "/assets/nda-triage/demo.jpg",
      width: 1600,
      height: 1000,
      alt: "The NDA Triage static replay demo, with routing decision and clause tiers",
      caption: "Six real NDAs replayed in the browser against the playbook. Change the deal context and the routing decision changes with it.",
    },
    report: "/projects/nda-triage/report/",
  },
  {
    slug: "calibration",
    name: "Rubric Lens",
    domain: "Evaluation",
    ink: "ink", inkMeans: "a measurement that could not be made",
    blurb: "Decides whether a quality check can be measured at all, before anyone spends weeks building a labelled dataset to find out.",
    scale: { value: calTraces.toLocaleString(), label: `conversations, ${CAL_CHECKS.length} checks, each phrased two ways and asked three times` },
    result: { value: String(CAL_CHECKS.length), label: "quality checks triaged before any labeling spend" },
    proof: "No labeled dataset required",
    launch: {
      label: "Partial ship",
      tone: "review",
      gate: "Rewrite verdict logic",
      reason: "The coverage table ships to one design partner. The arbitration queue does not ship at all.",
    },
    problem: "A product manager owns an AI support agent, and what good means is her call. It lives in a document with about eight bullets: stay grounded in the retrieved documents, never invent a policy, match the customer's tone, escalate above your authority, never repeat sensitive data, close with a clear next step. She wants those scored automatically. The standard way to find out whether a model can score them is to hand-label a few hundred conversations, and building that dataset is the thing her team says it cannot afford. Maintaining it forever is the part that actually breaks teams.",
    people: "The person here is the product manager who owns the definition of good, and who is the only one who can fix a question that turns out to be vague.",
    built: `One command takes a folder of production conversations and a rubric written in prose. It splits the rubric into yes-or-no checks, writes each check two honest ways, asks every phrasing three times across ${calTraces.toLocaleString()} machine-generated support conversations, and prints a coverage table. A model from a second maker breaks ties. A de-identifier runs entirely on the local machine and never sends anything to a model. Each check is exported as a pinned judge naming its exact model, its settings, and its aggregation rule.`,
    decisions: [
      "Score the individual check, never the rubric as a whole. One verdict on whether a reply was good tells you it was wrong without telling you which sub-question was the vague one, and a rewrite then has nothing to aim at.",
      "Two phrasings of one question, not two models. When two models disagree the remedy is to change the model, which she cannot do. When two phrasings of her own question disagree the remedy is to rewrite the question, which is hers. A diagnosis is only worth having if it comes with an action she can take.",
      "Print no accuracy number, ever, and enforce that in code. The reporting layer receives counts and never verdicts, and an automatic check reads the code to confirm there is no way to divide one by the other.",
      "The human arbitrates, never labels. Reading a raw conversation cold takes minutes and she gets it wrong about one time in ten. Choosing between two written rationales with the passages already pulled out takes about a minute, and she is far more reliable at it.",
      "Ask whether a check is answerable, not whether the model answered it correctly. Firing rate, self-agreement, and agreement between two phrasings say most of what a labelled dataset would have said, and they cost nothing but model calls.",
    ],
    finding: `The tool rewrote its ${spell(calRewrites.length)} failing checks by itself and not one landed anywhere useful. ${spell(calStamped).replace(/^./, (m) => m.toUpperCase())} of them went from firing on almost no conversations to firing on almost all of them, and the verdict logic stamped every one as automatable. A check that fires on everything carries exactly as little information as one that fires on nothing, and the logic had a floor on how rarely a check may fire and no ceiling at all.`,
    tldr: [
      "<strong>What it is.</strong> A way to triage the quality checks in a rubric with no labelled data at all. Instead of asking how accurate a judge is, which needs labels, it asks whether the question is answerable at all, which does not.",
      `<strong>How it was measured.</strong> ${calTraces.toLocaleString()} machine-generated support conversations, a rubric split into ${CAL_CHECKS.length} checks, each check phrased two ways and asked three times, with a model from a second maker breaking ties. Zero human labels anywhere.`,
      `<strong>What it found.</strong> ${spell(calUnmeasurable)} of the ${CAL_CHECKS.length} checks fire too rarely to measure at all. When the tool rewrote the failing ones, ${spell(calTooExtreme)} of ${spell(calRewrites.length)} rewrites landed at one extreme or the other, and the strongest verdict the tool prints was stamped on ${spell(calStamped)} of them.`,
    ],
    shot: {
      src: "/assets/calibration/interface.png",
      width: 1600,
      height: 1000,
      alt: "Rubric Lens coverage table showing six quality checks with their firing rate, consistency, stability, and triage call",
      caption: "The generated coverage table makes each check's firing rate, stability, and triage call visible before any labelling budget is spent.",
    },
    hasReport: false,
    repo: { href: "https://github.com/amiteshdwivedijhu-ship-it/rubric-lens", label: "View Rubric Lens on GitHub" },
    report: "/projects/calibration/eval-summary/",
  },
  {
    slug: "learning-harness",
    name: "Reasoning Atlas",
    domain: "Learning",
    ink: "violet", inkMeans: "a diagnosis that diverged",
    blurb: "Turns a complex topic into a map of principles and boundaries, then uses free-response cases to locate where a learner's reasoning breaks.",
    scale: { value: String((learningRun as any).cases), label: "committed fixtures in the first recorded grader run" },
    result: { value: `${(learningRecall * 100).toFixed(0)}%`, label: "recall on the false-confidence class" },
    proof: "Reasoning graded, not answers",
    launch: {
      label: "No ship",
      tone: "fail",
      gate: "Grader recall and truthful-state gates",
      reason: "The first recorded baseline missed most false-confidence cases, while readiness defects could still misdescribe the learner's state.",
    },
    problem: "Most learning tools test whether someone recognizes or reproduces an answer. They do not reveal whether the reasoning underneath will survive a new context, and repetition without a map schedules questions rather than repairing understanding.",
    people: "A learner can reach the right answer for the wrong reason, leave with more confidence, and carry a rule that fails at the first unfamiliar edge.",
    built: "A local-first learning loop that drafts a topic into principles with explicit boundaries, has the learner correct that map, then generates cold cases at those boundaries. Free-text answers are probed before a closed-taxonomy grader diagnoses the break, quotes the learner's own words, and chooses a transfer at the same edge or a redirect to the missing foundation.",
    decisions: [
      "A principle and the edge where it stops holding are one atomic unit. The case generator, grader, readiness gate, and redirect logic all read the same map.",
      "Draft first, correct after. Reacting to an imperfect proposed map is cheaper than asking a learner to author a complete one before learning can begin.",
      "Case before rule, with free prose rather than multiple choice. The reveal lands only after the learner has committed to a reasoning path.",
      "The grader cannot quietly agree. Its class list is closed, every diagnosis is grounded in quoted learner text, and a missing foundation must name the node to revisit.",
      "Confidence is a recency fact, not mastery. Sound means the latest relevant verdict held; the interface is forbidden from turning that into a cumulative score.",
    ],
    finding: `The recorded baseline caught ${learningTargetHits} of ${learningTarget.length} learners who reached the right answer by fragile reasoning. The core mechanism is therefore the exact class the current grader misses, and the product stays local until the grader and the readiness gates earn release.`,
    tldr: [
      "<strong>What it is.</strong> A map-first learning system for complex topics. It tests the boundary where a principle stops holding, grades the learner's reasoning rather than the final answer, and uses the diagnosis to choose the next case.",
      `<strong>How it was measured.</strong> A committed run of ${(learningRun as any).cases} known-answer fixtures against ${(learningRun as any).model}, with every expected and returned diagnosis published rather than averaged away.`,
      `<strong>What it found.</strong> Overall accuracy was ${(learningRun as any).accuracy}, but recall on the class that catches false confidence was ${(learningRecall * 100).toFixed(0)}%: ${learningTargetHits} of ${learningTarget.length}. The launch decision is no release.`,
    ],
    shot: {
      src: "/assets/learning-harness/interface.png",
      width: 1600,
      height: 1000,
      alt: "Reasoning Atlas purpose screen asking what the learner wants to master and why",
      caption: "The learning loop starts with the learner's purpose, then builds a map of principles and tests the boundaries where each one stops holding.",
    },
    hasReport: false,
    repo: { href: "https://github.com/amiteshdwivedijhu-ship-it/reasoning-atlas", label: "View Reasoning Atlas on GitHub" },
    report: "/projects/learning-harness/eval-summary/",
  },
];

export const bySlug = (slug: string) => PROJECTS.find((p) => p.slug === slug)!;
