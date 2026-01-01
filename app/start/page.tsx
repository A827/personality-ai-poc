// app/page.tsx
"use client";

import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    // "/" is just a redirect gate in this POC
    window.location.href = "/start";
  }, []);

  return (
    <div className="ds-card ds-card-pad">
      <div className="ds-subtitle">Redirecting…</div>
    </div>
  );
}