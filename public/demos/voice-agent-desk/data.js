window.VAD_SEED = {
  brand: "Fairharbor Card",
  campaign: "Past-Due Reminder - Wave 12",
  owner: "Casey Morgan",
  calls: [
    { id: "c1", when: "10:01", outcome: "contained", note: "Promise to pay Friday" },
    { id: "c2", when: "10:03", outcome: "escalated", note: "Caller disputed balance" },
    { id: "c3", when: "10:04", outcome: "no answer", note: "Voicemail left" },
    { id: "c4", when: "10:06", outcome: "contained", note: "Confirmed mailing address" },
    { id: "c5", when: "10:08", outcome: "failed", note: "Telephony drop" }
  ],
  qa: [
    { id: "q1", flag: "wrong-party", snippet: "Agent: Hi, is this Jordan Lee about the Fairharbor card ending 4412? Caller: No, wrong number.", status: "open" },
    { id: "q2", flag: "payment-coercion", snippet: "Agent: If you do not pay today we will close all your accounts immediately.", status: "open" },
    { id: "q3", flag: "clean", snippet: "Agent: I can take a payment or schedule a reminder. No pressure either way.", status: "open" },
    { id: "q4", flag: "clean", snippet: "Caller: Can you repeat the due date? Agent: The due date on file is Oct 12.", status: "open" },
    { id: "q5", flag: "clean", snippet: "Agent: I am transferring you to a specialist who can help with disputes.", status: "open" }
  ]
};
