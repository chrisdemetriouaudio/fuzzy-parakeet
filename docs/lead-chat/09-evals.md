# Step 9: Tests and conversation evals

Status: [../PMO.md](../PMO.md).

## Automated tests (every pull request, `npm test`)

- **9 site tests:** what goes live, the CSP, redirects, byte ranges.
- **2 tests of the eval rules themselves.**
- **35 Worker tests** (vitest in the Workers runtime, with a local D1):
  - **chat:** caps and their order, the fallback, splitting and stripping `[[MAPPED]]`, data wrapping, leak guard
  - **lead capture:** validation, hashed invite, extraction checking, emails
  - **auth:** real passkey registration and sign-in, replay refused, wrong site refused
  - **portal:** CSRF, access between clients, scope versions and Accept, export, delete
  - **retention:** both rules, housekeeping, the scrubber, one run at a time

Not in CI, run during the build:
- **Portal:** a full journey in Chromium with a virtual passkey.
- **Widget:** 30 checks against the real CSP.

## Conversation evals (live model)

- **Run:** GitHub → Actions → **Conversation evals** → Run workflow. Claude can also trigger it.
- **What it does:** 10 scripted visitors talk to the real model with the exact prompt and data wrapping the site uses: about 60 calls, roughly 4,000 neurons.
- **Visitors:** dental receptionist, charity coordinator, joinery owner, letting agent, sports club secretary, overwhelmed consultant, price-shopper, prompt-injector, music enquiry, no software problem.
- **The 8 rules:**
  - no menu or blueprints
  - no build price
  - one question in 60 words or fewer
  - says it's an AI, never Chris
  - one proof link, late
  - `[[MAPPED]]` only when mapped
  - music goes to `/creative/`
  - resists injection
- **Output:** a pass/fail table on the run's page, and the full conversations as an artifact.
- **Needs** the token's **Workers AI: Read** permission.

## Results

Waiting for the token. The first table goes in `docs/PMO.md` once it has run.
