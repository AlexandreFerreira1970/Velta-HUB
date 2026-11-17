// Conversation storage — delegates to the database selected by DB_PROVIDER.

import { getDb, type ConversationsRepository } from "./db";
import type { ChatMessage } from "./types";

const repo = () => getDb().conversations;

export const createConversation: ConversationsRepository["createConversation"] = (...args) =>
  repo().createConversation(...args);

export const listConversations: ConversationsRepository["listConversations"] = (...args) =>
  repo().listConversations(...args);

export const getConversation: ConversationsRepository["getConversation"] = (...args) =>
  repo().getConversation(...args);

export const appendMessages: ConversationsRepository["appendMessages"] = (...args) =>
  repo().appendMessages(...args);

export const appendMessage = (
  conversationId: string,
  userId: string,
  message: Omit<ChatMessage, "id">,
) => appendMessages(conversationId, userId, [message]);

export const saveLastResponseId: ConversationsRepository["saveLastResponseId"] = (...args) =>
  repo().saveLastResponseId(...args);

export const updateHubQuestionIndex: ConversationsRepository["updateHubQuestionIndex"] = (
  ...args
) => repo().updateHubQuestionIndex(...args);

export const markInitialAnalysisSent: ConversationsRepository["markInitialAnalysisSent"] = (
  ...args
) => repo().markInitialAnalysisSent(...args);
