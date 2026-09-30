CREATE OR REPLACE VIEW public.admin_guest_overview AS
SELECT
  id,
  event_id,
  name,
  rsvp_status,
  rsvp_updated_at,
  source,
  created_at,
  updated_at,
  allowed_adults,
  allowed_children,
  confirmed_adults,
  confirmed_children,
  submitted_name,
  match_status,
  match_score,
  needs_review,
  reviewed_at
FROM public.guests
WHERE deleted_at IS NULL;
