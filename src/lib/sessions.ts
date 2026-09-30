import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_HOURS,
  OWNER_COOKIE,
  OWNER_SESSION_HOURS,
  GUEST_COOKIE,
  GUEST_SESSION_DAYS,
  RSVP_COOKIE
} from "@/lib/constants";
import { hashToken, randomToken } from "@/lib/security";
import { getInviteSession } from "@/lib/invite-session";
import { loginRedirect } from "@/lib/access-routing";

export type GuestSession = {
  guest_id: string;
  guest_name: string;
  event_id: string;
  rsvp_status: "pending" | "confirmed" | "declined";
};

export type AdminSession = {
  admin_id: string;
  admin_name: string;
  event_id: string;
  role: "owner" | "admin";
};


export type RsvpSubmissionSession = {
  submission_id: string;
  event_id: string;
  submitted_name: string;
  has_children: boolean;
  children_count: number;
  guest_id: string | null;
  match_status: "exact" | "probable" | "unmatched" | "reviewed";
};

export async function createRsvpSubmissionSession(submissionId: string) {
  const sql = db();
  const token = randomToken();
  const tokenHash = hashToken(token);
  const expires = new Date(Date.now() + GUEST_SESSION_DAYS * 86400000);

  await sql`
    UPDATE rsvp_submission_sessions
    SET revoked_at = now()
    WHERE submission_id = ${submissionId}
      AND revoked_at IS NULL
  `;

  await sql`
    INSERT INTO rsvp_submission_sessions (submission_id, token_hash, expires_at)
    VALUES (${submissionId}, ${tokenHash}, ${expires.toISOString()})
  `;

  const store = await cookies();
  store.set(RSVP_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires
  });
}

export async function getRsvpSubmissionSession(): Promise<RsvpSubmissionSession | null> {
  const store = await cookies();
  const token = store.get(RSVP_COOKIE)?.value;
  if (!token) return null;

  const sql = db();
  const tokenHash = hashToken(token);

  try {
    const rows = await sql`
      SELECT
        s.id AS submission_id,
        s.event_id,
        s.submitted_name,
        s.has_children,
        s.children_count,
        s.guest_id,
        s.match_status
      FROM rsvp_submission_sessions rss
      JOIN rsvp_submissions s ON s.id = rss.submission_id
      WHERE
        rss.token_hash = ${tokenHash}
        AND rss.revoked_at IS NULL
        AND rss.expires_at > now()
      LIMIT 1
    `;

    return (rows[0] as RsvpSubmissionSession | undefined) ?? null;
  } catch (error: any) {
    // During rollout an older database may not have the RSVP tables yet.
    // Reading the invitation must not become a 500/reload loop because of that.
    if (error?.code === "42P01" || /does not exist/i.test(String(error?.message || ""))) {
      return null;
    }
    throw error;
  }
}

export async function clearRsvpSubmissionSession() {
  const store = await cookies();
  const token = store.get(RSVP_COOKIE)?.value;

  if (token) {
    const sql = db();
    await sql`
      UPDATE rsvp_submission_sessions
      SET revoked_at = now()
      WHERE token_hash = ${hashToken(token)}
        AND revoked_at IS NULL
    `;
  }

  store.delete(RSVP_COOKIE);
}

export async function createGuestSession(guestId: string) {
  const sql = db();
  const token = randomToken();
  const tokenHash = hashToken(token);
  const expires = new Date(Date.now() + GUEST_SESSION_DAYS * 86400000);

  // A guest identity may have only one active browser session at a time.
  // Logging in again rotates the session instead of accumulating parallel logins.
  await sql`
    UPDATE guest_sessions
    SET revoked_at = now()
    WHERE guest_id = ${guestId}
      AND revoked_at IS NULL
  `;

  await sql`
    INSERT INTO guest_sessions (guest_id, token_hash, expires_at)
    VALUES (${guestId}, ${tokenHash}, ${expires.toISOString()})
  `;

  const store = await cookies();
  store.set(GUEST_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires
  });
}

export async function getGuestSession(): Promise<GuestSession | null> {
  const store = await cookies();
  const token = store.get(GUEST_COOKIE)?.value;
  if (!token) return null;

  const sql = db();
  const tokenHash = hashToken(token);
  const rows = await sql`
    SELECT
      gs.guest_id,
      g.name AS guest_name,
      g.event_id,
      g.rsvp_status
    FROM guest_sessions gs
    JOIN guests g ON g.id = gs.guest_id
    WHERE
      gs.token_hash = ${tokenHash}
      AND gs.revoked_at IS NULL
      AND gs.expires_at > now()
      AND g.deleted_at IS NULL
    LIMIT 1
  `;
  return (rows[0] as GuestSession | undefined) ?? null;
}


export async function getGuestRsvpSnapshot(guestId: string) {
  const sql = db();
  const rows = await sql`
    SELECT
      id,
      event_id,
      name,
      submitted_name,
      rsvp_status,
      confirmed_adults,
      confirmed_children
    FROM guests
    WHERE id = ${guestId}
      AND deleted_at IS NULL
    LIMIT 1
  `;
  return rows[0] as any | undefined;
}

export async function getGuestReservationSummary(guestId: string, eventId: string) {
  const sql = db();
  const rows = await sql`
    SELECT r.gift_id, g.name
    FROM reservations r
    JOIN gifts g ON g.id = r.gift_id
    WHERE r.guest_id = ${guestId}
      AND r.event_id = ${eventId}
      AND r.released_at IS NULL
      AND g.deleted_at IS NULL
    ORDER BY r.created_at DESC
    LIMIT 1
  `;
  return rows[0]
    ? { gift_id: String(rows[0].gift_id), name: String(rows[0].name || "Presente") }
    : null;
}

export async function requireGuest(returnTo = "/presentes") {
  const session = await getGuestSession();
  if (session) return session;

  // If the person already passed invitation access, do not ask for the code
  // again. Route them to RSVP, which is the missing step before gifts.
  const invite = await getInviteSession();
  if (invite) redirect("/presenca");

  redirect(loginRedirect("/acesso", returnTo, "/convite"));
}

export async function createAdminSession(adminId: string) {
  const sql = db();
  const token = randomToken();
  const tokenHash = hashToken(token);
  const expires = new Date(Date.now() + ADMIN_SESSION_HOURS * 3600000);

  await sql`
    INSERT INTO admin_sessions (admin_id, token_hash, expires_at)
    VALUES (${adminId}, ${tokenHash}, ${expires.toISOString()})
  `;

  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires
  });
}


export async function createOwnerSession(adminId: string) {
  const sql = db();

  const roleRows = await sql`
    SELECT ea.event_id, ea.role
    FROM event_admins ea
    JOIN admins a ON a.id = ea.admin_id
    WHERE
      ea.admin_id = ${adminId}
      AND ea.role = 'owner'
      AND a.is_active = true
    LIMIT 1
  `;

  if (!roleRows.length) {
    throw new Error("Conta sem permissão de owner.");
  }

  const token = randomToken();
  const tokenHash = hashToken(token);
  const expires = new Date(Date.now() + OWNER_SESSION_HOURS * 3600000);

  await sql`
    INSERT INTO admin_sessions (admin_id, token_hash, expires_at)
    VALUES (${adminId}, ${tokenHash}, ${expires.toISOString()})
  `;

  const store = await cookies();
  store.set(OWNER_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires
  });
}

export async function getOwnerSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(OWNER_COOKIE)?.value;
  if (!token) return null;

  const sql = db();
  const tokenHash = hashToken(token);
  const rows = await sql`
    SELECT
      s.admin_id,
      a.name AS admin_name,
      ea.event_id,
      ea.role
    FROM admin_sessions s
    JOIN admins a ON a.id = s.admin_id
    JOIN event_admins ea ON ea.admin_id = a.id
    WHERE
      s.token_hash = ${tokenHash}
      AND s.revoked_at IS NULL
      AND s.expires_at > now()
      AND a.is_active = true
      AND ea.role = 'owner'
    LIMIT 1
  `;

  return (rows[0] as AdminSession | undefined) ?? null;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;

  if (token) {
    const sql = db();
    const tokenHash = hashToken(token);
    const rows = await sql`
      SELECT
        s.admin_id,
        a.name AS admin_name,
        ea.event_id,
        ea.role
      FROM admin_sessions s
      JOIN admins a ON a.id = s.admin_id
      JOIN event_admins ea ON ea.admin_id = a.id
      WHERE
        s.token_hash = ${tokenHash}
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND a.is_active = true
        AND ea.role IN ('owner', 'admin')
      ORDER BY
        CASE WHEN ea.role = 'owner' THEN 0 ELSE 1 END,
        ea.created_at ASC
      LIMIT 1
    `;

    if (rows[0]) {
      return rows[0] as AdminSession;
    }
  }

  // Owner sessions are intentionally valid for the bride/admin panel too.
  // The reverse is NOT true: an admin session never grants /gestao access.
  return getOwnerSession();
}

export async function requireAdmin(returnTo = "/admin") {
  const session = await getAdminSession();
  if (!session) redirect(loginRedirect("/admin/login", returnTo, "/admin"));
  return session;
}


export async function requireOwner(returnTo = "/gestao") {
  const session = await getOwnerSession();
  if (!session) redirect(loginRedirect("/gestao/login", returnTo, "/gestao"));
  return session;
}


export async function clearOwnerSession() {
  const store = await cookies();
  const token = store.get(OWNER_COOKIE)?.value;

  if (token) {
    const sql = db();
    await sql`
      UPDATE admin_sessions
      SET revoked_at = now()
      WHERE token_hash = ${hashToken(token)}
        AND revoked_at IS NULL
    `;
  }

  store.delete(OWNER_COOKIE);
}

export async function clearGuestSession() {
  const store = await cookies();
  const token = store.get(GUEST_COOKIE)?.value;
  if (token) {
    const sql = db();
    await sql`
      UPDATE guest_sessions
      SET revoked_at = now()
      WHERE token_hash = ${hashToken(token)} AND revoked_at IS NULL
    `;
  }
  store.delete(GUEST_COOKIE);
}

export async function clearAdminSession() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (token) {
    const sql = db();
    await sql`
      UPDATE admin_sessions
      SET revoked_at = now()
      WHERE token_hash = ${hashToken(token)} AND revoked_at IS NULL
    `;
  }
  store.delete(ADMIN_COOKIE);
}
