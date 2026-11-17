// Client-side hand-off of analysis results between pages via sessionStorage.

import type { DecisionOutput } from "./types";

const RESULT_KEY = "hub_result";
const ANALYSIS_CONTEXT_KEY = "hub_analysis_context";

export interface StoredHubResult {
  output: DecisionOutput;
  conversationId: string | null;
}

/** Result shown on /hub/result. */
export function storeHubResult(result: StoredHubResult): void {
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
}

/** Raw stored result (a string, so it can be compared between reads). */
export function readHubResultRaw(): string | null {
  return sessionStorage.getItem(RESULT_KEY);
}

export function readHubResult(): StoredHubResult | null {
  return parseHubResult(readHubResultRaw());
}

export function parseHubResult(raw: string | null): StoredHubResult | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Support both formats: { output, conversationId } and legacy plain output
    return parsed.output
      ? { output: parsed.output, conversationId: parsed.conversationId ?? null }
      : { output: parsed, conversationId: null };
  } catch {
    return null;
  }
}

/** Analysis the chat should comment on when opened from /hub/result. */
export function storeAnalysisContext(output: DecisionOutput): void {
  sessionStorage.setItem(ANALYSIS_CONTEXT_KEY, JSON.stringify(output));
}

/** Reads and removes the pending analysis context (consumed once). */
export function takeAnalysisContext(): DecisionOutput | null {
  const raw = sessionStorage.getItem(ANALYSIS_CONTEXT_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(ANALYSIS_CONTEXT_KEY);
  try {
    return JSON.parse(raw) as DecisionOutput;
  } catch {
    return null;
  }
}
