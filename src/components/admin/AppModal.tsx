"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onClose: () => void;
};

export function AppModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  busy = false,
  tone = "default",
  onConfirm,
  onClose
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div className="app-modal-backdrop" role="presentation" onMouseDown={() => !busy && onClose()}>
      <section
        className="app-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="app-modal-close" type="button" aria-label="Fechar" onClick={onClose} disabled={busy}>
          <X size={19} />
        </button>
        <div className="app-modal-copy">
          <h2 id="app-modal-title">{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <div className="app-modal-actions">
          <button type="button" className="button button--ghost" onClick={onClose} disabled={busy}>{cancelLabel}</button>
          <button
            type="button"
            className={tone === "danger" ? "button button--danger-ghost" : "button button--primary"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Aguarde..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
