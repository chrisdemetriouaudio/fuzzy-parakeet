// /api/*: the lead chat and the portal. Every POST must come from a page on this site; the
// portal's POSTs also need the signed-in user's CSRF token. The chat is off unless
// CHAT_ENABLED is "on" or "preview" (wrangler.jsonc); the portal works whenever it's set up.
import { json, sameOrigin } from "./lib/http.js";
import { handleChat } from "./chat/chat.js";
import { OPENING } from "./chat/prompt.js";
import { maybeRunRetention } from "./retention.js";
import { handleLead } from "./chat/lead.js";
import { handleBrief, handleBriefConfirm } from "./chat/brief.js";
import { QUICK_ANSWERS, nextOn } from "./config.js";
import { registerOptions, registerVerify, loginOptions, loginVerify, emailLink, logout } from "./portal/auth.js";
import { currentUser, csrfOk } from "./portal/session.js";
import { me, listLeads, leadDetail, exportData, acceptScope, deleteData, saveAudit, saveScope, changeStage, stats } from "./portal/data.js";

const CHAT = { "/api/chat": handleChat, "/api/lead": handleLead, "/api/brief": handleBrief, "/api/brief/confirm": handleBriefConfirm };
// Signing in: POST, no session yet.
const AUTH = {
  "/api/portal/register/options": registerOptions, "/api/portal/register/verify": registerVerify,
  "/api/portal/login/options": loginOptions, "/api/portal/login/verify": loginVerify,
  "/api/portal/link": emailLink, "/api/portal/logout": logout,
};
// Signed in. [method, admin only, handler(request, env, user, url, ctx)]
const SIGNED_IN = {
  "/api/portal/me": ["GET", false, (r, e, u) => me(u)],
  "/api/portal/leads": ["GET", false, (r, e, u, url) => listLeads(e, u, url)],
  "/api/portal/lead": ["GET", false, (r, e, u, url) => leadDetail(e, u, url)],
  "/api/portal/export": ["GET", false, (r, e, u) => exportData(e, u)],
  "/api/portal/accept": ["POST", false, (r, e, u) => acceptScope(r, e, u)],
  "/api/portal/delete": ["POST", false, (r, e, u) => deleteData(r, e, u)],
  "/api/portal/admin/stats": ["GET", true, (r, e) => stats(e)],
  "/api/portal/admin/audit": ["POST", true, (r, e, u, url, ctx) => saveAudit(r, e, ctx)],
  "/api/portal/admin/scope": ["POST", true, (r, e, u, url, ctx) => saveScope(r, e, ctx)],
  "/api/portal/admin/stage": ["POST", true, (r, e) => changeStage(r, e)],
};

const ready = (env) => env.DB && env.SESSION_SECRET && env.IP_HASH_SALT;

// What the widget needs to know: whether to show itself ("preview" shows it only to
// someone who opened a page with ?chat=preview), Turnstile's public site key, and whether
// the fact buttons and summary card are on for this visitor (CHAT_NEXT; ?preview=1 is sent
// by a widget on a preview link).
function chatConfig(env, url) {
  const set = ready(env) && env.AI && env.TURNSTILE_SECRET && env.TURNSTILE_SITE_KEY;
  const mode = set && (env.CHAT_ENABLED === "on" || env.CHAT_ENABLED === "preview") ? env.CHAT_ENABLED : "off";
  const next = mode !== "off" && nextOn(env, url.searchParams.get("preview") === "1");
  const out = { mode, sitekey: mode === "off" ? null : env.TURNSTILE_SITE_KEY, opening: OPENING, next };
  if (next) out.quick = QUICK_ANSWERS;
  return json(out, 200, { "cache-control": "public, max-age=60" });
}

export async function handleApi(request, env, ctx, url) {
  const path = url.pathname;
  const post = request.method === "POST";
  if (post && !sameOrigin(request)) return json({ error: "origin" }, 403);

  if (path === "/api/chat/config") {
    if (request.method !== "GET") return json({ error: "method" }, 405, { allow: "GET" });
    await maybeRunRetention(env, ctx);   // page views keep the retention job going (no cron)
    return chatConfig(env, url);
  }

  if (CHAT[path]) {
    if (!post) return json({ error: "method" }, 405, { allow: "POST" });
    if (env.CHAT_ENABLED !== "on" && env.CHAT_ENABLED !== "preview") return json({ fallback: "form", reason: "off" }, 503);
    // Until the database, the model and the secrets are all in place, fall back to the form.
    if (!ready(env) || !env.AI) return json({ fallback: "form", reason: "setup" }, 503);
    return CHAT[path](request, env, ctx);
  }

  if (AUTH[path]) {
    if (!post) return json({ error: "method" }, 405, { allow: "POST" });
    if (!ready(env)) return json({ error: "setup" }, 503);
    return AUTH[path](request, env, ctx);
  }

  const route = SIGNED_IN[path];
  if (!route) return json({ error: "not found" }, 404);
  const [method, adminOnly, handler] = route;
  if (request.method !== method) return json({ error: "method" }, 405, { allow: method });
  if (!ready(env)) return json({ error: "setup" }, 503);
  const user = await currentUser(request, env);
  if (!user) return json({ error: "signin" }, 401);
  if (adminOnly && !user.admin) return json({ error: "admin" }, 403);
  if (post && !(await csrfOk(request, env, user))) return json({ error: "csrf" }, 403);
  return handler(request, env, user, url, ctx);
}
