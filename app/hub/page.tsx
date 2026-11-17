"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Text } from "@/components/ui";
import { DimensionSection } from "./_components/DimensionSection";
import { DIMENSIONS } from "./_lib/dimensions";
import { storeHubResult } from "@/lib/hub-session";
import { emptyHubValues, toHubInput } from "@/lib/hub-input";
import type { Dimension } from "@/lib/types";
import { useCalculateHub } from "@/hooks/useCalculateHub";


// --- Default empty form state -------------------------------------------------

type FormValues = Record<Dimension, Record<string, string>>;

function defaultForm(): FormValues {
  const out = {} as FormValues;
  for (const dim of DIMENSIONS) {
    out[dim.id] = {};
    for (const f of dim.fields) {
      out[dim.id][f.key] = "";
    }
  }
  return out;
}

// --- Main Page ----------------------------------------------------------------

export default function HubPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormValues>(defaultForm);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, Record<string, string>>
  >({});
  const calculate = useCalculateHub();
  const submitting = calculate.isPending;
  const submitError = calculate.error?.message || null;

  const handleChange = (dimId: Dimension, key: string, value: string) => {
    setForm((prev) => ({ ...prev, [dimId]: { ...prev[dimId], [key]: value } }));
    setFieldErrors((prev) => ({
      ...prev,
      [dimId]: { ...(prev[dimId] ?? {}), [key]: "" },
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, Record<string, string>> = {};
    let valid = true;

    for (const dim of DIMENSIONS) {
      errs[dim.id] = {};
      for (const f of dim.fields) {
        const raw = form[dim.id][f.key];
        if (raw === "" || raw === undefined) {
          errs[dim.id][f.key] = "Obrigatório";
          valid = false;
          continue;
        }
        const n = Number(raw);
        if (isNaN(n) || n < 0 || n > 100) {
          errs[dim.id][f.key] = "Deve ser entre 0 e 100";
          valid = false;
        }
      }
    }

    setFieldErrors(errs);
    return valid;
  };

  const buildInput = () => {
    const values = emptyHubValues();
    for (const dim of DIMENSIONS) {
      for (const f of dim.fields) {
        values[dim.id][f.key] = Number(form[dim.id][f.key]);
      }
    }
    return toHubInput(values);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    calculate.mutate(buildInput(), {
      onSuccess: (output) => {
        storeHubResult({ output, conversationId: null });
        router.push("/hub/result");
      },
    });
  };

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ background: "var(--canvas)" }}
    >
      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Text variant="title">Análise Organizacional</Text>
            <Text variant="body-sm" color="secondary" className="mt-1">
              Insira os indicadores de cada dimensão. Todos os valores devem
              estar entre 0 e 100.
            </Text>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {DIMENSIONS.map((dim) => (
              <DimensionSection
                key={dim.id}
                dim={dim}
                values={form[dim.id]}
                errors={fieldErrors[dim.id] ?? {}}
                onChange={(key, value) => handleChange(dim.id, key, value)}
              />
            ))}

            {submitError && (
              <p
                className="text-sm text-center"
                style={{ color: "var(--semantic-error)" }}
              >
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-[var(--radius-sm)] font-medium text-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: submitting ? "var(--azure-hover)" : "var(--navy)",
                color: "var(--ink-inverse)",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!submitting)
                  e.currentTarget.style.background = "var(--azure)";
              }}
              onMouseLeave={(e) => {
                if (!submitting)
                  e.currentTarget.style.background = "var(--navy)";
              }}
            >
              {submitting ? "Calculando..." : "Calcular Score"}
            </button>
          </form>

          <div className="mt-6 pb-8">
            <Text variant="caption" color="muted" className="text-center">
              Motor de Decisão Multidimensional · VELTA AI 5.0
            </Text>
          </div>
        </div>
      </main>
    </div>
  );
}
