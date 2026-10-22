-- Lead chat and portal (Phase 9, step 3). Times are milliseconds since 1970 (UTC).
-- Personal data lives only in leads (name, email, org), users (email), message text and
-- ip hashes; the retention job (worker/retention.js) scrubs or deletes it on schedule.

-- One row per conversation. ("chats" rather than the spec's "sessions_chat", so it can't
-- be confused with auth_sessions.) ip_hash goes to NULL when the chat is anonymised.
CREATE TABLE chats (
  id               TEXT PRIMARY KEY,
  created_at       INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL,
  ip_hash          TEXT,
  page             TEXT,
  turn_count       INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'mapped', 'captured', 'abandoned')),
  proof_shown      TEXT,
  anonymised_at    INTEGER
);
CREATE INDEX chats_activity ON chats (last_activity_at);

CREATE TABLE messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id    TEXT NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX messages_chat ON messages (chat_id, id);

-- A person who signs in to the portal: a client, or Chris (admin).
CREATE TABLE users (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  role       TEXT NOT NULL CHECK (role IN ('client', 'admin')),
  created_at INTEGER NOT NULL
);

-- One per captured chat. user_id links it to the client's portal account; the spec put
-- lead_id on users instead, but someone who comes back with a second problem should see
-- both in one portal.
CREATE TABLE leads (
  id               TEXT PRIMARY KEY,
  chat_id          TEXT NOT NULL UNIQUE REFERENCES chats (id),
  user_id          TEXT REFERENCES users (id) ON DELETE SET NULL,
  name             TEXT,
  email            TEXT,
  org              TEXT,
  consent_at       INTEGER,
  stage            TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'audit_sent', 'scoped', 'accepted', 'building', 'live', 'closed')),
  created_at       INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL,
  purged_at        INTEGER
);
CREATE INDEX leads_stage ON leads (stage, last_activity_at);
CREATE INDEX leads_user ON leads (user_id);

-- What the extraction call found. blueprint_match is a JSON array and is admin-only.
-- needs_review = 1 when the model's JSON didn't validate (raw_json keeps what it said).
CREATE TABLE pain_summary (
  lead_id            TEXT PRIMARY KEY REFERENCES leads (id) ON DELETE CASCADE,
  task               TEXT,
  trigger_frequency  TEXT,
  who                TEXT,
  time_cost          TEXT,
  current_tools      TEXT,
  current_saas_spend TEXT,
  tried              TEXT,
  consequence        TEXT,
  ideal_outcome      TEXT,
  blueprint_match    TEXT,
  confidence         REAL,
  raw_json           TEXT,
  needs_review       INTEGER NOT NULL DEFAULT 0,
  created_at         INTEGER NOT NULL
);

-- The written audit: one per lead, edited until published, then republished if changed.
CREATE TABLE audits (
  lead_id      TEXT PRIMARY KEY REFERENCES leads (id) ON DELETE CASCADE,
  markdown     TEXT NOT NULL,
  updated_at   INTEGER NOT NULL,
  published_at INTEGER
);

-- Each change to a scope is a new version. Accepting stores the hash of the exact
-- version (markdown + price), so what the client agreed to can always be shown.
CREATE TABLE scopes (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id          TEXT NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  version          INTEGER NOT NULL,
  markdown         TEXT NOT NULL,
  price_gbp        INTEGER NOT NULL,
  content_hash     TEXT NOT NULL,
  created_at       INTEGER NOT NULL,
  published_at     INTEGER,
  accepted_at      INTEGER,
  accepted_ip_hash TEXT,
  UNIQUE (lead_id, version)
);

CREATE TABLE stage_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id    TEXT NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage   TEXT NOT NULL,
  at         INTEGER NOT NULL,
  note       TEXT
);
CREATE INDEX stage_events_lead ON stage_events (lead_id, at);

-- WebAuthn passkeys. id and public_key are base64url.
CREATE TABLE credentials (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  public_key   TEXT NOT NULL,
  counter      INTEGER NOT NULL DEFAULT 0,
  transports   TEXT,
  created_at   INTEGER NOT NULL,
  last_used_at INTEGER
);
CREATE INDEX credentials_user ON credentials (user_id);

-- One-time invite and sign-in links. Only a hash of the token is stored.
CREATE TABLE auth_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  purpose    TEXT NOT NULL CHECK (purpose IN ('invite', 'login')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at    INTEGER
);

-- WebAuthn challenges, used once. (Synced passkeys keep their counter at 0, so a
-- single-use challenge is what stops a replayed sign-in.)
CREATE TABLE auth_challenges (
  challenge  TEXT PRIMARY KEY,
  user_id    TEXT REFERENCES users (id) ON DELETE CASCADE,
  purpose    TEXT NOT NULL CHECK (purpose IN ('register', 'login')),
  expires_at INTEGER NOT NULL
);

-- Signed-in sessions. Only a hash of the session id is stored.
CREATE TABLE auth_sessions (
  id_hash    TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX auth_sessions_user ON auth_sessions (user_id);

-- The daily budget. date is YYYY-MM-DD (UTC).
CREATE TABLE usage_daily (
  date           TEXT PRIMARY KEY,
  model_calls    INTEGER NOT NULL DEFAULT 0,
  est_tokens_in  INTEGER NOT NULL DEFAULT 0,
  est_tokens_out INTEGER NOT NULL DEFAULT 0,
  chats_started  INTEGER NOT NULL DEFAULT 0,
  cap_hits       INTEGER NOT NULL DEFAULT 0
);

-- Messages per visitor per day, for PER_IP_DAILY_MSGS. Not in the spec's list: the cap
-- needs a counter. Rows older than two days are deleted by the retention job.
CREATE TABLE ip_usage (
  ip_hash  TEXT NOT NULL,
  date     TEXT NOT NULL,
  messages INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, date)
);
