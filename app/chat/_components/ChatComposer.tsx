"use client";

import { useEffect, useRef, useState } from "react";
import { Text } from "@/components/ui";
import { SendIcon, SpinnerIcon } from "@/components/icons";

const MAX_TEXTAREA_HEIGHT = 160;

interface ChatComposerProps {
  /** Hub questionnaire in progress: free text is replaced by a hint. */
  hubMode: boolean;
  /** Answering onboarding questions (changes the placeholder). */
  onboarding: boolean;
  /** Waiting for the assistant: shows a spinner. */
  loading: boolean;
  disabled: boolean;
  onSend: (content: string) => void;
}

export function ChatComposer({
  hubMode,
  onboarding,
  loading,
  disabled,
  onSend,
}: ChatComposerProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea after AI response
  useEffect(() => {
    if (!loading) textareaRef.current?.focus();
  }, [loading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [input]);

  const canSend = !!input.trim() && !disabled;

  const send = () => {
    const content = input.trim();
    if (!content || disabled) return;
    setInput("");
    onSend(content);
  };

  return (
    <footer
      className="shrink-0 border-t px-4 py-3"
      style={{
        background: "var(--surface-0)",
        borderColor: "var(--steel-soft)",
      }}
    >
      {hubMode ? (
        <div className="text-center">
          <Text variant="body-sm" color="muted">
            Para garantir a precisão da análise, responda utilizando as opções
            disponíveis ou informe um valor numérico válido.
          </Text>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={
              onboarding
                ? "Digite sua resposta..."
                : "Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
            }
            rows={1}
            disabled={disabled}
            className="flex-1 resize-none px-3 py-2.5 text-sm rounded-[var(--radius-sm)] border outline-none transition-colors duration-150 disabled:opacity-50"
            style={{
              background: "var(--control-bg)",
              borderColor: "var(--control-border)",
              color: "var(--ink-primary)",
              lineHeight: "1.5",
              maxHeight: MAX_TEXTAREA_HEIGHT,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--control-border-focus)";
              e.currentTarget.style.borderLeftWidth = "2px";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--control-border)";
              e.currentTarget.style.borderLeftWidth = "1px";
            }}
          />
          <button
            onClick={send}
            disabled={!canSend}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: loading ? "var(--azure-hover)" : "var(--navy)",
              color: "var(--ink-inverse)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              if (!loading && input.trim())
                e.currentTarget.style.background = "var(--azure)";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = "var(--navy)";
            }}
          >
            {loading ? <SpinnerIcon /> : <SendIcon />}
          </button>
        </div>
      )}
    </footer>
  );
}
