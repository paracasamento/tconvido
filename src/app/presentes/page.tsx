import { redirect } from "next/navigation";
import { GiftCard, type GiftUi } from "@/components/GiftCard";
import { CurrentReservationNotice } from "@/components/invite/functional/CurrentReservationNotice";
import { GiftGridView } from "@/components/invite/functional/GiftGridView";
import { GiftNoteView } from "@/components/invite/functional/GiftNoteView";
import { InviteCanvas } from "@/components/invite/InviteCanvas";
import { db } from "@/lib/db";
import { requireGuest } from "@/lib/sessions";
import { giftImageUrl } from "@/lib/storage";
import { getPublicInvitePageData } from "@/lib/public-invite-data";

export default async function GiftsPage() {
  const session = await requireGuest("/presentes");

  if (session.rsvp_status !== "confirmed") {
    redirect("/presenca");
  }

  const sql = db();

  /*
   * EXISTS evita ambiguidades/duplicações dos LEFT JOINs e garante que
   * "reserved_by_me" sempre tenha precedência para o convidado atual.
   */
  const rowsPromise = sql`
    SELECT
      g.id,
      g.name,
      g.description,
      g.image_path,
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM reservations mine
          WHERE
            mine.event_id = ${session.event_id}
            AND mine.gift_id = g.id
            AND mine.guest_id = ${session.guest_id}
            AND mine.released_at IS NULL
        ) THEN 'reserved_by_me'
        WHEN EXISTS (
          SELECT 1
          FROM reservations taken
          WHERE
            taken.event_id = ${session.event_id}
            AND taken.gift_id = g.id
            AND taken.released_at IS NULL
        ) THEN 'reserved'
        ELSE 'available'
      END AS status
    FROM gifts g
    WHERE
      g.event_id = ${session.event_id}
      AND g.deleted_at IS NULL
      AND g.is_active = true
    ORDER BY
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM reservations mine_order
          WHERE
            mine_order.event_id = ${session.event_id}
            AND mine_order.gift_id = g.id
            AND mine_order.guest_id = ${session.guest_id}
            AND mine_order.released_at IS NULL
        ) THEN 0
        WHEN EXISTS (
          SELECT 1
          FROM reservations taken_order
          WHERE
            taken_order.event_id = ${session.event_id}
            AND taken_order.gift_id = g.id
            AND taken_order.released_at IS NULL
        ) THEN 2
        ELSE 1
      END,
      g.sort_order,
      g.created_at
  `;

  const [rows, pageData] = await Promise.all([
    rowsPromise,
    getPublicInvitePageData("gifts", session.event_id),
  ]);
  if (!pageData) return null;
  if (pageData.event.status !== "active") redirect("/acesso");

  const mine = rows.find((row: any) => row.status === "reserved_by_me");
  const currentReservation = mine
    ? {
        giftId: String(mine.id),
        name: String(mine.name || "Presente"),
      }
    : null;

  const gifts: GiftUi[] = rows.map((row: any) => ({
    id: String(row.id),
    name: String(row.name || ""),
    description: row.description == null ? null : String(row.description),
    image_url: giftImageUrl(row.image_path),
    status:
      row.status === "reserved_by_me" || row.status === "reserved"
        ? row.status
        : "available",
  }));

  const gridSlot = pageData.screen.elements.find(
    element => element.slot === "gift-grid"
  );
  const noteSlot = pageData.screen.elements.find(
    element => element.slot === "gift-note"
  );

  const grid = gifts.length ? (
    <GiftGridView key="gift-grid" parts={gridSlot?.partStyles}>
      {gifts.map(gift => (
        <GiftCard
          key={gift.id}
          gift={gift}
          parts={gridSlot?.partStyles}
        />
      ))}
    </GiftGridView>
  ) : (
    <div key="gift-grid-empty" className="guest-state-card">
      <h2>A lista ainda está sendo preparada.</h2>
      <p>Volte em breve para conferir as sugestões.</p>
    </div>
  );

  const note = (
    <GiftNoteView
      key="gift-note"
      parts={noteSlot?.partStyles}
    />
  );

  return (
    <>
      <InviteCanvas
        screen={pageData.screen}
        slots={{
          "gift-grid": grid,
          "gift-note": note,
        }}
      />

      {currentReservation ? (
        <CurrentReservationNotice giftName={currentReservation.name} />
      ) : null}
    </>
  );
}
