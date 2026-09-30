"use client";

import type { InvitePartStyle } from "@/lib/invite-builder";
import { partStyleFromConfig } from "@/components/invite/renderer/visual-style";

type Props = {
  parts?: Record<string, InvitePartStyle>;
  title?: string;
  copy?: string;
  preview?: boolean;
  selectedPart?: string | null;
  onPartSelect?: (partId: string) => void;
};

export function RsvpStatusView({
  parts = {},
  title,
  copy,
  preview = false,
  selectedPart = null,
  onPartSelect,
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
    <div className="visual-rsvp-status" {...bind("status-card")}>
      <h2 {...bind("status-title")}>{title || t("status-title", "Presença confirmada")}</h2>
      <p {...bind("status-copy")}>{copy || t("status-copy", "Ficamos felizes em celebrar com você.")}</p>
    </div>
  );
}
