"use client";

import { useEffect, useMemo, useState } from "react";

type AnswerMap = Record<string, string>;
type ChatMsg = { role: "user" | "assistant"; text: string };

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

  const values1 = get("values_1");
  const values2 = get("values_2");
  const decisions1 = get("decisions_1");
  const decisions2 = get("decisions_2");
  const emotions1 = get("emotions_1");
  const emotions2 = get("emotions_2");
  const relationships1 = get("relationships_1");
  const relationships2 = get("relationships_2");
  const identity1 = get("identity_1");
  const advice1 = get("advice_1");

  const filled = Object.values(answers).filter((v) => (v || "").trim().length > 0).length;

  return {
    filled,
    summary: [
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
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

// Mock “personality answer” (free placeholder)
// We intentionally do NOT claim to be the real person.
function generateMockAnswer(profileSummary: string, userQuestion: string) {
  const trimmed = userQuestion.trim();
  if (!trimmed) return "Ask me anything.";

  return [
    "Here’s a *mock* response based on your saved interview (no real AI connected yet):",
    "",
    "What I’m considering about you:",
    profileSummary ? profileSummary : "(No profile saved yet — go complete the Interview.)",
    "",
    "Answer (style-matched as best as possible):",
    `If I were answering this based on my values and habits, I’d approach it like this: ${trimmed}`,
    "",
    "Next upgrade: connect a real AI model so this becomes truly personalized and consistent.",
  ].join("\n");
}

export default function AskPage() {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [loaded, setLoaded] = useState(false);

  const [input, setInput] = useState("");
  const [chat, setChat] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text: "Ask a question. For now this uses a FREE mock responder. Next we’ll connect real AI.",
    },
  ]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    setAnswers(safeParse(raw));
    setLoaded(true);
  }, []);

  const profile = useMemo(() => buildProfileSummary(answers), [answers]);

  function send() {
    const q = input.trim();
    if (!q) return;

    setChat((prev) => [...prev, { role: "user", text: q }]);
    setInput("");

    const reply = generateMockAnswer(profile.summary, q);
    setChat((prev) => [...prev, { role: "assistant", text: reply }]);
  }

  return (
    <main className="min-h-screen p-6 flex items-start justify-center">
      <div className="w-full max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <a href="/" className="text-sm underline">
            ← Back
          </a>
          <a href="/interview" className="text-sm underline">
            Edit Interview →
          </a>
        </div>

        <header className="space-y-2">
          <h1 className="text-2xl font-bold">Ask Me</h1>
          <p className="text-gray-600">
            This is the chat experience. Right now it’s a mock responder (free). Next we connect real AI.
          </p>
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
          <div className="max-h-[420px] overflow-auto p-4 space-y-3">
            {chat.map((m, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-3 text-sm whitespace-pre-wrap ${
                  m.role === "user" ? "bg-gray-50" : ""
                }`}
              >
                <div className="text-xs text-gray-500 mb-1">
                  {m.role === "user" ? "You" : "Assistant"}
                </div>
                {m.text}
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
            />
            <button
              onClick={send}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 transition"
            >
              Send
            </button>
          </div>
        </div>

        <footer className="text-center text-xs text-gray-500">
          This is a POC. The assistant is an AI representation and may be inaccurate.
        </footer>
      </div>
    </main>
  );
}