// Every limit and setting for the lead chat and portal, in one place (spec, Phase 3).
// ADMIN_EMAIL and CHAT_ENABLED come from wrangler.jsonc "vars"; secrets from wrangler secrets.

// Check it still exists with `npx wrangler ai models` (the infra workflow prints it).
export const MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

export const DAILY_MODEL_CALL_CAP = 70;       // all visitors together, per UTC day
export const PER_IP_DAILY_MSGS = 25;          // one visitor, per UTC day
export const MAX_TURNS_PER_CHAT = 20;         // visitor messages in one chat
export const MAX_INPUT_CHARS = 800;           // one visitor message
export const MAX_REPLY_TOKENS = 220;          // the bot's replies are 60 words or fewer

export const ANON_PURGE_DAYS = 30;            // chats with no lead: anonymised after this
export const LEAD_PII_RETENTION_MONTHS = 12;  // quiet leads (not accepted, building or live)
export const INVITE_TOKEN_TTL_HOURS = 24;     // portal invite and sign-in links
export const SESSION_TTL_DAYS = 30;           // portal sign-in
export const CHAT_COOKIE_TTL_HOURS = 24;      // one chat
