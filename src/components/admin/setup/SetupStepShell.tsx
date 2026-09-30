import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { SetupStep } from "@/lib/admin-setup";
import { SetupProgress } from "@/components/admin/setup/SetupProgress";

type Props = {
  step: number;
  title: string;
  description: string;
  steps: SetupStep[];
  backHref?: string;
  published?: boolean;
  children: React.ReactNode;
};

export function SetupStepShell({ step, title, description, steps, backHref = "/admin", published = false, children }: Props) {
  return (
    <main className="admin-page setup-step-page-v6">
      {published ? (
        <Link href="/admin/convite" className="setup-edit-back"><ChevronLeft size={15} /> Convite</Link>
      ) : (
        <SetupProgress steps={steps} currentStep={step} />
      )}

      <header className="setup-step-header-v6">
        <span className="setup-step-kicker">{published ? "Editar" : `Etapa ${step}`}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>

      <div className="setup-step-content-v6">{children}</div>
    </main>
  );
}
