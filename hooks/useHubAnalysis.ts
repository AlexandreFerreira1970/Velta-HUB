import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runHubAnalysis } from "@/lib/api-client";
import { storeHubResult } from "@/lib/hub-session";
import type { HubInput } from "@/lib/types";
import { queryKeys } from "./queryKeys";

type HubAnalysisVars = { hubInput: HubInput; conversationId: string };

/**
 * Scores a conversation's questionnaire answers (plus AI actions) and stores
 * the result for /hub/result.
 */
export function useHubAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ hubInput, conversationId }: HubAnalysisVars) =>
      runHubAnalysis(hubInput, conversationId),
    onSuccess: (output, { conversationId }) => {
      storeHubResult({ output, conversationId });
      queryClient.invalidateQueries({ queryKey: queryKeys.hubHistory });
    },
  });
}
