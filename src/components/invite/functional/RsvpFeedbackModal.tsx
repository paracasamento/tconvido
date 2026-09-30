"use client";

import { CheckCircle2, X, XCircle } from "lucide-react";

type Props = {
  open: boolean;
  kind: "confirmed" | "declined" | "error";
  title: string;
  description?: string;
  autoMessage?: string;
  onClose?: () => void;
};

export function RsvpFeedbackModal({
  open,
  kind,
  title,
  description,
  autoMessage,
  onClose,
}: Props) {
  if (!open) return null;

  const Icon = kind === "confirmed" ? CheckCircle2 : kind === "declined" ? XCircle : XCircle;

  return (
    <div className="guest-rsvp-modal-backdrop" role="presentation">
      <section
        className={`guest-rsvp-modal guest-rsvp-modal--${kind}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-rsvp-modal-title"
      >
        {onClose ? (
          <button
            type="button"
            className="guest-rsvp-modal-close"
            aria-label="Fechar"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        ) : null}

        <div className="guest-rsvp-modal-icon" aria-hidden>
          <Icon size={32} strokeWidth={1.7} />
        </div>

        <p className="guest-rsvp-modal-kicker">Confirmação de presença</p>
        <h2 id="guest-rsvp-modal-title">{title}</h2>

        {description ? (
          <p className="guest-rsvp-modal-copy">{description}</p>
        ) : null}

        {autoMessage ? (
          <p className="guest-rsvp-modal-auto">{autoMessage}</p>
        ) : null}
      </section>
    </div>
  );
}
