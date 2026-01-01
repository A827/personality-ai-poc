"use client";

import { useEffect, useMemo, useState } from "react";

type AnswerMap = Record<string, string>;
const STORAGE_KEY = "poc_personality_answers_v1";

type Item = { id: string; label: string; hint?: string };
type Section = { key: string; title: string; subtitle?: string; items: Item[] };

// ✅ NEW Interview IDs (plus a few helpful extras)
const SECTIONS_V2: Section[] = [
  {
    key: "identity",
    title: "Identity",
    subtitle: "Who you are + energy/confidence.",
    items: [
      { id: "identity_words", label: "3 words that describe you best" },
      { id: "identity_pride", label: "What are you most proud of?" },
      { id: "identity_confidence", label: "Confidence (1–5)" },
      { id: "identity_energy", label: "Energy (1–5)" },
    ],
  },
  {
    key: "voice",
    title: "Voice & Style",
    subtitle: "How the AI should sound.",
    items: [
      { id: "identity_tone", label: "Tone (warm/direct/funny/formal/quiet)" },
      { id: "voice_phrases", label: "Words/phrases you often use" },
      { id: "voice_never", label: "What should the AI NEVER say?" },
      { id: "voice_detail", label: "Answer style preference (short vs detailed)" },
    ],
  },
  {
    key: "values",
    title: "Values & Boundaries",
    subtitle: "What matters most + red lines.",
    items: [
      { id: "values_top3", label: "Top 3 values" },
      { id: "values_choice", label: "Main priority (family/freedom/money/status/peace)" },
      { id: "values_risk", label: "Risk comfort (1–5)" },
      { id: "values_fairness", label: "When something is unfair, what do you do?" },
      { id: "values_nonnegotiable", label: "Non-negotiable boundary" },
    ],
  },
  {
    key: "decisions",
    title: "Decisions",
    subtitle: "How you decide and behave under pressure.",
    items: [
      { id: "decisions_speed", label: "Decision speed (fast/balanced/slow)" },
      { id: "decisions_style", label: "Decision style (logic/gut/advice/experience/research)" },
      { id: "decisions_pressure", label: "Under pressure, you usually…" },
      { id: "decisions_regret", label: "Regret tendency (1–5)" },
      { id: "decisions_example", label: "A recent decision you’re proud of" },
    ],
  },
  {
    key: "emotions",
    title: "Emotions & Stress",
    subtitle: "Triggers, anger response, what helps.",
    items: [
      { id: "emotions_calm", label: "What calms you when stressed?" },
      { id: "emotions_stress_level", label: "Stress lately (1–5)" },
      { id: "emotions_anger_style", label: "When angry (silent/direct/explode/cold/joke)" },
      { id: "emotions_apology", label: "Apologizing (1–5)" },
      { id: "emotions_trigger", label: "Quick trigger / biggest trigger" },
    ],
  },
  {
    key: "relationships",
    title: "Relationships",
    subtitle: "Love language, conflict, trust.",
    items: [
      { id: "relationships_love_language", label: "Love language (actions/words/time/gifts/touch)" },
      { id: "relationships_conflict", label: "Conflict style (solve/cooldown/avoid/win/compromise)" },
      { id: "relationships_feedback", label: "Preferred feedback style" },
      { id: "relationships_trust", label: "Trust speed (1–5)" },
      { id: "relationships_advice", label: "Advice you repeat often" },
    ],
  },
];

// ✅ OPTIONAL: keep your old fields editable so you don’t lose data
const SECTIONS_LEGACY: Section[] = [
  {
    key: "legacy_identity_voice",
    title: "Legacy (old questions)",
    subtitle: "Older fields saved previously. Safe to leave blank.",
    items: [
      { id: "identity_1", label: "3 words that describe you best (old)" },
      { id: "voice_1", label: "How should the AI sound? (old)" },
      { id: "voice_2", label: "Words/phrases you often use (old)" },
      { id: "voice_3", label: "What should the AI NEVER say? (old)" },
    ],
  },
  {
    key: "legacy_values",
    title: "Legacy Values (old)",
    items: [
      { id: "values_1", label: "What matters most in life (old)" },
      { id: "values_2", label: "Family vs money vs freedom (old)" },
      { id: "values_3", label: "Non-negotiables (old)" },
      { id: "values_4", label: "What makes you lose respect (old)" },
      { id: "values_5", label: "What you want to be remembered for (old)" },
    ],
  },
  {
    key: "legacy_decisions",
    title: "Legacy Decisions (old)",
    items: [
      { id: "decisions_1", label: "How you make big decisions (old)" },
      { id: "decisions_2", label: "Fast or slow decision maker (old)" },
      { id: "decisions_3", label: "Logic vs emotion (old)" },
      { id: "decisions_4", label: "How you handle risk (old)" },
      { id: "decisions_5", label: "What you do when stuck (old)" },
    ],
  },
  {
    key: "legacy_emotions",
    title: "Legacy Emotions (old)",
    items: [
      { id: "emotions_1", label: "What calms you under stress (old)" },
      { id: "emotions_2", label: "How you behave when angry (old)" },
      { id: "emotions_3", label: "Biggest triggers (old)" },
      { id: "emotions_4", label: "What you want from others when overwhelmed (old)" },
      { id: "emotions_5", label: "How AI should respond when upset (old)" },
    ],
  },
  {
    key: "legacy_relationships",
    title: "Legacy Relationships (old)",
    items: [
      { id: "relationships_1", label: "How you show love (old)" },
      { id: "relationships_2", label: "How you handle conflict (old)" },
      { id: "relationships_3", label: "What makes you trust someone (old)" },
      { id: "relationships_4", label: "How you forgive (old)" },
      { id: "relationships_5", label: "What you need most (old)" },
    ],
  },
  {
    key: "legacy_misc",
    title: "Legacy Other (old)",
    items: [
      { id: "daily_1", label: "Ideal day (old)" },
      { id: "daily_2", label: "Motivation when tired (old)" },
      { id: "daily_3", label: "Demotivated by (old)" },
      { id: "daily_4", label: "Recharge (old)" },
      { id: "beliefs_1", label: "Belief misunderstood (old)" },
      { id: "beliefs_2", label: "Hard life lesson (old)" },
      { id: "beliefs_3", label: "Peace vs progress (old)" },
      { id: "advice_1", label: "Advice you repeat (old)" },
      { id: "advice_2", label: "What you tell yourself when low (old)" },
      { id: "advice_3", label: "AI should copy this (old)" },
      { id: "advice_4", label: "Preferred answer style (old)" },
    ],
  },
];

function safeParse(raw: string | null): AnswerMap {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function get(answers: AnswerMap, id: string) {
  return (answers[id] || "").trim();
}

// pick() uses new id first, then falls back to old
function pick(answers: AnswerMap, ...ids: string[]) {
  for (const id of ids) {
    const v = get(answers, id);
    if (v) return v;
  }
  return "";
}

function humanizeChoice(value: string, map: Record<string, string>) {
  return map[value] || value;
}

function buildSummary(answers: AnswerMap) {
  const lines: string[] = [];

  // Identity
  const identityWords = pick(answers, "identity_words", "identity_1");
  const pride = pick(answers, "identity_pride");
  const confidence = pick(answers, "identity_confidence");
  const energy = pick(answers, "identity_energy");

  if (identityWords) lines.push(`Identity words: ${identityWords}`);
  if (pride) lines.push(`Most proud of: ${pride}`);
  if (confidence) lines.push(`Confidence (1–5): ${confidence}`);
  if (energy) lines.push(`Energy (1–5): ${energy}`);

  // Voice
  const toneRaw = pick(answers, "identity_tone");
  const phrases = pick(answers, "voice_phrases", "voice_2");
  const never = pick(answers, "voice_never", "voice_3");
  const detail = pick(answers, "voice_detail", "advice_4");

  const tone = toneRaw
    ? humanizeChoice(toneRaw, {
        warm: "Warm & friendly",
        direct: "Direct & clear",
        funny: "Playful & funny",
        formal: "Formal & respectful",
        quiet: "Quiet & minimal words",
      })
    : pick(answers, "voice_1"); // legacy free-text voice style

  if (tone) lines.push(`Tone: ${tone}`);
  if (phrases) lines.push(`Phrases: ${phrases}`);
  if (never) lines.push(`Never say: ${never}`);
  if (detail) lines.push(`Answer style preference: ${detail}`);

  // Values
  const valuesTop3 = pick(answers, "values_top3", "values_1");
  const valuesChoiceRaw = pick(answers, "values_choice", "values_2");
  const valuesChoice = valuesChoiceRaw
    ? humanizeChoice(valuesChoiceRaw, {
        family: "Family",
        freedom: "Freedom",
        money: "Money / security",
        status: "Status / respect",
        peace: "Peace / stability",
      })
    : "";

  const risk = pick(answers, "values_risk");
  const fairness = pick(answers, "values_fairness");
  const nonneg = pick(answers, "values_nonnegotiable", "values_3");

  if (valuesTop3) lines.push(`Values: ${valuesTop3}`);
  if (valuesChoice) lines.push(`Main priority: ${valuesChoice}`);
  if (risk) lines.push(`Risk comfort (1–5): ${risk}`);
  if (fairness) lines.push(`When unfair: ${fairness}`);
  if (nonneg) lines.push(`Non-negotiable: ${nonneg}`);

  // Decisions
  const speedRaw = pick(answers, "decisions_speed", "decisions_2");
  const speed = speedRaw
    ? humanizeChoice(speedRaw, { fast: "Fast", balanced: "Balanced", slow: "Slow" })
    : "";

  const styleRaw = pick(answers, "decisions_style", "decisions_1");
  const style = styleRaw
    ? humanizeChoice(styleRaw, {
        logic: "Logic & numbers",
        gut: "Gut feeling",
        advice: "Advice from trusted people",
        experience: "Past experience",
        research: "Research & comparison",
      })
    : "";

  const pressure = pick(answers, "decisions_pressure");
  const regret = pick(answers, "decisions_regret");
  const example = pick(answers, "decisions_example");

  if (speed) lines.push(`Decision speed: ${speed}`);
  if (style) lines.push(`Decision style: ${style}`);
  if (pressure) lines.push(`Under pressure: ${pressure}`);
  if (regret) lines.push(`Regret tendency (1–5): ${regret}`);
  if (example) lines.push(`Recent good decision: ${example}`);

  // Emotions
  const calm = pick(answers, "emotions_calm", "emotions_1");
  const stress = pick(answers, "emotions_stress_level");
  const angerRaw = pick(answers, "emotions_anger_style", "emotions_2");
  const anger = angerRaw
    ? humanizeChoice(angerRaw, {
        silent: "Go quiet",
        direct: "Say it directly",
        explode: "Explode then regret",
        cold: "Cold / distant",
        joke: "Use humor to cover it",
      })
    : "";

  const apology = pick(answers, "emotions_apology");
  const trigger = pick(answers, "emotions_trigger", "emotions_3");

  if (calm) lines.push(`Calm under stress: ${calm}`);
  if (stress) lines.push(`Stress lately (1–5): ${stress}`);
  if (anger) lines.push(`When angry: ${anger}`);
  if (apology) lines.push(`Apologizing (1–5): ${apology}`);
  if (trigger) lines.push(`Trigger: ${trigger}`);

  // Relationships
  const loveRaw = pick(answers, "relationships_love_language", "relationships_1");
  const love = loveRaw
    ? humanizeChoice(loveRaw, {
        actions: "Actions / helping",
        words: "Words / reassurance",
        time: "Quality time",
        gifts: "Gifts",
        touch: "Physical touch",
      })
    : "";

  const conflictRaw = pick(answers, "relationships_conflict", "relationships_2");
  const conflict = conflictRaw
    ? humanizeChoice(conflictRaw, {
        solve: "Solve immediately",
        cooldown: "Need time to cool down",
        avoid: "Avoid conflict",
        win: "Need to be right",
        compromise: "Compromise quickly",
      })
    : "";

  const feedback = pick(answers, "relationships_feedback");
  const trust = pick(answers, "relationships_trust", "relationships_3");
  const advice = pick(answers, "relationships_advice", "advice_1");

  if (love) lines.push(`Shows love via: ${love}`);
  if (conflict) lines.push(`Conflict style: ${conflict}`);
  if (feedback) lines.push(`Feedback preference: ${feedback}`);
  if (trust) lines.push(`Trust: ${trust}`);
  if (advice) lines.push(`Repeated advice: ${advice}`);

  const filled = Object.values(answers).filter((v) => (v || "").trim()).length;
  return { lines, text: lines.join("\n"), filled };
}

export default function ProfilePage() {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("");

  const [openKey, setOpenKey] = useState<string>("identity");

  useEffect(() => {
    setAnswers(safeParse(localStorage.getItem(STORAGE_KEY)));
    setLoaded(true);
  }, []);

  const summary = useMemo(() => buildSummary(answers), [answers]);

  function update(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    setStatus("✅ Saved");
    setTimeout(() => setStatus(""), 1500);
  }

  return (
    <main className="ds-page">
      <div className="ds-shell">
        {/* Sticky App Header */}
        <div
          className="ds-topbar"
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

          <div className="ds-nav">
            <a href="/persona">Account</a>
            <a href="/interview">Interview</a>
            <a href="/connections">Connections</a>
            <a href="/ask">Ask</a>
            <a href="/profile" data-active="true">
              Profile
            </a>
          </div>
        </div>

        {/* Title */}
        <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 className="ds-h1">My Profile</h1>
          <p className="ds-subtitle">Summary-first view. Expand sections only when you want to edit.</p>
        </header>

        {/* Summary */}
        <div className="ds-card ds-card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 800 }}>Profile Summary</div>
            <div className="ds-subtitle" style={{ fontSize: 12 }}>
              Filled: {loaded ? summary.filled : "…"}
            </div>
          </div>

          <div className="ds-bubble ds-bubble-user" style={{ whiteSpace: "pre-wrap" }}>
            {summary.text || "No profile yet. Go to Interview and answer a few questions."}
          </div>

          <div className="ds-subtitle" style={{ fontSize: 12 }}>
            Best results come from: <b>Tone</b> + <b>Phrases</b> + <b>Never say</b>.
          </div>
        </div>

        {/* Edit sections (V2) */}
        <div className="ds-card ds-card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>Edit Details</div>

          {SECTIONS_V2.map((section) => {
            const isOpen = openKey === section.key;

            return (
              <div
                key={section.key}
                style={{
                  border: "1px solid rgb(var(--border))",
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "white",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenKey(isOpen ? "" : section.key)}
                  className="ds-btn"
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "none",
                    borderRadius: 0,
                    padding: "12px 14px",
                    background: "white",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "left" }}>
                    <span style={{ fontWeight: 700 }}>{section.title}</span>
                    {section.subtitle ? (
                      <span className="ds-subtitle" style={{ fontSize: 12 }}>
                        {section.subtitle}
                      </span>
                    ) : null}
                  </div>
                  <span style={{ color: "rgb(var(--muted))", fontSize: 12 }}>{isOpen ? "Close" : "Edit"}</span>
                </button>

                {isOpen && (
                  <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                    {section.items.map((item) => (
                      <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ fontSize: 12, color: "rgb(var(--muted))" }}>{item.label}</div>
                        <textarea
                          className="ds-textarea"
                          value={answers[item.id] || ""}
                          onChange={(e) => update(item.id, e.target.value)}
                          placeholder="Write here…"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legacy editor (optional but useful) */}
        <div className="ds-card ds-card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>Legacy Answers (optional)</div>
          <div className="ds-subtitle" style={{ fontSize: 12 }}>
            These are older IDs you used before. Keep them only if you want.
          </div>

          {SECTIONS_LEGACY.map((section) => {
            const isOpen = openKey === section.key;

            return (
              <div
                key={section.key}
                style={{
                  border: "1px solid rgb(var(--border))",
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "white",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenKey(isOpen ? "" : section.key)}
                  className="ds-btn"
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "none",
                    borderRadius: 0,
                    padding: "12px 14px",
                    background: "white",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "left" }}>
                    <span style={{ fontWeight: 700 }}>{section.title}</span>
                    {section.subtitle ? (
                      <span className="ds-subtitle" style={{ fontSize: 12 }}>
                        {section.subtitle}
                      </span>
                    ) : null}
                  </div>
                  <span style={{ color: "rgb(var(--muted))", fontSize: 12 }}>{isOpen ? "Close" : "Edit"}</span>
                </button>

                {isOpen && (
                  <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                    {section.items.map((item) => (
                      <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ fontSize: 12, color: "rgb(var(--muted))" }}>{item.label}</div>
                        <textarea
                          className="ds-textarea"
                          value={answers[item.id] || ""}
                          onChange={(e) => update(item.id, e.target.value)}
                          placeholder="Write here…"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action bar */}
        <div
          className="ds-card ds-card-pad"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
        >
          <button className="ds-btn ds-btn-primary" onClick={save} disabled={!loaded}>
            Save Changes
          </button>
          <div className="ds-subtitle" style={{ fontSize: 12 }}>
            {status || "Changes save locally for now."}
          </div>
        </div>

        <footer className="ds-subtitle" style={{ fontSize: 12, textAlign: "center" }}>
          This is a POC. The assistant is an AI representation and may be inaccurate.
        </footer>
      </div>
    </main>
  );
}