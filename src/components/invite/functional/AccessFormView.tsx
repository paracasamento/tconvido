"use client";

import { LockKeyhole, UserRound } from "lucide-react";
import type { FormEvent } from "react";
import type { InvitePartStyle } from "@/lib/invite-builder";
import { partStyleFromConfig } from "@/components/invite/renderer/visual-style";

type Props = {
  parts?: Record<string, InvitePartStyle>;
  name: string;
  code: string;
  message?: string;
  busy?: boolean;
  preview?: boolean;
  selectedPart?: string | null;
  onPartSelect?: (partId: string) => void;
  onNameChange?: (value: string) => void;
  onCodeChange?: (value: string) => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
};

export function AccessFormView({
  parts = {},
  name,
  code,
  message = "",
  busy = false,
  preview = false,
  selectedPart = null,
  onPartSelect,
  onNameChange,
  onCodeChange,
  onSubmit,
}: Props) {
  const t = (id: string, fallback: string) => parts[id]?.text || fallback;
  const bind = (id: string) => ({
    "data-part": id,
    "data-editor-part-selected": preview && selectedPart === id ? "true" : undefined,
    style: partStyleFromConfig(parts[id]),
    onClick: preview
      ? (event: React.MouseEvent) => {
          event.stopPropagation();
          onPartSelect?.(id);
        }
      : undefined,
  });

  return (
    <form
      className="guest-access-form"
      {...bind("form")}
      onSubmit={preview ? event => event.preventDefault() : onSubmit}
      noValidate
    >
      <label>
        <span {...bind("name-label")}>{t("name-label", "Nome do convidado")}</span>
        <div className="guest-field" {...bind("name-field")}>
          <span {...bind("name-icon")}>
            <UserRound size={22} strokeWidth={1.45} />
          </span>
          <input
            {...bind("name-input")}
            autoComplete="name"
            value={preview ? "" : name}
            onChange={preview ? () => {} : event => onNameChange?.(event.target.value)}
            placeholder={t("name-input", "Digite seu nome")}
            tabIndex={preview ? -1 : undefined}
          />
        </div>
      </label>

      <label>
        <span {...bind("code-label")}>{t("code-label", "Código do convite")}</span>
        <div className="guest-field" {...bind("code-field")}>
          <span {...bind("code-icon")}>
            <LockKeyhole size={22} strokeWidth={1.45} />
          </span>
          <input
            {...bind("code-input")}
            autoComplete="one-time-code"
            value={preview ? "" : code}
            onChange={preview ? () => {} : event => onCodeChange?.(event.target.value.toUpperCase())}
            placeholder={t("code-input", "Digite seu código")}
            tabIndex={preview ? -1 : undefined}
          />
        </div>
      </label>

      {(message || (preview && selectedPart === "error")) && (
        <p className="guest-form-error" {...bind("error")} role={preview ? undefined : "alert"}>
          {message || t("error", "Mensagem de erro")}
        </p>
      )}

      <button
        className="guest-main-button"
        {...bind("submit-button")}
        type="submit"
        disabled={busy}
      >
        <span {...bind("submit-text")}>{busy ? "Abrindo..." : t("submit-text", "Abrir convite")}</span>
        <span {...bind("submit-icon")} aria-hidden>
          {t("submit-icon", "›")}
        </span>
      </button>
    </form>
  );
}
