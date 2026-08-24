window.NDA_DOC_610 = {
 "document_id": "610",
 "schema_version": 1,
 "clauses": [
  {
   "clause_type": "mutuality",
   "span": "A party disclosing Confidential Information hereunder is referred to herein as \u201cthe disclosing party\u201d and a party receiving the Confidential Information of a disclosing party hereunder is referred to herein as \u201cthe receiving party.\u201d",
   "attributes": {
    "clause_type": "mutuality",
    "direction": "mutual"
   }
  },
  {
   "clause_type": "term_survival",
   "span": "The foregoing commitments of either party in this Agreement regarding the confidentiality and non-use of Confidential Information shall survive any termination of discussions between the parties and shall continue for a period of eighteen\n(18) months following the date of this Agreement.",
   "attributes": {
    "clause_type": "term_survival",
    "term_years": 1.5,
    "perpetual_scope": "none"
   }
  },
  {
   "clause_type": "confidentiality_definition",
   "span": "\u201cConfidential Information\u201d means any information, technical data or know-how, including, but not limited to, that which relates to research, product or service plans, business practices, agreement terms, products, services, employees, suppliers, customers, technology or other strategic partners, stockholders, markets, software, know-how, developments, inventions, processes, designs, drawings, engineering, hardware configuration information, marketing, finances, notes, analyses or studies and all tangible and intangible embodiments thereof of any kind whatsoever, whether conveyed in writing or orally by the disclosing party or its Associates to the receiving party or its Associates in connection with the evaluation of a Transaction.",
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
   "span": "This Agreement shall be governed by and construed and enforced in accordance with the laws of the State of Delaware applicable to agreements made and to be performed within that state.",
   "attributes": {
    "clause_type": "governing_law",
    "jurisdiction": "Delaware",
    "us_jurisdiction": true
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
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "discloser|general_business|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "discloser|general_business|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "discloser|general_business|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "discloser|technical|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "discloser|technical|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "discloser|technical|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "discloser|technical|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "discloser|source_code|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-5"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "discloser|source_code|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-5"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "discloser|source_code|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-5"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "discloser|source_code|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-5"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "discloser|customer_data|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "discloser|customer_data|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "discloser|customer_data|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "discloser|customer_data|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "recipient|general_business|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "recipient|general_business|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "recipient|general_business|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "recipient|general_business|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "recipient|technical|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "recipient|technical|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "recipient|technical|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "recipient|technical|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "recipient|source_code|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "recipient|source_code|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "recipient|source_code|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "recipient|source_code|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "recipient|customer_data|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "recipient|customer_data|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "recipient|customer_data|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "recipient|customer_data|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "mutual|general_business|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "mutual|general_business|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "mutual|general_business|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "mutual|general_business|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "mutual|technical|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "mutual|technical|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "mutual|technical|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "mutual|technical|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "mutual|source_code|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "mutual|source_code|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "mutual|source_code|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "mutual|source_code|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "mutual|customer_data|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "mutual|customer_data|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "mutual|customer_data|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
   }
  },
  "mutual|customer_data|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-1"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "governing_law": {
    "tier": "acceptable",
    "rule_id": "GL-1"
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
      "tier": "acceptable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "acceptable",
      "rule_id": "CD-1"
     },
     {
      "clause_type": "governing_law",
      "tier": "acceptable",
      "rule_id": "GL-1"
     }
    ],
    "plan": {
     "must_fix": [],
     "concede": [],
     "priority_fight": null
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
      "tier": "acceptable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "acceptable",
      "rule_id": "CD-1"
     },
     {
      "clause_type": "governing_law",
      "tier": "acceptable",
      "rule_id": "GL-1"
     }
    ],
    "plan": {
     "must_fix": [],
     "concede": [],
     "priority_fight": null
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
      "rule_id": "TS-5"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "acceptable",
      "rule_id": "CD-1"
     },
     {
      "clause_type": "governing_law",
      "tier": "acceptable",
      "rule_id": "GL-1"
     }
    ],
    "plan": {
     "must_fix": [],
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
      "rule_id": "TS-5"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "acceptable",
      "rule_id": "CD-1"
     },
     {
      "clause_type": "governing_law",
      "tier": "acceptable",
      "rule_id": "GL-1"
     }
    ],
    "plan": {
     "must_fix": [
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
      "tier": "acceptable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "negotiable",
      "rule_id": "CD-4"
     },
     {
      "clause_type": "governing_law",
      "tier": "acceptable",
      "rule_id": "GL-1"
     }
    ],
    "plan": {
     "must_fix": [],
     "concede": [
      "confidentiality_definition"
     ],
     "priority_fight": "confidentiality_definition"
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
      "tier": "acceptable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "negotiable",
      "rule_id": "CD-4"
     },
     {
      "clause_type": "governing_law",
      "tier": "acceptable",
      "rule_id": "GL-1"
     }
    ],
    "plan": {
     "must_fix": [
      "confidentiality_definition"
     ],
     "concede": [],
     "priority_fight": null
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
      "tier": "acceptable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "negotiable",
      "rule_id": "CD-4"
     },
     {
      "clause_type": "governing_law",
      "tier": "acceptable",
      "rule_id": "GL-1"
     }
    ],
    "plan": {
     "must_fix": [],
     "concede": [
      "confidentiality_definition"
     ],
     "priority_fight": "confidentiality_definition"
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
      "tier": "acceptable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "negotiable",
      "rule_id": "CD-4"
     },
     {
      "clause_type": "governing_law",
      "tier": "acceptable",
      "rule_id": "GL-1"
     }
    ],
    "plan": {
     "must_fix": [
      "confidentiality_definition"
     ],
     "concede": [],
     "priority_fight": null
    }
   }
  ],
  "cells": {
   "discloser|general_business|customer|low": 0,
   "discloser|general_business|customer|medium": 0,
   "discloser|general_business|customer|high": 0,
   "discloser|general_business|vendor|low": 0,
   "discloser|general_business|vendor|medium": 0,
   "discloser|general_business|vendor|high": 0,
   "discloser|general_business|partner|low": 0,
   "discloser|general_business|partner|medium": 0,
   "discloser|general_business|partner|high": 0,
   "discloser|general_business|competitor|low": 1,
   "discloser|general_business|competitor|medium": 1,
   "discloser|general_business|competitor|high": 1,
   "discloser|technical|customer|low": 0,
   "discloser|technical|customer|medium": 0,
   "discloser|technical|customer|high": 0,
   "discloser|technical|vendor|low": 0,
   "discloser|technical|vendor|medium": 0,
   "discloser|technical|vendor|high": 0,
   "discloser|technical|partner|low": 0,
   "discloser|technical|partner|medium": 0,
   "discloser|technical|partner|high": 0,
   "discloser|technical|competitor|low": 1,
   "discloser|technical|competitor|medium": 1,
   "discloser|technical|competitor|high": 1,
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
   "discloser|customer_data|customer|medium": 0,
   "discloser|customer_data|customer|high": 0,
   "discloser|customer_data|vendor|low": 0,
   "discloser|customer_data|vendor|medium": 0,
   "discloser|customer_data|vendor|high": 0,
   "discloser|customer_data|partner|low": 0,
   "discloser|customer_data|partner|medium": 0,
   "discloser|customer_data|partner|high": 0,
   "discloser|customer_data|competitor|low": 1,
   "discloser|customer_data|competitor|medium": 1,
   "discloser|customer_data|competitor|high": 1,
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
    "flag"
   ],
   "n_distinct_plans": 5,
   "eligible_cells": 81,
   "auto_approve_cells": 0,
   "auto_approve_rate": 0.0
  }
 },
 "descriptor": "Mutual NDA, 18-month Term, all four Carve-outs, Delaware law \u2014 the clean sheet. Every Tier acceptable in eligible cells; the Shadow Judge is the only thing between it and auto-approve.",
 "file_name": "1452751_0001193125-17-086167_d334994dex99e3.htm",
 "absence_findings": [],
 "unmodeled_risks": [
  {
   "concern": "Residuals clause permits employees to use unaided-memory information for any purpose, eroding confidentiality protection.",
   "span": {
    "text": "The receiving party\u2019s employees may use any Residuals for any purpose, provided that this paragraph does not grant or imply any license or other right to use any patent, trademark, copyright, mask work right or other intellectual property right.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Jury trial waiver \u2014 a non-standard remedies/procedural term beyond simple choice of law.",
   "span": {
    "text": "To the fullest extent permitted by law, each of the parties hereby agrees to waive trial by jury in any action proceeding or counterclaim brought by or on behalf of either party with respect to any matter whatsoever relating to this Agreement.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Diligence findings about the Company's product flaws may be channeled to HPE's procurement/licensing personnel \u2014 a leakage/commercial-leverage carve-out unique to this deal.",
   "span": {
    "text": "if during due diligence review, HPE learns of flaws or problems with Company\u2019s products, software, services or intellectual property rights, the Associates of HPE evaluating the potential Transaction may share such information with the Associates of HPE who are responsible for purchasing such products, software or services or licensing such intellectual property on behalf of HPE (\u201cPurchasing Associates\u201d)",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Notice of onward disclosure to Purchasing Associates is delayed up to 15 business days, giving no advance control to the disclosing party.",
   "span": {
    "text": "HPE shall notify the Company of any information shared with Associates of HPE within fifteen (15) business days after such disclosure.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Similar-products clause expressly allows competing development and refuses any employee-assignment restriction (no de facto firewall).",
   "span": {
    "text": "Neither party nor its respective Associates shall have any obligation to limit or restrict the assignment of its respective employees or consultants as a result of their having had access to Confidential Information of the other party or its Associates.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Return/destruction obligation is only 'reasonable steps' to 'instruct' others, requires a request, and permits broad retention under internal record-retention policies.",
   "span": {
    "text": "the receiving party shall take reasonable steps to instruct all persons involved in the Transaction to destroy all Confidential Information furnished to the receiving party by or on behalf of the disclosing party pursuant to this Agreement. Notwithstanding the foregoing, the receiving party and its Associates may retain any Confidential Information to the extent required pursuant to the regulatory compliance or record retention policies of such receiving party or Associate.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Broad liability disclaimer bars any claim relating to use of or errors in Confidential Information absent a definitive agreement.",
   "span": {
    "text": "neither party nor any of its Associates shall have any liability to the other party or to any of its Associates relating to or resulting from the use of such other party\u2019s Confidential Information or any errors therein m omissions therefrom",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Required-disclosure cooperation costs are shifted to the disclosing party, and notice/delay obligations are qualified as merely 'permitted or practicable'.",
   "span": {
    "text": "at the request and expense of the disclosing party, to cooperate with the disclosing party in its efforts to obtain reliable assurance that confidential treatment will be accorded the Confidential Information which is so disclosed",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Mutual publicity/nonpublicity restriction sweeps existence of the deal and all discussions into strict confidence, potentially conflicting with securities disclosure duties.",
   "span": {
    "text": "The existence and the terms of this Agreement, any Transaction, the fact that any Confidential Information has been provided to the other party, and the existence, nature and status of any discussions between the parties shall be treated as Confidential Information hereunder, shall be maintained in strict confidence",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Common-interest/joint-defense privilege construct imposed by the NDA, with risk of privilege waiver arguments and unintended shared-defense obligations.",
   "span": {
    "text": "the parties understand and agree that they have a commonality of interest with respect to such matters and it is their desire, intention and mutual understanding that the sharing of such material is not intended to, and shall not, waive or diminish in any way the confidentiality of such material",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Prior-possession carve-out relies solely on the receiving party's own files and records as proof, a self-serving evidentiary standard.",
   "span": {
    "text": "is in the possession of the receiving party or its Associates at the time of disclosure, as shown by files and records immediately prior to the time of disclosure",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Associates definition excludes stockholder representation services providers, restricting the Company's ability to share with its own deal-side advisors.",
   "span": {
    "text": "The foregoing definition of Associates who may be furnished confidential information hereby specifically excludes third parties who provide stockholder representation services.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Unusual notice mechanic requiring substantive email content only in password-protected attachments.",
   "span": {
    "text": "(if submitting by email, substantive discussions to be included only in password protected attachments)",
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
