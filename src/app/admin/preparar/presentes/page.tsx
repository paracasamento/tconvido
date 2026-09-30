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
          <span>Nome é obrigatório. Foto e descrição são opcionais.</span>
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
                  id: gift.id,
                  name: gift.name,
                  description: gift.description,
                  image_url: gift.image_path ? imageMap.get(gift.image_path) || null : null,
                  status: gift.status,
                  reserved_by_name: gift.reserved_by_name || null
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
