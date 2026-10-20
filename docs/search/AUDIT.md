# Search baseline and decisions: chrisdemetriou.com

Checked 20 Oct 2026, against the live site, the repository and current published guidance. No private data (Search Console, analytics) was available, so nothing here describes traffic, rankings or search volumes.

## 1. What the site is (verified)

| | chrisdemetriou.com | labs.chrisdemetriou.com |
|---|---|---|
| **Built with** | Hand-written HTML, CSS and JS. No framework, no build step (a generator now builds only approved records and the sitemap). | Cloudflare Worker serving pages built from `labs/projects.json` (`labs/scripts/build.mjs`). |
| **Hosting** | GitHub Pages from `main`. HTML is cached for up to 10 minutes. | Cloudflare. Strict CSP (no scripts). Released by hand with `npm run release`. |
| **Pages** | `/` (custom software), `/creative/` (music, media, worship), `/privacy/`, `/cookies/` | Overview plus 5 project pages |
| **Enquiries** | Web3Forms → hello@ (fixed and tested 20 Oct 2026) | Links back to `/#contact` |
| **Analytics** | **None.** No conversion tracking. | None |

**Positioning has moved on from the brief's starting context.** The homepage now presents Chris as a *Software Developer & Consultant* building custom software. The producer, engineer and worship musician work lives on `/creative/`. Chris described tech as "passion + income" and music and media as passion.

### Audiences and journeys (provisional priority)

1. **A business or charity with a manual process** (income). Home → proof → Labs → audit form.
2. **Someone checking music credentials** (session, production, radio, podcasts). `/creative/` → audio enquiry form.
3. **The worship audience.** `/creative/#worship` → YouTube, Instagram and TikTok.
4. **Developers and employers.** Labs.

### What Chris's work is, kept separate

| Type | Examples on the site | Status |
|---|---|---|
| Current services | Custom software, from first idea to launch (homepage) | Owner-provided |
| Historical credits | Shrek 2 (performer), Seal *Walk On By* (orchestral arranger), *King Arthur* (assistant engineer), SARM sessions | Owner-provided. One label needs checking (V1). |
| Employment | 16 years on enterprise systems | Owner-provided, 19 Oct 2026 |
| Commissioned work | "The On Air tab is commissioned broadcast work" (`/creative/`) | Needs confirming which items (V2) |
| Self-initiated | Neuro Support Checker, CDCS (labelled demo), the "everything else" in Media | Owner-provided |
| Volunteering / training | Gaydio Academy (a testimonial says Chris volunteered after a course) | **Conflicts with the "commissioned or self-initiated" wording (V2)** |
| Worship ministry | Online covers on YouTube, Instagram and TikTok | Owner-provided. Not presented as a commercial service. |

**Awards:** the homepage says *performer on an Oscar-nominated song* and *orchestral arranger on a GRAMMY-nominated single*. That's accurate: the recordings were nominated, not Chris. On `/creative/`, "⭐ Oscar Nominated" sits on the recording's row, which is also accurate.

## 2. Findings, prioritised

**Status:** ✅ fixed on this branch · 🔎 needs verification · 👤 needs Chris · ✔︎ checked, fine.

| # | Finding | Evidence | Impact | Confidence | Effort | Status |
|---|---|---|---|---|---|---|
| F1 | The homepage said Neuro Support Checker has "900 support groups… re-checked each morning". The live directory says **897 organisations, checked every 1 to 3 days**. | Live directory, read 20 Oct 2026 | High (trust) | High | Low | ✅ Fixed on the homepage, `llms.txt` and Labs' `projects.json` (Labs needs a release) |
| F2 | Every unknown URL silently redirected to the homepage, so a broken link never said it was broken. | `404.html` | Medium | High | Low | ✅ It's now a real "not found" page. Only `/media/`, `/book/` and `/enterprise/` forward, each to its nearest replacement. |
| F3 | Sitemap `lastmod` didn't track real changes, and `changefreq`/`priority` are ignored by Google. | `sitemap.xml`; Google sitemap docs | Low | High | Low | ✅ Now generated from `content/core-pages.json`, with real change dates |
| F4 | The four project screenshots had empty alt text. | `index.html` | Low | High | Low | ✅ Descriptive alt text added |
| F5 | The privacy page description still said "booking form". | `privacy/index.html` | Low | High | Low | ✅ |
| F6 | New tooling folders would have been published by GitHub Pages. | `_config.yml` | Medium | High | Low | ✅ `content/`, `publisher/` and `docs/` are excluded |
| F7 | No identity disambiguation, though several prominent people share the name (a Surrey pastor, a US doctor, a violinist "Christopher Demetriou"). | Web search, 26 Sep 2026 | Medium | Medium | Low | ✅ `disambiguatingDescription` added to Person, matching visible text |
| V1 | The *King Arthur* credit on `/creative/` is labelled **DreamWorks**. That needs checking against Chris's records. | `/creative/` Studio table | Medium (accuracy) | Medium | Low | 🔎👤 |
| V2 | `/creative/` says media work is "commissioned" or "self-initiated", but a Gaydio testimonial says Chris **volunteered** after a course. | `/creative/` Media section | Medium (honesty) | High that it needs a decision | Low | 👤 |
| V3 | "Genesis is running a real band": whose band? The public demo uses fictional data. | Homepage; genesis demo | Medium | High | Low | 👤 |
| V4 | No analytics or conversion tracking. Enquiries can only be counted in the Web3Forms dashboard. | Repo search | High for measurement | High | Low | 👤 Needs approval (it changes the privacy notice) |
| V5 | Search Console and Bing Webmaster Tools ownership, and sitemap submission, are unknown. | Not accessible from here | High | — | Low | 👤 |
| V6 | The portrait JPEG is 251 KB but is shown at 180 px. | `images/` | Low | High | Low | ✅ Homepage now uses a 34 KB portrait and a 3 KB avatar (`/creative/` still uses the original) |
| V7 | Labs has pending changes (nav, title, Neuro fix) that aren't live until it's released. | `labs/version.json` = 982e526 | Medium | High | Low | 👤 `npm run release` |
| ✔︎ | HTTPS. `http→https`, `www→apex`, `/creative→/creative/` and `demo.→labs.` are all 301s. Self-referencing canonicals on every page. No `X-Robots-Tag`. `robots.txt` allows everything and names the sitemap. `?utm_*` serves 200 with the canonical. `/index.html` duplicates `/` but its canonical points to `/` (GitHub Pages can't send a 301 there). | curl, 20 Oct 2026 | — | High | — | Fine |
| ✔︎ | All main content is in the delivered HTML, with no JavaScript needed. The forms also post without JS (Web3Forms' own thank-you page). One `h1` per page. The FAQ structured data matches the visible FAQ word for word. | Repo and live HTML | — | High | — | Fine |
| ✔︎ | Mobile and keyboard: no sideways scroll at 390 px, skip link works, focus visible, the menu works by keyboard and tap. | Playwright, 19–20 Oct 2026 | — | High | — | Fine |

### Structured data: vocabulary vs rich results

- **Valid Schema.org, not a rich-result target:** `ProfessionalService` is a LocalBusiness subtype. Without a street address it isn't eligible for Google's local business features. That's fine; it describes the service.
- **FAQPage:** Google limited FAQ rich results to government and health sites in 2023. Its update log says the feature stopped appearing on 7 May 2026. The markup is harmless and matches the page, so it stays, with no expectation of a visible result. *(Via search summary; see sources.)*
- **Person:** `sameAs` lists Labs only (Chris's choice, 19 Oct 2026). Fewer profiles means engines have less to corroborate the identity. That's a known trade-off.
- **Generated pages** use `Article` with `author` → `#person`, and `dateModified` from the record's substantive change date.

### Crawler access (unchanged, but needs a decision)

`robots.txt` allows everything and names five agents. They do different jobs:

| Agent | What it does | Source |
|---|---|---|
| GPTBot | Collects pages that may be used to **train** OpenAI models | OpenAI crawler docs |
| OAI-SearchBot | Powers **ChatGPT search** results | OpenAI crawler docs |
| ChatGPT-User | Fetches a page when a **user asks**. May not follow robots.txt. | OpenAI crawler docs |
| ClaudeBot / Claude-SearchBot / Claude-User | Training / search / user-requested fetches | Anthropic help centre |
| PerplexityBot / Perplexity-User | Search / user-requested fetches (the latter "generally ignores robots.txt") | Perplexity docs |
| Google-Extended | A robots token (not a crawler) controlling **Gemini training and grounding**. Has no effect on Google Search. | Google common crawlers docs |

👤 **Decision for Chris:** keep allowing the *training* crawlers (GPTBot, ClaudeBot, Google-Extended), or allow only search and user fetches? Search visibility doesn't depend on the training ones.

**`llms.txt`** stays as a **low-cost, unproven experiment**. Google says it isn't needed for Google Search, and no provider promises to use it.

## 3. Sources

Direct fetching of these sites is blocked in this environment. Each was read through web search summaries limited to the official domain on **20 Oct 2026**, so the wording should be confirmed against the pages.

- Google, *Spam policies* (scaled content abuse): https://developers.google.com/search/docs/essentials/spam-policies
- Google, *Using generative AI content*: https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- Google, *Creating helpful, reliable, people-first content*: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google, *AI features and your website*: https://developers.google.com/search/docs/appearance/ai-features
- Google, *Optimizing for generative AI features* (newer; says sites must be included in generative AI features in Search Console; confirm): https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google, *Search generative AI performance reports* (June 2026, rolling out to some sites): https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports
- Google, *General structured data guidelines*: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Google, *HowTo and FAQ changes* (2023) and the documentation update log (FAQ removal, 2026): https://developers.google.com/search/blog/2023/08/howto-faq-changes · https://developers.google.com/search/updates
- Google, *Build and submit a sitemap*: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Google, *Common crawlers* (Google-Extended): https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
- Bing, *Webmaster Guidelines*: https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a · *AI Performance preview* (Feb 2026): https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview
- OpenAI, *Overview of OpenAI crawlers*: https://developers.openai.com/api/docs/bots
- Anthropic, *Does Anthropic crawl data from the web…*: https://support.claude.com/en/articles/8896518
- Perplexity, *Perplexity crawlers*: https://docs.perplexity.ai/docs/resources/perplexity-crawlers

**How firm each point is:**
- **Documented requirements:** indexable, crawlable pages; structured data that matches visible content; no scaled content without value; robots and noindex behaviour; sitemap `lastmod` accuracy.
- **Reasonable hypotheses:** answer-first paragraphs and verifiable specifics are easier for answer engines to quote; consistent entity details help disambiguation.
- **Unproven:** `llms.txt`, "AI schema", content "chunking" for Google, and anything promising AI citations.
