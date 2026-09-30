import { requireInvite } from "@/lib/invite-session";
import {
  getGuestReservationSummary,
  getGuestSession
} from "@/lib/sessions";
import { getPublicInvitePageData } from "@/lib/public-invite-data";
import { displayDate } from "@/lib/event";
import { InviteCanvas } from "@/components/invite/InviteCanvas";
import { CountdownView } from "@/components/invite/functional/CountdownView";

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

  const reservation =
    guestSession?.event_id === invite.event_id
      ? await getGuestReservationSummary(guestSession.guest_id, invite.event_id)
      : null;

  const baseScreen = pageData.screen;
  const screen = {
    ...baseScreen,
    elements: baseScreen.elements
      .filter(element => element.id !== "invite-gifts" || confirmed)
      .map(element => {
        if (element.id === "invite-rsvp" && confirmed) {
          return { ...element, text: "PRESENÇA CONFIRMADA", href: "/presenca" };
        }
        if (element.id === "invite-gifts" && reservation) {
          return { ...element, text: "VER MEU PRESENTE", href: "/meu-presente" };
        }
        if (element.id === "invite-gifts" && confirmed) {
          return { ...element, text: "ESCOLHER PRESENTE", href: "/presentes" };
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

  return (
    <InviteCanvas
      screen={screen}
      vars={{
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
      }}
      slots={{
        countdown: (
          <CountdownView
            key="invite-countdown-slot"
            target={target}
            initialNow={countdownInitialNow}
            parts={countdownElement?.partStyles}
          />
        ),
      }}
    />
  );
}
