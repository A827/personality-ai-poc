// app/layout.tsx
import "./globals.css";
import TopNav from "./components/TopNav";
import StartGuard from "./components/StartGuard";

export const metadata = {
  title: "Personality AI (POC)",
  description: "Interview → personality profile → ask questions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <main className="ds-page">
          <div className="ds-shell">
            <StartGuard />
            <TopNav />
            <div style={{ height: 16 }} />
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}