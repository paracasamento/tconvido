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
    SELECT status
    FROM events
    WHERE id = ${session.event_id}
    LIMIT 1
  `;
  if (!eventRows.length || eventRows[0].status !== "active") {
    return NextResponse.json(
      { message: "A lista de presentes não está disponível agora." },
      { status: 403 }
    );
  }

  /*
   * Primeiro verifica a relação exata convidado + presente solicitado.
   * Isso evita tratar um retry da mesma reserva como "você já possui outro presente".
   */
  const exactReservation = await sql`
    SELECT r.id, r.gift_id, g.name
    FROM reservations r
    JOIN gifts g ON g.id = r.gift_id
    WHERE
      r.event_id = ${session.event_id}
      AND r.guest_id = ${session.guest_id}
      AND r.gift_id = ${id}
      AND r.released_at IS NULL
    LIMIT 1
  `;

  if (exactReservation.length) {
    return NextResponse.json({
      ok: true,
      status: "reserved_by_me",
      already_reserved: true,
      gift: {
        id: String(exactReservation[0].gift_id),
        name: String(exactReservation[0].name || ""),
      },
    });
  }

  /*
   * Depois procura uma eventual outra reserva ativa desse convidado,
   * sempre dentro do mesmo evento.
   */
  const currentReservations = await sql`
    SELECT r.gift_id, g.name
    FROM reservations r
    JOIN gifts g ON g.id = r.gift_id
    WHERE
      r.event_id = ${session.event_id}
      AND r.guest_id = ${session.guest_id}
      AND r.released_at IS NULL
    ORDER BY r.created_at DESC
    LIMIT 1
  `;

  if (currentReservations.length) {
    return NextResponse.json(
      {
        code: "guest_has_reservation",
        message: `Você já reservou “${String(currentReservations[0].name || "outro presente")}”. Libere essa escolha para trocar.`,
        current_gift: {
          id: String(currentReservations[0].gift_id),
          name: String(currentReservations[0].name || ""),
        },
      },
      { status: 409 }
    );
  }

  try {
    const rows = await sql`
      INSERT INTO reservations (event_id, guest_id, gift_id)
      SELECT ${session.event_id}, ${session.guest_id}, g.id
      FROM gifts g
      WHERE
        g.id = ${id}
        AND g.event_id = ${session.event_id}
        AND g.deleted_at IS NULL
        AND g.is_active = true
      RETURNING id, gift_id
    `;

    if (!rows.length) {
      return NextResponse.json(
        { message: "Presente não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      status: "reserved_by_me",
      gift: { id: String(rows[0].gift_id) },
    });
  } catch (error: any) {
    if (error?.code === "23505") {
      /*
       * Corrida entre duas requisições: primeiro confirma novamente se
       * a reserva que venceu é do próprio convidado.
       */
      const exactAfterRace = await sql`
        SELECT r.gift_id, g.name
        FROM reservations r
        JOIN gifts g ON g.id = r.gift_id
        WHERE
          r.event_id = ${session.event_id}
          AND r.guest_id = ${session.guest_id}
          AND r.gift_id = ${id}
          AND r.released_at IS NULL
        LIMIT 1
      `;

      if (exactAfterRace.length) {
        return NextResponse.json({
          ok: true,
          status: "reserved_by_me",
          already_reserved: true,
          gift: {
            id: String(exactAfterRace[0].gift_id),
            name: String(exactAfterRace[0].name || ""),
          },
        });
      }

      const mineRows = await sql`
        SELECT r.gift_id, g.name
        FROM reservations r
        JOIN gifts g ON g.id = r.gift_id
        WHERE
          r.event_id = ${session.event_id}
          AND r.guest_id = ${session.guest_id}
          AND r.released_at IS NULL
        ORDER BY r.created_at DESC
        LIMIT 1
      `;

      if (mineRows.length) {
        return NextResponse.json(
          {
            code: "guest_has_reservation",
            message: `Você já reservou “${String(mineRows[0].name || "outro presente")}”. Libere essa escolha para trocar.`,
            current_gift: {
              id: String(mineRows[0].gift_id),
              name: String(mineRows[0].name || ""),
            },
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          code: "gift_taken",
          message:
            "Esse presente acabou de ser escolhido por outro convidado. Escolha outra opção.",
        },
        { status: 409 }
      );
    }

    throw error;
  }
}
