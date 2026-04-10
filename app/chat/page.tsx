"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Text } from "@/components/ui";
import type { ChatMessage, ConversationSummary } from "@/lib/conversations";
import type { DecisionOutput } from "@/lib/types";
import Markdown from "react-markdown";

// ─── Icons ───────────────────────────────────────────────────────────────────

const SendIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M14 8L2 2l2.5 6L2 14l12-6Z" fill="currentColor" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M5 2H2.5A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H5M9 4l3 3-3 3M12 7H5"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Avatars ──────────────────────────────────────────────────────────────────

function AgentAvatar() {
  return (
    <div
      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
      style={{ background: "var(--navy)" }}
    >
      <span
        style={{
          color: "var(--ink-inverse)",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "var(--font-geist-sans)",
        }}
      >
        V
      </span>
    </div>
  );
}

function UserAvatar({
  image,
  name,
}: {
  image?: string | null;
  name?: string | null;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ?? "Usuário"}
        className="shrink-0 w-8 h-8 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }
  const initial = name ? name[0].toUpperCase() : "U";
  return (
    <div
      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
      style={{ background: "var(--steel-soft)", color: "var(--ink-secondary)" }}
    >
      <span style={{ fontSize: 13, fontWeight: 600 }}>{initial}</span>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isStreaming,
  userImage,
  userName,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
  userImage?: string | null;
  userName?: string | null;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && <AgentAvatar />}
      <div className="max-w-[72%] space-y-1">
        <div
          className="px-4 py-3 text-sm leading-relaxed pre-wrap flex flex-col gap-4"
          style={
            isUser
              ? {
                  background: "var(--navy)",
                  color: "var(--ink-inverse)",
                  borderRadius: "12px 12px 2px 12px",
                }
              : {
                  background: "var(--surface-0)",
                  color: "var(--ink-primary)",
                  border: "1px solid var(--steel-soft)",
                  borderRadius: "2px 12px 12px 12px",
                }
          }
        >
          {message.role === "assistant" ? (
            <Markdown
              components={{
                li: ({ children }) => <li className="mt-2">{children}</li>,
                ol: ({ children }) => <ol className="mt-2">{children}</ol>,
              }}
            >
              {message.content}
            </Markdown>
          ) : (
            message.content
          )}
          {isStreaming && !!message.content && (
            <span
              className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
              style={{ background: "var(--azure)" }}
            />
          )}
          {isStreaming && !message.content && (
            <span className="inline-flex items-center gap-1 py-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{
                    background: "var(--steel)",
                    animationDelay: `${i * 150}ms`,
                    animationDuration: "900ms",
                  }}
                />
              ))}
            </span>
          )}
        </div>
        <Text
          variant="caption"
          color="muted"
          className={`px-1 ${isUser ? "text-right" : "text-left"}`}
        >
          {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </div>
      {isUser && <UserAvatar image={userImage} name={userName} />}
    </div>
  );
}

// ─── Onboarding / Hub flow types ──────────────────────────────────────────────

type OnboardingStep =
  | "loading"
  | "ask_company"
  | "ask_business"
  | "hub"
  | "done";

function botMsg(id: string, content: string): ChatMessage {
  return {
    id,
    role: "assistant",
    content,
    timestamp: new Date().toISOString(),
  };
}

// ─── Hub analysis questions (in order of pillar) ──────────────────────────────

const HUB_FLOW: Array<{ type: "header" | "question"; content: string }> = [
  // ── RH ──────────────────────────────────────────────────────────────────
  {
    type: "header",
    content:
      "Ótimo! Agora vou fazer algumas perguntas sobre a operação da sua empresa para realizar a análise estratégica. Começaremos pelo pilar de Recursos Humanos.",
  },
  {
    type: "question",
    content:
      "Como você descreveria o clima organizacional? Os colaboradores parecem satisfeitos e motivados no dia a dia?",
  },
  {
    type: "question",
    content:
      "Como é o engajamento da equipe? Eles se envolvem ativamente com os objetivos e iniciativas da empresa?",
  },
  {
    type: "question",
    content:
      "A empresa tem enfrentado muitas saídas voluntárias de colaboradores recentemente? Como está a retenção de talentos?",
  },
  {
    type: "question",
    content:
      "Faltas e atrasos são frequentes? Como está a assiduidade dos colaboradores de forma geral?",
  },

  // ── FIN ─────────────────────────────────────────────────────────────────
  {
    type: "header",
    content: "Agora vamos ao pilar Financeiro.",
  },
  {
    type: "question",
    content:
      "Qual é a margem de lucro atual da empresa? Se possível, informe o percentual.",
  },
  {
    type: "question",
    content:
      "Como está o fluxo de caixa? A empresa tem reservas para cobrir suas operações e possíveis imprevistos?",
  },
  {
    type: "question",
    content:
      "Como tem sido o crescimento da receita? A empresa está em expansão ou em um momento de estabilidade?",
  },
  {
    type: "question",
    content:
      "Como está o endividamento da empresa? As dívidas estão sendo gerenciadas sem comprometer a operação?",
  },

  // ── LOG ─────────────────────────────────────────────────────────────────
  {
    type: "header",
    content: "Seguindo para Operações e Logística.",
  },
  {
    type: "question",
    content:
      "Como está a produtividade operacional? A equipe consegue entregar dentro do que é esperado?",
  },
  {
    type: "question",
    content:
      "A capacidade instalada está sendo bem aproveitada? Há muita ociosidade ou, ao contrário, sobrecarga frequente?",
  },
  {
    type: "question",
    content:
      "Erros e necessidade de refazer tarefas são comuns nas operações? Isso tem impactado a eficiência?",
  },
  {
    type: "question",
    content:
      "Como estão os prazos de entrega? Os clientes recebem seus pedidos ou serviços no tempo combinado?",
  },

  // ── MKT ─────────────────────────────────────────────────────────────────
  {
    type: "header",
    content: "Agora o pilar de Marketing e Vendas.",
  },
  {
    type: "question",
    content:
      "A geração de leads tem sido consistente? A empresa consegue atrair novos potenciais clientes regularmente?",
  },
  {
    type: "question",
    content:
      "Como está a conversão de leads em clientes? Se tiver o percentual em mente, pode compartilhar.",
  },
  {
    type: "question",
    content:
      "Como está a retenção de clientes? Eles costumam voltar a comprar ou a empresa depende muito de conquistar novos clientes?",
  },
  {
    type: "question",
    content:
      "O custo de aquisição de clientes (CAC) está dentro do esperado para o seu mercado? Isso tem sido um ponto de atenção?",
  },

  // ── ESG ─────────────────────────────────────────────────────────────────
  {
    type: "header",
    content: "E por último, o pilar ESG — Ambiental, Social e Governança.",
  },
  {
    type: "question",
    content:
      "A empresa tem iniciativas voltadas à sustentabilidade ou redução de impacto ambiental? Como isso é tratado internamente?",
  },
  {
    type: "question",
    content:
      "Como a empresa se relaciona com colaboradores, comunidade e parceiros? Há programas ou práticas sociais relevantes?",
  },
  {
    type: "question",
    content:
      "Como está a governança da empresa? Existem processos, políticas e práticas de transparência e ética bem definidos?",
  },
];

// Returns consecutive headers + the next question (stopping there).
// Returns nextQuestionIndex = -1 when there are no more questions.
function getNextHubMessages(fromIndex: number): {
  headers: ChatMessage[];
  question: ChatMessage | null;
  nextQuestionIndex: number;
} {
  const headers: ChatMessage[] = [];
  let i = fromIndex;

  while (i < HUB_FLOW.length) {
    const item = HUB_FLOW[i];
    if (item.type === "header") {
      headers.push(botMsg(`hub-h-${i}`, item.content));
      i++;
    } else {
      return {
        headers,
        question: botMsg(`hub-q-${i}`, item.content),
        nextQuestionIndex: i,
      };
    }
  }

  return { headers, question: null, nextQuestionIndex: -1 };
}

// ─── Save messages to conversation (fire-and-forget helper) ──────────────────

async function saveToConversation(
  conversationId: string,
  msgs: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<void> {
  await fetch("/api/chat/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: msgs, conversationId }),
  });
}

// ─── Analysis prompt formatter ───────────────────────────────────────────────

function formatAnalysisPrompt(o: DecisionOutput): string {
  return [
    `Com base na análise Hub realizada, faça um descritivo completo do cenário atual da empresa e sugira as ações necessárias.`,
    ``,
    `Dados da análise:`,
    `HUB Score: ${o.hubScore.toFixed(1)}`,
    `Cenário: ${o.scenario}`,
    `Dimensões ajustadas: RH=${o.adjustedDimensions.rh.toFixed(1)}, FIN=${o.adjustedDimensions.fin.toFixed(1)}, LOG=${o.adjustedDimensions.log.toFixed(1)}, MKT=${o.adjustedDimensions.mkt.toFixed(1)}, ESG=${o.adjustedDimensions.esg.toFixed(1)}`,
    `Dimensões brutas: RH=${o.rawDimensions.rh.toFixed(1)}, FIN=${o.rawDimensions.fin.toFixed(1)}, LOG=${o.rawDimensions.log.toFixed(1)}, MKT=${o.rawDimensions.mkt.toFixed(1)}, ESG=${o.rawDimensions.esg.toFixed(1)}`,
    `Pesos dinâmicos: RH=${(o.dynamicWeights.rh * 100).toFixed(1)}%, FIN=${(o.dynamicWeights.fin * 100).toFixed(1)}%, LOG=${(o.dynamicWeights.log * 100).toFixed(1)}%, MKT=${(o.dynamicWeights.mkt * 100).toFixed(1)}%, ESG=${(o.dynamicWeights.esg * 100).toFixed(1)}%`,
    `IRL (Risco Logístico): ${o.strategicIndices.irl.toFixed(1)} (${o.strategicIndices.irlLevel})`,
    `IIH (Impacto Humano): ${o.strategicIndices.iih.toFixed(1)} (${o.strategicIndices.iihLevel})`,
    `IU (Urgência): ${o.strategicIndices.iu.toFixed(1)} (${o.strategicIndices.iuLevel})`,
    `Ações recomendadas: ${o.actions.join("; ")}`,
  ].join("\n");
}

// ─── Main chat page ───────────────────────────────────────────────────────────

export default function ChatPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(
    null,
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Conversation list
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const activeConversationIdRef = useRef<string | null>(null);

  // Keep ref in sync for use in callbacks
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const [onboardingStep, setOnboardingStep] =
    useState<OnboardingStep>("loading");
  const [hubQuestionIndex, setHubQuestionIndex] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const loadHistoryOnDone = useRef(false);
  const needsBusinessRef = useRef(false);
  const needsHubRef = useRef(false);
  const pendingAnalysisRef = useRef<DecisionOutput | null>(null);

  // ── Helper: create a new conversation via API ──────────────────────────────
  const createNewConversation = useCallback(async (): Promise<string> => {
    const res = await fetch("/api/conversations", { method: "POST" });
    const data = await res.json();
    const conv = data.conversation as ConversationSummary;
    setConversations((prev) => [...prev, conv]);
    setActiveConversationId(conv.id);
    return conv.id;
  }, []);

  // ── Helper: switch to an existing conversation ─────────────────────────────
  const switchConversation = useCallback(
    async (convId: string) => {
      if (convId === activeConversationId) return;
      setActiveConversationId(convId);
      setMessages([]);
      setHistoryLoading(true);

      try {
        const res = await fetch(
          `/api/chat?conversationId=${encodeURIComponent(convId)}`,
        );
        const data = await res.json();
        setMessages(data.messages ?? []);
      } catch (err) {
        console.error("[switchConversation]", err);
      } finally {
        setHistoryLoading(false);
      }
    },
    [activeConversationId],
  );

  // ── Helper: create new conversation + switch + start hub flow ────────────
  const handleNewConversation = useCallback(async () => {
    const convId = await createNewConversation();
    setActiveConversationId(convId);

    // Start hub analysis flow in the new conversation
    const { headers, question, nextQuestionIndex } = getNextHubMessages(0);
    const botMessages = question ? [...headers, question] : headers;

    if (headers.length) {
      saveToConversation(
        convId,
        headers.map((h) => ({
          role: "assistant" as const,
          content: h.content,
        })),
      ).catch(console.error);
    }

    setMessages(botMessages);
    setHubQuestionIndex(nextQuestionIndex);
    setOnboardingStep("hub");
    setHistoryLoading(false);
  }, [createNewConversation]);

  // ── 1. Profile check + conversation list ─────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // Fetch profile + conversation list in parallel
        const [userRes, convsRes] = await Promise.all([
          fetch("/api/user"),
          fetch("/api/conversations"),
        ]);

        const userData = userRes.ok ? await userRes.json() : null;
        const convsData = convsRes.ok ? await convsRes.json() : null;
        const convList = (convsData?.conversations ??
          []) as ConversationSummary[];
        setConversations(convList);

        const u = userData?.user as
          | {
              companyName?: string;
              businessType?: string;
              hubAnalysisDone?: boolean;
            }
          | undefined;

        const missingCompany = !u?.companyName;
        const missingBusiness = !u?.businessType;
        const hubDone = u?.hubAnalysisDone === true;

        needsBusinessRef.current = missingBusiness;
        needsHubRef.current = !hubDone;

        if (!missingCompany && !missingBusiness) {
          if (!hubDone) {
            // Profile complete but hub not done → create conv + start hub flow
            let convId: string;
            if (convList.length > 0) {
              convId = convList[convList.length - 1].id;
            } else {
              const res = await fetch("/api/conversations", { method: "POST" });
              const data = await res.json();
              const conv = data.conversation as ConversationSummary;
              setConversations([conv]);
              convId = conv.id;
            }
            setActiveConversationId(convId);

            const { headers, question, nextQuestionIndex } =
              getNextHubMessages(0);
            if (headers.length) {
              saveToConversation(
                convId,
                headers.map((h) => ({
                  role: "assistant" as const,
                  content: h.content,
                })),
              ).catch(console.error);
            }
            setMessages(question ? [...headers, question] : headers);
            setHubQuestionIndex(nextQuestionIndex);
            setHistoryLoading(false);
            setOnboardingStep("hub");
          } else {
            // All done → check for fromAnalysis or load most recent
            const fromAnalysis = searchParams.get("fromAnalysis") === "true";
            const targetConvId = searchParams.get("conversationId");

            if (fromAnalysis && targetConvId) {
              setActiveConversationId(targetConvId);

              // Store analysis output for AI to generate initial message after history loads
              const raw = sessionStorage.getItem("hub_analysis_context");
              if (raw) {
                sessionStorage.removeItem("hub_analysis_context");
                try {
                  pendingAnalysisRef.current = JSON.parse(
                    raw,
                  ) as DecisionOutput;
                } catch {
                  // ignore parse errors
                }
              }

              loadHistoryOnDone.current = true;
              setOnboardingStep("done");
            } else {
              loadHistoryOnDone.current = true;
              if (convList.length > 0) {
                const lastConv = convList[convList.length - 1];
                setActiveConversationId(lastConv.id);
              }
              setOnboardingStep("done");
            }
          }
          return;
        }

        // Profile incomplete → create conv + start onboarding
        let convId: string;
        if (convList.length > 0) {
          convId = convList[convList.length - 1].id;
        } else {
          const res = await fetch("/api/conversations", { method: "POST" });
          const data = await res.json();
          const conv = data.conversation as ConversationSummary;
          setConversations([conv]);
          convId = conv.id;
        }
        setActiveConversationId(convId);

        const initial: ChatMessage[] = [
          botMsg(
            "ob-welcome",
            "Olá! Bem-vindo ao Velta. Sou seu assistente de gestão corporativa.",
          ),
        ];

        if (missingCompany) {
          initial.push(
            botMsg(
              "ob-ask-company",
              "Para começar, qual é o nome da sua empresa?",
            ),
          );
          setOnboardingStep("ask_company");
        } else {
          initial.push(
            botMsg(
              "ob-ask-business",
              "Qual é o ramo de atividade da sua empresa?",
            ),
          );
          setOnboardingStep("ask_business");
        }

        setMessages(initial);
        setHistoryLoading(false);
      } catch {
        setOnboardingStep("done");
        setHistoryLoading(false);
      }
    })();
  }, []);

  // ── 2. History — load + trigger AI initial analysis if pending ────────────
  useEffect(() => {
    if (onboardingStep !== "done" || !loadHistoryOnDone.current) return;
    if (!activeConversationId) {
      setHistoryLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `/api/chat?conversationId=${encodeURIComponent(activeConversationId)}`,
        );
        const data = await res.json();
        const history = data.messages ?? [];
        setMessages(history);
        setHistoryLoading(false);

        // Check if we need to generate an initial analysis message
        const analysisOutput = pendingAnalysisRef.current;
        if (!analysisOutput) return;
        pendingAnalysisRef.current = null; // consume once

        // Skip if already sent
        if (data.initialAnalysisMessageSentAt) return;

        // Generate AI response with analysis context
        const prompt = formatAnalysisPrompt(analysisOutput);
        setLoading(true);

        const assistantMsg: ChatMessage = {
          id: `a-analysis-${Date.now()}`,
          role: "assistant",
          content: "",
          timestamp: new Date().toISOString(),
        };
        setStreamingMessage(assistantMsg);

        const chatRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: prompt,
            conversationId: activeConversationId,
          }),
        });

        if (!chatRes.ok || !chatRes.body) {
          throw new Error(`HTTP ${chatRes.status}`);
        }

        const reader = chatRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;
            try {
              const chunk = JSON.parse(raw) as {
                delta?: string;
                done?: boolean;
                error?: string;
              };
              if (chunk.error) throw new Error(chunk.error);
              if (chunk.delta) {
                accumulated += chunk.delta;
                setStreamingMessage((prev) =>
                  prev ? { ...prev, content: accumulated } : prev,
                );
              }
              if (chunk.done) break;
            } catch {
              // skip malformed
            }
          }
        }

        setMessages((prev) => [
          ...prev,
          { ...assistantMsg, content: accumulated },
        ]);
        setStreamingMessage(null);
        setLoading(false);

        // Mark flag so it doesn't repeat
        await fetch("/api/chat", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: activeConversationId }),
        });
      } catch (err) {
        console.error("[history/analysis]", err);
        setStreamingMessage(null);
        setLoading(false);
        setHistoryLoading(false);
      }
    })();
  }, [onboardingStep, activeConversationId]);

  // Focus textarea after AI response
  useEffect(() => {
    if (!loading) textareaRef.current?.focus();
  }, [loading]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const content = input.trim();
    if (!content || loading) return;

    const convId = activeConversationIdRef.current;
    if (!convId) return;

    setInput("");

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // ── Onboarding: company name ──────────────────────────────────────────
    if (onboardingStep === "ask_company") {
      setLoading(true);
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: content }),
      }).catch(console.error);

      if (needsBusinessRef.current) {
        setMessages((prev) => [
          ...prev,
          botMsg(
            `ob-ask-business-${Date.now()}`,
            "Obrigado! E qual é o ramo de atividade da sua empresa?",
          ),
        ]);
        setOnboardingStep("ask_business");
        setLoading(false);
        return;
      }

      if (needsHubRef.current) {
        const { headers, question, nextQuestionIndex } = getNextHubMessages(0);
        if (headers.length) {
          saveToConversation(
            convId,
            headers.map((h) => ({
              role: "assistant" as const,
              content: h.content,
            })),
          ).catch(console.error);
        }
        setMessages((prev) =>
          prev.concat(question ? [...headers, question] : headers),
        );
        setHubQuestionIndex(nextQuestionIndex);
        setOnboardingStep("hub");
        setLoading(false);
        return;
      }

      setMessages((prev) => [
        ...prev,
        botMsg(
          `ob-done-${Date.now()}`,
          "Perfeito! Agora você pode me fazer perguntas sobre sua empresa. Como posso ajudar?",
        ),
      ]);
      setOnboardingStep("done");
      setLoading(false);
      return;
    }

    // ── Onboarding: business type ─────────────────────────────────────────
    if (onboardingStep === "ask_business") {
      setLoading(true);
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType: content }),
      }).catch(console.error);

      if (needsHubRef.current) {
        const { headers, question, nextQuestionIndex } = getNextHubMessages(0);
        if (headers.length) {
          saveToConversation(
            convId,
            headers.map((h) => ({
              role: "assistant" as const,
              content: h.content,
            })),
          ).catch(console.error);
        }
        setMessages((prev) =>
          prev.concat(question ? [...headers, question] : headers),
        );
        setHubQuestionIndex(nextQuestionIndex);
        setOnboardingStep("hub");
        setLoading(false);
        return;
      }

      setMessages((prev) => [
        ...prev,
        botMsg(
          `ob-done-${Date.now()}`,
          "Perfeito! Agora você pode me fazer perguntas sobre sua empresa. Como posso ajudar?",
        ),
      ]);
      setOnboardingStep("done");
      setLoading(false);
      return;
    }

    // ── Hub analysis Q&A ──────────────────────────────────────────────────
    if (onboardingStep === "hub") {
      setLoading(true);

      const currentQ = HUB_FLOW[hubQuestionIndex];

      // Save current question + user answer
      await saveToConversation(convId, [
        { role: "assistant", content: currentQ.content },
        { role: "user", content },
      ]).catch(console.error);

      const { headers, question, nextQuestionIndex } = getNextHubMessages(
        hubQuestionIndex + 1,
      );

      // Save transition headers (pillar intros)
      if (headers.length) {
        saveToConversation(
          convId,
          headers.map((h) => ({
            role: "assistant" as const,
            content: h.content,
          })),
        ).catch(console.error);
      }

      if (nextQuestionIndex === -1) {
        // All questions answered
        const thankYouContent =
          "Obrigado por compartilhar essas informações! Com base nas suas respostas, realizarei a análise estratégica da sua empresa em breve.";

        await saveToConversation(convId, [
          { role: "assistant", content: thankYouContent },
        ]).catch(console.error);

        await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hubAnalysisDone: true }),
        }).catch(console.error);

        setMessages((prev) => [
          ...prev,
          ...headers,
          botMsg(`hub-thanks-${Date.now()}`, thankYouContent),
        ]);

        // Dispara análise em background (fire-and-forget)
        fetch("/api/hub/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: convId }),
        }).catch(console.error);

        setOnboardingStep("done");
      } else {
        setMessages((prev) => [...prev, ...headers, question!]);
        setHubQuestionIndex(nextQuestionIndex);
      }

      setLoading(false);
      return;
    }

    // ── Normal AI flow ────────────────────────────────────────────────────
    setLoading(true);

    const assistantMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };
    setStreamingMessage(assistantMsg);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, conversationId: convId }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const data = JSON.parse(raw) as {
              delta?: string;
              done?: boolean;
              error?: string;
            };
            if (data.error) throw new Error(data.error);
            if (data.delta) {
              accumulated += data.delta;
              setStreamingMessage((prev) =>
                prev ? { ...prev, content: accumulated } : prev,
              );
            }
            if (data.done) break;
          } catch {
            // skip malformed chunk
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        { ...assistantMsg, content: accumulated },
      ]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Erro desconhecido";
      setMessages((prev) => [
        ...prev,
        {
          ...assistantMsg,
          content: `⚠ Erro ao conectar com o assistente: ${errMsg}`,
        },
      ]);
    } finally {
      setStreamingMessage(null);
      setLoading(false);
    }
  }, [input, loading, onboardingStep, hubQuestionIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const triggerAnalysis = useCallback(async () => {
    const convId = activeConversationIdRef.current;
    if (analyzing || !convId) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/hub/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log("[dev] Hub analysis result:", data);
      setMessages((prev) => [
        ...prev,
        botMsg(
          `dev-analysis-${Date.now()}`,
          `[DEV] Análise gerada com sucesso. Verifique o console para detalhes.`,
        ),
      ]);
    } catch (err) {
      console.error("[dev] Analysis failed:", err);
      setMessages((prev) => [
        ...prev,
        botMsg(
          `dev-analysis-err-${Date.now()}`,
          `[DEV] Erro ao gerar análise: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
        ),
      ]);
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing]);

  const allMessages = streamingMessage
    ? [...messages, streamingMessage]
    : messages;

  const isOnboarding =
    onboardingStep !== "done" && onboardingStep !== "loading";

  return (
    <div
      className="flex flex-col h-screen"
      style={{ background: "var(--canvas)" }}
    >
      {/* Top nav */}
      <header
        className="flex items-center justify-between px-6 h-14 shrink-0 border-b"
        style={{
          background: "var(--surface-0)",
          borderColor: "var(--steel-soft)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center"
            style={{ background: "var(--navy)" }}
          >
            <span
              style={{
                color: "var(--ink-inverse)",
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "var(--font-geist-sans)",
              }}
            >
              V
            </span>
          </div>
          <Text variant="subheading" as="span" style={{ color: "var(--navy)" }}>
            Velta
          </Text>
          <span
            style={{ color: "var(--steel)", fontSize: 16, userSelect: "none" }}
          >
            |
          </span>
          <Text variant="body-sm" color="secondary">
            Assistente
          </Text>
          <span
            style={{ color: "var(--steel)", fontSize: 16, userSelect: "none" }}
          >
            |
          </span>
          <a href="/hub/history" style={{ textDecoration: "none" }}>
            <Text variant="body-sm" color="tertiary">
              Histórico
            </Text>
          </a>
          <span
            style={{ color: "var(--steel)", fontSize: 16, userSelect: "none" }}
          >
            |
          </span>
          <a href="/hub" style={{ textDecoration: "none" }}>
            <Text variant="body-sm" color="tertiary">
              Hub
            </Text>
          </a>
          {process.env.NODE_ENV === "development" && (
            <>
              <span
                style={{
                  color: "var(--steel)",
                  fontSize: 16,
                  userSelect: "none",
                }}
              >
                |
              </span>
              <button
                onClick={triggerAnalysis}
                disabled={analyzing}
                className="flex items-center gap-1.5 px-3 h-7 rounded-[var(--radius-sm)] border transition-colors duration-150 disabled:opacity-50"
                style={{
                  borderColor: "var(--azure)",
                  color: "var(--azure)",
                  background: "transparent",
                  fontSize: 12,
                  cursor: analyzing ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!analyzing)
                    e.currentTarget.style.background = "var(--surface-2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {analyzing ? (
                  <svg
                    className="animate-spin w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M8 1v14M1 8h14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {analyzing ? "Analisando..." : "Gerar Análise"}
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {session?.user?.name && (
            <Text variant="body-sm" color="secondary">
              {session.user.name}
            </Text>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 px-3 h-7 rounded-[var(--radius-sm)] border transition-colors duration-150"
            style={{
              borderColor: "var(--steel)",
              color: "var(--ink-secondary)",
              background: "transparent",
              fontSize: 12,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LogoutIcon />
            Sair
          </button>
        </div>
      </header>

      {/* Body: sidebar + chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className="shrink-0 w-60 border-r flex flex-col overflow-hidden"
          style={{
            background: "var(--surface-0)",
            borderColor: "var(--steel-soft)",
          }}
        >
          {/* New conversation button */}
          <div
            className="p-3 border-b"
            style={{ borderColor: "var(--steel-soft)" }}
          >
            <button
              onClick={handleNewConversation}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] border transition-colors duration-150"
              style={{
                borderColor: "var(--steel)",
                color: "var(--ink-secondary)",
                background: "transparent",
                fontSize: 13,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M8 1v14M1 8h14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Nova conversa
            </button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv, idx) => {
              const isActive = conv.id === activeConversationId;
              return (
                <button
                  key={conv.id}
                  onClick={() => switchConversation(conv.id)}
                  className="w-full text-left px-4 py-3 border-b transition-colors duration-100"
                  style={{
                    borderColor: "var(--steel-soft)",
                    background: isActive ? "var(--surface-2)" : "transparent",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "var(--surface-1)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Text
                    variant="body-sm"
                    color={isActive ? "primary" : "secondary"}
                    style={{ fontWeight: isActive ? 600 : 400 }}
                  >
                    {conv.title || `Conversa ${idx + 1}`}
                  </Text>
                  <Text variant="caption" color="muted" className="mt-0.5">
                    {new Date(conv.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </Text>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <main className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-2xl mx-auto space-y-4">
              {onboardingStep === "loading" || historyLoading ? (
                <div className="flex justify-center py-12">
                  <Text variant="caption" color="tertiary">
                    Carregando...
                  </Text>
                </div>
              ) : allMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                  <div className="flex flex-col items-center gap-3 px-8 text-center">
                    <div
                      className="w-12 h-12 rounded-[var(--radius-sm)] flex items-center justify-center"
                      style={{ background: "var(--navy)" }}
                    >
                      <span
                        style={{
                          color: "var(--ink-inverse)",
                          fontSize: 20,
                          fontWeight: 700,
                          letterSpacing: "-0.02em",
                          fontFamily: "var(--font-geist-sans)",
                        }}
                      >
                        V
                      </span>
                    </div>
                    <Text variant="subheading">Assistente Velta</Text>
                    <Text
                      variant="body-sm"
                      color="secondary"
                      className="max-w-xs"
                    >
                      Envie uma mensagem para começar.
                    </Text>
                  </div>
                </div>
              ) : (
                allMessages.map((msg, i) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isStreaming={
                      streamingMessage !== null &&
                      i === allMessages.length - 1 &&
                      msg.role === "assistant"
                    }
                    userImage={session?.user?.image}
                    userName={session?.user?.name}
                  />
                ))
              )}
              <div ref={bottomRef} />
            </div>
          </main>

          {/* Input bar */}
          <footer
            className="shrink-0 border-t px-4 py-3"
            style={{
              background: "var(--surface-0)",
              borderColor: "var(--steel-soft)",
            }}
          >
            <div className="max-w-2xl mx-auto flex items-end gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isOnboarding
                    ? "Digite sua resposta..."
                    : "Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
                }
                rows={1}
                disabled={loading || onboardingStep === "loading"}
                className="flex-1 resize-none px-3 py-2.5 text-sm rounded-[var(--radius-sm)] border outline-none transition-colors duration-150 disabled:opacity-50"
                style={{
                  background: "var(--control-bg)",
                  borderColor: "var(--control-border)",
                  color: "var(--ink-primary)",
                  lineHeight: "1.5",
                  maxHeight: 160,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor =
                    "var(--control-border-focus)";
                  e.currentTarget.style.borderLeftWidth = "2px";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--control-border)";
                  e.currentTarget.style.borderLeftWidth = "1px";
                }}
              />
              <button
                onClick={sendMessage}
                disabled={
                  !input.trim() || loading || onboardingStep === "loading"
                }
                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: loading ? "var(--azure-hover)" : "var(--navy)",
                  color: "var(--ink-inverse)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!loading && input.trim())
                    e.currentTarget.style.background = "var(--azure)";
                }}
                onMouseLeave={(e) => {
                  if (!loading)
                    e.currentTarget.style.background = "var(--navy)";
                }}
              >
                {loading ? (
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <SendIcon />
                )}
              </button>
            </div>
            <div className="max-w-2xl mx-auto mt-2">
              <Text variant="caption" color="muted" className="text-center">
                Assistente de gestão corporativa · Velta Platform
              </Text>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
