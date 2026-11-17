import { useMutation, useQueryClient } from "@tanstack/react-query";
import { calculateHub } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";

/** Scores a manually entered hub input. */
export function useCalculateHub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: calculateHub,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.hubHistory }),
  });
}
