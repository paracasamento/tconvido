"use client";

import type { CreatedGuest } from "@/components/admin/guests/types";

export function GuestImportResult({ created, skipped }: { created: CreatedGuest[]; skipped: string[] }) {
  return (
    <>
      {!!created.length && (
        <div className="import-result">
          <strong>{created.length} {created.length === 1 ? "convidado adicionado" : "convidados adicionados"}</strong>
          <span>A lista foi atualizada.</span>
        </div>
      )}

      {!!skipped.length && (
        <p className="import-skipped">{skipped.length} {skipped.length === 1 ? "nome foi ignorado" : "nomes foram ignorados"} por já estar na lista ou estar repetido nesta importação.</p>
      )}
    </>
  );
}
