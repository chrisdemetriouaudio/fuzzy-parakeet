# PMO: Lead Widget + Client/Admin Portal

**Project:** lead-discovery chat widget + passkey portal for chrisdemetriou.com
**Owner:** Chris Demetriou
**Spec:** [`docs/lead-chat/CLAUDE_CODE_PROMPT_lead-widget-portal.md`](lead-chat/CLAUDE_CODE_PROMPT_lead-widget-portal.md)
**Last updated:** 2026-10-21

---

## 1. Phase tracker

| # | Phase | Status | Started | Finished | Outcome / next action |
|---|---|---|---|---|---|
| 1 | Recon | Awaiting Chris | 2026-10-21 | 2026-10-21 | Report: [lead-chat/01-recon.md](lead-chat/01-recon.md). **Chris:** answer the hosting question (I01), then run `dig NS chrisdemetriou.com +short` and paste the result (I02). |
| 2 | Migrate to Workers static assets + DNS checklist | Blocked | | | ⛔ Waiting on I01 (showreel too big for Workers) and I02 (where DNS lives). |
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

---

## 3. RAID

### Risks
| ID | Risk | Impact | Likelihood | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|
| R01 | DNS migration breaks Zoho mail | High | Med | Verify MX/SPF/DKIM/DMARC imported exactly; test mail before cutover. May already be moot (see I02) | Chris | Open |
| R02 | Free-tier neuron cap hit on busy days | Med | Med | Daily cap + form fallback; monitor usage_daily | Claude Code | Open |
| R03 | Llama breaks rules (lists services, invents prices) | Med | Med | Conversation evals in Phase 9; tune prompt | Claude Code | Open |
| R04 | Cloudflare retires the model | Low | Med | Model ID in one config constant | Claude Code | Open |
| R05 | Bot abuse / prompt injection / spam | Med | Med | Turnstile, rate limits, input caps, data-not-instructions framing | Claude Code | Open |
| R06 | PII scrubber misses personal data in anonymised chats | Med | Med | Regex + known-value scrub; document limits | Claude Code | Open |
| R07 | Two SPF records after adding Resend | High | Low | Merge into one SPF record | Chris | Open |
| R08 | Workers assets publish non-site folders (PMO, content/, labs/ source, agent notes) | High | High | `.assetsignore` or copy-to-dist; URL-parity check in Phase 2 | Claude Code | Open |
| R09 | New CSP breaks inline scripts or /creative/ embeds | Med | Med | Hash inline scripts; ship report-only first; test every page | Claude Code | Open |
| R10 | Public repo exposes the system prompt and blueprint map | Low | High | Nothing secret in them; blueprints already on the homepage | Chris | Open |

### Assumptions
| ID | Assumption | Status |
|---|---|---|
| A01 | Workers AI free tier remains 10,000 neurons/day | Open |
| A02 | WebAuthn library runs on the Workers runtime | To verify in Phase 6 |
| A03 | Site has no build step that blocks static-asset serving | Verified 2026-10-21: no build step; Jekyll only applies excludes |
| A04 | chrisdemetriou.com is already an active Cloudflare zone (Labs Custom Domains need one) | To verify by Chris (I02) |

### Issues
| ID | Issue | Owner | Status |
|---|---|---|---|
| I01 | Hosting conflict: D10 (migrate) vs. vault decision 20 Oct "stays on GitHub Pages"; 93 MB showreel > 25 MiB Workers file limit | Chris | Open: choose an option (asked in chat) |
| I02 | DNS location unclear: spec says GoDaddy; Labs Custom Domains imply a Cloudflare zone | Chris | Open: run `dig NS chrisdemetriou.com +short` |
| I03 | Live site has no CSP (GitHub Pages can't set headers), so Phase 2 creates one | Claude Code | Open: Phase 2 |
| I04 | Two PMOs: docs/PMO.md (spec) vs. chrisdemetriou-PMO vault (AGENTS.md) | Chris | Open: using docs/PMO.md for this build |
| I05 | Labs cards live in labs/projects.json, not labs.yml | Claude Code | Noted for Phase 10 |

### Dependencies
| ID | Dependency | Owner | Status |
|---|---|---|---|
| X01 | Cloudflare account + zone for chrisdemetriou.com | Chris | Open |
| X02 | GoDaddy nameserver change | Chris | Open |
| X03 | Resend account + domain verification | Chris | Open |
| X04 | Turnstile site key | Chris | Open |
| X05 | ADMIN_EMAIL and secrets set via wrangler | Chris | Open |

---

## 4. Change log

| Date | Phase | Change | Files |
|---|---|---|---|
| 2026-10-20 | Setup | Spec and PMO created | CLAUDE_CODE_PROMPT_lead-widget-portal.md, docs/PMO.md |
| 2026-10-21 | 1 | Recon report; spec and PMO saved in docs/ (never published) | docs/lead-chat/01-recon.md, docs/lead-chat/CLAUDE_CODE_PROMPT_lead-widget-portal.md, docs/PMO.md |
