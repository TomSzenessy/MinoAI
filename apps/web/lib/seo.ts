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

export const SITE_TAGLINE = "Your notes, on your server, with AI that files them";
export const SITE_DESCRIPTION =
  "Mino is an open-source Obsidian alternative: your Markdown vault on a server you run, with an AI agent that files, tags and links your notes.";

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
    "Mino is an open-source Obsidian alternative: a self-hosted Markdown vault with an AI agent that files, tags, links and retrieves notes. Built and maintained by Tom Szenessy.",
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
  operatingSystem: "Web and self-hosted (Docker); Android and iOS in internal testing",
  url: SITE_URL,
  description:
    "A self-hosted, Obsidian-compatible Markdown vault with an AI agent that files, links and retrieves your notes. The vault stays as plain files on a server you run.",
  isAccessibleForFree: true,
  author: { "@id": `${SITE_URL}/#organization` },
  publisher: { "@id": `${SITE_URL}/#organization` },
  slogan: SITE_TAGLINE,
  disambiguatingDescription:
    "An open-source, self-hostable Markdown vault and Obsidian alternative with an HTTP API and an MCP bridge. Not a cloud service: there is no Mino account or central login. Not affiliated with Obsidian.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "The core is open source and self-hostable at no cost.",
  },
  featureList: [
    "Obsidian-compatible Markdown vault",
    "One Docker container on your own server",
    "AI agent that files, tags, links and summarises notes",
    "Semantic and full-text search",
    "Self-hosted with Docker or Portainer",
    "Relay tunnel so the server needs no open port",
    "Agent access over HTTP and MCP",
    "Web workspace, with Android and iOS builds in internal testing",
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
