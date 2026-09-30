import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminLog } from "@/lib/admin-log";
import { getAdminSession } from "@/lib/sessions";
import { sameOrigin } from "@/lib/security";

const schema = z.object({ status: z.enum(["draft", "active", "closed"]) });

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Status inválido." }, { status: 400 });

  const sql = db();
  await sql`UPDATE events SET status = ${parsed.data.status} WHERE id = ${session.event_id}`;

  await adminLog({
    eventId: session.event_id,
    adminId: session.admin_id,
    action: "event_status_changed",
    entityType: "event",
    entityId: session.event_id,
    metadata: { status: parsed.data.status }
  });

  return NextResponse.json({ ok: true });
}
