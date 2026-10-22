---
phase: 9
status: now
health: green
updated: 2026-10-22
---

# 💬 Phase 9 — Lead chat & portal

> [!info] At a glance
> **What:** an AI chat on every page that helps a visitor describe one costly task, then turns it into a written audit request. Plus a passkey portal (sign-in with Face ID or a fingerprint, no password) where clients see their audit, scope and fixed price.
> **When:** 20 Oct 2026 onwards.
> **Status:** 👉 The chat is live in preview (22 Oct 2026): only you see it, at chrisdemetriou.com/?chat=preview.
> **Steps:** match Phases 1 to 10 in the spec. Say "next" to move on.
> **Back to:** [[00 Dashboard]]

## 👉 To do

- 👉 **Check e-mail still flows both ways.**
- 👉 **Turn off GitHub Pages** once both pass.
- 👉 **Approve the privacy draft** (`docs/lead-chat/08-privacy-draft.md`); it also fixes "hosted on GitHub Pages".
- 🛠️ **Run all 11 test conversations** after the AI budget resets (scheduled, midnight UTC).
- 💭 **Step 10: add a Labs card** (`labs/projects.json`).

## 📚 Where things are

- **Full status, decisions and risks:** `docs/PMO.md` (outside this vault, in the repo).
- **The spec:** `docs/lead-chat/CLAUDE_CODE_PROMPT_lead-widget-portal.md`
- **Step 1 report:** `docs/lead-chat/01-recon.md`
- **Step 2 guide and checklists:** `docs/lead-chat/02-migrate.md`

## ✅ Done

> [!success]- Tested and tuned 22 Oct 2026 (tap to open)
> - [x] **Tried the chat in preview:** test lead worked, both emails arrived.
> - [x] **Tuned the bot** after its first real tests: no prompt leaks, no early mapping, short replies.
> - [x] **Decided: vague visitors get sharper questions,** not a menu ("the last real time it happened").

> [!success]- Switched on in preview 22 Oct 2026 (tap to open)
> - [x] **Widened the token and set the 4 Worker secrets.**
> - [x] **Created the database** (Western Europe) through a GitHub Action, no dashboard.
> - [x] **Checked the chat model** is still offered by Cloudflare.
> - [x] **Bound the database and model;** chat switched to preview.

> [!success]- Step 9 built 22 Oct 2026 (tap to open)
> - [x] **Added 46 automated tests** that run on every pull request.
> - [x] **Built the 10 test conversations** and their 8 rules; they run once the token allows.

> [!success]- Step 8 built 22 Oct 2026 (tap to open)
> - [x] **Built the daily clean-up:** quiet chats anonymised after 30 days, quiet leads after 12 months.
> - [x] **Drafted the privacy and cookie text** for you to approve.

> [!success]- Step 7 built 22 Oct 2026 (tap to open)
> - [x] **Built the chat widget:** launcher, streaming replies, contact form, form fallback.
> - [x] **Checked it in a real browser:** keyboard, screen reader, dark mode, phone; no issues.
> - [x] **Kept it hidden** until you switch it on (preview first: `?chat=preview`).

> [!success]- Step 6 built 22 Oct 2026 (tap to open)
> - [x] **Built the portal:** passkey sign-in, audit, scope and price with Accept, export and delete.
> - [x] **Built your admin view:** leads, summaries, audit and scope editors, stats.
> - [x] **Tested it end to end** in a real browser with a virtual passkey; no accessibility issues.

> [!success]- Steps 3–5 built 22 Oct 2026 (tap to open)
> - [x] **Designed the database:** 14 tables, with personal data kept in few places.
> - [x] **Built the chat API:** bot check, daily caps, streaming, form fallback.
> - [x] **Built lead capture:** summary, portal invite, plain-text emails to you and the visitor.
> - [x] **Added 19 tests** that run in the Workers runtime on every pull request.

> [!success]- Step 2 cutover 22 Oct 2026 (tap to open)
> - [x] **Moved chrisdemetriou.com and www to the Worker;** parity passes, Cloudflare serves it.
> - [x] **Removed an old August route** that took the site down overnight (about 12 hours).
> - [x] **Decided: all crawlers welcome,** AI ones included, as before; Cloudflare set to Allow.
> - [x] **Found Resend already set up** on send.chrisdemetriou.com, so no SPF merge.

> [!success]- Step 2 built 21 Oct 2026 (tap to open)
> - [x] **Checked the preview by eye** (NordVPN's DNS hid it at first).
> - [x] **Added the Cloudflare secrets;** the auto-deploy ran green.
> - [x] **Deployed the preview;** the parity check passed on Cloudflare.
> - [x] **Decided: merging deploys the site by itself** (GitHub Action).
> - [x] **Created the R2 bucket and uploaded the showreel** (Western Europe).
> - [x] **Moved the preview to preview.chrisdemetriou.com;** workers.dev is off.
> - [x] **Built the Worker:** only the 32 site files go live; private folders answer 404.
> - [x] **Added security headers,** including a strict CSP: 0 violations on every page.
> - [x] **Built the showreel route** for R2: old address, with seeking.
> - [x] **Added a one-command parity check** and 7 tests that run on every pull request.

> [!success]- Step 1 finished 21 Oct 2026 (tap to open)
> - [x] **Mapped the site:** no build step, no CSP yet, the form posts to Web3Forms.
> - [x] **Decided the showreel moves to R2 storage** (93 MB is over the 25 MB Workers limit).
> - [x] **Checked DNS is already on Cloudflare,** so no GoDaddy steps.
