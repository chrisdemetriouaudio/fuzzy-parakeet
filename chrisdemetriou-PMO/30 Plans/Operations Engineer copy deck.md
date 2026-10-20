---
title: Operations Engineer copy deck
updated: 2026-10-19
---

# 🧭 Operations Engineer copy deck

> [!info] At a glance
> **What:** the agreed copy, design system and SEO/AEO/GEO plan for the homepage overhaul.
> **Status:** ✅ Built 20 Oct 2026 (PR #21). ⚠️ The title "Operations Engineer" was replaced on 20 Oct 2026 by "Software Developer & Consultant"; the rest still applies.
> **Back to:** [[00 Dashboard]] · [[Decision Log]]

> Copy + UX/visual identity + SEO/AEO/GEO. Agreed with Chris, 19 Oct 2026. **Nothing is live yet.**
> All 10 decisions are made (Part 5).
> Every credit and project fact below is taken from the current site or `labs/projects.json`. Nothing is invented: no stats, no testimonials.

---

# PART 1 · THE COPY DECK (UK English)

## 0 · Top bar

- **Wordmark:** `chris demetriou / operations engineer`
- **Status pill:** `● Manchester · working UK-wide`
- **Nav:** Tools · Proof · Process · FAQ · Labs · Contact
- **Nav button:** Request a workflow audit

## 1 · Hero

**Eyebrow (mono):**
OPERATIONS ENGINEER · CUSTOM INTERNAL TOOLS · MANCHESTER

**H1:**
> Custom internal tools that end admin debt.

*H1 alternatives:*
- Stop paying the SaaS tax. Own the software that runs your operations.
- Your team was hired to think. I engineer the software that does the rest.

**Standfirst:**
> I engineer bespoke business software and automated workflows: booking engines, reminder pipelines, chasing engines and payment pipelines. They run your repetitive operations without anyone touching them. You own the tool outright. No seat licences. Zero Software Tax.

**Primary CTA:** Request a free workflow audit
**Secondary CTA:** See tools running in production →

**Under the CTAs (mono, muted):** Fully written. No meetings. A one-page map you keep.

**Credential line (mono, muted):**
> 20 years in studio production on DreamWorks, Warner Bros and Sony Pictures releases. Same precision, now applied to your operations.

## 2 · The problem: admin debt

**H2:** Admin debt is costing you people.

> Every hour your team spends copying between spreadsheets, chasing replies and checking payments is skilled time you pay for and never get back. That is admin debt. It compounds every week you leave it.

**Four symptom cards:**

| Card | Line |
|---|---|
| **Bookings by hand** | Calendars, room hires and client slots run on email threads and memory. |
| **Pipelines by copy-paste** | Onboarding, certification and volunteer rotas rebuilt in a spreadsheet every week. |
| **Cash stuck in the chase** | Deposits, retainers and renewals tracked manually, so money lands late. |
| **Spreadsheet sprawl** | Five tools, none connected, and one person who knows how it all fits together. |

## 3 · Internal Tool Blueprints (the Core Four)

**H2:** Four blueprints. Built for your process, owned by you.

> Each blueprint is a proven core, engineered around how your organisation actually works. It is critical business infrastructure, not a plug-in.

### 01 · Booking Engine
- **Replaces:** inbox back-and-forth, double bookings, per-seat scheduling subscriptions.
- **Automates:** clients choose an available slot; you approve it from your inbox; calendar files are issued automatically.
- **Frees:** whoever currently runs the diary.
- **Proven in:** CDCS Contracts *(demo)*: online booking, email approval, calendar invites.

### 02 · Reminder Pipeline
- **Replaces:** manual reminder emails and "don't forget" messages.
- **Automates:** scheduled email, push and WhatsApp alerts fire at the right moment, every time.
- **Frees:** the person holding everyone else's calendar in their head.
- **Proven in:** Genesis *(live)*: scheduled alerts straight to members' phones.

### 03 · Chasing Engine
- **Replaces:** the "just following up" emails nobody wants to send.
- **Automates:** spots who hasn't replied, nudges only them, and confirms once everyone is in.
- **Frees:** your coordinator, from coordinating.
- **Proven in:** Genesis *(live)*: finds a date everyone can make, chases non-repliers, confirms.

### 04 · Payment Pipeline
- **Replaces:** manual invoice tracking and "has this been paid?" checks.
- **Automates:** invoice issued, card payment taken through Stripe, payment verified before the record is marked paid.
- **Frees:** your accounts receivable, from the chase.
- **Proven in:** CDCS Contracts *(demo, Stripe test mode)*.

**Line under the blueprints:**
> Need something outside the four? Custom dashboards and connections between fragmented systems are scoped in the audit.

## 4 · Proof: tools in production

**H2:** Running now. Open any of them.

| Card | Tag | Line | Link |
|---|---|---|---|
| **Genesis** | ● Live | A scheduling and chasing engine running a working band with zero admin: finds the date, chases the stragglers, confirms. | Try Genesis with a demo band ↗ |
| **CDCS Contracts** | ◐ Demo | A complete booking-to-payment pipeline for a trade business: book online, approve by email, pay by card (Stripe test mode). | Try the CDCS demo ↗ |
| **Reach Children Uganda** | ● Live | Legacy system recovery for a UK children's charity: 342 archived addresses scanned, 154 pages recovered, rebuilt off WordPress onto free hosting. No plugins, no hosting bill. | Visit the charity's site ↗ |

**Link:** Full build notes for every tool on Labs →

## 5 · The technical edge: Zero Software Tax

**H2:** Zero Software Tax: own the tool, not the bill.

> Off-the-shelf software charges you every month, per person, for features you never use, and holds your data while you pay. A bespoke tool is a permanent operational asset. You pay once to build it.

| | **Per-seat SaaS** | **Bespoke internal tool** |
|---|---|---|
| **Pricing** | Per user, per month. Grows with your headcount. | Built once. Adding staff costs nothing. |
| **Fit** | You bend your process to the product. | The tool fits your process. |
| **Data** | In their system. Export on request. | In your account. |
| **If you stop paying** | Access ends. | It keeps running. |

**Engineering points:**
- **You own it.** The code and the hosting accounts are in your name.
- **No licence fees.** Per-seat pricing doesn't exist here.
- **Running costs at cost.** Infrastructure is billed to your own accounts, typically from about £4 a month. Card fees and messages are pay-as-you-go.
- **Fast by construction.** Plain HTML, CSS and JavaScript on the front end, with minimal dependencies. Nothing heavy to load.
- **Fewer moving parts.** No CMS, no plugins, no framework-upgrade treadmill.
- **Secure by default.** Passkey sign-in, bot protection and strict security headers come as standard.

## 6 · Process

**H2:** From workflow audit to permanent asset.

1. **Written workflow audit (free).** You describe the process in writing; I send back a one-page map of every mechanical step and what can run itself. No meetings.
2. **Blueprint.** A written scope with a fixed price, agreed before any work starts.
3. **Build.** Engineered around your real data and your real edge cases.
4. **Handover.** Code, accounts and documentation, all yours. Ongoing support is available as a monthly plan.

## 7 · The bridge: precision is a habit

**H2:** Twenty years where one error costs the session.

> Before operations, I spent two decades in professional studios. I was a performer on an Oscar-nominated song (*Accidentally In Love*, *Shrek 2*), orchestral arranger on a GRAMMY-nominated single (Seal, *Walk On By*), and assistant engineer on Hans Zimmer's *King Arthur* soundtrack, with sessions at SARM Studios.
>
> Studio work is systems work: complex signal chains, unforgiving deadlines and no tolerance for lost files. That discipline is exactly how I engineer your internal tools.

**Credit strip (text, not logos):**
DreamWorks · Warner Bros · Sony Pictures · Working Title · Jerry Bruckheimer Films

**Link:** Full credits, media and worship →  *(the new `/creative/` page; see Part 5)*

## 8 · FAQ (direct answers)

**What is a custom internal tool?**
> A custom internal tool is bespoke business software built for one organisation's workflow, such as a booking engine, reminder pipeline or payment tracker, instead of a general product rented per user per month.

**Who builds custom internal tools in Manchester?**
> Chris Demetriou is an Operations Engineer based in Manchester who builds custom internal tools and automated workflows for organisations across the UK.

**How is a bespoke tool different from SaaS?**
> SaaS is rented per user, per month, and built for everyone. A bespoke tool is built once for your process and owned by you, so there are no seat licences: what I call Zero Software Tax.

**Can it take payments through Stripe?**
> Yes. The Payment Pipeline blueprint issues invoices, takes card payments through Stripe and verifies each payment before marking it paid.

**Do I own the software?**
> Yes. The code and the hosting accounts are in your name from handover.

**What does it cost to run?**
> No licence fees. Infrastructure is billed to your own accounts at cost, typically from about £4 a month. Stripe's standard card fees and per-message charges for WhatsApp alerts are pay-as-you-go.

**What happens after launch?**
> The tool keeps running on your infrastructure. Ongoing support and changes are available as a monthly plan.

**Do I have to get on a call?**
> No. The workflow audit, the scope and the updates are all written, by email. You keep a record of every decision.

**Do you build websites?**
> No. I build internal tools and automated workflows: the software behind your operations, not your marketing site.

## 9 · Contact

**H2:** Show me the workflow that's costing you.

> Request a free workflow audit. Describe the process below; I'll send back a one-page map of which steps can run themselves, and tell you straight whether a custom tool is worth it. Fully written. No meetings.

**Form:**

| Field | Label | Notes |
|---|---|---|
| Textarea (first, required) | **Which process eats the most hours?** | Hint: *Walk me through the steps as they happen today.* |
| Text (required) | **Which tools does it run on now?** | Hint: *e.g. Excel, Outlook calendar, paper forms, an existing booking app.* |
| Select (required) | **How often does it run?** | Daily · Weekly · Monthly · Per client or event |
| Select (required) | **How many people touch it?** | 1–2 · 3–10 · 11–50 · 50+ |
| Text (required) | **Your name** | |
| Email (required) | **Work email** | |
| Text (optional) | **Organisation** | |

- **Button:** Request my written audit
- **Under the button:** I reply personally, by email.
- **Success heading:** Received. Your workflow is in the queue.
- **Success body:** I'll review it and reply by email. Meanwhile: see the tools running on Labs →

---

# PART 2 · UX LAYOUT & VISUAL IDENTITY SYSTEM

## Cognitive flow (one scrolling page)

| # | Section | Job | Visual pattern |
|---|---|---|---|
| 0 | Top bar | Identity + one action | Sticky, 56px, wordmark left, status pill, nav, amber button right |
| 1 | Hero | Category + outcome + action | 7/5 split: copy left; right side shows a **pipeline panel** (Trigger → Action → Outcome) drawn as a console, not a photo |
| 2 | Admin debt | Name the pain | 4 symptom cards, 2×2, surface-1, mono labels |
| 3 | Blueprints | What you buy | 4 **spec cards** (Replaces / Automates / Frees / Proven in), numbered `01–04`, like module docs |
| 4 | Proof | Show it's real | 3 cards with status pills (● Live, ◐ Demo), product screenshots (captured from the live tools), external links |
| 5 | Zero Software Tax | The economics | Comparison table + 6 engineering points as a checklist |
| 6 | Process | Lower the risk | Horizontal 4-step track (vertical on phones) |
| 7 | Bridge | Trust anchor | Two-column: small portrait + copy; credit strip in mono beneath |
| 8 | FAQ | Answers for people and AI | Native `<details>` accordion, one question per row |
| 9 | Contact | Convert | Form left, "what happens next" right |
| 10 | Footer | Exit routes | Privacy · Cookies · Cookie settings · Creative · Labs · Email |

**First screen (1280 and 390):** eyebrow, H1, standfirst, both CTAs, credential line. On phones the pipeline panel drops below the CTAs.

## Trust anchor placement

1. **Above the fold, one line:** the credential line under the CTAs (studio names only). It sets authority without changing the subject.
2. **Section 7, the bridge:** full proof (Oscar-nominated song, GRAMMY-nominated single, Hans Zimmer, SARM), placed **after** the offer, the proof and the economics. By then the buyer knows what they're buying, and the credits answer "can I trust this person with my operations?"
3. **Off the homepage:** full credits tables, the media showreel and worship move to `/creative/`, linked from the bridge and the footer. The homepage stays one story. (Agreed.)

## Visual direction: "internal software, not brochure"

- **Feel:** a calm, premium internal app: an IDE or ops dashboard. Dense where it informs, generous where it sells.
- **Avoid:** stock photos, gradient blobs, full-bleed hero portraits, carousels, decorative animation.
- **Signature elements:** status pills, numbered spec cards, pipeline diagrams (inline SVG), mono metadata rows, 1px hairline borders, a subtle 8px dot grid on the hero only.

## Typography

| Role | Font | Size / weight |
|---|---|---|
| Display (H1) | **Inter** (or Inter Tight) | clamp(2.4rem, 5vw, 3.6rem) / 650, −0.02em |
| H2 | Inter | 1.75–2.1rem / 600 |
| Body | Inter | 17px / 400, line-height 1.6, max 68ch |
| Labels, status, metadata, code | **JetBrains Mono** | 12–13px / 500, +0.06em, uppercase for labels only |

- **Drop:** Fraunces (serif reads "brochure") and Space Mono (too quirky for "systems").
- **Rule:** mono never for body text; nothing under 12px (dyslexia and zoom).

## Colour tokens (contrast checked, WCAG 2.2 AA)

| Token | Hex | Use | On bg |
|---|---|---|---|
| `--bg` | `#0E1014` | page | — |
| `--surface` | `#151821` | cards | — |
| `--surface-2` | `#1C202B` | raised, table head | — |
| `--border` | `#2A2F3B` | hairlines (decorative) | — |
| `--border-strong` | `#6B7385` | form fields, focus-adjacent | 4.00:1 |
| `--ink` | `#E7EAF0` | text | 15.80:1 |
| `--ink-muted` | `#9AA3B2` | secondary text | 7.49:1 |
| `--accent` | `#E8A34D` | CTA, focus, key numbers (brand continuity) | 8.87:1 |
| `--accent-ink` | `#14100A` | text on accent | 8.82:1 |
| `--live` | `#3FBF7F` | ● Live status | 8.13:1 |
| `--link` | `#7AA7FF` | inline links | 7.98:1 |
| `--error` | `#F07A72` | form errors | 7.01:1 |

Every text token passes AA on `--surface` and `--surface-2` as well (lowest: error at 5.99:1).

## Spacing, shape, motion

- **Spacing scale:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 72 · 96px. Section padding 96px desktop, 56px phone.
- **Grid:** 12 columns, 1120px max, 24px gutters, 16px side padding on phones.
- **Radius:** 6px cards, 4px inputs and pills.
- **Motion:** none beyond 150ms hover and focus transitions; fully off under `prefers-reduced-motion`.

---

# PART 3 · SEO / AEO / GEO OPTIMISATION LAYER

## Search tags

- **Title (≤60):** `Custom Internal Tools, Manchester | Chris Demetriou` *(the old title says "Web Developer", which is banned)*
- **Meta description:** `Operations Engineer in Manchester building custom internal tools and automated workflows: booking engines, reminders, chasing and Stripe payments. Own it. Zero Software Tax.`
- **H1:** holds the category entity ("custom internal tools").

## Why the copy is written this way

1. **Definitions come first.** Every FAQ answer and section intro opens with a self-contained sentence: *who + what + where*. AI engines (ChatGPT, Claude, Perplexity, Gemini) lift whole sentences; a sentence that only makes sense in context doesn't get quoted.
2. **Verifiable specifics beat superlatives.** "342 archived addresses scanned, 154 pages recovered" and "Oscar-nominated song (*Shrek 2*)" are checkable facts, so models cite them confidently. "Unbreakable" and "zero-error" are unverifiable, so models discount them. I left them out.
3. **Entity consistency.** The same string, "Chris Demetriou, Operations Engineer, Manchester", appears in the title, H1 area, Person schema, FAQ, Labs and the footer. Consistent entities are how engines decide that "Chris Demetriou" is one known thing. No outside profiles are linked (Chris's choice), so the site and Labs carry that job alone.
4. **Buyer phrases, placed naturally:** custom internal tools UK · bespoke business software · business automation engineer Manchester · Manchester workflow automation · Stripe invoice integration UK · automated booking system · custom software asset · bespoke backend automation.
5. **Topic coverage, not "LSI".** Google doesn't use LSI; that's a myth. What works is covering the topic's real entities (Stripe, calendar invites, passkeys, Cloudflare, WordPress migration, accounts receivable), which the blueprints and proof cards already do.

## Structured data (JSON-LD)

- **Person:** `jobTitle: Operations Engineer`; `knowsAbout` (business process automation, custom internal tools, Stripe integration, booking systems, audio engineering); `sameAs` (Labs only, by choice).
- **ProfessionalService:** name, `areaServed` (Manchester, United Kingdom), and `hasOfferCatalog` with **4 `Service` items** (the Core Four).
- **FAQPage:** the section 8 Q&As, word for word.
- **Note:** since 2023 Google only shows FAQ rich results for government and health sites. The FAQ schema still feeds Bing, AI engines and Google's understanding; it just won't produce the dropdown in results.

## Machine-readable extras

- **`/llms.txt`:** a plain-text summary of who, what, where, the 4 blueprints, the proof links and contact. Cheap, and read by several AI crawlers.
- **`robots.txt`:** already allows everything. Add explicit `Allow` lines for GPTBot, ClaudeBot, PerplexityBot and Google-Extended, so nobody blocks them by accident later.
- **Labs project pages become case studies:** Problem → what it replaced → how it works → stack. Each one is a long-tail landing page (e.g. "Stripe invoice integration UK" lives on the CDCS page).

## Honest caveats

- **"Operations Engineer"** as a search term is mostly job-hunters (SRE, DevOps, manufacturing). Use it as your **identity**; rank on the **buyer phrases** above.
- **"Zero Software Tax"** is a coined phrase. Nobody searches it. It's there to be memorable and quotable, not to rank.
- **Named competitors:** I wrote "per-seat SaaS", not "bloated Salesforce/HubSpot". Calling named brands bloated in UK marketing copy invites disparagement complaints and adds nothing the buyer doesn't already feel.

---

# PART 4 · BEFORE / AFTER CRITIQUE

| Before | After | Why it converts higher |
|---|---|---|
| **"Web Developer"** | **"Operations Engineer"** | Moves you from a commodity bought by the page to infrastructure bought by return on investment. It also stops attracting "can you redo my homepage" enquiries. |
| **"I build tools that take the admin off your hands."** | **"Custom internal tools that end admin debt."** | Names the category (searchable), the problem (felt) and the outcome (bought). The current line is friendly but generic: "tools" could mean anything, and it gives search engines no entity to index. |
| **"A sentence is fine."** | **"Walk me through the steps as they happen today."** | Diagnostic, not apologetic. It signals expertise, gets you a real process description to quote on, and still asks for nothing hard. |

---

# PART 5 · DECISIONS (Chris, 19 Oct 2026)

1. **Ownership:** code in the client's GitHub, hosting in the client's Cloudflare account, from handover.
2. **Running costs:** "No licence fees. Infrastructure billed to your own accounts, at cost, typically from about £4 a month." Plan for paid tiers, not free ones.
3. **Support:** optional monthly plan after handover.
4. **Workflow audit:** free, **written only, by email**, capped at a one-page map. No calls.
5. **Pricing:** fixed price per agreed scope.
6. **Reminder channels:** email, push and WhatsApp only. Add SMS once a build uses it.
7. **Music, media and worship:** move to `/creative/`.
8. **Look:** IDE / internal-software restyle, keeping amber as the accent. Labs follows.
9. **Profiles:** no LinkedIn or GitHub links.
10. **Reach Children Uganda:** stays on the homepage as "legacy system recovery".

**Running-cost reference (checked 19 Oct 2026, third-party sources, excl. VAT):** Cloudflare Workers Paid $5/month · Resend Pro $20/month for 50k emails · web push £0 · WhatsApp ~1.6p per utility message · SMS ~3–4.5p per text · Stripe 1.5% + 20p per standard UK card.
