import { NextResponse } from "next/server";
import { clearOwnerSession } from "@/lib/sessions";
import { sameOriginStrict } from "@/lib/security";

export async function POST(request: Request) {
  if (!sameOriginStrict(request)) {
    return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  }

  await clearOwnerSession();
  return NextResponse.redirect(new URL("/gestao/login", request.url), 303);
}
