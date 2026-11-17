// Lets the shared Header toggle the chat page's mobile conversations drawer.

export const CHAT_SIDEBAR_EVENT = "velta:toggle-chat-sidebar";

export function toggleChatSidebar(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHAT_SIDEBAR_EVENT));
}
