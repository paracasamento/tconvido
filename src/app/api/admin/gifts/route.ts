import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminLog } from "@/lib/admin-log";
import { getAdminSession } from "@/lib/sessions";
import { sameOrigin } from "@/lib/security";
import { uploadGiftImage } from "@/lib/storage";

const bulkSchema = z.object({
  names: z.array(z.string().trim().min(2).max(160)).min(1).max(500)
});

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });

  const contentType = request.headers.get("content-type") || "";
  const sql = db();

  if (contentType.includes("application/json")) {
    const parsed = bulkSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ message: "Adicione pelo menos um presente válido." }, { status: 400 });

    const items = parsed.data.names.map(name => ({ id: crypto.randomUUID(), name: name.replace(/\s+/g, " ").trim() }));
    await sql`
      WITH input AS (
        SELECT * FROM jsonb_to_recordset(${JSON.stringify(items)}::jsonb) AS x(id uuid, name text)
      )
      INSERT INTO gifts (id, event_id, name)
      SELECT i.id, ${session.event_id}, i.name FROM input i
    `;

    await adminLog({
      eventId: session.event_id,
      adminId: session.admin_id,
      action: "gifts_bulk_created",
      entityType: "gift",
      entityId: session.event_id,
      metadata: { count: items.length }
    });

    return NextResponse.json({ ok: true, count: items.length });
  }

  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const description = String(form.get("description") || "").trim() || null;
  const file = form.get("image");

  if (name.length < 2 || name.length > 160) {
    return NextResponse.json({ message: "Informe um nome válido." }, { status: 400 });
  }

  const id = crypto.randomUUID();
  let imagePath: string | null = null;
  try {
    if (file instanceof File && file.size > 0) imagePath = await uploadGiftImage(session.event_id, id, file);

    await sql`
      INSERT INTO gifts (id, event_id, name, description, image_path)
      VALUES (${id}, ${session.event_id}, ${name}, ${description}, ${imagePath})
    `;

    await adminLog({ eventId: session.event_id, adminId: session.admin_id, action: "gift_created", entityType: "gift", entityId: id });
    return NextResponse.json({ ok: true, id });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || "Não foi possível salvar o presente." }, { status: 400 });
  }
}
