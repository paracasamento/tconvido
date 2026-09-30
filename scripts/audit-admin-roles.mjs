import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
const EVENT_SLUG = process.env.EVENT_SLUG || "pedro-leticia-cha-de-panela";

if (!DATABASE_URL) {
  console.error("Defina DATABASE_URL.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const rows = await sql`
  SELECT
    e.slug,
    e.title,
    a.id AS admin_id,
    a.name,
    a.email,
    a.is_active,
    ea.role
  FROM events e
  LEFT JOIN event_admins ea ON ea.event_id = e.id
  LEFT JOIN admins a ON a.id = ea.admin_id
  WHERE e.slug = ${EVENT_SLUG}
  ORDER BY
    CASE WHEN ea.role = 'owner' THEN 0 ELSE 1 END,
    lower(a.email)
`;

if (!rows.length) {
  console.error(`Evento não encontrado: ${EVENT_SLUG}`);
  process.exit(1);
}

const active = rows.filter(row => row.admin_id && row.is_active);
const owners = active.filter(row => row.role === "owner");
const admins = active.filter(row => row.role === "admin");

console.table(
  rows.map(row => ({
    evento: row.slug,
    nome: row.name || "(sem administrador)",
    email: row.email || "-",
    ativo: row.is_active ?? false,
    role: row.role || "-"
  }))
);

let failed = false;

if (owners.length < 1) {
  console.error("ERRO: o evento não possui nenhuma conta owner ativa.");
  failed = true;
}

if (owners.length > 1) {
  console.warn(`ATENÇÃO: existem ${owners.length} contas owner ativas.`);
}

if (admins.length < 1) {
  console.warn("ATENÇÃO: ainda não existe uma conta admin ativa para os noivos.");
}

for (const row of active) {
  if (!["owner", "admin"].includes(row.role)) {
    console.error(`ERRO: role inválida para ${row.email}: ${row.role}`);
    failed = true;
  }
}

if (failed) process.exit(2);

console.log("");
console.log(`OK: ${owners.length} owner(s) e ${admins.length} admin(s) ativos para ${EVENT_SLUG}.`);
