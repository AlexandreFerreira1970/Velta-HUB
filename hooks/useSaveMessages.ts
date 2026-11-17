import { useMutation } from "@tanstack/react-query";
import { saveMessages } from "@/lib/api-client";

type SaveMessagesVars = {
  conversationId: string;
  messages: Parameters<typeof saveMessages>[1];
  /** New hub flow position; `null` marks the flow finished. */
  hubQuestionIndex?: number | null;
};

/** Persists client-generated messages (fire-and-forget; errors are logged). */
export function useSaveMessages() {
  return useMutation({
    mutationFn: ({ conversationId, messages, hubQuestionIndex }: SaveMessagesVars) =>
      saveMessages(conversationId, messages, hubQuestionIndex),
    onError: (err) => console.error("[saveMessages]", err),
  });
}
