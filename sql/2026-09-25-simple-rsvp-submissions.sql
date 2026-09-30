CREATE TABLE IF NOT EXISTS rsvp_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  submitted_name text NOT NULL,
  normalized_name text NOT NULL,
  has_children boolean NOT NULL DEFAULT false,
  children_count integer NOT NULL DEFAULT 0 CHECK (children_count >= 0 AND children_count <= 20),
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
