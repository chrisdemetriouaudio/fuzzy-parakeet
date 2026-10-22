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
| 3 | D1 schema + config | Not started | | | |
| 4 | Chat API | Not started | | | |
| 5 | Email (Resend) | Not started | | | |
| 6 | Portal (client + admin) | Not started | | | |
| 7 | Widget front end | Not started | | | |
| 8 | Retention cron + privacy page | Not started | | | |
| 9 | Tests + conversation evals | Not started | | | |
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
| R06 | PII scrubber misses personal data in anonymised chats | Med | Med | Regex + known-value scrub; document limits | Claude Code | Open |
| R07 | Two SPF records after adding Resend | High | Low | Not needed: Resend is already set up on send.chrisdemetriou.com with its own SPF; the apex SPF stays Zoho-only. DMARC is strict, so Resend mail must be DKIM-signed as chrisdemetriou.com (resend._domainkey exists) | Chris | Mitigated 2026-10-22 |
| R08 | Workers assets publish non-site folders (PMO, content/, labs/ source, agent notes) | High | High | Allowlist (D19); CI test; wrangler's upload list checked = 32 site files | Claude Code | Mitigated 2026-10-21 |
| R09 | New CSP breaks inline scripts or /creative/ embeds | Med | Med | Hashes rebuilt every deploy (D20); 0 violations on 5 pages locally; same headers confirmed on the preview | Claude Code | Mitigated; Chris's by-eye check pending |
| R10 | Public repo exposes the system prompt and blueprint map | Low | High | Nothing secret in them; blueprints already on the homepage | Chris | Open |
| R12 | Cutover takes the site down for a minute or two if wrangler can't take over the DNS records | Low | Med | Quiet time; rollback steps in 02-migrate.md; Pages stays on until checks pass | Chris | Open |
| R11 | Enabling R2 asks for a card | Low | Med | Charged only above the free tier (10 GB storage, 10M reads a month, free egress); showreel is 0.09 GB | Chris | Open |

### Assumptions
| ID | Assumption | Status |
|---|---|---|
| A01 | Workers AI free tier remains 10,000 neurons/day | Open |
| A02 | WebAuthn library runs on the Workers runtime | To verify in Phase 6 |
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
| I07 | Chris's Mac couldn't find preview.chrisdemetriou.com: NordVPN's DNS cached "not found" | Chris | Closed 2026-10-21: NordVPN off (or Custom DNS 1.1.1.1) during the cutover |

### Dependencies
| ID | Dependency | Owner | Status |
|---|---|---|---|
| X01 | Cloudflare account + zone for chrisdemetriou.com | Chris | Done (already in place) |
| X02 | GoDaddy nameserver change | Chris | Closed 2026-10-21: not needed (D17) |
| X03 | Resend account + domain verification | Chris | DNS records already in place (send. MX and SPF, resend._domainkey); check the domain shows Verified in Resend in Phase 5 |
| X04 | Turnstile site key | Chris | Open |
| X05 | ADMIN_EMAIL and secrets set via wrangler | Chris | Open |
| X06 | R2 bucket created and showreel uploaded | Chris | Done 2026-10-21 (bucket chrisdemetriou-media, Western Europe) |
| X07 | GitHub secrets CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID for the auto-deploy | Chris | Done 2026-10-21; test run green (tests, deploy, parity) |

---

## 4. Change log

| Date | Phase | Change | Files |
|---|---|---|---|
| 2026-10-20 | Setup | Spec and PMO created | CLAUDE_CODE_PROMPT_lead-widget-portal.md, docs/PMO.md |
| 2026-10-21 | 1 | Recon report; spec and PMO saved in docs/ (never published) | docs/lead-chat/01-recon.md, docs/lead-chat/CLAUDE_CODE_PROMPT_lead-widget-portal.md, docs/PMO.md |
| 2026-10-21 | 1 | D16 logged (showreel → R2); I01 closed | docs/PMO.md, chrisdemetriou-PMO/20 Logs/Decision Log.md |
| 2026-10-21 | 1 | D17 logged (DNS already on Cloudflare); I02, X02 closed | docs/PMO.md |
| 2026-10-22 | 2 | Cutover: Chris deleted the 5 GitHub Pages records and deployed; chrisdemetriou.com and www on the Worker; old route removed after the outage (I08); crawler policy D25 | docs/PMO.md, docs/lead-chat/02-migrate.md, vault |
| 2026-10-21 | 2 | Cutover PR prepared: routes → chrisdemetriou.com + www; AGENTS.md describes the Worker | wrangler.jsonc, AGENTS.md, docs/lead-chat/02-migrate.md, docs/PMO.md, vault |
| 2026-10-21 | 2 | Secrets added by Chris; manual Deploy site run green; Chris checked the preview by eye | — |
| 2026-10-21 | 2 | Auto-deploy on merge (D24); parity defaults to the Worker's own address; test that the workflow watches every published path | .github/workflows/deploy-site.yml, worker/parity.mjs, worker/test/site.test.mjs, docs/lead-chat/02-migrate.md, docs/PMO.md |
| 2026-10-21 | 2 | Preview deployed by Chris; parity run against it: all checks pass | — |
| 2026-10-21 | 2 | Preview moved to preview.chrisdemetriou.com; workers.dev off (D23) | wrangler.jsonc, worker/index.js, worker/parity.mjs, docs/lead-chat/02-migrate.md, docs/PMO.md |
| 2026-10-21 | 2 | Worker, allowlist, CSP, R2 video route, parity check, tests and CI; Pages excludes the new files | wrangler.jsonc, .assetsignore, worker/*, package.json, package-lock.json, .github/workflows/site-check.yml, _config.yml, .gitignore, docs/lead-chat/02-migrate.md, docs/PMO.md |
| 2026-10-21 | 1 | D18: vault phase page added and linked from the Dashboard | chrisdemetriou-PMO/10 Phases/Phase 9 — Lead chat & portal.md, chrisdemetriou-PMO/00 Start here/00 Dashboard.md, docs/PMO.md |
