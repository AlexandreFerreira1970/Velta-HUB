"use client";

interface IconButtonProps {
  onClick: () => void;
  ariaLabel: string;
  className: string;
  children: React.ReactNode;
}

/** Square ghost button used for the header hamburgers. */
export function IconButton({
  onClick,
  ariaLabel,
  className,
  children,
}: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${className} flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] transition-colors duration-150`}
      style={{ color: "var(--ink-secondary)", cursor: "pointer" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--surface-2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}
