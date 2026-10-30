"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { useTranslation } from "@/components/i18n-provider";

export function MarketingHeader() {
  const { t } = useTranslation();

  const links = [
    { label: t("nav.features"), href: "/#features" },
    { label: t("nav.aiNotes"), href: "/ai-notes" },
    { label: t("nav.selfHosted"), href: "/self-hosted-notes" },
    { label: t("nav.faq"), href: "/faq" },
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.docs"), href: "/docs" },
  ] as const;

  return (
    <header className="navbar">
      <Link href="/" className="mr-2" aria-label="Mino home">
        <BrandLogo withWordmark />
      </Link>

      <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="navbar-link">
            {link.label}
          </Link>
        ))}
      </nav>

      <Link href="/waitlist" className="button-primary ml-auto text-sm">
        {t("nav.joinWaitlist")}
      </Link>
    </header>
  );
}
