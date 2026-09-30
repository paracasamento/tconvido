"use client";

export function GiftBulkForm({ value, count, busy, onChange }: { value: string; count: number; busy: boolean; onChange: (value: string) => void }) {
  return (
    <>
      <label>
        <span>Um presente por linha</span>
        <textarea rows={7} value={value} onChange={event => onChange(event.target.value)} placeholder={"Jogo de taças\nLiquidificador\nConjunto de pratos\nCafeteira"} />
      </label>
      <div className="import-preview-line"><strong>{count}</strong> {count === 1 ? "item identificado" : "itens identificados"}</div>
      <button className="button button--primary" disabled={busy || !count}>{busy ? "Adicionando..." : `Adicionar ${count || ""} presentes`}</button>
      <p className="access-mode-note">Os itens serão criados sem foto e descrição. Você pode completar depois.</p>
    </>
  );
}
