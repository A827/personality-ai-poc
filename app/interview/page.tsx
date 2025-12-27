"use client";

import { useEffect, useMemo, useState } from "react";

type AnswerMap = Record<string, string>;

const STORAGE_KEY = "poc_personality_answers_v1";

export default function InterviewPage() {
  const questions = useMemo(
    () => [
      { id: "values_1", q: "What matters most to you in life?" },
      { id: "values_2", q: "When you have to choose, do you prioritize family, money, or freedom? Why?" },
      { id: "decisions_1", q: "How do you usually make big decisions?" },
      { id: "decisions_2", q: "Do you act quickly or think for a long time first?" },
      { id: "emotions_1", q: "What makes you feel calm when life is stressful?" },
      { id: "emotions_2", q: "When you are angry, how do you normally behave?" },
      { id: "relationships_1", q: "How do you show love to people you care about?" },
      { id: "relationships_2", q: "How do you handle conflict with someone close to you?" },
      { id: "identity_1", q: "What are 3 words that describe you best?" },
      { id: "advice_1", q: "What advice do you repeat often to people you love?" },
    ],
    []
  );

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<string>("");

  // ✅ Load localStorage AFTER mount to avoid hydration mismatch
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setAnswers(raw ? JSON.parse(raw) : {});
    } catch {
      setAnswers({});
    } finally {
      setLoaded(true);
    }
  }, []);

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
      setStatus("✅ Saved locally.");
      setTimeout(() => setStatus(""), 1500);
    } catch {
      setStatus("❌ Could not save. (localStorage error)");
    }
  }

  function clearAll() {
    if (!confirm("Clear all saved answers?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
    setStatus("🗑️ Cleared.");
    setTimeout(() => setStatus(""), 1500);
  }

  const filledCount = questions.filter((x) => (answers[x.id] || "").trim().length > 0).length;

  return (
    <main className="min-h-screen p-6 flex items-start justify-center">
      <div className="w-full max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <a href="/" className="text-sm underline">
            ← Back
          </a>

          {/* ✅ Only show counts after client has loaded localStorage */}
          <div className="text-sm text-gray-600">
            {loaded ? (
              <>
                Completed: <span className="font-semibold">{filledCount}</span> / {questions.length}
              </>
            ) : (
              <>Loading…</>
            )}
          </div>
        </div>

        <header className="space-y-2">
          <h1 className="text-2xl font-bold">Interview</h1>
          <p className="text-gray-600">
            Answer these to build your “personality profile”. For now, answers are saved locally in your browser.
          </p>
        </header>

        {!loaded ? (
          <div className="rounded-xl border p-4 text-sm text-gray-700">Loading your saved answers…</div>
        ) : (
          <div className="space-y-4">
            {questions.map((item, idx) => (
              <div key={item.id} className="rounded-xl border p-4 space-y-2">
                <div className="font-semibold">
                  {idx + 1}. {item.q}
                </div>
                <textarea
                  className="w-full min-h-[90px] rounded-lg border p-3 outline-none focus:ring-2"
                  placeholder="Type your answer..."
                  value={answers[item.id] || ""}
                  onChange={(e) => setAnswer(item.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              onClick={save}
              className="rounded-xl border px-4 py-2 hover:bg-gray-50 transition disabled:opacity-50"
              disabled={!loaded}
            >
              Save
            </button>
            <button
              onClick={clearAll}
              className="rounded-xl border px-4 py-2 hover:bg-gray-50 transition disabled:opacity-50"
              disabled={!loaded}
            >
              Clear
            </button>
          </div>

          <div className="text-sm text-gray-600">{status}</div>
        </div>

        <div className="rounded-xl border p-4 text-sm text-gray-700">
          Next: go to <a className="underline" href="/profile">My Profile</a> to see what you saved.
        </div>
      </div>
    </main>
  );
}