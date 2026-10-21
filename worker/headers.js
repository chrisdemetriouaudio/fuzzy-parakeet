// Security headers for every response, and each page's Content-Security-Policy.
// GitHub Pages could only send HSTS; these are new with the move to Workers (Phase 2).
import { SCRIPT_HASHES } from "./csp-hashes.js";

const TURNSTILE = "https://challenges.cloudflare.com";
const WEB3FORMS = "https://api.web3forms.com";
const SOUNDCLOUD = "https://w.soundcloud.com";

// What every page may load. Scripts: only the site's own files, its inline scripts (by hash)
// and Turnstile, the chat's bot check: the chat opens from any page (D14). The chat API
// itself is on this domain ('self'). Styles allow inline because every page has a <style>
// block and /creative/ uses style="" attributes; scripts never get that.
const BASE = {
  "default-src": ["'none'"],
  "script-src": ["'self'", TURNSTILE],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "img-src": ["'self'"],
  "connect-src": ["'self'"],
  "frame-src": [TURNSTILE],
  "form-action": ["'self'"],
  "base-uri": ["'none'"],
  "frame-ancestors": ["'none'"],
};

// Extra sources, only on the pages that use them.
const PAGES = {
  // the workflow audit form posts to Web3Forms
  "/": { "connect-src": [WEB3FORMS], "form-action": [WEB3FORMS] },
  "/creative/": {
    "script-src": [SOUNDCLOUD],                 // the SoundCloud Widget API, for the CD player
    "frame-src": [SOUNDCLOUD],
    "img-src": ["https://i.ytimg.com", "https://*.sndcdn.com", "https://cdn.prod.website-files.com"],
    "media-src": ["'self'"],                     // the showreel
    "connect-src": [WEB3FORMS], "form-action": [WEB3FORMS],
  },
};

export function csp(page) {
  const d = {};
  for (const [k, v] of Object.entries(BASE)) d[k] = [...v];
  for (const [k, v] of Object.entries(PAGES[page] || {})) d[k] = [...(d[k] || []), ...v];
  d["script-src"].push(...SCRIPT_HASHES.map((h) => `'sha256-${h}'`));
  return Object.entries(d).map(([k, v]) => `${k} ${v.join(" ")}`).join("; ");
}

// HSTS matches what GitHub Pages sent: no includeSubDomains, so no other subdomain is
// forced onto HTTPS by this site.
export function securityHeaders(headers, pathname, status) {
  headers.set("strict-transport-security", "max-age=31536000");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  if ((headers.get("content-type") || "").startsWith("text/html")) {
    headers.set("content-security-policy", csp(status === 404 ? "/404.html" : pathname));
  }
}
