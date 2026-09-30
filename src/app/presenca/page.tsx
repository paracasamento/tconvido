import { redirect } from "next/navigation";
import { RsvpScenarioCanvas } from "@/components/invite/functional/RsvpScenarioCanvas";
import type { CurrentRsvpSubmission } from "@/components/invite/functional/RsvpFlowView";
import { requireInvite } from "@/lib/invite-session";
import {
  getGuestRsvpSnapshot,
  getGuestSession,
  getRsvpSubmissionSession
} from "@/lib/sessions";
import { getPublicInvitePageData } from "@/lib/public-invite-data";

export default async function RsvpPage() {
  const invite = await requireInvite("/presenca");
  const [pageData, submissionSession, guestSession] = await Promise.all([
    getPublicInvitePageData("rsvp", invite.event_id),
    getRsvpSubmissionSession(),
    getGuestSession(),
  ]);
  if (!pageData?.config) return null;
  if (pageData.event.status !== "active") redirect("/acesso");

  if (
    !guestSession ||
    guestSession.event_id !== invite.event_id ||
    !invite.guest_id ||
    invite.guest_id !== guestSession.guest_id
  ) {
    redirect("/acesso?next=%2Fpresenca");
  }

  let initialSubmission: CurrentRsvpSubmission | null = null;
  if (submissionSession?.event_id === invite.event_id) {
    initialSubmission = {
      id: submissionSession.submission_id,
      submitted_name: submissionSession.submitted_name,
      has_children: Boolean(submissionSession.has_children),
      children_count: Number(submissionSession.children_count || 0),
    };
  } else if (
    guestSession?.event_id === invite.event_id &&
    guestSession.rsvp_status === "confirmed"
  ) {
    const snapshot = await getGuestRsvpSnapshot(guestSession.guest_id);
    if (snapshot) {
      initialSubmission = {
        id: guestSession.guest_id,
        submitted_name: String(snapshot.submitted_name || snapshot.name || guestSession.guest_name),
        has_children: Number(snapshot.confirmed_children || 0) > 0,
        children_count: Number(snapshot.confirmed_children || 0),
      };
    }
  }

  return (
    <RsvpScenarioCanvas
      config={pageData.config}
      initialSubmission={initialSubmission}
      identityName={guestSession.guest_name}
    />
  );
}
