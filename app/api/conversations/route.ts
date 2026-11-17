import { listConversations, createConversation } from "@/lib/conversations";
import { getSessionUserId, serverError, unauthorized } from "@/lib/api";

export const runtime = "nodejs";

// GET — list conversations for the authenticated user
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const conversations = await listConversations(userId);
    return Response.json({ conversations });
  } catch (error) {
    console.error("[conversations GET]", error);
    return serverError();
  }
}

// POST — create a new conversation
export async function POST() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const existing = await listConversations(userId);
    const conversation = await createConversation(
      userId,
      `Análise ${existing.length + 1}`,
    );

    return Response.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    console.error("[conversations POST]", error);
    return serverError();
  }
}
