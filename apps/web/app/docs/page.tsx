import { DocsIndexClient } from "@/components/docs-index-client";
import { getAllDocPages, toDocHref } from "@/lib/docs";

export default function DocsIndexPage() {
  const pages = getAllDocPages().map((page) => ({
    title: page.title,
    relativePath: page.relativePath,
    href: toDocHref(page),
  }));

  return <DocsIndexClient pages={pages} />;
}
