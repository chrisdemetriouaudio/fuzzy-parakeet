import { env } from "cloudflare:test";
import { describe, it, expect, vi, afterEach } from "vitest";
import { testEnv, fakeAI, post, call, cookieFrom, mockOutbound } from "./helpers.js";
import { parseExtraction } from "../chat/prompt.js";

afterEach(() => vi.restoreAllMocks());

const EXTRACTED = JSON.stringify({
  task: "Chasing unpaid invoices", trigger_frequency: "Every Friday", who: "The office manager",
  time_cost: "4 hours a week", current_tools: "Excel and Outlook", current_saas_spend: "£0", tried: "Reminders in Outlook",
  consequence: "Cash flow gaps", ideal_outcome: "Reminders go out by themselves", blueprint_match: ["Chasing Engine", "Payment Pipeline"], confidence: 0.8,
});

async function mappedChat(e) {
  const first = await call(post("/api/chat", { message: "We chase invoices every Friday.", turnstile: "t" }), e);
  return cookieFrom(first.res);
}
const good = { name: "Sam Patel", email: "Sam@Example.co.uk", org: "Patel Joinery", consent: true };

describe("POST /api/lead", () => {
  it("needs a chat", async () => {
    mockOutbound(vi);
    expect((await call(post("/api/lead", good), testEnv())).res.status).toBe(401);
  });

  it("checks every field in plain words", async () => {
    mockOutbound(vi);
    const e = testEnv({ AI: fakeAI(["Want this as your written audit? [[MAPPED]]"]) });
    const cookie = await mappedChat(e);
    const { res, text } = await call(post("/api/lead", { name: "", email: "nope", org: "x".repeat(121), consent: false }, { cookie }), e);
    expect(res.status).toBe(422);
    expect(Object.keys(JSON.parse(text).fields).sort()).toEqual(["consent", "email", "name", "org"]);
  });

  it("stores the lead, extracts the summary, invites the visitor and emails both", async () => {
    const out = mockOutbound(vi);
    const ai = fakeAI(["Want this as your written audit? [[MAPPED]]"], EXTRACTED);
    const e = testEnv({ AI: ai, RESEND_API_KEY: "re_test" });
    const cookie = await mappedChat(e);
    const { res } = await call(post("/api/lead", good, { cookie }), e);
    expect(res.status).toBe(200);

    const lead = await env.DB.prepare("SELECT * FROM leads").first();
    expect(lead).toMatchObject({ name: "Sam Patel", email: "sam@example.co.uk", org: "Patel Joinery", stage: "new" });
    expect(lead.consent_at).toBeGreaterThan(0);
    const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?1").bind(lead.user_id).first();
    expect(user).toMatchObject({ email: "sam@example.co.uk", role: "client" });
    const token = await env.DB.prepare("SELECT * FROM auth_tokens WHERE user_id = ?1").bind(user.id).first();
    expect(token.purpose).toBe("invite");
    expect(token.token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(token.expires_at - token.created_at).toBe(24 * 3600_000);
    expect((await env.DB.prepare("SELECT status FROM chats WHERE id = ?1").bind(lead.chat_id).first()).status).toBe("captured");

    const pain = await env.DB.prepare("SELECT * FROM pain_summary WHERE lead_id = ?1").bind(lead.id).first();
    expect(pain).toMatchObject({ task: "Chasing unpaid invoices", needs_review: 0, confidence: 0.8 });
    expect(JSON.parse(pain.blueprint_match)).toEqual(["Chasing Engine", "Payment Pipeline"]);
    // the extraction saw the whole chat, as data
    expect(ai.calls[1].input.messages[1].content).toMatch(/^<chat>\nAssistant: Hi, I'm Chris's AI assistant/);

    expect(out.sent).toHaveLength(2);
    const [toChris, toVisitor] = out.sent;
    expect(toChris.to).toEqual(["hello@chrisdemetriou.com"]);
    expect(toChris.subject).toBe("New lead: Patel Joinery: Chasing unpaid invoices");
    expect(toChris.reply_to).toBe("sam@example.co.uk");
    expect(toChris.text).toContain("Blueprint match: Chasing Engine, Payment Pipeline");
    expect(toChris.text).toContain("Visitor: We chase invoices every Friday.");
    expect(toVisitor.to).toEqual(["sam@example.co.uk"]);
    expect(toVisitor.text).toMatch(/Your private portal: https:\/\/chrisdemetriou\.com\/portal\/\?invite=[\w-]{40,}/);
    for (const m of out.sent) expect(m.html).toBeUndefined();
    // the plain token is only in the email, never in the database
    const plain = toVisitor.text.match(/invite=([\w-]+)/)[1];
    expect(JSON.stringify(await env.DB.prepare("SELECT * FROM auth_tokens").all())).not.toContain(plain);

    expect((await call(post("/api/lead", good, { cookie }), e)).res.status).toBe(409);
  });

  it("flags a summary the model got wrong, and keeps what it said", async () => {
    mockOutbound(vi);
    const e = testEnv({ AI: fakeAI(["Want this? [[MAPPED]]"], "Sure! Here's a summary: they chase invoices.") });
    const cookie = await mappedChat(e);
    await call(post("/api/lead", good, { cookie }), e);
    const pain = await env.DB.prepare("SELECT * FROM pain_summary").first();
    expect(pain.needs_review).toBe(1);
    expect(pain.raw_json).toContain("they chase invoices");
  });
});

describe("parseExtraction", () => {
  it("accepts fenced JSON and drops unknown blueprints", () => {
    const r = parseExtraction("```json\n" + JSON.stringify({ task: "x", blueprint_match: ["Client Portal", "Rocket"], confidence: 2 }) + "\n```");
    expect(r.ok).toBe(true);
    expect(r.value.blueprint_match).toEqual(["Client Portal"]);
    expect(r.value.confidence).toBe(1);
    expect(r.value.who).toBe("");
  });
  it("fails without a blueprint or a confidence", () => {
    expect(parseExtraction(JSON.stringify({ task: "x" })).ok).toBe(false);
    expect(parseExtraction("not json").ok).toBe(false);
  });
});
