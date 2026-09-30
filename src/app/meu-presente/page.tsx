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
          <Link className="button button--primary" href="/presentes">Ver lista de presentes</Link>
        </section>
      </main>
    );
  }

  const imageUrl = await signGiftImage(gift.image_path);
  return (
    <main className="protected-shell">
      <SiteHeader />
      <section className="narrow-panel page-pad">
        <p className="eyebrow">Seu presente</p>
        <h1>Presente reservado</h1>
        <div className="my-gift-card">
          <div className="my-gift-media">
            {imageUrl ? (
              <Image src={imageUrl} alt={gift.name} fill sizes="320px" className="gift-image" />
            ) : (
              <Monogram size={110} />
            )}
          </div>
          <span className="status status--reserved_by_me">Reservado por você</span>
          <h2>{gift.name}</h2>
          {gift.description && <p>{gift.description}</p>}
        </div>
        <p className="muted">Se mudar de ideia, você pode liberar este presente para que outro convidado possa escolhê-lo.</p>
        <Link className="button button--soft" href="/presentes">Continuar vendo a lista</Link>
        <ReleaseGiftButton name={gift.name} />
      </section>
    </main>
  );
}
