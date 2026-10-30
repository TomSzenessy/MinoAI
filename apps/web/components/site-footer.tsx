"use client";

import Link from "next/link";
import { useTranslation } from "@/components/i18n-provider";

/**
 * Shared footer. It doubles as the site's internal-link hub: every indexable
 * marketing page is reachable from here in one hop.
 */
export function SiteFooter() {
  const { t } = useTranslation();

  const columns = [
    {
      title: t("footer.product"),
      links: [
        { label: t("nav.features"), href: "/#features" },
        { label: t("nav.aiNotes"), href: "/ai-notes" },
        { label: t("nav.selfHosted"), href: "/self-hosted-notes" },
        { label: t("nav.joinWaitlist"), href: "/waitlist" },
      ],
    },
    {
      title: t("footer.resources"),
      links: [
        { label: t("nav.docs"), href: "/docs" },
        { label: t("nav.faq"), href: "/faq" },
        { label: t("nav.about"), href: "/about" },
        { label: "GitHub", href: "https://github.com/TomSzenessy/MinoAI" },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { label: t("footer.privacy"), href: "/privacy" },
        { label: t("footer.terms"), href: "/terms" },
        { label: t("footer.cookies"), href: "/cookies" },
      ],
    },
  ] as const;

  return (
    <footer className="footer mx-auto mt-4 w-full max-w-6xl px-6 py-14 border-t border-white/5">
      <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col items-center gap-4 md:items-start">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-mino-purple animate-pulse" />
            <p className="text-sm font-medium tracking-tight text-[var(--text-tertiary)]">
              {t("footer.tagline")}
            </p>
          </div>
          <Link
            href="/workspace"
            className="footer-link text-[12px] text-[var(--text-tertiary)] hover:text-white transition-colors"
          >
            {t("nav.workspace")} →
          </Link>
          <p className="text-[12px] text-[var(--text-tertiary)] opacity-60">
            © 2026 Mino. All rights reserved.
          </p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--purple-300)]">
              {column.title}
            </h2>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("http") ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="footer-link text-sm text-[var(--text-tertiary)] hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="footer-link text-sm text-[var(--text-tertiary)] hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}
