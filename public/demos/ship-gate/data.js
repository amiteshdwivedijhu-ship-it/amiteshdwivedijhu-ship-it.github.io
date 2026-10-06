/*
  Ship Gate seed data. Synthetic only.
  Org: Northline Eng (fake). Repos, PRs, sessions, users, and credit spend are made up.
  No real customer code, no real secrets, no real people.
*/
window.SHIP_GATE_SEED = {
  org: {
    name: "Northline Eng",
    maxAutonomy: "High",
    dailyCreditLimitPerUser: 2000,
    reviewer: "Reviewer R"
  },

  // Org permission rules that can pause a session with decision "ask".
  rules: {
    "org/git-push": {
      id: "org/git-push",
      decision: "ask",
      match: "git push * main | git push * release/*",
      why: "Pushes to protected branches need a platform lead."
    },
    "org/deploy-prod": {
      id: "org/deploy-prod",
      decision: "ask",
      match: "nl-deploy * --env prod",
      why: "Production deploys need a platform lead."
    },
    "org/db-migrate": {
      id: "org/db-migrate",
      decision: "ask",
      match: "nl-migrate apply *",
      why: "Schema changes on shared databases need a platform lead."
    }
  },

  telemetry: {
    lateSessions: ["ses_nl_7c2e91d04b3a4f18a6", "ses_nl_d13f0a77e2c94b05b1"],
    lastSyncMinutes: 14
  },

  items: [
    {
      id: "g-101",
      primary: true,
      kind: "push",
      repo: "northline-eng/checkout-service",
      title: "Ship checkout-tax fix",
      command: "git push origin main",
      ruleId: "org/git-push",
      user: "Dev K.",
      principal: "user",
      sessionId: "ses_nl_4f8a2b19c7d6e3a05b7f21c9e8d4",
      autonomy: "Medium",
      requested: "High",
      credits: 412,
      tokens: 1860000,
      waitMin: 6,
      creditTrend: [12, 30, 44, 61, 90, 132, 170, 228, 301, 356, 390, 412],
      intent: "Fix rounding in state sales tax at checkout so totals match the invoice. Open a PR and ship to main when tests pass.",
      pr: { label: "northline-eng/checkout-service#4182", title: "Fix half-cent rounding in tax calc" },
      issue: { label: "NL-2291", title: "Checkout tax off by 1 cent in 3 states" },
      sha: "9e41c07b2d58f3a6e1c4b0d97a2f8e35c61b4d02",
      files: [
        { path: "src/payments/tax/calc.ts", add: 38, del: 12, note: "Changes rounding from floor to banker's rounding.", flag: "payments" },
        { path: "src/payments/tax/rates.json", add: 3, del: 3, note: "Updates rates for 3 states.", flag: "payments" },
        { path: "test/payments/tax/calc.test.ts", add: 64, del: 0, note: "Adds 11 test cases for half-cent totals.", flag: "" }
      ],
      chips: [
        { text: "tests green", tone: "pass" },
        { text: "coverage unknown", tone: "muted" }
      ],
      risks: [
        { tone: "warn", title: "Touches payments path", body: "2 files under src/payments/. A rounding change here moves money on every checkout." },
        { tone: "info", title: "Migration not in this card", body: "No schema change in this push. Any database change would open its own gate." }
      ],
      confirm: "I read the payments-path note. This push changes how tax is rounded at checkout."
    },
    {
      id: "g-102",
      kind: "deploy",
      repo: "northline-eng/billing-api",
      title: "Deploy invoice retry fix to prod",
      command: "nl-deploy billing-api --env prod",
      ruleId: "org/deploy-prod",
      user: "svc-release-bot",
      principal: "service account",
      sessionId: "ses_nl_7c2e91d04b3a4f18a6e0c55b",
      autonomy: "Medium",
      requested: "High",
      credits: 188,
      tokens: 640000,
      waitMin: 11,
      creditTrend: [8, 20, 41, 66, 90, 118, 140, 160, 175, 188],
      intent: "Roll out the invoice retry backoff change that merged yesterday.",
      pr: { label: "northline-eng/billing-api#977", title: "Exponential backoff for invoice retries" },
      issue: { label: "NL-2240", title: "Retry storm on invoice webhook" },
      sha: "c3b8d19f0a7e24c6b5d1e8f2a09c7b34e6d5f810",
      files: [
        { path: "src/invoices/retry.go", add: 22, del: 9, note: "Backoff grows from 2s to 64s.", flag: "" },
        { path: "deploy/prod/billing-api.yaml", add: 1, del: 1, note: "Image tag bump.", flag: "prod" }
      ],
      chips: [
        { text: "tests green", tone: "pass" },
        { text: "canary skipped", tone: "muted" }
      ],
      risks: [
        { tone: "warn", title: "Service account, not a person", body: "This ask comes from svc-release-bot. No human started this session today." },
        { tone: "info", title: "Credit data is late", body: "Spend for this session may be low until telemetry syncs." }
      ],
      confirm: "I checked that a service account is asking to deploy to prod."
    },
    {
      id: "g-103",
      kind: "migrate",
      repo: "northline-eng/ledger-db",
      title: "Add settled_at column to ledger",
      command: "nl-migrate apply 0142_add_settled_at",
      ruleId: "org/db-migrate",
      user: "Dev M.",
      principal: "user",
      sessionId: "ses_nl_b80e4c2a9f1d47e3c6a2d901",
      autonomy: "Low",
      requested: "High",
      credits: 96,
      tokens: 310000,
      waitMin: 19,
      creditTrend: [5, 14, 30, 41, 58, 70, 83, 96],
      intent: "Add a nullable settled_at column so finance can report on settlement lag.",
      pr: { label: "northline-eng/ledger-db#311", title: "Add settled_at to ledger_entries" },
      issue: { label: "NL-2203", title: "Finance needs settlement lag report" },
      sha: "5a0f2e7d13c94b68e2a1f7d0c3b95e84a26d1c7f",
      files: [
        { path: "migrations/0142_add_settled_at.sql", add: 6, del: 0, note: "ALTER TABLE adds a nullable column.", flag: "schema" }
      ],
      chips: [
        { text: "dry run passed", tone: "pass" },
        { text: "rollback script present", tone: "muted" }
      ],
      risks: [
        { tone: "warn", title: "Shared database", body: "ledger_entries has about 40M rows (synthetic). The lock is short for a nullable column, but not zero." }
      ],
      confirm: "I read the shared-database note and the lock risk."
    },
    {
      id: "g-104",
      kind: "push",
      repo: "northline-eng/web-storefront",
      title: "Ship promo banner copy fix",
      command: "git push origin main",
      ruleId: "org/git-push",
      user: "Dev K.",
      principal: "user",
      sessionId: "ses_nl_2d7a5e0c81f94b36a1e7c4d0",
      autonomy: "Medium",
      requested: "High",
      credits: 54,
      tokens: 150000,
      waitMin: 3,
      creditTrend: [4, 11, 19, 27, 38, 46, 54],
      intent: "Fix a typo in the fall promo banner.",
      pr: { label: "northline-eng/web-storefront#2207", title: "Fix promo banner typo" },
      issue: { label: "NL-2302", title: "Typo on fall promo banner" },
      sha: "e7c1a94b0d2f58e3c6b1a07d9f4e2c85b31d6a09",
      files: [
        { path: "src/components/PromoBanner.tsx", add: 1, del: 1, note: "Text only.", flag: "" }
      ],
      chips: [
        { text: "tests green", tone: "pass" }
      ],
      risks: [
        { tone: "info", title: "Low blast radius", body: "Text change in one component. No payments or auth code." }
      ],
      confirm: "I checked this is a text-only change."
    },
    {
      id: "g-105",
      kind: "deploy",
      repo: "northline-eng/search-indexer",
      title: "Deploy new ranking weights",
      command: "nl-deploy search-indexer --env prod",
      ruleId: "org/deploy-prod",
      user: "Dev S.",
      principal: "user",
      sessionId: "ses_nl_d13f0a77e2c94b05b1f8e62a",
      autonomy: "Medium",
      requested: "High",
      credits: 731,
      tokens: 3240000,
      waitMin: 27,
      creditTrend: [40, 95, 160, 240, 310, 402, 488, 560, 640, 731],
      intent: "Ship tuned ranking weights after offline tests.",
      pr: { label: "northline-eng/search-indexer#640", title: "Tune ranking weights v7" },
      issue: { label: "NL-2188", title: "Search relevance dropped for long queries" },
      sha: "1b9d4f7e2a0c83d6b5e1f9a2c7d04e68b3a5c1f2",
      files: [
        { path: "config/ranking/weights.yaml", add: 14, del: 14, note: "Shifts weight toward recency.", flag: "prod" }
      ],
      chips: [
        { text: "offline tests green", tone: "pass" },
        { text: "online impact unknown", tone: "muted" }
      ],
      risks: [
        { tone: "warn", title: "High spend for this session", body: "731 credits (synthetic). This is 37% of the user daily limit." },
        { tone: "info", title: "Credit data is late", body: "Spend for this session may be low until telemetry syncs." }
      ],
      confirm: "I read the spend note and know online impact is unknown."
    },
    {
      id: "g-106",
      kind: "push",
      repo: "northline-eng/auth-gateway",
      title: "Ship token refresh patch to release",
      command: "git push origin release/2026.10",
      ruleId: "org/git-push",
      user: "Dev A.",
      principal: "user",
      sessionId: "ses_nl_6e3c0b8f4a2d19e7c5b0a3f1",
      autonomy: "Medium",
      requested: "High",
      credits: 263,
      tokens: 1020000,
      waitMin: 41,
      creditTrend: [10, 32, 70, 105, 150, 190, 228, 263],
      intent: "Backport the token refresh fix to the October release branch.",
      pr: { label: "northline-eng/auth-gateway#1534", title: "Backport refresh token fix" },
      issue: { label: "NL-2275", title: "Sessions drop after 55 minutes" },
      sha: "f4a0d2c7e9b13a58c6e0f1b7d2a94c3e85b6d0a1",
      files: [
        { path: "src/auth/refresh.ts", add: 17, del: 6, note: "Refreshes 5 minutes before expiry.", flag: "auth" },
        { path: "test/auth/refresh.test.ts", add: 29, del: 0, note: "Adds expiry edge cases.", flag: "" }
      ],
      chips: [
        { text: "tests green", tone: "pass" },
        { text: "coverage unknown", tone: "muted" }
      ],
      risks: [
        { tone: "warn", title: "Touches auth path", body: "A bug here can log out every user. Release branch ships Thursday." }
      ],
      confirm: "I read the auth-path note."
    },
    {
      id: "g-107",
      kind: "migrate",
      repo: "northline-eng/orders-db",
      title: "Drop unused orders index",
      command: "nl-migrate apply 0088_drop_idx_orders_legacy",
      ruleId: "org/db-migrate",
      user: "Dev M.",
      principal: "user",
      sessionId: "ses_nl_09a7f3e1c5d24b86e0c9a7b3",
      autonomy: "Medium",
      requested: "High",
      credits: 71,
      tokens: 220000,
      waitMin: 52,
      creditTrend: [6, 18, 29, 40, 52, 63, 71],
      intent: "Drop an index that no query has used in 90 days (synthetic stat).",
      pr: { label: "northline-eng/orders-db#205", title: "Drop idx_orders_legacy" },
      issue: { label: "NL-2150", title: "Write latency on orders table" },
      sha: "8c2e5b0f7a1d94e3c6b2f0a8d5e17c4b39a6d2e0",
      files: [
        { path: "migrations/0088_drop_idx_orders_legacy.sql", add: 3, del: 0, note: "DROP INDEX CONCURRENTLY.", flag: "schema" }
      ],
      chips: [
        { text: "dry run passed", tone: "pass" },
        { text: "no rollback script", tone: "muted" }
      ],
      risks: [
        { tone: "warn", title: "No rollback script", body: "Re-creating this index takes about 25 minutes (synthetic)." }
      ],
      confirm: "I read the rollback note."
    }
  ],

  // Seed activity log (synthetic). Minutes before page load.
  log: [
    { minAgo: 52, actor: "Ship Gate", text: "Opened g-107. org/db-migrate fired for Dev M." },
    { minAgo: 41, actor: "Ship Gate", text: "Opened g-106. org/git-push fired for Dev A." },
    { minAgo: 33, actor: "Reviewer R", text: "Approved a deploy on northline-eng/notify-svc. Session resumed." },
    { minAgo: 6, actor: "Ship Gate", text: "Opened g-101. org/git-push fired for Dev K." }
  ]
};
