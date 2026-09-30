import Link from "next/link";
import { redirect } from "next/navigation";
import { GiftCard, type GiftUi } from "@/components/GiftCard";
import { GiftGridView } from "@/components/invite/functional/GiftGridView";
import { db } from "@/lib/db";
import { requireGuest } from "@/lib/sessions";
import { giftImageUrl } from "@/lib/storage";
import { getPublicInvitePageData } from "@/lib/public-invite-data";
import { inviteScreenBackgroundStyle } from "@/lib/invite-background-style";

export default async function GiftsPage() {
  const session = await requireGuest("/presentes");

  if (session.rsvp_status !== "confirmed") {
    redirect("/presenca");
  }

  const sql = db();

  const [rows, pageData] = await Promise.all([
    sql`
      SELECT
        g.id,
        g.name,
        g.description,
        g.image_path,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM reservations mine
            WHERE mine.event_id = ${session.event_id}
              AND mine.gift_id = g.id
              AND mine.guest_id = ${session.guest_id}
              AND mine.released_at IS NULL
          ) THEN 'reserved_by_me'
          WHEN (
            SELECT COUNT(*)
            FROM reservations taken
            WHERE taken.event_id = ${session.event_id}
              AND taken.gift_id = g.id
              AND taken.released_at IS NULL
          ) >= g.available_quantity THEN 'reserved'
          ELSE 'available'
        END AS status
      FROM gifts g
      WHERE g.event_id = ${session.event_id}
        AND g.deleted_at IS NULL
        AND g.is_active = true
      ORDER BY g.sort_order, g.created_at
    `,
    getPublicInvitePageData("gifts", session.event_id)
  ]);

  if (!pageData) return null;
  if (pageData.event.status !== "active") redirect("/acesso");

  const colors = Array.isArray(pageData.event.gift_color_preferences)
    ? pageData.event.gift_color_preferences
    : [];

  const gifts: GiftUi[] = rows.map((row: any) => ({
    id: String(row.id),
    name: String(row.name || ""),
    description: row.description == null ? null : String(row.description),
    image_url: giftImageUrl(row.image_path),
    status:
      row.status === "reserved_by_me" || row.status === "reserved"
        ? row.status
        : "available",
    colors
  }));

  const gridSlot = pageData.screen.elements.find(element => element.slot === "gift-grid");

  return (
    <main className="gift-full-list-page" style={inviteScreenBackgroundStyle(pageData.screen)}>
      <div
        className="gift-full-list-paper"
        style={{ opacity: pageData.screen.paperOpacity ?? 0.55 }}
        aria-hidden="true"
      />
      <div className="gift-full-list-content">
        <header className="gift-full-list-header">
          <Link href="/convite">← Voltar ao convite</Link>
          <p>LISTA DE PRESENTES</p>
          <h1>Escolha seus presentes</h1>
          <span>Você pode escolher quantos itens quiser.</span>
        </header>

        {gifts.length ? (
          <GiftGridView parts={gridSlot?.partStyles} naturalHeight>
            {gifts.map(gift => (
              <GiftCard key={gift.id} gift={gift} parts={gridSlot?.partStyles} />
            ))}
          </GiftGridView>
        ) : (
          <div className="guest-state-card">
            <h2>A lista ainda está sendo preparada.</h2>
            <p>Volte em breve para conferir as sugestões.</p>
          </div>
        )}

        <Link className="gift-my-choices-link" href="/meu-presente">
          Ver meus presentes
        </Link>
      </div>
    </main>
  );
}
