-- The job board (D1). The dashboard reads it; each job's Durable Object writes it.
--
--   jobs       one row per job (a Fix-it ticket, later a Build, ...)
--   steps      the job's steps, in order, one department each
--   outputs    what each step produced (append-only: retries add rows, never overwrite)
--   approvals  outward-facing asks waiting for Chris's yes (send, deploy, sign, spend)

CREATE TABLE jobs (
  id          TEXT PRIMARY KEY,
  pipeline    TEXT NOT NULL,
  title       TEXT NOT NULL,
  input       TEXT NOT NULL,                       -- JSON: { client, text }
  status      TEXT NOT NULL DEFAULT 'running'
              CHECK (status IN ('running', 'needs_you', 'done', 'stopped')),
  note        TEXT,                                -- why the CEO picked this pipeline
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE steps (
  id           TEXT PRIMARY KEY,
  job_id       TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL,                   -- 0-based order in the pipeline
  department   TEXT NOT NULL,
  name         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'running', 'needs_you', 'done', 'blocked', 'failed', 'stopped')),
  attempts     INTEGER NOT NULL DEFAULT 0,
  note         TEXT,                               -- why it is blocked or failed
  started_at   TEXT,
  finished_at  TEXT,
  UNIQUE (job_id, position)
);

CREATE TABLE outputs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id      TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  step_id     TEXT NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
  attempt     INTEGER NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('result', 'carried_out')),
  body        TEXT NOT NULL,                       -- JSON
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE approvals (
  id          TEXT PRIMARY KEY,
  job_id      TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  step_id     TEXT NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('send', 'deploy', 'sign', 'spend')),
  summary     TEXT NOT NULL,
  detail      TEXT NOT NULL,
  decision    TEXT NOT NULL DEFAULT 'waiting' CHECK (decision IN ('waiting', 'yes', 'no')),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  decided_at  TEXT
);

CREATE INDEX jobs_by_status      ON jobs (status, updated_at);
CREATE INDEX steps_by_job        ON steps (job_id, position);
CREATE INDEX outputs_by_step     ON outputs (step_id, id);
CREATE INDEX approvals_waiting   ON approvals (decision, created_at);
CREATE INDEX approvals_by_step   ON approvals (step_id);
