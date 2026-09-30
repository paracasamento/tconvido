import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPasswordForm } from "@/components/AdminPasswordForm";
import { requireAdmin } from "@/lib/sessions";

export default async function AdminAccountPage() {
  const session = await requireAdmin("/admin/configuracoes");

  return (
    <main className="admin-page">
      <AdminPageHeader
        eyebrow="Conta"
        title="Seu acesso"
        description="Esta área é só da conta administrativa. As informações do evento ficam na aba Convite."
      />

      <section className="account-card">
        <div className="account-profile">
          <span>{session.admin_name.slice(0, 1).toUpperCase()}</span>
          <div><strong>{session.admin_name}</strong><small>Administrador do convite</small></div>
        </div>
      </section>

      <section className="account-card">
        <h2>Alterar senha</h2>
        <p>Use uma senha exclusiva para a área dos noivos.</p>
        <AdminPasswordForm />
      </section>

      <form action="/api/admin/logout" method="post" className="account-logout">
        <button className="button button--danger-ghost">Sair da área dos noivos</button>
      </form>
    </main>
  );
}
