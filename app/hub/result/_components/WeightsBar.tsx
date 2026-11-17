import { Text } from "@/components/ui";
import type { DimensionWeights } from "@/lib/types";
import { DIMENSION_COLORS, DIMENSION_LABELS } from "../_lib/dimensionDisplay";

export function WeightsBar({ weights }: { weights: DimensionWeights }) {
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
