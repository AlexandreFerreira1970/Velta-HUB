import { useQuery } from "@tanstack/react-query";
import { fetchConversations } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";

/** Conversation list of the signed-in user, oldest first. */
export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: fetchConversations,
    // Hub progress changes server-side; always start from fresh data.
    staleTime: 0,
  });
}
