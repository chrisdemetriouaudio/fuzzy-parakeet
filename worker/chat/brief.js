// POST /api/brief and /api/brief/confirm: the summary card (D35). Once a chat is mapped, the
// widget asks for the brief: one extraction call (the one /api/lead would otherwise make),
// shown to the visitor to confirm or correct. The internal blueprint match never leaves the
// server, and /api/lead uses the confirmed brief instead of extracting again.
import { BRIEF_FIELDS, nextOn } from "../config.js";
import { chatFromCookie } from "./chat.js";
import { extract } from "./lead.js";
import { json, readJson } from "../lib/http.js";

const KEYS = BRIEF_FIELDS.map(([k]) => k);
const visible = (value) => Object.fromEntries(KEYS.map((k) => [k, String(value?.[k] ?? "").slice(0, 300)]));

async function mappedChat(request, env, body) {
  if (!nextOn(env, body?.next === true)) return { error: json({ error: "off" }, 404) };
  const chatId = await chatFromCookie(request, env);
  const chat = chatId ? await env.DB.prepare("SELECT id, status, brief_json FROM chats WHERE id = ?1").bind(chatId).first() : null;
  if (!chat) return { error: json({ error: "chat" }, 401) };
  if (chat.status !== "mapped") return { error: json({ error: "not mapped" }, 409) };
  return { chat };
}

export async function handleBrief(request, env) {
  const body = await readJson(request);
  const { chat, error } = await mappedChat(request, env, body);
  if (error) return error;
  if (chat.brief_json) return json({ fields: visible(JSON.parse(chat.brief_json)), labels: BRIEF_FIELDS });
  const { results: transcript } = await env.DB.prepare("SELECT role, content FROM messages WHERE chat_id = ?1 ORDER BY id").bind(chat.id).all();
  const summary = await extract(env, transcript);
  // No usable brief (daily cap, model error, bad JSON): the widget goes straight to the form.
  if (!summary.ok || !summary.value) return json({ fallback: "lead" });
  await env.DB.prepare("UPDATE chats SET brief_json = ?2, brief_raw = ?3 WHERE id = ?1")
    .bind(chat.id, JSON.stringify(summary.value), summary.raw).run();
  return json({ fields: visible(summary.value), labels: BRIEF_FIELDS });
}

// {fields} holds only what the visitor changed; an empty body confirms the brief as shown.
export async function handleBriefConfirm(request, env) {
  const body = await readJson(request);
  const { chat, error } = await mappedChat(request, env, body);
  if (error) return error;
  if (!chat.brief_json) return json({ error: "no brief" }, 409);
  const brief = JSON.parse(chat.brief_json);
  let edited = false;
  for (const k of KEYS) {
    const v = body?.fields?.[k];
    if (typeof v !== "string") continue;
    const clean = v.trim().slice(0, 300);
    if (clean !== String(brief[k] ?? "")) { brief[k] = clean; edited = true; }
  }
  await env.DB.prepare("UPDATE chats SET brief_json = ?2, brief_confirmed_at = ?3, brief_edited = ?4 WHERE id = ?1")
    .bind(chat.id, JSON.stringify(brief), Date.now(), edited ? 1 : 0).run();
  return json({ ok: true });
}
