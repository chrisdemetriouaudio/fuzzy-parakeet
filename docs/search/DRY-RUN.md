# Publishing dry run

Generated 2026-10-20 by `node publisher/cli.mjs dry-run`. Nothing was published.

| Record | Status | Decision | Route |
|---|---|---|---|
| `case-genesis` | evidence-needed | **not published** | `/work/genesis/` |
| `case-neuro-support-checker` | evidence-needed | **not published** | `/work/neuro-support-checker/` |
| `case-reach-children-uganda` | evidence-needed | **not published** | `/work/reach-children-uganda/` |
| `resource-workflow-audit-example` | draft | **not published** | `/resources/workflow-audit-example/` |

## case-genesis

- **Decision:** not published
- **Why not:**
  - evidence: claim c-live is awaiting-confirmation
  - honesty: the working relationship (commissioned, volunteer…) is unknown
  - honesty: role is awaiting-confirmation
  - original: needs Chris's own notes (intake answers), confirmed by him
  - approval: none yet (Chris reads the preview, then runs approve)
- **Editorial tasks:**
  - Chris: whose band runs on Genesis, and what's your relationship to it (your own band, commissioned, a favour)? Can it be named?
  - Chris: intake answers: how rehearsals were arranged before, what was hardest to build, and what changed afterwards.
  - Chris: is the screenshot from the demo (fictional data) or the real band? Real band data needs the band's permission.

## case-neuro-support-checker

- **Decision:** not published
- **Why not:**
  - original: needs Chris's own notes (intake answers), confirmed by him
  - approval: none yet (Chris reads the preview, then runs approve)
- **Editorial tasks:**
  - Chris: intake answers: why you built it, what the checks look for, what was hardest, and what you'd do differently.
  - Chris: anything that has happened because of it (feedback from families or organisations, corrections it caught), with permission to quote.
  - Chris: confirm 'designed and built the directory and its checking' is exactly your role.

## case-reach-children-uganda

- **Decision:** not published
- **Why not:**
  - honesty: the working relationship (commissioned, volunteer…) is unknown
  - honesty: role is awaiting-confirmation
  - media: media 1: rights "unknown" not cleared
  - original: needs Chris's own notes (intake answers), confirmed by him
  - approval: none yet (Chris reads the preview, then runs approve)
- **Editorial tasks:**
  - Chris: was this commissioned, done as a volunteer, or a favour? (role.relationship)
  - Chris: does the charity agree to being named in a case study, and to the screenshot being used?
  - Chris: intake answers: what the brief was, what was hardest, why static rather than another WordPress host, and anything that happened afterwards (e.g. hosting cost before and after).
  - Decide whether this page should exist alongside the Labs build notes, or replace the Reach section on Labs.

## resource-workflow-audit-example

- **Decision:** not published
- **Why not:**
  - evidence: claim a-format is awaiting-confirmation
  - approval: none yet (Chris reads the preview, then runs approve)
- **Editorial tasks:**
  - Chris: confirm or correct what your one-page map contains (claim a-format).
  - Chris: read the preview and approve it (node publisher/cli.mjs approve resource-workflow-audit-example).


## Rejection behaviour (tests in `publisher/test/`)

Fixture records built to fail (or pass) on purpose. Run `node --test publisher/test/*.test.mjs`:

- ✅ a legitimate, well-supported case study passes and is published, indexable and in the sitemap
- ✅ rejects a city swapped into an otherwise identical page
- ✅ rejects a credit padded with invented behind-the-scenes detail
- ✅ rejects a page that makes Chris an award nominee
- ✅ rejects a media page that is only an embed
- ✅ rejects two pages for the same task, even when worded differently
- ✅ an unapproved page can never reach the sitemap
- ✅ editing a published record after approval voids the approval
- ✅ an AI can't be the reviewer
- ✅ a failed rubric item blocks publication whatever the other scores
- ✅ unsafe slugs, switched-off families and hand-written folders are refused
- ✅ a family can't grow past its cap
- ✅ placeholders, private links and stray contact details block publication
- ✅ a published noindex page is built with noindex and kept out of the sitemap
- ✅ retiring a page with a redirect writes a noindex stub and drops it from the sitemap
- ✅ preview pages are always noindex and never canonical
- ✅ the repository's own records: nothing is published until Chris approves, and the sitemap lists only real pages
