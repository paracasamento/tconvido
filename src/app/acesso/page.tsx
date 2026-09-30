import { redirect } from "next/navigation";
import { InviteAccessShell } from "@/components/invite/InviteAccessShell";
import { getInviteSession } from "@/lib/invite-session";
import { getGuestSession } from "@/lib/sessions";
import { getPublicInvitePageData } from "@/lib/public-invite-data";
import { safeInternalPath } from "@/lib/access-routing";

export const dynamic = "force-dynamic";

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = safeInternalPath(
    params.next,
    "/convite",
    ["/convite", "/presenca", "/presentes", "/meu-presente"]
  );

  const pageData = await getPublicInvitePageData("access");
  if (!pageData) return null;

  const [session, guestSession] = await Promise.all([
    getInviteSession(),
    getGuestSession(),
  ]);
  const allowDraft = process.env.ALLOW_DRAFT_GUEST_ACCESS === "true";
  const usableEvent =
    pageData.event.status === "active" ||
    (allowDraft && pageData.event.status === "draft");

  const identityRequired = ["/presenca", "/presentes", "/meu-presente"].includes(next);
  const hasGuestIdentity =
    guestSession?.event_id === pageData.event.id &&
    (!session?.guest_id || session.guest_id === guestSession.guest_id);

  if (
    session &&
    session.event_id === pageData.event.id &&
    usableEvent &&
    (!identityRequired || hasGuestIdentity)
  ) {
    redirect(next);
  }

  return <InviteAccessShell screen={pageData.screen} redirectTo={next} />;
}
