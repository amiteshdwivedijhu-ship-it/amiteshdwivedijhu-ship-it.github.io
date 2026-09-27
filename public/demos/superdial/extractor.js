// extractor.js
// Rule-based, span-citing extraction for synthetic prior-auth status calls.
// Deterministic: same transcript + portal snippet in, same packet out.
// Every extracted field carries one or more citation spans (source + text),
// and low-confidence fields / source conflicts set the escalation flag.

const SOURCES = { PHONE: "Phone + IVR", PORTAL: "Payer Portal" };

// ---------------------------------------------------------------------------
// Corpora: transcript + optional portal snippet, with per-segment offsets
// ---------------------------------------------------------------------------

function phoneCorpus(cse) {
  const segments = [];
  let text = "";
  for (let i = 0; i < cse.transcript.length; i++) {
    const s = cse.transcript[i];
    const line = `${s.speaker}: ${s.text}`;
    const start = text.length;
    text += (text ? "\n" : "") + line;
    segments.push({ speaker: s.speaker, seg: i, start, end: text.length, body: s.text });
  }
  return { id: "phone", source: SOURCES.PHONE, text, segments };
}

function portalCorpus(cse) {
  if (!cse.portal) return null;
  return {
    id: "portal",
    source: SOURCES.PORTAL,
    text: cse.portal,
    segments: [{ speaker: "Payer Portal", seg: 0, start: 0, end: cse.portal.length, body: cse.portal }],
  };
}

function allMatches(re, text) {
  const out = [];
  const rx = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  let m;
  while ((m = rx.exec(text))) out.push(m);
  return out;
}

function locateSeg(corpus, offset) {
  for (const seg of corpus.segments) if (offset >= seg.start && offset < seg.end) return seg;
  return corpus.segments[corpus.segments.length - 1];
}

// Widen the matched phrase into a clean sentence-ish span within its segment.
function citationFor(corpus, m, matchStart) {
  const seg = locateSeg(corpus, matchStart);
  let s = matchStart;
  let e = matchStart + m[0].length;
  while (s > seg.start && e - s < 70 && !".\n:".includes(corpus.text[s - 1])) s--;
  while (e < seg.end && corpus.text[e] !== "." && corpus.text[e] !== "\n") e++;
  return {
    corpus: corpus.id,
    source: corpus.source,
    seg: seg.seg,
    bodyStart: s - seg.start,
    bodyEnd: e - seg.start,
    text: corpus.text.slice(s, e).trim(),
  };
}

function scan(corpora, patterns) {
  const candidates = [];
  for (const corpus of corpora) {
    for (const p of patterns) {
      for (const m of allMatches(p.re, corpus.text)) {
        if (!m[0].length) continue;
        candidates.push({ value: p.value(m), conf: p.conf, p, m, corpus, start: m.index });
      }
    }
  }
  return candidates;
}

// value -> list of citations, best confidence first, max 2 per corpus.
function bestByValue(candidates) {
  const groups = {};
  for (const c of candidates) {
    const k = String(c.value);
    (groups[k] = groups[k] || []).push(c);
  }
  const out = {};
  for (const k of Object.keys(groups)) {
    const byc = {};
    for (const c of groups[k]) (byc[c.corpus.id] = byc[c.corpus.id] || []).push(c);
    const kept = [];
    for (const id of Object.keys(byc)) {
      byc[id].sort((a, b) => b.conf - a.conf || a.start - b.start);
      kept.push(...byc[id].slice(0, 2));
    }
    out[k] = kept.map((c) => ({
      value: c.value,
      conf: c.conf,
      citation: citationFor(c.corpus, c.m, c.start),
    }));
  }
  return out;
}

function uniqueCitations(list) {
  const seen = new Set();
  const out = [];
  for (const c of list) {
    const k = c.source + "|" + c.text;
    if (!seen.has(k)) { seen.add(k); out.push(c); }
  }
  return out;
}

function firstSpan(corpora, re) {
  for (const corpus of corpora) {
    const ms = allMatches(re, corpus.text);
    if (ms.length) return { corpus, m: ms[0] };
  }
  return null;
}

const toTitle = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const pct = (x) => Math.round(x * 100);

// ---------------------------------------------------------------------------
// Extractors
// ---------------------------------------------------------------------------

const STATUS_PATTERNS = [
  { re: /\bstatus\s*:\s*(approved|denied|pending)/i, conf: 0.98, value: (m) => m[1].toLowerCase() },
  { re: /\bstatus[^.\n]{0,40}\b(approved|denied|pending)\b/i, conf: 0.98, value: (m) => m[1].toLowerCase() },
  { re: /\b(?:is|was|has been)\s+(approved|denied)\b/i, conf: 0.92, value: (m) => m[1].toLowerCase() },
  { re: /(?:was\s+)?not\s+(?:approved|granted)\b/i, conf: 0.9, value: () => "denied" },
];

const AUTH_PATTERNS = [
  {
    re: /\b(?:authorization|auth)\s+(?:number|#|id)\s+(?:is|reads?|will be)\s+([A-Za-z0-9#-]{4,})/i,
    conf: 0.98,
    kind: "issued",
    value: (m) => m[1],
  },
  {
    re: /\b(?:request|reference)\s*[:#]?\s*((?:AUTH-)?\d{5,})/i,
    conf: 0.6,
    kind: "reference",
    value: (m) => m[1],
  },
];

const REQUIRED_PATTERNS = [
  { re: /\bprior auth(?:orization)?[^.\n]{0,40}\b(?:is|remains)\s+required\b/i, conf: 0.98, value: () => true },
  { re: /\bprior auth(?:orization)?[^.\n]{0,60}required\b/i, conf: 0.9, value: () => true },
  { re: /\b(?:is|was)\s+not\s+required\b/i, conf: 0.95, value: () => false },
];

const DOC_ITEM = "(?:clinical|chart|progress|operative|surgical|prior)?\\s*(?:notes|documentation|labs?|imaging|treatment plan|referral|report)";
const MISSING_PATTERNS = [
  {
    re: new RegExp("(?:we(?:'re| are)?\\s+(?:still\\s+)?missing|we (?:still )?(?:need|require|haven'?t received)|awaiting)\\s+(?:the\\s+|your\\s+)?(" + DOC_ITEM + ")", "i"),
       conf: 0.97,
    value: (m) => m[1],
  },
    { re: new RegExp("\\bjust\\s+(?:the\\s+)?(" + DOC_ITEM + ")", "i"), conf: 0.8, value: (m) => m[1] },
    { re: /\bnothing\s+is\s+missing[^.\n]{0,40}/i, conf: 0.9, none: true, value: () => "<none>" },
  { re: /\bmissing documentation\s*:\s*(none|nothing)/i, conf: 0.95, none: true, value: () => "<none>" },
];

function extractStatus(corpora) {
  const byValue = bestByValue(scan(corpora, STATUS_PATTERNS));
  const values = Object.keys(byValue);
  if (!values.length) {
    return {
      key: "status", label: "Auth status", value: null, conf: 0,
      citations: [], conflict: false,
    };
  }
  const all = values.reduce((acc, v) => acc.concat(byValue[v]), []);
  const citations = uniqueCitations(all.map((x) => x.citation));
  if (values.length > 1) {
    return {
      key: "status", label: "Auth status", value: "conflict", conf: 0.45,
      citations, conflict: true,
      specs: values.map((v) => {
        const best = byValue[v][0];
        return { value: v, conf: best.conf, citation: best.citation };
      }),
    };
  }
  const best = byValue[values[0]];
  return {
    key: "status", label: "Auth status", value: values[0], conf: best[0].conf,
    citations,
  };
}

function extractAuthNumber(corpora, status) {
  const byValue = bestByValue(scan(corpora, AUTH_PATTERNS));
  // Prefer an issued number over the request reference.
  const issued = scan(corpora, AUTH_PATTERNS).find((c) => c.p.kind === "issued");
  if (issued) {
    const v = issued.value;
    const kept = byValue[String(v)] || [];
    return {
      key: "authNumber", label: "Auth number", value: v, conf: 0.98,
      citations: uniqueCitations(kept.map((x) => x.citation)),
    };
  }
  const values = Object.keys(byValue);
  if (!values.length) {
    return { key: "authNumber", label: "Auth number", value: null, conf: 0, citations: [] };
  }
  const kept = byValue[values[0]];
  let conf = kept[0].conf;
  const citations = uniqueCitations(kept.map((x) => x.citation));
  if (new Set(citations.map((c) => c.source)).size > 1) conf = Math.min(0.8, conf + 0.2);
  const note = status && status.value === "pending"
    ? "Reference number (request). Final auth number not assigned while status is pending."
    : "Reference number (request), not a confirmed authorization number.";
  return { key: "authNumber", label: "Auth number", value: values[0], conf, citations, note };
}

function extractRequired(corpora) {
  const byValue = bestByValue(scan(corpora, REQUIRED_PATTERNS));
  const values = Object.keys(byValue);
  if (!values.length) {
    return { key: "required", label: "Auth requirement", value: null, conf: 0, citations: [] };
  }
  const v = values[0]; // true / false
  const kept = byValue[v];
  return {
    key: "required",
    label: "Auth requirement",
    value: v === "true" ? "Required" : "Not required",
    conf: kept[0].conf,
    citations: uniqueCitations(kept.map((x) => x.citation)),
  };
}

function extractMissingDocs(corpora) {
  const candidates = scan(corpora, MISSING_PATTERNS);
  const docs = new Map();
  let witness = null;
  for (const c of candidates) {
    if (c.p.none) {
      if (!witness) witness = { text: c.m[0], citation: citationFor(c.corpus, c.m, c.start) };
      continue;
    }
    const name = toTitle(c.m[1].trim().replace(/\.$/, ""));
    if (!docs.has(name)) docs.set(name, { doc: name, citations: [], conf: c.conf });
    const ent = docs.get(name);
    if (c.conf > ent.conf) ent.conf = c.conf;
    const ci = citationFor(c.corpus, c.m, c.start);
    if (!ent.citations.some((x) => x.text === ci.text)) ent.citations.push(ci);
  }
  const list = [...docs.values()];
  if (list.length) {
    return {
      key: "missingDocs", label: "Missing documentation",
      value: list.map((d) => d.doc).join(", "), conf: Math.min(...list.map((d) => d.conf)),
      citations: uniqueCitations(list.flatMap((d) => d.citations)), docs: list,
    };
  }
  if (witness) {
    return {
      key: "missingDocs", label: "Missing documentation", value: "None", conf: 0.9,
      citations: [witness.citation], docs: [], witness: witness.citation,
    };
  }
  return { key: "missingDocs", label: "Missing documentation", value: null, conf: 0, citations: [], docs: [] };
}

function extractNextAction(status, missing, corpora) {
  if (status.conflict) {
    const peer = firstSpan(corpora, /request a peer review[^.\n]{0,24}/i);
    const citations = status.citations.slice(0, 2);
    if (peer) citations.push(citationFor(peer.corpus, peer.m, peer.m.index));
    return {
      key: "next", label: "Next steps",
      value: "Re-verify final status with payer; phone and portal disagree. If denial is confirmed, request a peer review.",
      conf: 0.8, citations: uniqueCitations(citations),
    };
  }
  if (missing.docs.length) {
    const rt = firstSpan(corpora, /review (?:takes|will take)[^.\n]{0,40}/i);
    const citations = [];
    if (rt) citations.push(citationFor(rt.corpus, rt.m, rt.m.index));
    citations.push(missing.docs[0].citations[0]);
    return {
      key: "next", label: "Next steps",
      value: `Submit ${missing.docs.map((d) => d.doc.toLowerCase()).join(" and ")} to payer; review takes about 48 hours`,
      conf: rt ? 0.92 : 0.85, citations: uniqueCitations(citations),
    };
  }
  if (status.value === "approved") {
    const act = firstSpan(corpora, /\bactive (?:through|until|for the next)[^.\n]{0,30}/i);
    const citations = status.citations.slice(0, 1);
    if (act) citations.push(citationFor(act.corpus, act.m, act.m.index));
    return {
      key: "next", label: "Next steps", value: "None. Auth approved and active.",
      conf: 0.95, citations: uniqueCitations(citations),
    };
  }
  if (status.value === "denied") {
    const reason = firstSpan(corpora, /(?:did not match|not (?:medically|clinically) (?:necessary|appropriate))[^.\n]{0,60}/i);
    const citations = status.citations.slice(0, 1);
    if (reason) citations.push(citationFor(reason.corpus, reason.m, reason.m.index));
    return {
      key: "next", label: "Next steps",
      value: "Review denial reason; request a peer review or appeal if the denial is incorrect.",
      conf: 0.85, citations: uniqueCitations(citations),
    };
  }
  return { key: "next", label: "Next steps", value: null, conf: 0, citations: [] };
}

// ---------------------------------------------------------------------------
// Packet assembly
// ---------------------------------------------------------------------------

function extractTried(cse, corpora, auth, portal) {
  const call = firstSpan(corpora, /(?:calling (?:to check|about|regarding)|checking)\s+prior auth(?:orization)?[^.\n]{0,90}/i);
  const citations = [];
  if (call) citations.push(citationFor(call.corpus, call.m, call.m.index));
  if (portal) {
    const upd = firstSpan(corpora, /last updated[^.\n]{0,24}/i);
    if (upd) citations.push(citationFor(upd.corpus, upd.m, upd.m.index));
  }
  const ref = auth ? ` (${auth.value})` : "";
  return {
    value: portal
      ? `Called payer and checked payer portal for status${ref}`
      : `Called payer for status check${ref}`,
    citations: uniqueCitations(citations),
  };
}

function buildPacket(cse) {
  const corpora = [phoneCorpus(cse)];
  const portal = portalCorpus(cse);
  if (portal) corpora.push(portal);

  const required = extractRequired(corpora);
  const status = extractStatus(corpora);
  const authNumber = extractAuthNumber(corpora, status);
  const missing = extractMissingDocs(corpora);
  const next = extractNextAction(status, missing, corpora);
  const fields = [required, status, authNumber, missing, next];

  const low = fields.filter((f) => f.conf < 0.7);
  const reasons = [];
  if (status.conflict) reasons.push("Conflicting status across sources (phone vs portal)");
  if (missing.docs.length) reasons.push("Missing documentation needs action before auth can advance");
  for (const f of low) reasons.push(`Low confidence "${f.label}" (${pct(f.conf)}%)`);

  const escalate = status.conflict || missing.docs.length > 0 || low.length > 0;
  const overall = fields.reduce((a, f) => a + f.conf, 0) / fields.length;

  const tried = extractTried(cse, corpora, authNumber, portal);
  const packet = {
    tried,
    captured: fields.map((f) => ({
      label: f.label,
      value: f.key === "status" && f.conflict ? "Denied vs Pending" : f.value,
      conf: f.conf,
    })),
    missing: status.conflict
      ? "Final status confirmation (phone and portal disagree)"
      : missing.docs.length
        ? missing.docs.map((d) => d.doc).join(", ")
        : "None confirmed",
    nextStep: next.value,
  };

  return {
    caseId: cse.id,
    title: cse.title,
    fields,
    status,
    missing,
    required,
    authNumber,
    next,
    overall,
    escalate,
    reasons,
    packet,
    corpora,
  };
}

// ---------------------------------------------------------------------------
// Rubric: a case passes only if every field is present, cited, and the
// escalation flag matches the expected outcome.
// ---------------------------------------------------------------------------

function evaluateCase(cse) {
  const pkt = buildPacket(cse);
  const checks = [];
  checks.push({ label: "Fields present", pass: pkt.fields.every((f) => f.value != null && f.value !== "") });
  checks.push({ label: "Every field cited", pass: pkt.fields.every((f) => f.citations.length > 0) });
  checks.push({ label: `Escalation ${cse.expectedEscalation ? "true" : "false"}`, pass: pkt.escalate === cse.expectedEscalation });
  if (cse.expectedStatus != null) {
    checks.push({ label: `Status ${cse.expectedStatus}`, pass: pkt.status.value === cse.expectedStatus });
  }
  if (cse.expectedConflict) {
    checks.push({ label: "Conflict flagged", pass: pkt.status.conflict === true });
    checks.push({
      label: "Both sources cited",
      pass: new Set(pkt.status.citations.map((c) => c.source)).size >= 2,
    });
  }
  if (cse.expectedMissingDocCount != null) {
    checks.push({ label: `Missing docs = ${cse.expectedMissingDocCount}`, pass: pkt.missing.docs.length === cse.expectedMissingDocCount });
  }
  const pass = checks.every((c) => c.pass);
  return {
    caseId: cse.id,
    title: cse.title,
    checks,
    pass,
    reason: pass
      ? cse.passReason
      : "FAIL: " + checks.filter((c) => !c.pass).map((c) => c.label).join("; "),
  };
}

function packetJSON(pkt) {
  const fieldObj = {};
  for (const f of pkt.fields) {
    fieldObj[f.key] = {
      value: f.value,
      confidence: pct(f.conf) + "%",
      sources: f.citations.map((c) => ({ source: c.source, span: c.text })),
    };
  }
  return JSON.stringify(
    {
      case: pkt.caseId,
      fields: fieldObj,
      missing_docs: pkt.missing.value,
      next_action: pkt.next.value,
      confidence: pct(pkt.overall) + "%",
      escalation: {
        flag: pkt.escalate,
        reasons: pkt.reasons,
        packet: {
          tried: pkt.packet.tried.value,
          captured: pkt.packet.captured.map((c) => `${c.label}: ${c.value}`),
          missing: pkt.packet.missing,
          next_step: pkt.packet.nextStep,
        },
      },
    },
    null,
    2
  );
}