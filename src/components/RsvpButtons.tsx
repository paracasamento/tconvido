"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { InvitePartStyle } from "@/lib/invite-builder";
import { RsvpControlsView } from "@/components/invite/functional/RsvpControlsView";
import { RsvpFeedbackModal } from "@/components/invite/functional/RsvpFeedbackModal";

type Feedback =
  | {
      kind: "confirmed" | "declined" | "error";
      title: string;
      description?: string;
    }
  | null;

export function RsvpButtons({
  redirectTo = "/presentes",
  parts = {},
}: {
  redirectTo?: string;
  compact?: boolean;
  parts?: Record<string, InvitePartStyle>;
}) {
  const router = useRouter();
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [busy, setBusy] = useState<"confirmed" | "declined" | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  async function update(status: "confirmed" | "declined") {
    if (busy) return;

    setBusy(status);
    setError("");
    setFeedback(null);

    try {
      const response = await fetch("/api/me/rsvp", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.message || "Não foi possível salvar sua resposta.";
        setError(message);
        setFeedback({
          kind: "error",
          title: "Não foi possível salvar",
          description: message,
        });
        return;
      }

      if (status === "confirmed") {
        setFeedback({
          kind: "confirmed",
          title: "Presença confirmada",
          description: "Que alegria ter você com a gente!",
        });

        // Mostra o feedback do próprio convite e segue automaticamente.
        redirectTimer.current = setTimeout(() => {
          router.push(redirectTo || "/presentes");
          router.refresh();
        }, 1100);

        return;
      }

      setFeedback({
        kind: "declined",
        title: "Resposta registrada",
        description: "Agradecemos por nos avisar. Você pode alterar sua resposta até a data do evento.",
      });
      router.refresh();
    } catch {
      const message = "Não foi possível salvar sua resposta agora. Tente novamente.";
      setError(message);
      setFeedback({
        kind: "error",
        title: "Não foi possível salvar",
        description: message,
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <RsvpControlsView
        parts={parts}
        busy={busy}
        error=""
        onConfirm={() => update("confirmed")}
        onDecline={() => update("declined")}
      />

      <RsvpFeedbackModal
        open={!!feedback}
        kind={feedback?.kind || "error"}
        title={feedback?.title || ""}
        description={feedback?.description}
        autoMessage={
          feedback?.kind === "confirmed"
            ? "Abrindo a lista de presentes..."
            : undefined
        }
        onClose={
          feedback?.kind === "confirmed"
            ? undefined
            : () => setFeedback(null)
        }
      />
    </>
  );
}
