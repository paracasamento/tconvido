"use client";

import { AlertTriangle, CheckCircle2, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppModal } from "@/components/admin/AppModal";
import { AdminSheet } from "@/components/admin/ui/AdminSheet";
import { readJsonResponse } from "@/lib/client-response";

type Guest = {
  id: string;
  name: string;
  rsvp_status: "pending" | "confirmed" | "declined";
  has_code: boolean;
  allowed_adults: number;
  allowed_children: number;
  confirmed_adults: number;
  confirmed_children: number;
  submitted_name?: string | null;
  match_status?: "exact" | "probable" | null;
  match_score?: number | null;
  needs_review?: boolean;
  reviewed_at?: string | null;
  children_names?: string[];
};

type PendingAction = "code" | "remove" | null;

function statusLabel(status: Guest["rsvp_status"]) {
  if (status === "confirmed") return "Confirmado";
  if (status === "declined") return "Não irá";
  return "Aguardando";
}

export function AdminGuestRow({
  guest,
  accessMode,
  showAccessActions = true,
}: {
  guest: Guest;
  accessMode: "event" | "individual";
  showAccessActions?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [allowedAdults, setAllowedAdults] = useState(Math.max(1, Number(guest.allowed_adults || 1)));
  const [allowedChildren, setAllowedChildren] = useState(Math.max(0, Number(guest.allowed_children || 0)));

  async function regenerate() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/guests/${guest.id}/code`, { method: "POST" });
      const data = await readJsonResponse<{ message?: string; code?: string }>(response);
      if (!response.ok) {
        setMessage(data.message || "Não foi possível gerar a senha.");
        return;
      }
      setNewCode(data.code || null);
      setPendingAction(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function patch(payload: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/guests/${guest.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readJsonResponse<{ message?: string }>(response);
      if (!response.ok) {
        setMessage(data.message || "Não foi possível atualizar o convidado.");
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function setRsvp(status: Guest["rsvp_status"]) {
    await patch({ rsvp_status: status });
  }

  async function saveLimits() {
    await patch({
      allowed_adults: allowedAdults,
      allowed_children: allowedChildren,
    });
  }

  async function approveMatch() {
    if (await patch({ review_match: true })) {
      setMessage("Correspondência confirmada.");
    }
  }

  async function remove() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/guests/${guest.id}`, { method: "DELETE" });
      const data = await readJsonResponse<{ message?: string }>(response);
      if (!response.ok) {
        setMessage(data.message || "Não foi possível remover.");
        return;
      }
      setPendingAction(null);
      setDetailsOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const children = Array.isArray(guest.children_names) ? guest.children_names.filter(Boolean) : [];

  return (
    <>
      <article className="admin-compact-row">
        <div className="admin-compact-row__main">
          <strong>{guest.name}</strong>
          <span className={`status status--rsvp-${guest.rsvp_status}`}>{statusLabel(guest.rsvp_status)}</span>
          {guest.needs_review && (
            <span className="status" style={{ background: "#fff5d8", color: "#7d5a0a", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <AlertTriangle size={12} /> Revisar nome
            </span>
          )}
        </div>
        <button type="button" className="admin-row-menu" onClick={() => setDetailsOpen(true)} aria-label={`Opções de ${guest.name}`}>
          <MoreHorizontal size={20} />
        </button>
      </article>

      <AdminSheet open={detailsOpen} title={guest.name} description="Presença, composição e conferência" onClose={() => !busy && setDetailsOpen(false)}>
        <div className="guest-detail-sheet">
          {guest.needs_review && (
            <div className="guest-state-card" style={{ textAlign: "left" }}>
              <strong style={{ display: "flex", gap: 7, alignItems: "center" }}>
                <AlertTriangle size={17} /> Conferir identidade
              </strong>
              <p style={{ marginBottom: 4 }}>
                Digitado pelo convidado: <strong>{guest.submitted_name || "—"}</strong>
              </p>
              <p style={{ marginTop: 0 }}>
                Cadastro oficial: <strong>{guest.name}</strong>
                {guest.match_score != null ? ` · similaridade ${guest.match_score}%` : ""}
              </p>
              <button className="button button--soft button--small" type="button" onClick={approveMatch} disabled={busy}>
                <CheckCircle2 size={15} /> Confirmar que é a mesma pessoa
              </button>
            </div>
          )}

          <label className="admin-field">
            <span>Presença</span>
            <select value={guest.rsvp_status} disabled={busy} onChange={event => setRsvp(event.target.value as Guest["rsvp_status"])}>
              <option value="pending">Aguardando</option>
              <option value="confirmed">Confirmado</option>
              <option value="declined">Não irá</option>
            </select>
          </label>

          <div className="guest-state-card" style={{ textAlign: "left" }}>
            <strong>Limites deste convite</strong>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <label className="admin-field">
                <span>Adultos</span>
                <input type="number" min={1} max={20} value={allowedAdults} onChange={e => setAllowedAdults(Math.max(1, Number(e.target.value || 1)))} />
              </label>
              <label className="admin-field">
                <span>Crianças</span>
                <input type="number" min={0} max={20} value={allowedChildren} onChange={e => setAllowedChildren(Math.max(0, Number(e.target.value || 0)))} />
              </label>
            </div>
            <button className="button button--soft button--small" type="button" onClick={saveLimits} disabled={busy}>Salvar limites</button>
          </div>

          {guest.rsvp_status === "confirmed" && (
            <div className="guest-state-card" style={{ textAlign: "left" }}>
              <strong>Confirmação atual</strong>
              <p>{guest.confirmed_adults || 0} adulto(s) · {guest.confirmed_children || 0} criança(s)</p>
              {children.length > 0 && (
                <div>
                  <small>Nomes informados</small>
                  <ul>{children.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          {newCode && (
            <div className="credential-mini credential-mini--sheet">
              <span>Nova senha</span>
              <code>{newCode}</code>
              <button className="button button--soft button--small" type="button" onClick={() => navigator.clipboard.writeText(newCode)}>Copiar senha</button>
            </div>
          )}

          {showAccessActions && accessMode === "individual" && (
            <button className="button button--ghost" type="button" onClick={() => setPendingAction("code")} disabled={busy}>
              {guest.has_code ? "Gerar nova senha" : "Criar senha"}
            </button>
          )}

          {message && <p className="form-error">{message}</p>}
          <button className="button button--danger-ghost" type="button" onClick={() => setPendingAction("remove")} disabled={busy}>Remover convidado</button>
        </div>
      </AdminSheet>

      <AppModal
        open={pendingAction === "code"}
        title={`Gerar uma nova senha para ${guest.name}?`}
        description="A senha anterior deixará de funcionar para novos acessos."
        confirmLabel="Gerar nova senha"
        busy={busy}
        onConfirm={regenerate}
        onClose={() => !busy && setPendingAction(null)}
      />
      <AppModal
        open={pendingAction === "remove"}
        title={`Remover ${guest.name}?`}
        description="A pessoa deixará de acessar o convite. Se existir alguma reserva, ela será liberada sem revelar qual presente era."
        confirmLabel="Remover convidado"
        tone="danger"
        busy={busy}
        onConfirm={remove}
        onClose={() => !busy && setPendingAction(null)}
      />
    </>
  );
}
