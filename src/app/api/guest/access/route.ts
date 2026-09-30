import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getEvent } from "@/lib/event";
import { createInviteSession } from "@/lib/invite-session";
import { isRateLimited, recordFailure } from "@/lib/rate-limit";
import { normalizeName, sameOrigin, verifyGuestCode } from "@/lib/security";
import { createGuestSession } from "@/lib/sessions";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(5).max(40)
});

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  }

  const event = await getEvent();
  if (!event) return NextResponse.json({ message: "Convite indisponível." }, { status: 404 });

  const allowDraft = process.env.ALLOW_DRAFT_GUEST_ACCESS === "true";
  if (event.status !== "active" && !(allowDraft && event.status === "draft")) {
    return NextResponse.json(
      { message: event.status === "closed" ? "Este evento já foi encerrado." : "O convite ainda não está disponível." },
      { status: 403 }
    );
  }

  if (await isRateLimited(request, event.id, "guest_access_failed", 10, 10)) {
    return NextResponse.json({ message: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Preencha seu nome e a senha do convite." }, { status: 400 });
  }

  const sql = db();
  const accessRows = await sql`
    SELECT guest_access_mode, event_access_code_hash
    FROM events
    WHERE id = ${event.id}
    LIMIT 1
  `;
  const access = accessRows[0] as any;
  const mode = (access?.guest_access_mode || "individual") as "event" | "individual";

  if (mode === "event") {
    const valid = access?.event_access_code_hash
      ? await verifyGuestCode(parsed.data.code, access.event_access_code_hash)
      : false;

    if (!valid) {
      await recordFailure(request, event.id, "guest_access_failed");
      return NextResponse.json({ message: "Senha do convite incorreta." }, { status: 401 });
    }

    // A senha é compartilhada, mas a identidade não: o nome precisa existir na
    // lista e a sessão passa a pertencer exclusivamente a esse guest_id.
    const normalized = normalizeName(parsed.data.name);
    const guestMatches = await sql`
      SELECT id, name
      FROM guests
      WHERE event_id = ${event.id}
        AND deleted_at IS NULL
        AND normalized_name = ${normalized}
      LIMIT 2
    `;

    if (guestMatches.length !== 1) {
      const submittedName = parsed.data.name.replace(/\\s+/g, " ").trim();

      await sql`
        INSERT INTO guest_access_attempts (
          event_id,
          submitted_name,
          normalized_name,
          attempt_count,
          status,
          first_attempt_at,
          last_attempt_at,
          updated_at
        )
        VALUES (
          ${event.id},
          ${submittedName},
          ${normalized},
          1,
          'pending',
          now(),
          now(),
          now()
        )
        ON CONFLICT (event_id, normalized_name)
        DO UPDATE SET
          submitted_name = EXCLUDED.submitted_name,
          attempt_count = guest_access_attempts.attempt_count + 1,
          last_attempt_at = now(),
          updated_at = now(),
          status = CASE
            WHEN guest_access_attempts.status = 'added' THEN 'pending'
            ELSE guest_access_attempts.status
          END,
          guest_id = CASE
            WHEN guest_access_attempts.status = 'added' THEN NULL
            ELSE guest_access_attempts.guest_id
          END,
          resolved_at = CASE
            WHEN guest_access_attempts.status = 'added' THEN NULL
            ELSE guest_access_attempts.resolved_at
          END,
          resolved_by = CASE
            WHEN guest_access_attempts.status = 'added' THEN NULL
            ELSE guest_access_attempts.resolved_by
          END
      `;

      await recordFailure(request, event.id, "guest_access_failed");
      return NextResponse.json(
        {
          message:
            "No momento não foi possível acessar. Tente novamente em alguns instantes. Se o erro persistir, entre em contato com a noiva."
        },
        { status: 401 }
      );
    }

    const guestId = String(guestMatches[0].id);
    const officialName = String(guestMatches[0].name || parsed.data.name);
    await createInviteSession(event.id, officialName, guestId);
    await createGuestSession(guestId);

    return NextResponse.json({ ok: true });
  }

  // In individual mode the credential itself owns the identity. The typed name
  // is never allowed to replace the guest attached to the code.
  const candidates = await sql`
    SELECT c.id AS code_id, c.code_hash, c.guest_id, g.name AS guest_name
    FROM guest_access_codes c
    JOIN guests g ON g.id = c.guest_id
    WHERE
      g.event_id = ${event.id}
      AND g.deleted_at IS NULL
      AND c.revoked_at IS NULL
  `;

  let matched: any = null;
  for (const candidate of candidates as any[]) {
    if (await verifyGuestCode(parsed.data.code, candidate.code_hash)) {
      matched = candidate;
      break;
    }
  }

  if (!matched) {
    await recordFailure(request, event.id, "guest_access_failed");
    return NextResponse.json({ message: "Senha do convite incorreta." }, { status: 401 });
  }

  const guestId = String(matched.guest_id);
  const officialName = String(matched.guest_name || "").trim();
  if (!officialName || normalizeName(parsed.data.name) !== normalizeName(officialName)) {
    await recordFailure(request, event.id, "guest_access_failed");
    return NextResponse.json(
      { message: "Nome e senha não correspondem ao mesmo convite." },
      { status: 401 }
    );
  }

  await sql`UPDATE guest_access_codes SET last_used_at = now() WHERE id = ${matched.code_id}`;
  await createInviteSession(event.id, officialName, guestId);
  await createGuestSession(guestId);
  return NextResponse.json({ ok: true });
}
