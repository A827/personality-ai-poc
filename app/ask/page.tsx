// app/ask/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { addCorrection, loadCorrections } from "../lib/pocStorage";

type AnswerMap = Record<string, string>;

type MyAccount = {
  displayName: string;
  bio?: string;
};

type ConnectionRole =
  | "Father"
  | "Mother"
  | "Partner"
  | "Friend"
  | "Sibling"
  | "Child"
  | "Other";

type Connection = {
  id: string;
  name: string;
  role: ConnectionRole;
  inviteCode: string;
  createdAt: number;
};

type Speaker =
  | { kind: "me"; label: string }
  | { kind: "connection"; id: string; label: string; role: ConnectionRole };

type Target =
  | { kind: "me"; label: string }
  | { kind: "connection"; id: string; label: string; role: ConnectionRole };

type ChatMsg = {
  role: "user" | "assistant";
  text: string;
  meta?: {
    question?: string;
    usedProfile?: string;
    usedPersona?: string;
  };
};

const STORAGE_KEY = "poc_personality_answers_v1";
const PERSONA_KEY = "poc_persona_v1";
const CONNECTIONS_KEY = "poc_connections_v1";
const SPEAKER_KEY = "poc_selected_speaker_v1";
const TARGET_KEY = "poc_selected_target_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function buildPersonaSummary(
  account: MyAccount | null,
  speaker: Speaker | null,
  target: Target | null
) {
  const meName = (account?.displayName || "").trim() || "Me";

  const speakerLine =
    !speaker || speaker.kind === "me"
      ? `Speaker: Me (${meName})`
      : `Speaker: ${speaker.label} (${speaker.role})`;

  const targetLine =
    !target || target.kind === "me"
      ? `Target: Me (${meName})`
      : `Target: ${target.label} (${target.role})`;

  const bio = (account?.bio || "").trim();
  const notes = bio ? `My notes: ${bio}` : "";

  return [speakerLine, targetLine, notes].filter(Boolean).join("\n");
}

// ✅ Build the persona OBJECT the backend expects (speaker/target included)
function buildPersonaObject(
  account: MyAccount | null,
  speaker: Speaker | null,
  target: Target | null
) {
  const meName = (account?.displayName || "").trim() || "Me";

  const speakerText =
    !speaker || speaker.kind === "me"
      ? `Me (${meName})`
      : `${speaker.label} (${speaker.role})`;

  const targetText =
    !target || target.kind === "me"
      ? `Me (${meName})`
      : `${target.label} (${target.role})`;

  return {
    name: meName,
    relationship: "Me" as const, // keep simple for now
    tone: "Warm" as const, // keep simple for now
    description: (account?.bio || "").trim(),
    speaker: speakerText,
    target: targetText,
  };
}

/**
 * ✅ Profile summary supports:
 * - NEW interview IDs (identity_words, identity_tone, etc.)
 * - OLD interview IDs (identity_1, values_1, etc.) as fallback
 */
function buildProfileSummary(answers: AnswerMap) {
  const get = (id: string) => (answers[id] || "").trim();

  // pick() = use the first non-empty value among multiple possible IDs
  const pick = (...ids: string[]) => {
    for (const id of ids) {
      const v = get(id);
      if (v) return v;
    }
    return "";
  };

  // Turn choice codes into nice labels (so the system prompt is human-readable)
  const mapChoice = (value: string, map: Record<string, string>) =>
    map[value] || value;

  // NEW ids (with fallback to old ids)
  const identityWords = pick("identity_words", "identity_1");
  const identityTone = pick("identity_tone");
  const identityConfidence = pick("identity_confidence");
  const identityEnergy = pick("identity_energy");
  const pride = pick("identity_pride");

  const valuesTop3 = pick("values_top3", "values_1");
  const valuesChoice = pick("values_choice", "values_2");
  const valuesRisk = pick("values_risk");
  const valuesFairness = pick("values_fairness");
  const valuesNonneg = pick("values_nonnegotiable");

  const decisionSpeed = pick("decisions_speed", "decisions_2");
  const decisionStyle = pick("decisions_style", "decisions_1");
  const decisionPressure = pick("decisions_pressure");
  const decisionRegret = pick("decisions_regret");
  const decisionExample = pick("decisions_example");

  const calm = pick("emotions_calm", "emotions_1");
  const stressLevel = pick("emotions_stress_level");
  const angerStyle = pick("emotions_anger_style", "emotions_2");
  const apology = pick("emotions_apology");
  const trigger = pick("emotions_trigger");

  const loveLanguage = pick("relationships_love_language", "relationships_1");
  const conflict = pick("relationships_conflict", "relationships_2");
  const feedback = pick("relationships_feedback");
  const trust = pick("relationships_trust");
  const advice = pick("relationships_advice", "advice_1");

  // Maps for some choice codes (optional, but improves prompt quality)
  const toneLabel = identityTone
    ? mapChoice(identityTone, {
        warm: "Warm & friendly",
        direct: "Direct & clear",
        funny: "Playful & funny",
        formal: "Formal & respectful",
        quiet: "Quiet & minimal words",
      })
    : "";

  const valuesChoiceLabel = valuesChoice
    ? mapChoice(valuesChoice, {
        family: "Family",
        freedom: "Freedom",
        money: "Money / security",
        status: "Status / respect",
        peace: "Peace / stability",
      })
    : "";

  const decisionSpeedLabel = decisionSpeed
    ? mapChoice(decisionSpeed, {
        fast: "Fast decision-maker",
        balanced: "Balanced (depends on topic)",
        slow: "Slow decision-maker",
      })
    : "";

  const decisionStyleLabel = decisionStyle
    ? mapChoice(decisionStyle, {
        logic: "Logic & numbers",
        gut: "Gut feeling",
        advice: "Advice from trusted people",
        experience: "Past experience",
        research: "Research & comparison",
      })
    : "";

  const angerStyleLabel = angerStyle
    ? mapChoice(angerStyle, {
        silent: "Go quiet",
        direct: "Say it directly",
        explode: "Explode then regret",
        cold: "Become cold / distant",
        joke: "Use humor to cover it",
      })
    : "";

  const loveLanguageLabel = loveLanguage
    ? mapChoice(loveLanguage, {
        actions: "Actions / helping",
        words: "Words / reassurance",
        time: "Quality time",
        gifts: "Gifts",
        touch: "Physical touch",
      })
    : "";

  const conflictLabel = conflict
    ? mapChoice(conflict, {
        solve: "Solve it immediately",
        cooldown: "Need time to cool down",
        avoid: "Avoid conflict",
        win: "Need to be right / win",
        compromise: "Compromise quickly",
      })
    : "";

  // Build lines (keep them short and "signal-rich")
  const lines = [
    identityWords && `Identity words: ${identityWords}`,
    toneLabel && `Speaking tone: ${toneLabel}`,
    identityConfidence && `Confidence (1–5): ${identityConfidence}`,
    identityEnergy && `Energy (1–5): ${identityEnergy}`,
    pride && `Most proud of: ${pride}`,

    valuesTop3 && `Top values: ${valuesTop3}`,
    valuesChoiceLabel && `Main priority: ${valuesChoiceLabel}`,
    valuesRisk && `Risk comfort (1–5): ${valuesRisk}`,
    valuesFairness && `When unfair: ${valuesFairness}`,
    valuesNonneg && `Non-negotiable boundary: ${valuesNonneg}`,

    decisionSpeedLabel && `Decision speed: ${decisionSpeedLabel}`,
    decisionStyleLabel && `Decision style: ${decisionStyleLabel}`,
    decisionPressure && `Under pressure: ${decisionPressure}`,
    decisionRegret && `Regret tendency (1–5): ${decisionRegret}`,
    decisionExample && `Good recent decision: ${decisionExample}`,

    calm && `Calms down by: ${calm}`,
    stressLevel && `Stress lately (1–5): ${stressLevel}`,
    angerStyleLabel && `When angry: ${angerStyleLabel}`,
    apology && `Apologizing (1–5): ${apology}`,
    trigger && `Quick trigger: ${trigger}`,

    loveLanguageLabel && `Shows love via: ${loveLanguageLabel}`,
    conflictLabel && `Conflict style: ${conflictLabel}`,
    feedback && `Prefers feedback: ${feedback}`,
    trust && `Trust speed (1–5): ${trust}`,
    advice && `Repeated advice: ${advice}`,
  ].filter(Boolean) as string[];

  const filled = Object.values(answers).filter(
    (v) => (v || "").trim().length > 0
  ).length;

  return { filled, lines, summary: lines.join("\n") };
}

function uid() {
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

// ✅ Corrections sent in BODY (safe, scalable)
function buildCorrectionsPayload(limit = 6) {
  return loadCorrections()
    .slice(0, limit)
    .map((c) => ({
      question: (c.question || "").slice(0, 220),
      aiAnswer: (c.aiAnswer || "").slice(0, 260),
      correctedAnswer: (c.correctedAnswer || "").slice(0, 320),
    }));
}

export default function AskPage() {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [account, setAccount] = useState<MyAccount | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Correction modal
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionDraft, setCorrectionDraft] = useState("");
  const [correctionTarget, setCorrectionTarget] = useState<{
    question: string;
    aiAnswer: string;
  } | null>(null);

  // “Why” toggle per message index
  const [whyOpen, setWhyOpen] = useState<Record<number, boolean>>({});

  const [chat, setChat] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text: "Ask a question. Choose who you’re speaking as, and who you’re asking about.",
    },
  ]);

  useEffect(() => {
    setAnswers(safeParse<AnswerMap>(localStorage.getItem(STORAGE_KEY), {}));
    setAccount(
      safeParse<MyAccount | null>(localStorage.getItem(PERSONA_KEY), null)
    );
    setConnections(
      safeParse<Connection[]>(localStorage.getItem(CONNECTIONS_KEY), [])
    );

    const savedSpeaker = safeParse<any>(
      localStorage.getItem(SPEAKER_KEY),
      null
    );
    if (savedSpeaker?.kind === "me") setSpeaker({ kind: "me", label: "Me" });
    else if (savedSpeaker?.kind === "connection")
      setSpeaker(savedSpeaker as Speaker);
    else setSpeaker({ kind: "me", label: "Me" });

    const savedTarget = safeParse<any>(
      localStorage.getItem(TARGET_KEY),
      null
    );
    if (savedTarget?.kind === "me") setTarget({ kind: "me", label: "Me" });
    else if (savedTarget?.kind === "connection")
      setTarget(savedTarget as Target);
    else setTarget({ kind: "me", label: "Me" });

    setLoaded(true);
  }, []);

  // Validate saved speaker/target against current connections
  useEffect(() => {
    if (!loaded) return;

    setSpeaker((prev) => {
      if (!prev) return { kind: "me", label: "Me" };
      if (prev.kind === "me") return prev;
      const found = connections.find((c) => c.id === prev.id);
      if (!found) return { kind: "me", label: "Me" };
      return {
        kind: "connection",
        id: found.id,
        label: found.name,
        role: found.role,
      };
    });

    setTarget((prev) => {
      if (!prev) return { kind: "me", label: "Me" };
      if (prev.kind === "me") return prev;
      const found = connections.find((c) => c.id === prev.id);
      if (!found) return { kind: "me", label: "Me" };
      return {
        kind: "connection",
        id: found.id,
        label: found.name,
        role: found.role,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, connections.length]);

  const profile = useMemo(() => buildProfileSummary(answers), [answers]);

  // ✅ Guardrails: require Account name + minimum interview answers
  const displayName = (account?.displayName || "").trim();
  const MIN_INTERVIEW_ANSWERS = 3;

  const needsAccount = loaded && displayName.length === 0;
  const needsInterview = loaded && profile.filled < MIN_INTERVIEW_ANSWERS;
  const isGated = needsAccount || needsInterview;

  const speakersList = useMemo(() => {
    const meLabel = (account?.displayName || "").trim()
      ? `Me (${account!.displayName.trim()})`
      : "Me";
    const list: Speaker[] = [{ kind: "me", label: meLabel }];
    for (const c of connections)
      list.push({ kind: "connection", id: c.id, label: c.name, role: c.role });
    return list;
  }, [account, connections]);

  const targetsList = useMemo(() => {
    const meLabel = (account?.displayName || "").trim()
      ? `Me (${account!.displayName.trim()})`
      : "Me";
    const list: Target[] = [{ kind: "me", label: meLabel }];
    for (const c of connections)
      list.push({ kind: "connection", id: c.id, label: c.name, role: c.role });
    return list;
  }, [account, connections]);

  const personaSummary = useMemo(
    () => buildPersonaSummary(account, speaker, target),
    [account, speaker, target]
  );

  function persistSpeaker(next: Speaker) {
    setSpeaker(next);
    localStorage.setItem(SPEAKER_KEY, JSON.stringify(next));
  }

  function persistTarget(next: Target) {
    setTarget(next);
    localStorage.setItem(TARGET_KEY, JSON.stringify(next));
  }

  async function send() {
    const q = input.trim();
    if (!q || isSending || isGated) return;

    setChat((prev) => [...prev, { role: "user", text: q }]);
    setInput("");

    const usedProfile = profile.summary || "";
    const usedPersona = personaSummary || "";

    setChat((prev) => [
      ...prev,
      {
        role: "assistant",
        text: "Thinking…",
        meta: { question: q, usedProfile, usedPersona },
      },
    ]);

    setIsSending(true);

    try {
      const corrections = buildCorrectionsPayload(6);
      const personaObj = buildPersonaObject(account, speaker, target);

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          profileSummary: profile.summary,
          persona: personaObj,
          corrections,
        }),
      });

      const data = await res.json();

      setChat((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          text: data?.answer || data?.error || "No answer returned.",
          meta: { question: q, usedProfile, usedPersona },
        };
        return copy;
      });
    } catch {
      setChat((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          text: "Network error calling the AI route.",
          meta: { question: q, usedProfile, usedPersona },
        };
        return copy;
      });
    } finally {
      setIsSending(false);
    }
  }

  function toggleWhy(index: number) {
    setWhyOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  function openCorrection(question: string, aiAnswer: string) {
    setCorrectionTarget({ question, aiAnswer });
    setCorrectionDraft("");
    setCorrectionOpen(true);
  }

  function saveCorrection() {
    if (!correctionTarget) return;
    const corrected = correctionDraft.trim();
    if (!corrected) return;

    addCorrection({
      id: uid(),
      question: correctionTarget.question,
      aiAnswer: correctionTarget.aiAnswer,
      correctedAnswer: corrected,
      createdAt: Date.now(),
    });

    setCorrectionOpen(false);
    setCorrectionTarget(null);
    setCorrectionDraft("");
    alert("✅ Saved correction. Next answers will be influenced by your corrections.");
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
            <a href="/persona" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Account
            </a>
            <a href="/interview" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Interview
            </a>
            <a href="/connections" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Connections
            </a>
            <a
              href="/ask"
              style={{ fontSize: 13, color: "rgb(var(--text))", fontWeight: 600 }}
            >
              Ask
            </a>
            <a href="/profile" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Profile
            </a>
          </div>
        </div>

        <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 className="ds-h1">Ask</h1>
          <p className="ds-subtitle">Always visible: Talk as + Ask about.</p>
        </header>

        {/* ✅ Setup Gate (friendly) */}
        {isGated && (
          <div className="ds-card ds-card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontWeight: 800 }}>Setup required</div>

            {needsAccount && (
              <div className="ds-subtitle">
                Your Account name is missing. Please set your display name first.
              </div>
            )}

            {needsInterview && (
              <div className="ds-subtitle">
                Your Interview profile is too empty ({profile.filled}/{MIN_INTERVIEW_ANSWERS}). Fill at least{" "}
                {MIN_INTERVIEW_ANSWERS} answers.
              </div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {needsAccount && (
                <a className="ds-btn ds-btn-primary" href="/persona">
                  Go to Account
                </a>
              )}
              {needsInterview && (
                <a className="ds-btn ds-btn-primary" href="/interview">
                  Go to Interview
                </a>
              )}
              <a className="ds-btn" href="/profile">
                View Profile
              </a>
            </div>

            <div className="ds-subtitle" style={{ fontSize: 12 }}>
              Asking is disabled until setup is complete.
            </div>
          </div>
        )}

        {/* Talk as + Ask about */}
        <div
          className="ds-card ds-card-pad"
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          <div style={{ fontWeight: 700 }}>Conversation Settings</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div className="ds-subtitle" style={{ fontSize: 12, marginBottom: 6 }}>
                Talk as
              </div>
              <select
                className="ds-input"
                value={speaker?.kind === "connection" ? `c:${speaker.id}` : "me"}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "me") return persistSpeaker({ kind: "me", label: "Me" });
                  const id = v.slice(2);
                  const found = connections.find((c) => c.id === id);
                  if (found)
                    persistSpeaker({
                      kind: "connection",
                      id: found.id,
                      label: found.name,
                      role: found.role,
                    });
                  else persistSpeaker({ kind: "me", label: "Me" });
                }}
                disabled={!loaded}
              >
                {speakersList.map((s) =>
                  s.kind === "me" ? (
                    <option key="me" value="me">
                      {s.label}
                    </option>
                  ) : (
                    <option key={s.id} value={`c:${s.id}`}>
                      {s.label} ({s.role})
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <div className="ds-subtitle" style={{ fontSize: 12, marginBottom: 6 }}>
                Ask about
              </div>
              <select
                className="ds-input"
                value={target?.kind === "connection" ? `c:${target.id}` : "me"}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "me") return persistTarget({ kind: "me", label: "Me" });
                  const id = v.slice(2);
                  const found = connections.find((c) => c.id === id);
                  if (found)
                    persistTarget({
                      kind: "connection",
                      id: found.id,
                      label: found.name,
                      role: found.role,
                    });
                  else persistTarget({ kind: "me", label: "Me" });
                }}
                disabled={!loaded}
              >
                {targetsList.map((t) =>
                  t.kind === "me" ? (
                    <option key="t-me" value="me">
                      {t.label}
                    </option>
                  ) : (
                    <option key={`t-${t.id}`} value={`c:${t.id}`}>
                      {t.label} ({t.role})
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="ds-bubble ds-bubble-user" style={{ whiteSpace: "pre-wrap" }}>
            {!loaded ? "Loading…" : personaSummary}
          </div>
        </div>

        {/* Profile status */}
        <div className="ds-card ds-card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 700 }}>Profile Status</div>
            <a href="/interview" style={{ fontSize: 12, color: "rgb(var(--muted))" }}>
              Edit →
            </a>
          </div>

          {!loaded ? (
            <div className="ds-subtitle">Loading…</div>
          ) : (
            <>
              <div className="ds-subtitle" style={{ fontSize: 12 }}>
                Answers saved:{" "}
                <span style={{ color: "rgb(var(--text))", fontWeight: 700 }}>
                  {profile.filled}
                </span>
              </div>

              <div className="ds-bubble ds-bubble-user" style={{ whiteSpace: "pre-wrap" }}>
                {profile.summary || "No profile saved yet. Go to Interview and click Save."}
              </div>
            </>
          )}
        </div>

        {/* Chat */}
        <div className="ds-card" style={{ overflow: "hidden" }}>
          <div className="max-h-[460px] overflow-auto p-4 space-y-3">
            {chat.map((m, idx) => (
              <div key={idx} className="space-y-2">
                <div className={`ds-bubble ${m.role === "user" ? "ds-bubble-user" : ""}`}>
                  <div className="text-xs mb-1" style={{ color: "rgb(var(--muted))" }}>
                    {m.role === "user" ? "You" : "Assistant"}
                  </div>
                  {m.text}
                </div>

                {m.role === "assistant" && m.meta?.question && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="ds-btn ds-btn-xs"
                      onClick={() => alert("✅ Noted as accurate (we’ll store this later).")}
                    >
                      ✅ Accurate
                    </button>

                    <button
                      className="ds-btn ds-btn-xs"
                      onClick={() => openCorrection(m.meta!.question!, m.text)}
                    >
                      ❌ Not me (correct)
                    </button>

                    <button className="ds-btn ds-btn-xs" onClick={() => toggleWhy(idx)}>
                      🧠 Why
                    </button>
                  </div>
                )}

                {m.role === "assistant" && whyOpen[idx] && (
                  <div className="ds-card ds-card-pad" style={{ boxShadow: "none" }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Why this answer</div>

                    <div className="ds-subtitle" style={{ fontSize: 12 }}>
                      Context used:
                    </div>
                    <div className="ds-bubble ds-bubble-user" style={{ whiteSpace: "pre-wrap" }}>
                      {m.meta?.usedPersona || "(No persona/target)"}{" "}
                    </div>

                    <div className="ds-subtitle" style={{ fontSize: 12, marginTop: 10 }}>
                      Profile summary used:
                    </div>
                    <div className="ds-bubble ds-bubble-user" style={{ whiteSpace: "pre-wrap" }}>
                      {m.meta?.usedProfile || "(No profile summary)"}{" "}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t p-3 flex gap-2">
            <input
              className="ds-input"
              placeholder={isGated ? "Complete setup to ask…" : "Type a question…"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              disabled={isSending || isGated}
            />
            <button
              className="ds-btn ds-btn-primary"
              onClick={send}
              disabled={isSending || isGated}
            >
              {isSending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>

        <footer className="ds-subtitle" style={{ fontSize: 12, textAlign: "center" }}>
          This is a POC. The assistant is an AI representation and may be inaccurate.
        </footer>

        {correctionOpen && correctionTarget && (
          <div className="ds-overlay">
            <div className="ds-modal" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="flex items-center justify-between">
                <div className="font-semibold">Correct the AI</div>
                <button className="text-sm underline" onClick={() => setCorrectionOpen(false)}>
                  Close
                </button>
              </div>

              <div className="ds-subtitle" style={{ fontSize: 12 }}>
                Question
              </div>
              <div className="ds-bubble" style={{ whiteSpace: "pre-wrap" }}>
                {correctionTarget.question}
              </div>

              <div className="ds-subtitle" style={{ fontSize: 12 }}>
                AI Answer
              </div>
              <div className="ds-bubble" style={{ whiteSpace: "pre-wrap" }}>
                {correctionTarget.aiAnswer}
              </div>

              <div className="ds-subtitle" style={{ fontSize: 12 }}>
                What would YOU say instead?
              </div>
              <textarea
                className="ds-textarea"
                value={correctionDraft}
                onChange={(e) => setCorrectionDraft(e.target.value)}
                placeholder="Write your corrected answer…"
              />

              <div className="flex justify-end gap-2">
                <button className="ds-btn" onClick={() => setCorrectionOpen(false)}>
                  Cancel
                </button>
                <button className="ds-btn ds-btn-primary" onClick={saveCorrection}>
                  Save Correction
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}