import { Text } from "@/components/ui";
import { scoreColor } from "@/lib/hub-display";

export function IndexRow({
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
