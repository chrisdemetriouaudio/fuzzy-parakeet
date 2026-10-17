---
phase: 7
status: live
updated: 2026-10-18
---

# 🧪 Phase 7 — Tech & Labs

> [!info] At a glance
> **What:** the TECH page (labs.chrisdemetriou.com): every project I've built, wherever its code lives.
> **When:** 16 Oct 2026 onwards.
> **Status:** ✅ Live (17 Oct 2026), and the home for every new project.
> **Back to:** [[00 Dashboard]]

## 👉 To do

- Nothing right now. Add the next project with the steps below.

## ➕ Adding a new project

1. **Give it its own address:** `<name>.labs.chrisdemetriou.com` (apps), or its real address (sites).
2. **Add one entry** to `labs/projects.json`: description, topics, architecture.
3. **Add its picture** to `labs/public/img/`, or let it publish a `labs.json` with one.
4. **Release Labs:** `npm run release` in `labs/`.

## ✅ Done

> [!success]- Built 16 to 18 Oct 2026 (tap to open)
> - [x] **Added TECH to the nav bar,** between Media and Worship (16 Oct 2026).
> - [x] **Built labs.chrisdemetriou.com** as a Cloudflare Worker, first inside the Genesis repository.
> - [x] **Gave Labs this site's look:** masthead, nav bar (TECH highlighted), fonts and colours.
> - [x] **Laid projects out like GitHub:** tags, languages bar, architecture drawing.
> - [x] **Made every project open in a new window;** TECH itself opens in the same tab.
> - [x] **Made the footer year always current** on every page (16 Oct 2026).
> - [x] **Added chrisdemetriou.com itself** as the second project (17 Oct 2026).
> - [x] **Moved Labs into this repository** with its own release, tests and this PMO (17 Oct 2026).
> - [x] **Released Genesis** `341264c`, so its demo publishes `labs.json` (17 Oct 2026).
> - [x] **Released Labs** `f7795a0` from here; Genesis card shows its live build (17 Oct 2026).
> - [x] **Checked chrisdemetriou.com hides** `labs/` and this vault (17 Oct 2026).
> - [x] **Made the overview fit on one screen:** key numbers, compact cards (PR #5, 17 Oct 2026).
> - [x] **Added technology filters** that need no script (17 Oct 2026).
> - [x] **Gave each project its own page** with the full write-up (17 Oct 2026).
> - [x] **Made phone cards slim rows,** so both projects show on the first screen (17 Oct 2026).
> - [x] **Added R.E.A.CH,** the charity site rebuilt from WordPress in Astro (PR #6, 17 Oct 2026).
> - [x] **Allowed client sites' own addresses** on Labs (17 Oct 2026).
> - [x] **Showed three cards per row** on wide screens (17 Oct 2026).
> - [x] **Added CDCS Contracts** and fitted four cards per row (PR #7, 17 Oct 2026).
> - [x] **Relabelled CDCS as a Demo** with a watermarked screenshot (PR #8, 17 Oct 2026).
> - [x] **Made Labs work on phones and narrow windows** (PR #9, 17 Oct 2026).
> - [x] **Rewrote the Genesis card** as a live app running a real band (PR #11, 18 Oct 2026).

> [!abstract]- 🧠 What this phase taught (tap to open)
> - Projects publish their own card data (`labs.json`), so Labs never needs another repo's code.
> - Labs reads every project the same way, so adding one is a single entry in `labs/projects.json`.
