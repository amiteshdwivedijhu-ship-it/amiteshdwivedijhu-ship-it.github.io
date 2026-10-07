/* Synthetic suppliers, products, customers, and prices. Not an Azelis product. */
window.AZELIS_DATA = {
  today: "2026-10-07",
  marginTarget: 0.21,
  customers: [
    { id: "brightwater", name: "Brightwater Generics", segment: "Pharma", product: "VX-MCC 102", volume: 48000, price: 6.2, cost: 4.9, lock: "", am: "Ellen Park" },
    { id: "halden", name: "Halden Labs", segment: "Pharma", product: "VX-MCC 102", volume: 22000, price: 6.45, cost: 4.9, lock: "Jun 30, 2027", am: "Ellen Park" },
    { id: "summit", name: "Summit Nutra", segment: "Nutraceutical", product: "VX-MCC 200", volume: 15000, price: 7.1, cost: 5.6, lock: "", am: "Raj Mehta" },
    { id: "osprey", name: "Osprey Therapeutics", segment: "Pharma", product: "VX-MCC 200", volume: 9000, price: 7.4, cost: 5.6, lock: "", am: "Raj Mehta" },
    { id: "corvid", name: "Corvid Pharma", segment: "Pharma", product: "KP-220", volume: 3200, price: 38, cost: 29.5, lock: "", am: "Raj Mehta" },
    { id: "linden", name: "Linden Biotech", segment: "Pharma", product: "KP-220", volume: 1100, price: 41, cost: 29.5, lock: "", am: "Tom Alvarez" },
    { id: "greenfield", name: "Greenfield Vitamins", segment: "Nutraceutical", product: "OA-Zinc Gluconate USP", volume: 6000, price: 14.8, cost: 11.2, lock: "", am: "Tom Alvarez" },
    { id: "marlow", name: "Marlow Health", segment: "Nutraceutical", product: "OA-Zinc Gluconate USP", volume: 2500, price: 15.2, cost: 11.2, lock: "", am: "Ellen Park" }
  ],
  notices: [
    {
      id: "N-301",
      principal: "Verano Excipients",
      kind: "price",
      products: ["VX-MCC 102", "VX-MCC 200"],
      pct: { "VX-MCC 102": 0.06, "VX-MCC 200": 0.045 },
      effective: "2027-01-01",
      effectiveLabel: "January 1, 2027",
      lines: [
        "Verano Excipients notice N-301.",
        "Effective January 1, 2027, list price for VX-MCC 102 (microcrystalline cellulose, 25 kg bag) increases 6.0%.",
        "VX-MCC 200 increases 4.5%.",
        "Pack sizes unchanged."
      ],
      fields: [
        { id: "principal", label: "Principal", value: "Verano Excipients", line: 0, token: "Verano Excipients" },
        { id: "type", label: "Change type", value: "Price increase", line: 1, token: "increases" },
        { id: "date", label: "Effective date", value: "January 1, 2027", line: 1, token: "January 1, 2027" },
        { id: "mcc102", label: "VX-MCC 102", value: "Increases 6.0%", line: 1, token: "VX-MCC 102" },
        { id: "mcc200", label: "VX-MCC 200", value: "Increases 4.5%", line: 2, token: "VX-MCC 200" },
        { id: "pack", label: "Pack size", value: "Unchanged", line: 3, token: "Pack sizes unchanged" }
      ]
    },
    {
      id: "N-302",
      principal: "Kestrel Polymers",
      kind: "stop",
      products: ["KP-220"],
      pct: {},
      effective: "2027-03-31",
      effectiveLabel: "March 31, 2027",
      alt: { code: "KP-240", note: "Same film coating family in this sample book." },
      lines: [
        "Kestrel Polymers notice N-302.",
        "Grade KP-220 (film coating polymer) will be discontinued.",
        "Last orders accepted March 31, 2027.",
        "Suggested replacement: KP-240."
      ],
      fields: [
        { id: "principal", label: "Principal", value: "Kestrel Polymers", line: 0, token: "Kestrel Polymers" },
        { id: "type", label: "Change type", value: "Discontinuation", line: 1, token: "discontinued" },
        { id: "code", label: "Product code", value: "KP-220", line: 1, token: "KP-220" },
        { id: "date", label: "Last order date", value: "March 31, 2027", line: 2, token: "March 31, 2027" },
        { id: "alt", label: "Suggested replacement", value: "KP-240", line: 3, token: "KP-240" }
      ]
    },
    {
      id: "N-303",
      principal: "Ostrava Actives",
      kind: "lead",
      products: ["OA-Zinc Gluconate USP"],
      pct: {},
      effective: "2026-11-15",
      effectiveLabel: "November 15, 2026",
      lines: [
        "Ostrava Actives notice N-303.",
        "Standard lead time for OA-Zinc Gluconate USP moves from 8 weeks to 14 weeks starting November 15, 2026, due to plant maintenance."
      ],
      fields: [
        { id: "principal", label: "Principal", value: "Ostrava Actives", line: 0, token: "Ostrava Actives" },
        { id: "type", label: "Change type", value: "Lead time change", line: 1, token: "lead time" },
        { id: "code", label: "Product code", value: "OA-Zinc Gluconate USP", line: 1, token: "OA-Zinc Gluconate USP" },
        { id: "date", label: "Effective date", value: "November 15, 2026", line: 1, token: "November 15, 2026" },
        { id: "lead", label: "Lead time", value: "8 weeks to 14 weeks", line: 1, token: "8 weeks to 14 weeks" }
      ]
    }
  ]
};
