"use client";

import Image from "next/image";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppModal } from "@/components/admin/AppModal";
import { AdminSheet } from "@/components/admin/ui/AdminSheet";
import { Monogram } from "@/components/Monogram";
import { readJsonResponse } from "@/lib/client-response";
import { GIFT_IMAGE_MAX_BYTES, GIFT_IMAGE_MAX_MB } from "@/lib/upload-limits";

type Gift = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  available_quantity: number;
  reserved_count: number;
};

export function AdminGiftCard({ gift }: { gift: Gift }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [removeOpen, setRemoveOpen] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const image = form.get("image");
      if (image instanceof File && image.size > GIFT_IMAGE_MAX_BYTES) {
        setMessage(`A foto deve ter no máximo ${GIFT_IMAGE_MAX_MB} MB.`);
        return;
      }
      const response = await fetch(`/api/admin/gifts/${gift.id}`, { method: "PATCH", body: form });
      const data = await readJsonResponse<{ message?: string }>(response);
      if (!response.ok) {
        setMessage(data.message || "Não foi possível editar.");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/gifts/${gift.id}`, { method: "DELETE" });
      const data = await readJsonResponse<{ message?: string }>(response);
      if (!response.ok) {
        setMessage(data.message || "Não foi possível remover.");
        setRemoveOpen(false);
        return;
      }
      setRemoveOpen(false);
      setEditing(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <article className="admin-gift-list-item">
        <div className="admin-gift-list-item__media">
          {gift.image_url ? <Image src={gift.image_url} alt={gift.name} fill sizes="72px" className="gift-image" /> : <Monogram size={40} />}
        </div>
        <div className="admin-gift-list-item__copy">
          <strong>{gift.name}</strong>
          <span className="admin-gift-quantity-status">
            {gift.reserved_count > 0
              ? `${gift.reserved_count} de ${gift.available_quantity} escolhidos`
              : `${gift.available_quantity} ${gift.available_quantity === 1 ? "unidade" : "unidades"}`}
          </span>
          {gift.description && <small>{gift.description}</small>}
        </div>
        <button type="button" className="admin-row-menu" onClick={() => setEditing(true)} aria-label={`Editar ${gift.name}`}>
          <MoreHorizontal size={20} />
        </button>
      </article>

      <AdminSheet
        open={editing}
        title="Editar presente"
        description={gift.reserved_count > 0
          ? `Este item possui ${gift.reserved_count} ${gift.reserved_count === 1 ? "escolha ativa" : "escolhas ativas"}.`
          : "Atualize nome, quantidade, descrição ou foto."}
        onClose={() => !busy && setEditing(false)}
      >
        <form className="admin-sheet-form" onSubmit={save}>
          <label className="admin-field"><span>Nome do presente</span><input name="name" defaultValue={gift.name} required /></label>
          <label className="admin-field">
            <span>Quantidade disponível</span>
            <input name="available_quantity" type="number" min={Math.max(1, gift.reserved_count)} max={999} defaultValue={gift.available_quantity} required />
          </label>
          <label className="admin-field"><span>Descrição</span><textarea name="description" defaultValue={gift.description || ""} rows={4} placeholder="Opcional" /></label>
          <label className="admin-field admin-file-field"><span>Trocar foto (até 4 MB)</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp" /></label>
          {gift.image_url && <label className="check-row"><input type="checkbox" name="remove_image" value="1" /><span>Remover foto atual</span></label>}
          {message && <p className="form-error">{message}</p>}
          <div className="admin-sheet-form__actions">
            <button className="button button--primary" disabled={busy}>{busy ? "Salvando..." : "Salvar alterações"}</button>
            {gift.reserved_count === 0 && <button type="button" className="button button--danger-ghost" onClick={() => setRemoveOpen(true)} disabled={busy}>Remover presente</button>}
          </div>
        </form>
      </AdminSheet>

      <AppModal
        open={removeOpen}
        title={`Remover “${gift.name}”?`}
        description="O presente sairá da lista. Essa ação só fica disponível enquanto ele não tiver escolhas ativas."
        confirmLabel="Remover presente"
        tone="danger"
        busy={busy}
        onConfirm={remove}
        onClose={() => !busy && setRemoveOpen(false)}
      />
    </>
  );
}
