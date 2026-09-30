"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GuestActionModal } from "@/components/invite/functional/GuestActionModal";

export function ReleaseGiftButton({
  name,
  className = "button button--danger-ghost",
  label = "Liberar presente",
  redirectTo = "/convite",
}: {
  name: string;
  className?: string;
  label?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function release() {
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/me/reservation", { method: "DELETE" });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || "Não foi possível liberar este presente.");
        return;
      }

      setOpen(false);
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Não foi possível liberar este presente agora.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className={className}
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        disabled={busy}
      >
        {busy ? "Liberando..." : label}
      </button>

      <GuestActionModal
        open={open}
        mode={error ? "notice" : "confirm"}
        title={error ? "Não foi possível liberar" : `Liberar “${name}”?`}
        description={
          error ||
          "Ao liberar, o presente voltará a ficar disponível para os outros convidados."
        }
        confirmLabel="Liberar presente"
        cancelLabel="Manter reserva"
        busy={busy}
        onConfirm={error ? undefined : release}
        onClose={() => !busy && setOpen(false)}
      />
    </>
  );
}
