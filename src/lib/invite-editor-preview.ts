import { db } from "@/lib/db";
import { displayDate } from "@/lib/event";
import { giftImageUrl } from "@/lib/storage";
import type { GiftUi } from "@/components/GiftCard";

export type InviteEditorPreviewData = {
  vars: Record<string, string>;
  gifts: GiftUi[];
};

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

export async function getInviteEditorPreviewData(eventId: string): Promise<InviteEditorPreviewData> {
  const sql = db();

  const [eventRows, guestRows, giftRows] = await Promise.all([
    sql`
      SELECT
        id,
        title,
        couple_names,
        to_char(event_date, 'YYYY-MM-DD') AS event_date,
        to_char(event_time, 'HH24:MI') AS event_time,
        venue,
        city,
        maps_url
      FROM events
      WHERE id = ${eventId}
      LIMIT 1
    `,
    sql`
      SELECT name
      FROM guests
      WHERE event_id = ${eventId}
        AND deleted_at IS NULL
      ORDER BY created_at ASC
      LIMIT 1
    `,
    sql`
      SELECT
        g.id,
        g.name,
        g.description,
        g.image_path,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM reservations r
            WHERE r.gift_id = g.id
              AND r.released_at IS NULL
          ) THEN 'reserved'
          ELSE 'available'
        END AS status
      FROM gifts g
      WHERE g.event_id = ${eventId}
        AND g.deleted_at IS NULL
        AND g.is_active = true
      ORDER BY
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM reservations r
            WHERE r.gift_id = g.id
              AND r.released_at IS NULL
          ) THEN 1
          ELSE 0
        END,
        g.sort_order,
        g.created_at
      LIMIT 8
    `,
  ]);

  const event = eventRows[0] as any;

  if (!event) {
    return {
      vars: {
        couple_names: "",
        title: "",
        date: "",
        time: "",
        venue: "",
        city: "",
        city_suffix: "",
        maps_url: "#",
        weekday: "",
        day: "",
        month: "",
        year: "",
        event_datetime: "2026-11-22T16:00:00-03:00",
        guest_name: "Convidado",
      },
      gifts: [],
    };
  }

  const eventDate = String(event.event_date || "");
  const eventTime = String(event.event_time || "");
  const parts = dateParts(eventDate);
  const fallbackMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [event.venue, event.city].filter(Boolean).join(", ")
  )}`;

  const gifts: GiftUi[] = giftRows.map((row: any) => ({
    id: String(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    image_url: giftImageUrl(row.image_path),
    status: row.status === "reserved" ? "reserved" : "available",
  }));

  return {
    vars: {
      couple_names: String(event.couple_names || ""),
      title: String(event.title || ""),
      date: displayDate(eventDate),
      time: compactTime(eventTime),
      venue: String(event.venue || ""),
      city: String(event.city || ""),
      city_suffix: event.city ? `, ${String(event.city)}` : "",
      maps_url: String(event.maps_url || fallbackMapsUrl),
      weekday: parts.weekday,
      day: parts.day,
      month: parts.month,
      year: parts.year,
      event_datetime: `${eventDate}T${eventTime}:00-03:00`,
      guest_name: guestRows[0]?.name ? String(guestRows[0].name) : "Convidado",
    },
    gifts,
  };
}
