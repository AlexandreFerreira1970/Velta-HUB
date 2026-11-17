export const queryKeys = {
  user: ["user"] as const,
  conversations: ["conversations"] as const,
  conversation: (id: string) => ["conversations", id] as const,
  hubHistory: ["hub", "history"] as const,
};
