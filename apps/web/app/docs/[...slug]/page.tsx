import { notFound } from "next/navigation";
import { DocPageClient } from "@/components/doc-page-client";
import { getAllDocPages, getDocPage, toDocHref } from "@/lib/docs";

interface DocPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export function generateStaticParams() {
  return getAllDocPages().map((page) => ({
    slug: page.slug,
  }));
}

export const dynamicParams = false;

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
