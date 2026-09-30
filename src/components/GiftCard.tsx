"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GiftCardView } from "@/components/invite/functional/GiftCardView";
import { GuestActionModal } from "@/components/invite/functional/GuestActionModal";
import type { InvitePartStyle } from "@/lib/invite-builder";

export type GiftColorPreference={name:string;hex:string};
export type GiftUi = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  status: "available" | "reserved" | "reserved_by_me";
};

type ModalState =
  | { open: false }
  | {
      open: true;
      mode: "confirm" | "notice";
      title: string;
      description?: string;
    };

export function GiftCard({
  gift,
  parts = {},
  preview = false,
  selectedPart = null,
  onSelectPart,
  preferredColors=[],
}: {
  gift: GiftUi;
  parts?: Record<string, InvitePartStyle>;
  preview?: boolean;
  selectedPart?: string | null;
  onSelectPart?: (id: string) => void;
  preferredColors?: GiftColorPreference[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [localStatus, setLocalStatus] = useState<GiftUi["status"]>(gift.status);
  const [modal, setModal] = useState<ModalState>({ open: false });

  useEffect(() => {
    setLocalStatus(gift.status);
  }, [gift.status]);

  const renderedGift: GiftUi = { ...gift, status: localStatus };

  function closeModal() {
    if (busy) return;
    setModal({ open: false });
  }

  function openReserveConfirmation() {
    if (preview || busy || localStatus !== "available") return;

    setModal({
      open: true,
      mode: "confirm",
      title: `Reservar “${gift.name}”?`,
      description:
        "Ao confirmar, este presente ficará reservado em seu nome e não poderá ser escolhido por outro convidado.",
    });
  }

  async function reserve() {
    if (preview || busy || localStatus !== "available") return;

    setBusy(true);

    try {
      const response = await fetch(`/api/gifts/${gift.id}/reserve`, {
        method: "POST",
        headers: { accept: "application/json" },
      });

      const data = await response
        .json()
        .catch(() => ({ message: "Não foi possível concluir a reserva." }));

      if (!response.ok) {
        if (data?.code === "gift_taken") {
          setLocalStatus("reserved");
          setModal({
            open: true,
            mode: "notice",
            title: "Esse presente acabou de ser reservado",
            description:
              data.message || "Outro convidado escolheu este presente antes da sua confirmação.",
          });
          router.refresh();
          return;
        }

        if (data?.code === "guest_has_reservation") {
          const currentName =
            typeof data?.current_gift?.name === "string" && data.current_gift.name
              ? data.current_gift.name
              : "";

          setModal({
            open: true,
            mode: "notice",
            title: currentName
              ? `Você já reservou “${currentName}”`
              : "Você já possui um presente reservado",
            description:
              data.message ||
              "Libere sua escolha atual antes de reservar outro presente.",
          });
          return;
        }

        setModal({
          open: true,
          mode: "notice",
          title: "Não foi possível reservar",
          description: data?.message || "Tente novamente em instantes.",
        });
        return;
      }

      setLocalStatus("reserved_by_me");
      setModal({ open: false });
      router.refresh();
    } catch {
      setModal({
        open: true,
        mode: "notice",
        title: "Não foi possível reservar",
        description: "Verifique sua conexão e tente novamente.",
      });
    } finally {
      setBusy(false);
    }
  }

  function action() {
    if (preview || busy) return;

    if (localStatus === "available") {
      openReserveConfirmation();
      return;
    }

    if (localStatus === "reserved_by_me") {
      router.push("/meu-presente");
    }
  }

  return (
    <>
      <GiftCardView
        gift={renderedGift}
        parts={parts}
        preview={preview}
        selectedPart={selectedPart}
        onSelectPart={onSelectPart}
        busy={busy}
        error=""
        buttonLabel={parts["gift-button-text"]?.text || parts["gift-button"]?.text}
        onAction={action}
        preferredColors={preferredColors}
      />

      {!preview && modal.open ? (
        <GuestActionModal
          open
          mode={modal.mode}
          title={modal.title}
          description={modal.description}
          confirmLabel="Reservar presente"
          cancelLabel="Agora não"
          busy={busy}
          onConfirm={modal.mode === "confirm" ? reserve : undefined}
          onClose={closeModal}
        />
      ) : null}
    </>
  );
}
