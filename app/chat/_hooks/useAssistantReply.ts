import { useCallback, useState } from "react";
import { streamChat } from "@/lib/api-client";
import type { ChatMessage } from "@/lib/types";

interface StreamOptions {
  /** Prefix of the generated assistant message id. */
  idPrefix: string;
  /** Show failures as an assistant message instead of only logging them. */
  showError: boolean;
}

/**
 * Streams assistant replies. While streaming, `streamingMessage` holds the
 * partial reply; when finished it is handed to `onMessage`.
 */
export function useAssistantReply(onMessage: (msg: ChatMessage) => void) {
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(
    null,
  );

  /** Resolves with whether the reply completed successfully. */
  const streamReply = useCallback(
    async (
      conversationId: string,
      content: string,
      { idPrefix, showError }: StreamOptions,
    ): Promise<boolean> => {
      const assistantMsg: ChatMessage = {
        id: `${idPrefix}-${Date.now()}`,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };
      setStreamingMessage(assistantMsg);

      try {
        const reply = await streamChat(conversationId, content, (text) =>
          setStreamingMessage((prev) => (prev ? { ...prev, content: text } : prev)),
        );
        onMessage({ ...assistantMsg, content: reply });
        return true;
      } catch (err) {
        if (showError) {
          const errMsg = err instanceof Error ? err.message : "Erro desconhecido";
          onMessage({
            ...assistantMsg,
            content: `⚠ Erro ao conectar com o assistente: ${errMsg}`,
          });
        } else {
          console.error("[assistant]", err);
        }
        return false;
      } finally {
        setStreamingMessage(null);
      }
    },
    [onMessage],
  );

  return {
    streamingMessage,
    isStreaming: streamingMessage !== null,
    streamReply,
  };
}
