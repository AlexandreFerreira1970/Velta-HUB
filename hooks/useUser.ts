import { useQuery } from "@tanstack/react-query";
import { fetchUser } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";

/** Signed-in user's profile (null when it could not be loaded). */
export function useUser() {
  return useQuery({ queryKey: queryKeys.user, queryFn: fetchUser });
}
