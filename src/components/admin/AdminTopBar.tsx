import Link from "next/link";
import { Monogram } from "@/components/Monogram";

export function AdminTopBar() {
  return (
    <header className="admin-app-topbar">
      <Link href="/admin" className="admin-app-brand" aria-label="Ir para o início da área dos noivos">
        <Monogram size={44} />
        <span>
          <strong>Pedro & Letícia</strong>
          <small>Área dos noivos</small>
        </span>
      </Link>
    </header>
  );
}
