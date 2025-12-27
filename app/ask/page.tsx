export default function AskPage() {
  return (
    <main className="min-h-screen p-6 flex items-center justify-center">
      <div className="w-full max-w-xl space-y-4">
        <a href="/" className="text-sm underline">
          ← Back
        </a>

        <h1 className="text-2xl font-bold">Ask Me</h1>
        <p className="text-gray-600">
          Next step: connect AI so it can answer questions using your profile.
        </p>

        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-700">
            Placeholder. We’ll add chat UI here next.
          </p>
        </div>
      </div>
    </main>
  );
}