import { db } from "@/lib/db";

export type SetupStepId = "party" | "access" | "guests" | "gifts" | "review";

export type SetupStep = {
  id: SetupStepId;
  number: number;
  title: string;
  description: string;
  href: string;
  complete: boolean;
};

export type AdminSetupState = {
  event: {
    id: string;
    slug: string;
    title: string;
    couple_names: string;
    status: "draft" | "active" | "closed";
    guest_access_mode: "event" | "individual";
    event_date: string | null;
    event_time: string | null;
    venue: string | null;
    city: string | null;
  };
  counts: {
    guests: number;
    guestsConfirmed: number;
    guestsPending: number;
    guestsDeclined: number;
    gifts: number;
    giftsReserved: number;
    giftsAvailable: number;
  };
  steps: SetupStep[];
  completedSteps: number;
  progress: number;
  nextStep: SetupStep;
  coreReady: boolean;
};

export async function getAdminSetupState(eventId: string): Promise<AdminSetupState> {
  const sql = db();
  const rows = await sql`
    SELECT
      e.id,
      e.slug,
      e.title,
      e.couple_names,
      e.status,
      e.guest_access_mode,
      e.event_access_code_hash,
      to_char(e.event_date, 'YYYY-MM-DD') AS event_date,
      to_char(e.event_time, 'HH24:MI') AS event_time,
      e.venue,
      e.city,
      (SELECT count(*)::int FROM guests g WHERE g.event_id = e.id AND g.deleted_at IS NULL) AS guests_total,
      (SELECT count(*)::int FROM guests g WHERE g.event_id = e.id AND g.deleted_at IS NULL AND g.rsvp_status = 'confirmed') AS guests_confirmed,
      (SELECT count(*)::int FROM guests g WHERE g.event_id = e.id AND g.deleted_at IS NULL AND g.rsvp_status = 'pending') AS guests_pending,
      (SELECT count(*)::int FROM guests g WHERE g.event_id = e.id AND g.deleted_at IS NULL AND g.rsvp_status = 'declined') AS guests_declined,
      (SELECT count(*)::int FROM gifts gi WHERE gi.event_id = e.id AND gi.deleted_at IS NULL AND gi.is_active = true) AS gifts_total,
      (SELECT count(*)::int FROM reservations r WHERE r.event_id = e.id AND r.released_at IS NULL) AS gifts_reserved,
      (
        SELECT count(*)::int
        FROM guest_access_codes c
        JOIN guests g ON g.id = c.guest_id
        WHERE g.event_id = e.id AND g.deleted_at IS NULL AND c.revoked_at IS NULL
      ) AS active_guest_codes,
      EXISTS (
        SELECT 1
        FROM audit_logs al
        WHERE al.event_id = e.id AND al.action = 'event_updated'
      ) AS party_configured,
      EXISTS (
        SELECT 1
        FROM audit_logs al
        WHERE al.event_id = e.id
          AND al.action IN ('guest_access_mode_event', 'guest_access_mode_individual')
      ) AS access_mode_configured
    FROM events e
    WHERE e.id = ${eventId}
    LIMIT 1
  `;

  if (!rows.length) throw new Error("Evento não encontrado.");
  const row = rows[0] as any;

  const guestCount = Number(row.guests_total || 0);
  const giftCount = Number(row.gifts_total || 0);
  const reservedCount = Number(row.gifts_reserved || 0);
  const previouslyPublished = row.status === "active" || row.status === "closed";

  const partyComplete = Boolean(
    (previouslyPublished || row.party_configured)
    && row.couple_names
    && row.title
    && row.event_date
    && row.event_time
    && row.venue
    && row.city
  );

  /*
   * O acesso usa uma única senha do evento. O nome informado no login precisa
   * existir em guests; depois disso a sessão fica vinculada ao guest_id.
   */
  const accessComplete = Boolean(
    row.guest_access_mode === "event" && row.event_access_code_hash
  );

  const guestsComplete = guestCount > 0;
  const giftsComplete = giftCount > 0;

  const coreReady = partyComplete && accessComplete && guestsComplete && giftsComplete;
  const published = row.status === "active" || row.status === "closed";

  const steps: SetupStep[] = [
    {
      id: "party",
      number: 1,
      title: "Festa",
      description: "Data, horário, local e informações do convite.",
      href: "/admin/preparar/festa",
      complete: partyComplete
    },
    {
      id: "access",
      number: 2,
      title: "Acesso",
      description: "Defina como os convidados entrarão no convite.",
      href: "/admin/preparar/acesso",
      complete: accessComplete
    },
    {
      id: "guests",
      number: 3,
      title: "Convidados",
      description: "Adicione as pessoas que receberão o convite.",
      href: "/admin/preparar/convidados",
      complete: guestsComplete
    },
    {
      id: "gifts",
      number: 4,
      title: "Presentes",
      description: "Monte a lista de presentes.",
      href: "/admin/preparar/presentes",
      complete: giftsComplete
    },
    {
      id: "review",
      number: 5,
      title: published ? "Publicado" : "Publicar",
      description: published ? "Seu convite já está disponível." : "Confira tudo e libere o convite.",
      href: published ? "/admin/convite" : "/admin/preparar/revisao",
      complete: published
    }
  ];

  const completedSteps = steps.filter(step => step.complete).length;
  const nextStep = steps.find(step => !step.complete) || steps[4];

  return {
    event: {
      id: row.id,
      slug: row.slug,
      title: row.title,
      couple_names: row.couple_names,
      status: row.status,
      guest_access_mode: row.guest_access_mode,
      event_date: row.event_date,
      event_time: row.event_time,
      venue: row.venue,
      city: row.city
    },
    counts: {
      guests: guestCount,
      guestsConfirmed: Number(row.guests_confirmed || 0),
      guestsPending: Number(row.guests_pending || 0),
      guestsDeclined: Number(row.guests_declined || 0),
      gifts: giftCount,
      giftsReserved: reservedCount,
      giftsAvailable: Math.max(0, giftCount - reservedCount)
    },
    steps,
    completedSteps,
    progress: Math.round((completedSteps / steps.length) * 100),
    nextStep,
    coreReady
  };
}
