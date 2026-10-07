/* Synthetic Fernway Goods feature values. Not a real feature store. */
(function () {
  function feature(name, served, now, offline, source, computedAt, freshness, cacheHit, version, staleWords) {
    return {
      name: name,
      served: served,
      now: now,
      offline: offline,
      source: source,
      computedAt: computedAt,
      freshness: freshness,
      cacheHit: cacheHit,
      version: version,
      staleWords: staleWords || ""
    };
  }

  function pack(prior, priorNow, status, days, daysNow, charge, when) {
    return [
      feature("customer.prior_claims_90d", prior, priorNow, priorNow, "Support tickets", when.priorAt, when.priorFresh, when.priorCache, when.priorVersion, when.priorStale),
      feature("order.status", status, status, status, "Orders DB (Postgres)", when.statusAt, "1 m", "no", "v5", ""),
      feature("order.days_since_delivery", days, daysNow, daysNow, "Orders DB (Postgres)", when.daysAt, "1 m", "no", "v2", when.daysStale || ""),
      feature("payments.chargebacks_365d", charge, charge, charge, "Payments API (simulated)", when.payAt, "15 m", "yes", "v1", ""),
      feature("policy.max_claims_90d", 2, 2, 2, "Refund policy doc v7", "2026-09-01 09:00", "tied to doc version", "yes", "v7", "")
    ];
  }

  const freshWhen = {
    priorAt: "2026-10-06 13:58",
    priorFresh: "5 m",
    priorCache: "no",
    priorVersion: "v3",
    priorStale: "",
    statusAt: "2026-10-06 14:00",
    daysAt: "2026-10-06 14:00",
    payAt: "2026-10-06 13:50"
  };

  function decision(id, order, customer, result, flagged, at, features, reply, reasoning, cause) {
    return { id: id, order: order, customer: customer, result: result, flagged: flagged, at: at, features: features, reply: reply, reasoning: reasoning, cause: cause || null };
  }

  const staleCause = {
    title: "Cached claim count was already wrong",
    events: [
      { at: "07:53", text: "Cache wrote customer.prior_claims_90d = 3." },
      { at: "12:01", text: "A prior claim was reversed. The true count became 2." },
      { at: "14:05", text: "The decision served the cached 3. The value was 6 h 12 m old. Freshness limit was not set, so nothing refreshed the cache." }
    ]
  };

  const heroWhen = {
    priorAt: "2026-10-06 07:53",
    priorFresh: "not set",
    priorCache: "yes",
    priorVersion: "v3",
    priorStale: "6 h 12 m old, limit not set",
    statusAt: "2026-10-06 14:04",
    daysAt: "2026-10-06 14:04",
    payAt: "2026-10-06 13:50"
  };

  const decisions = [
    decision(
      "D-1182",
      "5530",
      "Customer 1842",
      "denied",
      true,
      "2026-10-06 14:05",
      pack(3, 2, "delivered", 12, 12, 0, heroWhen),
      "I can't approve this refund. You have 3 claims in the last 90 days, and the limit is 2.",
      "policy.max_claims_90d is 2. customer.prior_claims_90d served as 3. 3 is over 2, so the agent denied the refund.",
      staleCause
    )
  ];

  const moreStale = [
    ["D-1174", "5511", "Customer 1770", "2026-10-06 11:20"],
    ["D-1166", "5488", "Customer 1694", "2026-10-06 09:14"],
    ["D-1158", "5460", "Customer 1602", "2026-10-05 16:42"]
  ];
  moreStale.forEach(function (row) {
    const when = Object.assign({}, heroWhen, { priorAt: "2026-10-06 05:10", statusAt: row[3], daysAt: row[3] });
    decisions.push(decision(
      row[0], orderNum(row[1]), row[2], "denied", true, row[3],
      pack(3, 2, "delivered", 9, 9, 0, when),
      "Refund denied. Prior claims in 90 days: 3. Limit: 2.",
      "The served claim count is over the policy limit. The current value is 2, which is not over the limit.",
      {
        title: "Same stale cache on prior_claims_90d",
        events: [
          { at: "05:10", text: "Cache wrote prior_claims_90d = 3." },
          { at: "12:01", text: "A claim reversal made the true count 2." },
          { at: row[3].slice(11), text: "Decision " + row[0] + " still served 3. Freshness limit was not set." }
        ]
      }
    ));
  });

  function orderNum(value) { return String(value); }

  decisions.push(decision(
    "D-1170",
    "5496",
    "Customer 1711",
    "denied",
    true,
    "2026-10-06 10:16",
    pack(1, 1, "delivered", 40, 11, 0, Object.assign({}, freshWhen, {
      daysAt: "2026-10-04 08:00",
      daysStale: "2 d 2 h old, limit 1 m"
    })),
    "Refund denied. The order looks 40 days past delivery, past the 30 day window.",
    "order.days_since_delivery was served as 40. The value now is 11. The denial used a stale day count.",
    {
      title: "Delivery age was stale",
      events: [
        { at: "Oct 4 08:00", text: "days_since_delivery cached as 40." },
        { at: "Oct 6 10:16", text: "The true age was 11 days. The 1 minute limit was missed because this resolver read an old cache key." }
      ]
    }
  ));

  decisions.push(decision(
    "D-1162",
    "5472",
    "Customer 1660",
    "approved",
    true,
    "2026-10-05 18:05",
    pack(1, 1, "delivered", 6, 6, 0, freshWhen),
    "Refund approved. The order is delivered and you have 1 prior claim.",
    "The feature values are fresh. The customer flagged the tone of the reply, not the decision.",
    null
  ));

  const fillerCustomers = ["Customer 1501", "Customer 1508", "Customer 1519", "Customer 1524", "Customer 1533", "Customer 1540", "Customer 1552", "Customer 1566"];
  let n = 1148;
  while (decisions.length < 40) {
    const id = "D-" + n;
    n += 1;
    if (decisions.some(function (item) { return item.id === id; })) continue;
    const prior = n % 5 === 0 ? 3 : 1;
    const result = prior > 2 ? "denied" : "approved";
    const hour = 8 + (decisions.length % 8);
    const at = "2026-10-0" + (n % 2 === 0 ? "5" : "6") + " " + String(hour).padStart(2, "0") + ":" + String((n * 3) % 60).padStart(2, "0");
    decisions.push(decision(
      id,
      String(5000 + n),
      fillerCustomers[n % fillerCustomers.length],
      result,
      false,
      at,
      pack(prior, prior, "delivered", 4 + (n % 10), 4 + (n % 10), n % 7 === 0 ? 1 : 0, freshWhen),
      result === "denied"
        ? "Refund denied. Prior claims are over the limit of 2, and the count is fresh."
        : "Refund approved. The order is delivered and the claim count is within policy.",
      "Served values match the current values and the offline training values.",
      null
    ));
  }

  decisions.sort(function (a, b) { return a.at < b.at ? 1 : -1; });

  window.CHALK_DATA = {
    store: "Fernway Goods",
    agent: "Refund Agent",
    decisions: decisions,
    fixes: [
      {
        id: "a",
        name: "Set a 5 minute freshness limit",
        summary: "Keep the cache, but refresh customer.prior_claims_90d when it is older than 5 minutes.",
        code: "# Pseudo-code. Not Chalk SDK code.\nfeature customer.prior_claims_90d:\n  resolver: support_tickets.count\n  max_staleness: 5m   # was: not set\n  version: v4",
        flips: 4,
        newWrong: 0,
        p99Before: 18,
        p99After: 21,
        note: "Four wrong denials flip to approvals. No new wrong denials."
      },
      {
        id: "b",
        name: "Compute online at request time",
        summary: "Skip the cache and count claims when the request arrives.",
        code: "# Pseudo-code. Not Chalk SDK code.\nfeature customer.prior_claims_90d:\n  resolver: support_tickets.count\n  compute: online at request time\n  # simulated p99: 64ms",
        flips: 4,
        newWrong: 0,
        p99Before: 18,
        p99After: 64,
        note: "Same four denials flip, but p99 moves to 64ms. That is over the 50ms budget."
      },
      {
        id: "c",
        name: "Send stale values to a human",
        summary: "If the feature is older than its limit, do not auto-deny. Send the decision to a person.",
        code: "# Pseudo-code. Not Chalk SDK code.\nif feature.age > feature.max_staleness:\n  route: human review\nelse:\n  use served value",
        flips: 0,
        humanReviews: 7,
        newWrong: 0,
        p99Before: 18,
        p99After: 18,
        note: "7 decisions go to a person. 0 new wrong denials. p99 stays 18ms. This adds a human review cost."
      }
    ],
    versions: [
      { version: "v1", note: "Daily batch from support tickets.", shipped: true },
      { version: "v2", note: "Moved to an hourly batch.", shipped: true },
      { version: "v3", note: "Cached for serving. No freshness limit.", shipped: true },
      { version: "v4", note: "", shipped: false }
    ]
  };
})();
