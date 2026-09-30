import { db } from "@/lib/db";
import { anonymousKey, requestIp } from "@/lib/security";

export async function isRateLimited(
  request: Request,
  eventId: string | null,
  action: string,
  max: number,
  minutes: number
) {
  const sql = db();
  const ipHash = anonymousKey(requestIp(request));
  const rows = await sql`
    SELECT count(*)::int AS attempts
    FROM audit_logs
    WHERE
      action = ${action}
      AND metadata ->> 'ip_hash' = ${ipHash}
      AND created_at > now() - (${minutes}::text || ' minutes')::interval
  `;
  return Number(rows[0]?.attempts || 0) >= max;
}

export async function recordFailure(
  request: Request,
  eventId: string | null,
  action: string
) {
  const sql = db();
  const ipHash = anonymousKey(requestIp(request));
  await sql`
    INSERT INTO audit_logs (event_id, action, entity_type, metadata)
    VALUES (
      ${eventId},
      ${action},
      'security',
      jsonb_build_object('ip_hash', ${ipHash})
    )
  `;
}
