import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getInviteSession } from "@/lib/invite-session";
import { normalizeName, sameOrigin } from "@/lib/security";
import {
  clearRsvpSubmissionSession,
  createGuestSession,
  createRsvpSubmissionSession,
  getGuestSession,
  getRsvpSubmissionSession,
} from "@/lib/sessions";

const schema = z.object({
  submitted_name: z.string().trim().min(2).max(120),
  has_children: z.boolean(),
  children_count: z.number().int().min(0).max(20),
}).superRefine((value, ctx) => {
  if (!value.has_children && value.children_count !== 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["children_count"],
      message: "Quantidade inválida.",
    });
  }
  if (value.has_children && value.children_count < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["children_count"],
      message: "Informe a quantidade de filhos.",
    });
  }
});

export async function PUT(request: Request) {
  try {
    if (!sameOrigin(request)) {
      return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
    }

    const invite = await getInviteSession();
    if (!invite) {
      return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
    }

    const sql = db();
    const eventRows = await sql`
      SELECT status, guest_access_mode
      FROM events
      WHERE id = ${invite.event_id}
      LIMIT 1
    `;
    const event = eventRows[0] as any;
    if (!event || event.status !== "active") {
      return NextResponse.json(
        { message: "Este convite não está recebendo confirmações agora." },
        { status: 403 }
      );
    }

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "Confira os dados informados." },
        { status: 400 }
      );
    }

    const guestSession = await getGuestSession();
    if (
      !guestSession ||
      guestSession.event_id !== invite.event_id ||
      !invite.guest_id ||
      invite.guest_id !== guestSession.guest_id
    ) {
      return NextResponse.json(
        { message: "Entre novamente com seu nome e a senha do convite." },
        { status: 401 }
      );
    }

    const guestRows = await sql`
      SELECT id, name
      FROM guests
      WHERE id = ${guestSession.guest_id}
        AND event_id = ${invite.event_id}
        AND deleted_at IS NULL
      LIMIT 1
    `;
    if (!guestRows.length) {
      return NextResponse.json(
        { message: "Convidado não encontrado. Entre novamente." },
        { status: 401 }
      );
    }

    const guest = guestRows[0] as any;
    const guestId = String(guest.id);
    const submittedName = String(guest.name).replace(/\s+/g, " ").trim();
    const childrenCount = parsed.data.has_children ? parsed.data.children_count : 0;

    // The authenticated guest_id is authoritative. The name typed in the form
    // cannot redirect a confirmation to another guest or create a new identity.
    const submissionRows = await sql`
      INSERT INTO rsvp_submissions (
        event_id,
        guest_id,
        submitted_name,
        normalized_name,
        has_children,
        children_count,
        match_status,
        match_score,
        needs_review,
        confirmed_at
      )
      VALUES (
        ${invite.event_id},
        ${guestId},
        ${submittedName},
        ${normalizeName(submittedName)},
        ${parsed.data.has_children},
        ${childrenCount},
        'exact',
        100,
        false,
        now()
      )
      ON CONFLICT (event_id, guest_id) WHERE guest_id IS NOT NULL
      DO UPDATE SET
        submitted_name = EXCLUDED.submitted_name,
        normalized_name = EXCLUDED.normalized_name,
        has_children = EXCLUDED.has_children,
        children_count = EXCLUDED.children_count,
        match_status = 'exact',
        match_score = 100,
        needs_review = false,
        reviewed_at = NULL,
        reviewed_by = NULL,
        confirmed_at = now(),
        updated_at = now()
      RETURNING id
    `;
    const submissionId = String((submissionRows[0] as any).id);

    const existingSubmissionSession = await getRsvpSubmissionSession();
    if (existingSubmissionSession?.submission_id !== submissionId) {
      if (existingSubmissionSession) await clearRsvpSubmissionSession();
      await createRsvpSubmissionSession(submissionId);
    }

    await sql`
      UPDATE guests
      SET
        rsvp_status = 'confirmed',
        rsvp_updated_at = now(),
        submitted_name = ${submittedName},
        match_status = 'exact',
        match_score = 100,
        needs_review = false,
        reviewed_at = NULL,
        reviewed_by = NULL,
        confirmed_adults = 1,
        confirmed_children = ${childrenCount},
        updated_at = now()
      WHERE id = ${guestId}
        AND event_id = ${invite.event_id}
        AND deleted_at IS NULL
    `;

    // Rotate the authenticated session so there is only one active browser
    // session for this identity after confirmation.
    await createGuestSession(guestId);

    return NextResponse.json({
      ok: true,
      submission: {
        id: submissionId,
        submitted_name: submittedName,
        has_children: parsed.data.has_children,
        children_count: childrenCount,
      },
    });
  } catch (error) {
    console.error("[RSVP_CONFIRMATION_ERROR]", error);
    return NextResponse.json(
      { message: "Não foi possível concluir a confirmação agora." },
      { status: 500 }
    );
  }
}
