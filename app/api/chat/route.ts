import {
  getConversation,
  saveLastResponseId,
  appendMessage,
  markInitialAnalysisSent,
  updateHubQuestionIndex,
} from "@/lib/conversations";
import { streamAgent, type AgentInput } from "@/lib/ai";
import { aiProvider } from "@/lib/env";
import {
  badRequest,
  getSessionUserId,
  serverError,
  unauthorized,
} from "@/lib/api";
import type { ConversationDoc, ConversationState } from "@/lib/types";

export const runtime = "nodejs";

/**
 * What to send to the AI. Normally just the new message, continuing from the
 * previous response id. If that id came from another provider (AI_PROVIDER
 * was switched mid-conversation) it is useless here, so the stored history is
 * sent instead to keep the context.
 */
function buildAgentRequest(
  existing: ConversationDoc | null,
  content: string,
): { input: AgentInput; previousResponseId: string | null } {
  const lastId = existing?.lastResponseId ?? null;
  if (!existing || !lastId) return { input: content, previousResponseId: null };

  const lastProvider = existing.lastResponseProvider ?? "azure";
  if (lastProvider === aiProvider()) {
    return { input: content, previousResponseId: lastId };
  }

  return {
    input: [
      ...existing.messages.map(({ role, content }) => ({ role, content })),
      { role: "user", content },
    ],
    previousResponseId: null,
  };
}

// GET — load conversation history
export async function GET(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const conversationId = new URL(req.url).searchParams.get("conversationId");
    if (!conversationId) return badRequest("conversationId is required");

    const doc = await getConversation(conversationId, userId);
    return Response.json({
      messages: doc?.messages ?? [],
      initialAnalysisMessageSentAt: doc?.initialAnalysisMessageSentAt ?? null,
      hubQuestionIndex: doc?.hubQuestionIndex ?? null,
    } satisfies ConversationState);
  } catch (error) {
    console.error("[chat GET]", error);
    return serverError();
  }
}

// POST — send message and stream response (SSE)
export async function POST(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const { content, conversationId } = (await req.json()) as {
      content: string;
      conversationId: string;
    };
    if (!content?.trim()) return badRequest("content is required");
    if (!conversationId) return badRequest("conversationId is required");

    const existing = await getConversation(conversationId, userId);
    const { input, previousResponseId } = buildAgentRequest(existing, content);

    await appendMessage(conversationId, userId, {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    });

    const encoder = new TextEncoder();
    const sse = (payload: object) =>
      encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);

    const readable = new ReadableStream({
      async start(controller) {
        let fullText = "";
        let newResponseId: string | null = null;

        try {
          for await (const { delta, responseId } of streamAgent(
            "assistant",
            input,
            previousResponseId,
          )) {
            if (responseId) newResponseId = responseId;
            if (delta) {
              fullText += delta;
              controller.enqueue(sse({ delta }));
            }
          }

          // Persist assistant reply + update lastResponseId
          await appendMessage(conversationId, userId, {
            role: "assistant",
            content: fullText,
            timestamp: new Date().toISOString(),
          });
          if (newResponseId) {
            await saveLastResponseId(
              conversationId,
              userId,
              newResponseId,
              aiProvider(),
            );
          }

          controller.enqueue(sse({ done: true }));
        } catch (err) {
          console.error("[stream error]", err);
          const message = err instanceof Error ? err.message : "Unknown error";
          controller.enqueue(sse({ error: message }));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[chat POST]", error);
    return serverError();
  }
}

// PATCH — update conversation metadata (initial analysis sent, hub flow state)
export async function PATCH(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const body = (await req.json()) as {
      conversationId: string;
      hubQuestionIndex?: number | null;
    };
    if (!body.conversationId) return badRequest("conversationId is required");

    if (body.hubQuestionIndex !== undefined) {
      await updateHubQuestionIndex(
        body.conversationId,
        userId,
        body.hubQuestionIndex,
      );
    } else {
      await markInitialAnalysisSent(body.conversationId, userId);
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[chat PATCH]", error);
    return serverError();
  }
}
