"use client";

import { useState } from "react";

export function AdminPasswordForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/admin/password", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      setMessage(response.ok ? "Senha administrativa atualizada." : data.message || "Não foi possível alterar.");
      if (response.ok) e.currentTarget.reset();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="password-form" onSubmit={submit}>
      <input name="current_password" type="password" autoComplete="current-password" placeholder="Senha atual" required />
      <input name="new_password" type="password" autoComplete="new-password" placeholder="Nova senha (mín. 12 caracteres)" required minLength={12} />
      <button className="button button--soft button--small" disabled={busy}>{busy ? "Alterando..." : "Alterar senha"}</button>
      {message && <p className={message.includes("atualizada") ? "form-success" : "form-error"}>{message}</p>}
    </form>
  );
}
