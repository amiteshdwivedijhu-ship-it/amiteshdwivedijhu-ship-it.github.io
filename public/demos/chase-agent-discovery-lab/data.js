/* Synthetic Sample Bank planning data. Not a JPMorgan Chase product. */
window.BANK_DATA = {
  eligible: 100000,
  steps: [0, 5, 10, 25, 50, 100],
  entries: [
    { id: "E1", surface: "Home", label: "Home \"Ask or search\" bar", task: "Ask a question or search", seedPct: 100, saw: 62000, first: 3100, rate: 0.72, status: "Live" },
    { id: "E2", surface: "Charge", label: "Transaction detail \"Something wrong with this charge?\"", task: "Question a charge", seedPct: 25, saw: 9400, first: 1220, rate: 0.81, status: "Live", repeat: 0.05, handoff: 0.12 },
    { id: "E3", surface: "Card", label: "Card screen \"Lost, stolen, or damaged card?\"", task: "Replace a card", seedPct: 10, saw: 1800, first: 410, rate: 0.90, status: "Pilot", handoff: 0.08 },
    { id: "E4", surface: "Fee", label: "Fee detail \"Ask about this fee\"", task: "Ask about a fee", seedPct: 5, saw: 900, first: 260, rate: 0.61, status: "Pilot", handoff: 0.31 },
    { id: "E5", surface: "Help", label: "Help center \"Chat with the assistant\"", task: "Start a help chat", seedPct: 100, saw: 14000, first: 2600, rate: 0.70, status: "Live" },
    { id: "E6", surface: "Paid", label: "Payment done \"Set up autopay with the assistant\"", task: "Set up autopay", seedPct: 0, saw: 0, first: 0, rate: null, status: "Off", forecastSaw: 2000, forecastFirst: 180 }
  ],
  nudges: [
    { id: "N1", name: "Duplicate charge spotted", channel: "In-app card plus push", type: "servicing", needsPush: true, timeCritical: false, feature: false, tip: true, fraudBlock: true, priority: 2, on: true, sends: 1200, starts: 450, optOut: 0.004, completion: 0.80, complaints: null, message: "We spotted a duplicate charge. Want help checking it?" },
    { id: "N2", name: "Fee charged: explain and check refund", channel: "In-app only", type: "servicing", needsPush: false, timeCritical: false, feature: false, tip: true, fraudBlock: true, priority: 3, on: true, sends: 2000, starts: 300, optOut: 0.003, completion: 0.70, complaints: null, message: "A fee posted. We can explain it and check a refund." },
    { id: "N3", name: "Bill due in 3 days and balance low", channel: "Push", type: "servicing", needsPush: true, timeCritical: false, feature: false, tip: true, fraudBlock: true, priority: 4, on: true, sends: 4000, starts: 260, optOut: 0.011, completion: 0.74, complaints: null, message: "A bill is due in 3 days and the balance looks low." },
    { id: "N4", name: "Card declined abroad", channel: "Push", type: "time-critical servicing", needsPush: true, timeCritical: true, feature: false, tip: false, fraudBlock: true, priority: 1, on: true, sends: 300, starts: 120, optOut: 0.002, completion: 0.88, complaints: null, message: "Your card was declined abroad. Tap if you need help." },
    { id: "N5", name: "Try the assistant after 3 help visits", channel: "Push", type: "feature promotion", needsPush: true, timeCritical: false, feature: true, tip: false, fraudBlock: true, priority: 6, on: false, sends: 2500, starts: 225, optOut: 0.024, completion: null, complaints: 3.1, commsTag: true, message: "You have visited help 3 times. Try the assistant." },
    { id: "N6", name: "Next helpful task after a completed task", channel: "In-app", type: "servicing", needsPush: false, timeCritical: false, feature: false, tip: true, fraudBlock: false, priority: 5, on: false, sends: null, starts: null, optOut: 0.009, completion: null, complaints: null, message: "You finished a task. Here is one next step that may help." }
  ],
  handoffs: [
    { id: "H1", condition: "Customer asks for a person", destination: "Chat specialist", share: 0.06, note: "Always, one tap" },
    { id: "H2", condition: "Dispute over $500, or a second dispute in 30 days", destination: "Disputes team", share: 0.025 },
    { id: "H3", condition: "Open or suspected fraud", destination: "Fraud team, no assistant actions", share: 0.015 },
    { id: "H4", condition: "Hardship or bereavement words", destination: "Specialist team", share: 0.01 },
    { id: "H5", condition: "Two failed tries, or confidence under the floor", destination: "Chat specialist", share: 0.03 },
    { id: "H6", condition: "Investment or credit advice", destination: "Banker appointment", share: 0.01 }
  ],
  h5Floors: {
    "0.60": { handoff: 0.13, completion: 0.72, h5Share: 0.01 },
    "0.70": { handoff: 0.15, completion: 0.74, h5Share: 0.03 },
    "0.80": { handoff: 0.18, completion: 0.76, h5Share: 0.06 }
  },
  trustSeed: { handoff: 0.15, repeat: 0.06, optOut: 0.007, complaints: 1.2, summary: 1 },
  guardrails: [
    "Completion at least 70%.",
    "Repeat contact at most 8%.",
    "Handoff at most 25%.",
    "Opt-out at most 1.5% per send.",
    "Complaints at most 2 per 10,000.",
    "100% of handoffs carry the chat summary.",
    "At least 1,000 exposures."
  ],
  personas: [
    {
      id: "C-01", name: "Maya R.", note: "Push on, marketing off.",
      push: true, marketing: false, tips: true, fraud: false, complaint: null,
      events: [
        { date: "Oct 2", hour: 10, minute: 0, rule: "N1", card: "We spotted two $42.18 charges at Fernway Market on Oct 2. Want help disputing one?" },
        { date: "Oct 3", hour: 9, minute: 0, rule: "N3", card: "A bill is due in 3 days and the balance looks low." }
      ]
    },
    {
      id: "C-02", name: "Luis G.", note: "Push off.",
      push: false, marketing: false, tips: true, fraud: false, complaint: null,
      events: [
        { date: "Oct 4", hour: 15, minute: 0, kind: "note", text: "A $34 fee posted. The in-app note is scheduled for the next day." },
        { date: "Oct 5", hour: 11, minute: 0, rule: "N2", card: "A $34 fee posted on Oct 4. Want an explanation and a refund check?" }
      ]
    },
    {
      id: "C-03", name: "Ana P.", note: "In Lisbon. Push on, marketing off.",
      push: true, marketing: false, tips: true, fraud: false, complaint: null,
      events: [
        { date: "Oct 5", hour: 23, minute: 40, rule: "N4", card: "Your card was declined in Lisbon at 11:40pm. Want help?" },
        { date: "Oct 6", hour: 10, minute: 0, rule: "N5", card: "You have visited help 3 times. Try the assistant." }
      ]
    },
    {
      id: "C-04", name: "Derek W.", note: "Complaint on Sep 28. Nudges held through Oct 28.",
      push: true, marketing: true, tips: true, fraud: false, complaint: "Sep 28",
      events: [
        { date: "Oct 2", hour: 12, minute: 0, rule: "N1" },
        { date: "Oct 7", hour: 12, minute: 0, rule: "N3" },
        { date: "Oct 12", hour: 12, minute: 0, rule: "N2" }
      ]
    },
    {
      id: "C-05", name: "Grace K.", note: "Opted out of tips. Card alerts still send.",
      push: true, marketing: false, tips: false, fraud: false, complaint: null,
      events: [
        { date: "Oct 2", hour: 9, minute: 0, rule: "N1" },
        { date: "Oct 4", hour: 9, minute: 0, rule: "N2" },
        { date: "Oct 6", hour: 9, minute: 0, rule: "N3" },
        { date: "Oct 9", hour: 15, minute: 0, rule: "N4", card: "Your card was declined. This card alert still sends." }
      ]
    },
    {
      id: "C-06", name: "Omar S.", note: "Open fraud case. Card questions go to H3.",
      push: true, marketing: false, tips: true, fraud: true, complaint: null,
      events: [
        { date: "Oct 6", hour: 13, minute: 0, kind: "handoff", text: "Card question. Routed to the fraud team (H3). The assistant takes no action." },
        { date: "Oct 8", hour: 13, minute: 0, rule: "N1" },
        { date: "Oct 11", hour: 18, minute: 0, rule: "N4" }
      ]
    }
  ],
  chat: {
    prompt: "We spotted two $42.18 charges at Fernway Market on Oct 2. Want help disputing one?",
    confirm: "I will dispute the $42.18 charge from Oct 2. Confirm?",
    done: "Dispute filed. Case D-48213 (sample)."
  }
};
