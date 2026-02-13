import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mino.ink"),
  title: {
    default: "Mino",
    template: "%s · Mino",
  },
  description: "Agent-first, markdown-based knowledge platform.",
  applicationName: "Mino",
  keywords: ["Mino", "markdown", "knowledge base", "self-hosted", "AI agent", "notes"],
  openGraph: {
    title: "Mino",
    description: "Agent-first, markdown-based knowledge platform.",
    type: "website",
    url: "https://mino.ink",
    siteName: "Mino",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mino",
    description: "Agent-first, markdown-based knowledge platform.",
  },
  robots: {
    index: true,
    follow: true,
  },
  referrer: "strict-origin-when-cross-origin",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@100..800&family=Space+Grotesk:wght@300..700&display=swap"
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
