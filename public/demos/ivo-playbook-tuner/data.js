/* Synthetic Corvid Systems negotiations. Not real contracts. Not legal advice. */
(function () {
  const names = ["Northline Analytics", "Paperbark Labs", "Kindling Cloud", "Sable Route", "Harbormint", "Lowcountry Soft", "Bright Parcel", "Oddment Systems", "Yellowdeck", "Marrow and Co", "Fenceline Data", "Copper Lantern", "Woolly Orbit", "Pebble Meter", "Redcedar Apps", "Kindred Dock", "Smallwheel", "Open Kiln", "Brass Current", "Linden Stack", "Quiet Acre", "Novice Peak", "Amber Field", "Second Wharf", "Plainroom", "Kite Municipal", "Hollow Grain", "Upper Meadow", "Blue Ledger", "Tin Sparrow"];
  const deals = [];
  let n = 1;

  function add(count, spec) {
    for (let i = 0; i < count; i += 1) {
      const band = spec.band;
      const acv = band === "under" ? 24000 + ((n * 1300) % 70000) : band === "mid" ? 120000 + ((n * 5000) % 340000) : 560000 + ((n * 15000) % 900000);
      deals.push({
        id: "MSA-" + String(n).padStart(4, "0"),
        counterparty: names[n % names.length] + " " + ((n % 9) + 1),
        acv: acv,
        band: band,
        daysToSign: 16 + spec.lol.daysAdded + (n % 5),
        turns: 4 + spec.lol.turnsAdded + spec.payment.turnsAdded,
        handlesPersonalData: !!spec.personal,
        worseSmall: !!spec.worseSmall,
        worseAll: !!spec.worseAll,
        provisions: {
          lol: spec.lol,
          indemnity: spec.indemnity,
          payment: spec.payment,
          renewal: spec.renewal,
          data: spec.data
        }
      });
      n += 1;
    }
  }

  function lol(final, turns, days, approver) {
    return { start: "1x", final: final, turnsAdded: turns, approver: approver, daysAdded: days };
  }
  function pay(final, turns, approver) {
    return { start: "Net 30", final: final, turnsAdded: turns, approver: approver };
  }
  function ind(final, turns, approver) {
    return { start: "Mutual, IP and data", final: final, turnsAdded: turns, approver: approver };
  }
  function ren(final, turns, approver) {
    return { start: "30 day notice", final: final, turnsAdded: turns, approver: approver };
  }
  function dat(final, turns, approver) {
    return { start: "48 hour notice", final: final, turnsAdded: turns, approver: approver };
  }

  const keepPay = pay("Net 30", 0, "");
  const givePay = pay("Net 45", 2, "Finance");
  const keepInd = ind("Mutual, IP and data", 0, "");
  const giveInd = ind("Mutual, plus negligence", 3, "Security");
  const keepRen = ren("30 day notice", 0, "");
  const giveRen = ren("60 day notice", 3, "Commercial");
  const keepData = dat("48 hour notice", 0, "");
  const giveData = dat("72 hour notice", 2, "Privacy");

  /* Under $100K liability: 46 deals, 36 end at 2x, 9 handle personal data, 2 closed at 1x after one push. */
  add(28, { band: "under", personal: false, lol: lol("2x", 3, 7, "Finance"), payment: givePay, indemnity: giveInd, renewal: keepRen, data: keepData });
  add(2, { band: "under", personal: false, lol: lol("2x", 4, 7, "Finance"), payment: givePay, indemnity: keepInd, renewal: keepRen, data: keepData });
  add(5, { band: "under", personal: false, lol: lol("2x", 3, 6, "Finance"), payment: keepPay, indemnity: keepInd, renewal: giveRen, data: keepData });
  add(1, { band: "under", personal: true, lol: lol("2x", 3, 6, "Security"), payment: givePay, indemnity: keepInd, renewal: keepRen, data: giveData });
  add(8, { band: "under", personal: true, lol: lol("1x", 1, 3, "Privacy"), payment: keepPay, indemnity: keepInd, renewal: keepRen, data: keepData });
  add(2, { band: "under", personal: false, worseSmall: true, lol: lol("1x", 1, 3, "Finance"), payment: givePay, indemnity: keepInd, renewal: keepRen, data: keepData });

  /* Mid band, 44 deals. Liability conceded on 18. */
  add(18, { band: "mid", personal: false, lol: lol("2x", 2, 4, "Finance"), payment: givePay, indemnity: keepInd, renewal: keepRen, data: keepData });
  add(16, { band: "mid", personal: false, lol: lol("1x", 1, 2, "Commercial"), payment: givePay, indemnity: giveInd, renewal: keepRen, data: keepData });
  add(10, { band: "mid", personal: false, lol: lol("1x", 1, 2, "Commercial"), payment: keepPay, indemnity: giveInd, renewal: keepRen, data: keepData });

  /* Over $500K, 30 deals. 9 of these are the worse-if-all-bands cases. */
  add(6, { band: "over", personal: false, lol: lol("2x", 2, 5, "Finance"), payment: givePay, indemnity: keepInd, renewal: giveRen, data: keepData });
  add(9, { band: "over", personal: true, worseAll: true, lol: lol("1x", 1, 2, "GC"), payment: keepPay, indemnity: keepInd, renewal: keepRen, data: giveData });
  add(15, { band: "over", personal: false, lol: lol("1x", 1, 2, "GC"), payment: keepPay, indemnity: keepInd, renewal: keepRen, data: keepData });

  window.IVO_DATA = {
    customer: "Corvid Systems",
    counsel: "Maya Chen (Commercial Counsel)",
    gc: "Rob Alvarez (General Counsel)",
    playbook: "Customer MSA, v14",
    deals: deals,
    provisions: [
      { id: "lol", name: "Limitation of liability", first: "Cap at 1x annual fees", fallback: "Cap at 2x annual fees", walk: "Uncapped" },
      { id: "indemnity", name: "Indemnity", first: "Mutual, IP and data only", fallback: "Mutual, plus negligence", walk: "Uncapped indemnity" },
      { id: "payment", name: "Payment terms", first: "Net 30", fallback: "Net 45", walk: "Net 60" },
      { id: "renewal", name: "Auto-renewal", first: "Renews for 1 year, 30 day notice", fallback: "Renews for 1 year, 60 day notice", walk: "No auto-renew" },
      { id: "data", name: "Data protection", first: "DPA required, breach notice in 48 hours", fallback: "DPA required, breach notice in 72 hours", walk: "No DPA" }
    ],
    proposals: {
      small: {
        id: "small",
        name: "Under $100K, start at 2x",
        support: 46,
        turnsSaved: 110,
        daysFaster: 4,
        worsePct: 4.3,
        worseKey: "worseSmall"
      },
      all: {
        id: "all",
        name: "All bands, start at 2x",
        support: 78,
        turnsSaved: 160,
        daysFaster: 2,
        worsePct: 14,
        worseKey: "worseAll"
      }
    },
    history: [
      { version: "v13", change: "Payment terms fallback moved from net 60 to net 45.", approver: "Rob Alvarez (General Counsel)", evidence: "40 deals had already landed on net 45." },
      { version: "v14", change: "Indemnity fallback narrowed to negligence only.", approver: "Rob Alvarez (General Counsel)", evidence: "Current Customer MSA. Security still reviews IP carve-outs." }
    ]
  };
})();
