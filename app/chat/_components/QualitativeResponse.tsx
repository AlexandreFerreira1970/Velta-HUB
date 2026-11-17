"use client";

import { Button } from "@/components/ui";
import { QUALITATIVE_OPTIONS } from "../_lib/hubFlow";

interface QualitativeResponseProps {
  onSelect: (value: number) => void;
  disabled: boolean;
  selectedValue: number | null;
}

export function QualitativeResponse({
  onSelect,
  disabled,
  selectedValue,
}: QualitativeResponseProps) {
  return (
    <div className="flex items-start gap-2 ml-20">
      <div className="flex flex-wrap gap-2">
        {QUALITATIVE_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={selectedValue === opt.value ? "primary" : "secondary"}
            size="sm"
            disabled={disabled}
            onClick={() => onSelect(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
