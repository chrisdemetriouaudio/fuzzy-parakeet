# Step 6: The portal (/portal/)

Status: [../PMO.md](../PMO.md).

## How it works

- **One page, two roles.** `portal/index.html` uses the site's header, fonts and Display panel. `portal/portal.js` (plain JavaScript) draws each view from `/api/portal/*`.
- **Sign-in is passkeys only** (`worker/portal/auth.js`, `@simplewebauthn/server`).
  - A visitor's invite link (from the lead email) creates their passkey.
  - Lost passkey or new device: "Email me a sign-in link" sends a one-time link that makes a new one. It answers the same for unknown addresses, and sends at most 3 links an hour.
  - **Chris's first sign-in:** go to `/portal/` → "Email me a sign-in link" → `hello@chrisdemetriou.com`. The admin is whoever owns `ADMIN_EMAIL`.
  - Passkey challenges are used once and expire in 5 minutes. A passkey made for another site is refused.
- **Sessions:** a random id in an HttpOnly, Secure, SameSite=Strict cookie, valid 30 days. Only its hash is stored. Every change also needs a CSRF token.
- **Client view:**
  - status timeline
  - the written audit (Markdown, made safe)
  - the scope with its fixed price and **Accept**, which records the time, a hashed IP and the hash of that exact version
  - the chat
  - Download my data (JSON); Delete my data (type "delete")
- **Admin view:**
  - stats for the last 14 days: chats, mapped, asked for an audit, cap hits
  - leads table, filtered by stage and sorted by last activity
  - lead detail: pain summary, blueprint match, chat, audit and scope editors with live preview, stage changes with a private note
- **Publishing** an audit or a scope emails the client a short note with the portal link. The content stays in the portal.
- **Scopes are versioned:** every save is a new version, and only published versions reach the client. Accepting an outdated version is refused.

## Checked (22 Oct 2026)

- **28 Worker tests,** including real passkey cryptography (a software passkey): registration, sign-in, replay refused, wrong site refused, CSRF, scope versions, export, delete and scrubbing.
- **End to end in Chromium with a virtual passkey device:**
  - invite → passkey → sign out and back in
  - admin publishes the audit and scope
  - client accepts → export → delete
- **axe (WCAG 2.2 AA):** 0 issues on every view, light and dark, desktop and phone.
- **Browser:** no CSP violations, no sideways scroll at 390 px, and `<script>` in an audit stays text.

## For Chris to decide

- **Export leaves out the blueprint match,** as the spec says. Under UK GDPR, a client's right of access can cover inferences about them. Keep it out (it's about their business process, not them), or include it? (I11)
