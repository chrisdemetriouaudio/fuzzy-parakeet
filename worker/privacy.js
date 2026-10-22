// Removes personal data from stored text: used by "Delete my data" (portal) and the daily
// retention job (step 8).
//
// What it catches: email addresses, phone numbers, links with a personal path (a profile
// or document, not a bare domain), the lead's own name, email and organisation wherever
// they appear, and names introduced as "my name is …", "I'm …", "this is …".
// What it can't catch, honestly: a name or place mentioned in passing ("ask Sarah in
// accounts"), a business that's identifiable from its description alone, or personal
// details written in an unusual way. Anonymised chats are "very unlikely to identify
// someone", not "impossible to".
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const PHONE = /(?:\+|\b0)(?:[\s().-]?\d){9,13}\b/g;
const LINK = /\bhttps?:\/\/[^\s/]+\/[^\s]+/gi;
const INTRO = /\b(my name is|my name's|i am|i'm|this is|it's)\s+([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)?)\b/g;
const KEEP_LINKS = /^https?:\/\/(?:[\w-]+\.)*(?:chrisdemetriou\.com|cdcscontracts\.com|reach-children-uganda\.org\.uk)\//i;
// Words that follow "I'm" / "this is" but aren't names.
const NOT_NAMES = new Set(["Not", "Just", "The", "Our", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Excel", "Outlook"]);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function scrub(text, known = []) {
  let out = String(text ?? "");
  for (const k of known) {
    if (typeof k === "string" && k.trim().length >= 2) out = out.replace(new RegExp(escapeRe(k.trim()), "gi"), "[removed]");
  }
  return out
    .replace(EMAIL, "[email]")
    .replace(LINK, (url) => (KEEP_LINKS.test(url) ? url : "[link]"))
    .replace(PHONE, "[phone]")
    .replace(INTRO, (m, lead, name) => (NOT_NAMES.has(name.split(/[\s-]/)[0]) ? m : `${lead} [name]`));
}
