"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BrandLogo } from "@/components/brand-logo";
import { useTranslation } from "@/components/i18n-provider";

interface DocPageClientProps {
  page: {
    title: string;
    relativePath: string;
    content: string;
    href: string;
  };
  siblings: Array<{
    title: string;
    href: string;
  }>;
}

export function DocPageClient({ page, siblings }: DocPageClientProps) {
  const { t } = useTranslation();

  function normalizeDocHref(href: string): string {
    if (href.startsWith("#")) {
      return href;
    }
    if (href.startsWith("/docs")) {
      return href;
    }
    if (href.startsWith("/")) {
      return `/docs${href}`;
    }
    return href;
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8 md:px-10">
      <div className="mino-grid-overlay" />

      <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="glass-card h-fit rounded-mino-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <BrandLogo withWordmark={false} />
            <Link href="/docs" className="text-xs text-[var(--purple-300)]">
              {t("docs.title")}
            </Link>
          </div>

          <ul className="space-y-1">
            {siblings.map((item) => {
              const active = item.href === page.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      active
                        ? "bg-[rgba(187,134,252,0.2)] text-[var(--text-primary)]"
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
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children, ...props }) => {
                  if (!href) {
                    return <a {...props}>{children}</a>;
                  }

                  const normalized = normalizeDocHref(href);
                  if (
                    normalized.startsWith("/docs") ||
                    normalized.startsWith("#")
                  ) {
                    return <Link href={normalized}>{children}</Link>;
                  }

                  const external = /^https?:\/\//i.test(normalized);
                  return (
                    <a
                      href={normalized}
                      rel={external ? "noreferrer noopener" : undefined}
                      target={external ? "_blank" : undefined}
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
              }}
            >
              {page.content}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </main>
  );
}
