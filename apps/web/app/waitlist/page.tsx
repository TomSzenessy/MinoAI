import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { WaitlistForm } from "@/components/waitlist-form";
import { FaqList, JsonLd } from "@/components/structured-data";
import { FULL_FAQ } from "@/lib/faq";
import { breadcrumbSchema, pageMetadata, webPageSchema } from "@/lib/seo";

const TITLE = "Get one email when Mino launches";
const DESCRIPTION =
  "Mino is open source and runs today from GitHub. The list sends one email when Mino launches, and nothing else. Run it now or hear when it is ready.";

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/waitlist",
});

const WAITLIST_FAQ = FULL_FAQ.filter((entry) =>
  [
    "What is Mino AI?",
    "What happens after I join the waitlist?",
    "Can I run Mino today?",
    "Is Mino free?",
    "How do I log in to Mino?",
  ].includes(entry.question),
);

const ROADMAP = [
  {
    phase: "Now",
    title: "The server and the workspace",
    body: "Markdown vault, editor, search, file tree, command palette, the HTTP API, the MCP bridge and the Docker image. All of it is in the repository today.",
  },
  {
    phase: "Next",
    title: "Mobile clients",
    body: "Android and iOS builds are in internal testing. They will wrap the same vault rather than move your notes somewhere else.",
  },
  {
    phase: "Exploring",
    title: "Obsidian plugins and large vaults",
    body: "A plugin compatibility layer for Obsidian, and indexing that stays fast on very large vaults.",
  },
];

const INCLUDED = [
  {
    title: "One email, at launch",
    body: "When Mino launches you get one message. No newsletter before it and no sequence after it.",
  },
  {
    title: "Run it today",
    body: "The repository is public: clone it, run the container, link a client. You do not need the list to use Mino now.",
  },
  {
    title: "Nothing else",
    body: "Your address is used for that one email. One click in the message removes you, and the list is not sold or shared.",
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
        <span className="section-label">LAUNCH ANNOUNCEMENT</span>
        <h1>
          Get <span className="gradient-text">one email</span> when Mino
          launches.
        </h1>
        <p className="lead">
          Mino is an open-source Obsidian alternative you can run today: clone
          the repository, start the container, connect a client. The list is for
          people who are not ready to self-host yet. Leave your address and you
          get one email at launch, nothing else.
        </p>

        <WaitlistForm
          variant="hero"
          idPrefix="waitlist-page"
          className="mt-9"
        />

        <div className="pill-row">
          <span className="pill">One email at launch</span>
          <span className="pill">No newsletter</span>
          <span className="pill">Open source</span>
          <span className="pill">Run it today</span>
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
          <h2>What is done, and what is next</h2>
          <p>
            The repository is public and the server runs today. This is where
            things stand.
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

          <h2>You don&apos;t have to wait</h2>
          <p>
            <a href="https://github.com/TomSzenessy/MinoAI">
              The repository is open
            </a>{" "}
            and the <Link href="/docs">docs</Link> cover the API, the relay and
            the deployment. Clone it, run the container, and see whether it fits
            before the launch email arrives.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <h2 className="mb-10 text-center font-display text-3xl font-bold md:text-4xl">
          Before you join the list
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
