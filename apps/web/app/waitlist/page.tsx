import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { WaitlistForm } from "@/components/waitlist-form";
import { FaqList, JsonLd } from "@/components/structured-data";
import { FULL_FAQ } from "@/lib/faq";
import { breadcrumbSchema, pageMetadata, webPageSchema } from "@/lib/seo";

const TITLE = "Join the waitlist — early access";
const DESCRIPTION =
  "Mino opens in small batches. Join the early access list and get one email when a seat is free — the working app, the server image and the walkthrough, no newsletter.";

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/waitlist",
});

const WAITLIST_FAQ = FULL_FAQ.filter((entry) =>
  [
    "What is Mino AI?",
    "What happens after I join the waitlist?",
    "Is Mino free?",
    "How do I log in to Mino?",
  ].includes(entry.question),
);

const ROADMAP = [
  {
    phase: "Now",
    title: "The workspace works",
    body: "Markdown vault, editor, search, file tree, command palette and the self-hosted server. This is the part you can run today.",
  },
  {
    phase: "Next",
    title: "The agent earns its keep",
    body: "Importing web pages and PDFs, tagging and linking new material automatically, and answering across the whole vault instead of one note.",
  },
  {
    phase: "Exploring",
    title: "Clients and a hosted option",
    body: "Android and iOS builds are in internal testing. A managed host is on the table if enough people would rather not run a container.",
  },
];

const INCLUDED = [
  {
    title: "The working app, not a demo",
    body: "Your invite ships with the server image, a compose file and a walkthrough. You can be writing in a vault in under ten minutes.",
  },
  {
    title: "A say in what gets built",
    body: "Early users set the order of the roadmap. The agent pipeline, the mobile clients and the importers all started as replies from people on this list.",
  },
  {
    title: "One email, then silence",
    body: "No drip sequence, no newsletter. You get the invite when a seat opens; every email carries a one-click unsubscribe link.",
  },
];

export default function WaitlistPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={[
          webPageSchema({
            path: "/waitlist",
            name: TITLE,
            description: DESCRIPTION,
          }),
          breadcrumbSchema([
            { name: "Mino", path: "/" },
            { name: "Waitlist", path: "/waitlist" },
          ]),
        ]}
      />

      <section className="page-hero">
        <span className="section-label">EARLY ACCESS</span>
        <h1>
          Be first in line for <span className="gradient-text">Mino</span>.
        </h1>
        <p className="lead">
          Mino opens in small batches so the first people in get a working
          product and a real person answering. Leave your address and you get
          one email the moment a seat is free.
        </p>

        <WaitlistForm
          variant="hero"
          idPrefix="waitlist-page"
          className="mt-9"
        />

        <div className="pill-row">
          <span className="pill">No newsletter</span>
          <span className="pill">One-click unsubscribe</span>
          <span className="pill">Open source</span>
          <span className="pill">Self-hosted</span>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-20 pt-6">
        <div className="card-grid">
          {INCLUDED.map((item) => (
            <article key={item.title} className="info-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <div className="article">
          <h2>What opens, and when</h2>
          <p>
            The list is roughly ordered by who signed up first, adjusted for the
            kind of vault you keep — someone with ten thousand notes stresses
            the index in a way a fresh vault does not, and I would rather find
            that out with you than after a launch.
          </p>

          <div className="css-roadmap">
            {ROADMAP.map((item) => (
              <div key={item.phase} className="css-roadmap-item">
                <span className="css-roadmap-phase">{item.phase}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>

          <h2>If this stays small</h2>
          <p>
            Then nothing breaks. The repository stays public, the docs stay
            online, and the self-hosted server keeps working. The waitlist is a
            signal, not a hostage note: it tells me whether Mino deserves to
            become the main thing.
          </p>
          <p>
            Prefer to skip the list and read the code first?{" "}
            <a href="https://github.com/TomSzenessy/MinoAI">
              The repository is open
            </a>{" "}
            and the <Link href="/docs">docs</Link> document the API, the relay
            and the deployment.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <h2 className="mb-10 text-center font-display text-3xl font-bold md:text-4xl">
          Questions before you sign up
        </h2>
        <FaqList items={WAITLIST_FAQ} />
        <p className="mt-8 text-center text-sm text-[var(--text-tertiary)]">
          More answers in the{" "}
          <Link href="/faq" className="text-[var(--purple-300)] underline">
            full FAQ
          </Link>
          .
        </p>
      </section>
    </MarketingShell>
  );
}
