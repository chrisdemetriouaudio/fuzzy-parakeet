// The client portal (and Chris's admin view): plain JavaScript, no framework. Talks to
// /api/portal/* on this site; signs in with passkeys (WebAuthn). Everything typed by people
// or written by the model is escaped before it reaches the page.
import { renderMarkdown } from "./md.js";

const app = document.getElementById("app");
const statusEl = document.getElementById("portal-status");
const params = new URLSearchParams(location.search);
const STAGES = ["new", "audit_sent", "scoped", "accepted", "building", "live"];
const STAGE_NAMES = { new: "Received", audit_sent: "Audit sent", scoped: "Scoped", accepted: "Accepted", building: "Building", live: "Live", closed: "Closed" };
let me = null;

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const date = (ms) => (ms ? new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
const pounds = (n) => `£${Number(n).toLocaleString("en-GB")}`;

function say(text, error = false) {
  statusEl.textContent = text || "";
  statusEl.classList.toggle("error", !!error);
}

// Swap the view, then move focus to its heading so screen readers and keyboards follow.
function show(html, wide = false) {
  app.innerHTML = html;
  app.parentElement.classList.toggle("wide", wide);
  const h = app.querySelector("h1");
  if (h) { h.tabIndex = -1; h.focus(); }
}

async function api(path, body) {
  const init = { headers: {}, credentials: "same-origin" };
  if (body !== undefined) {
    init.method = "POST";
    init.headers["content-type"] = "application/json";
    if (me?.csrf) init.headers["x-csrf"] = me.csrf;
    init.body = JSON.stringify(body);
  }
  const res = await fetch(path, init);
  let data = {};
  try { data = await res.json(); } catch { /* empty */ }
  return { ok: res.ok, status: res.status, data };
}

// ── Passkeys: the browser side of WebAuthn ──
const b64 = {
  toBytes: (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0)),
  from: (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
};
const canPasskey = () => !!window.PublicKeyCredential && !!navigator.credentials;

function creationOptions(o) {
  if (PublicKeyCredential.parseCreationOptionsFromJSON) return PublicKeyCredential.parseCreationOptionsFromJSON(o);
  return { ...o, challenge: b64.toBytes(o.challenge), user: { ...o.user, id: b64.toBytes(o.user.id) },
    excludeCredentials: (o.excludeCredentials || []).map((c) => ({ ...c, id: b64.toBytes(c.id) })) };
}
function requestOptions(o) {
  if (PublicKeyCredential.parseRequestOptionsFromJSON) return PublicKeyCredential.parseRequestOptionsFromJSON(o);
  return { ...o, challenge: b64.toBytes(o.challenge), allowCredentials: (o.allowCredentials || []).map((c) => ({ ...c, id: b64.toBytes(c.id) })) };
}
function credentialJSON(c) {
  if (typeof c.toJSON === "function") return c.toJSON();
  const r = c.response;
  const response = { clientDataJSON: b64.from(r.clientDataJSON) };
  if (r.attestationObject) { response.attestationObject = b64.from(r.attestationObject); response.transports = r.getTransports ? r.getTransports() : []; }
  if (r.authenticatorData) { response.authenticatorData = b64.from(r.authenticatorData); response.signature = b64.from(r.signature); if (r.userHandle) response.userHandle = b64.from(r.userHandle); }
  return { id: c.id, rawId: b64.from(c.rawId), type: c.type, clientExtensionResults: c.getClientExtensionResults?.() || {}, response };
}

async function createPasskey(token) {
  const opts = await api("/api/portal/register/options", { token });
  if (!opts.ok) throw new Error(opts.data.error === "link" ? "link" : "server");
  const cred = await navigator.credentials.create({ publicKey: creationOptions(opts.data) });
  const done = await api("/api/portal/register/verify", { token, response: credentialJSON(cred) });
  if (!done.ok) throw new Error(done.data.error || "server");
}

async function signInWithPasskey() {
  const opts = await api("/api/portal/login/options", {});
  if (!opts.ok) throw new Error("server");
  const cred = await navigator.credentials.get({ publicKey: requestOptions(opts.data) });
  const done = await api("/api/portal/login/verify", { response: credentialJSON(cred) });
  if (!done.ok) throw new Error(done.data.error || "server");
}

const PASSKEY_ERRORS = {
  link: "That link has been used or has expired. Ask for a new one below.",
  unknown: "This device doesn't have a passkey for the portal yet. Ask for a sign-in link below.",
  NotAllowedError: "The passkey request was cancelled or timed out. Try again.",
  InvalidStateError: "This device already has a passkey for the portal. Use Sign in instead.",
};

async function busy(button, label, work) {
  const was = button.textContent;
  button.disabled = true;
  button.textContent = label;
  try { await work(); } finally { button.disabled = false; button.textContent = was; }
}

// ── Signed out ──
function signedOutView(message) {
  show(`
    <p class="eyebrow">Client portal</p>
    <h1>Your portal</h1>
    <p>Your written audit, scope and fixed price live here. You sign in with a <strong>passkey</strong>: Face ID, a fingerprint or your device PIN. No password.</p>
    ${canPasskey() ? `<div class="prow"><button class="pbtn" id="signin" type="button">Sign in with your passkey</button></div>`
      : `<p class="note">This browser can't use passkeys. Try an up-to-date Safari, Chrome, Edge or Firefox.</p>`}
    <h2>Lost your passkey, or on a new device?</h2>
    <form id="link-form" class="pcard" novalidate>
      <div class="pfield">
        <label for="link-email">Your email address</label>
        <p class="hint" id="link-hint">The one you gave in the chat. We'll email you a link to set up a new passkey.</p>
        <input id="link-email" type="email" autocomplete="email" inputmode="email" required aria-describedby="link-hint">
      </div>
      <button class="pbtn quiet" type="submit">Email me a sign-in link</button>
    </form>`);
  if (message) say(message, true);
  document.getElementById("signin")?.addEventListener("click", (e) => busy(e.currentTarget, "Waiting for your passkey…", async () => {
    say("");
    try { await signInWithPasskey(); await start(); }
    catch (err) { say(PASSKEY_ERRORS[err.name] || PASSKEY_ERRORS[err.message] || "Sign-in didn't work. Try again, or ask for a link below.", true); }
  }));
  document.getElementById("link-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("link-email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) { say("Enter an email address like name@company.co.uk.", true); input.focus(); return; }
    await busy(e.submitter || e.target.querySelector("button"), "Sending…", async () => {
      await api("/api/portal/link", { email: input.value.trim() });
      say("If that address has a portal, a sign-in link is on its way. It works once, for 24 hours.");
    });
  });
}

// ── Invite or sign-in link: create a passkey ──
function setupView(token) {
  show(`
    <p class="eyebrow">Client portal</p>
    <h1>Set up your portal</h1>
    <p>Create a <strong>passkey</strong> for this device. Your phone or computer will ask for Face ID, a fingerprint or your PIN. That's how you'll sign in from now on, with no password.</p>
    ${canPasskey() ? `<div class="prow"><button class="pbtn" id="create" type="button">Create my passkey</button></div>`
      : `<p class="note">This browser can't make passkeys. Open this link in an up-to-date Safari, Chrome, Edge or Firefox.</p>`}`);
  document.getElementById("create")?.addEventListener("click", (e) => busy(e.currentTarget, "Waiting for your device…", async () => {
    say("");
    try {
      await createPasskey(token);
      history.replaceState(null, "", "/portal/");
      say("Passkey saved. You're signed in.");
      await start();
    } catch (err) {
      if (err.message === "link") return signedOutView(PASSKEY_ERRORS.link);
      say(PASSKEY_ERRORS[err.name] || "That didn't work. Try again.", true);
    }
  }));
}

// ── Client ──
function timeline(stage) {
  const at = STAGES.indexOf(stage);
  if (stage === "closed") return `<p><span class="chip">Closed</span></p>`;
  return `<ol class="timeline" aria-label="Progress">${STAGES.map((s, i) =>
    `<li class="${i < at ? "done" : i === at ? "now" : ""}"${i === at ? ' aria-current="step"' : ""}>${STAGE_NAMES[s]}</li>`).join("")}</ol>`;
}

function transcriptHtml(messages) {
  return `<details class="pbox"><summary>The chat (${messages.length} messages)</summary><dl class="transcript">${messages.map((m) =>
    `<dt>${m.role === "user" ? "You" : "Chris's AI assistant"}</dt><dd>${esc(m.content)}</dd>`).join("")}</dl></details>`;
}

async function clientHome() {
  const { data } = await api("/api/portal/leads");
  const leads = data.leads || [];
  if (leads.length === 1) return clientLead(leads[0].id, true);
  show(`
    <p class="eyebrow">Client portal</p>
    <h1>Your portal</h1>
    ${leads.length ? leads.map((l) => `<a class="pcard" href="#lead=${esc(l.id)}"><h3>${esc(l.task || "Your workflow audit request")}</h3>
      <p><span class="chip">${STAGE_NAMES[l.stage]}</span> &nbsp;Last update ${date(l.last_activity_at)}</p></a>`).join("")
      : `<p>Nothing here yet.</p>`}
    ${yourData()}`);
  wireYourData();
}

function yourData() {
  return `<h2>Your data</h2>
    <p>Download everything we hold about you, or delete it. Deleting removes your name, email and organisation straight away and signs you out; the chat is kept with personal details removed.</p>
    <div class="prow"><a class="pbtn quiet" href="/api/portal/export" download>Download my data (JSON)</a>
    <button class="pbtn danger" type="button" id="delete">Delete my data</button></div>
    <form id="delete-form" class="pcard" hidden>
      <div class="pfield"><label for="delete-confirm">Type <strong>delete</strong> to confirm</label>
      <input id="delete-confirm" autocomplete="off"></div>
      <div class="prow"><button class="pbtn danger" type="submit">Delete my data now</button><button class="pbtn quiet" type="button" id="delete-cancel">Cancel</button></div>
    </form>`;
}

function wireYourData() {
  const form = document.getElementById("delete-form");
  document.getElementById("delete").addEventListener("click", () => { form.hidden = false; document.getElementById("delete-confirm").focus(); });
  document.getElementById("delete-cancel").addEventListener("click", () => { form.hidden = true; document.getElementById("delete").focus(); });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (document.getElementById("delete-confirm").value.trim().toLowerCase() !== "delete") { say("Type delete to confirm.", true); return; }
    const res = await api("/api/portal/delete", { confirm: "delete" });
    if (!res.ok) { say("That didn't work. Email hello@chrisdemetriou.com and Chris will do it.", true); return; }
    me = null;
    show(`<h1>Your data is deleted</h1><p>Your name, email and organisation are gone, and you're signed out. Thanks for trying the audit.</p>`);
    say("");
  });
}

async function clientLead(id, only = false) {
  const { ok, data } = await api(`/api/portal/lead?id=${encodeURIComponent(id)}`);
  if (!ok) return clientHome();
  const s = data.scope;
  show(`
    ${only ? `<p class="eyebrow">Client portal</p>` : `<p><a href="#">← All your requests</a></p>`}
    <h1>${esc(data.lead.org ? `Workflow audit: ${data.lead.org}` : "Your workflow audit")}</h1>
    ${timeline(data.lead.stage)}
    <h2>Written audit</h2>
    ${data.audit ? `<div class="doc">${renderMarkdown(data.audit.markdown)}</div><p class="updated">Published ${date(data.audit.published_at)}</p>`
      : `<p>Chris is writing your audit. You'll get an email when it's here.</p>`}
    ${s ? `<h2>Scope and fixed price</h2>
      <div class="doc">${renderMarkdown(s.markdown)}</div>
      <p><span class="price">${pounds(s.price_gbp)}</span> fixed price, version ${s.version}</p>
      ${s.accepted_at ? `<p class="note">You accepted version ${s.version} on ${date(s.accepted_at)}.</p>`
        : `<p>Accepting agrees to this exact scope (version ${s.version}) at this fixed price. If anything changes, you'll get a new version to accept.</p>
           <div class="prow"><button class="pbtn" type="button" id="accept">Accept scope and price</button></div>`}` : ""}
    <h2>Your chat</h2>
    ${transcriptHtml(data.transcript)}
    ${only ? yourData() : ""}`);
  if (only) wireYourData();
  document.getElementById("accept")?.addEventListener("click", (e) => busy(e.currentTarget, "Accepting…", async () => {
    const res = await api("/api/portal/accept", { lead_id: data.lead.id, scope_id: s.id, content_hash: s.content_hash });
    if (res.ok) { say("Accepted. Chris will be in touch about next steps."); return clientLead(id, only); }
    say(res.data.error === "changed" ? "This scope has just changed. Reloading the latest version." : "That didn't work. Try again.", true);
    if (res.data.error === "changed") setTimeout(() => clientLead(id, only), 1200);
  }));
}

// ── Admin (Chris) ──
async function adminHome() {
  const stage = params.get("stage") || "";
  const [{ data: list }, { data: st }] = await Promise.all([
    api(`/api/portal/leads${stage ? `?stage=${encodeURIComponent(stage)}` : ""}`),
    api("/api/portal/admin/stats"),
  ]);
  const t = st.totals || {};
  const pct = (n) => (t.chats ? `${Math.round((100 * n) / t.chats)}%` : "–");
  show(`
    <p class="eyebrow">Admin</p>
    <h1>Leads</h1>
    <div class="stats" aria-label="Last 14 days">
      <div><b>${t.chats ?? 0}</b><span>chats, 14 days</span></div>
      <div><b>${pct(t.mapped ?? 0)}</b><span>mapped</span></div>
      <div><b>${pct(t.captured ?? 0)}</b><span>asked for an audit</span></div>
      <div><b>${t.cap_hits ?? 0}</b><span>cap hits</span></div>
    </div>
    <div class="pfield narrow"><label for="stage-filter">Stage</label>
      <select id="stage-filter"><option value="">All stages</option>${[...STAGES, "closed"].map((s) => `<option value="${s}"${s === stage ? " selected" : ""}>${STAGE_NAMES[s]}</option>`).join("")}</select></div>
    <table class="ptable"><thead><tr><th>Who</th><th>Task</th><th>Stage</th><th>Last activity</th></tr></thead><tbody>
    ${(list.leads || []).map((l) => `<tr><td><a href="#lead=${esc(l.id)}">${esc(l.org || l.name || "(deleted)")}</a>${l.needs_review ? ' <span class="chip flag">check</span>' : ""}</td>
      <td>${esc(l.task || "")}</td><td>${STAGE_NAMES[l.stage]}</td><td>${date(l.last_activity_at)}</td></tr>`).join("") || `<tr><td colspan="4">No leads yet.</td></tr>`}
    </tbody></table>`, true);
  document.getElementById("stage-filter").addEventListener("change", (e) => {
    const v = e.target.value;
    history.replaceState(null, "", v ? `/portal/?stage=${v}` : "/portal/");
    params.set("stage", v);
    adminHome();
  });
}

async function adminLead(id) {
  const { ok, data } = await api(`/api/portal/lead?id=${encodeURIComponent(id)}`);
  if (!ok) return adminHome();
  const p = data.pain;
  const latest = (data.scopes || [])[0];
  show(`
    <p><a href="#">← All leads</a></p>
    <h1>${esc(data.lead.org || data.lead.name || "(deleted)")}</h1>
    <p>${esc(data.lead.name || "")} ${data.lead.email ? `· <a href="mailto:${esc(data.lead.email)}">${esc(data.lead.email)}</a>` : ""} · <span class="chip">${STAGE_NAMES[data.lead.stage]}</span></p>
    <h2>Pain summary</h2>
    ${p ? `<div class="doc"><dl class="transcript">${["task", "trigger_frequency", "who", "time_cost", "current_tools", "current_saas_spend", "tried", "consequence", "ideal_outcome"]
        .map((k) => `<dt>${k.replace(/_/g, " ")}</dt><dd>${esc(p[k] || "–")}</dd>`).join("")}
      <dt>blueprint match (internal)</dt><dd>${esc(p.blueprint_match.join(", ") || "–")} (confidence ${p.confidence ?? "–"})</dd></dl>
      ${p.needs_review ? `<p class="note">The extraction didn't validate. What the model said:</p><pre>${esc(p.raw_json || "")}</pre>` : ""}</div>` : "<p>Not extracted yet.</p>"}
    <h2>Chat</h2>
    ${transcriptHtml(data.transcript)}
    <h2>Written audit ${data.audit?.published_at ? `<span class="chip">published ${date(data.audit.published_at)}</span>` : ""}</h2>
    <div class="editor">
      <div class="pfield"><label for="audit-md">Markdown</label><textarea id="audit-md">${esc(data.audit?.markdown || "")}</textarea></div>
      <div><p class="pfield"><strong>Preview</strong></p><div class="doc" id="audit-preview"></div></div>
    </div>
    <div class="prow"><button class="pbtn quiet" type="button" id="audit-save">Save draft</button><button class="pbtn" type="button" id="audit-publish">Publish and email the client</button></div>
    <h2>Scope and price ${latest ? `<span class="chip">v${latest.version}${latest.published_at ? " published" : " draft"}${latest.accepted_at ? ", accepted" : ""}</span>` : ""}</h2>
    <div class="editor">
      <div><div class="pfield"><label for="scope-md">Markdown</label><textarea id="scope-md">${esc(latest?.markdown || "")}</textarea></div>
        <div class="pfield"><label for="scope-price">Fixed price (£, whole pounds)</label><input id="scope-price" inputmode="numeric" value="${latest ? latest.price_gbp : ""}"></div></div>
      <div><p class="pfield"><strong>Preview</strong></p><div class="doc" id="scope-preview"></div></div>
    </div>
    <div class="prow"><button class="pbtn quiet" type="button" id="scope-save">Save as new version</button><button class="pbtn" type="button" id="scope-publish">Publish and email the client</button></div>
    ${(data.scopes || []).length > 1 ? `<details class="pbox"><summary>All versions</summary><ul>${data.scopes.map((s) =>
      `<li>v${s.version}: ${pounds(s.price_gbp)}, ${s.published_at ? `published ${date(s.published_at)}` : "draft"}${s.accepted_at ? `, accepted ${date(s.accepted_at)}` : ""}</li>`).join("")}</ul></details>` : ""}
    <h2>Stage</h2>
    ${timeline(data.lead.stage)}
    <form id="stage-form" class="pcard">
      <div class="pfield"><label for="stage-to">Move to</label><select id="stage-to">${[...STAGES, "closed"].map((s) =>
        `<option value="${s}"${s === data.lead.stage ? " selected" : ""}>${STAGE_NAMES[s]}</option>`).join("")}</select></div>
      <div class="pfield"><label for="stage-note">Note (only you see it)</label><input id="stage-note" maxlength="500"></div>
      <button class="pbtn quiet" type="submit">Change stage</button>
    </form>
    <details class="pbox"><summary>History</summary><ul>${data.timeline.map((e) => `<li>${date(e.at)}: ${STAGE_NAMES[e.to]}${e.note ? `: ${esc(e.note)}` : ""}</li>`).join("")}</ul></details>`, true);

  const preview = (src, out) => { const f = () => { document.getElementById(out).innerHTML = renderMarkdown(document.getElementById(src).value); }; document.getElementById(src).addEventListener("input", f); f(); };
  preview("audit-md", "audit-preview");
  preview("scope-md", "scope-preview");
  const saveAudit = (publish) => async (e) => busy(e.currentTarget, publish ? "Publishing…" : "Saving…", async () => {
    const res = await api("/api/portal/admin/audit", { lead_id: id, markdown: document.getElementById("audit-md").value, publish });
    say(res.ok ? (publish ? "Audit published; the client has been emailed." : "Draft saved.") : "That didn't save. Is the audit empty?", !res.ok);
    if (res.ok && publish) adminLead(id);
  });
  const saveScope = (publish) => async (e) => busy(e.currentTarget, publish ? "Publishing…" : "Saving…", async () => {
    const price = Number(document.getElementById("scope-price").value.replace(/[£,\s]/g, ""));
    const res = await api("/api/portal/admin/scope", { lead_id: id, markdown: document.getElementById("scope-md").value, price_gbp: price, publish });
    say(res.ok ? `Saved as version ${res.data.version}${publish ? "; the client has been emailed" : ""}.` : "That didn't save. Check the scope and the price (whole pounds).", !res.ok);
    if (res.ok) adminLead(id);
  });
  document.getElementById("audit-save").addEventListener("click", saveAudit(false));
  document.getElementById("audit-publish").addEventListener("click", saveAudit(true));
  document.getElementById("scope-save").addEventListener("click", saveScope(false));
  document.getElementById("scope-publish").addEventListener("click", saveScope(true));
  document.getElementById("stage-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const res = await api("/api/portal/admin/stage", { lead_id: id, to: document.getElementById("stage-to").value, note: document.getElementById("stage-note").value });
    say(res.ok ? "Stage changed." : "That stage is already set.", !res.ok);
    if (res.ok) adminLead(id);
  });
}

// ── Start ──
function route() {
  const id = (location.hash.match(/^#lead=([\w-]+)$/) || [])[1];
  if (me.admin) return id ? adminLead(id) : adminHome();
  return id ? clientLead(id) : clientHome();
}

async function start() {
  const token = params.get("invite") || params.get("signin");
  const res = await api("/api/portal/me");
  if (res.ok) {
    me = res.data;
    if (token) history.replaceState(null, "", "/portal/" + location.hash);
    if (!document.getElementById("signout")) {
      const out = document.createElement("div");
      out.className = "prow";
      out.innerHTML = `<span>Signed in as <strong>${esc(me.email)}</strong></span><button class="pbtn quiet" type="button" id="signout">Sign out</button>`;
      app.parentElement.appendChild(out);
      out.querySelector("#signout").addEventListener("click", async () => { await api("/api/portal/logout", {}); location.href = "/portal/"; });
    }
    return route();
  }
  if (res.status === 503) return show(`<h1>Your portal</h1><p>The portal isn't open yet. Email <a href="mailto:hello@chrisdemetriou.com">hello@chrisdemetriou.com</a>.</p>`);
  return token ? setupView(token) : signedOutView();
}

addEventListener("hashchange", () => { if (me) { say(""); route(); } });
start();
