# 🧭 CEO agent: design (phase 1)

> **At a glance**
> **What:** one agent Chris talks to. It reads an idea, picks a pipeline, hands each step to a department agent through a shared job board, and shows one dashboard.
> **Phase 1:** six departments on (Sales, Copy, Engineering, QA, DevOps, Finance). One pipeline: **Fix-it ticket**.
> **Where it runs:** this Mac only. Nothing is deployed, sent, signed or paid.
> **Written:** 18 Oct 2026

## 🗺️ How it fits together

```
 Chris ──► Dashboard (Worker) ──► CEO router ──► picks a pipeline
                │                                    │
                │                        creates the job on the board (D1)
                │                                    │
                │                         JobRunner (one Durable Object per job)
                │                      runs step 1 ► step 2 ► step 3 ► step 4
                │                         │ each step = one department agent
                │                         ▼
                │            result checked by the gates (gates.ts)
                │              ├─ fine, nothing outward   → next step
                │              ├─ asks to send/deploy/... → 👉 Needs you
                │              └─ blocker or bad answer   → 🔴 Needs you
                ▼
     Needs you · In progress · Done (folded)
```

**Fix-it ticket:** 🤝 Sales intake and quote → 🛠️ Engineering finds the cause and plans the fix → 🔍 QA checks it → 💷 Finance drafts the invoice.

- **Gate 1:** Sales's quote reply waits for Chris.
- **Gate 2:** Finance's invoice waits for Chris.
- **QA fail:** the job stops; "Send back" re-runs Engineering, then QA.

## 📋 The job board (D1)

Four tables. Full SQL: [`migrations/0001_job_board.sql`](migrations/0001_job_board.sql).

| Table | One row per | Key fields |
|---|---|---|
| `jobs` | job | `pipeline`, `title`, `input` (client + text), `status`: running · needs_you · done · stopped |
| `steps` | step of a job | `position`, `department`, `status`: pending · running · needs_you · done · blocked · failed · stopped, `attempts`, `note` |
| `outputs` | thing a step produced | `kind`: result · carried_out, `body` (JSON), `attempt`. Append-only: a retry adds rows, never overwrites |
| `approvals` | outward ask | `kind`: send · deploy · sign · spend, `summary`, `detail`, `decision`: waiting · yes · no |

- **The board is the source of truth** for the dashboard.
- **Outputs are never edited.** You can always see what each try said.

## ⚙️ One Durable Object per job

`JobRunner` ([`src/job-runner.ts`](src/job-runner.ts)) is the only thing that changes a job after it is created.

- **One writer per job.** A double click, or a click while a step is running, can't run a step twice.
- **Steps run on alarms.** The page answers at once; the runner works in the background.
- **It stops itself** whenever a step needs Chris. Nothing runs past a gate.
- **Errors never retry on their own.** They become a 🔴 card with "Try again" and "Stop the job".
- **Chris's answers go to the runner:** `decide()` (yes/no), `retry()`, `stop()`.

## 🤝 Department agents

Each department has its own folder: `agents/<role>/agent.ts`. Each one sets:

| Setting | What it is | Example (Finance) |
|---|---|---|
| `instructions` | its system prompt: who it is, its job, its rules | "Never invent or change a price." |
| `effort` | how hard Claude thinks | `low` |
| `tools` | what it may use (written down now, wired later) | read the job board, read the price list |
| `mayPropose` | the only outward kinds it may ask for | `["send"]` |
| `outputSchema` | the JSON it must return | summary, actions, blocker, lines, dueInDays |
| `offline()` | stand-in answer with no API key | a draft invoice |

**Phase 1:** each step is one Claude call with structured outputs (Claude API, `claude-opus-5-5`, safety fallback on). The department reads the job board and returns JSON. No tools run.

**Why not the Claude Agent SDK or Managed Agents yet?**

- **The Agent SDK** needs a filesystem and shell. A Worker has neither. It fits later on this Mac or in a Cloudflare Sandbox.
- **Managed Agents** gives each session its own sandbox, stored credentials (vaults) and an "always ask" permission policy for chosen tools. It fits **Engineering and QA in phase 2**, when they need to read a client's code and run checks.
- **Plain Claude calls** are enough for intake, quotes and invoices, and are cheapest.

| Department | Phase 1 job | May ask for | Phase 2 move |
|---|---|---|---|
| 🤝 Sales | intake, fit check, quote reply | send | lead lists, proposals |
| ✍️ Copy | replies, web pages, case studies | send | case studies from finished jobs |
| 🛠️ Engineering | cause + fix plan | nothing | Managed Agents sandbox with repo access |
| 🔍 QA | checks the plan, pass/fail | nothing | runs real checks on a preview |
| 🚀 DevOps | deploy plan | deploy | runs `npm run release` after Chris's yes |
| 💷 Finance | invoice draft | send | draft in the accounts app, overdue chasing |

## 🚦 Approval gates

**The rule:** a department never does anything outward-facing itself. It can only **ask**. Every ask waits for Chris.

Four outward kinds: **send**, **deploy**, **sign**, **spend**.

Where it's enforced ([`src/gates.ts`](src/gates.ts)):

1. **The schema** only allows those four kinds in `actions`.
2. **`reviewResult()`** fails the step if a department asks for a kind outside its `mayPropose`. Engineering asking to deploy is a 🔴, not a deploy.
3. **The runner** stops at any ask and writes it to `approvals`.
4. **`carryOut()`** is wired to nothing in phase 1. A yes only records "do this by hand".
5. **The dashboard** only answers on localhost, and refuses button presses from other sites.

**One no stops the job.** All yes moves it on.

**Phase 2 wiring, one kind at a time:**

- **send** → a Gmail draft (still Chris presses Send) or Cloudflare Email.
- **deploy** → DevOps runs the project's own `npm run release`.
- **sign** → a DocuSign draft envelope.
- **spend** → never automatic. Always by hand.

## 📊 The dashboard

Same shape as the PMO pages ([`src/dashboard.ts`](src/dashboard.ts)):

- **At a glance:** how many need you, in progress, done. Offline or live.
- **👉 Needs you:** each ask with "Read it first", **Yes** and **No, stop the job**. Each 🔴 with **Send back** / **Try again** and **Stop the job**.
- **⏳ In progress:** each job with its steps: "2 of 4: 🛠️ Engineering · Working".
- **🗣️ Tell the CEO:** who it's for, what they need, **Start**.
- **✅ Done:** folded. Finished and stopped jobs.

Each job has its own page with every step's answer, every ask and what Chris decided.

## 🧰 Installed skills that can serve as departments

These are the **small-business** plugin skills already installed in Claude. They run inside Claude (desktop or Code) with their connectors.

| Skill | Department | How it helps |
|---|---|---|
| `lead-finder` | 🤝 Sales | ranked prospect lists of small firms and charities |
| `proposal-builder` | 🤝 Sales + ✍️ Copy | costed proposals for **Build** and **Care plan** |
| `contract-review` | ⚖️ Legal (later) | plain-English risk check before Chris signs |
| `invoice-chase` | 💷 Finance | overdue reminders, tone matched to the client |
| `seo-ai-visibility` | 🔎 SEO + 🤖 AEO/GEO (later) | search and AI-answer audits for client sites |
| `smb-router` | 🧭 CEO (pattern) | the "front door" idea the CEO router copies |

**How they plug in later:**

- **Now:** Chris runs the skill in Claude and pastes the result into "Tell the CEO".
- **Phase 2:** upload the ones we're allowed to as Agent Skills on a Managed Agent. Check each skill's licence first.

## 🚧 Phase 1 limits

- **Local only.** No routes, no `workers.dev`, and `npm run deploy` refuses.
- **One pipeline.** The CEO says "no pipeline fits yet" for anything else.
- **No tools run.** Departments only read the job board.
- **No login.** Fine on localhost. Cloudflare Access goes in front before it ever goes online.
- **Offline by default.** With no `ANTHROPIC_API_KEY`, stand-in answers keep it free.

## ➡️ Phase 2 (suggested order)

1. **Run a real ticket live** with an API key, and tune each department's instructions.
2. **Wire "send" to Gmail drafts.** Chris still presses Send.
3. **Move Engineering and QA to Managed Agents** with repo access in a sandbox.
4. **Add the Build pipeline:** Sales → proposal-builder → Copy → Engineering → QA → DevOps → Finance.
5. **Put Cloudflare Access in front** and deploy it on its own address.
6. **Switch on the next departments:** Legal, SEO, Support.

## ▶️ Run it

```bash
cd agents/ceo
npm install
npm run dev          # http://127.0.0.1:8797
npm run smoke        # in a second terminal: two tickets end to end
npm run check        # typecheck, unit tests, deploy dry-run (nothing deployed)
```

Live Claude: copy `.dev.vars.example` to `.dev.vars` and add `ANTHROPIC_API_KEY` (and `FIXIT_PRICE`). Each step then costs a Claude call.

Try the paths offline:

- **Happy path:** any problem.
- **QA fails once:** put `#fail-qa` in the ticket.
- **Not a Fix-it:** put `#not-fixit` or "whole new site" in the ticket.
