import { SCENARIO_CONFIG } from "@/lib/hub-display";
import type { ScenarioClassification } from "@/lib/types";

export function ScenarioBadge({ scenario }: { scenario: ScenarioClassification }) {
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
