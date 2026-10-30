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

const TITLE = "What is Mino AI? App, login, pricing and self-hosting";
const DESCRIPTION =
  "What Mino AI is, where the app lives, why there is no Mino login page, what it costs and how the self-hosted server works. Straight answers, no marketing fog.";

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
          The questions that show up in search — what Mino AI is, where the app
          is, why there is no login page, and what it costs. Answered plainly,
          including the parts that are still in progress.
        </p>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <FaqList items={FULL_FAQ} />
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="cta-panel">
          <h2>Still curious? Try it.</h2>
          <p>
            Early access opens in batches. One email when a seat is free — the
            working app, the server image and a walkthrough.
          </p>
          <div className="waitlist mx-auto max-w-xl">
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
