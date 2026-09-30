"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { readJsonResponse } from "@/lib/client-response";
import type { InvitePartStyle } from "@/lib/invite-builder";
import { AccessFormView } from "@/components/invite/functional/AccessFormView";

export function AccessForm({
  parts = {},
  redirectTo = "/convite",
}: {
  parts?: Record<string, InvitePartStyle>;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!name.trim()) {
      setMessage("Informe seu nome para continuar.");
      return;
    }

    if (!code.trim()) {
      setMessage("Informe o código do convite para continuar.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/guest/access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), code: code.trim().toUpperCase() }),
      });
      const data = await readJsonResponse<{ message?: string }>(response);
      if (!response.ok) {
        setMessage(data.message || "Não foi possível acessar o convite.");
        return;
      }
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setMessage("Não foi possível acessar agora. Tente novamente em instantes.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AccessFormView
      parts={parts}
      name={name}
      code={code}
      message={message}
      busy={busy}
      onNameChange={setName}
      onCodeChange={setCode}
      onSubmit={submit}
    />
  );
}
