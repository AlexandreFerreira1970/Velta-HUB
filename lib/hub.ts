// Hub analysis storage — delegates to the database selected by DB_PROVIDER.

import { getDb, type HubRepository } from "./db";

const repo = () => getDb().hub;

export const saveHubData: HubRepository["saveHubData"] = (...args) =>
  repo().saveHubData(...args);

export const updateHubDataActions: HubRepository["updateHubDataActions"] = (...args) =>
  repo().updateHubDataActions(...args);

export const getHubHistory: HubRepository["getHubHistory"] = (...args) =>
  repo().getHubHistory(...args);

export const saveDecisionRecord: HubRepository["saveDecisionRecord"] = (...args) =>
  repo().saveDecisionRecord(...args);

export const resolveDecisionRecord: HubRepository["resolveDecisionRecord"] = (...args) =>
  repo().resolveDecisionRecord(...args);
