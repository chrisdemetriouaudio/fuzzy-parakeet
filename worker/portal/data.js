// The portal's data: what a client sees of their own leads, and what Chris (admin) sees and
// edits. Clients never see blueprint_match, the raw extraction, internal notes, drafts or
// unpublished scope versions.
import { PAIN_FIELDS } from "../chat/prompt.js";
import { json, readJson } from "../lib/http.js";
import { sha256Hex, hashIp } from "../lib/crypto.js";
import { purgeUser } from "../purge.js";
import { endCookie } from "./session.js";
import { sendEmail, noticeEmail } from "../email.js";

export const STAGES = ["new", "audit_sent", "scoped", "accepted", "building", "live", "closed"];

export const scopeHash = (leadId, version, price, markdown) => sha256Hex(`${leadId}|${version}|${price}|${markdown}`);

// A lead this user may see: their own, or any for admin.
async function visibleLead(env, user, id) {
  if (typeof id !== "string" || !id) return null;
  const lead = await env.DB.prepare("SELECT * FROM leads WHERE id = ?1").bind(id).first();
  return lead && (user.admin || lead.user_id === user.id) ? lead : null;
}

export function me(user) {
  return json({ email: user.email, admin: user.admin, csrf: user.csrf });
}

export async function listLeads(env, user, url) {
  const stage = url.searchParams.get("stage");
  const filter = STAGES.includes(stage) ? stage : null;
  const where = user.admin ? "(?1 IS NULL OR l.stage = ?1)" : "(?1 IS NULL OR l.stage = ?1) AND l.user_id = ?2";
  const { results } = await env.DB.prepare(`SELECT l.id, l.stage, l.created_at, l.last_activity_at, l.org,
      ${user.admin ? "l.name, l.email, p.needs_review," : ""} p.task
    FROM leads l LEFT JOIN pain_summary p ON p.lead_id = l.id WHERE ${where}
    ORDER BY l.last_activity_at DESC LIMIT 200`).bind(...(user.admin ? [filter] : [filter, user.id])).all();
  return json({ leads: results });
}

export async function leadDetail(env, user, url) {
  const lead = await visibleLead(env, user, url.searchParams.get("id"));
  if (!lead) return json({ error: "not found" }, 404);
  const [{ results: events }, { results: transcript }, audit, { results: scopes }] = await Promise.all([
    env.DB.prepare("SELECT from_stage, to_stage, at, note FROM stage_events WHERE lead_id = ?1 ORDER BY at, id").bind(lead.id).all(),
    env.DB.prepare("SELECT role, content, created_at FROM messages WHERE chat_id = ?1 ORDER BY id").bind(lead.chat_id).all(),
    env.DB.prepare("SELECT * FROM audits WHERE lead_id = ?1").bind(lead.id).first(),
    env.DB.prepare("SELECT id, version, markdown, price_gbp, content_hash, created_at, published_at, accepted_at FROM scopes WHERE lead_id = ?1 ORDER BY version DESC").bind(lead.id).all(),
  ]);
  const out = {
    lead: { id: lead.id, stage: lead.stage, created_at: lead.created_at, last_activity_at: lead.last_activity_at, org: lead.org, name: lead.name },
    timeline: events.map((e) => ({ to: e.to_stage, at: e.at, ...(user.admin ? { from: e.from_stage, note: e.note } : {}) })),
    transcript,
    audit: audit && (user.admin || audit.published_at) ? audit : null,
    scope: scopes.find((s) => s.published_at) || null,
  };
  if (user.admin) {
    const pain = await env.DB.prepare("SELECT * FROM pain_summary WHERE lead_id = ?1").bind(lead.id).first();
    out.lead.email = lead.email;
    out.pain = pain ? { ...pain, blueprint_match: JSON.parse(pain.blueprint_match || "[]") } : null;
    out.scopes = scopes;
  }
  return json(out);
}

async function moveStage(env, lead, to, note, now) {
  return [
    env.DB.prepare("UPDATE leads SET stage = ?2, last_activity_at = ?3 WHERE id = ?1").bind(lead.id, to, now),
    env.DB.prepare("INSERT INTO stage_events (lead_id, from_stage, to_stage, at, note) VALUES (?1, ?2, ?3, ?4, ?5)").bind(lead.id, lead.stage, to, now, note),
  ];
}

// The client accepts the exact scope version they were shown.
export async function acceptScope(request, env, user) {
  const body = await readJson(request);
  const lead = await visibleLead(env, user, body?.lead_id);
  if (!lead || user.admin) return json({ error: "not found" }, 404);
  const latest = await env.DB.prepare("SELECT * FROM scopes WHERE lead_id = ?1 AND published_at IS NOT NULL ORDER BY version DESC LIMIT 1").bind(lead.id).first();
  if (!latest || latest.id !== body.scope_id || latest.content_hash !== body.content_hash) return json({ error: "changed" }, 409);
  if (latest.accepted_at) return json({ error: "already" }, 409);
  if (latest.content_hash !== (await scopeHash(lead.id, latest.version, latest.price_gbp, latest.markdown))) return json({ error: "changed" }, 409);
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("UPDATE scopes SET accepted_at = ?2, accepted_ip_hash = ?3 WHERE id = ?1")
      .bind(latest.id, now, await hashIp(request.headers.get("cf-connecting-ip"), env.IP_HASH_SALT)),
    ...(await moveStage(env, lead, "accepted", `Accepted scope v${latest.version}`, now)),
  ]);
  return json({ ok: true, accepted_at: now });
}

export async function exportData(env, user) {
  const { results: leads } = await env.DB.prepare("SELECT * FROM leads WHERE user_id = ?1").bind(user.id).all();
  const out = { exported_at: new Date().toISOString(), account: { email: user.email }, leads: [] };
  for (const lead of leads) {
    const [{ results: transcript }, audit, { results: scopes }, { results: events }, pain] = await Promise.all([
      env.DB.prepare("SELECT role, content, created_at FROM messages WHERE chat_id = ?1 ORDER BY id").bind(lead.chat_id).all(),
      env.DB.prepare("SELECT markdown, published_at FROM audits WHERE lead_id = ?1 AND published_at IS NOT NULL").bind(lead.id).first(),
      env.DB.prepare("SELECT version, markdown, price_gbp, published_at, accepted_at FROM scopes WHERE lead_id = ?1 AND published_at IS NOT NULL ORDER BY version").bind(lead.id).all(),
      env.DB.prepare("SELECT to_stage, at FROM stage_events WHERE lead_id = ?1 ORDER BY at").bind(lead.id).all(),
      env.DB.prepare(`SELECT ${PAIN_FIELDS.join(", ")} FROM pain_summary WHERE lead_id = ?1`).bind(lead.id).first(),
    ]);
    out.leads.push({
      name: lead.name, email: lead.email, organisation: lead.org, consent_at: lead.consent_at, stage: lead.stage, created_at: lead.created_at,
      transcript, summary: pain, audit, scopes, timeline: events,
    });
  }
  return new Response(JSON.stringify(out, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "content-disposition": 'attachment; filename="my-data-chrisdemetriou.json"', "cache-control": "no-store" },
  });
}

export async function deleteData(request, env, user) {
  const body = await readJson(request);
  if (body?.confirm !== "delete") return json({ error: "confirm" }, 400);
  if (user.admin) return json({ error: "admin" }, 400);
  await purgeUser(env, user.id);
  return json({ ok: true }, 200, { "set-cookie": endCookie() });
}

// ── Admin ──

async function notifyClient(env, lead, kind, origin) {
  if (lead.email) await sendEmail(env, { to: lead.email, ...noticeEmail(kind, `${origin}/portal/`) });
}

export async function saveAudit(request, env, ctx) {
  const body = await readJson(request, 200_000);
  const lead = await env.DB.prepare("SELECT * FROM leads WHERE id = ?1").bind(body?.lead_id ?? "").first();
  if (!lead || typeof body.markdown !== "string" || !body.markdown.trim() || body.markdown.length > 100_000) return json({ error: "invalid" }, 400);
  const now = Date.now();
  const publish = body.publish === true;
  const statements = [env.DB.prepare(`INSERT INTO audits (lead_id, markdown, updated_at, published_at) VALUES (?1, ?2, ?3, ?4)
    ON CONFLICT (lead_id) DO UPDATE SET markdown = ?2, updated_at = ?3, published_at = COALESCE(?4, published_at)`)
    .bind(lead.id, body.markdown, now, publish ? now : null)];
  if (publish && lead.stage === "new") statements.push(...(await moveStage(env, lead, "audit_sent", "Audit published", now)));
  await env.DB.batch(statements);
  if (publish) ctx.waitUntil(notifyClient(env, lead, "audit", new URL(request.url).origin));
  return json({ ok: true });
}

// Every save is a new version; only published versions reach the client.
export async function saveScope(request, env, ctx) {
  const body = await readJson(request, 200_000);
  const lead = await env.DB.prepare("SELECT * FROM leads WHERE id = ?1").bind(body?.lead_id ?? "").first();
  const price = Number(body?.price_gbp);
  if (!lead || typeof body.markdown !== "string" || !body.markdown.trim() || body.markdown.length > 100_000 || !Number.isInteger(price) || price < 0 || price > 1_000_000) {
    return json({ error: "invalid" }, 400);
  }
  const now = Date.now();
  const publish = body.publish === true;
  const prev = await env.DB.prepare("SELECT MAX(version) AS v FROM scopes WHERE lead_id = ?1").bind(lead.id).first();
  const version = (prev?.v ?? 0) + 1;
  const statements = [env.DB.prepare(`INSERT INTO scopes (lead_id, version, markdown, price_gbp, content_hash, created_at, published_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`).bind(lead.id, version, body.markdown, price, await scopeHash(lead.id, version, price, body.markdown), now, publish ? now : null)];
  if (publish && ["new", "audit_sent"].includes(lead.stage)) statements.push(...(await moveStage(env, lead, "scoped", `Scope v${version} published`, now)));
  await env.DB.batch(statements);
  if (publish) ctx.waitUntil(notifyClient(env, lead, "scope", new URL(request.url).origin));
  return json({ ok: true, version });
}

export async function changeStage(request, env) {
  const body = await readJson(request);
  const lead = await env.DB.prepare("SELECT * FROM leads WHERE id = ?1").bind(body?.lead_id ?? "").first();
  if (!lead || !STAGES.includes(body.to) || body.to === lead.stage) return json({ error: "invalid" }, 400);
  const note = typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 500) : null;
  await env.DB.batch(await moveStage(env, lead, body.to, note, Date.now()));
  return json({ ok: true });
}

export async function stats(env) {
  const since = new Date(Date.now() - 13 * 86400_000).toISOString().slice(0, 10);
  const [{ results: days }, totals] = await Promise.all([
    env.DB.prepare("SELECT * FROM usage_daily WHERE date >= ?1 ORDER BY date").bind(since).all(),
    env.DB.prepare(`SELECT COUNT(*) AS chats, SUM(status IN ('mapped', 'captured')) AS mapped, SUM(status = 'captured') AS captured
      FROM chats WHERE created_at >= ?1`).bind(Date.parse(since)).first(),
  ]);
  return json({ since, days, totals: { chats: totals.chats, mapped: totals.mapped ?? 0, captured: totals.captured ?? 0, cap_hits: days.reduce((n, d) => n + d.cap_hits, 0) } });
}
