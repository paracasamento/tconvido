import Link from "next/link";
import { Monogram } from "@/components/Monogram";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/convite" aria-label="Voltar ao convite">
        <Monogram size={56} />
      </Link>
      <nav className="site-nav">
        <Link href="/convite">Convite</Link>
        <Link href="/presenca">Presença</Link>
        <Link href="/presentes">Presentes</Link>
      </nav>
    </header>
  );
}
