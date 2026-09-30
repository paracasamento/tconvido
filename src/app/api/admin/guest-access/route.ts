import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminLog } from "@/lib/admin-log";
import {
  createEventCode,
  protectGuestCode,
  revealGuestCode,
  sameOrigin,
} from "@/lib/security";
import { getAdminSession } from "@/lib/sessions";

const schema = z.object({ mode: z.literal("event") });

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });

  const sql = db();
  const eventRows = await sql`
    SELECT guest_access_mode, event_access_code_hash
    FROM events
    WHERE id = ${session.event_id}
    LIMIT 1
  `;
  if (!eventRows.length) {
    return NextResponse.json({ message: "Evento não encontrado." }, { status: 404 });
  }

  const event = eventRows[0] as any;
  const code = revealGuestCode(event.event_access_code_hash);

  return NextResponse.json({
    mode: "event",
    configured: event.guest_access_mode === "event" && Boolean(event.event_access_code_hash),
    code,
    recoverable: Boolean(code),
  });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Modo de acesso inválido." }, { status: 400 });
  }

  const code = createEventCode();
  const protectedCode = protectGuestCode(code);
  const sql = db();

  await sql`
    WITH event_update AS (
      UPDATE events
      SET guest_access_mode = 'event', event_access_code_hash = ${protectedCode}
      WHERE id = ${session.event_id}
    ),
    revoked_codes AS (
      UPDATE guest_access_codes
      SET revoked_at = now()
      WHERE guest_id IN (
        SELECT id FROM guests
        WHERE event_id = ${session.event_id} AND deleted_at IS NULL
      )
      AND revoked_at IS NULL
    )
    UPDATE guest_sessions
    SET revoked_at = now()
    WHERE guest_id IN (
      SELECT id FROM guests
      WHERE event_id = ${session.event_id} AND deleted_at IS NULL
    )
    AND revoked_at IS NULL
  `;

  await adminLog({
    eventId: session.event_id,
    adminId: session.admin_id,
    action: "guest_access_mode_event",
    entityType: "event",
    entityId: session.event_id,
  });

  return NextResponse.json({ mode: "event", code });
}
