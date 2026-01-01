// app/components/StartGuard.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const PERSONA_KEY = "poc_persona_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function StartGuard() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    // Allow start page always
    if (pathname === "/start") return;

    const acc = safeParse<any>(localStorage.getItem(PERSONA_KEY), null);
    const name = String(acc?.displayName || "").trim();

    if (!name) {
      window.location.href = "/start";
    }
  }, [pathname]);

  return null;
}