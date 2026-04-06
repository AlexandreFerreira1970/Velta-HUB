import { CosmosClient, type Container } from "@azure/cosmos";

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT!,
  key: process.env.COSMOS_KEY!,
});

const databaseId = process.env.COSMOS_DATABASE ?? "velta";

const cache = new Map<string, Container>();

export async function getContainer(containerId: string): Promise<Container> {
  const cached = cache.get(containerId);
  if (cached) return cached;

  const { database } = await client.databases.createIfNotExists({
    id: databaseId,
  });
  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: ["/id"] },
  });

  cache.set(containerId, container);
  return container;
}
