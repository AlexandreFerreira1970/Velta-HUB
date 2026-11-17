import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { requireEnv } from "../../env";
import { SCHEMA_STATEMENTS } from "./schema";
import type { Row, SqlClient } from "./sql";

// Created lazily so the app can run without DATABASE_URL when DB_PROVIDER is
// not "neon".
let sql: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  sql ??= neon(requireEnv("DATABASE_URL"));
  return sql;
}

/** Creates the tables once per server instance (retried if it fails). */
function ensureSchema(): Promise<void> {
  schemaReady ??= (async () => {
    const s = getSql();
    await s.transaction(SCHEMA_STATEMENTS.map((stmt) => s.query(stmt)));
  })().catch((err) => {
    schemaReady = null;
    throw err;
  });
  return schemaReady;
}

export const neonSql: SqlClient = {
  async query<T extends Row = Row>(text: string, params: unknown[] = []) {
    await ensureSchema();
    return (await getSql().query(text, params)) as T[];
  },

  async transaction(statements) {
    await ensureSchema();
    const s = getSql();
    await s.transaction(statements.map(([text, params = []]) => s.query(text, params)));
  },
};
