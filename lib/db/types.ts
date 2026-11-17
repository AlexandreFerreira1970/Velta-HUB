// Storage contract implemented by every database provider (Cosmos, Neon).

import type { AiProvider } from "../env";
import type {
  ChatMessage,
  ConversationDoc,
  ConversationSummary,
  DecisionOutput,
  DecisionRecord,
  HubDataDoc,
  HubInput,
  UserProfileUpdate,
  VeltaUser,
} from "../types";

export type UpsertUserInput = Omit<VeltaUser, "createdAt" | "updatedAt" | "lastLoginAt">;

export type NewMessage = Omit<ChatMessage, "id"> & { id?: string };

export interface UsersRepository {
  /** Creates the user or refreshes their Google profile data (on sign-in). */
  upsertUser(data: UpsertUserInput): Promise<VeltaUser>;
  getUserById(id: string): Promise<VeltaUser | null>;
  updateUserProfile(id: string, data: UserProfileUpdate): Promise<VeltaUser | null>;
}

export interface ConversationsRepository {
  createConversation(userId: string, title: string): Promise<ConversationDoc>;
  /** Oldest first. */
  listConversations(userId: string): Promise<ConversationSummary[]>;
  getConversation(conversationId: string, userId: string): Promise<ConversationDoc | null>;
  /**
   * Appends messages and optionally updates the hub flow position in a single
   * write. Creates the conversation if it does not exist yet.
   */
  appendMessages(
    conversationId: string,
    userId: string,
    msgs: NewMessage[],
    hubQuestionIndex?: number | null,
  ): Promise<void>;
  /** Creates the conversation if it does not exist yet. */
  saveLastResponseId(
    conversationId: string,
    userId: string,
    responseId: string,
    provider: AiProvider,
  ): Promise<void>;
  updateHubQuestionIndex(
    conversationId: string,
    userId: string,
    hubQuestionIndex: number | null,
  ): Promise<void>;
  markInitialAnalysisSent(conversationId: string, userId: string): Promise<void>;
}

export interface HubRepository {
  saveHubData(
    userId: string,
    input: HubInput,
    output: DecisionOutput,
    conversationId?: string,
  ): Promise<HubDataDoc>;
  updateHubDataActions(docId: string, userId: string, actions: string[]): Promise<void>;
  /** Newest first. */
  getHubHistory(userId: string): Promise<HubDataDoc[]>;
  saveDecisionRecord(record: Omit<DecisionRecord, "id" | "createdAt">): Promise<DecisionRecord>;
  resolveDecisionRecord(
    recordId: string,
    userId: string,
    obtainedResult: number,
    expectedResult: number,
  ): Promise<DecisionRecord>;
}

export interface Database {
  users: UsersRepository;
  conversations: ConversationsRepository;
  hub: HubRepository;
}
