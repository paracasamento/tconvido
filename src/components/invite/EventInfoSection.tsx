import { MapPin } from "lucide-react";

function compactTime(time: string) {
  return time.replace(/:00$/, "");
}

export function EventInfoSection({
  date,
  time,
  venue,
  city,
  mapsUrl
}: {
  date: string;
  time: string;
  venue: string;
  city: string;
  mapsUrl: string | null;
}) {
  return (
    <section className="public-section public-event-section">
      <p className="public-section-kicker">Anote na agenda</p>

      <div className="public-event-date-line">
        <strong>{date}</strong>
        <span aria-hidden>•</span>
        <strong>{compactTime(time)}h</strong>
      </div>

      <div className="public-event-place">
        <span className="public-event-pin" aria-hidden><MapPin size={17} strokeWidth={1.6} /></span>
        <div>
          <strong>{venue}</strong>
          <small>{city}</small>
        </div>
      </div>

      {mapsUrl && (
        <a className="public-inline-link" href={mapsUrl} target="_blank" rel="noreferrer">
          Ver localização
        </a>
      )}
    </section>
  );
}
