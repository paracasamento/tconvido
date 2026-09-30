"use client";

import type { InvitePartStyle } from "@/lib/invite-builder";
import { partStyleFromConfig } from "@/components/invite/renderer/visual-style";

export function GiftGridView({
  children,
  parts = {},
  preview = false,
  selectedPart = null,
  onSelectPart,
  naturalHeight = false,
}: {
  children: React.ReactNode;
  parts?: Record<string, InvitePartStyle>;
  preview?: boolean;
  selectedPart?: string | null;
  onSelectPart?: (id: string) => void;
  naturalHeight?: boolean;
}) {
  const configured = partStyleFromConfig(parts.grid);

  return (
    <div
      data-part="grid"
      data-editor-part-selected={preview && selectedPart === "grid" ? "true" : undefined}
      style={{
        ...configured,
        display: parts.grid?.display === "none" ? "grid" : configured.display,
        opacity: typeof parts.grid?.opacity === "number" && parts.grid.opacity <= 0 ? 1 : configured.opacity,
        ...(naturalHeight ? { height: "auto", minHeight: 0 } : {}),
      }}
      onClick={
        preview
          ? event => {
              if (event.target === event.currentTarget) {
                event.stopPropagation();
                onSelectPart?.("grid");
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
