import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { GiftCard } from "@/components/GiftCard";
import { InviteCanvas } from "@/components/invite/InviteCanvas";
import { AccessFormView } from "@/components/invite/functional/AccessFormView";
import { CountdownView } from "@/components/invite/functional/CountdownView";
import { GiftGridView } from "@/components/invite/functional/GiftGridView";
import { GiftNoteView } from "@/components/invite/functional/GiftNoteView";
import { RsvpFlowView, type RsvpPreviewState } from "@/components/invite/functional/RsvpFlowView";
import {
  resolveRsvpScenarioScreen,
  type InviteScreen,
  type RsvpScenarioId,
} from "@/lib/invite-builder";
import { getInviteVisualConfig } from "@/lib/invite-builder-server";
import { getInviteEditorPreviewData } from "@/lib/invite-editor-preview";
import { requireOwner } from "@/lib/sessions";

function slotsFor(
  screen: InviteScreen,
  previewData: Awaited<ReturnType<typeof getInviteEditorPreviewData>>,
  rsvpState: RsvpPreviewState
) {
  const slots: Record<string, ReactNode> = {};

  for (const element of screen.elements) {
    if (element.type !== "slot" || !element.slot) continue;

    if (element.slot === "access-form") {
      slots[element.slot] = (
        <AccessFormView
          key={element.id}
          parts={element.partStyles}
          name=""
          code=""
          preview
        />
      );
      continue;
    }

    if (element.slot === "rsvp-flow") {
      slots[element.slot] = (
        <RsvpFlowView
          key={element.id}
          parts={element.partStyles}
          preview
          previewState={rsvpState}
        />
      );
      continue;
    }

    if (element.slot === "gift-grid") {
      slots[element.slot] = previewData.gifts.length ? (
        <GiftGridView key={element.id} parts={element.partStyles} preview>
          {previewData.gifts.map(gift => (
            <GiftCard
              key={gift.id}
              gift={gift}
              preview
              parts={element.partStyles}
            />
          ))}
        </GiftGridView>
      ) : (
        <div className="guest-state-card">
          <h2>A lista ainda está sendo preparada.</h2>
          <p>Volte em breve para conferir as sugestões.</p>
        </div>
      );
      continue;
    }

    if (element.slot === "gift-note") {
      slots[element.slot] = (
        <GiftNoteView
          key={element.id}
          parts={element.partStyles}
          preview
        />
      );
      continue;
    }

    if (element.slot === "countdown") {
      slots[element.slot] = (
        <CountdownView
          key={element.id}
          target={previewData.vars.event_datetime || "2026-11-22T16:00:00-03:00"}
          parts={element.partStyles}
        />
      );
    }
  }

  return slots;
}

export default async function GestaoEditorPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    state?: string;
    rsvp?: string;
  }>;
}) {
  const session = await requireOwner("/gestao/editor/preview");
  const params = await searchParams;

  const [config, previewData] = await Promise.all([
    getInviteVisualConfig(session.event_id),
    getInviteEditorPreviewData(session.event_id),
  ]);

  const page =
    params.page === "access" ||
    params.page === "rsvp" ||
    params.page === "invite-flow"
      ? params.page
      : "cover";

  const state = params.state === "after" ? "after" : "before";

  const allowedRsvp: RsvpPreviewState[] = [
    "children-question",
    "form-no-children",
    "form-children",
    "confirmed",
    "error",
  ];
  const rsvpState = allowedRsvp.includes(params.rsvp as RsvpPreviewState)
    ? (params.rsvp as RsvpPreviewState)
    : "children-question";

  let screens: InviteScreen[] = [];

  if (page === "cover") {
    screens = [config.screens.cover];
  } else if (page === "access") {
    screens = [config.screens.access];
  } else if (page === "rsvp") {
    screens = [
      resolveRsvpScenarioScreen(config, rsvpState as RsvpScenarioId),
    ];
  } else {
    const invite = {
      ...config.screens.invite,
      elements: config.screens.invite.elements
        .filter(element => {
          if (element.id === "invite-gifts") return false;
          if (state === "after" && element.id === "invite-rsvp") return false;
          return true;
        })
        .map(element => {
          if (state === "before" && element.id === "invite-rsvp") {
            return { ...element, x: (100 - element.width) / 2 };
          }
          return element;
        }),
    };

    screens =
      state === "after"
        ? [invite, config.screens.gifts]
        : [invite];
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "72px 24px 60px",
        background: "#171a22",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: "0 0 auto 0",
          zIndex: 1000,
          minHeight: 52,
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          background: "rgba(23,26,34,.94)",
          borderBottom: "1px solid rgba(255,255,255,.10)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link
          href="/gestao/editor"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            color: "#fff",
            textDecoration: "none",
            font: "700 12px Arial, sans-serif",
          }}
        >
          <ArrowLeft size={15} />
          Voltar ao editor
        </Link>

        <span
          style={{
            color: "rgba(255,255,255,.58)",
            font: "600 10px Arial, sans-serif",
          }}
        >
          Preview sem ferramentas de edição
        </span>
      </div>

      <div
        style={{
          width: "min(430px, 100%)",
          margin: "0 auto",
          display: "grid",
          gap: 0,
        }}
      >
        {screens.map((screen, index) => (
          <InviteCanvas
            key={`${screen.id}-${index}`}
            screen={screen}
            vars={previewData.vars}
            slots={slotsFor(screen, previewData, rsvpState)}
          />
        ))}
      </div>
    </main>
  );
}
