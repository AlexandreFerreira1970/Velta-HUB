"use client";

import Link from "next/link";
import { Drawer, Text } from "@/components/ui";
import { LogoutIcon } from "@/components/icons";
import { NAV_ITEMS } from "./navItems";

interface MobileNavMenuProps {
  open: boolean;
  onClose: () => void;
  pathname: string;
  userName?: string | null;
  onSignOut: () => void;
}

export function MobileNavMenu({
  open,
  onClose,
  pathname,
  userName,
  onSignOut,
}: MobileNavMenuProps) {
  return (
    <Drawer open={open} onClose={onClose} side="right" ariaLabel="Menu principal">
      <div className="flex flex-col h-full">
        <nav className="flex flex-col">
          {NAV_ITEMS.map((item) => {
            const active = item.match.test(pathname);
            const style: React.CSSProperties = {
              textDecoration: "none",
              padding: "14px 20px",
              borderBottom: "1px solid var(--steel-soft)",
              color: active ? "var(--ink-primary)" : "var(--ink-secondary)",
              fontWeight: active ? 600 : 400,
              background: active ? "var(--surface-2)" : "transparent",
            };
            return active ? (
              <div key={item.href} style={style}>
                {item.label}
              </div>
            ) : (
              <Link key={item.href} href={item.href} onClick={onClose} style={style}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          {userName && (
            <div
              className="px-5 py-3 border-t"
              style={{ borderColor: "var(--steel-soft)" }}
            >
              <Text variant="caption" color="muted">
                Logado como
              </Text>
              <Text variant="body-sm" color="primary">
                {userName}
              </Text>
            </div>
          )}
          <button
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="w-full flex items-center justify-center gap-2 py-4 border-t transition-colors duration-150"
            style={{
              borderColor: "var(--steel-soft)",
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
            <LogoutIcon />
            Sair
          </button>
        </div>
      </div>
    </Drawer>
  );
}
