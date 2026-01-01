// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type MyAccount = {
  displayName: string;
  bio?: string;
};

type AnswerMap = Record<string, any>;
type Connection = { id: string; name: string; role: string; inviteCode: string; createdAt: number };

const PERSONA_KEY = "poc_persona_v1";
const ANSWERS_KEY = "poc_personality_answers_v1";
const CONNECTIONS_KEY = "poc_connections_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function countFilledAnswers(answers: AnswerMap) {
  return Object.values(answers || {}).filter((v) => String(v ?? "").trim().length > 0).length;
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgb(var(--border))",
        background: ok ? "rgba(0,0,0,0.06)" : "rgba(255,0,0,0.06)",
        color: "rgb(var(--text))",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        whiteSpace: "nowrap",
      }}
    >
      <span>{ok ? "✅" : "⚠️"}</span>
      <span>{label}</span>
    </span>
  );
}

export default function HomePage() {
  const [loaded, setLoaded] = useState(false);

  const [account, setAccount] = useState<MyAccount | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    const acc = safeParse<MyAccount | null>(localStorage.getItem(PERSONA_KEY), null);
    const ans = safeParse<AnswerMap>(localStorage.getItem(ANSWERS_KEY), {});
    const con = safeParse<Connection[]>(localStorage.getItem(CONNECTIONS_KEY), []);

    setAccount(acc);
    setAnswers(ans);
    setConnections(con);
    setLoaded(true);
  }, []);

  const hasAccount = useMemo(() => !!(account?.displayName || "").trim(), [account]);
  const filledAnswers = useMemo(() => countFilledAnswers(answers), [answers]);
  const hasInterview = useMemo(() => filledAnswers >= 3, [filledAnswers]); // minimum gate
  const hasConnections = useMemo(() => (connections?.length || 0) > 0, [connections]);

  const nextStep = useMemo(() => {
    if (!hasAccount) return { href: "/persona", label: "Set up Account" };
    if (!hasInterview) return { href: "/interview", label: "Start Interview" };
    return { href: "/ask", label: "Ask (Now ready)" };
  }, [hasAccount, hasInterview]);

  function go(href: string) {
    window.location.href = href;
  }

  const name = (account?.displayName || "").trim();

  return (
    <main className="ds-page">
      <div className="ds-shell">
        {/* Top Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>Personality AI</div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href="/persona" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Account
            </a>
            <a href="/interview" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Interview
            </a>
            <a
              href={hasAccount && hasInterview ? "/ask" : "/interview"}
              style={{ fontSize: 13, color: "rgb(var(--muted))" }}
              title={!hasInterview ? "Complete a few interview answers first" : ""}
            >
              Ask
            </a>
            <a href="/profile" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Profile
            </a>
            <a href="/connections" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Connections
            </a>
          </div>
        </div>

        {/* Hero */}
        <div className="ds-card ds-card-pad" style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <h1 className="ds-h1" style={{ marginBottom: 8 }}>
              A digital version of you — built by you.
            </h1>

            <p className="ds-subtitle" style={{ marginBottom: 0 }}>
              Each person builds their own profile. Then you connect people using invite codes.
            </p>
          </div>

          {/* Status row */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <StatusPill ok={loaded ? hasAccount : false} label={hasAccount ? `Account: ${name}` : "Account: Missing"} />
            <StatusPill
              ok={loaded ? hasInterview : false}
              label={hasInterview ? `Interview: ${filledAnswers} answers` : `Interview: ${filledAnswers}/3 minimum`}
            />
            <StatusPill ok={loaded ? hasConnections : false} label={hasConnections ? `Connections: ${connections.length}` : "Connections: None"} />
          </div>

          {/* Primary CTA */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button className="ds-btn ds-btn-primary" onClick={() => go(nextStep.href)} disabled={!loaded}>
              {loaded ? `Continue → ${nextStep.label}` : "Loading…"}
            </button>

            {hasAccount && hasInterview ? (
              <span className="ds-subtitle" style={{ fontSize: 12 }}>
                ✅ Ready to use Ask.
              </span>
            ) : (
              <span className="ds-subtitle" style={{ fontSize: 12 }}>
                Finish the steps above to unlock the full experience.
              </span>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="ds-btn" style={{ flex: "1 1 160px" }} onClick={() => go("/persona")} disabled={!loaded}>
              Account
            </button>

            <button className="ds-btn" style={{ flex: "1 1 160px" }} onClick={() => go("/interview")} disabled={!loaded || !hasAccount} title={!hasAccount ? "Set up account first" : ""}>
              Interview
            </button>

            <button
              className="ds-btn"
              style={{ flex: "1 1 160px" }}
              onClick={() => go("/ask")}
              disabled={!loaded || !hasAccount || !hasInterview}
              title={!hasInterview ? "Answer at least 3 interview questions first" : ""}
            >
              Ask
            </button>

            <button className="ds-btn" style={{ flex: "1 1 160px" }} onClick={() => go("/profile")} disabled={!loaded}>
              Profile
            </button>

            <button className="ds-btn" style={{ flex: "1 1 160px" }} onClick={() => go("/connections")} disabled={!loaded}>
              Connections
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="ds-subtitle" style={{ fontSize: 12, textAlign: "center" }}>
          This is an AI representation and may be inaccurate.
        </div>
      </div>
    </main>
  );
}