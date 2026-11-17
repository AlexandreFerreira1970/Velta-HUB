"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Text } from "@/components/ui";
import { LogoutIcon, MenuIcon } from "@/components/icons";
import { toggleChatSidebar } from "@/lib/chat-sidebar-event";
import { IconButton } from "./header/IconButton";
import { MobileNavMenu } from "./header/MobileNavMenu";
import { NavDivider } from "./header/NavDivider";
import { NavLabel } from "./header/NavLabel";
import { NAV_ITEMS } from "./header/navItems";

const signOutToLogin = () => signOut({ callbackUrl: "/login" });

export function Header() {
  const pathname = usePathname() ?? "";
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const isChatRoute = pathname === "/chat" || pathname.startsWith("/chat/");
  const userName = session?.user?.name;

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
          <IconButton
            onClick={toggleChatSidebar}
            ariaLabel="Abrir conversas"
            className="md:hidden -ml-1"
          >
            <MenuIcon />
          </IconButton>
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
          {NAV_ITEMS.map((item) => (
            <div key={item.href} className="flex items-center gap-2.5">
              <NavDivider />
              <NavLabel
                label={item.label}
                href={item.href}
                active={item.match.test(pathname)}
              />
            </div>
          ))}
        </nav>
      </div>

      {/* RIGHT — desktop */}
      <div className="hidden md:flex items-center gap-4">
        {userName && (
          <Text variant="body-sm" color="secondary">
            {userName}
          </Text>
        )}
        <button
          onClick={signOutToLogin}
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
      <IconButton
        onClick={() => setMenuOpen(true)}
        ariaLabel="Abrir menu"
        className="md:hidden -mr-1"
      >
        <MenuIcon />
      </IconButton>

      <MobileNavMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        pathname={pathname}
        userName={userName}
        onSignOut={signOutToLogin}
      />
    </header>
  );
}
