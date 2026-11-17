"use client";

import { Text } from "@/components/ui";
import { SCENARIO_CONFIG, scoreColor, scoreLabel } from "@/lib/hub-display";
import type { HubDataDoc } from "@/lib/types";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function AnalysisCard({
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
