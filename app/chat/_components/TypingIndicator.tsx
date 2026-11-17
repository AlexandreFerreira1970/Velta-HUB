/** Bouncing dots shown while waiting for the first streamed token. */
export function TypingIndicator() {
  return (
    <span className="inline-flex items-center gap-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-1.5 h-1.5 rounded-full animate-bounce"
          style={{
            background: "var(--steel)",
            animationDelay: `${i * 150}ms`,
            animationDuration: "900ms",
          }}
        />
      ))}
    </span>
  );
}
