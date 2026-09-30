"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppModal } from "@/components/admin/AppModal";

type Status = "draft" | "active" | "closed";

export function EventStatusControl({
  status,
  canActivate = true,
  afterActivateHref
}: {
  status: Status;
  canActivate?: boolean;
  afterActivateHref?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Status | null>(null);

  const copy = pending === "active"
    ? { title: "Publicar o convite?", description: "Assim que publicar, o link ficará disponível para você copiar e enviar aos convidados.", label: "Publicar convite", tone: "default" as const }
    : pending === "closed"
      ? { title: "Pausar o convite?", description: "O link continua o mesmo, mas os convidados não conseguirão acessar enquanto estiver pausado.", label: "Pausar convite", tone: "danger" as const }
      : { title: "Voltar para preparação?", description: "O convite ficará indisponível enquanto você fizer os ajustes.", label: "Voltar para preparação", tone: "default" as const };

  async function update() {
    if (!pending) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/event/status", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: pending })
      });
      if (response.ok) {
        const nextStatus = pending;
        setPending(null);
        if (nextStatus === "active" && afterActivateHref) {
          router.push(afterActivateHref);
          router.refresh();
        } else {
          router.refresh();
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="status-control">
        <span className={`status status--event-${status}`}>
          {status === "draft" ? "Em preparação" : status === "active" ? "Convite ativo" : "Convite pausado"}
        </span>
        {status !== "active" && (
          <button className="button button--primary button--small" disabled={busy || !canActivate} onClick={() => setPending("active")}>
            {status === "closed" ? "Reativar convite" : "Publicar convite"}
          </button>
        )}
        {status === "active" && (
          <button className="button button--danger-ghost button--small" disabled={busy} onClick={() => setPending("closed")}>Pausar convite</button>
        )}
        {status === "closed" && (
          <button className="button button--soft button--small" disabled={busy} onClick={() => setPending("draft")}>Editar antes de publicar</button>
        )}
      </div>
      {!canActivate && status === "draft" && <p className="status-helper">Conclua as etapas pendentes antes de publicar.</p>}
      <AppModal
        open={!!pending}
        title={copy.title}
        description={copy.description}
        confirmLabel={copy.label}
        tone={copy.tone}
        busy={busy}
        onConfirm={update}
        onClose={() => !busy && setPending(null)}
      />
    </>
  );
}
