---
phase: 7
status: live
updated: 2026-10-17
---

# 🧪 Phase 7 — Tech & Labs

> [!info] At a glance
> **What:** the TECH page (labs.chrisdemetriou.com): every project I've built, wherever its code lives.
> **When:** 16 Oct 2026 onwards.
> **Status:** ✅ Live (17 Oct 2026), and the home for every new project.
> **Back to:** [[00 Dashboard]]

## 👉 To do

- [ ] **Merge website pull request #5,** then tell Claude to release Labs.

## 🚧 In review (pull request #5, 17 Oct 2026)

- [ ] **Overview fits on one screen:** key numbers, one row of filters, compact cards.
- [ ] **Filter projects by technology** without any script.
- [ ] **Full write-up on each project's own page** (`/genesis/`, `/website/`).
- [ ] **Phone cards become slim rows,** so several fit on one screen.

## ➕ Adding a new project

1. **Give it its own address:** `<name>.labs.chrisdemetriou.com` (apps), or its real address (sites).
2. **Add one entry** to `labs/projects.json`: description, topics, architecture.
3. **Add its picture** to `labs/public/img/`, or let it publish a `labs.json` with one.
4. **Release Labs:** `npm run release` in `labs/`.

## ✅ Done

> [!success]- Built 16 and 17 Oct 2026 (tap to open)
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

> [!abstract]- 🧠 What this phase taught (tap to open)
> - Projects publish their own card data (`labs.json`), so Labs never needs another repo's code.
> - Labs reads every project the same way, so adding one is a single entry in `labs/projects.json`.
