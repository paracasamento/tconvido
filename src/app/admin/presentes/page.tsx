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
      SELECT id, name, description, image_path, status, sort_order
      FROM admin_gift_overview
      WHERE event_id = ${session.event_id}
      ORDER BY sort_order, created_at
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

  return (
    <main className="admin-page admin-management-page-v6">
      <AdminPageHeader
        title="Presentes"
        description={`${giftRows.length} ${giftRows.length === 1 ? "item na lista" : "itens na lista"}`}
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
                status: gift.status
              }}
            />
          ))}
          {!giftRows.length && <div className="empty-state compact"><p>Nenhum presente cadastrado ainda.</p></div>}
        </div>
      </section>
    </main>
  );
}
