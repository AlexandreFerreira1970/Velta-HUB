import { Text } from "@/components/ui";
import { scoreColor } from "@/lib/hub-display";

export function DimensionCard({
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
