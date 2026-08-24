window.NDA_DOC_7 = {
 "document_id": "7",
 "schema_version": 1,
 "clauses": [
  {
   "clause_type": "mutuality",
   "span": "In consideration of the mutual exchange and disclosure of Confidential Information, each party undertakes in relation to the other party's Confidential Information:",
   "attributes": {
    "clause_type": "mutuality",
    "direction": "mutual"
   }
  },
  {
   "clause_type": "term_survival",
   "span": "in respect of which a period of five (5) years has elapsed from the date of signature of this Agreement",
   "attributes": {
    "clause_type": "term_survival",
    "term_years": 5.0,
    "perpetual_scope": "none"
   }
  },
  {
   "clause_type": "confidentiality_definition",
   "span": "'Confidential Information' shall mean all information received from the other party which the latter has indicated in writing or labelled to be \u201cConfidential\u201d, \u201cProprietary Information\u201d or with any other comparable legend to similar effect, at the time of disclosure [or if disclosed orally, confirmed in writing by the disclosing party as such within fifteen (15) days after its disclosure], which it may acquire in relation to the other party",
   "attributes": {
    "clause_type": "confidentiality_definition",
    "carveouts": [
     "publicly_known",
     "rightfully_received",
     "legally_compelled",
     "independently_developed"
    ],
    "oral_disclosure_covered": false
   }
  },
  {
   "clause_type": "ip_assignment",
   "span": "In the event that the Recipient does so in violation of this Agreement, the Recipient shall assign absolutely to the Discloser such registrations and applications without any cost to the Discloser.",
   "attributes": {
    "clause_type": "ip_assignment",
    "present": true
   }
  },
  {
   "clause_type": "governing_law",
   "span": "This Agreement shall be deemed to be made in Singapore, subject to, governed by and construed in all respects in accordance with the laws of the Republic of Singapore for every intent and purpose.",
   "attributes": {
    "clause_type": "governing_law",
    "jurisdiction": "Singapore",
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
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
    "tier": "acceptable",
    "rule_id": "CD-1"
   },
   "ip_assignment": {
    "tier": "unacceptable",
    "rule_id": "IP-1"
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
      "tier": "negotiable",
      "rule_id": "TS-4"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "acceptable",
      "rule_id": "CD-1"
     },
     {
      "clause_type": "ip_assignment",
      "tier": "unacceptable",
      "rule_id": "IP-1"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-3"
     }
    ],
    "plan": {
     "must_fix": [
      "ip_assignment"
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
      "clause_type": "ip_assignment",
      "tier": "unacceptable",
      "rule_id": "IP-1"
     },
     {
      "clause_type": "governing_law",
      "tier": "negotiable",
      "rule_id": "GL-3"
     }
    ],
    "plan": {
     "must_fix": [
      "ip_assignment",
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
      "clause_type": "ip_assignment",
      "tier": "unacceptable",
      "rule_id": "IP-1"
     },
     {
      "clause_type": "governing_law",
      "tier": "unacceptable",
      "rule_id": "GL-3"
     }
    ],
    "plan": {
     "must_fix": [
      "ip_assignment",
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
      "clause_type": "ip_assignment",
      "tier": "unacceptable",
      "rule_id": "IP-1"
     },
     {
      "clause_type": "governing_law",
      "tier": "unacceptable",
      "rule_id": "GL-3"
     }
    ],
    "plan": {
     "must_fix": [
      "ip_assignment",
      "governing_law",
      "term_survival"
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
   "recipient|general_business|customer|low": 0,
   "recipient|general_business|customer|medium": 1,
   "recipient|general_business|customer|high": 1,
   "recipient|general_business|vendor|low": 0,
   "recipient|general_business|vendor|medium": 1,
   "recipient|general_business|vendor|high": 1,
   "recipient|general_business|partner|low": 0,
   "recipient|general_business|partner|medium": 1,
   "recipient|general_business|partner|high": 1,
   "recipient|general_business|competitor|low": 2,
   "recipient|general_business|competitor|medium": 3,
   "recipient|general_business|competitor|high": 3,
   "recipient|technical|customer|low": 0,
   "recipient|technical|customer|medium": 1,
   "recipient|technical|customer|high": 1,
   "recipient|technical|vendor|low": 0,
   "recipient|technical|vendor|medium": 1,
   "recipient|technical|vendor|high": 1,
   "recipient|technical|partner|low": 0,
   "recipient|technical|partner|medium": 1,
   "recipient|technical|partner|high": 1,
   "recipient|technical|competitor|low": 2,
   "recipient|technical|competitor|medium": 3,
   "recipient|technical|competitor|high": 3,
   "recipient|source_code|customer|low": 2,
   "recipient|source_code|customer|medium": 3,
   "recipient|source_code|customer|high": 3,
   "recipient|source_code|vendor|low": 2,
   "recipient|source_code|vendor|medium": 3,
   "recipient|source_code|vendor|high": 3,
   "recipient|source_code|partner|low": 2,
   "recipient|source_code|partner|medium": 3,
   "recipient|source_code|partner|high": 3,
   "recipient|source_code|competitor|low": 2,
   "recipient|source_code|competitor|medium": 3,
   "recipient|source_code|competitor|high": 3,
   "recipient|customer_data|customer|low": 0,
   "recipient|customer_data|customer|medium": 1,
   "recipient|customer_data|customer|high": 1,
   "recipient|customer_data|vendor|low": 0,
   "recipient|customer_data|vendor|medium": 1,
   "recipient|customer_data|vendor|high": 1,
   "recipient|customer_data|partner|low": 0,
   "recipient|customer_data|partner|medium": 1,
   "recipient|customer_data|partner|high": 1,
   "recipient|customer_data|competitor|low": 2,
   "recipient|customer_data|competitor|medium": 3,
   "recipient|customer_data|competitor|high": 3,
   "mutual|general_business|customer|low": 0,
   "mutual|general_business|customer|medium": 1,
   "mutual|general_business|customer|high": 1,
   "mutual|general_business|vendor|low": 0,
   "mutual|general_business|vendor|medium": 1,
   "mutual|general_business|vendor|high": 1,
   "mutual|general_business|partner|low": 0,
   "mutual|general_business|partner|medium": 1,
   "mutual|general_business|partner|high": 1,
   "mutual|general_business|competitor|low": 2,
   "mutual|general_business|competitor|medium": 3,
   "mutual|general_business|competitor|high": 3,
   "mutual|technical|customer|low": 0,
   "mutual|technical|customer|medium": 1,
   "mutual|technical|customer|high": 1,
   "mutual|technical|vendor|low": 0,
   "mutual|technical|vendor|medium": 1,
   "mutual|technical|vendor|high": 1,
   "mutual|technical|partner|low": 0,
   "mutual|technical|partner|medium": 1,
   "mutual|technical|partner|high": 1,
   "mutual|technical|competitor|low": 2,
   "mutual|technical|competitor|medium": 3,
   "mutual|technical|competitor|high": 3,
   "mutual|source_code|customer|low": 2,
   "mutual|source_code|customer|medium": 3,
   "mutual|source_code|customer|high": 3,
   "mutual|source_code|vendor|low": 2,
   "mutual|source_code|vendor|medium": 3,
   "mutual|source_code|vendor|high": 3,
   "mutual|source_code|partner|low": 2,
   "mutual|source_code|partner|medium": 3,
   "mutual|source_code|partner|high": 3,
   "mutual|source_code|competitor|low": 2,
   "mutual|source_code|competitor|medium": 3,
   "mutual|source_code|competitor|high": 3,
   "mutual|customer_data|customer|low": 0,
   "mutual|customer_data|customer|medium": 1,
   "mutual|customer_data|customer|high": 1,
   "mutual|customer_data|vendor|low": 0,
   "mutual|customer_data|vendor|medium": 1,
   "mutual|customer_data|vendor|high": 1,
   "mutual|customer_data|partner|low": 0,
   "mutual|customer_data|partner|medium": 1,
   "mutual|customer_data|partner|high": 1,
   "mutual|customer_data|competitor|low": 2,
   "mutual|customer_data|competitor|medium": 3,
   "mutual|customer_data|competitor|high": 3
  },
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
 "descriptor": "Mutual NDA carrying an IP assignment clause under Singapore law \u2014 two unacceptable Clause Types; the Shadow Judge's busiest file (30 risks).",
 "file_name": "1438076025NDA_28072015%20-%20AHPL.pdf",
 "absence_findings": [],
 "unmodeled_risks": [
  {
   "concern": "Fee-shifting: prevailing party recovers all professional fees and costs, including appeal.",
   "span": {
    "text": "In any suit or other proceeding relating to the subject matter of the Agreement, the prevailing party shall be entitled to recover from the other party all reasonable costs, fees and expenses by accountants, solicitors and other professionals for services rendered to the prevailing party in connection with the suit or other proceeding, including costs, fees and expenses of preparation and appeal.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Internal inconsistency in oral-disclosure confirmation window (15 days in definition vs 30 days in carve-out), creating a trap for oral information.",
   "span": {
    "text": "[or if disclosed orally, confirmed in writing by the disclosing party as such within fifteen (15) days after its disclosure]",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Anti-combination proviso strips the effect of the standard carve-outs where information is a combination of otherwise-excepted elements.",
   "span": {
    "text": "PROVIDED HOWEVER THAT the foregoing exceptions shall not apply to information relating to any combination of features or any combination of items of information merely because information relating to one or more of the relevant individual features or one or more of the relevant items (but not the combination itself) falls within any one or more of such exceptions.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Recipient is barred from using disclosed information even to demonstrate that information falls within a carve-out, effectively neutering the exceptions.",
   "span": {
    "text": "not to use the same for the purpose of guiding or conducting a search of any information, materials or sources, whether or not available to the public, for any purpose whatsoever, including without limitation, for the purpose of demonstrating that any information falls within one (1) of the exceptions in Clause 1;",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Only two business days' notice before legally compelled disclosure \u2014 impracticably short and may be impossible to comply with under court order.",
   "span": {
    "text": "but shall give the other party not less than two (2) business days' notice of such disclosure and shall consult with the Discloser prior to such disclosure with a view to avoiding such disclosure if legally possible",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Recipient must enforce third-party confidentiality obligations at its own expense on the Discloser's demand.",
   "span": {
    "text": "the Recipient shall enforce such obligations at its expense and at the request of the Discloser in so far as breach thereof relates to the Discloser's Confidential Information;",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Company assumes strict vicarious liability for breaches by a very broad class of persons including independent contractors and professional advisors.",
   "span": {
    "text": "The Company as the principal party shall be responsible and held liable for any breach of this Agreement by any of its directors, agents, employees, servants, officers, representatives, consultants, independent contractors and professional advisors.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "One-sided data clause: all AHPL data must be marked and recorded by the Company on all media and documentation, an onerous operational/audit-style obligation.",
   "span": {
    "text": "It shall be identified, clearly marked and recorded as such by the Company on all media and in all documentation.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Disposal of AHPL data must occur under Company supervision per AHPL's written instructions \u2014 a compliance/verification obligation beyond simple return.",
   "span": {
    "text": "Upon completion of this Agreement, the data will be either returned to AHPL or disposed of under the Company\u2019s supervision in accordance with the applicable laws and regulations, and the written instructions of AHPL.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Consent for commercial or derivative use of data must come from an undefined 'provider' rather than AHPL, creating ambiguity as to whose consent is needed.",
   "span": {
    "text": "or in the conduct of research that is subject to consulting, licensing or other similar legal or commercial obligations to another institution, corporation or business entity, unless the provider provides its prior written consent",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Publicity/existence-of-agreement confidentiality clause restricting use of the other party's name and disclosure of the deal.",
   "span": {
    "text": "Each party agrees to keep the existence and nature of this Agreement confidential and not to use the same or the name of the other party or of any other company in the Group of Companies of which the other party forms part in any publicity, advertisement or other disclosure with regard to this Agreement without the prior written consent of the other party, such consent not to be unreasonably withheld.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Pre-agreed stipulation of irreparable harm and entitlement to injunctive relief/specific performance for mere threatened breach.",
   "span": {
    "text": "The Recipient and Discloser both understand and agree that any breach of this Agreement will result in irreparable harm to the Discloser and because of the unique nature of the Confidential Information, monetary damages may not be an adequate remedy in the event of such a breach or threatened breach of this Agreement.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Automatic assignment of any registrations/applications filed by the Recipient to the Discloser at no cost \u2014 a de facto IP forfeiture remedy.",
   "span": {
    "text": "In the event that the Recipient does so in violation of this Agreement, the Recipient shall assign absolutely to the Discloser such registrations and applications without any cost to the Discloser.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Liability exclusion is disapplied for 'wilful acts, default or gross negligence', where mere 'default' effectively reopens full consequential-damages exposure for any breach.",
   "span": {
    "text": "but save for wilful acts, default or gross negligence on their respective parts, neither party shall be liable to the other party for any indirect, incidental, special, punitive or consequential damages however caused",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Deemed-service rule treats notice as validly served even if the post office returns it undelivered.",
   "span": {
    "text": "notwithstanding the fact that the letter may be returned by the Post Office undelivered",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Termination on 30 days' notice by either party, but survival list covers virtually every clause, so confidentiality obligations effectively persist regardless.",
   "span": {
    "text": "The provision of Clauses 1 to 8, 11 to 15 and 17 to 21 shall survive any such termination.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Assignment restriction extends even to successors/group reorganisations with no carve-out, plus an undefined limit that assignment 'shall not exceed the existing scope'.",
   "span": {
    "text": "(iii) any assignment shall not exceed the existing scope of this Agreement.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Severability allows unilateral termination where a severed provision materially changes a party's rights.",
   "span": {
    "text": "unless the severed provisions render the continuing performance of this Agreement impossible, or materially change either party\u2019s rights or obligations under this Agreement; in which event such party may give written notice of its intent to terminate this Agreement to the other party",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Non-mutual waiver clause: indulgences preserve only AHPL's rights, with no reciprocal protection for the Company.",
   "span": {
    "text": "Any time or other indulgence granted by AHPL under this Agreement shall be without prejudice to and shall not be taken as a waiver of any of AHPL\u2019s rights under this Agreement nor shall it prejudice or in any way limit or affect any statutory rights or powers from time to time vested in or exercisable by AHPL.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Mandatory pre-litigation mediation whose breach is itself deemed a contractual breach, blocking access to courts.",
   "span": {
    "text": "no party shall proceed to litigation or any other form of dispute resolution unless the parties have made reasonable efforts to resolve the same through mediation in accordance with the mediation rules of the Singapore Mediation Centre. A party who receives a notice for mediation from the other party shall consent and participate in the mediation process in accordance with this clause. Failure to comply with this clause shall be deemed to be a breach of this Agreement.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Dispute forum is unilaterally electable by either party (arbitration or court), creating forum uncertainty and race-to-file risk.",
   "span": {
    "text": "In the event that mediation is unsuccessful, the dispute shall be resolved either by reference to arbitration or by court proceedings as elected by either party, by way of a written notice to the other party, which shall state the specific dispute to be resolved and the nature of such dispute.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Fixed 6% per annum interest on arbitral awards, a non-standard pre-agreed rate.",
   "span": {
    "text": "Interest at the annual rate of six per cent (6%) per annum will be due and payable to the party in receipt of an arbitration award from such date as the arbitral tribunal may decide until the date of payment to such party.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Exclusion of Part II of the International Arbitration Act / Model Law, removing international arbitration protections and enforcement framework.",
   "span": {
    "text": "The application of Part II of the International Arbitration Act, and the Model Law referred thereto, to this Agreement is hereby excluded.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Cross-references throughout the dispute resolution clause point to Clause 14 (Waiver) instead of Clause 15, creating drafting defects that may undermine the procedure.",
   "span": {
    "text": "except in so far as such Rules conflict with the provisions of Clause 14 herein, in which event the provisions of Clause 14 herein will prevail",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "US export control compliance imposed on a Singapore-to-Singapore arrangement, including 'deemed export' rules.",
   "span": {
    "text": "Each party agrees to comply with all export laws and regulations (including \u201cdeemed export\u201d and \u201cdeemed re-export\u201d regulations) of the United States and any other relevant local export laws and regulations (\u201cExport Laws\u201d)",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Definitional asymmetry: 'Confidential Information' is defined almost entirely by reference to AHPL's information, including anything AHPL unilaterally deems confidential.",
   "span": {
    "text": "all information which is deemed by AHPL to be Confidential Information or which is generated as a result of or in connection with the business of AHPL and which is not generally available to the public",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Return obligation triggered by termination of 'the other party's services' \u2014 a services-contract concept absent from this NDA, allowing return demands at any time.",
   "span": {
    "text": "shall be returned to the Discloser forthwith on demand at any time or without demand upon the termination of the other party's services",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Recital asserts the Company's disclosure could expose it to criminal prosecution and judicial sanctions, an unusual admission usable against the Company.",
   "span": {
    "text": "and that its disclosure could not only expose AHPL to liability but also to judicial sanctions and that such disclosure might also adversely affect AHPL\u2019s patients and under certain circumstances, disclosure by the Company could expose the Company to criminal prosecution.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Confidentiality obligations are extended to an open-ended group of AHPL affiliates, including entities merely receiving support services from AHPL.",
   "span": {
    "text": "by reason that AHPL is obliged to provide support services to that organisation/institution for any reason",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Company must guarantee no AHPL patient is identifiable in its own reports and publications, and its publications are deemed AHPL Confidential Information.",
   "span": {
    "text": "The Company shall ensure that none of the patients of AHPL can be identified in any reports, submissions and publications of the Company, which shall be deemed to be Confidential information of AHPL within the meaning of this clause.",
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
