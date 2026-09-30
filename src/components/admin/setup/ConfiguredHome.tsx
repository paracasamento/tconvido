import Link from "next/link";
import { Gift, MailOpen, MessageCircle, Plus, UsersRound } from "lucide-react";
import type { AdminSetupState } from "@/lib/admin-setup";
import { CopyInviteLinkButton } from "@/components/admin/CopyInviteLinkButton";

export function ConfiguredHome({ state, adminName }: { state: AdminSetupState; adminName: string }) {
  const active = state.event.status === "active";

  return (
    <main className="admin-page configured-home-v6">
      <section className="configured-hero-v6">
        <div className="configured-hero-v6__copy">
          <span className={`configured-status-v6 ${active ? "is-active" : "is-paused"}`}>{active ? "Convite ativo" : "Convite pausado"}</span>
          <h1>Olá, {adminName}</h1>
          <p>{active ? "Tudo pronto. Acompanhe confirmações e mantenha suas listas atualizadas." : "O acesso dos convidados está pausado, mas suas informações continuam salvas."}</p>
        </div>
        <div className="configured-hero-v6__actions">
          <CopyInviteLinkButton />
          <Link href="/admin/preview" className="button button--ghost"><MailOpen size={18} /> Ver convite</Link>
        </div>
      </section>

      <section className="home-summary-grid-v6">
        <Link href="/admin/convidados" className="home-summary-card-v6">
          <span className="home-summary-card-v6__icon"><UsersRound size={20} /></span>
          <div><strong>{state.counts.guests}</strong><span>Convidados</span></div>
          <small>{state.counts.guestsConfirmed} confirmados · {state.counts.guestsPending} aguardando</small>
        </Link>
        <Link href="/admin/presentes" className="home-summary-card-v6">
          <span className="home-summary-card-v6__icon"><Gift size={20} /></span>
          <div><strong>{state.counts.gifts}</strong><span>Presentes</span></div>
          <small>{state.counts.giftsReserved} escolhidos · {state.counts.giftsAvailable} disponíveis</small>
        </Link>
      </section>

      <section className="quick-actions-v6">
        <div className="quick-actions-v6__heading"><strong>Ações rápidas</strong></div>
        <div className="quick-actions-grid-v6">
          <Link href="/admin/convidados"><Plus size={18} /><span>Convidados</span></Link>
          <Link href="/admin/presentes"><Plus size={18} /><span>Presente</span></Link>
          <Link href="/admin/convite"><MessageCircle size={18} /><span>Mensagem</span></Link>
          <Link href="/admin/convite"><MailOpen size={18} /><span>Link e acesso</span></Link>
        </div>
      </section>
    </main>
  );
}
