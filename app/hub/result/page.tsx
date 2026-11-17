"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Text } from "@/components/ui";
import { scoreColor, scoreLabel } from "@/lib/hub-display";
import {
  readHubResult,
  storeAnalysisContext,
} from "@/lib/hub-session";
import { useStoredHubResult } from "@/hooks/useStoredHubResult";
import type { DimensionScores } from "@/lib/types";
import { DimensionCard } from "./_components/DimensionCard";
import { IndexRow } from "./_components/IndexRow";
import { ScenarioBadge } from "./_components/ScenarioBadge";
import { WeightsBar } from "./_components/WeightsBar";
import { DIMENSION_LABELS } from "./_lib/dimensionDisplay";

// --- Main Page ----------------------------------------------------------------

export default function HubResultPage() {
  const router = useRouter();
  const result = useStoredHubResult();

  // Nothing to show → back to the analysis form
  useEffect(() => {
    if (!readHubResult()) router.push("/hub");
  }, [router]);

  if (!result) {
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

  const { output, conversationId } = result;
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
                if (conversationId) {
                  storeAnalysisContext(output);
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
