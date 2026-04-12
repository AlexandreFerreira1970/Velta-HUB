import { auth } from "@/auth";
import {
  getConversation,
  saveLastResponseId,
  appendMessage,
  markInitialAnalysisSent,
  updateHubQuestionIndex,
} from "@/lib/conversations";
import { getOpenAIClient } from "@/lib/foundry";

export const runtime = "nodejs";

const AGENT_NAME = process.env.AZURE_FOUNDRY_AGENT_NAME!;
const AGENT_VERSION = process.env.AZURE_FOUNDRY_AGENT_VERSION ?? "1";

// GET — load conversation history
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const conversationId = url.searchParams.get("conversationId");
    if (!conversationId) {
      return new Response("conversationId is required", { status: 400 });
    }

    const doc = await getConversation(conversationId, session.user.id);
    return Response.json({
      messages: doc?.messages ?? [],
      initialAnalysisMessageSentAt: doc?.initialAnalysisMessageSentAt ?? null,
      hubQuestionIndex: doc?.hubQuestionIndex ?? null,
    });
  } catch (error) {
    console.error("[chat GET]", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// POST — send message and stream response
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { content, conversationId } = (await req.json()) as {
      content: string;
      conversationId: string;
    };
    if (!content?.trim()) {
      return new Response("content is required", { status: 400 });
    }
    if (!conversationId) {
      return new Response("conversationId is required", { status: 400 });
    }

    const userId = session.user.id;
    const openAI = getOpenAIClient();

    const existing = await getConversation(conversationId, userId);
    const lastResponseId = existing?.lastResponseId ?? null;

    // Save user message
    await appendMessage(conversationId, userId, {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        let fullText = "";
        let newResponseId: string | null = null;

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const stream = (await openAI.responses.create(
            {
              input: content,
              ...(lastResponseId
                ? { previous_response_id: lastResponseId }
                : {}),
              stream: true,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            {
              body: {
                agent: {
                  name: AGENT_NAME,
                  version: AGENT_VERSION,
                  type: "agent_reference",
                },
              },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          )) as any;

          for await (const event of stream) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const e = event as any;
            console.log(
              "[stream event]",
              e.type,
              JSON.stringify(e).slice(0, 160),
            );

            // Capture the response ID for multi-turn continuity
            if (e.type === "response.completed" && e.response?.id) {
              newResponseId = e.response.id as string;
            }

            // Extract text delta — handle both naming conventions
            const delta: string =
              e.delta ??
              e.text?.delta ??
              e.choices?.[0]?.delta?.content ??
              "";

            if (delta) {
              fullText += delta;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`),
              );
            }
          }

          // Persist assistant reply + update lastResponseId
          await appendMessage(conversationId, userId, {
            role: "assistant",
            content: fullText,
            timestamp: new Date().toISOString(),
          });

          if (newResponseId) {
            await saveLastResponseId(conversationId, userId, newResponseId);
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
          );
        } catch (err) {
          console.error("[stream error]", err);
          const message =
            err instanceof Error ? err.message : "Unknown error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`),
          );
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
    return new Response("Internal server error", { status: 500 });
  }
}

// PATCH — update conversation metadata (initial analysis sent, hub flow state)
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as {
      conversationId: string;
      hubQuestionIndex?: number | null;
    };
    if (!body.conversationId) {
      return new Response("conversationId is required", { status: 400 });
    }

    if (body.hubQuestionIndex !== undefined) {
      await updateHubQuestionIndex(
        body.conversationId,
        session.user.id,
        body.hubQuestionIndex,
      );
    } else {
      await markInitialAnalysisSent(body.conversationId, session.user.id);
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[chat PATCH]", error);
    return new Response("Internal server error", { status: 500 });
  }
}
