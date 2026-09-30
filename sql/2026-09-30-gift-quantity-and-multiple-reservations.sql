-- Quantidade por presente + múltiplas escolhas por convidado.
ALTER TABLE gifts
  ADD COLUMN IF NOT EXISTS available_quantity integer NOT NULL DEFAULT 1;

ALTER TABLE gifts
  DROP CONSTRAINT IF EXISTS gifts_available_quantity_check;

ALTER TABLE gifts
  ADD CONSTRAINT gifts_available_quantity_check
  CHECK (available_quantity >= 1 AND available_quantity <= 999);

DROP INDEX IF EXISTS reservations_one_active_per_gift_idx;
DROP INDEX IF EXISTS reservations_one_active_per_guest_idx;

CREATE UNIQUE INDEX IF NOT EXISTS reservations_one_active_per_guest_gift_idx
  ON reservations (guest_id, gift_id)
  WHERE released_at IS NULL;

CREATE INDEX IF NOT EXISTS reservations_gift_active_idx
  ON reservations (gift_id, created_at)
  WHERE released_at IS NULL;
