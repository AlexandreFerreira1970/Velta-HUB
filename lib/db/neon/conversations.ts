import { randomUUID } from "crypto";
import type { ChatMessage, ConversationDoc, ConversationSummary } from "../../types";
import { makeMessageId } from "../ids";
import type { ConversationsRepository } from "../types";
import { iso, isoOrUndefined, opt, type Row, type SqlClient } from "./sql";

function toSummary(r: Row): ConversationSummary {
  return {
    id: r.id as string,
    title: r.title as string,
    hubQuestionIndex: (r.hub_question_index as number | null) ?? null,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function toDoc(r: Row, messages: ChatMessage[]): ConversationDoc {
  return {
    ...toSummary(r),
    userId: r.user_id as string,
    lastResponseId: (r.last_response_id as string | null) ?? null,
    lastResponseProvider: opt(
      r.last_response_provider as ConversationDoc["lastResponseProvider"] | null,
    ),
    initialAnalysisMessageSentAt: isoOrUndefined(r.initial_analysis_message_sent_at),
    messages,
  };
}

/** Creates an empty conversation row unless one with this id already exists. */
const ENSURE_CONVERSATION = `
  INSERT INTO conversations (id, user_id, title, created_at, updated_at)
  VALUES ($1, $2, '', $3, $3)
  ON CONFLICT (id) DO NOTHING`;

// Every statement below also filters by user_id, so a user can never read or
// write another user's conversation (Cosmos guarantees this via partitions).

export function createNeonConversations(sql: SqlClient): ConversationsRepository {
  const update = (set: string, conversationId: string, userId: string, params: unknown[]) =>
    sql.query(
      `UPDATE conversations SET ${set} WHERE id = $1 AND user_id = $2`,
      [conversationId, userId, ...params],
    );

  return {
    async createConversation(userId, title) {
      const now = new Date().toISOString();
      const [row] = await sql.query(
        `INSERT INTO conversations (id, user_id, title, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $4)
         RETURNING *`,
        [randomUUID(), userId, title, now],
      );
      return toDoc(row, []);
    },

    async listConversations(userId) {
      const rows = await sql.query(
        `SELECT id, title, hub_question_index, created_at, updated_at
         FROM conversations WHERE user_id = $1
         ORDER BY created_at ASC`,
        [userId],
      );
      return rows.map(toSummary);
    },

    async getConversation(conversationId, userId) {
      const [row] = await sql.query(
        `SELECT c.*,
           COALESCE((
             SELECT json_agg(json_build_object(
               'id', m.id, 'role', m.role, 'content', m.content, 'timestamp', m.timestamp
             ) ORDER BY m.seq)
             FROM messages m WHERE m.conversation_id = c.id
           ), '[]'::json) AS messages
         FROM conversations c
         WHERE c.id = $1 AND c.user_id = $2`,
        [conversationId, userId],
      );
      if (!row) return null;

      const messages = (row.messages as ChatMessage[]).map((m) => ({
        ...m,
        timestamp: iso(m.timestamp),
      }));
      return toDoc(row, messages);
    },

    async appendMessages(conversationId, userId, msgs, hubQuestionIndex) {
      if (!msgs.length && hubQuestionIndex === undefined) return;
      const now = new Date().toISOString();

      const newMessages: ChatMessage[] = msgs.map((m) => ({
        ...m,
        id: m.id || makeMessageId(),
      }));

      await sql.transaction([
        [ENSURE_CONVERSATION, [conversationId, userId, now]],
        [
          `INSERT INTO messages (conversation_id, id, role, content, timestamp)
           SELECT c.id, e.m->>'id', e.m->>'role', e.m->>'content', (e.m->>'timestamp')::timestamptz
           FROM conversations c,
                jsonb_array_elements($3::jsonb) WITH ORDINALITY AS e(m, ord)
           WHERE c.id = $1 AND c.user_id = $2
           ORDER BY e.ord`,
          [conversationId, userId, JSON.stringify(newMessages)],
        ],
        [
          `UPDATE conversations SET
             updated_at = $3,
             hub_question_index = CASE WHEN $4::boolean THEN $5::integer ELSE hub_question_index END
           WHERE id = $1 AND user_id = $2`,
          [conversationId, userId, now, hubQuestionIndex !== undefined, hubQuestionIndex ?? null],
        ],
      ]);
    },

    async saveLastResponseId(conversationId, userId, responseId, provider) {
      const now = new Date().toISOString();
      await sql.transaction([
        [ENSURE_CONVERSATION, [conversationId, userId, now]],
        [
          `UPDATE conversations SET last_response_id = $3, last_response_provider = $4, updated_at = $5
           WHERE id = $1 AND user_id = $2`,
          [conversationId, userId, responseId, provider, now],
        ],
      ]);
    },

    async updateHubQuestionIndex(conversationId, userId, hubQuestionIndex) {
      await update("hub_question_index = $3, updated_at = $4", conversationId, userId, [
        hubQuestionIndex,
        new Date().toISOString(),
      ]);
    },

    async markInitialAnalysisSent(conversationId, userId) {
      const now = new Date().toISOString();
      await update(
        "initial_analysis_message_sent_at = $3, updated_at = $3",
        conversationId,
        userId,
        [now],
      );
    },
  };
}
