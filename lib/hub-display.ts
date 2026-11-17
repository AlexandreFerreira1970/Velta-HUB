import type { ScenarioClassification } from "./types";

export function scoreColor(score: number): string {
  if (score >= 75) return "var(--semantic-success)";
  if (score >= 50) return "var(--semantic-warning)";
  return "var(--semantic-error)";
}

export function scoreLabel(score: number): string {
  if (score >= 81) return "Alta Performance";
  if (score >= 61) return "Estável";
  if (score >= 41) return "Atenção";
  return "Crítico";
}

export const SCENARIO_CONFIG: Record<
  ScenarioClassification,
  { label: string; bg: string; color: string }
> = {
  bloqueio_automatico: {
    label: "Bloqueio Automático",
    bg: "var(--semantic-error)",
    color: "#fff",
  },
  prioridade_critica: {
    label: "Prioridade Crítica",
    bg: "var(--semantic-warning)",
    color: "#000",
  },
  aprovacao_obrigatoria: {
    label: "Aprovação Obrigatória",
    bg: "var(--navy)",
    color: "#fff",
  },
  execucao_assistida: {
    label: "Execução Assistida",
    bg: "var(--azure)",
    color: "#fff",
  },
  execucao_automatica: {
    label: "Execução Automática",
    bg: "var(--semantic-success)",
    color: "#fff",
  },
};
