# Measuring usefulness, and when to expand

## Baseline (20 Oct 2026)

| Measure | Value | Source |
|---|---|---|
| Indexable URLs | chrisdemetriou.com: 4 (`/`, `/creative/`, `/privacy/`, `/cookies/`). Labs: 6. | Sitemaps |
| Enquiry form | Working: test delivered to hello@ on 20 Oct 2026 | Chris; Web3Forms dashboard |
| Enquiries to date | Unknown. Count from the Web3Forms dashboard (free plan keeps 30 days). | Web3Forms |
| Search traffic, queries, indexing | **Unknown.** Search Console and Bing Webmaster Tools access weren't available here. | — |
| Analytics | None installed | Repo |
| Generated pages | 0 published. 4 candidates, all blocked (see `DRY-RUN.md`). | `publisher` |

Nothing here is estimated. Fill the unknowns in from Search Console once it's connected.

## What to track, and where

| Signal | Where | Notes |
|---|---|---|
| Qualified enquiries and completed forms | Web3Forms dashboard. Log each real enquiry in the PMO (date, source page if known, fit yes or no). | The free plan only keeps 30 days, so log monthly. |
| Branded and non-branded search traffic | Search Console → Performance (Web) | AI Overviews and AI Mode traffic is included in the standard Web report. A dedicated generative-AI report is rolling out to some sites (June 2026), so check whether yours has it. **There's no clean separate report for every AI feature.** |
| Performance by page family | Search Console, filtered by page (`/work/`, `/resources/`) | |
| Indexing state and unexpected exclusions | Search Console → Pages; Bing → URL inspection | Investigate anything "crawled, not indexed" before deleting it. |
| Query overlap between pages | Search Console, per query → pages | Two pages swapping a query is a sign of duplicate intent. |
| Manual actions and security issues | Search Console | Check monthly. |
| AI referrals | Referrers in server or analytics data (none installed); Bing's *AI Performance* report (preview, Feb 2026) | Without analytics, you'll mostly see this through enquiries ("found you via ChatGPT"). Ask in the reply. |
| Content corrections and open evidence issues | `node publisher/cli.mjs dry-run`; `content/claims-inventory.md` | |

## AI answer checks (observations, not rankings)

Once a month, ask each of ChatGPT (search on), Perplexity, Gemini, Copilot and Claude (web search on) the same questions, signed out or in a fresh session. Log each answer in the PMO:

| Date | Provider and mode | Question | Did it mention Chris? | Cited URLs | Accurate? | Notes |
|---|---|---|---|---|---|---|

**Questions:**
1. Who builds custom software for small businesses in Manchester?
2. Software developer and consultant in Manchester who builds booking systems
3. Who is Chris Demetriou, the Manchester software developer?
4. Can someone build a custom tool instead of paying per-seat SaaS fees in the UK?
5. How can a charity recover a lost website from the Wayback Machine?
6. Is there a UK directory of neurodiversity support groups that's kept up to date?
7. What credits does Chris Demetriou have in music? *(checks accuracy, especially award wording)*

Answers vary by session, location and time. Treat them as observations, never as proof that a change caused anything. Don't scrape search engines.

## 30 / 60 / 90 days

- **Day 30:**
  - Search Console and Bing verified, with the sitemap submitted.
  - V1–V3 settled.
  - Intake done for at least one case study.
  - Baseline queries and impressions recorded.
- **Day 60:**
  - First one to three approved pages live.
  - Indexing state checked.
  - Query overlap with the homepage checked.
  - One AI-answer log round done.
  - First enquiry review: where did they come from, and were they a fit?
- **Day 90:**
  - Decide whether to add a page family (for example a service page). Only expand if every one of these holds: there's new source material, the gates are working, there are no technical regressions, and there's reason to think the pages help someone.

**Never expand just because a date has arrived.** A lack of early traffic isn't proof of low quality: check indexing and intent first.

**Pause** if you see:
- factual errors across several pages
- duplicate intent between pages
- accidental indexing
- technical regressions

Fix the cause. Then choose to improve, consolidate, `noindex`, redirect to a genuinely equivalent page, or retire.

## Maintenance (about 20 minutes a month)

1. `node publisher/cli.mjs dry-run`: look at flags and review dates.
2. Re-check facts that move: Neuro Support Checker counts and cadence, the Genesis status, `/creative/` credits.
3. Search Console: manual actions, security, Pages report, top queries.
4. Log enquiries and the AI-answer round in the PMO.
5. After any homepage copy change, update `content/core-pages.json` → `lastmod`, then run `build`.
