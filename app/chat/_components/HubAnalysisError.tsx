import { AgentAvatar } from "./AgentAvatar";

export function HubAnalysisError() {
  return (
    <div className="flex items-start gap-2">
      <AgentAvatar />
      <div
        className="px-4 py-3 text-sm leading-relaxed"
        style={{
          background: "var(--surface-0)",
          color: "var(--ink-primary)",
          border: "1px solid var(--steel-soft)",
          borderRadius: "2px 12px 12px 12px",
        }}
      >
        <span style={{ color: "var(--error, #e53e3e)" }}>
          Não foi possível gerar a análise. Tente novamente mais tarde.
        </span>
      </div>
    </div>
  );
}
