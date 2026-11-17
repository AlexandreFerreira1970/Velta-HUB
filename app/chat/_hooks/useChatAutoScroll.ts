import { useCallback, useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";

/**
 * Jumps to the bottom when a conversation's messages first load, and keeps
 * following new messages while the user is answering questions.
 */
export function useChatAutoScroll(messages: ChatMessage[], followNew: boolean) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasScrolledToBottomRef = useRef(false);

  useEffect(() => {
    const bottom = bottomRef.current;
    if (!bottom) return;

    if (!hasScrolledToBottomRef.current) {
      if (messages.length === 0) return;
      hasScrolledToBottomRef.current = true;
      bottom.scrollIntoView();
    } else if (followNew) {
      bottom.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, followNew]);

  /** Jump to the bottom again once the next messages load. */
  const resetScroll = useCallback(() => {
    hasScrolledToBottomRef.current = false;
  }, []);

  /** Smooth-scrolls to the bottom after the next render settles. */
  const scrollToBottomSoon = useCallback(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 250);
  }, []);

  return { bottomRef, resetScroll, scrollToBottomSoon };
}
