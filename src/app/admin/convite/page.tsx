import Link from "next/link";
import { Eye, KeyRound, MapPin } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EventStatusControl } from "@/components/EventStatusControl";
import { ShareInvitePanel } from "@/components/admin/ShareInvitePanel";
import { getAdminSetupState } from "@/lib/admin-setup";
import { requireAdmin } from "@/lib/sessions";

export default async function AdminInvitationPage() {
  const session = await requireAdmin("/admin/convite");
  const setup = await getAdminSetupState(session.event_id);
  const published = setup.event.status !== "draft";

  return (
    <main className="admin-page admin-invite-page-v6">
      <AdminPageHeader
        title={published ? "Convite" : "Seu convite"}
        description={published ? "Link, mensagem e configurações em um só lugar." : "Conclua a configuração para liberar o link."}
      />

      {published && <ShareInvitePanel coupleNames={setup.event.couple_names} paused={setup.event.status === "closed"} />}

      <section className="invitation-settings-section-v6">
        <div className="admin-list-toolbar-v6"><strong>Configurações</strong></div>
        <div className="invitation-settings-grid-v6">
          <Link href="/admin/preparar/festa" className="invitation-setting-card-v6">
            <span><MapPin size={19} /></span>
            <div><strong>Festa</strong><small>Data, horário, local e mensagem</small></div>
          </Link>
          <Link href="/admin/preparar/acesso" className="invitation-setting-card-v6">
            <span><KeyRound size={19} /></span>
            <div><strong>Acesso</strong><small>{setup.event.guest_access_mode === "event" ? "Senha única" : "Senha individual"}</small></div>
          </Link>
          <Link href="/admin/preview" className="invitation-setting-card-v6">
            <span><Eye size={19} /></span>
            <div><strong>Prévia</strong><small>Veja como o convidado verá</small></div>
          </Link>
          {!published && (
            <Link href="/admin/preparar/revisao" className="invitation-setting-card-v6">
              <span>5</span>
              <div><strong>Publicar</strong><small>Finalize a configuração</small></div>
            </Link>
          )}
        </div>
      </section>

      <section className="invitation-status-v6">
        <div>
          <strong>{setup.event.status === "active" ? "Convite ativo" : setup.event.status === "closed" ? "Convite pausado" : "Ainda não publicado"}</strong>
          <span>{setup.event.status === "active" ? "Os convidados já podem acessar." : setup.event.status === "closed" ? "O acesso está temporariamente pausado." : "Publique quando tudo estiver pronto."}</span>
        </div>
        <EventStatusControl status={setup.event.status} canActivate={setup.coreReady} afterActivateHref="/admin/convite" />
      </section>
    </main>
  );
}
