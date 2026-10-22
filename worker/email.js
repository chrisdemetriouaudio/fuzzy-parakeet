// Email through Resend (step 5): plain text only, UK English, no tracking pixels (there's
// no HTML to put one in). Sent from hello@chrisdemetriou.com, which Resend signs with the
// resend._domainkey DKIM record, so it passes the domain's strict DMARC policy.
// Without RESEND_API_KEY nothing is sent; the lead is still stored and shows in the portal.
const API = "https://api.resend.com/emails";
const FROM = "Chris Demetriou <hello@chrisdemetriou.com>";

const oneLine = (s, max = 120) => String(s ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);

export async function sendEmail(env, { to, subject, text, replyTo }) {
  if (!env.RESEND_API_KEY) {
    console.log(`email not sent (no RESEND_API_KEY): ${oneLine(subject)}`);
    return false;
  }
  const res = await fetch(API, {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject: oneLine(subject, 200), text, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!res.ok) console.log(`email failed: ${res.status} ${oneLine(await res.text(), 300)}`);
  return res.ok;
}

const LABELS = {
  task: "Task", trigger_frequency: "When / how often", who: "Who does it", time_cost: "Time or money per week",
  current_tools: "Tools now", current_saas_spend: "Software spend", tried: "Tried so far",
  consequence: "When it slips", ideal_outcome: "What fixed looks like",
};

export function leadEmailForChris({ lead, summary, proof, transcript, adminUrl }) {
  const who = lead.org || lead.name;
  const task = summary?.task || "(not extracted)";
  const lines = [
    `New lead from the chat: ${who}`,
    "",
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Organisation: ${lead.org || "-"}`,
    `Proof shown: ${proof || "none"}`,
    summary
      ? `Blueprint match: ${(summary.blueprint_match || []).join(", ") || "-"} (confidence ${summary.confidence ?? "-"})`
      : "Blueprint match: the extraction didn't work. Check the transcript (flagged in the portal).",
    "",
    "PAIN SUMMARY",
    ...Object.entries(LABELS).map(([k, label]) => `${label}: ${summary?.[k] || "-"}`),
    "",
    "TRANSCRIPT",
    ...transcript.map((m) => `${m.role === "user" ? "Visitor" : "Assistant"}: ${m.content}`),
    "",
    `Open it in the portal: ${adminUrl}`,
  ];
  return { subject: `New lead: ${oneLine(who, 60)}: ${oneLine(task, 80)}`, text: lines.join("\n") };
}

export function leadEmailForVisitor({ lead, inviteUrl }) {
  const text = [
    `Hi ${oneLine(lead.name, 60)},`,
    "",
    "Thanks for walking through it. Chris will send your written audit.",
    "",
    `Your private portal: ${inviteUrl}`,
    "",
    "The link works once and expires in 24 hours. It sets up a passkey (Face ID, a fingerprint",
    "or your device PIN), so there's no password to remember. Your audit, and later any scope",
    "and price, will be there. Lost the link? Reply to this email.",
    "",
    "Chris Demetriou",
    "chrisdemetriou.com",
  ];
  return { subject: "Your workflow audit request", text: text.join("\n") };
}

export async function sendLeadEmails(env, data) {
  const toChris = leadEmailForChris(data);
  await sendEmail(env, { to: env.ADMIN_EMAIL, ...toChris, replyTo: data.lead.email });
  await sendEmail(env, { to: data.lead.email, ...leadEmailForVisitor(data) });
}

// Short "something's waiting in your portal" note. The content stays in the portal.
export function noticeEmail(kind, portalUrl) {
  const what = { audit: "Your written audit is ready", scope: "Your scope and fixed price are ready", signin: "Your sign-in link" }[kind];
  const text = kind === "signin"
    ? ["Here's your sign-in link for the portal. It works once and expires in 24 hours:", "", portalUrl, "", "Chris Demetriou"]
    : [`${what}. It's in your private portal:`, "", portalUrl, "", "Chris Demetriou"];
  return { subject: what, text: text.join("\n") };
}
