import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { WaitlistForm } from "@/components/waitlist-form";
import { FaqList, JsonLd } from "@/components/structured-data";
import { FULL_FAQ } from "@/lib/faq";
import {
  breadcrumbSchema,
  pageMetadata,
  softwareApplicationSchema,
  webPageSchema,
} from "@/lib/seo";

const TITLE = "What is Mino AI? Login, pricing, self-hosting";
const DESCRIPTION =
  "What Mino AI is, why there is no login page, what it costs, and how the self-hosted server works. Straight answers, including the parts still unfinished.";

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/faq",
});

export default function FaqPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={[
          webPageSchema({
            path: "/faq",
            name: TITLE,
            description: DESCRIPTION,
          }),
          softwareApplicationSchema,
          breadcrumbSchema([
            { name: "Mino", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
        ]}
      />

      <section className="page-hero">
        <span className="section-label">FAQ</span>
        <h1>
          Mino, <span className="gradient-text">explained</span>.
        </h1>
        <p className="lead">
          The questions that show up in search: what Mino AI is, which clients
          exist, why there is no login page, and what it costs. Answered
          plainly, including the parts that are still unfinished.
        </p>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <FaqList items={FULL_FAQ} />
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="cta-panel">
          <h2>Still curious? Join the list.</h2>
          <p>
            Mino is on GitHub now, and you can run it today. The list is a launch
            announcement: one email when it launches, nothing else.
          </p>
          <div className="mx-auto max-w-xl">
            <WaitlistForm idPrefix="faq" />
          </div>
          <p className="mt-6 text-sm text-[var(--text-tertiary)]">
            Prefer to read code first?{" "}
            <a
              href="https://github.com/TomSzenessy/MinoAI"
              className="text-[var(--purple-300)] underline"
            >
              The repository is public
            </a>{" "}
            and the{" "}
            <Link href="/docs" className="text-[var(--purple-300)] underline">
              docs
            </Link>{" "}
            cover the API.
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
