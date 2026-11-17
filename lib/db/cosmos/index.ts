import type { Database } from "../types";
import { cosmosConversations } from "./conversations";
import { cosmosHub } from "./hub";
import { cosmosUsers } from "./users";

export const cosmosDatabase: Database = {
  users: cosmosUsers,
  conversations: cosmosConversations,
  hub: cosmosHub,
};
