// Azure AI Foundry: agents (instructions, model and tools) are configured in
// the Foundry portal and referenced by name/version.

import { AIProjectClient } from "@azure/ai-projects";
import type { TokenCredential, AccessToken } from "@azure/core-auth";
import type OpenAI from "openai";
import { requireEnv } from "../env";
import type { AgentId, AiClient } from "./types";

// Azure AI Foundry accepts project API keys via the `api-key` header.
// We wrap it as a TokenCredential (used internally by AIProjectClient)
// and also pass it explicitly to the OpenAI client via defaultHeaders.
class ApiKeyCredential implements TokenCredential {
  constructor(private readonly key: string) {}
  async getToken(): Promise<AccessToken> {
    return { token: this.key, expiresOnTimestamp: Date.now() + 3_600_000 };
  }
}

let projectClient: AIProjectClient | null = null;

function getOpenAIClient(): OpenAI {
  const apiKey = requireEnv("AZURE_FOUNDRY_API_KEY");
  projectClient ??= new AIProjectClient(
    requireEnv("AZURE_AI_PROJECT_ENDPOINT"),
    new ApiKeyCredential(apiKey),
  );
  // Pass the API key as both apiKey and api-key header —
  // the header form is what Azure AI Foundry actually validates.
  return projectClient.getOpenAIClient({
    apiKey,
    defaultHeaders: { "api-key": apiKey },
  });
}

function agentRef(agent: AgentId) {
  switch (agent) {
    case "assistant":
      return {
        name: requireEnv("AZURE_FOUNDRY_AGENT_NAME"),
        version: process.env.AZURE_FOUNDRY_AGENT_VERSION ?? "1",
      };
    case "hubScore":
      return { name: "calculadora-hub-score", version: "8" };
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any --
 * The Foundry agent extension (`agent` body, loose event shapes) is not part
 * of the OpenAI SDK typings, so the untyped surface is contained here. */

function createResponse(agent: AgentId, params: Record<string, unknown>): Promise<any> {
  return getOpenAIClient().responses.create(params as any, {
    body: { agent: { ...agentRef(agent), type: "agent_reference" } },
  } as any) as Promise<any>;
}

export const azureAi: AiClient = {
  async runAgent(agent, input) {
    const response = await createResponse(agent, { input, stream: false });
    return (
      response?.output_text ??
      response?.output?.[0]?.content?.[0]?.text ??
      response?.choices?.[0]?.message?.content ??
      ""
    );
  },

  async *streamAgent(agent, input, previousResponseId) {
    const stream = await createResponse(agent, {
      input,
      ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
      stream: true,
    });

    for await (const event of stream as AsyncIterable<any>) {
      console.log("[stream event]", event.type, JSON.stringify(event).slice(0, 160));

      yield {
        // Handle both naming conventions
        delta:
          event.delta ?? event.text?.delta ?? event.choices?.[0]?.delta?.content ?? "",
        responseId:
          event.type === "response.completed" && event.response?.id
            ? (event.response.id as string)
            : null,
      };
    }
  },
};
/* eslint-enable @typescript-eslint/no-explicit-any */
