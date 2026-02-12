"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LOCALE_NAMES, SUPPORTED_LOCALES, useTranslation } from "@/components/i18n-provider";
import type { Locale } from "@/lib/i18n";

export interface NavbarSection {
  id: string;
  label: string;
}

interface NavbarProps {
  sections: NavbarSection[];
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export function Navbar({ sections, activeSection, onNavigate }: NavbarProps) {
  const { locale, setLocale, t } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const navLinksRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!navLinksRef.current) return;

    const activeEl = navLinksRef.current.querySelector<HTMLButtonElement>(`button[data-nav="${activeSection}"]`);
    if (!activeEl) return;

    const containerRect = navLinksRef.current.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();

    setIndicator({
      left: activeRect.left - containerRect.left,
      width: activeRect.width,
    });
  }, [activeSection, sections]);

  useEffect(() => {
    const onResize = () => {
      if (!navLinksRef.current) return;
      const activeEl = navLinksRef.current.querySelector<HTMLButtonElement>(`button[data-nav="${activeSection}"]`);
      if (!activeEl) return;

      const containerRect = navLinksRef.current.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();

      setIndicator({
        left: activeRect.left - containerRect.left,
        width: activeRect.width,
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeSection]);

  const themeIcon = useMemo(() => {
    return resolvedTheme === "light" ? "☀" : "☾";
  }, [resolvedTheme]);

  return (
    <>
      <header className="navbar">
        <Link href="#hero" onClick={() => onNavigate("hero")} className="mr-2">
          <BrandLogo withWordmark className="pr-2" />
        </Link>

        <div className="nav-links relative flex items-center gap-1" ref={navLinksRef}>
          <span className="navbar-indicator" style={{ left: indicator.left, width: indicator.width }} />
          {sections.map((section) => (
            <button
              key={section.id}
              data-nav={section.id}
              className={`navbar-link ${activeSection === section.id ? "active" : ""}`}
              onClick={() => onNavigate(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-2 pl-2 md:flex">
          <div className="lang-selector">
            <button
              className="lang-btn"
              onClick={() => setLangOpen((open) => !open)}
              aria-label="Language"
            >
              {locale.toUpperCase()} <span aria-hidden>▾</span>
            </button>
            {langOpen ? (
              <div className="lang-dropdown">
                {SUPPORTED_LOCALES.map((option) => (
                  <button
                    key={option}
                    className={`lang-option ${locale === option ? "active" : ""}`}
                    onClick={() => {
                      setLocale(option as Locale);
                      setLangOpen(false);
                    }}
                  >
                    {LOCALE_NAMES[option as Locale]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            className="theme-toggle"
            onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
            aria-label="Toggle theme"
          >
            {themeIcon}
          </button>

          <Link href="/link" className="button-primary text-sm">
            {t("nav.getStarted")}
          </Link>
        </div>

        <button className="hamburger" onClick={() => setMobileOpen((open) => !open)} aria-label="Menu">
          <span />
          <span />
          <span />
        </button>
      </header>

      <div className={`mobile-menu-overlay ${mobileOpen ? "open" : ""}`} onClick={() => setMobileOpen(false)} />
      <aside className={`mobile-menu ${mobileOpen ? "open" : ""}`}>
        {sections.map((section) => (
          <button
            key={section.id}
            className={`mobile-menu-link ${activeSection === section.id ? "active" : ""}`}
            onClick={() => {
              onNavigate(section.id);
              setMobileOpen(false);
            }}
          >
            {section.label}
          </button>
        ))}

        <Link href="/docs" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>
          {t("nav.docs")}
        </Link>
        <Link href="/settings" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>
          {t("nav.settings")}
        </Link>

        <div className="mt-4 flex items-center gap-2">
          {SUPPORTED_LOCALES.map((option) => (
            <button
              key={option}
              className={`lang-option ${locale === option ? "active" : ""}`}
              onClick={() => setLocale(option as Locale)}
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          className="button-secondary mt-4"
          onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
        >
          {themeIcon} {t("settings.general.theme")}
        </button>

        <Link href="/link" className="button-primary mt-2" onClick={() => setMobileOpen(false)}>
          {t("nav.getStarted")}
        </Link>
      </aside>
    </>
  );
}
