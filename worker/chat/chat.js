// POST /api/chat: one visitor message in, the assistant's reply streamed back (SSE).
// Checks run before any model call, in this order: the global daily cap, this visitor's
// daily cap, the chat's turn cap, the message length. If one is hit, or the model fails,
// the answer is {"fallback":"form"} and the widget shows the audit form instead.
import { MODEL_ID, DAILY_MODEL_CALL_CAP, PER_IP_DAILY_MSGS, MAX_TURNS_PER_CHAT, MAX_INPUT_CHARS,
  MAX_REPLY_TOKENS, CHAT_COOKIE_TTL_HOURS } from "../config.js";
import { SYSTEM_PROMPT, OPENING, PROOF_LINKS, LEAK_REPLY, asVisitorData } from "./prompt.js";
import { createTokenFilter, aiText, sse, leaked, visibleReply } from "./stream.js";
import { passesTurnstile } from "./turnstile.js";
import { json, readJson, readCookie, cookie, today } from "../lib/http.js";
import { randomId, hashIp, sign, verify } from "../lib/crypto.js";

export const CHAT_COOKIE = "__Host-cd_chat";

// The chat id from the signed cookie, if it's genuine and not expired.
export async function chatFromCookie(request, env) {
  const value = await verify(env.SESSION_SECRET, readCookie(request, CHAT_COOKIE));
  if (!value) return null;
  const [id, exp] = value.split("|");
  return Number(exp) > Date.now() ? id : null;
}

async function capHit(env, day, reason) {
  await env.DB.prepare("INSERT INTO usage_daily (date, cap_hits) VALUES (?1, 1) ON CONFLICT (date) DO UPDATE SET cap_hits = cap_hits + 1")
    .bind(day).run();
  return json({ fallback: "form", reason });
}

export async function handleChat(request, env, ctx) {
  const body = await readJson(request);
  if (!body || typeof body.message !== "string" || !body.message.trim()) return json({ error: "message" }, 400);
  const message = body.message.trim();
  const now = Date.now();
  const day = today(now);
  const ip = request.headers.get("cf-connecting-ip") || "";
  const ipHash = await hashIp(ip, env.IP_HASH_SALT);

  // A new chat proves it's a person first (Turnstile), then gets a signed cookie.
  let chatId = await chatFromCookie(request, env);
  let chat = chatId ? await env.DB.prepare("SELECT * FROM chats WHERE id = ?1").bind(chatId).first() : null;
  let setCookie = null;
  if (!chat) {
    if (!(await passesTurnstile(env, body.turnstile, ip, new URL(request.url).hostname))) {
      return json({ error: "turnstile" }, 403);
    }
    chatId = randomId();
    const page = typeof body.page === "string" ? body.page.slice(0, 200) : null;
    await env.DB.batch([
      env.DB.prepare("INSERT INTO chats (id, created_at, last_activity_at, ip_hash, page) VALUES (?1, ?2, ?2, ?3, ?4)")
        .bind(chatId, now, ipHash, page),
      env.DB.prepare("INSERT INTO messages (chat_id, role, content, created_at) VALUES (?1, 'assistant', ?2, ?3)")
        .bind(chatId, OPENING, now),
      env.DB.prepare("INSERT INTO usage_daily (date, chats_started) VALUES (?1, 1) ON CONFLICT (date) DO UPDATE SET chats_started = chats_started + 1")
        .bind(day),
    ]);
    chat = { id: chatId, turn_count: 0, status: "open" };
    const exp = now + CHAT_COOKIE_TTL_HOURS * 3600_000;
    setCookie = cookie(CHAT_COOKIE, await sign(env.SESSION_SECRET, `${chatId}|${exp}`), CHAT_COOKIE_TTL_HOURS * 3600);
  }
  if (chat.status === "captured") return json({ error: "done" }, 409);

  // The caps, in the spec's order.
  const usage = await env.DB.prepare("SELECT model_calls FROM usage_daily WHERE date = ?1").bind(day).first();
  if ((usage?.model_calls ?? 0) >= DAILY_MODEL_CALL_CAP) return withCookie(await capHit(env, day, "daily"), setCookie);
  const mine = await env.DB.prepare("SELECT messages FROM ip_usage WHERE ip_hash = ?1 AND date = ?2").bind(ipHash, day).first();
  if ((mine?.messages ?? 0) >= PER_IP_DAILY_MSGS) return withCookie(await capHit(env, day, "visitor"), setCookie);
  if (chat.turn_count >= MAX_TURNS_PER_CHAT) return withCookie(await capHit(env, day, "turns"), setCookie);
  if (message.length > MAX_INPUT_CHARS) return withCookie(await capHit(env, day, "length"), setCookie);

  // Count the call before making it, so a burst can't run past the cap.
  await env.DB.batch([
    env.DB.prepare("INSERT INTO messages (chat_id, role, content, created_at) VALUES (?1, 'user', ?2, ?3)").bind(chatId, message, now),
    env.DB.prepare("UPDATE chats SET turn_count = turn_count + 1, last_activity_at = ?2 WHERE id = ?1").bind(chatId, now),
    env.DB.prepare("INSERT INTO ip_usage (ip_hash, date, messages) VALUES (?1, ?2, 1) ON CONFLICT (ip_hash, date) DO UPDATE SET messages = messages + 1")
      .bind(ipHash, day),
    env.DB.prepare("INSERT INTO usage_daily (date, model_calls) VALUES (?1, 1) ON CONFLICT (date) DO UPDATE SET model_calls = model_calls + 1")
      .bind(day),
  ]);

  const { results: history } = await env.DB.prepare("SELECT role, content FROM messages WHERE chat_id = ?1 ORDER BY id").bind(chatId).all();
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.role === "user" ? asVisitorData(m.content) : m.content })),
  ];

  let stream;
  try {
    stream = await env.AI.run(MODEL_ID, { messages, stream: true, max_tokens: MAX_REPLY_TOKENS });
  } catch {
    return withCookie(json({ fallback: "form", reason: "model" }), setCookie);
  }
  const [forVisitor, forRecord] = stream.tee();
  const inChars = messages.reduce((n, m) => n + m.content.length, 0);
  const turn = chat.turn_count + 1;   // this visitor message, counted above
  ctx.waitUntil(record(env, chatId, forRecord, inChars, day, turn));

  const out = new TransformStream();
  ctx.waitUntil(relay(forVisitor, out.writable, turn));
  const headers = { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store" };
  if (setCookie) headers["set-cookie"] = setCookie;
  return new Response(out.readable, { headers });
}

function withCookie(res, setCookie) {
  if (setCookie) res.headers.append("set-cookie", setCookie);
  return res;
}

// To the visitor: clean text as it arrives, then {done, mapped}.
async function relay(stream, writable, turn) {
  const w = writable.getWriter();
  const enc = new TextEncoder();
  const filter = createTokenFilter();
  let sent = "";
  try {
    for await (const piece of aiText(stream)) {
      const text = filter.push(piece);
      sent += text;
      if (leaked(sent)) { await w.write(enc.encode(sse({ replace: LEAK_REPLY }) + sse({ done: true, mapped: false }))); return; }
      if (text) await w.write(enc.encode(sse({ t: text })));
    }
    const rest = filter.end();
    if (rest) await w.write(enc.encode(sse({ t: rest })));
    await w.write(enc.encode(sse({ done: true, mapped: visibleReply(filter.raw, turn).mapped })));
  } catch {
    await w.write(enc.encode(sse({ fallback: "form", reason: "model" }))).catch(() => {});
  } finally {
    await w.close().catch(() => {});
  }
}

// For the record: the full reply (cleaned), whether it mapped the problem, which proof it
// showed, and a rough token count (about 4 characters a token).
async function record(env, chatId, stream, inChars, day, turn) {
  const filter = createTokenFilter();
  try {
    for await (const piece of aiText(stream)) filter.push(piece);
  } catch { /* keep what arrived */ }
  filter.end();
  const { text, mapped } = visibleReply(filter.raw, turn);
  if (!text) return;
  const proof = Object.keys(PROOF_LINKS).find((k) => text.includes(PROOF_LINKS[k])) || null;
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO messages (chat_id, role, content, created_at) VALUES (?1, 'assistant', ?2, ?3)").bind(chatId, text, now),
    env.DB.prepare(`UPDATE chats SET last_activity_at = ?2,
        status = CASE WHEN ?3 = 1 AND status = 'open' THEN 'mapped' ELSE status END,
        proof_shown = COALESCE(proof_shown, ?4) WHERE id = ?1`).bind(chatId, now, mapped ? 1 : 0, proof),
    env.DB.prepare("UPDATE usage_daily SET est_tokens_in = est_tokens_in + ?2, est_tokens_out = est_tokens_out + ?3 WHERE date = ?1")
      .bind(day, Math.ceil(inChars / 4), Math.ceil(text.length / 4)),
  ]);
}
