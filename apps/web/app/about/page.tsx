import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { WaitlistForm } from "@/components/waitlist-form";
import { JsonLd } from "@/components/structured-data";
import { REPO_URL, breadcrumbSchema, pageMetadata } from "@/lib/seo";

const TITLE = "About — who builds Mino, and what it is";
const DESCRIPTION =
  "Mino (mino.ink) is an open-source, self-hosted Markdown notebook with an AI agent that files and retrieves your notes. Who builds it, what it runs on, and what it is not.";

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/about",
});

const FACTS: Array<[string, string]> = [
  ["Name", "Mino — also written Mino AI, or mino.ink"],
  ["Category", "Note-taking, knowledge management, agent-native tooling"],
  [
    "What it is",
    "A Markdown notebook with an AI agent that imports, files, links and retrieves notes",
  ],
  ["Where it runs", "Self-hosted: Docker or Portainer on a server you control"],
  [
    "Storage",
    "Markdown files with YAML front matter, plus a rebuildable SQLite index",
  ],
  [
    "AI",
    "Bring your own provider, model and API key; the agent is off until you configure one",
  ],
  ["Status", "Private beta — early access through the waitlist"],
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
          Mino is a <span className="gradient-text">notebook that files</span>.
        </h1>
        <p className="lead">
          An open-source, self-hosted Markdown notebook with an AI agent that
          imports, links and retrieves your notes. It runs at{" "}
          <strong>mino.ink</strong> and on any Docker host you control.
        </p>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-16">
        <div className="info-card">
          <h2 className="mb-5 font-display text-xl font-bold">
            Mino in one paragraph
          </h2>
          <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Mino is a note-taking application for people whose notes outgrew a
            folder tree. Notes are stored as plain Markdown files on a server
            you run; an AI agent watches the vault, converts imported material
            into Markdown, tags it, links it to related notes and answers
            questions across everything you have written. The same note
            operations are exposed over an HTTP API and an MCP bridge, so
            external agents can work with the same vault. It is open source and
            self-hosted, and it has no central account.
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
              <strong>Not a chatbot bolted onto an editor.</strong> The agent is
              part of the data model: it operates on the vault through the same
              API as the interface, on the server, whether a browser is open or
              not.
            </li>
            <li>
              <strong>Not the only product called Mino.</strong> Several
              unrelated tools share the name — an HR assistant, a web-automation
              agent, a running coach, and Xiaomi&apos;s MiMo model among them.
              This page, and everything at mino.ink, refers exclusively to the
              Markdown notebook described above.
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
            The source, the compose file and the documentation are public. Early
            access is the guided version: a walkthrough, the mobile builds, and
            answers from the person who wrote the server.{" "}
            <Link href="/waitlist">Join the waitlist</Link> or read the{" "}
            <Link href="/docs">docs</Link> first.
          </p>

          <div className="cta-panel">
            <h2>Get an invite when a seat opens</h2>
            <p>One email, no newsletter. Unsubscribe in one click.</p>
            <div className="waitlist mx-auto max-w-xl">
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
