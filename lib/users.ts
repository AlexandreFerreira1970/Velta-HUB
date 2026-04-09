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
    ...existing,
    id: data.id,
    email: data.email,
    name: data.name,
    image: data.image,
    provider: data.provider,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastLoginAt: now,
  }

  await container.items.upsert(user)
  return user
}

export async function updateUserProfile(
  id: string,
  data: { companyName?: string; businessType?: string },
): Promise<VeltaUser | null> {
  const existing = await getUserById(id)
  if (!existing) return null
  const updated: VeltaUser = { ...existing, ...data, updatedAt: new Date().toISOString() }
  const container = await getContainer('users')
  await container.items.upsert(updated)
  return updated
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
