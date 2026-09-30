import { UsersRound } from "lucide-react";
import { AdminGuestCreate } from "@/components/AdminGuestCreate";
import { AdminGuestRow } from "@/components/AdminGuestRow";
import { RsvpSubmissionReview } from "@/components/admin/guests/RsvpSubmissionReview";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/sessions";

export default async function AdminGuestsPage() {
  const session = await requireAdmin("/admin/convidados");
  const sql = db();
  const [guestsResult, eventRowsResult, submissionRowsResult, statsRowsResult] = await Promise.all([
    sql`
      SELECT
        g.id,
        g.name,
        g.rsvp_status,
        g.allowed_adults,
        g.allowed_children,
        g.confirmed_adults,
        g.confirmed_children,
        g.submitted_name,
        g.match_status,
        g.match_score,
        g.needs_review,
        g.reviewed_at,
        '[]'::jsonb AS children_names,
        EXISTS(
          SELECT 1 FROM guest_access_codes c
          WHERE c.guest_id = g.id AND c.revoked_at IS NULL
        ) AS has_code
      FROM admin_guest_overview g
      WHERE g.event_id = ${session.event_id}
      ORDER BY g.name
    `,
    sql`SELECT guest_access_mode FROM events WHERE id = ${session.event_id} LIMIT 1`,
    sql`
      SELECT
        s.id,
        s.submitted_name,
        s.children_count,
        s.match_status,
        s.match_score,
        CASE WHEN g.source = 'admin' THEN s.guest_id ELSE NULL END AS suggested_guest_id,
        CASE WHEN g.source = 'admin' THEN g.name ELSE NULL END AS suggested_guest_name
      FROM rsvp_submissions s
      LEFT JOIN guests g ON g.id = s.guest_id
      WHERE s.event_id = ${session.event_id}
        AND s.needs_review = true
      ORDER BY s.confirmed_at DESC
    `,
    sql`
      SELECT
        count(*)::int AS confirmations,
        COALESCE(sum(children_count),0)::int AS children,
        count(*) FILTER (WHERE needs_review)::int AS review_count
      FROM rsvp_submissions
      WHERE event_id = ${session.event_id}
    `
  ]);
  const guests = guestsResult as any[];
  const submissions = submissionRowsResult as any[];
  const stats = (statsRowsResult[0] as any) || { confirmations: 0, children: 0, review_count: 0 };
  const eventRows = eventRowsResult as Array<{ guest_access_mode?: "event" | "individual" | null }>;
  const accessMode = eventRows[0]?.guest_access_mode || "individual";

  return (
    <main className="admin-page admin-management-page-v6 admin-guests-page-v8">
      <AdminPageHeader
        title="Convidados"
        description={`${guests.length} ${guests.length === 1 ? "pessoa na lista" : "pessoas na lista"}`}
        action={<AdminGuestCreate accessMode={accessMode} />}
      />

      <section className="admin-guest-summary-v8" aria-label="Resumo de convidados">
        <div>
          <strong>{stats.confirmations}</strong>
          <span>Confirmações</span>
        </div>
        <div>
          <strong>{stats.children}</strong>
          <span>Crianças</span>
        </div>
        <div>
          <strong>{stats.review_count}</strong>
          <span>Para revisar</span>
        </div>
      </section>

      {submissions.length > 0 && (
        <section className="admin-list-section-v6" style={{ marginBottom: 16 }}>
          <div className="admin-list-toolbar-v6">
            <strong>Confirmações para verificar</strong>
            <span>O convidado já recebeu a confirmação. Aqui você só vincula o nome à lista oficial.</span>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {submissions.map(submission => (
              <RsvpSubmissionReview
                key={submission.id}
                submission={submission}
                guests={guests.map(guest => ({ id: String(guest.id), name: String(guest.name) }))}
              />
            ))}
          </div>
        </section>
      )}

      <section className="admin-list-section-v6">
        <div className="admin-list-toolbar-v6">
          <strong>Lista de convidados</strong>
          {guests.length > 0 && (
            <span>
              {accessMode === "individual"
                ? "Abra o menu de um convidado para gerenciar presença, senha ou remoção."
                : "Abra o menu de um convidado para gerenciar presença ou remoção."}
            </span>
          )}
        </div>
        <div className="admin-list-v6">
          {guests.map(guest => <AdminGuestRow key={guest.id} guest={guest} accessMode={accessMode} />)}
          {!guests.length && (
            <div className="admin-guests-empty-v8">
              <span className="admin-guests-empty-v8__icon"><UsersRound size={20} /></span>
              <strong>Sua lista está vazia</strong>
              <p>Adicione os convidados para começar a acompanhar confirmações e presença.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
