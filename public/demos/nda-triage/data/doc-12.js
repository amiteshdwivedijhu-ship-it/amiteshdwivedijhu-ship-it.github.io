window.NDA_DOC_12 = {
 "document_id": "12",
 "schema_version": 1,
 "clauses": [
  {
   "clause_type": "mutuality",
   "span": "CLIENT desires to maintain the confidentiality of all personal, financial and product information disclosed to BROOKS. BROOKS is willing to receive all such personal, financial and product information in confidence, and the Parties deem it to be in their mutual best interest to protect such personal, financial and product information as provided in this Agreement.",
   "attributes": {
    "clause_type": "mutuality",
    "direction": "one_way_protects_counterparty"
   }
  },
  {
   "clause_type": "term_survival",
   "span": "This Agreement shall remain in full force and effect until the earliest of:\n(a) one (1) year after the termination of the business relationship between the Parties; or (b) any alternate termination date specified in a written amendment modifying or waiving the term of this Agreement.",
   "attributes": {
    "clause_type": "term_survival",
    "term_years": 1.0,
    "perpetual_scope": "none"
   }
  },
  {
   "clause_type": "confidentiality_definition",
   "span": "to the extent that CLIENT shall disclose to BROOKS personal, financial and product information, including their Formulations and Processing Procedures (\u201cConfidential Information\u201d), then all the Confidential Information disclosed to BROOKS shall be received by BROOKS in confidence for purposes of this Agreement except as otherwise provided under Section 3 below.",
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
   "clause_type": "non_compete_solicit",
   "span": "Under no circumstance will BROOKS approach any of CLIENT\u2019s Private Label Condiment Customers for BROOKS\u2019 own benefit.",
   "attributes": {
    "clause_type": "non_compete_solicit",
    "present": true,
    "kind": "non_solicit_customers",
    "duration_months": null,
    "mutual": false
   }
  },
  {
   "clause_type": "governing_law",
   "span": "This Agreement shall be governed, construed and interpreted by, and in accordance with, the laws of the State of New York.",
   "attributes": {
    "clause_type": "governing_law",
    "jurisdiction": "New York",
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
    "tier": "unacceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "discloser|general_business|vendor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "discloser|general_business|partner": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "discloser|general_business|competitor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "discloser|technical|customer": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "discloser|technical|vendor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "discloser|technical|partner": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "discloser|technical|competitor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "discloser|source_code|customer": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-5"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "discloser|source_code|vendor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-5"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "discloser|source_code|partner": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-5"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "discloser|source_code|competitor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "negotiable",
    "rule_id": "TS-5"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "discloser|customer_data|customer": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "discloser|customer_data|vendor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "discloser|customer_data|partner": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "discloser|customer_data|competitor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|general_business|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|general_business|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|general_business|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|general_business|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|technical|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|technical|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|technical|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|technical|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|source_code|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|source_code|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|source_code|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|source_code|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|customer_data|customer": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|customer_data|vendor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|customer_data|partner": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|customer_data|competitor": {
   "mutuality": {
    "tier": "acceptable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|general_business|customer": {
   "mutuality": {
    "tier": "negotiable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|general_business|vendor": {
   "mutuality": {
    "tier": "negotiable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|general_business|partner": {
   "mutuality": {
    "tier": "negotiable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|general_business|competitor": {
   "mutuality": {
    "tier": "negotiable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|technical|customer": {
   "mutuality": {
    "tier": "negotiable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|technical|vendor": {
   "mutuality": {
    "tier": "negotiable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|technical|partner": {
   "mutuality": {
    "tier": "negotiable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|technical|competitor": {
   "mutuality": {
    "tier": "negotiable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|source_code|customer": {
   "mutuality": {
    "tier": "negotiable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|source_code|vendor": {
   "mutuality": {
    "tier": "negotiable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|source_code|partner": {
   "mutuality": {
    "tier": "negotiable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|source_code|competitor": {
   "mutuality": {
    "tier": "negotiable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|customer_data|customer": {
   "mutuality": {
    "tier": "negotiable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|customer_data|vendor": {
   "mutuality": {
    "tier": "negotiable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|customer_data|partner": {
   "mutuality": {
    "tier": "negotiable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|customer_data|competitor": {
   "mutuality": {
    "tier": "negotiable",
    "rule_id": "MUT-3"
   },
   "term_survival": {
    "tier": "acceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "negotiable",
    "rule_id": "CD-4"
   },
   "non_compete_solicit": {
    "tier": "unacceptable",
    "rule_id": "NC-2"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  }
 },
 "replay": {
  "outcomes": [
   {
    "routing_decision": "escalate",
    "autonomy_eligible": true,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "unacceptable",
      "rule_id": "MUT-3"
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
      "clause_type": "non_compete_solicit",
      "tier": "unacceptable",
      "rule_id": "NC-2"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-2"
     }
    ],
    "plan": {
     "must_fix": [
      "mutuality",
      "non_compete_solicit"
     ],
     "concede": [
      "governing_law"
     ],
     "priority_fight": "governing_law"
    }
   },
   {
    "routing_decision": "flag",
    "autonomy_eligible": true,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "unacceptable",
      "rule_id": "MUT-3"
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
      "clause_type": "non_compete_solicit",
      "tier": "unacceptable",
      "rule_id": "NC-2"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-2"
     }
    ],
    "plan": {
     "must_fix": [
      "mutuality",
      "non_compete_solicit",
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
      "tier": "unacceptable",
      "rule_id": "MUT-3"
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
      "clause_type": "non_compete_solicit",
      "tier": "unacceptable",
      "rule_id": "NC-2"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-2"
     }
    ],
    "plan": {
     "must_fix": [
      "mutuality",
      "non_compete_solicit"
     ],
     "concede": [
      "governing_law"
     ],
     "priority_fight": "governing_law"
    }
   },
   {
    "routing_decision": "flag",
    "autonomy_eligible": false,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "unacceptable",
      "rule_id": "MUT-3"
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
      "clause_type": "non_compete_solicit",
      "tier": "unacceptable",
      "rule_id": "NC-2"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-2"
     }
    ],
    "plan": {
     "must_fix": [
      "mutuality",
      "non_compete_solicit",
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
      "tier": "unacceptable",
      "rule_id": "MUT-3"
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
      "clause_type": "non_compete_solicit",
      "tier": "unacceptable",
      "rule_id": "NC-2"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-2"
     }
    ],
    "plan": {
     "must_fix": [
      "mutuality",
      "non_compete_solicit"
     ],
     "concede": [
      "term_survival",
      "governing_law"
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
      "tier": "unacceptable",
      "rule_id": "MUT-3"
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
      "clause_type": "non_compete_solicit",
      "tier": "unacceptable",
      "rule_id": "NC-2"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-2"
     }
    ],
    "plan": {
     "must_fix": [
      "mutuality",
      "non_compete_solicit",
      "term_survival",
      "governing_law"
     ],
     "concede": [],
     "priority_fight": null
    }
   },
   {
    "routing_decision": "escalate",
    "autonomy_eligible": true,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "acceptable",
      "rule_id": "MUT-3"
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
      "clause_type": "non_compete_solicit",
      "tier": "unacceptable",
      "rule_id": "NC-2"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-2"
     }
    ],
    "plan": {
     "must_fix": [
      "non_compete_solicit"
     ],
     "concede": [
      "confidentiality_definition",
      "governing_law"
     ],
     "priority_fight": "governing_law"
    }
   },
   {
    "routing_decision": "flag",
    "autonomy_eligible": true,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "acceptable",
      "rule_id": "MUT-3"
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
      "clause_type": "non_compete_solicit",
      "tier": "unacceptable",
      "rule_id": "NC-2"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-2"
     }
    ],
    "plan": {
     "must_fix": [
      "non_compete_solicit",
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
      "rule_id": "MUT-3"
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
      "clause_type": "non_compete_solicit",
      "tier": "unacceptable",
      "rule_id": "NC-2"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-2"
     }
    ],
    "plan": {
     "must_fix": [
      "non_compete_solicit"
     ],
     "concede": [
      "confidentiality_definition",
      "governing_law"
     ],
     "priority_fight": "governing_law"
    }
   },
   {
    "routing_decision": "flag",
    "autonomy_eligible": false,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "acceptable",
      "rule_id": "MUT-3"
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
      "clause_type": "non_compete_solicit",
      "tier": "unacceptable",
      "rule_id": "NC-2"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-2"
     }
    ],
    "plan": {
     "must_fix": [
      "non_compete_solicit",
      "confidentiality_definition",
      "governing_law"
     ],
     "concede": [],
     "priority_fight": null
    }
   },
   {
    "routing_decision": "escalate",
    "autonomy_eligible": true,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "negotiable",
      "rule_id": "MUT-3"
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
      "clause_type": "non_compete_solicit",
      "tier": "unacceptable",
      "rule_id": "NC-2"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-2"
     }
    ],
    "plan": {
     "must_fix": [
      "non_compete_solicit"
     ],
     "concede": [
      "mutuality",
      "confidentiality_definition",
      "governing_law"
     ],
     "priority_fight": "governing_law"
    }
   },
   {
    "routing_decision": "flag",
    "autonomy_eligible": true,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "negotiable",
      "rule_id": "MUT-3"
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
      "clause_type": "non_compete_solicit",
      "tier": "unacceptable",
      "rule_id": "NC-2"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-2"
     }
    ],
    "plan": {
     "must_fix": [
      "non_compete_solicit",
      "mutuality",
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
      "tier": "negotiable",
      "rule_id": "MUT-3"
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
      "clause_type": "non_compete_solicit",
      "tier": "unacceptable",
      "rule_id": "NC-2"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-2"
     }
    ],
    "plan": {
     "must_fix": [
      "non_compete_solicit"
     ],
     "concede": [
      "mutuality",
      "confidentiality_definition",
      "governing_law"
     ],
     "priority_fight": "governing_law"
    }
   },
   {
    "routing_decision": "flag",
    "autonomy_eligible": false,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "negotiable",
      "rule_id": "MUT-3"
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
      "clause_type": "non_compete_solicit",
      "tier": "unacceptable",
      "rule_id": "NC-2"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-2"
     }
    ],
    "plan": {
     "must_fix": [
      "non_compete_solicit",
      "mutuality",
      "confidentiality_definition",
      "governing_law"
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
   "discloser|source_code|customer|low": 4,
   "discloser|source_code|customer|medium": 5,
   "discloser|source_code|customer|high": 5,
   "discloser|source_code|vendor|low": 4,
   "discloser|source_code|vendor|medium": 5,
   "discloser|source_code|vendor|high": 5,
   "discloser|source_code|partner|low": 4,
   "discloser|source_code|partner|medium": 5,
   "discloser|source_code|partner|high": 5,
   "discloser|source_code|competitor|low": 4,
   "discloser|source_code|competitor|medium": 5,
   "discloser|source_code|competitor|high": 5,
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
   "recipient|general_business|customer|low": 6,
   "recipient|general_business|customer|medium": 7,
   "recipient|general_business|customer|high": 7,
   "recipient|general_business|vendor|low": 6,
   "recipient|general_business|vendor|medium": 7,
   "recipient|general_business|vendor|high": 7,
   "recipient|general_business|partner|low": 6,
   "recipient|general_business|partner|medium": 7,
   "recipient|general_business|partner|high": 7,
   "recipient|general_business|competitor|low": 8,
   "recipient|general_business|competitor|medium": 9,
   "recipient|general_business|competitor|high": 9,
   "recipient|technical|customer|low": 6,
   "recipient|technical|customer|medium": 7,
   "recipient|technical|customer|high": 7,
   "recipient|technical|vendor|low": 6,
   "recipient|technical|vendor|medium": 7,
   "recipient|technical|vendor|high": 7,
   "recipient|technical|partner|low": 6,
   "recipient|technical|partner|medium": 7,
   "recipient|technical|partner|high": 7,
   "recipient|technical|competitor|low": 8,
   "recipient|technical|competitor|medium": 9,
   "recipient|technical|competitor|high": 9,
   "recipient|source_code|customer|low": 8,
   "recipient|source_code|customer|medium": 9,
   "recipient|source_code|customer|high": 9,
   "recipient|source_code|vendor|low": 8,
   "recipient|source_code|vendor|medium": 9,
   "recipient|source_code|vendor|high": 9,
   "recipient|source_code|partner|low": 8,
   "recipient|source_code|partner|medium": 9,
   "recipient|source_code|partner|high": 9,
   "recipient|source_code|competitor|low": 8,
   "recipient|source_code|competitor|medium": 9,
   "recipient|source_code|competitor|high": 9,
   "recipient|customer_data|customer|low": 6,
   "recipient|customer_data|customer|medium": 7,
   "recipient|customer_data|customer|high": 7,
   "recipient|customer_data|vendor|low": 6,
   "recipient|customer_data|vendor|medium": 7,
   "recipient|customer_data|vendor|high": 7,
   "recipient|customer_data|partner|low": 6,
   "recipient|customer_data|partner|medium": 7,
   "recipient|customer_data|partner|high": 7,
   "recipient|customer_data|competitor|low": 8,
   "recipient|customer_data|competitor|medium": 9,
   "recipient|customer_data|competitor|high": 9,
   "mutual|general_business|customer|low": 10,
   "mutual|general_business|customer|medium": 11,
   "mutual|general_business|customer|high": 11,
   "mutual|general_business|vendor|low": 10,
   "mutual|general_business|vendor|medium": 11,
   "mutual|general_business|vendor|high": 11,
   "mutual|general_business|partner|low": 10,
   "mutual|general_business|partner|medium": 11,
   "mutual|general_business|partner|high": 11,
   "mutual|general_business|competitor|low": 12,
   "mutual|general_business|competitor|medium": 13,
   "mutual|general_business|competitor|high": 13,
   "mutual|technical|customer|low": 10,
   "mutual|technical|customer|medium": 11,
   "mutual|technical|customer|high": 11,
   "mutual|technical|vendor|low": 10,
   "mutual|technical|vendor|medium": 11,
   "mutual|technical|vendor|high": 11,
   "mutual|technical|partner|low": 10,
   "mutual|technical|partner|medium": 11,
   "mutual|technical|partner|high": 11,
   "mutual|technical|competitor|low": 12,
   "mutual|technical|competitor|medium": 13,
   "mutual|technical|competitor|high": 13,
   "mutual|source_code|customer|low": 12,
   "mutual|source_code|customer|medium": 13,
   "mutual|source_code|customer|high": 13,
   "mutual|source_code|vendor|low": 12,
   "mutual|source_code|vendor|medium": 13,
   "mutual|source_code|vendor|high": 13,
   "mutual|source_code|partner|low": 12,
   "mutual|source_code|partner|medium": 13,
   "mutual|source_code|partner|high": 13,
   "mutual|source_code|competitor|low": 12,
   "mutual|source_code|competitor|medium": 13,
   "mutual|source_code|competitor|high": 13,
   "mutual|customer_data|customer|low": 10,
   "mutual|customer_data|customer|medium": 11,
   "mutual|customer_data|customer|high": 11,
   "mutual|customer_data|vendor|low": 10,
   "mutual|customer_data|vendor|medium": 11,
   "mutual|customer_data|vendor|high": 11,
   "mutual|customer_data|partner|low": 10,
   "mutual|customer_data|partner|medium": 11,
   "mutual|customer_data|partner|high": 11,
   "mutual|customer_data|competitor|low": 12,
   "mutual|customer_data|competitor|medium": 13,
   "mutual|customer_data|competitor|high": 13
  },
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
 "descriptor": "One-way NDA with a customer non-solicit rider (unacceptable outright); the Shadow Judge flags a one-sided irreparable-harm stipulation.",
 "file_name": "183.pdf",
 "absence_findings": [],
 "unmodeled_risks": [
  {
   "concern": "One-sided stipulation of irreparable harm that pre-concedes injunctive relief and specific performance against BROOKS only, waiving any showing of harm.",
   "span": {
    "text": "BROOKS acknowledges that any failure by BROOKS to fulfill any obligation under this Agreement, or any breach by BROOKS of any provision herein, will constitute immediate and irreparable harm to CLIENT, which harm cannot be fully and/or adequately compensated in monetary damages and which will warrant injunctive relief, an order for specific performance, or any other available equitable relief.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Perpetual, undefined and unlimited customer non-approach covenant (\"Private Label Condiment Customers\" is never defined and has no time or territory limit).",
   "span": {
    "text": "Under no circumstance will BROOKS approach any of CLIENT\u2019s Private Label Condiment Customers for BROOKS\u2019 own benefit.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Compelled-disclosure protection is conditioned on obtaining a written legal opinion from counsel \"reasonably acceptable to CLIENT,\" giving CLIENT veto power over BROOKS' ability to comply with legal process.",
   "span": {
    "text": "BROOKS may disclose, without liability hereunder, that portion (and only that portion) of Confidential Information that BROOKS has been advised by written opinion counsel reasonably acceptable to CLIENT that it is legally compelled to disclose",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "\"Immediately\" notify plus \"best efforts\" litigation-assistance duty on compelled disclosure, with no exception where notice itself is legally prohibited.",
   "span": {
    "text": "BROOKS shall immediately notify the CLIENT in writing of such requirements so that the CLIENT may seek a protective order or other appropriate remedy and/or waive compliance with the provisions hereof. BROOKS will use its best efforts, at the CLIENT\u2019S expense, to obtain or assist CLIENT in obtaining any such protective order.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Non-standard default document-retention regime: absent a written request, BROOKS must hold materials three years and give 10 days' notice before disposal (no destruction-in-lieu-of-return option).",
   "span": {
    "text": "If CLIENT does not request in writing the return of the above material, BROOKS will retain said material for three (3) years after which BROOKS is free to dispose of material if it so desires and will do so after ten (10) days written notice to CLIENT.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Anti-supersession trap: later contracts (e.g., a supply or manufacturing agreement) cannot override this NDA unless they expressly cite this Agreement and the affected sections.",
   "span": {
    "text": "No subsequent agreements or contracts between the Parties affect the obligations set forth herein unless this Agreement and the affected sections are explicitly cited in writing.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Amendment magic-words requirement: any amendment is void unless the document explicitly references Section 10.",
   "span": {
    "text": "This Agreement may not be amended, modified or supplemented except by a written document of subsequent date hereto, executed by each of the parties hereto, which explicitly references this Section 10.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Circular/self-referential termination construction \u2014 the term ends at the \"earliest of\" a one-year date or an undefined \"alternate termination date\" in a future amendment, leaving the term indeterminate.",
   "span": {
    "text": "(a) one (1) year after the termination of the business relationship between the Parties; or (b) any alternate termination date specified in a written amendment modifying or waiving the term of this Agreement.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Carve-out excusing inadvertent disclosure effectively converts a strict confidentiality duty into a mere reasonable-care standard measured by BROOKS' own internal practices.",
   "span": {
    "text": "Inadvertently discloses where BROOKS has exercised reasonable care consistent with the effort BROOKS exercises with respect to the preservation of BROOKS\u2019 own confidential information;",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Open-ended downstream disclosure exception for anything \"necessarily\" resulting from performing services, with no flow-down confidentiality obligation on recipients (and a drafting gap omitting the contracting party).",
   "span": {
    "text": "Discloses such Confidential Information to others which necessarily results from performing the services has contracted with BROOKS to perform.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Double-negative drafting error renders the representation and warranty self-contradictory (as written, each party warrants that the relationship WILL breach other agreements).",
   "span": {
    "text": "Each of CLIENT and BROOKS represents and warrants that neither their discussions nor their anticipated business relationship do not and will not breach any agreement which either of them may have with any other party.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Notice provision designates no addresses and relies on \"last known business address,\" creating risk that critical notices (e.g., return requests, disposal notices) are validly served at a stale address.",
   "span": {
    "text": "to the intended recipient at such party\u2019s last known business address.",
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
