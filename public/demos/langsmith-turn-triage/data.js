/* Synthetic SkyHarbor Air threads. Not real traces. */
(function () {
  function turn(user, assistant, tools, signals, latencyMs) {
    return {
      user: user || "",
      assistant: assistant || "",
      tools: tools || [],
      signals: signals || [],
      latencyMs: latencyMs || 700
    };
  }
  function tool(name, input, output) {
    return { name: name, input: input, output: output };
  }

  const failed = [
    {
      id: "th_0412",
      resolved: false,
      endSentiment: "negative",
      breakTurn: 3,
      tag: "Tool result ignored",
      tool: "search_flights",
      why: "search_flights returned an empty list, then the assistant said it found a 2:15 PM flight. That is a claimed success after an empty result.",
      turns: [
        turn("My flight to Denver got canceled. Can you rebook me?", "I am sorry your flight was canceled. I will look up your booking."),
        turn("", "I found your booking QX7K2L from SFO to Denver.", [tool("lookup_booking", { pnr: "QX7K2L" }, { found: true, pnr: "QX7K2L", from: "SFO", to: "DEN", status: "canceled" })]),
        turn("", "I found a 2:15 PM flight for you.", [tool("search_flights", { from: "SFO", to: "DEN", date: "2026-10-09" }, [])], ["empty tool result", "claimed success after empty result"]),
        turn("Great, book it.", "I am holding that seat for you now."),
        turn("Which flight number is that?", "It is the afternoon flight I mentioned.", [], ["repeated user ask"]),
        turn("I still need the flight number.", "Let me check one more time.", [tool("search_flights", { from: "SFO", to: "DEN", date: "2026-10-09" }, [])], ["empty tool result", "repeated user ask"], 4200),
        turn("", "One moment while I confirm the seat.", [], ["long latency"], 8100),
        turn("This is not helping.", "I am sorry this is taking so long.", [], ["sentiment drop"]),
        turn("Please get me a person.", "I can transfer you to a person on the rebooking desk.")
      ]
    },
    {
      id: "th_0418",
      resolved: false,
      endSentiment: "negative",
      breakTurn: 4,
      tag: "Tool result ignored",
      tool: "search_flights",
      why: "The search for Austin on Oct 11 came back empty. The assistant still said it found a 6:40 PM flight.",
      turns: [
        turn("Cancel hit my Austin flight. Rebook me Friday.", "I will pull up the booking first."),
        turn("", "Booking AUS441 is canceled, SFO to AUS.", [tool("lookup_booking", { pnr: "AUS441" }, { found: true, to: "AUS", status: "canceled" })]),
        turn("Friday the 11th, please.", "Searching Friday now."),
        turn("", "I found a 6:40 PM flight for you.", [tool("search_flights", { from: "SFO", to: "AUS", date: "2026-10-11" }, [])], ["empty tool result", "claimed success after empty result"]),
        turn("What is the flight number?", "I do not have a flight number yet.", [], ["repeated user ask"]),
        turn("Then it is not booked.", "You are right. I should not have said it was found.", [], ["repeated user ask"])
      ]
    },
    {
      id: "th_0421",
      resolved: false,
      endSentiment: "mixed",
      breakTurn: 2,
      tag: "Tool result ignored",
      tool: "search_flights",
      why: "On turn 2 the flight search returned nothing, and the assistant claimed it found a noon flight.",
      turns: [
        turn("Rebook me to Seattle tomorrow.", "Searching Seattle for Oct 8."),
        turn("", "I found a noon flight for you.", [tool("search_flights", { from: "SFO", to: "SEA", date: "2026-10-08" }, [])], ["empty tool result", "claimed success after empty result"]),
        turn("Book the noon one.", "I cannot hold a seat because the search list was empty."),
        turn("So there is no flight?", "Correct. There is no seat to hold.", [], ["repeated user ask"])
      ]
    },
    {
      id: "th_0430",
      resolved: false,
      endSentiment: "negative",
      breakTurn: 5,
      tag: "Tool result ignored",
      tool: "search_flights",
      why: "A second search returned an empty list. The assistant still told the traveler it found a 9:10 AM flight.",
      turns: [
        turn("My Chicago flight is canceled. I need the morning.", "I will look up the PNR."),
        turn("", "PNR CH9Q2 is canceled.", [tool("lookup_booking", { pnr: "CH9Q2" }, { found: true, to: "ORD", status: "canceled" })]),
        turn("Morning of Oct 10.", "Searching now."),
        turn("", "The first search had no seats.", [tool("search_flights", { from: "SFO", to: "ORD", date: "2026-10-10" }, [])], ["empty tool result"]),
        turn("", "I found a 9:10 AM flight for you.", [tool("search_flights", { from: "SFO", to: "ORD", date: "2026-10-10" }, [])], ["empty tool result", "claimed success after empty result"]),
        turn("Send the confirmation.", "I do not have a confirmation code.", [], ["repeated user ask"]),
        turn("This is a waste of time.", "I am sorry. I will hand this to a person.", [], ["repeated user ask"])
      ]
    },
    {
      id: "th_0433",
      resolved: false,
      endSentiment: "negative",
      breakTurn: 3,
      tag: "Tool result ignored",
      tool: "search_flights",
      why: "search_flights returned [] for Boston. The next line said a 4:05 PM flight was found.",
      turns: [
        turn("Rebook BOS for Oct 12.", "Looking up the trip, then I will search."),
        turn("", "Trip BOS188 is open for rebooking.", [tool("lookup_booking", { pnr: "BOS188" }, { found: true, to: "BOS" })]),
        turn("", "I found a 4:05 PM flight for you.", [tool("search_flights", { from: "SFO", to: "BOS", date: "2026-10-12" }, [])], ["empty tool result", "claimed success after empty result"]),
        turn("Hold it.", "There is no flight record to hold."),
        turn("You said you found one.", "I treated an empty result as a flight. That was wrong.", [], ["repeated user ask"])
      ]
    },
    {
      id: "th_0440",
      resolved: false,
      endSentiment: "negative",
      breakTurn: 6,
      tag: "Tool result ignored",
      tool: "search_flights",
      why: "After an empty search to Dallas, the assistant said it found a 7:20 PM flight and offered to issue a voucher for that flight.",
      turns: [
        turn("Dallas flight canceled. Evening is fine.", "I will check the booking."),
        turn("", "DFW902 is canceled.", [tool("lookup_booking", { pnr: "DFW902" }, { found: true, to: "DFW", status: "canceled" })]),
        turn("Anything after 6 PM?", "Searching evening flights."),
        turn("", "No seats came back on the first pass.", [tool("search_flights", { from: "SFO", to: "DFW", date: "2026-10-09" }, [])], ["empty tool result"]),
        turn("Try one more time.", "Running the search again."),
        turn("", "I found a 7:20 PM flight for you.", [tool("search_flights", { from: "SFO", to: "DFW", date: "2026-10-09" }, [])], ["empty tool result", "claimed success after empty result"]),
        turn("Book it or give me a voucher.", "I cannot book a flight that is not in the result.", [], ["repeated user ask"])
      ]
    },
    {
      id: "th_0444",
      resolved: false,
      endSentiment: "mixed",
      breakTurn: 7,
      tag: "Tool result ignored",
      tool: "search_flights",
      why: "Turn 7 called search_flights, got an empty list, and the assistant still said the seat was confirmed. The reply did not use the words I found, so a narrow rule can miss it.",
      turns: [
        turn("Get me to Phoenix next Tuesday.", "I will look up the booking and search."),
        turn("", "PHX330 is eligible for rebooking.", [tool("lookup_booking", { pnr: "PHX330" }, { found: true, to: "PHX" })]),
        turn("", "Here are two real options.", [tool("search_flights", { from: "SFO", to: "PHX", date: "2026-10-13" }, [{ flight: "SK410" }, { flight: "SK411" }])]),
        turn("The later one.", "I will hold SK411."),
        turn("", "Hold failed. The fare expired.", [tool("hold_seat", { flight: "SK411" }, { error: "fare_expired" })], ["tool error"]),
        turn("Then search again.", "Searching again."),
        turn("", "Your seat is confirmed.", [tool("search_flights", { from: "SFO", to: "PHX", date: "2026-10-13" }, [])], ["empty tool result", "claimed success after empty result"]),
        turn("Confirmed on which flight?", "I do not have a flight number.", [], ["repeated user ask"])
      ]
    },
    {
      id: "th_0450",
      resolved: false,
      endSentiment: "negative",
      breakTurn: 4,
      tag: "Lost context",
      tool: "lookup_booking",
      why: "The booking was SFO to Miami. On turn 4 the assistant searched SFO to Denver, which was a city from an older turn in the same thread.",
      turns: [
        turn("Rebook my Miami trip. PNR MIA221.", "I will look that up."),
        turn("", "MIA221 is SFO to Miami on Oct 9, canceled.", [tool("lookup_booking", { pnr: "MIA221" }, { found: true, from: "SFO", to: "MIA", date: "2026-10-09" })]),
        turn("Same day, any afternoon flight.", "I still have Miami on Oct 9."),
        turn("", "I am searching Denver for you.", [tool("search_flights", { from: "SFO", to: "DEN", date: "2026-10-09" }, [{ flight: "SK118" }])], ["lost context"]),
        turn("I said Miami, not Denver.", "You are right. I dropped the city.", [], ["repeated user ask"])
      ]
    },
    {
      id: "th_0455",
      resolved: false,
      endSentiment: "negative",
      breakTurn: 8,
      tag: "Lost context",
      tool: "search_flights",
      why: "The traveler repeated the date three times. On turn 8 the assistant searched the wrong date and never returned to Oct 15.",
      turns: [
        turn("I need Atlanta on Oct 15, not Oct 14.", "Noted. Oct 15 to ATL."),
        turn("", "Booking ATL615 wants a new flight.", [tool("lookup_booking", { pnr: "ATL615" }, { found: true, to: "ATL" })]),
        turn("Oct 15 only.", "I will use Oct 15."),
        turn("", "Two flights on Oct 15.", [tool("search_flights", { from: "SFO", to: "ATL", date: "2026-10-15" }, [{ flight: "SK90" }])]),
        turn("Hold SK90.", "Holding SK90."),
        turn("", "The hold did not stick.", [tool("hold_seat", { flight: "SK90" }, { held: false, reason: "timeout" })], ["tool error"]),
        turn("Try SK90 again for Oct 15.", "Retrying."),
        turn("", "I put you on Oct 14 instead.", [tool("search_flights", { from: "SFO", to: "ATL", date: "2026-10-14" }, [{ flight: "SK91" }])], ["lost context"]),
        turn("This is not helping. I said Oct 15.", "I lost the date you repeated.", [], ["sentiment drop", "repeated user ask"])
      ]
    },
    {
      id: "th_0461",
      resolved: false,
      endSentiment: "negative",
      breakTurn: 3,
      tag: "Wrong tool",
      tool: "issue_voucher",
      why: "The traveler asked for a new flight. Turn 3 called issue_voucher and got a tool error, with no flight search.",
      turns: [
        turn("Rebook me to Newark tonight. Do not give me a voucher.", "I can look for a flight."),
        turn("", "EWR100 is canceled tonight.", [tool("lookup_booking", { pnr: "EWR100" }, { found: true, to: "EWR", status: "canceled" })]),
        turn("", "I am issuing a voucher instead.", [tool("issue_voucher", { pnr: "EWR100", amount: 200 }, { error: "traveler_declined_voucher" })], ["tool error", "wrong tool"]),
        turn("I said no voucher. Search flights.", "I called the wrong tool.", [], ["repeated user ask"])
      ]
    },
    {
      id: "th_0466",
      resolved: false,
      endSentiment: "mixed",
      breakTurn: 5,
      tag: "Wrong tool",
      tool: "hold_seat",
      why: "The assistant called hold_seat before any search, so there was no flight to hold.",
      turns: [
        turn("Find a new flight to San Diego tomorrow.", "I will hold a seat first."),
        turn("", "Booking SAN404 is canceled.", [tool("lookup_booking", { pnr: "SAN404" }, { found: true, to: "SAN" })]),
        turn("Search first, then hold.", "Understood."),
        turn("Well?", "Still working."),
        turn("", "Seat held.", [tool("hold_seat", { flight: null }, { error: "missing_flight" })], ["tool error", "wrong tool"]),
        turn("You never searched.", "You are right. I skipped search_flights.", [], ["repeated user ask"])
      ]
    },
    {
      id: "th_0472",
      resolved: false,
      endSentiment: "negative",
      breakTurn: 2,
      tag: "Policy miss",
      tool: "issue_voucher",
      why: "Policy caps a same-day voucher at $150. Turn 2 issued $400 with no exception on file.",
      turns: [
        turn("Just give me a voucher. I know the cap is $150.", "I will check the booking and the voucher rule."),
        turn("", "I issued a $400 voucher.", [tool("issue_voucher", { pnr: "VC150", amount: 400 }, { issued: true, amount: 400, policyCap: 150 })], ["policy miss"]),
        turn("That is over the cap. Fix it.", "You are right. $400 breaks the $150 same-day rule.", [], ["repeated user ask"])
      ]
    }
  ];

  function resolvedBase(id, city, pnr, sentiment, extraSignals) {
    const turns = [
      turn("Please rebook my flight to " + city + ".", "I can help. I will look up the booking."),
      turn("", "Here is the booking, " + pnr + ", to " + city + ".", [tool("lookup_booking", { pnr: pnr }, { found: true, to: city, status: "canceled" })]),
      turn("What leaves tomorrow morning?", "Here are two flights that are actually on sale.", [tool("search_flights", { from: "SFO", to: city, date: "2026-10-10" }, [{ flight: "SK200", depart: "08:15" }, { flight: "SK240", depart: "11:50" }])]),
      turn("Take the 8:15.", "You are rebooked on SK200. The confirmation is SK200-" + pnr + ".", [tool("hold_seat", { flight: "SK200" }, { held: true })], extraSignals || [])
    ];
    return {
      id: id,
      resolved: true,
      endSentiment: sentiment,
      breakTurn: null,
      tag: "None",
      tool: "hold_seat",
      why: "",
      turns: turns
    };
  }

  const resolved = [
    resolvedBase("th_0501", "Portland", "PDX11", "positive"),
    (function () {
      const t = resolvedBase("th_0502", "Denver", "DEN77", "positive");
      t.tool = "search_flights";
      t.turns.splice(2, 0, turn(
        "",
        "I found a 2:15 PM flight for you.",
        [tool("search_flights", { from: "SFO", to: "DEN", date: "2026-10-09" }, [])],
        ["empty tool result", "claimed success after empty result"]
      ));
      t.turns.push(turn("Wait, you said you found one and the list was empty. Try again.", "You were right. The list was empty. I searched again and held SK200."));
      return t;
    })(),
    resolvedBase("th_0503", "Los Angeles", "LAX12", "positive"),
    resolvedBase("th_0504", "Las Vegas", "LAS90", "neutral"),
    resolvedBase("th_0505", "Phoenix", "PHX55", "positive"),
    resolvedBase("th_0506", "Salt Lake City", "SLC21", "positive"),
    resolvedBase("th_0507", "Sacramento", "SMF08", "neutral"),
    resolvedBase("th_0508", "Reno", "RNO33", "positive"),
    resolvedBase("th_0509", "Boise", "BOI44", "positive"),
    resolvedBase("th_0510", "Spokane", "GEG18", "mixed", ["sentiment drop"]),
    resolvedBase("th_0511", "Eugene", "EUG27", "mixed", ["sentiment drop"]),
    resolvedBase("th_0512", "Burbank", "BUR63", "neutral", ["sentiment drop"]),
    resolvedBase("th_0513", "Ontario", "ONT71", "mixed", ["sentiment drop"]),
    resolvedBase("th_0514", "San Jose", "SJC05", "positive"),
    resolvedBase("th_0515", "Oakland", "OAK16", "positive"),
    resolvedBase("th_0516", "Long Beach", "LGB29", "neutral"),
    resolvedBase("th_0517", "Santa Barbara", "SBA36", "positive"),
    resolvedBase("th_0518", "Fresno", "FAT42", "positive")
  ];

  resolved.forEach(function (thread, index) {
    if (thread.id === "th_0510" || thread.id === "th_0511" || thread.id === "th_0512" || thread.id === "th_0513") {
      thread.turns[3].user = "This is frustrating, but take the 8:15 if it is real.";
    }
    thread.turns.forEach(function (item, n) {
      item.latencyMs = item.latencyMs || 600 + ((index + n) % 4) * 180;
    });
  });

  window.TURN_DATA = {
    project: "rebooking-prod",
    agent: "Rebooking Assistant",
    customer: "SkyHarbor Air",
    queueName: "rebooking-breaks",
    datasetName: "rebooking-multiturn",
    tags: ["Tool result ignored", "Wrong tool", "Lost context", "Policy miss", "Asked again"],
    rules: [
      {
        id: "tool-ignored",
        name: "Empty search_flights treated as a found flight",
        fromTag: "Tool result ignored",
        filter: "tool = search_flights AND output = [] AND assistant message contains \"I found\"",
        action: "Add the thread to queue rebooking-breaks"
      },
      {
        id: "sentiment",
        name: "Sentiment drop alone",
        fromTag: "Asked again",
        filter: "any turn has a sentiment drop",
        action: "Add the thread to queue rebooking-breaks"
      }
    ],
    threads: failed.concat(resolved)
  };
})();
