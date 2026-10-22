-- The summary card (D35): when a chat is mapped, the brief is extracted once and shown to the
-- visitor to confirm or correct. /api/lead copies it into pain_summary and clears these
-- columns; the retention job clears them on chats that never became a lead.
ALTER TABLE chats ADD COLUMN brief_json TEXT;
ALTER TABLE chats ADD COLUMN brief_raw TEXT;
ALTER TABLE chats ADD COLUMN brief_confirmed_at INTEGER;
ALTER TABLE chats ADD COLUMN brief_edited INTEGER NOT NULL DEFAULT 0;
