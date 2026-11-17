import type { VeltaUser } from "../../types";
import type { UsersRepository } from "../types";
import { getContainer, readItem } from "./client";

const usersContainer = () => getContainer("users");

async function getUserById(id: string): Promise<VeltaUser | null> {
  return readItem<VeltaUser>(await usersContainer(), id, id);
}

export const cosmosUsers: UsersRepository = {
  getUserById,

  async upsertUser(data) {
    const container = await usersContainer();
    const now = new Date().toISOString();
    const existing = await getUserById(data.id);

    const user: VeltaUser = {
      ...(existing ?? {}),
      id: data.id,
      email: data.email,
      name: data.name,
      image: data.image,
      provider: data.provider,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      lastLoginAt: now,
    };

    await container.items.upsert(user);
    return user;
  },

  async updateUserProfile(id, data) {
    const existing = await getUserById(id);
    if (!existing) return null;
    const updated: VeltaUser = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await (await usersContainer()).items.upsert(updated);
    return updated;
  },
};
