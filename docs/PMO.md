# PMO: Lead Widget + Client/Admin Portal

**Project:** lead-discovery chat widget + passkey portal for chrisdemetriou.com
**Owner:** Chris Demetriou
**Spec:** [`docs/lead-chat/CLAUDE_CODE_PROMPT_lead-widget-portal.md`](lead-chat/CLAUDE_CODE_PROMPT_lead-widget-portal.md)
**Last updated:** 2026-10-22

---

## 1. Phase tracker

| # | Phase | Status | Started | Finished | Outcome / next action |
|---|---|---|---|---|---|
| 1 | Recon | Done | 2026-10-21 | 2026-10-21 | Report: [lead-chat/01-recon.md](lead-chat/01-recon.md). Hosting conflict settled by D16. |
| 2 | Migrate to Workers static assets + DNS checklist | Awaiting Chris | 2026-10-21 | | Cutover done 22 Oct: chrisdemetriou.com and www on the Worker; full parity passes on the apex (22 Oct, 15:17 UTC). **Chris:** check mail both ways, then turn off GitHub Pages. |
| 3 | D1 schema + config | Done | 2026-10-22 | 2026-10-22 | Database chrisdemetriou-leads created by Infra (Western Europe) and bound as DB; the deploy applies migrations/ before each release. |
| 4 | Chat API | Done | 2026-10-22 | 2026-10-22 | /api/chat and /api/lead live in preview (CHAT_ENABLED=preview, D28): secrets, database and model all in place. |
| 5 | Email (Resend) | Awaiting Chris | 2026-10-22 | | RESEND_API_KEY set. **Chris:** try the chat at chrisdemetriou.com/?chat=preview and finish one test lead; both emails arriving proves Resend. |
| 6 | Portal (client + admin) | Done | 2026-10-22 | 2026-10-22 | Passkey portal built ([06-portal.md](lead-chat/06-portal.md)); 28 Worker tests + full browser run with a virtual passkey; works once step 3's database and secrets exist. |
| 7 | Widget front end | Done | 2026-10-22 | 2026-10-22 | scripts/chat.js + styles/chat.css on /, privacy, cookies, 404 ([07-widget.md](lead-chat/07-widget.md)); 30 browser checks pass; hidden until CHAT_ENABLED is preview or on. |
| 8 | Retention cron + privacy page | Awaiting Chris | 2026-10-22 | | Daily job built and tested (34 Worker tests); privacy and cookie drafts in [08-privacy-draft.md](lead-chat/08-privacy-draft.md). **Chris:** approve or change the draft (4 lines marked "check"), and the hosting fix. |
| 9 | Tests + conversation evals | In progress | 2026-10-22 | | 46 automated tests in CI; Claude runs the 10-persona evals now the token has Workers AI ([09-evals.md](lead-chat/09-evals.md)). |
| 10 | Labs card (optional) | Not started | | | |

---

## 2. Decision log

| ID | Date | Decision | Why | By |
|---|---|---|---|---|
| D01 | 2026-10-20 | Pain-led conversation; blueprints hidden; one proof shown late | Avoid anchoring visitors to six options; capture the specific pain | Chris |
| D02 | 2026-10-20 | Workers AI, Llama 3.3 70B, streamed | Free tier; stays in Cloudflare; better probing than small models | Chris |
| D03 | 2026-10-20 | Daily cap + fallback to existing audit form | Stay within free tier; never lose a lead | Chris |
| D04 | 2026-10-20 | Leads emailed to hello@ and stored in D1 | Written record + queryable data | Chris |
| D05 | 2026-10-20 | One portal app, two roles: client (passkeys) + admin | Doubles as live proof of the Client Portal blueprint | Chris |
| D06 | 2026-10-20 | Contact details asked after pain is mapped ("Want this as your written audit?") | Ask feels earned; higher conversion | Chris |
| D07 | 2026-10-20 | No build prices; ask about current SaaS and time spend | Avoid invented quotes; frame value | Chris |
| D08 | 2026-10-20 | Disclosed AI assistant; Chris reads and replies personally | Honesty; matches "you deal with me" positioning | Chris |
| D09 | 2026-10-20 | Build inside the existing site repo | Single repo | Chris |
| D10 | 2026-10-20 | Migrate GitHub Pages → Cloudflare Workers static assets; DNS → Cloudflare | Backend + passkeys need own domain | Chris |
| D11 | 2026-10-20 | Resend free tier, DKIM/SPF alongside Zoho | Avoid Email Routing taking over MX | Chris |
| D12 | 2026-10-20 | Portal v1: transcript, audit, scope + Accept, status timeline | Tight v1; messaging and Stripe later | Chris |
| D13 | 2026-10-20 | Anonymised chats kept forever; personal data purged on schedule | Keep insight; UK GDPR storage limitation | Chris |
| D14 | 2026-10-20 | Floating launcher + hero CTA opens chat; form stays as fallback | Visible everywhere; no-JS safe | Chris |
| D15 | 2026-10-20 | PMO maintained in docs/PMO.md, updated every phase | Single source of truth for status | Chris |
| D31 | 2026-10-22 | No cron: the retention job is started by page views (the widget's config request), at most every 6 hours, one run at a time (job_runs table) | The account's 5 free cron triggers are all used by other Workers; this stays free and needs no secret | Claude Code (proposed) |
| D30 | 2026-10-22 | Widget asks /api/chat/config before showing; preview mode via ?chat=preview; not on /creative/ or /portal/; Web3Forms allowed in connect-src on every page (the fallback form) | Nothing visible changes until Chris switches it on; /creative/ is out of scope | Claude Code (proposed) |
| D29 | 2026-10-22 | Portal = static page (portal/) + JSON API (/api/portal/*); discoverable passkeys; "email me a sign-in link" for lost passkeys and Chris's first sign-in; admin = ADMIN_EMAIL; every scope save is a new version | No framework, strict CSP (no inline scripts), one sign-in flow for both roles | Claude Code (proposed) |
| D28 | 2026-10-22 | CHAT_ENABLED var: off (now), preview (Chris tries it), on (launch); the API answers "fallback: form" until the database, model and secrets all exist | Ship the backend dark; nothing public changes until Chris approves | Claude Code (proposed) |
| D27 | 2026-10-22 | Schema changes from the spec: chats (not sessions_chat), leads.user_id (not users.lead_id), new ip_usage and auth_challenges tables, from_stage/to_stage | Clearer names; returning clients see all their leads; per-IP cap needs a counter; single-use passkey challenges stop replays | Claude Code (proposed) |
| D26 | 2026-10-22 | Autopilot for steps 3–10: Claude merges its own PRs when tests and live parity are green, makes Cloudflare changes (D1, Turnstile, Worker secrets) through GitHub Actions with Chris's token, and runs phases back to back; stops only when blocked. Human-only steps go to Chris as one batched list. The chat stays switched off until Chris approves the privacy text and tests a passkey | Manual copy-paste was slowing the build; the deploy pipeline makes it safe. Supersedes the spec's "STOP after each phase" and "never touch secrets" (secrets are generated or copied inside Actions, never shown) | Chris |
| D25 | 2026-10-22 | Allow all crawlers, AI training ones included, as before the cutover: Cloudflare "Block AI bots" and managed robots.txt off; the repo's robots.txt is the only rule | Matches what GitHub Pages served and the site's own robots.txt; being found in AI answers (Phase 8). Answers Phase 8's crawler question | Chris |
| D24 | 2026-10-21 | A GitHub Action deploys the site on every website change to main: tests, `wrangler deploy`, then the parity check on the live address | Merge = live, as on GitHub Pages; nothing to remember; a failed check emails Chris | Chris |
| D23 | 2026-10-21 | Preview at preview.chrisdemetriou.com (Custom Domain, noindex); workers.dev off for this Worker | The account's workers.dev name (christian4collective) is shared with Genesis and isn't this brand; renaming it would break other Workers | Chris |
| D22 | 2026-10-21 | Trailing-slash redirects are 301; the asset server's 307 is rewritten | Same as GitHub Pages; search engines keep the folder address | Claude Code (proposed) |
| D21 | 2026-10-21 | HSTS max-age 1 year without includeSubDomains | Same as GitHub Pages; doesn't force HTTPS on subdomains nobody has checked | Claude Code (proposed) |
| D20 | 2026-10-21 | The Worker sets the CSP per page; inline scripts allowed by SHA-256 hashes rebuilt before every dev and deploy; styles allow inline | Strict scripts with no change to the pages; hashes can't go stale; /creative/ uses style attributes | Claude Code (proposed) |
| D19 | 2026-10-21 | The repo root is the Worker's assets folder; .assetsignore is an allowlist of the 32 site files, tested in CI against what GitHub Pages publishes | Pages' URLs stay identical; the PMO, content/ and labs/ can't go live (R08) | Claude Code (proposed) |
| D18 | 2026-10-21 | The vault gets a phase page (Phase 9 — Lead chat & portal) mirroring this tracker's status; this file keeps the detail | Chris wants the build visible in Obsidian; this file sits outside the vault | Chris |
| D17 | 2026-10-21 | Phase 2 DNS checklist drops the GoDaddy zone export and nameserver switch; cutover is one apex change inside Cloudflare | Nameservers are already Cloudflare (`arushi`, `wesley`), checked by Chris | Chris |
| D16 | 2026-10-21 | Showreel moves to an R2 bucket; the site Worker serves it at the same URL, with seeking (range requests) | 93 MB > 25 MiB Workers file limit; keeps full quality and every URL; unblocks D10. Supersedes the vault decision of 20 Oct "stays on GitHub Pages" | Chris |

---

## 3. RAID

### Risks
| ID | Risk | Impact | Likelihood | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|
| R01 | DNS migration breaks Zoho mail | High | Low | Zone is already on Cloudflare (D17), so mail records don't move; cutover touches only the apex and www; test mail after | Chris | Open |
| R02 | Free-tier neuron cap hit on busy days | Med | Med | Daily cap + form fallback; monitor usage_daily | Claude Code | Open |
| R03 | Llama breaks rules (lists services, invents prices) | Med | Med | Conversation evals in Phase 9; tune prompt | Claude Code | Open |
| R04 | Cloudflare retires the model | Low | Med | Model ID in one config constant | Claude Code | Open |
| R05 | Bot abuse / prompt injection / spam | Med | Med | Turnstile, rate limits, input caps, data-not-instructions framing | Claude Code | Open |
| R06 | PII scrubber misses personal data in anonymised chats | Med | Med | Regex + known-value scrub; limits documented in worker/privacy.js and in the privacy draft; "email privacy@ and the whole chat is deleted" | Claude Code | Mitigated |
| R07 | Two SPF records after adding Resend | High | Low | Not needed: Resend is already set up on send.chrisdemetriou.com with its own SPF; the apex SPF stays Zoho-only. DMARC is strict, so Resend mail must be DKIM-signed as chrisdemetriou.com (resend._domainkey exists) | Chris | Mitigated 2026-10-22 |
| R08 | Workers assets publish non-site folders (PMO, content/, labs/ source, agent notes) | High | High | Allowlist (D19); CI test; wrangler's upload list checked = 32 site files | Claude Code | Mitigated 2026-10-21 |
| R09 | New CSP breaks inline scripts or /creative/ embeds | Med | Med | Hashes rebuilt every deploy (D20); 0 violations on 5 pages locally; same headers confirmed on the preview | Claude Code | Mitigated; Chris's by-eye check pending |
| R10 | Public repo exposes the system prompt and blueprint map | Low | High | Nothing secret in them; blueprints already on the homepage | Chris | Open |
| R13 | Free plan's account-wide cron trigger limit is already used by other Workers, so the deploy with the retention cron fails | Med | Low | Happened 22 Oct (deploy failed at the cron step; site code and domains were already live). Fixed by D31 | Claude Code | Closed |
| R12 | Cutover takes the site down for a minute or two if wrangler can't take over the DNS records | Low | Med | Quiet time; rollback steps in 02-migrate.md; Pages stays on until checks pass | Chris | Open |
| R11 | Enabling R2 asks for a card | Low | Med | Charged only above the free tier (10 GB storage, 10M reads a month, free egress); showreel is 0.09 GB | Chris | Open |

### Assumptions
| ID | Assumption | Status |
|---|---|---|
| A01 | Workers AI free tier remains 10,000 neurons/day | Open |
| A02 | WebAuthn library runs on the Workers runtime | Verified 2026-10-22: @simplewebauthn/server 14.0.3 in workerd (tests) and wrangler dev (browser run) |
| A03 | Site has no build step that blocks static-asset serving | Verified 2026-10-21: no build step; Jekyll only applies excludes |
| A04 | chrisdemetriou.com is already an active Cloudflare zone (Labs Custom Domains need one) | Verified 2026-10-21 (I02) |

### Issues
| ID | Issue | Owner | Status |
|---|---|---|---|
| I01 | Hosting conflict: D10 (migrate) vs. vault decision 20 Oct "stays on GitHub Pages"; 93 MB showreel > 25 MiB Workers file limit | Chris | Closed 2026-10-21 by D16 |
| I02 | DNS location unclear: spec says GoDaddy; Labs Custom Domains imply a Cloudflare zone | Chris | Closed 2026-10-21: nameservers are Cloudflare (D17) |
| I03 | Live site has no CSP (GitHub Pages can't set headers), so Phase 2 creates one | Claude Code | Closed 2026-10-21: built (D20) |
| I04 | Two PMOs: docs/PMO.md (spec) vs. chrisdemetriou-PMO vault (AGENTS.md) | Chris | Closed 2026-10-21 by D18 |
| I05 | Labs cards live in labs/projects.json, not labs.yml | Claude Code | Noted for Phase 10 |
| I06 | After the move, merging to main no longer publishes the site by itself | Chris | Closed 2026-10-21 by D24 |
| I08 | Outage: the apex served an empty 404 from about 23:49 21 Oct to 11:15 22 Oct (UK). An old Workers Route chrisdemetriou.com/* (Worker chrisdemetriou-v2, Aug 2026) took over once the apex ran through Cloudflare | Chris | Closed 2026-10-22: route removed. Lesson: list the zone's Workers Routes before a cutover (added to 02-migrate.md) |
| I09 | Zone AI-bot settings now apply to the apex: GPTBot and ClaudeBot got 403, and Cloudflare prepends its own robots.txt that disallows them | Chris | Closed 2026-10-22: Training, Search and Agent set to Allow, Bot Preference Sync off; GPTBot and ClaudeBot get 200, robots.txt matches the repo |
| I10 | Claude's safety check blocks it from writing code that sets Worker secrets (SESSION_SECRET, IP_HASH_SALT, TURNSTILE_SECRET, RESEND_API_KEY) | Chris | Closed 2026-10-22: Chris set all 4 with wrangler; Infra status lists them |
| I13 | A failed D1 call made wrangler print Chris's Cloudflare login email in a public Actions log | Claude Code | Closed 2026-10-22: that log deleted; deploy and Infra now hide email addresses and run bash with pipefail |
| I12 | The live privacy notice still says the site is hosted on GitHub Pages (Cloudflare since 22 Oct) | Chris | Open: approve the fix in 08-privacy-draft.md |
| I11 | Data export leaves out blueprint_match (spec), but UK GDPR access can cover inferences | Chris | Open: keep it out or include it? |
| I07 | Chris's Mac couldn't find preview.chrisdemetriou.com: NordVPN's DNS cached "not found" | Chris | Closed 2026-10-21: NordVPN off (or Custom DNS 1.1.1.1) during the cutover |

### Dependencies
| ID | Dependency | Owner | Status |
|---|---|---|---|
| X01 | Cloudflare account + zone for chrisdemetriou.com | Chris | Done (already in place) |
| X02 | GoDaddy nameserver change | Chris | Closed 2026-10-21: not needed (D17) |
| X03 | Resend account + domain verification | Chris | DNS records already in place (send. MX and SPF, resend._domainkey); check the domain shows Verified in Resend in Phase 5 |
| X04 | Turnstile site key | Chris | Done 2026-10-22: reusing the existing "Chris Demetriou contact form" widget; TURNSTILE_SECRET set |
| X05 | ADMIN_EMAIL and secrets set via wrangler | Chris | Done 2026-10-22: ADMIN_EMAIL in wrangler.jsonc; 4 secrets set |
| X06 | R2 bucket created and showreel uploaded | Chris | Done 2026-10-21 (bucket chrisdemetriou-media, Western Europe) |
| X07 | GitHub secrets CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID for the auto-deploy | Chris | Done 2026-10-21; test run green (tests, deploy, parity) |
| X08 | Token widened (D1 Edit, Workers AI Read) and D1 database created | Chris, Claude | Done 2026-10-22: chrisdemetriou-leads (Western Europe); model check OK |

---

## 4. Change log

| Date | Phase | Change | Files |
|---|---|---|---|
| 2026-10-20 | Setup | Spec and PMO created | CLAUDE_CODE_PROMPT_lead-widget-portal.md, docs/PMO.md |
| 2026-10-21 | 1 | Recon report; spec and PMO saved in docs/ (never published) | docs/lead-chat/01-recon.md, docs/lead-chat/CLAUDE_CODE_PROMPT_lead-widget-portal.md, docs/PMO.md |
| 2026-10-21 | 1 | D16 logged (showreel → R2); I01 closed | docs/PMO.md, chrisdemetriou-PMO/20 Logs/Decision Log.md |
| 2026-10-21 | 1 | D17 logged (DNS already on Cloudflare); I02, X02 closed | docs/PMO.md |
| 2026-10-22 | 3–5 | D1 database created via Infra; DB and AI bound; chat switched to preview | wrangler.jsonc, docs/PMO.md, vault |
| 2026-10-22 | 9 | Workflow logs hide email addresses; Turnstile site key added (existing widget) | .github/workflows/deploy-site.yml, infra.yml, wrangler.jsonc, docs/lead-chat/03-04-chat-api.md |
| 2026-10-22 | 9 | Eval rules, personas, runner and workflow; retention started by traffic instead of a cron (D31); deploy applies D1 migrations once bound | evals/*, .github/workflows/evals.yml, worker/test/evals.test.mjs, migrations/0002_job_runs.sql, worker/retention.js, worker/api.js, wrangler.jsonc, deploy-site.yml, docs/lead-chat/09-evals.md |
| 2026-10-22 | 8 | Retention job (daily cron), scrubber fixes, privacy and cookie drafts | worker/retention.js, worker/privacy.js, worker/index.js, wrangler.jsonc, worker/spec/retention.spec.js, docs/lead-chat/08-privacy-draft.md |
| 2026-10-22 | 7 | Chat widget, its styles, the config endpoint; script added to 4 pages; hero button opens the chat | scripts/chat.js, styles/chat.css, worker/api.js, worker/headers.js, index.html, privacy/index.html, cookies/index.html, 404.html, docs/lead-chat/07-widget.md |
| 2026-10-22 | 6 | Portal: passkeys, client and admin views, export and delete, scrubber | portal/*, worker/portal/*, worker/privacy.js, worker/purge.js, worker/api.js, worker/spec/portal.spec.js, worker/spec/softauthn.js, .assetsignore, deploy-site.yml, docs/lead-chat/06-portal.md |
| 2026-10-22 | 3–5 | D1 schema, config, Infra workflow, /api/chat, /api/lead, Resend emails, 19 Worker tests (vitest) in CI; chat off | migrations/0001_init.sql, worker/config.js, worker/api.js, worker/chat/*, worker/lib/*, worker/email.js, worker/spec/*, vitest.config.mjs, .github/workflows/infra.yml, site-check.yml, wrangler.jsonc, docs/lead-chat/03-04-chat-api.md |
| 2026-10-22 | 2 | Cutover: Chris deleted the 5 GitHub Pages records and deployed; chrisdemetriou.com and www on the Worker; old route removed after the outage (I08); crawler policy D25 | docs/PMO.md, docs/lead-chat/02-migrate.md, vault |
| 2026-10-21 | 2 | Cutover PR prepared: routes → chrisdemetriou.com + www; AGENTS.md describes the Worker | wrangler.jsonc, AGENTS.md, docs/lead-chat/02-migrate.md, docs/PMO.md, vault |
| 2026-10-21 | 2 | Secrets added by Chris; manual Deploy site run green; Chris checked the preview by eye | — |
| 2026-10-21 | 2 | Auto-deploy on merge (D24); parity defaults to the Worker's own address; test that the workflow watches every published path | .github/workflows/deploy-site.yml, worker/parity.mjs, worker/test/site.test.mjs, docs/lead-chat/02-migrate.md, docs/PMO.md |
| 2026-10-21 | 2 | Preview deployed by Chris; parity run against it: all checks pass | — |
| 2026-10-21 | 2 | Preview moved to preview.chrisdemetriou.com; workers.dev off (D23) | wrangler.jsonc, worker/index.js, worker/parity.mjs, docs/lead-chat/02-migrate.md, docs/PMO.md |
| 2026-10-21 | 2 | Worker, allowlist, CSP, R2 video route, parity check, tests and CI; Pages excludes the new files | wrangler.jsonc, .assetsignore, worker/*, package.json, package-lock.json, .github/workflows/site-check.yml, _config.yml, .gitignore, docs/lead-chat/02-migrate.md, docs/PMO.md |
| 2026-10-21 | 1 | D18: vault phase page added and linked from the Dashboard | chrisdemetriou-PMO/10 Phases/Phase 9 — Lead chat & portal.md, chrisdemetriou-PMO/00 Start here/00 Dashboard.md, docs/PMO.md |
