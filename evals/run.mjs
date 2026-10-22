// Runs the ten personas against the live model (Workers AI REST API) with the exact system
// prompt and visitor wrapping the chat uses, then grades every conversation.
//   CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… node evals/run.mjs
// Needs the token's "Workers AI: Read" permission. About 60 model calls (≈4,000 neurons).
// Writes evals/results.md (pass/fail table + every conversation) and prints the table.
import { writeFileSync, appendFileSync } from "node:fs";
import { MODEL_ID, MAX_REPLY_TOKENS } from "../worker/config.js";
import { SYSTEM_PROMPT, OPENING, asVisitorData } from "../worker/chat/prompt.js";
import { PERSONAS } from "./personas.mjs";
import { CHECKS, grade, clean } from "./checks.mjs";

const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
if (!token || !account) { console.error("Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID."); process.exit(2); }
const only = process.argv[2];

async function ask(messages) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${MODEL_ID}`, {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ messages, max_tokens: MAX_REPLY_TOKENS }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) return String(data.result?.response ?? "");
    if (attempt === 3) throw new Error(`Workers AI ${res.status}: ${JSON.stringify(data.errors || data).slice(0, 300)}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

const results = [];
for (const persona of PERSONAS.filter((p) => !only || p.name.toLowerCase().includes(only.toLowerCase()))) {
  const history = [{ role: "assistant", content: OPENING }];
  const replies = [];
  for (const line of persona.turns) {
    history.push({ role: "user", content: line });
    const messages = [{ role: "system", content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.role === "user" ? asVisitorData(m.content) : m.content }))];
    const reply = await ask(messages);
    replies.push(reply);
    history.push({ role: "assistant", content: clean(reply) });
    if (/\[\[\s*MAPPED\s*\]\]/i.test(reply)) break;   // the widget switches to the contact form here
  }
  const convo = { persona, replies, history };
  results.push({ persona, grades: grade(convo), history, replies });
  console.log(`done: ${persona.name} (${replies.length} replies)`);
}

const cols = Object.keys(CHECKS);
const table = [
  `| Persona | ${cols.join(" | ")} |`,
  `|---|${cols.map(() => "---").join("|")}|`,
  ...results.map((r) => `| ${r.persona.name} | ${cols.map((c) => r.grades[c].replace(/\|/g, "/")).join(" | ")} |`),
];
const failed = results.reduce((n, r) => n + cols.filter((c) => r.grades[c].startsWith("❌")).length, 0);
const report = [
  `# Conversation evals: ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`,
  "", `Model: \`${MODEL_ID}\`. ${failed ? `**${failed} check(s) failed.**` : "**Every check passed.**"}`, "", ...table, "",
  "## Conversations", "",
  ...results.flatMap((r) => [`### ${r.persona.name}`, "",
    ...r.history.map((m) => `- **${m.role === "user" ? "Visitor" : "Bot"}:** ${m.content.replace(/\n+/g, " ")}`), ""]),
].join("\n");
writeFileSync(new URL("./results.md", import.meta.url), report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
console.log("\n" + table.join("\n") + `\n\n${failed ? `${failed} check(s) failed.` : "Every check passed."}`);
process.exit(failed ? 1 : 0);
