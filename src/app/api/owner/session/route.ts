import { NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/sessions";

export async function GET() {
  const session = await getOwnerSession();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    owner: {
      id: session.admin_id,
      name: session.admin_name,
      event_id: session.event_id,
      role: session.role
    }
  });
}
