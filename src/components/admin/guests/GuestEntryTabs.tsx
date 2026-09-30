"use client";

import { FileSpreadsheet, ListPlus, UserPlus } from "lucide-react";
import type { EntryMode } from "@/components/admin/guests/types";

export function GuestEntryTabs({ mode, onChange }: { mode: EntryMode; onChange: (mode: EntryMode) => void }) {
  return (
    <div className="guest-entry-tabs" role="tablist" aria-label="Forma de adicionar convidados">
      <button type="button" className={mode === "single" ? "is-active" : ""} onClick={() => onChange("single")}>
        <UserPlus size={17} /> Um por vez
      </button>
      <button type="button" className={mode === "multiple" ? "is-active" : ""} onClick={() => onChange("multiple")}>
        <ListPlus size={17} /> Vários nomes
      </button>
      <button type="button" className={mode === "sheet" ? "is-active" : ""} onClick={() => onChange("sheet")}>
        <FileSpreadsheet size={17} /> Planilha
      </button>
    </div>
  );
}
