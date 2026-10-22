// Removing a lead's personal data, used by "Delete my data" (now) and the retention job
// (after LEAD_PII_RETENTION_MONTHS). The anonymised chat and pain summary stay; name, email
// and organisation are cleared and scrubbed out of everything else (see privacy.js).
import { scrub } from "./privacy.js";
import { PAIN_FIELDS } from "./chat/prompt.js";

export async function purgeLead(env, leadId, now = Date.now()) {
  const lead = await env.DB.prepare("SELECT * FROM leads WHERE id = ?1").bind(leadId).first();
  if (!lead || lead.purged_at) return false;
  const known = [lead.name, lead.email, lead.org, ...(lead.name || "").split(/\s+/).filter((w) => w.length >= 3)];
  const updates = [];
  const { results: messages } = await env.DB.prepare("SELECT id, content FROM messages WHERE chat_id = ?1").bind(lead.chat_id).all();
  for (const m of messages) {
    const clean = scrub(m.content, known);
    if (clean !== m.content) updates.push(env.DB.prepare("UPDATE messages SET content = ?2 WHERE id = ?1").bind(m.id, clean));
  }
  const pain = await env.DB.prepare("SELECT * FROM pain_summary WHERE lead_id = ?1").bind(leadId).first();
  if (pain) {
    updates.push(env.DB.prepare(`UPDATE pain_summary SET ${PAIN_FIELDS.map((k, i) => `${k} = ?${i + 2}`).join(", ")}, raw_json = NULL WHERE lead_id = ?1`)
      .bind(leadId, ...PAIN_FIELDS.map((k) => scrub(pain[k], known))));
  }
  const audit = await env.DB.prepare("SELECT markdown FROM audits WHERE lead_id = ?1").bind(leadId).first();
  if (audit) updates.push(env.DB.prepare("UPDATE audits SET markdown = ?2 WHERE lead_id = ?1").bind(leadId, scrub(audit.markdown, known)));
  const { results: scopes } = await env.DB.prepare("SELECT id, markdown FROM scopes WHERE lead_id = ?1").bind(leadId).all();
  for (const s of scopes) updates.push(env.DB.prepare("UPDATE scopes SET markdown = ?2, accepted_ip_hash = NULL WHERE id = ?1").bind(s.id, scrub(s.markdown, known)));
  updates.push(
    env.DB.prepare("UPDATE leads SET name = NULL, email = NULL, org = NULL, user_id = NULL, purged_at = ?2 WHERE id = ?1").bind(leadId, now),
    env.DB.prepare("UPDATE stage_events SET note = NULL WHERE lead_id = ?1").bind(leadId),
    env.DB.prepare("UPDATE chats SET ip_hash = NULL, anonymised_at = COALESCE(anonymised_at, ?2) WHERE id = ?1").bind(lead.chat_id, now),
  );
  await env.DB.batch(updates);
  return true;
}

// A client deleting their account: every lead of theirs is purged, then the account goes
// (with its passkeys, sessions and links, by ON DELETE CASCADE).
export async function purgeUser(env, userId) {
  const { results } = await env.DB.prepare("SELECT id FROM leads WHERE user_id = ?1").bind(userId).all();
  for (const l of results) await purgeLead(env, l.id);
  await env.DB.prepare("DELETE FROM users WHERE id = ?1").bind(userId).run();
}
