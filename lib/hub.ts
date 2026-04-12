import { getContainer } from './cosmos'
import { calculateEffectiveness } from './scoring'
import type { HubInput, DecisionOutput, HubDataDoc, DecisionRecord } from './types'

// ─── hub_data container ───────────────────────────────────────────────────────

export async function saveHubData(
  userId: string,
  input: HubInput,
  output: DecisionOutput,
  conversationId?: string,
): Promise<HubDataDoc> {
  const container = await getContainer('hub_data', '/userId')
  const now = new Date().toISOString()

  const doc: HubDataDoc = {
    id: `${userId}-${Date.now()}`,
    userId,
    ...(conversationId ? { conversationId } : {}),
    input,
    output,
    createdAt: now,
  }

  await container.items.upsert(doc)
  return doc
}

export async function updateHubDataActions(
  docId: string,
  userId: string,
  actions: string[],
): Promise<void> {
  const container = await getContainer('hub_data', '/userId')
  const { resource: existing } = await container
    .item(docId, userId)
    .read<HubDataDoc>()

  if (!existing) return

  existing.output.actions = actions
  await container.items.upsert(existing)
}

export async function getHubHistory(userId: string): Promise<HubDataDoc[]> {
  const container = await getContainer('hub_data', '/userId')

  const { resources } = await container.items
    .query<HubDataDoc>(
      {
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
        parameters: [{ name: '@userId', value: userId }],
      },
      { partitionKey: userId }
    )
    .fetchAll()

  return resources
}

// ─── decisions container ──────────────────────────────────────────────────────

export async function saveDecisionRecord(
  record: Omit<DecisionRecord, 'id' | 'createdAt'>
): Promise<DecisionRecord> {
  const container = await getContainer('decisions', '/userId')
  const now = new Date().toISOString()

  const doc: DecisionRecord = {
    ...record,
    id: `${record.userId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
  }

  await container.items.upsert(doc)
  return doc
}

export async function resolveDecisionRecord(
  recordId: string,
  userId: string,
  obtainedResult: number,
  expectedResult: number
): Promise<DecisionRecord> {
  const container = await getContainer('decisions', '/userId')

  const { resource: existing } = await container
    .item(recordId, userId)
    .read<DecisionRecord>()

  if (!existing) {
    throw new Error(`Decision record not found: ${recordId}`)
  }

  const updated: DecisionRecord = {
    ...existing,
    obtainedResult: String(obtainedResult),
    effectiveness: calculateEffectiveness(obtainedResult, expectedResult),
    resolvedAt: new Date().toISOString(),
  }

  await container.items.upsert(updated)
  return updated
}
