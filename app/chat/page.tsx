"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Text, Button, Input, Drawer } from "@/components/ui";
import { VELTA_CHAT_SIDEBAR_EVENT } from "@/components/Header";
import { ConversationsSidebar } from "./_components/ConversationsSidebar";
import type { ChatMessage, ConversationSummary } from "@/lib/conversations";
import type {
  DecisionOutput,
  HubInput,
  RHInput,
  FINInput,
  LOGInput,
  MKTInput,
  ESGInput,
} from "@/lib/types";
import Markdown from "react-markdown";
import Image from "next/image";

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

// ─── Avatars ──────────────────────────────────────────────────────────────────

function AgentAvatar() {
  return (
    <div className="shrink-0 w-16 h-16 rounded-full flex items-center justify-center">
      <Image
        src="/veltinha-icon.webp"
        alt="Velta"
        width={65}
        height={65}
        unoptimized
        className="w-14 h-14 rounded-full object-cover"
      />
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
      className={`flex items-end gap-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && <AgentAvatar />}
      <div className="max-w-full md:max-w-[72%] space-y-1">
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
            <Markdown>{message.content}</Markdown>
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

// ─── Qualitative options ────────────────────────────────────────────────────

const QUALITATIVE_OPTIONS = [
  { label: "Muito Ruim", value: 10 },
  { label: "Ruim", value: 30 },
  { label: "Razoável", value: 50 },
  { label: "Bom", value: 70 },
  { label: "Excelente", value: 90 },
] as const;

// ─── Inline Hub Response Components ───────────────────────────────────────────

function QualitativeResponse({
  onSelect,
  disabled,
  selectedValue,
}: {
  onSelect: (value: number) => void;
  disabled: boolean;
  selectedValue: number | null;
}) {
  return (
    <div className="flex items-start gap-2 ml-20">
      <div className="flex flex-wrap gap-2">
        {QUALITATIVE_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={selectedValue === opt.value ? "primary" : "secondary"}
            size="sm"
            disabled={disabled}
            onClick={() => onSelect(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function QuantitativeResponse({
  onSubmit,
  disabled,
  submittedValue,
}: {
  onSubmit: (value: number) => void;
  disabled: boolean;
  submittedValue: number | null;
}) {
  const [localValue, setLocalValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const trimmed = localValue.trim();
    if (trimmed === "") {
      setError("Por favor, informe um valor numérico entre 0 e 100.");
      return;
    }
    const n = Number(trimmed);
    if (isNaN(n) || !Number.isFinite(n) || n < 0 || n > 100) {
      setError("Por favor, informe um valor numérico entre 0 e 100.");
      return;
    }
    setError(null);
    onSubmit(Math.round(n));
  };

  if (submittedValue !== null) {
    return (
      <div className="flex items-center gap-2 ml-10">
        <div
          className="px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium"
          style={{
            background: "var(--navy)",
            color: "var(--ink-inverse)",
          }}
        >
          {submittedValue}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 ml-10 max-w-xs">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            type="number"
            min="0"
            max="100"
            step="1"
            placeholder="0 – 100"
            autoFocus
            value={localValue}
            error={error ?? undefined}
            disabled={disabled}
            onChange={(e) => {
              setLocalValue(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          disabled={disabled}
          onClick={handleSubmit}
          style={{ marginBottom: error ? 20 : 0 }}
        >
          Confirmar
        </Button>
      </div>
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

type HubFlowItem =
  | { type: "header"; content: string }
  | {
      type: "question";
      content: string;
      dimension: "rh" | "fin" | "log" | "mkt" | "esg";
      field: string;
      inputType: "qualitative" | "quantitative";
    };

const HUB_FLOW: HubFlowItem[] = [
  // ── RH ──────────────────────────────────────────────────────────────────
  {
    type: "header",
    content:
      "Bem-vindo ao HUB VELTA.\nEste sistema irá conduzir uma análise estruturada da sua organização.\nResponda às perguntas conforme solicitado para gerar um diagnóstico estratégico preciso.\n\nComeçaremos pelo pilar de Recursos Humanos.",
  },
  {
    type: "question",
    content: "Como você avalia o clima organizacional atual da empresa?",
    dimension: "rh",
    field: "clima",
    inputType: "qualitative",
  },
  {
    type: "question",
    content: "Como você avalia o nível de engajamento da equipe?",
    dimension: "rh",
    field: "engajamento",
    inputType: "qualitative",
  },
  {
    type: "question",
    content:
      "Qual é a taxa de turnover (rotatividade) da empresa? Informe um valor de 0 a 100.",
    dimension: "rh",
    field: "turnover",
    inputType: "quantitative",
  },
  {
    type: "question",
    content:
      "Qual é a taxa de absenteísmo (faltas e atrasos) dos colaboradores? Informe um valor de 0 a 100.",
    dimension: "rh",
    field: "absenteismo",
    inputType: "quantitative",
  },

  // ── FIN ─────────────────────────────────────────────────────────────────
  {
    type: "header",
    content: "Agora vamos ao pilar Financeiro.",
  },
  {
    type: "question",
    content:
      "Qual é a margem de lucro atual da empresa? Informe um valor de 0 a 100.",
    dimension: "fin",
    field: "margem",
    inputType: "quantitative",
  },
  {
    type: "question",
    content: "Como você avalia a saúde atual do fluxo de caixa da empresa?",
    dimension: "fin",
    field: "caixa",
    inputType: "qualitative",
  },
  {
    type: "question",
    content: "Como você avalia o crescimento da receita no período recente?",
    dimension: "fin",
    field: "crescimento",
    inputType: "qualitative",
  },
  {
    type: "question",
    content:
      "Qual é o nível de endividamento da empresa? Informe um valor de 0 a 100.",
    dimension: "fin",
    field: "endividamento",
    inputType: "quantitative",
  },

  // ── LOG ─────────────────────────────────────────────────────────────────
  {
    type: "header",
    content: "Seguindo para Operações e Logística.",
  },
  {
    type: "question",
    content: "Como você avalia a produtividade operacional da equipe?",
    dimension: "log",
    field: "produtividade",
    inputType: "qualitative",
  },
  {
    type: "question",
    content:
      "Como você avalia o aproveitamento da capacidade instalada da empresa?",
    dimension: "log",
    field: "capacidade",
    inputType: "qualitative",
  },
  {
    type: "question",
    content:
      "Qual é a taxa de retrabalho nas operações? Informe um valor de 0 a 100.",
    dimension: "log",
    field: "retrabalho",
    inputType: "quantitative",
  },
  {
    type: "question",
    content:
      "Como você avalia o cumprimento dos prazos de entrega aos clientes?",
    dimension: "log",
    field: "tempoEntrega",
    inputType: "qualitative",
  },

  // ── MKT ─────────────────────────────────────────────────────────────────
  {
    type: "header",
    content: "Agora o pilar de Marketing e Vendas.",
  },
  {
    type: "question",
    content: "Como você avalia a consistência da geração de leads da empresa?",
    dimension: "mkt",
    field: "leads",
    inputType: "qualitative",
  },
  {
    type: "question",
    content:
      "Qual é a taxa de conversão de leads em clientes? Informe um valor de 0 a 100.",
    dimension: "mkt",
    field: "conversao",
    inputType: "quantitative",
  },
  {
    type: "question",
    content: "Como você avalia a retenção de clientes da empresa?",
    dimension: "mkt",
    field: "retencao",
    inputType: "qualitative",
  },
  {
    type: "question",
    content:
      "Qual é o custo de aquisição de clientes (CAC) normalizado? Informe um valor de 0 a 100.",
    dimension: "mkt",
    field: "cac",
    inputType: "quantitative",
  },

  // ── ESG ─────────────────────────────────────────────────────────────────
  {
    type: "header",
    content: "E por último, o pilar ESG — Ambiental, Social e Governança.",
  },
  {
    type: "question",
    content:
      "Como você avalia as iniciativas ambientais e de sustentabilidade da empresa?",
    dimension: "esg",
    field: "ambiental",
    inputType: "qualitative",
  },
  {
    type: "question",
    content:
      "Como você avalia o relacionamento da empresa com colaboradores, comunidade e parceiros?",
    dimension: "esg",
    field: "social",
    inputType: "qualitative",
  },
  {
    type: "question",
    content:
      "Como você avalia a governança da empresa (processos, transparência e ética)?",
    dimension: "esg",
    field: "governanca",
    inputType: "qualitative",
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

// ─── Save messages (+ optional hubQuestionIndex) atomically ─────────────────

async function saveToConversation(
  conversationId: string,
  msgs: Array<{
    role: "user" | "assistant";
    content: string;
    id?: string;
  }>,
  hubQuestionIndex?: number | null,
): Promise<void> {
  await fetch("/api/chat/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: msgs,
      conversationId,
      ...(hubQuestionIndex !== undefined ? { hubQuestionIndex } : {}),
    }),
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
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [hubAnalysisStatus, setHubAnalysisStatus] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [hubMinDelayPassed, setHubMinDelayPassed] = useState(false);
  const hubAnalysisConvIdRef = useRef<string | null>(null);
  const router = useRouter();

  // Mobile sidebar drawer — toggled by hamburger in shared Header
  const [chatSidebarOpen, setChatSidebarOpen] = useState(false);
  useEffect(() => {
    const handler = () => setChatSidebarOpen((v) => !v);
    window.addEventListener(VELTA_CHAT_SIDEBAR_EVENT, handler);
    return () => window.removeEventListener(VELTA_CHAT_SIDEBAR_EVENT, handler);
  }, []);

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

  // Hub analysis overlay — start 10s minimum delay timer when loading begins.
  // IMPORTANT: timer must survive the loading→done transition, otherwise the
  // overlay stays stuck when analysis finishes faster than 10s.
  const hubDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (hubAnalysisStatus === "loading") {
      if (hubDelayTimerRef.current) clearTimeout(hubDelayTimerRef.current);
      setHubMinDelayPassed(false);
      hubDelayTimerRef.current = setTimeout(() => {
        setHubMinDelayPassed(true);
        hubDelayTimerRef.current = null;
      }, 10000);
    } else if (hubAnalysisStatus === "idle") {
      if (hubDelayTimerRef.current) {
        clearTimeout(hubDelayTimerRef.current);
        hubDelayTimerRef.current = null;
      }
      setHubMinDelayPassed(false);
    }
    // "done" / "error": do nothing — let the existing timer keep running.
  }, [hubAnalysisStatus]);

  // Clear timer on unmount only
  useEffect(() => {
    return () => {
      if (hubDelayTimerRef.current) clearTimeout(hubDelayTimerRef.current);
    };
  }, []);

  // Hub analysis overlay — navigate on any key/click once analysis is ready
  useEffect(() => {
    if (hubAnalysisStatus !== "done" || !hubMinDelayPassed) return;
    const handler = () => router.push("/hub/result");
    window.addEventListener("keydown", handler);
    window.addEventListener("click", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("click", handler);
    };
  }, [hubAnalysisStatus, hubMinDelayPassed, router]);

  const [onboardingStep, setOnboardingStep] =
    useState<OnboardingStep>("loading");

  const isAsking =
    onboardingStep === "hub" ||
    onboardingStep === "ask_business" ||
    onboardingStep === "ask_company";

  useEffect(() => {
    if (isAsking && hasScrolledToBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (bottomRef.current && !hasScrolledToBottom && messages.length > 0) {
      setHasScrolledToBottom(true);
      bottomRef.current.scrollIntoView();
    }
  }, [messages, hasScrolledToBottom, isAsking]);

  const [hubQuestionIndex, setHubQuestionIndex] = useState(0);
  const [hubResponses, setHubResponses] = useState<
    Record<string, Record<string, number>>
  >({ rh: {}, fin: {}, log: {}, mkt: {}, esg: {} });
  const [hubAnsweredQuestions, setHubAnsweredQuestions] = useState<
    Record<number, { value: number; label?: string }>
  >({});

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
      setHasScrolledToBottom(false);

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

  // ── Helper: start hub flow from a given index, persisting all messages ────
  const startHubFlow = useCallback(
    (
      convId: string,
      fromIndex: number,
      mode: "replace" | "append" = "replace",
      shouldSave: boolean = true,
    ) => {
      const { headers, question, nextQuestionIndex } =
        getNextHubMessages(fromIndex);
      const botMessages = question ? [...headers, question] : headers;

      // Persist ALL bot messages + hub flow position atomically (preserve hub IDs)
      const allToSave = botMessages.map((m) => ({
        role: "assistant" as const,
        content: m.content,
        id: m.id,
      }));
      if (allToSave.length) {
        if (shouldSave) {
          saveToConversation(convId, allToSave, nextQuestionIndex).catch(
            console.error,
          );
        }
      }

      if (mode === "append") {
        setMessages((prev) => prev.concat(botMessages));
      } else {
        setMessages(botMessages);
      }
      setHubQuestionIndex(nextQuestionIndex);
      setOnboardingStep("hub");
    },
    [],
  );

  // ── Helper: create new conversation + switch + start hub flow ────────────
  const handleNewConversation = useCallback(async () => {
    const convId = await createNewConversation();
    setActiveConversationId(convId);

    startHubFlow(convId, 0);
    setHistoryLoading(false);
  }, [createNewConversation, startHubFlow]);

  // ── Hub structured answer handler ─────────────────────────────────────────
  const handleHubAnswer = useCallback(
    async (value: number) => {
      const currentItem = HUB_FLOW[hubQuestionIndex];
      if (currentItem.type !== "question") return;

      const convId = activeConversationIdRef.current;
      if (!convId) return;

      // Store the structured value
      setHubResponses((prev) => ({
        ...prev,
        [currentItem.dimension]: {
          ...prev[currentItem.dimension],
          [currentItem.field]: value,
        },
      }));

      // Mark as answered
      const label =
        currentItem.inputType === "qualitative"
          ? (QUALITATIVE_OPTIONS.find((o) => o.value === value)?.label ??
            String(value))
          : undefined;
      setHubAnsweredQuestions((prev) => ({
        ...prev,
        [hubQuestionIndex]: { value, label },
      }));

      // Show user response as a message
      const displayText = label ?? String(value);
      const userMsg: ChatMessage = {
        id: `u-hub-${hubQuestionIndex}`,
        role: "user",
        content: displayText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Advance to next question
      const { headers, question, nextQuestionIndex } = getNextHubMessages(
        hubQuestionIndex + 1,
      );

      if (nextQuestionIndex === -1) {
        // All questions answered — finalize
        const finalResponses = {
          ...hubResponses,
          [currentItem.dimension]: {
            ...hubResponses[currentItem.dimension],
            [currentItem.field]: value,
          },
        };

        const hubInput: HubInput = {
          acoes: [],
          rh: finalResponses.rh as unknown as RHInput,
          fin: finalResponses.fin as unknown as FINInput,
          log: finalResponses.log as unknown as LOGInput,
          mkt: finalResponses.mkt as unknown as MKTInput,
          esg: finalResponses.esg as unknown as ESGInput,
        };

        const thankYouContent =
          "Obrigado por compartilhar essas informações! Com base nas suas respostas, realizarei a análise estratégica da sua empresa.";

        // Persist user answer + closing headers + thank you + mark hub completed — single atomic write
        const closingMsgs = [
          {
            role: "user" as const,
            content: displayText,
            id: `u-hub-${hubQuestionIndex}`,
          },
          ...headers.map((h) => ({
            role: "assistant" as const,
            content: h.content,
            id: h.id,
          })),
          { role: "assistant" as const, content: thankYouContent },
        ];
        saveToConversation(convId, closingMsgs, null).catch(console.error);

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

        hubAnalysisConvIdRef.current = convId;
        setHubAnalysisStatus("loading");
        setOnboardingStep("done");

        // Call /api/hub/calculate directly with structured data
        (async () => {
          try {
            const calcRes = await fetch("/api/hub/calculate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...hubInput, conversationId: convId }),
            });
            if (!calcRes.ok) throw new Error(`HTTP ${calcRes.status}`);
            const calcData = await calcRes.json();
            const output = calcData.output as DecisionOutput;

            // Generate actions via agent
            try {
              const actionsRes = await fetch("/api/hub/actions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ output }),
              });
              if (actionsRes.ok) {
                const actionsData = await actionsRes.json();
                if (actionsData.actions?.length) {
                  output.actions = actionsData.actions;
                }
              }
            } catch {
              // Actions generation failed — continue without actions
            }

            sessionStorage.setItem(
              "hub_result",
              JSON.stringify({ output, conversationId: convId }),
            );
            setHubAnalysisStatus("done");
          } catch {
            setHubAnalysisStatus("error");
          }
        })();
      } else {
        // Persist user answer + next headers + question — single atomic write
        const nextMsgs = [
          {
            role: "user" as const,
            content: displayText,
            id: `u-hub-${hubQuestionIndex}`,
          },
          ...headers.map((h) => ({
            role: "assistant" as const,
            content: h.content,
            id: h.id,
          })),
          {
            role: "assistant" as const,
            content: question!.content,
            id: question!.id,
          },
        ];
        saveToConversation(convId, nextMsgs, nextQuestionIndex).catch(
          console.error,
        );

        setMessages((prev) => [...prev, ...headers, question!]);
        setHubQuestionIndex(nextQuestionIndex);
      }
    },
    [hubQuestionIndex, hubResponses],
  );

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
            // Profile complete but hub not done → check for existing conversation with hub state
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

            // Check if there's an existing hub flow in progress
            const convRes = await fetch(
              `/api/chat?conversationId=${encodeURIComponent(convId)}`,
            );
            const convData = convRes.ok ? await convRes.json() : null;
            const savedMessages = (convData?.messages ?? []) as ChatMessage[];
            const savedHubQIndex = convData?.hubQuestionIndex as number | null;

            if (
              savedMessages.length > 0 &&
              typeof savedHubQIndex === "number"
            ) {
              // Resume hub flow from saved state (IDs like hub-q-N are preserved from DB)
              setMessages(savedMessages);
              setHubQuestionIndex(savedHubQIndex);

              // Rebuild hubAnsweredQuestions — dual matching (by ID or content fallback)
              const answered: Record<
                number,
                { value: number; label?: string }
              > = {};
              const contentToIdx = new Map<string, number>();
              for (let fi = 0; fi < HUB_FLOW.length; fi++) {
                if (HUB_FLOW[fi].type === "question")
                  contentToIdx.set(HUB_FLOW[fi].content, fi);
              }
              for (let mi = 0; mi < savedMessages.length; mi++) {
                const msg = savedMessages[mi];
                if (msg.role !== "assistant") continue;
                // Try ID match first, then content fallback
                let qi: number | null = null;
                const qMatch = msg.id.match(/^hub-q-(\d+)$/);
                if (qMatch) {
                  qi = parseInt(qMatch[1], 10);
                } else if (contentToIdx.has(msg.content)) {
                  qi = contentToIdx.get(msg.content)!;
                }
                if (qi === null) continue;
                const item = HUB_FLOW[qi];
                if (!item || item.type !== "question") continue;
                // Find the next user message after this question
                const answerMsg = savedMessages
                  .slice(mi + 1)
                  .find((m) => m.role === "user");
                if (answerMsg) {
                  const numVal = Number(answerMsg.content);
                  if (!isNaN(numVal)) {
                    answered[qi] = { value: numVal };
                  } else {
                    const opt = QUALITATIVE_OPTIONS.find(
                      (o) => o.label === answerMsg.content,
                    );
                    if (opt) {
                      answered[qi] = {
                        value: opt.value,
                        label: opt.label,
                      };
                    }
                  }
                }
              }
              setHubAnsweredQuestions(answered);

              // Rebuild hubResponses from answered questions
              const responses: Record<string, Record<string, number>> = {
                rh: {},
                fin: {},
                log: {},
                mkt: {},
                esg: {},
              };
              for (const [idxStr, ans] of Object.entries(answered)) {
                const item = HUB_FLOW[Number(idxStr)];
                if (item.type === "question") {
                  responses[item.dimension][item.field] = ans.value;
                }
              }
              setHubResponses(responses);

              setHistoryLoading(false);
              setOnboardingStep("hub");
            } else if (savedMessages.length === 0) {
              // Fresh start
              startHubFlow(convId, 0);
              setHistoryLoading(false);
            } else {
              // Has messages but no hub state — start fresh hub
              startHubFlow(convId, 0, "append");
              setHistoryLoading(false);
            }
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

                if (lastConv.hubQuestionIndex === null) {
                  setOnboardingStep("done");
                } else {
                  const messages = await fetch(
                    `/api/chat?conversationId=${encodeURIComponent(lastConv.id)}`,
                  );
                  const messagesData = messages.ok
                    ? await messages.json()
                    : null;
                  const messagesDataMessages = messagesData?.messages ?? [];
                  setOnboardingStep("hub");
                  startHubFlow(
                    lastConv.id,
                    lastConv.hubQuestionIndex,
                    "append",
                    false,
                  );
                  setMessages(messagesDataMessages);
                  setHistoryLoading(false);
                }
              } else {
                setOnboardingStep("done");
              }
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

    if (!isAsking) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 250);
    }

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
        startHubFlow(convId, 0, "append");
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
        startHubFlow(convId, 0, "append");
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

    // ── Hub: block free text during structured flow ────────────────────────
    if (onboardingStep === "hub") {
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
      let index = 0;

      while (true) {
        index++;

        if (index === 1) {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
          });
        }

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
            if (data.done) {
              setStreamingMessage(null);
              break;
            }
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
  }, [input, loading, onboardingStep, isAsking]);

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
      className="flex flex-col flex-1 min-h-0"
      style={{ background: "var(--canvas)" }}
    >
      {/* Body: sidebar + chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop only */}
        <aside
          className="hidden md:flex shrink-0 w-60 border-r flex-col overflow-hidden"
          style={{
            background: "var(--surface-0)",
            borderColor: "var(--steel-soft)",
          }}
        >
          <ConversationsSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onNew={handleNewConversation}
            onSelect={switchConversation}
          />
        </aside>

        {/* Sidebar — mobile drawer */}
        <Drawer
          open={chatSidebarOpen}
          onClose={() => setChatSidebarOpen(false)}
          side="left"
          ariaLabel="Conversas"
        >
          <ConversationsSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onNew={() => {
              setChatSidebarOpen(false);
              handleNewConversation();
            }}
            onSelect={(id) => {
              setChatSidebarOpen(false);
              switchConversation(id);
            }}
          />
        </Drawer>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <main className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-4xl mx-auto space-y-4">
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
                allMessages.map((msg, i) => {
                  const hubQMatch = msg.id.match(/^hub-q-(\d+)$/);
                  const hubQIndex = hubQMatch
                    ? parseInt(hubQMatch[1], 10)
                    : null;
                  const hubItem =
                    hubQIndex !== null ? HUB_FLOW[hubQIndex] : null;
                  const isHubQuestion =
                    hubItem !== null && hubItem.type === "question";
                  const answered =
                    hubQIndex !== null
                      ? hubAnsweredQuestions[hubQIndex]
                      : undefined;
                  const isCurrentHubQ =
                    isHubQuestion &&
                    onboardingStep === "hub" &&
                    hubQIndex === hubQuestionIndex &&
                    !answered;

                  return (
                    <div key={msg.id}>
                      <MessageBubble
                        message={msg}
                        isStreaming={
                          streamingMessage !== null &&
                          i === allMessages.length - 1 &&
                          msg.role === "assistant"
                        }
                        userImage={session?.user?.image}
                        userName={session?.user?.name}
                      />
                      {isHubQuestion &&
                        hubItem.type === "question" &&
                        hubItem.inputType === "qualitative" &&
                        (isCurrentHubQ || answered) && (
                          <div className="mt-4">
                            <QualitativeResponse
                              onSelect={handleHubAnswer}
                              disabled={!!answered}
                              selectedValue={answered ? answered.value : null}
                            />
                          </div>
                        )}
                      {isHubQuestion &&
                        hubItem.type === "question" &&
                        hubItem.inputType === "quantitative" &&
                        (isCurrentHubQ || answered) && (
                          <div className="mt-2">
                            <QuantitativeResponse
                              onSubmit={handleHubAnswer}
                              disabled={!!answered}
                              submittedValue={answered ? answered.value : null}
                            />
                          </div>
                        )}
                    </div>
                  );
                })
              )}
              {hubAnalysisStatus === "error" && (
                <div className="flex items-start gap-2">
                  <AgentAvatar />
                  <div
                    className="px-4 py-3 text-sm leading-relaxed"
                    style={{
                      background: "var(--surface-0)",
                      color: "var(--ink-primary)",
                      border: "1px solid var(--steel-soft)",
                      borderRadius: "2px 12px 12px 12px",
                    }}
                  >
                    <span style={{ color: "var(--error, #e53e3e)" }}>
                      Não foi possível gerar a análise. Tente novamente mais
                      tarde.
                    </span>
                  </div>
                </div>
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
            {onboardingStep === "hub" ? (
              <div className="text-center">
                <Text variant="body-sm" color="muted">
                  Para garantir a precisão da análise, responda utilizando as
                  opções disponíveis ou informe um valor numérico válido.
                </Text>
              </div>
            ) : (
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
            )}
          </footer>
        </div>
      </div>

      {/* ── Full-screen Hub analysis overlay ─────────────────────────────── */}
      {(hubAnalysisStatus === "loading" || hubAnalysisStatus === "done") && (
        <div
          className="hub-overlay fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, rgba(29, 78, 216, 0.18), rgba(12, 26, 46, 0.92) 70%)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          aria-live="polite"
          aria-busy={hubAnalysisStatus === "loading"}
        >
          <div className="hub-overlay-content flex flex-col items-center text-center max-w-xl">
            {/* Animated orb */}
            <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
              <div
                className="hub-pulse-ring absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(59, 130, 246, 0.5), rgba(29, 78, 216, 0) 70%)",
                }}
              />
              <div
                className="hub-orbit absolute inset-2 rounded-full"
                style={{
                  border: "1px solid rgba(147, 197, 253, 0.35)",
                  borderTopColor: "rgba(219, 234, 254, 0.95)",
                  borderRightColor: "rgba(147, 197, 253, 0.75)",
                }}
              />
              <div
                className="hub-float relative w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  boxShadow:
                    "0 0 40px rgba(59, 130, 246, 0.55), 0 0 80px rgba(29, 78, 216, 0.35)",
                }}
              >
                <span
                  style={{
                    color: "#f8fafc",
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    fontFamily: "var(--font-geist-sans)",
                  }}
                >
                  V
                </span>
              </div>
            </div>

            {hubAnalysisStatus === "loading" || !hubMinDelayPassed ? (
              <>
                <h2
                  className="hub-shimmer-text"
                  style={{
                    color: "#f8fafc",
                    fontSize: 30,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    letterSpacing: "-0.02em",
                    marginBottom: 12,
                    background:
                      "linear-gradient(90deg, #dbeafe, #ffffff, #93c5fd, #ffffff, #dbeafe)",
                    backgroundSize: "200% 100%",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    animation:
                      "hub-shimmer 2200ms ease-in-out infinite, hub-overlay-content-in 560ms cubic-bezier(0.22, 1, 0.36, 1) both",
                  }}
                >
                  Tecendo sua análise estratégica
                </h2>
                <p
                  style={{
                    color: "rgba(226, 232, 240, 0.85)",
                    fontSize: 15,
                    lineHeight: 1.6,
                    maxWidth: 480,
                    marginBottom: 24,
                  }}
                >
                  Estamos cruzando dados, ponderando dimensões e desenhando
                  recomendações sob medida para o seu negócio. Isso levará
                  apenas alguns instantes.
                </p>
                <div
                  className="flex items-center gap-2"
                  style={{ color: "rgba(191, 219, 254, 0.9)" }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="inline-block w-2 h-2 rounded-full animate-bounce"
                      style={{
                        background: "rgba(147, 197, 253, 0.9)",
                        animationDelay: `${i * 180}ms`,
                        animationDuration: "1100ms",
                      }}
                    />
                  ))}
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 12,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "rgba(191, 219, 254, 0.75)",
                    }}
                  >
                    {hubAnalysisStatus === "done"
                      ? "Finalizando"
                      : "Processando"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <h2
                  style={{
                    color: "#f8fafc",
                    fontSize: 30,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    letterSpacing: "-0.02em",
                    marginBottom: 12,
                    animation:
                      "hub-overlay-content-in 480ms cubic-bezier(0.22, 1, 0.36, 1) both",
                  }}
                >
                  Sua análise está pronta
                </h2>
                <p
                  style={{
                    color: "rgba(226, 232, 240, 0.85)",
                    fontSize: 15,
                    lineHeight: 1.6,
                    maxWidth: 480,
                    marginBottom: 28,
                  }}
                >
                  Preparamos um panorama completo das cinco dimensões do seu
                  negócio, com recomendações priorizadas.
                </p>
                <div
                  className="hub-ready-pulse inline-flex items-center gap-3 px-5 py-3 rounded-full"
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(147, 197, 253, 0.45)",
                    color: "#f8fafc",
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                  }}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{
                      background: "#4ade80",
                      boxShadow: "0 0 12px rgba(74, 222, 128, 0.9)",
                    }}
                  />
                  Pressione qualquer tecla para continuar
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
