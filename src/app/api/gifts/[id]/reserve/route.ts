import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getGuestSession } from "@/lib/sessions";
import { sameOrigin } from "@/lib/security";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  }

  const session = await getGuestSession();
  if (!session) {
    return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  }

  if (session.rsvp_status !== "confirmed") {
    return NextResponse.json(
      { message: "Confirme sua presença antes de escolher um presente." },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const sql = db();

  const eventRows = await sql`
    SELECT status FROM events
    WHERE id = ${session.event_id}
    LIMIT 1
  `;
  if (!eventRows.length || eventRows[0].status !== "active") {
    return NextResponse.json(
      { message: "A lista de presentes não está disponível agora." },
      { status: 403 }
    );
  }

  const exact = await sql`
    SELECT r.id, r.gift_id, g.name
    FROM reservations r
    JOIN gifts g ON g.id = r.gift_id
    WHERE r.event_id = ${session.event_id}
      AND r.guest_id = ${session.guest_id}
      AND r.gift_id = ${id}
      AND r.released_at IS NULL
    LIMIT 1
  `;

  if (exact.length) {
    return NextResponse.json({
      ok: true,
      status: "reserved_by_me",
      already_reserved: true,
      gift: { id: String(exact[0].gift_id), name: String(exact[0].name || "") },
    });
  }

  const inserted = await sql`
    WITH locked_gift AS MATERIALIZED (
      SELECT g.id, g.available_quantity
      FROM gifts g
      WHERE g.id = ${id}
        AND g.event_id = ${session.event_id}
        AND g.deleted_at IS NULL
        AND g.is_active = true
      FOR UPDATE
    )
    INSERT INTO reservations (event_id, guest_id, gift_id)
    SELECT ${session.event_id}, ${session.guest_id}, lg.id
    FROM locked_gift lg
    WHERE (
      SELECT COUNT(*)
      FROM reservations active
      WHERE active.gift_id = lg.id
        AND active.released_at IS NULL
    ) < lg.available_quantity
    ON CONFLICT (guest_id, gift_id) WHERE released_at IS NULL
    DO NOTHING
    RETURNING id, gift_id
  `;

  if (inserted.length) {
    return NextResponse.json({
      ok: true,
      status: "reserved_by_me",
      gift: { id: String(inserted[0].gift_id) },
    });
  }

  const exactAfter = await sql`
    SELECT r.gift_id, g.name
    FROM reservations r
    JOIN gifts g ON g.id = r.gift_id
    WHERE r.event_id = ${session.event_id}
      AND r.guest_id = ${session.guest_id}
      AND r.gift_id = ${id}
      AND r.released_at IS NULL
    LIMIT 1
  `;

  if (exactAfter.length) {
    return NextResponse.json({
      ok: true,
      status: "reserved_by_me",
      already_reserved: true,
      gift: { id: String(exactAfter[0].gift_id), name: String(exactAfter[0].name || "") },
    });
  }

  const giftRows = await sql`
    SELECT g.id
    FROM gifts g
    WHERE g.id = ${id}
      AND g.event_id = ${session.event_id}
      AND g.deleted_at IS NULL
      AND g.is_active = true
    LIMIT 1
  `;

  if (!giftRows.length) {
    return NextResponse.json({ message: "Presente não encontrado." }, { status: 404 });
  }

  return NextResponse.json(
    {
      code: "gift_taken",
      message: "As unidades disponíveis deste presente já foram escolhidas. Escolha outra opção.",
    },
    { status: 409 }
  );
}
