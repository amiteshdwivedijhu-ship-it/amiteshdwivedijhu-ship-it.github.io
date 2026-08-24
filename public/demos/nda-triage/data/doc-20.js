window.NDA_DOC_20 = {
 "document_id": "20",
 "schema_version": 1,
 "clauses": [
  {
   "clause_type": "mutuality",
   "span": "For the purpose of this Agreement, \u201cConfidential Information\u201d means any information received by a Party (the \u201cReceiving Party\u201d) regarding the other Party\u2019s (the \u201cDisclosing Party\u201d) business, research, products and/or services, such as all information and technology, including without limitation, research, inventions, manufacture methods, data, designs, plans, drawings, know-how, IT systems, software, processes, schematics, blueprints, records, reports, models, prototypes and descriptions related thereto, customers, partners, as well as the terms and conditions of this Agreement and information furnished during discussions or oral presentations, whether or not designated as confidential at the time of disclosure.",
   "attributes": {
    "clause_type": "mutuality",
    "direction": "mutual"
   }
  },
  {
   "clause_type": "term_survival",
   "span": "This Agreement shall remain in force and effect for [one (1)] year when duly signed by both Parties, provided, however that the confidentiality obligations imposed on the Receiving Party under this Agreement shall continue for a period of [five (5)] years after termination of the Agreement, except to the extent this Agreement is superseded by stipulations of a contemplated agreement.",
   "attributes": {
    "clause_type": "term_survival",
    "term_years": 5.0,
    "perpetual_scope": "none"
   }
  },
  {
   "clause_type": "confidentiality_definition",
   "span": "For the purpose of this Agreement, \u201cConfidential Information\u201d means any information received by a Party (the \u201cReceiving Party\u201d) regarding the other Party\u2019s (the \u201cDisclosing Party\u201d) business, research, products and/or services, such as all information and technology, including without limitation, research, inventions, manufacture methods, data, designs, plans, drawings, know-how, IT systems, software, processes, schematics, blueprints, records, reports, models, prototypes and descriptions related thereto, customers, partners, as well as the terms and conditions of this Agreement and information furnished during discussions or oral presentations, whether or not designated as confidential at the time of disclosure.",
   "attributes": {
    "clause_type": "confidentiality_definition",
    "carveouts": [
     "publicly_known",
     "rightfully_received",
     "legally_compelled",
     "independently_developed"
    ],
    "oral_disclosure_covered": true
   }
  },
  {
   "clause_type": "governing_law",
   "span": "This Agreement shall be construed in accordance with and be governed by the substantive laws of Sweden.",
   "attributes": {
    "clause_type": "governing_law",
    "jurisdiction": "Sweden",
    "us_jurisdiction": false
   }
  }
 ],
 "contexts": {
  "our_role": [
   "discloser",
   "recipient",
   "mutual"
  ],
  "data_class": [
   "general_business",
   "technical",
   "source_code",
   "customer_data"
  ],
  "counterparty_type": [
   "customer",
   "vendor",
   "partner",
   "competitor"
  ],
  "leverage": [
   "low",
   "medium",
   "high"
  ]
 },
 "tiers_by_context": {
  "discloser|general_business|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "discloser|general_business|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "discloser|general_business|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "discloser|general_business|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "discloser|technical|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "discloser|technical|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "discloser|technical|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "discloser|technical|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "discloser|source_code|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "discloser|source_code|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "discloser|source_code|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "discloser|source_code|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "discloser|customer_data|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "discloser|customer_data|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "discloser|customer_data|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "discloser|customer_data|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "recipient|general_business|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "recipient|general_business|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "recipient|general_business|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "recipient|general_business|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "recipient|technical|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "recipient|technical|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "recipient|technical|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "recipient|technical|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "recipient|source_code|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "recipient|source_code|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "recipient|source_code|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "recipient|source_code|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "recipient|customer_data|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "recipient|customer_data|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "recipient|customer_data|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "recipient|customer_data|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "mutual|general_business|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "mutual|general_business|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "mutual|general_business|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "mutual|general_business|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "mutual|technical|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "mutual|technical|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "mutual|technical|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "mutual|technical|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "mutual|source_code|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "mutual|source_code|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "mutual|source_code|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "mutual|source_code|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  },
  "mutual|customer_data|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "mutual|customer_data|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "mutual|customer_data|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-3"
   }
  },
  "mutual|customer_data|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "unacceptable",
    "rule_id": "GL-3"
   }
  }
 },
 "replay": {
  "outcomes": [
   {
    "routing_decision": "flag",
    "autonomy_eligible": true,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "acceptable",
      "rule_id": "MUT-1"
     },
     {
      "clause_type": "term_survival",
      "tier": "negotiable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "acceptable",
      "rule_id": "CD-1"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-3"
     }
    ],
    "plan": {
     "must_fix": [],
     "concede": [
      "term_survival",
      "governing_law"
     ],
     "priority_fight": "term_survival"
    }
   },
   {
    "routing_decision": "flag",
    "autonomy_eligible": true,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "acceptable",
      "rule_id": "MUT-1"
     },
     {
      "clause_type": "term_survival",
      "tier": "negotiable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "acceptable",
      "rule_id": "CD-1"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-3"
     }
    ],
    "plan": {
     "must_fix": [
      "term_survival",
      "governing_law"
     ],
     "concede": [],
     "priority_fight": null
    }
   },
   {
    "routing_decision": "escalate",
    "autonomy_eligible": false,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "acceptable",
      "rule_id": "MUT-1"
     },
     {
      "clause_type": "term_survival",
      "tier": "negotiable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "acceptable",
      "rule_id": "CD-1"
     },
     {
      "clause_type": "governing_law",
      "tier": "unacceptable",
      "rule_id": "GL-3"
     }
    ],
    "plan": {
     "must_fix": [
      "governing_law"
     ],
     "concede": [
      "term_survival"
     ],
     "priority_fight": "term_survival"
    }
   },
   {
    "routing_decision": "flag",
    "autonomy_eligible": false,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "acceptable",
      "rule_id": "MUT-1"
     },
     {
      "clause_type": "term_survival",
      "tier": "negotiable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "acceptable",
      "rule_id": "CD-1"
     },
     {
      "clause_type": "governing_law",
      "tier": "unacceptable",
      "rule_id": "GL-3"
     }
    ],
    "plan": {
     "must_fix": [
      "governing_law",
      "term_survival"
     ],
     "concede": [],
     "priority_fight": null
    }
   },
   {
    "routing_decision": "flag",
    "autonomy_eligible": true,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "acceptable",
      "rule_id": "MUT-1"
     },
     {
      "clause_type": "term_survival",
      "tier": "negotiable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "negotiable",
      "rule_id": "CD-4"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-3"
     }
    ],
    "plan": {
     "must_fix": [],
     "concede": [
      "term_survival",
      "confidentiality_definition",
      "governing_law"
     ],
     "priority_fight": "term_survival"
    }
   },
   {
    "routing_decision": "flag",
    "autonomy_eligible": true,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "acceptable",
      "rule_id": "MUT-1"
     },
     {
      "clause_type": "term_survival",
      "tier": "negotiable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "negotiable",
      "rule_id": "CD-4"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-3"
     }
    ],
    "plan": {
     "must_fix": [
      "term_survival",
      "confidentiality_definition",
      "governing_law"
     ],
     "concede": [],
     "priority_fight": null
    }
   },
   {
    "routing_decision": "escalate",
    "autonomy_eligible": false,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "acceptable",
      "rule_id": "MUT-1"
     },
     {
      "clause_type": "term_survival",
      "tier": "negotiable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "negotiable",
      "rule_id": "CD-4"
     },
     {
      "clause_type": "governing_law",
      "tier": "unacceptable",
      "rule_id": "GL-3"
     }
    ],
    "plan": {
     "must_fix": [
      "governing_law"
     ],
     "concede": [
      "term_survival",
      "confidentiality_definition"
     ],
     "priority_fight": "term_survival"
    }
   },
   {
    "routing_decision": "flag",
    "autonomy_eligible": false,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "acceptable",
      "rule_id": "MUT-1"
     },
     {
      "clause_type": "term_survival",
      "tier": "negotiable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "negotiable",
      "rule_id": "CD-4"
     },
     {
      "clause_type": "governing_law",
      "tier": "unacceptable",
      "rule_id": "GL-3"
     }
    ],
    "plan": {
     "must_fix": [
      "governing_law",
      "term_survival",
      "confidentiality_definition"
     ],
     "concede": [],
     "priority_fight": null
    }
   }
  ],
  "cells": {
   "discloser|general_business|customer|low": 0,
   "discloser|general_business|customer|medium": 1,
   "discloser|general_business|customer|high": 1,
   "discloser|general_business|vendor|low": 0,
   "discloser|general_business|vendor|medium": 1,
   "discloser|general_business|vendor|high": 1,
   "discloser|general_business|partner|low": 0,
   "discloser|general_business|partner|medium": 1,
   "discloser|general_business|partner|high": 1,
   "discloser|general_business|competitor|low": 2,
   "discloser|general_business|competitor|medium": 3,
   "discloser|general_business|competitor|high": 3,
   "discloser|technical|customer|low": 0,
   "discloser|technical|customer|medium": 1,
   "discloser|technical|customer|high": 1,
   "discloser|technical|vendor|low": 0,
   "discloser|technical|vendor|medium": 1,
   "discloser|technical|vendor|high": 1,
   "discloser|technical|partner|low": 0,
   "discloser|technical|partner|medium": 1,
   "discloser|technical|partner|high": 1,
   "discloser|technical|competitor|low": 2,
   "discloser|technical|competitor|medium": 3,
   "discloser|technical|competitor|high": 3,
   "discloser|source_code|customer|low": 2,
   "discloser|source_code|customer|medium": 3,
   "discloser|source_code|customer|high": 3,
   "discloser|source_code|vendor|low": 2,
   "discloser|source_code|vendor|medium": 3,
   "discloser|source_code|vendor|high": 3,
   "discloser|source_code|partner|low": 2,
   "discloser|source_code|partner|medium": 3,
   "discloser|source_code|partner|high": 3,
   "discloser|source_code|competitor|low": 2,
   "discloser|source_code|competitor|medium": 3,
   "discloser|source_code|competitor|high": 3,
   "discloser|customer_data|customer|low": 0,
   "discloser|customer_data|customer|medium": 1,
   "discloser|customer_data|customer|high": 1,
   "discloser|customer_data|vendor|low": 0,
   "discloser|customer_data|vendor|medium": 1,
   "discloser|customer_data|vendor|high": 1,
   "discloser|customer_data|partner|low": 0,
   "discloser|customer_data|partner|medium": 1,
   "discloser|customer_data|partner|high": 1,
   "discloser|customer_data|competitor|low": 2,
   "discloser|customer_data|competitor|medium": 3,
   "discloser|customer_data|competitor|high": 3,
   "recipient|general_business|customer|low": 4,
   "recipient|general_business|customer|medium": 5,
   "recipient|general_business|customer|high": 5,
   "recipient|general_business|vendor|low": 4,
   "recipient|general_business|vendor|medium": 5,
   "recipient|general_business|vendor|high": 5,
   "recipient|general_business|partner|low": 4,
   "recipient|general_business|partner|medium": 5,
   "recipient|general_business|partner|high": 5,
   "recipient|general_business|competitor|low": 6,
   "recipient|general_business|competitor|medium": 7,
   "recipient|general_business|competitor|high": 7,
   "recipient|technical|customer|low": 4,
   "recipient|technical|customer|medium": 5,
   "recipient|technical|customer|high": 5,
   "recipient|technical|vendor|low": 4,
   "recipient|technical|vendor|medium": 5,
   "recipient|technical|vendor|high": 5,
   "recipient|technical|partner|low": 4,
   "recipient|technical|partner|medium": 5,
   "recipient|technical|partner|high": 5,
   "recipient|technical|competitor|low": 6,
   "recipient|technical|competitor|medium": 7,
   "recipient|technical|competitor|high": 7,
   "recipient|source_code|customer|low": 6,
   "recipient|source_code|customer|medium": 7,
   "recipient|source_code|customer|high": 7,
   "recipient|source_code|vendor|low": 6,
   "recipient|source_code|vendor|medium": 7,
   "recipient|source_code|vendor|high": 7,
   "recipient|source_code|partner|low": 6,
   "recipient|source_code|partner|medium": 7,
   "recipient|source_code|partner|high": 7,
   "recipient|source_code|competitor|low": 6,
   "recipient|source_code|competitor|medium": 7,
   "recipient|source_code|competitor|high": 7,
   "recipient|customer_data|customer|low": 4,
   "recipient|customer_data|customer|medium": 5,
   "recipient|customer_data|customer|high": 5,
   "recipient|customer_data|vendor|low": 4,
   "recipient|customer_data|vendor|medium": 5,
   "recipient|customer_data|vendor|high": 5,
   "recipient|customer_data|partner|low": 4,
   "recipient|customer_data|partner|medium": 5,
   "recipient|customer_data|partner|high": 5,
   "recipient|customer_data|competitor|low": 6,
   "recipient|customer_data|competitor|medium": 7,
   "recipient|customer_data|competitor|high": 7,
   "mutual|general_business|customer|low": 4,
   "mutual|general_business|customer|medium": 5,
   "mutual|general_business|customer|high": 5,
   "mutual|general_business|vendor|low": 4,
   "mutual|general_business|vendor|medium": 5,
   "mutual|general_business|vendor|high": 5,
   "mutual|general_business|partner|low": 4,
   "mutual|general_business|partner|medium": 5,
   "mutual|general_business|partner|high": 5,
   "mutual|general_business|competitor|low": 6,
   "mutual|general_business|competitor|medium": 7,
   "mutual|general_business|competitor|high": 7,
   "mutual|technical|customer|low": 4,
   "mutual|technical|customer|medium": 5,
   "mutual|technical|customer|high": 5,
   "mutual|technical|vendor|low": 4,
   "mutual|technical|vendor|medium": 5,
   "mutual|technical|vendor|high": 5,
   "mutual|technical|partner|low": 4,
   "mutual|technical|partner|medium": 5,
   "mutual|technical|partner|high": 5,
   "mutual|technical|competitor|low": 6,
   "mutual|technical|competitor|medium": 7,
   "mutual|technical|competitor|high": 7,
   "mutual|source_code|customer|low": 6,
   "mutual|source_code|customer|medium": 7,
   "mutual|source_code|customer|high": 7,
   "mutual|source_code|vendor|low": 6,
   "mutual|source_code|vendor|medium": 7,
   "mutual|source_code|vendor|high": 7,
   "mutual|source_code|partner|low": 6,
   "mutual|source_code|partner|medium": 7,
   "mutual|source_code|partner|high": 7,
   "mutual|source_code|competitor|low": 6,
   "mutual|source_code|competitor|medium": 7,
   "mutual|source_code|competitor|high": 7,
   "mutual|customer_data|customer|low": 4,
   "mutual|customer_data|customer|medium": 5,
   "mutual|customer_data|customer|high": 5,
   "mutual|customer_data|vendor|low": 4,
   "mutual|customer_data|vendor|medium": 5,
   "mutual|customer_data|vendor|high": 5,
   "mutual|customer_data|partner|low": 4,
   "mutual|customer_data|partner|medium": 5,
   "mutual|customer_data|partner|high": 5,
   "mutual|customer_data|competitor|low": 6,
   "mutual|customer_data|competitor|medium": 7,
   "mutual|customer_data|competitor|high": 7
  },
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
 "descriptor": "Mutual NDA, five-year Term, Swedish Governing Law \u2014 negotiable in most cells, unacceptable where the counterparty is a competitor or the data is source code.",
 "file_name": "5-Appendix-Non-Disclosure-Agreement-Mutual.pdf",
 "absence_findings": [],
 "unmodeled_risks": [
  {
   "concern": "Per-breach liquidated damages payable on top of full actual damages, so remedies stack rather than cap exposure.",
   "span": {
    "text": "the Receiving Party shall be liable to pay liquidated damages to the Disclosing Party amounting to SEK [amount] for each such breach of its obligations. Notwithstanding the right to receive liquidated damages, the Disclosing Party has the right to take any other legal measures available and to claim and receive compensation for damages exceeding any liquidated damages, including but not limited to loss of profit.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Receiving Party is strictly liable in liquidated damages for breaches committed by third parties it lawfully disclosed to.",
   "span": {
    "text": "In the case of any breach of any material obligations under this Agreement by the Receiving Party or any permitted third party who has received Confidential Information according to this Agreement",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Written certification obligation on return/destruction, with no carve-out for archival, backup or legally required retention.",
   "span": {
    "text": "The Receiving Party shall certify in writing that the information has been returned, deleted or destroyed (as applicable) and that no copies have been retained of any such Confidential Information, either partly or wholly.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Disclosing Party can demand return/destruction at any time on request, effectively terminating use rights unilaterally mid-negotiation.",
   "span": {
    "text": "Upon request of the Disclosing Party or upon the termination of this Agreement, the Receiving Party shall return, delete or destroy (as instructed in writing by the Disclosing Party) all Confidential Information, and all copies thereof.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Copying of Confidential Information is prohibited except as strictly necessary, which is hard to police operationally.",
   "span": {
    "text": "The Receiving Party shall not be entitled to copy any Confidential Information furnished by the Disclosing Party hereunder, unless and to the extent it is necessary for the purpose of this Agreement.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Obligations apply retroactively to information disclosed before the effective date, extending liability to pre-signature exchanges.",
   "span": {
    "text": "The provisions of this Agreement shall apply retroactively to any Confidential Information, which has been disclosed in accordance with this Agreement and in connection with discussions and negotiation regarding the possible co-operation described in this Agreement prior to the effective date of the Agreement.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Confidentiality survival can be silently displaced by a future agreement's terms, creating uncertainty about which regime governs.",
   "span": {
    "text": "except to the extent this Agreement is superseded by stipulations of a contemplated agreement",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Absolute assignment bar with no exception for mergers, reorganisations or affiliate transfers \u2014 an assignment trap on a change of control.",
   "span": {
    "text": "Neither Party shall have the right to assign this Agreement without the prior written consent of the other Party.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Unfinalised dispute forum: court and arbitration alternatives both left in with blanks, risking an ambiguous or unfavourable venue.",
   "span": {
    "text": "Any dispute, controversy or claim arising out of or in connection with this Agreement shall be exclusively settled by the District Court of [city] as first instance. [Alt. Any dispute, controversy or claim arising out of or in connection with this Agreement shall be finally settled by arbitration in accordance with the Rules for Expedited Arbitrations of the Arbitration Institute of the Stockholm Chamber of Commerce.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Compelled-disclosure carve-out requires notice but omits protective-order cooperation and may require notice even where legally prohibited.",
   "span": {
    "text": "provided, however, that the Receiving Party will promptly notify the Disclosing Party upon learning of such order or requirement",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Prior-knowledge and independent-development carve-outs are conditioned on documentary evidence, shifting the burden of proof to the Receiving Party.",
   "span": {
    "text": "was previously known to the Receiving Party free of any obligation to keep it confidential, as evidenced by its business records;",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Confidentiality obligations attach to unmarked and oral information with no designation or written-confirmation requirement.",
   "span": {
    "text": "information furnished during discussions or oral presentations, whether or not designated as confidential at the time of disclosure",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "The existence and terms of the Agreement are themselves confidential, restricting disclosure to investors or advisers.",
   "span": {
    "text": "as well as the terms and conditions of this Agreement",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Third-party receipt carve-out lacks the usual requirement that the third party not be under a confidentiality duty, but disclosure to advisers still needs prior written approval.",
   "span": {
    "text": "The Parties shall not disclose Confidential Information to any third party, other than to their officers, employees or consultants (engaged in the matter of this Agreement) on a need to know basis, without the prior written approval of the other Party.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Recital pre-agrees that any unauthorised disclosure causes competitive harm, priming injunctive relief and damages arguments.",
   "span": {
    "text": "the result of an unauthorised disclosure thereof will be a damaged competitive situation for the Disclosing Party, commercially and/or academically",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Liquidated damages clause carries a bracketed applicability condition that may be left unresolved in the executed version.",
   "span": {
    "text": "5. Liquidated Damages [only applicable for agreements between commercial partners]",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Term clause is mis-numbered ('61.'), a drafting defect that could complicate cross-references to the survival provision.",
   "span": {
    "text": "61. This Agreement shall remain in force and effect for [one (1)] year when duly signed by both Parties",
    "start": -1,
    "end": -1
   }
  }
 ],
 "termination_state": "exhaustive",
 "spans_verified": true,
 "provenance": {
  "extraction": {
   "model": "google/gemini-3.7-flash",
   "prompt_version": "v5"
  },
  "absence_detector": {
   "model": "google/gemini-3.7-flash",
   "prompt_version": "v5",
   "search_budget": 5
  },
  "shadow_judge": {
   "model": "anthropic/claude-opus-5:batch",
   "prompt_version": "v1"
  }
 }
};
