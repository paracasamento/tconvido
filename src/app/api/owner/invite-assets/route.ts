import { NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/sessions";
import { sameOriginStrict } from "@/lib/security";
import { uploadInviteAsset } from "@/lib/storage";
import { adminLog } from "@/lib/admin-log";

export async function POST(request: Request) {
  if (!sameOriginStrict(request)) {
    return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  }

  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("image");

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ message: "Selecione uma imagem válida." }, { status: 400 });
    }

    const path = await uploadInviteAsset(session.event_id, file);
    const url = `/api/invite-assets?path=${encodeURIComponent(path)}`;

    await adminLog({
      eventId: session.event_id,
      adminId: session.admin_id,
      action: "invite_asset_uploaded",
      entityType: "event",
      entityId: session.event_id,
      metadata: { path, bytes: file.size, type: file.type }
    });

    return NextResponse.json({ ok: true, path, url });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Não foi possível enviar a imagem." },
      { status: 400 }
    );
  }
}
