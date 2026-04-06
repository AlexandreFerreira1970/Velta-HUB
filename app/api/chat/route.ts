import { auth } from "@/auth";
import {
  getConversation,
  saveLastResponseId,
  appendMessage,
} from "@/lib/conversations";
import { getOpenAIClient } from "@/lib/foundry";

export const runtime = "nodejs";

const AGENT_NAME = process.env.AZURE_FOUNDRY_AGENT_NAME!;
const AGENT_VERSION = process.env.AZURE_FOUNDRY_AGENT_VERSION ?? "1";

// GET — load conversation history
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }
    const doc = await getConversation(session.user.id);
    return Response.json({ messages: doc?.messages ?? [] });
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

    const { content } = (await req.json()) as { content: string };
    if (!content?.trim()) {
      return new Response("content is required", { status: 400 });
    }

    const userId = session.user.id;
    const openAI = getOpenAIClient();

    const existing = await getConversation(userId);
    const lastResponseId = existing?.lastResponseId ?? null;

    // Save user message
    await appendMessage(userId, {
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
          // responses.create IS patched by the Azure SDK overwrite —
          // it merges options.body into the request body, so the agent
          // reference reaches the Azure endpoint correctly.
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
              body: { agent: { name: AGENT_NAME, version: AGENT_VERSION, type: "agent_reference" } },
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
          await appendMessage(userId, {
            role: "assistant",
            content: fullText,
            timestamp: new Date().toISOString(),
          });

          if (newResponseId) {
            await saveLastResponseId(userId, newResponseId);
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
