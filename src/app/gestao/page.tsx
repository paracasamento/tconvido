import Link from "next/link";
import { ExternalLink, Palette, UsersRound } from "lucide-react";
import { requireOwner } from "@/lib/sessions";

export default async function GestaoHomePage() {
  const session = await requireOwner("/gestao");

  return (
    <main className="gestao-home">
      <section className="gestao-hero">
        <p className="gestao-kicker">Área de gestão</p>
        <h1>Olá, {session.admin_name}</h1>
        <p>Ferramentas técnicas do convite ficam separadas da área dos noivos.</p>
      </section>

      <section className="gestao-grid">
        <Link href="/gestao/editor" className="gestao-card">
          <span className="gestao-card-icon"><Palette size={22} /></span>
          <div>
            <strong>Editor visual</strong>
            <small>Editar layout, elementos, telas e estilos do convite.</small>
          </div>
        </Link>

        <Link href="/admin" className="gestao-card">
          <span className="gestao-card-icon"><UsersRound size={22} /></span>
          <div>
            <strong>Painel dos noivos</strong>
            <small>Abrir a mesma área operacional que a noiva utiliza.</small>
          </div>
        </Link>

        <Link href="/convite" className="gestao-card" target="_blank">
          <span className="gestao-card-icon"><ExternalLink size={22} /></span>
          <div>
            <strong>Abrir convite</strong>
            <small>Visualizar o convite público em uma nova aba.</small>
          </div>
        </Link>
      </section>
    </main>
  );
}
