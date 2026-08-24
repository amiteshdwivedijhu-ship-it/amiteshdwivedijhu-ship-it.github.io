window.NDA_MANIFEST = {
 "schema_version": 1,
 "documents": [
  {
   "id": "610",
   "title": "Balanced mutual baseline",
   "agreement_type": "Mutual transaction NDA",
   "overview": "A conventional mutual NDA for evaluating a transaction. It protects business and technical information disclosed by either party, covers written and oral disclosures, includes all four standard exclusions, and keeps confidentiality obligations in place for 18 months under Delaware law.",
   "features": ["Mutual obligations", "18-month survival", "All 4 carve-outs", "Delaware law"],
   "why_selected": "This is the clean baseline. Its extracted clauses fit the playbook in eligible contexts, so it isolates the effect of context and the separate shadow-risk review without a conspicuous contractual outlier.",
   "descriptor": "Mutual NDA, 18-month Term, all four Carve-outs, and Delaware law. Every Tier is acceptable in eligible cells; the Shadow Judge blocks automatic approval.",
   "summary": {
    "n_cells": 144,
    "n_distinct_outcomes": 8,
    "distinct_routing_decisions": [
     "flag"
    ],
    "n_distinct_plans": 5,
    "eligible_cells": 81,
    "auto_approve_cells": 0,
    "auto_approve_rate": 0.0
   }
  },
  {
   "id": "12",
   "title": "Customer non-solicit rider",
   "agreement_type": "One-way commercial NDA",
   "overview": "A one-way agreement protecting a client's personal, financial, formulation, and product information. The core confidentiality language is otherwise recognizable: a one-year survival period, four standard carve-outs, and New York law. It also prohibits the recipient from approaching the client's private-label condiment customers.",
   "features": ["One-way duties", "1-year survival", "Customer non-solicit", "New York law"],
   "why_selected": "The non-solicit tests whether the product notices obligations outside the expected confidentiality clauses. Along with the one-sided irreparable-harm language, it should change the route even though the standard carve-outs are present.",
   "descriptor": "One-way NDA with a customer non-solicit rider (unacceptable outright); the Shadow Judge flags a one-sided irreparable-harm stipulation.",
   "summary": {
    "n_cells": 144,
    "n_distinct_outcomes": 14,
    "distinct_routing_decisions": [
     "escalate",
     "flag"
    ],
    "n_distinct_plans": 8,
    "eligible_cells": 81,
    "auto_approve_cells": 0,
    "auto_approve_rate": 0.0
   }
  },
  {
   "id": "9",
   "title": "Missing protections",
   "agreement_type": "One-way vendor NDA",
   "overview": "A vendor agreement covering confidential student information in a FERPA-regulated setting. It protects only the counterparty, applies confidentiality perpetually to all information, and includes only the legally compelled disclosure exception, leaving publicly known, independently developed, and rightfully received information unaddressed.",
   "features": ["One-way duties", "Perpetual scope", "3 carve-outs absent", "Massachusetts forum"],
   "why_selected": "Missing protections make this the absence-detection stress case. The risk comes from what the agreement leaves out, and the playbook's compounding rule should recognize the combination.",
   "descriptor": "One-way NDA, perpetual over all information, with three of four Carve-outs missing. Absence Findings and Compounding Rule CR-1 fire.",
   "summary": {
    "n_cells": 144,
    "n_distinct_outcomes": 8,
    "distinct_routing_decisions": [
     "escalate",
     "flag"
    ],
    "n_distinct_plans": 2,
    "eligible_cells": 81,
    "auto_approve_cells": 0,
    "auto_approve_rate": 0.0
   }
  },
  {
   "id": "20",
   "title": "Context-sensitive foreign law",
   "agreement_type": "Mutual technology NDA",
   "overview": "A broad mutual NDA covering research, inventions, manufacturing methods, software, customer information, and oral disclosures. It includes all four standard carve-outs and a five-year survival period, but selects Swedish law rather than a U.S. jurisdiction.",
   "features": ["Mutual obligations", "5-year survival", "All 4 carve-outs", "Swedish law"],
   "why_selected": "The fixed text makes this the clearest context experiment. The same foreign-law clause moves from negotiable to unacceptable when the counterparty or information type raises the playbook's risk threshold.",
   "descriptor": "Mutual NDA, five-year Term, and Swedish Governing Law. It is negotiable in most cells and unacceptable where the counterparty is a competitor or the data is source code.",
   "summary": {
    "n_cells": 144,
    "n_distinct_outcomes": 8,
    "distinct_routing_decisions": [
     "escalate",
     "flag"
    ],
    "n_distinct_plans": 8,
    "eligible_cells": 81,
    "auto_approve_cells": 0,
    "auto_approve_rate": 0.0
   }
  },
  {
   "id": "7",
   "title": "Embedded IP assignment",
   "agreement_type": "Mutual technology NDA",
   "overview": "A mutual NDA with a five-year term and Singapore governing law. Confidential information generally must be marked in writing, oral disclosures need written confirmation within 15 days, and a separate clause requires the recipient to assign certain registrations and applications to the discloser at no cost.",
   "features": ["Mutual obligations", "5-year survival", "IP assignment", "Singapore law"],
   "why_selected": "The assignment obligation makes this the hidden-rider test. It sits far outside ordinary NDA confidentiality mechanics and checks whether the system escalates a clause a fast reviewer might overlook.",
   "descriptor": "Mutual NDA carrying an IP assignment clause under Singapore law. It has two unacceptable Clause Types and 30 Shadow Judge risks.",
   "summary": {
    "n_cells": 144,
    "n_distinct_outcomes": 4,
    "distinct_routing_decisions": [
     "escalate",
     "flag"
    ],
    "n_distinct_plans": 4,
    "eligible_cells": 81,
    "auto_approve_cells": 0,
    "auto_approve_rate": 0.0
   }
  },
  {
   "id": "152",
   "title": "Long-tail mutual NDA",
   "agreement_type": "Mutual biotech NDA",
   "overview": "A mutual NDA for proprietary business, customer, and trade-secret information. Its confidentiality obligation lasts ten years, Canadian law can apply depending on which party brings suit, and the definition includes only two of the four standard carve-outs: publicly known and legally compelled information.",
   "features": ["Mutual obligations", "10-year survival", "2 carve-outs absent", "Canadian law"],
   "why_selected": "This case represents the ambiguous long tail. No single clause is as conspicuous as an IP assignment, but the long term, missing exclusions, and foreign-law mechanism combine into a document that needs review.",
   "descriptor": "Mutual non-analysis NDA with a ten-year Term under Canadian law and two Carve-outs absent; the combination requires review.",
   "summary": {
    "n_cells": 144,
    "n_distinct_outcomes": 8,
    "distinct_routing_decisions": [
     "escalate",
     "flag"
    ],
    "n_distinct_plans": 2,
    "eligible_cells": 81,
    "auto_approve_cells": 0,
    "auto_approve_rate": 0.0
   }
  }
 ],
 "provenance": {
  "source": "ContractNLI dev split (CC BY 4.0)",
  "extraction": "google/gemini-3.7-flash, prompt v5",
  "absence_detector": "google/gemini-3.7-flash, prompt v5, Search Budget 5",
  "shadow_judge": "anthropic/claude-opus-5:batch, prompt v1"
 }
};
