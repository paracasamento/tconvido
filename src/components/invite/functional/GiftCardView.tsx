"use client";

import Image from "next/image";
import { CheckCircle2, Heart, LockKeyhole } from "lucide-react";
import { Monogram } from "@/components/Monogram";
import type { GiftColorPreference, GiftUi } from "@/components/GiftCard";
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
  buttonLabel,
  onAction,
  preferredColors=[],
}: {
  gift: GiftUi;
  parts?: Record<string, InvitePartStyle>;
  preview?: boolean;
  selectedPart?: string | null;
  onSelectPart?: (id: string) => void;
  busy?: boolean;
  error?: string;
  buttonLabel?: string;
  onAction?: () => void;
  preferredColors?: GiftColorPreference[];
}) {
  const bind = makeBind(parts, preview, selectedPart, onSelectPart);

  const statusPart =
    gift.status === "available"
      ? "gift-status-available"
      : gift.status === "reserved_by_me"
        ? "gift-status-mine"
        : "gift-status-reserved";

  const statusText =
    gift.status === "available"
      ? "Disponível"
      : gift.status === "reserved_by_me"
        ? "Escolhido por você"
        : "Reservado";

  const StatusIcon =
    gift.status === "available"
      ? CheckCircle2
      : gift.status === "reserved_by_me"
        ? Heart
        : LockKeyhole;

  const interactive = !preview && gift.status !== "reserved" && Boolean(onAction);

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

  return (
    <article
      {...bind("gift-card")}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `${statusText}: ${gift.name}` : undefined}
      aria-disabled={busy || gift.status === "reserved" ? true : undefined}
      onClick={preview ? bind("gift-card").onClick : activateCard}
      onKeyDown={preview ? undefined : onKeyDown}
      style={{
        minWidth: 0,
        overflow: "hidden",
        cursor: interactive ? "pointer" : undefined,
        ...partStyleFromConfig(parts["gift-card"]),
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
      </div>

      <div
        {...bind("gift-content")}
        style={{
          minWidth: 0,
          ...partStyleFromConfig(parts["gift-content"]),
        }}
      >
        <h3 {...bind("gift-title")}>{gift.name}</h3>

        {preferredColors.length ? <div {...bind("gift-color-row")}>
          <span {...bind("gift-color-label")}>Cor de preferência</span>
          <span {...bind("gift-color-dots")}>
            {preferredColors.map((color,index)=><i key={`${color.hex}-${index}`} {...bind("gift-color-dot")} title={color.name||color.hex} style={{...partStyleFromConfig(parts["gift-color-dot"]),backgroundColor:color.hex}} />)}
          </span>
        </div>:null}

        <span
          {...bind(statusPart)}
          aria-label={statusText}
        >
          <StatusIcon size={15} strokeWidth={1.8} aria-hidden />
          <span>{busy && gift.status === "available" ? "Reservando..." : statusText}</span>
        </span>

        {interactive ? (
          <button
            {...bind("gift-button")}
            type="button"
            disabled={busy}
            onClick={event => {
              event.stopPropagation();
              activateCard();
            }}
          >
            <span {...bind("gift-button-text")}>
              {busy && gift.status === "available"
                ? "Reservando..."
                : gift.status === "reserved_by_me"
                  ? "Ver meu presente"
                  : buttonLabel || "Escolher presente"}
            </span>
          </button>
        ) : null}

        {error ? <p {...bind("gift-error")}>{error}</p> : null}
      </div>
    </article>
  );
}
