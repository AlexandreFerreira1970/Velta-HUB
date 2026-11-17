// Client-side wrappers for the app's API routes (used by the hooks in /hooks).

import type {
  ChatMessage,
  HubDataDoc,
  ConversationState,
  ConversationSummary,
  DecisionOutput,
  HubInput,
  UserProfileUpdate,
  VeltaUser,
} from "@/lib/types";

const JSON_HEADERS = { "Content-Type": "application/json" };

async function request(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

const post = (url: string, body: unknown, method = "POST") =>
  request(url, { method, headers: JSON_HEADERS, body: JSON.stringify(body) });

// --- User --------------------------------------------------------------------

export async function fetchUser(): Promise<VeltaUser | null> {
  const res = await fetch("/api/user");
  if (!res.ok) return null;
  return ((await res.json()).user as VeltaUser) ?? null;
}

export async function updateUser(update: UserProfileUpdate): Promise<void> {
  await post("/api/user", update, "PATCH");
}

// --- Conversations -----------------------------------------------------------

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const res = await fetch("/api/conversations");
  if (!res.ok) return [];
  return ((await res.json()).conversations ?? []) as ConversationSummary[];
}

export async function createConversation(): Promise<ConversationSummary> {
  const res = await request("/api/conversations", { method: "POST" });
  return (await res.json()).conversation as ConversationSummary;
}

export async function fetchConversation(
  conversationId: string,
): Promise<ConversationState> {
  const res = await request(
    `/api/chat?conversationId=${encodeURIComponent(conversationId)}`,
  );
  const data = (await res.json()) as Partial<ConversationState>;
  return {
    messages: data.messages ?? [],
    initialAnalysisMessageSentAt: data.initialAnalysisMessageSentAt ?? null,
    hubQuestionIndex: data.hubQuestionIndex ?? null,
  };
}

/**
 * Persists client-generated messages and, when given, the hub flow position
 * (`null` marks the hub flow as finished) in a single write.
 */
export async function saveMessages(
  conversationId: string,
  messages: Array<Pick<ChatMessage, "role" | "content"> & { id?: string }>,
  hubQuestionIndex?: number | null,
): Promise<void> {
  if (!messages.length) return;
  await post("/api/chat/message", {
    messages,
    conversationId,
    ...(hubQuestionIndex !== undefined ? { hubQuestionIndex } : {}),
  });
}

export async function markInitialAnalysisSent(
  conversationId: string,
): Promise<void> {
  await post("/api/chat", { conversationId }, "PATCH");
}

// --- Assistant ---------------------------------------------------------------

/**
 * Sends a message to the assistant and consumes the SSE response.
 * `onText` receives the accumulated text after every delta.
 * Resolves with the full reply; rejects if the server reports an error.
 */
export async function streamChat(
  conversationId: string,
  content: string,
  onText: (text: string) => void,
): Promise<string> {
  const res = await post("/api/chat", { content, conversationId });
  if (!res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;

      let event: { delta?: string; done?: boolean; error?: string };
      try {
        event = JSON.parse(raw);
      } catch {
        continue; // skip malformed chunk
      }

      if (event.error) throw new Error(event.error);
      if (event.delta) {
        text += event.delta;
        onText(text);
      }
      if (event.done) return text;
    }
  }

  return text;
}

// --- Hub analysis ------------------------------------------------------------

/** Scores the hub input and asks the agent for recommended actions. */
export async function runHubAnalysis(
  hubInput: HubInput,
  conversationId: string,
): Promise<DecisionOutput> {
  const res = await post("/api/hub/calculate", { ...hubInput, conversationId });
  const { output } = (await res.json()) as { output: DecisionOutput };

  // Actions are optional — keep the computed output if generation fails.
  try {
    const actionsRes = await post("/api/hub/actions", { output });
    const { actions } = (await actionsRes.json()) as { actions?: string[] };
    if (actions?.length) output.actions = actions;
  } catch {
    // continue without generated actions
  }

  return output;
}

/** Scores a manually entered hub input (no conversation attached). */
export async function calculateHub(hubInput: HubInput): Promise<DecisionOutput> {
  const res = await fetch("/api/hub/calculate", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(hubInput),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return ((await res.json()) as { output: DecisionOutput }).output;
}

export async function fetchHubHistory(): Promise<HubDataDoc[]> {
  const res = await request("/api/hub/history");
  return ((await res.json()) as { history: HubDataDoc[] }).history;
}
