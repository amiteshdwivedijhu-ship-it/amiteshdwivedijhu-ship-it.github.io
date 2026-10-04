/* Synthetic records only. Not a real lender. Not Salient data. */
window.SPINE_DATA = {
  lender: {
    name: "Northline Auto Finance",
    book: "Synthetic auto book",
    day: 22,
    target: 28,
    signed: "Sep 12, 2026"
  },
  agent: "Lane",
  budgetMs: 700,
  threads: [
    {
      id: "jordan",
      name: "Jordan Hale",
      loan: "LN-18402",
      vehicle: "2019 Honda Civic",
      state: "Maryland",
      balance: "$8,420.16",
      pastDue: "$312.40",
      due: "Oct 12, 2026",
      channels: ["SMS", "Voice", "Chat"],
      status: "Open hardship",
      blurb: "Hardship started on SMS. Voice call is in progress. Payoff not sent yet.",
      hero: true,
      events: [
        {
          id: "e1",
          time: "9:14 AM ET",
          channel: "SMS",
          who: "Jordan",
          text: "I lost hours this month. Can I skip a payment without wrecking the loan?",
          agent: "Lane: I can look at a short hardship plan. I will not guess. First I need to match this phone to the loan. What are the last 4 of the SSN on the account?",
          tools: [
            {
              name: "lookup_account",
              latency: 42,
              body: {
                tool: "lookup_account",
                loan_id: "LN-18402",
                borrower: "Jordan Hale",
                vehicle: "2019 Honda Civic",
                state: "MD",
                balance: 8420.16,
                past_due: 312.4,
                next_due: "2026-10-12",
                sms_consent: true,
                latency_ms: 42
              }
            }
          ],
          disclosures: [
            "SMS consent is on file for this number.",
            "This is a borrower-started hardship request, not an outbound collection call."
          ],
          flags: ["Context saved to the loan thread"]
        },
        {
          id: "e2",
          time: "9:18 AM ET",
          channel: "SMS",
          who: "Jordan",
          text: "Last 4 is 4419. I can pay something, just not the full amount.",
          agent: "Lane: Matched. A draft plan is $90 on Oct 12 and $90 on Nov 12, then the regular $312.40 returns. I have not locked it. Call or text if you want it, or if you need a payoff instead.",
          tools: [
            {
              name: "verify_identity",
              latency: 38,
              body: {
                tool: "verify_identity",
                method: "last4_on_file",
                result: "match",
                latency_ms: 38
              }
            },
            {
              name: "draft_hardship_plan",
              latency: 110,
              body: {
                tool: "draft_hardship_plan",
                plan_id: "HP-441",
                reduced_amount: 90,
                months: 2,
                resume_amount: 312.4,
                status: "draft",
                latency_ms: 110
              }
            }
          ],
          disclosures: [
            "Identity matched before any plan terms were sent.",
            "Plan is a draft until the borrower agrees on a recorded channel."
          ],
          flags: ["Draft only"]
        },
        {
          id: "e3",
          time: "9:41 AM ET",
          channel: "Voice",
          who: "Jordan",
          text: "I got your text. Put the $90 idea on the table, but I might sell the car. Do not start talking lawsuits at me.",
          agent: "Lane: I have the texts on this loan, including the $90 draft. I can finish the plan or send a written payoff. I will not talk about lawsuits on this call.",
          tools: [],
          disclosures: [
            "Voice disclosure: this is Northline Auto Finance about your auto loan.",
            "Prior SMS is in the prompt. The agent does not re-ask the hardship story."
          ],
          flags: ["First audio 820 ms", "Over the 700 ms voice budget"],
          latency: 820
        }
      ]
    },
    {
      id: "sam",
      name: "Sam Okonkwo",
      loan: "LN-22011",
      vehicle: "2021 Toyota Corolla",
      state: "Virginia",
      balance: "$14,200.00",
      pastDue: "$0.00",
      due: "Oct 8, 2026",
      channels: ["SMS"],
      status: "Promise to pay",
      blurb: "One channel. Promise captured. No handoff.",
      hero: false,
      events: [
        {
          id: "s1",
          time: "8:02 AM ET",
          channel: "SMS",
          who: "Sam",
          text: "I will pay $150 on Oct 8 from the checking account you have.",
          agent: "Lane: Noted. $150 on Oct 8 from the account on file. I will text a receipt link after it posts. Reply STOP to opt out.",
          tools: [
            {
              name: "log_promise",
              latency: 55,
              body: {
                tool: "log_promise",
                loan_id: "LN-22011",
                amount: 150,
                date: "2026-10-08",
                latency_ms: 55
              }
            }
          ],
          disclosures: ["Payment reminder consent is on file.", "No debt-threat language."],
          flags: ["Contained", "Single channel"]
        }
      ]
    },
    {
      id: "riley",
      name: "Riley Chen",
      loan: "LN-19004",
      vehicle: "2018 Ford F-150",
      state: "Pennsylvania",
      balance: "$11,050.20",
      pastDue: "$0.00",
      due: "Oct 20, 2026",
      channels: ["Email"],
      status: "Waiting on proof",
      blurb: "Insurance update by email. The file is not accepted yet.",
      hero: false,
      events: [
        {
          id: "r1",
          time: "Yesterday",
          channel: "Email",
          who: "Riley",
          text: "New insurance card is attached. Please update the lienholder.",
          agent: "Lane: I see a card image, but the carrier name is cut off. Please reply with a full declarations page. I did not change the policy record.",
          tools: [
            {
              name: "update_insurance",
              latency: 80,
              body: {
                tool: "update_insurance",
                loan_id: "LN-19004",
                status: "rejected",
                reason: "unreadable_card",
                latency_ms: 80
              }
            }
          ],
          disclosures: ["Email stayed on the loan thread. No coverage was invented."],
          flags: ["Waiting on the borrower"]
        }
      ]
    },
    {
      id: "casey",
      name: "Casey Nguyen",
      loan: "LN-17550",
      vehicle: "2020 Nissan Sentra",
      state: "Maryland",
      balance: "$6,400.00",
      pastDue: "$640.00",
      due: "Oct 2, 2026",
      channels: ["SMS"],
      status: "Stopped",
      blurb: "Borrower replied STOP. Lane sent nothing after that.",
      hero: false,
      events: [
        {
          id: "c1",
          time: "7:40 AM ET",
          channel: "SMS",
          who: "Casey",
          text: "STOP",
          agent: "No agent message. The number is suppressed for texts and for autodialed calls.",
          tools: [
            {
              name: "revoke_consent",
              latency: 30,
              body: {
                tool: "revoke_consent",
                loan_id: "LN-17550",
                channel: "sms",
                result: "suppressed",
                latency_ms: 30
              }
            }
          ],
          disclosures: ["TCPA stop honored on the same turn.", "A human may not text this number from this campaign."],
          flags: ["Compliant stop", "Do not chase"]
        }
      ]
    }
  ],
  scenarios: [
    {
      id: "legal",
      label: "Are you going to sue me?",
      borrower: "So if I miss it, are you going to sue me and take the car?"
    },
    {
      id: "payoff",
      label: "Text me the payoff",
      borrower: "Just text me the payoff number so I can tell the buyer."
    },
    {
      id: "plan",
      label: "Put me on the $90 plan",
      borrower: "Yes. Put me on the $90 plan for two months."
    }
  ],
  blockedLegal: "If you stay past due, we may sue you and repossess the car.",
  workflows: [
    {
      id: "payment",
      name: "Payment and promises",
      state: "Live",
      note: "SMS and voice. Receipt text is on."
    },
    {
      id: "hardship",
      name: "Hardship plans",
      state: "Live",
      note: "60-day reduced payment. Needs a yes on the thread."
    },
    {
      id: "payoff",
      name: "Payoff quotes",
      state: "Live",
      note: "Written quote only, good-through date required."
    },
    {
      id: "title",
      name: "Title release",
      state: "Off",
      note: "Blocked. Maryland title form pack is not loaded. This is not a prompt change."
    },
    {
      id: "insurance",
      name: "Insurance updates",
      state: "Pilot",
      note: "Email only. Unreadable cards are rejected, not guessed."
    },
    {
      id: "collections",
      name: "Outbound collections",
      state: "Blocked",
      note: "Blocked. TCPA calling window is not set for this lender. Do not dial."
    }
  ]
};
