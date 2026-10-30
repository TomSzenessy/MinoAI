import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { WaitlistForm } from "@/components/waitlist-form";
import { JsonLd } from "@/components/structured-data";
import { REPO_URL, breadcrumbSchema, pageMetadata } from "@/lib/seo";

const TITLE = "About Mino: a self-hosted Obsidian alternative";
const DESCRIPTION =
  "Mino is a self-hosted Obsidian alternative with an AI agent that files, tags and links your notes. Who builds it, what it runs on, and what it is not.";

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/about",
});

const FACTS: Array<[string, string]> = [
  ["Name", "Mino — also written Mino AI, or mino.ink"],
  ["Category", "Note-taking: Obsidian-compatible Markdown vault, self-hosted"],
  [
    "What it is",
    "An open-source Obsidian alternative: a Markdown vault on your server, with an AI agent that files, links and retrieves notes",
  ],
  ["Where it runs", "Self-hosted: Docker or Portainer on a server you control"],
  [
    "Storage",
    "Markdown files with YAML front matter in an Obsidian-compatible vault, plus a rebuildable SQLite index",
  ],
  [
    "Compatibility",
    "Vault and Markdown: yes. Obsidian plugin compatibility layer: in progress",
  ],
  [
    "AI",
    "Bring your own provider, model and API key; the agent is off until you configure one",
  ],
  ["Status", "Open source and runnable today; the list announces the launch"],
  ["Author", "Tom Szenessy"],
  ["Source", "github.com/TomSzenessy/MinoAI"],
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            url: "https://mino.ink/about",
            name: TITLE,
            description: DESCRIPTION,
            about: { "@id": "https://mino.ink/#app" },
          },
          breadcrumbSchema([
            { name: "Mino", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />

      <section className="page-hero">
        <span className="section-label">ABOUT</span>
        <h1>
          An <span className="gradient-text">Obsidian alternative</span> that
          files for you.
        </h1>
        <p className="lead">
          An open-source Obsidian alternative you run yourself: a Markdown vault
          on your server, with an AI agent that files, links and retrieves your
          notes. It runs at <strong>mino.ink</strong> and on any Docker host you
          control.
        </p>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-16">
        <div className="info-card">
          <h2 className="mb-5 font-display text-xl font-bold">
            Mino in one paragraph
          </h2>
          <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Mino is an open-source Obsidian alternative. Your notes are plain
            Markdown files in a vault on a server you run, so Obsidian or any
            editor can open the same folder. An AI agent works inside it: filing
            what you import, tagging it, linking it, writing summaries and
            answering questions across the vault. The server carries the sync,
            through the mino.ink relay or your own tunnel, and every note
            operation is also an HTTP API and an MCP bridge. There is no Mino
            account and no central login.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-8">
        <div className="article">
          <h2>Facts, without the adjectives</h2>
        </div>
        <dl className="info-card divide-y divide-white/5">
          {FACTS.map(([term, value]) => (
            <div
              key={term}
              className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-6"
            >
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--purple-300)]">
                {term}
              </dt>
              <dd className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-8">
        <div className="article">
          <h2>What Mino is not</h2>
          <ul>
            <li>
              <strong>Not a cloud notes service.</strong> There is no Mino
              account, no Mino sync server holding your vault, and no login at
              mino.ink. You deploy the server and the client talks to it.
            </li>
            <li>
              <strong>Not a chat panel next to the editor.</strong> The agent
              works on the vault through the same HTTP API as the interface, on
              the server, whether a browser is open or not.
            </li>
            <li>
              <strong>Not the only product called Mino.</strong> Several
              unrelated tools share the name — an HR assistant, a web-automation
              agent, a running coach, and Xiaomi&apos;s MiMo model among them.
              This page, and everything at mino.ink, refers exclusively to the
              Markdown vault described above.
            </li>
            <li>
              <strong>Not affiliated with Obsidian.</strong> Mino reads the same
              vault format on purpose and stays readable in Obsidian. The plugin
              compatibility layer is in progress. This is an independent
              project.
            </li>
          </ul>

          <h2>Why it exists</h2>
          <p>
            Capture got solved; filing did not. Every notes app makes it easy to
            put something in and leaves the sorting to a future version of you
            that never arrives. Mino treats organization as the agent&apos;s job
            and leaves the files in a format that outlives the app — plain
            Markdown in a directory you can copy, search and read.
          </p>

          <h2>How to get it</h2>
          <p>
            The source, the compose file and the documentation are public.
            Clone the repository and run it today; the Android and iOS builds
            are still in development.{" "}
            <Link href="/waitlist">Join the list</Link> if you would rather hear
            when Mino launches, or read the <Link href="/docs">docs</Link>{" "}
            first.
          </p>

          <div className="cta-panel">
            <h2>Get one email when Mino launches</h2>
            <p>One email at launch, and nothing else. One click removes you.</p>
            <div className="mx-auto max-w-xl">
              <WaitlistForm idPrefix="about" />
            </div>
            <p className="mt-6 text-sm text-[var(--text-tertiary)]">
              <a
                href={REPO_URL}
                className="text-[var(--purple-300)] underline"
                target="_blank"
                rel="noreferrer"
              >
                Source code
              </a>{" "}
              · <Link href="/faq">FAQ</Link> · <Link href="/about">About</Link>
            </p>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
