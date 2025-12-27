export default function ProfilePage() {
  return (
    <main className="min-h-screen p-6 flex items-center justify-center">
      <div className="w-full max-w-xl space-y-4">
        <a href="/" className="text-sm underline">
          ← Back
        </a>

        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-gray-600">
          Next step: show saved personality answers and allow edits.
        </p>

        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-700">
            Placeholder. We’ll show your stored profile here soon.
          </p>
        </div>
      </div>
    </main>
  );
}