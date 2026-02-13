"use client";

import Cookies from "js-cookie";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/components/i18n-provider";

const CONSENT_KEY = "mino.cookieConsent";

type ConsentStatus = "accepted" | "rejected" | null;

function readConsent(): ConsentStatus {
  if (typeof window === "undefined") return null;

  const localValue = window.localStorage.getItem(CONSENT_KEY);
  if (localValue === "accepted" || localValue === "rejected") {
    return localValue;
  }

  const cookieValue = Cookies.get(CONSENT_KEY);
  if (cookieValue === "accepted" || cookieValue === "rejected") {
    return cookieValue;
  }

  return null;
}

function storeConsent(value: "accepted" | "rejected") {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONSENT_KEY, value);
  }

  Cookies.set(CONSENT_KEY, value, {
    sameSite: "lax",
    expires: 365,
  });
}

export function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readConsent() === null);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label={t("a11y.cookieConsent")}
      className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-4 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:gap-4 md:p-5">
        <p className="flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
          {t("cookieConsent.message")} {" "}
          <Link
            href="/cookies"
            className="text-[var(--purple-300)] underline underline-offset-2 hover:text-[var(--purple-200)]"
          >
            {t("cookieConsent.learnMore")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => {
              storeConsent("rejected");
              setVisible(false);
            }}
            className="rounded-full border border-[var(--glass-border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--purple-400)] hover:text-[var(--text-primary)]"
          >
            {t("cookieConsent.reject")}
          </button>
          <button
            onClick={() => {
              storeConsent("accepted");
              setVisible(false);
            }}
            className="rounded-full bg-gradient-to-br from-[var(--purple-600)] to-[var(--purple-500)] px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-px hover:shadow-[var(--glow-sm)]"
          >
            {t("cookieConsent.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
