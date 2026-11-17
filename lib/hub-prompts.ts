import type { DecisionOutput, DimensionScores } from "./types";

const fmt = (n: number) => n.toFixed(1);

function formatDimensions(d: DimensionScores, toValue = fmt, suffix = ""): string {
  return `RH=${toValue(d.rh)}${suffix}, FIN=${toValue(d.fin)}${suffix}, LOG=${toValue(d.log)}${suffix}, MKT=${toValue(d.mkt)}${suffix}, ESG=${toValue(d.esg)}${suffix}`;
}

function strategicIndexLines(o: DecisionOutput): string[] {
  const s = o.strategicIndices;
  return [
    `IRL (Risco Logístico): ${fmt(s.irl)} (${s.irlLevel})`,
    `IIH (Impacto Humano): ${fmt(s.iih)} (${s.iihLevel})`,
    `IU (Urgência): ${fmt(s.iu)} (${s.iuLevel})`,
  ];
}

/** Prompt asking the agent for a ';'-separated list of recommended actions. */
export function formatActionsPrompt(o: DecisionOutput): string {
  return [
    "Com base nos dados abaixo de uma análise organizacional, gere ações recomendadas curtas e objetivas.",
    "Responda SOMENTE com as ações separadas por ';'. Sem numeração, sem explicações, sem texto adicional.",
    "Exemplo de formato: Ação 1;Ação 2;Ação 3",
    "",
    `HUB Score: ${fmt(o.hubScore)}`,
    `Cenário: ${o.scenario}`,
    `Dimensões ajustadas: ${formatDimensions(o.adjustedDimensions)}`,
    ...strategicIndexLines(o),
  ].join("\n");
}

/** Prompt that opens the chat after an analysis, asking for a full write-up. */
export function formatAnalysisPrompt(o: DecisionOutput): string {
  return [
    `Com base na análise Hub realizada, faça um descritivo completo do cenário atual da empresa e sugira as ações necessárias.`,
    ``,
    `Dados da análise:`,
    `HUB Score: ${fmt(o.hubScore)}`,
    `Cenário: ${o.scenario}`,
    `Dimensões ajustadas: ${formatDimensions(o.adjustedDimensions)}`,
    `Dimensões brutas: ${formatDimensions(o.rawDimensions)}`,
    `Pesos dinâmicos: ${formatDimensions(o.dynamicWeights, (w) => fmt(w * 100), "%")}`,
    ...strategicIndexLines(o),
    `Ações recomendadas: ${o.actions.join("; ")}`,
  ].join("\n");
}
