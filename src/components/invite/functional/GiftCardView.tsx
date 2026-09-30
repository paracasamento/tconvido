"use client";

import Image from "next/image";
import { Heart, LockKeyhole } from "lucide-react";
import { Monogram } from "@/components/Monogram";
import type { GiftUi } from "@/components/GiftCard";
import type { InvitePartStyle } from "@/lib/invite-builder";
import { partStyleFromConfig } from "@/components/invite/renderer/visual-style";

function makeBind(
  parts: Record<string, InvitePartStyle>,
  preview: boolean,
  selectedPart: string | null,
  onSelectPart?: (id: string) => void
) {
  return (id: string) => ({
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
}

export function GiftCardView({
  gift,
  parts = {},
  preview = false,
  selectedPart = null,
  onSelectPart,
  busy = false,
  error = "",
  onAction,
}: {
  gift: GiftUi;
  parts?: Record<string, InvitePartStyle>;
  preview?: boolean;
  selectedPart?: string | null;
  onSelectPart?: (id: string) => void;
  busy?: boolean;
  error?: string;
  onAction?: () => void;
}) {
  const bind = makeBind(parts, preview, selectedPart, onSelectPart);
  const interactive = !preview && gift.status !== "reserved" && Boolean(onAction);
  const specialCardPart =
    gift.status === "reserved_by_me"
      ? "gift-card-mine"
      : gift.status === "reserved"
        ? "gift-card-reserved"
        : null;

  function activateCard() {
    if (interactive && !busy) onAction?.();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (!interactive || busy) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activateCard();
    }
  }

  const stateLabel =
    gift.status === "reserved_by_me"
      ? "Sua escolha"
      : gift.status === "reserved"
        ? "Presente já reservado"
        : \`Escolher \${gift.name}\`;

  return (
    <article
      {...bind("gift-card")}
      data-gift-status={gift.status}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={stateLabel}
      aria-disabled={busy || gift.status === "reserved" ? true : undefined}
      onClick={preview ? bind("gift-card").onClick : activateCard}
      onKeyDown={preview ? undefined : onKeyDown}
      style={{
        minWidth: 0,
        overflow: "hidden",
        cursor: interactive ? "pointer" : undefined,
        ...partStyleFromConfig(parts["gift-card"]),
        ...(specialCardPart ? partStyleFromConfig(parts[specialCardPart]) : {}),
      }}
    >
      <div
        {...bind("gift-media")}
        style={{
          position: "relative",
          minWidth: 0,
          overflow: "hidden",
          flex: "0 0 auto",
          ...partStyleFromConfig(parts["gift-media"]),
        }}
      >
        {gift.image_url ? (
          <Image
            {...bind("gift-image")}
            src={gift.image_url}
            alt={gift.name}
            fill
            sizes="(max-width: 600px) 44vw, 220px"
          />
        ) : (
          <div
            {...bind("gift-image")}
            aria-label="Presente sem foto cadastrada"
          >
            <Monogram size={46} />
          </div>
        )}

        {gift.status === "reserved" ? (
          <span
            {...bind("gift-indicator-reserved")}
            className="gift-state-indicator"
            aria-label="Reservado"
            title="Reservado"
          >
            <LockKeyhole size={14} strokeWidth={1.8} aria-hidden />
          </span>
        ) : null}

        {gift.status === "reserved_by_me" ? (
          <span
            {...bind("gift-indicator-mine")}
            className="gift-state-indicator"
            aria-label="Sua escolha"
            title="Sua escolha"
          >
            <Heart size={14} strokeWidth={1.8} aria-hidden />
          </span>
        ) : null}
      </div>

      <div
        {...bind("gift-content")}
        style={{
          minWidth: 0,
          ...partStyleFromConfig(parts["gift-content"]),
        }}
      >
        <h3 {...bind("gift-title")}>{gift.name}</h3>
        {error ? <p {...bind("gift-error")}>{error}</p> : null}
      </div>
    </article>
  );
}
