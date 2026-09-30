"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
};

export function AdminSheet({ open, title, description, children, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="admin-sheet-backdrop" onMouseDown={onClose} role="presentation">
      <section className="admin-sheet" role="dialog" aria-modal="true" aria-labelledby="admin-sheet-title" onMouseDown={event => event.stopPropagation()}>
        <div className="admin-sheet__header">
          <div>
            <h2 id="admin-sheet-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="admin-sheet__close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        <div className="admin-sheet__body">{children}</div>
      </section>
    </div>
  );
}
