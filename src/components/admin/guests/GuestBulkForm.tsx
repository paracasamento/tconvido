"use client";

export function GuestBulkForm({ value, count, busy, onChange }: { value: string; count: number; busy: boolean; onChange: (value: string) => void }) {
  return (
    <>
      <label>
        <span>Cole os nomes separados por vírgula, ponto e vírgula ou uma pessoa por linha</span>
        <textarea rows={6} value={value} onChange={event => onChange(event.target.value)} placeholder={"Ana Souza\nJoão Silva\nMaria Oliveira\nCarlos Pereira"} />
      </label>
      <div className="import-preview-line"><strong>{count}</strong> {count === 1 ? "nome identificado" : "nomes identificados"}</div>
      <button className="button button--primary" disabled={busy || !count}>{busy ? "Adicionando..." : `Adicionar ${count || ""} convidados`}</button>
    </>
  );
}
