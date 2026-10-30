import type { Metadata } from "next";
import { DocsIndexClient } from "@/components/docs-index-client";
import { getAllDocPages, toDocHref } from "@/lib/docs";
import { absoluteUrl } from "@/lib/seo";

const TITLE = "Documentation";
const DESCRIPTION =
  "Mino documentation: deployment with Docker and Portainer, the relay tunnel, API endpoints, agent integrations and the security model behind the server.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/docs") },
  openGraph: {
    title: `${TITLE} · Mino`,
    description: DESCRIPTION,
    url: absoluteUrl("/docs"),
    siteName: "Mino",
    type: "website",
  },
};

export default function DocsIndexPage() {
  const pages = getAllDocPages().map((page) => ({
    title: page.title,
    relativePath: page.relativePath,
    href: toDocHref(page),
  }));

  return <DocsIndexClient pages={pages} />;
}
