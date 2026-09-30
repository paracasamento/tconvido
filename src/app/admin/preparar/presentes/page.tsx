import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminGiftCard } from "@/components/AdminGiftCard";
import { AdminGiftCreate } from "@/components/AdminGiftCreate";
import { SetupStepShell } from "@/components/admin/setup/SetupStepShell";
import { GiftColorPreferencesForm } from "@/components/admin/gifts/GiftColorPreferencesForm";
import { getAdminSetupState } from "@/lib/admin-setup";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/sessions";
import { signGiftImages } from "@/lib/storage";

export default async function SetupGiftsPage() {
  const session = await requireAdmin();
  const sql = db();

  const [giftsResult, setup, eventRows] = await Promise.all([
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
    getAdminSetupState(session.event_id),
    sql`
      SELECT COALESCE(gift_color_preferences, '[]'::jsonb) AS gift_color_preferences
      FROM events
      WHERE id = ${session.event_id}
      LIMIT 1
    `
  ]);

  const gifts = giftsResult as any[];
  const colorPreferences = Array.isArray(eventRows[0]?.gift_color_preferences)
    ? eventRows[0].gift_color_preferences
    : [];
  if (setup.event.status !== "draft") redirect("/admin/presentes");

  const imageMap = await signGiftImages(gifts.map(gift => gift.image_path || null));

  return (
    <SetupStepShell
      step={4}
      title="Presentes"
      description="Monte a lista que ficará disponível no convite."
      steps={setup.steps}
      backHref="/admin/preparar/convidados"
    >
      <GiftColorPreferencesForm initialColors={colorPreferences} />

      <section className="setup-action-card-v6">
        <div>
          <strong>{gifts.length ? `${gifts.length} ${gifts.length === 1 ? "presente" : "presentes"}` : "Nenhum presente ainda"}</strong>
          <span>Você pode definir quantas unidades de cada item ficarão disponíveis.</span>
        </div>
        <AdminGiftCreate />
      </section>

      {!!gifts.length && (
        <section className="setup-list-preview-v6">
          <div className="setup-list-preview-v6__heading">
            <strong>Adicionados</strong>
            <Link href="/admin/presentes">Ver todos</Link>
          </div>
          <div className="admin-gift-list-v6">
            {gifts.slice(0, 4).map(gift => (
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
          </div>
        </section>
      )}

      <div className="setup-footer-actions-v6">
        <Link href="/admin/preparar/convidados" className="button button--ghost">Voltar</Link>
        {gifts.length ? (
          <Link href="/admin/preparar/revisao" className="button button--primary">Continuar</Link>
        ) : (
          <span className="button button--disabled" aria-disabled="true">Adicione um presente</span>
        )}
      </div>
    </SetupStepShell>
  );
}
