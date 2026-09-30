"use client";

import { FileSpreadsheet } from "lucide-react";
import type { RefObject } from "react";

export function GuestSheetForm({
  fileRef,
  fileName,
  names,
  busy,
  onFile
}: {
  fileRef: RefObject<HTMLInputElement | null>;
  fileName: string;
  names: string[];
  busy: boolean;
  onFile: (file: File | null) => void;
}) {
  return (
    <>
      <label className="sheet-drop">
        <FileSpreadsheet size={28} />
        <strong>{fileName || "Selecionar planilha"}</strong>
        <span>Excel (.xlsx/.xls) ou CSV · coluna “Nome” ou primeira coluna</span>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={event => onFile(event.target.files?.[0] || null)}
        />
      </label>
      {!!names.length && (
        <div className="sheet-preview">
          <div><strong>{names.length}</strong> nomes encontrados</div>
          <p>{names.slice(0, 6).join(" · ")}{names.length > 6 ? " · …" : ""}</p>
        </div>
      )}
      <button className="button button--primary" disabled={busy || !names.length}>{busy ? "Importando..." : `Importar ${names.length || ""} convidados`}</button>
    </>
  );
}
