window.MCP_SEED = {
  tenant: "Harborline Retail",
  servers: [
    { id: "itsd", name: "IT Service Desk Skills", tier: "Draft", owner: "Alex Kim", version: "0.9.2" },
    { id: "hr", name: "HR Onboarding Skills", tier: "Certified", owner: "Riley Chen", version: "1.4.0" },
    { id: "fin", name: "Finance Close Skills", tier: "Deprecated", owner: "Sam Ortiz", version: "0.3.1" }
  ],
  roles: ["End User", "Agent Operator", "Admin"],
  tools: [
    { id: "ticket.create", risk: "low" },
    { id: "ticket.close", risk: "medium" },
    { id: "user.reset_password", risk: "high" },
    { id: "refund.create", risk: "high" },
    { id: "kb.search", risk: "low" }
  ],
  connectors: ["ServiceNow (simulated)", "Okta (simulated)", "Stripe (simulated)"]
};
