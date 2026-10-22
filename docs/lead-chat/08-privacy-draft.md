# Step 8: Retention job and privacy draft

Status: [../PMO.md](../PMO.md).

## The retention job (built)

`worker/retention.js` runs every day at 03:17 UTC (the cron trigger in `wrangler.jsonc`). It logs counts only.

1. **Chats that never became an audit request:** after 30 quiet days, contact details and introduced names are scrubbed from the messages and the IP hash is deleted. The anonymised chat is kept.
2. **Audit requests that never became work:** after 12 quiet months, name, email and organisation are deleted and scrubbed out of the chat, summary, audit and scope. The portal account goes too. Requests that were accepted, are being built or are live are kept as business records.
3. **Housekeeping:** visitor message counters after 2 days, plus expired sign-in links, challenges and sessions.

**What the scrubber catches:** email addresses, phone numbers, links to profiles or documents, the person's own name, email and organisation (when known), and names introduced as "my name is…", "I'm…" or "this is…".
**What it can miss:** a name mentioned in passing ("ask Sarah in accounts"), or a business that's identifiable from its description. The notice below says so.

---

## 🔴 Fix now, before the chat: the live notice is out of date

The privacy notice still says the site is **hosted on GitHub Pages**. Since 22 Oct 2026 it's **Cloudflare**. That line should change now, whatever happens with the chat.

---

## Draft: privacy notice (for Chris to approve)

Changes to `/privacy/`. Lines marked **(check)** need your confirmation.

### At the top (the note box)

> There are no analytics, no advertising, and no tracking of your browsing. The chat assistant is an AI; Chris reads every conversation and replies personally.

### What is collected (add)

- **If you use the chat:**
  - what you type
  - when you typed it, and the page you started on
  - a scrambled, one-way version of your IP address, used only to limit how many messages one person can send in a day
- **If you ask for your written audit:** your name, work email, organisation (optional), and that you agreed to us using them.
- **If you use your portal:**
  - your email address
  - your passkey's public key (your face or fingerprint never leaves your device)
  - when you sign in
  - if you accept a scope: the date and time, a scrambled IP address, and a fingerprint of the exact version you accepted

Replace "There is no account" with: *There's no newsletter and no profiling. A portal account exists only if you ask for an audit.*

### About the AI assistant (new section)

> The chat assistant is an AI: Meta's Llama 3.3 model, run by Cloudflare Workers AI. It isn't Chris, and it says so. Its only job is to help you describe one piece of work, so Chris can write your audit. It makes no decisions about you. Its summary is for Chris, who reads the full conversation. Your messages aren't used to train AI models. **(check: Cloudflare's Workers AI terms say customer content isn't used for training)**

### Why, and on what basis (add)

- **The chat, and its limits and bot check:** legitimate interest. That means understanding and answering your enquiry, and keeping the service working for everyone.
- **Your audit request and portal:** your consent, given in the chat form, and steps you ask for before a possible contract (scope and acceptance).

### Who handles it (replace the hosting paragraph)

- **Cloudflare:**
  - hosts the website (since 22 Oct 2026)
  - runs the chat's AI model
  - stores the chat and portal data, in Western Europe
  - runs the bot check (Turnstile)
  - processes your IP address in order to serve the site
- **Resend** sends the emails: Chris's lead notice and your portal link, from Amazon's servers in Ireland.
- **Web3Forms** delivers the forms, and the chat's fallback form.
- Google Fonts and YouTube, as now.
- **(check)** Cloudflare and Resend are US companies. They protect any transfer outside the UK with the safeguards UK law requires.

### Storage on your device (add)

- **Chat cookie** (`__Host-cd_chat`): keeps your conversation together for 24 hours. Strictly necessary for the chat you started.
- **Portal cookie** (`__Host-cd_portal`): keeps you signed in for 30 days. Strictly necessary.
- **Turnstile** (Cloudflare's bot check) runs only when you open the chat. It doesn't set tracking cookies. **(check: Cloudflare's Turnstile privacy addendum)**
- `cd-chat-preview` (local storage): only if you open a preview link Chris uses for testing.

### How long it is kept (replace)

- **Chats that don't become an audit request:** contact details, introduced names and links to profiles are removed after 30 days, and the scrambled IP address is deleted. The anonymised conversation is kept to improve the service. The automatic removal can miss a name mentioned in passing; email privacy@ and the whole chat will be deleted.
- **Audit requests:** name, email and organisation are deleted 12 months after the last activity. If the work goes ahead, they're kept as business records. **(check: how long, for example 6 years for accounts)**
- **Your portal:** download or delete your data at any time with **Download my data** and **Delete my data**.
- **Message counters:** 2 days.

### Your rights (add)

> From your portal you can download everything we hold about you, or delete it straight away. No decisions about you are made by automated means.

## Draft: cookie policy (add these rows)

| Name | What it's for | How long | Type |
|---|---|---|---|
| `__Host-cd_chat` | Keeps one chat conversation together | 24 hours | Strictly necessary (cookie) |
| `__Host-cd_portal` | Keeps you signed in to your portal | 30 days | Strictly necessary (cookie) |
| Turnstile | Cloudflare's bot check, only when you open the chat | Session | Strictly necessary |
| `cd-chat-preview` | Shows the chat in preview (Chris's testing only) | Until cleared | Local storage |
