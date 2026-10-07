/* Synthetic employer, prices, and assumptions. Not a Care.com product. */
window.CARE_DATA = {
  employer: "Northwind Health Systems",
  buyer: "Lena Brooks",
  employee: { name: "Sam Patel", metro: "Dallas", used: 2 },
  ftShare: 0.8,
  assumptions: [
    ["Take-up", "18% of eligible employees use the benefit at least once a year at the 10-day plan."],
    ["Days used", "Users average 4.5 days a year when the plan offers 10 days."],
    ["In-home gross", "In-home gross cost is $159 per day before the copay."],
    ["Center gross", "Center gross cost is $85 per day before the copay."],
    ["Visit length", "An in-home visit is billed as 8 hours."],
    ["Mix", "55% of care days are in-home and 45% are center."],
    ["Absence", "55% of care days would otherwise have been an absence."],
    ["Clinical value", "One avoided absence day is worth $380 for clinical staff."],
    ["Other value", "One avoided absence day is worth $250 for other staff."],
    ["Clinical share", "30% of uses are clinical staff."],
    ["Peak month", "Peak month demand is yearly care days divided by 12, times 1.25."],
    ["Fill cap", "Fill rate is capped at 100%."],
    ["Partner center", "Each added partner center brings 7 slots a month."],
    ["Demand split", "Yearly care days are split across metros by headcount."]
  ],
  metros: [
    { id: "dallas", name: "Dallas", headcount: 3200, kids: 0.34, shift: 0.55, caregivers: 180, slots: 120 },
    { id: "atlanta", name: "Atlanta", headcount: 1900, kids: 0.31, shift: 0.50, caregivers: 110, slots: 70 },
    { id: "phoenix", name: "Phoenix", headcount: 1500, kids: 0.36, shift: 0.60, caregivers: 60, slots: 43 },
    { id: "chicago", name: "Chicago", headcount: 1100, kids: 0.28, shift: 0.45, caregivers: 70, slots: 50 },
    { id: "remote", name: "Remote", headcount: 300, kids: 0.30, shift: 0, caregivers: null, slots: null }
  ],
  tiers: {
    core: { name: "Core", days: 5, inHome: 12, center: 25, child: true, adult: false, pet: false, eligibility: "ft" },
    plus: { name: "Plus", days: 10, inHome: 8, center: 15, child: true, adult: true, pet: false, eligibility: "all" },
    premier: { name: "Premier", days: 20, inHome: 6, center: 10, child: true, adult: true, pet: true, eligibility: "all" }
  }
};
