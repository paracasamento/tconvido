"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GuestBulkForm } from "@/components/admin/guests/GuestBulkForm";
import { GuestEntryTabs } from "@/components/admin/guests/GuestEntryTabs";
import { GuestImportResult } from "@/components/admin/guests/GuestImportResult";
import { GuestSheetForm } from "@/components/admin/guests/GuestSheetForm";
import { GuestSingleForm } from "@/components/admin/guests/GuestSingleForm";
import { parseGuestNames } from "@/components/admin/guests/guest-utils";
import type { AccessMode, CreatedGuest, EntryMode } from "@/components/admin/guests/types";
import { readJsonResponse } from "@/lib/client-response";

export function GuestCreateHub({ accessMode: _accessMode }: { accessMode: AccessMode }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<EntryMode>("single");
  const [singleName, setSingleName] = useState("");
  const [singleAdults, setSingleAdults] = useState(1);
  const [singleChildren, setSingleChildren] = useState(0);
  const [multipleText, setMultipleText] = useState("");
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [sheetName, setSheetName] = useState("");
  const [created, setCreated] = useState<CreatedGuest[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const multipleNames = useMemo(() => parseGuestNames(multipleText), [multipleText]);
  const selectedNames = mode === "single" ? parseGuestNames(singleName) : mode === "multiple" ? multipleNames : sheetNames;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedNames.length) {
      setError("Adicione pelo menos um nome antes de continuar.");
      return;
    }

    setBusy(true);
    setError("");
    setCreated([]);
    setSkipped([]);
    try {
      const response = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ names: selectedNames, allowed_adults: mode === "single" ? singleAdults : 1, allowed_children: mode === "single" ? singleChildren : 0 })
      });
      const data = await readJsonResponse<{ message?: string; created?: CreatedGuest[]; skipped?: string[] }>(response);
      if (!response.ok) {
        setError(data.message || "Não foi possível cadastrar os convidados.");
        return;
      }

      setCreated(data.created || []);
      setSkipped(data.skipped || []);
      if (mode === "single") {
        setSingleName("");
        setSingleAdults(1);
        setSingleChildren(0);
      }
      if (mode === "multiple") setMultipleText("");
      if (mode === "sheet") {
        setSheetNames([]);
        setSheetName("");
        if (fileRef.current) fileRef.current.value = "";
      }
      router.refresh();
    } catch {
      setError("Não foi possível concluir o cadastro. Confira sua conexão e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSheet(file: File | null) {
    setError("");
    setCreated([]);
    setSkipped([]);
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("A planilha deve ter no máximo 5 MB.");
      return;
    }

    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
      if (!rows.length) throw new Error("empty");

      const keys = Object.keys(rows[0] || {});
      const nameKey = keys.find(key => key.trim().toLowerCase() === "nome") || keys[0];
      const names = rows.map(row => String(row[nameKey] ?? "").replace(/\s+/g, " ").trim()).filter(name => name.length >= 2);
      if (!names.length) throw new Error("names");

      setSheetName(file.name);
      setSheetNames(names);
    } catch {
      setError("Não consegui ler essa planilha. Use uma coluna chamada “Nome” ou coloque os nomes na primeira coluna.");
    }
  }

  return (
    <div className="admin-create guest-import-card">
      <GuestEntryTabs mode={mode} onChange={setMode} />
      <form onSubmit={submit} className="guest-entry-form">
        {mode === "single" && <GuestSingleForm value={singleName} busy={busy} allowedAdults={singleAdults} allowedChildren={singleChildren} onChange={setSingleName} onAdultsChange={setSingleAdults} onChildrenChange={setSingleChildren} />}
        {mode === "multiple" && <GuestBulkForm value={multipleText} count={multipleNames.length} busy={busy} onChange={setMultipleText} />}
        {mode === "sheet" && <GuestSheetForm fileRef={fileRef} fileName={sheetName} names={sheetNames} busy={busy} onFile={handleSheet} />}
      </form>

      {error && <p className="form-error" role="alert">{error}</p>}
      <GuestImportResult created={created} skipped={skipped} />
    </div>
  );
}
