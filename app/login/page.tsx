// app/login/page.tsx
"use client";

import { useEffect, useState } from "react";

type MyAccount = {
  displayName: string;
  bio?: string;
};

const PERSONA_KEY = "poc_persona_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function LoginPage() {
  const [loaded, setLoaded] = useState(false);
  const [existing, setExisting] = useState<MyAccount | null>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const acc = safeParse<MyAccount | null>(
      localStorage.getItem(PERSONA_KEY),
      null
    );

    if (acc?.displayName) {
      setExisting(acc);
      setName(acc.displayName);
      setBio(acc.bio || "");
    }

    setLoaded(true);
  }, []);

  function login() {
    const displayName = name.trim();
    if (!displayName) return;

    const next: MyAccount = {
      displayName,
      bio: bio.trim() || undefined,
    };

    localStorage.setItem(PERSONA_KEY, JSON.stringify(next));
    window.location.href = "/";
  }

  function logout() {
    localStorage.removeItem(PERSONA_KEY);
    setExisting(null);
    setName("");
    setBio("");
  }

  if (!loaded) {
    return <div className="ds-subtitle">Loading…</div>;
  }

  return (
    <div className="ds-card ds-card-pad" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h1 className="ds-h1">Login</h1>
          <p className="ds-subtitle">
            Enter your identity to continue. This stays local for now.
          </p>
        </div>

        {existing?.displayName ? (
          <div
            className="ds-card ds-card-pad ds-card-soft"
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <div style={{ fontWeight: 800 }}>Signed in</div>
            <div className="ds-subtitle">
              As{" "}
              <span style={{ fontWeight: 700 }}>
                {existing.displayName}
              </span>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="ds-btn ds-btn-primary" onClick={() => (window.location.href = "/")}>
                Continue
              </button>
              <button className="ds-btn" onClick={logout}>
                Log out
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="ds-card ds-card-pad ds-card-soft">
              <div style={{ marginBottom: 10 }}>
                <div className="ds-subtitle" style={{ fontSize: 12, marginBottom: 6 }}>
                  Display name
                </div>
                <input
                  className="ds-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
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
                  placeholder="Tone, context, preferences…"
                />
              </div>
            </div>

            <button
              className="ds-btn ds-btn-primary"
              onClick={login}
              disabled={!name.trim()}
            >
              Enter
            </button>

            <div className="ds-subtitle" style={{ fontSize: 12 }}>
              This is not a real account yet. No email, no password.
            </div>
          </>
        )}
      </div>
    </div>
  );
}