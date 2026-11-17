import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.user }),
  });
}
