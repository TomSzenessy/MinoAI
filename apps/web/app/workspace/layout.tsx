import type { Metadata } from "next";
import type { ReactNode } from "react";

// Per-user surface: never indexed, never a landing page.
export const metadata: Metadata = {
  title: "Workspace",
  robots: { index: false, follow: false },
};

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
