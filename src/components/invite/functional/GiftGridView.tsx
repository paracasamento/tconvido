"use client";

import type { InvitePartStyle } from "@/lib/invite-builder";
import { partStyleFromConfig } from "@/components/invite/renderer/visual-style";

export function GiftGridView({
  children,
  parts = {},
  preview = false,
  selectedPart = null,
  onSelectPart,
}: {
  children: React.ReactNode;
  parts?: Record<string, InvitePartStyle>;
  preview?: boolean;
  selectedPart?: string | null;
  onSelectPart?: (id: string) => void;
}) {
  return (
    <div
      data-part="grid"
      data-editor-part-selected={preview && selectedPart === "grid" ? "true" : undefined}
      style={{
        ...partStyleFromConfig(parts.grid),
        display: parts.grid?.display === "none" ? "grid" : partStyleFromConfig(parts.grid).display,
        opacity: typeof parts.grid?.opacity === "number" && parts.grid.opacity <= 0 ? 1 : partStyleFromConfig(parts.grid).opacity,
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
