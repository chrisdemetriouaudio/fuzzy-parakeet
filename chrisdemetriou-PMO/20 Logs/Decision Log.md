---
title: Decision Log
updated: 2026-10-18
---

# 🧠 Decision Log

> [!info] At a glance
> **What:** what we decided, and why. One box per decision, newest first.
> **Back to:** [[00 Dashboard]]

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
