"use client";

import { useEffect, useMemo, useState } from "react";
import { addCorrection, loadCorrections } from "../lib/pocStorage";

type AnswerMap = Record<string, string>;
type ChatMsg = {
  role: "user" | "assistant";
  text: string;
  meta?: {
    question?: string;
    usedProfile?: string;
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

// Very simple “profile builder” from saved answers
function buildProfileSummary(answers: AnswerMap) {
  const get = (id: string) => (answers[id] || "").trim();

  const identity1 = get("identity_1");
  const values1 = get("values_1");
  const values2 = get("values_2");
  const decisions1 = get("decisions_1");
  const decisions2 = get("decisions_2");
  const emotions1 = get("emotions_1");
  const emotions2 = get("emotions_2");
  const relationships1 = get("relationships_1");
  const relationships2 = get("relationships_2");
  const advice1 = get("advice_1");

  const lines = [
    identity1 && `Self-description: ${identity1}`,
    values1 && `Core values: ${values1}`,
    values2 && `Priority choice: ${values2}`,
    decisions1 && `Decision style: ${decisions1}`,
    decisions2 && `Decision speed: ${decisions2}`,
    emotions1 && `Calm under stress: ${emotions1}`,
    emotions2 && `Anger pattern: ${emotions2}`,
    relationships1 && `How you show love: ${relationships1}`,
    relationships2 && `Conflict style: ${relationships2}`,
    advice1 && `Repeated advice: ${advice1}`,
  ].filter(Boolean) as string[];

  const filled = Object.values(answers).filter((v) => (v || "").trim().length > 0).length;

  return { filled, lines, summary: lines.join("\n") };
}

function uid() {
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

// ✅ NEW: Send corrections in BODY (not headers)
function buildCorrectionsPayload(limit = 6) {
  return loadCorrections().slice(0, limit).map((c) => ({
    question: (c.question || "").slice(0, 220),
    aiAnswer: (c.aiAnswer || "").slice(0, 260),
    correctedAnswer: (c.correctedAnswer || "").slice(0, 320),
  }));
}

export default function AskPage() {
  const [answers, setAnswers] = useState<AnswerMap>({});
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
      text: "Ask a question. You can mark answers accurate or correct them. Corrections will improve future answers.",
    },
  ]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    setAnswers(safeParse(raw));
    setLoaded(true);
  }, []);

  const profile = useMemo(() => buildProfileSummary(answers), [answers]);

  async function send() {
    const q = input.trim();
    if (!q || isSending) return;

    setChat((prev) => [...prev, { role: "user", text: q }]);
    setInput("");

    const usedProfile = profile.summary || "";

    setChat((prev) => [
      ...prev,
      { role: "assistant", text: "Thinking…", meta: { question: q, usedProfile } },
    ]);

    setIsSending(true);

    try {
      // ✅ NEW: corrections go in JSON body (safe, no header size limits)
      const corrections = buildCorrectionsPayload(6);

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: q,
          profileSummary: profile.summary,
          corrections, // ✅ send to backend
        }),
      });

      const data = await res.json();

      setChat((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          text:
            data?.answer ||
            data?.error ||
            "No answer returned. (Check /api/ask and your GROQ_API_KEY)",
          meta: { question: q, usedProfile },
        };
        return copy;
      });
    } catch {
      setChat((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          text: "Network error calling the AI route.",
          meta: { question: q, usedProfile },
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
    <main className="min-h-screen p-6 flex items-start justify-center">
      <div className="w-full max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <a href="/" className="text-sm underline">
            ← Back
          </a>
          <div className="flex gap-3">
            <a href="/profile" className="text-sm underline">
              My Profile →
            </a>
            <a href="/interview" className="text-sm underline">
              Edit Interview →
            </a>
          </div>
        </div>

        <header className="space-y-2">
          <h1 className="text-2xl font-bold">Ask Me</h1>
          <p className="text-gray-600">Real chat + corrections training loop.</p>
        </header>

        <div className="rounded-xl border p-4 space-y-2">
          <div className="text-sm font-semibold">Profile Status</div>
          {!loaded ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : (
            <div className="text-sm text-gray-700">
              Answers saved: <span className="font-semibold">{profile.filled}</span>
              <div className="mt-2 whitespace-pre-wrap text-xs text-gray-600 border rounded-lg p-3">
                {profile.summary || "No profile saved yet. Go to Interview and click Save."}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border overflow-hidden">
          <div className="max-h-[460px] overflow-auto p-4 space-y-3">
            {chat.map((m, idx) => (
              <div key={idx} className="space-y-2">
                <div
                  className={`rounded-xl border p-3 text-sm whitespace-pre-wrap ${
                    m.role === "user" ? "bg-gray-50" : ""
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {m.role === "user" ? "You" : "Assistant"}
                  </div>
                  {m.text}
                </div>

                {m.role === "assistant" && m.meta?.question && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="text-xs rounded-lg border px-3 py-1 hover:bg-gray-50"
                      onClick={() => alert("✅ Noted as accurate (we’ll store this later).")}
                    >
                      ✅ Accurate
                    </button>

                    <button
                      className="text-xs rounded-lg border px-3 py-1 hover:bg-gray-50"
                      onClick={() => openCorrection(m.meta!.question!, m.text)}
                    >
                      ❌ Not me (correct)
                    </button>

                    <button
                      className="text-xs rounded-lg border px-3 py-1 hover:bg-gray-50"
                      onClick={() => toggleWhy(idx)}
                    >
                      🧠 Why
                    </button>
                  </div>
                )}

                {m.role === "assistant" && whyOpen[idx] && (
                  <div className="rounded-xl border p-3 text-xs text-gray-700 whitespace-pre-wrap">
                    <div className="font-semibold mb-2">Why this answer:</div>
                    <div className="text-gray-600">The assistant used your saved profile summary:</div>
                    <div className="mt-2 border rounded-lg p-3 text-gray-600 whitespace-pre-wrap">
                      {m.meta?.usedProfile || "(No profile summary available.)"}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t p-3 flex gap-2">
            <input
              className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              placeholder="Type a question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              disabled={isSending}
            />
            <button
              onClick={send}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 transition disabled:opacity-50"
              disabled={isSending}
            >
              {isSending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>

        <footer className="text-center text-xs text-gray-500">
          This is a POC. The assistant is an AI representation and may be inaccurate.
        </footer>

        {correctionOpen && correctionTarget && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Correct the AI</div>
                <button className="text-sm underline" onClick={() => setCorrectionOpen(false)}>
                  Close
                </button>
              </div>

              <div className="text-xs text-gray-600">Question</div>
              <div className="rounded-lg border p-3 text-sm whitespace-pre-wrap">
                {correctionTarget.question}
              </div>

              <div className="text-xs text-gray-600">AI Answer</div>
              <div className="rounded-lg border p-3 text-sm whitespace-pre-wrap">
                {correctionTarget.aiAnswer}
              </div>

              <div className="text-xs text-gray-600">What would YOU say instead?</div>
              <textarea
                className="w-full min-h-[120px] rounded-lg border p-3 text-sm outline-none focus:ring-2"
                value={correctionDraft}
                onChange={(e) => setCorrectionDraft(e.target.value)}
                placeholder="Write your corrected answer…"
              />

              <div className="flex justify-end gap-2">
                <button
                  className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => setCorrectionOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={saveCorrection}
                >
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