// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type AnswerMap = Record<string, string>;

type MyAccount = {
  displayName: string;
  bio?: string;
};

type Connection = {
  id: string;
  name: string;
  role: string;
  inviteCode: string;
  createdAt: number;
};

const STORAGE_KEY = "poc_personality_answers_v1";
const PERSONA_KEY = "poc_persona_v1";
const CONNECTIONS_KEY = "poc_connections_v1";

const RECENT_CHATS_KEY = "poc_recent_chats_v1";
const ASK_DRAFT_KEY = "poc_ask_draft_v1";

type RecentChatItem = {
  id: string;
  createdAt: number;
  question: string;
  answer: string;
  usedPersona: string;
  usedProfile: string;
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function buildProfileSummary(answers: AnswerMap) {
  const get = (id: string) => (answers[id] || "").trim();
  const pick = (...ids: string[]) => {
    for (const id of ids) {
      const v = get(id);
      if (v) return v;
    }
    return "";
  };

  const identityWords = pick("identity_words", "identity_1");
  const pride = pick("identity_pride");
  const valuesTop3 = pick("values_top3", "values_1");
  const decisionStyle = pick("decisions_style", "decisions_1");
  const calm = pick("emotions_calm", "emotions_1");
  const loveLanguage = pick("relationships_love_language", "relationships_1");

  const lines = [
    identityWords && `Identity words: ${identityWords}`,
    pride && `Most proud of: ${pride}`,
    valuesTop3 && `Top values: ${valuesTop3}`,
    decisionStyle && `Decision style: ${decisionStyle}`,
    calm && `Calms down by: ${calm}`,
    loveLanguage && `Shows love via: ${loveLanguage}`,
  ].filter(Boolean) as string[];

  const filled = Object.values(answers || {}).filter(
    (v) => String(v ?? "").trim().length > 0
  ).length;

  return { filled, summary: lines.join("\n") };
}

function buildPersonaObject(account: MyAccount | null) {
  const meName = (account?.displayName || "").trim() || "Me";
  return {
    name: meName,
    relationship: "Me" as const,
    tone: "Warm" as const,
    description: (account?.bio || "").trim(),
    speaker: `Me (${meName})`,
    target: `Me (${meName})`,
  };
}

function saveRecentChat(item: RecentChatItem) {
  try {
    const existing = safeParse<RecentChatItem[]>(
      localStorage.getItem(RECENT_CHATS_KEY),
      []
    );
    const next = [item, ...existing].slice(0, 5);
    localStorage.setItem(RECENT_CHATS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function uid() {
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function HomePage() {
  const [loaded, setLoaded] = useState(false);
  const [account, setAccount] = useState<MyAccount | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [connections, setConnections] = useState<Connection[]>([]);
  const [recentChats, setRecentChats] = useState<RecentChatItem[]>([]);

  // Demo state
  const [demoQ, setDemoQ] = useState("What should I focus on this week?");
  const [demoA, setDemoA] = useState<string>("");
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoErr, setDemoErr] = useState<string>("");

  useEffect(() => {
    setAccount(
      safeParse<MyAccount | null>(localStorage.getItem(PERSONA_KEY), null)
    );
    setAnswers(safeParse<AnswerMap>(localStorage.getItem(STORAGE_KEY), {}));
    setConnections(
      safeParse<Connection[]>(localStorage.getItem(CONNECTIONS_KEY), [])
    );
    setRecentChats(
      safeParse<RecentChatItem[]>(localStorage.getItem(RECENT_CHATS_KEY), [])
    );
    setLoaded(true);
  }, []);

  const profile = useMemo(() => buildProfileSummary(answers), [answers]);
  const filled = profile.filled;

  const nameOk = (account?.displayName || "").trim().length > 0;
  const interviewOk = filled >= 3;

  // ✅ Gate: if not ready, send to /start (but only after localStorage loads)
  useEffect(() => {
    if (!loaded) return;
    if (!nameOk || !interviewOk) {
      window.location.href = "/start";
    }
  }, [loaded, nameOk, interviewOk]);

  // ✅ Next step routing (uses /start, not /persona)
  const nextStep = !nameOk ? "start" : !interviewOk ? "interview" : "ask";

  const nextLabel =
    nextStep === "start"
      ? "Set up your account"
      : nextStep === "interview"
      ? "Do the interview (3+ answers)"
      : "Start asking questions";

  const nextDesc =
    nextStep === "start"
      ? "Create your local identity so the AI has a stable voice."
      : nextStep === "interview"
      ? "Answer a few questions so the AI learns your tone and decision style."
      : "You’re ready. Ask as yourself or ask about someone you added.";

  async function runDemo() {
    const q = demoQ.trim();
    if (!q) return;

    setDemoErr("");
    setDemoA("");
    setDemoLoading(true);

    try {
      // If not ready, do a local fallback instead of calling API
      if (!nameOk || !interviewOk) {
        const me = (account?.displayName || "").trim() || "You";
        const vibe =
          filled >= 8 ? "strong" : filled >= 3 ? "a decent start" : "still light";

        const local = [
          "Here’s a quick plan:",
          "1) Pick one weekly priority (measurable).",
          "2) Book two focused sessions and protect them.",
          "3) Do the hardest part early.",
          "",
          `(${me} profile strength: ${vibe}. Complete setup to enable real AI here.)`,
        ].join("\n");

        setDemoA(local);
        return;
      }

      const persona = buildPersonaObject(account);
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          profileSummary: profile.summary,
          persona,
          corrections: [],
        }),
      });

      const data = await res.json();
      const answer = data?.answer || data?.error || "No answer returned.";

      setDemoA(answer);

      saveRecentChat({
        id: uid(),
        createdAt: Date.now(),
        question: q,
        answer,
        usedPersona: `Speaker: ${persona.speaker}\nTarget: ${persona.target}`,
        usedProfile: profile.summary || "",
      });

      // refresh local list
      setRecentChats(
        safeParse<RecentChatItem[]>(localStorage.getItem(RECENT_CHATS_KEY), [])
      );
    } catch {
      setDemoErr(
        "Demo failed to call /api/ask. Check your provider key in Vercel environment variables."
      );
    } finally {
      setDemoLoading(false);
    }
  }

  function goAskWithDraft(q: string) {
    const draft = (q || "").trim();
    if (!draft) {
      window.location.href = "/ask";
      return;
    }
    try {
      localStorage.setItem(ASK_DRAFT_KEY, draft);
    } catch {
      // ignore
    }
    window.location.href = "/ask";
  }

  function statusLabel(ok: boolean, okText: string, badText: string) {
    return ok ? okText : badText;
  }

  // While we redirect to /start for incomplete setup, show a minimal loading state
  // so users don't see a "flash" of the dashboard.
  if (!loaded || !nameOk || !interviewOk) {
    return (
      <div className="ds-card ds-card-pad">
        <div className="ds-subtitle">Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Page header */}
      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 className="ds-h1" style={{ margin: 0 }}>
          Personality AI
        </h1>
        <p className="ds-subtitle" style={{ margin: 0 }}>
          A digital version of you — built by you.
        </p>
      </header>

      {/* Main grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 14,
          alignItems: "start",
        }}
      >
        {/* Left: Core */}
        <div className="ds-card ds-card-pad" style={{ textAlign: "left" }}>
          <p className="ds-subtitle" style={{ marginTop: 0, marginBottom: 14 }}>
            Create your identity, answer a few questions, then talk to an AI that stays consistent with you.
          </p>

          {/* Quick actions */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            <a href="/start" className="ds-btn" style={{ flex: "1 1 170px" }}>
              Start
            </a>
            <a href="/persona" className="ds-btn" style={{ flex: "1 1 170px" }}>
              Account
            </a>
            <a href="/interview" className="ds-btn" style={{ flex: "1 1 170px" }}>
              Interview
            </a>
            <a href="/connections" className="ds-btn" style={{ flex: "1 1 170px" }}>
              Connections
            </a>
            <a href="/profile" className="ds-btn" style={{ flex: "1 1 170px" }}>
              Profile
            </a>
            <a
              href="/ask"
              className="ds-btn ds-btn-primary"
              style={{
                flex: "1 1 170px",
              }}
            >
              Ask
            </a>
          </div>

          {/* Status grid */}
          <div
            className="ds-card ds-card-pad"
            style={{
              boxShadow: "none",
              border: "1px solid rgb(var(--border))",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <div className="ds-subtitle" style={{ fontSize: 12 }}>
                  Account
                </div>
                <div style={{ fontWeight: 700 }}>
                  {loaded ? statusLabel(nameOk, "Ready", "Missing") : "Loading"}
                </div>
                <div className="ds-subtitle" style={{ fontSize: 12 }}>
                  {nameOk ? (account?.displayName || "") : "Add a name"}
                </div>
              </div>

              <div>
                <div className="ds-subtitle" style={{ fontSize: 12 }}>
                  Interview
                </div>
                <div style={{ fontWeight: 700 }}>
                  {loaded ? statusLabel(interviewOk, "Ready", "Needs 3+") : "Loading"}
                </div>
                <div className="ds-subtitle" style={{ fontSize: 12 }}>
                  {loaded ? `${filled} answers saved` : "Loading"}
                </div>
              </div>

              <div>
                <div className="ds-subtitle" style={{ fontSize: 12 }}>
                  Connections
                </div>
                <div style={{ fontWeight: 700 }}>
                  {loaded ? (connections.length ? "Added" : "Optional") : "Loading"}
                </div>
                <div className="ds-subtitle" style={{ fontSize: 12 }}>
                  {loaded ? `${connections.length} people` : "Loading"}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a
                href={`/${nextStep}`}
                className="ds-btn ds-btn-primary"
                style={{
                  flex: "1 1 220px",
                  display: "inline-flex",
                  justifyContent: "center",
                }}
              >
                {nextLabel}
              </a>

              <a
                href="/ask"
                className="ds-btn"
                style={{
                  flex: "1 1 220px",
                  display: "inline-flex",
                  justifyContent: "center",
                }}
              >
                Open Ask
              </a>
            </div>

            <div className="ds-subtitle" style={{ fontSize: 12, marginTop: 10 }}>
              Next:{" "}
              <span style={{ color: "rgb(var(--text))", fontWeight: 700 }}>
                {nextLabel}
              </span>{" "}
              — {nextDesc}
            </div>
          </div>

          {/* Demo */}
          <div className="ds-card ds-card-pad ds-card-soft" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Quick demo</div>
            <div className="ds-subtitle" style={{ fontSize: 12, marginBottom: 10 }}>
              If your setup is complete, this calls your AI route.
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                className="ds-input"
                value={demoQ}
                onChange={(e) => setDemoQ(e.target.value)}
                placeholder="Type a question..."
                style={{ flex: "1 1 280px" }}
                disabled={demoLoading}
              />
              <button
                className="ds-btn ds-btn-primary"
                onClick={runDemo}
                disabled={demoLoading}
              >
                {demoLoading ? "Running..." : "Run"}
              </button>
              <button
                className="ds-btn"
                onClick={() => goAskWithDraft(demoQ)}
                disabled={demoLoading}
              >
                Use in Ask
              </button>
            </div>

            {demoErr && (
              <div className="ds-subtitle" style={{ fontSize: 12, marginTop: 10 }}>
                {demoErr}
              </div>
            )}

            {demoA && (
              <div
                className="ds-bubble ds-bubble-user"
                style={{ marginTop: 12, whiteSpace: "pre-wrap" }}
              >
                {demoA}
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent chats */}
        <div className="ds-card ds-card-pad" style={{ textAlign: "left" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 6,
            }}
          >
            <div style={{ fontWeight: 800 }}>Recent chats</div>
            <a href="/ask" style={{ fontSize: 12, color: "rgb(var(--muted))" }}>
              View in Ask
            </a>
          </div>

          <div className="ds-subtitle" style={{ fontSize: 12 }}>
            Click any item to reopen it in Ask with the same question.
          </div>

          {recentChats.length === 0 ? (
            <div className="ds-subtitle" style={{ fontSize: 12, marginTop: 10 }}>
              No chats saved yet. Run a demo or ask a question to populate this list.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              {recentChats.slice(0, 5).map((c) => (
                <button
                  key={c.id}
                  className="ds-card ds-card-pad ds-card-soft"
                  style={{
                    textAlign: "left",
                    cursor: "pointer",
                    boxShadow: "none",
                    border: "1px solid rgb(var(--border))",
                    background: "transparent",
                  }}
                  onClick={() => goAskWithDraft(c.question)}
                  type="button"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 700, lineHeight: 1.25 }}>
                      {c.question}
                    </div>
                    <div
                      className="ds-subtitle"
                      style={{ fontSize: 11, whiteSpace: "nowrap" }}
                    >
                      {formatDate(c.createdAt)}
                    </div>
                  </div>
                  <div className="ds-subtitle" style={{ fontSize: 12, marginTop: 6 }}>
                    {(c.answer || "").slice(0, 140)}
                    {(c.answer || "").length > 140 ? "..." : ""}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="ds-subtitle" style={{ fontSize: 12, textAlign: "center" }}>
        This is a POC. The assistant may be inaccurate.
      </div>

      {/* Responsive tweak: stack grid on small screens */}
      <style jsx>{`
        @media (max-width: 920px) {
          div[style*="grid-template-columns: 1.1fr 0.9fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}