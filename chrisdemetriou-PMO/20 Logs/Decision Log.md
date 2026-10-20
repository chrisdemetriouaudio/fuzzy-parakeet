---
title: Decision Log
updated: 2026-10-18
---

# 🧠 Decision Log

> [!info] At a glance
> **What:** what we decided, and why. One box per decision, newest first.
> **Back to:** [[00 Dashboard]]

> [!success]- 20 Oct 2026 · Nav: Creative after Contact, set apart (Agreed)
> - **Status:** Agreed by Chris (option A).
> - **Decided:** Tools · Proof · Process · FAQ · Labs · **Contact** (a button), then a divider and **Creative** in purple. Same on the homepage, `/creative/`, Labs and generated pages.
> - **Why:** Creative sat in the middle of the business path and broke its flow; the path now ends on Contact, and Creative reads as a separate side door.

> [!success]- 20 Oct 2026 · Micro-behaviours, with a "Reduce motion" switch (Agreed)
> - **Status:** Agreed by Chris ("the site doesn't feel premium yet").
> - **Decided:** small, purposeful movement: the week plays itself once, blocks reveal as you scroll, numbers count up, the nav highlight slides, cards lift, FAQ answers glide, email copies in one tap.
> - **Decided:** **Reduce motion** in the Aa (Display) panel turns all of it off; the device's own "reduce motion" setting is respected too. Nothing on the page depends on the movement.
> - **Labs:** CSS-only touches (no script there); they follow the device setting.

> [!success]- 20 Oct 2026 · Light mode is the default on chrisdemetriou.com and Labs (Agreed)
> - **Status:** Agreed by Chris. Replaces "dark by default" from earlier the same day.
> - **Decided:** both sites open in the light "Your week" palette, even without JavaScript. Dark stays one tap away in the Display panel on chrisdemetriou.com.
> - **Labs:** light only for now. The Display panel needs a script, and Labs' security policy (CSP) allows none; adding it is a separate decision.

> [!success]- 20 Oct 2026 · New look: warm and personal, with clever UI (Agreed)
> - **Status:** Agreed by Chris. **Chosen: 1 "Your week", dark by default** (light stays in the Display panel).
> - **Decided:** the current look feels machine-made; the redesign is **warm and personal**: **quirky, creative, not distracting, tech, clever UI**.
> - **Decided:** **no music or studio imagery** on the software site (Chris: an analogue studio session "has nothing to do with custom software builds"). Music stays on `/creative/`.
> - **Mock-ups:** 1 "Your week" (before/after switch), 2 "Quick maths" (hours-a-year sentence), 3 "Plain English switch" (techy/plain words).

> [!success]- 20 Oct 2026 · Display settings on chrisdemetriou.com (Agreed)
> - **Status:** Agreed. Chris asked for the Neuro Support Checker's accessibility panel on this site.
> - **Decided:** a **Display** button on every page: theme (dark, light, match device), text size, dyslexia-friendly font (OpenDyslexic), wider spacing, high contrast, reading mask.
> - **Decided:** dark stays the default; choices are saved on the visitor's device only (`cd-display`), listed in the cookie and privacy pages.
> - **Why:** Chris is neurodivergent and wants the site and services to be accessible. Every mode passes axe-core (WCAG 2.2 AA) on desktop and phone.

> [!question]- 20 Oct 2026 · Search & publishing: evidence first, few pages (Proposed)
> - **Status:** Proposed. Chris reviews the pull request.
> - **Proposed:** pages are built from evidence records only after Chris approves that exact version; any later edit voids the approval.
> - **Proposed:** case studies go on the main site (`/work/`); Labs keeps the technical build notes.
> - **Proposed:** no city pages, no one-page-per-blueprint pages, no music credit pages, no embed-only worship pages.
> - **Proposed:** music service pages wait until Chris confirms which services he still sells.
> - **Why:** qualified enquiries and trust, not page count. Google's spam policy targets pages mass-produced without user value.

> [!question]- 20 Oct 2026 · Title is "Software Developer & Consultant"
> - **Decided by Chris:** replaces "Operations Engineer" on the site, share card, structured data, `llms.txt`, `/creative/` and Labs.
> - **Decided by Chris:** subtitle "I turn business problems into custom tools and applications—from the first idea to a tested, working solution."; headline "Custom software that solves your business problems".
> - **Decided by Chris:** homepage search title "Custom Software Developer & Consultant | Chris Demetriou" and the matching description.
> - **Decided:** the Process steps follow the journey: understand the problem → design the solution → build and test → launch and hand over.
> - **Kept:** ownership, written audit (no calls), fixed price, blueprints, Zero Software Tax, music/media/worship on `/creative/`.
> - **Why:** "Operations Engineer" sounded like an employee job title and hid the consulting half (understanding and designing). Earlier entries stay as history.

> [!question]- 19 Oct 2026 · Homepage: the deck plus the best of both sessions
> - **Decided by Chris:** two sessions had conflicting decisions; the Operations Engineer deck wins, with the best of the other session kept.
> - **Kept from the deck:** Operations Engineer; clients own code and accounts; free written audit, no calls; fixed price; IDE look.
> - **Kept from the other session:** `/creative/`; Neuro Support Checker; 16 years on enterprise systems; "Sound familiar?" problems; no "admin" wording.
> - **Decided:** the Core Four widen to six blueprints (+ Client Portal, Self-Checking Records); "Admin Debt" becomes "repetitive manual work".
> - **Why:** one direction for the site, without losing real facts.

> [!question]- 19 Oct 2026 · Music, Media and Worship move to their own page
> - **Decided by Chris:** the homepage is for buyers; Music, Media and Worship move to `/creative/`.
> - **Decided:** the Creative menu links there; old links like `/#music` forward to it.
> - **Decided:** homepage order is problems, what I build, work with results, About, "Good to know", contact.
> - **Decided:** "Good to know" promises a clear price before any build, but no figures until Chris picks a charging model.
> - **Decided:** no client quotes until Chris has real ones; nothing made up.
> - **Why:** a business owner or trustee should see their problem, proof and a way in, without scrolling past 20 years of credits.

> [!question]- 19 Oct 2026 · Homepage sells apps, not "admin"
> - **Decided by Chris:** no "admin" wording; he builds apps, not the odd automation script.
> - **Decided by Chris:** keep "Web Developer · Manchester, UK" in the hero.
> - **Decided:** hero "I build web apps that save you hours every week."; six "What I can build for you" boxes.
> - **Decided:** About adds 16 years on enterprise systems (global IT) next to music and media.
> - **Decided by Chris:** the footer audio bar is switched off; the showreel player stays.
> - **Why:** "bookings, reminders, chasing and payments" sounded narrow and boring.

> [!question]- 19 Oct 2026 · Neuro Support Checker is pinned first on Labs
> - **Decided by Chris:** Neuro Support Checker is the first card on Labs.
> - **Decided:** `"pinned": true` in `labs/projects.json` beats "newest first"; the rest stay newest first.
> - **Decided:** five cards fit in one row on desktop, so every project shows on the first screen.
> - **Why:** it's the project Chris is proudest of; people don't scroll.

> [!question]- 19 Oct 2026 · Reposition as Operations Engineer (Agreed)
> - **Decided:** identity "Operations Engineer"; offer = custom internal tools and automated workflows (Booking Engine, Reminder Pipeline, Chasing Engine, Payment Pipeline). Banned: "web developer", "web designer".
> - **Decided:** clients own it: code in their GitHub, hosting in their Cloudflare account. No licence fees; infrastructure billed to their accounts at cost (from about £4 a month; paid tiers, not free).
> - **Decided:** support is an optional monthly plan; builds are fixed price per agreed scope.
> - **Decided:** the workflow audit is free, written only, by email, one page. No calls.
> - **Decided:** reminders list email, push and WhatsApp only (no SMS until a build uses it).
> - **Decided:** IDE-style restyle (Inter + JetBrains Mono, amber kept); music, media and worship move to `/creative/`; no LinkedIn or GitHub links; Reach Children Uganda stays as "legacy system recovery".
> - **Why:** Chris doesn't want web-design work; the value is replacing manual admin and per-seat software. Calls with strangers don't suit how Chris works.

> [!question]- 18 Oct 2026 · Homepage rebuilt tech-first (copy + UX agents)
> - **Decided:** order is Hero → What I do → Work → About → Creative beginnings → Contact.
> - **Decided:** Music, Media and Worship sit under one nav menu, **Creative**, and stay on the homepage.
> - **Decided:** nav says **Labs**, not Tech, here and on labs.chrisdemetriou.com.
> - **Decided:** public address is **hello@chrisdemetriou.com**; Representation block dropped.
> - **Decided:** support is an **optional monthly plan**; no open-ended "fix anything" promise; no "sales calls" line.
> - **Decided:** Reach Children Uganda described neutrally; "you own it" left out for now; button says "Send it over".
> - **Why:** tech is the income; music and media are the roots that make the work different.

> [!question]- 18 Oct 2026 · Tech leads the site; music and media are the roots
> - **Decided:** chrisdemetriou.com leads with tech, aimed at small businesses and charities, Manchester first, UK-wide remote.
> - **Decided:** label "Web Developer" (it gets searched); pitch is automation and admin tools.
> - **Decided:** AI stays behind the scenes: sell the outcome, name AI only where a tool really uses it.
> - **Decided:** keep the dark, warm look; copy in first person; main button "Tell me what eats your time".
> - **Why:** music and media are passion; tech is passion plus income. Old SEO said music only.
> - **Done first:** search titles, descriptions, share card and Person data updated (step 1). Copy rewrite is step 2.

> [!question]- 18 Oct 2026 · Public CV taken off the site
> - **Decided:** the CV PDF is not published; it was removed from the site and from `main`'s history.
> - **Why:** it should not be downloadable by anyone with the link.

> [!question]- 18 Oct 2026 · Genesis is described as a live app, not a demo
> - **Decided:** the Genesis card leads with "Live, running a real band with zero admin".
> - **Decided:** the button says "Try it with a demo band", so the sandbox reads as a way in, not the product.
> - **Why:** "Open the live demo" made a working production app sound like an experiment.

> [!question]- 17 Oct 2026 · Client sites keep their own address on Labs
> - **Decided:** a project built for someone else links to its real address (like reach-children-uganda.org.uk).
> - **Decided:** each project's notes stay in its own repo's PMO; this PMO only tracks Labs.
> - **Why:** the site belongs to the client; Labs just shows the work.

> [!question]- 17 Oct 2026 · Labs overview fits on one screen
> - **Decided:** the Tech page shows compact cards, like a GitHub profile; full write-ups get their own page.
> - **Decided:** filter by technology with CSS only; at most 8 filters, one row.
> - **Why:** most visitors won't scroll, so every project must be visible straight away.

> [!question]- 17 Oct 2026 · Labs lives in this repository
> - **Decided:** Labs' code, project list and notes live in fuzzy-parakeet, not in any project's repo.
> - **Decided:** every future project is added to Labs from here, wherever its own code lives.
> - **How:** each project publishes its card data (`labs.json`); Labs reads it when it builds.
> - **Why:** Labs is part of chrisdemetriou.com and shows projects from many repositories.

> [!question]- 17 Oct 2026 · This PMO is public, but not on the website
> - **Decided:** the vault is a folder in this public repository, like the Genesis PMO in its repo.
> - **Decided:** chrisdemetriou.com never publishes it (`_config.yml` leaves it out).
> - **Why:** one place for the site's notes. Nothing private is written here.

> [!question]- 17 Oct 2026 · chrisdemetriou.com keeps its own address on Labs
> - **Decided:** no `chrisdemetriou.labs.chrisdemetriou.com`. The card links to chrisdemetriou.com.
> - **Why:** the site already has its address; Labs subdomains are for apps hosted there.

> [!question]- 16 Oct 2026 · Labs looks like this site; projects open in a new window
> - **Decided:** Labs uses this site's masthead, nav bar, fonts and colours. TECH opens in the same tab.
> - **Decided:** projects are laid out like GitHub, and each opens in a new window.
> - **Why:** Labs looked isolated and unwelcoming next to chrisdemetriou.com.

> [!question]- 14 Oct 2026 · Link to YouTube, don't embed it
> - **Decided:** worship videos are linked thumbnails.
> - **Why:** embeds showed YouTube's bot check and set cookies.

> [!question]- 29 Aug 2026 · Consent before any third-party player
> - **Decided:** SoundCloud loads only after a visitor taps OK.
> - **Why:** no third-party cookies before consent.

> [!question]- 28 Aug 2026 · Retire old pages through the 404 page
> - **Decided:** every retired address goes to the home page.
> - **Why:** old links keep working without keeping old pages.

> [!question]- 4 Aug 2026 · GitHub Pages for the site, Cloudflare for apps
> - **Decided:** the static site stays on GitHub Pages.
> - **Why:** Workers hosting was tried and added work for no gain. Apps (Labs, Genesis) use Workers.

> [!question]- 10 Apr 2026 · A public playlist, not a sign-in Worker
> - **Decided:** the On Air playlist was made public instead of read through a SoundCloud sign-in.
> - **Why:** nothing secret to guard, fewer moving parts.

> [!question]- 22 Mar 2026 · Nightly backup to a private mirror
> - **Decided:** GitHub Actions mirrors this repository every night and on every push.
> - **Why:** a second copy if anything happens to this one.

> [!question]- 14 Mar 2026 · A custom player on the SoundCloud Widget API
> - **Decided:** build our own player around SoundCloud's widget, not use the stock embed.
> - **Why:** it matches the site's look, and the Widget API needs no keys.
