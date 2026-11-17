// Structured hub questionnaire shown in the chat, plus helpers to advance it
// and to rebuild its state from persisted messages.

import { emptyHubValues, type HubValues } from "@/lib/hub-input";
import type { ChatMessage, Dimension } from "@/lib/types";

// --- Copy --------------------------------------------------------------------

export const FIRST_TIME_WELCOME_COPY =
  "Bem-vindo ao Hub Intelligence Velta. Aqui, decisões deixam de ser intuitivas e passam a ser estruturadas. Vamos começar?";

export const WELCOME_BACK_COPY =
  "Bem-vindo de volta ao Hub Intelligence Velta. Você pode conversar sobre uma análise anterior pelo menu à esquerda ou iniciar uma nova análise.";

export const ONBOARDING_COPY = {
  welcome: "Olá! Bem-vindo ao Velta. Sou seu assistente de gestão corporativa.",
  askCompany: "Para começar, qual é o nome da sua empresa?",
  askBusiness: "Qual é o ramo de atividade da sua empresa?",
  askBusinessAfterCompany:
    "Obrigado! E qual é o ramo de atividade da sua empresa?",
  done: "Perfeito! Agora você pode me fazer perguntas sobre sua empresa. Como posso ajudar?",
};

export const HUB_THANK_YOU_COPY =
  "Obrigado por compartilhar essas informações! Com base nas suas respostas, realizarei a análise estratégica da sua empresa.";

// --- Answer options ----------------------------------------------------------

export const QUALITATIVE_OPTIONS = [
  { label: "Muito Ruim", value: 10 },
  { label: "Ruim", value: 30 },
  { label: "Razoável", value: 50 },
  { label: "Bom", value: 70 },
  { label: "Excelente", value: 90 },
] as const;

// --- Flow definition ---------------------------------------------------------

export type HubQuestion = {
  type: "question";
  content: string;
  dimension: Dimension;
  field: string;
  inputType: "qualitative" | "quantitative";
};

export type HubFlowItem = { type: "header"; content: string } | HubQuestion;

const header = (content: string): HubFlowItem => ({ type: "header", content });

const qualitative = (
  dimension: Dimension,
  field: string,
  content: string,
): HubFlowItem => ({
  type: "question",
  inputType: "qualitative",
  dimension,
  field,
  content,
});

const quantitative = (
  dimension: Dimension,
  field: string,
  content: string,
): HubFlowItem => ({
  type: "question",
  inputType: "quantitative",
  dimension,
  field,
  content,
});

export const HUB_FLOW: HubFlowItem[] = [
  // -- RH ------------------------------------------------------------------
  header(
    "Bem-vindo ao HUB VELTA.\nEste sistema irá conduzir uma análise estruturada da sua organização.\nResponda às perguntas conforme solicitado para gerar um diagnóstico estratégico preciso.\n\nComeçaremos pelo pilar de Recursos Humanos.",
  ),
  qualitative("rh", "clima", "Como você avalia o clima organizacional atual da empresa?"),
  qualitative("rh", "engajamento", "Como você avalia o nível de engajamento da equipe?"),
  quantitative(
    "rh",
    "turnover",
    "Qual é a taxa de turnover (rotatividade) da empresa? Informe um valor de 0 a 100.",
  ),
  quantitative(
    "rh",
    "absenteismo",
    "Qual é a taxa de absenteísmo (faltas e atrasos) dos colaboradores? Informe um valor de 0 a 100.",
  ),

  // -- FIN -----------------------------------------------------------------
  header("Agora vamos ao pilar Financeiro."),
  quantitative(
    "fin",
    "margem",
    "Qual é a margem de lucro atual da empresa? Informe um valor de 0 a 100.",
  ),
  qualitative("fin", "caixa", "Como você avalia a saúde atual do fluxo de caixa da empresa?"),
  qualitative(
    "fin",
    "crescimento",
    "Como você avalia o crescimento da receita no período recente?",
  ),
  quantitative(
    "fin",
    "endividamento",
    "Qual é o nível de endividamento da empresa? Informe um valor de 0 a 100.",
  ),

  // -- LOG -----------------------------------------------------------------
  header("Seguindo para Operações e Logística."),
  qualitative(
    "log",
    "produtividade",
    "Como você avalia a produtividade operacional da equipe?",
  ),
  qualitative(
    "log",
    "capacidade",
    "Como você avalia o aproveitamento da capacidade instalada da empresa?",
  ),
  quantitative(
    "log",
    "retrabalho",
    "Qual é a taxa de retrabalho nas operações? Informe um valor de 0 a 100.",
  ),
  qualitative(
    "log",
    "tempoEntrega",
    "Como você avalia o cumprimento dos prazos de entrega aos clientes?",
  ),

  // -- MKT -----------------------------------------------------------------
  header("Agora o pilar de Marketing e Vendas."),
  qualitative(
    "mkt",
    "leads",
    "Como você avalia a consistência da geração de leads da empresa?",
  ),
  quantitative(
    "mkt",
    "conversao",
    "Qual é a taxa de conversão de leads em clientes? Informe um valor de 0 a 100.",
  ),
  qualitative("mkt", "retencao", "Como você avalia a retenção de clientes da empresa?"),
  quantitative(
    "mkt",
    "cac",
    "Qual é o custo de aquisição de clientes (CAC) normalizado? Informe um valor de 0 a 100.",
  ),

  // -- ESG -----------------------------------------------------------------
  header("E por último, o pilar ESG — Ambiental, Social e Governança."),
  qualitative(
    "esg",
    "ambiental",
    "Como você avalia as iniciativas ambientais e de sustentabilidade da empresa?",
  ),
  qualitative(
    "esg",
    "social",
    "Como você avalia o relacionamento da empresa com colaboradores, comunidade e parceiros?",
  ),
  qualitative(
    "esg",
    "governanca",
    "Como você avalia a governança da empresa (processos, transparência e ética)?",
  ),
];

// --- Message helpers ---------------------------------------------------------

export function botMsg(id: string, content: string): ChatMessage {
  return { id, role: "assistant", content, timestamp: new Date().toISOString() };
}

export function userMsg(id: string, content: string): ChatMessage {
  return { id, role: "user", content, timestamp: new Date().toISOString() };
}

const HUB_QUESTION_ID = /^hub-q-(\d+)$/;

/** Hub flow item for a message rendered as a hub question, if any. */
export function hubQuestionForMessage(
  msg: ChatMessage,
): { index: number; item: HubQuestion } | null {
  const match = msg.id.match(HUB_QUESTION_ID);
  if (!match) return null;
  const index = parseInt(match[1], 10);
  const item = HUB_FLOW[index];
  return item?.type === "question" ? { index, item } : null;
}

// --- Flow navigation ---------------------------------------------------------

/**
 * Bot messages to show starting at `fromIndex`: consecutive headers followed by
 * the next question. `nextQuestionIndex` is -1 when the flow is over.
 */
export function getNextHubMessages(fromIndex: number): {
  messages: ChatMessage[];
  nextQuestionIndex: number;
} {
  const messages: ChatMessage[] = [];

  for (let i = fromIndex; i < HUB_FLOW.length; i++) {
    const item = HUB_FLOW[i];
    if (item.type === "header") {
      messages.push(botMsg(`hub-h-${i}`, item.content));
    } else {
      messages.push(botMsg(`hub-q-${i}`, item.content));
      return { messages, nextQuestionIndex: i };
    }
  }

  return { messages, nextQuestionIndex: -1 };
}

// --- Answers -----------------------------------------------------------------

export type HubAnswer = { value: number; label?: string };

/** Answers keyed by HUB_FLOW index. */
export type HubAnswers = Record<number, HubAnswer>;

/** Text shown for an answer: the option label for qualitative questions. */
export function answerLabel(item: HubQuestion, value: number): string | undefined {
  if (item.inputType !== "qualitative") return undefined;
  return QUALITATIVE_OPTIONS.find((o) => o.value === value)?.label ?? String(value);
}

function parseAnswer(content: string): HubAnswer | null {
  const numeric = Number(content);
  if (!isNaN(numeric)) return { value: numeric };
  const option = QUALITATIVE_OPTIONS.find((o) => o.label === content);
  return option ? { value: option.value, label: option.label } : null;
}

const QUESTION_INDEX_BY_CONTENT = new Map(
  HUB_FLOW.flatMap((item, i) =>
    item.type === "question" ? [[item.content, i] as const] : [],
  ),
);

/**
 * Rebuilds answers from persisted messages: each hub question (matched by id,
 * or by content for older messages) is answered by the next user message.
 */
export function restoreHubAnswers(messages: ChatMessage[]): HubAnswers {
  const answers: HubAnswers = {};

  messages.forEach((msg, mi) => {
    if (msg.role !== "assistant") return;

    const qi =
      hubQuestionForMessage(msg)?.index ??
      QUESTION_INDEX_BY_CONTENT.get(msg.content);
    if (qi === undefined || HUB_FLOW[qi]?.type !== "question") return;

    const reply = messages.slice(mi + 1).find((m) => m.role === "user");
    const answer = reply && parseAnswer(reply.content);
    if (answer) answers[qi] = answer;
  });

  return answers;
}

/** Converts answers into per-dimension values for scoring. */
export function answersToHubValues(answers: HubAnswers): HubValues {
  const values = emptyHubValues();
  for (const [index, answer] of Object.entries(answers)) {
    const item = HUB_FLOW[Number(index)];
    if (item?.type === "question") {
      values[item.dimension][item.field] = answer.value;
    }
  }
  return values;
}
