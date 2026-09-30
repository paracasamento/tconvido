import Link from "next/link";
import { Check } from "lucide-react";
import type { SetupStep } from "@/lib/admin-setup";

type Props = {
  steps: SetupStep[];
  currentStep?: number;
};

export function SetupProgress({ steps, currentStep }: Props) {
  return (
    <section className="setup-progress-v6" aria-label="Etapas da configuração">
      <div className="setup-progress-v6__meta">
        <span>Preparação</span>
        <strong>{currentStep || steps.find(step => !step.complete)?.number || steps.length}/{steps.length}</strong>
      </div>
      <nav className="setup-stepper-v6" aria-label="Ir para uma etapa">
        {steps.map(step => {
          const active = currentStep === step.number;
          return (
            <Link
              key={step.id}
              href={step.href}
              className={`setup-stepper-v6__item ${active ? "is-active" : ""} ${step.complete ? "is-complete" : ""}`}
              aria-current={active ? "step" : undefined}
              title={step.title}
            >
              <span className="setup-stepper-v6__dot">{step.complete ? <Check size={11} /> : step.number}</span>
              <span className="setup-stepper-v6__label">{step.title}</span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
