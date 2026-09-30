import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminLog } from "@/lib/admin-log";
import { getAdminSession } from "@/lib/sessions";
import { sameOrigin } from "@/lib/security";
import { deleteGiftImage, uploadGiftImage } from "@/lib/storage";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  const { id } = await context.params;
  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const description = String(form.get("description") || "").trim() || null;
  const quantity = Number(form.get("available_quantity") || 1);
  const removeImage = form.get("remove_image") === "1";
  const file = form.get("image");

  if (name.length < 2 || name.length > 160) {
    return NextResponse.json({ message: "Informe um nome válido." }, { status: 400 });
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
    return NextResponse.json({ message: "A quantidade deve ser um número entre 1 e 999." }, { status: 400 });
  }

  const sql = db();
  const currentRows = await sql`
    SELECT image_path FROM gifts
    WHERE id = ${id} AND event_id = ${session.event_id} AND deleted_at IS NULL
    LIMIT 1
  `;
  const current = currentRows[0] as any;
  if (!current) return NextResponse.json({ message: "Presente não encontrado." }, { status: 404 });

  let nextImage = current.image_path as string | null;
  let uploaded: string | null = null;
  try {
    if (file instanceof File && file.size > 0) {
      uploaded = await uploadGiftImage(session.event_id, id, file);
      nextImage = uploaded;
    } else if (removeImage) {
      nextImage = null;
    }

    const activeRows = await sql`
      SELECT COUNT(*)::int AS active_count
      FROM reservations
      WHERE gift_id = ${id}
        AND event_id = ${session.event_id}
        AND released_at IS NULL
    `;
    const activeCount = Number(activeRows[0]?.active_count || 0);
    if (quantity < activeCount) {
      if (uploaded) await deleteGiftImage(uploaded);
      return NextResponse.json(
        { message: `A quantidade não pode ser menor que as ${activeCount} escolhas já confirmadas.` },
        { status: 409 }
      );
    }

    await sql`
      UPDATE gifts
      SET
        name = ${name},
        description = ${description},
        image_path = ${nextImage},
        available_quantity = ${quantity},
        updated_at = now()
      WHERE id = ${id} AND event_id = ${session.event_id} AND deleted_at IS NULL
    `;

    if ((uploaded || removeImage) && current.image_path && current.image_path !== nextImage) {
      await deleteGiftImage(current.image_path);
    }

    await adminLog({
      eventId: session.event_id,
      adminId: session.admin_id,
      action: "gift_updated",
      entityType: "gift",
      entityId: id
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (uploaded) await deleteGiftImage(uploaded);
    return NextResponse.json({ message: error?.message || "Não foi possível editar." }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  const { id } = await context.params;
  const sql = db();

  const active = await sql`
    SELECT EXISTS(
      SELECT 1 FROM reservations
      WHERE gift_id = ${id} AND released_at IS NULL
    ) AS reserved
  `;
  if (active[0]?.reserved) {
    return NextResponse.json(
      { message: "Este presente está reservado. Para preservar a escolha do convidado, ele não pode ser removido diretamente." },
      { status: 409 }
    );
  }

  const rows = await sql`
    UPDATE gifts
    SET deleted_at = now(), is_active = false
    WHERE id = ${id} AND event_id = ${session.event_id} AND deleted_at IS NULL
    RETURNING id, image_path
  `;
  const gift = rows[0] as any;
  if (!gift) return NextResponse.json({ message: "Presente não encontrado." }, { status: 404 });

  await deleteGiftImage(gift.image_path);
  await adminLog({
    eventId: session.event_id,
    adminId: session.admin_id,
    action: "gift_removed",
    entityType: "gift",
    entityId: id
  });
  return NextResponse.json({ ok: true });
}
