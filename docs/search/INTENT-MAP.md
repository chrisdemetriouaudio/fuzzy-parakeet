# Intent-to-page map

Drawn up 20 Oct 2026. Each row is one visitor task. A page only exists if it serves a task no other page does, and the evidence to do it honestly exists. Search terms are hypotheses: no keyword tool was used.

**The test for every page:** *Would someone still find this page useful if search engines didn't exist?*

## Decisions

| Page / candidate | Audience and task | Already served by | Evidence available | Purpose and next action | Why a separate URL? | Indexable | Decision |
|---|---|---|---|---|---|---|---|
| **Homepage** `/` | A business or charity: "Can this person solve my problem, and how do I start?" | — | Live proof cards, process, FAQ | Central identity and navigation → free written audit | — | Yes | **Improve** (done: Neuro fix, alt text, disambiguation) |
| **Creative** `/creative/` | "What has Chris done in music, media and worship?" | — | Credits tables, media, worship links | Credibility; audio enquiries | — | Yes | **Improve:** settle V1 (*King Arthur* label) and V2 (volunteer vs commissioned) |
| **Case study: Reach Children Uganda** `/work/reach-children-uganda/` | Charity trustee: "Can a lost or broken site be recovered cheaply?" | Labs `/reach/` covers the *build*, not the decision | 342 / 154 numbers, method (Labs notes) | Trust → audit form | Different reader and task from Labs' technical notes | Yes, once approved | **Create, blocked:** relationship, the charity's permission, screenshot rights, Chris's own notes |
| **Case study: Neuro Support Checker** `/work/neuro-support-checker/` | Anyone running a public list: "How do I keep it accurate without checking by hand?" | Labs `/neurosupport/` (build notes) | Live counts and checking cadence | Trust → audit form | As above | Yes, once approved | **Create, blocked:** Chris's own notes (why, what's hard, results) |
| **Case study: Genesis** `/work/genesis/` | A coordinator: "How do I find dates without chasing everyone?" | Labs `/genesis/` | What it does; public demo | Trust → audit form | As above | Yes, once approved | **Create, blocked:** whose band, permission, Chris's notes |
| **Case study: CDCS** | — | Labs `/cdcs/` | A demo with no client and no outcome | — | A demo isn't a case study | — | **Reject** as a case study. Used as the worked example below. |
| **Resource: worked example of the free audit** `/resources/workflow-audit-example/` | A business owner: "What will I actually get if I ask?" | Homepage only says "a one-page map" | Audit decisions (Decision Log), CDCS build notes | Lowers the risk of asking → audit form | A full example doesn't fit on the homepage | Yes, once approved | **Create:** drafted; waits on one confirmation (the map format) and Chris's approval |
| One page per blueprint (booking system, reminders, chasing, payments, portal, records) | "Can you build me a booking system?" | Homepage blueprint cards | One proof each, no separate depth yet | — | Today they would be the same page with the tool name swapped | — | **Reject for now.** Revisit a blueprint once it has its own approved case study. |
| Service: podcast editing and production | "Who can edit my podcast?" | `/creative/` media table | Gaydio Academy, That'll Be The Tism, testimonials | Paid work, if offered | Only if it's a current service with deliverables | — | **Defer:** is it offered now? On what terms? Was the Gaydio work volunteering? |
| Service: radio imaging and sonic branding | "Who can make our station or podcast imaging?" | `/creative/` | One podcast package, Gaydio imaging | As above | As above | — | **Defer** (same questions) |
| Service: session performance and arrangement | "Can I book a session player or arranger?" | `/creative/` credits | Historical credits | As above | As above | — | **Defer:** is it offered now? |
| Service: production and engineering | "Who can produce or mix my record?" | `/creative/` | Historical credits | As above | As above | — | **Defer** |
| Music project case studies (Shrek 2, Seal, *King Arthur*) | "What did Chris do on X?" | `/creative/` credits tables | A title, a role tag and a label: no approved process notes | — | Sparse credits belong together on one page | — | **Reject.** Keep them in the combined credits. |
| Worship performance pages | "Watch Chris's cover of X" | YouTube | Covers of copyrighted songs; the page would only wrap an embed | — | A wrapper round an embed helps nobody | — | **Reject** |
| Worship practical resources | Worship teams: "How do I arrange X for a small band?" | — | None yet (needs original material Chris owns) | Ministry, not commercial | Only with original resources | — | **Defer** until Chris has original material |
| Location pages (Manchester, Salford, Leeds…) | "Software developer near me" | Homepage ("based in Manchester, working UK-wide") | No local proposition beyond being based in Manchester | — | Would be city-swapped copies | — | **Reject** |
| Labs project pages | Developers and curious buyers: "How is it built?" | — | Architecture, stack, live links | Depth, credibility | Already distinct | Yes | **Keep.** Link each to its `/work/` case study once that's published. |

## Internal linking (once pages exist)

- **Homepage proof card** → its `/work/` case study (*Read the case study*) → its Labs build notes (*How it's built*).
- **Homepage process step 1 and audit form** → `/resources/workflow-audit-example/` (*See an example audit*).
- **Each case study** → `/#contact` (the next step) and related case studies.
- **Nothing links to drafts.** The generator only knows routes of published records.
