"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { getLegalDocument, type LegalDocument } from "@/lib/legal";
import { getLocale, createTranslator, type Locale } from "@/lib/i18n";

export default function TermsPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [doc, setDoc] = useState<LegalDocument | null>(null);

  useEffect(() => {
    const loc = getLocale();
    setLocale(loc);
    setDoc(getLegalDocument("terms", loc));

    const handleLocaleChange = () => {
      const newLocale = getLocale();
      setLocale(newLocale);
      setDoc(getLegalDocument("terms", newLocale));
    };

    window.addEventListener("mino:locale-change", handleLocaleChange);
    return () => window.removeEventListener("mino:locale-change", handleLocaleChange);
  }, []);

  const t = createTranslator(locale);

  if (!doc) return null;

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
          <h1 className="mb-2 font-display text-3xl font-bold text-white">
            {doc.title}
          </h1>
          <p className="mb-8 text-sm text-[var(--text-tertiary)]">
            {t("legal.lastUpdated")}: {doc.lastUpdated}
          </p>

          <div className="space-y-6">
            {doc.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="mb-2 font-display text-lg font-semibold text-white">
                  {section.heading}
                </h2>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}
