// Runs the ten personas against the live model (Workers AI REST API) with the exact system
// prompt and visitor wrapping the chat uses, puts each reply through the same rules the
// Worker applies (visibleReply: token, leak guard, turn-3 rule), then grades what a visitor
// would see. Replies the leak guard replaced are listed separately.
//   CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… node evals/run.mjs [name,name…]
// EVAL_VARIANT=next tests the fact buttons and summary card (CHAT_NEXT, D35): the button
// prompt, and the brief extracted when a chat is mapped (checks 10 and 11).
// Needs the token's "Workers AI: Read" permission. About 60 model calls (≈4,000 neurons).
// Writes evals/results.md (pass/fail table + every conversation) and prints the table.
import { writeFileSync, appendFileSync } from "node:fs";
import { MODEL_ID, MAX_REPLY_TOKENS } from "../worker/config.js";
import { SYSTEM_PROMPT, SYSTEM_PROMPT_NEXT, OPENING, asVisitorData, extractionMessages, parseExtraction } from "../worker/chat/prompt.js";
import { visibleReply } from "../worker/chat/stream.js";
import { PERSONAS } from "./personas.mjs";
import { CHECKS, grade } from "./checks.mjs";

const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
if (!token || !account) { console.error("Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID."); process.exit(2); }
const only = (process.argv[2] || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const next = process.env.EVAL_VARIANT === "next";
const PROMPT = next ? SYSTEM_PROMPT_NEXT : SYSTEM_PROMPT;

async function ask(messages, maxTokens = MAX_REPLY_TOKENS) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${MODEL_ID}`, {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ messages, max_tokens: maxTokens }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) return String(data.result?.response ?? "");
    if (attempt === 3) throw new Error(`Workers AI ${res.status}: ${JSON.stringify(data.errors || data).slice(0, 300)}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

const results = [];
const guarded = [];
for (const persona of PERSONAS.filter((p) => !only.length || only.some((o) => p.name.toLowerCase().includes(o)))) {
  const history = [{ role: "assistant", content: OPENING }];
  const replies = [];
  const mapped = [];
  const asks = [];
  const unknownAsks = [];
  for (const [i, line] of persona.turns.entries()) {
    history.push({ role: "user", content: line });
    const messages = [{ role: "system", content: PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.role === "user" ? asVisitorData(m.content) : m.content }))];
    const raw = await ask(messages);
    const seen = visibleReply(raw, i + 1);
    if (seen.leaked) guarded.push(`${persona.name}, turn ${i + 1}: "${raw.replace(/\s+/g, " ").slice(0, 120)}…"`);
    replies.push(seen.text);
    mapped.push(seen.mapped);
    asks.push(seen.ask);
    if (!seen.ask && !seen.leaked && /\[\[\s*ASK\s*:/i.test(raw) && !seen.mapped) unknownAsks.push(i);
    history.push({ role: "assistant", content: seen.text });
    if (seen.mapped) break;   // the widget switches to the contact form here
  }
  // The summary card's brief: the same extraction the Worker runs when a chat is mapped.
  let brief = null;
  if (next && mapped.some(Boolean)) {
    const raw = await ask(extractionMessages(history), 700);
    brief = parseExtraction(raw);
  }
  const convo = { persona, replies, mapped, asks, unknownAsks, next, brief, history };
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
  `# Conversation evals${next ? " (fact buttons and summary card)" : ""}: ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`,
  "", `Model: \`${MODEL_ID}\`. ${failed ? `**${failed} check(s) failed.**` : "**Every check passed.**"}`, "", ...table, "",
  "## Leak guard", "", guarded.length ? "The Worker replaced these replies with its canned answer (the model started repeating its instructions):" : "It didn't have to step in.",
  ...guarded.map((g) => `- ${g}`), "",
  "## Conversations", "",
  ...results.flatMap((r) => [`### ${r.persona.name}`, "",
    ...r.history.map((m) => `- **${m.role === "user" ? "Visitor" : "Bot"}:** ${m.content.replace(/\n+/g, " ")}`), ""]),
].join("\n");
writeFileSync(new URL("./results.md", import.meta.url), report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
console.log("\n" + table.join("\n") + `\n\n${failed ? `${failed} check(s) failed.` : "Every check passed."}`);
if (guarded.length) console.log("\nLeak guard stepped in:\n" + guarded.join("\n"));
// The personas are made up, so the failing chats can go in the (public) log.
for (const r of results.filter((x) => cols.some((c) => x.grades[c].startsWith("❌")))) {
  console.log(`\n--- ${r.persona.name}`);
  for (const m of r.history) console.log(`${m.role === "user" ? "Visitor" : "Bot"}: ${m.content.replace(/\s+/g, " ")}`);
}
process.exit(failed ? 1 : 0);
