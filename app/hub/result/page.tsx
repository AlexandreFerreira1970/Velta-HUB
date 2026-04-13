"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Text } from "@/components/ui";
import type {
  DecisionOutput,
  ScenarioClassification,
  DimensionScores,
  DimensionWeights,
} from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 75) return "var(--semantic-success)";
  if (score >= 50) return "var(--semantic-warning)";
  return "var(--semantic-error)";
}

function scoreLabel(score: number): string {
  if (score >= 81) return "Alta Performance";
  if (score >= 61) return "Estável";
  if (score >= 41) return "Atenção";
  return "Crítico";
}

const SCENARIO_CONFIG: Record<
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

const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  rh: "RH",
  fin: "FIN",
  log: "LOG",
  mkt: "MKT",
  esg: "ESG",
};

const DIMENSION_COLORS: Record<keyof DimensionScores, string> = {
  rh: "var(--navy)",
  fin: "var(--azure)",
  log: "#6b7280",
  mkt: "#8b5cf6",
  esg: "#10b981",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScenarioBadge({ scenario }: { scenario: ScenarioClassification }) {
  const cfg = SCENARIO_CONFIG[scenario];
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

function DimensionCard({
  label,
  raw,
  adjusted,
}: {
  label: string;
  raw: number;
  adjusted: number;
}) {
  const delta = adjusted - raw;
  const hasDelta = Math.abs(delta) > 0.05;

  return (
    <div
      className="rounded-[var(--radius-md)] border p-4 flex flex-col gap-1"
      style={{
        background: "var(--surface-0)",
        borderColor: "var(--steel-soft)",
      }}
    >
      <Text variant="overline" color="tertiary">
        {label}
      </Text>
      <span
        className="text-2xl font-semibold tabular-nums"
        style={{
          color: scoreColor(adjusted),
          fontFamily: "var(--font-geist-mono, monospace)",
        }}
      >
        {adjusted.toFixed(1)}
      </span>
      {hasDelta && (
        <Text variant="caption" style={{ color: "var(--semantic-warning)" }}>
          {raw.toFixed(1)} → {adjusted.toFixed(1)} ({delta > 0 ? "+" : ""}
          {delta.toFixed(1)})
        </Text>
      )}
    </div>
  );
}

function IndexRow({
  label,
  value,
  level,
}: {
  label: string;
  value: number;
  level: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Text variant="body-sm" color="secondary">
        {label}
      </Text>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="tabular-nums text-sm font-semibold"
          style={{
            color: scoreColor(100 - value),
            fontFamily: "var(--font-geist-mono, monospace)",
          }}
        >
          {value.toFixed(1)}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background: "var(--surface-2)",
            color: "var(--ink-secondary)",
          }}
        >
          {level}
        </span>
      </div>
    </div>
  );
}

function WeightsBar({ weights }: { weights: DimensionWeights }) {
  const dims = Object.keys(weights) as (keyof DimensionWeights)[];
  return (
    <div className="space-y-2">
      <div className="flex h-6 rounded-full overflow-hidden">
        {dims.map((d) => (
          <div
            key={d}
            style={{
              width: `${(weights[d] * 100).toFixed(1)}%`,
              background: DIMENSION_COLORS[d],
            }}
            title={`${DIMENSION_LABELS[d]}: ${(weights[d] * 100).toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {dims.map((d) => (
          <div key={d} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: DIMENSION_COLORS[d] }}
            />
            <Text variant="caption" color="secondary">
              {DIMENSION_LABELS[d]} {(weights[d] * 100).toFixed(1)}%
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HubResultPage() {
  const router = useRouter();
  const [output, setOutput] = useState<
    (DecisionOutput & { actions: string[] }) | null
  >(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("hub_result");
    if (!raw) {
      router.push("/hub");
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      // Support both formats: { output, conversationId } and legacy plain output
      if (parsed.output) {
        setOutput(parsed.output as DecisionOutput & { actions: string[] });
        setConversationId(parsed.conversationId ?? null);
      } else {
        setOutput(parsed as DecisionOutput & { actions: string[] });
      }
    } catch {
      router.push("/hub");
    }
  }, [router]);

  if (!output) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: "var(--canvas)" }}
      >
        <Text variant="body-sm" color="tertiary">
          Carregando resultado...
        </Text>
      </div>
    );
  }

  const {
    hubScore,
    rawDimensions,
    adjustedDimensions,
    dynamicWeights,
    strategicIndices,
    scenario,
    actions,
  } = output;
  const dims = Object.keys(adjustedDimensions) as (keyof DimensionScores)[];

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ background: "var(--canvas)" }}
    >
      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-5">
          {/* HUB Score hero */}
          <div
            className="rounded-[var(--radius-md)] border p-8 text-center"
            style={{
              background: "var(--surface-0)",
              borderColor: "var(--steel-soft)",
            }}
          >
            <Text variant="overline" color="tertiary">
              HUB SCORE
            </Text>
            <div
              className="text-7xl font-bold tabular-nums mt-2 leading-none"
              style={{
                color: scoreColor(hubScore),
                fontFamily: "var(--font-geist-mono, monospace)",
              }}
            >
              {hubScore.toFixed(1)}
            </div>
            <p
              className="mt-2 text-sm font-medium"
              style={{ color: scoreColor(hubScore) }}
            >
              {scoreLabel(hubScore)}
            </p>
            <ScenarioBadge scenario={scenario} />
          </div>

          {/* Dimension grid */}
          <div>
            <Text variant="subheading" className="mb-3">
              Scores por Dimensão
            </Text>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {dims.map((d) => (
                <DimensionCard
                  key={d}
                  label={DIMENSION_LABELS[d]}
                  raw={rawDimensions[d]}
                  adjusted={adjustedDimensions[d]}
                />
              ))}
            </div>
          </div>

          {/* Strategic indices */}
          <div
            className="rounded-[var(--radius-md)] border p-5 space-y-3"
            style={{
              background: "var(--surface-0)",
              borderColor: "var(--steel-soft)",
            }}
          >
            <Text variant="subheading">Índices Estratégicos</Text>
            <IndexRow
              label="IRL — Risco Logístico"
              value={strategicIndices.irl}
              level={strategicIndices.irlLevel}
            />
            <IndexRow
              label="IIH — Impacto Humano"
              value={strategicIndices.iih}
              level={strategicIndices.iihLevel}
            />
            <IndexRow
              label="IU — Urgência"
              value={strategicIndices.iu}
              level={strategicIndices.iuLevel}
            />
          </div>

          {/* Recommended actions */}
          <div
            className="rounded-[var(--radius-md)] border p-5"
            style={{
              background: "var(--surface-0)",
              borderColor: "var(--steel-soft)",
            }}
          >
            <Text variant="subheading" className="mb-4">
              Ações Recomendadas
            </Text>
            <ul className="space-y-2">
              {actions.map((action) => (
                <li key={action} className="flex items-start gap-2">
                  <span
                    style={{
                      color: "var(--azure)",
                      marginTop: 2,
                      fontSize: 16,
                      lineHeight: 1,
                    }}
                  >
                    →
                  </span>
                  <Text variant="body-sm">{action}</Text>
                </li>
              ))}
            </ul>
          </div>

          {/* Dynamic weights */}
          <div
            className="rounded-[var(--radius-md)] border p-5"
            style={{
              background: "var(--surface-0)",
              borderColor: "var(--steel-soft)",
            }}
          >
            <Text variant="subheading" className="mb-4">
              Pesos Dinâmicos Aplicados
            </Text>
            <WeightsBar weights={dynamicWeights} />
          </div>

          {/* CTAs */}
          <div className="flex gap-3 pb-8">
            <button
              onClick={() => router.push("/hub")}
              className="flex-1 h-10 rounded-[var(--radius-sm)] border text-sm font-medium transition-colors duration-150"
              style={{
                borderColor: "var(--steel)",
                color: "var(--ink-secondary)",
                background: "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Nova Análise
            </button>
            <button
              onClick={() => {
                if (conversationId && output) {
                  sessionStorage.setItem(
                    "hub_analysis_context",
                    JSON.stringify(output),
                  );
                  router.push(
                    `/chat?conversationId=${encodeURIComponent(conversationId)}&fromAnalysis=true`,
                  );
                } else {
                  router.push("/chat");
                }
              }}
              className="flex-1 h-10 rounded-[var(--radius-sm)] text-sm font-medium transition-colors duration-150"
              style={{
                background: "var(--navy)",
                color: "var(--ink-inverse)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--azure)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--navy)";
              }}
            >
              Conversar com Assistente
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
