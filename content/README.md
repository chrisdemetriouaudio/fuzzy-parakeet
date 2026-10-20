# Content records

The evidence library behind generated pages. **Nothing in this folder is published.** GitHub Pages excludes it, and only records that pass every gate and carry Chris's approval become pages. How it works: `docs/search/PUBLISHING.md`.

⚠️ **The repository is public.** Only put public-safe facts here. Keep private evidence (emails, contracts, client details, private links) in your own storage, and refer to it by a label such as `private:reach-email-2026-03`.

## Files

| File | What it is |
|---|---|
| `families.json` | Page families: route, on/off switch, page cap, whether Chris's own notes are required |
| `core-pages.json` | Hand-written pages: their path, purpose (`intentKey`) and last substantive change (feeds `sitemap.xml`) |
| `records/<id>.json` | One page each, from idea to retirement |
| `approvals.json` | Chris's approvals, each tied to a record version. **Only Chris edits this**, using `approve`. |
| `claims-inventory.md` | Every factual claim already on the site, with its evidence status |
| `intake-template.md` | Questions for Chris that turn a project into a case study |

## A record, field by field

| Field | Meaning |
|---|---|
| `id`, `family`, `slug`, `title` | Stable ID (matches the file name). The route is `/<family route>/<slug>/`. |
| `status` | `candidate`, `evidence-needed`, `draft`, `review-ready`, `approved`, `published`, `needs-review` or `retired` |
| `audience`, `intent.key`, `intent.primary`, `intent.related` | Who it's for. The **one task** it serves (unique across the site). The question it answers. |
| `uniqueValue` | One or two sentences on why this page should exist. Not "comprehensive" or "expert". |
| `role.summary`, `role.relationship`, `role.status` | Exactly what Chris did; `self-initiated`, `commissioned`, `volunteer`, `employment`, `training`, `worship-ministry` or `unknown`; and whether that's confirmed |
| `claims[]` | `{ id, kind, text, status, sources[] }`. The status is `owner-provided`, `independently-supported` or `awaiting-confirmation`. Each source is `{ ref, public }`. |
| `body[]` | `{ heading?, text, items?, claims[] }`. Every block cites the claims it relies on. |
| `originalNotes[]` | Chris's own words from the intake: `{ text, source: "intake:YYYY-MM-DD", status }` |
| `media[]` | `{ src, alt, rights, permissionSource, type? }`. `rights` is `owned`, `licensed`, `permission-granted` or `embed-permitted`. |
| `seo.title`, `seo.description` | 10–65 and 50–170 characters |
| `links.internal`, `links.related`, `nextAction` | Links must point at live pages. `nextAction` is the one next step. |
| `indexable` | `false` builds the page with `noindex` and leaves it out of the sitemap |
| `location`, `localEvidence` | Only for a genuine local proposition, backed by evidence |
| `author`, `draftedBy`, `substantiveModified`, `firstPublished`, `reviewBy` | Attribution and dates. `substantiveModified` becomes the sitemap `lastmod`. |
| `editorialTasks[]`, `history[]` | What's missing, and what changed and why |
| `redirectTo` | For a retired page with a genuine equivalent only |

Changing anything a reader would see changes the record's **version** and voids its approval. Workflow fields (`status`, `editorialTasks`, `history`) don't.
