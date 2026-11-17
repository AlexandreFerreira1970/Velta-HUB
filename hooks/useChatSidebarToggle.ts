import { useEffect, useState } from "react";
import { CHAT_SIDEBAR_EVENT } from "@/lib/chat-sidebar-event";

/** Mobile conversations drawer state, toggled by the hamburger in the Header. */
export function useChatSidebarToggle() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const toggle = () => setOpen((v) => !v);
    window.addEventListener(CHAT_SIDEBAR_EVENT, toggle);
    return () => window.removeEventListener(CHAT_SIDEBAR_EVENT, toggle);
  }, []);

  return [open, setOpen] as const;
}
