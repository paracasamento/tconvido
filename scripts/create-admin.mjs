import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;
const EVENT_SLUG = process.env.EVENT_SLUG || "pedro-leticia-cha-de-panela";
const name = process.env.ADMIN_NAME;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const role = (process.env.ADMIN_ROLE || "owner").toLowerCase();

if (!DATABASE_URL || !name || !email || !password) {
  console.error("Defina DATABASE_URL, ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD.");
  process.exit(1);
}

if (!["owner", "admin"].includes(role)) {
  console.error("ADMIN_ROLE deve ser owner ou admin.");
  process.exit(1);
}

if (password.length < 12) {
  console.error("ADMIN_PASSWORD deve ter pelo menos 12 caracteres.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const passwordHash = await bcrypt.hash(password, 12);

const rows = await sql`
  WITH event_row AS (
    SELECT id FROM events WHERE slug = ${EVENT_SLUG} LIMIT 1
  ),
  admin_row AS (
    INSERT INTO admins (name, email, password_hash)
    VALUES (${name}, ${email}, ${passwordHash})
    ON CONFLICT ((lower(email)))
    DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, is_active = true
    RETURNING id
  )
  INSERT INTO event_admins (event_id, admin_id, role)
  SELECT event_row.id, admin_row.id, ${role}
  FROM event_row, admin_row
  ON CONFLICT (event_id, admin_id) DO UPDATE SET role = EXCLUDED.role
  RETURNING admin_id
`;

console.log(rows.length ? `Administrador criado/atualizado com role=${role}.` : "Evento não encontrado.");
