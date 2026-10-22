// Turnstile, Cloudflare's bot check, is run once per chat (on the first message).
const VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function passesTurnstile(env, token, ip, hostname) {
  if (!env.TURNSTILE_SECRET || typeof token !== "string" || !token || token.length > 2048) return false;
  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  try {
    const res = await fetch(VERIFY, { method: "POST", body });
    const out = await res.json();
    // Cloudflare's always-pass test secret (used in local tests) answers for "example.com".
    const testing = env.TURNSTILE_SECRET.startsWith("1x0000000000000000000000000000000");
    const host = out.hostname === hostname || (testing && out.hostname === "example.com");
    return out.success === true && host && (!out.action || out.action === "chat");
  } catch {
    return false;
  }
}
