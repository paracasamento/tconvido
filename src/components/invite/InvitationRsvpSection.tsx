import { CheckCircle2, CircleHelp } from "lucide-react";
import { RsvpButtons } from "@/components/RsvpButtons";

export type InviteGuestState = {
  id: string;
  name: string;
  rsvp_status: "pending" | "confirmed" | "declined";
} | null;

export function InvitationRsvpSection({ guest }: { guest: InviteGuestState }) {
  return (
    <section id="presenca" className="public-section public-rsvp-section">
      <div className="public-section-symbol" aria-hidden>
        {guest ? <CheckCircle2 size={18} /> : <CircleHelp size={18} />}
      </div>
      <p className="public-section-kicker">Confirmação de presença</p>

      {!guest ? (
        <>
          <h2>Seu nome não está na lista de convidados.</h2>
          <p className="public-section-copy">
            Você pode continuar vendo o convite, mas a confirmação fica disponível apenas para convidados cadastrados.
          </p>
        </>
      ) : guest.rsvp_status === "confirmed" ? (
        <>
          <h2>Presença confirmada ♡</h2>
          <p className="public-section-copy">Que alegria ter você com a gente, {guest.name}.</p>
          <RsvpButtons redirectTo="/convite#presentes" compact />
        </>
      ) : (
        <>
          <h2>{guest.name}, você vem?</h2>
          <p className="public-section-copy">Conte para os noivos se poderá estar presente.</p>
          <RsvpButtons redirectTo="/convite#presentes" compact />
        </>
      )}
    </section>
  );
}
