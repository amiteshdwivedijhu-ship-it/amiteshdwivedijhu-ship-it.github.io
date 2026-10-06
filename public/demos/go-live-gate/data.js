/* Synthetic Ridgeback Freight data only. No real shippers, carriers, or loads. */
window.GLG_SEED = {
  deployment: {
    customer: "Ridgeback Freight Lines",
    customerNote: "Asset-based dry van and reefer carrier (synthetic)",
    agentName: "Rate Confirmation to TMS Load Entry",
    agentType: "Documents",
    owner: "Ami Dwivedi (FD PM)",
    committedGoLive: "2026-10-15",
    daysLeft: 9,
    tmsLabel: "TMS (simulated)",
    onCall: "Ami Dwivedi · FD PM on call through first 30 days"
  },

  workflowSteps: [
    "Rate confirmation arrives by email from the shipper or broker.",
    "CSR opens the rate con and keys a new load into TMS (simulated).",
    "CSR checks customer reference / PO against the rate con.",
    "CSR sets pickup and delivery appointment times.",
    "CSR adds accessorials (detention, fuel, layover) when listed.",
    "CSR confirms the load and sends the tender acknowledgment."
  ],

  fieldMap: [
    { source: "Rate con · Total rate", tms: "Load.rate_total", money: true },
    { source: "Rate con · Linehaul", tms: "Load.linehaul", money: true },
    { source: "Rate con · Accessorials total", tms: "Load.accessorials_total", money: true },
    { source: "Rate con · Customer ref / PO", tms: "Load.customer_ref", money: false, critical: true },
    { source: "Rate con · Pickup appointment", tms: "Load.pickup_appt", money: false, critical: true },
    { source: "Rate con · Delivery appointment", tms: "Load.delivery_appt", money: false, critical: true },
    { source: "Rate con · Origin city/state", tms: "Load.origin", money: false },
    { source: "Rate con · Destination city/state", tms: "Load.destination", money: false },
    { source: "Rate con · Equipment", tms: "Load.equipment", money: false },
    { source: "Rate con · Shipper name", tms: "Load.shipper", money: false }
  ],

  edgeCases: [
    {
      id: "multi-stop",
      name: "Multi-stop rate con",
      detail: "Two or more stops on one rate con. Agent must create one load with ordered stops, not separate loads."
    },
    {
      id: "missing-po",
      name: "Missing customer reference / PO",
      detail: "Some shippers omit PO on the rate con. CSR today leaves the field blank and notes it in comments. Spec must decide: fail closed or accept blank with a flag."
    },
    {
      id: "detention-line",
      name: "Detention line item",
      detail: "Detention appears as a separate accessorial line. Agent must add it to accessorials_total and keep linehaul separate."
    }
  ],

  /* Money + reference critical fields for 100% rule */
  criticalFields: ["rate_total", "linehaul", "accessorials_total", "customer_ref", "pickup_appt", "delivery_appt"],
  otherFields: ["origin", "destination", "equipment", "shipper"],

  /* Seeded exception ids on loads */
  seededExceptions: [
    {
      id: "ex-rate",
      loadId: "RB-1042",
      field: "rate_total",
      title: "Rate off by one digit",
      sourceSnippet: "TOTAL RATE: $2,450.00",
      agentValue: "$2,540.00",
      expectedValue: "$2,450.00",
      businessRule: "Parse total rate from the TOTAL RATE line. Do not swap adjacent digits.",
      ruleFixKey: "rate_digit_swap"
    },
    {
      id: "ex-ref",
      loadId: "RB-1051",
      field: "customer_ref",
      title: "Missing customer reference",
      sourceSnippet: "PO / REF: (blank on rate con)",
      agentValue: "UNKNOWN",
      expectedValue: "(blank · flag for CSR)",
      businessRule: "When PO is absent, leave customer_ref blank and set missing_ref_flag. Do not invent UNKNOWN.",
      ruleFixKey: "missing_po_policy"
    },
    {
      id: "ex-tz",
      loadId: "RB-1055",
      field: "pickup_appt",
      title: "Pickup appointment in the wrong time zone",
      sourceSnippet: "PICKUP: Oct 8, 2026 08:00 CT (Central)",
      agentValue: "2026-10-08T08:00:00Z (treated as UTC)",
      expectedValue: "2026-10-08T13:00:00Z (08:00 CT → UTC)",
      businessRule: "Honor the time zone printed on the rate con. Convert to UTC for TMS storage.",
      ruleFixKey: "pickup_tz"
    }
  ],

  /* Determinism seed: mismatches until rate_digit_swap is fixed */
  determinismMismatchField: "rate_total",
  determinismMismatchLoadId: "RB-1042",

  shippers: [
    "Northfield Foods",
    "Calder Paper",
    "Summit Cold Chain",
    "Harbor Grain Co",
    "Pinecrest Packaging",
    "Lakeside Produce",
    "Redline Auto Parts",
    "Westfork Lumber"
  ],

  watchList: [
    "Multi-stop loads with 3+ stops (first week volume unknown)",
    "Detention accessorials over $200 (CSR review)",
    "Missing PO rate cons from Calder Paper (accepted edge case)",
    "Reefer set-point lines if shipper adds them mid-week"
  ]
};

/** Build ~20 synthetic loads with 3 seeded mismatches */
window.GLG_buildLoads = function (fixedRules) {
  fixedRules = fixedRules || {};
  const shippers = window.GLG_SEED.shippers;
  const origins = [
    "Dallas, TX", "Chicago, IL", "Atlanta, GA", "Kansas City, MO",
    "Memphis, TN", "Omaha, NE", "Indianapolis, IN", "Nashville, TN"
  ];
  const dests = [
    "Phoenix, AZ", "Denver, CO", "Columbus, OH", "Charlotte, NC",
    "Minneapolis, MN", "St. Louis, MO", "Louisville, KY", "Oklahoma City, OK"
  ];
  const equipment = ["Dry van 53'", "Reefer 53'", "Dry van 53'", "Reefer 53'"];

  const loads = [];
  const baseIds = [];
  for (let i = 0; i < 20; i++) {
    baseIds.push("RB-" + (1040 + i));
  }

  const exceptionByLoad = {};
  window.GLG_SEED.seededExceptions.forEach(function (ex) {
    exceptionByLoad[ex.loadId] = ex;
  });

  baseIds.forEach(function (id, i) {
    const rate = 1800 + (i * 73) % 900;
    const accessorials = i % 4 === 0 ? 150 : i % 5 === 0 ? 75 : 0;
    const linehaul = rate - accessorials;
    const ref = i % 7 === 3 ? "" : "PO-" + (8800 + i);
    const pickupLocal = "2026-10-" + String(8 + (i % 5)).padStart(2, "0") + "T08:00";
    const deliveryLocal = "2026-10-" + String(9 + (i % 5)).padStart(2, "0") + "T14:00";

    const expected = {
      rate_total: "$" + rate.toLocaleString("en-US") + ".00",
      linehaul: "$" + linehaul.toLocaleString("en-US") + ".00",
      accessorials_total: accessorials ? "$" + accessorials.toLocaleString("en-US") + ".00" : "$0.00",
      customer_ref: ref || "(blank)",
      pickup_appt: pickupLocal + " CT → UTC",
      delivery_appt: deliveryLocal + " CT → UTC",
      origin: origins[i % origins.length],
      destination: dests[i % dests.length],
      equipment: equipment[i % equipment.length],
      shipper: shippers[i % shippers.length]
    };

    const agent = Object.assign({}, expected);
    let hasException = false;
    let exceptionId = null;

    const seeded = exceptionByLoad[id];
    if (seeded) {
      if (seeded.id === "ex-rate" && !fixedRules.rate_digit_swap) {
        agent.rate_total = "$" + (rate + 90).toLocaleString("en-US") + ".00";
        hasException = true;
        exceptionId = "ex-rate";
      } else if (seeded.id === "ex-ref" && !fixedRules.missing_po_policy && !fixedRules.accept_missing_po) {
        agent.customer_ref = "UNKNOWN";
        expected.customer_ref = "(blank · flag for CSR)";
        hasException = true;
        exceptionId = "ex-ref";
      } else if (seeded.id === "ex-ref" && fixedRules.accept_missing_po) {
        agent.customer_ref = "(blank · flag for CSR)";
        expected.customer_ref = "(blank · flag for CSR)";
      } else if (seeded.id === "ex-ref" && fixedRules.missing_po_policy) {
        agent.customer_ref = "(blank · flag for CSR)";
        expected.customer_ref = "(blank · flag for CSR)";
      } else if (seeded.id === "ex-tz" && !fixedRules.pickup_tz) {
        agent.pickup_appt = pickupLocal.replace("T", "T") + " (as UTC, wrong)";
        expected.pickup_appt = pickupLocal + " CT → UTC";
        hasException = true;
        exceptionId = "ex-tz";
      }
    }

    /* After accept missing PO as edge case, expected and agent align */
    if (seeded && seeded.id === "ex-ref" && fixedRules.accept_missing_po) {
      hasException = false;
      exceptionId = null;
    }

    loads.push({
      id: id,
      shipper: expected.shipper,
      expected: expected,
      agent: agent,
      hasException: hasException,
      exceptionId: exceptionId,
      fields: Object.keys(expected)
    });
  });

  return loads;
};
