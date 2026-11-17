import { aiProvider } from "../env";
import { azureAi } from "./azure";
import { openAi } from "./openai";
import type { AgentId, AgentInput, AiClient } from "./types";

export type * from "./types";

/** AI client selected by `AI_PROVIDER` ("azure" by default). */
function getAi(): AiClient {
  return aiProvider() === "openai" ? openAi : azureAi;
}

export const runAgent = (agent: AgentId, input: AgentInput) =>
  getAi().runAgent(agent, input);

export const streamAgent = (
  agent: AgentId,
  input: AgentInput,
  previousResponseId: string | null,
) => getAi().streamAgent(agent, input, previousResponseId);
