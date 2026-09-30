"use client";

import type { InvitePartStyle } from "@/lib/invite-builder";
import { partStyleFromConfig } from "@/components/invite/renderer/visual-style";

type Props = {
  parts?: Record<string, InvitePartStyle>;
  busy?: "confirmed" | "declined" | null;
  status?: "pending" | "confirmed" | "declined";
  error?: string;
  preview?: boolean;
  selectedPart?: string | null;
  onPartSelect?: (partId: string) => void;
  onConfirm?: () => void;
  onDecline?: () => void;
};

export function RsvpControlsView({
  parts = {},
  busy = null,
  status = "pending",
  error = "",
  preview = false,
  selectedPart = null,
  onPartSelect,
  onConfirm,
  onDecline,
}: Props) {
  const t = (id: string, fallback: string) => parts[id]?.text || fallback;
  const bind = (id: string) => ({
    "data-part": id,
    "data-editor-part-selected": preview && selectedPart === id ? "true" : undefined,
    style: partStyleFromConfig(parts[id]),
    onClick: preview
      ? (event: React.MouseEvent) => {
          event.stopPropagation();
          onPartSelect?.(id);
        }
      : undefined,
  });

  return (
    <div className="visual-rsvp-controls" {...bind("controls")}>
      <button
        type="button"
        {...bind("yes-button")}
        onClick={preview ? bind("yes-button").onClick : onConfirm}
        disabled={!preview && (!!busy || status === "confirmed")}
        aria-pressed={!preview && status === "confirmed" ? true : undefined}
      >
        <span {...bind("yes-text")}>
          {busy === "confirmed"
            ? "Confirmando..."
            : status === "confirmed"
              ? "Presença confirmada"
              : status === "declined"
                ? "Confirmar presença"
                : t("yes-text", "Confirmar presença")}
        </span>
      </button>

      <button
        type="button"
        {...bind("no-button")}
        onClick={preview ? bind("no-button").onClick : onDecline}
        disabled={!preview && !!busy}
      >
        <span {...bind("no-text")}>
          {busy === "declined"
            ? "Salvando..."
            : status === "declined"
              ? "Ausência registrada"
              : status === "confirmed"
                ? "Alterar para não vou"
                : t("no-text", "Não poderei ir")}
        </span>
      </button>

      <div {...bind("note")}>{t("note", "Sua resposta poderá ser atualizada até a data do evento.")}</div>

      {(error || preview) && (
        <div {...bind("error")} role={preview ? undefined : "alert"}>
          {error || t("error", "Mensagem de erro")}
        </div>
      )}
    </div>
  );
}
