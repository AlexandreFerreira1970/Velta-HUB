import { appendMessages } from "@/lib/conversations";
import type { ChatMessage } from "@/lib/types";
import { badRequest, getSessionUserId, readJson, unauthorized } from "@/lib/api";

export const runtime = "nodejs";

interface MessageBody {
  messages?: Array<{ role: unknown; content: unknown; id?: unknown }>;
  conversationId?: string;
  hubQuestionIndex?: number | null;
}

// POST — persist messages produced on the client (onboarding / hub flow)
export async function POST(req: Request): Promise<Response> {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const body = await readJson<MessageBody>(req);
  if (body === undefined) return badRequest("Invalid JSON");

  const { messages, conversationId, hubQuestionIndex } = body ?? {};
  if (!conversationId) return badRequest("conversationId is required");
  if (!Array.isArray(messages) || messages.length === 0) {
    return badRequest("messages array required");
  }

  const now = new Date().toISOString();
  const valid = messages.flatMap((m) =>
    (m.role === "user" || m.role === "assistant") &&
    typeof m.content === "string" &&
    m.content.trim()
      ? [
          {
            role: m.role as ChatMessage["role"],
            content: m.content,
            timestamp: now,
            ...(typeof m.id === "string" ? { id: m.id } : {}),
          },
        ]
      : [],
  );

  if (!valid.length) return badRequest("No valid messages");

  await appendMessages(conversationId, userId, valid, hubQuestionIndex);

  return new Response(null, { status: 204 });
}
