import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { INVITE_COOKIE, INVITE_SESSION_DAYS } from "@/lib/constants";
import { loginRedirect } from "@/lib/access-routing";

export type InviteSession = {
  event_id: string;
  name: string;
  guest_id?: string | null;
  expires_at: number;
};

function sessionSecret() {
  const secret = process.env.APP_SECURITY_SECRET;
  if (!secret) throw new Error("APP_SECURITY_SECRET não configurada.");
  return secret;
}

function signature(payload: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function createInviteSession(eventId: string, name: string, guestId?: string | null) {
  const expiresAt = Date.now() + INVITE_SESSION_DAYS * 86400000;
  const payload: InviteSession = {
    event_id: eventId,
    name: name.trim().replace(/\s+/g, " "),
    guest_id: guestId || null,
    expires_at: expiresAt
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const value = `${encoded}.${signature(encoded)}`;

  const store = await cookies();
  store.set(INVITE_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt)
  });
}

export async function getInviteSession(): Promise<InviteSession | null> {
  const store = await cookies();
  const raw = store.get(INVITE_COOKIE)?.value;
  if (!raw) return null;

  const separator = raw.lastIndexOf(".");
  if (separator < 1) return null;

  const encoded = raw.slice(0, separator);
  const receivedSignature = raw.slice(separator + 1);
  const expectedSignature = signature(encoded);
  if (!safeEqual(receivedSignature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as InviteSession;
    if (!payload.event_id || !payload.name || !payload.expires_at) return null;
    if (payload.expires_at <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function requireInvite(returnTo = "/convite") {
  const session = await getInviteSession();
  if (!session) redirect(loginRedirect("/acesso", returnTo, "/convite"));
  return session;
}
