"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyInviteLinkButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" className="button button--primary" onClick={copy}>
      {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? "Link copiado" : "Copiar link"}
    </button>
  );
}
