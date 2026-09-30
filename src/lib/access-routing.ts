export function safeInternalPath(
  value: string | string[] | undefined,
  fallback: string,
  allowedPrefixes: string[]
) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate || typeof candidate !== "string") return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  if (candidate.includes("\\") || candidate.includes("\0")) return fallback;

  const pathname = candidate.split("?")[0].split("#")[0];
  const allowed = allowedPrefixes.some(prefix =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  return allowed ? candidate : fallback;
}

export function loginRedirect(base: string, next: string, fallback: string) {
  if (next === fallback) return base;
  return `${base}?next=${encodeURIComponent(next)}`;
}
