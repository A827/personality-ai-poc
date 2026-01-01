// app/login/page.tsx
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

export default function LoginPage() {
  const MIN_INTERVIEW_ANSWERS = 3;

  const [loaded, setLoaded] = useState(false);
  const [existing, setExisting] = useState<MyAccount | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [err, setErr] = useState("");

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

  // If already logged in, jump to the next step
  useEffect(() => {
    if (!loaded) return;
    if (!nameOk) return;
    window.location.replace(interviewOk ? "/ask" : "/interview");
  }, [loaded, nameOk, interviewOk]);

  function saveAndContinue(displayNameRaw: string, bioRaw: string) {
    const displayName = (displayNameRaw || "").trim();
    if (!displayName) {
      setErr("Please enter a name.");
      return;
    }

    const next: MyAccount = {
      displayName,
      bio: (bioRaw || "").trim() || undefined,
    };

    localStorage.setItem(PERSONA_KEY, JSON.stringify(next));
    window.location.href = filled >= MIN_INTERVIEW_ANSWERS ? "/ask" : "/interview";
  }

  function login() {
    setErr("");
    saveAndContinue(name, bio);
  }

  function guest() {
    setErr("");
    saveAndContinue("Guest", "");
  }

  function resetIdentity() {
    localStorage.removeItem(PERSONA_KEY);
    setExisting(null);
    setName("");
    setBio("");
    setErr("");
  }

  return (
    <div className="ds-card ds-card-pad">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div className="ds-h1">Login</div>
          <div className="ds-subtitle" style={{ marginTop: 6 }}>
            Simple local login (saved in your browser). No passwords yet.
          </div>
        </div>

        {!loaded ? (
          <div className="ds-subtitle">Loading…</div>
        ) : (
          <>
            {/* Status */}
            <div
              className="ds-card ds-card-pad ds-card-soft"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 800 }}>Identity</div>
                <div className="ds-subtitle" style={{ fontSize: 12, marginTop: 6 }}>
                  {nameOk ? `Saved: ${existing?.displayName}` : "Not set"}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 800 }}>Interview</div>
                <div className="ds-subtitle" style={{ fontSize: 12, marginTop: 6 }}>
                  {filled} answers saved (needs {MIN_INTERVIEW_ANSWERS}+)
                </div>
              </div>
            </div>

            {/* Form */}
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") login();
                  }}
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

              {err && (
                <div className="ds-subtitle" style={{ fontSize: 12 }}>
                  {err}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="ds-btn ds-btn-primary" onClick={login} disabled={!name.trim()}>
                  Continue
                </button>

                <button className="ds-btn" onClick={guest}>
                  Continue as Guest
                </button>

                <a className="ds-btn" href="/start">
                  Back to Start
                </a>

                {nameOk && (
                  <button className="ds-btn" onClick={resetIdentity}>
                    Reset identity
                  </button>
                )}
              </div>
            </div>

            <div className="ds-subtitle" style={{ fontSize: 12 }}>
              Later we can replace this with real authentication (email/password, Google, etc.) without changing the app flow.
            </div>
          </>
        )}
      </div>
    </div>
  );
}