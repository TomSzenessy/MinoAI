import type { ReactNode } from "react";
import { LandingBg } from "@/components/landing-bg";
import { MarketingHeader } from "@/components/marketing-header";
import { SiteFooter } from "@/components/site-footer";

/**
 * Chrome shared by the indexable marketing pages: fixed header, ambient
 * background and the internal-link footer.
 */
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-x-hidden pb-0">
      <LandingBg />
      <MarketingHeader />
      <div className="relative z-10">{children}</div>
      <SiteFooter />
    </main>
  );
}
