"use client";

import { Text } from "@/components/ui";
import type { ConversationSummary } from "@/lib/types";

const BADGE_BASE: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 0.2,
};

const IN_PROGRESS_BADGE: React.CSSProperties = {
  ...BADGE_BASE,
  background: "rgba(217, 119, 6, 0.12)",
  color: "#b45309",
};

const DONE_BADGE: React.CSSProperties = {
  ...BADGE_BASE,
  background: "rgba(22, 163, 74, 0.12)",
  color: "#15803d",
};

interface ConversationListItemProps {
  conversation: ConversationSummary;
  fallbackTitle: string;
  active: boolean;
  onSelect: () => void;
}

export function ConversationListItem({
  conversation,
  fallbackTitle,
  active,
  onSelect,
}: ConversationListItemProps) {
  const inProgress = conversation.hubQuestionIndex !== null;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-4 py-3 border-b transition-colors duration-100"
      style={{
        borderColor: "var(--steel-soft)",
        background: active ? "var(--surface-2)" : "transparent",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "var(--surface-1)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <Text
        variant="body-sm"
        color={active ? "primary" : "secondary"}
        style={{ fontWeight: active ? 600 : 400 }}
      >
        {conversation.title || fallbackTitle}
      </Text>
      <div className="flex items-center gap-2 mt-0.5">
        <Text variant="caption" color="muted">
          {new Date(conversation.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          })}
        </Text>
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded-full"
          style={inProgress ? IN_PROGRESS_BADGE : DONE_BADGE}
        >
          {inProgress ? "Em progresso" : "Concluída"}
        </span>
      </div>
    </button>
  );
}
