import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { runRetention } from "../retention.js";

const DAY = 86400_000;
const now = Date.UTC(2027, 5, 15, 3, 17);

async function chat(id, lastActivity, { lead = null, stage = "new", userId = null } = {}) {
  await env.DB.prepare("INSERT INTO chats (id, created_at, last_activity_at, ip_hash, status) VALUES (?1, ?2, ?2, 'abc123', 'open')").bind(id, lastActivity).run();
  await env.DB.prepare("INSERT INTO messages (chat_id, role, content, created_at) VALUES (?1, 'user', ?2, ?3)")
    .bind(id, "I'm Sam Patel, call 07700 900123 or sam@example.co.uk. Our rota is a mess.", lastActivity).run();
  if (lead) {
    if (userId) await env.DB.prepare("INSERT OR IGNORE INTO users (id, email, role, created_at) VALUES (?1, 'sam@example.co.uk', 'client', 1)").bind(userId).run();
    await env.DB.prepare(`INSERT INTO leads (id, chat_id, user_id, name, email, org, stage, created_at, last_activity_at)
      VALUES (?1, ?2, ?3, 'Sam Patel', 'sam@example.co.uk', 'Patel Joinery', ?4, ?5, ?5)`).bind(lead, id, userId, stage, lastActivity).run();
  }
}
const msg = (id) => env.DB.prepare("SELECT content FROM messages WHERE chat_id = ?1").bind(id).first();
const row = (id) => env.DB.prepare("SELECT * FROM chats WHERE id = ?1").bind(id).first();

describe("the daily retention job", () => {
  it("anonymises quiet chats that never became a lead, and leaves recent ones alone", async () => {
    await chat("old", now - 31 * DAY);
    await chat("recent", now - 5 * DAY);
    const counts = await runRetention(env, now);
    expect(counts.chats).toBe(1);
    const old = await row("old");
    expect(old.ip_hash).toBeNull();
    expect(old.anonymised_at).toBe(now);
    expect(old.status).toBe("abandoned");
    const text = (await msg("old")).content;
    expect(text).toContain("Our rota is a mess.");
    for (const pii of ["Sam Patel", "07700", "sam@example"]) expect(text).not.toContain(pii);
    expect((await row("recent")).ip_hash).toBe("abc123");
    expect((await msg("recent")).content).toContain("07700");
    expect((await runRetention(env, now)).chats).toBe(0);   // done once
  });

  it("purges quiet leads that never became work, keeps ones that did", async () => {
    const old = now - 400 * DAY;
    await chat("c1", old, { lead: "quiet", stage: "audit_sent", userId: "u1" });
    await chat("c2", old, { lead: "client", stage: "building" });
    await chat("c3", now - 30 * DAY, { lead: "fresh", stage: "new" });
    const counts = await runRetention(env, now);
    expect(counts).toMatchObject({ leads: 1, accounts: 1 });
    const quiet = await env.DB.prepare("SELECT * FROM leads WHERE id = 'quiet'").first();
    expect(quiet).toMatchObject({ name: null, email: null, org: null, user_id: null, purged_at: now });
    expect((await msg("c1")).content).not.toContain("Sam");
    expect(await env.DB.prepare("SELECT * FROM users WHERE id = 'u1'").first()).toBeNull();
    expect((await env.DB.prepare("SELECT name FROM leads WHERE id = 'client'").first()).name).toBe("Sam Patel");
    expect((await env.DB.prepare("SELECT name FROM leads WHERE id = 'fresh'").first()).name).toBe("Sam Patel");
    // a chat that has a lead isn't touched by the chat rule
    expect((await row("c3")).anonymised_at).toBeNull();
  });

  it("clears old counters and expired sign-in records", async () => {
    await env.DB.prepare("INSERT INTO ip_usage (ip_hash, date, messages) VALUES ('a', '2027-06-01', 3), ('b', '2027-06-14', 2)").run();
    await env.DB.prepare("INSERT INTO users (id, email, role, created_at) VALUES ('u9', 'x@example.com', 'client', 1)").run();
    await env.DB.prepare("INSERT INTO auth_sessions (id_hash, user_id, created_at, expires_at) VALUES ('s-old', 'u9', 1, ?1), ('s-live', 'u9', 1, ?2)").bind(now - 1, now + DAY).run();
    await runRetention(env, now);
    const { results } = await env.DB.prepare("SELECT ip_hash FROM ip_usage").all();
    expect(results.map((r) => r.ip_hash)).toEqual(["b"]);
    const { results: s } = await env.DB.prepare("SELECT id_hash FROM auth_sessions").all();
    expect(s.map((r) => r.id_hash)).toEqual(["s-live"]);
  });
});

describe("the scrubber", async () => {
  const { scrub } = await import("../privacy.js");
  it("removes contact details and introduced names, keeps the problem and our own links", () => {
    const out = scrub("Hi, my name is Jo Bloggs. Email jo.b@firm.co.uk, ring +44 161 496 0000, see https://linkedin.com/in/jobloggs. Genesis looked good: https://genesis.labs.chrisdemetriou.com/ We use Excel.");
    expect(out).toBe("Hi, my name is [name]. Email [email], ring [phone], see [link]. Genesis looked good: https://genesis.labs.chrisdemetriou.com/ We use Excel.");
  });
  it("removes known values anywhere, any case", () => {
    expect(scrub("PATEL JOINERY runs on spreadsheets", ["Patel Joinery"])).toBe("[removed] runs on spreadsheets");
  });
  it("doesn't treat ordinary words after 'I'm' as names", () => {
    expect(scrub("I'm Just checking. It's Monday again.")).toBe("I'm Just checking. It's Monday again.");
  });
});

describe("starting the job without a cron", async () => {
  const { maybeRunRetention } = await import("../retention.js");
  const { createExecutionContext, waitOnExecutionContext } = await import("cloudflare:test");
  it("runs at most every 6 hours, however many requests arrive", async () => {
    await chat("old", now - 40 * DAY);
    const ctx = createExecutionContext();
    const runs = await Promise.all([maybeRunRetention(env, ctx, now), maybeRunRetention(env, ctx, now), maybeRunRetention(env, ctx, now + 1000)]);
    await waitOnExecutionContext(ctx);
    expect(runs.filter(Boolean)).toHaveLength(1);
    expect((await row("old")).anonymised_at).toBe(now);
    expect(await maybeRunRetention(env, createExecutionContext(), now + 5 * 3600_000)).toBe(false);
    expect(await maybeRunRetention(env, createExecutionContext(), now + 7 * 3600_000)).toBe(true);
  });
});
