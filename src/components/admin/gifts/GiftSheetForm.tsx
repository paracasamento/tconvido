"use client";

import { FileSpreadsheet } from "lucide-react";
import type { RefObject } from "react";

export type GiftSheetItem = { name: string; quantity: number };

export function GiftSheetForm({
  fileRef,
  fileName,
  items,
  busy,
  onFile
}: {
  fileRef: RefObject<HTMLInputElement | null>;
  fileName: string;
  items: GiftSheetItem[];
  busy: boolean;
  onFile: (file: File | null) => void;
}) {
  return (
    <>
      <label className="sheet-drop">
        <FileSpreadsheet size={28} />
        <strong>{fileName || "Selecionar planilha"}</strong>
        <span>Excel ou CSV · colunas “Presente” e, opcionalmente, “Quantidade”</span>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={event => onFile(event.target.files?.[0] || null)}
        />
      </label>
      {!!items.length && (
        <div className="sheet-preview">
          <div><strong>{items.length}</strong> itens encontrados</div>
          <p>{items.slice(0, 6).map(item => item.quantity > 1 ? `${item.name} × ${item.quantity}` : item.name).join(" · ")}{items.length > 6 ? " · …" : ""}</p>
        </div>
      )}
      <button className="button button--primary" disabled={busy || !items.length}>{busy ? "Importando..." : `Importar ${items.length || ""} presentes`}</button>
    </>
  );
}
