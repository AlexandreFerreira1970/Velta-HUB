"use client";

import { useRouter } from "next/navigation";
import { Text } from "@/components/ui";
import { BackIcon } from "@/components/icons";
import { storeHubResult } from "@/lib/hub-session";
import type { HubDataDoc } from "@/lib/types";
import { useHubHistory } from "@/hooks/useHubHistory";
import { AnalysisCard } from "./_components/AnalysisCard";

// --- Main Page ----------------------------------------------------------------

export default function HubHistoryPage() {
  const router = useRouter();
  const { data: history, error: queryError } = useHubHistory();
  const error = queryError
    ? queryError.message || "Erro ao carregar histórico"
    : null;

  const handleView = (doc: HubDataDoc) => {
    storeHubResult({
      output: doc.output,
      conversationId: doc.conversationId ?? null,
    });
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
