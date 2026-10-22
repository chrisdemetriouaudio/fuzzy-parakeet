// Portal sign-in with passkeys (WebAuthn), via @simplewebauthn/server.
// - A client's invite link (or a "lost passkey" sign-in link) lets them create a passkey.
// - After that they sign in with it: Face ID, a fingerprint or the device PIN.
// - Chris signs in the same way; the admin is whoever owns ADMIN_EMAIL.
// Challenges are single-use and expire after 5 minutes.
import { INVITE_TOKEN_TTL_HOURS } from "../config.js";
import { json, readJson } from "../lib/http.js";
import { randomId, sha256Hex, fromB64url, b64url } from "../lib/crypto.js";
import { startSession, endCookie, SESSION_COOKIE } from "./session.js";
import { sendEmail, noticeEmail } from "../email.js";

const CHALLENGE_TTL = 5 * 60_000;
const RP_NAME = "Chris Demetriou";
const webauthn = () => import("@simplewebauthn/server");   // loaded only for sign-in

function rp(request, env) {
  const origin = new URL(request.url).origin;
  const rpID = env.RP_ID || "chrisdemetriou.com";
  return { origin, rpID, ok: new URL(origin).hostname === rpID };
}

async function usableToken(env, token) {
  if (typeof token !== "string" || token.length < 20 || token.length > 100) return null;
  return env.DB.prepare(`SELECT t.token_hash, t.purpose, u.id AS user_id, u.email FROM auth_tokens t JOIN users u ON u.id = t.user_id
    WHERE t.token_hash = ?1 AND t.used_at IS NULL AND t.expires_at > ?2`).bind(await sha256Hex(token), Date.now()).first();
}

// The challenge the browser signed, taken out of its clientDataJSON, checked and used up.
async function takeChallenge(env, response, purpose) {
  let challenge;
  try { challenge = JSON.parse(new TextDecoder().decode(fromB64url(response.response.clientDataJSON))).challenge; } catch { return null; }
  if (typeof challenge !== "string") return null;
  const row = await env.DB.prepare("DELETE FROM auth_challenges WHERE challenge = ?1 AND purpose = ?2 RETURNING user_id, expires_at")
    .bind(challenge, purpose).first();
  return row && row.expires_at > Date.now() ? { challenge, userId: row.user_id } : null;
}

export async function registerOptions(request, env) {
  const { rpID, ok } = rp(request, env);
  const body = await readJson(request);
  const t = ok && (await usableToken(env, body?.token));
  if (!t) return json({ error: "link" }, 400);
  const { generateRegistrationOptions } = await webauthn();
  const { results: creds } = await env.DB.prepare("SELECT id, transports FROM credentials WHERE user_id = ?1").bind(t.user_id).all();
  const options = await generateRegistrationOptions({
    rpName: RP_NAME, rpID, userName: t.email, userID: new TextEncoder().encode(t.user_id),
    attestationType: "none",
    authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
    excludeCredentials: creds.map((c) => ({ id: c.id, transports: c.transports ? JSON.parse(c.transports) : undefined })),
  });
  await env.DB.prepare("INSERT INTO auth_challenges (challenge, user_id, purpose, expires_at) VALUES (?1, ?2, 'register', ?3)")
    .bind(options.challenge, t.user_id, Date.now() + CHALLENGE_TTL).run();
  return json(options);
}

export async function registerVerify(request, env) {
  const { origin, rpID, ok } = rp(request, env);
  const body = await readJson(request, 65_536);
  const t = ok && (await usableToken(env, body?.token));
  if (!t || !body?.response) return json({ error: "link" }, 400);
  const c = await takeChallenge(env, body.response, "register");
  if (!c || c.userId !== t.user_id) return json({ error: "challenge" }, 400);
  const { verifyRegistrationResponse } = await webauthn();
  let result;
  try {
    result = await verifyRegistrationResponse({ response: body.response, expectedChallenge: c.challenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: false });
  } catch {
    return json({ error: "passkey" }, 400);
  }
  if (!result.verified) return json({ error: "passkey" }, 400);
  const cred = result.registrationInfo.credential;
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO credentials (id, user_id, public_key, counter, transports, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
      .bind(cred.id, t.user_id, b64url(cred.publicKey), cred.counter, JSON.stringify(cred.transports || []), now),
    env.DB.prepare("UPDATE auth_tokens SET used_at = ?2 WHERE token_hash = ?1").bind(t.token_hash, now),
  ]);
  return json({ ok: true }, 200, { "set-cookie": await startSession(env, t.user_id) });
}

export async function loginOptions(request, env) {
  const { rpID, ok } = rp(request, env);
  if (!ok) return json({ error: "origin" }, 400);
  const { generateAuthenticationOptions } = await webauthn();
  const options = await generateAuthenticationOptions({ rpID, userVerification: "preferred" });
  await env.DB.prepare("INSERT INTO auth_challenges (challenge, user_id, purpose, expires_at) VALUES (?1, NULL, 'login', ?2)")
    .bind(options.challenge, Date.now() + CHALLENGE_TTL).run();
  return json(options);
}

export async function loginVerify(request, env) {
  const { origin, rpID, ok } = rp(request, env);
  const body = await readJson(request, 65_536);
  if (!ok || !body?.response || typeof body.response.id !== "string") return json({ error: "passkey" }, 400);
  const c = await takeChallenge(env, body.response, "login");
  if (!c) return json({ error: "challenge" }, 400);
  const cred = await env.DB.prepare("SELECT * FROM credentials WHERE id = ?1").bind(body.response.id).first();
  if (!cred) return json({ error: "unknown" }, 400);
  const { verifyAuthenticationResponse } = await webauthn();
  let result;
  try {
    result = await verifyAuthenticationResponse({
      response: body.response, expectedChallenge: c.challenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: false,
      credential: { id: cred.id, publicKey: fromB64url(cred.public_key), counter: cred.counter, transports: cred.transports ? JSON.parse(cred.transports) : undefined },
    });
  } catch {
    return json({ error: "passkey" }, 400);
  }
  if (!result.verified) return json({ error: "passkey" }, 400);
  await env.DB.prepare("UPDATE credentials SET counter = ?2, last_used_at = ?3 WHERE id = ?1").bind(cred.id, result.authenticationInfo.newCounter, Date.now()).run();
  return json({ ok: true }, 200, { "set-cookie": await startSession(env, cred.user_id) });
}

// "Email me a sign-in link": for a lost passkey, a new device, or Chris's first sign-in.
// The answer is the same whether or not the address has an account.
export async function emailLink(request, env, ctx) {
  const body = await readJson(request);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254) return json({ error: "email" }, 400);
  ctx.waitUntil((async () => {
    const now = Date.now();
    let user = await env.DB.prepare("SELECT id FROM users WHERE email = ?1").bind(email).first();
    if (!user && email === String(env.ADMIN_EMAIL).toLowerCase()) {
      user = { id: randomId() };
      await env.DB.prepare("INSERT INTO users (id, email, role, created_at) VALUES (?1, ?2, 'admin', ?3)").bind(user.id, email, now).run();
    }
    if (!user) return;
    const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM auth_tokens WHERE user_id = ?1 AND purpose = 'login' AND created_at > ?2")
      .bind(user.id, now - 3600_000).first();
    if (recent.n >= 3) return;   // at most 3 links an hour
    const token = randomId(32);
    await env.DB.prepare("INSERT INTO auth_tokens (token_hash, user_id, purpose, created_at, expires_at) VALUES (?1, ?2, 'login', ?3, ?4)")
      .bind(await sha256Hex(token), user.id, now, now + INVITE_TOKEN_TTL_HOURS * 3600_000).run();
    await sendEmail(env, { to: email, ...noticeEmail("signin", `${new URL(request.url).origin}/portal/?signin=${token}`) });
  })());
  return json({ ok: true });
}

export async function logout(request, env) {
  const id = (request.headers.get("cookie") || "").match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
  if (id) await env.DB.prepare("DELETE FROM auth_sessions WHERE id_hash = ?1").bind(await sha256Hex(decodeURIComponent(id))).run();
  return json({ ok: true }, 200, { "set-cookie": endCookie() });
}
