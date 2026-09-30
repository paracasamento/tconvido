"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export function GuestActionModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  busy = false,
  mode = "confirm",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  mode?: "confirm" | "notice";
  onConfirm?: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, busy, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="guest-action-modal-backdrop"
      role="presentation"
      onMouseDown={() => !busy && onClose()}
    >
      <section
        className="guest-action-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-action-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="guest-action-modal-close"
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          disabled={busy}
        >
          <X size={18} />
        </button>

        <div className="guest-action-modal-copy">
          <span className="guest-action-modal-kicker">Lista de presentes</span>
          <h2 id="guest-action-modal-title">{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>

        <div className="guest-action-modal-actions">
          {mode === "confirm" ? (
            <>
              <button
                type="button"
                className="guest-action-modal-button guest-action-modal-button--ghost"
                onClick={onClose}
                disabled={busy}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className="guest-action-modal-button guest-action-modal-button--primary"
                onClick={onConfirm}
                disabled={busy}
              >
                {busy ? "Reservando..." : confirmLabel}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="guest-action-modal-button guest-action-modal-button--primary guest-action-modal-button--full"
              onClick={onClose}
              disabled={busy}
            >
              Entendi
            </button>
          )}
        </div>
      </section>
    </div>,
    document.body
  );
}
