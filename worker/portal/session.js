// Portal sign-in sessions: a random id in an HttpOnly, SameSite=Strict cookie; the database
// keeps only its hash. Every POST that changes something also needs the CSRF token (an HMAC
// of the session id) in an x-csrf header.
import { SESSION_TTL_DAYS } from "../config.js";
import { randomId, sha256Hex, sign, verify } from "../lib/crypto.js";
import { readCookie, cookie } from "../lib/http.js";

export const SESSION_COOKIE = "__Host-cd_portal";

export async function startSession(env, userId) {
  const id = randomId(32);
  const now = Date.now();
  await env.DB.prepare("INSERT INTO auth_sessions (id_hash, user_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)")
    .bind(await sha256Hex(id), userId, now, now + SESSION_TTL_DAYS * 86400_000).run();
  return cookie(SESSION_COOKIE, id, SESSION_TTL_DAYS * 86400);
}

export const endCookie = () => cookie(SESSION_COOKIE, "", 0);

// The signed-in user, or null. Admin is decided by ADMIN_EMAIL, not by the stored role alone.
export async function currentUser(request, env) {
  const id = readCookie(request, SESSION_COOKIE);
  if (!id || id.length > 100) return null;
  const row = await env.DB.prepare(`SELECT u.id, u.email, u.role, s.id_hash FROM auth_sessions s JOIN users u ON u.id = s.user_id
    WHERE s.id_hash = ?1 AND s.expires_at > ?2`).bind(await sha256Hex(id), Date.now()).first();
  if (!row) return null;
  const admin = row.role === "admin" && row.email === String(env.ADMIN_EMAIL).toLowerCase();
  return { id: row.id, email: row.email, admin, sessionHash: row.id_hash, csrf: await csrfFor(env, row.id_hash) };
}

const csrfFor = (env, sessionHash) => sign(env.SESSION_SECRET, `csrf|${sessionHash}`);

export async function csrfOk(request, env, user) {
  const token = request.headers.get("x-csrf");
  return !!token && (await verify(env.SESSION_SECRET, token)) === `csrf|${user.sessionHash}`;
}
