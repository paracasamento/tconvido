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
        <span>Foto opcional (até 12 MB; formatos comuns convertidos automaticamente)</span>
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/tiff,image/bmp,image/heic,image/heif,.heic,.heif,.tif,.tiff,.bmp" />
      </label>
      <button className="button button--primary button--small" disabled={busy}>
        {busy ? "Salvando..." : "Adicionar presente"}
      </button>
    </>
  );
}
