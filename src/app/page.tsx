import { InviteEntryFlow } from "@/components/invite/InviteEntryFlow";
import { getEvent } from "@/lib/event";
import { getInviteVisualConfig } from "@/lib/invite-builder-server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const event = await getEvent();
  if (!event) return null;

  const config = await getInviteVisualConfig(event.id);

  return (
    <InviteEntryFlow
      coverScreen={config.screens.cover}
      accessScreen={config.screens.access}
    />
  );
}
