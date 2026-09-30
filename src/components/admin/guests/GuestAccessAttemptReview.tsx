"use client";

import { AlertTriangle, ShieldX, UserPlus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { readJsonResponse } from "@/lib/client-response";

type Attempt = {
  id: string;
  submitted_name: string;
  attempt_count: number;
  last_attempt_at: string;
};

export function GuestAccessAttemptReview({ attempt }: { attempt: Attempt }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"add" | "deny" | null>(null);
  const [message, setMessage] = useState("");

  async function resolve(action: "add" | "deny") {
    setBusy(action);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/guest-access-attempts/${attempt.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action })
      });

      const data = await readJsonResponse<{ message?: string }>(response);
      if (!response.ok) {
        setMessage(data.message || "Não foi possível concluir essa ação.");
        return;
      }

      setMessage(
        data.message ||
          (action === "add"
            ? "Adicionado à lista. Avise a pessoa para tentar novamente."
            : "Tentativa ignorada.")
      );

      window.setTimeout(() => router.refresh(), 650);
    } catch {
      setMessage("Não foi possível concluir essa ação. Tente novamente.");
    } finally {
      setBusy(null);
    }
  }

  const attempts = Number(attempt.attempt_count || 1);

  return (
    <article className="guest-access-attempt-v9">
      <div className="guest-access-attempt-v9__icon" aria-hidden="true">
        <AlertTriangle size={18} />
      </div>

      <div className="guest-access-attempt-v9__copy">
        <strong>{attempt.submitted_name}</strong>
        <p>
          Tentou acessar seu convite, mas esse nome não consta na lista de convidados.
        </p>
        {attempts > 1 && <small>{attempts} tentativas registradas</small>}
      </div>

      <div className="guest-access-attempt-v9__actions">
        <button
          type="button"
          className="button button--primary button--small"
          disabled={busy !== null}
          onClick={() => resolve("add")}
        >
          <UserPlus size={15} />
          {busy === "add" ? "Adicionando..." : "Adicionar à lista"}
        </button>

        <button
          type="button"
          className="button button--danger-ghost button--small"
          disabled={busy !== null}
          onClick={() => resolve("deny")}
        >
          <ShieldX size={15} />
          {busy === "deny" ? "Processando..." : "Não permitir"}
        </button>
      </div>

      {message && <p className="guest-access-attempt-v9__message">{message}</p>}
    </article>
  );
}
