import type { MetadataRoute } from "next";
import { getAllDocPages, toDocHref } from "@/lib/docs";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

/**
 * Every indexable URL, built statically. Docs pages are discovered from
 * docs-site/ at build time, so adding a markdown file is enough to get it into
 * the sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const marketing: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/waitlist"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/ai-notes"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/self-hosted-notes"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/about"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/faq"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/docs"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const docs: MetadataRoute.Sitemap = getAllDocPages().map((page) => ({
    url: absoluteUrl(toDocHref(page)),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const legal: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/privacy"), lastModified, priority: 0.2 },
    { url: absoluteUrl("/terms"), lastModified, priority: 0.2 },
    { url: absoluteUrl("/cookies"), lastModified, priority: 0.2 },
  ];

  return [...marketing, ...docs, ...legal];
}
