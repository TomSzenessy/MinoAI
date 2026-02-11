import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mino",
  description: "Agent-first, markdown-based knowledge platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
