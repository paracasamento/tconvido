ALTER TABLE events
  ADD COLUMN IF NOT EXISTS gift_color_preferences jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_gift_color_preferences_array_check'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_gift_color_preferences_array_check
      CHECK (jsonb_typeof(gift_color_preferences) = 'array');
  END IF;
END $$;

GRANT SELECT, UPDATE ON TABLE events TO app_runtime;
