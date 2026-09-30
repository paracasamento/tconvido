"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, MessageCircle } from "lucide-react";
import { readJsonResponse } from "@/lib/client-response";

type GuestCode = { id: string; name: string; code: string | null };
type AccessData = {
  mode: "event" | "individual";
  configured: boolean;
  code?: string | null;
  codes?: GuestCode[];
};

export function ShareInvitePanel({ coupleNames, paused = false }: { coupleNames: string; paused?: boolean }) {
  const [origin, setOrigin] = useState("");
  const [access, setAccess] = useState<AccessData | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState("");
  const [copied, setCopied] = useState<"link" | "message" | "password" | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/admin/guest-access", { cache: "no-store" })
      .then(response => readJsonResponse<AccessData>(response))
      .then(data => {
        setAccess(data);
        const first = data.codes?.find(row => row.code);
        if (first) setSelectedGuestId(first.id);
      })
      .catch(() => setAccess(null));
  }, []);

  const selectedGuest = useMemo(
    () => access?.codes?.find(row => row.id === selectedGuestId) || null,
    [access, selectedGuestId]
  );

  const message = useMemo(() => {
    if (!origin || !access) return "";
    if (access.mode === "event") {
      return `Oi! 💙\n\nQueremos te convidar para o nosso Chá de Panela!\n\nAcesse o convite pelo link:\n${origin}${access.code ? `\n\nSenha: ${access.code}` : ""}\n\nEsperamos você!\n${coupleNames}`;
    }

    if (!selectedGuest?.code) return "";
    const firstName = selectedGuest.name.split(" ")[0];
    return `Oi, ${firstName}! 💙\n\nQueremos te convidar para o nosso Chá de Panela!\n\nAcesse o convite pelo link:\n${origin}\n\nSua senha: ${selectedGuest.code}\n\nEsperamos você!\n${coupleNames}`;
  }, [origin, access, selectedGuest, coupleNames]);

  async function copy(value: string, type: "link" | "message" | "password") {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1600);
  }

  const recoverableGuests = access?.codes?.filter(row => row.code) || [];

  return (
    <section className="share-invite-panel">
      <div className="share-invite-heading">
        <div>
          <p className="eyebrow">Compartilhar</p>
          <h2>{paused ? "Seu link continua salvo" : "Seu convite está pronto para enviar 💙"}</h2>
          <p>{paused ? "O convite está pausado. Reative antes de enviar para novos convidados." : "Copie o link ou use a mensagem pronta abaixo."}</p>
        </div>
      </div>

      <div className="share-link-box">
        <div><span>Link do convite</span><strong>{origin || "Carregando link..."}</strong></div>
        <div className="share-link-actions">
          <button type="button" className="icon-button" aria-label="Copiar link" title="Copiar link" onClick={() => copy(origin, "link")}>{copied === "link" ? <Check size={18} /> : <Copy size={18} />}</button>
          {origin && <a className="icon-button" aria-label="Abrir convite" title="Abrir convite" href={origin} target="_blank" rel="noreferrer"><ExternalLink size={18} /></a>}
        </div>
      </div>

      {access?.mode === "event" && (
        <div className="share-password-box">
          <div><span>Senha do convite</span>{access.code ? <code>{access.code}</code> : <strong>Gere uma nova senha em Acesso para exibi-la aqui.</strong>}</div>
          {access.code && <button type="button" className="icon-button" aria-label="Copiar senha" title="Copiar senha" onClick={() => copy(access.code!, "password")}>{copied === "password" ? <Check size={18} /> : <Copy size={18} />}</button>}
        </div>
      )}

      {access?.mode === "individual" && (
        <div className="share-guest-picker">
          <label>
            <span>Mensagem para qual convidado?</span>
            <select value={selectedGuestId} onChange={event => setSelectedGuestId(event.target.value)}>
              {recoverableGuests.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
          </label>
          {!recoverableGuests.length && <p>Gere novas senhas individuais na área de Acesso para criar mensagens prontas.</p>}
        </div>
      )}

      {message && (
        <div className="share-message-box">
          <div className="share-message-title"><MessageCircle size={18} /><strong>Mensagem pronta</strong></div>
          <pre>{message}</pre>
          <button type="button" className="button button--primary" onClick={() => copy(message, "message")}>{copied === "message" ? <Check size={18} /> : <Copy size={18} />} {copied === "message" ? "Mensagem copiada" : "Copiar mensagem"}</button>
        </div>
      )}
    </section>
  );
}
