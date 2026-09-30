import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminGuestCreate } from "@/components/AdminGuestCreate";
import { AdminGuestRow } from "@/components/AdminGuestRow";
import { SetupStepShell } from "@/components/admin/setup/SetupStepShell";
import { getAdminSetupState } from "@/lib/admin-setup";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/sessions";

export default async function SetupGuestsPage() {
  const session = await requireAdmin();
  const sql = db();
  const [guestsResult, setup] = await Promise.all([
    sql`
      SELECT g.id, g.name, g.rsvp_status,
        EXISTS(SELECT 1 FROM guest_access_codes c WHERE c.guest_id = g.id AND c.revoked_at IS NULL) AS has_code
      FROM admin_guest_overview g
      WHERE g.event_id = ${session.event_id}
      ORDER BY g.name
    `,
    getAdminSetupState(session.event_id)
  ]);
  const guests = guestsResult as any[];
  if (setup.event.status !== "draft") redirect("/admin/convidados");

  return (
    <SetupStepShell
      step={3}
      title="Convidados"
      description="Adicione quem vai receber o convite."
      steps={setup.steps}
      backHref="/admin/preparar/acesso"
    >
      <section className="setup-action-card-v6">
        <div>
          <strong>{guests.length ? `${guests.length} ${guests.length === 1 ? "convidado" : "convidados"}` : "Nenhum convidado ainda"}</strong>
          <span>{setup.event.guest_access_mode === "individual" ? "As senhas individuais são criadas automaticamente ao adicionar cada pessoa." : "Todos usarão a senha única definida na etapa anterior."}</span>
        </div>
        <AdminGuestCreate accessMode={setup.event.guest_access_mode} />
      </section>

      {!!guests.length && (
        <section className="setup-list-preview-v6">
          <div className="setup-list-preview-v6__heading">
            <strong>Adicionados</strong>
            <Link href="/admin/convidados">Ver todos</Link>
          </div>
          <div className="admin-list-v6">
            {guests.slice(0, 4).map(guest => (
              <AdminGuestRow key={guest.id} guest={guest} accessMode={setup.event.guest_access_mode} showAccessActions={false} />
            ))}
          </div>
        </section>
      )}

      <div className="setup-footer-actions-v6">
        <Link href="/admin/preparar/acesso" className="button button--ghost">Voltar</Link>
        {guests.length ? (
          <Link href="/admin/preparar/presentes" className="button button--primary">Continuar</Link>
        ) : (
          <span className="button button--disabled" aria-disabled="true">Adicione alguém</span>
        )}
      </div>
    </SetupStepShell>
  );
}
