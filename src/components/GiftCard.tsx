"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GiftCardView } from "@/components/invite/functional/GiftCardView";
import { GuestActionModal } from "@/components/invite/functional/GuestActionModal";
import type { InvitePartStyle } from "@/lib/invite-builder";

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
      mode: "reserve" | "mine" | "notice";
      title: string;
      description?: string;
    };

export function GiftCard({
  gift,
  parts = {},
  preview = false,
  selectedPart = null,
  onSelectPart,
}: {
  gift: GiftUi;
  parts?: Record<string, InvitePartStyle>;
  preview?: boolean;
  selectedPart?: string | null;
  onSelectPart?: (id: string) => void;
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
      mode: "reserve",
      title: \`Reservar “\${gift.name}”?\`,
      description:
        "Ao confirmar, este presente ficará reservado em seu nome e não poderá ser escolhido por outro convidado.",
    });
  }

  function openMine() {
    if (preview || busy || localStatus !== "reserved_by_me") return;

    setModal({
      open: true,
      mode: "mine",
      title: gift.name,
      description:
        "Este é o presente que você escolheu. Se mudar de ideia, pode liberá-lo para outra pessoa.",
    });
  }

  async function reserve() {
    if (preview || busy || localStatus !== "available") return;

    setBusy(true);

    try {
      const response = await fetch(\`/api/gifts/\${gift.id}/reserve\`, {
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
              ? \`Você já escolheu “\${currentName}”\`
              : "Você já possui um presente escolhido",
            description:
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

  async function release() {
    if (preview || busy || localStatus !== "reserved_by_me") return;

    setBusy(true);

    try {
      const response = await fetch("/api/me/reservation", { method: "DELETE" });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setModal({
          open: true,
          mode: "notice",
          title: "Não foi possível liberar",
          description: data.message || "Tente novamente em instantes.",
        });
        return;
      }

      setLocalStatus("available");
      setModal({ open: false });
      router.refresh();
    } catch {
      setModal({
        open: true,
        mode: "notice",
        title: "Não foi possível liberar",
        description: "Verifique sua conexão e tente novamente.",
      });
    } finally {
      setBusy(false);
    }
  }

  function action() {
    if (preview || busy) return;
    if (localStatus === "available") openReserveConfirmation();
    if (localStatus === "reserved_by_me") openMine();
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
        onAction={action}
      />

      {!preview && modal.open ? (
        <GuestActionModal
          open
          mode={modal.mode === "notice" ? "notice" : "confirm"}
          title={modal.title}
          description={modal.description}
          kicker={modal.mode === "mine" ? "Sua escolha" : "Lista de presentes"}
          confirmLabel={modal.mode === "mine" ? "Liberar escolha" : "Reservar presente"}
          cancelLabel={modal.mode === "mine" ? "Manter escolha" : "Agora não"}
          confirmTone={modal.mode === "mine" ? "danger" : "primary"}
          busy={busy}
          onConfirm={
            modal.mode === "reserve"
              ? reserve
              : modal.mode === "mine"
                ? release
                : undefined
          }
          onClose={closeModal}
        />
      ) : null}
    </>
  );
}
