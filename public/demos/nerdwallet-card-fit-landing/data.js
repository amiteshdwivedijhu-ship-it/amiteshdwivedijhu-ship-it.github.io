/* Synthetic cards, payouts, and traffic. Not a NerdWallet product. Not financial advice. */
window.CARD_DATA = {
  assumption: "Miles and points are valued at 1 cent each. This is a sample assumption, not a quote.",
  cards: [
    {
      id: "atlas",
      name: "Atlas No-Fee Miles",
      issuer: "Northline Bank (fake)",
      fee: 0,
      rewards: "1.5x miles on all purchases, no foreign fee",
      best: "No-fee travel",
      credit: "Good to excellent",
      payout: 110,
      intents: ["travel"],
      why: ["No annual fee, and you earn miles on every purchase.", "It matches a search for a no-fee travel card."],
      poor: "A poor fit if you never travel and only want the highest cash rate."
    },
    {
      id: "summit",
      name: "Summit Travel Rewards",
      issuer: "Harbor Peak Bank (fake)",
      fee: 95,
      rewards: "3x travel and dining, 1x other",
      best: "Frequent travelers",
      credit: "Good to excellent",
      payout: 210,
      intents: ["travel"],
      why: ["You earn 3x miles on travel and dining.", "The $95 fee comes out before the net value."],
      poor: "A poor fit if you want no annual fee. The $95 fee cuts the yearly value."
    },
    {
      id: "harbor",
      name: "Harbor Cash Plus",
      issuer: "Cedar Mutual (fake)",
      fee: 0,
      rewards: "3% groceries up to $6,000 a year, 1% other",
      best: "Groceries",
      credit: "Good",
      payout: 90,
      intents: ["groceries"],
      why: ["The 3% grocery rate is the reason to pick it.", "After $6,000 in groceries the rate drops to 1%."],
      poor: "A poor fit if you spend little on groceries."
    },
    {
      id: "pine",
      name: "Pine Flat 2% Card",
      issuer: "Pine City Bank (fake)",
      fee: 0,
      rewards: "2% on everything",
      best: "Simple cash back",
      credit: "Good to excellent",
      payout: 120,
      intents: ["groceries", "cash"],
      why: ["A flat 2% is easy to understand.", "At 1 cent per mile, 2% cash beats 1.5x miles."],
      poor: "A poor fit if you want travel miles instead of cash."
    },
    {
      id: "brook",
      name: "Brook Balance Transfer",
      issuer: "Brook Lending (fake)",
      fee: 0,
      rewards: "0% intro APR on transfers for 18 months (synthetic), 3% transfer fee",
      best: "Paying down a balance",
      credit: "Good",
      payout: 140,
      intents: ["balance"],
      why: ["The 0% intro period is for a balance you already carry.", "We assume a $3,000 transfer in the sample math."],
      poor: "A poor fit if you do not carry a balance. The intro APR does not help."
    },
    {
      id: "ridge",
      name: "Ridge Secured Builder",
      issuer: "Ridge Credit Union (fake)",
      fee: 0,
      rewards: "1% cash back, $200 deposit",
      best: "Building credit",
      credit: "Limited or fair",
      payout: 40,
      intents: ["build"],
      why: ["It is for a limited or fair credit range.", "The issuer states that range. There is a $200 deposit."],
      poor: "A poor fit if your stated range is Good to excellent."
    }
  ],
  keywords: {
    travel: {
      label: "no annual fee travel card",
      headline: "No annual fee travel cards, ranked by what you would earn",
      social: "Travel cards with no annual fee",
      match: ["atlas", "summit"],
      defaults: { groceries: 400, dining: 250, travel: 300, other: 550, balance: "no", credit: "good", trips: 3 }
    },
    groceries: {
      label: "best cash back card for groceries",
      headline: "Cash back cards for groceries, ranked by yearly value",
      social: "Grocery cash back, ranked for you",
      match: ["harbor", "pine"],
      defaults: { groceries: 500, dining: 150, travel: 50, other: 200, balance: "no", credit: "good", trips: 1 }
    },
    balance: {
      label: "balance transfer card 0 intro",
      headline: "Balance transfer cards with a 0% intro period",
      social: "0% intro balance transfer cards",
      match: ["brook"],
      defaults: { groceries: 300, dining: 200, travel: 50, other: 250, balance: "yes", credit: "good", trips: 1 }
    }
  },
  ab: {
    A: { name: "Variant A, generic list", sessions: 20000, click: 0.09, approve: 0.018, rev: 2.3, cost: 2.1, bounce: 0.58, complaint: 0.004 },
    B: { name: "Variant B, intent match", sessions: 20000, click: 0.125, approve: 0.024, rev: 2.95, cost: 2.1, bounce: 0.49, complaint: 0.004 },
    bad: { name: "Bad variant", sessions: 20000, click: 0.14, approve: 0.026, rev: 3.4, cost: 2.1, bounce: 0.63, complaint: 0.009 }
  }
};
