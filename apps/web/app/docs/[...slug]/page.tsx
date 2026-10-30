import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocPageClient } from "@/components/doc-page-client";
import { getAllDocPages, getDocPage, toDocHref } from "@/lib/docs";
import { absoluteUrl } from "@/lib/seo";

interface DocPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateStaticParams(): Promise<
  Array<{ slug: string[] }>
> {
  return getAllDocPages().map((page) => ({
    slug: page.slug,
  }));
}

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getDocPage(slug);

  if (!page) {
    return {};
  }

  const url = absoluteUrl(toDocHref(page));
  const description =
    page.description ||
    `${page.title} — Mino documentation and operator guides.`;

  return {
    title: page.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${page.title} · Mino docs`,
      description,
      url,
      type: "article",
      siteName: "Mino",
    },
    twitter: {
      card: "summary",
      title: `${page.title} · Mino docs`,
      description,
    },
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  const page = getDocPage(slug);

  if (!page) {
    notFound();
  }

  const siblings = getAllDocPages().map((entry) => ({
    title: entry.title,
    href: toDocHref(entry),
  }));

  return (
    <DocPageClient
      page={{
        title: page.title,
        relativePath: page.relativePath,
        content: page.content,
        href: toDocHref(page),
      }}
      siblings={siblings}
    />
  );
}
