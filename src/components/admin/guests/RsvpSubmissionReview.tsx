"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type GuestOption = {
  id: string;
  name: string;
};

type Submission = {
  id: string;
  submitted_name: string;
  children_count: number;
  match_status: "probable" | "unmatched";
  match_score: number | null;
  suggested_guest_id: string | null;
  suggested_guest_name: string | null;
};

export function RsvpSubmissionReview({
  submission,
  guests,
}: {
  submission: Submission;
  guests: GuestOption[];
}) {
  const router = useRouter();
  const [guestId, setGuestId] = useState(submission.suggested_guest_id || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function confirm() {
    if (!guestId || busy) return;
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/rsvp-submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ guest_id: guestId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.message || "Não foi possível confirmar a correspondência.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="guest-state-card" style={{ textAlign: "left" }}>
      <strong style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <AlertTriangle size={16} />
        {submission.match_status === "probable" ? "Verificar nome" : "Vincular confirmação"}
      </strong>

      <p style={{ marginBottom: 4 }}>
        Informado: <strong>{submission.submitted_name}</strong>
      </p>
      <p style={{ marginTop: 0 }}>
        Filhos: <strong>{submission.children_count}</strong>
      </p>

      {submission.suggested_guest_name && (
        <p>
          Sugestão: <strong>{submission.suggested_guest_name}</strong>
          {submission.match_score != null ? ` · ${submission.match_score}%` : ""}
        </p>
      )}

      <label className="admin-field">
        <span>Vincular a convidado</span>
        <select value={guestId} onChange={event => setGuestId(event.target.value)} disabled={busy}>
          <option value="">Selecione...</option>
          {guests.map(guest => (
            <option key={guest.id} value={guest.id}>{guest.name}</option>
          ))}
        </select>
      </label>

      <button className="button button--soft button--small" type="button" onClick={confirm} disabled={busy || !guestId}>
        <CheckCircle2 size={15} />
        {busy ? "Confirmando..." : "Confirmar vínculo"}
      </button>

      {message && <p className="form-error">{message}</p>}
    </article>
  );
}
