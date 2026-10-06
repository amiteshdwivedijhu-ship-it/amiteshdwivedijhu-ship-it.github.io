window.ALC_SEED = {
  customer: "Northbridge Mutual Bank",
  agents: [
    { id: "wire", name: "Wire Exception Triage Agent", status: "Draft", owner: "Priya Nair", track: "Financial services" },
    { id: "kyc", name: "KYC Doc Intake Agent", status: "Live", owner: "Sam Ortiz", track: "Financial services" },
    { id: "fraud", name: "Fraud Alert Summarizer", status: "Retiring", owner: "Priya Nair", track: "Financial services" }
  ],
  tools: [
    { id: "cases.read", label: "cases.read", scope: "case-queue:read" },
    { id: "cases.write", label: "cases.write", scope: "case-queue:write" },
    { id: "core.lookup", label: "core.lookup", scope: "core-banking:read" },
    { id: "wire.release", label: "wire.release", scope: "*" }
  ],
  runs: [
    { id: "r1", when: "09:02", result: "allow", latency: "1.2s", note: "Matched known exception code WX-17" },
    { id: "r2", when: "09:05", result: "approve", latency: "2.4s", note: "Amount over $25k needs human" },
    { id: "r3", when: "09:08", result: "block", latency: "0.9s", note: "Missing beneficiary country" },
    { id: "r4", when: "09:11", result: "allow", latency: "1.1s", note: "Routine mismatch cleared" }
  ],
  policyPack: "fs-wire-v3"
};
