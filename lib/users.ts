import { getContainer } from './cosmos'
import type { VeltaUser } from './types'

type UpsertInput = Omit<VeltaUser, 'createdAt' | 'updatedAt' | 'lastLoginAt'>

export async function upsertUser(data: UpsertInput): Promise<VeltaUser> {
  const container = await getContainer('users')
  const now = new Date().toISOString()

  let existing: VeltaUser | undefined
  try {
    const { resource } = await container.item(data.id, data.id).read<VeltaUser>()
    existing = resource
  } catch {
    // item not found — will create
  }

  const user: VeltaUser = {
    ...data,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastLoginAt: now,
  }

  await container.items.upsert(user)
  return user
}

export async function getUserById(id: string): Promise<VeltaUser | null> {
  const container = await getContainer('users')
  try {
    const { resource } = await container.item(id, id).read<VeltaUser>()
    return resource ?? null
  } catch {
    return null
  }
}
