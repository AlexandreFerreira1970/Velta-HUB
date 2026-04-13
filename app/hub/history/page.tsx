"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Text } from "@/components/ui";
import type { HubDataDoc, ScenarioClassification } from "@/lib/types";

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M9 11L5 7l4-4"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// ─── Analysis Card ────────────────────────────────────────────────────────────

function AnalysisCard({
  doc,
  onView,
}: {
  doc: HubDataDoc;
  onView: () => void;
}) {
  const { hubScore, scenario } = doc.output;
  const cfg = SCENARIO_CONFIG[scenario];

  return (
    <button
      onClick={onView}
      className="w-full text-left rounded-[var(--radius-md)] border p-5 transition-colors duration-150"
      style={{
        background: "var(--surface-0)",
        borderColor: "var(--steel-soft)",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--steel)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--steel-soft)";
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Text variant="caption" color="tertiary">
            {formatDate(doc.createdAt)}
          </Text>
          <div className="flex items-center gap-3">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{
                color: scoreColor(hubScore),
                fontFamily: "var(--font-geist-mono, monospace)",
              }}
            >
              {hubScore.toFixed(1)}
            </span>
            <span
              className="text-xs font-medium"
              style={{ color: scoreColor(hubScore) }}
            >
              {scoreLabel(hubScore)}
            </span>
          </div>
        </div>
        <span
          className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          {cfg.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {(["rh", "fin", "log", "mkt", "esg"] as const).map((dim) => (
          <div key={dim} className="flex flex-col gap-0.5">
            <Text variant="overline" color="tertiary">
              {dim.toUpperCase()}
            </Text>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{
                color: scoreColor(doc.output.adjustedDimensions[dim]),
                fontFamily: "var(--font-geist-mono, monospace)",
              }}
            >
              {doc.output.adjustedDimensions[dim].toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HubHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HubDataDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hub/history")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ history: HubDataDoc[] }>;
      })
      .then(({ history }) => setHistory(history))
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Erro ao carregar histórico",
        ),
      );
  }, []);

  const handleView = (doc: HubDataDoc) => {
    sessionStorage.setItem(
      "hub_result",
      JSON.stringify({
        output: doc.output,
        conversationId: doc.conversationId ?? null,
      }),
    );
    router.push("/hub/result");
  };

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ background: "var(--canvas)" }}
    >
      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Text variant="title">Histórico de Análises</Text>
              <Text variant="body-sm" color="secondary" className="mt-1">
                Todas as análises organizacionais realizadas.
              </Text>
            </div>
            <button
              onClick={() => router.push("/hub")}
              className="flex items-center gap-1.5 px-3 h-8 rounded-[var(--radius-sm)] border text-sm font-medium transition-colors duration-150"
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
              <BackIcon />
              Nova Análise
            </button>
          </div>

          {error && (
            <p
              className="text-sm text-center py-12"
              style={{ color: "var(--semantic-error)" }}
            >
              {error}
            </p>
          )}

          {!history && !error && (
            <div className="py-12 text-center">
              <Text variant="body-sm" color="tertiary">
                Carregando histórico...
              </Text>
            </div>
          )}

          {history && history.length === 0 && (
            <div className="py-12 text-center">
              <Text variant="body-sm" color="tertiary">
                Nenhuma análise realizada ainda.
              </Text>
            </div>
          )}

          {history && history.length > 0 && (
            <div className="space-y-3">
              {history.map((doc) => (
                <AnalysisCard
                  key={doc.id}
                  doc={doc}
                  onView={() => handleView(doc)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
