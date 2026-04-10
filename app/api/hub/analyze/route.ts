import { auth } from "@/auth";
import { getConversation } from "@/lib/conversations";
import { getOpenAIClient } from "@/lib/foundry";
import { runScoringEngine } from "@/lib/scoring";
import { saveHubData } from "@/lib/hub";
import type { HubInput } from "@/lib/types";

export const runtime = "nodejs";

const AGENT_NAME = "calculadora-hub-score";
const AGENT_VERSION = "8";

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return new Response("Unauthorized", { status: 401 });

    const userId = session.user.id;

    let conversationId: string | undefined;
    try {
      const body = await req.json();
      conversationId = body?.conversationId;
    } catch {
      // empty body
    }

    if (!conversationId) {
      return new Response("conversationId is required", { status: 400 });
    }

    // Busca todas as mensagens da conversa salvas no Cosmos DB
    const conversation = await getConversation(conversationId, userId);
    if (!conversation?.messages?.length) {
      return new Response("No conversation found", { status: 400 });
    }

    const openAI = getOpenAIClient();

    // Passa as mensagens da conversa como input para o agente calculador
    const input = conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    console.log("[hub/analyze] input:", input);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = (await openAI.responses.create(
      { input, stream: false } as any,
      {
        body: {
          agent: {
            name: AGENT_NAME,
            version: AGENT_VERSION,
            type: "agent_reference",
          },
        },
      },
    )) as any;

    console.log(JSON.stringify(response, null, 2));

    // Extrai o texto da resposta — tenta múltiplos caminhos da API do Azure AI Foundry
    const text: string =
      response?.output_text ??
      response?.output?.[0]?.content?.[0]?.text ??
      response?.choices?.[0]?.message?.content ??
      "";

    console.log("[hub/analyze] agent raw response:", text.slice(0, 500));

    // Extrai o objeto JSON da resposta (robusto a texto antes/depois do JSON)
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("[hub/analyze] agent did not return JSON:", text);
      return new Response("Agent returned invalid response", { status: 500 });
    }

    const hubInput = JSON.parse(match[0]) as HubInput;

    // Calcula os scores com o engine existente
    const output = runScoringEngine(hubInput);

    // Salva no container hub_data com conversationId
    await saveHubData(userId, hubInput, output, conversationId);

    return Response.json({ output });
  } catch (err) {
    console.error("[hub/analyze]", err);
    return new Response("Internal server error", { status: 500 });
  }
}
