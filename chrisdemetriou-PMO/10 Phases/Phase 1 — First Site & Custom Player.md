---
phase: 1
status: finished
updated: 2026-10-17
---

# 🎚️ Phase 1 — First Site & Custom Player

> [!info] At a glance
> **What:** the first chrisdemetriou.com, with a home-made audio player for the showreel.
> **When:** 27 Feb 2026 to 23 Mar 2026.
> **Status:** ✅ Finished. Later replaced by the roster site (Phase 5).
> **Back to:** [[00 Dashboard]]

## 👉 To do

- Nothing. This phase is finished.


## ✅ Done

> [!success]- Built 27 Feb to 23 Mar 2026 (tap to open)
> - [x] **Started the repo** and uploaded the first pages (27 Feb 2026).
> - [x] **Pointed chrisdemetriou.com at GitHub Pages** with a CNAME file (11 Mar 2026).
> - [x] **Added Open Graph tags** so shared links show a preview card.
> - [x] **Added industry logos:** PRS for Music, PPL and Bectu.
> - [x] **Built a custom player on the SoundCloud Widget API:** bottom bar, waveform, track list (14 Mar 2026).
> - [x] **Made the player fit every screen:** full bar on desktop, slim on tablet, mini on mobile.
> - [x] **Fixed audio glitches:** cached track length, stopped hidden iframes being throttled.
> - [x] **Made tracks load reliably:** retries with back-off, auto-advance to the next track (15 Mar 2026).
> - [x] **Added a nightly backup** to a private mirror repository with GitHub Actions (22 Mar 2026).

> [!abstract]- 🧠 What this phase taught (tap to open)
> - The SoundCloud Widget API needs no keys, so the player stays safe in public code.
> - Browsers slow down hidden iframes: keep the player's frame on-screen, just invisible.
> - Cache-busting (`?v=`) on CSS and JS stops visitors seeing old files after a change.
