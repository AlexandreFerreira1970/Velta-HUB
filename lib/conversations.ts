import { randomUUID } from "crypto";
import { getContainer } from "./cosmos";
import type {
  ChatMessage,
  ConversationDoc,
  ConversationSummary,
} from "./types";

export type { ChatMessage, ConversationDoc, ConversationSummary };

type NewMessage = Omit<ChatMessage, "id"> & { id?: string };

// --- helpers -----------------------------------------------------------------

function conversationsContainer() {
  return getContainer("conversations", "/userId");
}

function makeMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyConversation(
  id: string,
  userId: string,
  title = "",
): ConversationDoc {
  const now = new Date().toISOString();
  return {
    id,
    userId,
    title,
    lastResponseId: null,
    hubQuestionIndex: null,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Read-modify-write helper. `update` receives the current document and returns
 * the fields to change. When the document does not exist it is created from
 * scratch if `createIfMissing` is set; otherwise nothing is written.
 */
async function updateConversation(
  conversationId: string,
  userId: string,
  update: (doc: ConversationDoc) => Partial<ConversationDoc>,
  { createIfMissing }: { createIfMissing: boolean },
): Promise<void> {
  const existing = await getConversation(conversationId, userId);
  if (!existing && !createIfMissing) return;

  const doc = existing ?? emptyConversation(conversationId, userId);
  const container = await conversationsContainer();
  await container.items.upsert({
    ...doc,
    ...update(doc),
    updatedAt: new Date().toISOString(),
  });
}

// --- create ------------------------------------------------------------------

export async function createConversation(
  userId: string,
  title: string,
): Promise<ConversationDoc> {
  const container = await conversationsContainer();
  const doc = emptyConversation(randomUUID(), userId, title);
  await container.items.upsert(doc);
  return doc;
}

// --- list --------------------------------------------------------------------

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

// --- read --------------------------------------------------------------------

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

// --- writes ------------------------------------------------------------------

/**
 * Appends messages and optionally updates the hub flow position in a single
 * write. Creates the conversation if it does not exist yet.
 */
export async function appendMessages(
  conversationId: string,
  userId: string,
  msgs: NewMessage[],
  hubQuestionIndex?: number | null,
): Promise<void> {
  if (!msgs.length && hubQuestionIndex === undefined) return;

  const newMessages: ChatMessage[] = msgs.map((m) => ({
    ...m,
    id: m.id || makeMessageId(),
  }));

  await updateConversation(
    conversationId,
    userId,
    (doc) => ({
      messages: [...doc.messages, ...newMessages],
      ...(hubQuestionIndex !== undefined ? { hubQuestionIndex } : {}),
    }),
    { createIfMissing: true },
  );
}

export function appendMessage(
  conversationId: string,
  userId: string,
  message: Omit<ChatMessage, "id">,
): Promise<void> {
  return appendMessages(conversationId, userId, [message]);
}

export function saveLastResponseId(
  conversationId: string,
  userId: string,
  responseId: string,
): Promise<void> {
  return updateConversation(
    conversationId,
    userId,
    () => ({ lastResponseId: responseId }),
    { createIfMissing: true },
  );
}

export function updateHubQuestionIndex(
  conversationId: string,
  userId: string,
  hubQuestionIndex: number | null,
): Promise<void> {
  return updateConversation(
    conversationId,
    userId,
    () => ({ hubQuestionIndex }),
    { createIfMissing: false },
  );
}

export function markInitialAnalysisSent(
  conversationId: string,
  userId: string,
): Promise<void> {
  return updateConversation(
    conversationId,
    userId,
    () => ({ initialAnalysisMessageSentAt: new Date().toISOString() }),
    { createIfMissing: false },
  );
}
