// app/layout.tsx
import "./globals.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}