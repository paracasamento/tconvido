"use client";

import { useEffect, useState } from "react";
import { Copy, KeyRound, RefreshCw } from "lucide-react";
import { AppModal } from "@/components/admin/AppModal";
import { readJsonResponse } from "@/lib/client-response";

type AccessState = {
  mode: "event";
  configured: boolean;
  code?: string | null;
  recoverable?: boolean;
};

export function AdminGuestAccessSettings({ initialMode: _initialMode }: { initialMode: "event" | "individual" }) {
  const [state, setState] = useState<AccessState>({ mode: "event", configured: false });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  async function load() {
    try {
      const response = await fetch("/api/admin/guest-access", { cache: "no-store" });
      const data = await readJsonResponse<AccessState & { message?: string }>(response);
      if (response.ok) setState(data);
      else setMessage(data.message || "Não foi possível carregar o acesso.");
    } catch {
      setMessage("Não foi possível carregar o acesso.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function createOrRotatePassword() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/guest-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "event" }),
      });
      const data = await readJsonResponse<{ message?: string; code?: string }>(response);
      if (!response.ok || !data.code) {
        setMessage(data.message || "Não foi possível gerar a senha do evento.");
        return;
      }
      setState({ mode: "event", configured: true, code: data.code, recoverable: true });
      setModalOpen(false);
    } catch {
      setMessage("Não foi possível gerar a senha do evento.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!state.code) return;
    await navigator.clipboard.writeText(state.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  if (loading) return <div className="access-loading">Carregando...</div>;

  return (
    <>
      <div className="access-configured access-configured-v7">
        <div className="access-current-heading access-current-heading-v7">
          <div>
            <span className="access-current-icon"><KeyRound size={17} /></span>
            <div><small>Acesso atual</small><strong>Senha única do evento</strong></div>
          </div>
        </div>

        <div className={`event-password-card event-password-card-v7 ${state.code ? "has-code" : "needs-migration"}`}>
          <div>
            <span>Senha do convite</span>
            {state.code ? <code>{state.code}</code> : <strong>{state.configured ? "Senha não exibível" : "Ainda não configurada"}</strong>}
          </div>
          <div className="event-password-actions">
            {state.code && (
              <button type="button" className="icon-button" title="Copiar senha" aria-label="Copiar senha" onClick={copyCode}>
                <Copy size={17} />
              </button>
            )}
            <button type="button" className="icon-button" title={state.configured ? "Alterar senha" : "Criar senha"} aria-label={state.configured ? "Alterar senha" : "Criar senha"} onClick={() => setModalOpen(true)}>
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        <p className="access-helper access-helper-v7">
          Todos usam a mesma senha. O nome informado precisa existir na lista e, após o acesso, a sessão fica vinculada somente àquele convidado.
        </p>
        {copied && <p className="form-success access-feedback-v7">Senha copiada.</p>}
        {message && <p className="form-error" role="alert">{message}</p>}
      </div>

      <AppModal
        open={modalOpen}
        title={state.configured ? "Alterar a senha do evento?" : "Criar a senha do evento?"}
        description="Ao gerar uma nova senha, as sessões atuais dos convidados serão encerradas. Cada novo acesso continuará vinculado ao nome escolhido na lista."
        confirmLabel={state.configured ? "Alterar senha" : "Criar senha"}
        busy={busy}
        onConfirm={createOrRotatePassword}
        onClose={() => !busy && setModalOpen(false)}
      />
    </>
  );
}
