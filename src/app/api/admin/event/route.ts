import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminLog } from "@/lib/admin-log";
import { getAdminSession } from "@/lib/sessions";
import { sameOrigin } from "@/lib/security";

const schema = z.object({
  couple_names: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(120),
  message: z.string().max(1500).optional().default(""),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  event_time: z.string().regex(/^\d{2}:\d{2}$/),
  venue: z.string().trim().min(2).max(180),
  city: z.string().trim().min(2).max(180),
  maps_url: z.union([z.string().url(), z.literal("")]).optional().default("")
});

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Confira as informações." }, { status: 400 });

  const v = parsed.data;
  const sql = db();
  await sql`
    UPDATE events
    SET
      couple_names = ${v.couple_names},
      title = ${v.title},
      message = ${v.message || null},
      event_date = ${v.event_date}::date,
      event_time = ${v.event_time}::time,
      venue = ${v.venue},
      city = ${v.city},
      maps_url = ${v.maps_url || null}
    WHERE id = ${session.event_id}
  `;

  await adminLog({
    eventId: session.event_id,
    adminId: session.admin_id,
    action: "event_updated",
    entityType: "event",
    entityId: session.event_id
  });

  return NextResponse.json({ ok: true });
}
