/** Agents the app talks to. Each provider maps them to its own setup. */
export type AgentId =
  /** Chat assistant (VELTA AI). */
  | "assistant"
  /** Extracts HubInput JSON from a free-form conversation. */
  | "hubScore";

export type AgentInput =
  | string
  | Array<{ role: "user" | "assistant"; content: string }>;

export interface AgentStreamEvent {
  /** Text delta, empty when the event carries no text. */
  delta: string;
  /** Set when the response completes — used for multi-turn continuity. */
  responseId: string | null;
}

export interface AiClient {
  /** Runs the agent and returns its full text output. */
  runAgent(agent: AgentId, input: AgentInput): Promise<string>;
  /** Streams the agent response, continuing from `previousResponseId` if set. */
  streamAgent(
    agent: AgentId,
    input: AgentInput,
    previousResponseId: string | null,
  ): AsyncGenerator<AgentStreamEvent>;
}
