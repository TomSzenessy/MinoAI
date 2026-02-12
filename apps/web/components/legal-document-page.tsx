"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { useTranslation } from "@/components/i18n-provider";
import { getLegalDocument } from "@/lib/legal";

interface LegalDocumentPageProps {
  docType: "terms" | "cookies" | "privacy";
}

export function LegalDocumentPage({ docType }: LegalDocumentPageProps) {
  const { locale, t } = useTranslation();
  const doc = getLegalDocument(docType, locale);

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8 md:px-10">
      <div className="mino-grid-overlay" />
      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="glass-card flex items-center justify-between rounded-full px-4 py-3 md:px-6">
          <Link href="/">
            <BrandLogo />
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/" className="button-secondary text-sm">
              {t("nav.home")}
            </Link>
          </nav>
        </header>

        <article className="glass-card rounded-mino-xl p-6 md:p-10">
          <h1 className="mb-2 font-display text-3xl font-bold text-[var(--text-primary)]">{doc.title}</h1>
          <p className="mb-8 text-sm text-[var(--text-tertiary)]">
            {t("legal.lastUpdated")}: {doc.lastUpdated}
          </p>

          <div className="space-y-6">
            {doc.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="mb-2 font-display text-lg font-semibold text-[var(--text-primary)]">
                  {section.heading}
                </h2>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">{section.body}</p>
              </section>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}
