import { getConversation } from "@/lib/conversations";
import { HUB_SCORE_AGENT, runAgent } from "@/lib/foundry";
import { runScoringEngine } from "@/lib/scoring";
import { saveHubData } from "@/lib/hub";
import {
  badRequest,
  getSessionUserId,
  readJson,
  serverError,
  unauthorized,
} from "@/lib/api";
import type { HubInput } from "@/lib/types";

export const runtime = "nodejs";

// POST — extract hub inputs from a free-form conversation and score them
export async function POST(req: Request): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const body = await readJson<{ conversationId?: string }>(req);
    const conversationId = body?.conversationId;
    if (!conversationId) return badRequest("conversationId is required");

    const conversation = await getConversation(conversationId, userId);
    if (!conversation?.messages?.length) {
      return badRequest("No conversation found");
    }

    // Feed the whole conversation to the calculator agent
    const input = conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    console.log("[hub/analyze] input:", input);

    const text = await runAgent(HUB_SCORE_AGENT, input);
    console.log("[hub/analyze] agent raw response:", text.slice(0, 500));

    // Extract the JSON object (tolerates text before/after it)
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("[hub/analyze] agent did not return JSON:", text);
      return new Response("Agent returned invalid response", { status: 500 });
    }

    const hubInput = JSON.parse(match[0]) as HubInput;
    const output = runScoringEngine(hubInput);
    await saveHubData(userId, hubInput, output, conversationId);

    return Response.json({ output });
  } catch (err) {
    console.error("[hub/analyze]", err);
    return serverError();
  }
}
