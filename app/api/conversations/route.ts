import { auth } from "@/auth";
import { listConversations, createConversation } from "@/lib/conversations";

export const runtime = "nodejs";

// GET — list conversations for the authenticated user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const conversations = await listConversations(session.user.id);
    return Response.json({ conversations });
  } catch (error) {
    console.error("[conversations GET]", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// POST — create a new conversation
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const existing = await listConversations(userId);
    const title = `Conversa ${existing.length + 1}`;

    const conversation = await createConversation(userId, title);

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
    return new Response("Internal server error", { status: 500 });
  }
}
