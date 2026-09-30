-- Applied to Neon production on 2026-09-24.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS guest_access_mode text NOT NULL DEFAULT 'individual'
  CHECK (guest_access_mode IN ('event','individual'));

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS event_access_code_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS guests_event_normalized_name_active_uidx
  ON guests(event_id, normalized_name)
  WHERE deleted_at IS NULL;
