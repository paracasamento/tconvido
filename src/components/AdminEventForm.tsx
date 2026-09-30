"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { readJsonResponse } from "@/lib/client-response";

type Props = {
  event: {
    couple_names: string;
    title: string;
    message: string | null;
    event_date: string;
    event_time: string;
    venue: string;
    city: string;
    maps_url: string | null;
  };
  afterSaveHref?: string;
  submitLabel?: string;
};

export function AdminEventForm({ event, afterSaveHref, submitLabel = "Salvar alterações" }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      const response = await fetch("/api/admin/event", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await readJsonResponse<{ message?: string }>(response);
      setMessage(response.ok ? "Informações salvas." : data.message || "Não foi possível salvar.");
      if (response.ok) {
        if (afterSaveHref) router.push(afterSaveHref);
        else router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-card admin-form-wide admin-event-form-v6" onSubmit={submit}>
      <label><span>Nomes do casal</span><input name="couple_names" defaultValue={event.couple_names} placeholder="Ex.: Pedro & Letícia" required /></label>
      <label><span>Nome do evento</span><input name="title" defaultValue={event.title} required /></label>
      <label><span>Mensagem</span><textarea name="message" defaultValue={event.message || ""} rows={3} /></label>
      <div className="form-grid">
        <label><span>Data</span><input name="event_date" type="date" defaultValue={event.event_date} required /></label>
        <label><span>Horário</span><input name="event_time" type="time" defaultValue={event.event_time} required /></label>
      </div>
      <label><span>Local</span><input name="venue" defaultValue={event.venue} required /></label>
      <label><span>Cidade</span><input name="city" defaultValue={event.city} required /></label>
      <label><span>Link da localização</span><input name="maps_url" type="url" defaultValue={event.maps_url || ""} placeholder="https://..." /></label>
      <button className="button button--primary" disabled={busy}>{busy ? "Salvando..." : submitLabel}</button>
      {message && <p className={message.includes("salvas") ? "form-success" : "form-error"}>{message}</p>}
    </form>
  );
}
