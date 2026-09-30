"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GiftCardView } from "@/components/invite/functional/GiftCardView";
import { GuestActionModal } from "@/components/invite/functional/GuestActionModal";
import type { InvitePartStyle } from "@/lib/invite-builder";

export type GiftColorPreference = { name: string; hex: string };

export type GiftUi = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  status: "available" | "reserved" | "reserved_by_me";
  colors?: GiftColorPreference[];
};

type ModalState =
  | { open: false }
  | { open: true; mode: "reserve" | "mine" | "notice"; title: string; description?: string };

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

  useEffect(() => setLocalStatus(gift.status), [gift.status]);

  const renderedGift: GiftUi = { ...gift, status: localStatus };

  function closeModal() {
    if (!busy) setModal({ open: false });
  }

  function openReserveConfirmation() {
    if (preview || busy || localStatus !== "available") return;
    setModal({
      open: true,
      mode: "reserve",
      title: `Reservar “${gift.name}”?`,
      description: "Você pode escolher mais de um presente. Esta escolha ficará registrada em seu nome.",
    });
  }

  function openMine() {
    if (preview || busy || localStatus !== "reserved_by_me") return;
    setModal({
      open: true,
      mode: "mine",
      title: gift.name,
      description: "Este presente está entre as suas escolhas. Se mudar de ideia, você pode liberar somente este item.",
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
      const data = await response.json().catch(() => ({ message: "Não foi possível concluir a reserva." }));

      if (!response.ok) {
        if (data?.code === "gift_taken") {
          setLocalStatus("reserved");
          setModal({
            open: true,
            mode: "notice",
            title: "Este presente ficou indisponível",
            description: data.message || "As unidades disponíveis acabaram de ser escolhidas.",
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
      const response = await fetch(`/api/me/reservation?gift_id=${encodeURIComponent(gift.id)}`, { method: "DELETE" });
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
          confirmLabel={modal.mode === "mine" ? "Liberar este presente" : "Reservar presente"}
          cancelLabel={modal.mode === "mine" ? "Manter escolha" : "Agora não"}
          confirmTone={modal.mode === "mine" ? "danger" : "primary"}
          busy={busy}
          onConfirm={modal.mode === "reserve" ? reserve : modal.mode === "mine" ? release : undefined}
          onClose={closeModal}
        />
      ) : null}
    </>
  );
}
