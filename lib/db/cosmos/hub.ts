import { calculateEffectiveness } from "../../scoring";
import type { DecisionRecord, HubDataDoc } from "../../types";
import { makeDecisionId, makeHubDataId } from "../ids";
import type { HubRepository } from "../types";
import { getContainer, readItem } from "./client";

const hubDataContainer = () => getContainer("hub_data", "/userId");
const decisionsContainer = () => getContainer("decisions", "/userId");

export const cosmosHub: HubRepository = {
  async saveHubData(userId, input, output, conversationId) {
    const doc: HubDataDoc = {
      id: makeHubDataId(userId),
      userId,
      ...(conversationId ? { conversationId } : {}),
      input,
      output,
      createdAt: new Date().toISOString(),
    };
    await (await hubDataContainer()).items.upsert(doc);
    return doc;
  },

  async updateHubDataActions(docId, userId, actions) {
    const container = await hubDataContainer();
    const existing = await readItem<HubDataDoc>(container, docId, userId);
    if (!existing) return;
    existing.output.actions = actions;
    await container.items.upsert(existing);
  },

  async getHubHistory(userId) {
    const { resources } = await (await hubDataContainer()).items
      .query<HubDataDoc>(
        {
          query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC",
          parameters: [{ name: "@userId", value: userId }],
        },
        { partitionKey: userId },
      )
      .fetchAll();
    return resources;
  },

  async saveDecisionRecord(record) {
    const doc: DecisionRecord = {
      ...record,
      id: makeDecisionId(record.userId),
      createdAt: new Date().toISOString(),
    };
    await (await decisionsContainer()).items.upsert(doc);
    return doc;
  },

  async resolveDecisionRecord(recordId, userId, obtainedResult, expectedResult) {
    const container = await decisionsContainer();
    const existing = await readItem<DecisionRecord>(container, recordId, userId);
    if (!existing) throw new Error(`Decision record not found: ${recordId}`);

    const updated: DecisionRecord = {
      ...existing,
      obtainedResult: String(obtainedResult),
      effectiveness: calculateEffectiveness(obtainedResult, expectedResult),
      resolvedAt: new Date().toISOString(),
    };
    await container.items.upsert(updated);
    return updated;
  },
};
