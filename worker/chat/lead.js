// POST /api/lead: the visitor asked for their written audit. Store their details, take the
// brief they confirmed on the summary card (D35) or else extract a pain summary from the chat
// (one model call), set up their portal account and invite, and
// email Chris and the visitor (step 5). Contact details only ever come through this form,
// never from chat text.
import { MODEL_ID, DAILY_MODEL_CALL_CAP, INVITE_TOKEN_TTL_HOURS } from "../config.js";
import { extractionMessages, parseExtraction, PAIN_FIELDS } from "./prompt.js";
import { chatFromCookie } from "./chat.js";
import { json, readJson, today } from "../lib/http.js";
import { randomId, sha256Hex } from "../lib/crypto.js";
import { sendLeadEmails } from "../email.js";

const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

export function checkLead(body) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const org = typeof body?.org === "string" ? body.org.trim() : "";
  const errors = {};
  if (!name || name.length > 100) errors.name = "Enter your name.";
  if (!EMAIL.test(email) || email.length > 254) errors.email = "Enter an email address like name@company.co.uk.";
  if (org.length > 120) errors.org = "Keep the organisation under 120 characters.";
  if (body?.consent !== true) errors.consent = "Tick the box so Chris can use your details to send the audit.";
  return { name, email, org: org || null, errors };
}

export async function handleLead(request, env, ctx) {
  const chatId = await chatFromCookie(request, env);
  if (!chatId) return json({ error: "chat" }, 401);
  const chat = await env.DB.prepare("SELECT id, status, turn_count, proof_shown FROM chats WHERE id = ?1").bind(chatId).first();
  if (!chat || chat.turn_count < 1) return json({ error: "chat" }, 401);
  if (chat.status === "captured") return json({ error: "done" }, 409);

  const lead = checkLead(await readJson(request));
  if (Object.keys(lead.errors).length) return json({ error: "invalid", fields: lead.errors }, 422);

  const now = Date.now();
  const leadId = randomId();
  // One portal account per email address; a returning visitor's leads share it.
  let user = await env.DB.prepare("SELECT id FROM users WHERE email = ?1").bind(lead.email).first();
  const userId = user?.id ?? randomId();
  const token = randomId(32);
  const statements = [];
  if (!user) statements.push(env.DB.prepare("INSERT INTO users (id, email, role, created_at) VALUES (?1, ?2, 'client', ?3)").bind(userId, lead.email, now));
  statements.push(
    env.DB.prepare(`INSERT INTO leads (id, chat_id, user_id, name, email, org, consent_at, created_at, last_activity_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7, ?7)`).bind(leadId, chatId, userId, lead.name, lead.email, lead.org, now),
    env.DB.prepare("INSERT INTO stage_events (lead_id, from_stage, to_stage, at, note) VALUES (?1, NULL, 'new', ?2, 'From the chat')").bind(leadId, now),
    env.DB.prepare("UPDATE chats SET status = 'captured', last_activity_at = ?2 WHERE id = ?1").bind(chatId, now),
    env.DB.prepare("INSERT INTO auth_tokens (token_hash, user_id, purpose, created_at, expires_at) VALUES (?1, ?2, 'invite', ?3, ?4)")
      .bind(await sha256Hex(token), userId, now, now + INVITE_TOKEN_TTL_HOURS * 3600_000),
  );
  await env.DB.batch(statements);

  ctx.waitUntil(afterLead(env, { leadId, chatId, token, lead, proof: chat.proof_shown, origin: new URL(request.url).origin }));
  return json({ ok: true });
}

// The slow part runs after the visitor already has their answer.
async function afterLead(env, { leadId, chatId, token, lead, proof, origin }) {
  const { results: transcript } = await env.DB.prepare("SELECT role, content FROM messages WHERE chat_id = ?1 ORDER BY id").bind(chatId).all();
  const chat = await env.DB.prepare("SELECT brief_json, brief_raw, brief_confirmed_at, brief_edited FROM chats WHERE id = ?1").bind(chatId).first();
  const confirmed = Boolean(chat?.brief_confirmed_at && chat.brief_json);
  const summary = confirmed
    ? { ok: true, value: JSON.parse(chat.brief_json), raw: chat.brief_raw }
    : await extract(env, transcript);
  const briefNote = confirmed ? (chat.brief_edited ? "corrected by the visitor" : "confirmed by the visitor") : "extracted, not shown to the visitor";
  await env.DB.prepare(`INSERT INTO pain_summary (lead_id, ${PAIN_FIELDS.join(", ")}, blueprint_match, confidence, raw_json, needs_review, created_at)
    VALUES (?1, ${PAIN_FIELDS.map((_, i) => `?${i + 2}`).join(", ")}, ?11, ?12, ?13, ?14, ?15)`)
    .bind(leadId, ...PAIN_FIELDS.map((k) => summary.value?.[k] ?? ""), JSON.stringify(summary.value?.blueprint_match ?? []),
      summary.value?.confidence ?? null, summary.raw, summary.ok ? 0 : 1, Date.now()).run();
  // pain_summary has it now: no second copy on the chat.
  await env.DB.prepare("UPDATE chats SET brief_json = NULL, brief_raw = NULL WHERE id = ?1").bind(chatId).run();
  await sendLeadEmails(env, { leadId, lead, summary: summary.value, briefNote, proof, transcript, inviteUrl: `${origin}/portal/?invite=${token}`, adminUrl: `${origin}/portal/#lead=${leadId}` });
}

export async function extract(env, transcript) {
  const day = today();
  const usage = await env.DB.prepare("SELECT model_calls FROM usage_daily WHERE date = ?1").bind(day).first();
  if ((usage?.model_calls ?? 0) >= DAILY_MODEL_CALL_CAP + 10) return { ok: false, value: null, raw: "(daily cap: not extracted)" };
  await env.DB.prepare("INSERT INTO usage_daily (date, model_calls) VALUES (?1, 1) ON CONFLICT (date) DO UPDATE SET model_calls = model_calls + 1").bind(day).run();
  try {
    const out = await env.AI.run(MODEL_ID, { messages: extractionMessages(transcript), max_tokens: 700 });
    const raw = typeof out?.response === "string" ? out.response : JSON.stringify(out?.response ?? out);
    const parsed = parseExtraction(raw);
    return { ...parsed, raw: raw.slice(0, 8000) };
  } catch (err) {
    return { ok: false, value: null, raw: `(model error: ${String(err?.message || err).slice(0, 200)})` };
  }
}
