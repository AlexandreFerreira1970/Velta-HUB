"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Drawer, Text } from "@/components/ui";
import Image from "next/image";

// ─── Icons ──────────────────────────────────────────────────────────────────

const LogoutIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M5 2H2.5A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H5M9 4l3 3-3 3M12 7H5"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MenuIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M2 5h14M2 9h14M2 13h14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// ─── Nav definition ─────────────────────────────────────────────────────────

const NAV_ITEMS: Array<{ href: string; label: string; match: RegExp }> = [
  { href: "/chat", label: "Assistente", match: /^\/chat/ },
  { href: "/hub/history", label: "Histórico", match: /^\/hub\/history/ },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <span
      aria-hidden="true"
      style={{ color: "var(--steel)", fontSize: 16, userSelect: "none" }}
    >
      |
    </span>
  );
}

function NavLabel({
  label,
  active,
  href,
  onClick,
}: {
  label: string;
  active: boolean;
  href: string;
  onClick?: () => void;
}) {
  if (active) {
    return (
      <Text variant="body-sm" color="secondary">
        {label}
      </Text>
    );
  }
  return (
    <Link href={href} onClick={onClick} style={{ textDecoration: "none" }}>
      <Text variant="body-sm" color="tertiary">
        {label}
      </Text>
    </Link>
  );
}

// ─── Chat sidebar toggle event ──────────────────────────────────────────────

const CHAT_SIDEBAR_EVENT = "velta:toggle-chat-sidebar";

function fireToggleChatSidebar() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHAT_SIDEBAR_EVENT));
}

// Exported for /chat/page.tsx to subscribe
export const VELTA_CHAT_SIDEBAR_EVENT = CHAT_SIDEBAR_EVENT;

// ─── Header ─────────────────────────────────────────────────────────────────

export function Header() {
  const pathname = usePathname() ?? "";
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const isChatRoute = pathname === "/chat" || pathname.startsWith("/chat/");

  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 h-16 shrink-0 border-b"
      style={{
        background: "var(--surface-0)",
        borderColor: "var(--steel-soft)",
      }}
    >
      {/* LEFT */}
      <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
        {isChatRoute && (
          <button
            onClick={fireToggleChatSidebar}
            aria-label="Abrir conversas"
            className="md:hidden flex items-center justify-center w-9 h-9 -ml-1 rounded-[var(--radius-sm)] transition-colors duration-150"
            style={{ color: "var(--ink-secondary)", cursor: "pointer" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <MenuIcon />
          </button>
        )}

        <Link
          href="/chat"
          className="flex items-center gap-2 md:gap-2.5 shrink-0"
          style={{ textDecoration: "none" }}
        >
          <Image
            src="/velta-logo.webp"
            alt="Logo"
            width={52}
            height={52}
            unoptimized
            className="rounded-full"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2.5 ml-1">
          {NAV_ITEMS.map((item, idx) => (
            <div key={item.href} className="flex items-center gap-2.5">
              <Divider />
              <NavLabel
                label={item.label}
                href={item.href}
                active={item.match.test(pathname)}
              />
              {/* no trailing divider */}
              {idx === -1 && null}
            </div>
          ))}
        </nav>
      </div>

      {/* RIGHT — desktop */}
      <div className="hidden md:flex items-center gap-4">
        {session?.user?.name && (
          <Text variant="body-sm" color="secondary">
            {session.user.name}
          </Text>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 px-3 h-7 rounded-[var(--radius-sm)] border transition-colors duration-150"
          style={{
            borderColor: "var(--steel)",
            color: "var(--ink-secondary)",
            background: "transparent",
            fontSize: 12,
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

      {/* RIGHT — mobile hamburger */}
      <button
        onClick={() => setMenuOpen(true)}
        aria-label="Abrir menu"
        className="md:hidden flex items-center justify-center w-9 h-9 -mr-1 rounded-[var(--radius-sm)] transition-colors duration-150"
        style={{ color: "var(--ink-secondary)", cursor: "pointer" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--surface-2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <MenuIcon />
      </button>

      {/* Mobile drawer */}
      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        side="right"
        ariaLabel="Menu principal"
      >
        <div className="flex flex-col h-full">
          <nav className="flex flex-col">
            {NAV_ITEMS.map((item) => {
              const active = item.match.test(pathname);
              const baseStyle: React.CSSProperties = {
                textDecoration: "none",
                padding: "14px 20px",
                borderBottom: "1px solid var(--steel-soft)",
                color: active ? "var(--ink-primary)" : "var(--ink-secondary)",
                fontWeight: active ? 600 : 400,
                background: active ? "var(--surface-2)" : "transparent",
              };
              if (active) {
                return (
                  <div key={item.href} style={baseStyle}>
                    {item.label}
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  style={baseStyle}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto">
            {session?.user?.name && (
              <div
                className="px-5 py-3 border-t"
                style={{ borderColor: "var(--steel-soft)" }}
              >
                <Text variant="caption" color="muted">
                  Logado como
                </Text>
                <Text variant="body-sm" color="primary">
                  {session.user.name}
                </Text>
              </div>
            )}
            <button
              onClick={() => {
                setMenuOpen(false);
                signOut({ callbackUrl: "/login" });
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
    </header>
  );
}
