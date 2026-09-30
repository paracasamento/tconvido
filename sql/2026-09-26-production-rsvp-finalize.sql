CREATE TABLE IF NOT EXISTS rsvp_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  submitted_name text NOT NULL,
  normalized_name text NOT NULL,
  has_children boolean NOT NULL DEFAULT false,
  children_count integer NOT NULL DEFAULT 0
    CHECK (children_count >= 0 AND children_count <= 20),
  match_status text NOT NULL DEFAULT 'unmatched'
    CHECK (match_status IN ('exact','probable','unmatched','reviewed')),
  match_score integer,
  needs_review boolean NOT NULL DEFAULT true,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES admins(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rsvp_submissions_event_confirmed_idx
  ON rsvp_submissions (event_id, confirmed_at DESC);

CREATE INDEX IF NOT EXISTS rsvp_submissions_review_idx
  ON rsvp_submissions (event_id, needs_review)
  WHERE needs_review = true;

-- One authenticated guest identity owns exactly one RSVP record per event.
-- Re-confirmations update the same row instead of creating another identity.
CREATE UNIQUE INDEX IF NOT EXISTS rsvp_submissions_one_per_guest_idx
  ON rsvp_submissions (event_id, guest_id)
  WHERE guest_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS rsvp_submission_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES rsvp_submissions(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rsvp_submission_sessions_submission_idx
  ON rsvp_submission_sessions (submission_id);

-- Keep only the newest active browser session for each guest before enforcing
-- the one-active-session invariant. Expired/revoked history is preserved.
WITH ranked_guest_sessions AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY guest_id
      ORDER BY created_at DESC, id DESC
    ) AS position
  FROM guest_sessions
  WHERE revoked_at IS NULL
)
UPDATE guest_sessions gs
SET revoked_at = now()
FROM ranked_guest_sessions ranked
WHERE gs.id = ranked.id
  AND ranked.position > 1;

CREATE UNIQUE INDEX IF NOT EXISTS guest_sessions_one_active_idx
  ON guest_sessions (guest_id)
  WHERE revoked_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS rsvp_submission_sessions_one_active_idx
  ON rsvp_submission_sessions (submission_id)
  WHERE revoked_at IS NULL;

GRANT SELECT, INSERT, UPDATE ON TABLE rsvp_submissions TO app_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE rsvp_submission_sessions TO app_runtime;
