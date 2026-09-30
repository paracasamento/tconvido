import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isRateLimited, recordFailure } from "@/lib/rate-limit";
import { sameOriginStrict, verifyPassword } from "@/lib/security";
import { createOwnerSession } from "@/lib/sessions";

const schema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(12).max(200)
});

export async function POST(request: Request) {
  if (!sameOriginStrict(request)) {
    return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  }

  if (await isRateLimited(request, null, "owner_login_failed", 5, 15)) {
    return NextResponse.json(
      { message: "Muitas tentativas. Aguarde 15 minutos." },
      { status: 429 }
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Credenciais inválidas." }, { status: 400 });
  }

  const sql = db();
  const rows = await sql`
    SELECT a.id, a.password_hash, ea.event_id
    FROM admins a
    JOIN event_admins ea ON ea.admin_id = a.id
    WHERE
      lower(a.email) = lower(${parsed.data.email})
      AND a.is_active = true
      AND ea.role = 'owner'
    LIMIT 1
  `;

  const owner = rows[0] as any;

  if (!owner || !(await verifyPassword(parsed.data.password, owner.password_hash))) {
    await recordFailure(request, null, "owner_login_failed");
    return NextResponse.json(
      { message: "E-mail ou senha incorretos." },
      { status: 401 }
    );
  }

  await createOwnerSession(owner.id);

  return NextResponse.json({
    ok: true,
    role: "owner",
    event_id: owner.event_id
  });
}
