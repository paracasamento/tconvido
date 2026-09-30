import { ConfiguredHome } from "@/components/admin/setup/ConfiguredHome";
import { SetupOverview } from "@/components/admin/setup/SetupOverview";
import { getAdminSetupState } from "@/lib/admin-setup";
import { requireAdmin } from "@/lib/sessions";

export default async function AdminHomePage() {
  const session = await requireAdmin("/admin");
  const state = await getAdminSetupState(session.event_id);

  if (state.event.status === "active" || state.event.status === "closed") {
    return <ConfiguredHome state={state} adminName={session.admin_name} />;
  }

  return <SetupOverview state={state} adminName={session.admin_name} />;
}
