window.NDA_DOC_152 = {
 "document_id": "152",
 "schema_version": 1,
 "clauses": [
  {
   "clause_type": "mutuality",
   "span": "Each party may disclose to the other party confidential and/or proprietary information (hereinafter \u201cthe Information\u201d) including but not limited to trade secrets, business practices and customer information.",
   "attributes": {
    "clause_type": "mutuality",
    "direction": "mutual"
   }
  },
  {
   "clause_type": "term_survival",
   "span": "The agreement and the obligation of confidentiality shall remain in force for a period of ten (10) years after the date of the last disclosure of Information,",
   "attributes": {
    "clause_type": "term_survival",
    "term_years": 10.0,
    "perpetual_scope": "none"
   }
  },
  {
   "clause_type": "confidentiality_definition",
   "span": "Each party may disclose to the other party confidential and/or proprietary information (hereinafter \u201cthe Information\u201d) including but not limited to trade secrets, business practices and customer information.",
   "attributes": {
    "clause_type": "confidentiality_definition",
    "carveouts": [
     "publicly_known",
     "legally_compelled"
    ],
    "oral_disclosure_covered": true
   }
  },
  {
   "clause_type": "governing_law",
   "span": "Any dispute in relation to this Agreement shall be resolved by the common court of the country of the first defendant, i.e. if suit is first brought by Add-X Biotech the dispute including all counterclaims shall be resolved by \u2026\u2026\u2026\u2026\u2026\u2026. courts applying \u2026\u2026\u2026\u2026\u2026. law and if suit is first brought by \u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026. the dispute including all counterclaims shall be resolved by Canadian courts applying Canadian law.",
   "attributes": {
    "clause_type": "governing_law",
    "jurisdiction": "Canada",
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-2"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-2"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-2"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-2"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-2"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-2"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-2"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-2"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-2"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-2"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-2"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-2"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-2"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-2"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-2"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-2"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "tier": "unacceptable",
    "rule_id": "TS-4"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
    "routing_decision": "escalate",
    "autonomy_eligible": true,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "acceptable",
      "rule_id": "MUT-1"
     },
     {
      "clause_type": "term_survival",
      "tier": "unacceptable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "unacceptable",
      "rule_id": "CR-2"
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
      "confidentiality_definition"
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
      "tier": "acceptable",
      "rule_id": "MUT-1"
     },
     {
      "clause_type": "term_survival",
      "tier": "unacceptable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "unacceptable",
      "rule_id": "CR-2"
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
      "tier": "unacceptable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "unacceptable",
      "rule_id": "CR-2"
     },
     {
      "clause_type": "governing_law",
      "tier": "unacceptable",
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
      "tier": "unacceptable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "unacceptable",
      "rule_id": "CR-2"
     },
     {
      "clause_type": "governing_law",
      "tier": "unacceptable",
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
    "autonomy_eligible": true,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "acceptable",
      "rule_id": "MUT-1"
     },
     {
      "clause_type": "term_survival",
      "tier": "unacceptable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "unacceptable",
      "rule_id": "CD-3"
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
      "confidentiality_definition"
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
      "tier": "acceptable",
      "rule_id": "MUT-1"
     },
     {
      "clause_type": "term_survival",
      "tier": "unacceptable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "unacceptable",
      "rule_id": "CD-3"
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
      "tier": "unacceptable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "unacceptable",
      "rule_id": "CD-3"
     },
     {
      "clause_type": "governing_law",
      "tier": "unacceptable",
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
      "tier": "unacceptable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "unacceptable",
      "rule_id": "CD-3"
     },
     {
      "clause_type": "governing_law",
      "tier": "unacceptable",
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
   "n_distinct_plans": 2,
   "eligible_cells": 81,
   "auto_approve_cells": 0,
   "auto_approve_rate": 0.0
  }
 },
 "descriptor": "Mutual non-analysis NDA with a ten-year Term under Canadian law and two Carve-outs absent \u2014 the long tail we will not carry.",
 "file_name": "MNDA.pdf",
 "absence_findings": [
  {
   "clause_type": null,
   "carveout": "independently_developed",
   "note": "Searched for 'independently' and 'independent'; Section 4 lists exceptions (a)-(c) with no independent development carve-out."
  },
  {
   "clause_type": null,
   "carveout": "rightfully_received",
   "note": "Searched for 'third party' and reviewed Section 4 exceptions; no third-party receipt carve-out is present."
  }
 ],
 "unmodeled_risks": [
  {
   "concern": "Non-analysis / reverse-engineering ban with mandatory pre-approval of all test procedures \u2014 beyond standard confidentiality obligations.",
   "span": {
    "text": "The parties each agree not to undertake or have undertaken any analysis on the products or the technology supplied by the other parties to determine structure or composition or otherwise to perform tests not authorised by other party without the prior written consent of the other party. Test procedures shall be mutually agreed prior to testing.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Compulsory disclosure of all test results to the other party, effectively transferring research output generated by the recipient.",
   "span": {
    "text": "The parties agree to disclose to each other, the results of the tests performed in connection with the Project.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Absolute carve-out declaring AddiFlex composition/manufacturing the exclusive property of Add-X \u2014 one-sided ownership and testing prohibition.",
   "span": {
    "text": "It is explicitly agreed that the composition of the material AddiFlex as well as the manufacturing process used to produce AddiFlex shall not be the subject of any test and that all information relating to the composition and manufacture of AddiFlex shall remain the exclusive property of Add-X Biotech AB",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Audit/reporting right requiring lists of copy locations, recipient names and addresses, and signed confidentiality undertakings on demand.",
   "span": {
    "text": "7.1 On the written request of either party the other will supply to the requester a list showing to the extent practical: -\n7.1.1 where copies that have been supplied are held;\n7.1.2 copies that have been made by the other party and where they are held; and\n7.1.3 the names and addresses of the people to whom Information has been disclosed and a copy of the confidentiality undertakings signed by them complying with the provisions of this agreement.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Broad indemnity covering all costs, losses and expenses for any breach or non-performance, with no cap or exclusion of consequential loss.",
   "span": {
    "text": "Both parties will indemnify each other and keep the other harmless against all costs, losses or expenses resulting from any breach or non-performance of any of their obligations under this agreement.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Publicity clause barring any reference to the subject matter or use of the other party's name without consent.",
   "span": {
    "text": "Neither party shall make or permit others to make any reference to the subject matter of the Agreement, or the Information or use the name of the other party in any public announcements, promotional, marketing or sales materials or efforts without the prior written consent of the other party",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Mandatory return-or-destroy of products and residues on a fixed 120-day deadline from effective date, regardless of testing status, with no certification mechanism.",
   "span": {
    "text": "All products and any residue thereof remaining after the tests are completed shall returned to the disclosing party no later than one hundred twenty (120) days from the effective date shown above, or shall be destroyed by the receiving party.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Retroactive coverage of information disclosed before signing, and a confidentiality term that rolls forward 10 years from the last disclosure (indefinitely extendable).",
   "span": {
    "text": "This agreement cover all Information exchanged between the parties relating to the Project, including any Information that may have been disclosed prior to signing of the agreement. The agreement and the obligation of confidentiality shall remain in force for a period of ten (10) years after the date of the last disclosure of Information,",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "\"Country of the first defendant\" forum clause with blank jurisdiction/law fields incentivizes a race to sue and leaves governing law undetermined.",
   "span": {
    "text": "Any dispute in relation to this Agreement shall be resolved by the common court of the country of the first defendant, i.e. if suit is first brought by Add-X Biotech the dispute including all counterclaims shall be resolved by \u2026\u2026\u2026\u2026\u2026\u2026. courts applying \u2026\u2026\u2026\u2026\u2026. law and if suit is first brought by \u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026. the dispute including all counterclaims shall be resolved by Canadian courts applying Canadian law.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Onward disclosure to employees/agents requires them to individually agree to the Agreement's terms, creating a hard-to-satisfy administrative precondition.",
   "span": {
    "text": "restricting the information\u2019s availability to employees, agents or consultants of the receiving party with a need to know, and making such disclosure only after they have agreed to abide by the terms and conditions of this Agreement,",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Copying of confidential information requires prior written consent, with no exception for internal working copies.",
   "span": {
    "text": "prohibiting duplication of any such information without the prior written consent of the disclosing party, and",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Prior-possession carve-out is limited to information in \"written or recorded forms\" and omits standard independent-development and third-party-receipt exceptions.",
   "span": {
    "text": "corresponds in substance to Information in the receiving party\u2019s possession, in written or recorded forms, prior to the receiving party\u2019s receipt of the same Information from the disclosing party; or",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Compelled-disclosure carve-out contains no notice-to-discloser or protective-order cooperation mechanism, and omits non-judicial legal requirements.",
   "span": {
    "text": "that it is required to disclose to the minimum extent required to do so by any order of any court of competent jurisdiction or any competent judicial, governmental or regulatory body.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Unfilled counterparty blanks and named individual \"appointed representatives\" create ambiguity over who is bound and whether individuals bear personal obligations.",
   "span": {
    "text": "Add-X Biotech AB and \u2026..\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026. have been discussing the possibility of a future business relationship concerning the Project (as defined below.)",
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
