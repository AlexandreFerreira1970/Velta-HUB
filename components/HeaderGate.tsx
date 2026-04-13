"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";

const HIDDEN_PATHS = new Set(["/", "/login"]);

export function HeaderGate() {
  const pathname = usePathname() ?? "";
  if (HIDDEN_PATHS.has(pathname)) return null;
  return <Header />;
}
