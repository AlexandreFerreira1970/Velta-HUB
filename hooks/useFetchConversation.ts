import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchConversation } from "@/lib/api-client";
import type { ConversationState } from "@/lib/types";
import { queryKeys } from "./queryKeys";

/**
 * Imperative loader for a conversation's messages. Always hits the server
 * (messages change constantly) but goes through the query cache.
 */
export function useFetchConversation(): (
  id: string,
) => Promise<ConversationState> {
  const queryClient = useQueryClient();
  return useCallback(
    (id: string) =>
      queryClient.fetchQuery({
        queryKey: queryKeys.conversation(id),
        queryFn: () => fetchConversation(id),
        staleTime: 0,
      }),
    [queryClient],
  );
}
