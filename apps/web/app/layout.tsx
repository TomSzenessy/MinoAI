import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/app-providers";
import { JsonLd } from "@/components/structured-data";
import {
  SITE_ALT_NAMES,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  organizationSchema,
  websiteSchema,
} from "@/lib/seo";
import "./fonts.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mino AI — AI notes that organize themselves",
    template: "%s · Mino",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "productivity",
  keywords: [
    ...SITE_ALT_NAMES,
    "AI notes",
    "AI note taking app",
    "markdown notes",
    "markdown knowledge base",
    "self-hosted notes",
    "open source notes app",
    "agent-native",
    "MCP",
    "second brain",
    "local-first notes",
  ],
  authors: [{ name: "Tom Szenessy", url: "https://github.com/TomSzenessy" }],
  creator: "Tom Szenessy",
  publisher: SITE_NAME,
  openGraph: {
    title: "Mino AI — AI notes that organize themselves",
    description: SITE_TAGLINE,
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mino AI — AI notes that organize themselves",
    description: SITE_TAGLINE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  referrer: "strict-origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
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
        <link
          rel="preload"
          href="/fonts/inter-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/space-grotesk-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
      </head>
      <body>
        <JsonLd data={[organizationSchema, websiteSchema]} />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
