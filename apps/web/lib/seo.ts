/**
 * Site-wide SEO constants and structured-data builders.
 *
 * Everything here is derived from what is actually true about the project:
 * the repo, the docs-site and the deployment files. No invented ratings,
 * prices, licenses or customer counts.
 */

import type { Metadata } from "next";

export const SITE_URL = "https://mino.ink";
export const SITE_NAME = "Mino";
export const SITE_ALT_NAMES = ["Mino AI", "Mino app", "mino.ink"] as const;
export const REPO_URL = "https://github.com/TomSzenessy/MinoAI";
export const ORG_URL = "https://github.com/mino-ink";

export const SITE_TAGLINE = "Notes that organize themselves";
export const SITE_DESCRIPTION =
  "Mino is an agent-native Markdown notebook: an AI that imports, links and files your notes, plain .md files you own, and a self-hosted server you control. Private beta — join the waitlist.";

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: [...SITE_ALT_NAMES],
  url: SITE_URL,
  logo: absoluteUrl("/logo.svg"),
  description:
    "Mino is an open-source, self-hosted Markdown notebook with an AI agent that files, links and retrieves notes. Founded and maintained by Tom Szenessy.",
  disambiguatingDescription:
    "The Mino at mino.ink is a self-hosted Markdown note-taking application. It is unrelated to other products that use the name Mino, including Mino by Omni HR, Mino web automation, the Mino running coach and Xiaomi MiMo.",
  sameAs: [REPO_URL, ORG_URL],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  alternateName: [...SITE_ALT_NAMES],
  url: SITE_URL,
  inLanguage: "en",
  description: SITE_DESCRIPTION,
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}/#app`,
  name: SITE_NAME,
  alternateName: [...SITE_ALT_NAMES],
  applicationCategory: "ProductivityApplication",
  applicationSubCategory: "Note-taking",
  operatingSystem: "Web, iOS, Android, Self-hosted (Docker)",
  url: SITE_URL,
  description:
    "Agent-native, Markdown-first knowledge platform. An AI agent imports, links and retrieves your notes; the vault stays as plain Markdown files on a server you run.",
  isAccessibleForFree: true,
  author: { "@id": `${SITE_URL}/#organization` },
  publisher: { "@id": `${SITE_URL}/#organization` },
  slogan: SITE_TAGLINE,
  disambiguatingDescription:
    "An open-source, self-hostable Markdown notebook with an agent-native API. Not a cloud service: there is no Mino account or central login.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "The core is open source and self-hostable at no cost.",
  },
  featureList: [
    "Markdown notes stored as plain files",
    "AI agent that files, tags and links notes",
    "Semantic and full-text search",
    "Self-hosted with Docker or Portainer",
    "Relay tunnel so the server needs no open port",
    "Agent access over HTTP and MCP",
    "Offline-first web and mobile clients with CRDT sync",
  ],
  sameAs: [REPO_URL],
};

/** A minimal WebPage node; pages add their own breadcrumbs where useful. */
export function webPageSchema(input: {
  path: string;
  name: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${absoluteUrl(input.path)}#webpage`,
    url: absoluteUrl(input.path),
    name: input.name,
    description: input.description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    inLanguage: "en",
  };
}

export function breadcrumbSchema(
  crumbs: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** Shared per-page metadata: canonical URL, Open Graph and Twitter card. */
export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
}): Metadata {
  const url = absoluteUrl(input.path);

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: SITE_NAME,
      type: input.type ?? "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
    },
  };
}
