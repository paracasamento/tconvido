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
        o.id,
        o.name,
        o.description,
        o.image_path,
        o.status,
        o.sort_order,
        (
          SELECT gu.name
          FROM reservations r
          JOIN guests gu ON gu.id = r.guest_id
          WHERE r.gift_id = o.id
            AND r.released_at IS NULL
          ORDER BY r.created_at DESC
          LIMIT 1
        ) AS reserved_by_name
      FROM admin_gift_overview o
      WHERE o.event_id = ${session.event_id}
      ORDER BY o.sort_order, o.created_at
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
  const reservedCount = giftRows.filter(gift => gift.status === "reserved").length;

  return (
    <main className="admin-page admin-management-page-v6">
      <AdminPageHeader
        title="Presentes"
        description={
          `${giftRows.length} ${giftRows.length === 1 ? "item" : "itens"} · ${reservedCount} ${reservedCount === 1 ? "reservado" : "reservados"}`
        }
        action={<AdminGiftCreate />}
      />

      <GiftColorPreferencesForm initialColors={colorPreferences} />

      <section className="admin-list-section-v6">
        <div className="admin-list-toolbar-v6">
          <strong>Lista de presentes</strong>
          <span>Toque em ••• para editar um item.</span>
        </div>
        <div className="admin-gift-list-v6">
          {giftRows.map(gift => (
            <AdminGiftCard
              key={gift.id}
              gift={{
                id: gift.id,
                name: gift.name,
                description: gift.description,
                image_url: gift.image_path ? imageMap.get(gift.image_path) || null : null,
                status: gift.status,
                reserved_by_name: gift.reserved_by_name || null
              }}
            />
          ))}
          {!giftRows.length && <div className="empty-state compact"><p>Nenhum presente cadastrado ainda.</p></div>}
        </div>
      </section>
    </main>
  );
}
