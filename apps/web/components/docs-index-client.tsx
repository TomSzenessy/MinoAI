"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { useTranslation } from "@/components/i18n-provider";

interface DocItem {
  title: string;
  relativePath: string;
  href: string;
}

interface DocsIndexClientProps {
  pages: DocItem[];
}

export function DocsIndexClient({ pages }: DocsIndexClientProps) {
  const { t } = useTranslation();

  const groups = {
    gettingStarted: pages.filter((page) => page.relativePath.startsWith("getting-started/")),
    reference: pages.filter((page) => page.relativePath.startsWith("reference/")),
    frontend: pages.filter((page) => page.relativePath === "frontend.md"),
    root: pages.filter((page) => page.relativePath === "README.md"),
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8 md:px-10">
      <div className="mino-grid-overlay" />

      <div className="relative mx-auto max-w-6xl">
        <header className="glass-card mb-8 flex items-center justify-between rounded-full px-4 py-3 md:px-6">
          <Link href="/">
            <BrandLogo />
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/" className="button-secondary text-sm">
              {t("nav.home")}
            </Link>
            <Link href="/settings" className="button-secondary text-sm">
              {t("nav.settings")}
            </Link>
          </nav>
        </header>

        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-[var(--text-primary)]">{t("docs.title")}</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)] md:text-base">{t("docs.subtitle")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="glass-card rounded-mino-2xl p-6">
            <h2 className="mb-1 font-display text-2xl font-semibold text-[var(--text-primary)]">
              {t("docs.gettingStarted")}
            </h2>
            <ul className="space-y-2">
              {[...groups.root, ...groups.gettingStarted].map((page) => (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className="block rounded-lg border border-transparent px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[rgba(187,134,252,0.25)] hover:bg-[rgba(187,134,252,0.08)] hover:text-[var(--text-primary)]"
                  >
                    {page.title}
                    <span className="ml-2 text-xs text-[var(--text-tertiary)]">{page.relativePath}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="glass-card rounded-mino-2xl p-6">
            <h2 className="mb-1 font-display text-2xl font-semibold text-[var(--text-primary)]">{t("docs.reference")}</h2>
            <ul className="space-y-2">
              {[...groups.reference, ...groups.frontend].map((page) => (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className="block rounded-lg border border-transparent px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[rgba(187,134,252,0.25)] hover:bg-[rgba(187,134,252,0.08)] hover:text-[var(--text-primary)]"
                  >
                    {page.title}
                    <span className="ml-2 text-xs text-[var(--text-tertiary)]">{page.relativePath}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
