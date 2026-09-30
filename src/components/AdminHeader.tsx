import Link from "next/link";
import { Monogram } from "@/components/Monogram";

export function AdminHeader() {
  return (
    <header className="admin-header">
      <Link href="/admin" className="admin-brand">
        <Monogram size={48} />
        <span>Chá de Panela</span>
      </Link>
      <nav className="admin-nav">
        <Link href="/admin/convidados">Convidados</Link>
        <Link href="/admin/presentes">Presentes</Link>
        <Link href="/admin/convite">Convite</Link>
        <Link href="/admin/configuracoes">Configurações</Link>
      </nav>
    </header>
  );
}
