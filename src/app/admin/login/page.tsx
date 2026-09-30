import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { FloralFrame } from "@/components/Florals";
import { Monogram } from "@/components/Monogram";
import { safeInternalPath } from "@/lib/access-routing";
import { getAdminSession } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = safeInternalPath(params.next, "/admin", ["/admin"]);

  const session = await getAdminSession();
  if (session) redirect(next);

  return (
    <main className="center-page">
      <FloralFrame subtle />
      <section className="narrow-panel">
        <Monogram size={96} priority />
        <p className="eyebrow">Área dos noivos</p>
        <h1>Bem-vindos</h1>
        <p>Entre para gerenciar convidados, presentes e informações do chá.</p>
        <AdminLoginForm redirectTo={next} allowUsername />
      </section>
    </main>
  );
}
