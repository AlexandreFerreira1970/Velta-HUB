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

// --- Agents ------------------------------------------------------------------

export interface AgentRef {
  name: string;
  version: string;
}

/** The general-purpose assistant agent configured via env. */
export function defaultAgent(): AgentRef {
  return {
    name: process.env.AZURE_FOUNDRY_AGENT_NAME!,
    version: process.env.AZURE_FOUNDRY_AGENT_VERSION ?? "1",
  };
}

export const HUB_SCORE_AGENT: AgentRef = {
  name: "calculadora-hub-score",
  version: "8",
};

type AgentInput = string | Array<{ role: string; content: string }>;

/* eslint-disable @typescript-eslint/no-explicit-any --
 * The Foundry agent extension (`agent` body, loose event shapes) is not part
 * of the OpenAI SDK typings, so the untyped surface is contained here. */

function createResponse(
  agent: AgentRef,
  params: Record<string, unknown>,
): Promise<any> {
  return getOpenAIClient().responses.create(params as any, {
    body: {
      agent: { name: agent.name, version: agent.version, type: "agent_reference" },
    },
  } as any) as Promise<any>;
}

/** Runs the agent and returns its full text output. */
export async function runAgent(
  agent: AgentRef,
  input: AgentInput,
): Promise<string> {
  const response = await createResponse(agent, { input, stream: false });
  return (
    response?.output_text ??
    response?.output?.[0]?.content?.[0]?.text ??
    response?.choices?.[0]?.message?.content ??
    ""
  );
}

export interface AgentStreamEvent {
  /** Text delta, empty when the event carries no text. */
  delta: string;
  /** Set on `response.completed` — used for multi-turn continuity. */
  responseId: string | null;
}

/** Streams the agent response, yielding text deltas and the final response id. */
export async function* streamAgent(
  agent: AgentRef,
  input: AgentInput,
  previousResponseId: string | null,
): AsyncGenerator<AgentStreamEvent> {
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
        event.delta ??
        event.text?.delta ??
        event.choices?.[0]?.delta?.content ??
        "",
      responseId:
        event.type === "response.completed" && event.response?.id
          ? (event.response.id as string)
          : null,
    };
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
