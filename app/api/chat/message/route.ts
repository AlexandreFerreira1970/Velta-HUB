import { auth } from "@/auth";
import { appendMessages } from "@/lib/conversations";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { messages, conversationId, hubQuestionIndex } = body as {
    messages?: Array<{ role: unknown; content: unknown; id?: unknown }>;
    conversationId?: string;
    hubQuestionIndex?: number | null;
  };

  if (!conversationId) {
    return new Response("conversationId is required", { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("messages array required", { status: 400 });
  }

  const valid = messages.filter(
    (m) =>
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      (m.content as string).trim(),
  ) as Array<{
    role: "user" | "assistant";
    content: string;
    id?: unknown;
  }>;

  if (!valid.length) return new Response("No valid messages", { status: 400 });

  const now = new Date().toISOString();
  await appendMessages(
    conversationId,
    session.user.id,
    valid.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: now,
      ...(typeof m.id === "string" ? { id: m.id } : {}),
    })),
    hubQuestionIndex !== undefined ? hubQuestionIndex : undefined,
  );

  return new Response(null, { status: 204 });
}
