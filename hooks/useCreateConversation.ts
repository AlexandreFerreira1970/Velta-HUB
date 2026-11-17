import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createConversation } from "@/lib/api-client";
import type { ConversationSummary } from "@/lib/types";
import { queryKeys } from "./queryKeys";

/** Creates a conversation and appends it to the cached list. */
export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createConversation,
    onSuccess: (conv) => {
      queryClient.setQueryData<ConversationSummary[]>(
        queryKeys.conversations,
        (prev = []) => [...prev, conv],
      );
    },
  });
}
