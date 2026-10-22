// Small crypto helpers on Web Crypto: random ids, hashes and signed values.
const enc = new TextEncoder();

export function b64url(bytes) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromB64url(text) {
  const s = atob(text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

export function randomId(bytes = 16) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// A visitor's IP, salted and hashed: enough to count their messages, not to find them.
export function hashIp(ip, salt) {
  return sha256Hex(`${salt}:${ip || "unknown"}`);
}

function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

// "value.signature". verify() returns the value, or null if it was tampered with.
export async function sign(secret, value) {
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(value));
  return `${value}.${b64url(sig)}`;
}

export async function verify(secret, signed) {
  if (typeof signed !== "string") return null;
  const dot = signed.lastIndexOf(".");
  if (dot < 1) return null;
  const value = signed.slice(0, dot);
  let sig;
  try { sig = fromB64url(signed.slice(dot + 1)); } catch { return null; }
  const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), sig, enc.encode(value));   // constant-time
  return ok ? value : null;
}
