# Step 7: The chat widget

Status: [../PMO.md](../PMO.md).

## How it works

- **One deferred script,** `scripts/chat.js`, with no dependencies. It's on `/`, `/privacy/`, `/cookies/` and the 404 page. It isn't on `/creative/` (out of scope) or `/portal/`.
- **It asks first:** `GET /api/chat/config`.
  - `off`, or anything not yet set up: the widget does nothing, and the site works as before.
  - `preview`: it shows only in a browser that opened a page with `?chat=preview`. `?chat=off` forgets that.
  - `on`: it shows to everyone.
- **Launcher** sits bottom-right. "Request a free workflow audit" and any `[data-open-chat]` element open it. With JavaScript off, the button still scrolls to the form.
- **The panel is a dialog:**
  - focus moves in, stays in, and Esc closes it
  - focus returns to the button that opened it
  - the one-line AI disclosure links to Privacy
  - the opening question is the only first message: no menu, no service buttons
- **Turnstile** (the bot check) loads only when the chat is opened, and is used for the first message.
- **Replies stream in** behind a typing indicator. A new message stops the reply in progress. Screen readers hear each finished reply once, not word by word.
- **Once the problem is mapped,** a contact form appears in the chat: name, work email, optional organisation and a consent checkbox. Errors show in plain words on the right field.
- **Fallback:** when a cap is hit or the model fails, the audit form appears in the panel, prefilled with what the visitor typed, and sends through Web3Forms as before.
- **Look:** the site's own colour tokens, so light, dark, high contrast and the Display panel all apply. Movement only with motion on. A full-screen sheet on phones.

## Checked (22 Oct 2026, Chromium, real security headers, scripted replies)

All 30 checks pass:
- off, preview and on modes
- the hero button opens the chat
- focus trap, Esc and focus return
- streaming
- proof links become real links
- the contact form and its errors
- the fallback form, prefilled and sent
- a full-screen sheet on phones
- reduced motion
- axe 0 issues in light, dark, phone and fallback
- no CSP violations on `/` or `/cookies/`

## To switch it on

1. **Preview:** set `"CHAT_ENABLED": "preview"` in `wrangler.jsonc` (Claude does it). Then open `https://chrisdemetriou.com/?chat=preview`.
2. **Launch:** set `"CHAT_ENABLED": "on"`, after Chris approves the privacy text (step 8) and has tried a passkey.
