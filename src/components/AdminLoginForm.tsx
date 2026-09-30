"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { readJsonResponse } from "@/lib/client-response";

export function AdminLoginForm({
  redirectTo = "/admin",
  requiredRole,
  endpoint = "/api/admin/login",
  allowUsername = false
}: {
  redirectTo?: string;
  requiredRole?: "owner" | "admin";
  endpoint?: string;
  allowUsername?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, requiredRole })
      });
      const data = await readJsonResponse<{ message?: string }>(response);
      if (!response.ok) {
        setMessage(data.message || "Não foi possível entrar.");
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setMessage("Não foi possível falar com o servidor. Confira o terminal e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <label>
        <span>{allowUsername ? "Login" : "E-mail"}</span>
        <input
          type={allowUsername ? "text" : "email"}
          autoComplete={allowUsername ? "username" : "email"}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </label>
      <label>
        <span>Senha</span>
        <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
      </label>
      {message && <p className="form-error">{message}</p>}
      <button className="button button--primary" disabled={busy}>
        {busy ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
