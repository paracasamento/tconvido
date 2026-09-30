import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL?.trim();
const eventSlug = process.env.EVENT_SLUG?.trim();

if (!url) {
  console.error("ERROR: Missing DATABASE_URL");
  process.exit(1);
}
if (!eventSlug) {
  console.error("ERROR: Missing EVENT_SLUG");
  process.exit(1);
}

const sql = neon(url);
const requiredTables = [
  "events",
  "invite_visual_designs",
  "guests",
  "gifts",
  "reservations",
  "guest_sessions",
  "admin_sessions",
  "event_admins",
  "audit_logs",
  "rsvp_submissions",
  "rsvp_submission_sessions",
];
const requiredIndexes = [
  "rsvp_submissions_one_per_guest_idx",
  "guest_sessions_one_active_idx",
  "rsvp_submission_sessions_one_active_idx",
];

try {
  const [tableRows, indexRows, eventRows, identityRows] = await Promise.all([
    sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `,
    sql`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
    `,
    sql`
      SELECT
        e.id,
        e.slug,
        e.status,
        e.guest_access_mode,
        e.event_access_code_hash,
        (SELECT count(*)::int FROM guests g WHERE g.event_id = e.id AND g.deleted_at IS NULL) AS guest_count,
        (
          SELECT count(*)::int
          FROM guest_access_codes c
          JOIN guests g ON g.id = c.guest_id
          WHERE g.event_id = e.id
            AND g.deleted_at IS NULL
            AND c.revoked_at IS NULL
        ) AS active_code_count
      FROM events e
      WHERE e.slug = ${eventSlug}
      LIMIT 1
    `,
    sql`SELECT current_user AS role`,
  ]);

  const present = new Set(tableRows.map((row) => String(row.table_name)));
  const missing = requiredTables.filter((table) => !present.has(table));
  for (const table of missing) console.error(`ERROR: Missing database table ${table}`);
  if (missing.length) process.exitCode = 1;

  const indexes = new Set(indexRows.map((row) => String(row.indexname)));
  const missingIndexes = requiredIndexes.filter((index) => !indexes.has(index));
  for (const index of missingIndexes) console.error(`ERROR: Missing database index ${index}`);
  if (missingIndexes.length) process.exitCode = 1;

  const event = eventRows[0];
  if (!event) {
    console.error(`ERROR: Event not found for EVENT_SLUG=${eventSlug}`);
    process.exitCode = 1;
  } else {
    console.log(`Event: ${event.slug} (${event.status})`);
    if (event.status !== "active") {
      console.warn(`WARN: Event status is ${event.status}; guests normally need status=active in production.`);
    }

    const guests = Number(event.guest_count || 0);
    const codes = Number(event.active_code_count || 0);
    if (guests < 1) {
      console.error("ERROR: No active guests are configured.");
      process.exitCode = 1;
    }

    if (event.guest_access_mode !== "event") {
      console.error(`ERROR: Production requires guest_access_mode=event, found ${event.guest_access_mode}.`);
      process.exitCode = 1;
    } else if (!event.event_access_code_hash) {
      console.error("ERROR: Shared event access is enabled but no event password is configured.");
      process.exitCode = 1;
    } else {
      console.log("Guest access: shared event password with guest-bound sessions.");
    }
  }

  console.log(`Database role: ${identityRows[0]?.role || "unknown"}`);
  if (!process.exitCode) console.log("Production database check passed.");
} catch (error) {
  console.error("ERROR: Could not validate production database.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
