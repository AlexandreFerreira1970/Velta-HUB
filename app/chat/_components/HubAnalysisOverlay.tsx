"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** The overlay stays in the "processing" state for at least this long. */
const MIN_DISPLAY_MS = 10_000;

const TITLE_STYLE: React.CSSProperties = {
  color: "#f8fafc",
  fontSize: 30,
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: "-0.02em",
  marginBottom: 12,
};

const DESCRIPTION_STYLE: React.CSSProperties = {
  color: "rgba(226, 232, 240, 0.85)",
  fontSize: 15,
  lineHeight: 1.6,
  maxWidth: 480,
};

interface HubAnalysisOverlayProps {
  status: "loading" | "done";
}

/**
 * Full-screen overlay shown while the hub analysis runs. Once the analysis is
 * done (and the minimum display time has passed) any key or click opens the
 * result page.
 */
export function HubAnalysisOverlay({ status }: HubAnalysisOverlayProps) {
  const router = useRouter();
  const [minDelayPassed, setMinDelayPassed] = useState(false);

  // Timer starts on mount and survives the loading → done transition.
  useEffect(() => {
    const timer = setTimeout(() => setMinDelayPassed(true), MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const ready = status === "done" && minDelayPassed;

  useEffect(() => {
    if (!ready) return;
    const goToResult = () => router.push("/hub/result");
    window.addEventListener("keydown", goToResult);
    window.addEventListener("click", goToResult);
    return () => {
      window.removeEventListener("keydown", goToResult);
      window.removeEventListener("click", goToResult);
    };
  }, [ready, router]);

  return (
    <div
      className="hub-overlay fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(circle at 50% 40%, rgba(29, 78, 216, 0.18), rgba(12, 26, 46, 0.92) 70%)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      aria-live="polite"
      aria-busy={status === "loading"}
    >
      <div className="hub-overlay-content flex flex-col items-center text-center max-w-xl">
        <div className="relative mb-8 flex items-center justify-center">
          <video
            src="/velta-video.webm"
            className="object-cover"
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "20px",
              boxShadow: "0 2px 12px 5px rgba(0, 0, 0, 0.1)",
            }}
          />
        </div>

        {ready ? (
          <>
            <h2
              style={{
                ...TITLE_STYLE,
                animation:
                  "hub-overlay-content-in 480ms cubic-bezier(0.22, 1, 0.36, 1) both",
              }}
            >
              Sua análise está pronta
            </h2>
            <p style={{ ...DESCRIPTION_STYLE, marginBottom: 28 }}>
              Preparamos um panorama completo das cinco dimensões do seu
              negócio, com recomendações priorizadas.
            </p>
            <div
              className="hub-ready-pulse inline-flex items-center gap-3 px-5 py-3 rounded-full"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(147, 197, 253, 0.45)",
                color: "#f8fafc",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.04em",
              }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  background: "#4ade80",
                  boxShadow: "0 0 12px rgba(74, 222, 128, 0.9)",
                }}
              />
              Pressione qualquer tecla para continuar
            </div>
          </>
        ) : (
          <>
            <h2
              className="hub-shimmer-text"
              style={{
                ...TITLE_STYLE,
                background:
                  "linear-gradient(90deg, #dbeafe, #ffffff, #93c5fd, #ffffff, #dbeafe)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation:
                  "hub-shimmer 2200ms ease-in-out infinite, hub-overlay-content-in 560ms cubic-bezier(0.22, 1, 0.36, 1) both",
              }}
            >
              Tecendo sua análise estratégica
            </h2>
            <p style={{ ...DESCRIPTION_STYLE, marginBottom: 24 }}>
              Estamos cruzando dados, ponderando dimensões e desenhando
              recomendações sob medida para o seu negócio. Isso levará apenas
              alguns instantes.
            </p>
            <div
              className="flex items-center gap-2"
              style={{ color: "rgba(191, 219, 254, 0.9)" }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block w-2 h-2 rounded-full animate-bounce"
                  style={{
                    background: "rgba(147, 197, 253, 0.9)",
                    animationDelay: `${i * 180}ms`,
                    animationDuration: "1100ms",
                  }}
                />
              ))}
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 12,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "rgba(191, 219, 254, 0.75)",
                }}
              >
                {status === "done" ? "Finalizando" : "Processando"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
