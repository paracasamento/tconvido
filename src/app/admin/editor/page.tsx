import { redirect } from "next/navigation";
import { getAdminSession, getOwnerSession } from "@/lib/sessions";

export default async function LegacyEditorRedirectPage() {
  const owner = await getOwnerSession();
  if (owner) redirect("/gestao/editor");

  const admin = await getAdminSession();
  if (admin) redirect("/admin");

  redirect("/gestao/login?next=%2Fgestao%2Feditor");
}
