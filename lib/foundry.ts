import { AIProjectClient } from "@azure/ai-projects";
import type { TokenCredential, AccessToken } from "@azure/core-auth";
import type OpenAI from "openai";

// Azure AI Foundry accepts project API keys via the `api-key` header.
// We wrap it as a TokenCredential (used internally by AIProjectClient)
// and also pass it explicitly to the OpenAI client via defaultHeaders.
class ApiKeyCredential implements TokenCredential {
  constructor(private readonly key: string) {}
  async getToken(): Promise<AccessToken> {
    return { token: this.key, expiresOnTimestamp: Date.now() + 3_600_000 };
  }
}

let _client: AIProjectClient | null = null;

function getClient(): AIProjectClient {
  if (_client) return _client;
  _client = new AIProjectClient(
    process.env.AZURE_AI_PROJECT_ENDPOINT!,
    new ApiKeyCredential(process.env.AZURE_FOUNDRY_API_KEY!),
  );
  return _client;
}

export function getOpenAIClient(): OpenAI {
  // Pass the API key as both apiKey and api-key header —
  // the header form is what Azure AI Foundry actually validates.
  return getClient().getOpenAIClient({
    apiKey: process.env.AZURE_FOUNDRY_API_KEY!,
    defaultHeaders: { "api-key": process.env.AZURE_FOUNDRY_API_KEY! },
  });
}
