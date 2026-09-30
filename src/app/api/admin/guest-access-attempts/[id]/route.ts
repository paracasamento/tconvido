import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminLog } from "@/lib/admin-log";
import { sameOrigin } from "@/lib/security";
import { getAdminSession } from "@/lib/sessions";

const schema = z.object({
  action: z.enum(["add", "deny"])
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Ação inválida." }, { status: 400 });
  }

  const { id } = await context.params;
  const sql = db();

  const attemptRows = await sql`
    SELECT id, submitted_name, normalized_name, status
    FROM guest_access_attempts
    WHERE id = ${id}
      AND event_id = ${session.event_id}
    LIMIT 1
  `;

  const attempt = attemptRows[0] as any;
  if (!attempt) {
    return NextResponse.json({ message: "Tentativa não encontrada." }, { status: 404 });
  }

  if (attempt.status !== "pending") {
    return NextResponse.json(
      { message: "Esta tentativa já foi analisada." },
      { status: 409 }
    );
  }

  if (parsed.data.action === "deny") {
    await sql`
      UPDATE guest_access_attempts
      SET
        status = 'denied',
        resolved_at = now(),
        resolved_by = ${session.admin_id},
        updated_at = now()
      WHERE id = ${id}
        AND event_id = ${session.event_id}
        AND status = 'pending'
    `;

    await adminLog({
      eventId: session.event_id,
      adminId: session.admin_id,
      action: "guest_access_attempt_denied",
      entityType: "guest_access_attempt",
      entityId: id,
      metadata: { submitted_name: String(attempt.submitted_name) }
    });

    return NextResponse.json({
      ok: true,
      message: "Tentativa ignorada. Essa pessoa continua sem acesso."
    });
  }

  let guestRows = await sql`
    SELECT id, name
    FROM guests
    WHERE event_id = ${session.event_id}
      AND normalized_name = ${attempt.normalized_name}
      AND deleted_at IS NULL
    LIMIT 1
  `;

  if (!guestRows.length) {
    guestRows = await sql`
      INSERT INTO guests (
        event_id,
        name,
        normalized_name,
        source
      )
      VALUES (
        ${session.event_id},
        ${attempt.submitted_name},
        ${attempt.normalized_name},
        'admin'
      )
      ON CONFLICT DO NOTHING
      RETURNING id, name
    `;

    if (!guestRows.length) {
      guestRows = await sql`
        SELECT id, name
        FROM guests
        WHERE event_id = ${session.event_id}
          AND normalized_name = ${attempt.normalized_name}
          AND deleted_at IS NULL
        LIMIT 1
      `;
    }
  }

  const guest = guestRows[0] as any;
  if (!guest) {
    return NextResponse.json(
      { message: "Não foi possível adicionar esse nome à lista." },
      { status: 409 }
    );
  }

  await sql`
    UPDATE guest_access_attempts
    SET
      status = 'added',
      guest_id = ${guest.id},
      resolved_at = now(),
      resolved_by = ${session.admin_id},
      updated_at = now()
    WHERE id = ${id}
      AND event_id = ${session.event_id}
      AND status = 'pending'
  `;

  await adminLog({
    eventId: session.event_id,
    adminId: session.admin_id,
    action: "guest_access_attempt_added",
    entityType: "guest",
    entityId: String(guest.id),
    metadata: {
      attempt_id: id,
      submitted_name: String(attempt.submitted_name)
    }
  });

  return NextResponse.json({
    ok: true,
    guest_id: String(guest.id),
    message: "Adicionado à lista. Avise a pessoa para tentar acessar novamente."
  });
}
