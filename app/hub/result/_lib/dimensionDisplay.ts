import type { DimensionScores } from "@/lib/types";

export const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  rh: "RH",
  fin: "FIN",
  log: "LOG",
  mkt: "MKT",
  esg: "ESG",
};

export const DIMENSION_COLORS: Record<keyof DimensionScores, string> = {
  rh: "var(--navy)",
  fin: "var(--azure)",
  log: "#6b7280",
  mkt: "#8b5cf6",
  esg: "#10b981",
};
