import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminLog } from "@/lib/admin-log";
import { getAdminSession } from "@/lib/sessions";
import { hashPassword, sameOrigin, verifyPassword } from "@/lib/security";

const schema = z.object({
  current_password: z.string().min(8).max(200),
  new_password: z.string().min(12).max(200)
});

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "A nova senha deve ter pelo menos 12 caracteres." }, { status: 400 });

  const sql = db();
  const rows = await sql`SELECT password_hash FROM admins WHERE id = ${session.admin_id} LIMIT 1`;
  const admin = rows[0] as any;
  if (!admin || !(await verifyPassword(parsed.data.current_password, admin.password_hash))) {
    return NextResponse.json({ message: "Senha atual incorreta." }, { status: 401 });
  }

  const hash = await hashPassword(parsed.data.new_password);
  await sql`UPDATE admins SET password_hash = ${hash} WHERE id = ${session.admin_id}`;

  await adminLog({
    eventId: session.event_id,
    adminId: session.admin_id,
    action: "admin_password_changed",
    entityType: "admin",
    entityId: session.admin_id
  });
  return NextResponse.json({ ok: true });
}
