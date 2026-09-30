import { db } from "@/lib/db";

export async function adminLog(input: {
  eventId: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const sql = db();
  await sql`
    INSERT INTO audit_logs (
      event_id, admin_id, action, entity_type, entity_id, metadata
    )
    VALUES (
      ${input.eventId},
      ${input.adminId},
      ${input.action},
      ${input.entityType},
      ${input.entityId ?? null},
      ${JSON.stringify(input.metadata ?? {})}::jsonb
    )
  `;
}
