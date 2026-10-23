// Fact buttons and the summary card (D35), behind CHAT_NEXT.
import { env } from "cloudflare:test";
import { describe, it, expect, vi, afterEach } from "vitest";
import { testEnv, fakeAI, post, call, cookieFrom, mockOutbound } from "./helpers.js";
import { createTokenFilter, visibleReply } from "../chat/stream.js";

afterEach(() => vi.restoreAllMocks());

const BRIEF = JSON.stringify({
  task: "Rescheduling client sessions", trigger_frequency: "About 10 times a week", who: "The owner",
  time_cost: "An hour each time", current_tools: "Gmail and Google Calendar", current_saas_spend: "Nothing",
  tried: "A booking link", consequence: "Double bookings", ideal_outcome: "Clients pick a new slot themselves",
  blueprint_match: ["Booking Engine", "Reminder Pipeline"], confidence: 0.8,
});
const REPLIES = [["What happens when a client wants to move?"], ["How many hours a week does it take? [[ASK:hours]]"],
  ["I have what Chris needs. Want this as your written audit? [[MAPPED]]"]];
const nextEnv = (ai, extra = {}) => testEnv({ CHAT_NEXT: "preview", AI: ai, RESEND_API_KEY: "re_test", ...extra });

async function mappedChat(e, next = true) {
  const first = await call(post("/api/chat", { message: "We reschedule sessions by email.", turnstile: "t", next }), e);
  const cookie = cookieFrom(first.res);
  const second = await call(post("/api/chat", { message: "About ten times a week.", next }, { cookie }), e);
  const third = await call(post("/api/chat", { message: "Fixed means clients pick a slot.", next }, { cookie }), e);
  return { cookie, second, third };
}

describe("fact buttons", () => {
  it("removes [[ASK:…]] tags even when they arrive in pieces, and only offers known sets", () => {
    const f = createTokenFilter();
    const out = ["How many hours a week? ", "[[AS", "K:ho", "urs]]"].map((p) => f.push(p)).join("") + f.end();
    expect(out).toBe("How many hours a week? ");
    expect(visibleReply(f.raw, 2)).toMatchObject({ text: "How many hours a week?", ask: "hours", mapped: false });
    expect(visibleReply("Which colour? [[ASK:colour]]", 2)).toMatchObject({ text: "Which colour?", ask: null, askDropped: true });
    expect(visibleReply("Want this as your written audit? [[ASK:hours]] [[MAPPED]]", 3)).toMatchObject({ mapped: true, ask: null });
    // a paraphrase of the rules is a leak too (eval run 3, D37); ordinary replies are not
    expect(visibleReply("The goal is to describe one task. The rules include not quoting build prices and not listing services. What's yours?", 2)).toMatchObject({ leaked: true });
    expect(visibleReply("I'm not Chris, I'm his AI assistant. Chris gives a fixed price after a written scope. What's the task?", 2)).toMatchObject({ leaked: false });
    // the buttons show only when the last question is about that fact (eval run 3, D37)
    expect(visibleReply("What software do you use for it? [[ASK:spend]]", 2)).toMatchObject({ ask: null, askDropped: true });
    expect(visibleReply("Got it. How much do you spend a month on that software? [[ASK:spend]]", 2)).toMatchObject({ ask: "spend", askDropped: false });
  });

  it("uses the button prompt and sends the set only when CHAT_NEXT allows it", async () => {
    mockOutbound(vi);
    const ai = fakeAI(...REPLIES);
    const { second } = await mappedChat(nextEnv(ai));
    expect(ai.calls[0].input.messages[0].content).toContain("TAP ANSWERS");
    expect(second.events.at(-1)).toEqual({ done: true, mapped: false, ask: "hours" });
    expect(second.events.filter((x) => x.t).map((x) => x.t).join("")).not.toContain("[[");

    const off = fakeAI(["Hi?"]);
    await call(post("/api/chat", { message: "Hi", turnstile: "t", next: true }), testEnv({ AI: off }));
    expect(off.calls[0].input.messages[0].content).not.toContain("TAP ANSWERS");
    const notAsked = fakeAI(["Hi?"]);
    await call(post("/api/chat", { message: "Hi", turnstile: "t" }), nextEnv(notAsked));
    expect(notAsked.calls[0].input.messages[0].content).not.toContain("TAP ANSWERS");
  });

  it("tells a preview widget the sets, and an ordinary one nothing", async () => {
    const get = (q) => call(new Request(`https://chrisdemetriou.com/api/chat/config${q}`), testEnv({ CHAT_NEXT: "preview", TURNSTILE_SITE_KEY: "k" }));
    const preview = JSON.parse((await get("?preview=1")).text);
    expect(preview.next).toBe(true);
    expect(preview.quick.hours).toContain("1–3 hours a week");
    const plain = JSON.parse((await get("")).text);
    expect(plain.next).toBe(false);
    expect(plain.quick).toBeUndefined();
  });
});

describe("the summary card", () => {
  it("extracts the brief once and shows the visitor fields, never the blueprint match", async () => {
    mockOutbound(vi);
    const ai = fakeAI(...REPLIES, BRIEF);
    const e = nextEnv(ai);
    const { cookie, third } = await mappedChat(e);
    expect(third.events.at(-1)).toEqual({ done: true, mapped: true });
    const first = await call(post("/api/brief", { next: true }, { cookie }), e);
    const body = JSON.parse(first.text);
    expect(body.fields).toMatchObject({ task: "Rescheduling client sessions", time_cost: "An hour each time" });
    expect(body.labels[0]).toEqual(["task", "The task"]);
    expect(first.text).not.toMatch(/blueprint|Booking Engine|confidence/i);
    const again = await call(post("/api/brief", { next: true }, { cookie }), e);
    expect(JSON.parse(again.text)).toEqual(body);
    expect(ai.calls).toHaveLength(4);   // 3 chat replies + 1 extraction, not 2
  });

  it("needs a mapped chat, and CHAT_NEXT", async () => {
    mockOutbound(vi);
    const e = nextEnv(fakeAI(["Tell me more?"]));
    const first = await call(post("/api/chat", { message: "Invoices.", turnstile: "t", next: true }), e);
    const cookie = cookieFrom(first.res);
    expect((await call(post("/api/brief", { next: true }, { cookie }), e)).res.status).toBe(409);
    expect((await call(post("/api/brief", { next: true }, { cookie }), testEnv())).res.status).toBe(404);
    expect((await call(post("/api/brief", { next: true }), e)).res.status).toBe(401);
  });

  it("falls back to the contact form when the brief can't be extracted", async () => {
    mockOutbound(vi);
    const e = nextEnv(fakeAI(...REPLIES, "Sure! They reschedule sessions."));
    const { cookie } = await mappedChat(e);
    expect(JSON.parse((await call(post("/api/brief", { next: true }, { cookie }), e)).text)).toEqual({ fallback: "lead" });
  });

  it("keeps the visitor's corrections, and /api/lead uses them without another model call", async () => {
    const out = mockOutbound(vi);
    const ai = fakeAI(...REPLIES, BRIEF);
    const e = nextEnv(ai);
    const { cookie } = await mappedChat(e);
    await call(post("/api/brief", { next: true }, { cookie }), e);
    const ok = await call(post("/api/brief/confirm", { next: true, fields: { time_cost: "  Two hours a week ", task: "Rescheduling client sessions", nope: "x" } }, { cookie }), e);
    expect(JSON.parse(ok.text)).toEqual({ ok: true });
    const chat = await env.DB.prepare("SELECT * FROM chats ORDER BY created_at DESC LIMIT 1").first();
    expect(chat.brief_edited).toBe(1);
    expect(chat.brief_confirmed_at).toBeGreaterThan(0);

    const lead = await call(post("/api/lead", { name: "Ana Ruiz", email: "ana@example.com", org: "", consent: true }, { cookie }), e);
    expect(lead.res.status).toBe(200);
    expect(ai.calls).toHaveLength(4);   // no second extraction
    const pain = await env.DB.prepare("SELECT * FROM pain_summary").first();
    expect(pain).toMatchObject({ time_cost: "Two hours a week", task: "Rescheduling client sessions", needs_review: 0 });
    expect(JSON.parse(pain.blueprint_match)).toEqual(["Booking Engine", "Reminder Pipeline"]);
    const after = await env.DB.prepare("SELECT brief_json, brief_raw FROM chats WHERE id = ?1").bind(chat.id).first();
    expect(after).toEqual({ brief_json: null, brief_raw: null });
    expect(out.sent[0].text).toContain("PAIN SUMMARY (corrected by the visitor)");
  });
});
