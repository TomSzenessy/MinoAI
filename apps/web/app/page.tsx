import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { JsonLd } from "@/components/structured-data";
import { SITE_DESCRIPTION, softwareApplicationSchema } from "@/lib/seo";

const TITLE = "Mino AI — AI notes that organize themselves";
const DESCRIPTION =
  "Mino AI is an agent-native, Markdown-first notebook: an AI that imports, tags and links your notes, plain .md files you own, and a self-hosted server in one container. Private beta — join the waitlist.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "https://mino.ink/" },
  keywords: [
    "Mino",
    "Mino AI",
    "mino app",
    "AI notes",
    "AI note taking",
    "markdown notes",
    "self-hosted notes",
    "agent-native",
    "MCP notes server",
    "second brain",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://mino.ink/",
    siteName: "Mino",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function HomePage() {
  return (
    <>
      {/* Organization and WebSite come from the root layout; the homepage
          adds only the application node so nothing is declared twice. */}
      <JsonLd data={softwareApplicationSchema} />
      <LandingPage />
    </>
  );
}
