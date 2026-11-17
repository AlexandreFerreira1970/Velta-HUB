import { runAgent } from "@/lib/ai";
import { formatActionsPrompt } from "@/lib/hub-prompts";
import {
  badRequest,
  getSessionUserId,
  serverError,
  unauthorized,
} from "@/lib/api";
import type { DecisionOutput } from "@/lib/types";

export const runtime = "nodejs";

// POST — ask the agent for recommended actions based on a computed analysis
export async function POST(req: Request): Promise<Response> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const { output } = (await req.json()) as { output: DecisionOutput };
    if (!output?.hubScore) return badRequest("output is required");

    const text = await runAgent("assistant", formatActionsPrompt(output));
    console.log("[hub/actions] agent raw response:", text.slice(0, 500));

    const actions = text
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    return Response.json({ actions });
  } catch (err) {
    console.error("[hub/actions]", err);
    return serverError();
  }
}
