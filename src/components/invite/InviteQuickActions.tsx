import { Check, Gift } from "lucide-react";

export function InviteQuickActions() {
  return (
    <nav id="acoes" className="public-quick-actions" aria-label="Ações do convite">
      <a href="#presenca" className="public-quick-action public-quick-action--primary">
        <Check size={15} strokeWidth={1.8} />
        <span>Confirmar presença</span>
      </a>
      <a href="#presentes" className="public-quick-action">
        <Gift size={15} strokeWidth={1.8} />
        <span>Ver presentes</span>
      </a>
    </nav>
  );
}
