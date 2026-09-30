"use client";

import { FileSpreadsheet } from "lucide-react";
import type { RefObject } from "react";

export function GiftSheetForm({
  fileRef,
  fileName,
  items,
  busy,
  onFile
}: {
  fileRef: RefObject<HTMLInputElement | null>;
  fileName: string;
  items: string[];
  busy: boolean;
  onFile: (file: File | null) => void;
}) {
  return (
    <>
      <label className="sheet-drop">
        <FileSpreadsheet size={28} />
        <strong>{fileName || "Selecionar planilha"}</strong>
        <span>Excel ou CSV · coluna “Presente”, “Item” ou primeira coluna</span>
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
          <p>{items.slice(0, 6).join(" · ")}{items.length > 6 ? " · …" : ""}</p>
        </div>
      )}
      <button className="button button--primary" disabled={busy || !items.length}>{busy ? "Importando..." : `Importar ${items.length || ""} presentes`}</button>
    </>
  );
}
