export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Personality AI (POC)</h1>
          <p className="text-gray-600">
            Proof of concept: interview → personality profile → ask questions.
          </p>
        </header>

        <div className="grid gap-3">
          <a
            href="/interview"
            className="rounded-xl border p-4 hover:bg-gray-50 transition"
          >
            <div className="font-semibold">Start Interview</div>
            <div className="text-sm text-gray-600">
              Answer questions so the AI learns your style.
            </div>
          </a>

          <a
            href="/ask"
            className="rounded-xl border p-4 hover:bg-gray-50 transition"
          >
            <div className="font-semibold">Ask Me</div>
            <div className="text-sm text-gray-600">
              Ask a question and get an answer “as you”.
            </div>
          </a>

          <a
            href="/profile"
            className="rounded-xl border p-4 hover:bg-gray-50 transition"
          >
            <div className="font-semibold">My Profile</div>
            <div className="text-sm text-gray-600">
              View and edit your saved personality data.
            </div>
          </a>
        </div>

        <footer className="text-center text-xs text-gray-500">
          This is an AI representation, not a real person. (POC)
        </footer>
      </div>
    </main>
  );
}