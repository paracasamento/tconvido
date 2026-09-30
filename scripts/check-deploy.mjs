const required = [
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_BUCKET",
  "EVENT_SLUG",
  "APP_SECURITY_SECRET",
];

const errors = [];
const warnings = [];

for (const key of required) {
  if (!process.env[key]?.trim()) errors.push(`Missing ${key}`);
}

if (!process.env.SUPABASE_SECRET_KEY?.trim() && !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
  errors.push("Missing SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)");
}

if (process.env.ALLOW_DRAFT_GUEST_ACCESS === "true") {
  warnings.push("ALLOW_DRAFT_GUEST_ACCESS=true — production should normally be false");
}

const secret = process.env.APP_SECURITY_SECRET || "";
if (secret && secret.length < 32) {
  errors.push("APP_SECURITY_SECRET must be at least 32 characters");
}

const databaseUrl = process.env.DATABASE_URL || "";
if (databaseUrl && !databaseUrl.startsWith("postgres")) {
  errors.push("DATABASE_URL does not look like a PostgreSQL connection string");
}
if (databaseUrl && !databaseUrl.includes("-pooler")) {
  warnings.push("DATABASE_URL does not appear to be a Neon pooled connection URL");
}

if (process.env.NEXT_PUBLIC_SITE_URL && !/^https:\/\//.test(process.env.NEXT_PUBLIC_SITE_URL)) {
  warnings.push("NEXT_PUBLIC_SITE_URL should use https:// in production");
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

console.log("Deployment environment check passed.");
