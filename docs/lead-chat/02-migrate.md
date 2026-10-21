# Phase 2: Move chrisdemetriou.com to Cloudflare Workers

Status: [../PMO.md](../PMO.md). Decisions D16, D17, D19–D24.

## What changed

- **`wrangler.jsonc`**: Worker `chrisdemetriou-site`. The repo root is its assets folder. Until the cutover it serves only the preview, `https://preview.chrisdemetriou.com`. workers.dev is off (D23).
- **`.assetsignore`**: an allowlist. Only the 32 website files go live. Checked against wrangler's own upload list.
- **`worker/index.js`**: www and http → `https://chrisdemetriou.com` (301). Trailing slash → 301. Adds the security headers.
- **`worker/headers.js`**: the CSP for each page, plus HSTS, nosniff, X-Frame-Options, Referrer-Policy and Permissions-Policy.
- **`worker/build.mjs`**: hashes every inline script before each `dev` and `deploy`, so the CSP can't go stale.
- **`worker/media.js`**: serves the showreel from R2 at its old address, with seeking (byte ranges).
- **`worker/parity.mjs`**: the URL-parity check (`npm run parity -- <address>`).
- **`worker/test/`**: 8 tests. They also run in CI (`.github/workflows/site-check.yml`).
- **`_config.yml`**: keeps `worker/` and `wrangler.jsonc` off GitHub Pages.
- **The live site is unchanged.** GitHub Pages keeps serving it until the cutover.

## Checked here (21 Oct 2026, local Worker)

- ✅ **All 31 site files match the repo byte for byte.** The 404 page is checked separately.
- ✅ **15 private paths return 404:** PMO, `docs/`, `content/`, `labs/`, `worker/`, `node_modules/`, `.git/`, config files.
- ✅ **No CSP violations** on `/`, `/creative/`, `/privacy/`, `/cookies/` and the 404 page.
- ✅ **What runs under the CSP:** the audit form sends, the Display panel opens, the SoundCloud player loads, and `/#music` still forwards to `/creative/`.
- ✅ **Showreel byte ranges:** HEAD, `0-1023`, open-ended, suffix, If-None-Match → 304, stale If-Range → full file, POST → 405.

## 👉 Your steps: the preview

Run these one at a time, from your copy of the repo.

```bash
cd "/Volumes/01 PROJECTS/Claude/fuzzy-parakeet" && git pull && npm install
```

**1. Create the bucket.** EU location hint.

```bash
npx wrangler r2 bucket create chrisdemetriou-media --location weur
```

If it says R2 isn't enabled: Cloudflare dashboard → **R2** → enable it. It may ask for a card. You're only charged above the free tier. Then run the command again.

**2. Upload the showreel** (93 MB; `--remote` matters).

```bash
npx wrangler r2 object put chrisdemetriou-media/video/chrisdemetriou_musicREEL_FINAL2026.mp4 --file video/chrisdemetriou_musicREEL_FINAL2026.mp4 --content-type video/mp4 --remote
```

**3. Deploy the preview** to `https://preview.chrisdemetriou.com`. The first deploy creates that subdomain's DNS record and certificate (a minute or two). It also switches off the `workers.dev` address.

```bash
npx wrangler deploy
```

**4. Run the parity check** against that address.

```bash
npm run parity -- https://preview.chrisdemetriou.com
```

## URL-parity checklist

**Automatic** (`npm run parity`); every line should be ✅:

- [ ] Every site file matches the repo, byte for byte.
- [ ] `/creative`, `/privacy`, `/cookies`, `/index.html` → 301 to the folder address.
- [ ] Unknown address → 404 with the site's 404 page.
- [ ] 15 private files → 404.
- [ ] Security headers on `/` and `/creative/`.
- [ ] Preview hidden from search (`noindex`).
- [ ] Showreel there, seekable, answers a byte range (206).

**By eye**, on the preview address:

- [ ] **Homepage:** fonts, Display panel (Aa), dark mode, Reduce motion.
- [ ] **Audit form:** send a test. It should reach hello@.
- [ ] **`/creative/`:** the showreel plays and seeks; the CD player plays; YouTube thumbnails show.
- [ ] **Phone width:** the nav fits and the header sticks.
- [ ] **Browser console:** no red "Content Security Policy" errors.

## Known differences from GitHub Pages (all deliberate)

- **`/index.html` and `/creative/index.html`** → 301 to `/` and `/creative/`. Pages served both. Now each page has one address.
- **`/404.html`** → 301 to `/404`. Unknown addresses still get the 404 page with status 404.
- **`/CNAME`** is no longer public.
- **Pages refresh straight away.** HTML is revalidated on every visit. No more 10-minute wait after a release.
- **New security headers.** GitHub Pages could only send HSTS.

## 👉 Auto-deploy on merge (D24)

`.github/workflows/deploy-site.yml` deploys whenever a website change reaches `main`. It tests first, then deploys, then runs the parity check against the live address. Until the two secrets below exist, it does nothing and stays green.

**1. Create the token.** Cloudflare → **My Profile → API Tokens → Create Token**.
- Template: **Edit Cloudflare Workers**.
- **Account Resources:** Include → your account.
- **Zone Resources:** Include → Specific zone → `chrisdemetriou.com`.
- **Continue to summary → Create Token.** Copy it; Cloudflare shows it only once.

**2. Add two secrets on GitHub.** fuzzy-parakeet → **Settings → Secrets and variables → Actions → New repository secret**.
- `CLOUDFLARE_API_TOKEN`: the token.
- `CLOUDFLARE_ACCOUNT_ID`: the long ID in your dashboard address (`dash.cloudflare.com/<this>/...`).

**3. Test it.** GitHub → **Actions → Deploy site → Run workflow**. All steps should go green.

## 👉 Cutover checklist (later, after the preview passes)

Your DNS is already on Cloudflare (D17). So the Zoho records never move, and only the apex and `www` change.

1. **Check mail works now.** Send from Zoho to another address and reply. Both arrive?
2. **Back up the DNS.** Cloudflare → chrisdemetriou.com → **DNS → Records → Export**. Keep the file.
3. **Write down the records you must not touch:** MX (Zoho), TXT (SPF), `zmail._domainkey` (DKIM), `_dmarc` (DMARC), and `labs`, `demo` and the other Labs subdomains.
4. **Claude swaps the routes** in a small PR: `chrisdemetriou.com` and `www` in, `preview` out. **Don't merge it yet.**
5. **Deploy that PR's branch from your Mac:** `git fetch && git switch <branch> && npx wrangler deploy`. By hand, because wrangler may ask a question the auto-deploy can't answer.
   - If it asks to replace the existing DNS records for `chrisdemetriou.com` and `www`, answer **y**.
   - If it stops with an error instead, delete only the GitHub records (A `185.199.108–111.153`, AAAA `2606:50c0:8000–8003::153`, CNAME `www` → `chrisdemetriouaudio.github.io`). Then run the deploy again. The site is down for a minute or two, so do it at a quiet time.
6. **Merge the PR.** The auto-deploy runs the same thing again, then its parity check.
   **Check:** `npm run parity -- https://chrisdemetriou.com`. This also checks `www`, `http` and that Cloudflare is serving.
7. **Check mail again,** both directions. Then: `dig MX chrisdemetriou.com +short` should still show Zoho.
8. **Turn off GitHub Pages:** repo **Settings → Pages → Unpublish site**. Only after steps 6 and 7 pass.

**Rollback** (before step 8 it takes seconds; Pages is still running): Workers → `chrisdemetriou-site` → **Settings → Domains** → remove `chrisdemetriou.com` and `www`. Then re-add the GitHub records from your export.
