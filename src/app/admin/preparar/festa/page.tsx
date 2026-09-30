import { AdminEventForm } from "@/components/AdminEventForm";
import { SetupStepShell } from "@/components/admin/setup/SetupStepShell";
import { getAdminSetupState } from "@/lib/admin-setup";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/sessions";

export default async function SetupPartyPage() {
  const session = await requireAdmin();
  const sql = db();
  const [rowsResult, setup] = await Promise.all([
    sql`
      SELECT couple_names, title, message, to_char(event_date, 'YYYY-MM-DD') AS event_date,
        to_char(event_time, 'HH24:MI') AS event_time, venue, city, maps_url
      FROM events WHERE id = ${session.event_id} LIMIT 1
    `,
    getAdminSetupState(session.event_id)
  ]);
  const rows = rowsResult as any[];
  const event = rows[0] as any;
  const published = setup.event.status !== "draft";

  return (
    <SetupStepShell
      step={1}
      title="Dados da festa"
      description="O que seus convidados precisam saber."
      steps={setup.steps}
      published={published}
    >
      <AdminEventForm
        event={event}
        afterSaveHref={published ? "/admin/convite" : "/admin/preparar/acesso"}
        submitLabel={published ? "Salvar" : "Salvar e continuar"}
      />
    </SetupStepShell>
  );
}
