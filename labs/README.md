# labs.chrisdemetriou.com — Labs (chrisdemetriou.com's TECH page)

The TECH page of chrisdemetriou.com, in the main site's masthead, nav bar (TECH
highlighted), fonts and colours; TECH opens it in the same tab. Laid out like a
GitHub profile:

- **`/` is an overview that fits on one screen**: key numbers, a row of technology
  filters (CSS only, no script) and compact "pinned" cards (thumbnail, name, two-line
  description, main language, top tags, "Open live ↗" and "How it's built →").
  On phones the cards become slim rows so several fit on one screen.
- **`/<slug>/` is each project's full write-up**, like a GitHub repository page:
  screenshot, all tags, About panel with a languages bar, architecture drawing.

Live projects open in a new window; write-ups open in the same tab. Apps live on
their own address, `<project>.labs.chrisdemetriou.com`; existing sites keep their
real address. Labs lives in this repo; projects can be built anywhere.

| Project | Address | Code |
|---|---|---|
| Genesis (rehearsal scheduling) | `https://genesis.labs.chrisdemetriou.com` | private repo christian4collective (`genesis-auth/`) |
| chrisdemetriou.com (music portfolio) | `https://chrisdemetriou.com` (its own address, not a Labs one) | this repo (public) |

## How it works
- `projects.json` is the only list. `npm run build` turns it into `public/index.html`,
  `public/<slug>/index.html`, `public/filters.css`, `sitemap.xml` and `robots.txt`
  (all generated, not committed). Plain HTML, no scripts.
- Each card's live details come from the project itself: Genesis's demo publishes
  `https://genesis.labs.chrisdemetriou.com/labs.json` (build, release date, languages,
  card picture) on every Genesis release; the website is counted from this repo.
- `src/index.js` forwards the old address `demo.chrisdemetriou.com` (301), fills in
  the footer year, and answers `/version.json` with the build it's running.
- `public/_headers` sets strict security headers.

## Commands (in this folder)
- `npm run dev`: build and preview at http://localhost:8795.
- `npm run check`: tests, build and a deploy dry-run. Run before every pull request.
- `npm run release`: from `main` only. Build, deploy, stamp `/version.json`, smoke-test.

## Adding a project
1. Give it an address: `name.labs.chrisdemetriou.com` for apps; existing sites keep theirs.
2. Add an entry to `projects.json`: description under 140 characters, `topics`,
   `architecture` (tiers of boxes; `link` names the wire into a tier). For live
   details, either `manifest` (a `labs.json` the project publishes), `source` (a
   folder in this repo) or `github` (a public repo: languages, last push and a
   "Code on GitHub" link).
3. Add its screenshot to `public/img/` (880×550 works best).
4. `npm run check`, open a pull request, then `npm run release` after it's merged.
