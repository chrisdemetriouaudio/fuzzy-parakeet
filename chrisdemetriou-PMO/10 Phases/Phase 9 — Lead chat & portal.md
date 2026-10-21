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
> **Status:** 🛠️ Step 2 of 10 (move the site to Cloudflare Workers). Step 1 done 21 Oct 2026.
> **Steps:** match Phases 1 to 10 in the spec. Say "next" to move on.
> **Back to:** [[00 Dashboard]]

## 👉 To do

- 🛠️ **Step 2: move the site to Cloudflare Workers;** showreel served from R2 storage.
- 👉 **Create the R2 bucket and upload the showreel** (exact steps come with step 2).
- 👉 **Check the preview address** with the URL-parity checklist (every page still works).
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

## ✅ Done

> [!success]- Step 1 finished 21 Oct 2026 (tap to open)
> - [x] **Mapped the site:** no build step, no CSP yet, the form posts to Web3Forms.
> - [x] **Decided the showreel moves to R2 storage** (93 MB is over the 25 MB Workers limit).
> - [x] **Checked DNS is already on Cloudflare,** so no GoDaddy steps.
