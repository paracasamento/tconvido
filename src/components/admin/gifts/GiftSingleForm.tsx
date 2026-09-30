"use client";

export function GiftSingleForm({ busy }: { busy: boolean }) {
  return (
    <>
      <input name="name" placeholder="Nome do presente" required />
      <input name="description" placeholder="Descrição (opcional)" />
      <label>
        <span>Quantidade disponível</span>
        <input name="available_quantity" type="number" min={1} max={999} defaultValue={1} required />
      </label>
      <label className="file-field">
        <span>Foto opcional (até 4 MB)</span>
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp" />
      </label>
      <button className="button button--primary button--small" disabled={busy}>
        {busy ? "Salvando..." : "Adicionar presente"}
      </button>
    </>
  );
}
