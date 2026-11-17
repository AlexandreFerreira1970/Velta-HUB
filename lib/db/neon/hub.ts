import { calculateEffectiveness } from "../../scoring";
import type {
  DecisionOutput,
  DecisionRecord,
  HubDataDoc,
  HubInput,
  ScenarioClassification,
} from "../../types";
import { makeDecisionId, makeHubDataId } from "../ids";
import type { HubRepository } from "../types";
import { iso, isoOrUndefined, opt, type Row, type SqlClient } from "./sql";

function toHubData(r: Row): HubDataDoc {
  const conversationId = r.conversation_id as string | null;
  return {
    id: r.id as string,
    userId: r.user_id as string,
    ...(conversationId ? { conversationId } : {}),
    input: r.input as HubInput,
    output: r.output as DecisionOutput,
    createdAt: iso(r.created_at),
  };
}

function toDecision(r: Row): DecisionRecord {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    scenario: r.scenario as ScenarioClassification,
    actions: r.actions as string[],
    hubScore: Number(r.hub_score),
    expectedResult: r.expected_result as string,
    obtainedResult: opt(r.obtained_result as string | null),
    effectiveness: r.effectiveness === null ? undefined : Number(r.effectiveness),
    createdAt: iso(r.created_at),
    resolvedAt: isoOrUndefined(r.resolved_at),
  };
}

export function createNeonHub(sql: SqlClient): HubRepository {
  return {
    async saveHubData(userId, input, output, conversationId) {
      const doc: HubDataDoc = {
        id: makeHubDataId(userId),
        userId,
        ...(conversationId ? { conversationId } : {}),
        input,
        output,
        createdAt: new Date().toISOString(),
      };
      await sql.query(
        `INSERT INTO hub_data (id, user_id, conversation_id, input, output, created_at)
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)`,
        [
          doc.id,
          userId,
          conversationId ?? null,
          JSON.stringify(input),
          JSON.stringify(output),
          doc.createdAt,
        ],
      );
      return doc;
    },

    async updateHubDataActions(docId, userId, actions) {
      await sql.query(
        `UPDATE hub_data SET output = jsonb_set(output, '{actions}', $3::jsonb)
         WHERE id = $1 AND user_id = $2`,
        [docId, userId, JSON.stringify(actions)],
      );
    },

    async getHubHistory(userId) {
      const rows = await sql.query(
        `SELECT * FROM hub_data WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId],
      );
      return rows.map(toHubData);
    },

    async saveDecisionRecord(record) {
      const [row] = await sql.query(
        `INSERT INTO decisions (id, user_id, scenario, actions, hub_score, expected_result,
                                obtained_result, effectiveness, created_at, resolved_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          makeDecisionId(record.userId),
          record.userId,
          record.scenario,
          JSON.stringify(record.actions),
          record.hubScore,
          record.expectedResult,
          record.obtainedResult ?? null,
          record.effectiveness ?? null,
          new Date().toISOString(),
          record.resolvedAt ?? null,
        ],
      );
      return toDecision(row);
    },

    async resolveDecisionRecord(recordId, userId, obtainedResult, expectedResult) {
      const [row] = await sql.query(
        `UPDATE decisions SET obtained_result = $3, effectiveness = $4, resolved_at = $5
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [
          recordId,
          userId,
          String(obtainedResult),
          calculateEffectiveness(obtainedResult, expectedResult),
          new Date().toISOString(),
        ],
      );
      if (!row) throw new Error(`Decision record not found: ${recordId}`);
      return toDecision(row);
    },
  };
}
