"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import type { InvitePartStyle } from "@/lib/invite-builder";
import { partStyleFromConfig } from "@/components/invite/renderer/visual-style";
import styles from "./RsvpFlowView.module.css";

export type RsvpPreviewState =
  | "children-question"
  | "form-no-children"
  | "form-children"
  | "confirmed"
  | "error";

export type CurrentRsvpSubmission = {
  id: string;
  submitted_name: string;
  has_children: boolean;
  children_count: number;
};

type Props = {
  parts?: Record<string, InvitePartStyle>;
  scenarioParts?: Record<string, Record<string, InvitePartStyle>>;
  initialSubmission?: CurrentRsvpSubmission | null;
  identityName?: string;
  preview?: boolean;
  previewState?: RsvpPreviewState;
  selectedPart?: string | null;
  onPartSelect?: (partId: string) => void;
  controlledState?: RsvpPreviewState;
  onStateChange?: (state: RsvpPreviewState) => void;
};

export function RsvpFlowView({
  parts = {},
  scenarioParts = {},
  initialSubmission = null,
  identityName = "",
  preview = false,
  previewState = "children-question",
  selectedPart = null,
  onPartSelect,
  controlledState,
  onStateChange,
}: Props) {
  const [step, setStep] = useState<RsvpPreviewState>(
    preview
      ? previewState
      : initialSubmission
        ? "confirmed"
        : "children-question"
  );
  const [name, setName] = useState(initialSubmission?.submitted_name || identityName || "");
  const [hasChildren, setHasChildren] = useState(initialSubmission?.has_children || false);
  const [childrenCount, setChildrenCount] = useState(
    Math.max(1, initialSubmission?.children_count || 1)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const activeStep = preview ? previewState : (controlledState ?? step);

  function go(next: RsvpPreviewState) {
    setStep(next);
    onStateChange?.(next);
  }

  const partFor = (id: string): InvitePartStyle => ({
    ...(parts[id] || {}),
    ...(scenarioParts[activeStep]?.[id] || {}),
  });

  const t = (id: string, fallback: string) => partFor(id).text || fallback;

  const bind = (id: string) => ({
    "data-part": id,
    "data-editor-part-selected": preview && selectedPart === id ? "true" : undefined,
    style: partStyleFromConfig(partFor(id)),
    onClick: preview
      ? (event: React.MouseEvent) => {
          event.stopPropagation();
          onPartSelect?.(id);
        }
      : undefined,
  });

  function chooseChildren(value: boolean) {
    if (preview) return;
    setHasChildren(value);
    setError("");
    go(value ? "form-children" : "form-no-children");
  }

  function changeChildren(delta: number) {
    if (preview) return;
    setChildrenCount(current => Math.max(1, Math.min(20, current + delta)));
  }

  async function confirmPresence() {
    if (preview || busy) return;

    if (name.trim().length < 2) {
      setError("Informe seu nome e sobrenome.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/me/rsvp", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          submitted_name: name.trim(),
          has_children: hasChildren,
          children_count: hasChildren ? childrenCount : 0,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data.message || "Não foi possível salvar sua confirmação agora.";

        // Validation belongs to the form, not to the technical-error screen.
        if (response.status === 400) {
          setError(message);
          return;
        }

        // An expired invitation session is recoverable by returning to access.
        if (response.status === 401) {
          window.location.assign("/acesso");
          return;
        }

        setError(message);
        go("error");
        return;
      }

      setError("");
      go("confirmed");
    } catch {
      setError("Não foi possível salvar sua confirmação agora.");
      go("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.flow} data-rsvp-scenario={activeStep} {...bind("flow")}>
      {activeStep === "children-question" && (
        <div className={styles.stack}>
          <span {...bind("step-label")}>{t("step-label", "CONFIRMAR PRESENÇA")}</span>
          <h2 {...bind("question-title")}>{t("question-title", "Possui filhos que irão junto?")}</h2>

          <div className={styles.choiceGrid}>
            <button
              type="button"
              {...bind("yes-button")}
              onClick={preview ? bind("yes-button").onClick : () => chooseChildren(true)}
            >
              <span {...bind("yes-text")}>{t("yes-text", "SIM")}</span>
            </button>

            <button
              type="button"
              {...bind("no-button")}
              onClick={preview ? bind("no-button").onClick : () => chooseChildren(false)}
            >
              <span {...bind("no-text")}>{t("no-text", "NÃO")}</span>
            </button>
          </div>
        </div>
      )}

      {(activeStep === "form-no-children" || activeStep === "form-children") && (
        <div className={styles.stack}>
          <span {...bind("step-label")}>{t("step-label", "CONFIRMAR PRESENÇA")}</span>
          <h2 {...bind("form-title")}>{t("form-title", "Confirme sua presença")}</h2>

          <label className={styles.fieldGroup}>
            <span {...bind("name-label")}>{t("name-label", "Nome e sobrenome")}</span>
            <input
              {...bind("name-input")}
              value={preview ? "Marcela Queji" : name}
              onChange={event => !preview && !identityName && setName(event.target.value)}
              placeholder={t("name-input", "Seu nome")}
              autoComplete="name"
              readOnly={!preview && Boolean(identityName)}
            />
          </label>

          {activeStep === "form-children" && (
            <div className={styles.childrenBlock}>
              <span {...bind("children-label")}>{t("children-label", "Quantidade de filhos")}</span>
              <div {...bind("stepper")} className={styles.stepper}>
                <button
                  type="button"
                  {...bind("stepper-button")}
                  onClick={preview ? bind("stepper-button").onClick : () => changeChildren(-1)}
                >
                  <Minus size={17} />
                </button>

                <strong {...bind("stepper-value")}>
                  {preview ? 2 : childrenCount}
                </strong>

                <button
                  type="button"
                  {...bind("stepper-button")}
                  onClick={preview ? bind("stepper-button").onClick : () => changeChildren(1)}
                >
                  <Plus size={17} />
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            {...bind("confirm-button")}
            onClick={preview ? bind("confirm-button").onClick : confirmPresence}
            disabled={!preview && busy}
          >
            <span {...bind("confirm-text")}>
              {busy ? "CONFIRMANDO..." : t("confirm-text", "CONFIRMAR PRESENÇA")}
            </span>
          </button>

          {!preview && error && <p className={styles.inlineError}>{error}</p>}
        </div>
      )}

      {activeStep === "confirmed" && (
        <div className={styles.statusStack}>
          <div {...bind("success-icon")} className={styles.successIcon}>
            <Check size={26} />
          </div>
          <h2 {...bind("success-title")}>{t("success-title", "Presença confirmada")}</h2>
          {hasChildren || (preview && previewState === "confirmed") ? (
            <p {...bind("success-copy-children")}>
              {t("success-copy-children", `Você + ${preview ? 2 : childrenCount} filho(s).`)}
            </p>
          ) : (
            <p {...bind("success-copy")}>
              {t("success-copy", "Obrigado por confirmar. Esperamos você!")}
            </p>
          )}
        </div>
      )}

      {activeStep === "error" && (
        <div className={styles.statusStack} {...bind("error-card")}>
          <h2 {...bind("error-title")}>{t("error-title", "Não foi possível confirmar agora")}</h2>
          <p {...bind("error-copy")}>
            {t("error-copy", "Tente novamente em alguns instantes.")}
          </p>
          <button
            type="button"
            {...bind("retry-button")}
            onClick={preview ? bind("retry-button").onClick : () => {
              setError("");
              go(hasChildren ? "form-children" : "form-no-children");
            }}
          >
            <span {...bind("retry-text")}>{t("retry-text", "TENTAR NOVAMENTE")}</span>
          </button>
        </div>
      )}
    </section>
  );
}
