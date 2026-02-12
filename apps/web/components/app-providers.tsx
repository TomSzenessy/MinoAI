"use client";

import type { ReactNode } from "react";
import { CookieConsent } from "@/components/cookie-consent";
import { I18nProvider } from "@/components/i18n-provider";
import { ThemeProvider } from "@/lib/theme";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        {children}
        <CookieConsent />
      </I18nProvider>
    </ThemeProvider>
  );
}
