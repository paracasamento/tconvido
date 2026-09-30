CREATE TABLE IF NOT EXISTS invite_visual_designs (
  event_id uuid PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  config jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
