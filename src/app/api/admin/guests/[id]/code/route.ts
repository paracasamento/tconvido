import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminLog } from "@/lib/admin-log";
import { createGuestCode, protectGuestCode, hashToken, randomToken, sameOrigin } from "@/lib/security";
import { getAdminSession } from "@/lib/sessions";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  const { id } = await context.params;
  const sql = db();

  const eventRows = (await sql`SELECT guest_access_mode FROM events WHERE id = ${session.event_id} LIMIT 1`) as Array<{ guest_access_mode?: "event" | "individual" | null }>;
  if (eventRows[0]?.guest_access_mode === "event") {
    return NextResponse.json({ message: "Este convite está usando uma senha única para o evento." }, { status: 409 });
  }

  const code = createGuestCode();
  const codeHash = protectGuestCode(code);
  const linkHash = hashToken(randomToken(18));

  const rows = await sql`
    WITH target AS (
      SELECT id FROM guests
      WHERE id = ${id} AND event_id = ${session.event_id} AND deleted_at IS NULL
    ),
    revoked AS (
      UPDATE guest_access_codes
      SET revoked_at = now()
      WHERE guest_id IN (SELECT id FROM target) AND revoked_at IS NULL
    )
    INSERT INTO guest_access_codes (guest_id, code_hash, link_token_hash)
    SELECT id, ${codeHash}, ${linkHash}
    FROM target
    RETURNING guest_id
  `;
  if (!rows.length) return NextResponse.json({ message: "Convidado não encontrado." }, { status: 404 });

  await adminLog({
    eventId: session.event_id,
    adminId: session.admin_id,
    action: "guest_code_rotated",
    entityType: "guest",
    entityId: id
  });

  return NextResponse.json({ ok: true, code });
}
