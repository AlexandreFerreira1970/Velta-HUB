"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";

const INVALID_VALUE_MESSAGE =
  "Por favor, informe um valor numérico entre 0 e 100.";

/** Parses a 0–100 value, returning null when invalid. */
function parsePercentage(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return Math.round(n);
}

interface QuantitativeResponseProps {
  onSubmit: (value: number) => void;
  disabled: boolean;
  submittedValue: number | null;
}

export function QuantitativeResponse({
  onSubmit,
  disabled,
  submittedValue,
}: QuantitativeResponseProps) {
  const [localValue, setLocalValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const value = parsePercentage(localValue);
    if (value === null) {
      setError(INVALID_VALUE_MESSAGE);
      return;
    }
    setError(null);
    onSubmit(value);
  };

  if (submittedValue !== null) {
    return (
      <div className="flex items-center gap-2 ml-10">
        <div
          className="px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium"
          style={{ background: "var(--navy)", color: "var(--ink-inverse)" }}
        >
          {submittedValue}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 ml-10 max-w-xs">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            type="number"
            min="0"
            max="100"
            step="1"
            placeholder="0 – 100"
            autoFocus
            value={localValue}
            error={error ?? undefined}
            disabled={disabled}
            onChange={(e) => {
              setLocalValue(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          disabled={disabled}
          onClick={handleSubmit}
          style={{ marginBottom: error ? 20 : 0 }}
        >
          Confirmar
        </Button>
      </div>
    </div>
  );
}
