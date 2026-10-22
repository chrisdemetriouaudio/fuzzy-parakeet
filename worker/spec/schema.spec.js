import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("D1 schema", () => {
  it("has every table", async () => {
    const { results } = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
    const names = results.map((r) => r.name);
    for (const t of ["chats", "messages", "users", "leads", "pain_summary", "audits", "scopes", "stage_events",
      "credentials", "auth_tokens", "auth_challenges", "auth_sessions", "usage_daily", "ip_usage"]) {
      expect(names).toContain(t);
    }
  });

  it("rejects an unknown stage", async () => {
    await env.DB.prepare("INSERT INTO chats (id, created_at, last_activity_at) VALUES ('c1', 1, 1)").run();
    await expect(env.DB.prepare("INSERT INTO leads (id, chat_id, stage, created_at, last_activity_at) VALUES ('l1', 'c1', 'won', 1, 1)").run())
      .rejects.toThrow();
  });
});
