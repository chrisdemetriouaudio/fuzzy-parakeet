# Phase 1: Recon (21 Oct 2026)

No code changed. Spec: [CLAUDE_CODE_PROMPT_lead-widget-portal.md](CLAUDE_CODE_PROMPT_lead-widget-portal.md). Status: [../PMO.md](../PMO.md).

## The repo

- **Plain static site.** 5 hand-written pages: `/`, `/creative/`, `/privacy/`, `/cookies/`, `404.html`.
- **No build step.** GitHub Pages runs Jekyll only to apply `_config.yml` excludes. No Liquid, no front matter.
- **Generated pages:** `/work/` and `/resources/` come from `content/records/` via `publisher/`. None published yet. `sitemap.xml` is generated too.
- **Shared assets:** `styles/display.css`, `page.css`, `player.css`, `record.css`; `scripts/display.js`, `motion.js`, `player.js`, `year.js`; `fonts/` (OpenDyslexic); `images/`.
- **Showreel:** `video/chrisdemetriou_musicREEL_FINAL2026.mp4`, **93 MB** (4 min 52 s, 1080p HEVC, 2.7 Mbit/s). Used on `/creative/`.
- **Not site files** (excluded by `_config.yml`): `labs/`, `chrisdemetriou-PMO/`, `content/`, `publisher/`, `docs/`, `AGENTS.md`, `CLAUDE.md`.
- **CI:** `content-check.yml` (publisher tests), `pmo-status.yml` (every 15 min), `backup.yml`.

## Hosting and URLs today

- `CNAME`: `chrisdemetriou.com`. Server: `GitHub.com`.
- `www` → 301 → apex.
- `/privacy` → 301 → `/privacy/` (trailing slash added).
- Unknown path → 404 with `404.html`.
- **Labs** (`labs/`) is already a Worker (`demo-hub`) with static assets, `run_worker_first`, `_headers` CSP and **Custom Domains** on `labs.` and `demo.chrisdemetriou.com`. Phase 2 can copy this pattern.

## Security headers today

- **Only HSTS** (`max-age=31556952`, set by GitHub).
- **No CSP**, no `X-Frame-Options`, no `nosniff`, no `Referrer-Policy`. GitHub Pages can't set headers; no `<meta>` CSP either.
- So "strict CSP preserved" means **create one** in Phase 2.
- **Inline code a CSP must allow:**
  - Inline `<script>`: `/` 3, `/creative/` 2, `/privacy/` 1, `/cookies/` 1, `404.html` 1 (plus JSON-LD). Needs hashes, or move to files.
  - Inline `<style>` blocks on every page; 5 `style=""` attributes on `/creative/`.
  - No inline event handlers. 
- **Third-party origins:**
  - All pages: `fonts.googleapis.com`, `fonts.gstatic.com`.
  - Forms: `api.web3forms.com` (`/` and `/creative/`).
  - `/creative/` only: YouTube (`www.youtube.com`, `i.ytimg.com`), SoundCloud widget, plus outbound links.

## The audit form (`index.html:1126`)

- `#audit-form` → `POST https://api.web3forms.com/submit` via `fetch`, JSON reply.
- Web3Forms access key sits in the page. That's by design (it only routes mail to hello@).
- Honeypot: `company_url`.
- **Fields → names:**
  - process → `message` (textarea)
  - tools → `tools`
  - frequency → `frequency` (select: Daily, Weekly, Monthly, Per client or event)
  - headcount → `people` (select: 1–2, 3–10, 11–50, More than 50)
  - name → `name`, work email → `email`, organisation → `organisation` (optional)
- Inline validator with plain-words errors; success card `#form-success` gets focus.
- **Hero CTA** (`index.html:774`): `<a class="btn" href="#contact">Request a free workflow audit</a>`. The no-JS fallback already works.
- Nav "Contact" button also links `#contact`.

## Design tokens ("Your week")

- **Fonts:** Bricolage Grotesque (headings), Atkinson Hyperlegible (body, 18px). Google Fonts.
- **Theme:** dark tokens in each page's inline `:root`. Light is the default (`data-theme="light"` on `<html>`). Light and high-contrast sets live in `styles/display.css`.
- **Tokens the widget should use:** `--bg`, `--surface`, `--surface-2`, `--border`, `--border-strong`, `--ink`, `--ink-muted`, `--accent` (tomato), `--accent-hover`, `--accent-ink`, `--edge` (chunky outline), `--shadow` (offset shadow), `--c1`–`--c4`, `--error`.
- **Display panel** (`scripts/display.js`, `localStorage` key `cd-display`): theme, text size, OpenDyslexic, spacing, contrast, reduce motion.
- **Motion:** animate only while `<html>` has class `motion`.
- **Cookie banner:** only on `/creative/` (fixed bottom, `z-index: 1200`). The launcher must not cover it.

## Risks and conflicts

1. ✅ **Hosting conflict** (settled by D16: showreel → R2). Spec D10 says migrate to Workers. The vault decision of 20 Oct 2026 says "stays on GitHub Pages", because the **93 MB showreel** is over the Workers static-asset limit (**25 MiB per file**). Phase 2 can't deploy as written.
2. ✅ **Where DNS lives.** Spec says GoDaddy. But Labs uses Workers **Custom Domains**, which need `chrisdemetriou.com` to be an active Cloudflare zone already. If so, the GoDaddy nameserver steps are already done. **Checked 21 Oct 2026:** nameservers are `arushi` and `wesley.ns.cloudflare.com`. No GoDaddy steps (D17).
3. 🟠 **Workers would publish the whole folder.** `_config.yml` excludes don't apply. Without `.assetsignore` (or a copy-to-`dist` step), the PMO, `content/`, `labs/` source and agent notes go live.
4. 🟠 **New CSP may break pages.** Hash every inline script; ship as report-only first; test `/creative/` embeds.
5. 🟡 **Two PMOs.** The spec wants `docs/PMO.md`; `AGENTS.md` says the vault is the live tracker. This build uses `docs/PMO.md`.
6. 🟡 **Public repo.** The system prompt and blueprint map will be readable on GitHub. Nothing secret in them; blueprints are already on the homepage.
7. 🟡 **Labs card format.** Labs reads `labs/projects.json`, not `labs.yml` (Phase 10).
8. 🟡 **Budget.** A cap of 70 model calls a day is roughly 5–7 full chats a day.
