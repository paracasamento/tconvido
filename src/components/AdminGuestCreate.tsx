"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { GuestCreateHub } from "@/components/admin/guests/GuestCreateHub";
import { AdminSheet } from "@/components/admin/ui/AdminSheet";

export function AdminGuestCreate({ accessMode }: { accessMode: "event" | "individual" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="button button--primary admin-add-trigger" onClick={() => setOpen(true)}>
        <Plus size={18} /> Adicionar convidados
      </button>
      <AdminSheet
        open={open}
        title="Adicionar convidados"
        description="Escolha a forma mais rápida para montar sua lista."
        onClose={() => setOpen(false)}
      >
        <GuestCreateHub accessMode={accessMode} />
      </AdminSheet>
    </>
  );
}
