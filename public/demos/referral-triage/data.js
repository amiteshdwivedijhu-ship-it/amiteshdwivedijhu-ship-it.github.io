window.REFERRAL_TRIAGE = {
  program: "Northline Care",
  productName: "Referral Triage",
  autoFillRule: {
    fieldConfidenceMin: 92,
    batchAccuracyMin: 90,
    needsCitation: true,
    plain:
      "A field may auto-fill the EMR only when field confidence is at least 92%, a citation is present, and batch field accuracy is at least 90% on the last 10 synthetic faxes. Otherwise it stays on human review."
  },
  fields: [
    { id: "patientName", label: "Patient name" },
    { id: "dob", label: "Date of birth" },
    { id: "orderType", label: "Order type" },
    { id: "urgency", label: "Urgency" },
    { id: "referringProvider", label: "Referring provider" },
    { id: "specialty", label: "Destination specialty" }
  ],
  /* Batch outcomes used for the scorecard. Each entry is correct (true) or wrong (false) per field across prior synthetic faxes. */
  batch: {
    patientName: [true, true, true, true, true, true, true, true, true, true],
    dob: [true, true, true, true, true, true, true, true, false, true],
    orderType: [true, true, true, true, true, true, true, true, true, true],
    urgency: [true, false, true, true, false, true, true, false, true, true],
    referringProvider: [true, true, true, true, true, true, true, false, true, true],
    specialty: [true, true, true, false, true, true, true, true, true, true]
  },
  faxes: [
    {
      id: "fx-204",
      label: "FX-204 Cardiology consult",
      received: "Today 8:12 AM",
      isHappyPath: true,
      classification: { isReferral: true, confidence: 96 },
      faxText:
        "FAX TRANSMISSION\nFROM: Riverview Family Clinic\nTO: Northline Care Referrals\nPAGES: 1 of 1\nDATE: 10/05/2026 08:04\n\nEXTERNAL REFERRAL REQUEST\n\nPatient: Jordan Avery Miles\nDOB: 03/14/1978\nMRN (external): RV-44102\n\nOrder type: New patient consult\nUrgency: Routine\nRequested specialty: Cardiology\nPreferred site: Northline Heart Center\n\nReferring provider: Dr. Priya N. Shah, MD\nNPI: 1234567890\nPhone: (555) 010-2200\n\nReason: Progressive dyspnea on exertion x 6 weeks.\nPlease evaluate for possible cardiomyopathy.\n\nInsurance: Northline Preferred PPO\nAuth not obtained by referrer.\n\n-- end of page 1 --",
      fields: {
        patientName: {
          value: "Jordan Avery Miles",
          confidence: 98,
          cite: "Page 1, line Patient",
          low: false
        },
        dob: {
          value: "03/14/1978",
          confidence: 97,
          cite: "Page 1, line DOB",
          low: false
        },
        orderType: {
          value: "New patient consult",
          confidence: 95,
          cite: "Page 1, line Order type",
          low: false
        },
        urgency: {
          value: "Urgent",
          confidence: 71,
          cite: "Page 1, line Urgency",
          low: true,
          correctValue: "Routine",
          wrongWhy: "Model read Urgency as Urgent. Fax text says Routine."
        },
        referringProvider: {
          value: "Dr. Priya N. Shah, MD",
          confidence: 94,
          cite: "Page 1, line Referring provider",
          low: false
        },
        specialty: {
          value: "Cardiology",
          confidence: 96,
          cite: "Page 1, line Requested specialty",
          low: false
        }
      }
    },
    {
      id: "fx-198",
      label: "FX-198 Orthopedics",
      received: "Today 7:55 AM",
      classification: { isReferral: true, confidence: 93 },
      faxText:
        "FAX TRANSMISSION\nFROM: Lakeview Ortho Group\nTO: Northline Care Referrals\nPAGES: 1 of 1\n\nREFERRAL\nPatient: Sam Rivera\nDOB: 11/02/1991\nOrder: Follow-up consult\nUrgency: Routine\nSpecialty: Orthopedics\nReferring: Dr. Lee Park\n\n-- end --",
      fields: {
        patientName: { value: "Sam Rivera", confidence: 97, cite: "Page 1, Patient", low: false },
        dob: { value: "11/02/1991", confidence: 96, cite: "Page 1, DOB", low: false },
        orderType: { value: "Follow-up consult", confidence: 92, cite: "Page 1, Order", low: false },
        urgency: { value: "Routine", confidence: 94, cite: "Page 1, Urgency", low: false },
        referringProvider: { value: "Dr. Lee Park", confidence: 93, cite: "Page 1, Referring", low: false },
        specialty: { value: "Orthopedics", confidence: 95, cite: "Page 1, Specialty", low: false }
      }
    },
    {
      id: "fx-191",
      label: "FX-191 GI (needs review)",
      received: "Today 7:40 AM",
      classification: { isReferral: true, confidence: 88 },
      faxText:
        "FAX TRANSMISSION\nFROM: Harbor Primary\nTO: Northline Care Referrals\n\nPlease see GI for epigastric pain.\nPatient: Casey Quinn\nDOB: 07/19/1985\nUrgency: ASAP (handwritten)\nSpecialty: Gastroenterology\nReferring: Dr. Morgan Blake\n\n-- end --",
      fields: {
        patientName: { value: "Casey Quinn", confidence: 96, cite: "Page 1, Patient", low: false },
        dob: { value: "07/19/1985", confidence: 95, cite: "Page 1, DOB", low: false },
        orderType: { value: "New patient consult", confidence: 90, cite: "Page 1, Please see", low: false },
        urgency: {
          value: "Routine",
          confidence: 62,
          cite: "Page 1, Urgency",
          low: true,
          correctValue: "Urgent",
          wrongWhy: "Handwritten ASAP. Model defaulted to Routine."
        },
        referringProvider: { value: "Dr. Morgan Blake", confidence: 91, cite: "Page 1, Referring", low: false },
        specialty: { value: "Gastroenterology", confidence: 94, cite: "Page 1, Specialty", low: false }
      }
    },
    {
      id: "fx-187",
      label: "FX-187 Dermatology",
      received: "Yesterday 4:18 PM",
      classification: { isReferral: true, confidence: 97 },
      faxText:
        "FAX\nPatient: Avery Chen\nDOB: 01/22/2000\nOrder type: New patient consult\nUrgency: Routine\nSpecialty: Dermatology\nReferring provider: Dr. Nina Ortiz\n\n-- end --",
      fields: {
        patientName: { value: "Avery Chen", confidence: 99, cite: "Page 1, Patient", low: false },
        dob: { value: "01/22/2000", confidence: 98, cite: "Page 1, DOB", low: false },
        orderType: { value: "New patient consult", confidence: 96, cite: "Page 1, Order type", low: false },
        urgency: { value: "Routine", confidence: 95, cite: "Page 1, Urgency", low: false },
        referringProvider: { value: "Dr. Nina Ortiz", confidence: 94, cite: "Page 1, Referring", low: false },
        specialty: { value: "Dermatology", confidence: 97, cite: "Page 1, Specialty", low: false }
      }
    },
    {
      id: "fx-180",
      label: "FX-180 Not a referral",
      received: "Yesterday 3:02 PM",
      classification: { isReferral: false, confidence: 91 },
      faxText:
        "FAX TRANSMISSION\nFROM: Northline Lab\nTO: Riverview Family Clinic\n\nLAB RESULT SUMMARY (copy)\nPatient: Demo Only\nThis is a lab result fax, not a referral order.\n\n-- end --",
      fields: {
        patientName: { value: "Demo Only", confidence: 90, cite: "Page 1, Patient", low: false },
        dob: { value: "(not found)", confidence: 40, cite: "No DOB line", low: true, correctValue: "(not found)", wrongWhy: "No DOB on page." },
        orderType: { value: "(not a referral)", confidence: 91, cite: "Page 1 header", low: false },
        urgency: { value: "(n/a)", confidence: 88, cite: "n/a", low: false },
        referringProvider: { value: "(n/a)", confidence: 88, cite: "n/a", low: false },
        specialty: { value: "(n/a)", confidence: 88, cite: "n/a", low: false }
      }
    },
    {
      id: "fx-175",
      label: "FX-175 Neurology",
      received: "Yesterday 1:44 PM",
      classification: { isReferral: true, confidence: 94 },
      faxText:
        "REFERRAL REQUEST\nPatient: Riley Santos\nDOB: 09/08/1972\nOrder type: New patient consult\nUrgency: Urgent\nSpecialty: Neurology\nReferring provider: Dr. Hannah Cho\n\n-- end --",
      fields: {
        patientName: { value: "Riley Santos", confidence: 97, cite: "Page 1, Patient", low: false },
        dob: { value: "09/08/1972", confidence: 96, cite: "Page 1, DOB", low: false },
        orderType: { value: "New patient consult", confidence: 95, cite: "Page 1, Order type", low: false },
        urgency: { value: "Urgent", confidence: 93, cite: "Page 1, Urgency", low: false },
        referringProvider: { value: "Dr. Hannah Cho", confidence: 94, cite: "Page 1, Referring", low: false },
        specialty: { value: "Neurology", confidence: 96, cite: "Page 1, Specialty", low: false }
      }
    },
    {
      id: "fx-168",
      label: "FX-168 ENT blurry specialty",
      received: "Yesterday 11:20 AM",
      classification: { isReferral: true, confidence: 90 },
      faxText:
        "FAX\nPatient: Taylor Brooks\nDOB: 05/30/1988\nOrder type: New patient consult\nUrgency: Routine\nSpecialty: ENT / Otolaryngology (smudged)\nReferring provider: Dr. Omar Hassan\n\n-- end --",
      fields: {
        patientName: { value: "Taylor Brooks", confidence: 96, cite: "Page 1, Patient", low: false },
        dob: { value: "05/30/1988", confidence: 95, cite: "Page 1, DOB", low: false },
        orderType: { value: "New patient consult", confidence: 94, cite: "Page 1, Order type", low: false },
        urgency: { value: "Routine", confidence: 93, cite: "Page 1, Urgency", low: false },
        referringProvider: { value: "Dr. Omar Hassan", confidence: 92, cite: "Page 1, Referring", low: false },
        specialty: {
          value: "Endocrinology",
          confidence: 58,
          cite: "Page 1, Specialty",
          low: true,
          correctValue: "Otolaryngology",
          wrongWhy: "Smudged ENT line. Model guessed Endocrinology."
        }
      }
    },
    {
      id: "fx-160",
      label: "FX-160 Rheumatology",
      received: "Fri 4:05 PM",
      classification: { isReferral: true, confidence: 95 },
      faxText:
        "EXTERNAL REFERRAL\nPatient: Jamie Patel\nDOB: 12/11/1965\nOrder type: Follow-up consult\nUrgency: Routine\nSpecialty: Rheumatology\nReferring provider: Dr. Elena Ruiz\n\n-- end --",
      fields: {
        patientName: { value: "Jamie Patel", confidence: 98, cite: "Page 1, Patient", low: false },
        dob: { value: "12/11/1965", confidence: 97, cite: "Page 1, DOB", low: false },
        orderType: { value: "Follow-up consult", confidence: 94, cite: "Page 1, Order type", low: false },
        urgency: { value: "Routine", confidence: 95, cite: "Page 1, Urgency", low: false },
        referringProvider: { value: "Dr. Elena Ruiz", confidence: 93, cite: "Page 1, Referring", low: false },
        specialty: { value: "Rheumatology", confidence: 96, cite: "Page 1, Specialty", low: false }
      }
    },
    {
      id: "fx-152",
      label: "FX-152 Urology",
      received: "Fri 2:30 PM",
      classification: { isReferral: true, confidence: 96 },
      faxText:
        "REFERRAL\nPatient: Chris Nguyen\nDOB: 04/04/1979\nOrder type: New patient consult\nUrgency: Routine\nSpecialty: Urology\nReferring provider: Dr. Seth Walker\n\n-- end --",
      fields: {
        patientName: { value: "Chris Nguyen", confidence: 97, cite: "Page 1, Patient", low: false },
        dob: { value: "04/04/1979", confidence: 96, cite: "Page 1, DOB", low: false },
        orderType: { value: "New patient consult", confidence: 95, cite: "Page 1, Order type", low: false },
        urgency: { value: "Routine", confidence: 94, cite: "Page 1, Urgency", low: false },
        referringProvider: { value: "Dr. Seth Walker", confidence: 94, cite: "Page 1, Referring", low: false },
        specialty: { value: "Urology", confidence: 97, cite: "Page 1, Specialty", low: false }
      }
    },
    {
      id: "fx-144",
      label: "FX-144 Pulmonology",
      received: "Fri 10:12 AM",
      classification: { isReferral: true, confidence: 92 },
      faxText:
        "FAX REFERRAL\nPatient: Morgan Ellis\nDOB: 08/17/1959\nOrder type: New patient consult\nUrgency: Urgent\nSpecialty: Pulmonology\nReferring provider: Dr. Grace Kim\n\n-- end --",
      fields: {
        patientName: { value: "Morgan Ellis", confidence: 96, cite: "Page 1, Patient", low: false },
        dob: { value: "08/17/1959", confidence: 95, cite: "Page 1, DOB", low: false },
        orderType: { value: "New patient consult", confidence: 93, cite: "Page 1, Order type", low: false },
        urgency: { value: "Urgent", confidence: 92, cite: "Page 1, Urgency", low: false },
        referringProvider: { value: "Dr. Grace Kim", confidence: 94, cite: "Page 1, Referring", low: false },
        specialty: { value: "Pulmonology", confidence: 95, cite: "Page 1, Specialty", low: false }
      }
    }
  ]
};
