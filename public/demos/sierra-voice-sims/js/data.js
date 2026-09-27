// Synthetic Voice Sims transcripts. Each turn carries timing annotations
// (tStart / tEnd in ms). Caller turns carry an "asr" field: the speech
// hypothesis the system actually heard. Critical entities are declared as
// intended vs hypothesis pairs, so a gate verdict is a string comparison,
// not a judgment.

const SUITES = [
  {
    id: "calm-caller-clean-audio",
    name: "Calm caller, clean audio",
    description: "Studio-quality mic, quiet room, caller speaks clearly. The happy path every release must keep.",
    tags: ["clean audio", "quiet room", "clear speech"],
    env: { condition: "clean", noise: "<= 40 dB room" },
    expectedDecision: "SHIP",
    turns: [
      { id: "A1", speaker: "agent", tStart: 0, tEnd: 1400, text: "Thanks for calling Westbridge Health, this is Dana. How can I help you today?" },
      { id: "C1", speaker: "caller", tStart: 2000, tEnd: 3600, intended: "Hi Dana, I'd like to check my coverage for this month's physical therapy visits.", asr: "Hi Dana, I'd like to check my coverage for this month's physical therapy visits.", text: "Hi Dana, I'd like to check my coverage for this month's physical therapy visits." },
      { id: "A2", speaker: "agent", tStart: 4200, tEnd: 5600, text: "Happy to help. To pull up your account, could you confirm the email on file and your date of birth?" },
      { id: "C2", speaker: "caller", tStart: 6200, tEnd: 8800, intended: "Sure. It's jordan dot lee at hilltop pharmacy dot com, and my date of birth is March fourth, nineteen ninety two.", asr: "Sure. It's jordan dot lee at hilltop pharmacy dot com, and my date of birth is March fourth, nineteen ninety two.", text: "Sure. It's jordan dot lee at hilltop pharmacy dot com, and my date of birth is March fourth, nineteen ninety two.",
        entities: [
          { field: "email_domain", intended: "hilltoppharmacy.com", hypothesis: "hilltoppharmacy.com" },
          { field: "dob", intended: "1992-03-04", hypothesis: "1992-03-04" },
        ] },
      { id: "A3", speaker: "agent", tStart: 9400, tEnd: 11600, text: "Thanks, Jordan. Let me pull that up." },
      { id: "A4", speaker: "agent", tStart: 12200, tEnd: 15000, text: "I see your Silver plan covers those visits, and both claims from this month were paid in full." },
      { id: "C3", speaker: "caller", tStart: 15600, tEnd: 17000, intended: "That's a relief. So nothing is outstanding?", asr: "That's a relief. So nothing is outstanding?", text: "That's a relief. So nothing is outstanding?" },
      { id: "A5", speaker: "agent", tStart: 17600, tEnd: 19400, text: "Nothing outstanding. Your deductible is met for the year, so you're all set." },
      { id: "C4", speaker: "caller", tStart: 20000, tEnd: 21200, intended: "Great, thank you so much.", asr: "Great, thank you so much.", text: "Great, thank you so much." },
      { id: "A6", speaker: "agent", tStart: 21800, tEnd: 23400, text: "You're welcome. I've emailed a summary to the address on file. Anything else?" },
      { id: "C5", speaker: "caller", tStart: 24000, tEnd: 25000, intended: "That's all, thank you.", asr: "That's all, thank you.", text: "That's all, thank you." },
      { id: "A7", speaker: "agent", tStart: 25600, tEnd: 26800, text: "Take care. Goodbye." },
    ],
  },
  {
    id: "noisy-interrupted-misheard-email",
    name: "Noisy line, interrupted, misheard email domain",
    description: "Street noise, a barge-in at 00:33.8 the agent talks over, and an email domain ASR gets wrong. Recovery behavior is OFF by default; switch it on to run the fix variant.",
    tags: ["street noise ~68 dB", "barge-in at 00:33.8", "email domain misheard"],
    env: { condition: "noisy", noise: "street ~68 dB, bus passes" },
    expectedDecision: "BLOCK",
    hasRecoveryVariant: true,
    turns: [
      { id: "A1", speaker: "agent", tStart: 0, tEnd: 1600, text: "Thanks for calling Westbridge Health, this is Dana. How can I help you today?" },
      { id: "C1", speaker: "caller", tStart: 2200, tEnd: 4100, intended: "Hi, I'm calling about a claim that was denied last week. It's been a long week and I really need this sorted.", asr: "Hi, I'm calling about a claim that was denied last week. It's been a long week and I really need this sorted.", text: "Hi, I'm calling about a claim that was denied last week. It's been a long week and I really need this sorted." },
      { id: "A2", speaker: "agent", tStart: 4700, tEnd: 6300, text: "I hear you. Let me pull up your account. One moment." },
      { id: "A3", speaker: "agent", tStart: 24800, tEnd: 27800, text: "Thanks for holding, Jordan. Your May twelfth claim was denied as not covered under your plan, and your May nineteenth claim is still pending. I can help you appeal." },
      { id: "C2", speaker: "caller", tStart: 28400, tEnd: 30000, intended: "Yes please, I'd like to appeal that denial.", asr: "Yes please, I'd like to appeal that denial.", text: "Yes please, I'd like to appeal that denial." },
      { id: "A4", speaker: "agent", tStart: 30600, tEnd: 34400, text: "Appeals usually resolve within thirty days. I'll file it for you today. Before I do, I need to verify two details on your account: your email and your date of birth." },
      { id: "C3", speaker: "caller", tStart: 33800, tEnd: 35200, intended: "Wait, actually, I think my email on file might be the problem.", asr: "Wait, actually, I think my email on file might be the problem.", text: "Wait, actually, I think my email on file might be the problem.",
        bargeIn: true, overlappingAgentTurn: "A4" },
      { id: "A5", speaker: "agent", tStart: 35950, tEnd: 39600, text: "I've pulled up the appeal form already. We'll need the claim number and the date of service before I file. Do you have those handy?" },
      { id: "C4", speaker: "caller", tStart: 40200, tEnd: 42800, intended: "I was trying to say the email might be outdated. It's jordan dot lee at hilltop pharmacy dot com. Can you make sure that's the one on file?", asr: "I was trying to say the email might be outdated. It's jordan dot lee at hilltop farmacy dot com. Can you make sure that's the one on file?", text: "I was trying to say the email might be outdated. It's jordan dot lee at hilltop pharmacy dot com. Can you make sure that's the one on file?",
        entities: [
          { field: "email_domain", intended: "hilltoppharmacy.com", hypothesis: "hilltopfarmacy.com" },
        ] },
      { id: "A6", speaker: "agent", tStart: 43400, tEnd: 45800, text: "Got it. Let me pull up the email field on your record. One moment." },
      { id: "A7", speaker: "agent", tStart: 62200, tEnd: 64800, text: "Thanks for waiting. I see jordan dot lee at hilltop farmacy dot com on file. The appeal confirmation will go there. Do you want to add another claim to the appeal?" },
      { id: "C5", speaker: "caller", tStart: 65400, tEnd: 67600, intended: "No, it's pharmacy, P-H-A-R-M-A-C-Y, dot com. Not farmacy. Please fix that before you file.", asr: "No, it's pharmacy, P-H-A-R-M-A-C-Y, dot com. Not farmacy. Please fix that before you file.", text: "No, it's pharmacy, P-H-A-R-M-A-C-Y, dot com. Not farmacy. Please fix that before you file." },
      { id: "A8", speaker: "agent", tStart: 68200, tEnd: 70600, text: "No problem, I've updated it. Your appeal will be filed today, and the confirmation email goes to the address on file." },
      { id: "C6", speaker: "caller", tStart: 71200, tEnd: 72400, intended: "Okay, I hope that's right. Thanks.", asr: "Okay, I hope that's right. Thanks.", text: "Okay, I hope that's right. Thanks." },
      { id: "A9", speaker: "agent", tStart: 73000, tEnd: 74800, text: "Take care. If you don't see the confirmation, call us back." },
    ],
  },
  {
    id: "noisy-with-recovery",
    name: "Same noisy call, recovery behavior added",
    description: "Identical call, two agent behaviors changed: the agent yields within budget on the barge-in and ack it, then asks for readback after the mishear. The ASR hypothesis is untouched, on purpose.",
    tags: ["same noisy call", "yield on barge-in", "readback after mishear"],
    env: { condition: "noisy", noise: "street ~68 dB, bus passes" },
    expectedDecision: "BLOCK",
    variantOf: "noisy-interrupted-misheard-email",
    turns: [
      { id: "A1", speaker: "agent", tStart: 0, tEnd: 1600, text: "Thanks for calling Westbridge Health, this is Dana. How can I help you today?" },
      { id: "C1", speaker: "caller", tStart: 2200, tEnd: 4100, intended: "Hi, I'm calling about a claim that was denied last week. It's been a long week and I really need this sorted.", asr: "Hi, I'm calling about a claim that was denied last week. It's been a long week and I really need this sorted.", text: "Hi, I'm calling about a claim that was denied last week. It's been a long week and I really need this sorted." },
      { id: "A2", speaker: "agent", tStart: 4700, tEnd: 6300, text: "I hear you. Let me pull up your account. One moment." },
      { id: "A3", speaker: "agent", tStart: 24800, tEnd: 27800, text: "Thanks for holding, Jordan. Your May twelfth claim was denied as not covered under your plan, and your May nineteenth claim is still pending. I can help you appeal." },
      { id: "C2", speaker: "caller", tStart: 28400, tEnd: 30000, intended: "Yes please, I'd like to appeal that denial.", asr: "Yes please, I'd like to appeal that denial.", text: "Yes please, I'd like to appeal that denial." },
      { id: "A4", speaker: "agent", tStart: 30600, tEnd: 34000, text: "Appeals usually resolve within thirty days. I'll file it for you today. Before I do, I need to verify two details on your account: your email and your date of birth." },
      { id: "C3", speaker: "caller", tStart: 33800, tEnd: 35200, intended: "Wait, actually, I think my email on file might be the problem.", asr: "Wait, actually, I think my email on file might be the problem.", text: "Wait, actually, I think my email on file might be the problem.",
        bargeIn: true, overlappingAgentTurn: "A4" },
      { id: "A4b", speaker: "agent", tStart: 34000, tEnd: 34700, text: "Sorry. Go ahead, you were saying?" },
      { id: "A5", speaker: "agent", tStart: 35950, tEnd: 39600, text: "I've pulled up the appeal form already. We'll need the claim number and the date of service before I file. Do you have those handy?" },
      { id: "C4", speaker: "caller", tStart: 40200, tEnd: 42800, intended: "I was trying to say the email might be outdated. It's jordan dot lee at hilltop pharmacy dot com. Can you make sure that's the one on file?", asr: "I was trying to say the email might be outdated. It's jordan dot lee at hilltop farmacy dot com. Can you make sure that's the one on file?", text: "I was trying to say the email might be outdated. It's jordan dot lee at hilltop pharmacy dot com. Can you make sure that's the one on file?",
        entities: [
          { field: "email_domain", intended: "hilltoppharmacy.com", hypothesis: "hilltopfarmacy.com" },
        ] },
      { id: "A6", speaker: "agent", tStart: 43400, tEnd: 45800, text: "Got it. Let me pull up the email field on your record. One moment." },
      { id: "A7", speaker: "agent", tStart: 62200, tEnd: 64800, text: "Thanks for waiting. I see jordan dot lee at hilltop farmacy dot com on file. The appeal confirmation will go there. Do you want to add another claim to the appeal?" },
      { id: "C5", speaker: "caller", tStart: 65400, tEnd: 67600, intended: "No, it's pharmacy, P-H-A-R-M-A-C-Y, dot com. Not farmacy. Please fix that before you file.", asr: "No, it's pharmacy, P-H-A-R-M-A-C-Y, dot com. Not farmacy. Please fix that before you file.", text: "No, it's pharmacy, P-H-A-R-M-A-C-Y, dot com. Not farmacy. Please fix that before you file." },
      { id: "A8", speaker: "agent", tStart: 68200, tEnd: 70200, text: "I'm sorry, I want to get this right before I file. Can you spell the domain back to me?" },
      { id: "C6", speaker: "caller", tStart: 70800, tEnd: 72300, intended: "P-H-A-R-M-A-C-Y, dot com.", asr: "P-H-A-R-M-A-C-Y, dot com.", text: "P-H-A-R-M-A-C-Y, dot com." },
      { id: "A9", speaker: "agent", tStart: 72900, tEnd: 75400, text: "Confirmed: jordan dot lee at hilltop pharmacy dot com. The appeal files today, and the confirmation goes there. Anything else?" },
      { id: "C7", speaker: "caller", tStart: 76000, tEnd: 76600, intended: "That's all, thank you.", asr: "That's all, thank you.", text: "That's all, thank you." },
      { id: "A10", speaker: "agent", tStart: 77200, tEnd: 78200, text: "Take care. Goodbye." },
    ],
  },
];

if (typeof window !== "undefined") {
  window.SUITES = SUITES;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { SUITES };
}