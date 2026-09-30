import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { AdminGiftCreate } from "@/components/AdminGiftCreate";
import { AdminGiftCard } from "@/components/AdminGiftCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { GiftColorPreferencesForm } from "@/components/admin/gifts/GiftColorPreferencesForm";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/sessions";
import { signGiftImages } from "@/lib/storage";

export default async function AdminGiftsPage() {
  const session = await requireAdmin("/admin/presentes");
  const sql = db();

  const [giftsResult, eventRows] = await Promise.all([
    sql`
      SELECT
        g.id,
        g.name,
        g.description,
        g.image_path,
        g.sort_order,
        g.available_quantity,
        COUNT(r.id)::int AS reserved_count
      FROM gifts g
      LEFT JOIN reservations r
        ON r.gift_id = g.id
        AND r.event_id = g.event_id
        AND r.released_at IS NULL
      WHERE g.event_id = ${session.event_id}
        AND g.deleted_at IS NULL
      GROUP BY g.id
      ORDER BY g.sort_order, g.created_at
    `,
    sql`
      SELECT COALESCE(gift_color_preferences, '[]'::jsonb) AS gift_color_preferences
      FROM events
      WHERE id = ${session.event_id}
      LIMIT 1
    `
  ]);

  const giftRows = giftsResult as any[];
  const colorPreferences = Array.isArray(eventRows[0]?.gift_color_preferences)
    ? eventRows[0].gift_color_preferences
    : [];
  const imageMap = await signGiftImages(giftRows.map(gift => gift.image_path || null));
  const reservationTotal = giftRows.reduce((sum, gift) => sum + Number(gift.reserved_count || 0), 0);

  return (
    <main className="admin-page admin-management-page-v6 admin-gifts-page-v9">
      <AdminPageHeader
        title="Presentes"
        description={`${giftRows.length} ${giftRows.length === 1 ? "item" : "itens"} · ${reservationTotal} ${reservationTotal === 1 ? "escolha" : "escolhas"}`}
        action={
          <div className="admin-gifts-header-actions-v1">
            <Link
              href="/admin/presentes/confirmacoes"
              className="button button--ghost admin-gift-confirmations-link-v1"
            >
              <ClipboardCheck size={18} />
              Confirmações de presentes
            </Link>
            <AdminGiftCreate />
          </div>
        }
      />

      <GiftColorPreferencesForm initialColors={colorPreferences} />

      <section className="admin-list-section-v6">
        <div className="admin-list-toolbar-v6">
          <strong>Lista de presentes</strong>
          <span>Toque em ••• para editar quantidade, nome ou foto.</span>
        </div>

        <div className="admin-gift-list-v6">
          {giftRows.map(gift => (
            <AdminGiftCard
              key={gift.id}
              gift={{
                id: String(gift.id),
                name: String(gift.name),
                description: gift.description == null ? null : String(gift.description),
                image_url: gift.image_path ? imageMap.get(gift.image_path) || null : null,
                available_quantity: Number(gift.available_quantity || 1),
                reserved_count: Number(gift.reserved_count || 0)
              }}
            />
          ))}
          {!giftRows.length && <div className="empty-state compact"><p>Nenhum presente cadastrado ainda.</p></div>}
        </div>
      </section>
    </main>
  );
}
