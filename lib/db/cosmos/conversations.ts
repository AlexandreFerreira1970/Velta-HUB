import { randomUUID } from "crypto";
import type { ChatMessage, ConversationDoc, ConversationSummary } from "../../types";
import { makeMessageId } from "../ids";
import type { ConversationsRepository } from "../types";
import { getContainer, readItem } from "./client";

const conversationsContainer = () => getContainer("conversations", "/userId");

function emptyConversation(id: string, userId: string, title = ""): ConversationDoc {
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

async function getConversation(
  conversationId: string,
  userId: string,
): Promise<ConversationDoc | null> {
  return readItem<ConversationDoc>(await conversationsContainer(), conversationId, userId);
}

/**
 * Read-modify-write helper. `update` returns the fields to change. When the
 * document does not exist it is created if `createIfMissing` is set.
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
  await (await conversationsContainer()).items.upsert({
    ...doc,
    ...update(doc),
    updatedAt: new Date().toISOString(),
  });
}

export const cosmosConversations: ConversationsRepository = {
  getConversation,

  async createConversation(userId, title) {
    const doc = emptyConversation(randomUUID(), userId, title);
    await (await conversationsContainer()).items.upsert(doc);
    return doc;
  },

  async listConversations(userId) {
    const { resources } = await (await conversationsContainer()).items
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
  },

  async appendMessages(conversationId, userId, msgs, hubQuestionIndex) {
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
  },

  saveLastResponseId: (conversationId, userId, responseId, provider) =>
    updateConversation(
      conversationId,
      userId,
      () => ({ lastResponseId: responseId, lastResponseProvider: provider }),
      { createIfMissing: true },
    ),

  updateHubQuestionIndex: (conversationId, userId, hubQuestionIndex) =>
    updateConversation(conversationId, userId, () => ({ hubQuestionIndex }), {
      createIfMissing: false,
    }),

  markInitialAnalysisSent: (conversationId, userId) =>
    updateConversation(
      conversationId,
      userId,
      () => ({ initialAnalysisMessageSentAt: new Date().toISOString() }),
      { createIfMissing: false },
    ),
};
