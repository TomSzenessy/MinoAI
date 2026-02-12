/**
 * Mino Theme — React context provider for dark/light mode.
 *
 * Uses `next-themes` under the hood. The provider reads the user's
 * system preference by default and allows manual override.
 * Theme is persisted to localStorage automatically by next-themes.
 */

"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { createElement } from "react";
import type { ReactNode } from "react";

/**
 * Wraps the app with theme context.
 * - `attribute="data-theme"` sets `<html data-theme="dark|light">`.
 * - `defaultTheme="dark"` matches Mino's dark-first design.
 * - `storageKey` uses the Mino namespace for consistency.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return createElement(
    NextThemesProvider,
    {
      attribute: "data-theme",
      defaultTheme: "dark",
      storageKey: "mino.theme",
      enableSystem: true,
      disableTransitionOnChange: false,
    },
    children,
  );
}
