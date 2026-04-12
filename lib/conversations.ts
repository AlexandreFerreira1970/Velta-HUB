import { randomUUID } from "crypto";
import { getContainer } from "./cosmos";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ConversationDoc {
  id: string; // UUID — unique per conversation
  userId: string; // partition key
  title: string;
  lastResponseId: string | null;
  initialAnalysisMessageSentAt?: string; // ISO timestamp — set after AI generates initial analysis message
  hubQuestionIndex: number | null; // tracks current hub flow position; null = not in hub flow
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  hubQuestionIndex: number | null;
  createdAt: string;
  updatedAt: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function conversationsContainer() {
  return getContainer("conversations", "/userId");
}

function makeMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── create ──────────────────────────────────────────────────────────────────

export async function createConversation(
  userId: string,
  title: string,
): Promise<ConversationDoc> {
  const container = await conversationsContainer();
  const now = new Date().toISOString();

  const doc: ConversationDoc = {
    id: randomUUID(),
    userId,
    title,
    lastResponseId: null,
    hubQuestionIndex: null,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };

  await container.items.upsert(doc);
  return doc;
}

// ─── list ────────────────────────────────────────────────────────────────────

export async function listConversations(
  userId: string,
): Promise<ConversationSummary[]> {
  const container = await conversationsContainer();

  const { resources } = await container.items
    .query<ConversationSummary>(
      {
        query:
          "SELECT c.id, c.title, c.createdAt, c.updatedAt, c.hubQuestionIndex FROM c WHERE c.userId = @userId ORDER BY c.createdAt ASC",
        parameters: [{ name: "@userId", value: userId }],
      },
      { partitionKey: userId },
    )
    .fetchAll();

  return resources;
}

// ─── read ────────────────────────────────────────────────────────────────────

export async function getConversation(
  conversationId: string,
  userId: string,
): Promise<ConversationDoc | null> {
  const container = await conversationsContainer();

  try {
    const { resource } = await container
      .item(conversationId, userId)
      .read<ConversationDoc>();
    return resource ?? null;
  } catch {
    return null;
  }
}

// ─── append messages ─────────────────────────────────────────────────────────

export async function appendMessages(
  conversationId: string,
  userId: string,
  msgs: (Omit<ChatMessage, "id"> & { id?: string })[],
  hubQuestionIndex?: number | null,
): Promise<void> {
  if (!msgs.length && hubQuestionIndex === undefined) return;
  const container = await conversationsContainer();
  const now = new Date().toISOString();

  let existing: ConversationDoc | null = null;
  try {
    const { resource } = await container
      .item(conversationId, userId)
      .read<ConversationDoc>();
    existing = resource ?? null;
  } catch {
    // not found
  }

  const newMessages: ChatMessage[] = msgs.map((m) => ({
    ...m,
    id: m.id || makeMessageId(),
  }));

  const doc: ConversationDoc = existing ?? {
    id: conversationId,
    userId,
    title: "",
    lastResponseId: null,
    hubQuestionIndex: null,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };

  await container.items.upsert({
    ...doc,
    messages: [...doc.messages, ...newMessages],
    ...(hubQuestionIndex !== undefined ? { hubQuestionIndex } : {}),
    updatedAt: now,
  });
}

export async function appendMessage(
  conversationId: string,
  userId: string,
  message: Omit<ChatMessage, "id">,
): Promise<void> {
  return appendMessages(conversationId, userId, [message]);
}

// ─── update lastResponseId ──────────────────────────────────────────────────

export async function saveLastResponseId(
  conversationId: string,
  userId: string,
  responseId: string,
): Promise<void> {
  const container = await conversationsContainer();
  const now = new Date().toISOString();

  let existing: ConversationDoc | null = null;
  try {
    const { resource } = await container
      .item(conversationId, userId)
      .read<ConversationDoc>();
    existing = resource ?? null;
  } catch {
    // not found
  }

  const doc: ConversationDoc = existing ?? {
    id: conversationId,
    userId,
    title: "",
    lastResponseId: null,
    hubQuestionIndex: null,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };

  await container.items.upsert({
    ...doc,
    lastResponseId: responseId,
    updatedAt: now,
  });
}

// ─── update hub flow state ──────────────────────────────────────────────────

export async function updateHubQuestionIndex(
  conversationId: string,
  userId: string,
  hubQuestionIndex: number | null,
): Promise<void> {
  const container = await conversationsContainer();
  const now = new Date().toISOString();

  let existing: ConversationDoc | null = null;
  try {
    const { resource } = await container
      .item(conversationId, userId)
      .read<ConversationDoc>();
    existing = resource ?? null;
  } catch {
    // not found
  }

  if (!existing) return;

  await container.items.upsert({
    ...existing,
    hubQuestionIndex,
    updatedAt: now,
  });
}

// ─── mark initial analysis message sent ─────────────────────────────────────

export async function markInitialAnalysisSent(
  conversationId: string,
  userId: string,
): Promise<void> {
  const container = await conversationsContainer();
  const now = new Date().toISOString();

  let existing: ConversationDoc | null = null;
  try {
    const { resource } = await container
      .item(conversationId, userId)
      .read<ConversationDoc>();
    existing = resource ?? null;
  } catch {
    // not found
  }

  if (!existing) return;

  await container.items.upsert({
    ...existing,
    initialAnalysisMessageSentAt: now,
    updatedAt: now,
  });
}
