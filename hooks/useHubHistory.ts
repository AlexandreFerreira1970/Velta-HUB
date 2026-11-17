import { useQuery } from "@tanstack/react-query";
import { fetchHubHistory } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";

/** All hub analyses of the signed-in user, newest first. */
export function useHubHistory() {
  return useQuery({ queryKey: queryKeys.hubHistory, queryFn: fetchHubHistory });
}
