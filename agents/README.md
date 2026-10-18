# 🧭 Agents

Chris's agency of AI agents. **One CEO agent** Chris talks to, and one folder per department.

- **Design:** [`ceo/DESIGN.md`](ceo/DESIGN.md)
- **Run it:** `cd ceo && npm install && npm run dev`, then open http://127.0.0.1:8797
- **Phase 1:** runs on this Mac only. Nothing is deployed, sent, signed or paid.

| Folder | Department | Phase 1 |
|---|---|---|
| [`ceo/`](ceo/) | 🧭 CEO: router, job board, dashboard | ✅ on |
| [`sales/`](sales/agent.ts) | 🤝 Sales | ✅ on |
| [`copy/`](copy/agent.ts) | ✍️ Copy | ✅ on |
| [`engineering/`](engineering/agent.ts) | 🛠️ Engineering | ✅ on |
| [`qa/`](qa/agent.ts) | 🔍 QA | ✅ on |
| [`devops/`](devops/agent.ts) | 🚀 DevOps | ✅ on |
| [`finance/`](finance/agent.ts) | 💷 Finance | ✅ on |
| later | Strategy, PMO, Marketing, SEO, AEO/GEO, UX, Design, Security, Legal, Support, Ops | 💭 later |

**Adding a department:** make `agents/<role>/agent.ts` (copy one that's close), add it to `ceo/src/departments.ts`, then `npm run check` in `ceo/`.
