"use strict";
/*
 * Synthetic on-device agent runs. Three runs, all generated (no live device,
 * no signed-in LEAP / Playground / Apollo, no customer data).
 *
 * Each run is a tool-call trace with per-call latency, retrieved passages,
 * and the assistant's final claims. Claims are the unit of groundedness:
 * every claim either carries a passage span (cite) or does not (uncited).
 */

const LIQUID_RUNS = {
  A: {
    key: "A",
    label: "Happy path",
    task: "Summarize today's incidents and post a status follow-up",
    selector: "on-device · Edge SDK · Hermes harness",
    model: "LFM2.5-2.6B",
    device: "iPhone 15 · Neural Engine",
    budgetMs: 1500,
    wallMs: 1830,
    latencySamples: [
      812, 1024, 1188, 941, 1302, 1055, 892, 1124, 1240, 971, 1368, 1002, 1154, 1287
    ],
    trace: [
      { id: "t1", tool: "get_incidents", args: { date: "2026-09-27" }, ms: 812, status: "ok", out: "3 incidents returned (INC-4410 SEV-2, INC-4419 SEV-3, INC-4424 SEV-3)" },
      { id: "t2", tool: "search_kb", args: { q: "SEV-2 follow-up runbook" }, ms: 941, status: "ok", out: "2 passages · kb:runbook-sev2 · kb:status-format" },
      { id: "t3", tool: "post_status", args: { incident: "INC-4410", text: "SEV-2 resolved; follow-up posted per runbook" }, ms: 1002, status: "ok", out: "201 created · status-4410" }
    ],
    passages: [
      {
        id: "P1",
        source: "kb:runbook-sev2 · §3.2",
        text: "For a resolved SEV-2, close with a [status follow-up] within [24 hours] of mitigation. The follow-up must name the [incident id] and the [root cause class]."
      },
      {
        id: "P2",
        source: "kb:status-format · §1",
        text: "Status entries follow the template [Impact] / [Mitigation] / [Next steps]. Each entry [links the incident id] it refers to."
      }
    ],
    claims: [
          { id: "c1", text: "Incident INC-4410 (SEV-2) was mitigated and we closed it with a status follow-up.", cite: ["P1:35-51"] },
    { id: "c2", text: "The follow-up is within the 24-hour window required by the runbook.", cite: ["P1:59-67"] },
    { id: "c3", text: "The entry names the incident id and the root cause class.", cite: ["P1:111-147"] },
    { id: "c4", text: "Impact, mitigation and next steps are in the template order from the status format.", cite: ["P2:35-67"] }
    ],
    errors: []
  },

  B: {
    key: "B",
    label: "Latency over budget",
    task: "Summarize today's incidents and post a status follow-up",
    selector: "on-device · Edge SDK · Hermes harness",
    model: "LFM2.5-2.6B",
    device: "iPhone 15 · Neural Engine (throttled)",
    budgetMs: 1500,
    wallMs: 2740,
    latencySamples: [
      1412, 1688, 1934, 1562, 2180, 1766, 1493, 2019, 2284, 1631, 2407, 1852, 2104, 2518
    ],
    trace: [
      { id: "t1", tool: "get_incidents", args: { date: "2026-09-27" }, ms: 1412, status: "ok", out: "3 incidents returned (INC-4410 SEV-2, INC-4419 SEV-3, INC-4424 SEV-3)" },
      { id: "t2", tool: "search_kb", args: { q: "SEV-2 follow-up runbook" }, ms: 1934, status: "ok", out: "2 passages · kb:runbook-sev2 · kb:status-format" },
      { id: "t3", tool: "post_status", args: { incident: "INC-4410", text: "SEV-2 resolved; follow-up posted per runbook" }, ms: 2180, status: "ok", out: "201 created · status-4410" }
    ],
    passages: [
      {
        id: "P1",
        source: "kb:runbook-sev2 · §3.2",
        text: "For a resolved SEV-2, close with a [status follow-up] within [24 hours] of mitigation. The follow-up must name the [incident id] and the [root cause class]."
      },
      {
        id: "P2",
        source: "kb:status-format · §1",
        text: "Status entries follow the template [Impact] / [Mitigation] / [Next steps]. Each entry [links the incident id] it refers to."
      }
    ],
    claims: [
          { id: "c1", text: "Incident INC-4410 (SEV-2) was mitigated and we closed it with a status follow-up.", cite: ["P1:35-51"] },
    { id: "c2", text: "The follow-up is within the 24-hour window required by the runbook.", cite: ["P1:59-67"] },
    { id: "c3", text: "The entry names the incident id and the root cause class.", cite: ["P1:111-147"] },
    { id: "c4", text: "Impact, mitigation and next steps are in the template order from the status format.", cite: ["P2:35-67"] }
    ],
    errors: []
  },

  C: {
    key: "C",
    label: "Tool error + uncited claim",
    task: "Summarize today's incidents and post a status follow-up",
    selector: "on-device · Edge SDK · Hermes harness",
    model: "LFM2.5-2.6B",
    device: "iPhone 15 · Neural Engine",
    budgetMs: 1500,
    wallMs: 1980,
    latencySamples: [
      866, 1031, 1196, 954, 1307, 1059, 908, 1129, 1244, 982, 1371, 1014, 1162, 1291
    ],
    trace: [
      { id: "t1", tool: "get_incidents", args: { date: "2026-09-27" }, ms: 866, status: "ok", out: "3 incidents returned (INC-4410 SEV-2, INC-4419 SEV-3, INC-4424 SEV-3)" },
      { id: "t2", tool: "search_kb", args: { q: "SEV-2 follow-up runbook" }, ms: 1031, status: "ok", out: "2 passages · kb:runbook-sev2 · kb:status-format" },
      { id: "t3", tool: "wc_get_incident_timeline", args: { incidentId: "INC-4410", format: "jsonb" }, ms: 1307, status: "error", out: "schema error · unknown field format (expected 'format' ∈ {text, html}); call skipped, no data returned" },
      { id: "t4", tool: "get_incident_timeline", args: { incidentId: "INC-4410", format: "text" }, ms: 1149, status: "ok", out: "timeline · 4 events between 09:12 and 12:41" }
    ],
    passages: [
      {
        id: "P1",
        source: "kb:runbook-sev2 · §3.2",
        text: "For a resolved SEV-2, close with a [status follow-up] within [24 hours] of mitigation. The follow-up must name the [incident id] and the [root cause class]."
      },
      {
        id: "P2",
        source: "kb:status-format · §1",
        text: "Status entries follow the template [Impact] / [Mitigation] / [Next steps]. Each entry [links the incident id] it refers to."
      }
    ],
    claims: [
          { id: "c1", text: "Incident INC-4410 (SEV-2) was mitigated and we closed it with a status follow-up.", cite: ["P1:35-51"] },
    { id: "c2", text: "Mitigation completed at 12:41, nine minutes before the 24-hour runbook window expired.", cite: ["P2:35-41"], weak: "span does not contain a timestamp; supports the template rule, not the 12:41 time" },
    { id: "c3", text: "Timeline retrieval failed once on the schema and was retried in plain text.", cite: ["t3", "t4"] },
    { id: "c4", text: "No customer data left the device; all retrieval ran inside the Edge SDK.", cite: [] },
    { id: "c5", text: "Impact, mitigation and next steps are in the template order from the status format.", cite: ["P2:35-67"] }
    ],
    errors: [
      { id: "t3", tool: "wc_get_incident_timeline", detail: "schema error · unknown field format (expected 'format' ∈ {text, html})" }
    ]
  }
};