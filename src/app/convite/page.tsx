import { GiftCard, type GiftUi } from "@/components/GiftCard";
import type { InviteScreen } from "@/lib/invite-builder";
import { InviteCanvas } from "@/components/invite/InviteCanvas";
import { InviteContinuousFlow } from "@/components/invite/InviteContinuousFlow";
import { CountdownView } from "@/components/invite/functional/CountdownView";
import { GiftGridView } from "@/components/invite/functional/GiftGridView";
import { GiftNoteView } from "@/components/invite/functional/GiftNoteView";
import { db } from "@/lib/db";
import { displayDate } from "@/lib/event";
import { requireInvite } from "@/lib/invite-session";
import { getPublicInvitePageData } from "@/lib/public-invite-data";
import {
  getGuestSession
} from "@/lib/sessions";
import { giftImageUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

function compactTime(time: string) {
  return time.replace(/:00$/, "");
}

function dateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));

  return {
    day: String(day).padStart(2, "0"),
    month: new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      timeZone: "UTC",
    }).format(value),
    weekday: new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      timeZone: "UTC",
    }).format(value),
    year: String(year),
  };
}

export default async function InvitationPage() {
  const invite = await requireInvite("/convite");

  const [pageData, guestSession] = await Promise.all([
    getPublicInvitePageData("invite", invite.event_id),
    getGuestSession(),
  ]);
  if (!pageData) return null;
  if (pageData.event.status !== "active") {
    const { redirect } = await import("next/navigation");
    redirect("/acesso");
  }

  const { event } = pageData;
  const confirmed =
    guestSession?.event_id === invite.event_id &&
    guestSession.rsvp_status === "confirmed";

  const baseScreen =
    confirmed && pageData.inviteFlow?.afterInviteScreen
      ? pageData.inviteFlow.afterInviteScreen
      : pageData.screen;

  const screen = {
    ...baseScreen,
    elements: baseScreen.elements
      .filter(element => {
        if (element.id === "invite-gifts") return false;
        if (confirmed && element.id === "invite-rsvp") return false;
        return true;
      })
      .map(element => {
        if (element.id === "invite-rsvp" && !confirmed) {
          return { ...element, x: (100 - element.width) / 2 };
        }
        return element;
      }),
  };

  const countdownElement = screen.elements.find(
    element => element.slot === "countdown"
  );

  const parts = dateParts(event.event_date);
  const fallbackMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [event.venue, event.city].filter(Boolean).join(", ")
  )}`;
  const target = `${event.event_date}T${event.event_time}:00-03:00`;
  const countdownInitialNow = Date.now();

  let giftsScreen: InviteScreen | null = null;
  let giftsSlots: Record<string, React.ReactNode> | null = null;

  if (confirmed && guestSession) {
    const sql = db();

    const [rows, giftsPageData] = await Promise.all([
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
              WHERE
                mine.event_id = ${guestSession.event_id}
                AND mine.gift_id = g.id
                AND mine.guest_id = ${guestSession.guest_id}
                AND mine.released_at IS NULL
            ) THEN 'reserved_by_me'
            WHEN EXISTS (
              SELECT 1
              FROM reservations taken
              WHERE
                taken.event_id = ${guestSession.event_id}
                AND taken.gift_id = g.id
                AND taken.released_at IS NULL
            ) THEN 'reserved'
            ELSE 'available'
          END AS status
        FROM gifts g
        WHERE
          g.event_id = ${guestSession.event_id}
          AND g.deleted_at IS NULL
          AND g.is_active = true
        ORDER BY
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM reservations mine_order
              WHERE
                mine_order.event_id = ${guestSession.event_id}
                AND mine_order.gift_id = g.id
                AND mine_order.guest_id = ${guestSession.guest_id}
                AND mine_order.released_at IS NULL
            ) THEN 0
            WHEN EXISTS (
              SELECT 1
              FROM reservations taken_order
              WHERE
                taken_order.event_id = ${guestSession.event_id}
                AND taken_order.gift_id = g.id
                AND taken_order.released_at IS NULL
            ) THEN 2
            ELSE 1
          END,
          g.sort_order,
          g.created_at
      `,
      getPublicInvitePageData("gifts", guestSession.event_id),
    ]);

    if (giftsPageData) {
      const gifts: GiftUi[] = (rows as any[]).map(row => ({
        id: String(row.id),
        name: String(row.name || ""),
        description: row.description == null ? null : String(row.description),
        image_url: giftImageUrl(row.image_path),
        status:
          row.status === "reserved_by_me" || row.status === "reserved"
            ? row.status
            : "available",
      }));

      const gridSlot = giftsPageData.screen.elements.find(
        element => element.slot === "gift-grid"
      );
      const noteSlot = giftsPageData.screen.elements.find(
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

      giftsScreen = giftsPageData.screen;
      giftsSlots = {
        "gift-grid": grid,
        "gift-note": (
          <GiftNoteView
            key="gift-note"
            parts={noteSlot?.partStyles}
          />
        ),
      };
    }
  }

  const inviteVars = {
    couple_names: event.couple_names,
    title: event.title,
    intro: event.public_intro,
    date: displayDate(event.event_date),
    time: compactTime(event.event_time),
    venue: event.venue,
    city: event.city,
    city_suffix: event.city ? `, ${event.city}` : "",
    maps_url: event.maps_url || fallbackMapsUrl,
    weekday: parts.weekday,
    day: parts.day,
    month: parts.month,
    year: parts.year,
  };

  const inviteSlots = {
    countdown: (
      <CountdownView
        key="invite-countdown-slot"
        target={target}
        initialNow={countdownInitialNow}
        parts={countdownElement?.partStyles}
      />
    ),
  };

  if (confirmed && giftsScreen && giftsSlots) {
    const continuousBackground = pageData.inviteFlow?.continuousBackground === true;
    const backgroundScreen =
      pageData.inviteFlow?.backgroundSource === "gifts" ? giftsScreen : screen;

    if (continuousBackground) {
      return (
        <InviteContinuousFlow
          backgroundScreen={backgroundScreen}
          sections={[
            {
              key: "invite",
              screen,
              vars: inviteVars,
              slots: inviteSlots,
            },
            {
              key: "gifts",
              screen: giftsScreen,
              vars: inviteVars,
              slots: giftsSlots,
            },
          ]}
        />
      );
    }

    return (
      <>
        <InviteCanvas
          screen={screen}
          vars={inviteVars}
          slots={inviteSlots}
        />
        <InviteCanvas
          screen={giftsScreen}
          vars={inviteVars}
          slots={giftsSlots}
        />
      </>
    );
  }

  return (
    <InviteCanvas
      screen={screen}
      vars={inviteVars}
      slots={inviteSlots}
    />
  );
}
