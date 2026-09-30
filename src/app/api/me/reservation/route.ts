import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getGuestSession } from "@/lib/sessions";
import { sameOrigin } from "@/lib/security";

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  }

  const session = await getGuestSession();
  if (!session) {
    return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  }

  const giftId = new URL(request.url).searchParams.get("gift_id");
  if (!giftId) {
    return NextResponse.json({ message: "Informe o presente que deseja liberar." }, { status: 400 });
  }

  const sql = db();
  const rows = await sql`
    UPDATE reservations
    SET released_at = now(), release_reason = 'guest'
    WHERE event_id = ${session.event_id}
      AND guest_id = ${session.guest_id}
      AND gift_id = ${giftId}
      AND released_at IS NULL
    RETURNING id
  `;

  if (!rows.length) {
    return NextResponse.json({ message: "Esta escolha não está mais ativa." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
