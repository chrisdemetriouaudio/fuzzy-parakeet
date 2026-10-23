// Reads Workers AI's streamed reply and turns it into clean text: the control tokens
// ([[MAPPED]], and [[ASK:hours]] and friends for the fact buttons) are removed, even when
// they arrive split across chunks, and recorded instead.
import { LEAK_MARKERS, LEAK_REPLY, RULE_TALK, RULE_BITS } from "./prompt.js";
import { MIN_TURNS_TO_MAP, QUICK_ANSWERS, QUICK_MATCH } from "../config.js";

const TOKEN = /\[\[\s*(?:MAPPED|ASK\s*:\s*[a-z]+)\s*\]\]/gi;
const MAPPED_TOKEN = /\[\[\s*MAPPED\s*\]\]/i;
const ASK_TOKEN = /\[\[\s*ASK\s*:\s*([a-z]+)\s*\]\]/gi;

// Could this be the start of a token? ("[", "[[MAP", "[[ MAPPED ]", "[[ASK:ho" ...)
const couldBeToken = (tail) => {
  const t = tail.replace(/\s+/g, "").toUpperCase();
  return tail.length <= 28 && ("[[MAPPED]]".startsWith(t) || /^\[\[A(S(K(:[A-Z]*\]?)?)?)?$/.test(t));
};

// The last [[ASK:…]] set named in a reply, if it's one of QUICK_ANSWERS.
function askIn(raw) {
  const keys = [...String(raw).matchAll(ASK_TOKEN)].map((m) => m[1].toLowerCase());
  const key = keys.at(-1);
  return key && Object.hasOwn(QUICK_ANSWERS, key) ? key : null;
}

// The reply's last question (the sentence ending in its last "?").
function lastQuestion(text) {
  const upto = text.slice(0, text.lastIndexOf("?") + 1);
  return upto.split(/(?<=[.!?])\s+/).filter(Boolean).at(-1) || "";
}

// Text is passed on as it arrives, except a trailing piece that could still turn into the
// token; that waits until it either completes (and is dropped) or can't.
export function createTokenFilter() {
  let held = "";
  let full = "";
  return {
    push(piece) {
      full += piece;
      held = (held + piece).replace(TOKEN, "");
      const start = held.endsWith("[") && !held.endsWith("[[") ? held.length - 1 : held.lastIndexOf("[[");
      if (start === -1 || !couldBeToken(held.slice(start))) { const out = held; held = ""; return out; }
      const out = held.slice(0, start);
      held = held.slice(start);
      return out;
    },
    end() {
      const out = held.replace(TOKEN, "");
      held = "";
      return out;
    },
    get mapped() { return MAPPED_TOKEN.test(full); },
    get text() { return full.replace(TOKEN, "").trim(); },
    get raw() { return full; },
  };
}

const squash = (s) => s.replace(/\s+/g, " ");

// Has the reply started repeating the bot's instructions, word for word or in other words?
export const leaked = (text) => LEAK_MARKERS.some((m) => squash(text).includes(squash(m)))
  || (RULE_TALK.test(text) && RULE_BITS.filter((r) => r.test(text)).length >= 2);

// What a whole reply comes to for the visitor (the chat and the evals both use this): the
// tokens removed, the canned answer if it leaked the instructions, "mapped" only when the
// token was there, nothing leaked and this is at least the visitor's MIN_TURNS_TO_MAP-th
// message (turn counts the visitor's messages, this one included), and "ask" naming the fact
// buttons to show (never alongside "mapped", and only when the reply's last question is about
// that fact: QUICK_MATCH). askDropped: the bot tagged the reply (even with a set that doesn't
// exist) but the Worker shows no buttons.
export function visibleReply(raw, turn) {
  const text = String(raw).replace(TOKEN, "").trim();
  if (leaked(text)) return { text: LEAK_REPLY, mapped: false, ask: null, askDropped: false, leaked: true };
  const mapped = MAPPED_TOKEN.test(raw) && turn >= MIN_TURNS_TO_MAP;
  const named = mapped ? null : askIn(raw);
  const ask = named && QUICK_MATCH[named].test(lastQuestion(text)) ? named : null;
  const tagged = !mapped && /\[\[\s*ASK\s*:/i.test(raw);
  return { text, mapped, ask, askDropped: tagged && !ask, leaked: false };
}

// Workers AI streams server-sent events: `data: {"response":"..."}` lines, then `data: [DONE]`.
export async function* aiText(stream) {
  const reader = stream.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const piece = JSON.parse(data).response;
        if (typeof piece === "string" && piece) yield piece;
      } catch { /* a keep-alive or partial line: skip */ }
    }
  }
}

export const sse = (data) => `data: ${JSON.stringify(data)}\n\n`;
