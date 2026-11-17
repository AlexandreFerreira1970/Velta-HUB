// OpenAI (direct): instructions live in ./instructions.ts and the model is
// chosen via env.

import OpenAI from "openai";
import { requireEnv } from "../env";
import { ASSISTANT_INSTRUCTIONS, HUB_SCORE_INSTRUCTIONS } from "./instructions";
import type { AgentId, AiClient } from "./types";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  client ??= new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
  return client;
}

function agentConfig(agent: AgentId) {
  const model = requireEnv("OPENAI_MODEL");
  switch (agent) {
    case "assistant":
      return { model, instructions: ASSISTANT_INSTRUCTIONS };
    case "hubScore":
      return {
        model: process.env.OPENAI_HUB_SCORE_MODEL || model,
        instructions: HUB_SCORE_INSTRUCTIONS,
      };
  }
}

export const openAi: AiClient = {
  async runAgent(agent, input) {
    const response = await getClient().responses.create({
      ...agentConfig(agent),
      input,
    });
    return response.output_text ?? "";
  },

  async *streamAgent(agent, input, previousResponseId) {
    const stream = await getClient().responses.create({
      ...agentConfig(agent),
      input,
      // Instructions are not inherited from the previous response, so they
      // are sent on every turn.
      ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
      stream: true,
    });

    for await (const event of stream) {
      switch (event.type) {
        // Only the final answer text — never reasoning or tool deltas
        case "response.output_text.delta":
          yield { delta: event.delta, responseId: null };
          break;
        case "response.completed":
          yield { delta: "", responseId: event.response.id };
          break;
        case "response.failed":
          throw new Error(event.response.error?.message ?? "OpenAI response failed");
        case "error":
          throw new Error(event.message);
      }
    }
  },
};
