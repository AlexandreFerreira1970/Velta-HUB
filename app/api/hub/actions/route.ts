import { auth } from "@/auth";
import { getOpenAIClient } from "@/lib/foundry";
import type { DecisionOutput } from "@/lib/types";

export const runtime = "nodejs";

const AGENT_NAME = process.env.AZURE_FOUNDRY_AGENT_NAME!;
const AGENT_VERSION = process.env.AZURE_FOUNDRY_AGENT_VERSION ?? "1";

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { output } = (await req.json()) as { output: DecisionOutput };
    if (!output?.hubScore) {
      return new Response("output is required", { status: 400 });
    }

    const prompt = [
      "Com base nos dados abaixo de uma análise organizacional, gere ações recomendadas curtas e objetivas.",
      "Responda SOMENTE com as ações separadas por ';'. Sem numeração, sem explicações, sem texto adicional.",
      "Exemplo de formato: Ação 1;Ação 2;Ação 3",
      "",
      `HUB Score: ${output.hubScore.toFixed(1)}`,
      `Cenário: ${output.scenario}`,
      `Dimensões ajustadas: RH=${output.adjustedDimensions.rh.toFixed(1)}, FIN=${output.adjustedDimensions.fin.toFixed(1)}, LOG=${output.adjustedDimensions.log.toFixed(1)}, MKT=${output.adjustedDimensions.mkt.toFixed(1)}, ESG=${output.adjustedDimensions.esg.toFixed(1)}`,
      `IRL (Risco Logístico): ${output.strategicIndices.irl.toFixed(1)} (${output.strategicIndices.irlLevel})`,
      `IIH (Impacto Humano): ${output.strategicIndices.iih.toFixed(1)} (${output.strategicIndices.iihLevel})`,
      `IU (Urgência): ${output.strategicIndices.iu.toFixed(1)} (${output.strategicIndices.iuLevel})`,
    ].join("\n");

    const openAI = getOpenAIClient();

    const response = (await openAI.responses.create(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { input: prompt, stream: false } as any,
      {
        body: {
          agent: {
            name: AGENT_NAME,
            version: AGENT_VERSION,
            type: "agent_reference",
          },
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    )) as any;

    const text: string =
      response?.output_text ??
      response?.output?.[0]?.content?.[0]?.text ??
      response?.choices?.[0]?.message?.content ??
      "";

    console.log("[hub/actions] agent raw response:", text.slice(0, 500));

    const actions = text
      .split(";")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    return Response.json({ actions });
  } catch (err) {
    console.error("[hub/actions]", err);
    return new Response("Internal server error", { status: 500 });
  }
}
