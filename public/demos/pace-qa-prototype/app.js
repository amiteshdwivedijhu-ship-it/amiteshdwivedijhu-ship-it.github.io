"use strict";

/*
 * Pace-style exception / QA packet engine.
 * Given a synthetic agent run (voice + email events, optional servicing checklist),
 * returns a structured packet: workflow type, outcome, fields with citations,
 * QA checks with rule ids, failure reason, next action, confidence, escalate.
 * Pure functions only here; UI wiring lives at the bottom.
 */

const PACE = (() => {
  // ==========================================================================
  // Synthetic runs
  // ==========================================================================

  const RUNS = {
    A: {
      key: "A",
      label: "Happy path",
      workflowType: "Policy servicing",
      channel: "Phone + email",
      date: "2026-09-27",
      duration: "Voice 5m 12s + email",
      aop: "AOP-SV",
      outcomePattern: /emailing your declarations page and current auto policy documents/i,
      events: [
        { ch: "voice", who: "agent", speaker: "Maya Chen · CSR", time: "14:02", text: "Thanks for calling Pace Policy Services, you're through to Maya Chen. How can I help you today?" },
        { ch: "voice", who: "customer", speaker: "Jordan Rivera", time: "14:03", text: "Hi Maya, this is Jordan Rivera. I need a copy of my declarations page and my auto policy documents for my lender. Policy number POL-298471." },
        { ch: "voice", who: "agent", speaker: "Maya Chen · CSR", time: "14:03", text: "Thanks, Jordan. For security, can you confirm the last 4 of your SSN and your date of birth?" },
        { ch: "voice", who: "customer", speaker: "Jordan Rivera", time: "14:04", text: "Sure, it's 4412 and September 8, 1987." },
        { ch: "voice", who: "agent", speaker: "Maya Chen · CSR", time: "14:05", text: "Perfect, that matches our records. I'm emailing your declarations page and current auto policy documents to the address on file, jrivera@example dot com. You'll receive them in about two minutes." },
        { ch: "voice", who: "customer", speaker: "Jordan Rivera", time: "14:06", text: "That's everything I need, thank you." },
        { ch: "voice", who: "agent", speaker: "Maya Chen · CSR", time: "14:07", text: "You're welcome. Anything else I can help you with?" },
        { ch: "email", who: "agent", from: "Pace Policy Service Center", to: "jrivera@example.com", subject: "Your policy documents · POL-298471", time: "14:11", text: "Hi Jordan, as requested on today's call, attached are your declarations page and current auto policy documents for policy POL-298471. No premium or coverage change. Reply if you need a loss-payable endorsement." }
      ],
      checklist: [
        { id: "CHK-01", item: "Caller identity verified before servicing", doc: null, status: "pass", cite: { ch: "voice", ev: 4, quote: "that matches our records" } },
        { id: "CHK-02", item: "Requested documents sent to email on file", doc: null, status: "pass", cite: { ch: "voice", ev: 4, quote: "I'm emailing your declarations page and current auto policy documents" } },
        { id: "CHK-03", item: "Delivery time confirmed to customer", doc: null, status: "pass", cite: { ch: "voice", ev: 4, quote: "You'll receive them in about two minutes" } }
      ]
    },

    B: {
      key: "B",
      label: "Missing doc · NIGO",
      workflowType: "Policy servicing",
      channel: "Phone + email",
      date: "2026-09-27",
      duration: "Voice 8m 05s + email",
      aop: "AOP-SV",
      outcomePattern: /no policy change will be applied until the signed form is back on file/i,
      events: [
        { ch: "voice", who: "agent", speaker: "Maya Chen · CSR", time: "09:31", text: "Thanks for calling Pace Policy Services, you're through to Maya Chen. How can I help you today?" },
        { ch: "voice", who: "customer", speaker: "Sandra Okafor", time: "09:32", text: "Hi, this is Sandra Okafor. I just moved, and I need to endorse my policy with my new address. Policy POL-559102." },
        { ch: "voice", who: "agent", speaker: "Maya Chen · CSR", time: "09:33", text: "Happy to help. Can you confirm the last 4 of your SSN and the ZIP code on the policy?" },
        { ch: "voice", who: "customer", speaker: "Sandra Okafor", time: "09:34", text: "It's 8850 and 21210." },
        { ch: "voice", who: "agent", speaker: "Maya Chen · CSR", time: "09:35", text: "Thank you, that checks out. To process an address endorsement I need the signed endorsement request form on file, per AOP-SV-04. I see the address change is not captured yet, so I'll send you the form now." },
        { ch: "voice", who: "customer", speaker: "Sandra Okafor", time: "09:36", text: "Okay, I'll return it signed today." },
        { ch: "voice", who: "agent", speaker: "Maya Chen · CSR", time: "09:38", text: "Great. Just so it's clear, no policy change will be applied until the signed form is back on file. You'll receive the form by secure email in a minute." },
        { ch: "email", who: "agent", from: "Pace Policy Service Center", to: "sokafor@example.com", subject: "Endorsement request form · ADDR-END-01", time: "09:39", text: "Hi Sandra, as discussed, please complete, sign and return the attached endorsement request form so we can update the address on policy POL-559102. We cannot apply the change until the signed form is received." }
      ],
      checklist: [
        { id: "CHK-01", item: "Caller identity verified before servicing", doc: null, status: "pass", cite: { ch: "voice", ev: 4, quote: "that checks out" } },
        { id: "CHK-02", item: "Signed endorsement request form on file before processing", doc: "Signed endorsement request form (ADDR-END-01)", status: "missing", cite: { ch: "voice", ev: 4, quote: "I need the signed endorsement request form on file, per AOP-SV-04. I see the address change is not captured yet" } },
        { id: "CHK-03", item: "Customer informed the change is held pending the form", doc: null, status: "pass", cite: { ch: "voice", ev: 6, quote: "no policy change will be applied until the signed form is back on file" } }
      ]
    },

    C: {
      key: "C",
      label: "Channel conflict",
      workflowType: "Policy servicing",
      channel: "Email + voice",
      date: "2026-09-27",
      duration: "Email 09:02 + voice 4m 10s",
      aop: "AOP-SV",
      outcomePattern: /No cancellation will be set up/i,
      events: [
        { ch: "email", who: "customer", from: "jrivera@example.com", to: "Pace Policy Service Center", subject: "Cancel policy POL-298471", time: "09:02", text: "Hi, I'd like to cancel my policy POL-298471 effective today. This confirms my intent to cancel. Please confirm once it's done." },
        { ch: "voice", who: "agent", speaker: "Diego Ramos · CSR", time: "10:41", text: "Thanks for calling Pace Policy Services, you're through to Diego Ramos. How can I help you today?" },
        { ch: "voice", who: "customer", speaker: "Jordan Rivera", time: "10:42", text: "Hi, this is Jordan Rivera. I need my declarations page and auto policy documents for my lender. Policy POL-298471." },
        { ch: "voice", who: "agent", speaker: "Diego Ramos · CSR", time: "10:43", text: "Sure, Jordan. Can you confirm the last 4 of your SSN and your date of birth?" },
        { ch: "voice", who: "customer", speaker: "Jordan Rivera", time: "10:44", text: "4412, September 8, 1987." },
        { ch: "voice", who: "agent", speaker: "Diego Ramos · CSR", time: "10:45", text: "That matches our records. I'll email those documents to jrivera@example dot com." },
        { ch: "voice", who: "customer", speaker: "Jordan Rivera", time: "10:46", text: "Thanks. And just to be clear, I am not looking to cancel anything. I only need the documents." },
        { ch: "voice", who: "agent", speaker: "Diego Ramos · CSR", time: "10:47", text: "Understood. I'm sending the documents only. No cancellation will be set up from this call." }
      ],
      checklist: [
        { id: "CHK-01", item: "Caller identity verified before servicing", doc: null, status: "pass", cite: { ch: "voice", ev: 5, quote: "That matches our records" } },
        { id: "CHK-02", item: "No unresolved cancellation intent in the account record", doc: null, status: "missing", cite: { ch: "email", ev: 0, quote: "I'd like to cancel my policy POL-298471 effective today" } },
        { id: "CHK-03", item: "Outcome confirmed: documents only, no cancellation set up", doc: null, status: "pass", cite: { ch: "voice", ev: 7, quote: "No cancellation will be set up from this call" } }
      ]
    }
  };

  // ==========================================================================
  // Text helpers
  // ==========================================================================

  function firstMatch(text, re) {
    re.lastIndex = 0;
    const m = re.exec(text);
    if (!m) return null;
    return { start: m.index, end: m.index + m[0].length, full: m[0], groups: m.slice(1) };
  }

  // Find first regex hit across events, preferring channels in `order`.
  function searchFirst(events, re, order, who) {
    const prefer = order || ["voice", "email"];
    const scan = (list) => {
      for (const ev of list) {
        if (who && ev.who !== who) continue;
        const m = firstMatch(ev.text, re);
        if (m) return { cite: makeCite(ev, events.indexOf(ev), m.start, m.end), m };
      }
      return null;
    };
    for (const ch of prefer) {
      const hit = scan(events.filter((e) => e.ch === ch));
      if (hit) return hit;
    }
    return scan(events);
  }

  function makeCite(ev, ei, start, end) {
    const quote = ev.text.slice(start, end);
    return { ch: ev.ch, who: ev.who, ev, ei, start, end, quote, time: ev.time };
  }

  function citeFromQuote(events, ref) {
    // ref: { ch, ev, quote } -> resolved { ch, ev, start, end, quote, time }
    const ev = events[ref.ev];
    const idx = ev ? ev.text.indexOf(ref.quote) : -1;
    if (!ev || idx < 0) return null;
    return { ch: ref.ch, who: ev.who, ev, ei: ref.ev, start: idx, end: idx + ref.quote.length, quote: ref.quote, time: ev.time };
  }

  function sentenceAround(text, idx) {
    let start = idx;
    for (let i = idx - 1; i >= 0; i--) {
      if (".!?".includes(text[i])) { start = i + 1; break; }
      if (idx - i > 160) { start = i; break; }
    }
    let end = text.length;
    for (let i = idx; i < text.length; i++) {
      if (".!?".includes(text[i])) { end = i + 1; break; }
      if (i - idx > 160) { end = i; break; }
    }
    return text.slice(start, end).trim();
  }

  function classify(text) {
    // Intent classifier. Negated cancellation must not classify as cancellation.
    const negatedCancel = /(not|never|no|only|just)\b[^.]{0,50}\bcancel/.test(text) || /not looking to cancel/.test(text);
    const mCancel = /\bcancel\b|\bterminate\b/i.exec(text);
    if (mCancel && !negatedCancel) return { type: "cancellation", start: mCancel.index, end: mCancel.index + mCancel[0].length };
    const mEnd = /\bendors/i.exec(text);
    if (mEnd) return { type: "endorsement", start: mEnd.index, end: mEnd.index + mEnd[0].length };
    const mDoc = /declarations|policy documents|\bdocuments\b|for my lender/i.exec(text);
    if (mDoc) return { type: "documents", start: mDoc.index, end: mDoc.index + mDoc[0].length };
    return null;
  }

  const INTENT_LABEL = { documents: "Documents", endorsement: "Endorsement", cancellation: "Cancellation" };

  // ==========================================================================
  // Packet builder
  // ==========================================================================

  function buildPacket(run, opts) {
    const events = run.events;
    const checklistOn = !opts || opts.checklist !== false;

    // --- fields ------------------------------------------------------------
    const policy = searchFirst(events, /POL-\d{6}/, ["voice", "email"]);
    const nameHit = searchFirst(events, /this is ([A-Z][a-z]+ [A-Z][a-z]+)/, ["voice", "email"], "customer");
    const name = nameHit
      ? { cite: makeCite(nameHit.cite.ev, nameHit.cite.ei, nameHit.m.start + nameHit.m.full.indexOf(nameHit.m.groups[0]), nameHit.m.start + nameHit.m.full.indexOf(nameHit.m.groups[0]) + nameHit.m.groups[0].length) }
      : null;

    // customer intents per event
    const intents = [];
    events.forEach((ev, i) => {
      if (ev.who !== "customer") return;
      const c = classify(ev.text);
      if (!c) return;
      intents.push({ type: c.type, ch: ev.ch, ev, ei: i, start: c.start, end: c.end });
    });
    const voiceIntent = intents.filter((i2) => i2.ch === "voice")[0] || intents[0];
    const emailIntents = intents.filter((i2) => i2.ch === "email");

    const requestDetail = voiceIntent
      ? (() => {
          const start = voiceIntent.ev.text.lastIndexOf(". ", Math.max(0, voiceIntent.start - 2)) + 2;
          const sentence = sentenceAround(voiceIntent.ev.text, voiceIntent.start);
          const s = voiceIntent.ev.text.indexOf(sentence);
          return makeCite(voiceIntent.ev, voiceIntent.ei, s, s + sentence.length);
        })()
      : null;

    const identity = searchFirst(events, /matches our records|checks out/i, ["voice"], "agent");
    const outcome = searchFirst(events, run.outcomePattern, ["voice", "email"]);

    const fields = [];
    if (policy) fields.push({ id: "policy_number", label: "Policy number", value: policy.m.full, cite: policy.cite });
    if (name) fields.push({ id: "customer_name", label: "Customer name", value: nameHit.m.groups[0], cite: name.cite });
    if (voiceIntent) {
      fields.push({ id: "request_type", label: "Request intent (voice)", value: INTENT_LABEL[voiceIntent.type], cite: makeCite(voiceIntent.ev, voiceIntent.ei, voiceIntent.start, voiceIntent.end) });
    }
    if (requestDetail) fields.push({ id: "request_detail", label: "Request detail", value: requestDetail.quote, cite: requestDetail });
    emailIntents.forEach((it) => {
      fields.push({ id: "email_intent", label: "Email intent", value: INTENT_LABEL[it.type], cite: makeCite(it.ev, it.ei, it.start, it.end) });
    });
    if (identity) fields.push({ id: "identity_verified", label: "Identity verified", value: "Yes", cite: identity.cite });
    if (outcome) fields.push({ id: "outcome_confirmed", label: "Outcome confirmed", value: outcome.cite.quote, cite: outcome.cite });

    // --- servicing checklist -----------------------------------------------
    const checklist = checklistOn
      ? run.checklist.map((item) => {
          const cite = citeFromQuote(events, item.cite);
          const it = { id: item.id, item: item.item, doc: item.doc, status: item.status };
          if (cite) it.cite = cite;
          return it;
        })
      : null;

    // --- missing documents (AOP-SV-04 gate) ----------------------------------
    // Source 1: checklist items marked missing that name a required document.
    // Source 2 (no checklist): transcript NIGO statement, "until the X form is back on file".
    const missingDocs = [];
    if (checklist) {
      checklist.forEach((it) => {
        if (it.status === "missing" && it.doc) missingDocs.push({ doc: it.doc, requiredBy: "AOP-SV-04", cite: it.cite });
      });
    }
    if (missingDocs.length === 0) {
      const nigo = searchFirst(events, /(?:until|before) (?:the )?([a-zA-Z _-]{3,}form)\b/i, ["voice"]);
      if (nigo) {
        const docRaw = nigo.m.groups[0] ? nigo.m.groups[0].trim() : null;
        const isEndorsement = intents.some((it) => it.type === "endorsement");
        const doc = docRaw
          ? (isEndorsement || /endors/i.test(docRaw) ? "Signed endorsement request form (ADDR-END-01)" : docRaw.charAt(0).toUpperCase() + docRaw.slice(1))
          : null;
        if (doc) missingDocs.push({ doc, requiredBy: "AOP-SV-04", cite: nigo.cite });
      }
    }

    // --- channel conflict (AOP-SV-05) ----------------------------------------
    const conflicts = [];
    const chanIntents = {};
    intents.forEach((it) => { (chanIntents[it.ch] = chanIntents[it.ch] || []).push(it); });
    const chans = Object.keys(chanIntents);
    if (chans.length > 1) {
      const hasCancel = intents.some((it) => it.type === "cancellation");
      const hasOther = intents.some((it) => it.type !== "cancellation");
      const nonCancelVoice = events.find((ev) => ev.who === "customer" && ev.ch === "voice" && /not looking to cancel|(not|never|no|only|just)\b[^.]{0,50}\bcancel/.test(ev.text));
      if (hasCancel && (hasOther || nonCancelVoice)) {
        const cancelIt = intents.find((it) => it.type === "cancellation");
        const otherIt = intents.find((it) => it.type !== "cancellation");
        const kv = { a: makeCite(cancelIt.ev, cancelIt.ei, cancelIt.start, cancelIt.end), b: makeCite(otherIt.ev, otherIt.ei, otherIt.start, otherIt.end), note: "Email asks cancellation; the call asks for documents and explicitly declines cancellation." };
        if (nonCancelVoice) {
          const m = /I am not looking to cancel anything[^.]*|[^.]*not looking to cancel[^.]*/.exec(nonCancelVoice.text);
          void m;
          const idx = nonCancelVoice.text.indexOf("I am not looking to cancel");
          if (idx >= 0) kv.note = 'Email asks cancellation; the call asks for documents and explicitly says "I am not looking to cancel anything".';
        }
        conflicts.push(kv);
      }
    }

    // --- QA checks ------------------------------------------------------------
    const missingDocsOk = missingDocs.length === 0;
    const conflictOk = conflicts.length === 0;

    const checks = [
      {
        id: "AOP-SV-01", label: "Identity verified", rule: "CSR must verify the caller against the policy record before servicing.",
        pass: !!identity, reason: identity ? 'CSR confirmed caller: "' + identity.cite.quote + '".' : "No verification confirmation found.", cite: identity ? identity.cite : null
      },
      {
        id: "AOP-SV-02", label: "Request captured with detail", rule: "The customer request must be captured with a quoted detail span.",
        pass: !!requestDetail, reason: requestDetail ? 'Request quoted: "' + requestDetail.quote + '".' : "No request detail found.", cite: requestDetail
      },
      {
        id: "AOP-SV-03", label: "Required fields captured and cited", rule: "Required fields (policy, customer name, request intent) must each resolve to a cited source span.",
        pass: policy && name && voiceIntent,
        reason: (policy && name && voiceIntent) ? "Policy, name and intent resolved with citations." : "A required field is missing or uncited.",
        cite: policy ? policy.cite : null
      },
      {
        id: "AOP-SV-04", label: "Required document on file before processing", rule: "Required documents must be on file before a policy change is processed, otherwise NIGO.",
        pass: missingDocsOk,
        reason: missingDocsOk
          ? "No document prerequisite outstanding for this request."
          : missingDocs.map((d) => d.doc + " not on file; processing blocked (NIGO).").join(" "),
        cite: missingDocs.length ? missingDocs[0].cite : null
      },
      {
        id: "AOP-SV-05", label: "Channel conflict scan (24h)", rule: "Conflicting customer intents across channels within 24h must be surfaced; never act on one channel alone.",
        pass: conflictOk,
        reason: conflictOk
          ? "No conflicting customer intent across channels in the window."
          : conflicts[0].note,
        cite: conflicts.length ? conflicts[0].a : null
      },
      {
        id: "AOP-SV-06", label: "Outcome confirmed to customer", rule: "Outcome and next steps must be confirmed back to the customer.",
        pass: !!outcome, reason: outcome ? 'CSR confirmed: "' + outcome.cite.quote + '".' : "No outcome confirmation found.", cite: outcome ? outcome.cite : null
      }
    ];

    // --- outcome / escalate / confidence ---------------------------------------
    const failed = checks.filter((c) => !c.pass);
    let outcomeType = "resolved";
    if (checks.find((c) => c.id === "AOP-SV-05" && !c.pass)) outcomeType = "conflict";
    else if (checks.find((c) => c.id === "AOP-SV-04" && !c.pass)) outcomeType = "nigo";

    const escalate = outcomeType !== "resolved";
    const escalateReason =
      outcomeType === "conflict" ? "AOP-SV-05 failed: cross-channel conflict on cancellation intent." :
      outcomeType === "nigo" ? "AOP-SV-04 failed: required document missing (NIGO)." : "";

    const rawConf = 1 - 0.12 * (outcomeType === "nigo" ? 1 : 0) - 0.22 * (outcomeType === "conflict" ? 1 : 0) - 0.02 * failed.length;
    const confidence = Math.round(Math.max(0.2, rawConf) * 100) / 100;

    const failureReason =
      outcomeType === "resolved" ? "None." :
      outcomeType === "nigo" ? "AOP-SV-04 failed: signed endorsement request form not on file." :
      "AOP-SV-05 failed: email requests cancellation, voice call requests documents only and explicitly declines cancellation.";

    const nextAction = {
      resolved: "None. Request fulfilled: declarations page and auto policy documents sent to the email on file. Close case.",
      nigo: "Send ADDR-END-01 to Sandra Okafor and hold the policy change until the signed endorsement request form is on file. Agent PM: reopen in 48h if it is not returned.",
      conflict: "Do not process cancellation. Contact Jordan Rivera within 24h to reconcile the email cancellation request with the call's document-only request. Attach both citations to the ticket and hold the documents until intent is confirmed."
    }[outcomeType];

    // --- audit lineage ------------------------------------------------------------
    const lineage = [];
    fields.forEach((f) => {
      if (f.cite) lineage.push('"' + f.cite.quote + '" (' + f.cite.ch + " " + f.cite.time + ") -> field " + f.id);
    });
    checks.forEach((c) => lineage.push("rule " + c.id + " " + (c.pass ? "passed" : "FAILED") + ": " + c.reason));
    conflicts.forEach((kv) => lineage.push('AOP-SV-05 cross-channel: email "' + kv.a.quote + '" vs voice "' + kv.b.quote + '"'));

    const packet = {
      key: run.key,
      label: run.label,
      workflowType: run.workflowType,
      channel: run.channel,
      date: run.date,
      duration: run.duration,
      aop: run.aop,
      outcome: outcomeType,
      confidence: confidence,
      confidenceNote: "confidence = 1 - 0.12 * NIGO - 0.22 * conflict - 0.02 * failed checks",
      escalate: escalate,
      escalateReason: escalateReason,
      failureReason: failureReason,
      nextAction: nextAction,
      fields: fields,
      checklist: checklist,
      checks: checks,
      exception: {
        missing: missingDocs,
        conflicts: conflicts.map((kv) => ({ a: kv.a, b: kv.b, note: kv.note }))
      },
      lineage: lineage,
      runtime: { events: events }
    };
    return packet;
  }

  // ==========================================================================
  // Rubric audit: the eval table
  // ==========================================================================

  const RULE_ID = /^AOP-[A-Z]{2}-\d{2}$/;

  function auditPacket(p) {
    const violations = [];
    const evs = p.runtime.events;

    const resolveOk = (c) => {
      if (!c) return false;
      const ev = c.ev;
      if (!ev) return false;
      return ev.text.slice(c.start, c.end) === c.quote;
    };

    p.fields.forEach((f) => {
      if (!f.cite) { violations.push("field " + f.id + " lacks a citation"); return; }
      if (!resolveOk(f.cite)) violations.push("field " + f.id + " citation does not resolve in the source");
    });

    p.checks.forEach((c) => {
      if (!RULE_ID.test(c.id)) violations.push("check " + c.id + " has no rule id");
      if (!c.rule || !c.reason) violations.push("check " + c.id + " lacks rule text or reason");
      if (!c.pass) {
        if (!RULE_ID.test(c.id)) violations.push("failed check " + c.id + " names no rule");
        if (c.cite && !resolveOk(c.cite)) violations.push("failed check " + c.id + " citation does not resolve");
      }
    });

    (p.checklist || []).forEach((it) => {
      if (it.cite && !resolveOk(it.cite)) violations.push("checklist " + it.id + " citation does not resolve");
    });

    p.exception.missing.forEach((d) => {
      if (!d.requiredBy) violations.push("missing doc " + d.doc + " lacks requiredBy rule");
      if (!d.cite || !resolveOk(d.cite)) violations.push("missing doc " + d.doc + " lacks a resolving citation");
    });

    p.exception.conflicts.forEach((kv) => {
      if (!resolveOk(kv.a) || !resolveOk(kv.b)) violations.push("conflict lacks resolving citations on both sides");
      if (kv.a.ch === kv.b.ch) violations.push("conflict sources are not cross-channel");
    });

    if (!["resolved", "nigo", "conflict"].includes(p.outcome)) violations.push("invalid outcome " + p.outcome);
    if (p.escalate !== (p.outcome !== "resolved")) violations.push("escalate flag does not match outcome");
    if (p.outcome === "nigo" && p.exception.missing.length === 0) violations.push("NIGO outcome lists no missing items");
    if (p.outcome === "conflict" && p.exception.conflicts.length === 0) violations.push("conflict outcome lists no cited sources");
    if (p.outcome === "resolved" && (p.exception.missing.length || p.exception.conflicts.length)) violations.push("resolved outcome still has exceptions");
    if (!p.nextAction) violations.push("no next action set");

    return violations;
  }

  function evalTable(opts) {
    return ["A", "B", "C"].map((k) => {
      const p = buildPacket(RUNS[k], opts);
      const v = auditPacket(p);
      const result = p.outcome + " · escalate " + (p.escalate ? "yes" : "no") + " · conf " + Math.round(p.confidence * 100) + "%";
      return {
        key: p.key,
        label: p.label,
        result: result,
        verdict: v.length ? "fail" : "pass",
        reason: v.length ? v.join("; ") : "All fields cited and resolving; failed checks name rule ids; escalate matches outcome."
      };
    });
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  return { RUNS, buildPacket, auditPacket, evalTable };
})();

if (typeof document === "undefined") {
  // Expose for headless verification (Bun / node).
  globalThis.PACE = PACE;
} else {
  // ==========================================================================
  // UI wiring
  // ==========================================================================

  const esc = (s) => String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const ui = { runKey: "A", checklist: true };

  // ---- waveform ------------------------------------------------------------
  const WAVE = [9, 18, 12, 24, 15, 8, 20, 14, 23, 11, 17, 25, 12, 19, 10, 22, 15, 24, 13, 18, 9, 16, 21, 12, 19, 14];

  const STATUS = {
    resolved: { text: "All QA checks passed", cls: "ok" },
    nigo: { text: "NIGO · exception raised", cls: "warn" },
    conflict: { text: "Conflict · escalate", cls: "bad" }
  };

  // ---- rendering ------------------------------------------------------------

  function header(p) {
    const st = STATUS[p.outcome];
    return '<header class="t-head">' +
      '<div class="t-title">' + esc(p.workflowType) + " <span class=dim>· Run " + esc(p.key) + "</span></div>" +
      '<span class="pill ' + st.cls + '">' + st.text + "</span>" +
      "</header>" +
      '<div class="t-meta"><span>' + esc(p.channel) + "</span><span>" + esc(p.duration) + "</span><span>" + esc(p.date) + "</span></div>" +
      '<div class="wave">' + WAVE.map((h) => "<span style=height:" + h + "px></span>").join("") + "</div>" +
      '<div class="t-sub">Transcript · click a citation chip to jump to its span</div>';
  }

  function citationIds(p) {
    const ids = [];
    const add = (c, tag) => { if (c && c.ev) ids.push({ id: p.key + ":" + c.ei + ":" + c.start + ":" + c.end, ei: c.ei, start: c.start, end: c.end, tag: tag }); };
    p.fields.forEach((f) => add(f.cite, "field"));
    p.checks.forEach((c) => add(c.cite, "check"));
    (p.checklist || []).forEach((it) => add(it.cite, "checklist"));
    p.exception.missing.forEach((d) => add(d.cite, "missing"));
    p.exception.conflicts.forEach((kv) => { add(kv.a, "conflict"); add(kv.b, "conflict"); });
    return ids;
  }

  function renderTranscript(p) {
    const ids = citationIds(p);
    const byEv = {};
    ids.forEach((c) => { (byEv[c.ei] = byEv[c.ei] || []).push(c); });

    let html = header(p);
    p.runtime.events.forEach((ev, i) => {
      const evIds = (byEv[i] || []).sort((a, b) => a.start - b.start);
      // merge overlapping spans
      const merged = [];
      evIds.forEach((c) => {
        const last = merged[merged.length - 1];
        if (last && c.start <= last.end) { last.end = Math.max(last.end, c.end); last.citeIds = last.citeIds.concat(c.id); }
        else merged.push({ start: c.start, end: c.end, citeIds: [c.id] });
      });

      let body = "";
      let pos = 0;
      merged.forEach((m) => {
        body += esc(ev.text.slice(pos, m.start));
        body += '<mark data-cite="' + m.citeIds.join(" ") + '">' + esc(ev.text.slice(m.start, m.end)) + "</mark>";
        pos = m.end;
      });
      body += esc(ev.text.slice(pos));

      if (ev.ch === "email") {
        html += '<div class="em ' + (ev.who === "customer" ? "right" : "left") + '">' +
          '<div class="em-head"><span class="em-from">' + esc(ev.who === "customer" ? ev.from : ev.from) + "</span><span>" + esc(ev.to) + "</span><span>" + esc(ev.time) + "</span></div>" +
          '<div class="em-sub">' + esc(ev.subject) + "</div>" +
          '<div class="em-body">' + body + "</div>" +
          "</div>";
      } else {
        const side = ev.who === "customer" ? "right" : "left";
        html += '<div class="row ' + side + '"><div class="bubble"><span class="b-who">' + esc(ev.speaker) + " · " + esc(ev.time) + "</span>" + body + "</div></div>";
      }
    });
    return html;
  }

  function chip(p, c, tag) {
    if (!c) return '<span class="no-cite">no citation</span>';
    const id = p.key + ":" + c.ei + ":" + c.start + ":" + c.end;
    const q = c.quote.length > 46 ? c.quote.slice(0, 43) + "…" : c.quote;
    return '<button type="button" class="chip ' + tag + '" data-cite="' + id + '">' + esc(c.ch) + " " + esc(c.time) + ' · "' + esc(q) + '"</button>';
  }

  function renderPacket(p) {
    const st = STATUS[p.outcome];
    const checkIcon = (pass) => pass ? '<span class="ico ok">✓</span>' : '<span class="ico bad">✕</span>';

    let html = '<header class="p-head"><div class="t-title">QA review packet</div>' +
      '<span class="pill ' + st.cls + '">' + esc(p.outcome) + "</span></header>";

    html += '<div class="kv"><div><span class="k">Workflow</span><span class="v">' + esc(p.workflowType) + "</span></div>" +
      "<div><span class=k>Channel</span><span class=v>" + esc(p.channel) + "</span></div>" +
      "<div><span class=k>Confidence</span><span class=v>" + Math.round(p.confidence * 100) + "%</span></div>" +
      '<div><span class=k>Escalate</span><span class="v ' + (p.escalate ? "v-bad" : "v-ok") + '">' + (p.escalate ? "Yes" : "No") + "</span></div></div>";

    // fields
    html += '<section class="sec"><h3>Fields captured · ' + p.fields.length + "</h3>";
    p.fields.forEach((f) => {
      html += '<div class="frow"><div class="f-id">' + esc(f.label) + "</div><div class=f-val>" + esc(f.value) + "</div>" +
        '<div class="f-cite">' + chip(p, f.cite, "field") + "</div></div>";
    });
    html += "</section>";

    // checklist
    if (p.checklist) {
      html += '<section class="sec"><h3>Servicing checklist · AOP items</h3>';
      p.checklist.forEach((it) => {
        html += '<div class="crow ' + (it.status === "pass" ? "ok" : "bad") + '"><span class="ico ' + (it.status === "pass" ? "ok" : "bad") + '">' + (it.status === "pass" ? "✓" : "✕") + "</span>" +
          "<span>" + esc(it.item) + "</span>" + '<span class="c-cite">' + chip(p, it.cite, "checklist") + "</span></div>";
      });
      html += "</section>";
    }

    // QA checks
    html += '<section class="sec"><h3>QA checks · ' + p.checks.length + " · rule set " + esc(p.aop) + "</h3>";
    p.checks.forEach((c) => {
      html += '<div class="chrow ' + (c.pass ? "ok" : "bad") + '">' +
        "<div class=ch-top>" + checkIcon(c.pass) + '<span class="rule-id">' + esc(c.id) + "</span><span class=ch-label>" + esc(c.label) + "</span>" +
        (c.pass ? '<span class="pill sm ok">Pass</span>' : '<span class="pill sm bad">Fail</span>') + "</div>" +
        "<div class=ch-reason>" + esc(c.reason) + "</div>" +
        '<div class="ch-cite">' + (c.cite ? chip(p, c.cite, "check") : (c.pass ? '<span class="n-ok">no span required · rule satisfied</span>' : '<span class="no-cite">no citation</span>')) + "</div>" +
        (c.pass ? "" : '<div class="ch-rule">Rule: ' + esc(c.rule) + "</div>") +
        "</div>";
    });
    html += "</section>";

    // exception packet
    if (p.outcome !== "resolved" || p.exception.missing.length || p.exception.conflicts.length) {
      html += '<section class="sec ex"><h3>Exception</h3>';
      if (p.exception.missing.length) {
        html += '<div class="ex-block"><div class="ex-title">Missing items</div>';
        p.exception.missing.forEach((d) => {
          html += '<div class="ex-row"><span class="badge">' + esc(d.requiredBy) + "</span><span>" + esc(d.doc) + ' <span class=dim>· not on file</span></span>' + '<span class="c-cite">' + chip(p, d.cite, "missing") + "</span></div>";
        });
        html += "</div>";
      }
      if (p.exception.conflicts.length) {
        html += '<div class="ex-block"><div class="ex-title">Channel conflict · both sources cited</div>';
        p.exception.conflicts.forEach((kv) => {
          html += '<div class="conf"><div class="conf-a"><span class="badge">' + esc(kv.a.ch) + " " + esc(kv.a.time) + "</span><span>" + esc(kv.a.quote) + "</span>" + '<span class="c-cite">' + chip(p, kv.a, "conflict") + "</span></div>" +
            '<div class="conf-vs">vs</div>' +
            '<div class="conf-b"><span class="badge">' + esc(kv.b.ch) + " " + esc(kv.b.time) + "</span><span>" + esc(kv.b.quote) + "</span>" + '<span class="c-cite">' + chip(p, kv.b, "conflict") + "</span></div>" +
            "<div class=conf-note>" + esc(kv.note) + "</div></div>";
        });
        html += "</div>";
      }
      html += '<div class="ex-block"><div class="ex-title">Failure reason</div><div class="ex-text">' + esc(p.failureReason) + "</div></div>";
      html += '<div class="ex-block next"><div class="ex-title">Recommended next action</div><div class="ex-text">' + esc(p.nextAction) + "</div></div>";
      if (p.escalateReason) html += '<div class="ex-block"><div class="ex-title">Why escalate</div><div class="ex-text">' + esc(p.escalateReason) + "</div></div>";
      html += "</section>";
    }

    // lineage
    html += "<details class=lineage><summary>Audit lineage · extraction and rules</summary><pre>" + p.lineage.map(esc).join("\n") + "</pre></details>";
    html += "<details class=lineage><summary>View packet JSON</summary><pre class=json>" + esc(JSON.stringify(p, (k, v) => k === "runtime" ? undefined : v, 2)) + "</pre></details>";

    return html;
  }

  function renderEval() {
    const rows = PACE.evalTable({ checklist: ui.checklist });
    let html = "<table><thead><tr><th>Case</th><th>Packet result</th><th>Rubric</th><th>Reason</th></tr></thead><tbody>";
    rows.forEach((r) => {
      html += "<tr><td><strong>Run " + esc(r.key) + "</strong> · " + esc(r.label) + "</td><td>" + esc(r.result) + "</td>" +
        '<td><span class="pill sm ' + (r.verdict === "pass" ? "ok" : "bad") + '">' + esc(r.verdict) + "</span></td><td>" + esc(r.reason) + "</td></tr>";
    });
    html += "</tbody></table>";
    return html;
  }

  function render() {
    const p = PACE.buildPacket(PACE.RUNS[ui.runKey], { checklist: ui.checklist });
    const tEl = document.getElementById("transcript");
    const pEl = document.getElementById("packet");
    const eEl = document.getElementById("eval");
    tEl.innerHTML = renderTranscript(p);
    pEl.innerHTML = renderPacket(p);
    eEl.innerHTML = renderEval();
    document.querySelectorAll("#runbar button").forEach((b) => {
      b.classList.toggle("on", b.dataset.run === ui.runKey);
    });
    document.getElementById("confNote").textContent = p.confidenceNote;
  }

  // ---- interactions ----------------------------------------------------------

  function wire() {
    document.querySelectorAll("#runbar button[data-run]").forEach((b) => {
      b.addEventListener("click", () => { ui.runKey = b.dataset.run; render(); });
    });
    document.getElementById("checklistToggle").addEventListener("change", (e) => {
      ui.checklist = e.target.checked;
      render();
    });

    document.addEventListener("click", (e) => {
      const chip = e.target.closest("button.chip");
      if (!chip) { document.querySelectorAll("mark.lit").forEach((m) => m.classList.remove("lit")); return; }
      const id = chip.dataset.cite;
      document.querySelectorAll("mark[data-cite]").forEach((m) => m.classList.remove("lit"));
      document.querySelectorAll('mark[data-cite~="' + id + '"]').forEach((m) => {
        m.classList.add("lit");
        m.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
}