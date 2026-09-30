import { db } from "@/lib/db";
import { EVENT_SLUG } from "@/lib/constants";

export type EventRecord = {
  id: string;
  slug: string;
  title: string;
  couple_names: string;
  public_intro: string;
  message: string | null;
  event_date: string;
  event_time: string;
  venue: string;
  city: string;
  maps_url: string | null;
  gift_color_preferences: Array<{ name: string; hex: string }>;
  status: "draft" | "active" | "closed";
};

export async function getEvent(): Promise<EventRecord | null> {
  const sql = db();
  const rows = await sql`
    SELECT
      id,
      slug,
      title,
      couple_names,
      public_intro,
      message,
      to_char(event_date, 'YYYY-MM-DD') AS event_date,
      to_char(event_time, 'HH24:MI') AS event_time,
      venue,
      city,
      maps_url,
      COALESCE(gift_color_preferences, '[]'::jsonb) AS gift_color_preferences,
      status
    FROM events
    WHERE slug = ${EVENT_SLUG}
    LIMIT 1
  `;
  return (rows[0] as EventRecord | undefined) ?? null;
}

export function displayDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
