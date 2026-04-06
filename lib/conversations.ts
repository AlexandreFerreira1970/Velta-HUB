import { getContainer } from "./cosmos";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ConversationDoc {
  id: string; // userId
  userId: string;
  lastResponseId: string | null; // ID do último response — usado como previous_response_id
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export async function getConversation(
  userId: string,
): Promise<ConversationDoc | null> {
  const container = await getContainer("conversations");

  try {
    const { resource } = await container
      .item(userId, userId)
      .read<ConversationDoc>();
    return resource ?? null;
  } catch {
    return null;
  }
}

export async function saveLastResponseId(
  userId: string,
  responseId: string,
): Promise<void> {
  const container = await getContainer("conversations");
  const now = new Date().toISOString();

  let existing: ConversationDoc | null = null;
  try {
    const { resource } = await container
      .item(userId, userId)
      .read<ConversationDoc>();
    existing = resource ?? null;
  } catch {
    // not found
  }

  const doc: ConversationDoc = existing ?? {
    id: userId,
    userId,
    lastResponseId: null,
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

export async function appendMessage(
  userId: string,
  message: Omit<ChatMessage, "id">,
): Promise<void> {
  const container = await getContainer("conversations");
  const now = new Date().toISOString();

  let existing: ConversationDoc | null = null;
  try {
    const { resource } = await container
      .item(userId, userId)
      .read<ConversationDoc>();
    existing = resource ?? null;
  } catch {
    // not found
  }

  const newMessage: ChatMessage = {
    ...message,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };

  const doc: ConversationDoc = existing ?? {
    id: userId,
    userId,
    lastResponseId: null,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };

  await container.items.upsert({
    ...doc,
    messages: [...doc.messages, newMessage],
    updatedAt: now,
  });
}
