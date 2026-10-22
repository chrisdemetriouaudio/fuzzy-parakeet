// /api/*: the lead chat (and, from step 6, the portal). Every POST must come from a page on
// this site. The chat is off unless CHAT_ENABLED is "on" or "preview" (wrangler.jsonc).
import { json, sameOrigin } from "./lib/http.js";
import { handleChat } from "./chat/chat.js";
import { handleLead } from "./chat/lead.js";

const ROUTES = {
  "/api/chat": handleChat,
  "/api/lead": handleLead,
};

export async function handleApi(request, env, ctx, url) {
  const route = ROUTES[url.pathname];
  if (!route) return json({ error: "not found" }, 404);
  if (request.method !== "POST") return json({ error: "method" }, 405, { allow: "POST" });
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  if (env.CHAT_ENABLED !== "on" && env.CHAT_ENABLED !== "preview") return json({ fallback: "form", reason: "off" }, 503);
  // Until the database, the model and the secrets are all in place, fall back to the form.
  if (!env.DB || !env.AI || !env.SESSION_SECRET || !env.IP_HASH_SALT) return json({ fallback: "form", reason: "setup" }, 503);
  return route(request, env, ctx);
}
