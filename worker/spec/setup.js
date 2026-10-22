import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach } from "vitest";

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

// Every test starts with empty tables.
const TABLES = ["messages", "pain_summary", "audits", "scopes", "stage_events", "credentials", "auth_tokens",
  "auth_challenges", "auth_sessions", "leads", "users", "chats", "usage_daily", "ip_usage", "job_runs"];
beforeEach(async () => {
  await env.DB.batch(TABLES.map((t) => env.DB.prepare(`DELETE FROM ${t}`)));
});
