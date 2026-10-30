import type { Metadata } from "next";
import type { ReactNode } from "react";

// Linking flow carries user credentials in the query string: keep it out of
// the index and out of referrers.
export const metadata: Metadata = {
  title: "Connect a server",
  robots: { index: false, follow: false },
};

export default function LinkLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
