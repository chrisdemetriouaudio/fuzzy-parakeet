---
title: Changelog
updated: 2026-10-18
---

# 📜 Changelog

> [!info] At a glance
> **What:** everything that went live, newest first. GitHub Pages publishes each change to main within a minute or two.
> **How to read:** tap a date to open it. Only the newest is open.
> **Back to:** [[00 Dashboard]]

> [!success]+ 🚀 20 Oct 2026 · Software Developer & Consultant · live
> - **Released:** pull request #22 (`6ca2840`).
> - **Homepage:** title "Custom Software Developer & Consultant | Chris Demetriou"; headline "Custom software that solves your business problems"; subtitle "I turn business problems into custom tools and applications—from the first idea to a tested, working solution."
> - **Also:** Process follows idea → design → build and test → launch; About and FAQ in first person; structured data, share image, `llms.txt` and `/creative/` updated.
> - **Checked live:** new title, headline and `llms.txt` are served.
> - **Not yet:** Labs title and nav need a Labs release.

> [!success]- 🚀 20 Oct 2026 · Homepage rebuilt for the Operations Engineer positioning · live
> - **Released:** pull request #21 (`67e6719`). The first Pages deploy failed with a GitHub server error (500); re-run once, then live.
> - **Homepage:** "Custom internal tools that run your repetitive work for you."; six Internal Tool Blueprints; proof with screenshots; Zero Software Tax; process; About; FAQ; free written workflow audit form.
> - **Look:** Inter + JetBrains Mono, cool dark surfaces, amber kept; all text colours pass WCAG AA.
> - **SEO / AEO / GEO:** new title, description and share image; Person, ProfessionalService (6 services) and FAQPage data; `llms.txt`; AI crawlers named in `robots.txt`.
> - **Checked live:** new title, `llms.txt`, share image and FAQ data are served.
> - **Not yet:** Labs nav still shows the old items until Labs is released.

> [!success]- 🚀 19 Oct 2026 · Homepage copy in plain UK English · live
> - **Hero:** "I build tools that take the admin off your hands." (was cut off: "…take the admin off.")
> - **Whole page reviewed:** British spelling, plain words, no jargon, sentence-case headings, spaced en dashes. Text only (pull request #17, `ad8ba98`); #16 closed.
> - **Checked live:** new hero and description show; no sideways scroll on a phone.
> - **Left for Chris:** Sugababes credit details disagree between the highlight row and the full list.

> [!success]- 🚀 18 Oct 2026 · Labs nav matches the homepage · live
> - **Released:** 19 Oct 2026 by Claude (`npm run release`, build `8e5e062`), checked live: nav and the "Labs" title show, every project link answers.
> - **Corrected 19 Oct 2026:** the release on 18 Oct didn't go through (Labs stayed on the 17 Oct build, `430a150`), probably because the drive copy was behind GitHub.
> - **What changed:** Labs shows the homepage's nav: What I do · Work · About · Creative (menu) · Labs · Contact.
> - **Note:** Labs allows no scripts, so its Creative menu doesn't close on an outside tap.

> [!success]- 🚀 18 Oct 2026 · Homepage rebuilt tech-first · live
> - **Released:** website, pull requests #13 (search tags, `26d7692`) and #14 (homepage, `23b943d`).
> - **Search:** title, description and share card now say "Web Developer, Manchester · Automation for Small Businesses"; Person data added.
> - **Homepage:** hero "I build tools that take the admin off.", What I do, Work (3 projects), About, Creative beginnings, Contact.
> - **Nav:** Creative menu holds Music, Media and Worship; Tech is now Labs.
> - **Contact:** hello@chrisdemetriou.com; shorter form starting "What admin do you want gone?".
> - **Accessibility:** skip link, readable form errors, visible field edges, focus fixes, showreel as a proper dialog.
> - **Not checked live yet:** Claude can't reach the site from its cloud session.
> - **Rollback:** revert the two merge commits on main.

> [!success]- 🚀 18 Oct 2026 · Contact form order and Genesis card copy · live
> - **Released:** website (pull request #11, merged `fcb0777`) and Labs `430a150`. Smoke test passed for all four projects.
> - **Contact form:** Email address now comes straight after Name, above Organisation / Venue.
> - **Genesis card:** now says "Live, running a real band with zero admin", first, so it survives the two-line card.
> - **Genesis button:** "Try it with a demo band" (was "Open the live demo").
> - **Checked live** on chrisdemetriou.com, the Labs overview and `/genesis/`.
> - **Rollback:** `npx wrangler rollback cf67ae4a-7562-4891-b7c3-3131503a0c2f` (in `labs/`).

> [!success]- 🚀 17 Oct 2026 · CDCS card shows card payment · live
> - **Released:** Labs `81efc43` (pull request #10). Smoke test passed for all four projects.
> - **What changed:** the CDCS card mentions paying an invoice by card, adds a `stripe` tag, and adds "Invoice and pay" and "Stripe (test mode)" to its drawing.
> - **Why:** the CDCS booking system now has a test-mode Stripe payment (cdcscontracts.com pull request #4).
> - **Rollback:** `npx wrangler rollback 4bee75ff-e6a2-43cc-ba37-c409ae284b2f` (in `labs/`).

> [!success]- 🚀 17 Oct 2026 · Labs works on phones and narrow windows · live
> - **Released:** Labs `35507b1` (pull request #9). Smoke test passed for all four projects.
> - **What changed:** one card per row below 640px (two squeezed columns broke names and links); a swipeable nav line on phones; no text under 11px and thumb-sized links up to tablet width.
> - **Checked live** at 375, 560 and 1280px: no sideways scroll, nothing spills out of a card.
> - **Rollback:** `npx wrangler rollback a6321339-b6ae-45e7-a8bb-c6aaa6aaba80` (in `labs/`).

> [!success]- 🚀 17 Oct 2026 · CDCS card shows the demo · live
> - **Released:** Labs `852a5df` (pull request #8). Smoke test passed for all four projects.
> - **What changed:** new watermarked screenshot; the card is labelled Demo, so Labs shows 3 live projects and 1 demo.
> - **Rollback:** `npx wrangler rollback 0c6b2a74-c2c3-4d36-a366-d29c1b1df468` (in `labs/`).

> [!success]- 🚀 17 Oct 2026 · CDCS Contracts added to Labs · live
> - **Released:** Labs `cc64de0` (pull request #7). Smoke test passed for all four projects.
> - **Rollback:** `npx wrangler rollback 599b5958-a135-4983-8656-6dbe597eb285` (in `labs/`).
> - **What changed:** the trade-business site and its booking system are the fourth project, at `/cdcs/`.
> - **Also:** four cards per row on wide screens.
> - **Its own PMO:** `CDCS-PMO` in the cdcscontracts.com repository, now synced with the local folder.

> [!success]- 🚀 17 Oct 2026 · R.E.A.CH added to Labs · live
> - **Released:** Labs `46e24ad` (pull request #6). Smoke test passed for all three projects.
> - **Rollback:** `npx wrangler rollback 540cff34-e0b8-420e-b498-b8bf6c4423ae` (in `labs/`).
> - **What changed:** the charity site (WordPress → Astro) is the third project, at `/reach/`.
> - **Also:** client sites keep their own address; three cards per row on wide screens.
> - **Its own PMO:** `Reach-PMO` in the private reach-source repository, written up from the rescue onwards.

> [!success]- 🚀 17 Oct 2026 · Labs fits on one screen · live
> - **Released:** Labs `1b7645d` (pull request #5). Smoke test passed.
> - **What changed:** compact cards, technology filters and key numbers on the overview; a full page per project (`/genesis/`, `/website/`).
> - **Rollback:** `npx wrangler rollback cc4219cd-459d-465b-844e-b5ed05595300` (in `labs/`).

> [!success]- 🚀 17 Oct 2026 · Labs moved into this repository · live
> - **Released:** Labs `f7795a0` with `npm run release` in `labs/`. Smoke test passed: Labs, old address, Genesis, website.
> - **Rollback:** `npx wrangler rollback 18adb2fb-c9ea-42a4-856a-ad3bdfbfe33c` (in `labs/`).
> - **What changed:** Labs' code, its project list and its history moved here from the Genesis repository.
> - **Genesis's card** now reads its build, date, languages and picture from the demo's `labs.json`.
> - **New:** this PMO, with [[Live status]] that updates itself.
> - **New:** chrisdemetriou.com itself is listed on Labs.

> [!success]- 🚀 16 Oct 2026 · TECH and current footer year · live
> - **TECH in the nav bar** links to labs.chrisdemetriou.com, in the same tab.
> - **Footer year** is always the current year (home, privacy, cookies).
> - **Labs redesigned** to match this site, released from the Genesis repository.

> [!success]- 🚀 14 Oct 2026 · Media and Worship · live
> - **Media section:** SoundCloud main and footer players, broadcast credits, testimonials.
> - **Worship:** linked YouTube thumbnails instead of an embed.

> [!success]- 🚀 5 Sep 2026 · Bookings address and tabbed credits · live
> - **Bookings** go to one address. **Credits** are tabbed on small screens.

> [!success]- 🚀 28 and 29 Aug 2026 · Artist roster rebuild · live
> - **New design:** music and worship first, laid out like a roster record.
> - **Old pages retired;** every old address goes to the home page.
> - **Cookie consent,** cookie policy and a rewritten privacy notice.

> [!success]- 🚀 1 to 9 Aug 2026 · Enterprise site v2 · retired
> - **A separate enterprise version** with its own design system, privacy page and Web3Forms form.
> - **Retired** on 28 Aug 2026.

> [!success]- 🚀 4 to 28 May 2026 · Broadcast portfolio · retired
> - **Repositioned** for broadcast and campaign audio: services, case studies, search data.
> - **Contact form** replaced with contact cards (28 May 2026).

> [!success]- 🚀 26 Mar to 29 Apr 2026 · Showreel, mixer and On Air · retired
> - **Video showreel,** SSL-style mixer section, On Air playlist tab, contact form.

> [!success]- 🚀 27 Feb to 23 Mar 2026 · First site · retired
> - **First pages,** custom domain, custom SoundCloud player, nightly backup.
