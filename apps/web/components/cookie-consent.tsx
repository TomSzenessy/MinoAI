/**
 * Mino Cookie Consent — DSGVO-compliant consent banner.
 *
 * Shows a bottom banner on first visit. Stores the user's choice
 * in localStorage. Only essential/functional cookies are used;
 * no tracking cookies exist, so this is informational compliance.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getLocale, createTranslator } from "@/lib/i18n";

/** localStorage key for consent status. */
const CONSENT_KEY = "mino.cookieConsent";

type ConsentStatus = "accepted" | "rejected" | null;

function getConsent(): ConsentStatus {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(CONSENT_KEY);
  if (stored === "accepted" || stored === "rejected") return stored;
  return null;
}

function setConsent(status: "accepted" | "rejected"): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, status);
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [t, setT] = useState(() => createTranslator("en"));

  useEffect(() => {
    const consent = getConsent();
    if (!consent) setVisible(true);
    setT(() => createTranslator(getLocale()));
  }, []);

  const handleAccept = useCallback(() => {
    setConsent("accepted");
    setVisible(false);
  }, []);

  const handleReject = useCallback(() => {
    setConsent("rejected");
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-4 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:gap-4 md:p-5">
        <p className="flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
          {t("cookieConsent.message")}{" "}
          <Link
            href="/cookies"
            className="text-[var(--purple-300)] underline underline-offset-2 hover:text-[var(--purple-200)]"
          >
            {t("cookieConsent.learnMore")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={handleReject}
            className="rounded-full border border-[var(--glass-border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--purple-400)] hover:text-[var(--text-primary)]"
          >
            {t("cookieConsent.reject")}
          </button>
          <button
            onClick={handleAccept}
            className="rounded-full bg-gradient-to-br from-[var(--purple-600)] to-[var(--purple-500)] px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-px hover:shadow-[var(--glow-sm)]"
          >
            {t("cookieConsent.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
