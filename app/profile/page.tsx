"use client";

import { useEffect, useState } from "react";

type AnswerMap = Record<string, string>;

const STORAGE_KEY = "poc_personality_answers_v1";

export default function ProfilePage() {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [loaded, setLoaded] = useState(false);

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

  const entries = Object.entries(answers).filter(([, v]) => (v || "").trim().length > 0);

  return (
    <main className="min-h-screen p-6 flex items-start justify-center">
      <div className="w-full max-w-2xl space-y-5">
        <a href="/" className="text-sm underline">
          ← Back
        </a>

        <header className="space-y-2">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-gray-600">
            This page shows what you saved from the interview (stored locally in your browser).
          </p>
        </header>

        {!loaded ? (
          <div className="rounded-xl border p-4">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border p-4 space-y-2">
            <p className="text-sm text-gray-700">No answers saved yet.</p>
            <a className="underline text-sm" href="/interview">
              Go to Interview →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map(([key, value]) => (
              <div key={key} className="rounded-xl border p-4 space-y-2">
                <div className="text-xs text-gray-500">ID: {key}</div>
                <div className="whitespace-pre-wrap text-sm text-gray-800">{value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border p-4 text-sm text-gray-700">
          Next: we’ll use this profile to answer questions on <a className="underline" href="/ask">Ask Me</a>.
        </div>
      </div>
    </main>
  );
}