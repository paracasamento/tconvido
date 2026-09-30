import { neon } from "@neondatabase/serverless";

export type DbRow = Record<string, any>;
export type DbSql = (strings: TemplateStringsArray, ...values: any[]) => Promise<DbRow[]>;

let client: ReturnType<typeof neon> | null = null;

export function db(): DbSql {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL não configurada.");
    client = neon(url);
  }

  // A aplicação usa o cliente Neon somente como tagged template SQL.
  // O pacote também expõe overloads para outros formatos de resultado,
  // o que faz o TypeScript inferir unions desnecessários (FullQueryResults etc.).
  // Normalizamos aqui para o formato realmente usado pelo projeto: array de linhas.
  return client as unknown as DbSql;
}
