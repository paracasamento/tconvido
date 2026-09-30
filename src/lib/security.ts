import crypto from "node:crypto";
import bcrypt from "bcryptjs";

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function randomCodeBody(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value = "";
  for (let i = 0; i < length; i++) {
    value += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return value;
}

export function createGuestCode() {
  return `PL-${randomCodeBody(8)}`;
}

export function createEventCode() {
  return `PL-${randomCodeBody(4)}-${randomCodeBody(4)}`;
}

export async function hashPassword(value: string) {
  return bcrypt.hash(value, 12);
}

export async function verifyPassword(value: string, hash: string) {
  return bcrypt.compare(value, hash);
}

function appSecuritySecret() {
  const secret = process.env.APP_SECURITY_SECRET;
  if (!secret) throw new Error("APP_SECURITY_SECRET não configurada.");
  return secret;
}

function guestCodeDigest(value: string) {
  return crypto
    .createHmac("sha256", appSecuritySecret())
    .update(value.trim().toUpperCase())
    .digest("hex");
}

function guestCodeEncryptionKey() {
  return crypto
    .createHash("sha256")
    .update(`${appSecuritySecret()}:guest-code-encryption:v1`)
    .digest();
}

/**
 * Mantido para compatibilidade com códigos antigos que eram salvos somente como HMAC.
 * Códigos novos devem usar protectGuestCode(), que continua validável sem expor a senha
 * no banco e também permite que o painel administrativo a recupere depois.
 */
export function hashGuestCode(value: string) {
  return `hmac:${guestCodeDigest(value)}`;
}

export function protectGuestCode(value: string) {
  const normalized = value.trim().toUpperCase();
  const digest = guestCodeDigest(normalized);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", guestCodeEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(normalized, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    "v2",
    digest,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url")
  ].join(":");
}

export function revealGuestCode(stored: string | null | undefined) {
  if (!stored?.startsWith("v2:")) return null;

  try {
    const [, , ivValue, tagValue, encryptedValue] = stored.split(":");
    if (!ivValue || !tagValue || !encryptedValue) return null;

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      guestCodeEncryptionKey(),
      Buffer.from(ivValue, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final()
    ]).toString("utf8");
  } catch {
    return null;
  }
}

export async function verifyGuestCode(value: string, stored: string) {
  if (stored.startsWith("v2:")) {
    const [, digest] = stored.split(":");
    if (!digest) return false;
    const expected = Buffer.from(digest, "hex");
    const actual = Buffer.from(guestCodeDigest(value), "hex");
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  }

  if (stored.startsWith("hmac:")) {
    const expected = Buffer.from(stored.slice(5), "hex");
    const actual = Buffer.from(guestCodeDigest(value), "hex");
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  }

  // Compatibilidade com códigos bem antigos, que eram armazenados com bcrypt.
  return verifyPassword(value.trim().toUpperCase(), stored);
}

export function anonymousKey(raw: string) {
  return crypto.createHmac("sha256", appSecuritySecret()).update(raw).digest("hex");
}

export function requestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    return originUrl.host === requestUrl.host;
  } catch {
    return false;
  }
}


export function sameOriginStrict(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");

  if (origin) {
    try {
      return new URL(origin).host === requestUrl.host;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === requestUrl.host;
    } catch {
      return false;
    }
  }

  return false;
}
