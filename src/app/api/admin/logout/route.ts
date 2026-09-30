import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/constants";
import {
  clearAdminSession,
  getOwnerSession,
} from "@/lib/sessions";

export async function POST(request: Request) {
  const store = await cookies();
  const hadAdminCookie = Boolean(store.get(ADMIN_COOKIE)?.value);
  const owner = await getOwnerSession();

  if (hadAdminCookie) {
    await clearAdminSession();
  }

  // When an owner opened /admin through the owner session, "Sair da área dos
  // noivos" means return to technical management, not show a redundant login.
  if (owner) {
    return NextResponse.redirect(new URL("/gestao", request.url), 303);
  }

  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
