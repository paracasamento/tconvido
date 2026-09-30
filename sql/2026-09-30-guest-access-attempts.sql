CREATE TABLE IF NOT EXISTS guest_access_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  submitted_name text NOT NULL,
  normalized_name text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1 CHECK (attempt_count > 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','denied','added')),
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  first_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES admins(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, normalized_name)
);

CREATE INDEX IF NOT EXISTS guest_access_attempts_pending_idx
  ON guest_access_attempts (event_id, last_attempt_at DESC)
  WHERE status = 'pending';
