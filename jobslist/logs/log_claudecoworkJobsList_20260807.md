# Work log — claudecoworkJobsList_20260807

**Run date:** 2026-08-07 (autonomous pass while you were away)
**Repo:** /Volumes/01 PROJECTS/Claude/fuzzy-parakeet · branch `main` · remote `origin` (github.com/chrisdemetriouaudio/fuzzy-parakeet)
**Authoritative CV:** docs/Chris-Demetriou-ETOM-CV.pdf (byte-identical to the strengthened ETOM CV)

## Environment limits that shaped this run (important, honest)
This sandbox **cannot**: `git commit`/`push` (it can't write to `.git`), **delete files** on the mounted folder (`unlink` is denied), **deploy** to your host, or read your Cloudflare/email **secrets**. So: everything below was done **locally in the working tree**; nothing is committed, pushed or deployed. Backend-dependent items are implemented/designed and clearly marked "awaiting deploy/secrets". **I did not and will not rewrite git history or force-push.** Final commands for you to run are at the bottom.

---

## Status by prompt section

| # | Section | Status |
|---|---------|--------|
| 1 | Initial audit | ✅ Done |
| 2 | Create redacted public CV locally | ✅ Done & verified |
| 3 | Publish redacted CV on the website | ✅ Local; ⏳ headers/live-serve need host config |
| 4 | Synchronise website copy with the CV | ✅ ETOM (root) synced; ⚠️ Media page still audio-only (recommendation) |
| 5 | ETOM & Media areas | ◑ Existing architecture retained; cross-linking/Media content = recommendation |
| 6 | Technical & on-page SEO | ✅ Root complete; Media has own metadata |
| 7 | Sitemap structure | ✅ Single clean sitemap (correct for small site) |
| 8 | Social-sharing image | ✅ Done (1200×630 Jira image + full OG/Twitter tags) |
| 9 | Repair contact form | ◑ Diagnosed + solution designed; ⏳ needs Worker deploy + secrets |
| 10 | Protect email/phone from scraping | ◑ JSON-LD email removed; full reveal-endpoint solution designed; ⏳ needs endpoint |
| 11 | LinkedIn integration | ✅ Decision made + snippet provided (first-party button); insert pending |
| 12 | Contact-ribbon decision | ✅ Decided (keep availability ribbon; no contact-detail ribbon) |
| 13 | Draft updated LinkedIn content | ✅ Done (below) |
| 14 | Testing & verification | ◑ Local checks done; build/live tests not possible here |
| 15 | Commit & push to main | ⛔ Blocked in sandbox — commands provided; PII-in-history flagged |

Legend: ✅ complete · ◑ partial · ⏳ awaiting external config · ⚠️ recommendation · ⛔ blocked

---

## 1. Audit (done)
- Static site (plain HTML/CSS/JS). No build framework; `package.json` is minimal. Cloudflare Worker (`src/site.ts`) serves assets; a Turnstile-verify Worker exists at `turnstile-siteverify-chrisdemetriou.christian4collective.workers.dev`. `CNAME` → chrisdemetriou.com.
- Public routes: `/` (ETOM), `/media/` (audio), `/enterprise/` (301-style redirect to `/`), `/v2/` (legacy copy — not linked from `/`), `404.html`.
- Images, contact form, themes, metadata, sitemap, robots, canonical, structured data all inspected (findings drove the changes below).
- Git: clean-ish; `docs/Chris-Demetriou-ETOM-CV.pdf` tracked (this is the **unredacted** CV — see §2/§15).

## 2. Redacted public CV (done & verified)
**Method:** genuine text removal — the CV was regenerated from source with the PII stripped from the header (not an overlay/rectangle).
**Removed:** phone `07375 304141`, email `techopsmgmt@chrisdemetriou.com`, precise town `Marple, Stockport`.
**Retained:** name, "Enterprise Technology Operations Management", general location "Greater Manchester, UK", website, LinkedIn, and all professional history.
**Replaced with:** `Contact: chrisdemetriou.com/contact`.
**Verification:**
- Text layer: `pdftotext` → **0** occurrences of 07375 / 304141 / techopsmgmt@ / Marple / Stockport.
- Metadata (`pdfinfo`): no PII (Title/Author only = name; Producer = ReportLab).
- Structure: 2 pages, **no** form fields, **no** attachments/annotations.
- Rendered page 1 header inspected visually — clean, no remnants, layout intact.
**Published file:** `documents/Chris-Demetriou-ETOM-CV.pdf` (~131 KB).
**Private source:** NOT added to the repo (kept only in my scratch workspace). Keep your full unredacted CV **outside** the repo. `.gitignore` now blocks `*-UNREDACTED*.pdf`, `*-PRIVATE*.pdf`, `*-source*.pdf`, `/private/`.
**⚠️ PII in Git history:** the unredacted `docs/Chris-Demetriou-ETOM-CV.pdf` **is committed**. Publishing the redacted version does **not** remove PII from earlier commits. I have **not** rewritten history. Removing it from history requires `git filter-repo`/BFG + a force-push, which needs your explicit approval (see §15). At minimum, `git rm docs/Chris-Demetriou-ETOM-CV.pdf` in this commit removes it going forward.

## 3. Publish redacted CV (local done; host config pending)
- Stored at `documents/Chris-Demetriou-ETOM-CV.pdf` (correct static-assets location).
- Nav "Chris's CV" now points there; "View CV" opens in a new tab (`rel="noopener"`), "Download CV" uses `download="Chris-Demetriou-ETOM-CV.pdf"`; a "PDF · ~130 KB" hint added.
- Old `docs/…` CV path is no longer linked from `/` (legacy `/v2/` still references an old path — v2 isn't served from `/`).
- **Not** added to the sitemap (kept the ETOM HTML page as the Google landing page, as instructed).
- ⏳ `Content-Type: application/pdf`, `X-Content-Type-Options: nosniff`, and caching headers can't be set on static hosting without host config (Cloudflare `_headers`/Worker or Pages rules) — see "External actions".

## 4. Copy vs CV (ETOM synced; Media flagged)
- Root/ETOM page was already reconciled with the CV in prior sessions (positioning, £0.5m OpEx saving, hypercare, on-prem→OCI wording, named customers/partners). Re-checked — consistent, no fabrication.
- ⚠️ **Discrepancy to resolve:** `/media/` is still purely "Audio Producer — Radio Imaging/Sonic Branding/Podcast". It does **not** yet cover GraceCast / church live-stream / media-dev that §5 asks for. Left as a recommendation (needs your content steer) rather than inventing scope.

## 5. ETOM & Media architecture (retained + recommendation)
- Kept existing URLs (`/` = ETOM, `/media/` = Media) to preserve search equity, as the prompt permits. No risky restructure to `/etom/`.
- **Recommended (not yet built):** add explicit "Enterprise Technology" vs "Media" cross-links + a one-line homepage intro to the Media area; expand `/media/` to genuinely include GraceCast/live-stream/media-dev with its own H1/description/keywords; spell out "Enterprise Technology Operations Management (ETOM)" on first use.
- Note: sitemap/structured data **cannot force** Google to show two sitelinks — that's algorithmic.

## 6. SEO (root complete)
Implemented on `/`: unique title, meta description, canonical, Open Graph (+1200×630 image, width/height/type/alt), Twitter `summary_large_image`, JSON-LD `WebSite`+`ProfilePage`+`Person` (jobTitle "Enterprise Technology Operations Manager", `knowsAbout`, `sameAs` uk.linkedin.com), `robots.txt`, sitemap, semantic HTML, alt text. `/media/` has its own title/description/canonical/OG/JSON-LD. `404.html` present. JSON-LD validated as parseable.

## 7. Sitemap (clean single sitemap)
`sitemap.xml` lists `/` (priority 1.0) and `/media/` (0.7) with `lastmod`. Site is small → one clean sitemap is correct; separate child sitemaps would be cosmetic. Only canonical indexable URLs included.

## 8. Social image (done)
`images/chris-demetriou-etom-og.jpg` — 1200×630, JPEG, focal point on the "PLATFORM MIGRATION BOARD" Jira screen with you in frame; no awkward crop. Tags added: `og:image` (absolute URL), `og:image:width/height/type/alt`, `twitter:card=summary_large_image`, `twitter:image`+alt. **Refresh caches after deploy:** LinkedIn Post Inspector, Facebook Sharing Debugger, X Card Validator (re-scrape) — and note Google/social may keep the old image cached for a while.

## 9. Contact form (diagnosed; real send designed, needs deploy)
**Why it "tells visitors to use email":** after Turnstile verification the active script (`scripts/foundation-cookie-first-visit.js`) does `window.location.href = 'mailto:techopsmgmt@…'` — it opens the visitor's mail client instead of sending server-side. (Several duplicate `foundation-*.js` backups contain the same handler.)
**To make it genuinely send (recommended, fits your Cloudflare setup):** add a Worker route (e.g. `/api/contact`) that: verifies Turnstile **server-side**, validates+sanitises name/email/message, checks a honeypot, blocks header injection, hard-codes the recipient (no arbitrary To/From), rate-limits, and sends via MailChannels (free from Workers) or Resend/SendGrid; set `Reply-To` to the validated visitor email. Client posts `fetch('/api/contact')` and shows accessible loading/success/error states; keep the `mailto:` as fallback. **Do not claim delivery works until tested end-to-end.**
**Env/config needed (no secrets in code):** `CONTACT_TO=techopsmgmt@chrisdemetriou.com`, verified sender/domain (SPF/DKIM), Turnstile secret, provider API key if not MailChannels.

## 10. Anti-scraping (partial; endpoint pending)
**Done now (safe, no breakage):** removed the raw email from the JSON-LD `Person` structured data.
**Occurrences of raw values still in the public build (reported honestly):**
- `techopsmgmt@chrisdemetriou.com` — visible `mailto:` link (index.html contact section) and the active contact script (`mailto:` fallback). These are currently the **only working contact route**, so I did **not** strip them (removing them without a working reveal endpoint would leave you with no contact path).
- `+447375304141` — `/media/` page (tel: link + JSON-LD).
**Recommended solution (designed, needs endpoint):** a same-origin Worker route (e.g. `/api/reveal?type=email|phone`) returning the value only after a deliberate click, with `Cache-Control: no-store`, rate-limiting, `X-Robots-Tag: noindex`, values held in Worker env vars (not in shipped code). Replace visible `mailto:`/`tel:` with "Reveal email"/"Reveal phone" buttons that call it, then offer mailto/tel/copy. Accurate limitation: nothing shown to a browser can be guaranteed un-scrapable; this is proportionate, not absolute.

## 11. LinkedIn integration (decision + snippet)
**Decision:** use a **first-party footer button**, not the official badge script. The badge injects a third-party script, adds layout/hydration/theme-sync complexity and a privacy hit, for little gain. A plain themed link is faster, accessible, reliable and theme-consistent. **Ready-to-add (footer):**
```html
<a class="li-button" href="https://uk.linkedin.com/in/chrisademetriou" target="_blank" rel="noopener me" aria-label="Chris Demetriou on LinkedIn (opens in a new tab)">in&nbsp;· LinkedIn ↗</a>
```
(Style with existing tokens; add `rel="me"` for identity. If you specifically want the official badge later, load its script once, async, and swap `data-theme` on theme change.)

## 12. Contact-ribbon decision
**Decision: do not add a contact-detail ribbon.** You already have an availability ribbon; a second ribbon exposing contact details would add mobile clutter, spam exposure and duplication with the contact page/footer. Keep the availability ribbon and the (to-be-hardened) contact CTA. No raw contact details in initial HTML.

## 13. Ready-to-paste LinkedIn copy
**Headline** (limit 220):
- **Recommended (151):** `Enterprise Technology Operations Manager | Technical Delivery, Operational Readiness & Cloud Migration | Enterprise SaaS | Open to permanent & contract`
- **Alt 1 (165):** `Enterprise Technology Operations Manager | 20+ yrs Enterprise SaaS | Cloud transformation, service transition & major-incident readiness | UK · permanent or contract`
- **Alt 2 (164):** `Technical Delivery & Operational Readiness Lead (Enterprise Technology Operations) | Cloud migration to OCI, enterprise change & production cutovers | Open to roles`

**About (ready to paste):**
> I'm an Enterprise Technology Operations Manager. I help enterprise organisations deliver complex technology change safely — by making dependencies, operational readiness and cross-functional coordination visible before they become delivery risks.
>
> For 16 years at E2open (formerly BluJay Solutions / Kewill) I supported the technical delivery and operational readiness of enterprise SaaS platforms used by 3,000+ global organisations, working across infrastructure, networking, databases, DevOps and applications. Highlights: migrating 80+ applications to Oracle Cloud Infrastructure (~£0.5m annual OpEx saving); coordinating a business-critical SAP transition with Capgemini for SYSCO UK; securing 3,000+ customer integrations; and leading 24/7 Priority 1 major-incident response for Tier 1 customers for ~7 years. I coordinate change and release readiness (CAB, ITIL-aligned) — complementing the change, release and project owners rather than replacing them.
>
> I'm the person who asks "what depends on this, who needs to be involved, and what must be true before we cut over?" — reducing delivery risk and getting complex change into production cleanly.
>
> Alongside this I build production software (see GraceCast & Genesis) and stay current with cloud and AI-assisted delivery — evidence I remain hands-on, not just directing.
>
> Open to permanent and contract Enterprise Technology Operations / Technical Delivery / Operational Readiness roles (UK, Greater Manchester or remote). Get in touch via chrisdemetriou.com/contact.

**Experience — Founder & Developer, GraceCast / Genesis (2024–Present):**
> Building production software solo, end-to-end. **GraceCast** — an AI-assisted console that lets one volunteer produce broadcast-quality church live-streams from a single wide-angle camera. **Genesis** — a cloud platform replacing a chaotic group chat with structured scheduling, comms and secure auth for a music team. Built with Python, a modern web/cloud stack and AI-assisted development (incl. building AI agents with Claude Code). Keeps my delivery and cloud skills current between enterprise roles.

**Experience — Senior Applications Specialist (Technical Delivery – Cloud), E2open (2008–2024):**
> Technical delivery and operational-readiness lead across enterprise cloud, migration and security programmes for SaaS platforms used by 3,000+ organisations.
> - Migrated 80+ enterprise applications to Oracle Cloud Infrastructure (OCI); coordinated change management and CAB approvals and validated release readiness before each cutover — ~£0.5m annual OpEx saving.
> - Coordinated a business-critical SAP ERP transition (customer: SYSCO UK; partner: Capgemini) with operational continuity throughout.
> - Modernised 3,000+ customer integrations (legacy HTTP/FTP → HTTPS/SFTP) and facilitated a middleware disaster-recovery (DR) site.
> - Led 24/7 Priority 1 major-incident management for Tier 1 customers for ~7 years, keeping customers and senior stakeholders informed while engineering restored service.

## 14. Testing & verification
**Verified:** redacted PDF (text + metadata + visual render); `index.html` well-formed; JSON-LD valid; OG image dimensions 1200×630; published CV is the redacted one (0 PII); metadata present in HTML.
**Not possible here:** framework build/lint/type/tests (none — static site); end-to-end contact-form send (no backend/secrets); live deploy verification; cross-device/theme visual QA beyond code inspection.

## 15. Commit & push (blocked — do this yourself)
The sandbox can't write to `.git`, and can't delete files, so **you** need to run these from your Mac. Review the diff first.
```bash
cd "/Volumes/01 PROJECTS/Claude/fuzzy-parakeet"
rm -f .git/index.lock
# publish redacted CV + remove the unredacted public copy
git rm --cached docs/Chris-Demetriou-ETOM-CV.pdf
rm -f docs/Chris-Demetriou-ETOM-CV.pdf
git add index.html .gitignore sitemap.xml \
  documents/Chris-Demetriou-ETOM-CV.pdf \
  images/chris-demetriou-etom-og.jpg
git commit -m "Publish redacted public CV; 1200x630 social image; SEO/JSON-LD hardening; remove email from structured data"
git push origin main
```
**⚠️ History:** the above stops serving the unredacted CV going forward but does **not** purge it from past commits. If you want it gone from history, that's a separate, destructive `git filter-repo`/BFG + force-push — tell me and I'll give exact steps; I won't do it without your say-so.
**Also:** delete the archived joblist's original (`jobslist/claudecoworkJobsList_20260807.md`) — I could only create the `.completed` copy, not delete the original (mount blocks deletion).

## 16. Completed vs pending
- **Completed locally (in working tree, not committed):** redacted CV + publish + nav; 1200×630 OG image + tags; JSON-LD email removed + image/sameAs fixed; `.gitignore` hardening; this log.
- **Pushed to main:** nothing (blocked).
- **Deployed:** nothing.
- **Verified in production:** nothing (can't deploy).
- **Awaiting you / third parties:** run the git commands; decide on history purge; build & deploy the contact-form Worker + reveal endpoint (Cloudflare + secrets); expand the Media area content; add the LinkedIn footer button; refresh social caches after deploy.

**No claims are made that rankings, social previews, email delivery, deployment or integrations "work" — none were verified in production.**
