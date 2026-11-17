import { Input, Text } from "@/components/ui";
import type { DimensionDef } from "../_lib/dimensions";

export function DimensionSection({
  dim,
  values,
  errors,
  onChange,
}: {
  dim: DimensionDef;
  values: Record<string, string>;
  errors: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div
      className="rounded-[var(--radius-md)] border p-5 space-y-4"
      style={{
        background: "var(--surface-0)",
        borderColor: "var(--steel-soft)",
      }}
    >
      <Text variant="subheading">{dim.title}</Text>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {dim.fields.map((f) => (
          <Input
            key={f.key}
            label={f.label}
            helperText={f.helper}
            type="number"
            min="0"
            max="100"
            step="1"
            value={values[f.key] ?? ""}
            error={errors[f.key]}
            onChange={(e) => onChange(f.key, e.target.value)}
            placeholder="0 – 100"
          />
        ))}
      </div>
    </div>
  );
}
