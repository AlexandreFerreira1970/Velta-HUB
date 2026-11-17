import { dbProvider } from "../env";
import { cosmosDatabase } from "./cosmos";
import { neonDatabase } from "./neon";
import type { Database } from "./types";

export type * from "./types";

/** Database selected by `DB_PROVIDER` ("cosmos" by default). */
export function getDb(): Database {
  return dbProvider() === "neon" ? neonDatabase : cosmosDatabase;
}
