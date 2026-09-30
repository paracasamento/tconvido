import { db } from "@/lib/db";
import { EVENT_SLUG } from "@/lib/constants";
import {
  defaultInviteVisualConfig,
  normalizeInviteVisualConfig,
  type InviteScreen,
  type InviteScreenId,
  type InviteVisualConfig,
} from "@/lib/invite-builder";
import type { EventRecord } from "@/lib/event";

function normalizeSingleScreen(
  screenId: InviteScreenId,
  rawScreen: InviteScreen | null | undefined
): InviteScreen {
  const partial = structuredClone(defaultInviteVisualConfig) as InviteVisualConfig;

  if (rawScreen && typeof rawScreen === "object") {
    partial.screens[screenId] = rawScreen;
  }

  return normalizeInviteVisualConfig(partial).screens[screenId];
}

function rowToEvent(row: any): EventRecord {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title || ""),
    couple_names: String(row.couple_names || ""),
    public_intro: String(row.public_intro || ""),
    message: row.message == null ? null : String(row.message),
    event_date: String(row.event_date || ""),
    event_time: String(row.event_time || ""),
    venue: String(row.venue || ""),
    city: String(row.city || ""),
    maps_url: row.maps_url == null ? null : String(row.maps_url),
    gift_color_preferences: Array.isArray(row.gift_color_preferences)
      ? row.gift_color_preferences.filter((item:any)=>item&&typeof item.hex==="string").map((item:any)=>({
          name: typeof item.name==="string" ? item.name : "",
          hex: String(item.hex),
        }))
      : [],
    status: row.status,
  };
}


export async function getPublicInvitePageData(
  screenId: InviteScreenId,
  eventId?: string
): Promise<{ event: EventRecord; screen: InviteScreen; config?: InviteVisualConfig } | null> {
  const sql = db();

  // Keep one DB roundtrip. We intentionally fetch only the selected screen out
  // of the JSONB object below instead of transferring/normalizing the full
  // editor configuration on every public navigation.
  const rows = eventId
    ? await sql`
        SELECT
          e.id,
          e.slug,
          e.title,
          e.couple_names,
          e.public_intro,
          e.message,
          to_char(e.event_date, 'YYYY-MM-DD') AS event_date,
          to_char(e.event_time, 'HH24:MI') AS event_time,
          e.venue,
          e.city,
          e.maps_url,
          COALESCE(e.gift_color_preferences, '[]'::jsonb) AS gift_color_preferences,
          e.status,
          d.config->'screens'->${screenId} AS visual_screen,
          CASE WHEN ${screenId} = 'rsvp'
            THEN d.config->'rsvpScenarios'
            ELSE NULL
          END AS rsvp_scenarios
        FROM events e
        LEFT JOIN invite_visual_designs d ON d.event_id = e.id
        WHERE e.id = ${eventId}
        LIMIT 1
      `
    : await sql`
        SELECT
          e.id,
          e.slug,
          e.title,
          e.couple_names,
          e.public_intro,
          e.message,
          to_char(e.event_date, 'YYYY-MM-DD') AS event_date,
          to_char(e.event_time, 'HH24:MI') AS event_time,
          e.venue,
          e.city,
          e.maps_url,
          COALESCE(e.gift_color_preferences, '[]'::jsonb) AS gift_color_preferences,
          e.status,
          d.config->'screens'->${screenId} AS visual_screen,
          CASE WHEN ${screenId} = 'rsvp'
            THEN d.config->'rsvpScenarios'
            ELSE NULL
          END AS rsvp_scenarios
        FROM events e
        LEFT JOIN invite_visual_designs d ON d.event_id = e.id
        WHERE e.slug = ${EVENT_SLUG}
        LIMIT 1
      `;

  if (!rows.length) return null;

  const row = rows[0] as any;
  const screen = normalizeSingleScreen(
    screenId,
    row.visual_screen as InviteScreen | null | undefined
  );

  if (screenId === "rsvp") {
    const partial = structuredClone(defaultInviteVisualConfig) as InviteVisualConfig;
    partial.screens.rsvp = screen;
    partial.rsvpScenarios =
      row.rsvp_scenarios && typeof row.rsvp_scenarios === "object"
        ? row.rsvp_scenarios
        : undefined;

    const normalized = normalizeInviteVisualConfig(partial);
    return {
      event: rowToEvent(row),
      screen: normalized.screens.rsvp,
      config: {
        version: 2,
        screens: {
          ...structuredClone(defaultInviteVisualConfig.screens),
          rsvp: normalized.screens.rsvp,
        },
        rsvpScenarios: normalized.rsvpScenarios,
        savedLayouts: {},
      },
    };
  }

  return { event: rowToEvent(row), screen };
}
