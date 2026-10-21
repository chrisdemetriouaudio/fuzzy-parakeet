---
phase: 9
status: now
health: green
updated: 2026-10-21
---

# 💬 Phase 9 — Lead chat & portal

> [!info] At a glance
> **What:** an AI chat on every page that helps a visitor describe one costly task, then turns it into a written audit request. Plus a passkey portal (sign-in with Face ID or a fingerprint, no password) where clients see their audit, scope and fixed price.
> **When:** 20 Oct 2026 onwards.
> **Status:** 👉 Step 2 of 10: the preview is live and passes every check (21 Oct 2026).
> **Steps:** match Phases 1 to 10 in the spec. Say "next" to move on.
> **Back to:** [[00 Dashboard]]

## 👉 To do

- 👉 **Check preview.chrisdemetriou.com by eye** once your Wi-Fi's DNS catches up.
- 👉 **Add 2 Cloudflare secrets on GitHub** for the auto-deploy (`02-migrate.md`, "Auto-deploy").
- 👉 **Point chrisdemetriou.com at the Worker;** check e-mail still flows both ways.
- 🛠️ **Step 3: build the database** (Cloudflare D1) and one config file.
- 🛠️ **Step 4: build the chat API** with daily caps and the form as fallback.
- 👉 **Step 5: add the Resend e-mail records** in Cloudflare (one SPF record only).
- 🛠️ **Step 6: build the portal** (client and admin, passkeys).
- 🛠️ **Step 7: build the chat widget** (launcher, Display panel, Reduce motion).
- 👉 **Step 8: review the privacy page draft** before the chat goes live.
- 🛠️ **Step 9: run tests and 10 scripted test conversations.**
- 💭 **Step 10: add a Labs card** (`labs/projects.json`).

## 📚 Where things are

- **Full status, decisions and risks:** `docs/PMO.md` (outside this vault, in the repo).
- **The spec:** `docs/lead-chat/CLAUDE_CODE_PROMPT_lead-widget-portal.md`
- **Step 1 report:** `docs/lead-chat/01-recon.md`
- **Step 2 guide and checklists:** `docs/lead-chat/02-migrate.md`

## ✅ Done

> [!success]- Step 2 built 21 Oct 2026 (tap to open)
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
