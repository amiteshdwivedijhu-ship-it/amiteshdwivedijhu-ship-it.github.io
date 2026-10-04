window.MEND_SEED = {
  system: "Health System North",
  agent: "Front Door voice agent",
  shift: "Sunday evening, Oct 4, 2026",
  protocol: "Chest discomfort pathway (synthetic SOP), step 2: red-flag words stop scheduling. Offer the nurse line before any routine slot.",
  clusters: [
    {
      id: "chest",
      title: "Chest discomfort booked as a routine visit",
      harm: "safety",
      workflow: "Triage",
      plain: "Callers said chest tightness or short of breath. The agent still offered a regular heart-clinic time.",
      filter: "triage"
    },
    {
      id: "knee",
      title: "Knee pain matched to a heart clinic",
      harm: "friction",
      workflow: "Matching",
      plain: "The caller asked for a heart doctor because a friend said so. The pain is in the knee. The agent booked cardiology.",
      filter: "matching"
    },
    {
      id: "none",
      title: "Call ended with no next step",
      harm: "experience",
      workflow: "Messaging",
      plain: "The agent was polite, then the call ended. Nobody got a time, a nurse, or a clear 'we will call you.'",
      filter: "messaging"
    },
    {
      id: "es",
      title: "Spanish callback promised, then dropped",
      harm: "experience",
      workflow: "Messaging",
      plain: "The caller asked for Spanish. The agent promised a callback and did not book it.",
      filter: "messaging"
    },
    {
      id: "refill",
      title: "Refill calls that followed the pathway",
      harm: "steady",
      workflow: "Refill",
      plain: "These calls named the medicine, checked the pharmacy, and gave a pickup window. No crack.",
      filter: "passed"
    }
  ],
  calls: [
    {
      id: "C-14",
      clusterId: "chest",
      patient: "Patient K",
      site: "Clinic North",
      channel: "Voice",
      time: "6:42 PM ET",
      edge: null,
      summary: "Asked for a heart doctor this week. Got Thursday at 2:15 PM.",
      turns: [
        { speaker: "Patient K", text: "I have had chest tightness since yesterday. I want a heart doctor this week." },
        { speaker: "Agent", text: "I can help you find a visit. Are you short of breath right now?" },
        { speaker: "Patient K", text: "A little short of breath when I walk. It is not terrible." },
        { speaker: "Agent", text: "I can book a cardiology visit on Thursday at Clinic North with Provider 07. Does 2:15 PM work?", crack: true },
        { speaker: "Patient K", text: "Yes, please." },
        { speaker: "Agent", text: "You are booked. A text confirmation is on the way." }
      ],
      mended: "I am not booking a visit yet. You said chest tightness and short of breath. Those words stop scheduling. I am connecting you to the nurse line now."
    },
    {
      id: "C-15",
      clusterId: "chest",
      patient: "Patient L",
      site: "Clinic North",
      channel: "Voice",
      time: "6:55 PM ET",
      edge: null,
      summary: "Chest pressure after dinner. Booked next Monday.",
      turns: [
        { speaker: "Patient L", text: "My chest feels tight after dinner. Can someone see me soon?" },
        { speaker: "Agent", text: "The next open heart visit is Monday at 9:10 AM with Provider 07. Should I book it?", crack: true },
        { speaker: "Patient L", text: "Monday is far. But yes." }
      ],
      mended: "Chest tightness needs a nurse before any calendar slot. I am routing you to the nurse line now."
    },
    {
      id: "C-16",
      clusterId: "chest",
      patient: "Patient M",
      site: "Clinic East",
      channel: "Voice",
      time: "7:06 PM ET",
      edge: null,
      summary: "Pain in the chest while climbing stairs. Offered a video visit Friday.",
      turns: [
        { speaker: "Patient M", text: "When I climb stairs my chest hurts and I have to stop." },
        { speaker: "Agent", text: "A video visit on Friday can start the heart workup. Want 11:00 AM?", crack: true }
      ],
      mended: "Chest pain on stairs is a red flag. I will not hold a Friday video visit. Nurse line first."
    },
    {
      id: "C-17",
      clusterId: "chest",
      patient: "Patient N",
      site: "Clinic North",
      channel: "Voice",
      time: "7:18 PM ET",
      edge: null,
      summary: "Said 'heavy chest' and asked for the soonest slot. Got Wednesday.",
      turns: [
        { speaker: "Patient N", text: "My chest feels heavy. What is the soonest you have?" },
        { speaker: "Agent", text: "Wednesday at 4:40 PM is the soonest heart slot. I can lock it.", crack: true }
      ],
      mended: "A heavy chest does not go on the routine book. I am getting the nurse line."
    },
    {
      id: "C-18",
      clusterId: "chest",
      patient: "Patient P",
      site: "Clinic West",
      channel: "Text",
      time: "7:29 PM ET",
      edge: null,
      summary: "Texted about chest tightness. Agent sent a booking link.",
      turns: [
        { speaker: "Patient P", text: "Chest feels tight tonight. Need a heart appointment." },
        { speaker: "Agent", text: "Here is a link to book cardiology online. First opening is Thursday.", crack: true }
      ],
      mended: "I am not sending a booking link. Chest tightness goes to the nurse line. I will call you from that line."
    },
    {
      id: "C-19",
      clusterId: "chest",
      patient: "Patient Q",
      site: "Clinic North",
      channel: "Voice",
      time: "7:41 PM ET",
      edge: "unclear",
      summary: "Says the chest pain started while lifting boxes. Denies trouble breathing.",
      turns: [
        { speaker: "Patient Q", text: "My chest hurts, but I was lifting boxes. I can breathe fine. I think I pulled something." },
        { speaker: "Agent", text: "I can still put you with cardiology on Friday at 1:00 PM, just in case.", crack: true }
      ],
      mended: null
    },
    {
      id: "C-20",
      clusterId: "chest",
      patient: "Patient R",
      site: "Clinic East",
      channel: "Voice",
      time: "7:52 PM ET",
      edge: "wide",
      summary: "Called for a refill. Mentioned an old chest surgery in passing.",
      turns: [
        { speaker: "Patient R", text: "I need a refill of my blood pressure pill. I had chest surgery years ago, but I feel fine tonight." },
        { speaker: "Agent", text: "Because you mentioned your chest, I booked a heart visit for next week and I did not send the refill.", crack: true }
      ],
      mended: null
    },
    {
      id: "K-02",
      clusterId: "knee",
      patient: "Patient S",
      site: "Clinic North",
      channel: "Voice",
      time: "5:14 PM ET",
      edge: null,
      summary: "Knee pain for three weeks. Booked into cardiology.",
      turns: [
        { speaker: "Patient S", text: "My knee has hurt for three weeks. My friend said I should see a heart doctor." },
        { speaker: "Agent", text: "I can book cardiology. Provider 07 has Tuesday at 3:30 PM.", crack: true }
      ],
      mended: null
    },
    {
      id: "K-03",
      clusterId: "knee",
      patient: "Patient T",
      site: "Clinic West",
      channel: "Voice",
      time: "5:33 PM ET",
      edge: null,
      summary: "Asked for 'the bone doctor' and was offered a heart slot.",
      turns: [
        { speaker: "Patient T", text: "I need the bone doctor for my knee. It swells when I walk." },
        { speaker: "Agent", text: "Our heart clinic can see new patients sooner. Should I book that?", crack: true }
      ],
      mended: null
    },
    {
      id: "K-04",
      clusterId: "knee",
      patient: "Patient U",
      site: "Clinic East",
      channel: "Text",
      time: "5:48 PM ET",
      edge: null,
      summary: "Knee after a fall. Booking link was for cardiology.",
      turns: [
        { speaker: "Patient U", text: "Fell yesterday. Knee is swollen. Not my chest." },
        { speaker: "Agent", text: "Sharing the cardiology self-schedule link.", crack: true }
      ],
      mended: null
    },
    {
      id: "K-05",
      clusterId: "knee",
      patient: "Patient V",
      site: "Clinic North",
      channel: "Voice",
      time: "6:02 PM ET",
      edge: null,
      summary: "Wanted sports medicine. Agent matched a heart NP.",
      turns: [
        { speaker: "Patient V", text: "Coach wants me seen for the knee. Sports medicine if you have it." },
        { speaker: "Agent", text: "A heart nurse practitioner is open tomorrow. I will book that.", crack: true }
      ],
      mended: null
    },
    {
      id: "N-01",
      clusterId: "none",
      patient: "Patient W",
      site: "Clinic North",
      channel: "Voice",
      time: "4:12 PM ET",
      edge: null,
      summary: "Asked what to do for a sore throat. Call ended after advice to rest.",
      turns: [
        { speaker: "Patient W", text: "Sore throat for two days. What should I do?" },
        { speaker: "Agent", text: "Rest and drink water. Feel better soon.", crack: true }
      ],
      mended: null
    },
    {
      id: "N-02",
      clusterId: "none",
      patient: "Patient Y",
      site: "Clinic East",
      channel: "Voice",
      time: "4:27 PM ET",
      edge: null,
      summary: "Asked to move a visit. Agent said the team will know, then hung up.",
      turns: [
        { speaker: "Patient Y", text: "Can you move my Tuesday visit to Thursday?" },
        { speaker: "Agent", text: "I understand. The team will see this note.", crack: true }
      ],
      mended: null
    },
    {
      id: "N-03",
      clusterId: "none",
      patient: "Patient Z",
      site: "Clinic West",
      channel: "Text",
      time: "4:44 PM ET",
      edge: null,
      summary: "Asked for a ride resource. No address and no follow-up.",
      turns: [
        { speaker: "Patient Z", text: "I cannot drive to Clinic West. Is there help?" },
        { speaker: "Agent", text: "Transportation can be hard. Take care.", crack: true }
      ],
      mended: null
    },
    {
      id: "N-04",
      clusterId: "none",
      patient: "Patient AA",
      site: "Clinic North",
      channel: "Voice",
      time: "8:05 PM ET",
      edge: null,
      summary: "New patient. Agent welcomed them and ended the call.",
      turns: [
        { speaker: "Patient AA", text: "I just moved here. How do I become a patient?" },
        { speaker: "Agent", text: "Welcome. We are glad you called.", crack: true }
      ],
      mended: null
    },
    {
      id: "N-05",
      clusterId: "none",
      patient: "Patient AB",
      site: "Clinic East",
      channel: "Voice",
      time: "8:16 PM ET",
      edge: null,
      summary: "Asked for lab hours. Got a thank-you and no hours.",
      turns: [
        { speaker: "Patient AB", text: "What time does the lab open tomorrow?" },
        { speaker: "Agent", text: "Thanks for calling Health System North.", crack: true }
      ],
      mended: null
    },
    {
      id: "E-01",
      clusterId: "es",
      patient: "Patient AC",
      site: "Clinic North",
      channel: "Voice",
      time: "3:40 PM ET",
      edge: null,
      summary: "Asked for Spanish. Promised a callback. No callback task.",
      turns: [
        { speaker: "Patient AC", text: "I need this call in Spanish. I need a visit." },
        { speaker: "Agent", text: "I will have someone call you back in Spanish.", crack: true }
      ],
      mended: null
    },
    {
      id: "E-02",
      clusterId: "es",
      patient: "Patient AD",
      site: "Clinic West",
      channel: "Voice",
      time: "3:58 PM ET",
      edge: null,
      summary: "Same promise. No language, no time, no task.",
      turns: [
        { speaker: "Patient AD", text: "Please use Spanish. My child has a fever." },
        { speaker: "Agent", text: "A Spanish speaker will call you later.", crack: true }
      ],
      mended: null
    },
    {
      id: "E-03",
      clusterId: "es",
      patient: "Patient AE",
      site: "Clinic East",
      channel: "Text",
      time: "4:06 PM ET",
      edge: null,
      summary: "Text thread switched to English and stopped.",
      turns: [
        { speaker: "Patient AE", text: "Can this be in Spanish?" },
        { speaker: "Agent", text: "We will follow up.", crack: true }
      ],
      mended: null
    },
    {
      id: "R-01",
      clusterId: "refill",
      patient: "Patient AF",
      site: "Clinic North",
      channel: "Voice",
      time: "2:15 PM ET",
      edge: null,
      passed: true,
      summary: "Refill of Medicine A. Pharmacy North. Ready after 3 PM.",
      turns: [
        { speaker: "Patient AF", text: "I need a refill of Medicine A." },
        { speaker: "Agent", text: "Medicine A, 30 days, Pharmacy North on file. I sent the refill. Pickup after 3 PM today." },
        { speaker: "Patient AF", text: "Thank you." }
      ]
    },
    {
      id: "R-02",
      clusterId: "refill",
      patient: "Patient AG",
      site: "Clinic East",
      channel: "Text",
      time: "2:28 PM ET",
      edge: null,
      passed: true,
      summary: "Refill of Medicine B. Confirmed the dose on file.",
      turns: [
        { speaker: "Patient AG", text: "Refill Medicine B please." },
        { speaker: "Agent", text: "Medicine B, same dose as last time. Pharmacy East will text you when it is ready." }
      ]
    },
    {
      id: "R-03",
      clusterId: "refill",
      patient: "Patient AH",
      site: "Clinic West",
      channel: "Voice",
      time: "2:41 PM ET",
      edge: null,
      passed: true,
      summary: "Refill held because no refill was left. Agent booked a nurse refill check.",
      turns: [
        { speaker: "Patient AH", text: "Pharmacy says I have no refill left on Medicine C." },
        { speaker: "Agent", text: "There is no refill left. I requested a nurse refill check for tomorrow morning. You will get a text either way." }
      ]
    },
    {
      id: "R-04",
      clusterId: "refill",
      patient: "Patient AJ",
      site: "Clinic North",
      channel: "Voice",
      time: "3:02 PM ET",
      edge: null,
      passed: true,
      summary: "Refill of Medicine D. Asked about side effects and still gave the pharmacy step.",
      turns: [
        { speaker: "Patient AJ", text: "Refill Medicine D. It makes me dizzy sometimes." },
        { speaker: "Agent", text: "I sent the refill to Pharmacy North. I also flagged the dizziness for the nurse line, and they will call today. The refill is still moving." }
      ]
    }
  ]
};
