# Steps 3–4: Database and chat API

Status: [../PMO.md](../PMO.md). Spec: [CLAUDE_CODE_PROMPT_lead-widget-portal.md](CLAUDE_CODE_PROMPT_lead-widget-portal.md).

## What's built

- **`migrations/0001_init.sql`**: 14 tables in D1 (`chrisdemetriou-leads`). Changes from the spec's list, and why:
  - `sessions_chat` is called **`chats`**, so it can't be confused with `auth_sessions`.
  - **`leads.user_id`** replaces `users.lead_id`. Someone who comes back with a second problem sees both in one portal.
  - **`ip_usage`** is new. `PER_IP_DAILY_MSGS` needs a counter.
  - **`auth_challenges`** is new. Synced passkeys keep their counter at 0, so single-use challenges are what stop a replayed sign-in.
  - `stage_events` uses `from_stage` / `to_stage`, because `from` and `to` are SQL words.
- **`worker/config.js`**: every limit, in one file.
- **`POST /api/chat`** (`worker/chat/chat.js`):
  - First message: Turnstile check, then a signed, HttpOnly, SameSite=Strict cookie (24 h).
  - Caps before any model call, in order: daily (70 calls) → this visitor (25 a day) → this chat (20 turns) → length (800 characters). Hitting one, or a model error, returns `{"fallback":"form"}`.
  - The reply streams as server-sent events. `[[MAPPED]]` is removed, even when it arrives in pieces, and the chat is marked `mapped`.
  - The visitor's words go to the model inside `<visitor>` tags, with the control token removed.
  - If a reply starts repeating the instructions, the stream is cut and replaced.
- **`POST /api/lead`** (`worker/chat/lead.js`):
  - Validates name, work email, optional organisation and consent.
  - Stores the lead and sets up the client's portal account.
  - Creates a one-time invite link valid for 24 h. Only its hash is stored.
  - Then, in the background: one extraction call (JSON, validated; a failure is flagged for review) and two emails.
- **`worker/email.js`** (step 5): Resend, plain text only, from hello@.
  - **To Chris:** "New lead: {org or name}: {task}", with the pain summary, blueprint match, proof shown, transcript and admin link. Reply-to is the visitor.
  - **To the visitor:** the short note with their portal link.
- **Switched off:** `CHAT_ENABLED` is `"off"`. `"preview"` lets Chris try it, and `"on"` launches it.
- **Tests:** 19 Worker tests (vitest, in the Workers runtime, with a local D1), plus 9 site tests. They run on every PR.

## What it needs before it can run

| What | Who | How |
|---|---|---|
| Token: D1, Turnstile, Workers AI | Chris | Cloudflare → API Tokens → edit the token |
| D1 database | Claude | Actions → Infra → `d1-create`; then the binding and migrations go into the deploy |
| `SESSION_SECRET`, `IP_HASH_SALT` | Chris | `openssl rand -base64 48 \| tr -d '\n' \| npx wrangler secret put SESSION_SECRET` (same for `IP_HASH_SALT`) |
| `TURNSTILE_SECRET` | Chris | Reuse the existing "Chris Demetriou contact form" widget (its site key is already in `wrangler.jsonc`): Dashboard → Turnstile → that widget → copy the **Secret key** → `npx wrangler secret put TURNSTILE_SECRET` |
| `RESEND_API_KEY` | Chris | `npx wrangler secret put RESEND_API_KEY` |

Claude's own safety check stops it from writing code that sets Worker secrets, so those are Chris's (I10).
