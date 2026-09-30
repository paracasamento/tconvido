import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { FloralFrame } from "@/components/Florals";
import { Monogram } from "@/components/Monogram";
import { safeInternalPath } from "@/lib/access-routing";
import { getOwnerSession } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export default async function GestaoLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = safeInternalPath(params.next, "/gestao", ["/gestao"]);

  const session = await getOwnerSession();
  if (session) redirect(next);

  return (
    <main className="center-page">
      <FloralFrame subtle />
      <section className="narrow-panel">
        <Monogram size={88} priority />
        <p className="eyebrow">Área de gestão</p>
        <h1>Acesso administrativo</h1>
        <p>Entre com sua conta de proprietária para acessar o editor e as ferramentas técnicas.</p>
        <AdminLoginForm
          redirectTo={next}
          requiredRole="owner"
          endpoint="/api/owner/login"
        />
      </section>
    </main>
  );
}
