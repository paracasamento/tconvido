export const EVENT_SLUG =
  process.env.EVENT_SLUG || "pedro-leticia-cha-de-panela";

export const GUEST_COOKIE = "pl_guest_session";
export const INVITE_COOKIE = "pl_invite_session";
export const ADMIN_COOKIE = "pl_admin_session";
export const OWNER_COOKIE = "pl_owner_session";
export const GUEST_SESSION_DAYS = 30;
export const INVITE_SESSION_DAYS = 30;
export const ADMIN_SESSION_HOURS = 12;
export const OWNER_SESSION_HOURS = 4;

export const BRAND = {
  primary: "#0f0a71",
  couple: "Pedro & Letícia"
} as const;

export const RSVP_COOKIE = "pl_rsvp_submission";
