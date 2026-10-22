// Shared test helpers: a fake Workers AI, a test env and request builders.
import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import worker from "../index.js";

const enc = new TextEncoder();

export function sseStream(chunks) {
  return new ReadableStream({
    start(c) {
      for (const t of chunks) c.enqueue(enc.encode(`data: ${JSON.stringify({ response: t })}\n\n`));
      c.enqueue(enc.encode("data: [DONE]\n\n"));
      c.close();
    },
  });
}

// Each run() takes the next scripted reply: an array of chunks (streamed), a string
// (non-streamed), or an Error (thrown).
export function fakeAI(...replies) {
  const calls = [];
  return {
    calls,
    async run(model, input) {
      calls.push({ model, input });
      const r = replies.shift();
      if (r instanceof Error) throw r;
      if (r === undefined) throw new Error("no scripted reply");
      return input.stream ? sseStream(r) : { response: r };
    },
  };
}

export function testEnv(overrides = {}) {
  return {
    ...env,
    CHAT_ENABLED: "on",
    SESSION_SECRET: "test-session-secret",
    IP_HASH_SALT: "test-salt",
    TURNSTILE_SECRET: "1x0000000000000000000000000000000AA",
    ADMIN_EMAIL: "hello@chrisdemetriou.com",
    ASSETS: { fetch: async () => new Response("<p>asset</p>", { headers: { "content-type": "text/html" } }) },
    AI: fakeAI(),
    ...overrides,
  };
}

export function post(path, body, { cookie, ip = "203.0.113.7", origin = "https://chrisdemetriou.com" } = {}) {
  const headers = { "content-type": "application/json", "cf-connecting-ip": ip };
  if (origin) headers.origin = origin;
  if (cookie) headers.cookie = cookie;
  return new Request(`https://chrisdemetriou.com${path}`, { method: "POST", headers, body: JSON.stringify(body) });
}

export async function call(request, e) {
  const ctx = createExecutionContext();
  const res = await worker.fetch(request, e, ctx);
  const text = await res.text();
  await waitOnExecutionContext(ctx);
  return { res, text, events: parseEvents(text) };
}

export function parseEvents(text) {
  return text.split("\n\n").filter((b) => b.startsWith("data: ")).map((b) => JSON.parse(b.slice(6)));
}

export const cookieFrom = (res) => (res.headers.get("set-cookie") || "").split(";")[0];

// Turnstile's verify call answers "passed for chrisdemetriou.com"; Resend's answers 200.
export function mockOutbound(vi, { turnstile = true } = {}) {
  const sent = [];
  const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.includes("challenges.cloudflare.com")) {
      return Response.json({ success: turnstile, hostname: "chrisdemetriou.com", action: "chat" });
    }
    if (url.includes("api.resend.com")) {
      sent.push(JSON.parse(init.body));
      return Response.json({ id: "email-1" });
    }
    throw new Error(`unexpected fetch ${url}`);
  });
  return { spy, sent };
}
