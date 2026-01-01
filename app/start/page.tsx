// app/start/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type MyAccount = {
  displayName: string;
  bio?: string;
};

type AnswerMap = Record<string, string>;

const PERSONA_KEY = "poc_persona_v1";
const STORAGE_KEY = "poc_personality_answers_v1";

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

export default function StartPage() {
  const MIN_INTERVIEW_ANSWERS = 3;

  const [loaded, setLoaded] = useState(false);
  const [existing, setExisting] = useState<MyAccount | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const acc = safeParse<MyAccount | null>(localStorage.getItem(PERSONA_KEY), null);
    const a = safeParse<AnswerMap>(localStorage.getItem(STORAGE_KEY), {});

    setExisting(acc);
    setAnswers(a);

    if (acc?.displayName) {
      setName(acc.displayName);
      setBio(acc.bio || "");
    }

    setLoaded(true);
  }, []);

  const filled = useMemo(() => countFilledAnswers(answers), [answers]);
  const nameOk = useMemo(() => (existing?.displayName || "").trim().length > 0, [existing]);
  const interviewOk = useMemo(() => filled >= MIN_INTERVIEW_ANSWERS, [filled]);

  // ✅ If already logged in, Start page should behave like onboarding:
  // If interview ready -> send to /ask
  // If interview not ready -> send to /interview
  useEffect(() => {
    if (!loaded) return;
    if (!nameOk) return;

    // already has identity
    window.location.href = interviewOk ? "/ask" : "/interview";
  }, [loaded, nameOk, interviewOk]);

  // flow:
  // - if no name: stay here and create
  // - if no interview: go interview
  // - else: go ask
  const nextHref = !nameOk ? "/start" : !interviewOk ? "/interview" : "/ask";
  const nextLabel = !nameOk
    ? "Create identity"
    : !interviewOk
    ? "Continue to interview"
    : "Continue to Ask";

  function save() {
    const displayName = name.trim();
    if (!displayName) return;

    const next: MyAccount = {
      displayName,
      bio: bio.trim() || undefined,
    };

    localStorage.setItem(PERSONA_KEY, JSON.stringify(next));
    window.location.href = filled >= MIN_INTERVIEW_ANSWERS ? "/ask" : "/interview";
  }

  function continueFlow() {
    window.location.href = nextHref;
  }

  function resetIdentity() {
    localStorage.removeItem(PERSONA_KEY);
    setExisting(null);
    setName("");
    setBio("");
  }

  return (
    <div className="ds-card ds-card-pad">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div className="ds-h1">Start</div>
          <div className="ds-subtitle" style={{ marginTop: 6 }}>
            Create a local identity so the assistant stays consistent across sessions.
          </div>
        </div>

        {!loaded ? (
          <div className="ds-subtitle">Loading…</div>
        ) : (
          <>
            <div
              className="ds-card ds-card-pad ds-card-soft"
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
            >
              <div>
                <div style={{ fontWeight: 800 }}>Account</div>
                <div className="ds-subtitle" style={{ fontSize: 12, marginTop: 6 }}>
                  {nameOk ? `Ready: ${existing?.displayName}` : "Missing"}
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 800 }}>Interview</div>
                <div className="ds-subtitle" style={{ fontSize: 12, marginTop: 6 }}>
                  {filled} answers saved (needs {MIN_INTERVIEW_ANSWERS}+)
                </div>
              </div>
            </div>

            {existing?.displayName ? (
              <div
                className="ds-card ds-card-pad ds-card-soft"
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div style={{ fontWeight: 800 }}>Welcome back</div>
                <div className="ds-subtitle">
                  Signed in locally as{" "}
                  <span style={{ color: "rgb(var(--text))", fontWeight: 700 }}>
                    {existing.displayName}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="ds-btn ds-btn-primary" onClick={continueFlow}>
                    {nextLabel}
                  </button>

                  {!interviewOk && (
                    <a className="ds-btn" href="/interview">
                      Open interview
                    </a>
                  )}

                  <button className="ds-btn" onClick={resetIdentity}>
                    Reset identity
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  className="ds-card ds-card-pad ds-card-soft"
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div>
                    <div className="ds-subtitle" style={{ fontSize: 12, marginBottom: 6 }}>
                      Your name
                    </div>
                    <input
                      className="ds-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <div className="ds-subtitle" style={{ fontSize: 12, marginBottom: 6 }}>
                      Short bio (optional)
                    </div>
                    <textarea
                      className="ds-textarea"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="A few lines about you, your tone, your context"
                    />
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      className="ds-btn ds-btn-primary"
                      onClick={save}
                      disabled={!name.trim()}
                    >
                      Create identity
                    </button>

                    {/* ✅ Skip should go to Login page, not Ask */}
                    <a className="ds-btn" href="/login">
                      Skip for now
                    </a>
                  </div>
                </div>

                <div className="ds-subtitle" style={{ fontSize: 12 }}>
                  Local-only for now. Later we can convert this to real login without changing the flow.
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}