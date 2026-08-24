window.NDA_DOC_9 = {
 "document_id": "9",
 "schema_version": 1,
 "clauses": [
  {
   "clause_type": "mutuality",
   "span": "VENDOR, its employees and/or representatives, hold the Confidential Information in trust for BPS\u2019s benefit, and shall, in addition to their respective obligations hereunder, use best efforts at all times to adopt and follow procedures and practices to protect the confidentiality of the Confidential Information and prevent its disclosure to others without the express written consent of BPS.",
   "attributes": {
    "clause_type": "mutuality",
    "direction": "one_way_protects_counterparty"
   }
  },
  {
   "clause_type": "term_survival",
   "span": "Upon request of BPS at any time, VENDOR shall return all or such part of the Confidential Information as BPS may designate to be returned. In addition, upon the completion of the services provided by VENDOR to BPS as outlined in this Agreement, VENDOR shall return or destroy, as BPS may instruct, all Confidential Information in VENDOR\u2019S possession or control, whether in printed, electronic or any other format, including all duplicates and copies thereof of any files, compilation, study, report, analysis or data base containing, based on or derived from the Confidential Information.",
   "attributes": {
    "clause_type": "term_survival",
    "term_years": null,
    "perpetual_scope": "all_information"
   }
  },
  {
   "clause_type": "confidentiality_definition",
   "span": "VENDOR acknowledges that in the course of providing services to BPS and its students, only VENDOR and its employees or representatives will be given or have access to certain directory, routing, and confidential student information (\u201cConfidential Information\u201d) which may typically protected from disclosure with or without prior consent by various laws including the Family Educational Rights and Privacy Act (FERPA) 20 U.S.C. \u00a7 1232g et seq., 34 C.F.R. \u00a7 99 et seq., and 603 C.M.R. 23.00 et seq.",
   "attributes": {
    "clause_type": "confidentiality_definition",
    "carveouts": [
     "legally_compelled"
    ],
    "oral_disclosure_covered": false
   }
  },
  {
   "clause_type": "governing_law",
   "span": "VENDOR and BPS agree that this Agreement is entered into in the State of Massachusetts, and that the courts located in the State of Massachusetts are the appropriate forum in the event any party seeks legal action or injunctive relief under this Agreement. All parties consent to venue and personal jurisdiction in the appropriate court in the State of Massachusetts.",
   "attributes": {
    "clause_type": "governing_law",
    "jurisdiction": "Massachusetts",
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
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
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
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
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
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
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
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
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
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
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
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
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
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
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
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
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
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
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
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
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
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
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
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
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
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
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
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
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
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
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
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|general_business|customer": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|general_business|vendor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|general_business|partner": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|general_business|competitor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|technical|customer": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|technical|vendor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|technical|partner": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|technical|competitor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|source_code|customer": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|source_code|vendor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|source_code|partner": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|source_code|competitor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|customer_data|customer": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|customer_data|vendor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|customer_data|partner": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "recipient|customer_data|competitor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|general_business|customer": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|general_business|vendor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|general_business|partner": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|general_business|competitor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|technical|customer": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|technical|vendor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|technical|partner": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|technical|competitor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|source_code|customer": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|source_code|vendor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|source_code|partner": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|source_code|competitor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|customer_data|customer": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|customer_data|vendor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|customer_data|partner": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
   },
   "governing_law": {
    "tier": "negotiable",
    "rule_id": "GL-2"
   }
  },
  "mutual|customer_data|competitor": {
   "mutuality": {
    "tier": "unacceptable",
    "rule_id": "CR-1"
   },
   "term_survival": {
    "tier": "unacceptable",
    "rule_id": "TS-1"
   },
   "confidentiality_definition": {
    "tier": "unacceptable",
    "rule_id": "CD-3"
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
      "tier": "unacceptable",
      "rule_id": "TS-1"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "unacceptable",
      "rule_id": "CR-1"
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
      "tier": "unacceptable",
      "rule_id": "MUT-3"
     },
     {
      "clause_type": "term_survival",
      "tier": "unacceptable",
      "rule_id": "TS-1"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "unacceptable",
      "rule_id": "CR-1"
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
      "tier": "unacceptable",
      "rule_id": "MUT-3"
     },
     {
      "clause_type": "term_survival",
      "tier": "unacceptable",
      "rule_id": "TS-1"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "unacceptable",
      "rule_id": "CR-1"
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
    "autonomy_eligible": false,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "unacceptable",
      "rule_id": "MUT-3"
     },
     {
      "clause_type": "term_survival",
      "tier": "unacceptable",
      "rule_id": "TS-1"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "unacceptable",
      "rule_id": "CR-1"
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
      "tier": "unacceptable",
      "rule_id": "CR-1"
     },
     {
      "clause_type": "term_survival",
      "tier": "unacceptable",
      "rule_id": "TS-1"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "unacceptable",
      "rule_id": "CD-3"
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
      "tier": "unacceptable",
      "rule_id": "CR-1"
     },
     {
      "clause_type": "term_survival",
      "tier": "unacceptable",
      "rule_id": "TS-1"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "unacceptable",
      "rule_id": "CD-3"
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
      "tier": "unacceptable",
      "rule_id": "CR-1"
     },
     {
      "clause_type": "term_survival",
      "tier": "unacceptable",
      "rule_id": "TS-1"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "unacceptable",
      "rule_id": "CD-3"
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
    "autonomy_eligible": false,
    "tiers": [
     {
      "clause_type": "mutuality",
      "tier": "unacceptable",
      "rule_id": "CR-1"
     },
     {
      "clause_type": "term_survival",
      "tier": "unacceptable",
      "rule_id": "TS-1"
     },
     {
      "clause_type": "confidentiality_definition",
      "tier": "unacceptable",
      "rule_id": "CD-3"
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
 "descriptor": "One-way NDA, perpetual over all information, three of four Carve-outs missing \u2014 Absence Findings, and Compounding Rule CR-1 fires.",
 "file_name": "17.04.01%20BPS%20Non-Disclosure%20and%20Data%20Sharing%20Agreement%20-%20Transportation%20Challenge%20vF.pdf",
 "absence_findings": [
  {
   "clause_type": null,
   "carveout": "publicly_known",
   "note": "Searched for public domain / publicly known carve-outs and resolved Confidential Information definition; no public domain exception exists."
  },
  {
   "clause_type": null,
   "carveout": "independently_developed",
   "note": "Searched for independent development terms; no independent development carve-out exists in the document."
  },
  {
   "clause_type": null,
   "carveout": "rightfully_received",
   "note": "Searched for third party receipt carve-outs; no rightful receipt exception exists in the document."
  }
 ],
 "unmodeled_risks": [
  {
   "concern": "Agreement is presented as strictly non-negotiable, foreclosing any redlining or amendment during signature.",
   "span": {
    "text": "NON-NEGOTIABLE CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT: TRANSPORTATION CHALLENGE 2017",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Recital deems Vendor an \"entity of the City of Boston,\" contradicting the independent-contractor clause and creating status/liability ambiguity.",
   "span": {
    "text": "each being a \u201cParty\u201d and both being the entities of the City of Boston",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "BPS holds pre-approval veto over every individual who may touch the data, and each must personally sign before starting work.",
   "span": {
    "text": "must be disclosed to and approved by BPS and sign this agreement prior to commencing work on or engaging in participation in the Transportation Data Challenge.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Open-ended audit/inspection right to demand proof of signed agreements at any time, for any reason, with no notice or scope limit.",
   "span": {
    "text": "BPS reserves the right to request proof or copies of any and all signed agreements by any vendor and its employees or representatives at any time, for any reason.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Trust language imposes quasi-fiduciary duty over the data rather than ordinary contractual confidentiality.",
   "span": {
    "text": "hold the Confidential Information in trust for BPS\u2019s benefit",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Heightened \"best efforts\" security standard rather than the customary reasonable-care standard.",
   "span": {
    "text": "use best efforts at all times to adopt and follow procedures and practices to protect the confidentiality of the Confidential Information",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Scope of data shared is open-ended and unilaterally expandable by the district.",
   "span": {
    "text": "The district will share the data below, along with potentially other data as may be deemed necessary and helpful.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "De-identification is only \"changed slightly\" yet includes home addresses and lat/long, leaving material re-identification risk on Vendor.",
   "span": {
    "text": "In this dataset, specific student information has been changed slightly to protect student confidentiality.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Affirmative operational obligation to build, host and administer a compliant secure database \u2014 a service commitment unusual in an NDA.",
   "span": {
    "text": "VENDOR shall maintain and administer a secure database (\u201cthe Database\u201d) for delivery and evaluation of information, and reporting purposes.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Vendor bears financial and administrative responsibility for data-breach notification costs, an uncapped cost-shifting remedy.",
   "span": {
    "text": "shall be financially responsible, if and to the extent that any security breach relating to protected personal information results from acts or omissions of VENDOR, its employees and/or representatives for any notifications to affected persons (after prompt consultation with BPS), and to the extent requested by BPS, administratively responsible for such notification",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "BPS may run background checks on any of Vendor's personnel accessing the data.",
   "span": {
    "text": "BPS reserves the right to conduct an appropriate background check on any and all participants with access to the Confidential Information pursuant to this agreement.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Vendor must litigate against subpoenas at BPS's discretion, at its own cost, rather than merely giving notice and cooperating.",
   "span": {
    "text": "shall challenge, oppose or appeal any such subpoena, order or legal process to the extent deemed appropriate by BPS",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Vendor must exhaust all legal remedies before complying with legal process, risking contempt exposure and unlimited legal spend.",
   "span": {
    "text": "In no event shall VENDOR voluntarily, without a court order, disclose or permit the disclosure of any of the Confidential Information in response to legal process unless and until VENDOR has given the required notice to BPS and VENDOR has exhausted any and all legal remedies available to it to limit or prevent the disclosure.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Return/destruction can be demanded at any time for any portion of the data, with no retention carve-out for archival copies or legal-hold obligations.",
   "span": {
    "text": "Upon request of BPS at any time, VENDOR shall return all or such part of the Confidential Information as BPS may designate to be returned.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "One-sided publicity/publication controls: Vendor cannot publish or even use its own reports without BPS consent, and BPS holds prior-review approval rights.",
   "span": {
    "text": "VENDOR shall not publish, present, or use reports without explicit written consent from BPS. BPS has the right to review and require approval of any publicly reported document prior to its release.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "BPS grants itself broad rights to publish and use data produced by Vendor, without a reciprocal license or attribution limits.",
   "span": {
    "text": "BPS has the right to report, present, publish, or otherwise use data to which it has produced or received from VENDOR.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Open-ended penalty clause invoking federal debarment-style exclusion plus undefined \"other penalties\" at law or equity.",
   "span": {
    "text": "may result in the BPS or the U.S. Department of Education denying VENDOR access to Confidential Information and other such penalties as dictated by law or equity",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Broken cross-reference: the breach clause cites \"Provision 4\" for return/destruction, but that obligation is in Provision 6.",
   "span": {
    "text": "return or destroy Confidential Information per Provision 4 above",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Pre-agreed irreparable harm plus injunctive relief with an express waiver of bond or security.",
   "span": {
    "text": "BPS may seek injunctive relief from an appropriate court to protect BPS from such harm without necessity of bond or other security",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "\"Immediate\" written AND verbal breach notice with no cure period or defined timeframe, triggered even by a threatened breach.",
   "span": {
    "text": "VENDOR shall give BPS immediate written and verbal notice of any unauthorized use or disclosure of the Confidential Information, or of any breach or threatened breach",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Asymmetric termination: BPS may terminate at will by verbal notice, while Vendor must give 3-day written and verbal notice.",
   "span": {
    "text": "BPS may terminate this agreement with VENDOR at any time, for any reason, with either written or verbal notice. VENDOR must give the designated BPS representative 3-day written and verbal notice of any termination of this agreement with BPS.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Uncapped one-way indemnity covering all claims, expressly including Vendor's intentional conduct and with no negligence carve-out for the City.",
   "span": {
    "text": "VENDOR shall indemnify and hold harmless the City of Boston, Boston Public Schools, and its Departments, agents, officers, and employees against any and all claims, liabilities, and costs for damages that the City may sustain which arise out of or in connection with VENDOR\u2019S performance of this Agreement, including but not limited to the negligent, reckless or intentional conduct of VENDOR",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Any reciprocal indemnity to Vendor is illusory, being conditioned on municipal appropriation.",
   "span": {
    "text": "Any indemnification of VENDOR shall be subject to appropriation and applicable law.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Indemnity extends to any breach of Vendor's IT systems, i.e., strict liability for cyber incidents regardless of fault.",
   "span": {
    "text": "breach of the indemnifying Party\u2019s IT system",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Duplicate section headings (two clauses titled \"Termination\") with a perpetual, open-ended survival provision and no defined term.",
   "span": {
    "text": "17. Termination. This Agreement shall survive the termination of the services to be provided by VENDOR or any other agreement by and between the parties.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Imports Massachusetts public-ethics/conflict-of-interest statute obligations onto a private vendor.",
   "span": {
    "text": "The parties\u2019 attention is called to General Laws c. 268A (the Conflict of Interest Law). No party shall act in collusion with any other party, person or entity to circumvent such law.",
    "start": -1,
    "end": -1
   }
  },
  {
   "concern": "Requires each individual employee to sign personally, creating direct personal liability outside the corporate entity.",
   "span": {
    "text": "If the vendor is not an individual, each individual of a particular vendor who will be working with this data is required to submit a signed NDA.",
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
