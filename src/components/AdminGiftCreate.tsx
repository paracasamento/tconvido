"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { GiftCreateHub } from "@/components/admin/gifts/GiftCreateHub";
import { AdminSheet } from "@/components/admin/ui/AdminSheet";

export function AdminGiftCreate() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="button button--primary admin-add-trigger" onClick={() => setOpen(true)}>
        <Plus size={18} /> Adicionar presentes
      </button>
      <AdminSheet
        open={open}
        title="Adicionar presentes"
        description="Cadastre um item, vários de uma vez ou importe uma planilha."
        onClose={() => setOpen(false)}
      >
        <GiftCreateHub />
      </AdminSheet>
    </>
  );
}
