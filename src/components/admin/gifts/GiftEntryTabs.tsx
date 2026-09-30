"use client";

import { FileSpreadsheet, ListPlus, PlusCircle } from "lucide-react";

export type GiftEntryMode = "single" | "multiple" | "sheet";

export function GiftEntryTabs({ mode, onChange }: { mode: GiftEntryMode; onChange: (mode: GiftEntryMode) => void }) {
  return (
    <div className="guest-entry-tabs" role="tablist" aria-label="Forma de adicionar presentes">
      <button type="button" className={mode === "single" ? "is-active" : ""} onClick={() => onChange("single")}><PlusCircle size={17} /> Um por vez</button>
      <button type="button" className={mode === "multiple" ? "is-active" : ""} onClick={() => onChange("multiple")}><ListPlus size={17} /> Vários itens</button>
      <button type="button" className={mode === "sheet" ? "is-active" : ""} onClick={() => onChange("sheet")}><FileSpreadsheet size={17} /> Planilha</button>
    </div>
  );
}
