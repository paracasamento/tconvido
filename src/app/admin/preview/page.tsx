import Link from "next/link";
import { FloralDivider, FloralFrame } from "@/components/Florals";
import { Monogram } from "@/components/Monogram";
import { db } from "@/lib/db";
import { displayDate } from "@/lib/event";
import { requireAdmin } from "@/lib/sessions";

export default async function AdminPreviewPage() {
  const session = await requireAdmin("/admin/preview");
  const sql = db();
  const rows = await sql`
    SELECT couple_names, title, message, to_char(event_date, 'YYYY-MM-DD') AS event_date,
      to_char(event_time, 'HH24:MI') AS event_time, venue, city, maps_url
    FROM events WHERE id = ${session.event_id} LIMIT 1
  `;
  const event = rows[0] as any;

  return (
    <main className="admin-preview-page">
      <div className="preview-banner"><Link href="/admin/convite">← Voltar ao painel</Link><span>Pré-visualização privada</span></div>
      <section className="invitation-hero">
        <FloralFrame />
        <div className="invitation-inner">
          <Monogram size={112} priority />
          <p className="eyebrow">{event.couple_names}</p>
          <h1>{event.title}</h1>
          <p className="invitation-message">{event.message || "Estamos preparando uma tarde muito especial e queremos compartilhar esse momento com você."}</p>
          <FloralDivider />
          <div className="event-facts">
            <div><span>Data</span><strong>{displayDate(event.event_date)}</strong></div>
            <div><span>Horário</span><strong>{event.event_time}h</strong></div>
            <div className="event-location"><span>Local</span><strong>{event.venue}</strong><small>{event.city}</small></div>
          </div>
        </div>
      </section>
    </main>
  );
}
