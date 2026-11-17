import { Text } from "@/components/ui";
import type { ChatMessage } from "@/lib/types";
import { AgentAvatar } from "./AgentAvatar";
import { AssistantMarkdown } from "./AssistantMarkdown";
import { TypingIndicator } from "./TypingIndicator";
import { UserAvatar } from "./UserAvatar";

const USER_BUBBLE_STYLE: React.CSSProperties = {
  background: "var(--navy)",
  color: "var(--ink-inverse)",
  borderRadius: "12px 12px 2px 12px",
};

const ASSISTANT_BUBBLE_STYLE: React.CSSProperties = {
  background: "var(--surface-0)",
  color: "var(--ink-primary)",
  border: "1px solid var(--steel-soft)",
  borderRadius: "2px 12px 12px 12px",
};

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  userImage?: string | null;
  userName?: string | null;
}

export function MessageBubble({
  message,
  isStreaming,
  userImage,
  userName,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-end gap-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && <AgentAvatar />}
      <div className="max-w-full md:max-w-[72%] space-y-1">
        <div
          className="px-4 py-3 text-sm leading-relaxed flex flex-col gap-4"
          style={isUser ? USER_BUBBLE_STYLE : ASSISTANT_BUBBLE_STYLE}
        >
          {isUser ? (
            message.content
          ) : (
            <AssistantMarkdown>{message.content}</AssistantMarkdown>
          )}
          {isStreaming && !!message.content && (
            <span
              className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
              style={{ background: "var(--azure)" }}
            />
          )}
          {isStreaming && !message.content && <TypingIndicator />}
        </div>
        <Text
          variant="caption"
          color="muted"
          className={`px-1 ${isUser ? "text-right" : "text-left"}`}
        >
          {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </div>
      {isUser && <UserAvatar image={userImage} name={userName} />}
    </div>
  );
}
