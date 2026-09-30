# Production readiness

## Confirmado

- Next.js 15 project structure compatible with Vercel.
- Secrets remain server-side.
- Owner/admin cookies are separated.
- RSVP identity now requires a per-guest credential.
- Name + individual code must belong to the same guest.
- RSVP cannot create a new guest or switch to another guest identity.
- Database enforces one RSVP row per identified guest.
- Database enforces one active guest session per guest.
- Vercel Function upload limit respected for gift/invite images.
- Client/server boundary of the visual editor does not pull Neon code into the browser bundle.
- Home invitation cover is force-dynamic.

## Banco verificado em 2026-09-29

Production branch `production` / database `neondb`:

- `gift_color_preferences`: present
- `guest_access_mode`: present
- `rsvp_submissions`: present
- `rsvp_submission_sessions`: present
- `rsvp_submissions_one_per_guest_idx`: present
- `guest_sessions_one_active_idx`: present
- duplicate active guest sessions: 0
- Marcela active guest sessions after cleanup: 1

The RSVP schema migration is no longer a deployment blocker.

## Bloqueador operacional restante

The event is still stored as `guest_access_mode = event` (legacy shared password). The hardened application intentionally refuses shared credentials for RSVP. Before opening access to guests, use the admin Access screen to generate individual passwords for every guest. The action switches the event to `individual`, revokes old guest sessions, and creates one code per guest.


## Ainda precisa ser validado

- Full `npm run build` (the current execution environment cannot resolve the npm registry)
- First real Vercel Preview deployment
- Individual-code login + RSVP end-to-end in Preview
- Production domain cookies
- Supabase image upload/render in Vercel runtime

## Shared event access

Production uses `guest_access_mode = event`. A single event password is allowed, but every successful login must resolve the submitted name to exactly one existing guest. The resulting invite/guest sessions are bound to that `guest_id`; RSVP cannot switch identity or self-register another guest.

`npm run check:db` validates that event mode is enabled, an event password exists, the RSVP tables exist, and the uniqueness indexes are present.
