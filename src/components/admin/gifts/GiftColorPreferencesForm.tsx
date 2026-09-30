"use client";

import { Palette, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { readJsonResponse } from "@/lib/client-response";

export type GiftColorPreference = {
  name: string;
  hex: string;
};

export function GiftColorPreferencesForm({
  initialColors,
}: {
  initialColors: GiftColorPreference[];
}) {
  const [colors, setColors] = useState<GiftColorPreference[]>(
    initialColors.map(color => ({
      name: color.name || "",
      hex: /^#[0-9A-Fa-f]{6}$/.test(color.hex) ? color.hex : "#0F0A71",
    }))
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function update(index: number, patch: Partial<GiftColorPreference>) {
    setColors(items =>
      items.map((item, current) =>
        current === index ? { ...item, ...patch } : item
      )
    );
  }

  function addColor() {
    if (colors.length >= 12) return;
    setColors(items => [...items, { name: "", hex: "#0F0A71" }]);
  }

  function removeColor(index: number) {
    setColors(items => items.filter((_, current) => current !== index));
  }

  async function save() {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/gift-preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ colors }),
      });

      const data = await readJsonResponse<{
        message?: string;
        colors?: GiftColorPreference[];
      }>(response);

      if (!response.ok) {
        setMessage(data.message || "Não foi possível salvar as preferências.");
        return;
      }

      if (Array.isArray(data.colors)) setColors(data.colors);
      setMessage("Cores de preferência salvas.");
    } catch {
      setMessage("Não foi possível salvar as preferências.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="gift-preferences-admin">
      <div className="gift-preferences-admin__heading">
        <span className="gift-preferences-admin__icon">
          <Palette size={18} />
        </span>
        <div>
          <strong>Cores de preferência</strong>
          <p>
            Preferências gerais para a lista. Não ficam vinculadas a um presente específico.
          </p>
        </div>
      </div>

      <div className="gift-preferences-admin__list">
        {colors.map((color, index) => (
          <div className="gift-preferences-admin__row" key={index}>
            <input
              type="color"
              value={color.hex}
              onChange={event => update(index, { hex: event.target.value.toUpperCase() })}
              aria-label={`Cor ${index + 1}`}
            />
            <input
              type="text"
              value={color.name}
              maxLength={40}
              placeholder="Nome opcional, ex.: Azul-marinho"
              onChange={event => update(index, { name: event.target.value })}
            />
            <button
              type="button"
              onClick={() => removeColor(index)}
              aria-label="Remover cor"
              title="Remover cor"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {!colors.length && (
          <p className="gift-preferences-admin__empty">
            Nenhuma preferência definida. Isso é opcional.
          </p>
        )}
      </div>

      <div className="gift-preferences-admin__actions">
        <button
          type="button"
          className="button button--ghost button--small"
          onClick={addColor}
          disabled={busy || colors.length >= 12}
        >
          <Plus size={15} />
          Adicionar cor
        </button>
        <button
          type="button"
          className="button button--primary button--small"
          onClick={save}
          disabled={busy}
        >
          {busy ? "Salvando..." : "Salvar preferências"}
        </button>
      </div>

      {message && (
        <p className={message.includes("salvas") ? "form-success" : "form-error"}>
          {message}
        </p>
      )}
    </section>
  );
}
