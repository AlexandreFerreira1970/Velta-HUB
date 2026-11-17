import { CosmosClient, type Container, type ItemDefinition } from "@azure/cosmos";
import { requireEnv } from "../../env";

// Created lazily so the app can run without Cosmos credentials when
// DB_PROVIDER is not "cosmos".
let client: CosmosClient | null = null;
const cache = new Map<string, Container>();

function getClient(): CosmosClient {
  client ??= new CosmosClient({
    endpoint: requireEnv("COSMOS_ENDPOINT"),
    key: requireEnv("COSMOS_KEY"),
  });
  return client;
}

export async function getContainer(
  containerId: string,
  partitionKeyPath = "/id",
): Promise<Container> {
  const cached = cache.get(containerId);
  if (cached) return cached;

  const { database } = await getClient().databases.createIfNotExists({
    id: process.env.COSMOS_DATABASE ?? "velta",
  });
  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: [partitionKeyPath] },
  });

  cache.set(containerId, container);
  return container;
}

/** Reads one item, returning null when it does not exist. */
export async function readItem<T extends ItemDefinition>(
  container: Container,
  id: string,
  partitionKey: string,
): Promise<T | null> {
  try {
    const { resource } = await container.item(id, partitionKey).read<T>();
    return resource ?? null;
  } catch {
    return null;
  }
}
