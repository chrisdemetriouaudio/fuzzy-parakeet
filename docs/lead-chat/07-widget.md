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
2. **Launch:** set `"CHAT_ENABLED": "on"`, after Chris approves the privacy text (step 8) and has tried a passkey. Done 22 Oct 2026 (D34).

## Fact buttons and the summary card (D35)

Behind its own switch, `CHAT_NEXT` in `wrangler.jsonc`: `off`, `preview` (only on `?chat=preview` links) or `on`. Live visitors keep the chat as it is until Chris turns it on.

- **Fact buttons.** When the bot asks how often, how many people, how many hours or the software spend, it ends with a hidden tag (`[[ASK:hours]]`).
  - The Worker strips the tag; the widget shows the fixed set from `QUICK_ANSWERS` in `worker/config.js`.
  - The visitor can always type their own answer. The bot never writes the options, so it can't invent a menu.
  - The open questions (the task, what goes wrong) stay free text, as D01 requires.
- **Summary card.** When the chat is mapped, the widget asks `/api/brief`:
  - one extraction call, the one `/api/lead` used to make
  - shown as "Your brief": the task, how often, who, what it costs, tools, when it slips, fixed means
  - **That's right** or **Change something** (edit any line), then the contact form ("Where should Chris send it?")
  - `/api/lead` uses the confirmed brief, so there's no second model call. Chris's email says whether the visitor confirmed or corrected it.
  - If the brief can't be made (daily cap, model error), the usual contact form appears.
  - The internal blueprint match never reaches the visitor.
- **Data:** the brief waits on the chat (`migrations/0003_brief.sql`), moves into `pain_summary` with the lead, and is cleared by the retention job on chats that never became a lead.

### Checked (22 Oct 2026, Chromium, real security headers, scripted replies)

All 23 checks pass, and the original 30 still do:
- ordinary visitors see no buttons
- the frequency buttons match the fixed set; tapping sends the answer; typing clears them
- focus stays in the message box, then moves to the brief
- the card shows only filled lines; no contact form until it's confirmed
- **Change something:** sends only the changed lines; the card then shows the corrected brief as confirmed
- no brief: the usual contact form
- axe 0 issues with buttons, on the card, while editing, and in dark mode on a phone
- no CSP violations, no script errors
