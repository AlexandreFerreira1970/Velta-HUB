// Server-side environment access and provider selection.

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

function choice<T extends string>(name: string, options: readonly T[], fallback: T): T {
  const value = (process.env[name] ?? fallback).trim().toLowerCase() as T;
  if (!options.includes(value)) {
    throw new Error(`${name} must be one of: ${options.join(", ")} (got "${value}")`);
  }
  return value;
}

export const AI_PROVIDERS = ["azure", "openai"] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export const DB_PROVIDERS = ["cosmos", "neon"] as const;
export type DbProvider = (typeof DB_PROVIDERS)[number];

/** `AI_PROVIDER`: "azure" (Azure AI Foundry agents, default) or "openai". */
export const aiProvider = (): AiProvider => choice("AI_PROVIDER", AI_PROVIDERS, "azure");

/** `DB_PROVIDER`: "cosmos" (Azure Cosmos DB, default) or "neon" (Postgres). */
export const dbProvider = (): DbProvider => choice("DB_PROVIDER", DB_PROVIDERS, "cosmos");
