import Image from "next/image";
import Link from "next/link";
import { Monogram } from "@/components/Monogram";
import { ReleaseGiftButton } from "@/components/ReleaseGiftButton";
import { SiteHeader } from "@/components/SiteHeader";
import { db } from "@/lib/db";
import { requireGuest } from "@/lib/sessions";
import { signGiftImages } from "@/lib/storage";

export default async function MyGiftPage() {
  const session = await requireGuest("/meu-presente");
  const sql = db();
  const rows = await sql`
    SELECT g.id, g.name, g.description, g.image_path
    FROM reservations r
    JOIN gifts g ON g.id = r.gift_id
    WHERE r.event_id = ${session.event_id}
      AND r.guest_id = ${session.guest_id}
      AND r.released_at IS NULL
      AND g.deleted_at IS NULL
    ORDER BY r.created_at DESC
  `;

  const gifts = rows as any[];

  if (!gifts.length) {
    return (
      <main className="protected-shell">
        <SiteHeader />
        <section className="narrow-panel page-pad">
          <Monogram size={86} />
          <h1>Você ainda não escolheu nenhum presente.</h1>
          <Link className="button button--primary" href="/presentes">Ver lista de presentes</Link>
        </section>
      </main>
    );
  }

  const imageMap = await signGiftImages(gifts.map(gift => gift.image_path || null));

  return (
    <main className="protected-shell">
      <SiteHeader />
      <section className="narrow-panel page-pad">
        <p className="eyebrow">Suas escolhas</p>
        <h1>Meus presentes</h1>
        <p className="muted">Você pode escolher mais de um presente e liberar cada item separadamente.</p>

        <div className="my-gifts-list">
          {gifts.map(gift => {
            const imageUrl = gift.image_path ? imageMap.get(gift.image_path) || null : null;
            return (
              <article className="my-gift-card" key={gift.id}>
                <div className="my-gift-media">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={gift.name} fill sizes="320px" className="gift-image" />
                  ) : (
                    <Monogram size={110} />
                  )}
                </div>
                <h2>{gift.name}</h2>
                {gift.description && <p>{gift.description}</p>}
                <ReleaseGiftButton
                  giftId={String(gift.id)}
                  name={String(gift.name)}
                  label="Liberar este presente"
                  redirectTo="/meu-presente"
                />
              </article>
            );
          })}
        </div>

        <Link className="button button--soft" href="/presentes">Voltar para a lista</Link>
      </section>
    </main>
  );
}
