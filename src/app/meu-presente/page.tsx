import Image from "next/image";
import Link from "next/link";
import { Monogram } from "@/components/Monogram";
import { ReleaseGiftButton } from "@/components/ReleaseGiftButton";
import { SiteHeader } from "@/components/SiteHeader";
import { db } from "@/lib/db";
import { requireGuest } from "@/lib/sessions";
import { signGiftImage } from "@/lib/storage";

export default async function MyGiftPage() {
  const session = await requireGuest("/meu-presente");
  const sql = db();
  const rows = await sql`
    SELECT g.id, g.name, g.description, g.image_path
    FROM reservations r
    JOIN gifts g ON g.id = r.gift_id
    WHERE
      r.guest_id = ${session.guest_id}
      AND r.released_at IS NULL
      AND g.deleted_at IS NULL
    LIMIT 1
  `;
  const gift = rows[0] as any;

  if (!gift) {
    return (
      <main className="protected-shell">
        <SiteHeader />
        <section className="narrow-panel page-pad">
          <Monogram size={86} />
          <h1>Você ainda não escolheu um presente.</h1>
          <Link className="button button--primary" href="/convite">Ver lista de presentes</Link>
        </section>
      </main>
    );
  }

  const imageUrl = await signGiftImage(gift.image_path);
  return (
    <main className="protected-shell">
      <SiteHeader />
      <section className="narrow-panel page-pad">
        <p className="eyebrow">Sua escolha</p>
        <h1>Seu presente</h1>
        <div className="my-gift-card">
          <div className="my-gift-media">
            {imageUrl ? (
              <Image src={imageUrl} alt={gift.name} fill sizes="320px" className="gift-image" />
            ) : (
              <Monogram size={110} />
            )}
          </div>
          <h2>{gift.name}</h2>
          {gift.description && <p>{gift.description}</p>}
        </div>
        <p className="muted">Esta é a sua escolha atual. Se mudar de ideia, você pode liberá-la para que outra pessoa escolha.</p>
        <Link className="button button--soft" href="/convite">Voltar para a lista</Link>
        <ReleaseGiftButton name={gift.name} label="Liberar escolha" />
      </section>
    </main>
  );
}
