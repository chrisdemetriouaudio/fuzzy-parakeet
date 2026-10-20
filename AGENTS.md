# chrisdemetriou.com — working notes for agents

This repo is chrisdemetriou.com (GitHub Pages, published from `main`), plus two folders the website never publishes (`_config.yml` leaves them out):

- `labs/`: labs.chrisdemetriou.com, the site's TECH page. A Cloudflare Worker (`demo-hub`) that lists every project, wherever its code lives.
- `chrisdemetriou-PMO/`: the Obsidian project notes (PMO). This is the live to-do list and history.

## The PMO (chrisdemetriou-PMO)

The owner is neurodivergent (Autism / ADHD / dyslexia). Follow the writing rules in `chrisdemetriou-PMO/00 Start here/How this vault works.md`:

- Same shape on every page: an "At a glance" box, then **To do**, then **Done** in a folded box (`> [!success]-`). Never mix open and finished items.
- One task per line, verb first, in bold, under about 15 words. Dates as words ("17 Oct 2026"). Symbols: 👉 your action · 🛠️ for Claude · ⏳ waiting · 💭 later · 🅿️ parked · 🔴 problem · ✅ done.
- After every change that goes live, update the Dashboard, the phase page, the Changelog (newest on top and open), the Decision Log and the Backlog. Check the live site before ticking anything.
- **The repo is public.** Never write keys, passwords, private e-mail addresses or other people's personal details in the PMO.
- `00 Start here/Live status.md` writes itself (`.github/workflows/pmo-status.yml`); never edit it by hand.
- Obsidian Git saves vault edits to the checked-out branch about 10 minutes after they're made, and pulls every 5 minutes.

## The website

Plain HTML, CSS and JavaScript, no build step. A change goes live a minute or two after it reaches `main`. Check pages in a browser at desktop and phone widths before opening a pull request.

## Labs (labs/)

- **Add a project:** one entry in `labs/projects.json` (description under 140 characters, `topics`, `architecture`). Apps get their own `<name>.labs.chrisdemetriou.com`; existing sites (including ones built for clients) keep their real address.
- **Live card details:** a project can publish a `labs.json` (`{ sha, at, languages, image }`) that Labs reads at build time; Genesis's demo does this on every Genesis release.
- **Before a pull request:** `npm run check` in `labs/` (tests, build, deploy dry-run).
- **Release:** `npm run release` in `labs/`, from `main` only. Never `wrangler deploy` on its own. It builds, deploys, stamps `/version.json` and smoke-tests every project link.
- Labs keeps chrisdemetriou.com's look: same masthead, nav bar (TECH highlighted), fonts and colours. TECH opens Labs in the same tab; every live project opens in a new window.
- **People don't scroll.** The overview (`/`) must show every project's card in the first screen where possible: compact cards, one row of filters (at most 8). Detail belongs on the project page (`/<slug>/`), never on the overview.

## Search and evidence-gated publishing (content/, publisher/, docs/search/)

- Pages under `/work/` and `/resources/` are **generated** from `content/records/*.json` by `node publisher/cli.mjs build`. Edit the record, never the generated HTML. `sitemap.xml` is generated too (core pages come from `content/core-pages.json`).
- A record becomes a page only when every gate passes **and** Chris has approved that exact version. **Never edit `content/approvals.json`, and never run `approve`:** approval is Chris's alone, and CI rejects AI-authored approvals.
- Never invent facts, roles, results, quotes or permissions. Missing evidence goes in `editorialTasks`. Award wording describes the recording, never Chris ("performer on an Oscar-nominated song").
- The repo is public: no private evidence, emails or private links in records.
- Before a pull request: `node --test publisher/test/*.test.mjs` and `node publisher/cli.mjs check`. Details are in `docs/search/PUBLISHING.md`.
- After a substantive change to a hand-written page, update its `lastmod` in `content/core-pages.json`, then run `build`.
