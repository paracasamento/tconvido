import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { AdminSetupState } from "@/lib/admin-setup";
import { SetupProgress } from "@/components/admin/setup/SetupProgress";

export function SetupOverview({ state, adminName }: { state: AdminSetupState; adminName: string }) {
  return (
    <main className="admin-page setup-overview-page setup-overview-page-v7">
      <header className="setup-overview-header-v7">
        <span>Olá, {adminName}</span>
        <h1>Prepare seu convite</h1>
        <p>Complete as etapas e publique quando estiver tudo pronto.</p>
      </header>

      <SetupProgress steps={state.steps} currentStep={state.nextStep.number} />

      <section className="setup-next-card-v7">
        <div>
          <small>Agora</small>
          <strong>{state.nextStep.title}</strong>
          <span>{state.nextStep.description}</span>
        </div>
        <Link href={state.nextStep.href} className="button button--primary">
          {state.completedSteps ? "Continuar" : "Começar"}<ArrowRight size={15} />
        </Link>
      </section>

      <section className="setup-overview-list-v7" aria-label="Etapas">
        {state.steps.map(step => (
          <Link key={step.id} href={step.href} className={`setup-overview-row-v7 ${step.complete ? "is-complete" : ""}`}>
            <span>{step.complete ? <Check size={13} /> : step.number}</span>
            <strong>{step.title}</strong>
          </Link>
        ))}
      </section>
    </main>
  );
}
