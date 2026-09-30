ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS allowed_adults integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS allowed_children integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confirmed_adults integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confirmed_children integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS submitted_name text,
  ADD COLUMN IF NOT EXISTS match_status text,
  ADD COLUMN IF NOT EXISTS match_score integer,
  ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES admins(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS guest_companions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  name text,
  companion_type text NOT NULL DEFAULT 'child',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guest_companions_guest_idx
  ON guest_companions (guest_id, companion_type);

CREATE INDEX IF NOT EXISTS guests_rsvp_review_idx
  ON guests (event_id, needs_review)
  WHERE deleted_at IS NULL;
