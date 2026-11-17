import { Text } from "@/components/ui";

export function EmptyChatState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3 px-8 text-center">
        <div
          className="w-12 h-12 rounded-[var(--radius-sm)] flex items-center justify-center"
          style={{ background: "var(--navy)" }}
        >
          <span
            style={{
              color: "var(--ink-inverse)",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              fontFamily: "var(--font-geist-sans)",
            }}
          >
            V
          </span>
        </div>
        <Text variant="subheading">Assistente Velta</Text>
        <Text variant="body-sm" color="secondary" className="max-w-xs">
          Envie uma mensagem para começar.
        </Text>
      </div>
    </div>
  );
}
