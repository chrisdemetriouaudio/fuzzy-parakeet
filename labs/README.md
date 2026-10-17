# labs.chrisdemetriou.com — Labs (chrisdemetriou.com's TECH page)

The TECH page of chrisdemetriou.com. It wears the main site's masthead, nav bar
(TECH highlighted), fonts and colours, so it feels like one site; TECH opens it in
the same tab. Projects are laid out like GitHub repositories: name and status, the
screenshot, "built with" topic tags, an About panel (links, a languages bar counted
from the project's own code) and an architecture drawing. Every project link opens
in a new window. Apps live on their own address, `<project>.labs.chrisdemetriou.com`;
existing sites keep their real address. Labs lives in this repo; projects can be
built anywhere.

| Project | Address | Code |
|---|---|---|
| Genesis (rehearsal scheduling) | `https://genesis.labs.chrisdemetriou.com` | private repo christian4collective (`genesis-auth/`) |
| chrisdemetriou.com (music portfolio) | `https://chrisdemetriou.com` (its own address, not a Labs one) | this repo (public) |

## How it works
- `projects.json` is the only list. `npm run build` turns it into `public/index.html`
  (plain HTML, no scripts) plus `sitemap.xml` and `robots.txt` (all three generated,
  not committed).
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
