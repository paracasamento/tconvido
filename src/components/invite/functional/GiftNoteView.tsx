"use client";

import Link from "next/link";
import { InvitePartIcon } from "@/components/invite/InvitePartIcon";
import type { InvitePartStyle } from "@/lib/invite-builder";
import { partStyleFromConfig } from "@/components/invite/renderer/visual-style";

export function GiftNoteView({
  parts = {},
  preview = false,
  selectedPart = null,
  onSelectPart,
}: {
  parts?: Record<string, InvitePartStyle>;
  preview?: boolean;
  selectedPart?: string | null;
  onSelectPart?: (id: string) => void;
}) {
  const bind = (id: string) => ({
    "data-part": id,
    "data-editor-part-selected": preview && selectedPart === id ? "true" : undefined,
    style: partStyleFromConfig(parts[id]),
    onClick: preview
      ? (event: React.MouseEvent) => {
          event.stopPropagation();
          onSelectPart?.(id);
        }
      : undefined,
  });

  const icon = (parts["note-icon"] as InvitePartStyle & { icon?: string })?.icon || "gift";

  return (
    <div {...bind("note")}>
      <span {...bind("note-icon")}>
        <InvitePartIcon name={icon} strokeWidth={1.4} />
      </span>
      <span {...bind("note-text")}>
        {parts["note-text"]?.text || "Ao selecionar um presente, ele ficará reservado em seu nome."}
      </span>
      {preview ? (
        <span {...bind("note-link")}>{parts["note-link"]?.text || "Voltar"}</span>
      ) : (
        <Link {...bind("note-link")} href="/convite">
          {parts["note-link"]?.text || "Voltar"}
        </Link>
      )}
    </div>
  );
}
