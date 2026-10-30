import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

const DISALLOW = ["/workspace", "/settings", "/link"];

/**
 * Crawl policy. The app routes (workspace, settings, link) are per-user
 * surfaces with no public content: keeping them out of the index stops them
 * from diluting the marketing pages and from ranking for brand queries with a
 * page a stranger cannot use.
 *
 * Answer engines and AI crawlers are allowed on purpose: the site is a
 * product/entity page, and being quoteable is the point.
 */
const AI_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-User",
  "Google-Extended",
  "CCBot",
  "Applebot-Extended",
  "Bingbot",
  "DuckDuckBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
