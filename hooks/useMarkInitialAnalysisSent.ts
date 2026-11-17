import { useMutation } from "@tanstack/react-query";
import { markInitialAnalysisSent } from "@/lib/api-client";

export function useMarkInitialAnalysisSent() {
  return useMutation({ mutationFn: markInitialAnalysisSent });
}
