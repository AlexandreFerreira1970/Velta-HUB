"use client";

import { Text } from "@/components/ui";
import type { ConversationSummary } from "@/lib/conversations";

interface ConversationsSidebarProps {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
}

export function ConversationsSidebar({
  conversations,
  activeConversationId,
  onNew,
  onSelect,
}: ConversationsSidebarProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* New conversation button */}
      <div
        className="p-3 border-b"
        style={{ borderColor: "var(--steel-soft)" }}
      >
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] border transition-colors duration-150"
          style={{
            borderColor: "var(--steel)",
            color: "var(--ink-secondary)",
            background: "transparent",
            fontSize: 13,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--surface-2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M8 1v14M1 8h14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Nova análise
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.toReversed().map((conv, idx) => {
          const isActive = conv.id === activeConversationId;
          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className="w-full text-left px-4 py-3 border-b transition-colors duration-100"
              style={{
                borderColor: "var(--steel-soft)",
                background: isActive ? "var(--surface-2)" : "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  e.currentTarget.style.background = "var(--surface-1)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <Text
                variant="body-sm"
                color={isActive ? "primary" : "secondary"}
                style={{ fontWeight: isActive ? 600 : 400 }}
              >
                {conv.title || `Análise ${idx + 1}`}
              </Text>
              <Text variant="caption" color="muted" className="mt-0.5">
                {new Date(conv.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </Text>
            </button>
          );
        })}
      </div>
    </div>
  );
}
