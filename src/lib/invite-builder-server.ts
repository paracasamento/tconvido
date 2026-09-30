import { db } from "@/lib/db";
import {
  defaultInviteVisualConfig,
  migrateInviteVisualConfig,
  normalizeInviteVisualConfig,
  type InviteVisualConfig,
  type LegacyInviteVisualConfigV1,
} from "@/lib/invite-builder";

export async function getInviteVisualConfig(eventId: string): Promise<InviteVisualConfig> {
  try {
    const sql = db();
    const rows = await sql`SELECT config FROM invite_visual_designs WHERE event_id = ${eventId} LIMIT 1`;
    const config = rows[0]?.config as InviteVisualConfig | LegacyInviteVisualConfigV1 | undefined;
    if ((config?.version === 1 || config?.version === 2) && config.screens) {
      return migrateInviteVisualConfig(config);
    }
  } catch (error) {
    console.error("invite visual config", error);
  }

  return normalizeInviteVisualConfig(defaultInviteVisualConfig);
}
