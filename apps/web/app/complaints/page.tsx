import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { MinoForm } from "@/components/mino-form";
import { JsonLd } from "@/components/structured-data";
import { COMPLAINT_FORM } from "@/lib/forms";
import { breadcrumbSchema, pageMetadata, webPageSchema } from "@/lib/seo";

const TITLE = "Report a problem";
const DESCRIPTION =
  "Something broke, a note went missing, or Mino behaved in a way you did not expect. Send a report from this page — no account, no redirect, and the reply comes to your inbox.";

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/complaints",
});

const EXPECTATIONS = [
  {
    title: "It reaches a person",
    body: "Reports land in the maintainer's inbox, not a ticket queue. The category and severity decide how quickly it is read.",
  },
  {
    title: "You get a copy",
    body: "If you leave an email address, an acknowledgement confirms the report was stored. The reply to any follow-up question goes to the same address.",
  },
  {
    title: "Nothing is redirected",
    body: "The form runs on this page. No provider subdomain, no third-party page, no account — the submission goes straight to the server that stores it.",
  },
];

export default function ComplaintsPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={[
          webPageSchema({ path: "/complaints", name: TITLE, description: DESCRIPTION }),
          breadcrumbSchema([
            { name: "Mino", path: "/" },
            { name: "Report a problem", path: "/complaints" },
          ]),
        ]}
      />

      <section className="page-hero">
        <span className="section-label">PROBLEM REPORT</span>
        <h1>
          Tell us what <span className="gradient-text">went wrong</span>.
        </h1>
        <p className="lead">
          Something broke, a note went missing, or Mino did something you did not
          expect. The more precisely you describe it, the faster it can be fixed.
        </p>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-16">
        <div className="glass-card mx-auto max-w-2xl rounded-mino-2xl p-6 md:p-8">
          <MinoForm definition={COMPLAINT_FORM} idPrefix="complaints" />
          <p className="mt-6 text-xs leading-relaxed text-[var(--text-tertiary)]">
            Submissions are stored by a self-hosted Mailspool instance and read by
            the maintainer. We keep the report and the address you give us for as
            long as it takes to resolve it. See the{" "}
            <Link href="/privacy" className="text-[var(--purple-300)] underline">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <div className="card-grid">
          {EXPECTATIONS.map((item) => (
            <article key={item.title} className="info-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-[var(--text-tertiary)]">
          Prefer to work in the open?{" "}
          <a
            href="https://github.com/TomSzenessy/MinoAI/issues"
            className="text-[var(--purple-300)] underline"
            target="_blank"
            rel="noreferrer"
          >
            Open an issue
          </a>{" "}
          instead — it is public and searchable.
        </p>
      </section>
    </MarketingShell>
  );
}
