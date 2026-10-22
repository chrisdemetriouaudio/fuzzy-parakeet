// A software passkey for tests: makes real WebAuthn registration and sign-in responses
// (ES256, attestation "none") so the server's checks run for real.
import { b64url, fromB64url } from "../lib/crypto.js";

const enc = new TextEncoder();

// Just enough CBOR for WebAuthn: maps, unsigned/negative ints, byte and text strings.
function cbor(v) {
  const head = (major, n) => n < 24 ? [major << 5 | n] : n < 256 ? [major << 5 | 24, n] : [major << 5 | 25, n >> 8, n & 255];
  if (typeof v === "number") return Uint8Array.from(v >= 0 ? head(0, v) : head(1, -1 - v));
  if (typeof v === "string") { const b = enc.encode(v); return concat(Uint8Array.from(head(3, b.length)), b); }
  if (v instanceof Uint8Array) return concat(Uint8Array.from(head(2, v.length)), v);
  if (v instanceof Map) return concat(Uint8Array.from(head(5, v.size)), ...[...v].flatMap(([k, x]) => [cbor(k), cbor(x)]));
  throw new Error("cbor: unsupported");
}
const concat = (...parts) => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let i = 0; for (const p of parts) { out.set(p, i); i += p.length; } return out; };
const sha256 = async (b) => new Uint8Array(await crypto.subtle.digest("SHA-256", b));

// WebCrypto signs as r||s; WebAuthn wants DER.
function der(raw) {
  const int = (b) => { let i = 0; while (i < b.length - 1 && b[i] === 0) i++; b = b.slice(i); return b[0] & 0x80 ? concat(Uint8Array.of(0), b) : b; };
  const r = int(raw.slice(0, 32)), s = int(raw.slice(32));
  return concat(Uint8Array.of(0x30, r.length + s.length + 4, 2, r.length), r, Uint8Array.of(2, s.length), s);
}

export async function createPasskey() {
  const keys = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const jwk = await crypto.subtle.exportKey("jwk", keys.publicKey);
  const id = crypto.getRandomValues(new Uint8Array(16));
  let counter = 0;
  const clientData = (type, challenge, origin) => enc.encode(JSON.stringify({ type, challenge, origin, crossOrigin: false }));
  const flags = 0x01 | 0x04;   // user present, user verified
  return {
    id: b64url(id),
    async register(options, origin) {
      const cose = cbor(new Map([[1, 2], [3, -7], [-1, 1], [-2, fromB64url(jwk.x)], [-3, fromB64url(jwk.y)]]));
      const authData = concat(await sha256(enc.encode(options.rp.id)), Uint8Array.of(flags | 0x40), new Uint8Array(4),
        new Uint8Array(16), Uint8Array.of(0, id.length), id, cose);
      const att = cbor(new Map([["fmt", "none"], ["attStmt", new Map()], ["authData", authData]]));
      const cd = clientData("webauthn.create", options.challenge, origin);
      return { id: b64url(id), rawId: b64url(id), type: "public-key", clientExtensionResults: {},
        response: { clientDataJSON: b64url(cd), attestationObject: b64url(att), transports: ["internal"] } };
    },
    async login(options, origin, rpId) {
      counter += 1;
      const authData = concat(await sha256(enc.encode(rpId)), Uint8Array.of(flags), Uint8Array.of(0, 0, 0, counter));
      const cd = clientData("webauthn.get", options.challenge, origin);
      const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, keys.privateKey, concat(authData, await sha256(cd))));
      return { id: b64url(id), rawId: b64url(id), type: "public-key", clientExtensionResults: {},
        response: { clientDataJSON: b64url(cd), authenticatorData: b64url(authData), signature: b64url(der(sig)) } };
    },
  };
}
