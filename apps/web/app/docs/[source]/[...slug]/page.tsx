import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BrandLogo } from "@/components/brand-logo";
import { getAllDocPages, getDocPage, toDocHref, type DocSource } from "@/lib/docs";

interface DocPageProps {
  params: Promise<{
    source: DocSource;
    slug: string[];
  }>;
}

export function generateStaticParams() {
  return getAllDocPages().map((page) => ({
    source: page.source,
    slug: page.slug,
  }));
}

export const dynamicParams = false;

export default async function DocPage({ params }: DocPageProps) {
  const resolved = await params;

  if (resolved.source !== "blueprint" && resolved.source !== "docstart") {
    notFound();
  }

  const page = getDocPage(resolved.source, resolved.slug);
  if (!page) {
    notFound();
  }

  const siblings = getAllDocPages().filter((item) => item.source === page.source);

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8 md:px-10">
      <div className="mino-grid-overlay" />

      <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="glass-card h-fit rounded-mino-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <BrandLogo withWordmark={false} />
            <Link href="/docs" className="text-xs text-[var(--purple-200)]">
              All docs
            </Link>
          </div>
          <p className="mb-3 text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
            {page.source === "blueprint" ? "Blueprint" : "Implementation"}
          </p>
          <ul className="space-y-1">
            {siblings.map((item) => {
              const href = toDocHref(item);
              const active = href === toDocHref(page);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      active
                        ? "bg-[rgba(187,134,252,0.2)] text-white"
                        : "text-[var(--text-secondary)] hover:bg-[rgba(187,134,252,0.08)]"
                    }`}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        <article className="glass-card rounded-mino-2xl p-6 md:p-8">
          <p className="mb-2 text-xs uppercase tracking-wide text-[var(--text-tertiary)]">{page.relativePath}</p>
          <div className="docs-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{page.content}</ReactMarkdown>
          </div>
        </article>
      </div>
    </main>
  );
}
