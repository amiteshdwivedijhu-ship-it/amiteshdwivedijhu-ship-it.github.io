// data.js
// Synthetic input files for the SuperDial Prior Auth Status packet prototype.
// Fictional transcripts and one fictional payer portal snippet.
// No PHI, no live payer calls, no real payer data.

const CASES = {
  A: {
    id: "A",
    title: "Transcript A - approved auth",
    expectedStatus: "approved",
    expectedConflict: false,
    expectedEscalation: false,
    expectedMissingDocCount: 0,
    transcript: [
      { speaker: "Agent", text: "Hi, this is Dana Casey from Lakeside Medical calling to check prior authorization for patient J Smith, lumbar spine MRI, request AUTH-88231." },
      { speaker: "Payer", text: "Good morning. I have request AUTH-88231. Prior authorization is required for lumbar MRI, so let me check the status." },
      { speaker: "Payer", text: "The status shows approved. It was approved on September 22." },
      { speaker: "Agent", text: "Can you confirm the authorization number?" },
      { speaker: "Payer", text: "The authorization number is 71920456." },
      { speaker: "Payer", text: "It is active through December 20, 2026. Nothing is missing on our end; everything is on file." },
      { speaker: "Agent", text: "Great, that is all I need. Thanks." },
    ],
    passReason: "status=approved, auth #71920456 cited, 5 fields all cited, 96% confidence, escalation flag false",
  },

  B: {
    id: "B",
    title: "Transcript B - missing clinical notes",
    expectedStatus: "pending",
    expectedConflict: false,
    expectedEscalation: true,
    expectedMissingDocCount: 1,
    transcript: [
      { speaker: "Agent", text: "Hi, this is Dana Casey from Lakeside Medical checking prior authorization for J Smith, request AUTH-77304, lumbar MRI." },
      { speaker: "Payer", text: "I see request AUTH-77304. Prior authorization is required for lumbar MRI." },
      { speaker: "Payer", text: "The status is currently pending." },
      { speaker: "Agent", text: "What do you still need from us?" },
      { speaker: "Payer", text: "We are missing the clinical notes from your last MRI." },
      { speaker: "Agent", text: "I can fax those over. Anything else?" },
      { speaker: "Payer", text: "Just the clinical notes. Once we receive them, review takes about 48 hours." },
      { speaker: "Agent", text: "Got it, I will send the clinical notes today. Thanks." },
    ],
    passReason: "status=pending, missing clinical notes cited on 2 spans, next step set, escalation true (missing docs + low-confidence auth ref)",
  },

  C: {
    id: "C",
    title: "Transcript C - portal pending vs voice denied",
    expectedStatus: null,
    expectedConflict: true,
    expectedEscalation: true,
    expectedMissingDocCount: 0,
    transcript: [
      { speaker: "Agent", text: "Hi, this is Dana Casey from Lakeside Medical calling about prior authorization for J Smith, knee MRI, request AUTH-99018." },
      { speaker: "Payer", text: "I see request AUTH-99018. Prior authorization is required for knee MRI." },
      { speaker: "Payer", text: "That authorization was denied on September 10. The service was not approved." },
      { speaker: "Agent", text: "Was there a reason given?" },
      { speaker: "Payer", text: "It says the requested service did not match the treatment plan. You can request a peer review." },
      { speaker: "Agent", text: "Thank you, I will check this with our team." },
    ],
    portal: "WorkersComp Payer Portal\nAuthorization AUTH-99018\nStatus: Pending\nMissing documentation: None\nReference: AUTH-99018\nLast updated: September 24, 2026",
    passReason: "conflict flagged: phone says denied, portal says pending, both sources cited, escalation true",
  },
};