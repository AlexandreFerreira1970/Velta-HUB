"use client";

import { PlusIcon } from "@/components/icons";
import type { ConversationSummary } from "@/lib/types";
import { ConversationListItem } from "./ConversationListItem";

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
      <div className="p-3 border-b" style={{ borderColor: "var(--steel-soft)" }}>
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
          <PlusIcon />
          Nova análise
        </button>
      </div>

      {/* Conversation list — newest first */}
      <div className="flex-1 overflow-y-auto">
        {conversations.toReversed().map((conv, idx) => (
          <ConversationListItem
            key={conv.id}
            conversation={conv}
            fallbackTitle={`Análise ${idx + 1}`}
            active={conv.id === activeConversationId}
            onSelect={() => onSelect(conv.id)}
          />
        ))}
      </div>
    </div>
  );
}
