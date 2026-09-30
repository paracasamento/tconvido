"use client";

export function GuestSingleForm({
  value,
  busy,
  allowedAdults,
  allowedChildren,
  onChange,
  onAdultsChange,
  onChildrenChange,
}: {
  value: string;
  busy: boolean;
  allowedAdults: number;
  allowedChildren: number;
  onChange: (value: string) => void;
  onAdultsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <label>
        <span>Nome do convidado</span>
        <input value={value} onChange={event => onChange(event.target.value)} placeholder="Ex.: Ana Souza" required />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label>
          <span>Adultos permitidos</span>
          <input type="number" min={1} max={20} value={allowedAdults} onChange={event => onAdultsChange(Math.max(1, Number(event.target.value || 1)))} />
        </label>
        <label>
          <span>Crianças permitidas</span>
          <input type="number" min={0} max={20} value={allowedChildren} onChange={event => onChildrenChange(Math.max(0, Number(event.target.value || 0)))} />
        </label>
      </div>

      <button className="button button--primary button--small" disabled={busy}>
        {busy ? "Adicionando..." : "Adicionar"}
      </button>
    </div>
  );
}
