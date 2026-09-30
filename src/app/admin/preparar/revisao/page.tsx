import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, CircleAlert, Eye } from "lucide-react";
import { EventStatusControl } from "@/components/EventStatusControl";
import { SetupStepShell } from "@/components/admin/setup/SetupStepShell";
import { getAdminSetupState } from "@/lib/admin-setup";
import { requireAdmin } from "@/lib/sessions";

export default async function SetupReviewPage() {
  const session = await requireAdmin();
  const setup = await getAdminSetupState(session.event_id);

  if (setup.event.status !== "draft") redirect("/admin/convite");

  const checklist = setup.steps.slice(0, 4);

  return (
    <SetupStepShell
      step={5}
      title="Publicar"
      description="Confira e libere o convite."
      steps={setup.steps}
      backHref="/admin/preparar/presentes"
    >
      <section className="review-checklist-v6">
        {checklist.map(step => (
          <Link key={step.id} href={step.href} className={`review-check-v6 ${step.complete ? "is-complete" : "is-missing"}`}>
            <span>{step.complete ? <Check size={17} /> : <CircleAlert size={17} />}</span>
            <div><strong>{step.title}</strong><small>{step.complete ? "Pronto" : "Falta concluir"}</small></div>
          </Link>
        ))}
      </section>

      <div className="review-actions-v6">
        <Link href="/admin/preview" className="button button--ghost"><Eye size={18} /> Ver prévia</Link>
        <div className="review-publish-v6">
          <div>
            <strong>{setup.coreReady ? "Tudo pronto" : "Ainda há pendências"}</strong>
            <span>{setup.coreReady ? "Publique para receber o link e a mensagem pronta para envio." : "Abra as etapas marcadas acima e conclua o que falta."}</span>
          </div>
          <EventStatusControl status={setup.event.status} canActivate={setup.coreReady} afterActivateHref="/admin/convite" />
        </div>
      </div>
    </SetupStepShell>
  );
}
