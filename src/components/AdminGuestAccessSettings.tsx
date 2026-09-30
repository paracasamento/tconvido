"use client";

import { useEffect, useState } from "react";
import { Copy, KeyRound, PencilLine, RefreshCw } from "lucide-react";
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
  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState("");
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

  function openPasswordEditor() {
    setPasswordDraft(state.code || "");
    setMessage("");
    setEditingPassword(true);
  }

  async function savePassword(customCode?: string) {
    const code = customCode?.trim();

    if (customCode !== undefined && (!code || code.length < 5 || code.length > 40)) {
      setMessage("A senha precisa ter entre 5 e 40 caracteres.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/guest-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "event",
          ...(code ? { code } : {}),
        }),
      });
      const data = await readJsonResponse<{ message?: string; code?: string }>(response);

      if (!response.ok || !data.code) {
        setMessage(data.message || "Não foi possível salvar a senha do evento.");
        return;
      }

      setState({ mode: "event", configured: true, code: data.code, recoverable: true });
      setPasswordDraft(data.code);
      setEditingPassword(false);
    } catch {
      setMessage("Não foi possível salvar a senha do evento.");
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
            <button type="button" className="icon-button" title={state.configured ? "Personalizar senha" : "Criar senha"} aria-label={state.configured ? "Personalizar senha" : "Criar senha"} onClick={openPasswordEditor}>
              <PencilLine size={17} />
            </button>
          </div>
        </div>

        {editingPassword && (
          <div className="event-password-editor-v8">
            <div className="event-password-editor-v8__heading">
              <strong>{state.configured ? "Personalizar senha" : "Criar senha"}</strong>
              <span>Escolha uma senha fácil de compartilhar com os convidados.</span>
            </div>

            <label className="admin-field">
              <span>Nova senha do convite</span>
              <input
                type="text"
                value={passwordDraft}
                minLength={5}
                maxLength={40}
                autoComplete="off"
                spellCheck={false}
                placeholder="Ex.: PEDROELETICIA"
                disabled={busy}
                onChange={(event) => setPasswordDraft(event.target.value)}
              />
            </label>

            <p className="event-password-editor-v8__hint">
              De 5 a 40 caracteres. Maiúsculas e minúsculas não fazem diferença. Ao alterar a senha, as sessões atuais dos convidados serão encerradas.
            </p>

            <div className="event-password-editor-v8__actions">
              <button
                type="button"
                className="button button--ghost"
                disabled={busy}
                onClick={() => {
                  setEditingPassword(false);
                  setMessage("");
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="button button--ghost"
                disabled={busy}
                onClick={() => void savePassword()}
              >
                <RefreshCw size={15} />
                Gerar automática
              </button>
              <button
                type="button"
                className="button button--primary"
                disabled={busy}
                onClick={() => void savePassword(passwordDraft)}
              >
                {busy ? "Salvando..." : "Salvar senha"}
              </button>
            </div>
          </div>
        )}

        <p className="access-helper access-helper-v7">
          Todos usam a mesma senha. O nome informado precisa existir na lista e, após o acesso, a sessão fica vinculada somente àquele convidado.
        </p>
        {copied && <p className="form-success access-feedback-v7">Senha copiada.</p>}
        {message && <p className="form-error" role="alert">{message}</p>}
      </div>
    </>
  );
}
