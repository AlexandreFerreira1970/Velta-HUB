import { getHubHistory } from "@/lib/hub";
import { getSessionUserId, serverError, unauthorized } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  try {
    const history = await getHubHistory(userId);
    return Response.json({ history });
  } catch (err) {
    console.error("[hub/history]", err);
    return serverError();
  }
}
