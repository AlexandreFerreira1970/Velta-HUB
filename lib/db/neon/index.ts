import type { Database } from "../types";
import { neonSql } from "./client";
import { createNeonConversations } from "./conversations";
import { createNeonHub } from "./hub";
import type { SqlClient } from "./sql";
import { createNeonUsers } from "./users";

export function createNeonDatabase(sql: SqlClient): Database {
  return {
    users: createNeonUsers(sql),
    conversations: createNeonConversations(sql),
    hub: createNeonHub(sql),
  };
}

export const neonDatabase = createNeonDatabase(neonSql);
