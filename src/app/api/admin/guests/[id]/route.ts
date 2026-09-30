import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminLog } from "@/lib/admin-log";
import { getAdminSession } from "@/lib/sessions";
import { sameOrigin } from "@/lib/security";

const patchSchema = z.object({
  rsvp_status: z.enum(["pending", "confirmed", "declined"]).optional(),
  allowed_adults: z.number().int().min(1).max(20).optional(),
  allowed_children: z.number().int().min(0).max(20).optional(),
  review_match: z.boolean().optional()
}).refine(value =>
  value.rsvp_status !== undefined ||
  value.allowed_adults !== undefined ||
  value.allowed_children !== undefined ||
  value.review_match === true,
  { message: "Nenhuma alteração informada." }
);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  const { id } = await context.params;
  const sql = db();

  const currentRows = await sql`
    SELECT confirmed_adults, confirmed_children
    FROM guests
    WHERE id = ${id} AND event_id = ${session.event_id} AND deleted_at IS NULL
    LIMIT 1
  `;
  if (!currentRows.length) return NextResponse.json({ message: "Convidado não encontrado." }, { status: 404 });

  const current = currentRows[0] as any;
  if (
    parsed.data.allowed_adults !== undefined &&
    Number(current.confirmed_adults || 0) > parsed.data.allowed_adults
  ) {
    return NextResponse.json(
      { message: "O limite de adultos não pode ficar abaixo da confirmação atual." },
      { status: 409 }
    );
  }
  if (
    parsed.data.allowed_children !== undefined &&
    Number(current.confirmed_children || 0) > parsed.data.allowed_children
  ) {
    return NextResponse.json(
      { message: "O limite de crianças não pode ficar abaixo da confirmação atual." },
      { status: 409 }
    );
  }

  const rows = await sql`
    UPDATE guests
    SET
      rsvp_status = COALESCE(${parsed.data.rsvp_status ?? null}, rsvp_status),
      rsvp_updated_at = CASE
        WHEN ${parsed.data.rsvp_status ?? null}::text = 'pending' THEN NULL
        WHEN ${parsed.data.rsvp_status ?? null}::text IN ('confirmed','declined') THEN now()
        ELSE rsvp_updated_at
      END,
      allowed_adults = COALESCE(${parsed.data.allowed_adults ?? null}, allowed_adults),
      allowed_children = COALESCE(${parsed.data.allowed_children ?? null}, allowed_children),
      needs_review = CASE WHEN ${parsed.data.review_match === true} THEN false ELSE needs_review END,
      reviewed_at = CASE WHEN ${parsed.data.review_match === true} THEN now() ELSE reviewed_at END,
      reviewed_by = CASE WHEN ${parsed.data.review_match === true} THEN ${session.admin_id} ELSE reviewed_by END,
      updated_at = now()
    WHERE id = ${id} AND event_id = ${session.event_id} AND deleted_at IS NULL
    RETURNING id
  `;
  if (!rows.length) return NextResponse.json({ message: "Convidado não encontrado." }, { status: 404 });

  await adminLog({
    eventId: session.event_id,
    adminId: session.admin_id,
    action: "guest_rsvp_updated",
    entityType: "guest",
    entityId: id,
    metadata: {
      status: parsed.data.rsvp_status,
      allowed_adults: parsed.data.allowed_adults,
      allowed_children: parsed.data.allowed_children,
      review_match: parsed.data.review_match
    }
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  const { id } = await context.params;
  const sql = db();

  const rows = await sql`
    WITH target AS (
      SELECT id FROM guests
      WHERE id = ${id} AND event_id = ${session.event_id} AND deleted_at IS NULL
    ),
    released AS (
      UPDATE reservations
      SET released_at = now(), release_reason = 'guest_deleted'
      WHERE guest_id IN (SELECT id FROM target) AND released_at IS NULL
    ),
    codes AS (
      UPDATE guest_access_codes
      SET revoked_at = now()
      WHERE guest_id IN (SELECT id FROM target) AND revoked_at IS NULL
    ),
    sessions AS (
      UPDATE guest_sessions
      SET revoked_at = now()
      WHERE guest_id IN (SELECT id FROM target) AND revoked_at IS NULL
    )
    UPDATE guests
    SET deleted_at = now()
    WHERE id IN (SELECT id FROM target)
    RETURNING id
  `;
  if (!rows.length) return NextResponse.json({ message: "Convidado não encontrado." }, { status: 404 });

  await adminLog({
    eventId: session.event_id,
    adminId: session.admin_id,
    action: "guest_removed",
    entityType: "guest",
    entityId: id
  });

  return NextResponse.json({ ok: true });
}
