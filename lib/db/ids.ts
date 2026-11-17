// Id formats shared by all providers (kept identical to the original Cosmos ones).

export const makeMessageId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const makeHubDataId = (userId: string) => `${userId}-${Date.now()}`;

export const makeDecisionId = (userId: string) =>
  `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
