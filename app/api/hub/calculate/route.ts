import { runScoringEngine } from "@/lib/scoring";
import { saveHubData } from "@/lib/hub";
import {
  badRequest,
  getSessionUserId,
  readJson,
  serverError,
  unauthorized,
} from "@/lib/api";
import { HUB_DIMENSION_FIELDS, type HubInput } from "@/lib/types";

export const runtime = "nodejs";

const isNumberIn0to100 = (v: unknown) =>
  typeof v === "number" && isFinite(v) && v >= 0 && v <= 100;

function isValidHubInput(body: unknown): body is HubInput {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;

  return Object.entries(HUB_DIMENSION_FIELDS).every(([dim, fields]) => {
    const d = b[dim];
    if (!d || typeof d !== "object") return false;
    return fields.every((f) =>
      isNumberIn0to100((d as Record<string, unknown>)[f]),
    );
  });
}

// POST — score structured hub input and persist it
export async function POST(req: Request): Promise<Response> {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const body = await readJson<HubInput & { conversationId?: string }>(req);
  if (body === undefined) return badRequest("Invalid JSON");

  if (!isValidHubInput(body)) {
    return badRequest(
      "Dados inválidos. Todos os campos devem ser números entre 0 e 100.",
    );
  }

  try {
    const output = runScoringEngine(body);
    const doc = await saveHubData(userId, body, output, body.conversationId);
    return Response.json({ output, hubDataId: doc.id });
  } catch (err) {
    console.error("[hub/calculate]", err);
    return serverError();
  }
}
