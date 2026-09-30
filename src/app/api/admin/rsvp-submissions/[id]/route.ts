import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/sessions";
import { sameOrigin } from "@/lib/security";

const schema = z.object({
  guest_id: z.string().uuid(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  }

  const session = await requireAdmin();
  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Convidado inválido." }, { status: 400 });
  }

  const sql = db();
  const guestRows = await sql`
    SELECT id
    FROM guests
    WHERE id = ${parsed.data.guest_id}
      AND event_id = ${session.event_id}
      AND deleted_at IS NULL
    LIMIT 1
  `;
  if (!guestRows.length) {
    return NextResponse.json({ message: "Convidado não encontrado." }, { status: 404 });
  }

  const submissionRows = await sql`
    SELECT id, submitted_name, children_count, guest_id
    FROM rsvp_submissions
    WHERE id = ${id}
      AND event_id = ${session.event_id}
    LIMIT 1
  `;
  if (!submissionRows.length) {
    return NextResponse.json({ message: "Confirmação não encontrada." }, { status: 404 });
  }

  const submission = submissionRows[0] as any;
  const currentGuestId = submission.guest_id ? String(submission.guest_id) : null;
  const targetGuestId = parsed.data.guest_id;

  if (currentGuestId && currentGuestId !== targetGuestId) {
    const identityRows = await sql`
      SELECT id, source, needs_review, submitted_name
      FROM guests
      WHERE id = ${currentGuestId}
        AND event_id = ${session.event_id}
        AND deleted_at IS NULL
      LIMIT 1
    `;
    const oldIdentity = identityRows[0] as any;

    const reservationRows = await sql`
      SELECT
        (SELECT gift_id FROM reservations WHERE guest_id = ${currentGuestId} AND released_at IS NULL LIMIT 1) AS old_gift,
        (SELECT gift_id FROM reservations WHERE guest_id = ${targetGuestId} AND released_at IS NULL LIMIT 1) AS target_gift
    `;
    const oldGift = reservationRows[0]?.old_gift ? String(reservationRows[0].old_gift) : null;
    const targetGift = reservationRows[0]?.target_gift ? String(reservationRows[0].target_gift) : null;

    if (oldGift && targetGift && oldGift !== targetGift) {
      return NextResponse.json(
        { message: "As duas identidades possuem presentes reservados diferentes. Libere uma das reservas antes de concluir o vínculo." },
        { status: 409 }
      );
    }

    if (oldGift && !targetGift) {
      await sql`
        UPDATE reservations
        SET guest_id = ${targetGuestId}
        WHERE guest_id = ${currentGuestId}
          AND event_id = ${session.event_id}
          AND released_at IS NULL
      `;
    }

    await sql`
      UPDATE guest_sessions
      SET guest_id = ${targetGuestId}
      WHERE guest_id = ${currentGuestId}
        AND revoked_at IS NULL
    `;

    if (oldIdentity?.source === "self_registered") {
      await sql`
        UPDATE guests
        SET deleted_at = now(), updated_at = now()
        WHERE id = ${currentGuestId}
          AND event_id = ${session.event_id}
      `;
    } else if (
      oldIdentity?.needs_review === true &&
      String(oldIdentity?.submitted_name || "") === String(submission.submitted_name || "")
    ) {
      await sql`
        UPDATE guests
        SET
          rsvp_status = 'pending',
          rsvp_updated_at = NULL,
          confirmed_adults = 0,
          confirmed_children = 0,
          submitted_name = NULL,
          match_status = NULL,
          match_score = NULL,
          needs_review = false,
          reviewed_at = NULL,
          reviewed_by = NULL,
          updated_at = now()
        WHERE id = ${currentGuestId}
          AND event_id = ${session.event_id}
      `;
    }
  }

  await sql`
    UPDATE rsvp_submissions
    SET
      guest_id = ${parsed.data.guest_id},
      match_status = 'reviewed',
      needs_review = false,
      reviewed_at = now(),
      reviewed_by = ${session.admin_id},
      updated_at = now()
    WHERE id = ${id}
      AND event_id = ${session.event_id}
  `;

  await sql`
    UPDATE guests
    SET
      rsvp_status = 'confirmed',
      rsvp_updated_at = now(),
      submitted_name = ${String(submission.submitted_name)},
      match_status = 'reviewed',
      needs_review = false,
      reviewed_at = now(),
      reviewed_by = ${session.admin_id},
      confirmed_adults = 1,
      confirmed_children = ${Number(submission.children_count || 0)},
      updated_at = now()
    WHERE id = ${parsed.data.guest_id}
      AND event_id = ${session.event_id}
      AND deleted_at IS NULL
  `;

  return NextResponse.json({ ok: true });
}
