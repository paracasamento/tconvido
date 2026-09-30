import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getGuestSession } from "@/lib/sessions";
import { sameOrigin } from "@/lib/security";

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const session = await getGuestSession();
  if (!session) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  const sql = db();
  await sql`
    UPDATE reservations
    SET released_at = now(), release_reason = 'guest'
    WHERE guest_id = ${session.guest_id} AND released_at IS NULL
  `;
  return NextResponse.json({ ok: true });
}
