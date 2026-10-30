import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { JsonLd } from "@/components/structured-data";
import { SITE_DESCRIPTION, softwareApplicationSchema } from "@/lib/seo";

const TITLE = "Mino AI — an open-source Obsidian alternative";
const DESCRIPTION =
  "Mino AI is an open-source Obsidian alternative you host yourself: your Markdown vault on your server, with an AI agent that files, tags and links notes.";

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
