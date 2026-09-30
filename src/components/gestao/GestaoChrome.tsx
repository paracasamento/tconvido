"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";

export function GestaoChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullScreen = pathname === "/gestao/login" || pathname.startsWith("/gestao/editor");

  if (fullScreen) return <>{children}</>;

  return (
    <div className="gestao-shell">
      <header className="gestao-topbar">
        <Link href="/gestao" className="gestao-brand">
          <strong>Gestão do convite</strong>
          <small>Área técnica</small>
        </Link>

        <div className="gestao-topbar-actions">
          <Link href="/admin" className="gestao-topbar-link">
            <ArrowLeft size={15} />
            Painel dos noivos
          </Link>

          <form action="/api/owner/logout" method="post">
            <button type="submit" className="gestao-logout">
              <LogOut size={15} />
              Sair
            </button>
          </form>
        </div>
      </header>

      <div className="gestao-main">{children}</div>
    </div>
  );
}
