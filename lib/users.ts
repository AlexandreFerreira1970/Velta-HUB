// User storage — delegates to the database selected by DB_PROVIDER.

import { getDb, type UsersRepository } from "./db";

export const upsertUser: UsersRepository["upsertUser"] = (...args) =>
  getDb().users.upsertUser(...args);

export const getUserById: UsersRepository["getUserById"] = (...args) =>
  getDb().users.getUserById(...args);

export const updateUserProfile: UsersRepository["updateUserProfile"] = (...args) =>
  getDb().users.updateUserProfile(...args);
