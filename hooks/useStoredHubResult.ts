import { useMemo, useSyncExternalStore } from "react";
import { parseHubResult, readHubResultRaw } from "@/lib/hub-session";

const noopSubscribe = () => () => {};

/**
 * Analysis result handed over via sessionStorage. Always null on the server
 * and during hydration; the stored value is picked up right after.
 */
export function useStoredHubResult() {
  const raw = useSyncExternalStore(noopSubscribe, readHubResultRaw, () => null);
  return useMemo(() => parseHubResult(raw), [raw]);
}
