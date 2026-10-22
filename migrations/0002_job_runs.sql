-- When background jobs last ran. The free plan's cron triggers are all used by other
-- Workers on the account, so the retention job is started by ordinary site traffic instead
-- (worker/retention.js, maybeRunRetention), at most every few hours.
CREATE TABLE job_runs (
  name        TEXT PRIMARY KEY,
  last_run_at INTEGER NOT NULL
);
