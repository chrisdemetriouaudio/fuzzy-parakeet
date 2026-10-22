import { env } from "cloudflare:test";
import { describe, it, expect, vi, afterEach } from "vitest";
import { testEnv, fakeAI, post, call, cookieFrom, mockOutbound } from "./helpers.js";
import { createPasskey } from "./softauthn.js";
import { scopeHash } from "../portal/data.js";
import { sha256Hex } from "../lib/crypto.js";

afterEach(() => vi.restoreAllMocks());
const ORIGIN = "https://chrisdemetriou.com";

const get = (path, cookie) => new Request(`${ORIGIN}${path}`, { headers: cookie ? { cookie } : {} });
function postAs(path, body, cookie, csrf) {
  const r = post(path, body, { cookie });
  if (csrf) r.headers.set("x-csrf", csrf);
  return r;
}

// A visitor who finished a chat: returns the invite token from their email.
async function leadWithInvite(e, out, email = "sam@example.co.uk") {
  const first = await call(post("/api/chat", { message: "We chase invoices.", turnstile: "t" }), e);
  await call(post("/api/lead", { name: "Sam Patel", email, org: "Patel Joinery", consent: true }, { cookie: cookieFrom(first.res) }), e);
  const mail = out.sent.findLast((m) => m.to[0] === email);
  return { token: mail.text.match(/invite=([\w-]+)/)[1], lead: await env.DB.prepare("SELECT * FROM leads WHERE email = ?1").bind(email).first() };
}

async function register(e, token, key) {
  const opts = JSON.parse((await call(post("/api/portal/register/options", { token }), e)).text);
  const reg = await call(post("/api/portal/register/verify", { token, response: await key.register(opts, ORIGIN) }), e);
  return { res: reg.res, cookie: cookieFrom(reg.res), opts };
}

async function signIn(e, key) {
  const opts = JSON.parse((await call(post("/api/portal/login/options", {}), e)).text);
  const res = await call(post("/api/portal/login/verify", { response: await key.login(opts, ORIGIN, "chrisdemetriou.com") }), e);
  return { res: res.res, cookie: cookieFrom(res.res) };
}

async function meFor(e, cookie) {
  return JSON.parse((await call(get("/api/portal/me", cookie), e)).text);
}

const baseEnv = (out) => testEnv({ RESEND_API_KEY: "re_test", AI: fakeAI(["Want this? [[MAPPED]]"], JSON.stringify({ task: "Chasing invoices", blueprint_match: ["Chasing Engine"], confidence: 0.7 })) });

describe("portal sign-in with passkeys", () => {
  it("registers a passkey from the invite link, once, then signs in with it", async () => {
    const out = mockOutbound(vi);
    const e = baseEnv(out);
    const { token } = await leadWithInvite(e, out);
    const key = await createPasskey();
    const reg = await register(e, token, key);
    expect(reg.res.status).toBe(200);
    expect(reg.opts.rp.id).toBe("chrisdemetriou.com");
    expect(reg.opts.authenticatorSelection.residentKey).toBe("required");
    expect(reg.cookie).toMatch(/^__Host-cd_portal=/);
    expect(reg.res.headers.get("set-cookie")).toMatch(/Secure; HttpOnly; SameSite=Strict/);
    expect((await meFor(e, reg.cookie)).email).toBe("sam@example.co.uk");

    // the invite works once
    expect((await call(post("/api/portal/register/options", { token }), e)).res.status).toBe(400);

    const again = await signIn(e, key);
    expect(again.res.status).toBe(200);
    expect((await meFor(e, again.cookie)).admin).toBe(false);
  });

  it("refuses a replayed sign-in and a passkey it doesn't know", async () => {
    const out = mockOutbound(vi);
    const e = baseEnv(out);
    const { token } = await leadWithInvite(e, out);
    const key = await createPasskey();
    await register(e, token, key);
    const opts = JSON.parse((await call(post("/api/portal/login/options", {}), e)).text);
    const response = await key.login(opts, ORIGIN, "chrisdemetriou.com");
    expect((await call(post("/api/portal/login/verify", { response }), e)).res.status).toBe(200);
    expect((await call(post("/api/portal/login/verify", { response }), e)).res.status).toBe(400);   // challenge used up
    const stranger = await createPasskey();
    const opts2 = JSON.parse((await call(post("/api/portal/login/options", {}), e)).text);
    expect((await call(post("/api/portal/login/verify", { response: await stranger.login(opts2, ORIGIN, "chrisdemetriou.com") }), e)).res.status).toBe(400);
  });

  it("refuses a passkey made for another site", async () => {
    const out = mockOutbound(vi);
    const e = baseEnv(out);
    const { token } = await leadWithInvite(e, out);
    const key = await createPasskey();
    const opts = JSON.parse((await call(post("/api/portal/register/options", { token }), e)).text);
    const res = await call(post("/api/portal/register/verify", { token, response: await key.register(opts, "https://evil.example") }), e);
    expect(res.res.status).toBe(400);
  });

  it("emails a sign-in link to known addresses only, and makes Chris an admin", async () => {
    const out = mockOutbound(vi);
    const e = baseEnv(out);
    expect((await call(post("/api/portal/link", { email: "nobody@example.com" }), e)).res.status).toBe(200);
    expect(out.sent).toHaveLength(0);
    await call(post("/api/portal/link", { email: "Hello@ChrisDemetriou.com" }), e);
    expect(out.sent).toHaveLength(1);
    const token = out.sent[0].text.match(/signin=([\w-]+)/)[1];
    const reg = await register(e, token, await createPasskey());
    expect((await meFor(e, reg.cookie)).admin).toBe(true);
    for (let i = 0; i < 4; i++) await call(post("/api/portal/link", { email: "hello@chrisdemetriou.com" }), e);
    expect(out.sent.length).toBe(3);   // 3 links an hour at most
  });
});

describe("portal data", () => {
  async function setup() {
    const out = mockOutbound(vi);
    const e = baseEnv(out);
    const { token, lead } = await leadWithInvite(e, out);
    const client = await register(e, token, await createPasskey());
    const clientMe = await meFor(e, client.cookie);
    await call(post("/api/portal/link", { email: "hello@chrisdemetriou.com" }), e);
    const adminToken = out.sent.findLast((m) => m.to[0] === "hello@chrisdemetriou.com" && /signin=/.test(m.text)).text.match(/signin=([\w-]+)/)[1];
    const admin = await register(e, adminToken, await createPasskey());
    const adminMe = await meFor(e, admin.cookie);
    return { e, out, lead, client: { cookie: client.cookie, csrf: clientMe.csrf }, admin: { cookie: admin.cookie, csrf: adminMe.csrf } };
  }

  it("needs a session, and a CSRF token for changes", async () => {
    const { e, lead, client } = await setup();
    expect((await call(get("/api/portal/leads"), e)).res.status).toBe(401);
    expect((await call(postAs("/api/portal/accept", { lead_id: lead.id }, client.cookie), e)).res.status).toBe(403);
    expect((await call(postAs("/api/portal/admin/stage", { lead_id: lead.id, to: "closed" }, client.cookie, client.csrf), e)).res.status).toBe(403);
  });

  it("shows the client their lead without the internal bits", async () => {
    const { e, lead, client, admin } = await setup();
    const list = JSON.parse((await call(get("/api/portal/leads", client.cookie), e)).text);
    expect(list.leads.map((l) => l.id)).toEqual([lead.id]);
    expect(list.leads[0].email).toBeUndefined();
    const detail = JSON.parse((await call(get(`/api/portal/lead?id=${lead.id}`, client.cookie), e)).text);
    expect(detail.pain).toBeUndefined();
    expect(JSON.stringify(detail)).not.toContain("Chasing Engine");
    expect(detail.transcript.length).toBeGreaterThan(1);
    expect(detail.audit).toBeNull();
    // admin sees the summary and blueprint
    const adminView = JSON.parse((await call(get(`/api/portal/lead?id=${lead.id}`, admin.cookie), e)).text);
    expect(adminView.pain.blueprint_match).toEqual(["Chasing Engine"]);
    // another client can't see it
    const out2 = mockOutbound(vi);
    const e2 = { ...e, AI: fakeAI(["Want this? [[MAPPED]]"], "{}") };
    const second = await leadWithInvite(e2, out2, "jo@other.example");
    const jo = await register(e2, second.token, await createPasskey());
    expect((await call(get(`/api/portal/lead?id=${lead.id}`, jo.cookie), e2)).res.status).toBe(404);
    const joList = JSON.parse((await call(get("/api/portal/leads", jo.cookie), e2)).text);
    expect(joList.leads.map((l) => l.id)).toEqual([second.lead.id]);
  });

  it("publishes an audit and a scope, versions scopes, and records the exact version accepted", async () => {
    const { e, out, lead, client, admin } = await setup();
    const A = (path, body) => call(postAs(path, body, admin.cookie, admin.csrf), e);
    expect((await A("/api/portal/admin/audit", { lead_id: lead.id, markdown: "# Draft", publish: false })).res.status).toBe(200);
    let view = JSON.parse((await call(get(`/api/portal/lead?id=${lead.id}`, client.cookie), e)).text);
    expect(view.audit).toBeNull();   // drafts stay hidden
    const before = out.sent.length;
    await A("/api/portal/admin/audit", { lead_id: lead.id, markdown: "# Your audit\n\nThree steps can run themselves.", publish: true });
    view = JSON.parse((await call(get(`/api/portal/lead?id=${lead.id}`, client.cookie), e)).text);
    expect(view.audit.markdown).toContain("Three steps");
    expect(view.lead.stage).toBe("audit_sent");
    expect(out.sent.length).toBe(before + 1);
    expect(out.sent.at(-1).text).toContain("https://chrisdemetriou.com/portal/");
    expect(out.sent.at(-1).text).not.toContain("Three steps");   // the content stays in the portal

    await A("/api/portal/admin/scope", { lead_id: lead.id, markdown: "Scope v1", price_gbp: 2400, publish: true });
    view = JSON.parse((await call(get(`/api/portal/lead?id=${lead.id}`, client.cookie), e)).text);
    const v1 = view.scope;
    expect(v1).toMatchObject({ version: 1, price_gbp: 2400 });
    expect(v1.content_hash).toBe(await scopeHash(lead.id, 1, 2400, "Scope v1"));

    // a change makes version 2; accepting the old one is refused
    await A("/api/portal/admin/scope", { lead_id: lead.id, markdown: "Scope v2", price_gbp: 2600, publish: true });
    const C = (body) => call(postAs("/api/portal/accept", body, client.cookie, client.csrf), e);
    expect((await C({ lead_id: lead.id, scope_id: v1.id, content_hash: v1.content_hash })).res.status).toBe(409);
    view = JSON.parse((await call(get(`/api/portal/lead?id=${lead.id}`, client.cookie), e)).text);
    expect((await C({ lead_id: lead.id, scope_id: view.scope.id, content_hash: view.scope.content_hash })).res.status).toBe(200);
    const row = await env.DB.prepare("SELECT * FROM scopes WHERE id = ?1").bind(view.scope.id).first();
    expect(row.accepted_at).toBeGreaterThan(0);
    expect(row.accepted_ip_hash).toMatch(/^[0-9a-f]{64}$/);
    expect((await env.DB.prepare("SELECT stage FROM leads WHERE id = ?1").bind(lead.id).first()).stage).toBe("accepted");
    expect((await C({ lead_id: lead.id, scope_id: view.scope.id, content_hash: view.scope.content_hash })).res.status).toBe(409);
  });

  it("exports the client's data, then deletes it and keeps the anonymised chat", async () => {
    const { e, lead, client } = await setup();
    const exp = await call(get("/api/portal/export", client.cookie), e);
    expect(exp.res.headers.get("content-disposition")).toContain("attachment");
    const data = JSON.parse(exp.text);
    expect(data.leads[0]).toMatchObject({ name: "Sam Patel", email: "sam@example.co.uk" });
    expect(exp.text).not.toContain("blueprint");

    await env.DB.prepare("INSERT INTO messages (chat_id, role, content, created_at) VALUES (?1, 'user', ?2, 1)")
      .bind(lead.chat_id, "I'm Sam Patel at Patel Joinery, call 07700 900123 or sam@example.co.uk").run();
    expect((await call(postAs("/api/portal/delete", { confirm: "nope" }, client.cookie, client.csrf), e)).res.status).toBe(400);
    const del = await call(postAs("/api/portal/delete", { confirm: "delete" }, client.cookie, client.csrf), e);
    expect(del.res.status).toBe(200);
    expect(del.res.headers.get("set-cookie")).toContain("Max-Age=0");

    const after = await env.DB.prepare("SELECT * FROM leads WHERE id = ?1").bind(lead.id).first();
    expect(after).toMatchObject({ name: null, email: null, org: null, user_id: null });
    expect(after.purged_at).toBeGreaterThan(0);
    const { results: msgs } = await env.DB.prepare("SELECT content FROM messages WHERE chat_id = ?1").bind(lead.chat_id).all();
    const all = msgs.map((m) => m.content).join("\n");
    expect(all).toContain("We chase invoices.");
    for (const pii of ["Sam", "Patel", "07700", "sam@example"]) expect(all).not.toContain(pii);
    expect(await env.DB.prepare("SELECT * FROM users WHERE email = 'sam@example.co.uk'").first()).toBeNull();
    expect(await env.DB.prepare("SELECT COUNT(*) AS n FROM credentials c JOIN users u ON u.id = c.user_id WHERE u.role = 'client'").first()).toMatchObject({ n: 0 });
    expect((await env.DB.prepare("SELECT ip_hash FROM chats WHERE id = ?1").bind(lead.chat_id).first()).ip_hash).toBeNull();
    expect((await call(get("/api/portal/me", client.cookie), e)).res.status).toBe(401);
    expect(await env.DB.prepare("SELECT task FROM pain_summary WHERE lead_id = ?1").bind(lead.id).first()).toMatchObject({ task: "Chasing invoices" });
  });

  it("gives Chris stats and stage changes with notes", async () => {
    const { e, lead, admin } = await setup();
    const all = JSON.parse((await call(get("/api/portal/leads", admin.cookie), e)).text);
    expect(all.leads.map((l) => l.id)).toEqual([lead.id]);
    expect(all.leads[0]).toMatchObject({ name: "Sam Patel", email: "sam@example.co.uk", task: "Chasing invoices" });
    const filtered = JSON.parse((await call(get("/api/portal/leads?stage=live", admin.cookie), e)).text);
    expect(filtered.leads).toEqual([]);
    const s = JSON.parse((await call(get("/api/portal/admin/stats", admin.cookie), e)).text);
    expect(s.totals).toMatchObject({ chats: 1, captured: 1 });
    const ch = await call(postAs("/api/portal/admin/stage", { lead_id: lead.id, to: "building", note: "Deposit paid" }, admin.cookie, admin.csrf), e);
    expect(ch.res.status).toBe(200);
    const ev = await env.DB.prepare("SELECT * FROM stage_events WHERE lead_id = ?1 ORDER BY id DESC").bind(lead.id).first();
    expect(ev).toMatchObject({ from_stage: "new", to_stage: "building", note: "Deposit paid" });
  });
});
