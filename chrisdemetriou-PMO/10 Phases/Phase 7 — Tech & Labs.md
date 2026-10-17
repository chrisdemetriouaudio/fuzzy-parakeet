---
phase: 7
status: live
updated: 2026-10-17
---

# 🧪 Phase 7 — Tech & Labs

> [!info] At a glance
> **What:** the TECH page (labs.chrisdemetriou.com): every project I've built, wherever its code lives.
> **When:** 16 Oct 2026 onwards.
> **Status:** 🟢 Live, and the home for every new project.
> **Back to:** [[00 Dashboard]]

## 👉 To do

- [ ] **Merge the move pull requests** (website #4 and Genesis #19), then tell Claude.
- [ ] **Open this vault in Obsidian:** Open folder as vault → `fuzzy-parakeet/chrisdemetriou-PMO`.

## 🛠️ For Claude

- [ ] **Release Genesis,** so its demo publishes `labs.json` (its card data for Labs).
- [ ] **Release Labs from here** with `npm run release` in `labs/`.
- [ ] **Check chrisdemetriou.com doesn't publish** `labs/` or this vault.

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

> [!abstract]- 🧠 What this phase taught (tap to open)
> - Projects publish their own card data (`labs.json`), so Labs never needs another repo's code.
> - Labs reads every project the same way, so adding one is a single entry in `labs/projects.json`.
