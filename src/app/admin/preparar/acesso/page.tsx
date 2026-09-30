import Link from "next/link";
import { AdminGuestAccessSettings } from "@/components/AdminGuestAccessSettings";
import { SetupStepShell } from "@/components/admin/setup/SetupStepShell";
import { getAdminSetupState } from "@/lib/admin-setup";
import { requireAdmin } from "@/lib/sessions";

export default async function SetupAccessPage() {
  const session = await requireAdmin();
  const setup = await getAdminSetupState(session.event_id);
  const accessReady = setup.steps.find(step => step.id === "access")?.complete;
  const published = setup.event.status !== "draft";

  return (
    <SetupStepShell
      step={2}
      title="Acesso"
      description="Escolha como as pessoas vão entrar no convite."
      steps={setup.steps}
      backHref="/admin/preparar/festa"
      published={published}
    >
      <section className="setup-panel-v6 setup-access-panel-v7">
        <AdminGuestAccessSettings initialMode={setup.event.guest_access_mode} />
      </section>
      {!published && (
        <div className="setup-footer-actions-v6">
          <Link href="/admin/preparar/festa" className="button button--ghost">Voltar</Link>
          {accessReady ? (
            <Link href="/admin/preparar/convidados" className="button button--primary">Continuar</Link>
          ) : (
            <span className="button button--disabled" aria-disabled="true">Escolha o acesso</span>
          )}
        </div>
      )}
    </SetupStepShell>
  );
}
