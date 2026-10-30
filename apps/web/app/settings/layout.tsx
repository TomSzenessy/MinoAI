import type { Metadata } from "next";
import type { ReactNode } from "react";

// Per-user surface: never indexed, never a landing page.
export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
