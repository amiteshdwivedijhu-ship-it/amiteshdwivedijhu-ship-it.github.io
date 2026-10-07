/* Synthetic Brightline Freight traffic. Totals are seeded. The call rows are a sample. */
(function () {
  const groups = [
    {
      name: "Sales", size: 300,
      connectors: ["Salesforce read and write", "Google Drive read", "Zendesk read"],
      tools: ["Claude", "ChatGPT"],
      dlp: "No extra DLP on this group",
      model: "Frontier tier",
      cap: 6000,
      spend: 3200
    },
    {
      name: "Engineering", size: 400,
      connectors: ["Jira read and write", "Google Drive read and write", "Salesforce read"],
      tools: ["Claude", "Cursor"],
      dlp: "No extra DLP on this group",
      model: "Frontier tier",
      cap: 8000,
      spend: 4100
    },
    {
      name: "Support", size: 200,
      connectors: ["Zendesk read and write", "Google Drive read", "Salesforce read"],
      tools: ["Claude", "ChatGPT"],
      dlp: "No extra DLP on this group",
      model: "Frontier tier",
      cap: 5000,
      spend: 2800
    },
    {
      name: "Finance", size: 60,
      connectors: ["NetSuite read and write", "Google Drive read"],
      tools: ["ChatGPT"],
      dlp: "No extra DLP on this group",
      model: "Frontier tier",
      cap: 7000,
      spend: 1200
    },
    {
      name: "Contractors", size: 80,
      connectors: ["Salesforce read and write", "Google Drive read", "Jira read"],
      tools: ["ChatGPT"],
      dlp: "No extra DLP on this group",
      model: "Lower cost tier",
      cap: 2000,
      spend: 500
    }
  ];

  const workflows = [
    { name: "Sales Ops pipeline sync", owner: "Dana Ruiz", critical: true, callsPerWeek: 120, connector: "Salesforce", op: "write", action: "update_opportunity", group: "Contractors" },
    { name: "Support refund macros", owner: "Priya Shah", critical: true, callsPerWeek: 80, connector: "Zendesk", op: "write", action: "update_ticket", group: "Support" },
    { name: "Engineering sprint export", owner: "Jon Ellis", critical: true, callsPerWeek: 40, connector: "Jira", op: "read", action: "search_issues", group: "Engineering" },
    { name: "Finance month close", owner: "Avery Cole", critical: true, callsPerWeek: 25, connector: "NetSuite", op: "read", action: "get_invoice", group: "Finance" },
    { name: "Contractor file drop", owner: "Sam Lee", critical: false, callsPerWeek: 60, connector: "Google Drive", op: "write", action: "upload_file", group: "Contractors" },
    { name: "Sales forecast read", owner: "Dana Ruiz", critical: false, callsPerWeek: 90, connector: "Salesforce", op: "read", action: "get_opportunity", group: "Sales" }
  ];

  const first = ["Casey", "Riley", "Jordan", "Avery", "Quinn", "Morgan", "Parker", "Reese", "Skyler", "Devon"];
  const last = ["Nguyen", "Okonkwo", "Patel", "Brooks", "Singh", "Keller", "Diaz", "Hoffman", "Ibarra", "Cho"];
  const calls = [];
  let n = 1;
  function add(partial) {
    calls.push(Object.assign({
      id: "C-" + String(n).padStart(3, "0"),
      person: first[n % first.length] + " " + last[(n * 3) % last.length],
      client: "ChatGPT",
      containsPII: false,
      model: "frontier",
      cost: 0.04,
      kind: "tool"
    }, partial));
    n += 1;
  }

  add({ person: "Casey Nguyen", group: "Contractors", client: "ChatGPT", connector: "Salesforce", action: "update_opportunity", op: "write", workflow: "Sales Ops pipeline sync" });
  for (let i = 0; i < 11; i += 1) {
    add({ group: "Contractors", client: "ChatGPT", connector: "Salesforce", action: "update_opportunity", op: "write", workflow: "Sales Ops pipeline sync" });
  }
  for (let i = 0; i < 8; i += 1) {
    add({ group: "Contractors", connector: "Salesforce", action: "create_task", op: "write" });
  }
  for (let i = 0; i < 8; i += 1) {
    add({ group: "Support", connector: "Zendesk", action: "update_ticket", op: "write", containsPII: true, client: "Claude" });
  }
  for (let i = 0; i < 4; i += 1) {
    add({ group: "Sales", connector: "Zendesk", action: "read_ticket", op: "read", containsPII: true });
  }
  for (let i = 0; i < 3; i += 1) {
    add({ group: "Engineering", connector: "Jira", action: "get_issue", op: "read", containsPII: true, client: "Cursor" });
  }
  for (let i = 0; i < 10; i += 1) {
    add({ group: "Support", kind: "model", connector: "Model route", action: "answer_ticket", op: "read", model: "frontier", cost: 0.08, client: "Claude" });
  }
  for (let i = 0; i < 8; i += 1) {
    add({ group: "Engineering", connector: "Jira", action: "search_issues", op: "read", client: "Cursor" });
  }
  while (calls.length < 60) {
    add({ group: "Sales", connector: "Salesforce", action: "get_opportunity", op: "read" });
  }

  window.MERGE_DATA = {
    company: "Brightline Freight",
    employees: 1040,
    week: { toolCalls: 18400, modelCalls: 96000, spend: 11800 },
    liveVersion: "v12",
    groups: groups,
    workflows: workflows,
    calls: calls
  };
})();
