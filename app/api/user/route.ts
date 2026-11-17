import { getUserById, updateUserProfile } from "@/lib/users";
import { badRequest, getSessionUserId, readJson, unauthorized } from "@/lib/api";
import type { UserProfileUpdate } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const user = await getUserById(userId);
  if (!user) return new Response("Not found", { status: 404 });

  return Response.json({ user });
}

export async function PATCH(req: Request): Promise<Response> {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const body = await readJson<Record<string, unknown>>(req);
  if (body === undefined) return badRequest("Invalid JSON");

  const b = body ?? {};
  const update: UserProfileUpdate = {};
  if (typeof b.companyName === "string" && b.companyName.trim())
    update.companyName = b.companyName.trim();
  if (typeof b.businessType === "string" && b.businessType.trim())
    update.businessType = b.businessType.trim();
  if (typeof b.hubAnalysisDone === "boolean")
    update.hubAnalysisDone = b.hubAnalysisDone;

  if (!Object.keys(update).length) return badRequest("No valid fields");

  const updated = await updateUserProfile(userId, update);
  if (!updated) return new Response("User not found", { status: 404 });

  return Response.json({ user: updated });
}
