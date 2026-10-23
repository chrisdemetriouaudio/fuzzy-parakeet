// Every limit and setting for the lead chat and portal, in one place (spec, Phase 3).
// ADMIN_EMAIL and CHAT_ENABLED come from wrangler.jsonc "vars"; secrets from wrangler secrets.

// Check it still exists with `npx wrangler ai models` (the infra workflow prints it).
export const MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

export const DAILY_MODEL_CALL_CAP = 70;       // all visitors together, per UTC day
export const PER_IP_DAILY_MSGS = 25;          // one visitor, per UTC day
export const MAX_TURNS_PER_CHAT = 20;         // visitor messages in one chat
export const MAX_INPUT_CHARS = 800;           // one visitor message
export const MAX_REPLY_TOKENS = 220;          // the bot's replies are 60 words or fewer
export const MIN_TURNS_TO_MAP = 3;            // [[MAPPED]] counts from the visitor's 3rd message (evals, 22 Oct)

// Fact buttons and the summary card (D35). CHAT_NEXT (wrangler.jsonc) switches them on:
// "off", "preview" (only for someone using a ?chat=preview link) or "on" (everyone).
export const nextOn = (env, preview) => env.CHAT_NEXT === "on" || (env.CHAT_NEXT === "preview" && preview === true);

// The bot only names a set ([[ASK:hours]]); the options are fixed here, so it can't invent a
// menu. The visitor can always type their own answer instead.
export const QUICK_ANSWERS = {
  frequency: ["Daily", "Weekly", "Monthly", "Per client or event"],
  people: ["Just me", "2–3 people", "4–10 people", "11–50 people", "More than 50"],
  hours: ["Under an hour a week", "1–3 hours a week", "4–10 hours a week", "More than 10 hours a week"],
  spend: ["Nothing", "Under £50 a month", "£50–£200 a month", "More than £200 a month", "Not sure"],
};

// What the question must be about for its buttons to show. The bot sometimes tags the wrong
// question (eval run 3, 23 Oct), so the Worker checks the reply's last question (D37).
export const QUICK_MATCH = {
  frequency: /\b(how often|how frequently|how many times|frequency)\b/i,
  people: /\b(how many (people|of you|staff|volunteers|members|person)|who('s| is)? (usually |currently |normally )?(does|do|handles|deals|is involved|responsible|in charge|looks after|runs))\b/i,
  hours: /\b(how (many|much) (hours|time)|how long)\b/i,
  spend: /\b(spend|pay|cost)\b.*\b(software|subscriptions?|month|licen[cs]es?|tools?|apps?)\b|\b(software|subscriptions?|licen[cs]es?|tools?|apps?)\b.*\b(spend|pay|cost)\b/i,
};

// The summary card's lines: pain_summary keys and the labels the visitor sees.
export const BRIEF_FIELDS = [
  ["task", "The task"], ["trigger_frequency", "How often"], ["who", "Who does it"],
  ["time_cost", "What it costs"], ["current_tools", "Tools now"], ["consequence", "When it slips"],
  ["ideal_outcome", "Fixed means"],
];

export const ANON_PURGE_DAYS = 30;            // chats with no lead: anonymised after this
export const LEAD_PII_RETENTION_MONTHS = 12;  // quiet leads (not accepted, building or live)
export const INVITE_TOKEN_TTL_HOURS = 24;     // portal invite and sign-in links
export const SESSION_TTL_DAYS = 30;           // portal sign-in
export const CHAT_COOKIE_TTL_HOURS = 24;      // one chat
