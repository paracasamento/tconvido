"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GiftBulkForm } from "@/components/admin/gifts/GiftBulkForm";
import { GiftEntryTabs, type GiftEntryMode } from "@/components/admin/gifts/GiftEntryTabs";
import { GiftSheetForm, type GiftSheetItem } from "@/components/admin/gifts/GiftSheetForm";
import { GiftSingleForm } from "@/components/admin/gifts/GiftSingleForm";
import { parseGiftNames } from "@/components/admin/gifts/gift-utils";
import { readJsonResponse } from "@/lib/client-response";
import { GIFT_IMAGE_MAX_BYTES, GIFT_IMAGE_MAX_MB } from "@/lib/upload-limits";

export function GiftCreateHub() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<GiftEntryMode>("single");
  const [multipleText, setMultipleText] = useState("");
  const [sheetItems, setSheetItems] = useState<GiftSheetItem[]>([]);
  const [sheetName, setSheetName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const multipleItems = useMemo(() => parseGiftNames(multipleText), [multipleText]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      let response: Response;
      if (mode === "single") {
        const form = new FormData(event.currentTarget);
        const image = form.get("image");
        if (image instanceof File && image.size > GIFT_IMAGE_MAX_BYTES) {
          setMessage(`A foto deve ter no máximo ${GIFT_IMAGE_MAX_MB} MB.`);
          return;
        }
        response = await fetch("/api/admin/gifts", { method: "POST", body: form });
      } else {
        const items = mode === "multiple"
          ? multipleItems.map(name => ({ name, quantity: 1 }))
          : sheetItems;
        response = await fetch("/api/admin/gifts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ items })
        });
      }

      const data = await readJsonResponse<{ message?: string; count?: number }>(response);
      if (!response.ok) {
        setMessage(data.message || "Não foi possível adicionar os presentes.");
        return;
      }

      if (mode === "single") formRef.current?.reset();
      if (mode === "multiple") setMultipleText("");
      if (mode === "sheet") {
        setSheetItems([]);
        setSheetName("");
        if (fileRef.current) fileRef.current.value = "";
      }
      setMessage(mode === "single" ? "Presente adicionado." : `${data.count || 0} presentes adicionados.`);
      router.refresh();
    } catch {
      setMessage("Não foi possível concluir o cadastro.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSheet(file: File | null) {
    setMessage("");
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage("A planilha deve ter no máximo 5 MB.");
      return;
    }

    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
      if (!rows.length) throw new Error("empty");
      const keys = Object.keys(rows[0] || {});
      const normalized = (value: string) =>
        value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const nameKey = keys.find(key => ["presente", "item", "nome"].includes(normalized(key))) || keys[0];
      const quantityKey = keys.find(key => ["quantidade", "qtd", "quantity"].includes(normalized(key)));

      const items = rows.map(row => {
        const name = String(row[nameKey] ?? "").replace(/\s+/g, " ").trim();
        const rawQuantity = quantityKey ? Number(row[quantityKey]) : 1;
        const quantity = Number.isInteger(rawQuantity) && rawQuantity >= 1 && rawQuantity <= 999 ? rawQuantity : 1;
        return { name, quantity };
      }).filter(item => item.name.length >= 2);

      if (!items.length) throw new Error("items");
      setSheetName(file.name);
      setSheetItems(items);
    } catch {
      setMessage("Não consegui ler a planilha. Use uma coluna “Presente” ou “Item” e, se quiser, uma coluna “Quantidade”.");
    }
  }

  return (
    <div className="admin-gift-form gift-create-hub">
      <GiftEntryTabs mode={mode} onChange={setMode} />
      <form ref={formRef} className="guest-entry-form" onSubmit={submit}>
        {mode === "single" && <GiftSingleForm busy={busy} />}
        {mode === "multiple" && <GiftBulkForm value={multipleText} count={multipleItems.length} busy={busy} onChange={setMultipleText} />}
        {mode === "sheet" && <GiftSheetForm fileRef={fileRef} fileName={sheetName} items={sheetItems} busy={busy} onFile={handleSheet} />}
      </form>
      {message && <p className={message.includes("adicionado") ? "form-success" : "form-error"}>{message}</p>}
    </div>
  );
}
