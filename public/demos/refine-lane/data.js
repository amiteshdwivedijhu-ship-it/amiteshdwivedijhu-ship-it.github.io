window.REFINE_LANE = {
  program: "Northline Med AI",
  modalities: [
    {
      id: "cxr",
      title: "Chest X-ray lesion polygon",
      kind: "region",
      demand: "High. 38 open requests this month. Synthetic count.",
      gap: "SAM auto-segmentation drafts polygons on desktop web labeling. The phone lane does not yet force the same refine step before gold.",
      disagree: "22% disagreement on the lesion edge. Synthetic rate.",
      caseId: "CXR-204",
      draftLead: "AI draft, SAM-style region. Not a live model call.",
      badLine: "Known bad edge is still on the draft. The lower border crosses into clear lung.",
      goodLine: "Known bad edge is trimmed. The remaining outline is the expert edit.",
      editLabel: "Edit edge"
    },
    {
      id: "path",
      title: "Pathology report NER",
      kind: "span",
      demand: "Medium. 17 open requests this month. Synthetic count.",
      gap: "Named entity ranges exist. A negated span can still be highlighted as the finding, and gold does not wait for that fix.",
      disagree: "14% disagreement on where the span ends. Synthetic rate.",
      caseId: "PATH-118",
      draftLead: "AI draft, highlighted span. Not a live model call.",
      before: "Skin biopsy. ",
      badSpan: "No evidence of melanoma",
      mid: ". A ",
      goodSpan: "benign nevus",
      after: " is present.",
      badLine: "Known bad span is still on the draft. It highlights melanoma inside a negation.",
      goodLine: "Known bad span is off. The highlight sits on benign nevus.",
      editLabel: "Edit span"
    },
    {
      id: "icd",
      title: "Discharge summary ICD mapping",
      kind: "code",
      demand: "Growing. 11 open requests this month. Synthetic count.",
      gap: "A fixed choice can name a code. The tool does not tie that code to the right span, so a family-history line can ride along.",
      disagree: "19% disagreement on which span owns the code. Synthetic rate.",
      caseId: "DC-077",
      draftLead: "AI draft, span plus demo code. Not a live model call. Not a coding recommendation.",
      before: "Discharge note. Treated for ",
      goodSpan: "community acquired pneumonia",
      mid: ". ",
      badSpan: "Family history of diabetes",
      after: ".",
      badCode: "E11.9",
      goodCode: "J18.9",
      badLine: "Known bad span is still on the draft. Family history is mapped as the patient problem (demo code E11.9).",
      goodLine: "Known bad span is off. The code sits on the treated-for line (demo code J18.9).",
      editLabel: "Edit span"
    }
  ]
};
