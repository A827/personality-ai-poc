// app/persona/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Tone = "Warm" | "Calm" | "Direct" | "Strict" | "Funny";

type Persona = {
  displayName: string;
  bio?: string;
  tone: Tone;
};

const PERSONA_KEY = "poc_persona_v1";

function safeParse(raw: string | null): Persona | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as any;

    // Backwards compatible: older saves had no tone
    const tone: Tone =
      parsed?.tone === "Warm" ||
      parsed?.tone === "Calm" ||
      parsed?.tone === "Direct" ||
      parsed?.tone === "Strict" ||
      parsed?.tone === "Funny"
        ? parsed.tone
        : "Warm";

    return {
      displayName: typeof parsed?.displayName === "string" ? parsed.displayName : "",
      bio: typeof parsed?.bio === "string" ? parsed.bio : "",
      tone,
    };
  } catch {
    return null;
  }
}

function toneHelp(tone: Tone) {
  switch (tone) {
    case "Warm":
      return "Supportive, caring, practical.";
    case "Calm":
      return "Steady, reassuring, no drama.";
    case "Direct":
      return "Clear, concise, no fluff.";
    case "Strict":
      return "Firm, disciplined, high standards.";
    case "Funny":
      return "Light humor, friendly, not too much.";
    default:
      return "Supportive, caring, practical.";
  }
}

function buildPersonaSummary(p: Persona | null) {
  if (!p) return "";
  const name = (p.displayName || "").trim();
  const bio = (p.bio || "").trim();
  return [
    `Name: ${name || "(not set)"}`,
    `Tone: ${p.tone || "Warm"}`,
    bio ? `Bio: ${bio}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function PersonaPage() {
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [tone, setTone] = useState<Tone>("Warm");

  useEffect(() => {
    const saved = safeParse(localStorage.getItem(PERSONA_KEY));
    if (saved) {
      setDisplayName(saved.displayName || "");
      setBio(saved.bio || "");
      setTone(saved.tone || "Warm");
    }
    setLoaded(true);
  }, []);

  const summary = useMemo(
    () => buildPersonaSummary({ displayName, bio, tone }),
    [displayName, bio, tone]
  );

  function save() {
    const name = displayName.trim();
    if (!name) {
      setStatus("❌ Please set your name.");
      setTimeout(() => setStatus(""), 1500);
      return;
    }

    const payload: Persona = {
      displayName: name,
      bio: bio.trim(),
      tone,
    };

    localStorage.setItem(PERSONA_KEY, JSON.stringify(payload));
    setStatus("✅ Saved");
    setTimeout(() => setStatus(""), 1500);
  }

  return (
    <main className="ds-page">
      <div className="ds-shell">
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <a
            href="/"
            style={{
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "rgb(var(--text))",
              textDecoration: "none",
            }}
          >
            Personality AI
          </a>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/persona" style={{ fontSize: 13, color: "rgb(var(--text))", fontWeight: 600 }}>
              Account
            </a>
            <a href="/interview" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Interview
            </a>
            <a href="/connections" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Connections
            </a>
            <a href="/ask" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Ask
            </a>
            <a href="/profile" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Profile
            </a>
          </div>
        </div>

        <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 className="ds-h1">My Account</h1>
          <p className="ds-subtitle">
            Set your identity + voice. This tone will guide the assistant across the app.
          </p>
        </header>

        {/* Summary */}
        <div className="ds-card ds-card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 700 }}>Active Persona</div>
            <div className="ds-subtitle" style={{ fontSize: 12 }}>
              {loaded ? "Local save" : "Loading…"}
            </div>
          </div>

          <div className="ds-bubble ds-bubble-user" style={{ whiteSpace: "pre-wrap" }}>
            {summary || "Set your name and tone below, then click Save."}
          </div>
        </div>

        {/* Form */}
        <div className="ds-card ds-card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="ds-subtitle" style={{ fontSize: 12 }}>
              Your name (required)
            </div>
            <input
              className="ds-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Coskun"
            />
          </div>

          {/* Tone */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="ds-subtitle" style={{ fontSize: 12 }}>
              Voice tone (required)
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
              <select
                className="ds-input"
                value={tone}
                onChange={(e) => setTone(e.target.value as Tone)}
                disabled={!loaded}
              >
                <option value="Warm">Warm</option>
                <option value="Calm">Calm</option>
                <option value="Direct">Direct</option>
                <option value="Strict">Strict</option>
                <option value="Funny">Funny</option>
              </select>

              <div className="ds-subtitle" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                {toneHelp(tone)}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="ds-subtitle" style={{ fontSize: 12 }}>
              Short bio (optional)
            </div>
            <textarea
              className="ds-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Extra voice notes (e.g. short answers, no emojis, very practical)..."
            />
          </div>
        </div>

        {/* Actions */}
        <div
          className="ds-card ds-card-pad"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
        >
          <button className="ds-btn ds-btn-primary" onClick={save} disabled={!loaded}>
            Save Account
          </button>
          <div className="ds-subtitle" style={{ fontSize: 12 }}>
            {status || "Next: go to Interview and fill answers."}
          </div>
        </div>

        <footer className="ds-subtitle" style={{ fontSize: 12, textAlign: "center" }}>
          This is a POC. The assistant is an AI representation and may be inaccurate.
        </footer>
      </div>
    </main>
  );
}