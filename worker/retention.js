// The daily retention job (Phase 9, step 8), run by the Worker's cron trigger.
// 1. Chats that never became a lead: after ANON_PURGE_DAYS of quiet, personal details are
//    scrubbed from the messages (see privacy.js for what that catches, and what it can't)
//    and the IP hash is dropped. The anonymised chat is kept.
// 2. Leads with no activity for LEAD_PII_RETENTION_MONTHS that never became work (not
//    accepted, building or live): name, email and organisation are purged and scrubbed out,
//    and the portal account goes if it has no other leads. The anonymised summary stays.
// 3. Housekeeping: old visitor counters, expired sign-in links, challenges and sessions.
// Logs counts only, never content. Works in batches so one run stays within the CPU limit;
// a backlog clears over the following days.
import { ANON_PURGE_DAYS, LEAD_PII_RETENTION_MONTHS } from "./config.js";
import { scrub } from "./privacy.js";
import { purgeLead } from "./purge.js";

const BATCH = 50;
const DAY = 86400_000;

export async function runRetention(env, now = Date.now()) {
  if (!env.DB) return null;
  const counts = { chats: 0, leads: 0, accounts: 0 };

  const chatCutoff = now - ANON_PURGE_DAYS * DAY;
  const { results: chats } = await env.DB.prepare(`SELECT c.id FROM chats c LEFT JOIN leads l ON l.chat_id = c.id
    WHERE l.id IS NULL AND c.anonymised_at IS NULL AND c.last_activity_at < ?1 LIMIT ?2`).bind(chatCutoff, BATCH).all();
  for (const { id } of chats) {
    const { results: messages } = await env.DB.prepare("SELECT id, content FROM messages WHERE chat_id = ?1").bind(id).all();
    const updates = messages
      .map((m) => ({ id: m.id, clean: scrub(m.content) }))
      .filter((m, i) => m.clean !== messages[i].content)
      .map((m) => env.DB.prepare("UPDATE messages SET content = ?2 WHERE id = ?1").bind(m.id, m.clean));
    updates.push(env.DB.prepare(`UPDATE chats SET ip_hash = NULL, anonymised_at = ?2,
      status = CASE WHEN status = 'open' THEN 'abandoned' ELSE status END WHERE id = ?1`).bind(id, now));
    await env.DB.batch(updates);
    counts.chats++;
  }

  const leadCutoff = new Date(now);
  leadCutoff.setUTCMonth(leadCutoff.getUTCMonth() - LEAD_PII_RETENTION_MONTHS);
  const { results: leads } = await env.DB.prepare(`SELECT id, user_id FROM leads WHERE purged_at IS NULL
    AND stage NOT IN ('accepted', 'building', 'live') AND last_activity_at < ?1 LIMIT ?2`).bind(leadCutoff.getTime(), BATCH).all();
  for (const lead of leads) {
    if (await purgeLead(env, lead.id, now)) counts.leads++;
    if (lead.user_id) {
      const left = await env.DB.prepare("SELECT COUNT(*) AS n FROM leads WHERE user_id = ?1").bind(lead.user_id).first();
      const user = await env.DB.prepare("SELECT role FROM users WHERE id = ?1").bind(lead.user_id).first();
      if (left.n === 0 && user?.role === "client") {
        await env.DB.prepare("DELETE FROM users WHERE id = ?1").bind(lead.user_id).run();
        counts.accounts++;
      }
    }
  }

  const twoDaysAgo = new Date(now - 2 * DAY).toISOString().slice(0, 10);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM ip_usage WHERE date < ?1").bind(twoDaysAgo),
    env.DB.prepare("DELETE FROM auth_challenges WHERE expires_at < ?1").bind(now),
    env.DB.prepare("DELETE FROM auth_tokens WHERE expires_at < ?1").bind(now - 7 * DAY),
    env.DB.prepare("DELETE FROM auth_sessions WHERE expires_at < ?1").bind(now),
  ]);
  console.log(`retention: anonymised ${counts.chats} chats, purged ${counts.leads} leads, removed ${counts.accounts} accounts`);
  return counts;
}
