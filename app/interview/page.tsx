"use client";

import { useEffect, useMemo, useState } from "react";

type AnswerMap = Record<string, string>;
type QType = "text" | "choice" | "scale";

type Question = {
  id: string;
  q: string;
  type: QType;
  placeholder?: string;
  choices?: { value: string; label: string }[];
  scale?: {
    min: number;
    max: number;
    minLabel: string;
    maxLabel: string;
  };
};

const STORAGE_KEY = "poc_personality_answers_v1";

function safeParse(raw: string | null): AnswerMap {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default function InterviewPage() {
  const MIN_READY = 3;

  const questions: Question[] = useMemo(
    () => [
      // 1–5: Identity / voice
      {
        id: "identity_words",
        q: "Pick 3 words that describe you best (comma-separated).",
        type: "text",
        placeholder: "e.g. calm, ambitious, loyal",
      },
      {
        id: "identity_energy",
        q: "Your default energy level in daily life?",
        type: "scale",
        scale: { min: 1, max: 5, minLabel: "Low & steady", maxLabel: "High & intense" },
      },
      {
        id: "identity_tone",
        q: "When you speak, you are usually…",
        type: "choice",
        choices: [
          { value: "warm", label: "Warm & friendly" },
          { value: "direct", label: "Direct & clear" },
          { value: "funny", label: "Playful & funny" },
          { value: "formal", label: "Formal & respectful" },
          { value: "quiet", label: "Quiet & minimal words" },
        ],
      },
      {
        id: "identity_confidence",
        q: "How confident do you sound when you speak?",
        type: "scale",
        scale: { min: 1, max: 5, minLabel: "Humble / unsure", maxLabel: "Very confident" },
      },
      {
        id: "identity_pride",
        q: "What are you most proud of (1–2 sentences)?",
        type: "text",
        placeholder: "A project, a habit, a moment, a value…",
      },

      // 6–10: Values / priorities
      {
        id: "values_top3",
        q: "Your top 3 life values (comma-separated).",
        type: "text",
        placeholder: "e.g. family, freedom, growth",
      },
      {
        id: "values_choice",
        q: "If forced to choose one priority most of the time:",
        type: "choice",
        choices: [
          { value: "family", label: "Family" },
          { value: "freedom", label: "Freedom" },
          { value: "money", label: "Money / security" },
          { value: "status", label: "Status / respect" },
          { value: "peace", label: "Peace / stability" },
        ],
      },
      {
        id: "values_risk",
        q: "How comfortable are you with risk?",
        type: "scale",
        scale: { min: 1, max: 5, minLabel: "Avoid risk", maxLabel: "Love risk" },
      },
      {
        id: "values_fairness",
        q: "When something is unfair, you usually…",
        type: "choice",
        choices: [
          { value: "confront", label: "Confront it quickly" },
          { value: "strategic", label: "Be strategic and wait for the right moment" },
          { value: "avoid", label: "Avoid it to keep peace" },
          { value: "internal", label: "Get angry inside but stay calm outside" },
          { value: "joke", label: "Use humor to defuse it" },
        ],
      },
      {
        id: "values_nonnegotiable",
        q: "One non-negotiable boundary you have (short).",
        type: "text",
        placeholder: "e.g. disrespect, lies, wasting time…",
      },

      // 11–15: Decisions / thinking style
      {
        id: "decisions_speed",
        q: "Decision speed:",
        type: "choice",
        choices: [
          { value: "fast", label: "Fast — I decide quickly" },
          { value: "balanced", label: "Balanced — depends on the topic" },
          { value: "slow", label: "Slow — I think a lot first" },
        ],
      },
      {
        id: "decisions_style",
        q: "When making big decisions you rely more on…",
        type: "choice",
        choices: [
          { value: "logic", label: "Logic & numbers" },
          { value: "gut", label: "Gut feeling" },
          { value: "advice", label: "Advice from people I trust" },
          { value: "experience", label: "Past experience" },
          { value: "research", label: "Research & comparison" },
        ],
      },
      {
        id: "decisions_pressure",
        q: "Under pressure, you usually…",
        type: "choice",
        choices: [
          { value: "perform", label: "Perform better" },
          { value: "steady", label: "Stay steady" },
          { value: "stress", label: "Get stressed but push through" },
          { value: "shutdown", label: "Shutdown / avoid" },
        ],
      },
      {
        id: "decisions_regret",
        q: "Do you regret decisions often?",
        type: "scale",
        scale: { min: 1, max: 5, minLabel: "Rarely regret", maxLabel: "Often regret" },
      },
      {
        id: "decisions_example",
        q: "Describe a recent decision you’re happy with (1–2 sentences).",
        type: "text",
        placeholder: "What happened and why it was the right call.",
      },

      // 16–20: Emotions / stress / anger
      {
        id: "emotions_calm",
        q: "What calms you down when life is stressful?",
        type: "text",
        placeholder: "e.g. gym, music, prayer, walking, silence…",
      },
      {
        id: "emotions_stress_level",
        q: "How often do you feel stressed lately?",
        type: "scale",
        scale: { min: 1, max: 5, minLabel: "Rarely", maxLabel: "Very often" },
      },
      {
        id: "emotions_anger_style",
        q: "When angry, you usually…",
        type: "choice",
        choices: [
          { value: "silent", label: "Go quiet" },
          { value: "direct", label: "Say it directly" },
          { value: "explode", label: "Explode then regret" },
          { value: "cold", label: "Become cold / distant" },
          { value: "joke", label: "Use humor to cover it" },
        ],
      },
      {
        id: "emotions_apology",
        q: "How easily do you apologize when wrong?",
        type: "scale",
        scale: { min: 1, max: 5, minLabel: "Hard", maxLabel: "Easy" },
      },
      {
        id: "emotions_trigger",
        q: "One thing that triggers you quickly (short).",
        type: "text",
        placeholder: "e.g. disrespect, laziness, lies, being ignored…",
      },

      // 21–25: Relationships / communication
      {
        id: "relationships_love_language",
        q: "How you show love most naturally:",
        type: "choice",
        choices: [
          { value: "actions", label: "Actions / helping" },
          { value: "words", label: "Words / reassurance" },
          { value: "time", label: "Quality time" },
          { value: "gifts", label: "Gifts" },
          { value: "touch", label: "Physical touch" },
        ],
      },
      {
        id: "relationships_conflict",
        q: "In conflict, you usually…",
        type: "choice",
        choices: [
          { value: "solve", label: "Try to solve it immediately" },
          { value: "cooldown", label: "Need time to cool down first" },
          { value: "avoid", label: "Avoid conflict" },
          { value: "win", label: "Need to be right / win" },
          { value: "compromise", label: "Compromise quickly" },
        ],
      },
      {
        id: "relationships_feedback",
        q: "How do you prefer people to give you feedback?",
        type: "choice",
        choices: [
          { value: "direct", label: "Direct & honest" },
          { value: "soft", label: "Soft & respectful" },
          { value: "private", label: "In private only" },
          { value: "written", label: "Written / message" },
        ],
      },
      {
        id: "relationships_trust",
        q: "How fast do you trust people?",
        type: "scale",
        scale: { min: 1, max: 5, minLabel: "Very slow", maxLabel: "Very fast" },
      },
      {
        id: "relationships_advice",
        q: "One piece of advice you repeat to people you love.",
        type: "text",
        placeholder: "A sentence you really believe in.",
      },
    ],
    []
  );

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setAnswers(safeParse(localStorage.getItem(STORAGE_KEY)));
    setLoaded(true);
  }, []);

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
      setStatus("✅ Saved locally.");
      setTimeout(() => setStatus(""), 1200);
    } catch {
      setStatus("❌ Could not save (localStorage error).");
      setTimeout(() => setStatus(""), 1800);
    }
  }

  function clearAll() {
    if (!confirm("Clear all saved answers?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
    setStatus("🗑️ Cleared.");
    setTimeout(() => setStatus(""), 1200);
  }

  const filledCount = useMemo(
    () => questions.filter((x) => (answers[x.id] || "").trim().length > 0).length,
    [answers, questions]
  );

  const ready = filledCount >= MIN_READY;
  const progressPct = Math.round((filledCount / questions.length) * 100);

  return (
    <>
      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 className="ds-h1">Interview</h1>
        <p className="ds-subtitle">
          Answer at least <b>{MIN_READY}</b> questions to unlock asking. More answers = more consistent “you”.
        </p>
      </header>

      {/* Progress */}
      <div className="ds-card ds-card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>Progress</div>
          <div className="ds-subtitle" style={{ fontSize: 12 }}>
            {loaded ? `${progressPct}%` : "…"} ({filledCount}/{questions.length})
          </div>
        </div>

        <div style={{ height: 8, width: "100%", borderRadius: 999, background: "rgb(var(--border))" }}>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              width: loaded ? `${progressPct}%` : "0%",
              background: "rgb(var(--text))",
              transition: "width 200ms ease",
            }}
          />
        </div>

        <div className="ds-subtitle" style={{ fontSize: 12 }}>
          Status:{" "}
          <span style={{ color: "rgb(var(--text))", fontWeight: 700 }}>
            {ready ? "✅ Ready to Ask" : `⚠️ Needs ${MIN_READY - filledCount} more`}
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={save} className="ds-btn ds-btn-primary" disabled={!loaded}>
            Save
          </button>
          <button onClick={clearAll} className="ds-btn" disabled={!loaded}>
            Clear
          </button>

          <a
            className="ds-btn"
            href={ready ? "/ask" : "/profile"}
            style={{ opacity: loaded ? 1 : 0.7, pointerEvents: loaded ? "auto" : "none" }}
          >
            {ready ? "Continue to Ask →" : "View Profile →"}
          </a>

          <div className="ds-subtitle" style={{ fontSize: 12, marginLeft: "auto" }}>
            {status || "Save whenever you update answers."}
          </div>
        </div>
      </div>

      {!loaded ? (
        <div className="ds-card ds-card-pad">Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {questions.map((item, idx) => {
            const val = answers[item.id] || "";

            return (
              <div
                key={item.id}
                className="ds-card ds-card-pad"
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div style={{ fontSize: 13, fontWeight: 800 }}>
                  {idx + 1}. {item.q}
                </div>

                {item.type === "text" && (
                  <textarea
                    className="ds-textarea"
                    placeholder={item.placeholder || "Type your answer…"}
                    value={val}
                    onChange={(e) => setAnswer(item.id, e.target.value)}
                  />
                )}

                {item.type === "choice" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(item.choices || []).map((c) => {
                      const checked = val === c.value;
                      return (
                        <label
                          key={c.value}
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            border: "1px solid rgb(var(--border))",
                            borderRadius: 14,
                            padding: "10px 12px",
                            background: checked ? "rgba(var(--text), 0.06)" : "transparent",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="radio"
                            name={item.id}
                            checked={checked}
                            onChange={() => setAnswer(item.id, c.value)}
                          />
                          <div style={{ fontSize: 14 }}>{c.label}</div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {item.type === "scale" && item.scale && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div className="ds-subtitle" style={{ fontSize: 12 }}>
                        {item.scale.minLabel}
                      </div>
                      <div className="ds-subtitle" style={{ fontSize: 12 }}>
                        {item.scale.maxLabel}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <input
                        type="range"
                        min={item.scale.min}
                        max={item.scale.max}
                        value={val ? Number(val) : 3}
                        onChange={(e) => setAnswer(item.id, e.target.value)}
                        style={{ width: "100%" }}
                      />
                      <div
                        style={{
                          minWidth: 36,
                          textAlign: "center",
                          fontWeight: 800,
                          border: "1px solid rgb(var(--border))",
                          borderRadius: 12,
                          padding: "6px 10px",
                          background: "rgba(var(--text), 0.04)",
                        }}
                      >
                        {val || "3"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <footer className="ds-subtitle" style={{ fontSize: 12, textAlign: "center" }}>
        This is a POC. The assistant may be inaccurate.
      </footer>
    </>
  );
}