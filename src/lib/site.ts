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
};

export interface Project {
  slug: string; name: string; domain: string; blurb: string;
  scale: { value: string; label: string };
  launch: { label: string; tone: "fail" | "review"; gate: string; reason: string };
  problem: string; people: string; built: string; decisions: string[];
  finding: string; tldr: string[]; demo?: { href: string; label: string }; report: string;
  shot: { src: string; alt: string; caption: string };
}

export const PROJECTS: Project[] = [
  {
    slug: "prior-auth",
    name: "Prior Auth Agent",
    domain: "Clinical",
    blurb: "Reads a chart, checks the payer's published policy, and drafts an evidence-cited authorization request. Every claim carries the passage it came from.",
    scale: { value: (402).toString(), label: "determinations, 20 cases across 6 payer policies" },
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
      alt: "The Prior Auth Agent prototype: patient profiles on a synthetic corpus",
      caption: "The prototype, replaying recorded runs: pick a patient profile and a payer policy, and it drafts the evidence cited request.",
    },
    report: "/projects/prior-auth/report/",
  },
  {
    slug: "10k-risk",
    name: "10-K Risk Extractor",
    domain: "Markets",
    blurb: "Turns Item 1A prose into a comparable, diffable, source-cited dataset, then grades its own output.",
    scale: { value: "3,216", label: "risk claims extracted across 20 filings" },
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
      alt: "Three identical runs of the pipeline on the same Boeing filing, side by side",
      caption: "The same pipeline run three times on the same filing. The highlighted passages are flagged as new risk; on Boeing, almost none survive all three passes.",
    },
    report: "/projects/10k-risk/report/",
  },
  {
    slug: "nda-triage",
    name: "NDA Triage",
    domain: "Legal",
    blurb: "Compares inbound NDAs against a company playbook to decide who, if anyone, needs to read them. Built around proving a clause is absent.",
    scale: { value: "0.983", label: "absence precision on real annotated NDAs" },
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
      alt: "The NDA Triage static replay demo, with routing decision and clause tiers",
      caption: "Six real NDAs replayed in the browser against the playbook. Change the deal context and the routing decision changes with it.",
    },
    report: "/projects/nda-triage/report/",
  },
];

export const bySlug = (slug: string) => PROJECTS.find((p) => p.slug === slug)!;
