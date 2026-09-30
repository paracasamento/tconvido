import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminLog } from "@/lib/admin-log";
import {
  createGuestCode,
  protectGuestCode,
  normalizeName,
  randomToken,
  hashToken,
  sameOrigin
} from "@/lib/security";
import { getAdminSession } from "@/lib/sessions";

const schema = z.object({
  names: z.array(z.string().trim().min(2).max(120)).min(1).max(500),
  allowed_adults: z.number().int().min(1).max(20).default(1),
  allowed_children: z.number().int().min(0).max(20).default(0)
});

type PreparedGuest = {
  name: string;
  normalized_name: string;
  code: string | null;
  code_hash: string | null;
  link_token_hash: string | null;
};

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Informe pelo menos um nome válido. O limite por importação é 500 convidados." }, { status: 400 });
  }

  const unique = new Map<string, string>();
  const duplicatedInInput: string[] = [];
  for (const raw of parsed.data.names) {
    const name = raw.replace(/\s+/g, " ").trim();
    const normalized = normalizeName(name);
    if (unique.has(normalized)) {
      duplicatedInInput.push(name);
      continue;
    }
    unique.set(normalized, name);
  }

  const sql = db();
  const normalizedNames = [...unique.keys()];
  const existingRows = normalizedNames.length
    ? await sql`
        SELECT normalized_name
        FROM guests
        WHERE
          event_id = ${session.event_id}
          AND deleted_at IS NULL
          AND normalized_name IN (
            SELECT jsonb_array_elements_text(${JSON.stringify(normalizedNames)}::jsonb)
          )
      `
    : [];
  const existing = new Set((existingRows as any[]).map(row => row.normalized_name as string));

  const eventRows = (await sql`
    SELECT
      guest_access_mode,
      EXISTS (
        SELECT 1 FROM audit_logs al
        WHERE al.event_id = events.id
          AND al.action IN ('guest_access_mode_event', 'guest_access_mode_individual')
      ) AS access_configured
    FROM events
    WHERE id = ${session.event_id}
    LIMIT 1
  `) as Array<{ guest_access_mode?: "event" | "individual" | null; access_configured?: boolean }>;
  const mode = eventRows[0]?.guest_access_mode || "individual";
  const accessConfigured = Boolean(eventRows[0]?.access_configured);

  const prepared: PreparedGuest[] = [];
  const skippedExisting: string[] = [];
  for (const [normalized, name] of unique.entries()) {
    if (existing.has(normalized)) {
      skippedExisting.push(name);
      continue;
    }

    const code = accessConfigured && mode === "individual" ? createGuestCode() : null;
    prepared.push({
      name,
      normalized_name: normalized,
      code,
      code_hash: code ? protectGuestCode(code) : null,
      link_token_hash: code ? hashToken(randomToken(18)) : null
    });
  }

  if (!prepared.length) {
    return NextResponse.json({
      created: [],
      skipped: [...duplicatedInInput, ...skippedExisting],
      access_mode: mode
    });
  }

  const payload = prepared.map(({ code: _code, ...row }) => row);
  const rows = await sql`
    WITH input AS (
      SELECT *
      FROM jsonb_to_recordset(${JSON.stringify(payload)}::jsonb)
        AS x(name text, normalized_name text, code_hash text, link_token_hash text)
    ),
    new_guests AS (
      INSERT INTO guests (event_id, name, normalized_name, source)
      SELECT ${session.event_id}, i.name, i.normalized_name, 'admin'
      FROM input i
      ON CONFLICT DO NOTHING
      RETURNING id, name, normalized_name
    ),
    new_codes AS (
      INSERT INTO guest_access_codes (guest_id, code_hash, link_token_hash)
      SELECT g.id, i.code_hash, i.link_token_hash
      FROM new_guests g
      JOIN input i ON i.normalized_name = g.normalized_name
      WHERE i.code_hash IS NOT NULL
    )
    SELECT id, name, normalized_name
    FROM new_guests
    ORDER BY name
  `;

  const codeByNormalized = new Map(prepared.map(row => [row.normalized_name, row.code]));
  const created = (rows as any[]).map(row => ({
    id: row.id as string,
    name: row.name as string,
    code: codeByNormalized.get(row.normalized_name as string) || null
  }));

  const createdNormalized = (rows as any[]).map(row => String(row.normalized_name));
  if (createdNormalized.length) {
    await sql`
      UPDATE guest_access_attempts a
      SET
        status = 'added',
        guest_id = g.id,
        resolved_at = now(),
        resolved_by = ${session.admin_id},
        updated_at = now()
      FROM guests g
      WHERE a.event_id = ${session.event_id}
        AND a.status IN ('pending','denied')
        AND g.event_id = ${session.event_id}
        AND g.deleted_at IS NULL
        AND g.normalized_name = a.normalized_name
        AND a.normalized_name IN (
          SELECT jsonb_array_elements_text(${JSON.stringify(createdNormalized)}::jsonb)
        )
    `;
  }

  await adminLog({
    eventId: session.event_id,
    adminId: session.admin_id,
    action: "guests_bulk_created",
    entityType: "guest",
    entityId: session.event_id,
    metadata: { count: created.length, access_mode: mode }
  });

  return NextResponse.json({
    created,
    skipped: [...duplicatedInInput, ...skippedExisting],
    access_mode: mode
  });
}
