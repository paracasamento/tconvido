import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getInviteSession } from "@/lib/invite-session";
import { sameOrigin } from "@/lib/security";
import { getGuestSession } from "@/lib/sessions";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  }

  const invite = await getInviteSession();
  const guestSession = await getGuestSession();
  if (
    !invite ||
    !guestSession ||
    guestSession.event_id !== invite.event_id ||
    !invite.guest_id ||
    invite.guest_id !== guestSession.guest_id
  ) {
    return NextResponse.json(
      { message: "Entre novamente com seu nome e a senha do convite." },
      { status: 401 }
    );
  }

  const sql = db();
  const rows = await sql`
    SELECT
      id,
      name,
      rsvp_status,
      allowed_adults,
      allowed_children,
      confirmed_adults,
      confirmed_children,
      needs_review
    FROM guests
    WHERE id = ${guestSession.guest_id}
      AND event_id = ${invite.event_id}
      AND deleted_at IS NULL
    LIMIT 1
  `;

  if (!rows.length) {
    return NextResponse.json({ message: "Convidado não encontrado." }, { status: 404 });
  }

  const row = rows[0] as any;
  return NextResponse.json({
    ok: true,
    found: true,
    submitted_name: String(row.name),
    candidates: [{
      id: String(row.id),
      name: String(row.name),
      score: 100,
      match_status: "exact",
      rsvp_status: row.rsvp_status,
      allowed_adults: Number(row.allowed_adults || 1),
      allowed_children: Number(row.allowed_children || 0),
      confirmed_adults: Number(row.confirmed_adults || 0),
      confirmed_children: Number(row.confirmed_children || 0),
      needs_review: Boolean(row.needs_review),
    }],
  });
}
