import { NextResponse } from "next/server";
import { z } from "zod";
import { adminLog } from "@/lib/admin-log";
import { db } from "@/lib/db";
import { sameOrigin } from "@/lib/security";
import { getAdminSession } from "@/lib/sessions";

const colorSchema = z.object({
  name: z.string().trim().max(40).default(""),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

const schema = z.object({
  colors: z.array(colorSchema).max(12),
});

async function savePreferences(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Confira as cores informadas." },
      { status: 400 }
    );
  }

  const seen = new Set<string>();
  const colors = parsed.data.colors
    .map(color => ({
      name: color.name.replace(/\s+/g, " ").trim(),
      hex: color.hex.toUpperCase(),
    }))
    .filter(color => {
      if (seen.has(color.hex)) return false;
      seen.add(color.hex);
      return true;
    });

  const sql = db();
  await sql`
    UPDATE events
    SET
      gift_color_preferences = ${JSON.stringify(colors)}::jsonb,
      updated_at = now()
    WHERE id = ${session.event_id}
  `;

  await adminLog({
    eventId: session.event_id,
    adminId: session.admin_id,
    action: "gift_color_preferences_updated",
    entityType: "event",
    entityId: session.event_id,
    metadata: { count: colors.length },
  });

  return NextResponse.json({ ok: true, colors });
}

export const PUT = savePreferences;
export const PATCH = savePreferences;
