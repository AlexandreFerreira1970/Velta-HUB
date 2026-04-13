"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  widthClass?: string;
  ariaLabel?: string;
  children: ReactNode;
}

const CloseIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M3 3l10 10M13 3L3 13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export function Drawer({
  open,
  onClose,
  side = "left",
  widthClass = "w-72",
  ariaLabel,
  children,
}: DrawerProps) {
  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  const sideClass = side === "left" ? "left-0" : "right-0";
  const hiddenTransform =
    side === "left" ? "-translate-x-full" : "translate-x-full";

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      aria-hidden={!open}
      style={{ pointerEvents: open ? "auto" : "none" }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: "rgba(12, 26, 46, 0.55)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
        }}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`absolute inset-y-0 ${sideClass} ${widthClass} max-w-[85vw] flex flex-col shadow-xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : hiddenTransform
        }`}
        style={{
          background: "var(--surface-0)",
          borderLeft:
            side === "right" ? "1px solid var(--steel-soft)" : undefined,
          borderRight:
            side === "left" ? "1px solid var(--steel-soft)" : undefined,
        }}
      >
        <div
          className="flex items-center justify-end h-12 px-3 shrink-0 border-b"
          style={{ borderColor: "var(--steel-soft)" }}
        >
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] transition-colors duration-150"
            style={{ color: "var(--ink-secondary)", cursor: "pointer" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
